import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';

const DEPARTMENTS = [
  'AIT - CSE',
  'AIT - CSE (AI & ML)',
  'AIT - CSE (Cyber Security)',
  'AIT - IT',
  'General',
  'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11,
  color: '#6B7280', letterSpacing: 1, marginBottom: 6,
};

const initialForm = { name: '', uid: '', email: '', department: DEPARTMENTS[0], year: YEARS[0], contact: '' };

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const mailtoFallback = () => {
    const subject = encodeURIComponent('Cysecsphere Membership Registration');
    const body = encodeURIComponent(
      `Hi Cysecsphere team,\n\nI'd like to register as a member.\n\nName: ${form.name || '[Your Name]'}\nUID: ${form.uid || '[Your UID]'}\nOfficial Mail: ${form.email || '[Your Email]'}\nDepartment: ${form.department}\nYear: ${form.year}\nContact No: ${form.contact || '[Your Contact No]'}\n\nThanks!`
    );
    return `mailto:Cysecsphere@cumail.in?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(form.contact)) {
      setError('Please enter a valid 10-digit contact number.');
      return;
    }

    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/members/register`, form);
      if (r.data.success) {
        setSuccess(r.data.message);
        setForm(initialForm);
      } else {
        setError(r.data.message || 'Something went wrong. Try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reach the server. You can email us directly instead.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      paddingTop: 72, minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 2rem 3rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'var(--card)',
        border: '1px solid #1f2937', borderRadius: 16, padding: '2.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#7C3AED', letterSpacing: 4, marginBottom: 8, textAlign: 'center' }}>
            // MEMBERSHIP_REGISTRATION
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>
            Join <span style={{ color: '#7C3AED' }}>Cysecsphere</span>
          </h1>
          <p style={{ color: '#6B7280', textAlign: 'center', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
            Fill in your details to become a registered club member.
          </p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#39FF1420',
                border: '1px solid #39FF1450', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 28, margin: '0 auto 20px', color: '#39FF14',
              }}>✓</div>
              <p style={{ color: '#E2E8F0', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{success}</p>
              <Link to="/" style={{
                display: 'inline-block', padding: '12px 28px', background: '#7C3AED20',
                color: '#7C3AED', border: '1px solid #7C3AED50', borderRadius: 8,
                fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1.5, textDecoration: 'none',
              }}>← BACK TO HOME</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>FULL NAME</label>
                <input placeholder="Anmoldeep Singh Khaira" value={form.name} onChange={update('name')} style={inputStyle} required />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>UID</label>
                  <input placeholder="e.g. 23BCS10001" value={form.uid} onChange={update('uid')} style={inputStyle} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>CONTACT NO.</label>
                  <input type="tel" placeholder="10-digit number" value={form.contact} onChange={update('contact')} style={inputStyle} required maxLength={10} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>OFFICIAL MAIL</label>
                <input type="email" placeholder="yourname@cumail.in" value={form.email} onChange={update('email')} style={inputStyle} required />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>DEPARTMENT</label>
                  <select value={form.department} onChange={update('department')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>YEAR</label>
                  <select value={form.year} onChange={update('year')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, background: '#FF2D5515',
                  border: '1px solid #FF2D5540', color: '#FF2D55',
                  fontFamily: 'var(--font-mono)', fontSize: 12.5, marginBottom: 16,
                }}>
                  ✗ {error}{' '}
                  <a href={mailtoFallback()} style={{ color: '#FF2D55', textDecoration: 'underline' }}>Email us instead →</a>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7C3AED, #00F5FF)',
                color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13,
                fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}>
                {loading ? 'SUBMITTING…' : 'REGISTER NOW →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link to="/" style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12, textDecoration: 'none' }}>
                  ← Back to Home
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
