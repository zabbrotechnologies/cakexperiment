import React, { useState, useEffect } from 'react';
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
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

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
      <header className={`floating-navbar-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="floating-navbar-box" style={{ position: 'relative' }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="/images/logo.png"
              alt="CakeXperiment - Celebrating Flavours"
              style={{
                height: '52px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </Link>

          {/* Desktop Navigation — centered to the curved rectangular bar */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '1.35rem',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap'
            }}
            className="desktop-nav"
          >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>

            {/* Wishlist Trigger */}
            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/signin', { state: { from: '/wishlist', message: 'Please sign in to view your saved wishlist.' } });
                } else {
                  navigate('/wishlist');
                }
              }}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: 'var(--color-plum)',
                cursor: 'pointer',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%'
              }}
            >
              <Heart size={20} />
              {isAuthenticated && wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-2px',
                    minWidth: '17px',
                    height: '17px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-berry)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px'
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <button
              type="button"
              aria-label="Shopping Bag"
              onClick={() => setCartDrawerOpen(true)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: 'var(--color-plum)',
                cursor: 'pointer',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%'
              }}
            >
              <ShoppingBag size={20} />
              {isAuthenticated && cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-2px',
                    minWidth: '17px',
                    height: '17px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-plum)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* User State */}
            {isAuthenticated && user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.35rem 0.8rem 0.35rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-blush)',
                      color: 'var(--color-berry)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <UserIcon size={16} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={15} color="var(--color-plum)" />
                </button>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '220px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.5rem 0',
                      zIndex: 1000
                    }}
                  >
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/signin" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/courses" className="btn btn-primary btn-sm">
                  Explore Courses &rarr;
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              aria-label="Toggle menu"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                padding: '0.4rem',
                color: 'var(--color-plum)',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(220, 165, 175, 0.45)',
              padding: '1.5rem',
              boxShadow: '0 16px 40px -6px rgba(87, 51, 58, 0.16)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={(e) => handleNavClick(e, link)}
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? 'var(--color-berry)' : 'var(--color-plum)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{link.label}</span>
                    {active && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-berry)' }} />}
                  </Link>
                );
              })}

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '0.5rem 0' }} />

              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <Link to="/admin" className="btn btn-primary">
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link to="/learn" className="btn btn-primary">
                      Go to Classroom
                    </Link>
                  )}
                  <button onClick={signOut} className="btn btn-secondary">
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to="/signin" className="btn btn-secondary" style={{ flex: 1 }}>
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn btn-primary" style={{ flex: 1 }}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Responsive Style Overrides */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
      <CartDrawer />
    </>
  );
};
