import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';
import MatrixRain from '../components/MatrixRain';

const SECRET_KEY = '47d3e8a1c9f2b4d6';

export default function Hacked() {
  const { key } = useParams();
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [glitch, setGlitch] = useState(false);
  const [particles, setParticles] = useState([]);
  const [alias, setAlias] = useState('');
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (key === SECRET_KEY) {
      const t = setTimeout(() => {
        setVerified(true);
        setShowAliasInput(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [key]);

  const recordCompletion = async () => {
    try {
      await axios.post(`${API}/api/ghost-complete`, { key, alias: alias.trim() || 'Anonymous Ghost' });
      setSaved(true);
    } catch {
      // Silent fail - just don't save
      setSaved(true);
    }
  };

  useEffect(() => {
    if (verified) {
      const interval = setInterval(() => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [verified]);

  // Countdown timer
  useEffect(() => {
    if (!verified && key === SECRET_KEY) {
      const timer = setInterval(() => {
        setCountdown(p => Math.max(0, p - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [verified, key]);

  // Generate particles
  useEffect(() => {
    if (verified) {
      const p = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        speed: 0.5 + Math.random() * 1.5,
        color: ['#00F5FF', '#39FF14', '#FFD60A', '#FF2D55', '#7C3AED'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 2,
      }));
      setParticles(p);
    }
  }, [verified]);

  // Wrong key
  if (key !== SECRET_KEY) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--black)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '2rem',
      }}>
        <div>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🚫</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#FF2D55', marginBottom: 12 }}>
            Access Denied
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
            Invalid access key. The Ghost Protocol cannot be verified.
          </p>
          <Link to="/" style={{
            padding: '10px 24px', background: '#00F5FF15', color: '#00F5FF',
            border: '1px solid #00F5FF40', borderRadius: 8, textDecoration: 'none',
            fontFamily: 'var(--font-mono)', fontSize: 12,
          }}>← Return Home</Link>
        </div>
      </div>
    );
  }

  // Initializing...
  if (!verified) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000', fontFamily: "'Courier New', monospace", flexDirection: 'column', gap: 20,
      }}>
        <MatrixRain />
        <div style={{
          border: '1px solid #00F5FF20', borderRadius: 8, padding: '2rem',
          background: '#0a0a0a', textAlign: 'center', zIndex: 1,
          maxWidth: 500, width: '90%',
        }}>
          <div style={{ color: '#00F5FF', fontSize: 14, marginBottom: 16, letterSpacing: 2 }}>
            [GHOST PROTOCOL] Verifying credentials...
          </div>
          <div style={{
            width: '100%', height: 4, background: '#1f2937', borderRadius: 2,
            overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{
              width: `${(5 - countdown) * 20}%`, height: '100%',
              background: 'linear-gradient(90deg, #00F5FF, #39FF14)',
              borderRadius: 2, transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ color: '#6B7280', fontSize: 11 }}>DECRYPTING... {countdown > 0 ? `0:0${countdown}` : 'DONE'}</div>
          {countdown === 0 && (
            <div style={{ marginTop: 16, color: '#39FF14', fontSize: 13, animation: 'blink 1s infinite' }}>
              ✓ ACCESS GRANTED
            </div>
          )}
        </div>
      </div>
    );
  }

  // VICTORY!
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <MatrixRain />

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: '50%',
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          animation: `float ${3 / p.speed}s ease-in-out ${p.delay}s infinite alternate`,
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      ))}

      {/* Glitch rings */}
      {glitch && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(255,45,85,0.03) 0%, transparent 50%, rgba(0,245,255,0.03) 100%)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center',
        padding: '2rem', maxWidth: 700,
      }}>
        {/* Status badge */}
        <div style={{
          display: 'inline-block',
          background: '#39FF1415', border: '1px solid #39FF1440',
          borderRadius: 20, padding: '6px 20px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: '#39FF14', letterSpacing: 3,
          marginBottom: 24,
        }}>
          // SYSTEM_COMPROMISED
        </div>

        {/* Main heading */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 16,
          filter: glitch ? 'blur(1px) hue-rotate(90deg)' : 'none',
          transition: 'filter 0.1s',
        }}>
          <span style={{ color: '#fff' }}>YOU HACKED</span><br />
          <span style={{
            color: '#00F5FF',
            textShadow: '0 0 40px #00F5FF80, 0 0 80px #00F5FF40',
          }}>CYSECSPHERE</span>
        </h1>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: '#39FF14',
          marginBottom: 32, letterSpacing: 3, opacity: 0.9,
        }}>
          ──── ⚡ GHOST PROTOCOL ACTIVATED ⚡ ────
        </div>

        {/* Trophy card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(124,58,237,0.05))',
          border: '1px solid #00F5FF30',
          borderRadius: 16, padding: '2rem',
          marginBottom: 32, backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 20,
            fontWeight: 700, color: '#FFD60A', marginBottom: 8,
          }}>
            Ghost Protocol — Cracked
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: '#9CA3AF', lineHeight: 1.8, marginBottom: 16,
          }}>
            You successfully bypassed the Ghost Protocol authentication system.
            Claim your spot on the Wall of Fame.
          </div>

          {/* Alias input for Wall of Fame */}
          {showAliasInput && !saved && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                placeholder="Enter your hacker alias..."
                value={alias}
                onChange={e => setAlias(e.target.value)}
                maxLength={30}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: '#0A0A0F', border: '1px solid #7C3AED50',
                  color: '#E2E8F0', fontFamily: 'var(--font-mono)', fontSize: 13,
                  outline: 'none',
                }}
                onKeyDown={e => e.key === 'Enter' && recordCompletion()}
                autoFocus
              />
              <button onClick={recordCompletion} style={{
                padding: '10px 20px', background: '#7C3AED', color: '#fff',
                border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>SIGN →</button>
            </div>
          )}

          {saved && (
            <div style={{
              background: '#7C3AED15', border: '1px solid #7C3AED50',
              borderRadius: 8, padding: '10px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#7C3AED' }}>
                Immortalized as <strong>{alias || 'Anonymous Ghost'}</strong> in the Wall of Fame!
              </span>
            </div>
          )}

          <div style={{
            background: '#0A0A0F', border: '1px solid #1f2937',
            borderRadius: 8, padding: '12px 16px',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: '#6B7280',
          }}>
            <span style={{ color: '#00F5FF' }}>HASH:</span>
            <span style={{ color: '#39FF14' }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
          </div>
        </div>

        {/* Hacker stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12, marginBottom: 32,
        }}>
          {[
            { label: 'Status', value: 'COMPROMISED', color: '#39FF14' },
            { label: 'Difficulty', value: 'INSANE', color: '#FF2D55' },
            { label: 'Rank', value: 'ELITE HACKER', color: '#FFD60A' },
            { label: 'Timestamp', value: new Date().toLocaleDateString(), color: '#6B7280' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(17,24,39,0.8)', border: `1px solid ${s.color}20`,
              borderRadius: 8, padding: '1rem',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            padding: '12px 28px', background: '#00F5FF', color: '#0A0A0F',
            border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)',
            fontSize: 13, fontWeight: 700, letterSpacing: 2, textDecoration: 'none',
            boxShadow: '0 0 30px #00F5FF40', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 50px #00F5FF80'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 30px #00F5FF40'}
          >
            ← RETURN TO SURFACE
          </Link>
          <Link to="/challenges#ghosts" style={{
            padding: '12px 28px', background: '#7C3AED20', color: '#7C3AED',
            border: '1px solid #7C3AED50', borderRadius: 8, fontFamily: 'var(--font-mono)',
            fontSize: 13, letterSpacing: 2, textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#7C3AED35'}
            onMouseLeave={e => e.currentTarget.style.background = '#7C3AED20'}
          >
            👻 WALL OF FAME
          </Link>
          <Link to="/challenges" style={{
            padding: '12px 28px', background: 'transparent', color: '#00F5FF',
            border: '1px solid #00F5FF60', borderRadius: 8, fontFamily: 'var(--font-mono)',
            fontSize: 13, letterSpacing: 2, textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#00F5FF15'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ⚔ MORE CHALLENGES
          </Link>
        </div>

        {/* ASCII art footer */}
        <pre style={{
          marginTop: 48, color: '#1f2937', fontSize: 8, lineHeight: 1.2,
          fontFamily: "'Courier New', monospace", letterSpacing: 2,
        }}>
{`
  ██████  ██░ ██  ▒█████   ██████ ▄▄▄█████▓
▒██    ▒ ▓██░ ██▒▒██▒  ██▒▒██    ▒ ▓  ██▒ ▓▒
░ ▓██▄   ▒██▀▀██░▒██░  ██▒░ ▓██▄   ▒ ▓██░ ▒░
  ▒   ██▒░▓█ ░██ ▒██   ██░  ▒   ██▒░ ▓██▓ ░ 
▒██████▒▒░▓█▒░██▓░ ████▓▒░▒██████▒▒  ▒██▒ ░ 
▒ ▒▓▒ ▒ ░ ▒ ░░▒░▒░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░  ▒ ░░   
░ ░▒  ░ ░ ▒ ░▒░ ░  ░ ▒ ▒░ ░ ░▒  ░ ░    ░    
░  ░  ░   ░  ░░ ░░ ░ ░ ▒  ░  ░  ░    ░      
      ░   ░  ░  ░    ░ ░        ░           
`}
        </pre>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) scale(1); opacity: 0.5; }
          100% { transform: translateY(-20px) scale(1.5); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
