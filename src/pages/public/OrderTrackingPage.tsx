import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Home as HomeIcon,
  XCircle,
  RefreshCw,
  MapPin,
  Banknote,
  Gift
} from 'lucide-react';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { ProductOrder, ProductOrderStatus } from '../../types';

const FIVE_TRACKING_STEPS: { key: ProductOrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'placed', label: 'Order Placed', desc: 'COD order received cleanly in our studio system', icon: <Clock size={18} /> },
  { key: 'confirmed', label: 'Confirmed', desc: 'Order verified and scheduled by Cakexperiment', icon: <CheckCircle2 size={18} /> },
  { key: 'crafting', label: 'Packed / Crafting', desc: 'Freshly prepared and sealed in protective packaging', icon: <Package size={18} /> },
  { key: 'dispatched', label: 'Dispatched', desc: 'On the way with courier partner to your doorstep', icon: <Truck size={18} /> },
  { key: 'delivered', label: 'Delivered', desc: 'Handed over & delivered successfully', icon: <HomeIcon size={18} /> }
];

function getTrackingStepIndex(status: ProductOrderStatus): number {
  const s = status.toLowerCase();
  if (s === 'cancelled') return -1;
  if (s === 'pending' || s === 'placed') return 0;
  if (s === 'confirmed') return 1;
  if (s === 'crafting') return 2;
  if (s === 'dispatched') return 3;
  if (s === 'delivered') return 4;
  return 0;
}

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const isHamperTrackRoute = location.pathname.startsWith('/track-hamper');
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);
    try {
      const data = isHamperTrackRoute || orderNumber.toUpperCase().startsWith('CAK-HMP-')
        ? await ecommerceApi.trackHamperOrder(orderNumber)
        : await ecommerceApi.getSingleProductOrder(orderNumber);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Fetching live order status from Neon PostgreSQL...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <XCircle size={44} color="#C62828" style={{ marginBottom: '0.85rem' }} />
        <h2 style={{ color: 'var(--color-plum)', marginBottom: '0.4rem' }}>Unable to Track Order</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || 'This order does not exist or belongs to a different account.'}
        </p>
        <Link to="/my-purchases" className="btn btn-primary">
          Return to My Orders
        </Link>
      </div>
    );
  }

  const currentIdx = getTrackingStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isHamper = order.orderType === 'HAMPER';

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--color-cream)', padding: '3rem 0 5rem 0' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to={isHamper && isHamperTrackRoute ? '/gift-hampers' : '/my-purchases'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-berry)', fontWeight: 600, fontSize: '0.9rem' }}>
            <ChevronLeft size={16} /> {isHamper && isHamperTrackRoute ? 'Back to Gift Hampers' : 'Back to My Orders'}
          </Link>
          <button
            type="button"
            onClick={loadOrder}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: 'clamp(1.5rem, 3.5vw, 2.5rem)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.75rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-berry)', fontWeight: 700 }}>
                {isHamper ? 'Bespoke Gift Hamper Tracking' : 'Live Order Tracking'}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-plum)', margin: '0.2rem 0' }}>
                Order #{order.orderNumber}
              </h1>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Placed on {new Date(order.createdAt).toLocaleString()} • {isHamper ? 'Preferred Date:' : 'Expected Delivery:'}{' '}
                <strong>{order.expectedDeliveryDate}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.4rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  backgroundColor: isCancelled ? '#FFEBEE' : currentIdx === 4 ? '#E8F5E9' : '#FFF3E0',
                  color: isCancelled ? '#C62828' : currentIdx === 4 ? '#2E7D32' : '#E65100'
                }}
              >
                {order.status}
              </span>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {isHamper ? 'Hamper Total:' : 'COD Amount:'}{' '}
                <strong>₹{order.totalAmount.toLocaleString('en-IN')}</strong>{' '}
                ({order.codCollected ? 'Paid / Collected' : isHamper ? 'WhatsApp Studio Confirmation' : 'Pay on Delivery'})
              </div>
            </div>
          </div>

          {/* Cancellation Banner OR 5-Step Progress Timeline */}
          {isCancelled ? (
            <div style={{ backgroundColor: '#FFEBEE', border: '1.5px solid #EF9A9A', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
              <XCircle size={30} color="#C62828" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ color: '#B71C1C', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                  This Order Has Been Cancelled
                </h3>
                <p style={{ margin: 0, color: '#C62828', fontSize: '0.88rem' }}>
                  No Cash on Delivery payment is required, and reserved inventory has been restored.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '2.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                {FIVE_TRACKING_STEPS.map((st, idx) => {
                  const isDone = idx < currentIdx || (idx === 4 && currentIdx === 4);
                  const isCurrent = idx === currentIdx && currentIdx < 4;
                  const isUpcoming = idx > currentIdx;

                  return (
                    <div
                      key={st.key}
                      style={{
                        padding: '1.1rem 0.9rem',
                        borderRadius: '16px',
                        border: isCurrent
                          ? '2px solid var(--color-berry)'
                          : isDone
                            ? '1.5px solid #A5D6A7'
                            : '1px solid var(--border-subtle)',
                        backgroundColor: isCurrent ? '#FFF6F8' : isDone ? '#F1F8E9' : '#FAF8F8',
                        opacity: isUpcoming ? 0.65 : 1
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.65rem',
                          backgroundColor: isDone ? '#2E7D32' : isCurrent ? 'var(--color-berry)' : '#E5DDE0',
                          color: isDone || isCurrent ? '#FFFFFF' : '#7D6D71'
                        }}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : st.icon}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.25rem' }}>
                        {idx + 1}. {st.label}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {st.desc}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '0.5rem', color: isDone ? '#2E7D32' : isCurrent ? 'var(--color-berry)' : 'var(--text-light)' }}>
                        {isDone ? 'COMPLETED' : isCurrent ? 'CURRENT STEP' : 'UPCOMING'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Address & Order Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'var(--color-cream)', borderRadius: '16px', padding: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                <MapPin size={16} color="var(--color-berry)" /> Delivery Details
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                {order.shippingAddress.firstName
                  ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim()
                  : (order.shippingAddress.fullName || order.customerName)}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {order.shippingAddress.streetAddress ? (
                  <>
                    {order.shippingAddress.streetAddress}
                    {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}
                    {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.pincode) && (
                      <>
                        <br />
                        {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')}
                        {order.shippingAddress.pincode ? ` – ${order.shippingAddress.pincode}` : ''}
                      </>
                    )}
                    <br />
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Sign in to view full street address details.
                  </div>
                )}
                {order.customerPhone && <>Mobile: {order.customerPhone}</>}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-cream)', borderRadius: '16px', padding: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                <Banknote size={16} color="#2E7D32" /> Payment &amp; Delivery Summary
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Items Subtotal:</span>
                <span>₹{order.subtotalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>{order.deliveryMethod} Delivery:</span>
                <span>{order.shippingAmount === 0 ? (isHamper ? 'Quoted via Studio' : 'FREE') : `₹${order.shippingAmount}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--color-plum)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span>Total ({isHamper ? 'WhatsApp' : 'COD'}):</span>
                <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Bespoke Gift Hamper Customization Summary */}
          {isHamper && order.hamperDetails && (
            <div style={{ backgroundColor: '#FFF7F9', border: '1px solid #F2D8DF', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--color-berry)', marginBottom: '0.65rem' }}>
                <Gift size={16} /> Gift Hamper Customization Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.6rem 1.25rem', color: 'var(--color-plum)' }}>
                <div><strong>Occasion:</strong> {order.hamperDetails.occasion}</div>
                <div><strong>Ribbon Style:</strong> {order.hamperDetails.ribbonStyle}</div>
                {order.hamperDetails.recipientName && (
                  <div><strong>Recipient:</strong> {order.hamperDetails.recipientName}</div>
                )}
                <div><strong>Preferred Date:</strong> {order.hamperDetails.preferredDeliveryDate}</div>
              </div>
              {order.hamperDetails.greetingMessage && (
                <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed #E8CBD2', color: '#5A3A40' }}>
                  <strong>Handwritten Card Note:</strong> &ldquo;{order.hamperDetails.greetingMessage}&rdquo;
                </div>
              )}
              {order.hamperDetails.specialRequirements && (
                <div style={{ marginTop: '0.45rem', color: '#5A3A40' }}>
                  <strong>Special Requirements:</strong> {order.hamperDetails.specialRequirements}
                </div>
              )}
            </div>
          )}

          {/* Product Items */}
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', marginBottom: '0.85rem' }}>
            Products in This Shipment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
            {order.items.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                {it.image && <img src={it.image} alt={it.productName} style={{ width: '58px', height: '58px', borderRadius: '8px', objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{it.productName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {it.variantLabel ? `${it.variantLabel} • ` : ''}Qty: {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>
                  ₹{it.lineTotal.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Status History Log */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--color-plum)', marginBottom: '0.75rem' }}>
                Fulfillment Activity History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem' }}>
                {order.statusHistory.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.55rem 0.85rem', backgroundColor: '#FAF7F7', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ textTransform: 'uppercase', color: 'var(--color-berry)' }}>{h.status}</strong>
                      {h.note && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>— {h.note}</span>}
                    </div>
                    <span style={{ color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

