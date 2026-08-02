import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL as API, resolveMediaUrl } from '../../config';
import { useToast } from '../Toast';

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const ROLE_OPTIONS = [
  'President', 'Vice President', 'Secretary', 'Joint Secretary', 'Technical Lead',
  'Management Lead', 'Discipline Lead', 'Social Media Lead', 'Content Lead',
  'Design Lead', 'Operations Coordinator', 'Event Coordinator', 'PR & Outreach Lead',
  'Anchor', 'Core Team', 'Member',
];

const SECTION_COLORS = { leadership: '#FFD60A', core: '#00F5FF' };

export default function TeamManager({ token, onDataChange }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'Core Team', avatar: '', bio: '', social: '', section: 'core', linkedin: '', github: '', instagram: '', email: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toast = useToast();
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchMembers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/team`, authHeader);
      setMembers(res.data || []);
      if (onDataChange) onDataChange((res.data || []).length);
    } catch {
      toast.error('Failed to load team.');
    }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = window.setTimeout(() => void fetchMembers(), 0);
    return () => window.clearTimeout(id);
  }, [fetchMembers]);

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [m.name, m.role, m.social, m.bio, m.email, m.linkedin, m.github, m.instagram].some(v => String(v || '').toLowerCase().includes(q));
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', role: 'Core Team', avatar: '', bio: '', social: '', section: 'core', linkedin: '', github: '', instagram: '', email: '' });
    setFormError('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name || '', role: m.role || 'Core Team', avatar: m.avatar || '',
      bio: m.bio || '', social: m.social || '', section: m.section || 'core',
      linkedin: m.linkedin || '', github: m.github || '', instagram: m.instagram || '', email: m.email || '',
    });
    setFormError('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(true);
  };

  const onPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB.');
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = async () => {
    if (!editing) return;
    try {
      await axios.delete(`${API}/api/admin/team/${editing.id}/photo`, authHeader);
      setEditing(prev => prev ? { ...prev, photo: null } : prev);
      setMembers(prev => prev.map(m => m.id === editing.id ? { ...m, photo: null } : m));
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success('Profile photo removed.');
    } catch {
      toast.error('Failed to remove photo.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name) { setFormError('Name is required.'); return; }
    setSaving(true);
    try {
      let memberId = editing ? editing.id : null;
      if (editing) {
        await axios.put(`${API}/api/admin/team/${editing.id}`, form, authHeader);
        toast.success('Member updated.');
      } else {
        const res = await axios.post(`${API}/api/admin/team`, form, authHeader);
        memberId = res.data?.member?.id;
        toast.success('Member added.');
      }

      // Upload the chosen profile photo (works for both new + existing members).
      // Member save and photo upload are handled separately so a photo failure
      // never blocks the member update or risks a duplicate member on retry.
      if (photoFile && memberId) {
        setUploadingPhoto(true);
        try {
          const fd = new FormData();
          fd.append('photo', photoFile);
          await axios.post(`${API}/api/admin/team/${memberId}/photo`, fd, authHeader);
          toast.success('Profile photo uploaded.');
        } catch {
          toast.info('Member saved, but the photo upload failed. You can retry in Edit.');
        }
        setUploadingPhoto(false);
      }

      setShowForm(false);
      setEditing(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchMembers();
    } catch (err) {
      setUploadingPhoto(false);
      setFormError(err.response?.data?.message || 'Failed to save member.');
    }
    setSaving(false);
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the team? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/team/${m.id}`, authHeader);
      toast.success('Member removed.');
      fetchMembers();
    } catch {
      toast.error('Failed to delete member.');
    }
  };

  const handleReorder = async (m, dir) => {
    try {
      const sorted = [...members].sort((a, b) => (a.order || 0) - (b.order || 0));
      const idx = sorted.findIndex(x => x.id === m.id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const a = sorted[idx], b = sorted[swapIdx];
      await Promise.all([
        axios.put(`${API}/api/admin/team/${a.id}`, { order: b.order }, authHeader),
        axios.put(`${API}/api/admin/team/${b.id}`, { order: a.order }, authHeader),
      ]);
      fetchMembers();
    } catch {
      toast.error('Failed to reorder.');
    }
  };

  const memberCard = (m) => (
    <div key={m.id} style={{
      background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12,
      padding: '1.2rem', display: 'flex', gap: 14, alignItems: 'flex-start',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${SECTION_COLORS[m.section] || '#00F5FF'}50`}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1f2937'}
    >
      {m.photo ? (
        <img
          src={resolveMediaUrl(m.photo)}
          alt={m.name}
          style={{
            width: 46, height: 46, borderRadius: '50%', minWidth: 46,
            objectFit: 'cover',
            border: `2px solid ${SECTION_COLORS[m.section] || '#00F5FF'}60`,
            background: '#0A0A0F',
          }}
        />
      ) : (
        <div style={{
          width: 46, height: 46, borderRadius: '50%', minWidth: 46,
          background: `${SECTION_COLORS[m.section] || '#00F5FF'}20`,
          border: `2px solid ${SECTION_COLORS[m.section] || '#00F5FF'}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          color: SECTION_COLORS[m.section] || '#00F5FF',
        }}>
          {(m.avatar || m.name || '?').trim().charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#E2E8F0' }}>{m.name}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
            color: SECTION_COLORS[m.section] || '#00F5FF',
            background: `${SECTION_COLORS[m.section] || '#00F5FF'}15`,
            padding: '2px 8px', borderRadius: 4,
          }}>{m.section === 'leadership' ? 'LEADERSHIP' : 'CORE'}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FFD60A', margin: '4px 0' }}>{m.role}</div>
        {m.bio && <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.5, marginBottom: 4 }}>{m.bio}</div>}
        {m.social && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{m.social}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#0A66C2', textDecoration: 'none' }}>in ▸</a>}
          {m.github && <a href={m.github} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#E2E8F0', textDecoration: 'none' }}>gh ▸</a>}
          {m.instagram && <a href={m.instagram} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#EC4899', textDecoration: 'none' }}>ig ▸</a>}
          {m.email && <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#FFD60A', textDecoration: 'none' }}>✉ {m.email}</a>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => openEdit(m)} style={{
            background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
            borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-mono)',
            fontSize: 10, cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#00F5FF15'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >EDIT</button>
          <button onClick={() => handleDelete(m)} style={{
            background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
            borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-mono)',
            fontSize: 10, cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FF2D5515'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >DELETE</button>
          <button onClick={() => handleReorder(m, -1)} title="Move up" style={{
            background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
            borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--font-mono)',
            fontSize: 10, cursor: 'pointer',
          }}>↑</button>
          <button onClick={() => handleReorder(m, 1)} title="Move down" style={{
            background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
            borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--font-mono)',
            fontSize: 10, cursor: 'pointer',
          }}>↓</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>
          Manage leadership & core team. Changes appear instantly on the <span style={{ color: '#00F5FF' }}>/team</span> page.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Search team…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 200 }}
          />
          <button onClick={openNew} style={{
            padding: '8px 16px', background: '#FFD60A20', color: '#FFD60A',
            border: '1px solid #FFD60A50', borderRadius: 8, fontFamily: 'var(--font-mono)',
            fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFD60A30'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFD60A20'}
          >+ ADD MEMBER</button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(8px)',
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{
            background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
            padding: '2rem', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A', letterSpacing: 2, marginBottom: 4 }}>
                  {editing ? '// EDIT_MEMBER' : '// NEW_MEMBER'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                  {editing ? 'Edit Team Member' : 'Add Team Member'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              }}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} required placeholder="e.g. Ada Lovelace" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Role *</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Section</label>
                  <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} style={inputStyle}>
                    <option value="core">Core Team</option>
                    <option value="leadership">Leadership</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Avatar Letter</label>
                  <input value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} style={inputStyle} maxLength={1} placeholder="Auto from name" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Social Handle</label>
                  <input value={form.social} onChange={e => setForm(f => ({ ...f, social: e.target.value }))} style={inputStyle} placeholder="@handle" />
                </div>
              </div>

              {/* Profile links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>LinkedIn</label>
                  <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} style={inputStyle} placeholder="username or full URL" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>GitHub</label>
                  <input value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} style={inputStyle} placeholder="username or full URL" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Instagram</label>
                  <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} style={inputStyle} placeholder="username or full URL" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="name@example.com" />
                </div>
              </div>

              <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4B5563' }}>
                Handles are auto-expanded to full links (e.g. <span style={{ color: '#00F5FF' }}>ashutosh</span> → linkedin.com/in/ashutosh)
              </div>

              {/* Profile photo upload */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 8 }}>Profile Photo</label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', minWidth: 64, overflow: 'hidden',
                    background: '#0A0A0F', border: '2px solid #FFD60A60',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                    color: '#FFD60A',
                  }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : editing?.photo ? (
                      <img src={resolveMediaUrl(editing.photo)} alt={editing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (form.avatar || form.name || '?').trim().charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={onPhotoSelect}
                      style={{ width: '100%', color: '#9CA3AF', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {uploadingPhoto && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#FFD60A' }}>⏳ UPLOADING…</span>
                      )}
                      {photoFile && !uploadingPhoto && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#39FF14' }}>✓ NEW PHOTO READY</span>
                      )}
                      {editing?.photo && !photoFile && (
                        <button type="button" onClick={handleRemovePhoto} style={{
                          background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                          borderRadius: 6, padding: '3px 10px', fontFamily: 'var(--font-mono)',
                          fontSize: 10, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FF2D5515'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >REMOVE PHOTO</button>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4B5563', marginTop: 4 }}>
                      JPG, PNG, GIF or WEBP · max 5MB · saved when you click UPDATE
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Short Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'var(--font-body)' }} placeholder="One-liner about this member…" />
              </div>

              {formError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                  border: '1px solid #FF2D5540', color: '#FF2D55',
                  fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16,
                }}>✗ {formError}</div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: '12px', background: '#FFD60A', color: '#0A0A0F',
                  border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                  fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'SAVING…' : editing ? 'UPDATE MEMBER' : 'ADD MEMBER'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '12px 20px', background: 'transparent', color: '#6B7280',
                  border: '1px solid #1f2937', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                }}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {search ? 'No members match your search.' : 'No team members yet.'}
          </div>
          <button onClick={openNew} style={{
            padding: '10px 20px', background: '#FFD60A', color: '#0A0A0F',
            border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
          }}>+ ADD FIRST MEMBER</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Leadership section */}
          {filtered.some(m => m.section === 'leadership') && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A', letterSpacing: 3, margin: '8px 0 4px' }}>// LEADERSHIP</div>
              {filtered.filter(m => m.section === 'leadership').map(memberCard)}
            </>
          )}
          {/* Core section */}
          {filtered.some(m => m.section !== 'leadership') && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF', letterSpacing: 3, margin: '8px 0 4px' }}>// CORE_TEAM</div>
              {filtered.filter(m => m.section !== 'leadership').map(memberCard)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
