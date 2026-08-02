import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '', college: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/challenges';

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(form);
      } else {
        await login({ username: form.username, password: form.password });
      }
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      paddingTop: 72, minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 2rem 3rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: 'var(--card)',
        border: '1px solid #1f2937', borderRadius: 16, padding: '2.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(0,245,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 8, textAlign: 'center' }}>
            // CTF_ACCESS
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>
            {mode === 'login' ? 'Welcome Back, ' : 'Join the '}<span style={{ color: '#00F5FF' }}>{mode === 'login' ? 'Hacker' : 'Arena'}</span>
          </h1>
          <p style={{ color: '#6B7280', textAlign: 'center', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
            {mode === 'login'
              ? 'Log in to submit flags and track your rank.'
              : 'Create an account to start capturing flags and climb the leaderboard.'}
          </p>

          {/* Toggle */}
          <div style={{ display: 'flex', background: '#0A0A0F', borderRadius: 8, padding: 4, marginBottom: 24, border: '1px solid #1f2937' }}>
            {['login', 'signup'].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '9px 0', background: mode === m ? '#00F5FF15' : 'transparent',
                color: mode === m ? '#00F5FF' : '#6B7280', border: mode === m ? '1px solid #00F5FF40' : '1px solid transparent',
                borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1.5,
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
              }}>{m === 'login' ? 'Log In' : 'Sign Up'}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <input placeholder="Username" value={form.username} onChange={update('username')} style={inputStyle} required />
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <input type="email" placeholder="Email" value={form.email} onChange={update('email')} style={inputStyle} required />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <input type="password" placeholder="Password" value={form.password} onChange={update('password')} style={inputStyle} required minLength={6} />
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <input placeholder="College (optional)" value={form.college} onChange={update('college')} style={inputStyle} />
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                border: '1px solid #FF2D5540', color: '#FF2D55',
                fontFamily: 'var(--font-mono)', fontSize: 12.5, marginBottom: 16,
              }}>✗ {error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', background: '#00F5FF', color: '#0A0A0F',
              border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
              fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}>
              {loading ? 'PLEASE WAIT…' : mode === 'login' ? 'LOG IN →' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/challenges" style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12, textDecoration: 'none' }}>
              ← Back to CTF Arena
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
