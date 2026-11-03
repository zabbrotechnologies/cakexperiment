import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import {
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserOrder {
  id: string;
  order_number: string;
  order_status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  total_amount: number;
  created_at: string;
  course_id?: string;
  course_title?: string;
  course_thumbnail?: string;
  course_image?: string;
  payment_status: string;
  course_access_status: 'LOCKED' | 'UNLOCKED';
  whatsappUrl?: string;
}

export const MyPurchases: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<UserOrder | null>(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch('/api/user/orders', {
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

    // Fallback: local storage scoped to user.id
    if (user) {
      const allOrders = storageService.getOrders().filter(o => o.userId === user.id);
      const mapped: UserOrder[] = allOrders.map(o => ({
        id: o.id,
        order_number: o.orderNumber,
        order_status: (o.orderStatus?.toUpperCase() as any) || 'COMPLETED',
        total_amount: o.amount,
        created_at: o.createdAt,
        course_id: o.courseId,
        course_title: o.courseTitle,
        course_thumbnail: o.courseThumbnail,
        payment_status: o.paymentStatus === 'paid' ? 'CONFIRMED' : 'AWAITING_CONFIRMATION',
        course_access_status: o.paymentStatus === 'paid' ? 'UNLOCKED' : 'LOCKED',
        whatsappUrl: `https://wa.me/918248957918?text=${encodeURIComponent(`Hello! Order inquiry for #${o.orderNumber}`)}`
      }));
      setOrders(mapped);
    }
  };

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, [user]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Your purchase request has been created. Payment confirmation is pending. Please contact our team through WhatsApp.';
      case 'COMPLETED':
        return 'Your payment has been confirmed. Your course is now available in My Courses.';
      case 'CANCELLED':
        return 'This purchase request has been cancelled.';
      case 'REFUNDED':
        return 'This order has been refunded and course access has been revoked.';
      default:
        return 'Order is being processed by the studio.';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)' }}>My Orders & Purchase Requests</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Official records and payment status for all course enrollments and WhatsApp purchase requests
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Retrieving your order records from studio database...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
              <Receipt size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>No Purchase Records Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You have not created any course purchase requests yet.
            </p>
            <Link to="/courses" className="btn btn-primary btn-sm">
              Explore Available Masterclasses
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map((ord) => {
              const isPending = ord.order_status === 'PENDING';
              const isCompleted = ord.order_status === 'COMPLETED';
              const isCancelled = ord.order_status === 'CANCELLED';
              const isRefunded = ord.order_status === 'REFUNDED';

              return (
                <div
                  key={ord.id}
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    backgroundColor: isCompleted ? '#FAFCFA' : (isPending ? '#FFFCF7' : '#FFFFFF'),
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={ord.course_thumbnail || ord.course_image || '/images/hero-cake.png'}
                        alt={ord.course_title}
                        style={{ width: '70px', height: '56px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-berry)', fontFamily: 'monospace', fontWeight: 600 }}>
                          Order #{ord.order_number || ord.id}
                        </div>
                        <h4 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', margin: '0.2rem 0', fontWeight: 600 }}>
                          {ord.course_title}
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Placed on {new Date(ord.created_at).toLocaleDateString()} at {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                        ₹{ord.total_amount}
                      </div>
                      <div style={{ marginTop: '0.3rem' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isCompleted ? '#E8F5E9' : (isPending ? '#FFF3E0' : '#FFEBEE'),
                            color: isCompleted ? '#2E7D32' : (isPending ? '#E65100' : '#C62828'),
                            fontWeight: 600,
                            fontSize: '0.78rem'
                          }}
                        >
                          {ord.order_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner Message */}
                  <div
                    style={{
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      backgroundColor: isCompleted ? '#E8F5E9' : (isPending ? '#FFF8E1' : '#FFEBEE'),
                      color: isCompleted ? '#2E7D32' : (isPending ? '#E65100' : '#C62828'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {isCompleted && <CheckCircle size={16} />}
                    {isPending && <Clock size={16} />}
                    {(isCancelled || isRefunded) && <AlertCircle size={16} />}
                    <span>{getStatusMessage(ord.order_status)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.8rem', borderTop: '1px solid #FAF0F2' }}>
                    
                    {/* View Details (Read-only, does not create duplicate orders) */}
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(ord)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.82rem' }}
                    >
                      View Order Receipt
                    </button>

                    {/* Pending Action: Contact Concierge on WhatsApp */}
                    {isPending && ord.whatsappUrl && (
                      <a
                        href={ord.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                      >
                        <MessageCircle size={14} /> Open WhatsApp Chat
                      </a>
                    )}

                    {/* Completed Action: Go to Course Classroom */}
                    {isCompleted && (
                      <Link
                        to={`/learn/${ord.course_id}`}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                      >
                        <BookOpen size={14} /> Open Course Classroom &rarr;
                      </Link>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Read-Only Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} color="var(--color-berry)" />
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-plum)', margin: 0 }}>
                  Purchase Order Receipt
                </h3>
              </div>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Reference</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-plum)', fontFamily: 'monospace' }}>{selectedReceipt.order_number}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</div>
                  <div>{new Date(selectedReceipt.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Masterclass</div>
                <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '1.05rem' }}>{selectedReceipt.course_title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Course ID: {selectedReceipt.course_id}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#FDF7F5', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Mode</div>
                  <div style={{ fontWeight: 600 }}>WhatsApp Manual Payment</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-plum)' }}>₹{selectedReceipt.total_amount}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                Issued by Cakexperiment Studio Academy, Whitefield, Bangalore.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default MyPurchases;
