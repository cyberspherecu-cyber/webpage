import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';

const TAG_COLORS = {
  announcement: '#00F5FF',
  tutorial: '#39FF14',
  writeup: '#7C3AED',
  ctf: '#FF2D55',
  event: '#FFD60A',
  workshop: '#FF8C00',
  news: '#8B5CF6',
  general: '#6B7280',
};

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  useEffect(() => {
    axios.get(`${API}/api/blog`)
      .then(r => setPosts(r.data || []))
      .catch(() => setError('Failed to load blog posts.'))
      .finally(() => setLoading(false));
  }, []);

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))];
  const filtered = posts.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.excerpt?.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTag !== 'all' && !(p.tags || []).includes(activeTag)) return false;
    return true;
  });

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4 }}>{'>'} LOADING POSTS...</div>
          <div style={{ width: 32, height: 32, border: '2px solid #1f2937', borderTopColor: '#00F5FF', borderRadius: '50%', margin: '20px auto', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Blog Unavailable</h2>
          <p style={{ color: '#6B7280', lineHeight: 1.7 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* HEADER */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B5CF6', letterSpacing: 4, marginBottom: 12 }}>// BLOG</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: 16 }}>
            Cyber<span style={{ color: '#8B5CF6' }}>Sphere</span> Blog
          </h1>
          <p style={{ color: '#6B7280', maxWidth: 600, lineHeight: 1.7 }}>
            Announcements, CTF writeups, tutorials, and club updates. Stay connected with the Cysecsphere community.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {/* Search + Tags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTag('all')} style={{
              padding: '6px 14px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 11,
              background: activeTag === 'all' ? '#8B5CF620' : 'transparent',
              color: activeTag === 'all' ? '#8B5CF6' : '#6B7280',
              border: `1px solid ${activeTag === 'all' ? '#8B5CF650' : '#1f2937'}`,
              cursor: 'pointer', letterSpacing: 1, transition: 'all 0.2s',
            }}>ALL</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)} style={{
                padding: '6px 14px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 11,
                background: activeTag === tag ? `${TAG_COLORS[tag] || '#6B7280'}20` : 'transparent',
                color: activeTag === tag ? (TAG_COLORS[tag] || '#6B7280') : '#6B7280',
                border: `1px solid ${activeTag === tag ? `${TAG_COLORS[tag] || '#6B7280'}50` : '#1f2937'}`,
                cursor: 'pointer', letterSpacing: 1, transition: 'all 0.2s',
              }}>{tag.toUpperCase()}</button>
            ))}
          </div>
          <input
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '10px 16px', background: '#0A0A0F', border: '1px solid #1f2937',
              borderRadius: 8, color: '#E2E8F0', fontFamily: 'var(--font-mono)', fontSize: 13,
              outline: 'none', width: 240, maxWidth: '100%',
            }}
          />
        </div>

        {/* Posts Grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280' }}>No posts found.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map(post => {
              const tag = (post.tags || [])[0];
              const tagColor = TAG_COLORS[tag] || '#6B7280';
              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  style={{
                    background: 'var(--card)', border: `1px solid ${tagColor}15`,
                    borderRadius: 12, padding: '1.5rem', textDecoration: 'none',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${tagColor}40`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${tagColor}15`; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {(post.tags || []).slice(0, 2).map(t => (
                      <span key={t} style={{
                        background: `${TAG_COLORS[t] || '#6B7280'}15`,
                        color: TAG_COLORS[t] || '#6B7280',
                        borderRadius: 4, padding: '2px 8px',
                        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
                      }}>{t}</span>
                    ))}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E2E8F0', marginBottom: 10, lineHeight: 1.4 }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                    {post.excerpt || post.content?.substring(0, 150).replace(/[#*`\[\]]/g, '') + '...'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>
                    <span>✍ {post.author || 'Admin'}</span>
                    <span>{fmtDate(post.createdAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
