const fs = require('fs');
const path = require('path');
const { supabase, supabaseConfigured, BUCKET, publicStorageUrl, storagePathFromUrl } = require('./supabase');

// When Supabase isn't configured (local dev), uploads fall back to disk under
// <DATA_DIR>/uploads so the site still works without any cloud credentials.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const UPLOADS_ROOT = path.join(DATA_DIR, 'uploads');

// Saves an uploaded file. Returns the value to store in the database:
//  - Supabase: the public https://...storage... URL
//  - local:    a "/uploads/<subdir>/<filename>" path served by express.static
async function saveUpload({ buffer, contentType, subdir, filename }) {
  if (supabaseConfigured) {
    const storagePath = `${subdir}/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return publicStorageUrl(storagePath);
  }

  const dir = path.join(UPLOADS_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

// Removes a previously stored file (accepts either a Supabase URL or a local
// "/uploads/..." path). Best-effort — errors are logged, never thrown.
async function deleteUpload(storedPath) {
  if (!storedPath) return;
  try {
    if (supabaseConfigured) {
      const storagePath = storagePathFromUrl(storedPath);
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
      return;
    }
    if (storedPath.startsWith('/uploads/')) {
      fs.unlink(path.join(UPLOADS_ROOT, storedPath.replace(/^\/uploads\//, '')), () => {});
    }
  } catch (err) {
    console.warn('⚠️  Could not delete uploaded file:', err.message);
  }
}

module.exports = { saveUpload, deleteUpload };
