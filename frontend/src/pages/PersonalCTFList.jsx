import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';
import { useAuth } from '../context/useAuth';

const statusColors = {
  active: { bg: '#00F5FF15', border: '#00F5FF40', text: '#00F5FF', label: 'ACTIVE' },
  upcoming: { bg: '#FFD60A15', border: '#FFD60A40', text: '#FFD60A', label: 'UPCOMING' },
  ended: { bg: '#6B728015', border: '#6B728040', text: '#6B7280', label: 'ENDED' },
};

export default function PersonalCTFList() {
  const [ctfs, setCtfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/personal-ctf`)
      .then(r => setCtfs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCtfs = ctfs.filter(c => c.status === 'active');
  const upcomingCtfs = ctfs.filter(c => c.status === 'upcoming');
  const endedCtfs = ctfs.filter(c => c.status === 'ended');

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FF6B6B', letterSpacing: 4, marginBottom: 12 }}>// ARENAS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 8 }}>
            Personal CTFs
          </h1>
          <p style={{ color: '#6B7280', maxWidth: 600 }}>
            Time-gated, invite-only CTF events hosted by the club. Join with an Event ID and password to compete.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #1f2937', borderTopColor: '#00F5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
            <p style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12 }}>LOADING ARENAS…</p>
          </div>
        ) : ctfs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Active CTFs</h3>
            <p style={{ color: '#6B7280', maxWidth: 400, margin: '0 auto' }}>No personal CTF events are running right now. Check back later or follow us on social media for announcements.</p>
          </div>
        ) : (
          <>
            {/* Active */}
            {activeCtfs.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F5FF', boxShadow: '0 0 8px #00F5FF' }}></div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Active Now</h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>({activeCtfs.length})</span>
                </div>
                {activeCtfs.map(ctf => <CTFCard key={ctf.id} ctf={ctf} user={user} navigate={navigate} />)}
              </section>
            )}

            {/* Upcoming */}
            {upcomingCtfs.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD60A' }}></div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Upcoming</h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>({upcomingCtfs.length})</span>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {upcomingCtfs.map(ctf => <CTFCard key={ctf.id} ctf={ctf} user={user} navigate={navigate} />)}
                </div>
              </section>
            )}

            {/* Ended */}
            {endedCtfs.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B7280' }}></div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Past Events</h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>({endedCtfs.length})</span>
                </div>
                <div style={{ display: 'grid', gap: 12, opacity: 0.6 }}>
                  {endedCtfs.slice(0, 5).map(ctf => <CTFCard key={ctf.id} ctf={ctf} user={user} navigate={navigate} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function CTFCard({ ctf, user, navigate }) {
  const sc = statusColors[ctf.status] || statusColors.ended;
  const startsAt = new Date(ctf.startsAt);
  const endsAt = new Date(ctf.endsAt);

  const handleJoin = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/arenas/join/${ctf.id}`);
  };

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.background = '#ffffff08'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.background = 'var(--card)'; }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>{ctf.title}</h3>
          <span style={{
            padding: '2px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10,
            fontWeight: 700, letterSpacing: 1, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
          }}>{sc.label}</span>
        </div>
        {ctf.description && (
          <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 8px', maxWidth: 500 }}>{ctf.description.substring(0, 120)}{ctf.description.length > 120 ? '…' : ''}</p>
        )}
        <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>
          <span>ID: <span style={{ color: '#9CA3AF' }}>{ctf.accessId}</span></span>
          <span>🏆 {ctf.challengeCount} challenges</span>
          <span>👥 {ctf.participantCount} joined</span>
          {ctf.status === 'active' && (
            <span>⏱ Ends {endsAt.toLocaleString()}</span>
          )}
          {ctf.status === 'upcoming' && (
            <span>🗓 Starts {startsAt.toLocaleString()}</span>
          )}
        </div>
      </div>
      <button
        onClick={handleJoin}
        disabled={ctf.status === 'ended'}
        style={{
          padding: '10px 20px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
          fontWeight: 700, letterSpacing: 1, cursor: ctf.status === 'ended' ? 'not-allowed' : 'pointer',
          background: ctf.status === 'active' ? '#00F5FF' : ctf.status === 'upcoming' ? '#FFD60A20' : '#1f2937',
          color: ctf.status === 'active' ? '#000' : ctf.status === 'upcoming' ? '#FFD60A' : '#6B7280',
          border: `1px solid ${ctf.status === 'active' ? '#00F5FF' : ctf.status === 'upcoming' ? '#FFD60A40' : '#1f2937'}`,
          transition: 'all 0.2s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (ctf.status !== 'ended') { e.currentTarget.style.opacity = '0.85'; }}}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {ctf.status === 'active' ? 'JOIN ARENA' : ctf.status === 'upcoming' ? 'PREVIEW' : 'VIEW RESULTS'}
      </button>
    </div>
  );
}
