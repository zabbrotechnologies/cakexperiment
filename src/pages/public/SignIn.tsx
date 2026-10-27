import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_ADMIN, DEMO_STUDENT } from '../../context/AuthContext';
import { Sparkles, Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const SignIn: React.FC = () => {
  const { signIn, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/learn', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);

    if (res.success && res.redirectTo) {
      // Check if there was an intended redirect
      const from = (location.state as any)?.from?.pathname;
      navigate(from || res.redirectTo, { replace: true });
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const fillAdminCredentials = () => {
    setEmail(DEMO_ADMIN.email);
    setPassword(DEMO_ADMIN.password);
    setError(null);
  };

  const fillStudentCredentials = () => {
    setEmail(DEMO_STUDENT.email);
    setPassword(DEMO_STUDENT.password);
    setError(null);
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--color-cream)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)' }}>
              <Sparkles size={22} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--color-plum)' }}>
              Cakexperiment
            </span>
          </Link>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
            Welcome Back to the Studio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Sign in to continue your masterclasses and cake decorating journey
          </p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.5rem', border: '1px solid #FFCDD2' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@domain.com"
                className="input-field"
              />
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--color-berry)', width: '16px', height: '16px' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Keep me signed in on this browser
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Account'}
            </button>

          </form>

          {/* Quick Demo Credentials Panel */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)', fontWeight: 600, textAlign: 'center', marginBottom: '0.8rem' }}>
              Quick Fill Demo Credentials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ShieldCheck size={14} color="var(--color-berry)" />
                Fill Admin (admin@...)
              </button>
              <button
                type="button"
                onClick={fillStudentCredentials}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={14} color="var(--color-berry)" />
                Fill Student (student@...)
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            New to Cakexperiment?{' '}
            <Link to="/signup" style={{ color: 'var(--color-berry)', fontWeight: 600 }}>
              Create an account
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
