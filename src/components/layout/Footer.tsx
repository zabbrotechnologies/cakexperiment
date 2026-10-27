import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Mail, Phone, MapPin, Globe, Share2, Video } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: 'var(--color-plum)', color: '#FFF8F5', paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          
          {/* Brand Info */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ marginBottom: '1.2rem' }}>
              <Link to="/" style={{ display: 'inline-block', backgroundColor: '#FFFFFF', padding: '0.4rem 0.8rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <img
                  src="/images/logo.png"
                  alt="CakeXperiment"
                  style={{ height: '42px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </Link>
            </div>
            <p style={{ color: 'var(--color-rose)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              An elegant online cake-baking academy where aspiring and passionate bakers master professional techniques, palette textures, and artisanal designs from home.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="#instagram" aria-label="Instagram" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF8F5', transition: 'all 0.2s' }}>
                <Globe size={17} />
              </a>
              <a href="#youtube" aria-label="YouTube" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF8F5', transition: 'all 0.2s' }}>
                <Video size={17} />
              </a>
              <a href="#share" aria-label="Share" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF8F5', transition: 'all 0.2s' }}>
                <Share2 size={17} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-blush)', marginBottom: '1.2rem' }}>
              Academy Masterclasses
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
              <li><Link to="/courses" style={{ color: '#FFF8F5', opacity: 0.85 }}>All Baking Courses</Link></li>
              <li><Link to="/courses?category=cake-decorating" style={{ color: '#FFF8F5', opacity: 0.85 }}>Buttercream Techniques</Link></li>
              <li><Link to="/courses?category=cake-baking" style={{ color: '#FFF8F5', opacity: 0.85 }}>Sponge Perfection</Link></li>
              <li><Link to="/courses?category=fondant-art" style={{ color: '#FFF8F5', opacity: 0.85 }}>Fondant Architecture</Link></li>
              <li><Link to="/courses?category=chocolate-techniques" style={{ color: '#FFF8F5', opacity: 0.85 }}>Ganache & Chocolate</Link></li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-blush)', marginBottom: '1.2rem' }}>
              Explore
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
              <li><a href="/#about" style={{ color: '#FFF8F5', opacity: 0.85 }}>About the Studio</a></li>
              <li><a href="/#testimonials" style={{ color: '#FFF8F5', opacity: 0.85 }}>Student Showcase</a></li>
              <li><a href="/#curriculum" style={{ color: '#FFF8F5', opacity: 0.85 }}>How It Works</a></li>
              <li><a href="/#faq" style={{ color: '#FFF8F5', opacity: 0.85 }}>Frequently Asked Questions</a></li>
              <li><Link to="/signin" style={{ color: '#FFF8F5', opacity: 0.85 }}>Student Portal</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-blush)', marginBottom: '1.2rem' }}>
              Studio Concierge
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#FFF8F5', opacity: 0.85 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={16} color="var(--color-rose)" />
                <span>bonjour@cakexperiment.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={16} color="var(--color-rose)" />
                <span>+91 (0) 98765 43210</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <MapPin size={16} color="var(--color-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Cakexperiment Studio & Atelier, Rue de Patisserie, Digital Campus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(220, 165, 175, 0.2)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem', color: 'var(--color-rose)' }}>
          <div>
            &copy; {new Date().getFullYear()} Cakexperiment Academy. All rights reserved. Made with <Heart size={13} style={{ display: 'inline', color: 'var(--color-rose)', verticalAlign: 'middle' }} /> for passionate bakers.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#terms" style={{ color: 'var(--color-rose)' }}>Terms of Service</a>
            <a href="#privacy" style={{ color: 'var(--color-rose)' }}>Privacy Policy</a>
            <a href="#refund" style={{ color: 'var(--color-rose)' }}>Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
