import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';

const diffColors = {
  Easy: { bg: '#39FF1415', text: '#39FF14' },
  Medium: { bg: '#FFD60A15', text: '#FFD60A' },
  Hard: { bg: '#FF2D5515', text: '#FF2D55' },
  Insane: { bg: '#FF8C0015', text: '#FF8C00' },
};

const catColors = {
  Cryptography: '#7C3AED', 'Reverse Engineering': '#FF6B6B', 'Web Security': '#00F5FF',
  'Network Forensics': '#39FF14', Pwn: '#FF2D55', Forensics: '#FFD60A', OSINT: '#8B5CF6', Misc: '#6B7280',
};

export default function UserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('solved');

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/api/profile/${encodeURIComponent(username)}`)
      .then(r => {
        if (r.data.success) {
          setProfile(r.data.profile);
        } else {
          setError('User not found.');
        }
      })
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div style={{ paddingTop: 120, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #1f2937', borderTopColor: '#00F5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
          <p style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12 }}>LOADING PROFILE…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ paddingTop: 120, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👻</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>User Not Found</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>No CTF account with that username.</p>
          <Link to="/" style={{ color: '#00F5FF', fontFamily: 'var(--font-mono)', fontSize: 13 }}>← BACK HOME</Link>
        </div>
      </div>
    );
  }

  const { stats, solvedChallenges, recentActivity, categoryStats, personalCtfHistory } = profile;

  const badgeForScore = (score) => {
    if (score >= 2000) return { label: 'Elite Hacker', color: '#FFD60A' };
    if (score >= 1500) return { label: 'Master', color: '#FF2D55' };
    if (score >= 1000) return { label: 'Expert', color: '#00F5FF' };
    if (score >= 500) return { label: 'Advanced', color: '#7C3AED' };
    if (score >= 100) return { label: 'Intermediate', color: '#39FF14' };
    return { label: 'Rookie', color: '#6B7280' };
  };

  const badge = badgeForScore(stats.totalScore);

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#00F5FF20',
            border: '2px solid #00F5FF50', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#00F5FF',
            fontFamily: 'var(--font-display)',
          }}>
            {profile.username.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, margin: 0 }}>
                {profile.username}
              </h1>
              <span style={{
                padding: '3px 12px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
                fontWeight: 700, letterSpacing: 1, background: `${badge.color}20`, color: badge.color,
                border: `1px solid ${badge.color}40`,
              }}>{badge.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
              <span>🎓 {profile.college || 'Not specified'}</span>
              <span>📅 Joined {new Date(profile.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {stats.rank && <span>🏆 Rank #{stats.rank} of {stats.totalPlayers}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 2rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Score', value: stats.totalScore, color: '#FFD60A' },
            { label: 'Solved', value: stats.solvedCount, color: '#39FF14' },
            { label: 'Attempts', value: stats.totalSubmissions, color: '#00F5FF' },
            { label: 'Wrong', value: stats.wrongAttempts, color: '#FF2D55' },
            { label: 'PCTF Events', value: personalCtfHistory?.length || 0, color: '#FF6B6B' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: `1px solid ${s.color}20`, borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', letterSpacing: 1, marginTop: 2 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryStats || {}).length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 2, marginBottom: 12 }}>// CATEGORY BREAKDOWN</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(categoryStats).map(([cat, data]) => (
                <div key={cat} style={{
                  background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 8,
                  padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: catColors[cat] || '#6B7280',
                  }}></div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF' }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FFD60A', fontWeight: 700 }}>{data.count}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>({data.points}pts)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #1f2937', paddingBottom: 12, marginBottom: 20 }}>
          {[
            { key: 'solved', label: `Solved (${solvedChallenges.length})` },
            { key: 'pctf', label: `Personal CTFs (${personalCtfHistory?.length || 0})` },
            { key: 'activity', label: 'Recent Activity' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 16px', background: tab === t.key ? '#00F5FF15' : 'transparent',
              color: tab === t.key ? '#00F5FF' : '#6B7280',
              border: `1px solid ${tab === t.key ? '#00F5FF40' : 'transparent'}`,
              borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Solved Challenges Tab */}
        {tab === 'solved' && (
          <div>
            {solvedChallenges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                No challenges solved yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {solvedChallenges.map(ch => {
                  const dc = diffColors[ch.difficulty] || diffColors.Medium;
                  const catColor = catColors[ch.category] || '#6B7280';
                  return (
                    <div key={ch.id} style={{
                      background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 10,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: catColor }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{ch.title}</div>
                        <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          <span>{ch.category}</span>
                          <span style={{ color: dc.text }}>{ch.difficulty}</span>
                          <span style={{ color: '#39FF14' }}>✓ {new Date(ch.solvedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#FFD60A' }}>+{ch.points}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Personal CTF History Tab */}
        {tab === 'pctf' && (
          <div>
            {(!personalCtfHistory || personalCtfHistory.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                No Personal CTF events joined yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {personalCtfHistory.map(pctf => {
                  const statusColor = pctf.status === 'active' ? '#00F5FF' : pctf.status === 'upcoming' ? '#FFD60A' : '#6B7280';
                  return (
                    <div key={pctf.id} style={{
                      background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 10,
                      padding: '12px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <Link to={`/arenas/${pctf.id}`} style={{
                            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
                            color: '#E2E8F0', textDecoration: 'none',
                          }}>{pctf.title}</Link>
                          <span style={{
                            marginLeft: 8, padding: '2px 8px', borderRadius: 4,
                            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1,
                            background: `${statusColor}20`, color: statusColor,
                            border: `1px solid ${statusColor}40`,
                          }}>{pctf.status?.toUpperCase()}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#FFD60A' }}>{pctf.score}pts</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>
                        <span>🏆 {pctf.solvedCount}/{pctf.challengeCount} solved</span>
                        <span>📝 {pctf.totalSubmissions} submissions</span>
                        <span>📅 Joined {new Date(pctf.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recent Activity Tab */}
        {tab === 'activity' && (
          <div>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                No activity yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {recentActivity.map((act, idx) => (
                  <div key={act.id || idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 8,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12,
                      background: act.correct ? '#39FF1415' : '#FF2D5515',
                      color: act.correct ? '#39FF14' : '#FF2D55',
                    }}>{act.correct ? '✓' : '✗'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E2E8F0' }}>
                        {act.challengeTitle}
                        <span style={{ color: '#6B7280', marginLeft: 6 }}>{act.challengeCategory}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                        {new Date(act.timestamp).toLocaleString()}
                        {act.correct && <span style={{ color: '#FFD60A', marginLeft: 8 }}>+{act.points}pts</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
