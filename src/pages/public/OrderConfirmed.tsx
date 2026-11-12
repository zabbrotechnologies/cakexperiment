import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Truck, MapPin, Banknote, ArrowRight, ShoppingBag } from 'lucide-react';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { ProductOrder } from '../../types';

export const OrderConfirmed: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const stateOrder = (location.state as any)?.order as ProductOrder | undefined;

  const [order, setOrder] = useState<ProductOrder | null>(stateOrder || null);
  const [loading, setLoading] = useState(!stateOrder);

  useEffect(() => {
    if (!orderNumber) return;
    if (!stateOrder) {
      ecommerceApi
        .getSingleProductOrder(orderNumber)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [orderNumber, stateOrder]);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading order confirmation...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h2 style={{ color: 'var(--color-plum)' }}>Order Confirmation Not Found</h2>
        <Link to="/my-purchases" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--color-cream)', padding: '3.5rem 0 5rem 0' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: 'clamp(1.75rem, 4vw, 3rem)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={36} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              Order Confirmed!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
              Thank you, <strong>{order.customerName}</strong>! Your Cash on Delivery order has been placed.
            </p>
            <div style={{ display: 'inline-block', marginTop: '0.75rem', backgroundColor: 'var(--color-blush)', color: 'var(--color-plum)', padding: '0.45rem 1.1rem', borderRadius: '999px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem' }}>
              Order ID: {order.orderNumber}
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', backgroundColor: 'var(--color-cream)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.75rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Truck size={18} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>Expected Delivery</div>
                <div style={{ color: 'var(--text-muted)' }}>{order.expectedDeliveryDate}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-berry)', fontWeight: 600 }}>{order.deliveryMethod} Delivery</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Banknote size={18} color="#2E7D32" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>Payment: Cash on Delivery</div>
                <div style={{ color: 'var(--text-muted)' }}>Pay ₹{order.totalAmount.toLocaleString('en-IN')} at doorstep</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <MapPin size={18} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>Shipping To</div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {order.shippingAddress.streetAddress}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Products */}
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', marginBottom: '0.85rem' }}>
            Ordered Items
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {order.items.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                {it.image && <img src={it.image} alt={it.productName} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{it.productName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {it.variantLabel ? `${it.variantLabel} • ` : ''}Qty {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>
                  ₹{it.lineTotal.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '2rem', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span>₹{order.subtotalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Delivery Fee</span>
              <span>{order.shippingAmount === 0 ? 'FREE' : `₹${order.shippingAmount}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-plum)', marginTop: '0.35rem' }}>
              <span>Total Amount Due on Delivery</span>
              <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
            <Link
              to={`/orders/${order.orderNumber}/track`}
              className="btn btn-primary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Truck size={18} />
              <span>Track Order</span>
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/shop"
              className="btn btn-secondary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <ShoppingBag size={17} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

