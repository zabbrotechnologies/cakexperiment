import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, ExternalLink, Banknote } from 'lucide-react';
import type { ProductOrder, ProductOrderStatus } from '../../types';

interface AdminOrderDetailsModalProps {
  order: ProductOrder | null;
  statusNote: string;
  onStatusNoteChange: (val: string) => void;
  isProcessing: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: ProductOrderStatus) => void;
  onCollectPayment: (order: ProductOrder) => void;
}

export const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({
  order,
  statusNote,
  onStatusNoteChange,
  isProcessing,
  onClose,
  onUpdateStatus,
  onCollectPayment
}) => {
  useEffect(() => {
    if (!order) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [order, isProcessing, onClose]);

  if (!order) return null;

  return createPortal(
    <div className="modal-overlay" onClick={() => !isProcessing && onClose()}>
      <div className="modal-content" style={{ maxWidth: '660px' }} onClick={e => e.stopPropagation()}>
        <div
          style={{
            padding: '1.4rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-cream)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-plum)', fontSize: '1.2rem' }}>
              {order.orderType === 'HAMPER' ? 'Gift Hamper Order' : 'Product Order'} #{order.orderNumber}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Placed {new Date(order.createdAt).toLocaleString()} • Delivery: {order.expectedDeliveryDate}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', backgroundColor: '#FDF7F5', padding: '1rem', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
              <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>{order.customerName}</div>
              {order.customerEmail && <div>{order.customerEmail}</div>}
              <div>{order.customerPhone}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Address</div>
              <div>{order.shippingAddress.streetAddress}</div>
              {order.shippingAddress.apartment && <div>{order.shippingAddress.apartment}</div>}
              {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.pincode) && (
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                </div>
              )}
            </div>
          </div>

          {order.orderType === 'HAMPER' && order.hamperDetails && (
            <div style={{ backgroundColor: '#FFF5F7', border: '1px solid #F2D8DF', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-berry)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Bespoke Gift Hamper Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem 1rem' }}>
                <div><strong>Occasion:</strong> {order.hamperDetails.occasion}</div>
                <div><strong>Ribbon Style:</strong> {order.hamperDetails.ribbonStyle}</div>
                <div><strong>Recipient (To):</strong> {order.hamperDetails.recipientName || 'Not specified'}</div>
                <div><strong>Preferred Date:</strong> {order.hamperDetails.preferredDeliveryDate}</div>
              </div>
              {order.hamperDetails.greetingMessage && (
                <div style={{ marginTop: '0.55rem', paddingTop: '0.55rem', borderTop: '1px dashed #E8CBD2' }}>
                  <strong>Handwritten Card Note:</strong> &ldquo;{order.hamperDetails.greetingMessage}&rdquo;
                </div>
              )}
              {order.hamperDetails.specialRequirements && (
                <div style={{ marginTop: '0.4rem' }}>
                  <strong>Special Requirements:</strong> {order.hamperDetails.specialRequirements}
                </div>
              )}
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>Items</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {order.items.map(it => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                  {it.image && <img src={it.image} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{it.productName}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {it.variantLabel || 'Standard'} • Qty {it.quantity} × ₹{it.unitPrice}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>₹{it.lineTotal.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', backgroundColor: 'var(--color-cream)', borderRadius: '10px', fontWeight: 700 }}>
            <span>
              Subtotal ₹{order.subtotalAmount.toLocaleString('en-IN')}
              {order.orderType === 'PRODUCT' ? ` + ${order.deliveryMethod} Shipping ₹${order.shippingAmount}` : ' (Bespoke Hamper)'}
            </span>
            <span>Total: ₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
            <Link
              to={order.orderType === 'HAMPER' ? `/track-hamper/${order.orderNumber}` : `/orders/${order.orderNumber}/track`}
              target="_blank"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-berry)', fontWeight: 600, fontSize: '0.84rem' }}
            >
              Open Live Customer Tracking Page <ExternalLink size={14} />
            </Link>
            {!order.codCollected && order.status !== 'cancelled' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onCollectPayment(order)}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#2E7D32', borderColor: '#2E7D32' }}
              >
                <Banknote size={14} /> {order.orderType === 'HAMPER' ? 'Mark Payment Received' : 'Collect COD Payment'}
              </button>
            )}
          </div>

          {order.status !== 'cancelled' && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <input
                type="text"
                placeholder="Optional tracking update note for customer..."
                value={statusNote}
                onChange={e => onStatusNoteChange(e.target.value)}
                className="input-field"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {(['confirmed', 'crafting', 'dispatched', 'delivered', 'cancelled'] as ProductOrderStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    disabled={isProcessing || order.status === st}
                    onClick={() => onUpdateStatus(order.id, st)}
                    className={`btn btn-sm ${st === 'cancelled' ? 'btn-outline' : 'btn-secondary'}`}
                    style={{
                      textTransform: 'capitalize',
                      ...(st === 'cancelled' ? { borderColor: '#FFCDD2', color: '#C62828' } : {})
                    }}
                  >
                    Mark {st === 'crafting' ? 'Packed / Crafting' : st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Tracking History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                {order.statusHistory.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span><strong style={{ color: 'var(--color-plum)', textTransform: 'uppercase' }}>{h.status}</strong> — {h.note}</span>
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

