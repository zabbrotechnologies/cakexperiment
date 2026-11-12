import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Gift,
  ChefHat,
  Check,
  ArrowRight,
  MessageCircle,
  Package
} from 'lucide-react';

const WHATSAPP_NUMBER = '918248957918';

export const FeaturedProductsSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCustomizeOrder = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/signin', {
        state: {
          from: '/gift-hampers',
          message: 'Please sign in to customize and order your Signature Celebration Gift Hamper.'
        }
      });
    }
  };

  const handleWhatsAppInquiry = () => {
    if (!isAuthenticated) {
      navigate('/signin', {
        state: {
          from: '/gift-hampers',
          message: 'Please sign in to inquire and order your Gift Hamper.'
        }
      });
      return;
    }
    const text = encodeURIComponent(
      'Hello Chef Anisha! I would like to inquire about ordering the Signature Celebration Gift Hamper (Rs. 1,599).'
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const highlights = [
    '6–9 Handcrafted Nut Chocolates',
    '1 Jar French Butter Cookies',
    '1 Jar Royal Savoury Mixture',
    'Ornate Floral Keepsake Box',
    'Personalized Handwritten Card',
    'Satin Ribbon Gift Presentation'
  ];

  const guarantees = [
    {
      icon: ChefHat,
      title: 'Handcrafted',
      desc: 'Freshly made with care'
    },
    {
      icon: Gift,
      title: 'Gift Packaging',
      desc: 'Beautifully presented'
    },
    {
      icon: Package,
      title: 'Personalised',
      desc: 'Made special for you'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      desc: "We're here to help"
    }
  ];

  return (
    <section
      id="gift-hampers-showcase"
      style={{
        padding: '4.5rem 0',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container" style={{ maxWidth: '1120px' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.75rem auto' }}>
          <div className="section-eyebrow-badge" style={{ marginBottom: '1rem' }}>
            <span className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Bespoke Studio Gifting</span>
            <span className="section-eyebrow-line" />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.1rem, 4vw, 3.1rem)',
              fontWeight: 700,
              color: 'var(--color-plum)',
              lineHeight: 1.12,
              marginBottom: '0.75rem'
            }}
          >
            Signature Celebration Gift Hamper
          </h2>

          <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
            Custom keepsake boxes crafted to order with personalized ribbon, calligraphy notes, and WhatsApp studio confirmation.
          </p>
        </div>

        {/* Main Bespoke Showcase Card */}
        <div
          style={{
            borderRadius: '28px',
            backgroundColor: 'var(--color-cream)',
            border: '1px solid var(--border-subtle)',
            padding: 'clamp(1.25rem, 3vw, 2.5rem)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: 'clamp(1.5rem, 3.5vw, 2.75rem)',
              alignItems: 'center'
            }}
          >
            {/* Single Clean Poster Frame */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '370px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <img
                  src="/images/gift-hamper-poster.jpg"
                  alt="Cakexperiment Signature Celebration Gift Hamper"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Clean Bespoke Details & Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--color-plum)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}
                >
                  Signature Celebration Box
                </span>
              </div>

              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.75rem, 2.8vw, 2.25rem)',
                    fontWeight: 700,
                    color: 'var(--color-plum)',
                    marginBottom: '0.55rem'
                  }}
                >
                  Artisan Keepsake Gift Hamper
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  Ornate floral keepsake box with 6–9 handcrafted nut chocolates, 1 jar French butter cookies &amp; 1 jar royal savoury mixture — tailored to your occasion and delivered with handwritten notes.
                </p>
              </div>

              {/* Box Contents Card */}
              <div
                style={{
                  borderRadius: '18px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.15rem 1.25rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    color: 'var(--color-berry)',
                    marginBottom: '0.75rem'
                  }}
                >
                  Inside Every Box
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
                    gap: '0.55rem 1rem'
                  }}
                >
                  {highlights.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.84rem',
                        color: 'var(--color-plum)'
                      }}
                    >
                      <Check size={14} color="var(--color-berry)" style={{ flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Actions Row */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  paddingTop: '0.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                    <span style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-plum)', lineHeight: 1 }}>
                      ₹1,599
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                      ₹1,999
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                    Custom occasion, ribbon &amp; delivery date • Direct WhatsApp checkout
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}>
                  <Link
                    to="/gift-hampers"
                    onClick={handleCustomizeOrder}
                    className="btn btn-primary"
                    style={{ fontSize: '0.92rem', padding: '0.78rem 1.45rem' }}
                  >
                    <span>Customize &amp; Order</span>
                    <ArrowRight size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.9rem',
                      padding: '0.78rem 1.15rem',
                      borderColor: '#A7F3D0',
                      color: '#047857'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Guarantee Strip */}
        <div
          style={{
            marginTop: '2.25rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem 0'
          }}
        >
          {guarantees.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={g.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.35rem 1.25rem',
                  borderRight: idx < guarantees.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <div
                  style={{
                    color: 'var(--color-berry)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-plum)', margin: '0 0 0.15rem 0', fontFamily: 'var(--font-sans)' }}>
                    {g.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                    {g.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
