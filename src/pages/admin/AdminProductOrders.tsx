import React from 'react';
import {
  Package,
  Search,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Banknote
} from 'lucide-react';
import type { ProductOrderStatus } from '../../types';
import { AdminOrderDetailsModal } from '../../components/admin/AdminOrderDetailsModal';
import { ORDER_STATUS_FILTER_OPTIONS, useFulfillmentOrders } from '../../components/admin/useFulfillmentOrders';

export const AdminProductOrders: React.FC = () => {
  const {
    orders,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedOrder,
    setSelectedOrder,
    statusNote,
    setStatusNote,
    isProcessingAction,
    actionSuccessMsg,
    actionErrorMsg,
    handleUpdateStatus,
    handleCollectPayment,
    handleContactCustomer
  } = useFulfillmentOrders('PRODUCT');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* Panel Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
          <Package size={24} color="var(--color-berry)" />
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600, margin: 0 }}>
            Physical Product Orders
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Manage physical retail shop COD orders, advance 5-step delivery tracking, and record Cash on Delivery collection.
        </p>
      </div>

      {actionSuccessMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #C8E6C9' }}>
          <CheckCircle size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #FFCDD2' }}>
          <AlertCircle size={18} />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Search & Status Filter Controls */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem 1.2rem', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search by Order ID, customer name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', padding: '0.6rem 0.6rem 0.6rem 2.5rem', fontSize: '0.88rem' }}
            />
            <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {orders.length} Physical Product {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {ORDER_STATUS_FILTER_OPTIONS.map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.38rem 0.82rem',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: statusFilter === st ? 'var(--color-berry)' : '#FFFFFF',
                color: statusFilter === st ? '#FFFFFF' : 'var(--color-plum)',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer'
              }}
            >
              {st === 'crafting' ? 'Packed / Crafting' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Physical Product Orders Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.9rem 1rem' }}>Order ID &amp; Date</th>
                <th style={{ padding: '0.9rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.9rem 1rem' }}>Products &amp; Variants</th>
                <th style={{ padding: '0.9rem 1rem' }}>Total / COD</th>
                <th style={{ padding: '0.9rem 1rem' }}>Delivery</th>
                <th style={{ padding: '0.9rem 1rem' }}>Fulfillment Status</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading physical product orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No physical product orders matching filters.</td></tr>
              ) : (
                orders.map(ord => {
                  const isCancelled = ord.status === 'cancelled';
                  const isDelivered = ord.status === 'delivered';
                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-plum)' }}>{ord.orderNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ord.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{ord.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customerEmail}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-berry)' }}>{ord.customerPhone}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', maxWidth: '240px' }}>
                        {ord.items.map(it => (
                          <div key={it.id} style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                            <strong>{it.quantity}×</strong> {it.productName}
                            {it.variantLabel && <span style={{ color: 'var(--text-muted)' }}> ({it.variantLabel})</span>}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-plum)' }}>₹{ord.totalAmount.toLocaleString('en-IN')}</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ord.codCollected ? '#2E7D32' : isCancelled ? '#C62828' : '#E65100' }}>
                          {ord.codCollected ? 'COD COLLECTED' : isCancelled ? 'CANCELLED' : 'COD PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{ord.deliveryMethod}</div>
                        <div>ETA: {ord.expectedDeliveryDate}</div>
                        <div>{ord.shippingAddress.city}, {ord.shippingAddress.pincode}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <select
                          disabled={isProcessingAction || isCancelled}
                          value={ord.status}
                          onChange={e => handleUpdateStatus(ord.id, e.target.value as ProductOrderStatus)}
                          className="input-field"
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.35rem 0.5rem',
                            width: 'auto',
                            backgroundColor: isCancelled ? '#FFEBEE' : isDelivered ? '#E8F5E9' : '#FFF8F5',
                            color: isCancelled ? '#C62828' : isDelivered ? '#2E7D32' : 'var(--color-plum)'
                          }}
                        >
                          <option value="placed">Placed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="crafting">Packed / Crafting</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled (Restore Stock)</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {!ord.codCollected && !isCancelled && (
                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={() => handleCollectPayment(ord)}
                              className="btn btn-primary btn-sm"
                              style={{ backgroundColor: '#2E7D32', borderColor: '#2E7D32', fontSize: '0.75rem', padding: '0.32rem 0.6rem' }}
                            >
                              <Banknote size={13} /> Collect COD
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.32rem 0.6rem' }}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContactCustomer(ord)}
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: '#25D366', padding: '0.32rem 0.5rem' }}
                            title="Contact on WhatsApp"
                          >
                            <MessageCircle size={14} color="#25D366" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminOrderDetailsModal
        order={selectedOrder}
        statusNote={statusNote}
        onStatusNoteChange={setStatusNote}
        isProcessing={isProcessingAction}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onCollectPayment={handleCollectPayment}
      />
    </div>
  );
};

export default AdminProductOrders;
