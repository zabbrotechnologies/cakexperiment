import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { BakeryOrder, ProductTrackingStatus } from '../../types';
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
  BookOpen,
  Cake,
  Truck,
  Package,
  Search,
  CheckCircle2,
  Calendar,
  MapPin,
  Check
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

const TRACKING_STEPS = [
  { key: 'ORDER_RECEIVED', label: 'Order Received', desc: 'Order confirmed & queued in kitchen' },
  { key: 'IN_KITCHEN', label: 'Baking in Kitchen', desc: 'Chef Anisha is preparing your bake' },
  { key: 'PACKED', label: 'Packed & Boxed', desc: 'Cooled, decorated & ribbon-sealed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier on the way / Ready for pickup' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your fresh artisan bake!' }
];

export const MyPurchases: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bakery' | 'courses'>('bakery');

  // Courses Orders
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<UserOrder | null>(null);

  // Bakery Orders & Tracking
  const [bakeryOrders, setBakeryOrders] = useState<BakeryOrder[]>([]);
  const [searchTrackingNumber, setSearchTrackingNumber] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<BakeryOrder | null>(null);

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

  const fetchBakeryOrders = () => {
    if (user) {
      const userOrders = storageService.getBakeryOrders().filter(
        o => o.userId === user.id || o.customerEmail === user.email
      );
      setBakeryOrders(userOrders);
    } else {
      setBakeryOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    fetchBakeryOrders();
  }, [user]);

  const handleLookupOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTrackingNumber.trim()) return;
    const found = storageService.getBakeryOrderByNumber(searchTrackingNumber.trim());
    setSearchedOrder(found || null);
  };

  const getStepIndex = (status: ProductTrackingStatus) => {
    switch (status) {
      case 'ORDER_RECEIVED':
        return 0;
      case 'IN_KITCHEN':
        return 1;
      case 'PACKED':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

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
      
      {/* Page Title */}
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', margin: '0 0 0.3rem 0' }}>
          My Orders & Live Order Tracking
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Track real-time bakery kitchen preparation and view official course purchase records.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #EEDCE0' }}>
        <button
          type="button"
          onClick={() => setActiveTab('bakery')}
          style={{
            padding: '0.75rem 1.4rem',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '1rem',
            color: activeTab === 'bakery' ? 'var(--color-berry)' : 'var(--color-plum)',
            borderBottom: activeTab === 'bakery' ? '3px solid var(--color-berry)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Cake size={18} />
          <span>Bakery Orders & Live Tracking ({bakeryOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '0.75rem 1.4rem',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '1rem',
            color: activeTab === 'courses' ? 'var(--color-berry)' : 'var(--color-plum)',
            borderBottom: activeTab === 'courses' ? '3px solid var(--color-berry)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Receipt size={18} />
          <span>Masterclass Course Receipts ({orders.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: BAKERY ORDERS & LIVE TRACKING ================= */}
      {activeTab === 'bakery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Lookup Bar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.95rem' }}>
                Track Any Order by Number
              </div>
              <div style={{ fontSize: '0.82rem', color: '#7E696E' }}>
                Have an order ID? (e.g. CK-BK-7492) Enter it below to check real-time baking status:
              </div>
            </div>

            <form onSubmit={handleLookupOrder} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="e.g. CK-BK-7492"
                value={searchTrackingNumber}
                onChange={e => setSearchTrackingNumber(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid #D5C2C6',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--color-berry)',
                  color: '#FFF',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Track
              </button>
            </form>
          </div>

          {/* Searched Order Result if any */}
          {searchedOrder && (
            <div
              style={{
                backgroundColor: '#FFF8F9',
                borderRadius: '20px',
                border: '2px solid var(--color-berry)',
                padding: '1.75rem',
                boxShadow: '0 8px 30px rgba(169, 87, 104, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-berry)', textTransform: 'uppercase' }}>
                  Live Tracking Search Result
                </span>
                <button
                  type="button"
                  onClick={() => setSearchedOrder(null)}
                  style={{ background: 'none', border: 'none', color: '#8A7378', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Render Order Card */}
              {renderBakeryOrderCard(searchedOrder, getStepIndex)}
            </div>
          )}

          {/* User's Placed Bakery Orders */}
          {bakeryOrders.length === 0 && !searchedOrder ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                padding: '3rem 1.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
                <Cake size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                No Bakery Orders Yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                You haven't ordered any fresh designer cakes or gourmet treats yet. Explore our handcrafted creations on the home page!
              </p>
              <Link
                to="/#products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-berry)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textDecoration: 'none'
                }}
              >
                <span>Browse Bakery Creations</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {bakeryOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1.5px solid var(--border-subtle)',
                    padding: '1.75rem',
                    boxShadow: '0 4px 20px rgba(87, 51, 58, 0.04)'
                  }}
                >
                  {renderBakeryOrderCard(order, getStepIndex)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: COURSE PURCHASES & RECEIPTS (EXISTING CODE PRESERVED) ================= */}
      {activeTab === 'courses' && (
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
              <Link to="/courses" className="btn btn-primary">
                Explore Masterclasses &rarr;
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                      padding: '1.2rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      backgroundColor: '#FFFFFF',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, backgroundColor: '#FAF0F2' }}>
                          <img
                            src={ord.course_thumbnail || ord.course_image || '/images/hero-cake.png'}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Order Reference: <strong style={{ color: 'var(--color-plum)', fontFamily: 'monospace' }}>{ord.order_number}</strong>
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '1.05rem' }}>
                            {ord.course_title || 'Masterclass Enrollment'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Placed on {new Date(ord.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                            ₹{ord.total_amount}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            via WhatsApp
                          </div>
                        </div>

                        <div>
                          {isPending && (
                            <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={12} /> Pending Confirmation
                            </span>
                          )}
                          {isCompleted && (
                            <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CheckCircle size={12} /> Enrolled & Confirmed
                            </span>
                          )}
                          {isCancelled && (
                            <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <XCircle size={12} /> Cancelled
                            </span>
                          )}
                          {isRefunded && (
                            <span style={{ backgroundColor: '#E5E7EB', color: '#374151', padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                              Refunded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: isCompleted ? '#065F46' : isPending ? '#92400E' : 'var(--text-muted)' }}>
                      {isCompleted && <CheckCircle size={16} />}
                      {isPending && <Clock size={16} />}
                      {(isCancelled || isRefunded) && <AlertCircle size={16} />}
                      <span>{getStatusMessage(ord.order_status)}</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.8rem', borderTop: '1px solid #FAF0F2' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(ord)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.82rem' }}
                      >
                        View Order Receipt
                      </button>

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
      )}

      {/* Read-Only Course Receipt Modal */}
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

// Helper: Render Bakery Order Card with Live Stepper
function renderBakeryOrderCard(order: BakeryOrder, getStepIndex: (status: ProductTrackingStatus) => number) {
  const currentStep = getStepIndex(order.trackingStatus);
  const isCancelled = order.trackingStatus === 'CANCELLED';

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <img
            src={order.items[0]?.productImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'}
            alt=""
            style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '0.78rem', color: '#8A7378', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tracking Order: <strong style={{ color: 'var(--color-berry)', fontFamily: 'monospace' }}>{order.orderNumber}</strong>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-plum)', margin: '0.1rem 0 0.2rem 0' }}>
              {order.items[0]?.productName}
            </h3>
            <div style={{ fontSize: '0.84rem', color: '#6F5B60' }}>
              {order.items[0]?.weight} • Qty: {order.items[0]?.quantity} • Placed on {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-berry)' }}>
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7E696E' }}>
            {order.paymentMethod === 'WHATSAPP_UPI' ? 'WhatsApp UPI' : 'Cash on Delivery'}
          </div>
        </div>
      </div>

      {/* Message on Cake if any */}
      {order.messageOnCake && (
        <div style={{ backgroundColor: '#FFF5F7', borderRadius: '10px', padding: '0.6rem 0.9rem', fontSize: '0.85rem', color: 'var(--color-plum)', marginBottom: '1.25rem' }}>
          ✨ <strong>Message on Cake:</strong> "{order.messageOnCake}"
        </div>
      )}

      {/* LIVE VISUAL TRACKING STEPPER */}
      <div style={{ backgroundColor: '#FDF9FA', borderRadius: '16px', padding: '1.25rem', border: '1px solid #F0D9DE', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-berry)', marginBottom: '1rem' }}>
          Live Kitchen & Delivery Tracking
        </div>

        {!isCancelled ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', position: 'relative' }}>
            {TRACKING_STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isPast ? '#25D366' : isCurrent ? 'var(--color-berry)' : '#E6D7DA',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(169, 87, 104, 0.2)' : 'none'
                    }}
                  >
                    {isPast ? <Check size={16} /> : idx + 1}
                  </div>
                  <div style={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.8rem', color: isCurrent ? 'var(--color-plum)' : '#7E696E', lineHeight: 1.2 }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#D9383A', fontWeight: 600, fontSize: '0.9rem' }}>
            ⚠️ This order has been cancelled.
          </div>
        )}

        {/* Latest note from Chef */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div style={{ borderTop: '1px solid #F0D9DE', marginTop: '1rem', paddingTop: '0.75rem', fontSize: '0.82rem', color: '#57333A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} color="var(--color-berry)" />
            <span>
              <strong>Latest Kitchen Update:</strong> {order.statusHistory[order.statusHistory.length - 1].note || 'Order is being actively prepared.'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Info & Contact Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#6F5B60' }}>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={14} color="var(--color-berry)" />
            <span>Delivery: {order.deliveryDate || 'As scheduled'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={14} color="var(--color-berry)" />
            <span className="truncate" style={{ maxWidth: '250px' }} title={order.deliveryAddress}>
              {order.deliveryAddress}
            </span>
          </div>
        </div>

        <a
          href={`https://wa.me/918248957918?text=${encodeURIComponent(
            `Hello Chef Anisha! Regarding my bakery order #${order.orderNumber} (${order.items[0]?.productName}), I wanted to ask a question.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            backgroundColor: '#25D366',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.82rem',
            textDecoration: 'none'
          }}
        >
          <MessageCircle size={14} /> Contact Chef on WhatsApp
        </a>
      </div>
    </div>
  );
}

export default MyPurchases;
