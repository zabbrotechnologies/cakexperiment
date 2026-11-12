import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Truck,
  Banknote,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShopStore } from '../../store/useShopStore';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { DeliveryMethod, ShippingAddress } from '../../types';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

function computeBusinessDateRange(minDays: number, maxDays: number): string {
  const addDays = (start: Date, biz: number) => {
    const d = new Date(start);
    let count = 0;
    while (count < biz) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) count++;
    }
    return d;
  };
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(addDays(now, minDays))} – ${fmt(addDays(now, maxDays))}`;
}

export const ProductCheckout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { cartItems, storeConfig, loadStoreConfig, clearCart } = useShopStore();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('STANDARD');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Persistent idempotency key for this checkout attempt to eliminate double-submission
  const idempotencyKeyRef = useRef<string>(
    `cod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );

  const nameParts = (user?.name || '').trim().split(/\s+/);
  const [form, setForm] = useState<ShippingAddress>({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: 'Karnataka',
    pincode: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin', {
        replace: true,
        state: { from: '/product-checkout', message: 'Please sign in to proceed with Cash on Delivery checkout.' }
      });
      return;
    }

    loadStoreConfig();

    const prefillFromAccount = async () => {
      try {
        const token = localStorage.getItem('cakexperiment_auth_token');
        const [profileRes, savedAddresses] = await Promise.all([
          fetch('/api/user/profile', {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => (r.ok ? r.json() : null)),
          ecommerceApi.getSavedAddresses()
        ]);

        const saved = savedAddresses[0];
        const profile = profileRes?.profile || {};
        const pNames = (profile.name || user?.name || '').trim().split(/\s+/);

        setForm(prev => ({
          firstName: saved?.first_name || prev.firstName || pNames[0] || '',
          lastName: saved?.last_name || prev.lastName || pNames.slice(1).join(' ') || '',
          email: saved?.email || prev.email || profile.email || user?.email || '',
          phone: saved?.phone || prev.phone || profile.phone || '',
          streetAddress: saved?.street_address || prev.streetAddress || '',
          apartment: saved?.apartment || prev.apartment || '',
          city: saved?.city || prev.city || '',
          state: saved?.state || prev.state || 'Karnataka',
          pincode: saved?.pincode || prev.pincode || ''
        }));
      } catch {
        // Keep current form defaults
      }
    };

    prefillFromAccount();
  }, [isAuthenticated, user, navigate, loadStoreConfig]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.unitPrice ?? item.product?.basePrice ?? 0) * item.quantity,
    0
  );
  const freeThresh = storeConfig.freeShippingThreshold || 1499;
  const standardFee = subtotal >= freeThresh ? 0 : storeConfig.standardShippingFee;
  const expressFee = storeConfig.expressShippingFee;
  const shippingCost = deliveryMethod === 'EXPRESS' ? expressFee : standardFee;
  const finalTotal = subtotal + shippingCost;

  const standardEta = computeBusinessDateRange(
    storeConfig.standardDeliveryDaysMin,
    storeConfig.standardDeliveryDaysMax
  );
  const expressEta = computeBusinessDateRange(
    storeConfig.expressDeliveryDaysMin,
    storeConfig.expressDeliveryDaysMax
  );

  const validateStep0 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    const cleanPhone = form.phone.replace(/[^0-9]/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
    }
    if (form.streetAddress.trim().length < 5) {
      errs.streetAddress = 'Please enter your complete street address.';
    }
    if (!form.city.trim()) errs.city = 'City is required.';
    if (!INDIAN_STATES.some(s => s.toLowerCase() === form.state.trim().toLowerCase())) {
      errs.state = 'Please select a valid Indian state.';
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = 'Enter a valid 6-digit Indian pincode.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    setSubmitError(null);
    if (step === 0) {
      if (validateStep0()) setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };

  const handleConfirmCodOrder = async () => {
    if (submitting) return;
    if (!validateStep0()) {
      setStep(0);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await ecommerceApi.createCodProductOrder({
        idempotencyKey: idempotencyKeyRef.current,
        shippingAddress: {
          ...form,
          phone: form.phone.replace(/[^0-9]/g, '').replace(/^91(?=\d{10}$)/, '')
        },
        deliveryMethod,
        items: cartItems.map(ci => ({
          productId: ci.productId,
          variantId: ci.variantId || '',
          quantity: ci.quantity
        }))
      });

      await clearCart();
      navigate(`/order-confirmed/${order.orderNumber}`, { state: { order }, replace: true });
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to place your COD order. Please review your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '75vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '460px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '3rem 2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <Package size={44} color="var(--color-rose)" style={{ marginBottom: '0.85rem' }} />
          <h2 style={{ color: 'var(--color-plum)', marginBottom: '0.5rem' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Please add physical products to your cart before starting checkout.
          </p>
          <Link to="/shop" className="btn btn-primary">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { idx: 0, label: 'Information', icon: <MapPin size={16} /> },
    { idx: 1, label: 'Delivery', icon: <Truck size={16} /> },
    { idx: 2, label: 'Cash on Delivery', icon: <Banknote size={16} /> }
  ] as const;

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--color-cream)', padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        {/* Top Bar & Step Indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-berry)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.6rem' }}>
            <ChevronLeft size={16} /> Back to Shopping Cart
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--color-plum)', marginBottom: '1.25rem' }}>
            Product Checkout
          </h1>

          {/* 3-Step Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {steps.map(s => {
              const active = step === s.idx;
              const completed = step > s.idx;
              return (
                <button
                  key={s.idx}
                  type="button"
                  disabled={s.idx > step}
                  onClick={() => { if (s.idx < step) setStep(s.idx); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '999px',
                    border: active ? '1.5px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                    backgroundColor: active ? 'var(--color-berry)' : completed ? '#E8F5E9' : '#FFFFFF',
                    color: active ? '#FFFFFF' : completed ? '#2E7D32' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: s.idx < step ? 'pointer' : 'default'
                  }}
                >
                  {completed ? <CheckCircle2 size={16} /> : s.icon}
                  <span>Step {s.idx + 1}: {s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '2rem', alignItems: 'start' }} className="checkout-layout-grid">
          {/* Main Left Panel */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', border: '1px solid var(--border-subtle)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            {submitError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.9rem 1.1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #FFCDD2' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            {/* STEP 0: CUSTOMER & SHIPPING INFORMATION */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                  Customer & Shipping Information
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  We have prefilled your account information where available. Please verify your Indian delivery address.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      className="input-field"
                    />
                    {errors.firstName && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.firstName}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      className="input-field"
                    />
                    {errors.lastName && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.lastName}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="input-field"
                    />
                    {errors.email && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.email}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      Indian Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="input-field"
                    />
                    {errors.phone && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.phone}</div>}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                    Street Address / House & Building *
                  </label>
                  <input
                    type="text"
                    placeholder="House / Flat No., Building Name, Street"
                    value={form.streetAddress}
                    onChange={e => setForm({ ...form, streetAddress: e.target.value })}
                    className="input-field"
                  />
                  {errors.streetAddress && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.streetAddress}</div>}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                    Apartment, Floor or Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Near landmark, gate code, etc."
                    value={form.apartment || ''}
                    onChange={e => setForm({ ...form, apartment: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      className="input-field"
                    />
                    {errors.city && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.city}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      State *
                    </label>
                    <select
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      className="input-field"
                    >
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    {errors.state && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.state}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                      Pincode (6 digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 560066"
                      value={form.pincode}
                      onChange={e => setForm({ ...form, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                      className="input-field"
                    />
                    {errors.pincode && <div style={{ color: '#C62828', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.pincode}</div>}
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn btn-primary btn-lg"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <span>Continue to Delivery</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1: DELIVERY SELECTION */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                  Select Delivery Option
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Delivering to: <strong>{form.streetAddress}, {form.city}, {form.state} - {form.pincode}</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Standard Delivery */}
                  <label
                    onClick={() => setDeliveryMethod('STANDARD')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: deliveryMethod === 'STANDARD' ? '2px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                      backgroundColor: deliveryMethod === 'STANDARD' ? '#FFF6F8' : '#FFFFFF',
                      cursor: 'pointer',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        checked={deliveryMethod === 'STANDARD'}
                        onChange={() => setDeliveryMethod('STANDARD')}
                        style={{ marginTop: '4px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-plum)' }}>
                          Standard Delivery ({storeConfig.standardDeliveryDaysMin}–{storeConfig.standardDeliveryDaysMax} Business Days)
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Expected delivery: <strong>{standardEta}</strong>
                        </div>
                        {subtotal >= freeThresh && (
                          <div style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: 600, marginTop: '0.2rem' }}>
                            Free shipping unlocked on orders ₹{freeThresh.toLocaleString('en-IN')}+
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: standardFee === 0 ? '#2E7D32' : 'var(--color-plum)' }}>
                      {standardFee === 0 ? 'FREE' : `₹${standardFee}`}
                    </div>
                  </label>

                  {/* Express Delivery */}
                  <label
                    onClick={() => setDeliveryMethod('EXPRESS')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: deliveryMethod === 'EXPRESS' ? '2px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                      backgroundColor: deliveryMethod === 'EXPRESS' ? '#FFF6F8' : '#FFFFFF',
                      cursor: 'pointer',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        checked={deliveryMethod === 'EXPRESS'}
                        onChange={() => setDeliveryMethod('EXPRESS')}
                        style={{ marginTop: '4px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-plum)' }}>
                          Express Priority Delivery ({storeConfig.expressDeliveryDaysMin}–{storeConfig.expressDeliveryDaysMax} Business Days)
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Expected delivery: <strong>{expressEta}</strong> • Priority dispatch
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-plum)' }}>
                      ₹{expressFee}
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <button type="button" onClick={() => setStep(0)} className="btn btn-secondary">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn btn-primary btn-lg"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <span>Continue to Payment</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CASH ON DELIVERY CONFIRMATION */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                  Cash on Delivery (COD) Confirmation
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Review your shipping details and confirm your Cash on Delivery order. No online prepayment is required today.
                </p>

                <div style={{ backgroundColor: '#F1F8E9', border: '1.5px solid #A5D6A7', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                  <Banknote size={26} color="#2E7D32" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '1rem', marginBottom: '0.25rem' }}>
                      Pay Cash or UPI on Delivery — ₹{finalTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#2E7D32', lineHeight: 1.5 }}>
                      You will pay ₹{finalTotal.toLocaleString('en-IN')} directly when your physical order arrives at your doorstep. Our team will craft, pack, and dispatch your order immediately after confirmation.
                    </div>
                  </div>
                </div>

                {/* Review Summary Box */}
                <div style={{ backgroundColor: 'var(--color-cream)', borderRadius: '14px', padding: '1.2rem', border: '1px solid var(--border-subtle)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
                  <div><strong>Recipient:</strong> {form.firstName} {form.lastName} ({form.phone})</div>
                  <div><strong>Address:</strong> {form.streetAddress}{form.apartment ? `, ${form.apartment}` : ''}, {form.city}, {form.state} – {form.pincode}</div>
                  <div><strong>Delivery Option:</strong> {deliveryMethod === 'EXPRESS' ? `Express (${expressEta})` : `Standard (${standardEta})`}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="button" disabled={submitting} onClick={() => setStep(1)} className="btn btn-secondary">
                    <ChevronLeft size={16} /> Back
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirmCodOrder}
                    className="btn btn-primary btn-lg"
                    style={{
                      backgroundColor: '#2E7D32',
                      borderColor: '#2E7D32',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.9rem 2rem'
                    }}
                  >
                    <ShieldCheck size={19} />
                    <span>{submitting ? 'Placing COD Order...' : 'Confirm COD Order'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Order Summary Sidebar */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid var(--border-subtle)', padding: '1.5rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.18rem', color: 'var(--color-plum)', marginBottom: '1rem' }}>
              Order Items ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '290px', overflowY: 'auto', marginBottom: '1.2rem' }}>
              {cartItems.map(item => {
                const price = Number(item.unitPrice ?? item.product?.basePrice ?? 0);
                const img = item.variant?.image || item.product?.images?.[0] || '/images/hero-cake.png';
                return (
                  <div key={`${item.productId}:${item.variantId}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <img src={img} alt={item.product?.name} style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-plum)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.variant?.variantName ? `${item.variant.variantName} • ` : ''}Qty {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-plum)' }}>
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>{deliveryMethod === 'EXPRESS' ? 'Express Delivery' : 'Standard Delivery'}</span>
                <span style={{ color: shippingCost === 0 ? '#2E7D32' : 'var(--color-plum)', fontWeight: 600 }}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-plum)' }}>
                <span>Total (COD)</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .checkout-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

