import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const SignUp: React.FC = () => {
  const { signUp, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/learn', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the studio Terms & Privacy Policy to register.');
      return;
    }

    setLoading(true);
    const res = await signUp(name, email, password);
    setLoading(false);

    if (res.success && res.redirectTo) {
      navigate(res.redirectTo, { replace: true });
    } else {
      setError(res.message || 'Could not complete registration.');
    }
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
            Create Your Student Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Join thousands of passionate bakers learning artisanal cake crafts
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="input-field"
              />
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. eleanor@example.com"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Create Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type your password"
                className="input-field"
              />
            </div>

            {/* Terms and Conditions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '0.2rem' }}>
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ accentColor: 'var(--color-berry)', width: '16px', height: '16px', marginTop: '3px' }}
              />
              <label htmlFor="agreeTerms" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to the Cakexperiment Terms of Learning and acknowledge that student records are persisted in local browser storage during this preview.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.6rem' }}
            >
              {loading ? 'Creating Student Profile...' : 'Complete Registration'}
            </button>

          </form>

          {/* Sign In Link */}
          <div style={{ textAlign: 'center', marginTop: '1.8rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color: 'var(--color-berry)', fontWeight: 600 }}>
              Sign in here
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
