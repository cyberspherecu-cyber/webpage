import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/Toast';

const diffColors = {
  Easy: { bg: '#39FF1415', text: '#39FF14' },
  Medium: { bg: '#FFD60A15', text: '#FFD60A' },
  Hard: { bg: '#FF2D5515', text: '#FF2D55' },
};

const catColors = {
  Cryptography: '#7C3AED', 'Reverse Engineering': '#FF6B6B', 'Web Security': '#00F5FF',
  'Network Forensics': '#39FF14', Pwn: '#FF2D55', Forensics: '#FFD60A', Misc: '#6B7280',
};

export default function PersonalCTFArena() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [ctf, setCtf] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flagResult, setFlagResult] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('cysecsphere_token')}` } };

  const fetchCtf = () => {
    axios.get(`${API}/api/personal-ctf/${id}`, authHeader)
      .then(r => { setCtf(r.data); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load CTF.'))
      .finally(() => setLoading(false));
  };

  const fetchLeaderboard = () => {
    axios.get(`${API}/api/personal-ctf/${id}/leaderboard`, authHeader)
      .then(r => setLeaderboard(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCtf();
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // refresh leaderboard every 10s
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!flagInput.trim()) return;
    setSubmitting(true);
    setFlagResult('');
    try {
      const res = await axios.post(`${API}/api/personal-ctf/${id}/submit-flag`,
        { challengeIdx: selectedChallenge, flag: flagInput.trim() },
        authHeader
      );
      setFlagResult(res.data);
      if (res.data.success) {
        setFlagInput('');
        fetchCtf(); // refresh challenge solved state
        fetchLeaderboard();
      }
    } catch (err) {
      setFlagResult({ success: false, message: err.response?.data?.message || 'Submission failed.' });
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Login Required</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Please log in to access this CTF arena.</p>
          <Link to="/login" style={{ padding: '12px 24px', background: '#00F5FF', color: '#000', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>LOG IN</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 120, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #1f2937', borderTopColor: '#00F5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
          <p style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12 }}>LOADING ARENA…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ paddingTop: 120, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{error}</h2>
          <Link to="/arenas" style={{ color: '#00F5FF', fontFamily: 'var(--font-mono)', fontSize: 13 }}>← BACK TO ARENAS</Link>
        </div>
      </div>
    );
  }

  const endsAt = new Date(ctf.endsAt);
  const now = new Date();
  const timeRemaining = endsAt - now;
  const hoursLeft = Math.floor(timeRemaining / 3600000);
  const minsLeft = Math.floor((timeRemaining % 3600000) / 60000);

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Link to="/arenas" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', textDecoration: 'none', display: 'inline-block', marginBottom: 10 }}>← ARENAS</Link>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, marginBottom: 4 }}>{ctf.title}</h1>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{ctf.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {ctf.isActive ? (
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF', display: 'block', marginBottom: 4 }}>
                  ⏱ {hoursLeft}h {minsLeft}m remaining
                </span>
                <span style={{ padding: '4px 12px', borderRadius: 4, background: '#00F5FF15', border: '1px solid #00F5FF40', color: '#00F5FF', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
              </div>
            ) : ctf.isEnded ? (
              <span style={{ padding: '4px 12px', borderRadius: 4, background: '#6B728015', border: '1px solid #6B728040', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ENDED</span>
            ) : (
              <span style={{ padding: '4px 12px', borderRadius: 4, background: '#FFD60A15', border: '1px solid #FFD60A40', color: '#FFD60A', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>UPCOMING</span>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', marginTop: 6 }}>👥 {ctf.participantCount} participants</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Challenges */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Challenges ({ctf.challenges?.length || 0})
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {ctf.challenges?.map((ch, idx) => {
              const dc = diffColors[ch.difficulty] || diffColors.Medium;
              const catColor = catColors[ch.category] || '#6B7280';
              return (
                <div
                  key={idx}
                  onClick={() => ctf.isActive && setSelectedChallenge(selectedChallenge === idx ? null : idx)}
                  style={{
                    background: selectedChallenge === idx ? '#ffffff08' : 'var(--card)',
                    border: `1px solid ${selectedChallenge === idx ? '#374151' : '#1f2937'}`,
                    borderRadius: 10, padding: '1rem 1.25rem', cursor: ctf.isActive ? 'pointer' : 'default',
                    transition: 'all 0.2s', opacity: ch.solved ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: catColor }}></div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, margin: 0 }}>
                        {ch.title} {ch.solved && <span style={{ color: '#39FF14', fontSize: 12, marginLeft: 6 }}>✓ SOLVED</span>}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: dc.bg, color: dc.text, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{ch.difficulty}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#00F5FF' }}>+{ch.points}</span>
                    </div>
                  </div>
                  <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>{ch.category}</p>

                  {/* Expanded challenge */}
                  {selectedChallenge === idx && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1f2937' }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{ch.description}</p>
                      {ch.hint && (
                        <details style={{ marginBottom: 16 }}>
                          <summary style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A', cursor: 'pointer' }}>🔍 HINT</summary>
                          <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8, padding: '8px 12px', background: '#FFD60A08', borderRadius: 6 }}>{ch.hint}</p>
                        </details>
                      )}

                      {ctf.isActive && (
                        <form onSubmit={handleSubmitFlag} style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={flagInput}
                            onChange={e => setFlagInput(e.target.value)}
                            placeholder="CSPHERE{...}"
                            style={{
                              flex: 1, background: '#0A0A0F', border: '1px solid #1f2937', color: '#E2E8F0',
                              padding: '10px 12px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13,
                              outline: 'none',
                            }}
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            style={{
                              padding: '10px 18px', background: '#00F5FF', color: '#000', border: 'none',
                              borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', opacity: submitting ? 0.7 : 1, whiteSpace: 'nowrap',
                            }}
                          >{submitting ? '…' : 'SUBMIT'}</button>
                        </form>
                      )}
                      {flagResult && (
                        <div style={{
                          marginTop: 10, padding: '8px 12px', borderRadius: 6,
                          background: flagResult.success ? '#39FF1410' : '#FF2D5510',
                          border: `1px solid ${flagResult.success ? '#39FF1440' : '#FF2D5540'}`,
                          color: flagResult.success ? '#39FF14' : '#FF2D55',
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                        }}>
                          {flagResult.success ? '✓ ' : '✗ '}{flagResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div style={{
            background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, padding: '1.25rem',
            position: 'sticky', top: 88,
          }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A', letterSpacing: 2, marginBottom: 16 }}>// LEADERBOARD</h3>
            {leaderboard.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', padding: '2rem 0' }}>No participants yet</p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {leaderboard.map((p, i) => (
                  <div key={p.username} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 8, background: p.username === user?.username ? '#00F5FF08' : 'transparent',
                    border: p.username === user?.username ? '1px solid #00F5FF20' : 'none',
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: i === 0 ? '#FFD60A' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : '#1f2937',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: i <= 2 ? '#000' : '#6B7280',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <Link to={`/profile/${p.username}`} style={{ textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E2E8F0', display: 'block', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#00F5FF'}
                        onMouseLeave={e => e.currentTarget.style.color = '#E2E8F0'}
                      >
                        {p.username} {p.username === user?.username && <span style={{ color: '#00F5FF', fontSize: 10 }}>(YOU)</span>}
                      </span>
                    </Link>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#00F5FF', display: 'block' }}>{p.score}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280' }}>{p.solved} solved</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
