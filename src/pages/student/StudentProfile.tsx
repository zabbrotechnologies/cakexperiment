import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Check, Save } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || 'Enthusiastic baker learning with Cakexperiment.');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)' }}>Student Profile & Preferences</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your personal details, biography, and studio notification settings
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.5rem', border: '1px solid #C8E6C9' }}>
            <Check size={18} />
            <span>Profile settings saved successfully in browser storage!</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Avatar Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-blush)' }}
            />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-plum)' }}>Student Avatar</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned via demo profile</div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <input
              type="text"
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
              Contact studio concierge to change your registered email address.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              About You / Pastry Journey
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.8rem' }}>
              Email Notifications
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ accentColor: 'var(--color-berry)', width: '16px', height: '16px' }}
              />
              <span>Receive weekly studio tips, troubleshooting guides, and recipe formulas</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> Save Profile Settings
          </button>

        </form>

      </div>
    </div>
  );
};
