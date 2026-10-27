import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { storageService } from '../../services/storage';
import {
  BookOpen,
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  Plus
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics] = useState(() => storageService.getAdminMetrics());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Welcome & Quick Action */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
            Academy Overview & Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live metrics, recent orders, student enrollments, and course revenue
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <Link to="/admin/courses/new" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Create Course
          </Link>
          <Link to="/" target="_blank" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            View Website <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.4rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Simulated Revenue</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {storageService.formatINR(metrics.revenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2E7D32', marginTop: '0.3rem', fontWeight: 500 }}>
            +18% from last month
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.4rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {metrics.totalOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            100% digital fulfillment
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.4rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Students</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {metrics.totalStudents}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Registered student accounts
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.4rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Published Courses</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {metrics.publishedCourses} / {metrics.totalCourses}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-berry)', marginTop: '0.3rem', fontWeight: 500 }}>
            {metrics.totalCourses - metrics.publishedCourses} in draft
          </div>
        </div>

      </div>

      {/* Tables Row: Recent Orders & Recent Students */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Recent Orders */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', margin: 0 }}>
              Recent Course Orders
            </h3>
            <Link to="/admin/orders" style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 600 }}>
              View All Orders &rarr;
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.6rem 0' }}>Order Ref</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Student</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Amount</th>
                  <th style={{ padding: '0.6rem 0', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                    <td style={{ padding: '0.8rem 0', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-plum)' }}>
                      {ord.orderNumber}
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', color: 'var(--color-plum)' }}>
                      <div style={{ fontWeight: 500 }}>{ord.userName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ord.courseTitle}</div>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                      {storageService.formatINR(ord.amount)}
                    </td>
                    <td style={{ padding: '0.8rem 0', textAlign: 'right' }}>
                      <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', textTransform: 'capitalize', fontSize: '0.72rem' }}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registrations */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', margin: 0 }}>
              Recent Student Registrations
            </h3>
            <Link to="/admin/users" style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 600 }}>
              Manage Students &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {metrics.recentStudents.map((st) => (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-cream)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={st.avatar} alt={st.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)' }}>{st.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(st.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Popular Masterclasses Catalog Row */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', margin: 0 }}>
            Top Masterclasses by Enrollment
          </h3>
          <Link to="/admin/courses" style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 600 }}>
            Manage All Courses &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
          {metrics.popularCourses.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <img src={c.thumbnail} alt={c.title} style={{ width: '60px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1.2 }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Fee: {storageService.formatINR(c.price)} • {c.lessonCount} Lessons
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
