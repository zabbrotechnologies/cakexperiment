import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GIFT_HAMPERS,
  OCCASION_OPTIONS,
  RIBBON_OPTIONS,
  STUDIO_WHATSAPP_NUMBER
} from '../../data/giftHampers';
import {
  Gift,
  Check,
  Sparkles,
  Heart,
  Calendar,
  MapPin,
  User,
  Phone,
  ShieldCheck,
  Truck,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  ChevronLeft
} from 'lucide-react';

export const GiftHampers: React.FC = () => {
  // Single Luxury Gift Hamper (as per poster)
  const hamper = GIFT_HAMPERS[0];

  // Requirements & Customization State
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASION_OPTIONS[0]);
  const [recipientName, setRecipientName] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [selectedRibbon, setSelectedRibbon] = useState(RIBBON_OPTIONS[0].name);
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Delivery & Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [quantity, setQuantity] = useState(1);

  // UI State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedWhatsAppUrl, setGeneratedWhatsAppUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const totalPrice = hamper.price * quantity;

  // Form Validation
  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!customerName.trim()) {
      errs.customerName = 'Please enter your name.';
    }
    if (!customerPhone.trim()) {
      errs.customerPhone = 'Please enter your WhatsApp contact number.';
    } else if (customerPhone.replace(/[^0-9]/g, '').length < 10) {
      errs.customerPhone = 'Please enter a valid 10-digit phone number.';
    }
    if (!deliveryAddress.trim()) {
      errs.deliveryAddress = 'Please enter your delivery city or address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Build structured WhatsApp message
  const buildWhatsAppMessage = () => {
    const cleanPhone = customerPhone.trim();
    const formattedDate = deliveryDate ? deliveryDate : 'Earliest Available Batch';
    const noteContent = greetingMessage.trim() ? `"${greetingMessage.trim()}"` : 'Standard Studio Card';

    return (
      `🎁 *NEW GIFT HAMPER ORDER — CAKEXPERIMENT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Product:* ${hamper.name}\n` +
      `🏷️ *Price:* ₹${hamper.price.toLocaleString('en-IN')} × ${quantity} = *₹${totalPrice.toLocaleString('en-IN')}*\n` +
      `🎉 *Occasion:* ${selectedOccasion}\n\n` +
      `*HAMPER INCLUSIONS:*\n` +
      `• 6 to 9 Assorted Nut Loaded Handcrafted Chocolates\n` +
      `• 1 Jar Artisan Butter Cookies\n` +
      `• 1 Jar Gourmet Savoury Mixture\n` +
      `• Luxury Keepsake Gift Box Packaging\n` +
      `🎀 *Ribbon Style:* ${selectedRibbon}\n\n` +
      (specialRequirements.trim() ? `📝 *Specific Requirements:* ${specialRequirements.trim()}\n\n` : '') +
      `*GREETING CARD DETAILS:*\n` +
      `👤 *To / Recipient:* ${recipientName.trim() || 'Not specified'}\n` +
      `💌 *Personal Note:* ${noteContent}\n\n` +
      `*CUSTOMER & DELIVERY DETAILS:*\n` +
      `👤 *Name:* ${customerName.trim()}\n` +
      `📱 *WhatsApp:* ${cleanPhone}\n` +
      `📅 *Preferred Delivery Date:* ${formattedDate}\n` +
      `🏠 *Delivery Address:* ${deliveryAddress.trim()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Hello Chef Anisha! I have selected my gift hamper requirements on your website and would like to place my order._`
    );
  };

  const handleContinueToWhatsApp = () => {
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(firstErrorKey);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encoded}`;
    setGeneratedWhatsAppUrl(waUrl);

    // Open WhatsApp
    const win = window.open(waUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setModalOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  const handleCopyMessage = () => {
    const message = buildWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh', paddingTop: '6.5rem', paddingBottom: '6rem' }}>
      <div className="container">
        {/* Back navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/#featured-products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-berry)',
              fontSize: '0.92rem',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            <ChevronLeft size={18} /> Back to Featured Products
          </Link>
        </div>

        {/* Studio Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 3rem auto' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-berry)',
              backgroundColor: 'var(--color-berry-light)',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              marginBottom: '0.9rem'
            }}
          >
            <Sparkles size={14} /> Gift Hamper Order & Customization
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              color: 'var(--color-plum)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '1rem'
            }}
          >
            Order Your Luxury Gift Hamper
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: '#6B575B',
              lineHeight: 1.7,
              maxWidth: '680px',
              margin: '0 auto'
            }}
          >
            Choose your occasion, personalized greeting card, and delivery requirements. Click <strong>Continue to WhatsApp</strong> to instantly send your order details directly to Chef Anisha.
          </p>
        </div>

        {/* Main 2-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 1fr)',
            gap: '2.5rem',
            alignItems: 'start'
          }}
          className="hamper-grid-layout"
        >
          {/* ================= LEFT COLUMN: REQUIREMENTS & DETAILS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* STEP 1: CHOOSE OCCASION & CUSTOM REQUIREMENTS */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid var(--color-rose-subtle)',
                boxShadow: '0 8px 30px rgba(87, 51, 58, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-berry)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                >
                  1
                </span>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-plum)', margin: 0 }}>
                    Choose Your Requirements
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#7E696E', margin: '0.2rem 0 0 0' }}>
                    Tell us your occasion, personal notes, and any specific requirements for your gift hamper.
                  </p>
                </div>
              </div>

              {/* Gifting Occasion */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                  🎉 Gifting Occasion / Purpose
                </label>
                <select
                  value={selectedOccasion}
                  onChange={e => setSelectedOccasion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #D5C2C6',
                    fontSize: '0.95rem',
                    backgroundColor: '#FFF',
                    color: 'var(--color-plum)',
                    outline: 'none'
                  }}
                >
                  {OCCASION_OPTIONS.map(occ => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specific Requirements / Customization */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                  Specific Requirements / Custom Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="E.g., 100% Eggless, more dark chocolate, customized corporate branding tag, delivery time preferences..."
                  value={specialRequirements}
                  onChange={e => setSpecialRequirements(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #D5C2C6',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    backgroundColor: '#FFF'
                  }}
                />
              </div>

              {/* Recipient Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                  To / Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dearest Priya / Mom & Dad / Team Acme"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #D5C2C6',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#FFF'
                  }}
                />
              </div>

              {/* Personal Handwritten Message */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                  Handwritten Card Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Write your heartfelt message here. Chef Anisha’s studio will transcribe this with fountain calligraphy on the keepsake gold-foil card..."
                  value={greetingMessage}
                  onChange={e => setGreetingMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #D5C2C6',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    backgroundColor: '#FFF'
                  }}
                />
              </div>

              {/* Ribbon Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                  🎀 Keepsake Ribbon & Satin Seal
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {RIBBON_OPTIONS.map(ribbon => (
                    <label
                      key={ribbon.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: selectedRibbon === ribbon.name ? '1.5px solid var(--color-berry)' : '1px solid #EEDCE0',
                        backgroundColor: selectedRibbon === ribbon.name ? '#FFF5F7' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.88rem'
                      }}
                    >
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: ribbon.color,
                          display: 'inline-block',
                          flexShrink: 0
                        }}
                      />
                      <input
                        type="radio"
                        name="ribbonOption"
                        checked={selectedRibbon === ribbon.name}
                        onChange={() => setSelectedRibbon(ribbon.name)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontWeight: selectedRibbon === ribbon.name ? 600 : 400, color: 'var(--color-plum)' }}>
                        {ribbon.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 2: CONTACT & DELIVERY DETAILS */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid var(--color-rose-subtle)',
                boxShadow: '0 8px 30px rgba(87, 51, 58, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-berry)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                >
                  2
                </span>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-plum)', margin: 0 }}>
                    Recipient & Delivery Details
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#7E696E', margin: '0.2rem 0 0 0' }}>
                    Enter your contact information so we can confirm dispatch and send tracking on WhatsApp.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
                {/* Your Name */}
                <div id="customerName">
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                    Your Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#9B8388" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                    <input
                      type="text"
                      placeholder="e.g. Ananya Sharma"
                      value={customerName}
                      onChange={e => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                        borderRadius: '12px',
                        border: errors.customerName ? '1.5px solid #D9383A' : '1px solid #D5C2C6',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#FFF'
                      }}
                    />
                  </div>
                  {errors.customerName && (
                    <span style={{ fontSize: '0.78rem', color: '#D9383A', marginTop: '0.25rem', display: 'block' }}>
                      {errors.customerName}
                    </span>
                  )}
                </div>

                {/* WhatsApp Phone */}
                <div id="customerPhone">
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                    WhatsApp Phone Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="#9B8388" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={e => {
                        setCustomerPhone(e.target.value);
                        if (errors.customerPhone) setErrors(prev => ({ ...prev, customerPhone: '' }));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                        borderRadius: '12px',
                        border: errors.customerPhone ? '1.5px solid #D9383A' : '1px solid #D5C2C6',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#FFF'
                      }}
                    />
                  </div>
                  {errors.customerPhone && (
                    <span style={{ fontSize: '0.78rem', color: '#D9383A', marginTop: '0.25rem', display: 'block' }}>
                      {errors.customerPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Date & Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                    Preferred Dispatch / Delivery Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="#9B8388" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                        borderRadius: '12px',
                        border: '1px solid #D5C2C6',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#FFF',
                        color: 'var(--color-plum)'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#8A7378', marginTop: '0.2rem', display: 'block' }}>
                    Freshly baked to order. Minimum 24–48 hours preparation time recommended.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                    Hamper Quantity
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '44px' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #D5C2C6',
                        backgroundColor: '#FFF',
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--color-plum)'
                      }}
                    >
                      -
                    </button>
                    <div
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #D5C2C6',
                        backgroundColor: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: 'var(--color-plum)'
                      }}
                    >
                      {quantity} {quantity > 1 ? 'Boxes' : 'Box'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 1)}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #D5C2C6',
                        backgroundColor: '#FFF',
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--color-plum)'
                      }}
                    >
                      +
                    </button>
                  </div>
                  {quantity >= 5 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-berry)', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ✨ Corporate bulk order discount applied on WhatsApp!
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div id="deliveryAddress">
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                  Delivery City / Full Address & Pincode *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="#9B8388" style={{ position: 'absolute', top: '14px', left: '12px' }} />
                  <textarea
                    rows={2}
                    placeholder="Enter street, apartment, landmark, city, and pincode (e.g., Chennai - 600028)"
                    value={deliveryAddress}
                    onChange={e => {
                      setDeliveryAddress(e.target.value);
                      if (errors.deliveryAddress) setErrors(prev => ({ ...prev, deliveryAddress: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                      borderRadius: '12px',
                      border: errors.deliveryAddress ? '1.5px solid #D9383A' : '1px solid #D5C2C6',
                      fontSize: '0.95rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      backgroundColor: '#FFF'
                    }}
                  />
                </div>
                {errors.deliveryAddress && (
                  <span style={{ fontSize: '0.78rem', color: '#D9383A', marginTop: '0.25rem', display: 'block' }}>
                    {errors.deliveryAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIVE SUMMARY & WHATSAPP CTA (STICKY) ================= */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '2rem',
                border: '1.5px solid var(--color-rose)',
                boxShadow: '0 12px 40px rgba(87, 51, 58, 0.08)',
                overflow: 'hidden'
              }}
            >
              {/* Product Poster Preview */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem',
                  aspectRatio: '16/10',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}
              >
                <img
                  src={hamper.image}
                  alt={hamper.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(87, 51, 58, 0.88)',
                    color: '#FFF',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  Bespoke Hamper
                </div>
              </div>

              {/* Title & Price */}
              <div style={{ borderBottom: '1px solid #F2E3E6', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-berry)'
                  }}
                >
                  Order Summary
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: 'var(--color-plum)',
                    margin: '0.3rem 0 0.5rem 0'
                  }}
                >
                  {hamper.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-berry)' }}>
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                  {quantity > 1 && (
                    <span style={{ fontSize: '0.85rem', color: '#7E696E' }}>
                      (₹{hamper.price.toLocaleString('en-IN')} × {quantity})
                    </span>
                  )}
                </div>
              </div>

              {/* Summary Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#8A7378' }}>Occasion:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-plum)', textAlign: 'right' }}>{selectedOccasion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#8A7378' }}>Ribbon:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-plum)', textAlign: 'right' }}>{selectedRibbon}</span>
                </div>
                {recipientName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ color: '#8A7378' }}>For:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-plum)', textAlign: 'right' }}>{recipientName}</span>
                  </div>
                )}
                {deliveryDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ color: '#8A7378' }}>Date:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-plum)', textAlign: 'right' }}>{deliveryDate}</span>
                  </div>
                )}
              </div>

              {/* MAIN WHATSAPP CTA BUTTON */}
              <button
                type="button"
                onClick={handleContinueToWhatsApp}
                style={{
                  width: '100%',
                  padding: '1.05rem 1.5rem',
                  borderRadius: '14px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#1EBE5D';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#25D366';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.523 1.761.8 2.796.8 3.181 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.786-5.768-5.786zm0 10.359c-.89 0-1.636-.244-2.434-.693l-.427-.24-1.579.414.421-1.54-.271-.433c-.512-.816-.782-1.488-.781-2.541.001-2.529 2.059-4.587 4.589-4.587 2.531 0 4.59 2.058 4.59 4.588-.001 2.53-2.058 4.589-4.589 4.589zm3.018-3.447c-.166-.083-.981-.484-1.133-.539-.152-.055-.262-.083-.373.083-.11.166-.428.539-.525.65-.097.11-.193.125-.359.042-.166-.083-.701-.258-1.335-.824-.493-.44-.826-.984-.923-1.15-.097-.166-.01-.256.073-.338.075-.074.166-.193.249-.29.083-.097.11-.166.166-.276.055-.11.028-.207-.014-.29-.042-.083-.373-.898-.511-1.23-.135-.323-.272-.279-.373-.284-.097-.005-.207-.006-.318-.006s-.29.041-.442.207c-.152.166-.58.567-.58 1.383 0 .816.594 1.605.677 1.715.083.11 1.169 1.785 2.832 2.502.396.171.705.273.946.35.398.126.76.108 1.047.065.32-.048.981-.401 1.119-.788.138-.387.138-.719.097-.788-.041-.07-.152-.11-.318-.193z" />
                </svg>
                <span>Continue to WhatsApp</span>
              </button>

              {/* Concierge & Quality Trust Signals */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: '#7E696E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} color="var(--color-berry)" />
                  <span>Direct consultation with Pastry Chef Anisha</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={16} color="var(--color-berry)" />
                  <span>Pan-India express delivery & studio pickup</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--color-berry)" />
                  <span>Handcrafted fresh on pre-order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ORDER CONFIRMATION MODAL ================= */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(57, 28, 35, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '2.2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#E8F9EE',
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}
              >
                <Check size={32} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--color-plum)', margin: '0 0 0.5rem 0' }}>
                Order Details Ready!
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#6B575B', margin: 0, lineHeight: 1.6 }}>
                Your order summary has been compiled. Click below to continue directly to WhatsApp chat.
              </p>
            </div>

            {/* Quick Summary Pill Box */}
            <div
              style={{
                backgroundColor: '#FFF8F9',
                borderRadius: '14px',
                border: '1px solid #F0D9DE',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--color-plum)',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--color-berry)' }}>
                {hamper.name} ({quantity} {quantity > 1 ? 'Boxes' : 'Box'}) — ₹{totalPrice.toLocaleString('en-IN')}
              </div>
              <div><strong>Occasion:</strong> {selectedOccasion}</div>
              <div><strong>Customer:</strong> {customerName} ({customerPhone})</div>
              <div><strong>Address:</strong> {deliveryAddress}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={generatedWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.95rem 1.2rem',
                  borderRadius: '12px',
                  backgroundColor: '#25D366',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.3)'
                }}
              >
                <ExternalLink size={18} /> Open WhatsApp Chat
              </a>

              <button
                type="button"
                onClick={handleCopyMessage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '12px',
                  backgroundColor: '#FFF',
                  color: 'var(--color-plum)',
                  border: '1px solid #D5C2C6',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer'
                }}
              >
                <Copy size={16} /> {copied ? 'Message Copied to Clipboard!' : 'Copy Order Text'}
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9B8388',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
