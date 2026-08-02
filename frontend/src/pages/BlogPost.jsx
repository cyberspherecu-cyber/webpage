import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
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

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/blog/${encodeURIComponent(slug)}`)
      .then(r => setPost(r.data))
      .catch(err => {
        if (err.response?.status === 404) setError('Post not found.');
        else setError('Failed to load post.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #1f2937', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Post Not Found</h2>
          <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.7 }}>{error}</p>
          <Link to="/blog" style={{
            padding: '12px 24px', background: '#8B5CF6', color: '#fff',
            fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
            borderRadius: 8, textDecoration: 'none', display: 'inline-block',
          }}>← BACK TO BLOG</Link>
        </div>
      </div>
    );
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Render markdown content (sanitized with DOMPurify)
  let html;
  try {
    html = DOMPurify.sanitize(marked.parse(post.content || '', { breaks: true, gfm: true }));
  } catch {
    html = DOMPurify.sanitize(post.content || '');
  }

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <Link to="/blog" style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280',
          textDecoration: 'none', marginBottom: 24, display: 'inline-block',
        }}>← BACK TO BLOG</Link>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {(post.tags || []).map(tag => (
              <span key={tag} style={{
                background: `${TAG_COLORS[tag] || '#6B7280'}15`,
                color: TAG_COLORS[tag] || '#6B7280',
                borderRadius: 4, padding: '3px 10px',
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
              }}>{tag}</span>
            ))}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
            fontWeight: 900, lineHeight: 1.2, marginBottom: 16,
          }}>{post.title}</h1>
          <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>
            <span>✍ {post.author || 'Admin'}</span>
            <span>📅 {fmtDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1f2937', marginBottom: 32 }} />

        {/* Markdown Content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ lineHeight: 1.9, fontSize: 15, color: '#D1D5DB' }}
        />

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1f2937' }}>
          <Link to="/blog" style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B5CF6',
            textDecoration: 'none',
          }}>← Back to all posts</Link>
        </div>
      </div>

      {/* Markdown Styles */}
      <style>{`
        .blog-content h1, .blog-content h2, .blog-content h3 {
          font-family: 'Orbitron', sans-serif;
          color: #E2E8F0;
          margin: 32px 0 16px;
          font-weight: 700;
        }
        .blog-content h1 { font-size: 1.8rem; }
        .blog-content h2 { font-size: 1.4rem; color: #00F5FF; }
        .blog-content h3 { font-size: 1.1rem; color: #39FF14; }
        .blog-content p { margin-bottom: 16px; }
        .blog-content a { color: #8B5CF6; text-decoration: underline; }
        .blog-content a:hover { color: #00F5FF; }
        .blog-content code {
          background: #1f2937; padding: 2px 6px; border-radius: 4px;
          font-family: 'Share Tech Mono', monospace; font-size: 13px; color: #39FF14;
        }
        .blog-content pre {
          background: #0A0A0F; border: 1px solid #1f2937; border-radius: 8px;
          padding: 1.2rem; overflow-x: auto; margin-bottom: 20px;
        }
        .blog-content pre code {
          background: none; padding: 0; color: #E2E8F0; font-size: 13px;
        }
        .blog-content blockquote {
          border-left: 3px solid #8B5CF6; padding-left: 16px; margin: 20px 0;
          color: #9CA3AF; font-style: italic;
        }
        .blog-content ul, .blog-content ol { margin: 12px 0 16px 24px; }
        .blog-content li { margin-bottom: 6px; }
        .blog-content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
        .blog-content table {
          width: 100%; border-collapse: collapse; margin: 20px 0;
        }
        .blog-content th, .blog-content td {
          padding: 10px 14px; border: 1px solid #1f2937; text-align: left;
        }
        .blog-content th { background: #0D1117; font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #6B7280; }
        .blog-content hr { border: none; border-top: 1px solid #1f2937; margin: 32px 0; }
      `}</style>
    </div>
  );
}
