import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Course } from '../../types';
import {
  MessageCircle,
  ShieldCheck,
  Lock,
  AlertCircle,
  ChevronLeft,
  Cake,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState<any | null>(null);

  // Authentication Guard: Redirect to /signin if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', {
        state: { from: { pathname: `/checkout/${courseId}` } },
        replace: true
      });
    }
  }, [authLoading, isAuthenticated, navigate, courseId]);

  // Read-only Course Fetch: NEVER creates an order on mount or refresh
  useEffect(() => {
    if (!courseId) return;

    // Fetch from backend API first, fallback to storageService
    fetch(`/api/courses/${courseId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.course) {
          setCourse(data.course);
        } else {
          const fallback =
            storageService.getCourseById(courseId) ||
            storageService.getCourseBySlug(courseId);
          setCourse(fallback || null);
        }
      })
      .catch(() => {
        const fallback =
          storageService.getCourseById(courseId) ||
          storageService.getCourseBySlug(courseId);
        setCourse(fallback || null);
      })
      .finally(() => {
        setLoadingCourse(false);
      });
  }, [courseId]);

  // FINAL WHATSAPP BUTTON EXECUTION
  // An order is created ONLY when the user clicks this button
  const handleContinueToWhatsApp = async () => {
    if (!user || !course) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          courseId: course.id
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create official purchase order in studio records.');
      }

      setOrderCreated(data.order);

      // Successfully saved order details in Neon Postgres -> Redirect to WhatsApp
      if (data.order.whatsappUrl) {
        // Open WhatsApp in a new tab or window
        const win = window.open(data.order.whatsappUrl, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          // If popup blocked, direct location assignment
          window.location.href = data.order.whatsappUrl;
        }
      }
    } catch (err: any) {
      // If order creation fails, do NOT redirect to WhatsApp; show clear error and allow safe retry
      setErrorMessage(err.message || 'Could not connect to studio order service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingCourse) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Preparing purchase summary...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>Course Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The requested masterclass could not be located.</p>
        <Link to="/courses" className="btn btn-primary">Browse All Courses</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '85vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to={`/courses/${course.slug}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-plum)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}
          >
            <ChevronLeft size={16} /> Back to Course Overview
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '0.4rem' }}>
            Course Purchase Summary
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Review your masterclass enrollment details before connecting to our WhatsApp concierge
          </p>
        </div>

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '1rem 1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #FFCDD2' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.92rem' }}>{errorMessage}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Purchase Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Selected Course Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.8rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', marginBottom: '1.2rem', fontWeight: 600 }}>
                Selected Masterclass
              </h2>
              
              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <img
                  src={course.thumbnail || course.image || '/images/hero-cake.png'}
                  alt={course.title}
                  style={{ width: '100px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-berry)', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Course ID: {course.id}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    {course.title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Instructor: {course.instructorName || 'Chef Camille Laurent'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Access Duration</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-plum)', fontWeight: 600 }}>Lifetime Digital Access</span>
              </div>
            </div>

            {/* Customer Account Information */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.8rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', marginBottom: '1.2rem', fontWeight: 600 }}>
                Customer Account Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Full Name</div>
                  <div style={{ color: 'var(--color-plum)', fontWeight: 600 }}>{user?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Email Address</div>
                  <div style={{ color: 'var(--color-plum)', fontWeight: 600 }}>{user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>User ID</div>
                  <div style={{ color: 'var(--color-berry)', fontWeight: 600, fontFamily: 'monospace' }}>{user?.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Account Role</div>
                  <div style={{ color: '#2E7D32', fontWeight: 600 }}>{user?.role}</div>
                </div>
              </div>
            </div>

            {/* Manual Payment Information Notice */}
            <div style={{ backgroundColor: '#FFF9E6', borderRadius: 'var(--radius-lg)', padding: '1.4rem 1.8rem', border: '1px solid #FFE082' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                <MessageCircle size={22} color="#F57F17" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ color: '#E65100', margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
                    Manual WhatsApp Payment Coordination
                  </h4>
                  <p style={{ color: '#5D4037', margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Cakexperiment uses personalized concierge payment coordination. When you click <strong>Continue to WhatsApp</strong>, an official order is securely recorded in our database, and WhatsApp will open with your pre-filled Order ID. Our chef concierge will guide you through UPI/bank transfer and immediately activate your course.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & WhatsApp Action */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.8rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', marginBottom: '1.2rem', fontWeight: 600 }}>
              Order Price Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Masterclass Fee</span>
                <span>₹{course.price || 499}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E7D32' }}>
                <span>Studio Launch Special</span>
                <span>Included</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                <span>Total Amount</span>
                <span>₹{course.price || 499}</span>
              </div>
            </div>

            {/* CRITICAL BUTTON: Creates the order in Neon PostgreSQL and opens WhatsApp */}
            <button
              onClick={handleContinueToWhatsApp}
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                fontSize: '1rem',
                padding: '0.9rem'
              }}
            >
              <MessageCircle size={20} />
              {isSubmitting ? 'Creating Order & Connecting...' : 'Continue to WhatsApp'}
            </button>

            {orderCreated && (
              <div style={{ marginTop: '1.2rem', padding: '0.8rem', backgroundColor: '#E8F5E9', borderRadius: 'var(--radius-md)', border: '1px solid #C8E6C9', fontSize: '0.85rem', color: '#2E7D32' }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Order Created: {orderCreated.orderNumber}
                </div>
                <div style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                  Awaiting WhatsApp payment confirmation from administrator.
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} color="var(--color-berry)" />
              Secure 256-bit encrypted studio transaction
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
export default Checkout;

