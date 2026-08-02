import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL as API, resolveMediaUrl } from '../config';

const ROLE_COLORS = {
  'Secretary': '#FFD60A',
  'Joint Secretary': '#FF2D55',
  'Technical Lead': '#00F5FF',
  'Management Lead': '#39FF14',
  'Discipline Lead': '#7C3AED',
  'Social Media Lead': '#EC4899',
  'Content Lead': '#06B6D4',
  'Design Lead': '#F97316',
  'Operations Coordinator': '#FF2D55',
  'Event Coordinator': '#A3E635',
  'PR & Outreach Lead': '#38BDF8',
  'Anchor': '#FF8C00',
};

const AVATAR_COLORS = [
  '#7C3AED', '#00F5FF', '#39FF14',
  '#FF2D55', '#FFD60A', '#FF8C00',
  '#06B6D4', '#EC4899', '#F97316',
  '#A3E635', '#38BDF8', '#7C3AED'
];

/* ✅ Fallback team data — shown if the backend API isn't reachable.
   Once the backend is live, /api/team returns the admin-managed roster. */
const FALLBACK_TEAM = [
  { id: 1, name: "Mehakpreet Kaur", role: "Secretary", avatar: "M", bio: "Leading Cysecsphere with passion for cybersecurity and innovation.", social: "@mehak", section: "leadership", order: 1 },
  { id: 2, name: "Arya Jha", role: "Joint Secretary", avatar: "A", bio: "Managing operations and building a strong, driven community.", social: "@arya", section: "leadership", order: 2 },
  { id: 3, name: "Ashutosh Kumar", role: "Technical Lead", avatar: "T", bio: "Handles all technical infrastructure, labs, and CTF challenges.", social: "@techlead", section: "core", order: 1 },
  { id: 4, name: "Nireeksha Bhatt", role: "Management Lead", avatar: "M", bio: "Oversees planning, logistics, and smooth day-to-day running of the club.", social: "@mgmtlead", section: "core", order: 2 },
  { id: 5, name: "Yashika Siwach", role: "Social Media Lead", avatar: "S", bio: "Runs the club's socials and keeps everyone posted on events & wins.", social: "@sociallead", section: "core", order: 3 },
  { id: 6, name: "Anmoldeep Singh Khaira", role: "Discipline Lead", avatar: "D", bio: "Ensures order, conduct, and fair play across events and sessions.", social: "@disciplinelead", section: "core", order: 4 },
  { id: 7, name: "Sejal Sharma", role: "Anchor", avatar: "A", bio: "Hosts events and sessions, keeping the energy high on stage.", social: "@anchor", section: "core", order: 5 },
];

export default function Team() {
  const [members, setMembers] = useState(FALLBACK_TEAM);

  useEffect(() => {
    axios.get(`${API}/api/team`)
      .then(r => { if (r.data && r.data.length) setMembers(r.data); })
      .catch(() => {}); // keep fallback if backend is offline
  }, []);

  const leadership = members.filter(m => m.section === 'leadership');
  const core = members.filter(m => m.section !== 'leadership');

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'var(--navy)',
        borderBottom: '1px solid #1f2937',
        padding: '2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(124,58,237,0.12) 0%, transparent 70%)'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: '#7C3AED',
            letterSpacing: 4,
            marginBottom: 12
          }}>
            // CORE_TEAM
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900
          }}>
            The <span style={{ color: '#7C3AED' }}>Minds</span> Behind Cysecsphere
          </h1>

          <p style={{
            color: '#6B7280',
            marginTop: 16,
            maxWidth: 600,
            margin: '16px auto 0',
            lineHeight: 1.7
          }}>
            Meet the dedicated team of security enthusiasts who run the club, organize events, and mentor the next generation of hackers.
          </p>
        </div>
      </div>

      {/* LEADERSHIP */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem 0' }}>
        <SectionLabel color="#FFD60A" text="// LEADERSHIP" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 28
        }}>
          {leadership.map((member, i) => (
            <TeamCard
              key={member.id}
              member={member}
              color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
            />
          ))}
        </div>
      </section>

      {/* CORE TEAM */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem 5rem' }}>
        <SectionLabel color="#00F5FF" text="// CORE_TEAM_LEADS" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 28
        }}>
          {core.map((member, i) => (
            <TeamCard
              key={member.id}
              member={member}
              color={AVATAR_COLORS[(i + leadership.length) % AVATAR_COLORS.length]}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--dark)', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: '#39FF14',
            letterSpacing: 4,
            marginBottom: 16
          }}>
            // JOIN_THE_CORE
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 700,
            marginBottom: 16
          }}>
            Want to be on the <span style={{ color: '#39FF14' }}>Core Team</span>?
          </h2>

          <p style={{
            color: '#6B7280',
            lineHeight: 1.7,
            marginBottom: 32
          }}>
            Applications open every semester. Prove your skills via CTF & events.
          </p>

          <a href="mailto:Cysecsphere@cumail.in" style={{
            padding: '14px 32px',
            background: '#39FF1420',
            color: '#39FF14',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: 2,
            border: '1px solid #39FF1440',
            borderRadius: 8,
            display: 'inline-block'
          }}>
            APPLY NOW →
          </a>
        </div>
      </section>
    </div>
  );
}

