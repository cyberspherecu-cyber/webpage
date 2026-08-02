import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { API_URL as API } from '../config';
import MatrixRain from '../components/MatrixRain';

const FALLBACK_STATS = [
  { value: '200+', label: 'Active Members' },
  { value: '47', label: 'CTFs Hosted' },
  { value: '12', label: 'National Wins' },
  { value: '3', label: 'Years Strong' },
];

const FALLBACK_FEATURES = [
  { icon: '⚔️', title: 'Weekly CTF Challenges', desc: 'Test your skills every week with new challenges spanning crypto, pwn, forensics, web, and more.' },
  { icon: '🔬', title: 'Security Research', desc: 'Collaborate on real-world vulnerability research, CVE discovery, and responsible disclosure.' },
  { icon: '🏆', title: 'Competitions', desc: 'Represent CU at national and international CTF competitions with club-sponsored teams.' },
  { icon: '📚', title: 'Workshops', desc: 'Regular hands-on workshops by industry experts covering cutting-edge offensive and defensive security.' },
  { icon: '🤝', title: 'Mentorship', desc: 'Senior members mentor juniors through structured programs and 1-on-1 guidance sessions.' },
  { icon: '🌐', title: 'Industry Connect', desc: 'Direct connections to top cybersecurity firms for internships and full-time opportunities.' },
];

