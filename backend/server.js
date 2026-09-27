require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { ensureBucket } = require('./supabase');
const { saveUpload, deleteUpload } = require('./uploads');
const app = express();

// Behind Render's reverse proxy — makes req.ip the real client IP so the
// rate limiter keys buckets per user instead of per proxy.
app.set('trust proxy', 1);

// In production, set CORS_ORIGIN to your deployed frontend's URL
// (e.g. https://cysecsphere.vercel.app). Defaults to "*" for local dev.
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// ─── FILE UPLOADS ─────────────────────────────────────────────────────────
// Uploaded files (gallery photos, event covers, team photos, challenge files)
// are parsed into memory by multer, then stored in Supabase Storage (see
// uploads.js). The database stores the resulting public URL, so uploads
// survive restarts/redeploys. Without Supabase credentials (local dev), files
// fall back to disk under <DATA_DIR>/uploads, served at /uploads/....
const DATA_DIR = process.env.DATA_DIR || __dirname;
const UPLOADS_ROOT = path.join(DATA_DIR, 'uploads');
app.use('/uploads', express.static(UPLOADS_ROOT));

// Resolves a stored relative path (e.g. "/uploads/gallery/x.jpg") to an
// absolute path — only used for the local-disk fallback.
function uploadsPath(p) {
  return path.join(UPLOADS_ROOT, String(p).replace(/^\/?uploads\//, ''));
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const memoryStorage = multer.memoryStorage();

const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, GIF, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

// Challenge files can be any type (text, binary, PCAP, etc.) up to 10MB.
const challengeUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Wraps multer's single-file upload so errors (wrong type, too large, etc.)
// come back as a normal JSON error response instead of crashing the request.
function uploadGalleryPhoto(req, res, next) {
  imageUpload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Photo must be under 5MB.' });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
    }
    next();
  });
}

function uploadTeamPhoto(req, res, next) {
  imageUpload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Photo must be under 5MB.' });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
    }
    next();
  });
}

function uploadEventCover(req, res, next) {
  imageUpload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Cover photo must be under 5MB.' });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
    }
    next();
  });
}

function uploadChallengeFile(req, res, next) {
  challengeUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Challenge file must be under 10MB.' });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
    }
    next();
  });
}

// Names uploaded images with a safe extension.
function safeImageExt(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '';
}

// ⚠️ Set JWT_SECRET in your .env / hosting provider's env vars in production.
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set — using an insecure default. Set it in your .env file before deploying.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'cysecsphere-dev-secret-change-me';

// ⚠️ Set ADMIN_PASSWORD in your .env / hosting provider's env vars in production.
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD is not set — using an insecure default. Set it in your .env file before deploying.');
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CyberSphere@2025';

// Default to 5001 because macOS reserves port 5000 for AirPlay Receiver.
const PORT = process.env.PORT || 5001;

// Events are now stored in db.js and managed via admin CRUD endpoints.
// Seed data lives in db.js DEFAULT_DATA.events.

// ─── AUTH ──────────────────────────────────────────────────────────────────

// Middleware: attaches req.user if a valid token is present (does not block request)
function attachUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      req.user = decoded;
    } catch { /* invalid/expired token — treat as anonymous */ }
  }
  next();
}

// Middleware: runs the automatic weekly challenge reset. Fires on every
// request — once the week is current it's just a date comparison. If the
// server was down across a Monday boundary, the reset happens on the first
// request after boot (exactly once, restart-safe).
function weeklyReset(req, res, next) {
  try {
    const result = db.maybeRunWeeklyReset();
    if (result) console.log(`🔄 Weekly challenge reset for week of ${result.weekLabel} (cleared ${result.cleared}).`);
  } catch (err) {
    console.error('⚠️  Weekly reset failed:', err.message);
  }
  next();
}

app.use(attachUser);
app.use(weeklyReset);

// ─── SIMPLE RATE LIMITER (in-memory, no external dependency) ───────────────
// Fixed-window limiter keyed by IP. Protects auth and flag-submission
// endpoints from brute-force abuse. For multi-instance deployments swap in a
// shared store (e.g. Redis); a single Render instance is fine with this.
const rateBuckets = new Map();
function rateLimit({ windowMs = 60_000, max = 10, key = 'global' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = `${key}:${req.ip}`;
    const bucket = rateBuckets.get(bucketKey);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests. Slow down and try again shortly.' });
    }
    next();
  };
}
// Periodically purge expired buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of rateBuckets) if (now > b.resetAt) rateBuckets.delete(k);
}, 5 * 60_000).unref();

// Middleware: requires a valid token
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  next();
}

// Middleware: requires a valid admin token
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Admin access required.' });
  }
  next();
}

// Sign up for a CTF account
app.post('/api/auth/signup', rateLimit({ windowMs: 10 * 60_000, max: 20, key: 'signup' }), async (req, res) => {
  const { username, email, password, college } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  const exists = db.findUserByUsernameOrEmail(username, email);
  if (exists) {
    return res.status(409).json({ success: false, message: 'Username or email already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.createUser({ username, email, passwordHash, college });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, college: user.college } });
});

// Log in to an existing CTF account
app.post('/api/auth/login', rateLimit({ windowMs: 10 * 60_000, max: 20, key: 'login' }), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }
  const user = db.findUserByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, college: user.college } });
});