/* Circular social link icon button */
const socialIcon = (accent) => ({
  width: 36, height: 36, borderRadius: '50%', minWidth: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
  color: accent, textDecoration: 'none',
  background: `${accent}15`, border: `1px solid ${accent}40`,
  transition: 'all 0.2s',
});

/* SECTION LABEL */
function SectionLabel({ color, text }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 32
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color,
        letterSpacing: 3,
        whiteSpace: 'nowrap'
      }}>
        {text}
      </span>
      <span style={{ flex: 1, height: 1, background: `${color}25` }} />
    </div>
  );
}

/* CARD COMPONENT */
function TeamCard({ member, color }) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const roleColor = ROLE_COLORS[member.role] || '#00F5FF';
  const email = member.email || `${member.name.split(' ')[0].toLowerCase()}@cysecsphere.com`;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      style={{ perspective: 1000, height: 320, cursor: 'pointer' }}
      onClick={() => setFlipped(f => !f)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s',
        transform: flipped
          ? 'rotateY(180deg)'
          : hovered ? 'rotateY(0) translateY(-6px)' : 'rotateY(0)',
      }}>

        {/* FRONT */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          background: 'var(--card)',
          border: `1px solid ${color}30`,
          borderRadius: 12,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: hovered ? `0 12px 32px ${color}25` : 'none',
          transition: 'box-shadow 0.3s',
        }}>
          {member.photo && !photoFailed ? (
            <img
              src={resolveMediaUrl(member.photo)}
              alt={member.name}
              onError={() => setPhotoFailed(true)}
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `2px solid ${color}60`,
                background: '#0A0A0F',
                marginBottom: 20,
              }}
            />
          ) : (
            <div style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
              border: `2px solid ${color}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color,
              marginBottom: 20,
            }}>
              {member.avatar}
            </div>
          )}

          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>
            {member.name}
          </h3>

          <div style={{
            fontSize: 12,
            color: roleColor,
            margin: '8px 0 16px',
            padding: '4px 12px',
            background: `${roleColor}15`,
            borderRadius: 20
          }}>
            {member.role.toUpperCase()}
          </div>

          <p style={{ color: '#6B7280', fontSize: 13 }}>
            {member.bio}
          </p>

          <div style={{ marginTop: 'auto', fontSize: 11, color: '#374151' }}>
            click to flip →
          </div>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: `linear-gradient(135deg, var(--card), ${color}10)`,
          border: `1px solid ${color}50`,
          borderRadius: 12,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <h3 style={{ color }}>{member.name}</h3>

          {/* Social links (only shown when set by admin) */}
          {(member.linkedin || member.github || member.instagram) && (
            <div style={{ display: 'flex', gap: 10, margin: '16px 0 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="LinkedIn" aria-label="LinkedIn"
                  style={socialIcon('#0A66C2')}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0A66C230'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0A66C215'; e.currentTarget.style.transform = 'none'; }}
                >in</a>
              )}
              {member.github && (
                <a href={member.github} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="GitHub" aria-label="GitHub"
                  style={socialIcon('#E2E8F0')}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F030'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#E2E8F015'; e.currentTarget.style.transform = 'none'; }}
                >GH</a>
              )}
              {member.instagram && (
                <a href={member.instagram} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Instagram" aria-label="Instagram"
                  style={socialIcon('#EC4899')}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EC489930'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#EC489915'; e.currentTarget.style.transform = 'none'; }}
                >IG</a>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={`mailto:${email}`}
              onClick={e => e.stopPropagation()}
              style={{
                padding: '8px 18px',
                background: `${color}20`,
                color,
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: 1,
                border: `1px solid ${color}40`,
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}35`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.transform = 'none'; }}
            >
              ✉ EMAIL
            </a>

            <button
              onClick={handleCopy}
              style={{
                padding: '8px 18px',
                background: copied ? '#39FF1420' : 'transparent',
                color: copied ? '#39FF14' : color,
                borderRadius: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: 1,
                border: `1px solid ${copied ? '#39FF1450' : `${color}40`}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { if (!copied) { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={e => { if (!copied) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; } }}
            >
              {copied ? '✓ COPIED' : '⧉ COPY'}
            </button>
          </div>

          <div style={{ marginTop: 14, fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
            {email}
          </div>
        </div>
      </div>
    </div>
  );
}