export default function Home() {
  const [glitch, setGlitch] = useState(false);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [features, setFeatures] = useState(FALLBACK_FEATURES);
  const [about, setAbout] = useState({});

  useEffect(() => {
    axios.get(`${API}/api/site-content`)
      .then(r => {
        const c = r.data || {};
        if (c.stats && c.stats.length) setStats(c.stats);
        if (c.features && c.features.length) setFeatures(c.features);
        if (c.about) setAbout(c.about);
      })
      .catch(() => {}); // keep fallback if backend is offline
  }, []);
  const [typed, setTyped] = useState('');
  const fullText = 'HACK. DEFEND. SECURE.';

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setTyped(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(t);
    }, 80);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 200); }, 4000);
    return () => clearInterval(t);
  }, []);

  // 🥚 Hidden easter egg: console hex string decodes to /ghost-protocol
  useEffect(() => {
    const hex = '2f67686f73742d70726f746f636f6c';
    const decoded = hex.match(/.{1,2}/g).map(b => String.fromCharCode(parseInt(b, 16))).join('');
    console.log('%c[BOOT_SEQUENCE] Initializing Cysecsphere Ghost Protocol...', 'color: #00F5FF; font-family: monospace; font-size: 12px;');
    console.log('%c[HEX_DUMP]  ' + hex, 'color: #6B7280; font-family: monospace; font-size: 11px;');
    console.log('%c[DECODED]   → ' + decoded, 'color: #39FF14; font-family: monospace; font-size: 12px; font-weight: bold;');
    console.log('%c[HINT]      Follow the path to uncover the hidden protocol.', 'color: #FFD60A; font-family: monospace; font-size: 11px;');
  }, []);

  return (
    <div>
      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--black)' }}>
        <MatrixRain />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,245,255,0.06) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 2rem', maxWidth: 900 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 6, marginBottom: 24, opacity: 0.8 }}>
            {'> INITIALIZING Cysecsphere v2.0...'}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(2.5rem, 8vw, 7rem)', lineHeight: 1, letterSpacing: -2,
            marginBottom: 16,
            filter: glitch ? 'blur(2px) hue-rotate(90deg)' : 'none',
            transition: 'filter 0.1s',
          }}>
            <span style={{ color: '#fff' }}>CYSEC</span>
            <span style={{ color: '#00F5FF', textShadow: '0 0 40px #00F5FF80' }}>SPHERE</span>
          </h1>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)', letterSpacing: 8, color: '#39FF14', marginBottom: 8, height: 36 }}>
            {typed}<span style={{ animation: 'blink 1s infinite' }}>█</span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B7280', marginBottom: 48, letterSpacing: 2 }}>
            CHANDIGARH UNIVERSITY — CYBERSECURITY CLUB
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/challenges" style={{
              padding: '14px 32px', background: '#00F5FF', color: '#0A0A0F',
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, letterSpacing: 2,
              border: 'none', borderRadius: 6, textDecoration: 'none',
              boxShadow: '0 0 30px #00F5FF40', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.target.style.boxShadow = '0 0 50px #00F5FF80'}
              onMouseLeave={e => e.target.style.boxShadow = '0 0 30px #00F5FF40'}
            >⚔ JOIN CTF</Link>
            <Link to="/events" style={{
              padding: '14px 32px', background: 'transparent', color: '#00F5FF',
              fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 2,
              border: '1px solid #00F5FF60', borderRadius: 6, textDecoration: 'none',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.target.style.background = '#00F5FF15'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; }}
            >◎ EXPLORE EVENTS</Link>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite' }}>
          <div style={{ width: 24, height: 40, border: '2px solid #00F5FF40', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 6 }}>
            <div style={{ width: 4, height: 8, background: '#00F5FF', borderRadius: 2, animation: 'scroll-dot 2s infinite' }} />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'var(--navy)', borderTop: '1px solid #1f2937', borderBottom: '1px solid #1f2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: '#00F5FF', textShadow: '0 0 20px #00F5FF50' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280', letterSpacing: 2, marginTop: 4 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 12 }}>// ABOUT_CLUB</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(about.title || 'Where Hackers<br /><span style="color: #00F5FF">Become Defenders</span>') }} />
            <p style={{ color: '#9CA3AF', lineHeight: 1.8, marginBottom: 16, fontSize: 15 }}>
              {about.paragraph1 || "Cysecsphere is Chandigarh University's premier cybersecurity club, founded with a mission to build the next generation of ethical hackers, security researchers, and digital defenders."}
            </p>
            <p style={{ color: '#9CA3AF', lineHeight: 1.8, marginBottom: 32, fontSize: 15 }}>
              {about.paragraph2 || 'We offer a unique blend of theoretical knowledge and hands-on practice through weekly CTF challenges, industry workshops, bug bounty programs, and national-level competitions.'}
            </p>
            <Link to="/team" style={{
              padding: '12px 24px', background: 'transparent', color: '#39FF14',
              fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 2,
              border: '1px solid #39FF1440', borderRadius: 6, display: 'inline-block',
              transition: 'all 0.2s',
            }}>MEET THE TEAM →</Link>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0D1117, #111827)',
              border: '1px solid #1f2937', borderRadius: 12, padding: '2rem',
              fontFamily: 'var(--font-mono)', fontSize: 13,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['#FF5F56', '#FFBD2E', '#27C93F'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
              </div>
              {[
                { p: '$', cmd: ' nmap -sV Cysecsphere.cu.ac.in', c: '#00F5FF' },
                { p: '', cmd: ' PORT   SERVICE  VERSION', c: '#6B7280' },
                { p: '', cmd: ' 80/tcp  http   Apache 2.4.52', c: '#39FF14' },
                { p: '', cmd: ' 443/tcp https  TLSv1.3', c: '#39FF14' },
                { p: '$', cmd: ' whoami', c: '#00F5FF' },
                { p: '', cmd: ' root@Cysecsphere', c: '#39FF14' },
                { p: '$', cmd: ' cat flag.txt', c: '#00F5FF' },
                { p: '', cmd: ' CSPHERE{w3lc0m3_t0_th3_cl4n}', c: '#FFD60A' },
              ].map((l, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {l.p && <span style={{ color: '#7C3AED' }}>{l.p}</span>}
                  <span style={{ color: l.c }}>{l.cmd}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ color: '#7C3AED' }}>$</span>
                <span style={{ width: 8, height: 16, background: '#00F5FF', animation: 'blink 1s infinite' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: 'var(--dark)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 12 }}>// WHAT_WE_DO</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700 }}>Our <span style={{ color: '#00F5FF' }}>Arsenal</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '1.8rem', transition: 'all 0.3s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00F5FF40'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#E2E8F0', marginBottom: 10, letterSpacing: 1 }}>{f.title}</h3>
                <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--black)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginBottom: 16 }}>
            Ready to <span style={{ color: '#7C3AED' }}>Join</span> the Sphere?
          </h2>
          <p style={{ color: '#9CA3AF', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Apply for membership and gain access to exclusive workshops, CTF teams, and our private security lab.
          </p>
          <Link to="/register" style={{
            padding: '16px 40px', background: 'linear-gradient(135deg, #7C3AED, #00F5FF)',
            color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 2,
            border: 'none', borderRadius: 8, display: 'inline-block',
            boxShadow: '0 0 40px rgba(124,58,237,0.4)', textDecoration: 'none',
          }}>APPLY NOW →</Link>
        </div>
      </section>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0) } 50% { transform: translateX(-50%) translateY(8px) } }
        @keyframes scroll-dot { 0%,100% { opacity:1; transform:translateY(0) } 50% { opacity:0.3; transform:translateY(10px) } }
        @media (max-width: 768px) {
          section > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
