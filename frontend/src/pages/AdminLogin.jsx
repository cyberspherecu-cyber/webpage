import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';

const ADMIN_TOKEN_KEY = 'cysecsphere_admin_token';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/admin/login`, { email, password });
      localStorage.setItem(ADMIN_TOKEN_KEY, r.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reach the server.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid effect */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      
      {/* Glowing orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '30%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 420,
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Terminal header */}
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #00F5FF30',
          borderRadius: '12px 12px 0 0',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: 'none',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#FF5F56', '#FFBD2E', '#27C93F'].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: '#6B7280', letterSpacing: 1, marginLeft: 8,
          }}>
            admin@cysecsphere:~$ <span style={{ color: '#00F5FF' }}>./login.sh</span>
          </div>
        </div>

        {/* Login card */}
        <div style={{
          background: 'linear-gradient(180deg, #0D1117 0%, #0A0A0F 100%)',
          border: '1px solid #1f2937',
          borderRadius: '0 0 12px 12px',
          padding: '2.5rem 2rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: '#FF2D55', letterSpacing: 4,
              background: '#FF2D5515', border: '1px solid #FF2D5540',
              borderRadius: 4, padding: '4px 12px', marginBottom: 16,
            }}>
              // RESTRICTED_ACCESS
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              fontWeight: 900, marginBottom: 8,
            }}>
              Admin <span style={{ color: '#00F5FF' }}>Portal</span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: '#6B7280', letterSpacing: 1,
            }}>
              Authorized personnel only
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: '#6B7280', letterSpacing: 1, display: 'block', marginBottom: 6,
              }}>
                $ ADMIN_EMAIL
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: '#0A0A0F', border: '1px solid #1f2937',
                borderRadius: 8, padding: '0 12px',
                transition: 'border-color 0.2s',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13,
                  color: '#6B7280', marginRight: 8,
                }}>📧</span>
                <input
                  type="email"
                  placeholder="admin@cysecsphere.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent', border: 'none',
                    color: '#E2E8F0', padding: '12px 0',
                    fontFamily: 'var(--font-mono)', fontSize: 13,
                    outline: 'none',
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: '#6B7280', letterSpacing: 1, display: 'block', marginBottom: 6,
              }}>
                $ ADMIN_PASSWORD
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: '#0A0A0F', border: '1px solid #1f2937',
                borderRadius: 8, padding: '0 12px',
                transition: 'border-color 0.2s',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13,
                  color: '#6B7280', marginRight: 8,
                }}>🔑</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent', border: 'none',
                    color: '#E2E8F0', padding: '12px 0',
                    fontFamily: 'var(--font-mono)', fontSize: 13,
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: '#FF2D5515', border: '1px solid #FF2D5540',
                color: '#FF2D55', fontFamily: 'var(--font-mono)',
                fontSize: 12, marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>✗</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#00F5FF60' : 'linear-gradient(135deg, #00F5FF, #00B4D8)',
                color: '#0A0A0F',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.boxShadow = '0 0 30px #00F5FF60';
              }}
              onMouseLeave={e => {
                if (!loading) e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    border: '2px solid #0A0A0F', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  AUTHENTICATING…
                </span>
              ) : 'ACCESS GRANT →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/" style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: '#374151', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#6B7280'}
              onMouseLeave={e => e.currentTarget.style.color = '#374151'}
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 20,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: '#1f2937', letterSpacing: 1,
        }}>
          <span style={{ color: '#FF2D5540' }}>⚠</span> UNAUTHORIZED ACCESS IS PROHIBITED
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