// Get current logged-in user (used to restore session on page load)
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, college: user.college } });
});

// Update own profile (requires logged-in CTF account)
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { username, email, college } = req.body;
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  // Check username uniqueness if changing
  if (username && username !== user.username) {
    const existing = db.findUserByUsername(username);
    if (existing) return res.status(409).json({ success: false, message: 'Username already taken.' });
  }
  // Check email uniqueness if changing
  if (email && email !== user.email) {
    const existing = db.findUserByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const updated = db.updateUser(req.user.id, {
    ...(username !== undefined && { username }),
    ...(email !== undefined && { email }),
    ...(college !== undefined && { college }),
  });

  const { passwordHash, ...safe } = updated;
  res.json({ success: true, user: safe });
});

// Change password (requires logged-in CTF account)
app.put('/api/auth/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.updatePasswordHash(req.user.id, passwordHash);
  res.json({ success: true, message: 'Password updated successfully.' });
});

// Admin login — the admin account lives in the database (seeded from
// ADMIN_EMAIL/ADMIN_PASSWORD env vars on first boot, see bootstrap below).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sawanyadav3010@gmail.com';
app.post('/api/admin/login', rateLimit({ windowMs: 10 * 60_000, max: 10, key: 'admin-login' }), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  const admin = db.findAdminByEmail(email);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }
  const token = jwt.sign({ role: 'admin', username: 'admin', email: admin.email }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token, email: admin.email });
});

