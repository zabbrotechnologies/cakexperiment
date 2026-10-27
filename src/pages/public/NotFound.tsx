import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, BookOpen } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--color-cream)', textAlign: 'center' }}>
      <div style={{ maxWidth: '500px' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <Sparkles size={32} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', marginTop: '0.5rem', marginBottom: '0.8rem' }}>
          Page Not Found in Atelier
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          The page or recipe you are looking for has been moved or does not exist in our studio catalogue.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={16} /> Return to Homepage
          </Link>
          <Link to="/courses" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} /> Browse Masterclasses
          </Link>
        </div>
      </div>
    </div>
  );
};
