import { Link } from 'react-router-dom';

const GHOST_COLORS = ['#00F5FF', '#7C3AED', '#FFD60A', '#39FF14', '#FF2D55', '#FF8C00'];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function GhostWall({ completions = [], count = 0, loading = false }) {
  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 40,
      }}>
        {[
          { label: 'Ghosts Recorded', value: count, color: '#7C3AED', icon: '👻' },
          { label: 'Protocol Status', value: 'COMPROMISED', color: '#39FF14', icon: '⚡' },
          { label: 'Difficulty Rating', value: 'INSANE', color: '#FF2D55', icon: '💀' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: `1px solid ${s.color}30`,
            borderRadius: 12, padding: '1.5rem',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', letterSpacing: 1, marginTop: 4 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Trophy showcase for first 3 */}
      {completions.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: '#7C3AED', letterSpacing: 3, marginBottom: 24,
          }}>// LEGENDARY_GHOSTS</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${Math.min(280, 1200 / Math.max(completions.length, 1))}px, 1fr))`,
            gap: 20,
          }}>
            {completions.slice(0, 6).map((entry, i) => (
              <div key={entry.id} style={{
                background: `linear-gradient(135deg, var(--card), ${GHOST_COLORS[i % GHOST_COLORS.length]}08)`,
                border: `1px solid ${GHOST_COLORS[i % GHOST_COLORS.length]}30`,
                borderRadius: 12, padding: '1.5rem',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${GHOST_COLORS[i % GHOST_COLORS.length]}70`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${GHOST_COLORS[i % GHOST_COLORS.length]}30`; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  position: 'absolute', top: 8, right: 12,
                  fontFamily: 'var(--font-display)', fontSize: 48,
                  fontWeight: 900, opacity: 0.06, color: GHOST_COLORS[i % GHOST_COLORS.length],
                }}>#{i + 1}</div>

                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  margin: '0 auto 12px',
                  background: `${GHOST_COLORS[i % GHOST_COLORS.length]}20`,
                  border: `2px solid ${GHOST_COLORS[i % GHOST_COLORS.length]}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 20,
                  fontWeight: 700, color: GHOST_COLORS[i % GHOST_COLORS.length],
                }}>
                  {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : (entry.alias || '??').substring(0, 2).toUpperCase()}
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 16,
                  fontWeight: 700, color: '#E2E8F0', marginBottom: 8,
                }}>
                  {entry.alias || 'Anonymous Ghost'}
                </div>

                <div style={{
                  display: 'inline-block',
                  background: `${GHOST_COLORS[i % GHOST_COLORS.length]}15`,
                  color: GHOST_COLORS[i % GHOST_COLORS.length],
                  borderRadius: 12, padding: '3px 12px',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: 1, marginBottom: 12,
                }}>
                  GHOST #{entry.id}
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280' }}>
                  {formatDate(entry.completedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full list */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: '#00F5FF', letterSpacing: 3, marginBottom: 24,
        }}>// ALL_RECORDS</div>

        <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Loading the hall of fame...
            </div>
          ) : completions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👻</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                No ghosts have breached the protocol yet.
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#374151', marginBottom: 20 }}>
                Could you be the first? Solve the Ghost Protocol challenge and claim your spot.
              </p>
              <Link to="/ghost-protocol" style={{
                padding: '10px 24px', background: '#7C3AED20', color: '#7C3AED',
                border: '1px solid #7C3AED50', borderRadius: 8, fontFamily: 'var(--font-mono)',
                fontSize: 12, letterSpacing: 1, textDecoration: 'none', display: 'inline-block',
              }}>⚔ BEGIN THE HUNT</Link>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 180px',
                padding: '14px 20px', background: '#0D1117',
                borderBottom: '1px solid #1f2937',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: '#6B7280', letterSpacing: 2,
              }}>
                <div>#</div><div>GHOST</div><div>BREACHED AT</div>
              </div>

              {/* Table rows */}
              {completions.map((entry, i) => (
                <div key={entry.id} style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 180px',
                  padding: '14px 20px', borderBottom: '1px solid #1f293740',
                  background: i % 2 === 0 ? 'transparent' : '#ffffff03',
                  alignItems: 'center', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#7C3AED08'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#ffffff03'}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 14,
                    fontWeight: 700,
                    color: i < 3 ? ['#FFD60A', '#C0C0C0', '#CD7F32'][i] : '#6B7280',
                  }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `${GHOST_COLORS[i % GHOST_COLORS.length]}20`,
                      border: `1px solid ${GHOST_COLORS[i % GHOST_COLORS.length]}50`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 11,
                      fontWeight: 700, color: GHOST_COLORS[i % GHOST_COLORS.length],
                    }}>
                      {(entry.alias || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#E2E8F0' }}>
                      {entry.alias}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280' }}>
                    {formatDate(entry.completedAt)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
