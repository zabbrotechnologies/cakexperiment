import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Video,
  Users,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', to: '/admin', icon: <LayoutDashboard size={18} />, end: true },
    { label: 'Courses', to: '/admin/courses', icon: <BookOpen size={18} /> },
    { label: 'Categories', to: '/admin/categories', icon: <FolderTree size={18} /> },
    { label: 'Videos & Lessons', to: '/admin/videos', icon: <Video size={18} /> },
    { label: 'Students', to: '/admin/users', icon: <Users size={18} /> },
    { label: 'Orders', to: '/admin/orders', icon: <ShoppingBag size={18} /> },
    { label: 'Payments', to: '/admin/payments', icon: <CreditCard size={18} /> },
    { label: 'Reviews', to: '/admin/reviews', icon: <MessageSquare size={18} /> },
    { label: 'Settings', to: '/admin/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FDF7F5' }}>
      
      {/* Sidebar Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(87, 51, 58, 0.4)',
            zIndex: 950
          }}
        />
      )}

      {/* Persistent / Responsive Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 960,
          transition: 'transform 0.3s ease',
          transform: sidebarOpen ? 'translateX(0)' : 'none'
        }}
        className="admin-sidebar"
      >
        {/* Brand Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <img
              src="/images/logo.png"
              alt="CakeXperiment"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-berry)', fontWeight: 700, backgroundColor: 'var(--color-blush)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Admin
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-close-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? 'var(--color-blush)' : 'transparent',
                color: isActive ? 'var(--color-plum)' : 'var(--text-muted)'
              })}
            >
              <span style={{ color: 'var(--color-berry)' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer with Shortcuts */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'var(--color-plum)',
              backgroundColor: 'var(--color-cream)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span>View Public Website</span>
            <ExternalLink size={14} />
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'var(--color-berry)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }} className="admin-main">
        
        {/* Admin Topbar */}
        <header
          style={{
            height: '70px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 900
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="admin-hamburger"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Cakexperiment Studio Console
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--color-blush)', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
              <ShieldCheck size={14} color="var(--color-berry)" />
              <span>Demo Admin Role</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt="Admin"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-rose)' }}
              />
              <div style={{ display: 'none' }} className="admin-user-info">
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)' }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Admin Page Body */}
        <main style={{ padding: '2rem', flex: 1 }}>
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .admin-main {
            margin-left: 0 !important;
          }
          .admin-hamburger {
            display: block !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
        @media (min-width: 901px) {
          .admin-user-info {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
