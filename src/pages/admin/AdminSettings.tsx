import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { AcademySettings } from '../../types';
import { Settings, Save, Check } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AcademySettings>(() => storageService.getSettings());
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
          Academy Settings & Defaults
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Platform pricing rules, store currency, and contact parameters
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.5rem', border: '1px solid #C8E6C9' }}>
            <Check size={18} />
            <span>Platform settings saved and persisted to demo storage!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              Academy Brand Name
            </label>
            <input
              type="text"
              required
              value={settings.academyName}
              onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              Academy Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Default New Course Price (INR)
              </label>
              <input
                type="number"
                min="0"
                required
                value={settings.defaultCoursePrice}
                onChange={(e) => setSettings({ ...settings, defaultCoursePrice: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Store Currency Symbol
              </label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="input-field"
                style={{ backgroundColor: '#FAF6F4' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Concierge Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Support Hotline
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: 'fit-content', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={16} /> Save Academy Settings
          </button>

        </form>

      </div>

    </div>
  );
};
