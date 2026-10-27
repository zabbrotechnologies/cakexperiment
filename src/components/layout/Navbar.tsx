import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  X, 
  Search, 
  User as UserIcon, 
  LogOut, 
  BookOpen, 
  LayoutDashboard, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const [activeSection, setActiveSection] = useState<string>('home');

  const navLinks = [
    { label: 'Home', href: '/', sectionId: '' },
    { label: 'Courses', href: '/courses', sectionId: '' },
    { label: 'About', href: '/#about', sectionId: 'about' },
    { label: 'Categories', href: '/#categories', sectionId: 'categories' },
    { label: 'FAQ', href: '/#faq', sectionId: 'faq' }
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
        { id: 'faq', name: 'faq' },
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
        <div className="floating-navbar-box">
          
          {/* Brand Logo (Image 2) */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/images/logo.png"
              alt="CakeXperiment - Celebrating Flavours"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </Link>

          {/* Desktop Navigation with Animated Underline */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            {/* Search Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search courses"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-plum)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%'
                }}
              >
                <Search size={20} />
              </button>

              {searchOpen && (
                <form
                  onSubmit={handleSearchSubmit}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: '280px',
                    padding: '0.5rem',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 999
                  }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cakes, frosting..."
                    autoFocus
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9rem',
                      color: 'var(--color-plum)'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.35rem 0.8rem' }}
                  >
                    Go
                  </button>
                </form>
              )}
            </div>

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
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'}
                    alt={user.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
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
                          <Sparkles size={16} /> My Enrolled Courses
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
                          <UserIcon size={16} /> My Profile & Purchases
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
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 859px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};
