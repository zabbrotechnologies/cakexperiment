import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  XCircle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Filter,
  User,
  Check,
  X
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface OrderItem {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  course_id?: string;
  course_name?: string;
  course_thumbnail?: string;
  total_amount: number;
  order_status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  payment_status: 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'NOT_CONFIRMED' | 'REFUNDED';
  course_access_status: 'LOCKED' | 'ACTIVE';
  created_at: string;
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'refunded'>('all');
  
  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Confirmation Dialog State
  const [confirmDialogOrder, setConfirmDialogOrder] = useState<OrderItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Top Synchronized Horizontal Scrollbar
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(1080);
  const [needsScroll, setNeedsScroll] = useState(false);
  const isSyncingScroll = useRef(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (tableScrollRef.current) {
        const scrollW = tableScrollRef.current.scrollWidth;
        const clientW = tableScrollRef.current.clientWidth;
        setContentWidth(scrollW);
        setNeedsScroll(scrollW > clientW);
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (tableScrollRef.current) {
      observer.observe(tableScrollRef.current);
    }
    window.addEventListener('resize', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [orders, loading]);

  const handleTopScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleTableScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch(`/api/admin/orders?status=${statusFilter}&search=${encodeURIComponent(search)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Fallback: format orders from local storage
    const local = storageService.getOrders();
    const mapped: OrderItem[] = local.map(o => ({
      id: o.id,
      order_number: o.orderNumber,
      user_id: o.userId,
      customer_name: o.userName || 'Student',
      customer_email: o.userEmail || '',
      customer_phone: '',
      course_id: o.courseId,
      course_name: o.courseTitle,
      course_thumbnail: o.courseThumbnail,
      total_amount: o.amount,
      order_status: (o.orderStatus?.toUpperCase() as any) || 'COMPLETED',
      payment_status: o.paymentStatus === 'paid' ? 'CONFIRMED' : 'AWAITING_CONFIRMATION',
      course_access_status: o.paymentStatus === 'paid' ? 'ACTIVE' : 'LOCKED',
      created_at: o.createdAt
    }));
    setOrders(mapped);
  };

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, [statusFilter, search]);

  // Action 1: Confirm Payment & Activate Course
  const handleConfirmActivation = async () => {
    if (!confirmDialogOrder) return;
    setIsProcessingAction(true);
    setActionErrorMsg(null);

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch(`/api/admin/orders/${confirmDialogOrder.id}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm payment.');

      setActionSuccessMsg('Payment confirmed! Course has been activated for student.');
      setConfirmDialogOrder(null);
      if (selectedOrder?.id === confirmDialogOrder.id) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'COMPLETED', payment_status: 'CONFIRMED', course_access_status: 'ACTIVE' } : null);
      }
      await fetchOrders();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error confirming payment');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Action 2: Cancel Order
  const handleCancelOrder = async (order: OrderItem) => {
    if (!confirm(`Are you sure you want to cancel Order ${order.order_number}?`)) return;
    setIsProcessingAction(true);
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch(`/api/admin/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setActionSuccessMsg(`Order ${order.order_number} cancelled.`);
        await fetchOrders();
        if (selectedOrder?.id === order.id) setSelectedOrder(null);
      }
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  // Action 3: Record Refund
  const handleRefundOrder = async (order: OrderItem) => {
    if (!confirm(`Are you sure you want to refund Order ${order.order_number}? Course access will be revoked immediately.`)) return;
    setIsProcessingAction(true);
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setActionSuccessMsg(`Order ${order.order_number} refunded and access revoked.`);
        await fetchOrders();
        if (selectedOrder?.id === order.id) setSelectedOrder(null);
      }
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  // Action 4: Contact Customer via WhatsApp
  const handleContactCustomer = (order: OrderItem) => {
    const phone = order.customer_phone?.replace(/[^0-9]/g, '') || '';
    const text = encodeURIComponent(`Hello ${order.customer_name}! This is the Cakexperiment studio concierge regarding your course order #${order.order_number} for "${order.course_name}". How may we assist with your payment?`);
    const waUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/918248957918?text=${text}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
          <ShoppingBag size={24} color="var(--color-berry)" />
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600, margin: 0 }}>
            Course Purchase Requests
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Manage incoming WhatsApp purchase inquiries, verify manual payments, and activate course classroom access.
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

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.2rem', border: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <input
            type="text"
            placeholder="Search by Order #, User ID, email, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.6rem 0.6rem 0.6rem 2.5rem', fontSize: '0.88rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Tab-Style Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending Confirmation' },
            { id: 'confirmed', label: 'Confirmed / Activated' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'refunded', label: 'Refunded' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: statusFilter === f.id ? 'var(--color-berry)' : '#FFFFFF',
                color: statusFilter === f.id ? '#FFFFFF' : 'var(--color-plum)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', width: '100%', maxWidth: '100%' }}>
        
        {/* Top Synchronized Horizontal Scrollbar */}
        {needsScroll && (
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              width: '100%',
              height: '11px',
              backgroundColor: 'var(--color-cream)',
              borderBottom: '1px solid var(--border-subtle)',
              WebkitOverflowScrolling: 'touch'
            }}
            title="Horizontal scroll (drag or swipe)"
          >
            <div style={{ width: `${contentWidth}px`, height: '11px' }} />
          </div>
        )}

        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}
        >
          <table style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem', minWidth: '150px' }}>Order Ref / ID</th>
                <th style={{ padding: '1rem', minWidth: '200px' }}>Customer</th>
                <th style={{ padding: '1rem', minWidth: '230px' }}>Course Details</th>
                <th style={{ padding: '1rem', minWidth: '90px' }}>Amount</th>
                <th style={{ padding: '1rem', minWidth: '150px' }}>Status</th>
                <th style={{ padding: '1rem', minWidth: '120px' }}>Access</th>
                <th style={{ padding: '1rem', textAlign: 'right', minWidth: '240px', width: '240px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading purchase requests from Neon PostgreSQL...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No purchase requests found matching filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isPending = ord.order_status === 'PENDING' || ord.payment_status === 'AWAITING_CONFIRMATION';
                  const isCompleted = ord.order_status === 'COMPLETED';

                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      
                      {/* Order Ref & ID */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.92rem' }}>
                          {ord.order_number || ord.id}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                          {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{ord.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer_email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-berry)', fontFamily: 'monospace' }}>ID: {ord.user_id}</div>
                      </td>

                      {/* Course Info */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {ord.course_thumbnail && (
                            <img
                              src={ord.course_thumbnail}
                              alt={ord.course_name}
                              style={{ width: '40px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div style={{ color: 'var(--color-plum)', fontWeight: 600, fontSize: '0.88rem' }}>
                              {ord.course_name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                              Ref: {ord.course_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.95rem' }}>
                        ₹{ord.total_amount}
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isCompleted ? '#E8F5E9' : (ord.order_status === 'CANCELLED' || ord.order_status === 'REFUNDED' ? '#FFEBEE' : '#FFF3E0'),
                            color: isCompleted ? '#2E7D32' : (ord.order_status === 'CANCELLED' || ord.order_status === 'REFUNDED' ? '#C62828' : '#E65100'),
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {ord.payment_status || ord.order_status}
                        </span>
                      </td>

                      {/* Course Access Status */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: ord.course_access_status === 'ACTIVE' ? '#2E7D32' : '#757575',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {ord.course_access_status === 'ACTIVE' ? (
                            <>
                              <CheckCircle size={14} color="#2E7D32" /> UNLOCKED
                            </>
                          ) : (
                            <>
                              <Clock size={14} color="#E65100" /> LOCKED
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem', flexWrap: 'nowrap' }}>
                          
                          {/* Confirm & Activate Button (if pending) */}
                          {isPending && (
                            <button
                              onClick={() => setConfirmDialogOrder(ord)}
                              className="btn btn-primary btn-sm"
                              style={{ backgroundColor: '#2E7D32', borderColor: '#2E7D32', fontSize: '0.78rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                            >
                              <Check size={13} /> Confirm & Activate
                            </button>
                          )}

                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', whiteSpace: 'nowrap' }}
                          >
                            Details
                          </button>

                          {/* Contact via WhatsApp */}
                          <button
                            onClick={() => handleContactCustomer(ord)}
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: '#25D366', color: '#1B5E20', fontSize: '0.78rem', padding: '0.35rem 0.5rem', display: 'inline-flex', alignItems: 'center' }}
                            title="Contact Customer on WhatsApp"
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

      {/* Confirmation Dialog for Manual Payment Verification */}
      {confirmDialogOrder && (
        <div className="modal-overlay" onClick={() => !isProcessingAction && setConfirmDialogOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F8E9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={22} color="#2E7D32" />
                <h3 style={{ fontSize: '1.2rem', color: '#1B5E20', margin: 0 }}>
                  Confirm Manual Payment
                </h3>
              </div>
              <button onClick={() => setConfirmDialogOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.8rem' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.8rem' }}>
                Have you verified that the payment has been received?
              </div>

              <div style={{ backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                <div><strong>Order Number:</strong> {confirmDialogOrder.order_number}</div>
                <div><strong>Customer:</strong> {confirmDialogOrder.customer_name} ({confirmDialogOrder.customer_email})</div>
                <div><strong>Course:</strong> {confirmDialogOrder.course_name}</div>
                <div><strong>Amount:</strong> ₹{confirmDialogOrder.total_amount}</div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Confirming will immediately mark this order as <strong>COMPLETED</strong>, set payment status to <strong>CONFIRMED</strong>, and create an <strong>ACTIVE</strong> student enrollment unlocking the course classroom.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setConfirmDialogOrder(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleConfirmActivation}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2E7D32', borderColor: '#2E7D32', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Check size={16} />
                  {isProcessingAction ? 'Activating...' : 'Confirm Payment & Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', margin: 0 }}>
                  Order #{selectedOrder.order_number}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  System ID: {selectedOrder.id}
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.9rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#FDF7F5', padding: '1.2rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Name</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Email</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{selectedOrder.customer_email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User ID</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--color-berry)' }}>{selectedOrder.user_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Date</div>
                  <div>{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Enrolled Masterclass</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  {selectedOrder.course_thumbnail && (
                    <img src={selectedOrder.course_thumbnail} alt="" style={{ width: '60px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{selectedOrder.course_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {selectedOrder.course_id}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-plum)' }}>
                    ₹{selectedOrder.total_amount}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Status</div>
                  <div style={{ fontWeight: 600, color: selectedOrder.payment_status === 'CONFIRMED' ? '#2E7D32' : '#E65100' }}>
                    {selectedOrder.payment_status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Course Access</div>
                  <div style={{ fontWeight: 600, color: selectedOrder.course_access_status === 'ACTIVE' ? '#2E7D32' : '#757575' }}>
                    {selectedOrder.course_access_status === 'ACTIVE' ? 'UNLOCKED / ACTIVE' : 'LOCKED'}
                  </div>
                </div>
              </div>

              {/* Action Buttons in Details */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => handleContactCustomer(selectedOrder)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#25D366', color: '#1B5E20' }}
                >
                  <MessageCircle size={16} color="#25D366" /> Contact Customer on WhatsApp
                </button>

                {selectedOrder.order_status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialogOrder(selectedOrder);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: '#2E7D32', borderColor: '#2E7D32', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Check size={16} /> Confirm Payment & Activate
                  </button>
                )}

                {selectedOrder.order_status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(selectedOrder)}
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: '#FFCDD2', color: '#C62828' }}
                  >
                    Cancel Order
                  </button>
                )}

                {selectedOrder.order_status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => handleRefundOrder(selectedOrder)}
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: '#FFCDD2', color: '#C62828' }}
                  >
                    Record Refund & Revoke Access
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminOrders;
