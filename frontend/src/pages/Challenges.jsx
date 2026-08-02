import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { API_URL as API } from '../config';
import GhostWall from '../components/GhostWall';

const TABS = ['challenges', 'leaderboard', 'ghosts'];

const CAT_COLORS = {
  'Web Security': '#00F5FF',
  'Pwn': '#FF8C00',
  'Cryptography': '#7C3AED',
  'Reverse Engineering': '#FFD60A',
  'Network Forensics': '#FF2D55',
  'Forensics': '#39FF14',
  'OSINT': '#FF6B6B',
  'Misc': '#8B5CF6',
};

const DIFF_STYLES = {
  Easy: { color: '#39FF14', bg: '#39FF1415' },
  Medium: { color: '#FFD60A', bg: '#FFD60A15' },
  Hard: { color: '#FF2D55', bg: '#FF2D5515' },
  Insane: { color: '#FF8C00', bg: '#FF8C0015' },
};

const catColor = (c) => CAT_COLORS[c] || '#00F5FF';
const diffStyle = (d) => DIFF_STYLES[d] || DIFF_STYLES.Medium;

// Week number since the club's first challenge week (2024-01-01). Used for the
// "WEEK #N" label so it stays accurate instead of a hardcoded number.
function currentWeekNumber() {
  const start = new Date('2024-01-01T00:00:00');
  const now = new Date();
  return Math.max(1, Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

const BADGE_COLORS = {
  'Elite Hacker': '#FFD60A',
  'Master': '#FF2D55',
  'Expert': '#00F5FF',
  'Advanced': '#7C3AED',
  'Intermediate': '#39FF14',
  'Rookie': '#6B7280',
};

/* Backend API returns real challenges and leaderboard. Empty states shown when no data. */

export default function Challenges() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [leadTab, setLeadTab] = useState('all');
  const [activeTab, setActiveTab] = useState('challenges');
  const [selected, setSelected] = useState(null);
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [catFilter, setCatFilter] = useState('all');
  const [ghostCompletions, setGhostCompletions] = useState([]);
  const [ghostCount, setGhostCount] = useState(0);
  const [ghostLoading, setGhostLoading] = useState(false);

  const fetchData = () => {
    axios.get(`${API}/api/challenges`)
      .then(r => setChallenges(r.data || []))
      .catch(() => setChallenges([]));
    axios.get(`${API}/api/leaderboard`)
      .then(r => setLeaderboard(r.data || []))
      .catch(() => setLeaderboard([]));
    axios.get(`${API}/api/leaderboard/weekly`)
      .then(r => setWeeklyLeaderboard(r.data || []))
      .catch(() => setWeeklyLeaderboard([]));
  };

  const fetchGhosts = () => {
    setGhostLoading(true);
    axios.get(`${API}/api/ghost-completions`)
      .then(r => {
        if (r.data?.success) {
          setGhostCompletions(r.data.completions || []);
          setGhostCount(r.data.count || 0);
        }
      })
      .catch(() => {})
      .finally(() => setGhostLoading(false));
  };

  // Support deep-linking to tabs via URL hash (e.g. /challenges#ghosts)
  useEffect(() => {
    const id = window.setTimeout(() => {
      const t = window.location.hash.replace('#', '');
      if (TABS.includes(t)) setActiveTab(t);
      fetchData();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Load the Wall of Fame whenever its tab is opened
  useEffect(() => {
    if (activeTab !== 'ghosts') return;
    const id = window.setTimeout(() => void fetchGhosts(), 0);
    return () => window.clearTimeout(id);
  }, [activeTab]);

  const handleTab = (t) => {
    setActiveTab(t);
    window.history.replaceState(null, '', `#${t}`);
  };

  const handleSubmit = async () => {
    if (!user || !flag || !selected) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const r = await axios.post(
        `${API}/api/submit-flag`,
        { challengeId: selected.id, flag },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: r.data.success ? 'success' : 'error', text: r.data.message });
      if (r.data.success) { fetchData(); if (selected.ghost) fetchGhosts(); setFlag(''); }
    } catch (err) {
      if (err.response?.status === 401) {
        setMsg({ type: 'error', text: 'Your session expired. Please log in again.' });
      } else {
        setMsg({ type: 'error', text: err.response?.data?.message || 'Server error. Try again.' });
      }
    }
    setSubmitting(false);
  };

  const cats = ['all', ...new Set(challenges.map(c => c.category))];
  const filtered = catFilter === 'all' ? challenges : challenges.filter(c => c.category === catFilter);

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF2D55', letterSpacing: 4, marginBottom: 12 }}>// CTF_ARENA</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900 }}>
              Weekly <span style={{ color: '#FF2D55' }}>CTF</span> Challenges
            </h1>
            <p style={{ color: '#6B7280', marginTop: 12, maxWidth: 600, lineHeight: 1.7 }}>
              New challenges drop every Monday. Capture the flag, earn points, climb the leaderboard.
            </p>
          </div>
          <div style={{ background: '#FF2D5520', border: '1px solid #FF2D5540', borderRadius: 8, padding: '12px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 2 }}>WEEK #{currentWeekNumber()} ENDS IN</div>
            <WeekTimer />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #1f2937', background: 'var(--navy)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          {[
            { key: 'challenges', label: 'Challenges' },
            { key: 'leaderboard', label: 'Leaderboard' },
            { key: 'ghosts', label: 'Wall of Fame' },
          ].map(t => (
            <button key={t.key} onClick={() => handleTab(t.key)} style={{
              padding: '16px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === t.key ? '2px solid #00F5FF' : '2px solid transparent',
              color: activeTab === t.key ? '#00F5FF' : '#6B7280',
              fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 2, cursor: 'pointer',
              textTransform: 'uppercase', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' }}>
        {activeTab === 'challenges' && (
          <>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: '6px 16px', border: `1px solid ${catFilter === c ? catColor(c) : '#1f2937'}`,
                  background: catFilter === c ? `${catColor(c)}20` : 'transparent',
                  color: catFilter === c ? catColor(c) : '#6B7280',
                  borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                }}>{c.toUpperCase()}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filtered.map(ch => (
                <ChallengeCard key={ch.id} ch={ch} onClick={() => { setSelected(ch); setMsg(null); setFlag(''); }} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'ghosts' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#7C3AED', letterSpacing: 4 }}>// GHOST_PROTOCOL</div>
              <span style={{ flex: 1, height: 1, background: '#7C3AED25' }} />
              <Link to="/ghost-protocol" style={{
                padding: '8px 16px', background: '#7C3AED20', color: '#7C3AED',
                border: '1px solid #7C3AED50', borderRadius: 8, fontFamily: 'var(--font-mono)',
                fontSize: 11, letterSpacing: 1, textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#7C3AED35'}
                onMouseLeave={e => e.currentTarget.style.background = '#7C3AED20'}
              >👻 ATTEMPT THE PROTOCOL</Link>
            </div>
            <GhostWall completions={ghostCompletions} count={ghostCount} loading={ghostLoading} />
          </>
        )}

        {activeTab === 'leaderboard' && (
          <>
            {/* Sub-tabs: All Time / This Week */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
              {[
                { key: 'all', label: 'All Time', color: '#00F5FF' },
                { key: 'weekly', label: 'This Week', color: '#39FF14' },
              ].map(t => (
                <button key={t.key} onClick={() => setLeadTab(t.key)} style={{
                  padding: '8px 20px',
                  background: leadTab === t.key ? `${t.color}20` : 'transparent',
                  color: leadTab === t.key ? t.color : '#6B7280',
                  border: `1px solid ${leadTab === t.key ? t.color + '60' : '#1f2937'}`,
                  borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 12,
                  letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                }}>{t.label}</button>
              ))}
            </div>
            <Leaderboard data={leadTab === 'all' ? leaderboard : weeklyLeaderboard} period={leadTab} />
          </>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(8px)',
        }} onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setMsg(null); } }}>
          <div style={{ background: 'var(--card)', border: `1px solid ${catColor(selected.category)}40`, borderRadius: 16, padding: '2.5rem', maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: `${catColor(selected.category)}20`, color: catColor(selected.category), borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{selected.category}</span>
                  <span style={{ background: diffStyle(selected.difficulty).bg, color: diffStyle(selected.difficulty).color, borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{selected.difficulty}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{selected.title}</h2>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#FFD60A' }}>{selected.points}pts</div>
            </div>

            <p style={{ color: '#9CA3AF', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-line' }}>{selected.description}</p>
            <div style={{ background: '#0A0A0F', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <span style={{ color: '#6B7280' }}>HINT: </span><span style={{ color: '#FFD60A' }}>{selected.hint}</span>
            </div>
            {selected.ghost && (
              <Link to="/ghost-protocol" style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
                padding: '14px 18px', background: '#7C3AED15', border: '1px solid #7C3AED50',
                borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED25'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED15'; e.currentTarget.style.transform = 'none'; }}
              >
                <span style={{ fontSize: 22 }}>👻</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#7C3AED', fontWeight: 700, letterSpacing: 1 }}>
                    LAUNCH GHOST PROTOCOL TERMINAL
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                    /ghost-protocol — find the token in the page source
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#7C3AED', fontSize: 16 }}>→</span>
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>✓ Solved by {selected.solved_count} players</div>
              {selected.fileUrl && (
                <a
                  href={`${API}/api/challenges/${selected.id}/download`}
                  download
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: '#7C3AED20', color: '#7C3AED',
                    border: '1px solid #7C3AED50', borderRadius: 8,
                    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
                    textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#7C3AED35'}
                  onMouseLeave={e => e.currentTarget.style.background = '#7C3AED20'}
                >📥 DOWNLOAD FILE</a>
              )}
            </div>

            {user ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                  background: '#00F5FF10', border: '1px solid #00F5FF30', borderRadius: 8, padding: '8px 12px',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: '#00F5FF20',
                    border: '1px solid #00F5FF50', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10,
                    fontWeight: 700, color: '#00F5FF', flexShrink: 0,
                  }}>{user.username.substring(0, 2).toUpperCase()}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>
                    Submitting as <span style={{ color: '#00F5FF' }}>{user.username}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input placeholder="CSPHERE{flag_here}" value={flag} onChange={e => setFlag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)', color: '#39FF14' }} />
                  <button onClick={handleSubmit} disabled={submitting} style={{
                    padding: '12px 20px', background: '#00F5FF', color: '#0A0A0F',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}>SUBMIT</button>
                </div>
              </>
            ) : (
              <div style={{
                background: '#FFD60A10', border: '1px solid #FFD60A30', borderRadius: 8,
                padding: '1rem', marginBottom: 16, textAlign: 'center',
              }}>
                <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>
                  🔒 Log in or create an account to submit flags and appear on the leaderboard.
                </p>
                <button
                  onClick={() => navigate('/login', { state: { from: '/challenges' } })}
                  style={{
                    padding: '10px 24px', background: '#FFD60A', color: '#0A0A0F',
                    border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
                    fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                  }}
                >LOGIN / SIGN UP →</button>
              </div>
            )}

            {msg && (
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: msg.type === 'success' ? '#39FF1415' : '#FF2D5515',
                border: `1px solid ${msg.type === 'success' ? '#39FF1440' : '#FF2D5540'}`,
                color: msg.type === 'success' ? '#39FF14' : '#FF2D55',
                fontFamily: 'var(--font-mono)', fontSize: 13,
              }}>{msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}</div>
            )}

            <button onClick={() => { setSelected(null); setMsg(null); }} style={{ marginTop: 20, background: 'transparent', border: 'none', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>← CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
  transition: 'border-color 0.2s',
};

function ChallengeCard({ ch, onClick }) {
  const cc = catColor(ch.category);
  const diff = diffStyle(ch.difficulty);
  return (
    <div onClick={onClick} style={{
      background: 'var(--card)', border: `1px solid ${cc}20`,
      borderRadius: 10, padding: '1.5rem', cursor: 'pointer', transition: 'all 0.25s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${cc}60`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${cc}20`; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ background: `${cc}20`, color: cc, borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1 }}>{ch.category}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#FFD60A' }}>{ch.points}</span>
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{ch.title}</h3>
      <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{ch.description.substring(0, 80)}...</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...diff, padding: '3px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{ch.difficulty}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>✓ {ch.solved_count} solves</span>
      </div>
    </div>
  );
}

function Leaderboard({ data, period }) {
  const top3 = data.slice(0, 3);
  const podiumColors = ['#FFD60A', '#C0C0C0', '#CD7F32'];
  const isWeekly = period === 'weekly';

  return (
    <div>
      {/* Top Players Showcase */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isWeekly ? '#39FF14' : '#FFD60A', letterSpacing: 4 }}>
            {isWeekly ? '// THIS_WEEK' : '// TOP_PLAYERS'}
          </div>
          {isWeekly && (
            <WeekTimer small />
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {top3.map((p, i) => (
            <div key={p.rank} style={{
              background: `linear-gradient(135deg, var(--card), ${podiumColors[i]}10)`,
              border: `1px solid ${podiumColors[i]}40`,
              borderRadius: 12, padding: '2rem', textAlign: 'center',
              transform: i === 0 ? 'scale(1.04)' : 'scale(1)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-display)', fontSize: 40, opacity: 0.08, fontWeight: 900, color: podiumColors[i] }}>#{p.rank}</div>
              <div style={{ fontSize: i === 0 ? 40 : 32, marginBottom: 12 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', margin: '0 auto 12px',
                background: `${podiumColors[i]}25`, border: `2px solid ${podiumColors[i]}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: podiumColors[i],
              }}>{p.avatar}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.username}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', marginBottom: 12 }}>{p.college}</div>
              <div style={{ background: `${BADGE_COLORS[p.badge]}15`, border: `1px solid ${BADGE_COLORS[p.badge]}30`, borderRadius: 20, padding: '4px 12px', display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 10, color: BADGE_COLORS[p.badge], letterSpacing: 1, marginBottom: 16 }}>{p.badge.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: podiumColors[i] }}>{p.score.toLocaleString()}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>pts · {p.solved} solved</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 24 }}>// FULL_RANKINGS</div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 100px 100px', padding: '12px 20px', background: '#0D1117', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 2 }}>
            <div>RANK</div><div>PLAYER</div><div>COLLEGE</div><div>SOLVED</div><div>SCORE</div>
          </div>
          {data.map((p, i) => (
            <div key={p.rank} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 1fr 100px 100px',
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              background: i % 2 === 0 ? 'transparent' : '#ffffff03',
              transition: 'background 0.2s', alignItems: 'center',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#00F5FF08'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#ffffff03'}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: p.rank <= 3 ? podiumColors[p.rank - 1] : '#6B7280' }}>#{p.rank}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${BADGE_COLORS[p.badge]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: BADGE_COLORS[p.badge] }}>{p.avatar}</div>
                <div>
                  <Link to={`/profile/${p.username}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#E2E8F0', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#00F5FF'}
                      onMouseLeave={e => e.currentTarget.style.color = '#E2E8F0'}
                    >{p.username}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: BADGE_COLORS[p.badge] }}>{p.badge}</div>
                  </Link>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>{p.college}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#39FF14' }}>{p.solved}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#FFD60A' }}>{p.score.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekTimer({ small }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const nextMon = new Date(now);
      nextMon.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 || 7);
      nextMon.setHours(0, 0, 0, 0);
      const diff = nextMon - now;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  if (small) {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280', letterSpacing: 1 }}>ends in {time}</span>;
  }
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: '#FF2D55', letterSpacing: 2, marginTop: 4 }}>{time}</div>;
}