// Change the admin password (requires an admin token — verifies the current
// password, then stores the new one in the database).
app.put('/api/admin/password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }
  const admin = db.findAdminByEmail(req.user.email);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin account not found.' });
  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.updateAdminPassword(admin.id, passwordHash);
  res.json({ success: true, message: 'Admin password updated successfully.' });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────

// Health check (used by hosting providers like Render/Railway to verify the service is up)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));



// Events
app.get('/api/events', (req, res) => {
  const events = db.getAllEvents();
  const { type } = req.query;
  if (type) return res.json(events.filter(e => e.type === type));
  res.json(events);
});

// Event photo gallery ("glimpses") — optionally filter by eventId
app.get('/api/gallery', (req, res) => {
  const { eventId } = req.query;
  const photos = eventId ? db.getGalleryPhotosByEvent(Number(eventId)) : db.getAllGalleryPhotos();
  const allEvents = db.getAllEvents();
  const withEventTitle = photos.map(p => ({
    ...p,
    eventTitle: allEvents.find(e => e.id === p.eventId)?.title || `Event #${p.eventId}`,
  }));
  res.json(withEventTitle);
});

// Challenges (flags excluded from public endpoint, includes fileUrl if available)
app.get('/api/challenges', (req, res) => {
  const challenges = db.getAllChallenges();
  const withCounts = challenges.map(c => ({
    id: c.id,
    title: c.title,
    category: c.category,
    points: c.points,
    difficulty: c.difficulty,
    description: c.description,
    hint: c.hint,
    fileUrl: c.fileUrl || null,
    ghost: c.ghost || false, // lets the UI show the Ghost Protocol launch button
    solved_count: db.getSolvedCount(c.id, c.solvedCount || 0),
  }));
  res.json(withCounts);
});

// Download a challenge file (by challenge id)
app.get('/api/challenges/:id/download', (req, res) => {
  const challenge = db.getChallengeById(Number(req.params.id));
  if (!challenge || !challenge.fileUrl) {
    return res.status(404).json({ success: false, message: 'No file available for this challenge.' });
  }
  // Files stored in Supabase Storage are served straight from their public URL
  if (/^https?:\/\//i.test(challenge.fileUrl)) {
    return res.redirect(challenge.fileUrl);
  }
  const filePath = uploadsPath(challenge.fileUrl);
  const resolved = path.resolve(filePath);
  const allowed = path.resolve(UPLOADS_ROOT);
  if (!resolved.startsWith(allowed)) {
    return res.status(403).json({ success: false, message: 'Invalid file path.' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found on server.' });
  }
  // Use the challenge title as the download filename, preserving extension
  const ext = path.extname(path.basename(filePath));
  const challengeTitle = challenge.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = challengeTitle + ext;
  res.download(filePath, filename);
});

// Leaderboard (all-time, derived from real signed-up users + their correct submissions)
app.get('/api/leaderboard', (req, res) => {
  const challenges = db.getAllChallenges();
  const pointsByChallengeId = Object.fromEntries(challenges.map(c => [c.id, c.points]));
  res.json(db.getLeaderboard(pointsByChallengeId));
});

// Weekly leaderboard (submissions from current week only)
app.get('/api/leaderboard/weekly', (req, res) => {
  const challenges = db.getAllChallenges();
  const pointsByChallengeId = Object.fromEntries(challenges.map(c => [c.id, c.points]));
  res.json(db.getWeeklyLeaderboard(pointsByChallengeId));
});

// Submit flag (requires a logged-in CTF account — flags read from db)
app.post('/api/submit-flag', rateLimit({ windowMs: 60_000, max: 30, key: 'flag' }), requireAuth, (req, res) => {
  // Normalize challengeId to a number to avoid strict-equality type mismatches
  const challengeId = Number(req.body.challengeId);
  const flag = req.body.flag;

  if (!challengeId || !flag) {
    return res.status(400).json({ success: false, message: 'Missing fields.' });
  }

  const challenge = db.getChallengeById(challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found.' });
  }

  if (db.hasAlreadySolved(req.user.username, challengeId)) {
    return res.json({ success: false, message: 'Already solved!' });
  }

  if (challenge.flag === flag.trim()) {
    db.addSubmission({ username: req.user.username, challengeId, correct: true });
    let message = `Correct! +${challenge.points} points!`;
    // Breaching the Ghost Protocol immortalizes the player in the Wall of Fame
    if (challenge.ghost) {
      db.addGhostCompletion({ alias: req.user.username });
      message += ' 👻 You breached the Ghost Protocol — immortalized in the Wall of Fame!';
    }
    return res.json({ success: true, message, points: challenge.points });
  }

  db.addSubmission({ username: req.user.username, challengeId, correct: false });
  res.json({ success: false, message: 'Wrong flag. Keep trying!' });
});

// Public user profile (no auth required — profiles are public)
app.get('/api/profile/:username', (req, res) => {
  const challenges = db.getAllChallenges();
  const pointsByChallengeId = Object.fromEntries(challenges.map(c => [c.id, c.points]));
  const profile = db.getUserProfile(req.params.username, pointsByChallengeId);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  res.json({ success: true, profile });
});

// Register for event
app.post('/api/events/register', (req, res) => {
  const { name, email, eventId } = req.body;
  if (!name || !email || !eventId) return res.status(400).json({ success: false });
  db.addEventRegistration({ name, email, eventId });
  res.json({ success: true, message: `Registered for event! Check ${email} for confirmation.` });
});

// Core team members (public)
app.get('/api/team', (req, res) => {
  res.json(db.getAllTeamMembers());
});

// Learning resources (public)
app.get('/api/resources', (req, res) => {
  res.json(db.getAllResources());
});

// Editable site content (public)
app.get('/api/site-content', (req, res) => {
  res.json(db.getSiteContent());
});

// Register as a club member
app.post('/api/members/register', (req, res) => {
  const { name, uid, email, department, year, contact } = req.body;
  if (!name || !uid || !email || !department || !year || !contact) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  const exists = db.findMemberByUidOrEmail(uid, email);
  if (exists) {
    return res.status(409).json({ success: false, message: 'This UID or email is already registered.' });
  }
  const member = db.addMember({ name, uid, email, department, year, contact });
  res.json({ success: true, message: `Welcome to Cysecsphere, ${member.name.split(' ')[0]}! We'll be in touch at ${member.email}.` });
});

// ─── ADMIN ──────────────────────────────────────────────────────────────────

// Summary counts for the admin dashboard (plus current week info)
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({
    members: db.getAllMembers().length,
    ctfUsers: db.getAllUsers().length,
    eventRegistrations: db.getAllEventRegistrations().length,
    correctSubmissions: db.getAllSubmissions().filter(s => s.correct).length,
    galleryPhotos: db.getAllGalleryPhotos().length,
    weeklyActivePlayers: db.getWeeklyActivePlayers(),
    events: db.getAllEvents().length,
    personalCtfs: (db.getAllPersonalCtfs ? db.getAllPersonalCtfs().length : 0),
    teamMembers: db.getAllTeamMembers().length,
    resources: db.getAllResources().length,
    blogPosts: db.getAllBlogPosts().length,
    week: db.getCurrentWeekInfo(),
  });
});

// Club membership registrations
app.get('/api/admin/members', requireAdmin, (req, res) => res.json(db.getAllMembers()));
app.put('/api/admin/members/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getAllMembers().find(m => m.id === id);
  if (!existing) return res.status(404).json({ success: false, message: 'Member not found.' });
  const { name, uid, email, department, year, contact } = req.body;
  const updated = db.updateMember(id, {
    ...(name !== undefined && { name }),
    ...(uid !== undefined && { uid }),
    ...(email !== undefined && { email }),
    ...(department !== undefined && { department }),
    ...(year !== undefined && { year }),
    ...(contact !== undefined && { contact }),
  });
  res.json({ success: true, member: updated });
});
app.delete('/api/admin/members/:id', requireAdmin, (req, res) => {
  const ok = db.deleteMember(Number(req.params.id));
  res.json({ success: ok });
});

// CTF accounts (passwords never included)
app.get('/api/admin/ctf-users', requireAdmin, (req, res) => {
  res.json(db.getAllUsers().map(({ passwordHash, ...safe }) => safe));
});
app.put('/api/admin/ctf-users/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getAllUsers().find(u => u.id === id);
  if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });
  const { username, email, college } = req.body;
  const updated = db.updateUser(id, {
    ...(username !== undefined && { username }),
    ...(email !== undefined && { email }),
    ...(college !== undefined && { college }),
  });
  // Never return password hash
  const { passwordHash, ...safe } = updated;
  res.json({ success: true, user: safe });
});
app.delete('/api/admin/ctf-users/:id', requireAdmin, (req, res) => {
  const ok = db.deleteUser(Number(req.params.id));
  res.json({ success: ok });
});

