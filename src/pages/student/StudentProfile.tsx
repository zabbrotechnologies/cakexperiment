import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Check, Save, Lock, Phone, LogOut, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentProfile: React.FC = () => {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [bio, setBio] = useState((user as any)?.bio || 'Enthusiastic baker learning with Cakexperiment.');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    // Fetch latest profile from Neon PostgreSQL
    const token = localStorage.getItem('cakexperiment_auth_token');
    fetch('/api/user/profile', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile) {
          setName(data.profile.name || user?.name || '');
          setPhone(data.profile.phone || '');
          setBio(data.profile.bio || 'Enthusiastic baker learning with Cakexperiment.');
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name, phone, bio })
      });

      if (res.ok) {
        setProfileSuccess('Profile settings successfully saved to Neon database!');
        refreshUser();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileSuccess(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update password');

      setPasswordSuccess('Password successfully changed! Your account is secured.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setPasswordSuccess(null), 4000);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <div style={{ maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)' }}>Account & Profile Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your personal details, secure login password, and studio preferences
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'profile' ? 'var(--color-berry)' : 'transparent',
            color: activeTab === 'profile' ? '#FFFFFF' : 'var(--color-plum)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'password' ? 'var(--color-berry)' : 'transparent',
            color: activeTab === 'password' ? '#FFFFFF' : 'var(--color-plum)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Change Password
        </button>
        <button
          onClick={handleLogout}
          style={{
            marginLeft: 'auto',
            padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FFCDD2',
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        
        {activeTab === 'profile' ? (
          <div>
            {profileSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.5rem', border: '1px solid #C8E6C9' }}>
                <Check size={18} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Avatar Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <img
                  src={(user as any)?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'}
                  alt={user?.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-blush)' }}
                />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-plum)' }}>Student Profile Avatar</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-berry)', fontFamily: 'monospace' }}>User ID: {user?.id}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input-field"
                  style={{ backgroundColor: '#FAF6F4', cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.3rem' }}>
                  Your primary studio identity is locked to prevent unauthorized transfer.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Phone Number (For WhatsApp Concierge)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  About You / Baking Journey
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={16} /> {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>

            </form>
          </div>
        ) : (
          <div>
            {passwordSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.5rem', border: '1px solid #C8E6C9' }}>
                <Check size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.5rem', border: '1px solid #FFCDD2' }}>
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  New Password (at least 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Lock size={16} /> {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
};
export default StudentProfile;
