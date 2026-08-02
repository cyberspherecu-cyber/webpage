import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL as API } from '../config';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/Toast';

const inputStyle = {
  width: '100%', background: '#0A0A0F', border: '1px solid #1f2937',
  color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export default function ProfileSettings() {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    college: user?.college || '',
  });
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  if (!user) {
    return (
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Login Required</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Please log in to edit your profile.</p>
          <Link to="/login" style={{ padding: '12px 24px', background: '#00F5FF', color: '#000', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>LOG IN</Link>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!profile.username || !profile.email) {
      setProfileError('Username and email are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/api/auth/profile`, profile, authHeader);
      if (res.data.success) {
        toast.success('Profile updated!');
        updateUser(res.data.user);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwords.currentPassword || !passwords.newPassword) {
      setPasswordError('Both password fields are required.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await axios.put(`${API}/api/auth/password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }, authHeader);
      if (res.data.success) {
        toast.success('Password changed!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    }
    setChangingPassword(false);
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--black)' }}>
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid #1f2937', padding: '2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00F5FF', letterSpacing: 4, marginBottom: 12 }}>// SETTINGS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 8 }}>
            Account Settings
          </h1>
          <p style={{ color: '#6B7280' }}>Manage your CTF account profile and password.</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {/* Profile Form */}
        <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, padding: '2rem', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00F5FF', letterSpacing: 2, marginBottom: 16 }}>// PROFILE</div>

          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Username *</label>
                <input value={profile.username} onChange={e => setProfile(f => ({ ...f, username: e.target.value }))} style={inputStyle} required />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Email *</label>
                <input type="email" value={profile.email} onChange={e => setProfile(f => ({ ...f, email: e.target.value }))} style={inputStyle} required />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>College</label>
              <input value={profile.college} onChange={e => setProfile(f => ({ ...f, college: e.target.value }))} style={inputStyle} placeholder="Your college / university" />
            </div>

            {profileError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF2D5515', border: '1px solid #FF2D5540', color: '#FF2D55', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>✗ {profileError}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{
                padding: '12px 28px', background: '#00F5FF', color: '#000', border: 'none', borderRadius: 8,
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'SAVING…' : 'SAVE CHANGES'}</button>
              <button type="button" onClick={() => setProfile({ username: user.username, email: user.email, college: user.college })} style={{
                padding: '12px 20px', background: 'transparent', color: '#6B7280', border: '1px solid #1f2937', borderRadius: 8,
                fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              }}>RESET</button>
            </div>
          </form>
        </div>

        {/* Password Change */}
        <div style={{ background: 'var(--card)', border: '1px solid #1f2937', borderRadius: 12, padding: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FFD60A', letterSpacing: 2, marginBottom: 16 }}>// CHANGE PASSWORD</div>

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Current Password *</label>
              <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(f => ({ ...f, currentPassword: e.target.value }))} style={inputStyle} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>New Password *</label>
                <input type="password" value={passwords.newPassword} onChange={e => setPasswords(f => ({ ...f, newPassword: e.target.value }))} style={inputStyle} required minLength={6} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Confirm Password *</label>
                <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(f => ({ ...f, confirmPassword: e.target.value }))} style={inputStyle} required />
              </div>
            </div>

            {passwordError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF2D5515', border: '1px solid #FF2D5540', color: '#FF2D55', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>✗ {passwordError}</div>
            )}

            <button type="submit" disabled={changingPassword} style={{
              padding: '12px 28px', background: '#FFD60A', color: '#000', border: 'none', borderRadius: 8,
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', opacity: changingPassword ? 0.7 : 1,
            }}>{changingPassword ? 'CHANGING…' : 'CHANGE PASSWORD'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
