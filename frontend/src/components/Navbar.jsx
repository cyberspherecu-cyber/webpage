import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from "../assets/logo.jpeg"; // make sure path is correct
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/arenas', label: 'Arenas' },
    { to: '/blog', label: 'Blog' },
    { to: '/team', label: 'Core Team' },
    { to: '/challenges', label: 'CTF Challenges' },
    { to: '/resources', label: 'Resources' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: scrolled ? 'rgba(10,10,15,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1f2937' : 'none',
      transition: 'all 0.3s ease',
      padding: '0 2rem',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 72
      }}>

        {/* LOGO SECTION */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logo}
            alt="Cysecsphere Logo"
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              objectFit: 'cover',
              border: '1px solid #00F5FF40',
              boxShadow: '0 0 10px #00F5FF55'
            }}
          />

          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: '#00F5FF',
              letterSpacing: 2
            }}>
              Cysecsphere
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#6B7280',
              letterSpacing: 3
            }}>
              CU
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="desktop-nav">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                letterSpacing: 1,
                color: isActive(l.to) ? '#00F5FF' : '#9CA3AF',
                background: isActive(l.to) ? '#00F5FF15' : 'transparent',
                border: isActive(l.to)
                  ? '1px solid #00F5FF40'
                  : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!isActive(l.to)) {
                  e.target.style.color = '#E2E8F0';
                  e.target.style.background = '#ffffff08';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(l.to)) {
                  e.target.style.color = '#9CA3AF';
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {l.label}
            </Link>
          ))}

          <div style={{ width: 1, height: 24, background: '#1f2937', margin: '0 6px' }} />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link to="/settings" title="Account Settings" style={{
                width: 30, height: 30, borderRadius: '50%', background: '#00F5FF20',
                border: '1px solid #00F5FF50', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11,
                fontWeight: 700, color: '#00F5FF', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#00F5FF35'; e.currentTarget.style.borderColor = '#00F5FF80'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#00F5FF20'; e.currentTarget.style.borderColor = '#00F5FF50'; }}
              >{user.username.substring(0, 2).toUpperCase()}</Link>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E2E8F0', cursor: 'pointer' }} onClick={() => navigate('/settings')}>{user.username}</span>
              <button
                onClick={() => { logout(); navigate('/'); }}
                title="Log out"
                style={{
                  background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                  borderRadius: 6, padding: '6px 10px', fontFamily: 'var(--font-mono)',
                  fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FF2D55'; e.currentTarget.style.borderColor = '#FF2D5550'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#1f2937'; }}
              >LOGOUT</button>
            </div>
          ) : (
            <Link to="/login" style={{
              padding: '8px 18px', borderRadius: 6, fontFamily: 'var(--font-mono)',
              fontSize: 12, letterSpacing: 1, color: '#00F5FF', background: '#00F5FF15',
              border: '1px solid #00F5FF40', textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#00F5FF25'}
              onMouseLeave={e => e.currentTarget.style.background = '#00F5FF15'}
            >
              LOGIN / SIGN UP
            </Link>
          )}
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{
            display: isMobile ? 'block' : 'none',
            background: 'none',
            border: 'none',
            color: '#00F5FF',
            fontSize: 24,
            cursor: 'pointer',
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(10,10,15,0.98)',
          borderTop: '1px solid #1f2937',
          padding: '1rem 2rem'
        }}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                display: 'block',
                padding: '12px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: isActive(l.to) ? '#00F5FF' : '#9CA3AF',
                borderBottom: '1px solid #1f2937'
              }}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#E2E8F0' }}>👤 {user.username}</span>
              <button
                onClick={() => { logout(); navigate('/'); }}
                style={{ background: 'transparent', border: '1px solid #1f2937', color: '#FF2D55', borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}
              >LOGOUT</button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'block', padding: '12px 0', fontFamily: 'var(--font-mono)',
                fontSize: 14, color: '#00F5FF',
              }}
            >
              LOGIN / SIGN UP
            </Link>
          )}
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}