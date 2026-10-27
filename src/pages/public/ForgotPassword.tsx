import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Mail, Check } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--color-cream)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)' }}>
              <Sparkles size={20} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-plum)' }}>
              Cakexperiment
            </span>
          </Link>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
            Password Recovery
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Enter your registered email address to receive password reset instructions
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
                <Check size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>
                Recovery Link Dispatched
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                We've simulated sending a recovery email to <strong>{email}</strong>. In production, this links securely to your backend reset flow.
              </p>
              <Link to="/signin" className="btn btn-primary" style={{ width: '100%' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Registered Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. baker@domain.com"
                    className="input-field"
                    style={{ paddingLeft: '2.6rem' }}
                  />
                  <Mail size={18} color="var(--color-berry)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Send Recovery Instructions
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--color-berry)', fontWeight: 500 }}>
                  <ArrowLeft size={16} /> Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
