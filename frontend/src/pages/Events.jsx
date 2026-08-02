import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL as API, resolveMediaUrl } from '../config';

const EVENT_COLORS = {
  CTF: '#00F5FF',
  Workshop: '#39FF14',
  Bootcamp: '#7C3AED',
  Challenge: '#FFD60A',
  Hackathon: '#FF2D55',
  'Industrial Visit': '#8B5CF6',
  Seminar: '#FF6B6B',
  Meetup: '#FF8C00',
  Misc: '#6B7280',
};
const eventColor = (c) => EVENT_COLORS[c] || '#00F5FF';

/* ✅ Fallback sample data — shown automatically if the backend API isn't running.
   Once your backend is live, real data from /api/events will take over. */
const SAMPLE_EVENTS = [
  { id: 1, title: "Cysecsphere CTF 2024", date: "2024-11-15", startTime: "09:00", endTime: "17:00", location: "CU Campus, Block A Auditorium", type: "past", description: "Annual flagship CTF with 200+ participants from 30 colleges.", participants: 214, category: "CTF", coverPhoto: "https://picsum.photos/seed/cysec-ctf-finals/600/400" },
  { id: 2, title: "Web Hacking Workshop", date: "2024-10-20", startTime: "10:00", endTime: "16:30", location: "CU Campus, CS Lab 301", type: "past", description: "Hands-on OWASP Top 10 workshop with live exploitation demos.", participants: 87, category: "Workshop", coverPhoto: "https://picsum.photos/seed/cysec-web-workshop/600/400" },
  { id: 3, title: "Bug Bounty Bootcamp", date: "2024-09-05", startTime: "09:00", endTime: "17:00", location: "CU Campus, Seminar Hall", type: "past", description: "Industry experts led a 2-day intensive bug bounty training.", participants: 56, category: "Bootcamp", coverPhoto: "https://picsum.photos/seed/cysec-bootcamp/600/400" },
  { id: 4, title: "Forensics Friday", date: "2024-08-23", startTime: "18:00", endTime: "21:00", location: "CU Campus, CS Lab 302", type: "past", description: "Digital forensics challenge night with surprise prizes.", participants: 45, category: "Challenge", coverPhoto: "https://picsum.photos/seed/cysec-forensics/600/400" },
  { id: 5, title: "Advanced Exploitation Bootcamp", date: "2026-07-07", startTime: "09:00", endTime: "17:00", location: "CU Campus, Auditorium", type: "past", description: "A deep-dive bootcamp on binary exploitation and exploit development.", participants: 60, category: "Bootcamp", coverPhoto: null },
  { id: 6, title: "Hacker,hustler and hoodies:Cybersphere Induction Program", date: "2026-07-17", startTime: "10:00", endTime: "16:00", location: "CU Campus, Block B Auditorium", type: "upcoming", description: "Theme: Binary Exploitation & Pwn. Prizes for top 3!", category: "CTF" },
  { id: 7, title: "Panel Discussion & MEME Competition", date: "2026-08-11", startTime: "14:00", endTime: "17:00", location: "CU Campus, Open Air Theatre", type: "upcoming", description: "Join us for an evening of insightful discussion and hilarious memes!", category: "Workshop" },
  { id: 8, title: "Industrial Visit to PEC", date: "2026-08-21", startTime: "08:00", endTime: "17:00", location: "Punjab Engineering College (PEC)", type: "upcoming", description: "Exciting opportunity to visit the prestigious PEC campus and interact with faculty and students.", category: "Industrial Visit" },
];

/* Sample photos are grouped by eventId so the fallback data demonstrates
   the same "album per event" behavior as real data from /api/gallery. */
