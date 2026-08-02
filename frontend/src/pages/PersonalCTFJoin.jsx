import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/Toast';

export default function PersonalCTFJoin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [accessId, setAccessId] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Login Required</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>You need a CTF account to join a Personal CTF.</p>
          <Link to="/login" style={{ padding: '12px 24px', background: '#00F5FF', color: '#000', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>LOG IN</Link>
        </div>
      </div>
    );
  }

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!accessId || !accessPassword) {
      setError('Both Event ID and Password are required.');
      return;
    }
    setJoining(true);
    try {
      const res = await axios.post(`${API}/api/personal-ctf/join`,
        { accessId: accessId.trim(), accessPassword: accessPassword.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('cysecsphere_token')}` } }
      );
      if (res.data.success) {
        toast.success('Joined! Redirecting to arena…');
        setTimeout(() => navigate(`/arenas/${res.data.ctfId}`), 800);
      } else {
        setError(res.data.message || 'Failed to join.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join. Check your credentials.');
    }
    setJoining(false);
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Link to="/arenas" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← BACK TO ARENAS</Link>

        <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16, padding: '2.5rem' }}>
          <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚔️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Join Personal CTF</h2>
          <p style={{ color: '#6B7280', textAlign: 'center', fontSize: 13, marginBottom: 28 }}>
            Enter the Event ID and Password shared by the organizer.
          </p>

          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 6 }}>EVENT ID</label>
              <input
                value={accessId}
                onChange={e => setAccessId(e.target.value.toUpperCase())}
                placeholder="e.g. PWN-FRIDAY-01"
                style={{
                  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
                  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  letterSpacing: 2,
                }}
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 6 }}>ACCESS PASSWORD</label>
              <input
                type="password"
                value={accessPassword}
                onChange={e => setAccessPassword(e.target.value)}
                placeholder="Enter the password"
                style={{
                  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
                  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
                  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF2D5515', border: '1px solid #FF2D5540', color: '#FF2D55', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={joining}
              style={{
                width: '100%', padding: '14px', background: '#00F5FF', color: '#000', border: 'none', borderRadius: 8,
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
                opacity: joining ? 0.7 : 1, transition: 'all 0.2s',
              }}
            >
              {joining ? 'JOINING…' : 'JOIN ARENA'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
