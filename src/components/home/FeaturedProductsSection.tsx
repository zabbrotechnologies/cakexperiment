import React from 'react';
import { Link } from 'react-router-dom';
import { GIFT_HAMPERS, STUDIO_WHATSAPP_NUMBER } from '../../data/giftHampers';
import { Sparkles, Gift, Check, ArrowRight, ShieldCheck, Heart, Star, Package } from 'lucide-react';

export const FeaturedProductsSection: React.FC = () => {
  const signatureHamper = GIFT_HAMPERS[0];

  return (
    <section
      id="featured-products"
      style={{
        padding: '6.5rem 0 5.5rem 0',
        backgroundColor: '#FFFFFF',
        scrollMarginTop: '6rem',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 3.5rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-berry)',
              backgroundColor: 'var(--color-berry-light)',
              padding: '0.4rem 1.1rem',
              borderRadius: '999px',
              marginBottom: '1rem'
            }}
          >
            <Sparkles size={14} /> Featured Products
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)',
              color: 'var(--color-plum)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1rem'
            }}
          >
            Artisanal Gift Hampers & Gourmet Treats
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#6F5B60',
              lineHeight: 1.7,
              maxWidth: '680px',
              margin: '0 auto'
            }}
          >
            A box full of sweetness, tradition, and artistry. Handcrafted nut-loaded chocolates, melt-in-mouth butter cookies, and crunchy savouries encased in keepsake royal gift boxes — custom tailored for your celebrations.
          </p>
        </div>

        {/* ================= HERO SHOWCASE CARD ================= */}
        <div
          style={{
            backgroundColor: 'var(--color-cream)',
            borderRadius: '28px',
            border: '1.5px solid var(--color-rose-subtle)',
            padding: 'clamp(1.5rem, 3vw, 3rem)',
            boxShadow: '0 20px 50px rgba(87, 51, 58, 0.08)',
            marginBottom: '4rem',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '3rem',
              alignItems: 'center'
            }}
          >
            {/* Visual Column */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
                  aspectRatio: '4/5',
                  maxHeight: '520px',
                  margin: '0 auto'
                }}
              >
                <img
                  src="/images/gift-hamper-poster.jpg"
                  alt="Cakexperiment Luxury Gift Hamper"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Corner Golden Emblem Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#8E2135',
                    color: '#FFE29A',
                    padding: '0.6rem 1rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    border: '1px solid #FFE29A',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Just @
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 800, lineHeight: 1 }}>
                    ₹1,599
                  </div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.9, marginTop: '2px' }}>
                    PRE-ORDER ONLY
                  </div>
                </div>

                {/* Bottom Overlay Label */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1.2rem',
                    background: 'linear-gradient(to top, rgba(30,12,16,0.92) 0%, rgba(30,12,16,0) 100%)',
                    color: '#FFF'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.22)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                      ✨ Handcrafted in India
                    </span>
                    <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.22)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                      🎀 Customizable
                    </span>
                    <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.22)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                      🚚 Pan-India Shipping
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Details Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    backgroundColor: 'var(--color-plum)',
                    color: 'var(--color-blush)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '8px'
                  }}
                >
                  Signature Celebration Box
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Star size={14} fill="#D4AF37" /> 5.0 (Artisan Rated)
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.8rem, 2.8vw, 2.4rem)',
                  color: 'var(--color-plum)',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  marginBottom: '0.85rem'
                }}
              >
                Artisan Signature Keepsake Hamper
              </h3>

              <p style={{ fontSize: '1rem', color: '#57333A', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                A royal presentation crafted for discerning dessert lovers. Packed in an ornate keepsake floral box with golden latches, this hamper includes freshly baked butter sablé cookies, single-origin nut chocolates, and crunchy festive savouries.
              </p>

              {/* What's Inside Grid (As shown in poster) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  border: '1px solid var(--color-rose-subtle)',
                  marginBottom: '1.75rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-berry)', marginBottom: '0.8rem' }}>
                  What’s Inside Every Box:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                    <Check size={16} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>6 to 9 Nut Chocolates</strong> (Milk, Dark & White)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                    <Check size={16} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>1 Jar Butter Cookies</strong> (French Sablé)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                    <Check size={16} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>1 Jar Savoury Mixture</strong> (Royal Crisp)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                    <Check size={16} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Premium Gift Box</strong> with Brass Clasp</span>
                  </div>
                </div>
              </div>

              {/* Price & Action Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#8A7378', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Special Studio Price
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', fontWeight: 800, color: 'var(--color-berry)' }}>
                      ₹1,599
                    </span>
                    <span style={{ fontSize: '1.05rem', color: '#9B8388', textDecoration: 'line-through' }}>
                      ₹1,999
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#1EBE5D', fontWeight: 700, backgroundColor: '#E8F9EE', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      SAVE ₹400
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
                  {/* Primary Button: Place Order -> Navigates to Customizer */}
                  <Link
                    to="/gift-hampers"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'var(--color-berry)',
                      color: '#FFFFFF',
                      padding: '0.95rem 1.8rem',
                      borderRadius: '14px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      textDecoration: 'none',
                      boxShadow: '0 8px 25px rgba(169, 87, 104, 0.3)',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'var(--color-berry-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'var(--color-berry)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>Place Order</span>
                    <ArrowRight size={18} />
                  </Link>

                  {/* WhatsApp Quick Inquiry */}
                  <a
                    href={`https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      'Hello Chef Anisha! I saw your Signature Keepsake Gift Hamper (₹1,599) on the website and would like to order.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      padding: '0.95rem 1.3rem',
                      borderRadius: '14px',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      textDecoration: 'none',
                      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.523 1.761.8 2.796.8 3.181 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.786-5.768-5.786zm0 10.359c-.89 0-1.636-.244-2.434-.693l-.427-.24-1.579.414.421-1.54-.271-.433c-.512-.816-.782-1.488-.781-2.541.001-2.529 2.059-4.587 4.589-4.587 2.531 0 4.59 2.058 4.59 4.588-.001 2.53-2.058 4.589-4.589 4.589zm3.018-3.447c-.166-.083-.981-.484-1.133-.539-.152-.055-.262-.083-.373.083-.11.166-.428.539-.525.65-.097.11-.193.125-.359.042-.166-.083-.701-.258-1.335-.824-.493-.44-.826-.984-.923-1.15-.097-.166-.01-.256.073-.338.075-.074.166-.193.249-.29.083-.097.11-.166.166-.276.055-.11.028-.207-.014-.29-.042-.083-.373-.898-.511-1.23-.135-.323-.272-.279-.373-.284-.097-.005-.207-.006-.318-.006s-.29.041-.442.207c-.152.166-.58.567-.58 1.383 0 .816.594 1.605.677 1.715.083.11 1.169 1.785 2.832 2.502.396.171.705.273.946.35.398.126.76.108 1.047.065.32-.048.981-.401 1.119-.788.138-.387.138-.719.097-.788-.041-.07-.152-.11-.318-.193z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= VALUE GUARANTEE STRIP ================= */}
        <div
          style={{
            backgroundColor: 'var(--color-cream)',
            borderRadius: '20px',
            border: '1px solid var(--color-rose-subtle)',
            padding: '1.75rem 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-plum)' }}>100% Handcrafted</div>
              <div style={{ fontSize: '0.8rem', color: '#7E696E' }}>Freshly baked in artisanal small batches</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Gift size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-plum)' }}>Bespoke Keepsake Box</div>
              <div style={{ fontSize: '0.8rem', color: '#7E696E' }}>Luxury floral box with brass lock & ribbon</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-plum)' }}>Customized Gifting</div>
              <div style={{ fontSize: '0.8rem', color: '#7E696E' }}>Handwritten greeting cards & treat choices</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-plum)' }}>WhatsApp Concierge</div>
              <div style={{ fontSize: '0.8rem', color: '#7E696E' }}>Direct assistance & verified payments</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