// Bulk delete endpoint (members, ctf-users, event-registrations)
app.post('/api/admin/bulk-delete', requireAdmin, (req, res) => {
  const { kind, ids } = req.body;
  if (!kind || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'kind and ids[] are required.' });
  }
  const deleters = {
    members: db.deleteMember,
    'ctf-users': db.deleteUser,
    'event-registrations': db.deleteEventRegistration,
  };
  const deleter = deleters[kind];
  if (!deleter) {
    return res.status(400).json({ success: false, message: `Unknown kind: "${kind}".` });
  }
  let deleted = 0;
  for (const id of ids) {
    if (deleter(Number(id))) deleted++;
  }
  res.json({ success: true, deleted, total: ids.length, message: `Deleted ${deleted} of ${ids.length} ${kind}.` });
});

// Event RSVPs
app.get('/api/admin/event-registrations', requireAdmin, (req, res) => {
  const allEvents = db.getAllEvents();
  const regs = db.getAllEventRegistrations().map(r => ({
    ...r,
    eventTitle: allEvents.find(e => e.id === r.eventId)?.title || `Event #${r.eventId}`,
  }));
  res.json(regs);
});
app.delete('/api/admin/event-registrations/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteEventRegistration(id);
  res.json({ success: ok, message: ok ? 'Registration deleted.' : 'Registration not found.' });
});

