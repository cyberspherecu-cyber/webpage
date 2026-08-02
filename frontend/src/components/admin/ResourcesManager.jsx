import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL as API } from '../../config';
import { useToast } from '../Toast';

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const CATEGORY_OPTIONS = [
  { key: 'linux', label: 'Linux Basics', color: '#FFD60A' },
  { key: 'network', label: 'Network Scanning', color: '#39FF14' },
  { key: 'web', label: 'Web Security', color: '#FF2D55' },
  { key: 'crypto', label: 'Cryptography', color: '#7C3AED' },
  { key: 'reverse', label: 'Reverse Engineering', color: '#FF8C00' },
  { key: 'forensics', label: 'Forensics', color: '#00F5FF' },
  { key: 'study', label: 'Study Resources', color: '#39FF14' },
];

const EMPTY_LINK = { name: '', url: '', desc: '' };

export default function ResourcesManager({ token, onDataChange }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: 'study', title: '', desc: '', code: '', links: [] });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchResources = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/resources`, authHeader);
      setResources(res.data || []);
      if (onDataChange) onDataChange((res.data || []).length);
    } catch {
      toast.error('Failed to load resources.');
    }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = window.setTimeout(() => void fetchResources(), 0);
    return () => window.clearTimeout(id);
  }, [fetchResources]);

  const filtered = resources.filter(r => {
    if (catFilter !== 'all' && r.category !== catFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.title, r.desc, r.category].some(v => String(v || '').toLowerCase().includes(q));
  });

  const catColor = (key) => (CATEGORY_OPTIONS.find(c => c.key === key) || {}).color || '#00F5FF';
  const catLabel = (key) => (CATEGORY_OPTIONS.find(c => c.key === key) || {}).label || key;

  const openNew = () => {
    setEditing(null);
    setForm({ category: 'study', title: '', desc: '', code: '', links: [] });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      category: r.category || 'study',
      title: r.title || '',
      desc: r.desc || '',
      code: r.code || '',
      links: Array.isArray(r.links) ? r.links.map(l => ({ ...EMPTY_LINK, ...l })) : [],
    });
    setFormError('');
    setShowForm(true);
  };

  const setLink = (idx, field, value) => {
    setForm(f => {
      const links = [...f.links];
      links[idx] = { ...links[idx], [field]: value };
      return { ...f, links };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title) { setFormError('Title is required.'); return; }
    const payload = {
      category: form.category,
      title: form.title,
      desc: form.desc,
      code: form.code || null,
      links: form.links.filter(l => l.name || l.url).map(l => ({
        name: l.name, url: l.url, desc: l.desc,
      })),
    };
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`${API}/api/admin/resources/${editing.id}`, payload, authHeader);
        toast.success('Resource updated.');
      } else {
        await axios.post(`${API}/api/admin/resources`, payload, authHeader);
        toast.success('Resource created.');
      }
      setShowForm(false);
      setEditing(null);
      fetchResources();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save resource.');
    }
    setSaving(false);
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete resource "${r.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/resources/${r.id}`, authHeader);
      toast.success('Resource deleted.');
      fetchResources();
    } catch {
      toast.error('Failed to delete resource.');
    }
  };

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>
          Curate commands & study material shown on the <span style={{ color: '#00F5FF' }}>/resources</span> page.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 200 }}
          />
          <button onClick={openNew} style={{
            padding: '8px 16px', background: '#39FF1420', color: '#39FF14',
            border: '1px solid #39FF1450', borderRadius: 8, fontFamily: 'var(--font-mono)',
            fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#39FF1430'}
            onMouseLeave={e => e.currentTarget.style.background = '#39FF1420'}
          >+ NEW RESOURCE</button>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {[{ key: 'all', label: 'All', color: '#6B7280' }, ...CATEGORY_OPTIONS].map(c => (
          <button key={c.key} onClick={() => setCatFilter(c.key)} style={{
            padding: '5px 12px', background: catFilter === c.key ? `${c.color}20` : 'transparent',
            color: catFilter === c.key ? c.color : '#6B7280',
            border: `1px solid ${catFilter === c.key ? `${c.color}50` : '#1f2937'}`,
            borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>{c.label}</button>
        ))}
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
            padding: '2rem', maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#39FF14', letterSpacing: 2, marginBottom: 4 }}>
                  {editing ? '// EDIT_RESOURCE' : '// NEW_RESOURCE'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                  {editing ? 'Edit Resource' : 'Create Resource'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              }}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required placeholder="e.g. Nmap Basics" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Description</label>
                <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} style={inputStyle} placeholder="Short description shown on the card" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                  Command / Code Block <span style={{ color: '#9CA3AF' }}>(leave empty for link-based resources)</span>
                </label>
                <textarea value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} style={{ ...inputStyle, minHeight: 130, resize: 'vertical', fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }} placeholder={'pwd                     # Print working directory\nls -la                  # List files with details'} />
              </div>

              {/* Links editor */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block' }}>Resource Links</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, links: [...f.links, { ...EMPTY_LINK }] }))} style={{
                    background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                    borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                  }}>+ ADD LINK</button>
                </div>
                {form.links.length === 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4B5563', padding: '8px 0' }}>
                    No links yet — add links for platforms, courses, books, etc.
                  </div>
                )}
                {form.links.map((link, idx) => (
                  <div key={idx} style={{
                    background: '#0A0A0F', border: '1px solid #1f2937', borderRadius: 8,
                    padding: '10px', marginBottom: 8,
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input value={link.name} onChange={e => setLink(idx, 'name', e.target.value)} style={inputStyle} placeholder="Link name" />
                      <input value={link.url} onChange={e => setLink(idx, 'url', e.target.value)} style={inputStyle} placeholder="https://…" />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={link.desc} onChange={e => setLink(idx, 'desc', e.target.value)} style={inputStyle} placeholder="Short description" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, links: f.links.filter((_, i) => i !== idx) }))} style={{
                        background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                        borderRadius: 6, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>✕</button>
                    </div>
                  </div>
                ))}
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
                  flex: 1, padding: '12px', background: '#39FF14', color: '#0A0A0F',
                  border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                  fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'SAVING…' : editing ? 'UPDATE RESOURCE' : 'CREATE RESOURCE'}
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

      {/* Resources list */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {search || catFilter !== 'all' ? 'No resources match your filters.' : 'No resources yet.'}
          </div>
          <button onClick={openNew} style={{
            padding: '10px 20px', background: '#39FF14', color: '#0A0A0F',
            border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
          }}>+ CREATE FIRST RESOURCE</button>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TITLE</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>CATEGORY</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, borderBottom: '1px solid #1f2937' }}>TYPE</th>
                <th style={{ borderBottom: '1px solid #1f2937' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1f293780', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0A0A0F'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600 }}>{r.title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${catColor(r.category)}15`, color: catColor(r.category), borderRadius: 4,
                      padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 11,
                    }}>{catLabel(r.category).toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {r.code ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF' }}>⌨ CODE</span>
                    ) : (r.links && r.links.length) ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#39FF14' }}>🔗 {r.links.length} LINKS</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(r)} style={{
                      background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
                      borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)',
                      fontSize: 11, cursor: 'pointer', marginRight: 6, transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#00F5FF15'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >EDIT</button>
                    <button onClick={() => handleDelete(r)} style={{
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
        </div>
      )}
    </div>
  );
}
