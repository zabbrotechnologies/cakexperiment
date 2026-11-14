import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  BookOpen, 
  LayoutDashboard, 
  ChevronDown,
  ShoppingBag,
  Heart,
  Receipt
} from 'lucide-react';
import { useShopStore } from '../../store/useShopStore';
import { CartDrawer } from '../shop/CartDrawer';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, signOut } = useAuth();
  const { cartItems, wishlistItems, setCartDrawerOpen } = useShopStore();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target)
      ) {
        // Only close if click wasn't on the mobile toggle button itself
        const toggleBtn = document.querySelector('.mobile-menu-btn');
        if (!toggleBtn || !toggleBtn.contains(target)) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [activeSection, setActiveSection] = useState<string>('home');

  const navLinks = [
    { label: 'Home', href: '/', sectionId: '' },
    { label: 'Shop', href: '/shop', sectionId: '' },
    { label: 'Gift Hampers', href: '/gift-hampers', sectionId: '' },
    { label: 'Courses', href: '/courses', sectionId: '' },
    { label: 'About', href: '/#about', sectionId: 'about' },
    { label: 'Contact', href: '#site-footer', sectionId: 'site-footer' }
  ];

  // Track scroll position to update active nav underline as user scrolls through sections
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const checkActiveSection = () => {
      const scrollY = window.scrollY;
      const navOffset = 180;

      if (scrollY < 260) {
        setActiveSection('home');
        return;
      }

      // Check sections from bottom to top
      const sections = [
        { id: 'site-footer', name: 'site-footer' },
        { id: 'categories', name: 'categories' },
        { id: 'about', name: 'about' }
      ];

      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el) {
          const top = el.offsetTop - navOffset;
          if (scrollY >= top) {
            setActiveSection(s.name);
            return;
          }
        }
      }
      setActiveSection('home');
    };

    window.addEventListener('scroll', checkActiveSection, { passive: true });
    checkActiveSection();
    return () => window.removeEventListener('scroll', checkActiveSection);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: typeof navLinks[0]) => {
    if (link.label === 'Home') {
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
        setActiveSection('home');
      }
      setMobileMenuOpen(false);
      return;
    }

    if (link.sectionId === 'site-footer') {
      e.preventDefault();
      const footerEl = document.getElementById('site-footer');
      if (footerEl) {
        footerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection('site-footer');
      }
      setMobileMenuOpen(false);
      return;
    }

    if (link.sectionId) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate(`/${link.href.startsWith('/#') ? link.href.slice(1) : link.href}`);
      } else {
        const el = document.getElementById(link.sectionId);
        if (el) {
          const navOffset = 90;
          const targetY = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
          window.history.pushState(null, '', link.href);
          setActiveSection(link.sectionId);
        }
      }
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  const isLinkActive = (link: typeof navLinks[0]) => {
    if (location.pathname === '/') {
      if (link.label === 'Home') {
        return activeSection === 'home' || (!activeSection && !location.hash);
      }
      if (link.sectionId) {
        return activeSection === link.sectionId;
      }
      return false;
    }
    return location.pathname === link.href;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header className={`floating-navbar-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="floating-navbar-box" style={{ position: 'relative' }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="/images/logo.png"
              alt="CakeXperiment - Celebrating Flavours"
              className="navbar-brand-logo"
            />
          </Link>

          {/* Desktop Navigation — centered to the curved rectangular bar */}
          <nav className="desktop-nav">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`floating-nav-link ${active ? 'is-active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & User Menu */}
          <div className="navbar-actions-container">

            {/* Wishlist Trigger */}
            <button
              type="button"
              aria-label="Wishlist"
              className="navbar-icon-btn"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/signin', { state: { from: '/wishlist', message: 'Please sign in to view your saved wishlist.' } });
                } else {
                  navigate('/wishlist');
                }
              }}
            >
              <Heart size={20} />
              {isAuthenticated && wishlistCount > 0 && (
                <span className="navbar-badge navbar-badge-berry">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <button
              type="button"
              aria-label="Shopping Bag"
              className="navbar-icon-btn"
              onClick={() => setCartDrawerOpen(true)}
            >
              <ShoppingBag size={20} />
              {isAuthenticated && cartCount > 0 && (
                <span className="navbar-badge navbar-badge-plum">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User State */}
            {isAuthenticated && user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setMobileMenuOpen(false);
                  }}
                  className="nav-user-btn"
                  aria-label="User account menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="nav-user-avatar">
                    <UserIcon size={16} />
                  </div>
                  <span className="nav-user-name">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="nav-user-chevron" />
                </button>

                {userDropdownOpen && (
                  <div className="nav-user-dropdown-panel">
                    <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span className={`badge ${isAdmin ? 'badge-berry' : 'badge-blush'}`}>
                          {isAdmin ? 'Platform Admin' : 'Student'}
                        </span>
                      </div>
                    </div>

                    {isAdmin ? (
                      <Link
                        to="/admin"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.6rem 1rem',
                          fontSize: '0.9rem',
                          color: 'var(--color-plum)'
                        }}
                      >
                        <LayoutDashboard size={16} /> Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/learn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 1rem',
                            fontSize: '0.9rem',
                            color: 'var(--color-plum)'
                          }}
                        >
                          <BookOpen size={16} /> Student Dashboard
                        </Link>
                        <Link
                          to="/my-courses"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 1rem',
                            fontSize: '0.9rem',
                            color: 'var(--color-plum)'
                          }}
                        >
                          <BookOpen size={16} /> My Enrolled Courses
                        </Link>
                        <Link
                          to="/my-purchases"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 1rem',
                            fontSize: '0.9rem',
                            color: 'var(--color-plum)'
                          }}
                        >
                          <Receipt size={16} /> My Orders & Receipts
                        </Link>
                        <Link
                          to="/wishlist"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 1rem',
                            fontSize: '0.9rem',
                            color: 'var(--color-plum)'
                          }}
                        >
                          <Heart size={16} /> Wishlist ({wishlistCount})
                        </Link>
                        <Link
                          to="/profile"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 1rem',
                            fontSize: '0.9rem',
                            color: 'var(--color-plum)'
                          }}
                        >
                          <UserIcon size={16} /> Profile Settings
                        </Link>
                      </>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                      <button
                        onClick={signOut}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.6rem 1rem',
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.9rem',
                          color: 'var(--color-berry)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-actions">
                <Link to="/signin" className="btn btn-ghost btn-sm nav-btn-signin">
                  Sign In
                </Link>
                <Link to="/courses" className="btn btn-primary btn-sm nav-btn-cta">
                  Explore Courses &rarr;
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setUserDropdownOpen(false);
              }}
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              type="button"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="mobile-nav-drawer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={(e) => handleNavClick(e, link)}
                    className="mobile-drawer-link"
                    style={{
                      fontWeight: active ? 600 : 500,
                      color: active ? 'var(--color-berry)' : 'var(--color-plum)'
                    }}
                  >
                    <span>{link.label}</span>
                    {active && <span className="mobile-active-dot" />}
                  </Link>
                );
              })}

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '0.4rem 0' }} />

              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {isAdmin ? (
                    <Link to="/admin" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link to="/learn" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Go to Classroom
                      </Link>
                      <Link to="/my-purchases" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                        My Orders & Invoices
                      </Link>
                    </>
                  )}
                  <button onClick={signOut} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link to="/signin" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      Sign In
                    </Link>
                    <Link to="/signup" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      Sign Up
                    </Link>
                  </div>
                  <Link
                    to="/courses"
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      color: 'var(--color-berry)',
                      border: '1px dashed var(--color-rose)'
                    }}
                  >
                    Explore All Masterclasses &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Comprehensive Responsive Style Architecture */}
      <style>{`
        /* Brand Logo Sizing */
        .navbar-brand-logo {
          height: 48px;
          width: auto;
          max-width: 150px;
          object-fit: contain;
          display: block;
        }

        /* Nav actions container */
        .navbar-actions-container {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }

        /* Icon action buttons */
        .navbar-icon-btn {
          position: relative;
          background: none;
          border: none;
          color: var(--color-plum);
          cursor: pointer;
          padding: 0.45rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s ease, transform 0.15s ease;
        }
        .navbar-icon-btn:hover {
          background-color: rgba(244, 221, 224, 0.5);
          transform: scale(1.05);
        }

        /* Badges */
        .navbar-badge {
          position: absolute;
          top: 0px;
          right: -2px;
          min-width: 17px;
          height: 17px;
          border-radius: 999px;
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        .navbar-badge-berry {
          background-color: var(--color-berry);
        }
        .navbar-badge-plum {
          background-color: var(--color-plum);
        }

        /* User Button & Dropdown */
        .nav-user-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.8rem 0.35rem 0.4rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: border-color 0.2s ease;
        }
        .nav-user-btn:hover {
          border-color: var(--color-rose);
        }
        .nav-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: var(--color-blush);
          color: var(--color-berry);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-user-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--color-plum);
        }
        .nav-user-chevron {
          color: var(--color-plum);
        }
        .nav-user-dropdown-panel {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          max-width: calc(100vw - 32px);
          background-color: #FFFFFF;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-subtle);
          padding: 0.5rem 0;
          z-index: 1000;
        }

        /* Unauthenticated Auth Buttons */
        .nav-auth-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Desktop Nav Link Layout */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 1.35rem;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
        }

        /* Mobile Menu Toggle Button */
        .mobile-menu-btn {
          background: none;
          border: none;
          padding: 0.45rem;
          color: var(--color-plum);
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }
        .mobile-menu-btn:hover {
          background-color: rgba(244, 221, 224, 0.5);
        }

        /* Backdrop */
        .mobile-nav-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(87, 51, 58, 0.25);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 999;
        }

        /* Mobile Drawer */
        .mobile-nav-drawer {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background-color: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          border: 1px solid rgba(220, 165, 175, 0.45);
          padding: 1.25rem 1.5rem;
          box-shadow: 0 16px 40px -6px rgba(87, 51, 58, 0.16);
          max-height: calc(100dvh - 100px);
          overflow-y: auto;
          overscroll-behavior: contain;
          z-index: 1001;
          animation: mobileDrawerSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes mobileDrawerSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-drawer-link {
          font-size: 1.02rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.35rem 0;
          transition: color 0.15s ease;
        }
        .mobile-active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--color-berry);
        }

        /* =========================================================================
           BREAKPOINT ADAPTATIONS
           ========================================================================= */

        /* 1. Large Desktops (>= 1200px): Full experience, no collisions */
        @media (min-width: 1200px) {
          .desktop-nav {
            display: flex !important;
            gap: 1.35rem;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .nav-auth-actions {
            display: flex !important;
          }
          .nav-btn-signin {
            display: inline-flex !important;
          }
          .nav-btn-cta {
            display: inline-flex !important;
          }
        }

        /* 2. Medium Desktops & Laptops (1024px to 1199px):
              - Tighter nav link gap and font size
              - Hide .nav-btn-cta to keep right actions compact (~140px)
              - Desktop nav (~420px) centered safely with ZERO collision */
        @media (min-width: 1024px) and (max-width: 1199px) {
          .desktop-nav {
            display: flex !important;
            gap: 0.85rem !important;
          }
          .desktop-nav .floating-nav-link {
            font-size: 0.88rem !important;
            padding: 0.4rem 0.15rem !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .nav-auth-actions {
            display: flex !important;
          }
          .nav-btn-signin {
            display: inline-flex !important;
          }
          .nav-btn-cta {
            display: none !important;
          }
        }

        /* 3. Tablets & Mobile (< 1024px):
              - Hide desktop centered nav
              - Show mobile hamburger button */
        @media (max-width: 1023px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          /* Hide secondary button on tablets */
          .nav-btn-cta {
            display: none !important;
          }
        }

        /* 4. Tablets (768px to 1023px):
              - Show Sign In button cleanly next to wishlist, cart, hamburger */
        @media (min-width: 768px) and (max-width: 1023px) {
          .nav-auth-actions {
            display: flex !important;
          }
          .nav-btn-signin {
            display: inline-flex !important;
          }
        }

        /* 5. Mobile phones (< 768px):
              - Top bar is clean & sleek: Logo on left, Wishlist + Cart + (User or Hamburger) on right
              - Sign In / Sign Up and Course exploration are in the mobile drawer */
        @media (max-width: 767px) {
          .nav-auth-actions {
            display: none !important;
          }
          .navbar-actions-container {
            gap: 0.4rem;
          }
        }

        /* 6. Compact Phones (< 640px):
              - Scale logo nicely to 38px
              - Slightly smaller padding */
        @media (max-width: 640px) {
          .navbar-brand-logo {
            height: 38px;
            max-width: 120px;
          }
          .navbar-icon-btn {
            width: 38px;
            height: 38px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mobile-menu-btn {
            width: 38px;
            height: 38px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        /* 7. Tiny Phones (< 480px, e.g. 393px, 375px, 360px, 320px):
              - User name hidden, avatar icon only
              - Logo scaled to 34px-36px
              - 100% fit with ZERO horizontal overflow */
        @media (max-width: 480px) {
          .nav-user-name,
          .nav-user-chevron {
            display: none !important;
          }
          .nav-user-btn {
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important;
          }
          .navbar-brand-logo {
            height: 34px;
            max-width: 105px;
          }
          .mobile-nav-drawer {
            padding: 1.15rem 1.25rem;
          }
          .mobile-drawer-link {
            padding: 0.5rem 0.2rem;
          }
        }

        @media (max-width: 340px) {
          .navbar-brand-logo {
            height: 30px;
            max-width: 90px;
          }
        }
      `}</style>
      <CartDrawer />
    </>
  );
};
