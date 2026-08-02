import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Events from './pages/Events';
import Team from './pages/Team';
import Challenges from './pages/Challenges';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import GhostProtocol from './pages/GhostProtocol';
import Hacked from './pages/Hacked';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Resources from './pages/Resources';
import ProfileSettings from './pages/ProfileSettings';
import UserProfile from './pages/UserProfile';
import PersonalCTFList from './pages/PersonalCTFList';
import PersonalCTFJoin from './pages/PersonalCTFJoin';
import PersonalCTFArena from './pages/PersonalCTFArena';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';

function Footer() {
  const socials = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/cysecspherecu?igsh=MXZibmU2a25mbXVyMw=="
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/company/cysecsphere-cu"
    },
  ];

  return (
    <footer style={{
      background: '#0D1117',
      borderTop: '1px solid #1f2937',
      padding: '3rem 2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: '#00F5FF',
          letterSpacing: 4,
          marginBottom: 8
        }}>
          Cysecsphere
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: '#6B7280',
          letterSpacing: 3,
          marginBottom: 24
        }}>
          CHANDIGARH UNIVERSITY — CYBERSECURITY CLUB
        </div>

        {/* SOCIAL LINKS */}
        <div style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 24
        }}>
          {socials.map(s => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: '#6B7280',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.target.style.color = '#00F5FF';
              }}
              onMouseLeave={e => {
                e.target.style.color = '#6B7280';
              }}
            >
              {s.name}
            </a>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid #1f2937',
          paddingTop: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: '#374151'
        }}>
          © {new Date().getFullYear()} Cysecsphere Club — Chandigarh University. All rights reserved.
          {' · '}
          <Link to="/admin" style={{ color: '#374151', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#6B7280'}
            onMouseLeave={e => e.target.style.color = '#374151'}
          >Admin</Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/team" element={<Team />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/ghost-protocol" element={<GhostProtocol />} />
          <Route path="/hacked/:key" element={<Hacked />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/settings" element={<ProfileSettings />} />
          <Route path="/profile/:username" element={<UserProfile />} />
          <Route path="/arenas" element={<PersonalCTFList />} />
          <Route path="/arenas/join/:id" element={<PersonalCTFJoin />} />
          <Route path="/arenas/:id" element={<PersonalCTFArena />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
      </ToastProvider>
    </AuthProvider>
  );
}
