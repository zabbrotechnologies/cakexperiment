import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Sparkles, BarChart2, Receipt, User, ShieldAlert } from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const tabs = [
    { label: 'Overview', to: '/learn', icon: <BookOpen size={16} /> },
    { label: 'My Courses', to: '/my-courses', icon: <Sparkles size={16} /> },
    { label: 'Learning Progress', to: '/my-learning', icon: <BarChart2 size={16} /> },
    { label: 'Orders & Receipts', to: '/my-purchases', icon: <Receipt size={16} /> },
    { label: 'Student Profile', to: '/profile', icon: <User size={16} /> }
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--color-cream)', paddingBottom: '4rem' }}>
      
      {/* Admin Preview Mode Notice */}
      {isAdmin && (
        <div style={{ backgroundColor: 'var(--color-plum)', color: '#FFFFFF', padding: '0.6rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={16} color="var(--color-rose)" />
          <span>You are viewing the Student Learning Portal in Administrator Preview Mode.</span>
          <Link to="/admin" style={{ color: 'var(--color-blush)', textDecoration: 'underline', fontWeight: 600 }}>
            Return to Admin Dashboard
          </Link>
        </div>
      )}

      {/* Student Sub-Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)', paddingTop: '2.5rem', paddingBottom: '1rem' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'}
                alt={user?.name || 'Student'}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-blush)', boxShadow: 'var(--shadow-sm)' }}
              />
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.2rem' }}>
                  Welcome back, {user?.name || 'Baker'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Continue honing your pastry crafts and video masterclasses
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/courses" className="btn btn-outline btn-sm">
                Browse Marketplace
              </Link>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/learn'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? 'var(--color-berry)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--color-plum)',
                  boxShadow: isActive ? '0 2px 8px rgba(169, 87, 104, 0.25)' : 'none'
                })}
              >
                {tab.icon}
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Main Student Portal Content */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <Outlet />
      </div>
    </div>
  );
};
