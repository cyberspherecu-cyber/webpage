import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL as API } from '../../config';
import { useToast } from '../Toast';

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const cardStyle = {
  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12,
  padding: '1.5rem', marginBottom: 20,
};

const sectionTitle = (color, text) => (
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, letterSpacing: 3, marginBottom: 16 }}>
    {text}
  </div>
);

const EMPTY_STAT = { value: '', label: '' };
const EMPTY_FEATURE = { icon: '🛡️', title: '', desc: '' };

export default function ContentManager({ token }) {
  const [content, setContent] = useState({ stats: [], features: [], about: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toast = useToast();
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchContent = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/admin/site-content`, authHeader);
      const c = res.data || {};
      setContent({
        stats: Array.isArray(c.stats) ? c.stats : [],
        features: Array.isArray(c.features) ? c.features : [],
        about: c.about || {},
      });
    } catch {
      toast.error('Failed to load site content.');
    }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = window.setTimeout(() => void fetchContent(), 0);
    return () => window.clearTimeout(id);
  }, [fetchContent]);

  const setStat = (idx, field, value) => {
    setContent(c => {
      const stats = [...c.stats];
      stats[idx] = { ...stats[idx], [field]: value };
      return { ...c, stats };
    });
    setDirty(true);
  };

  const setFeature = (idx, field, value) => {
    setContent(c => {
      const features = [...c.features];
      features[idx] = { ...features[idx], [field]: value };
      return { ...c, features };
    });
    setDirty(true);
  };

  const setAbout = (field, value) => {
    setContent(c => ({ ...c, about: { ...c.about, [field]: value } }));
    setDirty(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/api/admin/site-content`, {
        stats: content.stats.filter(s => s.value || s.label),
        features: content.features.filter(f => f.title),
        about: content.about,
      }, authHeader);
      toast.success('Site content saved.');
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save site content.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>;
  }

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>
          Edit homepage content. Changes appear instantly on the <span style={{ color: '#00F5FF' }}>/</span> page.
          {dirty && <span style={{ color: '#FFD60A', marginLeft: 8 }}>● UNSAVED</span>}
        </div>
        <button type="submit" disabled={saving} style={{
          padding: '10px 20px', background: '#7C3AED', color: '#fff',
          border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)',
          fontSize: 12, letterSpacing: 1, cursor: 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#8B5CF6'; }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#7C3AED'; }}
        >{saving ? 'SAVING…' : '💾 SAVE ALL CHANGES'}</button>
      </div>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('#00F5FF', '// HOME_STATS')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {content.stats.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={s.value} onChange={e => setStat(idx, 'value', e.target.value)} style={{ ...inputStyle, width: 120 }} placeholder="200+" />
              <input value={s.label} onChange={e => setStat(idx, 'label', e.target.value)} style={inputStyle} placeholder="Active Members" />
              <button type="button" onClick={() => {
                setContent(c => ({ ...c, stats: c.stats.filter((_, i) => i !== idx) }));
                setDirty(true);
              }} style={{
                background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                borderRadius: 6, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', height: 42,
              }}>✕</button>
            </div>
          ))}
          <div>
            <button type="button" onClick={() => {
              setContent(c => ({ ...c, stats: [...c.stats, { ...EMPTY_STAT }] }));
              setDirty(true);
            }} style={{
              background: 'transparent', border: '1px solid #00F5FF40', color: '#00F5FF',
              borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
            }}>+ ADD STAT</button>
          </div>
        </div>
      </div>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('#39FF14', '// FEATURES_GRID')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {content.features.map((f, idx) => (
            <div key={idx} style={{ background: '#0A0A0F', border: '1px solid #1f2937', borderRadius: 10, padding: '12px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={f.icon} onChange={e => setFeature(idx, 'icon', e.target.value)} style={{ ...inputStyle, width: 64, textAlign: 'center' }} placeholder="⚔️" />
                <input value={f.title} onChange={e => setFeature(idx, 'title', e.target.value)} style={inputStyle} placeholder="Feature title" />
                <button type="button" onClick={() => {
                  setContent(c => ({ ...c, features: c.features.filter((_, i) => i !== idx) }));
                  setDirty(true);
                }} style={{
                  background: 'transparent', border: '1px solid #FF2D5540', color: '#FF2D55',
                  borderRadius: 6, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
                }}>✕</button>
              </div>
              <textarea value={f.desc} onChange={e => setFeature(idx, 'desc', e.target.value)} style={{ ...inputStyle, minHeight: 52, resize: 'vertical', fontFamily: 'var(--font-body)' }} placeholder="Short description…" />
            </div>
          ))}
          <div>
            <button type="button" onClick={() => {
              setContent(c => ({ ...c, features: [...c.features, { ...EMPTY_FEATURE }] }));
              setDirty(true);
            }} style={{
              background: 'transparent', border: '1px solid #39FF1440', color: '#39FF14',
              borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
            }}>+ ADD FEATURE</button>
          </div>
        </div>
      </div>

      {/* ─── ABOUT SECTION ─────────────────────────────────────────────── */}
      <div style={cardStyle}>
        {sectionTitle('#FFD60A', '// ABOUT_SECTION')}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>
            Heading <span style={{ color: '#9CA3AF' }}>(HTML allowed, e.g. <code>Where Hackers&lt;br/&gt;Become Defenders</code>)</span>
          </label>
          <input value={content.about.title || ''} onChange={e => setAbout('title', e.target.value)} style={inputStyle} placeholder="Where Hackers Become Defenders" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Paragraph 1</label>
          <textarea value={content.about.paragraph1 || ''} onChange={e => setAbout('paragraph1', e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'var(--font-body)' }} placeholder="About the club…" />
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Paragraph 2</label>
          <textarea value={content.about.paragraph2 || ''} onChange={e => setAbout('paragraph2', e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'var(--font-body)' }} placeholder="More about the club…" />
        </div>
      </div>

      {/* Live preview */}
      <div style={{ background: 'var(--navy)', border: '1px solid #1f2937', borderRadius: 12, padding: '1.5rem' }}>
        {sectionTitle('#6B7280', '// LIVE_PREVIEW')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 16 }}>
          {(content.stats.length ? content.stats : [{ value: '—', label: 'No stats' }]).map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: '#00F5FF' }}>{s.value || '—'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 1, marginTop: 4 }}>{(s.label || '').toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {(content.features.length ? content.features : [{ icon: '🛡️', title: 'No features', desc: '' }]).map((f, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon || '🛡️'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 4 }}>{f.title || 'Untitled'}</div>
              <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
