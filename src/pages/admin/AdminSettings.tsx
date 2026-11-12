import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { ecommerceApi } from '../../services/ecommerceApi';
import { AcademySettings, StoreConfig } from '../../types';
import { Settings, Save, Check, Database, HardDrive, RefreshCw, Server, ShieldCheck, UploadCloud, Truck } from 'lucide-react';
import { neonService, NeonStatus } from '../../services/neonService';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AcademySettings>(() => storageService.getSettings());
  const [saved, setSaved] = useState(false);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    standardShippingFee: 99,
    expressShippingFee: 199,
    freeShippingThreshold: 1499,
    standardDeliveryDaysMin: 5,
    standardDeliveryDaysMax: 7,
    expressDeliveryDaysMin: 2,
    expressDeliveryDaysMax: 3
  });
  const [storeSaved, setStoreSaved] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);

  // Neon Services Status State
  const [neonStatus, setNeonStatus] = useState<NeonStatus | null>(null);
  const [loadingNeon, setLoadingNeon] = useState(false);
  const [queryOutput, setQueryOutput] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const fetchNeonStatus = async () => {
    setLoadingNeon(true);
    try {
      const status = await neonService.getStatus();
      setNeonStatus(status);
    } catch (err: any) {
      console.error('Failed to fetch Neon status:', err);
    } finally {
      setLoadingNeon(false);
    }
  };

  useEffect(() => {
    fetchNeonStatus();
    ecommerceApi.getStoreConfig().then(setStoreConfig).catch(() => {});
  }, []);

  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    setStoreError(null);
    try {
      const updated = await ecommerceApi.adminUpdateStoreSettings(storeConfig);
      setStoreConfig(updated);
      setStoreSaved(true);
      setTimeout(() => setStoreSaved(false), 2500);
    } catch (err: any) {
      setStoreError(err?.message || 'Failed to save shipping configuration.');
    } finally {
      setSavingStore(false);
    }
  };

  const handleTestQuery = async () => {
    try {
      setQueryOutput('Executing SELECT * FROM categories LIMIT 3 in Neon Postgres...');
      const rows = await neonService.query('SELECT id, name, slug, course_count FROM categories LIMIT 3;');
      setQueryOutput(`Postgres Query Success!\n${JSON.stringify(rows, null, 2)}`);
    } catch (err: any) {
      setQueryOutput(`Query Error: ${err.message}`);
    }
  };

  const handleTestUpload = async () => {
    try {
      setUploadStatus('Uploading test asset to Neon Object Storage bucket "assets"...');
      const testBlob = new Blob(['Test asset payload from Cakexperiment Admin Dashboard'], { type: 'text/plain' });
      const filename = `admin-test-${Date.now()}.txt`;
      const result = await neonService.uploadAsset(testBlob, filename, 'text/plain');
      setUploadStatus(`Upload Success!\nKey: ${result.key}\nBytes: ${result.size}`);
      // Refresh status to update asset count
      fetchNeonStatus();
    } catch (err: any) {
      setUploadStatus(`Upload Error: ${err.message}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
          Academy Settings & Defaults
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Platform pricing rules, store currency, and cloud infrastructure
        </p>
      </div>

      {/* =========================================================================
          NEON CLOUD INFRASTRUCTURE (Postgres & Object Storage)
          ========================================================================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        border: '1.5px solid rgba(163, 61, 89, 0.25)',
        boxShadow: '0 8px 24px rgba(84, 44, 56, 0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#00E69918',
              color: '#00A86B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Server size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-plum)', margin: 0 }}>
                Neon Cloud Services
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Project: twilight-firefly-05240802 &bull; Branch: {neonStatus?.branch || 'production'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchNeonStatus}
            disabled={loadingNeon}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loadingNeon ? 'spin' : ''} />
            {loadingNeon ? 'Verifying...' : 'Test Connection'}
          </button>
        </div>

        {/* 2-Column Grid: Postgres & Object Storage */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
          
          {/* Card 1: Neon Postgres */}
          <div style={{
            backgroundColor: '#FAF7F7',
            border: '1px solid #EEDFDF',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={18} color="#A33D59" />
                <strong style={{ fontSize: '0.95rem', color: '#542C38' }}>Lakebase Postgres</strong>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                backgroundColor: neonStatus?.database?.connected ? '#E8F5E9' : '#FFEBEE',
                color: neonStatus?.database?.connected ? '#2E7D32' : '#C62828'
              }}>
                {neonStatus?.database?.connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#68454D', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
              <div>Database: <code>{neonStatus?.database?.name || 'neondb'}</code></div>
              <div>User: <code>{neonStatus?.database?.user || 'neondb_owner'}</code></div>
              {neonStatus?.database?.latencyMs ? (
                <div>Latency: <strong>{neonStatus.database.latencyMs}ms</strong></div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleTestQuery}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: '100%', justifyContent: 'center' }}
            >
              Run Test Query
            </button>
          </div>

          {/* Card 2: Neon Object Storage */}
          <div style={{
            backgroundColor: '#FAF7F7',
            border: '1px solid #EEDFDF',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HardDrive size={18} color="#A33D59" />
                <strong style={{ fontSize: '0.95rem', color: '#542C38' }}>Neon Object Storage</strong>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                backgroundColor: neonStatus?.objectStorage?.connected ? '#E8F5E9' : '#FFEBEE',
                color: neonStatus?.objectStorage?.connected ? '#2E7D32' : '#C62828'
              }}>
                {neonStatus?.objectStorage?.connected ? 'Active' : 'Offline'}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#68454D', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
              <div>Bucket: <code>{neonStatus?.objectStorage?.bucket || 'assets'}</code></div>
              <div>Region: <code>{neonStatus?.objectStorage?.region || 'us-east-2'}</code></div>
              <div>Stored Objects: <strong>{neonStatus?.objectStorage?.assetCount ?? 0}</strong></div>
            </div>

            <button
              type="button"
              onClick={handleTestUpload}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: '100%', justifyContent: 'center' }}
            >
              <UploadCloud size={14} style={{ marginRight: '0.3rem' }} /> Test Upload Asset
            </button>
          </div>

        </div>

        {/* Live Output Logs */}
        {(queryOutput || uploadStatus) && (
          <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {queryOutput && (
              <pre style={{
                backgroundColor: '#1E0C12',
                color: '#84ECC4',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                overflowX: 'auto',
                margin: 0
              }}>
                {queryOutput}
              </pre>
            )}
            {uploadStatus && (
              <pre style={{
                backgroundColor: '#1E0C12',
                color: '#FFD1DC',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                overflowX: 'auto',
                margin: 0
              }}>
                {uploadStatus}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* General Settings Form */}
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

      {/* Physical Store Shipping & COD Settings */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-plum)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
          <Truck size={20} color="var(--color-berry)" /> Physical Store Shipping &amp; COD Settings
        </div>

        {storeSaved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
            <Check size={16} /> Store shipping &amp; COD rules saved to Neon PostgreSQL!
          </div>
        )}
        {storeError && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
            {storeError}
          </div>
        )}

        <form onSubmit={handleSaveStoreConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={storeConfig.standardShippingFee}
                onChange={(e) => setStoreConfig({ ...storeConfig, standardShippingFee: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Express Shipping Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={storeConfig.expressShippingFee}
                onChange={(e) => setStoreConfig({ ...storeConfig, expressShippingFee: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Free Standard Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={storeConfig.freeShippingThreshold}
                onChange={(e) => setStoreConfig({ ...storeConfig, freeShippingThreshold: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Standard Days Min
              </label>
              <input
                type="number"
                min="1"
                required
                value={storeConfig.standardDeliveryDaysMin}
                onChange={(e) => setStoreConfig({ ...storeConfig, standardDeliveryDaysMin: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Standard Days Max
              </label>
              <input
                type="number"
                min="1"
                required
                value={storeConfig.standardDeliveryDaysMax}
                onChange={(e) => setStoreConfig({ ...storeConfig, standardDeliveryDaysMax: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Express Days Min
              </label>
              <input
                type="number"
                min="1"
                required
                value={storeConfig.expressDeliveryDaysMin}
                onChange={(e) => setStoreConfig({ ...storeConfig, expressDeliveryDaysMin: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                Express Days Max
              </label>
              <input
                type="number"
                min="1"
                required
                value={storeConfig.expressDeliveryDaysMax}
                onChange={(e) => setStoreConfig({ ...storeConfig, expressDeliveryDaysMax: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingStore}
            className="btn btn-primary"
            style={{ width: 'fit-content', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={16} /> {savingStore ? 'Saving...' : 'Save Shipping & COD Settings'}
          </button>
        </form>
      </div>

    </div>
  );
};
