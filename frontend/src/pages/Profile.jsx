import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';

const BADGE_COLORS = {
  'Elite Hacker': '#FFD60A',
  Master: '#FF2D55',
  Expert: '#00F5FF',
  Advanced: '#7C3AED',
  Intermediate: '#39FF14',
  Rookie: '#6B7280',
};

const DIFF_COLORS = {
  Easy: '#39FF14',
  Medium: '#FFD60A',
  Hard: '#FF2D55',
  Insane: '#FF8C00',
};

const CAT_COLORS = {
  Cryptography: '#00F5FF',
  'Reverse Engineering': '#7C3AED',
  'Web Security': '#FF2D55',
  'Network Forensics': '#FF8C00',
  Pwn: '#FFD60A',
  Forensics: '#39FF14',
  OSINT: '#8B5CF6',
  Misc: '#6B7280',
};

function badgeForScore(score) {
  if (score >= 2000) return 'Elite Hacker';
  if (score >= 1500) return 'Master';
  if (score >= 1000) return 'Expert';
  if (score >= 500) return 'Advanced';
  if (score >= 100) return 'Intermediate';
  return 'Rookie';
}

export default function Profile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('solved');

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API}/api/profile/${encodeURIComponent(username)}`)
      .then((r) => {
        if (r.data.success) setProfile(r.data.profile);
        else setError(r.data.message || 'User not found.');
      })
      .catch((err) => {
        if (err.response?.status === 404) setError('User not found.');
        else setError('Failed to load profile. Server may be offline.');
      })
      .finally(() => setLoading(false));
  }, [username]);

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4 }}>
            {'>'} LOADING PROFILE...
          </div>
          <div style={{
            width: 32, height: 32, border: '2px solid #1f2937', borderTopColor: '#00F5FF',
            borderRadius: '50%', margin: '20px auto', animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── ERROR ────────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👻</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Profile Not Found</h2>
          <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.7 }}>{error || 'This user does not exist or has no activity yet.'}</p>
          <Link to="/challenges" style={{
            padding: '12px 24px', background: '#00F5FF', color: '#0A0A0F',
            fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: 1,
            borderRadius: 8, textDecoration: 'none', display: 'inline-block',
          }}>← BACK TO CHALLENGES</Link>
        </div>
      </div>
    );
  }

  const { stats, solvedChallenges, recentActivity, categoryStats, college, joinedAt } = profile;
  const badge = badgeForScore(stats.totalScore);
  const badgeColor = BADGE_COLORS[badge] || '#6B7280';
  const joinDate = new Date(joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* HEADER */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link to="/challenges" style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280',
            textDecoration: 'none', marginBottom: 20, display: 'inline-block',
          }}>← BACK TO CHALLENGES</Link>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: `linear-gradient(135deg, ${badgeColor}30, ${badgeColor}10)`,
              border: `3px solid ${badgeColor}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
              color: badgeColor, flexShrink: 0,
            }}>
              {username.substring(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700 }}>
                  {username}
                </h1>
                <span style={{
                  background: `${badgeColor}20`, border: `1px solid ${badgeColor}40`,
                  borderRadius: 20, padding: '4px 14px',
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: badgeColor,
                  letterSpacing: 1,
                }}>{badge.toUpperCase()}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <span>🏛 {college || 'Not specified'}</span>
                <span>📅 Joined {joinDate}</span>
                {stats.rank && <span>🏆 Rank #{stats.rank} of {stats.totalPlayers}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {/* STATS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Score', value: stats.totalScore.toLocaleString(), color: '#FFD60A' },
            { label: 'Challenges Solved', value: stats.solvedCount, color: '#39FF14' },
            { label: 'Total Submissions', value: stats.totalSubmissions, color: '#00F5FF' },
            { label: 'Wrong Attempts', value: stats.wrongAttempts, color: '#FF2D55' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--card)', border: `1px solid ${s.color}30`,
              borderRadius: 12, padding: '1.2rem', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', letterSpacing: 1, marginTop: 4 }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* CATEGORY BREAKDOWN */}
        {Object.keys(categoryStats).length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8B5CF6', letterSpacing: 2, marginBottom: 16 }}>
              // CATEGORY_BREAKDOWN
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {Object.entries(categoryStats).map(([cat, data]) => {
                const catColor = CAT_COLORS[cat] || '#00F5FF';
                const total = Object.values(categoryStats).reduce((s, c) => s + c.count, 0);
                const pct = (data.count / total) * 100;
                return (
                  <div key={cat} style={{ flex: '1 1 180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: catColor }}>{cat}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>
                        {data.count} · {data.points}pts
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#0A0A0F', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: catColor, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TABS: Solved Challenges / Recent Activity */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1f2937', marginBottom: 24 }}>
          {[
            { key: 'solved', label: `Solved (${solvedChallenges.length})`, color: '#39FF14' },
            { key: 'activity', label: `Recent Activity (${recentActivity.length})`, color: '#00F5FF' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '14px 24px', background: 'none', border: 'none',
                borderBottom: activeTab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
                color: activeTab === t.key ? t.color : '#6B7280',
                fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 2,
                cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* SOLVED CHALLENGES TAB */}
        {activeTab === 'solved' && (
          solvedChallenges.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                🔒 No challenges solved yet.
              </div>
              <Link to="/challenges" style={{
                padding: '10px 20px', background: '#00F5FF', color: '#0A0A0F',
                borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
                fontWeight: 700, textDecoration: 'none',
              }}>BROWSE CHALLENGES →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {solvedChallenges.map(ch => {
                const catColor = CAT_COLORS[ch.category] || '#00F5FF';
                const diffColor = DIFF_COLORS[ch.difficulty] || '#6B7280';
                return (
                  <div key={ch.id} style={{
                    background: 'var(--card)', border: `1px solid ${catColor}20`,
                    borderRadius: 10, padding: '1.2rem', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${catColor}50`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${catColor}20`; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{
                        background: `${catColor}20`, color: catColor, borderRadius: 4,
                        padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 10,
                      }}>{ch.category}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#FFD60A' }}>
                        +{ch.points}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{ch.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        color: diffColor, fontFamily: 'var(--font-mono)', fontSize: 10,
                        background: `${diffColor}15`, padding: '2px 8px', borderRadius: 4,
                      }}>{ch.difficulty}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280' }}>
                        ✓ {new Date(ch.solvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* RECENT ACTIVITY TAB */}
        {activeTab === 'activity' && (
          recentActivity.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              No submissions yet.
            </div>
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px',
                padding: '12px 20px', background: '#0D1117', borderBottom: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', letterSpacing: 2,
              }}>
                <div>CHALLENGE</div><div>CATEGORY</div><div>STATUS</div><div>DATE</div>
              </div>
              {recentActivity.map(sub => {
                const catColor = CAT_COLORS[sub.challengeCategory] || '#00F5FF';
                return (
                  <div key={sub.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px',
                    padding: '12px 20px', borderBottom: '1px solid var(--border)',
                    background: sub.correct ? '#39FF1405' : 'transparent',
                    alignItems: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
                      {sub.challengeTitle}
                    </div>
                    <div>
                      <span style={{
                        background: `${catColor}15`, color: catColor, borderRadius: 4,
                        padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 10,
                      }}>{sub.challengeCategory}</span>
                    </div>
                    <div>
                      {sub.correct ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#39FF14' }}>✓ PASS</span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF2D55' }}>✗ FAIL</span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>
                      {new Date(sub.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
