import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API, resolveMediaUrl } from '../config';
import { useToast } from '../components/Toast';
import TeamManager from '../components/admin/TeamManager';
import ResourcesManager from '../components/admin/ResourcesManager';
import ContentManager from '../components/admin/ContentManager';

const ADMIN_TOKEN_KEY = 'cysecsphere_admin_token';

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const ACCENT_OPTIONS = ['#00F5FF', '#39FF14', '#7C3AED', '#FFD60A', '#FF2D55'];

const CATEGORIES = ['Cryptography', 'Reverse Engineering', 'Web Security', 'Network Forensics', 'Pwn', 'Forensics', 'OSINT', 'Misc'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Insane'];

const COLORS = {
  members: '#7C3AED',
  'ctf-users': '#00F5FF',
  'event-registrations': '#39FF14',
  gallery: '#FFD60A',
  challenges: '#FF2D55',
};

const TABS = [
  { key: 'members', label: 'Members', color: '#7C3AED' },
  { key: 'ctf-users', label: 'CTF Accounts', color: '#00F5FF' },
  { key: 'events', label: 'Events', color: '#FF8C00' },
  { key: 'event-registrations', label: 'Event RSVPs', color: '#39FF14' },
  { key: 'challenges', label: 'Challenges', color: '#FF2D55' },
  { key: 'leaderboard', label: 'Leaderboard', color: '#FFD60A' },
  { key: 'blog', label: 'Blog', color: '#8B5CF6' },
  { key: 'gallery', label: 'Gallery', color: '#FFD60A' },
  { key: 'personal-ctf', label: 'Personal CTFs', color: '#FF6B6B' },
  { key: 'team', label: 'Team', color: '#FFD60A' },
  { key: 'resources', label: 'Resources', color: '#39FF14' },
  { key: 'content', label: 'Site Content', color: '#7C3AED' },
];

// Map of tab keys to their count source (stats field name) when the tab's
// data isn't stored in the `data` state object.
const STAT_KEY_BY_TAB = { team: 'teamMembers', resources: 'resources' };

const tabCount = (t, data, stats, liveCounts) => {
  if (data[t.key] && Array.isArray(data[t.key])) return data[t.key].length;
  if (liveCounts[t.key] !== undefined) return liveCounts[t.key];
  const statKey = STAT_KEY_BY_TAB[t.key];
  if (statKey && stats) return stats[statKey] || 0;
  return 0;
};

const BADGE_COLORS = {
  'Elite Hacker': '#FFD60A',
  'Master': '#FF2D55',
  'Expert': '#00F5FF',
  'Advanced': '#7C3AED',
  'Intermediate': '#39FF14',
  'Rookie': '#6B7280',
};

export default function Admin() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));

  // Redirect to /admin/login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [token, navigate]);

  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('members');
  const [data, setData] = useState({ members: [], 'ctf-users': [], events: [], 'event-registrations': [], gallery: [], challenges: [], leaderboard: [], blog: [], 'personal-ctf': [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [liveCounts, setLiveCounts] = useState({});

  // Challenge form state
  const [challengeForm, setChallengeForm] = useState({
    title: '', category: 'Misc', points: 100, difficulty: 'Medium',
    description: '', hint: '', flag: '',
  });
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [challengeFile, setChallengeFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [challengeUploadError, setChallengeUploadError] = useState('');
  const [challengeFileInputKey, setChallengeFileInputKey] = useState(0);

  // Archive / Reset Week state
  const [archives, setArchives] = useState([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  // Event form state
  const [eventForm, setEventForm] = useState({ title: '', date: '', startTime: '', endTime: '', location: '', type: 'upcoming', description: '', category: 'Workshop' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFormError, setEventFormError] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventCoverFile, setEventCoverFile] = useState(null);
  const [eventCoverPreview, setEventCoverPreview] = useState(null);
  const [eventCoverKey, setEventCoverKey] = useState(0);

  // Blog form state
  const [blogForm, setBlogForm] = useState({ title: '', content: '', author: 'Admin', tags: '', published: false });
  const [editingBlog, setEditingBlog] = useState(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogError, setBlogError] = useState('');
  const [savingBlog, setSavingBlog] = useState(false);

  // Member edit state
  const [memberForm, setMemberForm] = useState({ name: '', uid: '', email: '', department: '', year: '', contact: '' });
  const [editingMember, setEditingMember] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberFormError, setMemberFormError] = useState('');
  const [savingMember, setSavingMember] = useState(false);

  // CTF user edit state
  const [userForm, setUserForm] = useState({ username: '', email: '', college: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Photo form state
  const [photoForm, setPhotoForm] = useState({ eventId: '', label: '', file: null, accent: ACCENT_OPTIONS[0] });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Personal CTF form state
  const [pctfForm, setPctfForm] = useState({
    title: '', description: '', accessId: '', accessPassword: '',
    startsAt: '', endsAt: '', challenges: [],
  });
  const [editingPctf, setEditingPctf] = useState(null);
  const [showPctfForm, setShowPctfForm] = useState(false);
  const [pctfFormError, setPctfFormError] = useState('');
  const [savingPctf, setSavingPctf] = useState(false);
  const [globalChallenges, setGlobalChallenges] = useState([]);
  const [selectedGlobalIds, setSelectedGlobalIds] = useState([]);
  const [customChallenge, setCustomChallenge] = useState({ title: '', category: 'Misc', points: 100, difficulty: 'Medium', description: '', hint: '', flag: '' });
  const [customChallenges, setCustomChallenges] = useState([]);

  const toast = useToast();
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    navigate('/admin/login');
  };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, membersRes, ctfRes, eventsRes, eventRegsRes, galleryRes, challengesRes, leaderboardRes, blogRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats`, authHeader),
        axios.get(`${API}/api/admin/members`, authHeader),
        axios.get(`${API}/api/admin/ctf-users`, authHeader),
        axios.get(`${API}/api/admin/events`, authHeader),
        axios.get(`${API}/api/admin/event-registrations`, authHeader),
        axios.get(`${API}/api/gallery`),
        axios.get(`${API}/api/admin/challenges`, authHeader),
        axios.get(`${API}/api/leaderboard`),
        axios.get(`${API}/api/admin/blog`, authHeader),
      ]);
      setStats(statsRes.data);
      // Fetch personal CTFs
      let pctfData = [];
      try {
        const pctfRes = await axios.get(`${API}/api/admin/personal-ctf`, authHeader);
        pctfData = pctfRes.data || [];
      } catch {}

      setData({
        members: membersRes.data,
        'ctf-users': ctfRes.data,
        events: eventsRes.data,
        'event-registrations': eventRegsRes.data,
        gallery: galleryRes.data,
        challenges: challengesRes.data,
        leaderboard: leaderboardRes.data,
        blog: blogRes.data || [],
        'personal-ctf': pctfData,
      });
      setEvents(eventsRes.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) {
      const id = window.setTimeout(() => void fetchAll(), 0);
      return () => window.clearTimeout(id);
    }
  }, [fetchAll, token]);

  // ─── DELETE HANDLERS ──────────────────────────────────────────────────────

  const handleDelete = async (kind, id) => {
    if (!window.confirm('Remove this entry? This cannot be undone.')) return;
    const endpointMap = { members: 'members', 'ctf-users': 'ctf-users', 'event-registrations': 'event-registrations' };
    const endpoint = endpointMap[kind];
    if (!endpoint) return;
    try {
      await axios.delete(`${API}/api/admin/${endpoint}/${id}`, authHeader);
      toast.success('Deleted successfully.');
      setSelectedIds([]);
      fetchAll();
    } catch {
      toast.error('Failed to delete. Try again.');
    }
  };

  // ─── BULK DELETE ────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected ${tab}? This cannot be undone.`)) return;
    setDeletingBulk(true);
    try {
      const res = await axios.post(`${API}/api/admin/bulk-delete`, { kind: tab, ids: selectedIds }, authHeader);
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        fetchAll();
      } else {
        toast.error(res.data.message || 'Bulk delete failed.');
      }
    } catch {
      toast.error('Bulk delete failed. Try again.');
    }
    setDeletingBulk(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tabRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tabRows.map(r => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─── CHALLENGE CRUD ──────────────────────────────────────────────────────

  const openNewChallengeForm = () => {
    setEditingChallenge(null);
    setChallengeForm({ title: '', category: 'Misc', points: 100, difficulty: 'Medium', description: '', hint: '', flag: '' });
    setChallengeFile(null);
    setChallengeUploadError('');
    setChallengeFileInputKey(k => k + 1);
    setShowChallengeForm(true);
    setChallengeError('');
  };

  const openEditChallengeForm = (ch) => {
    setEditingChallenge(ch);
    setChallengeForm({
      title: ch.title,
      category: ch.category,
      points: ch.points,
      difficulty: ch.difficulty,
      description: ch.description || '',
      hint: ch.hint || '',
      flag: ch.flag || '',
    });
    setChallengeFile(null);
    setChallengeUploadError('');
    setChallengeFileInputKey(k => k + 1);
    setShowChallengeForm(true);
    setChallengeError('');
  };

  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    setChallengeError('');
    setChallengeUploadError('');
    if (!challengeForm.title || !challengeForm.flag) {
      setChallengeError('Title and flag are required.');
      return;
    }
    setSavingChallenge(true);
    try {
      let challengeId;
      let savedChallenge;
      if (editingChallenge) {
        await axios.put(`${API}/api/admin/challenges/${editingChallenge.id}`, challengeForm, authHeader);
        challengeId = editingChallenge.id;
        savedChallenge = editingChallenge;
      } else {
        const res = await axios.post(`${API}/api/admin/challenges`, challengeForm, authHeader);
        challengeId = res.data.challenge.id;
        savedChallenge = res.data.challenge;
        // Store the created challenge so re-submit after failed upload does PUT not POST
        setEditingChallenge(savedChallenge);
      }

      // Upload file if one was selected
      if (challengeFile) {
        setUploadingFile(true);
        const body = new FormData();
        body.append('file', challengeFile);
        await axios.post(`${API}/api/admin/challenges/${challengeId}/upload`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUploadingFile(false);
      }

      setChallengeFile(null);
      setChallengeFileInputKey(k => k + 1);
      setShowChallengeForm(false);
      setEditingChallenge(null);
      fetchAll();
    } catch (err) {
      setChallengeError(err.response?.data?.message || 'Failed to save challenge.');
    }
    setSavingChallenge(false);
    setUploadingFile(false);
  };

  const handleDeleteChallenge = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/challenges/${id}`, authHeader);
      fetchAll();
    } catch {
      toast.error('Failed to delete challenge.');
    }
  };

  // ─── CHALLENGE FILE UPLOAD ────────────────────────────────────────────

  const handleChallengeFileChange = (e) => {
    setChallengeFile(e.target.files?.[0] || null);
  };

  const handleRemoveChallengeFile = async (id) => {
    if (!window.confirm('Remove the uploaded file from this challenge?')) return;
    try {
      await axios.delete(`${API}/api/admin/challenges/${id}/file`, authHeader);
      setChallengeUploadError('');
      fetchAll();
    } catch (err) {
      setChallengeUploadError(err.response?.data?.message || 'Failed to remove file.');
    }
  };

  // ─── CHALLENGE RESET / ARCHIVE ────────────────────────────────────────

  const handleResetWeek = async () => {
    if (!window.confirm(
      '⚠️ ARCHIVE ALL CHALLENGES & RESET WEEK\n\n' +
      'This will move ALL current challenges to the archive and clear the board.\n' +
      'You can view archived challenges later.\n\n' +
      'Proceed?'
    )) return;
    setArchiving(true);
    setArchiveError('');
    try {
      const res = await axios.post(`${API}/api/admin/challenges/reset`, {}, authHeader);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAll();
      } else {
        setArchiveError(res.data.message || 'Archive failed.');
      }
    } catch (err) {
      setArchiveError(err.response?.data?.message || 'Failed to reset week.');
    }
    setArchiving(false);
  };

  const openArchiveModal = async () => {
    setShowArchiveModal(true);
    try {
      const res = await axios.get(`${API}/api/admin/challenges/archive`, authHeader);
      setArchives(res.data || []);
    } catch {
      setArchives([]);
    }
  };

  // ─── EVENT CRUD ──────────────────────────────────────────────────────────

  const openNewEventForm = () => {
    setEditingEvent(null);
    const today = new Date().toISOString().split('T')[0];
    setEventForm({ title: '', date: today, startTime: '', endTime: '', location: '', type: 'upcoming', description: '', category: 'Workshop' });
    setEventCoverFile(null);
    setEventCoverPreview(null);
    setEventCoverKey(k => k + 1);
    setShowEventForm(true);
    setEventFormError('');
  };

  const openEditEventForm = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      date: ev.date || '',
      startTime: ev.startTime || '',
      endTime: ev.endTime || '',
      location: ev.location || '',
      type: ev.type || 'upcoming',
      description: ev.description || '',
      category: ev.category || 'Workshop',
    });
    setEventCoverFile(null);
    setEventCoverPreview(null);
    setEventCoverKey(k => k + 1);
    setShowEventForm(true);
    setEventFormError('');
  };

  const handleEventCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    setEventCoverFile(file);
    setEventCoverPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleRemoveEventCover = async () => {
    if (editingEvent && editingEvent.coverPhoto) {
      if (!window.confirm('Remove this event cover photo?')) return;
      try {
        await axios.delete(`${API}/api/admin/events/${editingEvent.id}/cover`, authHeader);
        toast.success('Cover photo removed.');
        setEventCoverFile(null);
        setEventCoverPreview(null);
        fetchAll();
        return;
      } catch {
        toast.error('Failed to remove cover photo.');
        return;
      }
    }
    setEventCoverFile(null);
    setEventCoverPreview(null);
    setEventCoverKey(k => k + 1);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventFormError('');
    if (!eventForm.title) {
      setEventFormError('Event title is required.');
      return;
    }
    setSavingEvent(true);
    try {
      let eventId;
      if (editingEvent) {
        eventId = editingEvent.id;
        await axios.put(`${API}/api/admin/events/${editingEvent.id}`, eventForm, authHeader);
      } else {
        const res = await axios.post(`${API}/api/admin/events`, eventForm, authHeader);
        eventId = res.data.event.id;
      }

      // Upload cover photo if one was selected
      if (eventCoverFile && eventId) {
        const body = new FormData();
        body.append('photo', eventCoverFile);
        await axios.post(`${API}/api/admin/events/${eventId}/cover`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (eventCoverPreview) URL.revokeObjectURL(eventCoverPreview);
      setEventCoverFile(null);
      setEventCoverPreview(null);
      setEventCoverKey(k => k + 1);
      setShowEventForm(false);
      setEditingEvent(null);
      fetchAll();
    } catch (err) {
      setEventFormError(err.response?.data?.message || 'Failed to save event.');
    }
    setSavingEvent(false);
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/events/${id}`, authHeader);
      fetchAll();
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  // ─── PHOTO GALLERY ──────────────────────────────────────────────────────

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoForm(f => ({ ...f, file }));
    setPhotoPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setPhotoError('');
    if (!photoForm.eventId || !photoForm.label || !photoForm.file) {
      setPhotoError('Event, label, and a photo file are required.');
      return;
    }
    setAddingPhoto(true);
    try {
      const body = new FormData();
      body.append('eventId', photoForm.eventId);
      body.append('label', photoForm.label);
      body.append('accent', photoForm.accent);
      body.append('photo', photoForm.file);
      await axios.post(`${API}/api/admin/gallery`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhotoForm({ eventId: '', label: '', file: null, accent: ACCENT_OPTIONS[0] });
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setFileInputKey(k => k + 1);
      fetchAll();
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Failed to upload photo. Try again.');
    }
    setAddingPhoto(false);
  };

  // ─── BLOG CRUD ─────────────────────────────────────────────────────────

  const openNewBlogForm = () => {
    setEditingBlog(null);
    setBlogForm({ title: '', content: '', author: 'Admin', tags: '', published: false });
    setShowBlogForm(true);
    setBlogError('');
  };

  const openEditBlogForm = (post) => {
    setEditingBlog(post);
    setBlogForm({
      title: post.title,
      content: post.content || '',
      author: post.author || 'Admin',
      tags: (post.tags || []).join(', '),
      published: post.published || false,
    });
    setShowBlogForm(true);
    setBlogError('');
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    setBlogError('');
    if (!blogForm.title || !blogForm.content) {
      setBlogError('Title and content are required.');
      return;
    }
    setSavingBlog(true);
    try {
      const payload = {
        title: blogForm.title,
        content: blogForm.content,
        author: blogForm.author || 'Admin',
        tags: blogForm.tags ? blogForm.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
        published: blogForm.published,
      };
      if (editingBlog) {
        await axios.put(`${API}/api/admin/blog/${editingBlog.id}`, payload, authHeader);
        toast.success('Post updated.');
      } else {
        await axios.post(`${API}/api/admin/blog`, payload, authHeader);
        toast.success('Post created.');
      }
      setShowBlogForm(false);
      setEditingBlog(null);
      fetchAll();
    } catch (err) {
      setBlogError(err.response?.data?.message || 'Failed to save post.');
    }
    setSavingBlog(false);
  };

  const handleDeleteBlog = async (id, title) => {
    if (!window.confirm(`Delete post "${title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/blog/${id}`, authHeader);
      toast.success('Post deleted.');
      fetchAll();
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  const handleToggleBlogPublish = async (post) => {
    try {
      await axios.put(`${API}/api/admin/blog/${post.id}`, { published: !post.published }, authHeader);
      toast.success(post.published ? 'Post unpublished.' : 'Post published.');
      fetchAll();
    } catch {
      toast.error('Failed to toggle publish status.');
    }
  };

  // ─── MEMBER EDIT ───────────────────────────────────────────────────────

  const openEditMemberForm = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name || '',
      uid: member.uid || '',
      email: member.email || '',
      department: member.department || '',
      year: member.year || '',
      contact: member.contact || '',
    });
    setShowMemberForm(true);
    setMemberFormError('');
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setMemberFormError('');
    if (!memberForm.name || !memberForm.email) {
      setMemberFormError('Name and email are required.');
      return;
    }
    setSavingMember(true);
    try {
      await axios.put(`${API}/api/admin/members/${editingMember.id}`, memberForm, authHeader);
      toast.success('Member updated.');
      setShowMemberForm(false);
      setEditingMember(null);
      fetchAll();
    } catch (err) {
      setMemberFormError(err.response?.data?.message || 'Failed to update member.');
    }
    setSavingMember(false);
  };

  // ─── CTF USER EDIT ─────────────────────────────────────────────────────

  const openEditUserForm = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      college: user.college || '',
    });
    setShowUserForm(true);
    setUserFormError('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserFormError('');
    if (!userForm.username || !userForm.email) {
      setUserFormError('Username and email are required.');
      return;
    }
    setSavingUser(true);
    try {
      await axios.put(`${API}/api/admin/ctf-users/${editingUser.id}`, userForm, authHeader);
      toast.success('User updated.');
      setShowUserForm(false);
      setEditingUser(null);
      fetchAll();
    } catch (err) {
      setUserFormError(err.response?.data?.message || 'Failed to update user.');
    }
    setSavingUser(false);
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Remove this photo from the gallery?')) return;
    try {
      await axios.delete(`${API}/api/admin/gallery/${id}`, authHeader);
      fetchAll();
    } catch {
      toast.error('Failed to delete photo. Try again.');
    }
  };

  // ─── PERSONAL CTF CRUD ─────────────────────────────────────────────────────

  const openNewPctfForm = async () => {
    setEditingPctf(null);
    const now = new Date();
    const later = new Date(now.getTime() + 7200000); // +2h
    const fmt = (d) => d.toISOString().slice(0, 16);
    setPctfForm({
      title: '', description: '', accessId: '', accessPassword: '',
      startsAt: fmt(now), endsAt: fmt(later), challenges: [],
    });
    setCustomChallenge({ title: '', category: 'Misc', points: 100, difficulty: 'Medium', description: '', hint: '', flag: '' });
    setSelectedGlobalIds([]);
    setShowPctfForm(true);
    setPctfFormError('');
    // Fetch global challenges for cloning
    try {
      const res = await axios.get(`${API}/api/admin/challenges`, authHeader);
      setGlobalChallenges(res.data || []);
    } catch {
      setGlobalChallenges([]);
    }
  };

  const handleEditPctf = (pctf) => {
    setEditingPctf(pctf);
    const fmt = (d) => { const dt = new Date(d); return isNaN(dt) ? '' : dt.toISOString().slice(0, 16); };
    setPctfForm({
      title: pctf.title || '',
      description: pctf.description || '',
      accessId: pctf.accessId || '',
      accessPassword: pctf.accessPassword || '',
      startsAt: fmt(pctf.startsAt),
      endsAt: fmt(pctf.endsAt),
      challenges: pctf.challenges || [],
    });
    setCustomChallenge({ title: '', category: 'Misc', points: 100, difficulty: 'Medium', description: '', hint: '', flag: '' });
    setSelectedGlobalIds([]);
    setShowPctfForm(true);
    setPctfFormError('');
    // Fetch global challenges for cloning
    axios.get(`${API}/api/admin/challenges`, authHeader)
      .then(r => setGlobalChallenges(r.data || []))
      .catch(() => setGlobalChallenges([]));
  };

  const handleSavePctf = async (e) => {
    e.preventDefault();
    setPctfFormError('');
    if (!pctfForm.title || !pctfForm.accessId || !pctfForm.accessPassword || !pctfForm.startsAt || !pctfForm.endsAt) {
      setPctfFormError('Title, Access ID, Access Password, Start, and End are required.');
      return;
    }
    if (pctfForm.challenges.length === 0) {
      setPctfFormError('At least one challenge is required.');
      return;
    }
    setSavingPctf(true);
    try {
      const payload = {
        title: pctfForm.title,
        description: pctfForm.description,
        accessId: pctfForm.accessId,
        accessPassword: pctfForm.accessPassword,
        startsAt: new Date(pctfForm.startsAt).toISOString(),
        endsAt: new Date(pctfForm.endsAt).toISOString(),
        challenges: pctfForm.challenges,
      };
      if (editingPctf) {
        await axios.put(`${API}/api/admin/personal-ctf/${editingPctf.id}`, payload, authHeader);
        toast.success('Personal CTF updated.');
      } else {
        await axios.post(`${API}/api/admin/personal-ctf`, payload, authHeader);
        toast.success('Personal CTF created.');
      }
      setShowPctfForm(false);
      setEditingPctf(null);
      fetchAll();
    } catch (err) {
      setPctfFormError(err.response?.data?.message || 'Failed to save Personal CTF.');
    }
    setSavingPctf(false);
  };

  const handleDeletePctf = async (id, title) => {
    if (!window.confirm(`Delete Personal CTF "${title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/personal-ctf/${id}`, authHeader);
      toast.success('Personal CTF deleted.');
      fetchAll();
    } catch {
      toast.error('Failed to delete Personal CTF.');
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  // If no token, render nothing (redirect effect handles it)
  if (!token) return null;

  const tabRows = (data[tab] || []).filter(row => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(row).some(v => String(v).toLowerCase().includes(q));
  });

  const columns = {
    members: ['name', 'uid', 'email', 'department', 'year', 'contact', 'registeredAt'],
    'ctf-users': ['username', 'email', 'college', 'joinedAt'],
    'event-registrations': ['name', 'email', 'eventTitle', 'registeredAt'],
    challenges: ['title', 'category', 'points', 'difficulty', 'solved_count', 'flag'],
  }[tab];

  const fmtDate = (v) => {
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const galleryAlbums = tab === 'gallery'
    ? Object.values(tabRows.reduce((acc, item) => {
        if (!acc[item.eventId]) acc[item.eventId] = { eventId: item.eventId, eventTitle: item.eventTitle, accent: item.accent, photos: [] };
        acc[item.eventId].photos.push(item);
        return acc;
      }, {}))
    : [];

  const diffColor = (d) => {
    const map = { Easy: '#39FF14', Medium: '#FFD60A', Hard: '#FF2D55', Insane: '#FF8C00' };
    return map[d] || '#6B7280';
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      <div style={{
        background: 'var(--navy)', borderBottom: '1px solid #1f2937',
        padding: '2rem 2rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 8 }}>// ADMIN_DASHBOARD</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900 }}>Club Overview</h1>
          </div>
          <button onClick={handleLogout} style={{
            padding: '10px 20px', background: 'transparent', color: '#6B7280',
            border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)',
            fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FF2D55'; e.currentTarget.style.borderColor = '#FF2D5550'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#1f2937'; }}
          >LOGOUT</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {/* STATS */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 36 }}>
            {[
              { label: 'Members', value: stats.members, color: '#7C3AED' },
              { label: 'CTF Accounts', value: stats.ctfUsers, color: '#00F5FF' },
              { label: 'Event RSVPs', value: stats.eventRegistrations, color: '#39FF14' },
              { label: 'Flags Captured', value: stats.correctSubmissions, color: '#FFD60A' },
              { label: 'Gallery Photos', value: stats.galleryPhotos, color: '#FF2D55' },
              { label: 'Weekly Active', value: stats.weeklyActivePlayers || 0, color: '#39FF14' },
              { label: 'Challenges', value: (data.challenges || []).length, color: '#8B5CF6' },
              { label: 'Events', value: stats.events || 0, color: '#FF8C00' },
              { label: 'Team', value: stats.teamMembers || 0, color: '#FFD60A' },
              { label: 'Resources', value: stats.resources || 0, color: '#39FF14' },
              { label: 'Blog Posts', value: stats.blogPosts || 0, color: '#8B5CF6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: `1px solid ${s.color}30`, borderRadius: 12, padding: '1.2rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 1, marginTop: 4 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABS + SEARCH */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setShowChallengeForm(false); }} style={{
                padding: '8px 16px', background: tab === t.key ? `${t.color}20` : 'transparent',
                color: tab === t.key ? t.color : '#6B7280', border: `1px solid ${tab === t.key ? t.color + '50' : '#1f2937'}`,
                borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
              }}>{t.label} ({tabCount(t, data, stats, liveCounts)})</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {tab === 'blog' && (
              <button onClick={openNewBlogForm} style={{
                padding: '8px 16px', background: '#8B5CF620', color: '#8B5CF6',
                border: '1px solid #8B5CF650', borderRadius: 8, fontFamily: 'var(--font-mono)',
                fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#8B5CF630'}
                onMouseLeave={e => e.currentTarget.style.background = '#8B5CF620'}
              >+ NEW POST</button>
            )}
            {tab === 'events' && (
              <button onClick={openNewEventForm} style={{
                padding: '8px 16px', background: '#FF8C0020', color: '#FF8C00',
                border: '1px solid #FF8C0050', borderRadius: 8, fontFamily: 'var(--font-mono)',
                fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#FF8C0030'}
                onMouseLeave={e => e.currentTarget.style.background = '#FF8C0020'}
              >+ NEW EVENT</button>
            )}
            {tab === 'challenges' && (
              <>
                <button onClick={openArchiveModal} style={{
                  padding: '8px 16px', background: 'transparent', color: '#8B5CF6',
                  border: '1px solid #8B5CF640', borderRadius: 8, fontFamily: 'var(--font-mono)',
                  fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#8B5CF615'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >📦 ARCHIVE</button>
                <button onClick={handleResetWeek} disabled={archiving} style={{
                  padding: '8px 16px', background: '#7C3AED20', color: '#7C3AED',
                  border: '1px solid #7C3AED50', borderRadius: 8, fontFamily: 'var(--font-mono)',
                  fontSize: 12, letterSpacing: 1, cursor: 'pointer', opacity: archiving ? 0.6 : 1, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { if (!archiving) e.currentTarget.style.background = '#7C3AED30'; }}
                  onMouseLeave={e => { if (!archiving) e.currentTarget.style.background = '#7C3AED20'; }}
                >{archiving ? 'ARCHIVING…' : '🔄 RESET WEEK'}</button>
                <button onClick={openNewChallengeForm} style={{
                  padding: '8px 16px', background: '#FF2D5520', color: '#FF2D55',
                  border: '1px solid #FF2D5550', borderRadius: 8, fontFamily: 'var(--font-mono)',
                  fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FF2D5530'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FF2D5520'}
                >+ NEW CHALLENGE</button>
              </>
            )}
            {tab === 'personal-ctf' && (
              <button onClick={() => openNewPctfForm()} style={{
                padding: '8px 16px', background: '#FF6B6B20', color: '#FF6B6B',
                border: '1px solid #FF6B6B50', borderRadius: 8, fontFamily: 'var(--font-mono)',
                fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#FF6B6B30'}
                onMouseLeave={e => e.currentTarget.style.background = '#FF6B6B20'}
              >+ NEW CTF</button>
            )}
            {tab !== 'challenges' && tab !== 'events' && tab !== 'personal-ctf' && tab !== 'team' && tab !== 'resources' && tab !== 'content' && (
              <input
                placeholder={tab === 'blog' ? 'Search posts…' : 'Search…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, width: 220 }}
              />
            )}
          </div>
        </div>

        {/* ─── CHALLENGES TAB ────────────────────────────────────────────── */}
        {tab === 'challenges' && (
          <>
            {/* Challenge form modal */}
            {showChallengeForm && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                backdropFilter: 'blur(8px)',
              }} onClick={e => { if (e.target === e.currentTarget) setShowChallengeForm(false); }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
                  padding: '2rem', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF2D55', letterSpacing: 2, marginBottom: 4 }}>
                        {editingChallenge ? '// EDIT_CHALLENGE' : '// NEW_CHALLENGE'}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                        {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
                      </h3>
                    </div>
                    <button onClick={() => setShowChallengeForm(false)} style={{
                      background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                      borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                    }}>✕</button>
                  </div>

                  <form onSubmit={handleSaveChallenge}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Title *</label>
                        <input value={challengeForm.title} onChange={e => setChallengeForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required placeholder="Challenge title" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Points</label>
                        <input type="number" value={challengeForm.points} onChange={e => setChallengeForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={inputStyle} min={0} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Category</label>
                        <select value={challengeForm.category} onChange={e => setChallengeForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Difficulty</label>
                        <select value={challengeForm.difficulty} onChange={e => setChallengeForm(f => ({ ...f, difficulty: e.target.value }))} style={inputStyle}>
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Description</label>
                      <textarea value={challengeForm.description} onChange={e => setChallengeForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-body)' }} placeholder="Challenge description…" />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Hint</label>
                      <input value={challengeForm.hint} onChange={e => setChallengeForm(f => ({ ...f, hint: e.target.value }))} style={inputStyle} placeholder="Hint for players" />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Flag *</label>
                      <input value={challengeForm.flag} onChange={e => setChallengeForm(f => ({ ...f, flag: e.target.value }))} style={{ ...inputStyle, fontFamily: 'var(--font-mono)', color: '#39FF14' }} required placeholder="CSPHERE{flag_here}" />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Challenge File <span style={{ color: '#9CA3AF' }}>(optional, max 10MB)</span></label>
                      {editingChallenge && editingChallenge.fileUrl && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', marginBottom: 8,
                          background: '#0A0A0F', border: '1px solid #39FF1430', borderRadius: 8,
                        }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#39FF14' }}>📄 {editingChallenge.fileUrl.split('/').pop()}</span>
                          <button type="button" onClick={() => handleRemoveChallengeFile(editingChallenge.id)} style={{
                            marginLeft: 'auto', background: 'transparent', border: '1px solid #FF2D5540',
                            color: '#FF2D55', borderRadius: 6, padding: '3px 8px',
                            fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                          }}>REMOVE</button>
                        </div>
                      )}
                      <input key={challengeFileInputKey} type="file" onChange={handleChallengeFileChange} style={{ ...inputStyle, padding: '9px 14px' }} />
                      {challengeFile && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF', marginTop: 4 }}>
                          Selected: {challengeFile.name} ({(challengeFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                      {challengeUploadError && (
                        <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF2D55' }}>✗ {challengeUploadError}</div>
                      )}
                    </div>

                    {challengeError && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                        border: '1px solid #FF2D5540', color: '#FF2D55',
                        fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                      }}>✗ {challengeError}</div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={savingChallenge} style={{
                        flex: 1, padding: '12px', background: '#FF2D55', color: '#fff',
                        border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                        fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: savingChallenge ? 0.7 : 1,
                      }}>
                        {savingChallenge ? 'SAVING…' : editingChallenge ? 'UPDATE CHALLENGE' : 'CREATE CHALLENGE'}
                      </button>
                      <button type="button" onClick={() => setShowChallengeForm(false)} style={{
                        padding: '12px 20px', background: 'transparent', color: '#6B7280',
                        border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                      }}>CANCEL</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Challenge table */}
            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : data.challenges.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>No challenges yet.</div>
                  <button onClick={openNewChallengeForm} style={{
                    padding: '10px 20px', background: '#FF2D55', color: '#fff',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}>+ CREATE FIRST CHALLENGE</button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TITLE</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>CATEGORY</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>PTS</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>DIFFICULTY</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>SOLVED</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>FILE</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>FLAG</th>
                      <th style={{ borderBottom: '1px solid #1f2937' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.challenges.map(ch => (
                      <tr key={ch.id} style={{ borderBottom: '1px solid #1f293780', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0A0A0F'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600, whiteSpace: 'nowrap' }}>{ch.title}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: '#FF2D5515', color: '#FF2D55', borderRadius: 4,
                            padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 11,
                          }}>{ch.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFD60A' }}>{ch.points}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            color: diffColor(ch.difficulty),
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            background: `${diffColor(ch.difficulty)}15`,
                            padding: '2px 8px', borderRadius: 4,
                          }}>{ch.difficulty}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>{ch.solved_count || 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {ch.fileUrl ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#39FF14' }}>📄</span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.flag}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => openEditChallengeForm(ch)} style={{
                            background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', marginRight: 6, transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#00F5FF15'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >EDIT</button>
                          <button onClick={() => handleDeleteChallenge(ch.id, ch.title)} style={{
                            background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FF2D5515'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >DELETE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Archive viewer modal */}
            {showArchiveModal && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                backdropFilter: 'blur(8px)',
              }} onClick={e => { if (e.target === e.currentTarget) setShowArchiveModal(false); }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
                  padding: '2rem', maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8B5CF6', letterSpacing: 2, marginBottom: 4 }}>// ARCHIVE</div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Archived Challenge Sets</h3>
                    </div>
                    <button onClick={() => setShowArchiveModal(false)} style={{
                      background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                      borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                    }}>✕</button>
                  </div>

                  {archiveError && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                      border: '1px solid #FF2D5540', color: '#FF2D55',
                      fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                    }}>✗ {archiveError}</div>
                  )}

                  {archives.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      No archived weeks yet. Use <span style={{ color: '#8B5CF6' }}>RESET WEEK</span> to archive the current challenge set and start fresh.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {archives.map((archive, idx) => (
                        <div key={idx} style={{
                          background: '#0A0A0F', border: '1px solid #1f2937', borderRadius: 10,
                          padding: '1.2rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B5CF6', fontWeight: 700 }}>
                                Week {archives.length - idx}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>
                                {archive.weekLabel}
                              </span>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>
                              {archive.challenges.length} challenge{archive.challenges.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                            {archive.challenges.map(ch => (
                              <div key={ch.id} style={{
                                background: 'var(--card)', borderRadius: 8, padding: '10px 12px',
                                border: '1px solid #1f293780',
                              }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 4 }}>{ch.title}</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#FFD60A' }}>{ch.points}pts</span>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280',
                                    background: '#1f2937', padding: '1px 6px', borderRadius: 4,
                                  }}>{ch.category}</span>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: 10,
                                    color: ({ Easy: '#39FF14', Medium: '#FFD60A', Hard: '#FF2D55', Insane: '#FF8C00' })[ch.difficulty] || '#6B7280',
                                  }}>{ch.difficulty}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── EVENTS TAB ──────────────────────────────────────────────────── */}
        {tab === 'events' && (
          <>
            {/* Event form modal */}
            {showEventForm && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                backdropFilter: 'blur(8px)',
              }} onClick={e => { if (e.target === e.currentTarget) setShowEventForm(false); }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
                  padding: '2rem', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF8C00', letterSpacing: 2, marginBottom: 4 }}>
                        {editingEvent ? '// EDIT_EVENT' : '// NEW_EVENT'}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                        {editingEvent ? 'Edit Event' : 'Create Event'}
                      </h3>
                    </div>
                    <button onClick={() => setShowEventForm(false)} style={{
                      background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                      borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                    }}>✕</button>
                  </div>

                  <form onSubmit={handleSaveEvent}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Title *</label>
                      <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required placeholder="Event title" />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Location / Venue</label>
                      <input value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} placeholder="e.g. CU Campus, Block A Auditorium" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Date</label>
                        <input type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Start Time</label>
                        <input type="time" value={eventForm.startTime} onChange={e => setEventForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>End Time</label>
                        <input type="time" value={eventForm.endTime} onChange={e => setEventForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Type</label>
                        <select value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                          <option value="upcoming">Upcoming</option>
                          <option value="past">Past</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Category</label>
                        <select value={eventForm.category} onChange={e => setEventForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                          <option value="CTF">CTF</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Bootcamp">Bootcamp</option>
                          <option value="Challenge">Challenge</option>
                          <option value="Industrial Visit">Industrial Visit</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Meetup">Meetup</option>
                          <option value="Misc">Misc</option>
                        </select>
                      </div>
                      <div></div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Description</label>
                      <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-body)' }} placeholder="Event description…" />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Cover Photo <span style={{ color: '#9CA3AF' }}>(optional — shown on event cards &amp; gallery)</span></label>
                      {editingEvent?.coverPhoto && !eventCoverPreview && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                          padding: '8px 12px', background: '#0A0A0F', border: '1px solid #FF8C0030', borderRadius: 8,
                        }}>
                          <img src={resolveMediaUrl(editingEvent.coverPhoto)} alt="Current cover" style={{ width: 56, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>Current cover photo</span>
                          <button type="button" onClick={handleRemoveEventCover} style={{
                            marginLeft: 'auto', background: 'transparent', border: '1px solid #FF2D5540',
                            color: '#FF2D55', borderRadius: 6, padding: '3px 8px',
                            fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                          }}>REMOVE</button>
                        </div>
                      )}
                      <input key={eventCoverKey} type="file" accept="image/*" onChange={handleEventCoverChange} style={{ ...inputStyle, padding: '9px 14px' }} />
                      {eventCoverPreview && (
                        <div style={{ marginTop: 8 }}>
                          <img src={eventCoverPreview} alt="Cover preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #FF8C0030' }} />
                        </div>
                      )}
                    </div>

                    {eventFormError && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                        border: '1px solid #FF2D5540', color: '#FF2D55',
                        fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                      }}>✗ {eventFormError}</div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={savingEvent} style={{
                        flex: 1, padding: '12px', background: '#FF8C00', color: '#fff',
                        border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                        fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: savingEvent ? 0.7 : 1,
                      }}>
                        {savingEvent ? 'SAVING…' : editingEvent ? 'UPDATE EVENT' : 'CREATE EVENT'}
                      </button>
                      <button type="button" onClick={() => setShowEventForm(false)} style={{
                        padding: '12px 20px', background: 'transparent', color: '#6B7280',
                        border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                      }}>CANCEL</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Events table */}
            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : data.events.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>No events yet.</div>
                  <button onClick={openNewEventForm} style={{
                    padding: '10px 20px', background: '#FF8C00', color: '#fff',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}>+ CREATE FIRST EVENT</button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TITLE</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>DATE</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TYPE</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>CATEGORY</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>RSVPs</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>PHOTOS</th>
                      <th style={{ borderBottom: '1px solid #1f2937' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map(ev => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid #1f293780', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0A0A0F'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600, whiteSpace: 'nowrap' }}>{ev.title}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(ev.date)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            background: ev.type === 'upcoming' ? '#39FF1415' : '#6B728015',
                            color: ev.type === 'upcoming' ? '#39FF14' : '#6B7280',
                            borderRadius: 4, padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 11,
                          }}>{ev.type}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: '#FF8C0015', color: '#FF8C00', borderRadius: 4,
                            padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 11,
                          }}>{ev.category}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#39FF14' }}>{ev.registrations || 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FFD60A' }}>{ev.photos || 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => openEditEventForm(ev)} style={{
                            background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', marginRight: 6, transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = '#00F5FF15'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >EDIT</button>
                          <button onClick={() => handleDeleteEvent(ev.id, ev.title)} style={{
                            background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FF2D5515'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >DELETE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── TEAM TAB ──────────────────────────────────────────────────────── */}
        {tab === 'team' && (
          <TeamManager token={token} onDataChange={(count) => setLiveCounts(c => ({ ...c, team: count }))} />
        )}

        {/* ─── RESOURCES TAB ──────────────────────────────────────────────────── */}
        {tab === 'resources' && (
          <ResourcesManager token={token} onDataChange={(count) => setLiveCounts(c => ({ ...c, resources: count }))} />
        )}

        {/* ─── SITE CONTENT TAB ───────────────────────────────────────────────── */}
        {tab === 'content' && (
          <ContentManager token={token} />
        )}

        {/* ─── BLOG TAB ─────────────────────────────────────────────────────── */}
        {tab === 'blog' && (
          <>
            {/* Blog form modal */}
            {showBlogForm && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                backdropFilter: 'blur(8px)',
              }} onClick={e => { if (e.target === e.currentTarget) setShowBlogForm(false); }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
                  padding: '2rem', maxWidth: 750, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8B5CF6', letterSpacing: 2, marginBottom: 4 }}>
                        {editingBlog ? '// EDIT_POST' : '// NEW_POST'}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                        {editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}
                      </h3>
                    </div>
                    <button onClick={() => setShowBlogForm(false)} style={{
                      background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                      borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                    }}>✕</button>
                  </div>

                  <form onSubmit={handleSaveBlog}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Title *</label>
                      <input value={blogForm.title} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required placeholder="Post title" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Author</label>
                        <input value={blogForm.author} onChange={e => setBlogForm(f => ({ ...f, author: e.target.value }))} style={inputStyle} placeholder="Author name" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Tags <span style={{ color: '#9CA3AF' }}>(comma separated)</span></label>
                        <input value={blogForm.tags} onChange={e => setBlogForm(f => ({ ...f, tags: e.target.value }))} style={inputStyle} placeholder="ctf, workshop, announcement" />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Content * <span style={{ color: '#9CA3AF' }}>(Markdown supported)</span></label>
                      <textarea value={blogForm.content} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))} style={{ ...inputStyle, minHeight: 250, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '1.6' }} required placeholder="Write your post content in Markdown..." />
                    </div>

                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        padding: '8px 14px', background: blogForm.published ? '#8B5CF620' : '#0A0A0F',
                        border: `1px solid ${blogForm.published ? '#8B5CF650' : '#1f2937'}`, borderRadius: 8,
                        fontFamily: 'var(--font-mono)', fontSize: 12, color: blogForm.published ? '#8B5CF6' : '#6B7280',
                        transition: 'all 0.2s',
                      }}>
                        <input type="checkbox" checked={blogForm.published} onChange={e => setBlogForm(f => ({ ...f, published: e.target.checked }))} style={{ accentColor: '#8B5CF6' }} />
                        Publish immediately
                      </label>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>
                        {blogForm.published
                          ? '✨ Post will be visible to everyone'
                          : '🔒 Post saved as draft — only admins can see it'
                        }
                      </div>
                    </div>

                    {blogError && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                        border: '1px solid #FF2D5540', color: '#FF2D55',
                        fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                      }}>✗ {blogError}</div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={savingBlog} style={{
                        flex: 1, padding: '12px', background: '#8B5CF6', color: '#fff',
                        border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                        fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: savingBlog ? 0.7 : 1,
                      }}>
                        {savingBlog ? 'SAVING…' : editingBlog ? 'UPDATE POST' : 'CREATE POST'}
                      </button>
                      <button type="button" onClick={() => setShowBlogForm(false)} style={{
                        padding: '12px 20px', background: 'transparent', color: '#6B7280',
                        border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                      }}>CANCEL</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Blog posts table */}
            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : data.blog.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>No blog posts yet.</div>
                  <button onClick={openNewBlogForm} style={{
                    padding: '10px 20px', background: '#8B5CF6', color: '#fff',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}>+ CREATE FIRST POST</button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TITLE</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>AUTHOR</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TAGS</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>CREATED</th>
                      <th style={{ borderBottom: '1px solid #1f2937' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.blog.map(post => (
                      <tr key={post.id} style={{ borderBottom: '1px solid #1f293780', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0A0A0F'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600, whiteSpace: 'nowrap' }}>{post.title}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>{post.author || 'Admin'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {(post.tags || []).length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {(post.tags || []).slice(0, 3).map(tag => (
                                <span key={tag} style={{
                                  background: '#8B5CF615', color: '#8B5CF6', borderRadius: 4,
                                  padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: 10,
                                }}>{tag}</span>
                              ))}
                              {(post.tags || []).length > 3 && (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280' }}>+{post.tags.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            color: post.published ? '#39FF14' : '#6B7280',
                            background: post.published ? '#39FF1415' : 'transparent',
                            padding: '2px 8px', borderRadius: 4,
                          }}>{post.published ? 'PUBLISHED' : 'DRAFT'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(post.createdAt)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleToggleBlogPublish(post)} style={{
                            background: 'transparent', border: `1px solid ${post.published ? '#6B728040' : '#39FF1440'}`, color: post.published ? '#6B7280' : '#39FF14',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', marginRight: 6, transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${post.published ? '#6B7280' : '#39FF14'}15`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            title={post.published ? 'Unpublish' : 'Publish'}
                          >{post.published ? 'UNPUBLISH' : 'PUBLISH'}</button>
                          <button onClick={() => openEditBlogForm(post)} style={{
                            background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', marginRight: 6, transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#00F5FF15'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >EDIT</button>
                          <button onClick={() => handleDeleteBlog(post.id, post.title)} style={{
                            background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                            borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FF2D5515'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >DELETE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── LEADERBOARD TAB ──────────────────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FFD60A', letterSpacing: 4, marginBottom: 24 }}>// LEADERBOARD</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Players', value: data.leaderboard.length, color: '#00F5FF' },
                  { label: 'Top Score', value: data.leaderboard[0]?.score || 0, color: '#FFD60A' },
                  { label: 'Top Player', value: data.leaderboard[0]?.username || 'N/A', color: '#39FF14' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--card)', border: `1px solid ${s.color}30`, borderRadius: 12, padding: '1.2rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 1, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : data.leaderboard.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No players yet. CTF accounts are needed for leaderboard data.</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 100px 120px 80px', padding: '12px 20px', background: '#0D1117', borderBottom: '1px solid #1f2937', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 2 }}>
                    <div>RANK</div><div>PLAYER</div><div>COLLEGE</div><div>SOLVED</div><div>SCORE</div><div>BADGE</div>
                  </div>
                  {data.leaderboard.map((p, i) => (
                    <div key={p.rank} style={{
                      display: 'grid', gridTemplateColumns: '60px 1fr 1fr 100px 120px 80px',
                      padding: '12px 20px', borderBottom: '1px solid #1f293740',
                      background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                      alignItems: 'center', transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#00F5FF08'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#ffffff03'}
                    >
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: p.rank <= 3 ? ['#FFD60A', '#C0C0C0', '#CD7F32'][p.rank - 1] : '#6B7280' }}>#{p.rank}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `${BADGE_COLORS[p.badge] || '#6B7280'}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                          color: BADGE_COLORS[p.badge] || '#6B7280',
                        }}>{p.avatar}</div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#E2E8F0' }}>{p.username}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>{p.college}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#39FF14' }}>{p.solved}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#FFD60A' }}>{p.score.toLocaleString()}</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1,
                        color: BADGE_COLORS[p.badge] || '#6B7280',
                        background: `${BADGE_COLORS[p.badge] || '#6B7280'}15`,
                        padding: '2px 8px', borderRadius: 10, textAlign: 'center',
                      }}>{p.badge}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* ─── GALLERY TAB ─────────────────────────────────────────────────── */}
        {tab === 'gallery' && (
          <>
            {/* ADD PHOTO FORM */}
            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, padding: '1.5rem', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FFD60A', letterSpacing: 2, marginBottom: 16 }}>+ ADD PHOTO TO EVENT</div>
              <form onSubmit={handleAddPhoto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <select value={photoForm.eventId} onChange={e => setPhotoForm(f => ({ ...f, eventId: e.target.value }))} style={inputStyle} required>
                  <option value="">Select event…</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>)}
                </select>
                <input placeholder="Photo caption / label" value={photoForm.label} onChange={e => setPhotoForm(f => ({ ...f, label: e.target.value }))} style={inputStyle} required />
                <input key={fileInputKey} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoFileChange} style={{ ...inputStyle, padding: '9px 14px' }} required />
                <select value={photoForm.accent} onChange={e => setPhotoForm(f => ({ ...f, accent: e.target.value }))} style={inputStyle}>
                  {ACCENT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="submit" disabled={addingPhoto} style={{
                  padding: '12px', background: '#FFD60A', color: '#0A0A0F', border: 'none',
                  borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
                  fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: addingPhoto ? 0.7 : 1,
                }}>{addingPhoto ? 'UPLOADING…' : 'ADD PHOTO'}</button>
              </form>
              {photoPreview && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={photoPreview} alt="Preview" style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #1f2937' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>Preview — max 5MB, JPG/PNG/GIF/WEBP</span>
                </div>
              )}
              {photoError && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FF2D5515', border: '1px solid #FF2D5540', color: '#FF2D55', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>✗ {photoError}</div>
              )}
            </div>

            {/* PHOTO ALBUMS */}
            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, padding: galleryAlbums.length ? '1.5rem' : 0 }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : galleryAlbums.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No photos yet — add one above.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {galleryAlbums.map(album => (
                    <div key={album.eventId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: album.accent }} />
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>{album.eventTitle}</h4>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>{album.photos.length} photo{album.photos.length > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {album.photos.map(item => (
                          <div key={item.id} style={{ background: '#0A0A0F', border: `1px solid ${item.accent}30`, borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ aspectRatio: '16/10', position: 'relative' }}>
                              <img src={resolveMediaUrl(item.photo)} alt={item.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ padding: '10px 12px' }}>
                              <div style={{ fontSize: 13, color: '#E2E8F0', marginBottom: 10 }}>{item.label}</div>
                              <button onClick={() => handleDeletePhoto(item.id)} style={{ width: '100%', background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55', borderRadius: 6, padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>DELETE</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── PERSONAL CTFs TAB ───────────────────────────────────────────── */}
        {tab === 'personal-ctf' && (
          <>
            {/* Personal CTF form modal */}
            {showPctfForm && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                backdropFilter: 'blur(8px)',
              }} onClick={e => { if (e.target === e.currentTarget) setShowPctfForm(false); }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
                  padding: '2rem', maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF6B6B', letterSpacing: 2, marginBottom: 4 }}>
                        {editingPctf ? '// EDIT_PERSONAL_CTF' : '// NEW_PERSONAL_CTF'}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                        {editingPctf ? 'Edit Personal CTF' : 'Create Personal CTF'}
                      </h3>
                    </div>
                    <button onClick={() => setShowPctfForm(false)} style={{
                      background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                      borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                    }}>✕</button>
                  </div>

                  <form onSubmit={handleSavePctf}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Title *</label>
                      <input value={pctfForm.title} onChange={e => setPctfForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required placeholder="e.g. Friday Night Pwn Challenge" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Description</label>
                      <textarea value={pctfForm.description} onChange={e => setPctfForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} placeholder="What's this CTF about?" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Access ID *</label>
                        <input value={pctfForm.accessId} onChange={e => setPctfForm(f => ({ ...f, accessId: e.target.value.toUpperCase() }))} style={inputStyle} required placeholder="e.g. PWN-FRI-01" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Access Password *</label>
                        <input value={pctfForm.accessPassword} onChange={e => setPctfForm(f => ({ ...f, accessPassword: e.target.value }))} style={inputStyle} required placeholder="Secret password" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Start Time *</label>
                        <input type="datetime-local" value={pctfForm.startsAt} onChange={e => setPctfForm(f => ({ ...f, startsAt: e.target.value }))} style={inputStyle} required />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>End Time *</label>
                        <input type="datetime-local" value={pctfForm.endsAt} onChange={e => setPctfForm(f => ({ ...f, endsAt: e.target.value }))} style={inputStyle} required />
                      </div>
                    </div>

                    {/* Challenges Section */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF6B6B', letterSpacing: 1, marginBottom: 12 }}>// CHALLENGES</div>

                      {/* Clone from global */}
                      {globalChallenges.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>From Global Pool:</div>
                          <div style={{ display: 'grid', gap: 4 }}>
                            {globalChallenges.map(ch => (
                              <label key={ch.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                                borderRadius: 6, cursor: 'pointer',
                                background: selectedGlobalIds.includes(ch.id) ? '#00F5FF08' : 'transparent',
                              }}>
                                <input type="checkbox" checked={selectedGlobalIds.includes(ch.id)}
                                  onChange={() => {
                                    setSelectedGlobalIds(prev =>
                                      prev.includes(ch.id) ? prev.filter(x => x !== ch.id) : [...prev, ch.id]
                                    );
                                  }}
                                />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E2E8F0' }}>{ch.title}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A' }}>+{ch.points}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280' }}>{ch.category}</span>
                              </label>
                            ))}
                          </div>
                          <button type="button" onClick={() => {
                            const cloned = globalChallenges.filter(ch => selectedGlobalIds.includes(ch.id)).map(ch => ({
                              title: ch.title, category: ch.category, points: ch.points,
                              difficulty: ch.difficulty, description: ch.description || '',
                              hint: ch.hint || '', flag: ch.flag || '',
                            }));
                            setPctfForm(f => ({ ...f, challenges: [...f.challenges, ...cloned] }));
                            setSelectedGlobalIds([]);
                          }} disabled={selectedGlobalIds.length === 0} style={{
                            marginTop: 8, padding: '6px 14px', background: '#00F5FF20', color: '#00F5FF',
                            border: '1px solid #00F5FF40', borderRadius: 6, fontFamily: 'var(--font-mono)',
                            fontSize: 11, cursor: selectedGlobalIds.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: selectedGlobalIds.length === 0 ? 0.5 : 1,
                          }}>+ ADD SELECTED ({selectedGlobalIds.length})</button>
                        </div>
                      )}

                      {/* Custom challenge */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>Add Custom Challenge:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input value={customChallenge.title} onChange={e => setCustomChallenge(f => ({ ...f, title: e.target.value }))} placeholder="Title" style={inputStyle} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <select value={customChallenge.category} onChange={e => setCustomChallenge(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="number" value={customChallenge.points} onChange={e => setCustomChallenge(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={{ ...inputStyle, width: 80 }} min={0} />
                          </div>
                        </div>
                        <input value={customChallenge.flag} onChange={e => setCustomChallenge(f => ({ ...f, flag: e.target.value }))} placeholder="CSPHERE{...}" style={{ ...inputStyle, marginBottom: 8 }} />
                        <button type="button" onClick={() => {
                          if (!customChallenge.title.trim()) return;
                          setPctfForm(f => ({ ...f, challenges: [...f.challenges, { ...customChallenge, difficulty: customChallenge.difficulty || 'Medium' }] }));
                          setCustomChallenge({ title: '', category: 'Misc', points: 100, difficulty: 'Medium', description: '', hint: '', flag: '' });
                        }} disabled={!customChallenge.title.trim()} style={{
                          padding: '6px 14px', background: '#FF6B6B20', color: '#FF6B6B',
                          border: '1px solid #FF6B6B40', borderRadius: 6, fontFamily: 'var(--font-mono)',
                          fontSize: 11, cursor: customChallenge.title.trim() ? 'pointer' : 'not-allowed',
                          opacity: customChallenge.title.trim() ? 1 : 0.5,
                        }}>+ ADD CUSTOM CHALLENGE</button>
                      </div>

                      {/* Added challenges list */}
                      {pctfForm.challenges.length > 0 && (
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#39FF14', marginBottom: 8 }}>Added ({pctfForm.challenges.length}):</div>
                          <div style={{ display: 'grid', gap: 4 }}>
                            {pctfForm.challenges.map((ch, idx) => (
                              <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                                background: '#0A0A0F', borderRadius: 6, border: '1px solid #1f2937',
                              }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E2E8F0', flex: 1 }}>{ch.title}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A' }}>+{ch.points}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280' }}>{ch.category}</span>
                                <button type="button" onClick={() => setPctfForm(f => ({ ...f, challenges: f.challenges.filter((_, i) => i !== idx) }))} style={{
                                  background: 'transparent', border: 'none', color: '#FF2D55', cursor: 'pointer', fontSize: 14,
                                }}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {pctfFormError && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                        border: '1px solid #FF2D5540', color: '#FF2D55',
                        fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                      }}>✗ {pctfFormError}</div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={savingPctf} style={{
                        flex: 1, padding: '12px', background: '#FF6B6B', color: '#fff',
                        border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                        fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: savingPctf ? 0.7 : 1,
                      }}>
                        {savingPctf ? 'SAVING…' : editingPctf ? 'UPDATE CTF' : 'CREATE CTF'}
                      </button>
                      <button type="button" onClick={() => setShowPctfForm(false)} style={{
                        padding: '12px 20px', background: 'transparent', color: '#6B7280',
                        border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                      }}>CANCEL</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Personal CTFs table */}
            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : !data['personal-ctf'] || data['personal-ctf'].length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>No personal CTFs yet.</div>
                  <button onClick={() => openNewPctfForm()} style={{
                    padding: '10px 20px', background: '#FF6B6B', color: '#fff',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}>+ CREATE FIRST CTF</button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TITLE</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>ACCESS ID</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>STATUS</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>CHALLENGES</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>PARTICIPANTS</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>START</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>END</th>
                      <th style={{ borderBottom: '1px solid #1f2937' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data['personal-ctf'].map(pctf => {
                      const statusColor = pctf.status === 'active' ? '#00F5FF' : pctf.status === 'upcoming' ? '#FFD60A' : '#6B7280';
                      return (
                        <tr key={pctf.id} style={{ borderBottom: '1px solid #1f293780' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0A0A0F'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600 }}>{pctf.title}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>{pctf.accessId}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10,
                              fontWeight: 700, letterSpacing: 1,
                              background: `${statusColor}20`, color: statusColor,
                              border: `1px solid ${statusColor}40`,
                            }}>{pctf.status?.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{pctf.challengeCount || 0}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{pctf.participantCount || 0}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>{new Date(pctf.startsAt).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>{new Date(pctf.endsAt).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditPctf(pctf)} style={{
                              background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                              borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                              fontSize: 11, cursor: 'pointer', marginRight: 6,
                            }}>EDIT</button>
                            <button onClick={() => handleDeletePctf(pctf.id, pctf.title)} style={{
                              background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                              borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                              fontSize: 11, cursor: 'pointer',
                            }}>DELETE</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── OTHER TABS (members, ctf-users, event-registrations) ─────────── */}
        {tab !== 'challenges' && tab !== 'gallery' && tab !== 'leaderboard' && tab !== 'events' && tab !== 'blog' && tab !== 'personal-ctf' && (
          <>
            {/* Bulk delete action bar */}
            {selectedIds.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                padding: '12px 16px', background: '#FF2D5510', border: '1px solid #FF2D5540',
                borderRadius: 8,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF2D55' }}>
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={deletingBulk}
                  style={{
                    padding: '8px 16px', background: '#FF2D55', color: '#fff',
                    border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    opacity: deletingBulk ? 0.6 : 1,
                  }}
                >{deletingBulk ? 'DELETING…' : `DELETE ALL ${selectedIds.length}`}</button>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    padding: '8px 16px', background: 'transparent', color: '#6B7280',
                    border: '1px solid #1f2937', borderRadius: 6,
                    fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}
                >CLEAR</button>
              </div>
            )}

            <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
              ) : tabRows.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No entries yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', padding: '12px 8px', borderBottom: '1px solid #1f2937', width: 40 }}>
                        <input
                          type="checkbox"
                          checked={tabRows.length > 0 && selectedIds.length === tabRows.length}
                          onChange={toggleSelectAll}
                          style={{ accentColor: '#FF2D55', cursor: 'pointer' }}
                        />
                      </th>
                      {columns.map(c => (
                        <th key={c} style={{
                          textAlign: 'left', padding: '12px 16px', color: '#6B7280',
                          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
                          borderBottom: '1px solid #1f2937', whiteSpace: 'nowrap',
                        }}>{c.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
                      ))}
                      <th style={{ borderBottom: '1px solid #1f2937' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabRows.map(row => {
                      const isSelected = selectedIds.includes(row.id);
                      const tabColor = ({ members: '#7C3AED', 'ctf-users': '#00F5FF', 'event-registrations': '#39FF14' })[tab] || '#6B7280';
                      return (
                        <tr key={row.id} style={{
                          borderBottom: '1px solid #1f293780',
                          background: isSelected ? `${tabColor}10` : 'transparent',
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#0A0A0F'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ textAlign: 'center', padding: '12px 8px', width: 40 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(row.id)}
                              style={{ accentColor: tabColor, cursor: 'pointer' }}
                            />
                          </td>
                          {columns.map(c => (
                            <td key={c} style={{ padding: '12px 16px', color: '#E2E8F0', whiteSpace: 'nowrap' }}>
                              {c.toLowerCase().includes('at') ? fmtDate(row[c]) : row[c]}
                            </td>
                          ))}
                          <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {(tab === 'members' || tab === 'ctf-users') && (
                              <button onClick={() => tab === 'members' ? openEditMemberForm(row) : openEditUserForm(row)} style={{
                                background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                                borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                                fontSize: 11, cursor: 'pointer', marginRight: 6, transition: 'all 0.2s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.background = '#00F5FF15'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >EDIT</button>
                            )}
                            <button onClick={() => handleDelete(tab, row.id)} title="Delete" style={{
                              background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                              borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                              fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FF2D5515'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >DELETE</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── MEMBER EDIT MODAL ─────────────────────────────────────────── */}
        {showMemberForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(8px)',
          }} onClick={e => { if (e.target === e.currentTarget) setShowMemberForm(false); }}>
            <div style={{
              background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
              padding: '2rem', maxWidth: 500, width: '100%',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7C3AED', letterSpacing: 2, marginBottom: 4 }}>// EDIT_MEMBER</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Edit Member</h3>
                </div>
                <button onClick={() => setShowMemberForm(false)} style={{
                  background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                  borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                }}>✕</button>
              </div>

              <form onSubmit={handleSaveMember}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Name *</label>
                    <input value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>UID</label>
                    <input value={memberForm.uid} onChange={e => setMemberForm(f => ({ ...f, uid: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input type="email" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Department</label>
                    <input value={memberForm.department} onChange={e => setMemberForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Year</label>
                    <input value={memberForm.year} onChange={e => setMemberForm(f => ({ ...f, year: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Contact</label>
                    <input value={memberForm.contact} onChange={e => setMemberForm(f => ({ ...f, contact: e.target.value }))} style={inputStyle} />
                  </div>
                </div>

                {memberFormError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                    border: '1px solid #FF2D5540', color: '#FF2D55',
                    fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                  }}>✗ {memberFormError}</div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={savingMember} style={{
                    flex: 1, padding: '12px', background: '#7C3AED', color: '#fff',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                    fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: savingMember ? 0.7 : 1,
                  }}>{savingMember ? 'SAVING…' : 'UPDATE MEMBER'}</button>
                  <button type="button" onClick={() => setShowMemberForm(false)} style={{
                    padding: '12px 20px', background: 'transparent', color: '#6B7280',
                    border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}>CANCEL</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── CTF USER EDIT MODAL ───────────────────────────────────────── */}
        {showUserForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(8px)',
          }} onClick={e => { if (e.target === e.currentTarget) setShowUserForm(false); }}>
            <div style={{
              background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
              padding: '2rem', maxWidth: 500, width: '100%',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF', letterSpacing: 2, marginBottom: 4 }}>// EDIT_CTF_USER</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Edit CTF Account</h3>
                </div>
                <button onClick={() => setShowUserForm(false)} style={{
                  background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                  borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                }}>✕</button>
              </div>

              <form onSubmit={handleSaveUser}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Username *</label>
                  <input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} style={inputStyle} required />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>College</label>
                  <input value={userForm.college} onChange={e => setUserForm(f => ({ ...f, college: e.target.value }))} style={inputStyle} />
                </div>

                {userFormError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                    border: '1px solid #FF2D5540', color: '#FF2D55',
                    fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                  }}>✗ {userFormError}</div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={savingUser} style={{
                    flex: 1, padding: '12px', background: '#00F5FF', color: '#000',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                    fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: savingUser ? 0.7 : 1,
                  }}>{savingUser ? 'SAVING…' : 'UPDATE USER'}</button>
                  <button type="button" onClick={() => setShowUserForm(false)} style={{
                    padding: '12px 20px', background: 'transparent', color: '#6B7280',
                    border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                  }}>CANCEL</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
