import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Course, Category } from '../../types';
import {
  Play,
  X,
  Sparkles,
  Award,
  Clock,
  BookOpen,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Heart,
  Palette,
  Layers,
  Thermometer,
  ShieldCheck,
  Eye,
  Quote,
  Wifi
} from 'lucide-react';

export const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth Hash Scroll on mount or hash change (for #about, #testimonials, #faq)
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      const scrollToElement = () => {
        const el = document.getElementById(hash);
        if (el) {
          const navOffset = 90;
          const targetY = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
          return true;
        }
        return false;
      };

      if (!scrollToElement()) {
        const timer1 = setTimeout(scrollToElement, 150);
        const timer2 = setTimeout(scrollToElement, 400);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, [location.hash, location.pathname]);

  // Center-Anchored Coverflow Masterclasses Carousel State
  const [courses] = useState<Course[]>(() =>
    storageService
      .getCourses()
      .filter(c => c.featured || c.status === 'published')
  );
  const [activeCourseIdx, setActiveCourseIdx] = useState(() => Math.min(2, Math.max(0, courses.length - 1)));
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalDragRef = useRef<boolean | null>(null);
  const hasMovedSignificantlyRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    isHorizontalDragRef.current = null;
    hasMovedSignificantlyRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;

    if (isHorizontalDragRef.current === null) {
      if (Math.abs(deltaX) > 7 || Math.abs(deltaY) > 7) {
        isHorizontalDragRef.current = Math.abs(deltaX) >= Math.abs(deltaY);
        if (!isHorizontalDragRef.current) {
          pointerStartRef.current = null;
          return;
        }
      } else {
        return;
      }
    }

    if (!isHorizontalDragRef.current) return;

    hasMovedSignificantlyRef.current = true;
    setIsDragging(true);

    let effective = deltaX;
    if (
      (activeCourseIdx === 0 && deltaX > 0) ||
      (activeCourseIdx === courses.length - 1 && deltaX < 0)
    ) {
      effective = deltaX * 0.32;
    }

    setDragOffset(effective);
  };

  const handlePointerEnd = () => {
    if (!pointerStartRef.current) return;
    const moved = hasMovedSignificantlyRef.current;
    const deltaX = dragOffset;

    pointerStartRef.current = null;
    isHorizontalDragRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (!moved) return;

    const swipeThreshold = 45;
    if (deltaX < -swipeThreshold && activeCourseIdx < courses.length - 1) {
      setActiveCourseIdx(prev => Math.min(prev + 1, courses.length - 1));
    } else if (deltaX > swipeThreshold && activeCourseIdx > 0) {
      setActiveCourseIdx(prev => Math.max(prev - 1, 0));
    }
  };

  const handleCardClick = (idx: number, slug: string) => {
    if (hasMovedSignificantlyRef.current) {
      hasMovedSignificantlyRef.current = false;
      return;
    }
    if (idx === activeCourseIdx) {
      navigate(`/courses/${slug}`);
    } else {
      setActiveCourseIdx(idx);
    }
  };

  const handlePrev = () => {
    setActiveCourseIdx(prev => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setActiveCourseIdx(prev => Math.min(prev + 1, courses.length - 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const [introVideoOpen, setIntroVideoOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Testimonials Curved Screen Cinema State (Default 1x auto-moving)
  const reviews = storageService.getApprovedReviews();
  const duplicatedReviews = reviews.length > 0 ? [...reviews, ...reviews, ...reviews] : [];

  // Section Scroll Reveal Hooks
  const aboutRef = useScrollReveal();
  const coursesRef = useScrollReveal();
  const pillarsRef = useScrollReveal();
  const categoriesSectionRef = useScrollReveal();
  const instructorRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const stepsRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  // Category Taxonomy Showcase State (Vertical Parallax Center-Mode Carousel)
  const [categoriesList] = useState<Category[]>(() =>
    storageService.getCategories().filter(c => c.status !== 'inactive')
  );
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [categoryDragY, setCategoryDragY] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  const carouselViewportRef = useRef<HTMLDivElement | null>(null);
  const isCarouselHoveredRef = useRef(false);
  const activeCategoryIdxRef = useRef(activeCategoryIdx);
  activeCategoryIdxRef.current = activeCategoryIdx;

  const catPointerStartRef = useRef<{ y: number } | null>(null);
  const catLastWheelRef = useRef(0);
  const catHasMovedRef = useRef(false);

  const handlePrevCategory = () => {
    setActiveCategoryIdx(prev => Math.max(0, prev - 1));
  };

  const handleNextCategory = () => {
    setActiveCategoryIdx(prev => Math.min(categoriesList.length - 1, prev + 1));
  };

  // Wheel scrolling scoped strictly to when the vertical carousel is hovered,
  // preventing normal page scroll interference while cycling, and allowing normal page scroll at boundaries
  useEffect(() => {
    const el = carouselViewportRef.current;
    if (!el) return;

    const onWheelHandler = (e: WheelEvent) => {
      if (!isCarouselHoveredRef.current) return;

      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;
      const currentIdx = activeCategoryIdxRef.current;
      const maxIdx = categoriesList.length - 1;

      // Only intercept and cycle carousel if moving between boundaries
      if (
        (isScrollingDown && currentIdx < maxIdx) ||
        (isScrollingUp && currentIdx > 0)
      ) {
        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        if (now - catLastWheelRef.current < 240) return;
        catLastWheelRef.current = now;

        if (isScrollingDown) {
          setActiveCategoryIdx(prev => Math.min(maxIdx, prev + 1));
        } else {
          setActiveCategoryIdx(prev => Math.max(0, prev - 1));
        }
      }
      // If at top and scrolling up, or at bottom and scrolling down,
      // preventDefault is NOT called, so the user can naturally continue normal page scrolling!
    };

    el.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', onWheelHandler);
  }, [categoriesList.length]);

  const handleCatPointerDown = (e: React.PointerEvent) => {
    catPointerStartRef.current = { y: e.clientY };
    catHasMovedRef.current = false;
    setCategoryDragY(0);
  };

  const handleCatPointerMove = (e: React.PointerEvent) => {
    if (!catPointerStartRef.current) return;
    const dy = e.clientY - catPointerStartRef.current.y;
    if (Math.abs(dy) > 6) {
      catHasMovedRef.current = true;
      setCategoryDragY(dy * 0.45);
    }
  };

  const handleCatPointerEnd = () => {
    if (!catPointerStartRef.current) return;
    const dy = categoryDragY;
    catPointerStartRef.current = null;
    setCategoryDragY(0);

    if (dy < -30 && activeCategoryIdx < categoriesList.length - 1) {
      handleNextCategory();
    } else if (dy > 30 && activeCategoryIdx > 0) {
      handlePrevCategory();
    }
  };

  const benefits = [
    { title: 'Beginner Friendly', desc: 'No prior baking experience needed', icon: <Sparkles size={20} /> },
    { title: 'Step-by-Step Video Lessons', desc: 'High-definition 4K macro camera angles', icon: <Play size={20} /> },
    { title: 'Learn at Your Own Pace', desc: 'Lifetime on-demand curriculum access', icon: <Clock size={20} /> },
    { title: 'Certificate of Completion', desc: 'Accredited Cakexperiment studio diploma', icon: <Award size={20} /> }
  ];

  const pillars = [
    {
      number: '01',
      title: 'Flour & Sponge Chemistry',
      description:
        'Understand moisture migration, emulsion science, and reverse-creaming to guarantee flat, velvety sponges every bake.',
      icon: <Thermometer size={28} />
    },
    {
      number: '02',
      title: 'Silky Buttercream & Piping',
      description:
        'Demystify Swiss meringue stability, nozzle angles, Russian tips, and delicate rosettes that hold sharp edges in any room temperature.',
      icon: <Layers size={28} />
    },
    {
      number: '03',
      title: 'Botanical Color Formulations',
      description:
        'Blend soft dusty roses, muted sage greens, and warm terracotta tones using professional gel colors without bleeding.',
      icon: <Palette size={28} />
    },
    {
      number: '04',
      title: 'Tiered Structural Architecture',
      description:
        'Internal dowelling, acrylic disk smoothing, and safe wedding delivery packaging for cakes that stand tall and secure.',
      icon: <ShieldCheck size={28} />
    }
  ];

  const faqs = [
    {
      q: 'Who can take these courses? Do I need prior pastry school training?',
      a: 'Everyone is welcome! Our curriculum starts from foundational kitchen basics and builds up to advanced tiered designs. Whether you are baking your very first vanilla sponge or aiming to launch a bespoke wedding cake studio, every lesson is explained with calm, step-by-step clarity.'
    },
    {
      q: 'How long do I have access to a purchased course?',
      a: 'You receive unlimited, lifetime access! Once enrolled, the video lessons, downloadable recipe formulas, and troubleshooting guides are available 24/7 on desktop, tablet, and mobile.'
    },
    {
      q: 'What equipment and ingredients will I need to start?',
      a: 'You do not need expensive commercial tools right away. Each course page lists standard kitchen tools like an 8-inch cake tin, a hand or stand mixer, an offset spatula, and common piping tips. We also provide a downloadable shopping guide.'
    },
    {
      q: 'How do the video lessons work?',
      a: 'Our courses feature high-definition macro video lessons that zoom in on nozzle pressure, batter consistency, and palette knife strokes. You can pause, rewind, track your completion, and ask questions at any time.'
    },
    {
      q: 'Can I purchase courses from outside India? What payment methods are supported?',
      a: 'Yes, we welcome students globally! We support major credit and debit cards, UPI, Net Banking, and international payment gateways with instant course unlock.'
    },
    {
      q: 'What is your refund policy?',
      a: 'We offer a 14-day satisfaction guarantee. If you watch the first module and feel the course is not for you, simply reach out to our studio concierge for an effortless resolution.'
    }
  ];

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* =========================================================================
          1. HERO SECTION (Strawberry Cream Luxury Aesthetic with Staged Sequence)
          ========================================================================= */}
      <section
        className="hero-section hero-bg-animated"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: "url('/images/hero-cake.png')",
          backgroundPosition: 'center right',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          paddingTop: '7.8rem',
          paddingBottom: '4.5rem'
        }}
      >
        {/* Editorial Double-Ring Elliptical Badge (Staged Reveal + Ambient Float) */}
        <div
          className="hero-badge hero-reveal-badge animate-float"
          style={{
            position: 'absolute',
            top: '12%',
            right: '6%',
            width: '145px',
            height: '195px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#FFF5F6',
            zIndex: 3,
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {/* Overlapping Double Wire Ellipse SVG */}
          <svg
            viewBox="0 0 145 195"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible'
            }}
          >
            {/* First slightly rotated wire oval */}
            <ellipse
              cx="72.5"
              cy="97.5"
              rx="66"
              ry="91"
              fill="rgba(87, 51, 58, 0.12)"
              stroke="rgba(244, 205, 212, 0.75)"
              strokeWidth="1.2"
              transform="rotate(-3 72.5 97.5)"
            />
            {/* Second offset wire oval intersecting */}
            <ellipse
              cx="72.5"
              cy="97.5"
              rx="65"
              ry="90"
              fill="none"
              stroke="rgba(244, 205, 212, 0.55)"
              strokeWidth="1"
              transform="rotate(3.5 72.5 97.5)"
            />
          </svg>

          {/* Text Hierarchy */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '1.24rem',
                lineHeight: 1.18,
                color: '#FFF2F4',
                textShadow: '0 1px 4px rgba(87, 51, 58, 0.35)'
              }}
            >
              <div>More</div>
              <div>than just</div>
              <div>Baking</div>
            </div>

            <div style={{ height: '9px' }} />

            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.64rem',
                fontWeight: 400,
                letterSpacing: '0.2em',
                lineHeight: 1.5,
                color: '#FFF2F4',
                textTransform: 'uppercase',
                opacity: 0.95,
                textShadow: '0 1px 3px rgba(87, 51, 58, 0.35)'
              }}
            >
              <div>IT'S A</div>
              <div>CREATIVE</div>
              <div>JOURNEY</div>
            </div>

            <div style={{ marginTop: '6px' }}>
              <Heart size={13} color="rgba(244, 205, 212, 0.85)" strokeWidth={1.5} fill="none" />
            </div>
          </div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Editorial Left Content Area with Coordinated Entrance Sequence */}
          <div style={{ maxWidth: '640px' }}>
            {/* 1. Eyebrow */}
            <div
              className="hero-reveal-eyebrow"
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-berry)',
                  fontWeight: 600
                }}
              >
                • LEARN &nbsp;•&nbsp; BAKE &nbsp;•&nbsp; CREATE &nbsp;•&nbsp; CELEBRATE •
              </span>
              <span style={{ width: '40px', height: '1px', backgroundColor: 'var(--color-rose)' }} />
            </div>

            {/* 2. Headline with controlled mask reveal */}
            <h1
              className="hero-reveal-title"
              style={{
                fontSize: 'clamp(2.8rem, 5.2vw, 4.6rem)',
                lineHeight: 1.06,
                color: 'var(--color-plum)',
                marginBottom: '1.2rem',
                fontWeight: 600
              }}
            >
              Turn Your Love for Baking into{' '}
              <span
                style={{
                  fontFamily: 'var(--font-script)',
                  color: 'var(--color-berry)',
                  display: 'block',
                  fontSize: '1.3em',
                  fontWeight: 400,
                  marginTop: '-0.1em'
                }}
              >
                Beautiful Creations
              </span>
            </h1>

            {/* 3. Supporting Copy */}
            <p
              className="hero-reveal-subtitle"
              style={{
                fontSize: '1.12rem',
                color: 'var(--text-muted)',
                lineHeight: 1.68,
                maxWidth: '540px',
                marginBottom: '2.5rem'
              }}
            >
              Step-by-step online cake baking and decorating masterclasses designed for all skill levels. Learn
              professional techniques, develop your creativity, and craft stunning bakery centerpieces from the comfort
              of your home.
            </p>

            {/* 4. Action Buttons with Micro-interactions */}
            <div
              className="hero-reveal-buttons"
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.2rem', marginBottom: '3.5rem' }}
            >
              <Link
                to="/courses"
                className="btn btn-primary btn-lg"
                style={{ boxShadow: '0 8px 24px rgba(169, 87, 104, 0.35)' }}
              >
                <span>Explore Courses</span>
                <ArrowRight size={18} />
              </Link>

              <button
                onClick={() => setIntroVideoOpen(true)}
                className="btn btn-secondary btn-lg"
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <div
                  className="play-icon-circle"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blush)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-berry)',
                    transition: 'all 0.25s var(--ease-out-editorial)'
                  }}
                >
                  <Play size={13} fill="currentColor" />
                </div>
                <span>Watch Studio Trailer</span>
              </button>
            </div>

            {/* 5. Four Learning Benefits */}
            <div
              className="hero-reveal-benefits"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1.2rem',
                marginTop: '1.6rem',
                padding: '1.25rem 1.4rem',
                backgroundColor: 'rgba(255, 250, 248, 0.42)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 30px rgba(87, 51, 58, 0.04)'
              }}
            >
              {benefits.map((b, idx) => (
                <div
                  key={b.title}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    transitionDelay: `${idx * 60}ms`
                  }}
                >
                  <div style={{ color: 'var(--color-berry)', display: 'flex', alignItems: 'center' }}>
                    {b.icon}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#111111', lineHeight: 1.45, fontWeight: 500 }}>
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .hero-section {
              background-position: center bottom !important;
            }
            .hero-badge {
              display: none !important;
            }
          }
        `}</style>
      </section>

      {/* Trailer Video Modal */}
      {introVideoOpen && (
        <div className="modal-overlay" onClick={() => setIntroVideoOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--color-cream)'
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--color-plum)',
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={18} color="var(--color-berry)" />
                Cakexperiment Atelier — Video Trailer
              </div>
              <button
                onClick={() => setIntroVideoOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000' }}>
              <video
                controls
                autoPlay
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. ABOUT US — Visual Studio Collage & Philosophy (Section 2)
          ========================================================================= */}
      <section id="about" ref={aboutRef} style={{ padding: '6.5rem 0', backgroundColor: '#FFFFFF', scrollMarginTop: '6rem' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
              gap: '4rem'
            }}
          >
            {/* Visual Studio Collage with Rock-solid Reveal */}
            <div className="reveal-on-scroll" style={{ position: 'relative' }}>
              {/* Floating Quality Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-12px',
                  backgroundColor: '#FFFFFF',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '999px',
                  boxShadow: '0 8px 24px rgba(87,51,58,0.12)',
                  border: '1px solid rgba(220,165,175,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  zIndex: 3
                }}
              >
                <Sparkles size={16} color="var(--color-berry)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                  Parisian Patisserie Atelier
                </span>
              </div>

              {/* Main Studio Frame */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  height: '480px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  backgroundColor: 'var(--color-cream)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"
                  alt="Cakexperiment Baking Studio"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              {/* Offset Overlapping Mini Photo with delayed rise */}
              <div
                className="reveal-on-scroll stagger-2"
                style={{
                  position: 'absolute',
                  bottom: '-25px',
                  right: '10px',
                  width: '210px',
                  height: '210px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '6px solid #FFFFFF',
                  boxShadow: 'var(--shadow-lg)',
                  backgroundColor: 'var(--color-cream)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=500&q=80"
                  alt="Piping Cake Flowers"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>

            {/* Story Editorial */}
            <div className="reveal-on-scroll stagger-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-berry)',
                    fontWeight: 600
                  }}
                >
                  OUR PHILOSOPHY
                </span>
                <span style={{ width: '32px', height: '1px', backgroundColor: 'var(--color-rose)' }} />
              </div>

              <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1.4rem' }}>
                Where Patisserie Precision Meets Warm, Creative Freedom
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.2rem' }}>
                Cakexperiment began with a simple belief: baking beautiful cakes should not require years behind closed
                culinary school doors. We demystify European pastry technique into friendly, structured video modules
                that honor your creative experiments.
              </p>

              <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                From getting that silky gloss on Swiss meringue to hand-painting watercolor botanicals onto chilled
                buttercream, our curriculum is engineered to give home bakers true mastery and absolute confidence.
              </p>

              {/* Statistics Counter Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.5rem',
                      fontWeight: 600,
                      color: 'var(--color-berry)',
                      lineHeight: 1
                    }}
                  >
                    14k+
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Active Bakers
                  </div>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-subtle)' }} />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.5rem',
                      fontWeight: 600,
                      color: 'var(--color-berry)',
                      lineHeight: 1
                    }}
                  >
                    98.6%
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Positive Rating
                  </div>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-subtle)' }} />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.5rem',
                      fontWeight: 600,
                      color: 'var(--color-berry)',
                      lineHeight: 1
                    }}
                  >
                    100%
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Lifetime Access
                  </div>
                </div>
              </div>

              <a href="#courses" className="btn btn-outline">
                <span>Explore Masterclasses</span> &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURED COURSES SECTION — Center-Anchored Coverflow Carousel (Image 3 Style)
          ========================================================================= */}
      <section id="courses" ref={coursesRef} style={{ padding: '6.5rem 0', backgroundColor: 'var(--color-cream)', scrollMarginTop: '6.5rem' }}>
        <div className="container">
          {/* Header Row: Eyebrow + Title on left, "View All Courses" link on right (Image 1 pill removed!) */}
          <div
            className="reveal-on-scroll"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-berry)',
                    fontWeight: 600
                  }}
                >
                  STUDIO MASTERCLASSES
                </span>
                <span style={{ width: '30px', height: '1px', backgroundColor: 'var(--color-rose)' }} />
              </div>
              <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)' }}>Featured Cake Art Courses</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Header Counter & Arrow Control Pill */}
              <div className="showcase-nav-pill">
                <span className="showcase-nav-counter">
                  {String(activeCourseIdx + 1).padStart(2, '0')} / {String(courses.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeCourseIdx === 0}
                  className="showcase-nav-btn prev"
                  aria-label="Previous Course"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeCourseIdx >= courses.length - 1}
                  className="showcase-nav-btn next"
                  aria-label="Next Course"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <Link to="/courses" className="btn btn-secondary">
                <span>View All Courses ({storageService.getCourses().length})</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Stationary Fixed Center Stage Viewport (Independent of track translation) */}
          <div
            className="fixed-showcase-viewport"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            aria-label="Featured Cake Art Courses Carousel"
          >
            {/* Left Nav Arrow Button on Stage */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeCourseIdx === 0}
              className="showcase-side-arrow prev"
              aria-label="Previous Course"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Right Nav Arrow Button on Stage */}
            <button
              type="button"
              onClick={handleNext}
              disabled={activeCourseIdx >= courses.length - 1}
              className="showcase-side-arrow next"
              aria-label="Next Course"
            >
              <ChevronRight size={22} />
            </button>

            {/* Fixed Center Stage Deck */}
            <div className="fixed-showcase-stage">
              {courses.map((course, idx) => {
                const diff = idx - activeCourseIdx;
                const isActive = diff === 0;

                let posClass = 'pos-hidden-right';
                if (diff === 0) posClass = 'pos-0';
                else if (diff === -1) posClass = 'pos-left-1';
                else if (diff === 1) posClass = 'pos-right-1';
                else if (diff === -2) posClass = 'pos-left-2';
                else if (diff === 2) posClass = 'pos-right-2';
                else if (diff < -2) posClass = 'pos-hidden-left';
                else if (diff > 2) posClass = 'pos-hidden-right';

                return (
                  <div
                    key={course.id}
                    className={`showcase-card ${posClass} ${isActive ? 'is-active' : ''} ${isDragging ? 'is-dragging' : ''}`}
                    onClick={() => handleCardClick(idx, course.slug)}
                    style={{
                      '--drag-x': `${dragOffset}px`
                    } as React.CSSProperties}
                  >
                    <img src={course.thumbnail} alt={course.title} className="showcase-card-img" draggable={false} />

                    {/* Bottom Dark Gradient for Text Contrast */}
                    <div className="showcase-card-overlay" />

                    {/* Top Badges */}
                    <div className="showcase-card-top-badges">
                      <span className="badge badge-berry" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                        {course.skillLevel}
                      </span>
                      {course.featured && (
                        <span className="badge badge-blush" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                          Bestseller
                        </span>
                      )}
                    </div>

                    {/* Bottom Info directly on card: Category, Title, Price, Duration */}
                    <div className="showcase-card-content">
                      <div className="showcase-card-category">
                        {course.categoryName}
                      </div>
                      <h3 className="showcase-card-title">
                        {course.title}
                      </h3>
                      <div className="showcase-card-bottom-row">
                        <div className="showcase-card-price">
                          {storageService.formatINR(course.price)}
                        </div>
                        <div className="showcase-card-duration">
                          <Clock size={13} />
                          <span>{course.totalDuration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Indicators directly linked to Central Showcase */}
          <div
            className="showcase-pagination-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              marginTop: '2rem'
            }}
          >
            {courses.map((course, idx) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setActiveCourseIdx(idx)}
                className={`showcase-dot ${idx === activeCourseIdx ? 'is-active' : ''}`}
                aria-label={`Go to course ${idx + 1}: ${course.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. WHAT YOU'LL LEARN — Curriculum Pillars (Section 4 with Staggered Entrance)
          ========================================================================= */}
      <section ref={pillarsRef} style={{ padding: '6rem 0', backgroundColor: 'var(--color-cream)' }}>
        <div className="container">
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-berry)',
                  fontWeight: 600
                }}
              >
                CURRICULUM PILLARS
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1rem' }}>
              Master the Craft From Chemistry to High Art
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Every technique in our academy is grounded in solid culinary science, repeatable formulas, and
              contemporary floral aesthetics.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}
          >
            {pillars.map((pillar, idx) => (
              <div
                key={pillar.number}
                className={`reveal-on-scroll stagger-${idx + 1}`}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.8rem',
                  border: '1px solid var(--border-subtle)',
                  position: 'relative',
                  transition: 'transform 0.3s var(--ease-out-editorial), box-shadow 0.3s var(--ease-out-editorial)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.4rem',
                    color: 'var(--color-rose)',
                    fontWeight: 600,
                    opacity: 0.6,
                    marginBottom: '0.5rem'
                  }}
                >
                  {pillar.number}
                </div>
                <div style={{ color: 'var(--color-berry)', marginBottom: '1rem' }}>{pillar.icon}</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{pillar.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5B. CATEGORY TAXONOMY SHOWCASE — Vertical Parallax Center-Mode Carousel
          Displayed immediately above Founder & Head Chef section
          ========================================================================= */}
      <section
        id="categories"
        ref={categoriesSectionRef}
        className="category-parallax-section"
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Centered Editorial Header */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-berry)',
                  fontWeight: 600
                }}
              >
                ACADEMY DISCIPLINES
              </span>
              <span style={{ width: '30px', height: '1px', backgroundColor: 'var(--color-rose)' }} />
            </div>

            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '0.85rem' }}>
              Explore by Cake Art Category
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Immerse in specialized cake disciplines curated by our master pastry chefs. Select or scroll any category to explore its curriculum.
            </p>
          </div>

          {/* Primary Centered Vertical Parallax Carousel with Center-Mode Effect */}
          <div className="reveal-on-scroll stagger-2 category-parallax-stage-wrap">
            {/* The Vertical Center-Mode Viewport */}
            <div
              ref={carouselViewportRef}
              className="category-parallax-viewport"
              tabIndex={0}
              onMouseEnter={() => {
                setIsCarouselHovered(true);
                isCarouselHoveredRef.current = true;
              }}
              onMouseLeave={() => {
                setIsCarouselHovered(false);
                isCarouselHoveredRef.current = false;
              }}
              onPointerDown={handleCatPointerDown}
              onPointerMove={handleCatPointerMove}
              onPointerUp={handleCatPointerEnd}
              onPointerCancel={handleCatPointerEnd}
              aria-label="Category Parallax Carousel"
            >
              {categoriesList.map((cat, idx) => {
                const diff = idx - activeCategoryIdx;
                const isActive = diff === 0;

                let slotClass = 'vp-hidden';
                if (diff === 0) slotClass = 'vp-center';
                else if (diff === -1) slotClass = 'vp-up-1';
                else if (diff === -2) slotClass = 'vp-up-2';
                else if (diff === 1) slotClass = 'vp-down-1';
                else if (diff === 2) slotClass = 'vp-down-2';

                // Parallax counter-shift for the inner photograph (enhanced for larger viewport)
                const parallaxY = diff === 0 ? 0 : diff * -32;

                const courseCount =
                  storageService.getCourses().filter(c => c.categoryId === cat.id).length ||
                  cat.courseCount ||
                  3;

                return (
                  <div
                    key={cat.id}
                    className={`category-parallax-card ${slotClass}`}
                    onClick={() => {
                      if (catHasMovedRef.current) return;
                      if (isActive) {
                        navigate(`/courses?category=${cat.slug}`);
                      } else {
                        setActiveCategoryIdx(idx);
                      }
                    }}
                    style={{
                      '--drag-y': `${categoryDragY}px`
                    } as React.CSSProperties}
                  >
                    {/* Parallax Inner Image Layer */}
                    <div className="category-parallax-img-wrap">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="category-parallax-img"
                        style={{
                          transform: `translateY(${parallaxY}px) scale(1.18)`
                        }}
                        draggable={false}
                      />
                    </div>

                    {/* Gradient Overlay for Pristine Readability */}
                    <div className="category-parallax-overlay" />

                    {/* Card Content Layout */}
                    <div className="category-parallax-content">
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            backgroundColor: 'rgba(255, 255, 255, 0.22)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            padding: '0.4rem 0.95rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(255, 255, 255, 0.45)',
                            color: '#FFFFFF'
                          }}
                        >
                          {cat.slug.replace(/-/g, ' ')}
                        </span>

                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(87, 51, 58, 0.65)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            padding: '0.4rem 0.95rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(220, 165, 175, 0.4)',
                            color: 'rgba(255, 248, 245, 0.98)'
                          }}
                        >
                          {courseCount} Masterclasses
                        </span>
                      </div>

                      {/* Bottom Category Info */}
                      <div>
                        <h3
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            marginBottom: '0.5rem',
                            lineHeight: 1.2,
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                          }}
                        >
                          {cat.name}
                        </h3>

                        <p
                          style={{
                            color: 'rgba(255, 248, 245, 0.92)',
                            fontSize: '1rem',
                            lineHeight: 1.55,
                            marginBottom: '1.2rem',
                            maxWidth: '620px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {cat.description}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 600,
                              color: 'var(--color-rose)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            Explore Masterclasses
                            <ArrowRight size={17} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical Controls & Indicator Track */}
            <div className="category-vcontrols">
              <button
                type="button"
                onClick={handlePrevCategory}
                disabled={activeCategoryIdx === 0}
                className="category-vnav-btn"
                aria-label="Previous Category"
              >
                <ChevronUp size={20} />
              </button>

              <div className="category-vtrack">
                {categoriesList.map((cat, idx) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryIdx(idx)}
                    className={`category-vdot ${idx === activeCategoryIdx ? 'is-active' : ''}`}
                    aria-label={`Jump to category ${cat.name}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextCategory}
                disabled={activeCategoryIdx >= categoriesList.length - 1}
                className="category-vnav-btn"
                aria-label="Next Category"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. MEET THE INSTRUCTOR (Section 5)
          ========================================================================= */}
      <section ref={instructorRef} style={{ padding: '6rem 0', backgroundColor: 'var(--color-blush)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
              gap: '4rem'
            }}
          >
            {/* Instructor Portrait with Clip Reveal */}
            <div className="reveal-on-scroll" style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className="reveal-clip"
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  borderRadius: '240px 240px 20px 20px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  border: '6px solid #FFFFFF'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
                  alt="Chef Camille Laurent"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

            {/* Biography & Philosophy with Staggered Entrance */}
            <div className="reveal-on-scroll stagger-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-berry)',
                    fontWeight: 600
                  }}
                >
                  FOUNDER & HEAD CHEF
                </span>
                <span style={{ width: '30px', height: '1px', backgroundColor: 'var(--color-rose)' }} />
              </div>

              <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '0.5rem' }}>
                Chef Camille Laurent
              </h2>
              <div
                style={{
                  fontSize: '1rem',
                  color: 'var(--color-berry)',
                  fontWeight: 500,
                  marginBottom: '1.5rem',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic'
                }}
              >
                Former Executive Pastry Chef at L’Étoile Paris & Bespoke Wedding Sculptor
              </div>

              <p style={{ color: 'var(--color-plum)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.2rem' }}>
                "In baking, technique creates the canvas, but love and curiosity bring the cake alive. I created
                Cakexperiment to peel away the intimidation of high-end French patisserie and give you actionable,
                repeatable formulas that you can recreate in your own kitchen."
              </p>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                With over fourteen years of decorating multi-tiered celebration cakes for luxury events across Paris and
                London, Camille has mentored thousands of students worldwide to launch their own baking studios or
                elevate their weekend craft.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--color-plum)',
                    fontWeight: 500
                  }}
                >
                  <CheckCircle size={18} color="var(--color-berry)" />
                  14+ Years International Experience
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--color-plum)',
                    fontWeight: 500
                  }}
                >
                  <CheckCircle size={18} color="var(--color-berry)" />
                  Parisian Haute Patisserie Trained
                </div>
              </div>

              <Link to="/about" className="btn btn-primary">
                <span>Learn More About Camille</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. STUDENT TESTIMONIALS — Curved Screen Cinematic Auto-Moving Cards UI
          ========================================================================= */}
      <section id="testimonials" ref={testimonialsRef} className="curved-cinema-section" style={{ scrollMarginTop: '6.5rem' }}>
        {/* Ambient atmospheric glows */}
        <div className="curved-cinema-glow-1" />
        <div className="curved-cinema-glow-2" />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Section Header */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-berry)',
                  fontWeight: 600
                }}
              >
                STUDENT CREATIONS & LOVE
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1rem', color: 'var(--color-plum)' }}>
              Real Stories from Our Bakers
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Discover how passionate home bakers and aspiring studio founders perfected their craft with Cakexperiment.
            </p>
          </div>
        </div>

        {/* 3D Curved Screen Viewport */}
        <div className="curved-cinema-viewport">
          <div className="curved-cinema-rim-top" />
          <div className="curved-cinema-rim-bottom" />

          {/* Continuous Auto-Moving Track (Default 1x, No User Controls) */}
          <div className="curved-cinema-track">
            {duplicatedReviews.map((review, index) => (
              <div
                key={`${review.id}-${index}`}
                className="curved-cinema-card"
              >
                {/* Card Top: Stars + Verified Badge + Quote Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', color: '#FFB800' }}>
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} size={15} fill="#FFB800" color="#FFB800" />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: 'var(--color-berry)',
                        backgroundColor: 'rgba(244, 221, 224, 0.45)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(220, 165, 175, 0.4)'
                      }}
                    >
                      Verified Baker
                    </span>
                  </div>
                  <Quote size={28} color="var(--color-rose)" style={{ opacity: 0.55 }} />
                </div>

                {/* Card Body: Quote */}
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.08rem',
                    color: 'var(--color-plum)',
                    lineHeight: 1.62,
                    fontStyle: 'italic',
                    marginBottom: '1.5rem',
                    flexGrow: 1
                  }}
                >
                  "{review.comment}"
                </p>

                {/* Card Bottom: Student Author & Creation Thumbnail */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    paddingTop: '1.2rem',
                    borderTop: '1px solid rgba(220, 165, 175, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--color-rose)',
                        boxShadow: '0 2px 8px rgba(87, 51, 58, 0.1)'
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1.3 }}>
                        {review.userName}
                      </div>
                      <div
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--color-berry)',
                          fontWeight: 500,
                          marginTop: '0.15rem'
                        }}
                      >
                        {review.courseTitle}
                      </div>
                    </div>
                  </div>

                  {/* Student creation photo preview thumbnail */}
                  {review.studentCreationImg && (
                    <div style={{ position: 'relative' }} title="Student's Baked Creation">
                      <img
                        src={review.studentCreationImg}
                        alt={`${review.userName}'s creation`}
                        className="curved-card-creation-thumb"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. THE LEARNING EXPERIENCE — 4 Simple Steps (Section 7)
          ========================================================================= */}
      <section ref={stepsRef} style={{ padding: '6rem 0', backgroundColor: 'var(--color-cream)' }}>
        <div className="container">
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-berry)',
                  fontWeight: 600
                }}
              >
                FOUR SIMPLE STEPS
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1rem' }}>
              How You Learn with Cakexperiment
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              A modern digital atelier structured to give you effortless progress from enrollment to final slice.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '2rem',
              position: 'relative'
            }}
          >
            {[
              {
                step: 'Step 1',
                title: 'Choose Your Course',
                desc: 'Explore our curated masterclasses from buttercream floristry to chocolate alchemy.'
              },
              {
                step: 'Step 2',
                title: 'Learn Through 4K Video',
                desc: 'Watch step-by-step macro camera angles highlighting nozzle pressure and textures.'
              },
              {
                step: 'Step 3',
                title: 'Practice Every Technique',
                desc: 'Download exact ratio recipe sheets, troubleshooting guides, and practice drills.'
              },
              {
                step: 'Step 4',
                title: 'Create Something Beautiful',
                desc: 'Earn your studio completion diploma and share your breathtaking bakes with the world.'
              }
            ].map((s, idx) => (
              <div
                key={s.step}
                className={`reveal-on-scroll stagger-${idx + 1}`}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 1.5rem',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.3s var(--ease-out-editorial)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blush)',
                    color: 'var(--color-berry)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    margin: '0 auto 1.2rem auto',
                    fontFamily: 'var(--font-display)',
                    border: '2px solid rgba(220,165,175,0.4)'
                  }}
                >
                  {idx + 1}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: 'var(--color-berry)',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    marginBottom: '0.4rem'
                  }}
                >
                  {s.step}
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FAQ SECTION — Smooth Accordion (Section 8)
          ========================================================================= */}
      <section id="faq" ref={faqRef} style={{ padding: '6rem 0', backgroundColor: '#FFFFFF', scrollMarginTop: '6.5rem' }}>
        <div className="container-narrow">
          <div className="reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-berry)',
                  fontWeight: 600
                }}
              >
                QUESTIONS & ANSWERS
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Everything you need to know about our courses, access, and studio support.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className={`reveal-on-scroll stagger-${(idx % 4) + 1}`}
                  style={{
                    backgroundColor: isOpen ? 'var(--color-cream)' : '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'background-color 0.25s ease, border-color 0.25s ease'
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.35rem 1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '1.02rem',
                      fontWeight: 600,
                      color: 'var(--color-plum)',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      color="var(--color-berry)"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.3s var(--ease-out-editorial)',
                        flexShrink: 0
                      }}
                    />
                  </button>

                  {/* Smooth height and opacity expansion */}
                  <div
                    style={{
                      maxHeight: isOpen ? '300px' : '0px',
                      opacity: isOpen ? 1 : 0,
                      overflow: 'hidden',
                      transition:
                        'max-height 0.35s var(--ease-out-editorial), opacity 0.25s var(--ease-out-editorial), padding 0.3s ease',
                      padding: isOpen ? '0 1.6rem 1.4rem 1.6rem' : '0 1.6rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.94rem',
                      lineHeight: 1.65
                    }}
                  >
                    {faq.a}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FINAL CTA — Radial Backdrop & Shimmer (Section 9)
          ========================================================================= */}
      <section
        ref={ctaRef}
        style={{
          padding: '7rem 0',
          backgroundColor: 'var(--color-plum)',
          color: '#FFF8F5',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at center, rgba(169, 87, 104, 0.45) 0%, rgba(87, 51, 58, 0.98) 75%)',
            pointerEvents: 'none'
          }}
        />

        <div className="container-narrow reveal-on-scroll" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(244, 221, 224, 0.15)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1.5rem',
              border: '1px solid rgba(220,165,175,0.3)'
            }}
          >
            <Sparkles size={16} color="var(--color-rose)" />
            <span
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-blush)',
                fontWeight: 600
              }}
            >
              BEGIN YOUR JOURNEY TODAY
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
              color: '#FFF8F5',
              marginBottom: '1.2rem',
              lineHeight: 1.15
            }}
          >
            Your Next Beautiful Creation Starts Here.
          </h2>

          <p
            style={{
              color: 'var(--color-rose)',
              fontSize: '1.15rem',
              lineHeight: 1.7,
              maxWidth: '620px',
              margin: '0 auto 2.5rem auto'
            }}
          >
            Unlock professional baking formulas, master Swiss meringue piping, and learn to craft celebration cakes
            that captivate every room.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <Link
              to="/courses"
              className="btn btn-primary btn-lg"
              style={{
                backgroundColor: 'var(--color-berry)',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
            >
              <span>Explore All Courses ({storageService.getCourses().length})</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/about"
              className="btn btn-outline btn-lg"
              style={{ borderColor: 'var(--color-rose)', color: '#FFF8F5' }}
            >
              Learn About Cakexperiment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