const SAMPLE_GALLERY = [
  { id: 1, eventId: 1, eventTitle: 'Cysecsphere CTF 2024', label: 'Finals Night', photo: 'https://picsum.photos/seed/cysec-ctf-finals/600/400', accent: '#7C3AED' },
  { id: 2, eventId: 1, eventTitle: 'Cysecsphere CTF 2024', label: 'Award Ceremony', photo: 'https://picsum.photos/seed/cysec-ctf-awards/600/400', accent: '#7C3AED' },
  { id: 3, eventId: 1, eventTitle: 'Cysecsphere CTF 2024', label: 'Team Cysecsphere — National Finals', photo: 'https://picsum.photos/seed/cysec-national-finals/600/400', accent: '#7C3AED' },
  { id: 4, eventId: 2, eventTitle: 'Web Hacking Workshop', label: 'Live Demo', photo: 'https://picsum.photos/seed/cysec-web-workshop/600/400', accent: '#00F5FF' },
  { id: 5, eventId: 3, eventTitle: 'Bug Bounty Bootcamp', label: 'Day 1', photo: 'https://picsum.photos/seed/cysec-bootcamp/600/400', accent: '#39FF14' },
  { id: 6, eventId: 4, eventTitle: 'Forensics Friday', label: 'Challenge Night', photo: 'https://picsum.photos/seed/cysec-forensics/600/400', accent: '#FF2D55' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [registering, setRegistering] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [regMsg, setRegMsg] = useState('');
  const [gallery, setGallery] = useState(SAMPLE_GALLERY);
  const [openAlbum, setOpenAlbum] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [dayForm, setDayForm] = useState({ name: '', email: '' });
  const [dayRegMsg, setDayRegMsg] = useState('');
  const [dayRegistering, setDayRegistering] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/events`)
      .then(r => setEvents(r.data && r.data.length ? r.data : SAMPLE_EVENTS))
      .catch(() => setEvents(SAMPLE_EVENTS));

    axios.get(`${API}/api/gallery`)
      .then(r => { if (r.data && r.data.length) setGallery(r.data); })
      .catch(() => {});
  }, []);

  // Group photos into one album per event — this is what turns multiple
  // uploads for the same event into a single clickable album instead of
  // several separate tiles.
  const albums = useMemo(() => {
    const byEvent = new Map();
    gallery.forEach(photo => {
      if (!byEvent.has(photo.eventId)) {
        byEvent.set(photo.eventId, { eventId: photo.eventId, eventTitle: photo.eventTitle, accent: photo.accent, photos: [] });
      }
      byEvent.get(photo.eventId).photos.push(photo);
    });
    return Array.from(byEvent.values());
  }, [gallery]);

  // Map eventId -> number of photos uploaded, so event cards can show a
  // "📷 N photos" badge and link through to their gallery album.
  const photoCountByEvent = useMemo(() => {
    const m = {};
    gallery.forEach(p => { m[p.eventId] = (m[p.eventId] || 0) + 1; });
    return m;
  }, [gallery]);

  const albumByEventId = useMemo(() => {
    const m = {};
    albums.forEach(a => { m[a.eventId] = a; });
    return m;
  }, [albums]);

  const past = events.filter(e => e.type === 'past');
  const upcoming = events.filter(e => e.type === 'upcoming');

  const handleRegister = async (eventId) => {
    if (!form.name || !form.email) return;
    try {
      const r = await axios.post(`${API}/api/events/register`, { ...form, eventId });
      setRegMsg(r.data.message);
      setTimeout(() => { setRegistering(null); setRegMsg(''); setForm({ name: '', email: '' }); }, 3000);
    } catch { setRegMsg('Registration failed. Try again.'); }
  };

  const handleDayRegister = async (eventId) => {
    if (!dayForm.name || !dayForm.email) return;
    try {
      const r = await axios.post(`${API}/api/events/register`, { ...dayForm, eventId });
      setDayRegMsg(r.data.message);
      setTimeout(() => { setDayRegMsg(''); setDayForm({ name: '', email: '' }); }, 3000);
    } catch { setDayRegMsg('Registration failed. Try again.'); }
  };

  const mailtoRegisterLink = (ev) => {
    const subject = encodeURIComponent(`Registration: ${ev.title}`);
    const body = encodeURIComponent(
      `Hi Cysecsphere team,\n\nI'd like to register for "${ev.title}" (${ev.date}).\n\nName: ${form.name || '[Your Name]'}\nEmail: ${form.email || '[Your Email]'}\n\nThanks!`
    );
    return `mailto:Cysecsphere@cumail.in?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 12 }}>// EVENTS_MODULE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900 }}>
            Events & <span style={{ color: '#00F5FF' }}>Activities</span>
          </h1>
          <p style={{ color: '#6B7280', marginTop: 12, maxWidth: 600, lineHeight: 1.7 }}>
            From intense CTF battles to hands-on workshops — here's everything happening in the Cysecsphere.
          </p>
        </div>
      </div>

      {/* Gallery */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#39FF14', letterSpacing: 4, marginBottom: 24 }}>// PAST_EVENTS_GALLERY</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 32 }}>Event <span style={{ color: '#39FF14' }}>Glimpses</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {albums.map(album => {
            const cover = album.photos[0];
            const count = album.photos.length;
            return (
              <div key={album.eventId} onClick={() => setOpenAlbum(album)} style={{
                background: 'var(--card)', border: `1px solid ${album.accent}30`,
                borderRadius: 12, aspectRatio: '16/10', overflow: 'hidden',
                position: 'relative', cursor: 'pointer', transition: 'transform 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src={resolveMediaUrl(cover.photo)} alt={cover.label} loading="lazy" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', filter: 'grayscale(30%) brightness(0.75)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(to top, ${album.accent}30 0%, rgba(10,10,15,0.15) 55%, rgba(10,10,15,0.05) 100%)`,
                }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', letterSpacing: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{album.eventTitle}</div>
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, background: `${album.accent}30`, border: `1px solid ${album.accent}60`, borderRadius: 4, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff', backdropFilter: 'blur(4px)' }}>
                  {count > 1 ? `📷 ${count} PHOTOS` : 'EVENT'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Album lightbox — opens all photos for the clicked event */}
      {openAlbum && (
        <div
          onClick={() => setOpenAlbum(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(6px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 1000, width: '100%', maxHeight: '85vh', overflowY: 'auto',
              background: 'var(--card)', border: `1px solid ${openAlbum.accent}40`, borderRadius: 16, padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: openAlbum.accent, letterSpacing: 2, marginBottom: 6 }}>
                  // EVENT_ALBUM · {openAlbum.photos.length} PHOTO{openAlbum.photos.length > 1 ? 'S' : ''}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{openAlbum.eventTitle}</h3>
              </div>
              <button onClick={() => setOpenAlbum(null)} style={{
                background: 'transparent', border: '1px solid #1f2937', color: '#9CA3AF',
                borderRadius: 8, width: 36, height: 36, minWidth: 36, cursor: 'pointer', fontSize: 16,
              }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {openAlbum.photos.map(p => (
                <div key={p.id} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${openAlbum.accent}30`, background: '#0A0A0F' }}>
                  <img src={resolveMediaUrl(p.photo)} alt={p.label} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                  {p.label && (
                    <div style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>{p.label}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Calendar */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 8 }}>// CALENDAR</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 32 }}>
          Event <span style={{ color: '#00F5FF' }}>Calendar</span>
        </h2>

        <div style={{
          background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 16,
          padding: '1.5rem', marginBottom: 40,
        }}>
          {/* Month header with navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={{
                background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#00F5FF'; e.currentTarget.style.borderColor = '#00F5FF40'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#1f2937'; }}
                title="Previous month"
              >‹</button>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, minWidth: 180, textAlign: 'center' }}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={{
                background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#00F5FF'; e.currentTarget.style.borderColor = '#00F5FF40'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#1f2937'; }}
                title="Next month"
              >›</button>
              <button onClick={() => setCalendarMonth(new Date())} style={{
                background: 'transparent', border: '1px solid #1f2937', color: '#6B7280',
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
                transition: 'all 0.2s', marginLeft: 4,
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#00F5FF'; e.currentTarget.style.borderColor = '#00F5FF40'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#1f2937'; }}
                title="Jump to current month"
              >TODAY</button>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} style={{
                  width: 36, textAlign: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7280', letterSpacing: 1,
                }}>{d}</div>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(() => {
              const year = calendarMonth.getFullYear();
              const month = calendarMonth.getMonth();
              const today = new Date();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
              const totalDays = lastDay.getDate();
              const weeks = [];
              let day = 1;

              // Build a map of upcoming events by day number
              const eventsByDay = {};
              const allEventsThisMonth = [...upcoming, ...past];
              allEventsThisMonth.forEach(ev => {
                const evDate = new Date(ev.date);
                if (evDate.getFullYear() === year && evDate.getMonth() === month) {
                  const d = evDate.getDate();
                  if (!eventsByDay[d]) eventsByDay[d] = [];
                  eventsByDay[d].push(ev);
                }
              });

              for (let w = 0; w < 6; w++) {
                if (day > totalDays) break;
                const cells = [];
                for (let d = 0; d < 7; d++) {
                  if ((w === 0 && d < startOffset) || day > totalDays) {
                    cells.push(<div key={`e-${w}-${d}`} style={{ width: 36, height: 36 }} />);
                  } else {
                    const dayEvents = eventsByDay[day] || [];
                    const hasUpcoming = dayEvents.some(e => e.type === 'upcoming');
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    cells.push(
                      <div key={`d-${day}`} onClick={() => dayEvents.length > 0 && setSelectedDayEvents(dayEvents)} style={{
                        width: 36, height: 36, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                        background: isToday ? '#00F5FF20' : 'transparent',
                        border: isToday ? '1px solid #00F5FF60' : 'none',
                        color: hasUpcoming ? '#00F5FF' : isToday ? '#00F5FF' : '#E2E8F0',
                        position: 'relative',
                        cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}
                        title={dayEvents.map(e => e.title).join(', ')}
                      >
                        {day}
                        {dayEvents.length > 0 && (
                          <div style={{
                            position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', gap: 2,
                          }}>
                            {dayEvents.map((e, i) => (
                              <div key={i} style={{
                                width: 4, height: 4, borderRadius: '50%',
                                background: e.type === 'upcoming' ? '#00F5FF' : eventColor(e.category),
                              }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                    day++;
                  }
                }
                weeks.push(
                  <div key={`w-${w}`} style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    {cells}
                  </div>
                );
              }
              return weeks;
            })()}
          </div>
        </div>

        {/* Upcoming events listed below the calendar */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 8 }}>// UPCOMING</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>
          {calendarMonth.toLocaleDateString('en-US', { month: 'long' })} <span style={{ color: '#00F5FF' }}>Events</span>
        </h2>
        {upcoming.filter(ev => {
          const evDate = new Date(ev.date);
          return evDate.getMonth() === calendarMonth.getMonth() && evDate.getFullYear() === calendarMonth.getFullYear();
        }).length === 0 && (
          <p style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 20 }}>
            No events in {calendarMonth.toLocaleDateString('en-US', { month: 'long' })}. Navigate to another month or check all upcoming events below.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {upcoming.filter(ev => {
            const evDate = new Date(ev.date);
            return evDate.getMonth() === calendarMonth.getMonth() && evDate.getFullYear() === calendarMonth.getFullYear();
          }).map(ev => (
            <div key={ev.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 10,
              padding: '12px 16px', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#00F5FF40'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1f2937'}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${eventColor(ev.category)}20`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: eventColor(ev.category), lineHeight: 1 }}>
                  {new Date(ev.date).getDate()}
                </div>
                <div style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  {new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{ev.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  {ev.startTime && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF' }}>
                      🕐 {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}
                    </span>
                  )}
                  {ev.location && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9CA3AF' }}>
                      📍 {ev.location}
                    </span>
                  )}
                  <span style={{
                    background: `${eventColor(ev.category)}15`,
                    color: eventColor(ev.category),
                    borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)', fontSize: 10,
                  }}>{ev.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Day event popup */}
        {selectedDayEvents && (
          <div onClick={() => { setSelectedDayEvents(null); setDayRegMsg(''); setDayRegistering(null); }} style={{
            position: 'fixed', inset: 0, background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(6px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'var(--card)', border: '1px solid #00F5FF40', borderRadius: 16,
              padding: '1.5rem', maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00F5FF', letterSpacing: 2, marginBottom: 4 }}>
                    // EVENTS · {selectedDayEvents.length} ON {new Date(selectedDayEvents[0].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Day Details</h3>
                </div>
                <button onClick={() => { setSelectedDayEvents(null); setDayRegMsg(''); setDayRegistering(null); }} style={{
                  background: 'transparent', border: '1px solid #1f2937', color: '#9CA3AF',
                  borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 15,
                }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedDayEvents.map(ev => (
                  <div key={ev.id} style={{
                    background: '#0A0A0F', border: '1px solid #1f2937', borderRadius: 10,
                    padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 4 }}>{ev.title}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {ev.startTime && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00F5FF' }}>🕐 {ev.startTime}{ev.endTime ? `-${ev.endTime}` : ''}</span>
                          )}
                          {ev.location && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9CA3AF' }}>📍 {ev.location}</span>
                          )}
                          <span style={{
                            background: `${eventColor(ev.category)}15`,
                            color: eventColor(ev.category),
                            borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)', fontSize: 9,
                          }}>{ev.category}</span>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{ev.description}</p>
                    {ev.type === 'upcoming' ? (
                      <>
                        {dayRegistering === ev.id ? (
                          <div style={{ background: 'var(--navy)', border: '1px solid #1f2937', borderRadius: 8, padding: '0.8rem' }}>
                            {dayRegMsg ? (
                              <div style={{ color: '#39FF14', fontFamily: 'var(--font-mono)', fontSize: 12 }}>✓ {dayRegMsg}</div>
                            ) : (
                              <>
                                <input placeholder="Your name" value={dayForm.name} onChange={e => setDayForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', background: '#0A0A0F', border: '1px solid #1f2937', color: '#E2E8F0', padding: '7px 10px', borderRadius: 6, marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                                <input placeholder="Email" value={dayForm.email} onChange={e => setDayForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', background: '#0A0A0F', border: '1px solid #1f2937', color: '#E2E8F0', padding: '7px 10px', borderRadius: 6, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => handleDayRegister(ev.id)} style={{ flex: 1, padding: '7px', background: '#00F5FF', color: '#0A0A0F', border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>CONFIRM</button>
                                  <button onClick={() => { setDayRegistering(null); setDayForm({ name: '', email: '' }); }} style={{ padding: '7px 10px', background: 'transparent', color: '#6B7280', border: '1px solid #1f2937', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>CANCEL</button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                                  <span style={{ flex: 1, height: 1, background: '#1f2937' }} />
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4B5563', letterSpacing: 1 }}>OR</span>
                                  <span style={{ flex: 1, height: 1, background: '#1f2937' }} />
                                </div>
                                <a href={mailtoRegisterLink(ev)} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                  width: '100%', padding: '7px', background: 'transparent', color: '#39FF14',
                                  border: '1px solid #39FF1440', borderRadius: 6, textDecoration: 'none',
                                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
                                  transition: 'all 0.2s', boxSizing: 'border-box',
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#39FF1415'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >✉ REGISTER VIA EMAIL</a>
                              </>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setDayRegistering(ev.id); setDayForm({ name: '', email: '' }); setDayRegMsg(''); }} style={{
                              flex: 1, padding: '8px', background: 'transparent', color: '#00F5FF',
                              border: '1px solid #00F5FF60', borderRadius: 6, fontFamily: 'var(--font-mono)',
                              fontSize: 11, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = '#00F5FF15'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >REGISTER →</button>
                            <a href={mailtoRegisterLink(ev)} title="Register via email" style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'transparent', color: '#39FF14', width: 38,
                              border: '1px solid #39FF1450', borderRadius: 6, textDecoration: 'none',
                              transition: 'all 0.2s', fontSize: 14,
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = '#39FF1415'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >✉</a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>📅 Past event — registration closed</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Past Events */}
      <section style={{ background: 'var(--dark)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7280', letterSpacing: 4, marginBottom: 8 }}>// COMPLETED</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 32 }}>Past <span style={{ color: '#6B7280' }}>Events</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {past.map(ev => {
              const photoCount = photoCountByEvent[ev.id] || 0;
              const album = albumByEventId[ev.id];
              const accent = album?.accent || eventColor(ev.category);
              return (
                <div key={ev.id} onClick={() => album && setOpenAlbum(album)} style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                  overflow: 'hidden', cursor: album ? 'pointer' : 'default',
                  transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                }}
                  onMouseEnter={e => {
                    if (album) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = `${accent}50`;
                      e.currentTarget.style.boxShadow = `0 8px 30px ${accent}18`;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {ev.coverPhoto ? (
                    <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                      <img src={resolveMediaUrl(ev.coverPhoto)} alt={ev.title} loading="lazy" style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        filter: 'grayscale(25%) brightness(0.75)', transition: 'transform 0.4s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {photoCount > 0 && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(10,10,15,0.75)', border: `1px solid ${accent}60`,
                          borderRadius: 4, padding: '4px 8px', fontFamily: 'var(--font-mono)',
                          fontSize: 10, color: '#fff', backdropFilter: 'blur(4px)',
                        }}>📷 {photoCount} {photoCount > 1 ? 'PHOTOS' : 'PHOTO'}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ position: 'relative', height: 6, background: accent }}>
                      {photoCount > 0 && (
                        <div style={{
                          position: 'absolute', top: -14, right: 10,
                          background: 'rgba(10,10,15,0.75)', border: `1px solid ${accent}60`,
                          borderRadius: 4, padding: '4px 8px', fontFamily: 'var(--font-mono)',
                          fontSize: 10, color: '#fff', backdropFilter: 'blur(4px)',
                        }}>📷 {photoCount} {photoCount > 1 ? 'PHOTOS' : 'PHOTO'}</div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>                      <span style={{ background: `${eventColor(ev.category)}20`, color: eventColor(ev.category), borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1 }}>{ev.category}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280' }}>{ev.date}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{ev.title}</h3>
                    <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{ev.description}</p>
                    {ev.location && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>📍 {ev.location}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#39FF14' }}>👥 {ev.participants} participants</div>
                      {album && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: accent, letterSpacing: 1 }}>VIEW ALBUM →</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 8 }}>// UPCOMING</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 32 }}>Upcoming <span style={{ color: '#00F5FF' }}>Events</span></h2>
        <div style={{ display: 'grid', gap: 20 }}>
          {upcoming.map(ev => (
            <div key={ev.id} style={{
              background: 'var(--card)', border: '1px solid #00F5FF20',
              borderRadius: 10, padding: '1.8rem', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#00F5FF50'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#00F5FF20'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ background: `${eventColor(ev.category)}20`, color: eventColor(ev.category), borderRadius: 4, padding: '3px 10px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{ev.category}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF' }}>📅 {ev.date}</span>
                {ev.location && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9CA3AF' }}>📍 {ev.location}</span>
                )}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{ev.title}</h3>
                <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>{ev.description}</p>
              </div>
              {registering === ev.id ? (
                <div style={{ background: 'var(--navy)', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem', minWidth: 280 }}>
                  {regMsg ? (
                    <div style={{ color: '#39FF14', fontFamily: 'var(--font-mono)', fontSize: 13 }}>✓ {regMsg}</div>
                  ) : (
                    <>
                      <input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', background: '#0A0A0F', border: '1px solid #1f2937', color: '#E2E8F0', padding: '8px 12px', borderRadius: 6, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }} />
                      <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', background: '#0A0A0F', border: '1px solid #1f2937', color: '#E2E8F0', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleRegister(ev.id)} style={{ flex: 1, padding: '8px', background: '#00F5FF', color: '#0A0A0F', border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>CONFIRM</button>
                        <button onClick={() => setRegistering(null)} style={{ padding: '8px 12px', background: 'transparent', color: '#6B7280', border: '1px solid #1f2937', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>CANCEL</button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                        <span style={{ flex: 1, height: 1, background: '#1f2937' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4B5563', letterSpacing: 1 }}>OR</span>
                        <span style={{ flex: 1, height: 1, background: '#1f2937' }} />
                      </div>

                      <a
                        href={mailtoRegisterLink(ev)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          width: '100%', padding: '8px', background: 'transparent',
                          color: '#39FF14', border: '1px solid #39FF1440', borderRadius: 6,
                          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1,
                          textDecoration: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#39FF1415'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        ✉ REGISTER VIA EMAIL
                      </a>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setRegistering(ev.id)} style={{
                    padding: '12px 24px', background: 'transparent', color: '#00F5FF',
                    border: '1px solid #00F5FF60', borderRadius: 8, fontFamily: 'var(--font-mono)',
                    fontSize: 13, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                    onMouseEnter={e => { e.target.style.background = '#00F5FF15'; }}
                    onMouseLeave={e => { e.target.style.background = 'transparent'; }}
                  >REGISTER →</button>

                  <a
                    href={mailtoRegisterLink(ev)}
                    title="Register via email instead"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 44, padding: '12px', background: 'transparent', color: '#39FF14',
                      border: '1px solid #39FF1450', borderRadius: 8, textDecoration: 'none',
                      transition: 'all 0.2s', fontSize: 15,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#39FF1415'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    ✉
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
