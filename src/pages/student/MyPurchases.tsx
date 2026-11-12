import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { ProductOrder } from '../../types';
import {
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  X,
  BookOpen,
  Truck,
  Package,
  Search,
  Calendar,
  MapPin,
  Banknote,
  ShoppingBag
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
  const [activeTab, setActiveTab] = useState<'products' | 'courses'>('products');

  // Courses Orders (WhatsApp Manual Activation)
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<UserOrder | null>(null);

  // Physical Product Orders (COD & 5-Step Tracking from Neon PostgreSQL)
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTrackingNumber, setSearchTrackingNumber] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<ProductOrder | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

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

  const fetchProductOrders = async () => {
    setLoadingProducts(true);
    try {
      const list = await ecommerceApi.getMyProductOrders();
      setProductOrders(list);
    } catch {
      setProductOrders([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    fetchProductOrders();
  }, [user]);

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = searchTrackingNumber.trim();
    if (!num) return;
    setLookupError(null);
    try {
      const found = await ecommerceApi.getSingleProductOrder(num);
      setSearchedOrder(found);
    } catch (err: any) {
      setSearchedOrder(null);
      setLookupError(err.message || `No order found matching "${num}".`);
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
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #EEDCE0', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          style={{
            padding: '0.75rem 1.4rem',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '1rem',
            color: activeTab === 'products' ? 'var(--color-berry)' : 'var(--color-plum)',
            borderBottom: activeTab === 'products' ? '3px solid var(--color-berry)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Package size={18} />
          <span>Physical Product Orders ({productOrders.length})</span>
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
          <span>Course Orders ({orders.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PHYSICAL PRODUCT ORDERS (COD & 5-STEP TRACKING) ================= */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
                Track Any Product Order by ID
              </div>
              <div style={{ fontSize: '0.82rem', color: '#7E696E' }}>
                Enter your Order ID (e.g. CAK-...) to open live 5-step delivery tracking:
              </div>
            </div>

            <form onSubmit={handleLookupOrder} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="e.g. CAK-179..."
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
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Search size={14} /> Track
              </button>
            </form>
          </div>

          {lookupError && (
            <div style={{ padding: '0.9rem 1.2rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '12px', fontSize: '0.88rem' }}>
              {lookupError}
            </div>
          )}

          {searchedOrder && (
            <div style={{ backgroundColor: '#FFF8F9', borderRadius: '20px', border: '2px solid var(--color-berry)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-berry)', textTransform: 'uppercase' }}>
                  Order Search Result
                </span>
                <button type="button" onClick={() => setSearchedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              {renderProductOrderCard(searchedOrder)}
            </div>
          )}

          {loadingProducts ? (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading your physical product orders from Neon PostgreSQL...
            </div>
          ) : productOrders.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-subtle)', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
                <ShoppingBag size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                No Physical Product Orders Yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
                Explore handcrafted cakes, gift hampers, chocolates, and baking studio equipment with Cash on Delivery.
              </p>
              <Link to="/shop" className="btn btn-primary">
                Browse Physical Shop <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {productOrders.map(ord => (
                <div key={ord.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid var(--border-subtle)', padding: '1.6rem', boxShadow: 'var(--shadow-sm)' }}>
                  {renderProductOrderCard(ord)}
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
      {selectedReceipt && createPortal(
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
        </div>,
        document.body
      )}

    </div>
  );
};

function renderProductOrderCard(order: ProductOrder) {
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isHamper = order.orderType === 'HAMPER';
  const addressSummary = order.shippingAddress.city
    ? `${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}${order.shippingAddress.pincode ? ` (${order.shippingAddress.pincode})` : ''}`
    : (order.shippingAddress.streetAddress || 'Delivery address recorded');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isHamper ? 'Gift Hamper Order ID:' : 'Product Order ID:'}{' '}
            <strong style={{ color: 'var(--color-berry)', fontFamily: 'monospace' }}>{order.orderNumber}</strong>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Placed on {new Date(order.createdAt).toLocaleDateString()} • {isHamper ? 'Bespoke WhatsApp Order' : `${order.deliveryMethod} Delivery`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '0.32rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              backgroundColor: isCancelled ? '#FFEBEE' : isDelivered ? '#E8F5E9' : '#FFF3E0',
              color: isCancelled ? '#C62828' : isDelivered ? '#2E7D32' : '#E65100'
            }}
          >
            {order.status}
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-plum)' }}>
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
              <Banknote size={12} />{' '}
              {order.codCollected ? 'Paid / Collected' : isHamper ? 'WhatsApp Confirmation' : 'Cash on Delivery'}
            </div>
          </div>
        </div>
      </div>

      {/* Items Thumbnails & Quantities */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {order.items.map(it => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.85rem', borderRadius: '12px', backgroundColor: 'var(--color-cream)', border: '1px solid var(--border-subtle)', minWidth: '220px' }}>
            {it.image && <img src={it.image} alt={it.productName} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)' }}>{it.productName}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {it.variantLabel ? `${it.variantLabel} • ` : ''}Qty {it.quantity} • ₹{it.lineTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row: Expected Delivery & Track Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #FAF0F2', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} color="var(--color-berry)" />
            {isHamper ? 'Preferred Date:' : 'Expected:'} <strong style={{ color: 'var(--color-plum)' }}>{order.expectedDeliveryDate}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} color="var(--color-berry)" />
            {addressSummary}
          </span>
        </div>

        <Link
          to={isHamper ? `/track-hamper/${order.orderNumber}` : `/orders/${order.orderNumber}/track`}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Truck size={15} />
          <span>Track Order</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default MyPurchases;