// Event photo gallery ("glimpses") — admin uploads a photo file for a specific event
app.post('/api/admin/gallery', requireAdmin, uploadGalleryPhoto, async (req, res) => {
  const { eventId, label, accent } = req.body;
  if (!eventId || !label || !req.file) {
    return res.status(400).json({ success: false, message: 'Event, label, and a photo file are required.' });
  }
  const event = db.getEventById(Number(eventId));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeImageExt(req.file.originalname)}`;
    const photo = await saveUpload({ buffer: req.file.buffer, contentType: req.file.mimetype, subdir: 'gallery', filename });
    const item = db.addGalleryPhoto({ eventId: Number(eventId), label, photo, accent });
    res.json({ success: true, item: { ...item, eventTitle: event.title } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const item = db.getGalleryPhotoById(id);
  const ok = db.deleteGalleryPhoto(id);
  if (ok && item && item.photo) await deleteUpload(item.photo); // best-effort cleanup
  res.json({ success: ok });
});

// ─── ADMIN: EVENT CRUD ──────────────────────────────────────────────────────

// List all events (with registration counts)
app.get('/api/admin/events', requireAdmin, (req, res) => {
  const events = db.getAllEvents();
  const regs = db.getAllEventRegistrations();
  const withRegCounts = events.map(e => ({
    ...e,
    registrations: regs.filter(r => r.eventId === e.id).length,
    photos: db.getGalleryPhotosByEvent(e.id).length,
  }));
  res.json(withRegCounts);
});

// Create a new event
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const { title, date, startTime, endTime, location, type, description, category, coverPhoto } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Event title is required.' });
  }
  const event = db.createEvent({ title, date, startTime, endTime, location, type, description, category, coverPhoto });
  res.json({ success: true, event });
});

// Update an existing event
app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getEventById(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Event not found.' });
  const { title, date, startTime, endTime, location, type, description, category, participants, coverPhoto } = req.body;
  const updated = db.updateEvent(id, {
    ...(title !== undefined && { title }),
    ...(date !== undefined && { date }),
    ...(startTime !== undefined && { startTime }),
    ...(endTime !== undefined && { endTime }),
    ...(location !== undefined && { location }),
    ...(type !== undefined && { type }),
    ...(description !== undefined && { description }),
    ...(category !== undefined && { category }),
    ...(participants !== undefined && { participants: parseInt(participants) }),
    ...(coverPhoto !== undefined && { coverPhoto }),
  });
  res.json({ success: true, event: updated });
});

// Upload a cover photo for an event (replaces any existing cover)
app.post('/api/admin/events/:id/cover', requireAdmin, uploadEventCover, async (req, res) => {
  const id = Number(req.params.id);
  const event = db.getEventById(id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo provided.' });
  try {
    if (event.coverPhoto) await deleteUpload(event.coverPhoto);
    const filename = `event-${id}-${Date.now()}${safeImageExt(req.file.originalname)}`;
    const coverPhoto = await saveUpload({ buffer: req.file.buffer, contentType: req.file.mimetype, subdir: 'event-covers', filename });
    db.updateEvent(id, { coverPhoto });
    res.json({ success: true, coverPhoto, message: 'Cover photo uploaded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove an event's cover photo
app.delete('/api/admin/events/:id/cover', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const event = db.getEventById(id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (event.coverPhoto) await deleteUpload(event.coverPhoto);
  db.updateEvent(id, { coverPhoto: null });
  res.json({ success: true, message: 'Cover photo removed.' });
});

// Delete an event
app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteEvent(id);
  res.json({ success: ok, message: ok ? 'Event deleted.' : 'Event not found.' });
});

// ─── ADMIN: CHALLENGE CRUD ──────────────────────────────────────────────────

// List all challenges (with flags — admin only)
app.get('/api/admin/challenges', requireAdmin, (req, res) => {
  const challenges = db.getAllChallenges();
  const withCounts = challenges.map(c => ({
    ...c,
    solved_count: db.getSolvedCount(c.id, c.solvedCount || 0),
  }));
  res.json(withCounts);
});

// Create a new challenge
app.post('/api/admin/challenges', requireAdmin, (req, res) => {
  const { title, category, points, difficulty, description, hint, flag } = req.body;
  if (!title || !flag) {
    return res.status(400).json({ success: false, message: 'Title and flag are required.' });
  }
  const challenge = db.createChallenge({ title, category, points, difficulty, description, hint, flag });
  res.json({ success: true, challenge });
});

// Update an existing challenge
app.put('/api/admin/challenges/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getChallengeById(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Challenge not found.' });
  // Only allow updating specific fields
  const { title, category, points, difficulty, description, hint, flag, solvedCount } = req.body;
  const updated = db.updateChallenge(id, {
    ...(title !== undefined && { title }),
    ...(category !== undefined && { category }),
    ...(points !== undefined && { points: parseInt(points) }),
    ...(difficulty !== undefined && { difficulty }),
    ...(description !== undefined && { description }),
    ...(hint !== undefined && { hint }),
    ...(flag !== undefined && { flag }),
    ...(solvedCount !== undefined && { solvedCount: parseInt(solvedCount) }),
  });
  res.json({ success: true, challenge: updated });
});

// Delete a challenge
app.delete('/api/admin/challenges/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const challenge = db.getChallengeById(id);
  if (challenge && challenge.permanent) {
    return res.status(400).json({ success: false, message: 'The Ghost Protocol challenge is permanent and cannot be deleted.' });
  }
  const ok = db.deleteChallenge(id);
  res.json({ success: ok, message: ok ? 'Challenge deleted.' : 'Challenge not found.' });
});

// Upload a file for a challenge (replaces any existing file)
app.post('/api/admin/challenges/:id/upload', requireAdmin, uploadChallengeFile, async (req, res) => {
  const id = Number(req.params.id);
  const challenge = db.getChallengeById(id);
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided.' });

  // Clean up the previous file, then store the new one
  try {
    if (challenge.fileUrl) await deleteUpload(challenge.fileUrl);
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const filename = `challenge-${id}-${Date.now()}${ext}`;
    const fileUrl = await saveUpload({ buffer: req.file.buffer, contentType: req.file.mimetype, subdir: 'challenges', filename });
    db.updateChallenge(id, { fileUrl });
    res.json({ success: true, fileUrl, filename: req.file.originalname, message: 'File uploaded successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a challenge's uploaded file (doesn't delete the challenge itself)
app.delete('/api/admin/challenges/:id/file', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const challenge = db.getChallengeById(id);
  if (!challenge || !challenge.fileUrl) {
    return res.status(404).json({ success: false, message: 'No file to delete for this challenge.' });
  }
  await deleteUpload(challenge.fileUrl);
  db.updateChallenge(id, { fileUrl: null });
  res.json({ success: true, message: 'Challenge file deleted.' });
});

// ─── WEEKLY CHALLENGE CYCLE ─────────────────────────────────────────────
// The archive feature has been removed. The board resets automatically every
// Monday at 00:00 (server time) — see maybeRunWeeklyReset() in db.js, which
// runs as middleware below. This endpoint only lets an admin start the new
// week early; nothing is archived, no data is lost.
app.post('/api/admin/challenges/reset-week', requireAdmin, (req, res) => {
  const result = db.runWeeklyReset();
  res.json({
    success: true,
    message: `Week reset — cleared ${result.cleared} challenge${result.cleared !== 1 ? 's' : ''}. The board is ready for the new week (permanent challenges stay up).`,
    week: db.getCurrentWeekInfo(),
  });
});

// ─── BLOG / ANNOUNCEMENTS ──────────────────────────────────────────────

// Public: list published blog posts
app.get('/api/blog', (req, res) => {
  const posts = db.getPublishedBlogPosts();
  const safe = posts.map(p => ({
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt,
    author: p.author, tags: p.tags, createdAt: p.createdAt,
  }));
  res.json(safe);
});

// Public: get single blog post by slug
app.get('/api/blog/:slug', (req, res) => {
  const post = db.getBlogPostBySlug(req.params.slug);
  if (!post || !post.published) {
    return res.status(404).json({ success: false, message: 'Post not found.' });
  }
  res.json(post);
});

// Admin: list all blog posts (including drafts)
app.get('/api/admin/blog', requireAdmin, (req, res) => {
  res.json(db.getAllBlogPosts());
});

// Admin: create blog post
app.post('/api/admin/blog', requireAdmin, (req, res) => {
  const { title, content, excerpt, author, tags, published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required.' });
  }
  const post = db.createBlogPost({ title, content, excerpt, author, tags });
  if (published) {
    db.updateBlogPost(post.id, { published: true });
    post.published = true;
  }
  res.json({ success: true, post });
});

// Admin: update blog post
app.put('/api/admin/blog/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getBlogPostById(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Post not found.' });
  const { title, content, excerpt, author, tags, published } = req.body;
  const updated = db.updateBlogPost(id, {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(excerpt !== undefined && { excerpt }),
    ...(author !== undefined && { author }),
    ...(tags !== undefined && { tags }),
    ...(published !== undefined && { published }),
  });
  res.json({ success: true, post: updated });
});

// Admin: delete blog post
app.delete('/api/admin/blog/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteBlogPost(id);
  res.json({ success: ok, message: ok ? 'Post deleted.' : 'Post not found.' });
});

// ─── ADMIN: TEAM MEMBERS ────────────────────────────────────────────────

app.get('/api/admin/team', requireAdmin, (req, res) => {
  res.json(db.getAllTeamMembers());
});

app.post('/api/admin/team', requireAdmin, (req, res) => {
  const { name, role, avatar, bio, social, section, linkedin, github, instagram, email } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Member name is required.' });
  }
  const member = db.createTeamMember({ name, role, avatar, bio, social, section, linkedin, github, instagram, email });
  res.json({ success: true, member });
});

app.put('/api/admin/team/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getTeamMemberById(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Member not found.' });
  const { name, role, avatar, bio, social, section, order, photo, linkedin, github, instagram, email } = req.body;
  const updated = db.updateTeamMember(id, {
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role }),
    ...(avatar !== undefined && { avatar }),
    ...(bio !== undefined && { bio }),
    ...(social !== undefined && { social }),
    ...(section !== undefined && { section }),
    ...(order !== undefined && { order: parseInt(order) }),
    ...(photo !== undefined && { photo }),
    ...(linkedin !== undefined && { linkedin }),
    ...(github !== undefined && { github }),
    ...(instagram !== undefined && { instagram }),
    ...(email !== undefined && { email }),
  });
  res.json({ success: true, member: updated });
});

app.delete('/api/admin/team/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const member = db.getTeamMemberById(id);
  if (member && member.photo) await deleteUpload(member.photo); // best-effort cleanup
  const ok = db.deleteTeamMember(id);
  res.json({ success: ok, message: ok ? 'Member deleted.' : 'Member not found.' });
});

// Upload / replace a team member's profile photo
app.post('/api/admin/team/:id/photo', requireAdmin, uploadTeamPhoto, async (req, res) => {
  const id = Number(req.params.id);
  const member = db.getTeamMemberById(id);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No photo provided.' });
  try {
    if (member.photo) await deleteUpload(member.photo);
    const filename = `team-${id}-${Date.now()}${safeImageExt(req.file.originalname)}`;
    const photo = await saveUpload({ buffer: req.file.buffer, contentType: req.file.mimetype, subdir: 'team', filename });
    const updated = db.updateTeamMember(id, { photo });
    res.json({ success: true, member: updated, message: 'Profile photo uploaded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove a team member's profile photo (falls back to the letter avatar)
app.delete('/api/admin/team/:id/photo', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const member = db.getTeamMemberById(id);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
  if (member.photo) await deleteUpload(member.photo);
  const updated = db.updateTeamMember(id, { photo: null });
  res.json({ success: true, member: updated, message: 'Profile photo removed.' });
});

// ─── ADMIN: SITE CONTENT ─────────────────────────────────────────────────

app.get('/api/admin/site-content', requireAdmin, (req, res) => {
  res.json(db.getSiteContent());
});

app.put('/api/admin/site-content', requireAdmin, (req, res) => {
  const { stats, features, about } = req.body;
  if (!stats && !features && !about) {
    return res.status(400).json({ success: false, message: 'Nothing to update.' });
  }
  const content = db.updateSiteContent({
    ...(stats !== undefined && { stats }),
    ...(features !== undefined && { features }),
    ...(about !== undefined && { about }),
  });
  res.json({ success: true, content });
});

// ─── ADMIN: RESOURCES ───────────────────────────────────────────────────

app.get('/api/admin/resources', requireAdmin, (req, res) => {
  res.json(db.getAllResources());
});

app.post('/api/admin/resources', requireAdmin, (req, res) => {
  const { category, title, desc, code, links } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Resource title is required.' });
  }
  const resource = db.createResource({ category, title, desc, code, links });
  res.json({ success: true, resource });
});

app.put('/api/admin/resources/:id', requireAdmin, (req, res) => {
  const existing = db.getResourceById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Resource not found.' });
  const { category, title, desc, code, links } = req.body;
  const updated = db.updateResource(req.params.id, {
    ...(category !== undefined && { category }),
    ...(title !== undefined && { title }),
    ...(desc !== undefined && { desc }),
    ...(code !== undefined && { code }),
    ...(links !== undefined && { links }),
  });
  res.json({ success: true, resource: updated });
});

app.delete('/api/admin/resources/:id', requireAdmin, (req, res) => {
  const ok = db.deleteResource(req.params.id);
  res.json({ success: ok, message: ok ? 'Resource deleted.' : 'Resource not found.' });
});

// ─── PERSONAL CTFs ─────────────────────────────────────────────────────

// Public: list personal CTFs (without exposing passwords)
app.get('/api/personal-ctf', (req, res) => {
  const all = db.getAllPersonalCtfs();
  const safe = all.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    accessId: p.accessId,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    createdBy: p.createdBy,
    challengeCount: (p.challenges || []).length,
    participantCount: (p.participants || []).length,
    status: p.status,
    createdAt: p.createdAt,
  }));
  res.json(safe);
});

// Join a personal CTF with accessId + accessPassword
app.post('/api/personal-ctf/join', rateLimit({ windowMs: 60_000, max: 15, key: 'pctf-join' }), requireAuth, (req, res) => {
  const { accessId, accessPassword } = req.body;
  if (!accessId || !accessPassword) {
    return res.status(400).json({ success: false, message: 'Access ID and password are required.' });
  }

  const ctf = db.findPersonalCtfByAccessId(accessId);
  if (!ctf) {
    return res.status(404).json({ success: false, message: 'Personal CTF not found with that Access ID.' });
  }

  if (ctf.accessPassword !== accessPassword) {
    return res.status(401).json({ success: false, message: 'Incorrect access password.' });
  }

  // Check time window
  const now = new Date();
  if (now < new Date(ctf.startsAt)) {
    return res.status(403).json({ success: false, message: 'This CTF has not started yet.' });
  }
  if (now > new Date(ctf.endsAt)) {
    return res.status(403).json({ success: false, message: 'This CTF has already ended.' });
  }

  const result = db.joinPersonalCtf(ctf.id, req.user.id, req.user.username);
  if (result.success) {
    res.json({ success: true, message: result.message, ctfId: ctf.id });
  } else {
    res.json(result);
  }
});

// Get a personal CTF's challenges (must be a participant)
app.get('/api/personal-ctf/:id', requireAuth, (req, res) => {
  const ctfId = Number(req.params.id);
  const ctf = db.getPersonalCtfById(ctfId);
  if (!ctf) return res.status(404).json({ success: false, message: 'Personal CTF not found.' });

  // Check if user is a participant
  const isParticipant = ctf.participants.some(p => p.userId === req.user.id);
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: 'You have not joined this CTF.' });
  }

  // Return challenges without flags (flags are checked on submission)
  const safeChallenges = (ctf.challenges || []).map((ch, idx) => ({
    index: idx,
    title: ch.title,
    category: ch.category,
    points: ch.points,
    difficulty: ch.difficulty,
    description: ch.description,
    hint: ch.hint,
    solved: db.hasSolvedPersonalCtfChallenge(ctfId, req.user.username, idx),
  }));

  const now = new Date();
  const isActive = now >= new Date(ctf.startsAt) && now <= new Date(ctf.endsAt);

  res.json({
    id: ctf.id,
    title: ctf.title,
    description: ctf.description,
    challenges: safeChallenges,
    participantCount: ctf.participants.length,
    startsAt: ctf.startsAt,
    endsAt: ctf.endsAt,
    isActive,
    isEnded: now > new Date(ctf.endsAt),
  });
});

// Submit flag for a challenge in a personal CTF
app.post('/api/personal-ctf/:id/submit-flag', requireAuth, (req, res) => {
  const ctfId = Number(req.params.id);
  const ctf = db.getPersonalCtfById(ctfId);
  if (!ctf) return res.status(404).json({ success: false, message: 'Personal CTF not found.' });

  // Check participation
  if (!ctf.participants.some(p => p.userId === req.user.id)) {
    return res.status(403).json({ success: false, message: 'You have not joined this CTF.' });
  }

  // Check time window
  const now = new Date();
  if (now < new Date(ctf.startsAt)) {
    return res.status(403).json({ success: false, message: 'This CTF has not started yet.' });
  }
  if (now > new Date(ctf.endsAt)) {
    return res.status(403).json({ success: false, message: 'This CTF has ended.' });
  }

  const challengeIdx = Number(req.body.challengeIdx);
  const flag = req.body.flag;

  if (challengeIdx === undefined || challengeIdx === null || !flag) {
    return res.status(400).json({ success: false, message: 'challengeIdx and flag are required.' });
  }

  const challenge = (ctf.challenges || [])[challengeIdx];
  if (!challenge) {
    return res.status(404).json({ success: false, message: 'Challenge not found.' });
  }

  if (db.hasSolvedPersonalCtfChallenge(ctfId, req.user.username, challengeIdx)) {
    return res.json({ success: false, message: 'Already solved!' });
  }

  if (challenge.flag === flag.trim()) {
    db.addPersonalCtfSubmission(ctfId, req.user.username, challengeIdx, true, challenge.points);
    return res.json({ success: true, message: `Correct! +${challenge.points} points!`, points: challenge.points });
  }

  db.addPersonalCtfSubmission(ctfId, req.user.username, challengeIdx, false, 0);
  res.json({ success: false, message: 'Wrong flag. Keep trying!' });
});

// Get leaderboard for a personal CTF
app.get('/api/personal-ctf/:id/leaderboard', requireAuth, (req, res) => {
  const ctfId = Number(req.params.id);
  const ctf = db.getPersonalCtfById(ctfId);
  if (!ctf) return res.status(404).json({ success: false, message: 'Personal CTF not found.' });

  const leaderboard = db.getPersonalCtfLeaderboard(ctfId);
  res.json(leaderboard);
});

// Admin: list all personal CTFs (with passwords)
app.get('/api/admin/personal-ctf', requireAdmin, (req, res) => {
  const all = db.getAllPersonalCtfs();
  res.json(all.map(p => ({
    ...p,
    challengeCount: (p.challenges || []).length,
    participantCount: (p.participants || []).length,
  })));
});

// Admin: create a personal CTF
app.post('/api/admin/personal-ctf', requireAdmin, (req, res) => {
  const { title, description, accessId, accessPassword, startsAt, endsAt, challenges } = req.body;
  if (!title || !startsAt || !endsAt) {
    return res.status(400).json({ success: false, message: 'Title, start time, and end time are required.' });
  }
  const ctf = db.createPersonalCtf({
    title, description, accessId, accessPassword, startsAt, endsAt, challenges,
    createdBy: req.user.username || 'admin',
  });
  const { accessPassword: pw, ...safe } = ctf;
  res.json({ success: true, personalCtf: safe });
});

// Admin: update a personal CTF
app.put('/api/admin/personal-ctf/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getPersonalCtfById(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Personal CTF not found.' });

  const { title, description, accessId, accessPassword, startsAt, endsAt, challenges } = req.body;
  const updated = db.updatePersonalCtf(id, {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(accessId !== undefined && { accessId }),
    ...(accessPassword !== undefined && { accessPassword }),
    ...(startsAt !== undefined && { startsAt }),
    ...(endsAt !== undefined && { endsAt }),
    ...(challenges !== undefined && { challenges }),
  });
  const { accessPassword: pw, ...safe } = updated;
  res.json({ success: true, personalCtf: safe });
});

// Admin: delete a personal CTF
app.delete('/api/admin/personal-ctf/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deletePersonalCtf(id);
  res.json({ success: ok, message: ok ? 'Personal CTF deleted.' : 'Personal CTF not found.' });
});

// ─── EASTER EGG: GHOST PROTOCOL ──────────────────────────────────────────
// Hidden endpoint requiring a specific header found through the easter egg hunt.
// The header value is base64('CSPHERE{gh0st_1n_th3_sh3ll}')
const GHOST_HEADER = 'x-ghost-protocol';
const GHOST_TOKEN = 'CSPHERE{gh0st_1n_th3_sh3ll}';
const HACKED_KEY = '47d3e8a1c9f2b4d6';

app.get('/api/ghost-key', (req, res) => {
  const protocol = req.headers[GHOST_HEADER];
  if (!protocol) {
    return res.status(401).json({
      success: false,
      message: 'Ghost Protocol requires authentication.',
      hint: 'Check the page source of /ghost-protocol for the required header.',
    });
  }
  if (protocol !== GHOST_TOKEN) {
    return res.status(403).json({ success: false, message: 'Invalid Ghost Protocol token.' });
  }
  res.json({
    success: true,
    key: HACKED_KEY,
    message: 'Ghost Protocol verified. Proceed to /hacked/' + HACKED_KEY,
  });
});

// Record a Ghost Protocol completion (public endpoint, no auth needed for fun)
app.post('/api/ghost-complete', (req, res) => {
  const { key, alias } = req.body;
  if (key !== HACKED_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid key. Complete the Ghost Protocol first.' });
  }
  const entry = db.addGhostCompletion({ alias: alias || 'Anonymous Ghost' });
  res.json({ success: true, message: 'Welcome to the Wall of Fame, ghost!', entry });
});

// Get all Ghost Protocol completions (public)
app.get('/api/ghost-completions', (req, res) => {
  const completions = db.getAllGhostCompletions();
  res.json({ success: true, count: db.getGhostCompletionCount(), completions });
});

// ─── BOOTSTRAP ─────────────────────────────────────────────────────────────
// Load the dataset from Supabase (auto-creating and seeding the table on first
// boot), make sure the storage bucket exists, then start serving. Everything
// must be ready before requests arrive so the in-memory cache is populated.
(async () => {
  try {
    await db.init();
    await ensureBucket();
    db.ensureEventCoverPhotos();
    db.ensureGhostChallenge();
    // One-time migration from the removed archive feature: put any archived
    // challenges back on the regular board, then delete the archive store.
    const restored = db.restoreArchivedChallenges();
    if (restored.restored > 0) console.log(`♻️  Restored ${restored.restored} archived challenge(s) to the regular board.`);
    // Run the automatic weekly rollover if the calendar week changed while down.
    const reset = db.maybeRunWeeklyReset();
    if (reset) console.log(`🔄 Weekly challenge rollover applied for week of ${reset.weekLabel} (cleared ${reset.cleared}).`);
    // Seed the initial admin account from env vars on first boot — afterwards
    // the admin account is managed entirely through the database.
    if (db.getAllAdmins().length === 0) {
      await db.createAdmin({ email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) });
      console.log('🌱 Seeded initial admin account from env vars.');
    }
    app.listen(PORT, () => console.log(`🔐 Cysecsphere API running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
