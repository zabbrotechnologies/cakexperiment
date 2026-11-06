import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
  Video,
  Download,
  GraduationCap,
  FlaskConical,
  Users,
  Sparkle,
  ChefHat,
  Cake
} from 'lucide-react';

export const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth Hash Scroll on mount or hash change (for #about, #courses, #categories, #testimonials, #faq)
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
  const [courses, setCourses] = useState<Course[]>(() =>
    storageService
      .getCourses()
      .filter(c => c.featured || c.status === 'published')
  );

  useEffect(() => {
    fetch('/api/courses')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (Array.isArray(data?.courses) && data.courses.length > 0) {
          setCourses(data.courses.filter((c: any) => c.featured || c.status === 'published'));
        }
      })
      .catch(() => {});
  }, []);
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
  const coursesRef = useScrollReveal();
  const whyLearnRef = useScrollReveal();
  const skillsRef = useScrollReveal();
  const instructorRef = useScrollReveal();
  const categoriesSectionRef = useScrollReveal();
  const stepsRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  // Skills Mindmap Interactive State
  const [hoveredSkillIdx, setHoveredSkillIdx] = useState<number | null>(null);
  const [isCenterHovered, setIsCenterHovered] = useState(false);

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

  // Hero Benefits (Academy Highlights)
  const heroBenefits = [
    { title: 'Beginner to Pro Curriculums', desc: 'Structured video masterclasses with actionable steps', icon: <GraduationCap size={20} /> },
    { title: 'Multi-Angle 4K Video', desc: 'Macro camera zooms on wrist angles & batter sheen', icon: <Play size={20} /> },
    { title: 'Downloadable Recipe Scales', desc: 'Exact gram formulas & pan conversion matrices', icon: <Download size={20} /> },
    { title: 'Lifetime Access & Certificate', desc: 'Learn on your schedule with accredited studio diploma', icon: <Award size={20} /> }
  ];

  // Why Learn With Cakexperiment (The Academy Advantage)
  const whyLearnPillars = [
    {
      number: '01',
      title: 'Scientific Precision & Chemistry',
      description:
        'We demystify the culinary chemistry behind gluten development, fat percentages, emulsion stability, and moisture retention so your sponges never sink, crack, or dry out.',
      icon: <Thermometer size={26} />
    },
    {
      number: '02',
      title: 'Cinematic 4K Macro Instruction',
      description:
        'Multi-angle close-ups reveal the microscopic sheen of whipped meringue, exact wrist angles on the turntable, and featherlight palette knife strokes.',
      icon: <Video size={26} />
    },
    {
      number: '03',
      title: 'Downloadable Recipe Workbooks',
      description:
        'Get exact gram-weight formulation cards, pan-scaling matrices, ingredient replacement tables, and commercial bakery sourcing sheets.',
      icon: <Download size={26} />
    },
    {
      number: '04',
      title: 'Self-Paced Lifetime Studio Access',
      description:
        'Stream lessons 24/7 on desktop, tablet, or mobile. Pause, rewind, and re-watch complex techniques with zero expiration dates or rushed deadlines.',
      icon: <Clock size={26} />
    },
    {
      number: '05',
      title: 'Accredited Studio Certification',
      description:
        'Submit your milestone cake creation to receive an official Cakexperiment Studio Diploma to showcase on your portfolio or bakery resume.',
      icon: <GraduationCap size={26} />
    },
    {
      number: '06',
      title: 'Direct Chef Feedback & Mentorship',
      description:
        'Post your baking queries in dedicated lesson discussions, upload photos of your crumb structure, and receive guidance from master pastry instructors.',
      icon: <ShieldCheck size={26} />
    }
  ];

  // Scalloped Rosette SVG Path for Core Learning Areas center badge
  const scallopRosettePath = useMemo(() => {
    const cx = 108;
    const cy = 108;
    const r = 94;
    const numScallops = 16;
    const depth = 6.5;
    const points: { x: number; y: number }[] = [];
    const total = numScallops * 2;
    for (let i = 0; i < total; i++) {
      const angle = (i * Math.PI) / numScallops - Math.PI / 2;
      const rad = i % 2 === 0 ? r + depth : r - depth;
      points.push({
        x: cx + rad * Math.cos(angle),
        y: cy + rad * Math.sin(angle)
      });
    }
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < total; i++) {
      const curr = points[i];
      const next = points[(i + 1) % total];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
    }
    d += ' Z';
    return d;
  }, []);

  // Wavy Scalloped Distortion Path for the Orbital Ring (matching Image 1 fluted pattern)
  const orbitalScallopPath = useMemo(() => {
    const cx = 275;
    const cy = 275;
    const r = 265;
    const numScallops = 36;
    const depth = 7;
    const points: { x: number; y: number }[] = [];
    const total = numScallops * 2;
    for (let i = 0; i < total; i++) {
      const angle = (i * Math.PI) / numScallops - Math.PI / 2;
      const rad = i % 2 === 0 ? r + depth : r - depth;
      points.push({
        x: cx + rad * Math.cos(angle),
        y: cy + rad * Math.sin(angle)
      });
    }
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < total; i++) {
      const curr = points[i];
      const next = points[(i + 1) % total];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
    }
    d += ' Z';
    return d;
  }, []);

  // 6 Mindmap Curriculum Competencies (Skills & Techniques You'll Master)
  const mindmapSkills = [
    {
      num: '01',
      category: 'BAKING FUNDAMENTALS',
      title: 'Sponge Chemistry & Crumb Science',
      description: 'Master reverse-creaming, emulsion control, and moisture locks for perfectly level, velvety layers.',
      tags: ['Texture', 'Emulsion', 'Moisture'],
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80'
    },
    {
      num: '02',
      category: 'FROSTING PERFECTION',
      title: 'Silky Swiss Meringue & Buttercream Alchemy',
      description: 'The golden ratio of egg whites, sugar, and butter-stable, glossy frostings with sharp edges.',
      tags: ['Swiss Meringue', 'Stability', 'Texture'],
      image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=500&q=80'
    },
    {
      num: '03',
      category: 'MODERN DECORATING',
      title: 'Razor-Sharp Edges & Smoothing Technique',
      description: 'Achieve flawless 90° corners and silky finishes using professional tools.',
      tags: ['Acrylic Discs', 'Side Walls', 'Clean Finish'],
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=500&q=80'
    },
    {
      num: '04',
      category: 'FLORAL MASTERY',
      title: 'Botanical Piping & Palette Knife Artistry',
      description: 'Pipe dimensional florals and create painterly textures with refined control.',
      tags: ['Florals', 'Palette Knife', 'Color Shading'],
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80'
    },
    {
      num: '05',
      category: 'CELEBRATION ENGINEERING',
      title: 'Multi-Tier Structural Architecture',
      description: 'Internal supports, weight distribution, and safe assembly for high-stakes cakes.',
      tags: ['Dowels', 'Tier Stacking', 'Transport'],
      image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=500&q=80'
    },
    {
      num: '06',
      category: 'HAUTE PATISSERIE',
      title: 'Mirror Glazes & Chocolate Tempering',
      description: 'Create high-gloss finishes and architectural chocolate elements.',
      tags: ['Tempering', 'Mirror Glaze', 'Ganache'],
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80'
    }
  ];

  // FAQs Tailored to Online Learning Platform
  const faqs = [
    {
      q: 'How do I access my course after purchasing?',
      a: 'You receive immediate, instant access upon enrollment! Simply log into your Cakexperiment student portal on any desktop computer, tablet, or smartphone to stream HD video lessons and download all accompanying recipe guides.'
    },
    {
      q: 'Do I get lifetime access to the courses?',
      a: 'Yes! All Cakexperiment masterclasses include full lifetime access with zero expiration dates. You can revisit lessons, download updated recipe calculators, and re-watch techniques whenever you need a refresher.'
    },
    {
      q: 'Are the recipes and course materials downloadable?',
      a: 'Absolutely. Every course includes comprehensive, downloadable PDF recipe workbooks, exact gram calculators, pan-size conversion matrices, ingredient substitution guides, and equipment checklists.'
    },
    {
      q: 'I am a complete beginner. Are these courses suitable for me?',
      a: 'Yes, our courses are structured specifically to take you from foundational basics to advanced artistry. We start with fundamental kitchen science and guide you step-by-step through every technique with macro camera angles.'
    },
    {
      q: 'What equipment and ingredients do I need to start?',
      a: 'You do not need expensive commercial bakery equipment. Standard kitchen tools like round 8-inch cake tins, an electric hand or stand mixer, an offset spatula, and common piping tips are sufficient to start. Each course page includes an equipment list.'
    },
    {
      q: 'Can I ask questions if my bake does not turn out right?',
      a: 'Yes! Every lesson has a dedicated student discussion forum where you can ask technique questions, upload photos of your bake, and receive troubleshooting feedback from our pastry instructors.'
    },
    {
      q: 'Do I receive a certificate upon finishing a masterclass?',
      a: 'Yes. Once you complete the curriculum and upload your milestone cake photo, you will be awarded an official verified Cakexperiment Studio Certificate of Completion to showcase your skills.'
    },
    {
      q: 'What is your refund policy?',
      a: 'We offer an unconditional 14-day satisfaction guarantee. If you explore the first module and feel the course is not right for your learning style, simply reach out to our concierge for a full refund.'
    }
  ];

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* =========================================================================
          1. HERO SECTION — Online Cake-Baking Academy Introduction
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
        {/* Editorial Double-Ring Elliptical Badge (Online Masterclasses Branding) */}
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
              <div>Online</div>
              <div>Baking</div>
              <div>Academy</div>
            </div>

            <div style={{ height: '9px' }} />

            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.62rem',
                fontWeight: 500,
                letterSpacing: '0.18em',
                lineHeight: 1.5,
                color: '#FFF2F4',
                textTransform: 'uppercase',
                opacity: 0.95,
                textShadow: '0 1px 3px rgba(87, 51, 58, 0.35)'
              }}
            >
              <div>STRUCTURED</div>
              <div>DIGITAL</div>
              <div>COURSES</div>
            </div>

            <div style={{ marginTop: '6px' }}>
              <ChefHat size={14} color="rgba(244, 205, 212, 0.95)" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Editorial Left Content Area with Coordinated Entrance Sequence */}
          <div style={{ maxWidth: '640px' }}>
            {/* 1. Academy Eyebrow */}
            <div className="section-eyebrow-badge hero-reveal-eyebrow" style={{ marginBottom: '1.2rem' }}>
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">PREMIUM ONLINE CAKE-BAKING ACADEMY</span>
              <span className="section-eyebrow-line" />
            </div>

            {/* 2. Headline with controlled mask reveal */}
            <h1
              className="hero-reveal-title"
              style={{
                fontSize: 'clamp(2.6rem, 5vw, 4.4rem)',
                lineHeight: 1.08,
                color: 'var(--color-plum)',
                marginBottom: '1.2rem',
                fontWeight: 600
              }}
            >
              Master the Art of Cake Baking & Design From Home{' '}
              <span
                style={{
                  fontFamily: 'var(--font-script)',
                  color: 'var(--color-berry)',
                  display: 'block',
                  fontSize: '1.25em',
                  fontWeight: 400,
                  marginTop: '-0.1em'
                }}
              >
                Through Online Masterclasses
              </span>
            </h1>

            {/* 3. Supporting Educational Copy */}
            <p
              className="hero-reveal-subtitle"
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-muted)',
                lineHeight: 1.68,
                maxWidth: '540px',
                marginBottom: '2.5rem'
              }}
            >
              Step inside our digital atelier. Learn exact culinary science, fail-safe sponge formulas, silky Swiss
              meringue buttercream, and bespoke Parisian cake art through structured, on-demand video masterclasses led
              by master pastry chefs.
            </p>

            {/* 4. Action Buttons with Micro-interactions */}
            <div
              className="hero-reveal-buttons"
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.2rem', marginBottom: '3rem' }}
            >
              <Link
                to="/courses"
                className="btn btn-primary btn-lg"
                style={{ boxShadow: '0 8px 24px rgba(169, 87, 104, 0.35)' }}
              >
                <span>Explore All Masterclasses</span>
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
                <span>Watch Academy Trailer</span>
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
                backgroundColor: 'rgba(255, 250, 248, 0.52)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.65)',
                boxShadow: '0 8px 30px rgba(87, 51, 58, 0.04)'
              }}
            >
              {heroBenefits.map((b, idx) => (
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
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-plum)' }}>
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
                <Play size={18} color="var(--color-berry)" />
                Cakexperiment Academy — Masterclass Trailer
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
          2. FEATURED COURSES SECTION — Main Product Prominently Displayed After Hero
          Fixed Center Stage Coverflow Showcase with Educational Information
          ========================================================================= */}
      <section id="courses" ref={coursesRef} style={{ padding: '6.5rem 0', backgroundColor: 'var(--color-cream)', scrollMarginTop: '6.5rem', overflow: 'hidden' }}>
        <div className="container">
          {/* Header Row: Eyebrow + Title on left, "View All Courses" link on right */}
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
              <div className="section-eyebrow-badge">
                <span className="section-eyebrow-line" />
                <span className="section-eyebrow-text">FEATURED ACADEMY MASTERCLASSES</span>
                <span className="section-eyebrow-line" />
              </div>
              <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)' }}>Structured Online Courses for Every Skill Level</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', marginTop: '0.5rem', maxWidth: '640px' }}>
                Explore comprehensive video masterclasses led by master pastry chefs. Each course includes step-by-step 4K video lessons, downloadable recipe workbooks, and lifetime studio access.
              </p>
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
                <span>Browse All {storageService.getCourses().length} Courses</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Stationary Fixed Center Stage Viewport */}
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

                    {/* Bottom Info directly on card: Category, Title, Academic Specs, Price, Action */}
                    <div className="showcase-card-content">
                      <div className="showcase-card-category">
                        {course.categoryName}
                      </div>
                      <h3 className="showcase-card-title">
                        {course.title}
                      </h3>

                      {/* Academic Specs Pill */}
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'rgba(255, 248, 245, 0.92)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginBottom: '0.6rem'
                        }}
                      >
                        <span>{course.moduleCount || 3} Modules</span>
                        <span>•</span>
                        <span>{course.lessonCount || 9} Lessons</span>
                        <span>•</span>
                        <span>{course.totalDuration}</span>
                      </div>

                      <div className="showcase-card-bottom-row">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                          <span className="showcase-card-price">
                            {storageService.formatINR(course.price)}
                          </span>
                          {course.originalPrice && (
                            <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: 'rgba(255,255,255,0.7)' }}>
                              {storageService.formatINR(course.originalPrice)}
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            backgroundColor: 'rgba(169, 87, 104, 0.85)',
                            backdropFilter: 'blur(6px)',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          Enroll &rarr;
                        </span>
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
          3. WHY LEARN WITH CAKEXPERIMENT — A Complete Learning Experience
          (Recreated precisely from the visual design reference)
          ========================================================================= */}
      <section id="why-learn" ref={whyLearnRef} className="experience-section" style={{ scrollMarginTop: '6rem' }}>
        {/* Subtle Organic Background Waves at Base */}
        <div className="experience-waves-bottom">
          <svg viewBox="0 0 1440 110" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <path
              d="M 0 65 C 340 115, 680 20, 1040 75 C 1220 100, 1380 45, 1440 65 L 1440 110 L 0 110 Z"
              fill="rgba(242, 218, 222, 0.42)"
            />
            <path
              d="M 0 80 C 400 35, 740 105, 1120 50 C 1290 25, 1395 70, 1440 55 L 1440 110 L 0 110 Z"
              fill="rgba(235, 204, 209, 0.3)"
            />
          </svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Centered Editorial Header Matching Reference */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4.5rem auto' }}>
            <div className="section-eyebrow-badge" style={{ marginBottom: '1.2rem' }}>
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">WHY LEARN WITH CAKEXPERIMENT ACADEMY</span>
              <span className="section-eyebrow-line" />
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.4rem, 4.4vw, 3.8rem)',
                color: 'var(--color-plum)',
                lineHeight: 1.15,
                marginBottom: '1.2rem',
                fontWeight: 600
              }}
            >
              A Complete Learning Experience{' '}
              <span style={{ display: 'block' }}>
                for Serious{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    color: 'var(--color-berry)',
                    fontWeight: 500
                  }}
                >
                  Cake Artists
                </span>
              </span>
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: '640px', margin: '0 auto' }}>
              More than recipes — a structured, studio-level learning system that builds real skill, confidence, and creative mastery.
            </p>
          </div>

          {/* Three-Column Center Monument & Flanking Feature Cards Stage */}
          <div className="experience-stage">
            {/* Left Column (3 Feature Cards) */}
            <div className="experience-col-left">
              {/* Card 1: Scientific Precision & Chemistry */}
              <div className="experience-card-pill exp-float-1 reveal-on-scroll stagger-1">
                <div className="experience-pill-icon">
                  <FlaskConical size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="experience-pill-title">Scientific Precision & Chemistry</h4>
                  <p className="experience-pill-desc">
                    Understand the science behind flour, fat, emulsion, and moisture for consistently perfect sponges.
                  </p>
                </div>
              </div>

              {/* Card 2: Cinematic 4K Macro Instruction */}
              <div className="experience-card-pill exp-float-2 reveal-on-scroll stagger-2">
                <div className="experience-pill-icon">
                  <Video size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="experience-pill-title">Cinematic 4K Macro Instruction</h4>
                  <p className="experience-pill-desc">
                    Multi-angle close-ups reveal textures, techniques, and professional finishing in stunning detail.
                  </p>
                </div>
              </div>

              {/* Card 3: Self-Paced Lifetime Studio Access */}
              <div className="experience-card-pill exp-float-3 reveal-on-scroll stagger-3">
                <div className="experience-pill-icon">
                  <Clock size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="experience-pill-title">Self-Paced Lifetime Studio Access</h4>
                  <p className="experience-pill-desc">
                    Stream lessons 24/7, pause, rewind, and re-watch with no expiry or rushed deadlines.
                  </p>
                </div>
              </div>
            </div>

            {/* Center Monument: The 3D Pedestal + Arched Certification Portal */}
            <div className="experience-center-monument reveal-on-scroll">
              {/* Dusty Rose Arched Portal */}
              <div className="experience-arch-monument">
                {/* Graduation Cap Icon */}
                <div className="experience-arch-cap" style={{ color: '#FFFFFF', marginBottom: '0.4rem' }}>
                  <GraduationCap size={36} strokeWidth={1.6} />
                </div>

                <h3 className="experience-arch-title">
                  Accredited Studio Certification
                </h3>

                <p className="experience-arch-desc">
                  Submit your milestone cake creation to receive an official Cakexperiment Studio Diploma to showcase on your portfolio or bakery resume.
                </p>

                {/* Ornate Gold & Champagne Ribbon Seal with Laurel Wreath */}
                <div className="experience-arch-seal-wrap" style={{ position: 'relative', width: '100%', height: '118px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 200 130" style={{ width: '190px', height: '124px', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="sealGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FDEEE0" />
                        <stop offset="30%" stopColor="#E8BF96" />
                        <stop offset="68%" stopColor="#D29E6F" />
                        <stop offset="100%" stopColor="#BE8959" />
                      </linearGradient>
                      <linearGradient id="ribbonGradLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#D9A87C" />
                        <stop offset="100%" stopColor="#B9804F" />
                      </linearGradient>
                      <linearGradient id="ribbonGradRight" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#C8976B" />
                        <stop offset="100%" stopColor="#A26B3D" />
                      </linearGradient>
                      <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgba(60,25,32,0.3)" />
                      </filter>
                    </defs>

                    {/* Left Laurel Branch */}
                    <g stroke="rgba(248, 220, 196, 0.9)" fill="rgba(248, 220, 196, 0.85)" strokeWidth="1.2">
                      <path d="M 62 82 C 49 68, 47 45, 57 28" fill="none" stroke="rgba(248, 220, 196, 0.95)" strokeWidth="1.6" />
                      <ellipse cx="49" cy="70" rx="6" ry="3" transform="rotate(-35 49 70)" />
                      <ellipse cx="43" cy="56" rx="6.5" ry="3.2" transform="rotate(-50 43 56)" />
                      <ellipse cx="44" cy="42" rx="6.5" ry="3.2" transform="rotate(-65 44 42)" />
                      <ellipse cx="51" cy="30" rx="6" ry="3" transform="rotate(-75 51 30)" />
                      <ellipse cx="57" cy="24" rx="5" ry="2.6" transform="rotate(-85 57 24)" />
                    </g>

                    {/* Right Laurel Branch */}
                    <g stroke="rgba(248, 220, 196, 0.9)" fill="rgba(248, 220, 196, 0.85)" strokeWidth="1.2">
                      <path d="M 138 82 C 151 68, 153 45, 143 28" fill="none" stroke="rgba(248, 220, 196, 0.95)" strokeWidth="1.6" />
                      <ellipse cx="151" cy="70" rx="6" ry="3" transform="rotate(35 151 70)" />
                      <ellipse cx="157" cy="56" rx="6.5" ry="3.2" transform="rotate(50 157 56)" />
                      <ellipse cx="156" cy="42" rx="6.5" ry="3.2" transform="rotate(65 156 42)" />
                      <ellipse cx="149" cy="30" rx="6" ry="3" transform="rotate(75 149 30)" />
                      <ellipse cx="143" cy="24" rx="5" ry="2.6" transform="rotate(85 143 24)" />
                    </g>

                    {/* Hanging Ribbon Tails */}
                    <polygon points="90,75 80,118 92,110 100,118 94,75" fill="url(#ribbonGradLeft)" filter="url(#sealShadow)" />
                    <polygon points="106,75 100,118 108,110 120,118 110,75" fill="url(#ribbonGradRight)" filter="url(#sealShadow)" />

                    {/* Scalloped Rosette Outer Medallion */}
                    <g filter="url(#sealShadow)">
                      <path
                        d="M 100 24
                           L 105 27 L 112 25 L 115 31 L 122 32 L 123 39 L 130 43 L 129 50 L 134 56 L 130 63 L 133 70 L 127 75 L 127 83 L 120 86 L 117 93 L 110 93 L 105 99 L 98 97 L 92 101 L 88 95 L 81 97 L 78 90 L 72 89 L 71 82 L 65 79 L 67 72 L 63 65 L 67 59 L 64 52 L 70 47 L 70 40 L 77 37 L 80 30 L 87 30 L 91 24 Z"
                        fill="url(#sealGoldGrad)"
                        stroke="#FCE7D2"
                        strokeWidth="1.2"
                      />

                      {/* Inner Raised Ring */}
                      <circle cx="100" cy="62" r="24" fill="#F4D2B2" stroke="#E5B588" strokeWidth="1.5" />
                      <circle cx="100" cy="62" r="21" fill="url(#sealGoldGrad)" />

                      {/* 5-pointed Embossed Star */}
                      <polygon
                        points="100,48 104,57 114,57 106,64 109,74 100,68 91,74 94,64 86,57 96,57"
                        fill="#FFFFFF"
                        opacity="0.95"
                      />
                    </g>
                  </svg>
                </div>
              </div>

              {/* 3D Cylindrical Pedestal Base */}
              <div className="experience-pedestal-wrap">
                <div className="experience-pedestal-top" />
                <div className="experience-pedestal-body" />
              </div>
            </div>

            {/* Right Column (3 Feature Cards) */}
            <div className="experience-col-right">
              {/* Card 1: Downloadable Recipe Workbooks */}
              <div className="experience-card-pill exp-float-2 reveal-on-scroll stagger-1">
                <div className="experience-pill-icon">
                  <Download size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="experience-pill-title">Downloadable Recipe Workbooks</h4>
                  <p className="experience-pill-desc">
                    Get exact gram-weight formulation cards, pan-scaling matrices, and ingredient replacement tables.
                  </p>
                </div>
              </div>

              {/* Card 2: Direct Chef Feedback & Mentorship */}
              <div className="experience-card-pill exp-float-3 reveal-on-scroll stagger-2">
                <div className="experience-pill-icon">
                  <ShieldCheck size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="experience-pill-title">Direct Chef Feedback & Mentorship</h4>
                  <p className="experience-pill-desc">
                    Post your baking queries, share your progress, and receive guidance from master pastry instructors.
                  </p>
                </div>
              </div>

              {/* Card 3: Global Student Community */}
              <div className="experience-card-pill exp-float-1 reveal-on-scroll stagger-3">
                <div className="experience-pill-icon">
                  <Users size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="experience-pill-title">Global Student Community</h4>
                  <p className="experience-pill-desc">
                    Connect with passionate bakers worldwide, share your creations, and gain inspiring peer feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SKILLS AND TECHNIQUES YOU'LL MASTER — Mindmap Curriculum Competencies
          ========================================================================= */}
      <section id="skills" ref={skillsRef} style={{ padding: '6.5rem 0', backgroundColor: 'var(--color-cream)', scrollMarginTop: '6rem' }}>
        <div className="container">
          {/* Header */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem auto' }}>
            <div className="section-eyebrow-badge">
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">CURRICULUM COMPETENCIES</span>
              <span className="section-eyebrow-line" />
            </div>
            <h2 style={{ fontSize: 'clamp(2.3rem, 3.8vw, 3.4rem)', marginBottom: '1rem', lineHeight: 1.2 }}>
              Skills & Techniques You'll{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--color-berry)', fontFamily: 'var(--font-heading)' }}>
                Master
              </span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65 }}>
              Every masterclass is engineered to build practical, repeatable baking and decorating competencies that transform your craft from amateur guesswork into professional artistry.
            </p>
          </div>

          {/* Interactive Mindmap Stage with Circular Orbit */}
          <div className="skills-stage">
            {/* Left Column (Cards 01, 03, 05) */}
            <div className="skills-col-left">
              {/* Card 01 */}
              <div
                className="skills-card-pill skills-card-01 reveal-on-scroll stagger-1"
                onMouseEnter={() => setHoveredSkillIdx(0)}
                onMouseLeave={() => setHoveredSkillIdx(null)}
                style={{
                  opacity: hoveredSkillIdx !== null && hoveredSkillIdx !== 0 ? 0.65 : 1,
                  filter: hoveredSkillIdx !== null && hoveredSkillIdx !== 0 ? 'grayscale(0.12)' : 'none'
                }}
              >
                <div className="skills-card-thumb-wrap">
                  <img
                    src={mindmapSkills[0].image}
                    alt={mindmapSkills[0].title}
                    className="skills-card-thumb"
                    loading="lazy"
                  />
                </div>
                <div className="skills-card-content">
                  <div className="skills-card-header">
                    <span className="skills-card-number">{mindmapSkills[0].num}</span>
                    <span className="skills-card-category">{mindmapSkills[0].category}</span>
                  </div>
                  <h3 className="skills-card-title">{mindmapSkills[0].title}</h3>
                  <p className="skills-card-desc">{mindmapSkills[0].description}</p>
                  <div className="skills-card-tags">
                    {mindmapSkills[0].tags.map(tag => (
                      <span key={tag} className="skills-card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 03 */}
              <div
                className="skills-card-pill skills-card-03 reveal-on-scroll stagger-2"
                onMouseEnter={() => setHoveredSkillIdx(2)}
                onMouseLeave={() => setHoveredSkillIdx(null)}
                style={{
                  opacity: hoveredSkillIdx !== null && hoveredSkillIdx !== 2 ? 0.65 : 1,
                  filter: hoveredSkillIdx !== null && hoveredSkillIdx !== 2 ? 'grayscale(0.12)' : 'none'
                }}
              >
                <div className="skills-card-thumb-wrap">
                  <img
                    src={mindmapSkills[2].image}
                    alt={mindmapSkills[2].title}
                    className="skills-card-thumb"
                    loading="lazy"
                  />
                </div>
                <div className="skills-card-content">
                  <div className="skills-card-header">
                    <span className="skills-card-number">{mindmapSkills[2].num}</span>
                    <span className="skills-card-category">{mindmapSkills[2].category}</span>
                  </div>
                  <h3 className="skills-card-title">{mindmapSkills[2].title}</h3>
                  <p className="skills-card-desc">{mindmapSkills[2].description}</p>
                  <div className="skills-card-tags">
                    {mindmapSkills[2].tags.map(tag => (
                      <span key={tag} className="skills-card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 05 */}
              <div
                className="skills-card-pill skills-card-05 reveal-on-scroll stagger-3"
                onMouseEnter={() => setHoveredSkillIdx(4)}
                onMouseLeave={() => setHoveredSkillIdx(null)}
                style={{
                  opacity: hoveredSkillIdx !== null && hoveredSkillIdx !== 4 ? 0.65 : 1,
                  filter: hoveredSkillIdx !== null && hoveredSkillIdx !== 4 ? 'grayscale(0.12)' : 'none'
                }}
              >
                <div className="skills-card-thumb-wrap">
                  <img
                    src={mindmapSkills[4].image}
                    alt={mindmapSkills[4].title}
                    className="skills-card-thumb"
                    loading="lazy"
                  />
                </div>
                <div className="skills-card-content">
                  <div className="skills-card-header">
                    <span className="skills-card-number">{mindmapSkills[4].num}</span>
                    <span className="skills-card-category">{mindmapSkills[4].category}</span>
                  </div>
                  <h3 className="skills-card-title">{mindmapSkills[4].title}</h3>
                  <p className="skills-card-desc">{mindmapSkills[4].description}</p>
                  <div className="skills-card-tags">
                    {mindmapSkills[4].tags.map(tag => (
                      <span key={tag} className="skills-card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Scalloped Rosette (Core Learning Areas — circular orbit anchor) */}
            <div className="skills-center-wrap reveal-on-scroll">
              <div className="skills-orbital-ring">
                <svg className="skills-orbital-svg" viewBox="0 0 550 550">
                  <path
                    d={orbitalScallopPath}
                    fill="none"
                    stroke={hoveredSkillIdx !== null || isCenterHovered ? "var(--color-berry)" : "rgba(215, 155, 168, 0.58)"}
                    strokeWidth={hoveredSkillIdx !== null || isCenterHovered ? "2.2" : "1.6"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: 'stroke 0.35s ease, stroke-width 0.35s ease, filter 0.35s ease',
                      filter: hoveredSkillIdx !== null || isCenterHovered ? 'drop-shadow(0 0 10px rgba(186, 72, 94, 0.45))' : 'none'
                    }}
                  />
                </svg>
              </div>
              <div
                className="skills-scalloped-badge"
                onMouseEnter={() => setIsCenterHovered(true)}
                onMouseLeave={() => setIsCenterHovered(false)}
              >
                <svg className="skills-scalloped-svg" viewBox="0 0 216 216">
                  <defs>
                    <radialGradient id="rosetteGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="65%" stopColor="#FFF2F5" />
                      <stop offset="100%" stopColor="#FDE3EA" />
                    </radialGradient>
                  </defs>
                  <path
                    d={scallopRosettePath}
                    fill="url(#rosetteGrad)"
                    stroke={isCenterHovered ? "var(--color-berry)" : "rgba(215, 155, 168, 0.65)"}
                    strokeWidth="1.6"
                    style={{ transition: 'stroke 0.35s ease' }}
                  />
                </svg>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.45rem',
                      fontWeight: 600,
                      color: isCenterHovered ? 'var(--color-berry)' : 'var(--color-plum)',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      transition: 'color 0.35s ease'
                    }}
                  >
                    Core<br />Learning<br />Areas
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Cards 02, 04, 06) */}
            <div className="skills-col-right">
              {/* Card 02 */}
              <div
                className="skills-card-pill skills-card-02 reveal-on-scroll stagger-1"
                onMouseEnter={() => setHoveredSkillIdx(1)}
                onMouseLeave={() => setHoveredSkillIdx(null)}
                style={{
                  opacity: hoveredSkillIdx !== null && hoveredSkillIdx !== 1 ? 0.65 : 1,
                  filter: hoveredSkillIdx !== null && hoveredSkillIdx !== 1 ? 'grayscale(0.12)' : 'none'
                }}
              >
                <div className="skills-card-thumb-wrap">
                  <img
                    src={mindmapSkills[1].image}
                    alt={mindmapSkills[1].title}
                    className="skills-card-thumb"
                    loading="lazy"
                  />
                </div>
                <div className="skills-card-content">
                  <div className="skills-card-header">
                    <span className="skills-card-number">{mindmapSkills[1].num}</span>
                    <span className="skills-card-category">{mindmapSkills[1].category}</span>
                  </div>
                  <h3 className="skills-card-title">{mindmapSkills[1].title}</h3>
                  <p className="skills-card-desc">{mindmapSkills[1].description}</p>
                  <div className="skills-card-tags">
                    {mindmapSkills[1].tags.map(tag => (
                      <span key={tag} className="skills-card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 04 */}
              <div
                className="skills-card-pill skills-card-04 reveal-on-scroll stagger-2"
                onMouseEnter={() => setHoveredSkillIdx(3)}
                onMouseLeave={() => setHoveredSkillIdx(null)}
                style={{
                  opacity: hoveredSkillIdx !== null && hoveredSkillIdx !== 3 ? 0.65 : 1,
                  filter: hoveredSkillIdx !== null && hoveredSkillIdx !== 3 ? 'grayscale(0.12)' : 'none'
                }}
              >
                <div className="skills-card-thumb-wrap">
                  <img
                    src={mindmapSkills[3].image}
                    alt={mindmapSkills[3].title}
                    className="skills-card-thumb"
                    loading="lazy"
                  />
                </div>
                <div className="skills-card-content">
                  <div className="skills-card-header">
                    <span className="skills-card-number">{mindmapSkills[3].num}</span>
                    <span className="skills-card-category">{mindmapSkills[3].category}</span>
                  </div>
                  <h3 className="skills-card-title">{mindmapSkills[3].title}</h3>
                  <p className="skills-card-desc">{mindmapSkills[3].description}</p>
                  <div className="skills-card-tags">
                    {mindmapSkills[3].tags.map(tag => (
                      <span key={tag} className="skills-card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 06 */}
              <div
                className="skills-card-pill skills-card-06 reveal-on-scroll stagger-3"
                onMouseEnter={() => setHoveredSkillIdx(5)}
                onMouseLeave={() => setHoveredSkillIdx(null)}
                style={{
                  opacity: hoveredSkillIdx !== null && hoveredSkillIdx !== 5 ? 0.65 : 1,
                  filter: hoveredSkillIdx !== null && hoveredSkillIdx !== 5 ? 'grayscale(0.12)' : 'none'
                }}
              >
                <div className="skills-card-thumb-wrap">
                  <img
                    src={mindmapSkills[5].image}
                    alt={mindmapSkills[5].title}
                    className="skills-card-thumb"
                    loading="lazy"
                  />
                </div>
                <div className="skills-card-content">
                  <div className="skills-card-header">
                    <span className="skills-card-number">{mindmapSkills[5].num}</span>
                    <span className="skills-card-category">{mindmapSkills[5].category}</span>
                  </div>
                  <h3 className="skills-card-title">{mindmapSkills[5].title}</h3>
                  <p className="skills-card-desc">{mindmapSkills[5].description}</p>
                  <div className="skills-card-tags">
                    {mindmapSkills[5].tags.map(tag => (
                      <span key={tag} className="skills-card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Centered Bottom CTA Button */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', marginTop: '3.8rem' }}>
            <Link to="/courses" className="skills-syllabus-btn">
              <span>View Course Syllabus</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. MEET THE FOUNDER — Anisha Arthur (Has #about & #instructor anchors)
          ========================================================================= */}
      <section id="about" ref={instructorRef} className="founder-section">
        {/* Organic Bottom Wave */}
        <div className="founder-wave-bottom" aria-hidden="true">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <path d="M 0,40 C 320,80 680,10 1020,55 C 1220,80 1360,40 1440,50 L 1440,90 L 0,90 Z" fill="rgba(244, 221, 224, 0.38)" />
            <path d="M 0,55 C 380,20 740,75 1100,40 C 1280,20 1390,55 1440,45 L 1440,90 L 0,90 Z" fill="rgba(163, 61, 89, 0.08)" />
          </svg>
        </div>

        <div className="container">
          <div className="founder-grid">
            {/* Left Column: Founder Portrait (Direct Image, No Card) */}
            <div className="founder-portrait-column">
              <div
                className="reveal-on-scroll founder-portrait-wrap"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse at center, #000000 50%, rgba(0, 0, 0, 0.8) 65%, rgba(0, 0, 0, 0.25) 80%, transparent 92%)',
                  maskImage: 'radial-gradient(ellipse at center, #000000 50%, rgba(0, 0, 0, 0.8) 65%, rgba(0, 0, 0, 0.25) 80%, transparent 92%)',
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat'
                }}
              >
                <img
                  src="/images/anisha-founder.jpg"
                  alt="Anisha Arthur - Founder & Cake Artist"
                  className="founder-direct-img"
                  style={{
                    WebkitMaskImage: 'radial-gradient(ellipse at center, #000000 50%, rgba(0, 0, 0, 0.8) 65%, rgba(0, 0, 0, 0.25) 80%, transparent 92%)',
                    maskImage: 'radial-gradient(ellipse at center, #000000 50%, rgba(0, 0, 0, 0.8) 65%, rgba(0, 0, 0, 0.25) 80%, transparent 92%)',
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat'
                  }}
                />
              </div>
            </div>

            {/* Right Column: Founder Introduction */}
            <div className="founder-info-column reveal-on-scroll stagger-2">
              {/* Eyebrow Label with Both-Side Lines */}
              <div className="section-eyebrow-badge">
                <span className="section-eyebrow-line" />
                <span className="section-eyebrow-text">MEET THE FOUNDER</span>
                <span className="section-eyebrow-line" />
              </div>

              {/* Founder Name Heading */}
              <h2 className="founder-name-heading">Anisha Arthur</h2>

              {/* Role Subtitle Badge */}
              <div className="founder-role-badge">
                <Cake size={16} strokeWidth={2} />
                <span>FOUNDER &amp; CAKE ARTIST</span>
              </div>

              {/* Passion Subheading with Burgundy Italic */}
              <div className="founder-subheading">
                A Passion for Baking, <em>A Journey of Creativity</em>
              </div>

              {/* Distinct Quote Box with Vertical Burgundy Accent Line */}
              <div className="founder-quote-box">
                <p className="founder-quote-text">
                  “In baking, technique creates the canvas, but understanding culinary science brings the cake alive. I created Cakexperiment to demystify high-end French patisserie and give you actionable, repeatable formulas that you can recreate in your home kitchen.”
                </p>
              </div>

              {/* Short Passion & Vision Introduction */}
              <p className="founder-intro-text">
                Every creation begins with curiosity, grows with disciplined practice, and becomes truly special when shared with passionate learners. Cakexperiment was born from a vision to turn complex cake architecture into accessible, joyous masterclasses for bakers worldwide.
              </p>

              {/* 4 Achievement Cards in a Balanced 2 × 2 Grid */}
              <div className="founder-cards-grid">
                {/* Card 1: Baking Expertise */}
                <div className="founder-card">
                  <div className="founder-card-icon">
                    <ChefHat size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="founder-card-title">Baking Expertise</h4>
                    <p className="founder-card-desc">Practical baking knowledge</p>
                  </div>
                </div>

                {/* Card 2: Creative Approach */}
                <div className="founder-card">
                  <div className="founder-card-icon">
                    <Palette size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="founder-card-title">Creative Approach</h4>
                    <p className="founder-card-desc">Learning through experimentation</p>
                  </div>
                </div>

                {/* Card 3: Cakexperiment */}
                <div className="founder-card">
                  <div className="founder-card-icon">
                    <Layers size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="founder-card-title">Cakexperiment</h4>
                    <p className="founder-card-desc">A platform to share baking knowledge</p>
                  </div>
                </div>

                {/* Card 4: Student Learning */}
                <div className="founder-card">
                  <div className="founder-card-icon">
                    <BookOpen size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="founder-card-title">Student Learning</h4>
                    <p className="founder-card-desc">Step-by-step learning experience</p>
                  </div>
                </div>
              </div>

              {/* Compact Burgundy CTA Button */}
              <div className="founder-cta-wrap">
                <Link to="/courses" className="founder-cta-btn">
                  <span>Explore Our Courses</span>
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. EXPLORE COURSE CATEGORIES — Vertical Parallax Center-Mode Carousel
          Displayed immediately after Meet the Instructor (#categories)
          ========================================================================= */}
      <section
        id="categories"
        ref={categoriesSectionRef}
        className="category-parallax-section"
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Centered Editorial Header */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem auto' }}>
            <div className="section-eyebrow-badge">
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">ACADEMY DISCIPLINES</span>
              <span className="section-eyebrow-line" />
            </div>

            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '0.85rem' }}>
              Explore Courses by Cake Art Category
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Immerse in specialized cake disciplines curated by our master pastry chefs. Select or scroll any category to explore its full curriculum.
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
                            Explore Curriculum Track
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
          7. HOW THE LEARNING EXPERIENCE WORKS — 4-Step Arched Learning Journey
          ========================================================================= */}
      <section id="how-it-works" ref={stepsRef} style={{ padding: '6.5rem 0', backgroundColor: '#FFFFFF', scrollMarginTop: '6rem', overflow: 'hidden' }}>
        <div className="container">
          {/* Section Header (Image 3) */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem auto' }}>
            <div className="section-eyebrow-badge">
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">THE LEARNING PROCESS</span>
              <span className="section-eyebrow-line" />
            </div>

            <h2 style={{ fontSize: 'clamp(2.3rem, 3.8vw, 3.4rem)', marginBottom: '1.2rem', lineHeight: 1.2 }}>
              How You Learn with{' '}
              <span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic', color: 'var(--color-berry)', fontFamily: 'var(--font-heading)' }}>
                Cakexperiment
                <svg
                  viewBox="0 0 240 16"
                  fill="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '-6px',
                    width: '100%',
                    height: '12px',
                    overflow: 'visible'
                  }}
                >
                  <path
                    d="M 4 8 C 65 14, 160 14, 236 4 C 175 11, 75 12, 4 8 Z"
                    fill="var(--color-berry)"
                    opacity="0.85"
                  />
                </svg>
              </span>
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65 }}>
              A simple, structured learning flow from choosing your course to creating professional cakes with confidence.
            </p>
          </div>

          {/* Arched Convex Fan Showcase (Image 1 Structure & Posing + Image 2 Card Design) */}
          <div className="learning-arc-stage">
            {[
              {
                num: '01',
                title: 'Choose Your Course',
                desc: 'Explore curated masterclasses, from baking basics to advanced cake art.',
                image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
                link: '/courses',
                poseClass: 'learning-card-pose-1'
              },
              {
                num: '02',
                title: 'Learn Through Video',
                desc: 'Watch detailed, step-by-step lessons in high-quality, close-up video.',
                image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=600&q=80',
                link: '/courses',
                poseClass: 'learning-card-pose-2'
              },
              {
                num: '03',
                title: 'Practice & Build Skills',
                desc: 'Use recipe sheets, workbooks, and guided exercises to refine your techniques.',
                image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
                link: '/courses',
                poseClass: 'learning-card-pose-3'
              },
              {
                num: '04',
                title: 'Create with Confidence',
                desc: 'Complete the course, showcase your work, and earn your Cakexperiment certificate.',
                image: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
                link: '/courses',
                poseClass: 'learning-card-pose-4'
              }
            ].map((step, idx) => (
              <Link
                key={step.num}
                to={step.link}
                className={`learning-arc-card ${step.poseClass} reveal-on-scroll stagger-${idx + 1}`}
              >
                {/* Top Image Half */}
                <div className="learning-card-media">
                  <div className="learning-card-badge">{step.num}</div>
                  <img
                    src={step.image}
                    alt={step.title}
                    className="learning-card-img"
                    loading="lazy"
                  />
                  {/* Organic Wave Divider */}
                  <div className="learning-card-wave">
                    <svg viewBox="0 0 100 24" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', fill: '#FFFFFF' }}>
                      <path d="M 0,16 C 30,26 65,4 100,8 L 100,24 L 0,24 Z" />
                    </svg>
                  </div>
                </div>

                {/* Lower Card Content */}
                <div className="learning-card-body">
                  <div className="learning-card-dash" />
                  <h3 className="learning-card-title">{step.title}</h3>
                  <p className="learning-card-desc">{step.desc}</p>
                  <div className="learning-card-arrow-btn">
                    <ArrowRight size={15} strokeWidth={2.2} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. STUDENT TESTIMONIALS — Curved Screen Cinematic Auto-Moving Showcase
          ========================================================================= */}
      <section id="testimonials" ref={testimonialsRef} className="curved-cinema-section" style={{ scrollMarginTop: '6.5rem' }}>
        {/* Ambient atmospheric glows */}
        <div className="curved-cinema-glow-1" />
        <div className="curved-cinema-glow-2" />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {/* Section Header */}
          <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
            <div className="section-eyebrow-badge">
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">STUDENT SUCCESS STORIES</span>
              <span className="section-eyebrow-line" />
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1rem', color: 'var(--color-plum)' }}>
              Transformations from Our Online Bakers
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Discover how home bakers, career switchers, and studio founders transformed their skills with Cakexperiment.
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
                {/* Card Top: Stars + Verified Badge */}
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
                        backgroundColor: 'var(--color-blush)',
                        color: 'var(--color-berry)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <CheckCircle size={11} color="var(--color-berry)" />
                      Verified Student
                    </span>
                  </div>
                </div>

                {/* Course Badge */}
                {review.courseTitle && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--color-berry)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '0.65rem'
                    }}
                  >
                    Enrolled: {review.courseTitle}
                  </div>
                )}

                {/* Review Text */}
                <p
                  style={{
                    color: 'var(--color-plum)',
                    fontSize: '0.94rem',
                    lineHeight: 1.65,
                    marginBottom: '1.5rem',
                    flex: 1
                  }}
                >
                  "{review.comment}"
                </p>

                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-rose)' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                      {review.userName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-light)' }}>
                      Cakexperiment Graduate
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FAQ SECTION — Academy Questions & Answers
          ========================================================================= */}
      <section id="faq" ref={faqRef} style={{ padding: '6.5rem 0', backgroundColor: '#FFFFFF', scrollMarginTop: '6.5rem' }}>
        <div className="container-narrow">
          <div className="reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow-badge">
              <span className="section-eyebrow-line" />
              <span className="section-eyebrow-text">QUESTIONS & ANSWERS</span>
              <span className="section-eyebrow-line" />
            </div>
            <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', marginBottom: '1rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Everything you need to know about our online courses, video streaming, recipe downloads, and studio support.
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
          10. FINAL CTA — Enroll in a Masterclass Today
          ========================================================================= */}
      <section
        id="enroll"
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
            <GraduationCap size={16} color="var(--color-rose)" />
            <span
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-blush)',
                fontWeight: 600
              }}
            >
              ENROLL IN A MASTERCLASS
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
              color: '#FFFFFF',
              marginBottom: '1.2rem',
              lineHeight: 1.15
            }}
          >
            Ready to Master the Art of Professional Cake Baking?
          </h2>

          <p
            style={{
              color: 'rgba(255, 248, 245, 0.88)',
              fontSize: '1.12rem',
              lineHeight: 1.65,
              maxWidth: '560px',
              margin: '0 auto 2.5rem auto'
            }}
          >
            Join thousands of passionate bakers worldwide who have transformed their skills with our online masterclasses. Enroll today and start baking with confidence.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            <Link
              to="/courses"
              className="btn btn-primary btn-lg"
              style={{
                backgroundColor: 'var(--color-rose)',
                borderColor: 'var(--color-rose)',
                color: 'var(--color-plum)',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              <span>Explore All Masterclasses</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/signup"
              className="btn btn-secondary btn-lg"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#FFFFFF',
                backgroundColor: 'rgba(255,255,255,0.08)'
              }}
            >
              <span>Create Student Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
