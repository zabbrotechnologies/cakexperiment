import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Course, Review } from '../../types';
import { CreamFlowNav, TabType } from '../../components/course/CreamFlowNav';
import { CourseReviewForm } from '../../components/course/CourseReviewForm';
import chefAnishaImg from '../../assets/chef-anisha.jpg';
import {
  Star,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  Play,
  Lock,
  ChevronDown,
  ChevronUp,
  Share2,
  Heart,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  ChefHat,
  ArrowRight,
  ThumbsUp,
  SlidersHorizontal,
  FileText,
  Video,
  Download
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, hasCourseAccess } = useAuth();

  const [course, setCourse] = useState<Course | null>(() => storageService.getCourseBySlug(slug || '') || null);
  const [loading, setLoading] = useState<boolean>(!course);
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'UPI'>('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Play Store-style Reviews State
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<'relevant' | 'newest' | 'highest'>('relevant');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, { count: number; voted: boolean }>>({});
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    fetch(`/api/courses/${encodeURIComponent(slug)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (data?.course) {
          setCourse(data.course);
        } else {
          const fallback =
            storageService.getCourseBySlug(slug) ||
            storageService.getCourseById(slug) ||
            null;
          if (fallback) setCourse(fallback);
        }
      })
      .catch(() => {
        if (!active) return;
        const fallback =
          storageService.getCourseBySlug(slug) ||
          storageService.getCourseById(slug) ||
          null;
        if (fallback) setCourse(fallback);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // Handle ESC key and scroll-lock for Reviews Modal
  useEffect(() => {
    if (reviewsModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setReviewsModalOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [reviewsModalOpen]);

  // Load Course Reviews dynamically from database / storage
  const courseReviews: Review[] = useMemo(() => {
    if (!course) return [];
    return storageService.getReviewsForCourse(course.id, course.title);
  }, [course, reviewsVersion]);

  // Initial helpful counts setup
  useEffect(() => {
    if (courseReviews.length > 0) {
      setHelpfulVotes(prev => {
        const next = { ...prev };
        courseReviews.forEach((rev, idx) => {
          if (!next[rev.id]) {
            // Seed a realistic deterministic count based on review index
            const initialHelpful = (idx * 3 + 4) % 18 + 2;
            next[rev.id] = { count: initialHelpful, voted: false };
          }
        });
        return next;
      });
    }
  }, [courseReviews]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (reviewsModalOpen || previewVideoUrl || checkoutModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [reviewsModalOpen, previewVideoUrl, checkoutModalOpen]);

  const previousTabRef = useRef<TabType>('about');

  // Rating Distribution Calculation (Google Play Store Style)
  const ratingStats = useMemo(() => {
    const total = courseReviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    courseReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += r.rating || 5;
    });

    const average = total > 0 ? (sum / total).toFixed(1) : Number(course?.rating || 4.9).toFixed(1);

    return {
      average,
      total,
      distribution
    };
  }, [courseReviews, course]);

  // Filtered & Sorted Reviews for Modal
  const modalReviews = useMemo(() => {
    let list = [...courseReviews];

    if (ratingFilter !== 'all') {
      list = list.filter(r => Math.round(r.rating) === ratingFilter);
    }

    if (reviewSort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    } else if (reviewSort === 'highest') {
      list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else {
      // most relevant: based on helpful votes
      list.sort((a, b) => (helpfulVotes[b.id]?.count || 0) - (helpfulVotes[a.id]?.count || 0));
    }

    return list;
  }, [courseReviews, ratingFilter, reviewSort, helpfulVotes]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading masterclass curriculum...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-plum)' }}>Course Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          The requested masterclass could not be located in our academy catalogue.
        </p>
        <Link to="/courses" className="btn btn-primary">
          Browse All Courses
        </Link>
      </div>
    );
  }

  const isEnrolled = user ? hasCourseAccess(course.id) : false;
  const modules = course.modules || [];
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || Number(course.lessonCount || 6);

  // Dynamic learning outcomes with structured practical focus
  const learningOutcomes: string[] = Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0
    ? course.learningOutcomes
    : (Array.isArray((course as any).learning_outcomes) && (course as any).learning_outcomes.length > 0
        ? (course as any).learning_outcomes
        : [
            'Master professional pastry formulation, precision ingredient weighing, and emulsion stability',
            'Execute fail-safe sponge textures, clean palette knife finishes, and structural doweling',
            'Formulate silky Swiss meringue buttercream and mirror glazes calibrated for room climate',
            'Troubleshoot common baking anomalies, sinking centers, and crystallization challenges'
          ]);

  const prerequisites: string[] = Array.isArray(course.prerequisites) && course.prerequisites.length > 0
    ? course.prerequisites
    : [
        'Basic enthusiasm for baking and standard kitchen oven',
        'Willingness to learn French pastry ratios and precision scales'
      ];

  const equipmentNeeded: string[] = Array.isArray(course.equipmentNeeded) && course.equipmentNeeded.length > 0
    ? course.equipmentNeeded
    : (Array.isArray((course as any).equipment_needed) && (course as any).equipment_needed.length > 0
        ? (course as any).equipment_needed
        : [
            'Standard domestic oven with temperature control',
            'Electric hand mixer or planetary stand mixer',
            'Silicone spatulas and stainless steel mixing bowls',
            'Piping bags and standard open-star / round nozzle kit'
          ]);

  const instructorName = 'Chef Anisha Arthur';
  const instructorAvatar = chefAnishaImg;
  const courseDescription = course.description || course.shortDescription || 'Master professional cake artistry and pastry techniques from home.';
  const totalDuration = course.totalDuration || '2h 30m';

  const toggleModule = (modId: string) => {
    setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      navigate('/signin', { state: { from: { pathname: `/checkout/${course.slug}` } } });
      return;
    }
    if (isEnrolled) {
      navigate(`/learn/${course.id}`);
      return;
    }
    navigate(`/checkout/${course.slug}`);
  };

  const handleSimulatePayment = () => {
    if (!user) return;
    setIsProcessing(true);
    setTimeout(() => {
      storageService.processSimulatedPurchase(user, course, paymentMethod);
      setIsProcessing(false);
      setPurchaseSuccess(true);
    }, 900);
  };

  const handleHelpfulClick = (revId: string) => {
    setHelpfulVotes(prev => {
      const current = prev[revId] || { count: 5, voted: false };
      if (current.voted) return prev;
      return {
        ...prev,
        [revId]: { count: current.count + 1, voted: true }
      };
    });
  };

  const handleNewReviewSubmitted = (_newReview: Review) => {
    setReviewsVersion(v => v + 1);
  };

  const handleReviewDeleted = (_reviewId: string) => {
    setReviewsVersion(v => v + 1);
  };

  const handleTabClick = (tab: TabType) => {
    if (tab !== 'reviews') {
      previousTabRef.current = tab;
    }
    setActiveTab(tab);
    if (tab === 'reviews') {
      reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayedContentTab = activeTab === 'reviews' ? (previousTabRef.current || 'about') : activeTab;

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* =========================================================================
          1. COURSE HERO & PRIMARY ENROLLMENT SECTION
          ========================================================================= */}
      <section className="course-hero-section" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)', paddingTop: '2.5rem', paddingBottom: '6rem', position: 'relative' }}>
        <div className="container">
          
          {/* Breadcrumb Navigation */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/" style={{ color: 'var(--color-berry)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link to="/courses" style={{ color: 'var(--color-berry)', textDecoration: 'none' }}>Courses</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-plum)', fontWeight: 500 }}>{course.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2.75rem', alignItems: 'center' }}>
            
            {/* Left: Course Metadata & Primary Action */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-berry">{course.skillLevel || 'All Levels'}</span>
                <span className="badge badge-blush">{course.categoryName || 'Masterclass'}</span>
                {isEnrolled && (
                  <span className="badge" style={{ backgroundColor: '#2E7D32', color: '#FFF' }}>
                    Enrolled
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)', lineHeight: 1.15, color: 'var(--color-plum)', marginBottom: '1rem', fontWeight: 700 }}>
                {course.title}
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.8rem' }}>
                {course.shortDescription}
              </p>

              {/* Course Meta Quick Info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.4rem', marginBottom: '1.8rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B36B00', fontWeight: 600 }}>
                  <Star size={16} fill="#FFB800" color="#FFB800" />
                  <span>{ratingStats.average}</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>({ratingStats.total} reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-plum)' }}>
                  <Clock size={16} color="var(--color-berry)" />
                  <span>{totalDuration} on-demand video</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-plum)' }}>
                  <BookOpen size={16} color="var(--color-berry)" />
                  <span>{modules.length} Modules • {totalLessons} Lessons</span>
                </div>
              </div>

              {/* Taught By Minimal Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.2rem' }}>
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-rose)' }}
                />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Taught by
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {instructorName}
                  </div>
                </div>
              </div>

              {/* Price & Primary CTA */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Lifetime Course Fee
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                      {storageService.formatINR(course.price)}
                    </span>
                    {course.originalPrice && (
                      <span style={{ fontSize: '1.05rem', textDecoration: 'line-through', color: 'var(--text-light)' }}>
                        {storageService.formatINR(course.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {isEnrolled ? (
                  <Link to={`/learn/${course.id}`} className="btn btn-primary btn-lg" style={{ backgroundColor: '#2E7D32', borderColor: '#2E7D32' }}>
                    Continue Learning &rarr;
                  </Link>
                ) : (
                  <button onClick={handleEnrollClick} className="btn btn-primary btn-lg" style={{ boxShadow: '0 8px 24px rgba(169, 87, 104, 0.35)' }}>
                    Enroll Now for {storageService.formatINR(course.price)} &rarr;
                  </button>
                )}
              </div>

            </div>

            {/* Right: Preview Cover with Play Trigger */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  position: 'relative',
                  border: '6px solid #FFFFFF'
                }}
              >
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={() => setPreviewVideoUrl(course.previewMedia)}
                  aria-label="Play course preview"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(169, 87, 104, 0.92)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    border: '3px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Play size={26} fill="#FFFFFF" style={{ marginLeft: '4px' }} />
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '15px',
                    left: '15px',
                    right: '15px',
                    backgroundColor: 'rgba(87, 51, 58, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#FFF8F5',
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                >
                  <span>Click to watch free curriculum preview</span>
                  <Play size={16} color="var(--color-rose)" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. COURSERA-STYLE 3D FLOATING COURSE HIGHLIGHT INFORMATION BAR
          Four equally distributed columns with 3D elevation, depth shadows & bevel
          ========================================================================= */}
      <div className="container course-highlight-wrapper" style={{ position: 'relative', zIndex: 20, marginTop: '-48px' }}>
        <div
          className="course-highlight-bar"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFE 45%, #FAF5F6 100%)',
            borderRadius: '18px',
            border: '1px solid rgba(87, 51, 58, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.95)',
            borderBottom: '2.5px solid rgba(87, 51, 58, 0.14)',
            boxShadow: '0 24px 48px -10px rgba(87, 51, 58, 0.16), 0 12px 24px -6px rgba(87, 51, 58, 0.10), 0 4px 10px -1px rgba(87, 51, 58, 0.06), inset 0 1px 0 0 #FFFFFF, inset 0 -1px 2px 0 rgba(87, 51, 58, 0.03)',
            padding: '1.5rem 2.2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.25rem',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Column 1: Course Level */}
          <div className="highlight-col" style={{ paddingRight: '1.25rem', borderRight: '1px solid rgba(87, 51, 58, 0.09)', boxShadow: '1px 0 0 0 rgba(255, 255, 255, 0.85)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Course Level
            </div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-plum)' }}>
              {course.skillLevel || 'All Levels'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {(course.skillLevel?.toLowerCase().includes('beginner') || course.skillLevel?.toLowerCase().includes('all'))
                ? 'No prior experience required'
                : 'Foundational pastry skills helpful'}
            </div>
          </div>

          {/* Column 2: Student Rating */}
          <div className="highlight-col" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', borderRight: '1px solid rgba(87, 51, 58, 0.09)', boxShadow: '1px 0 0 0 rgba(255, 255, 255, 0.85)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Student Rating
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-plum)' }}>
              <Star size={16} fill="#C47C8B" color="#C47C8B" />
              <span>{ratingStats.average} / 5</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {ratingStats.total} verified student reviews
            </div>
          </div>

          {/* Column 3: Course Duration */}
          <div className="highlight-col" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', borderRight: '1px solid rgba(87, 51, 58, 0.09)', boxShadow: '1px 0 0 0 rgba(255, 255, 255, 0.85)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Course Duration
            </div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-plum)' }}>
              {totalDuration}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {modules.length} Modules • {totalLessons} Lessons
            </div>
          </div>

          {/* Column 4: Learning Access */}
          <div className="highlight-col" style={{ paddingLeft: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
              Learning Access
            </div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-plum)' }}>
              Lifetime Access
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Self-paced online masterclass
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. CREAM FLOW ACTIVE NAVIGATION BAR
          Minimal, elegant pastry frosting-flow animation
          Only the active item has the white dripping cream silhouette
          ========================================================================= */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <CreamFlowNav
          activeTab={activeTab}
          onTabChange={handleTabClick}
          reviewCount={ratingStats.total}
        />
      </div>

      {/* =========================================================================
          4. SHARED TAB CONTENT AREA (Full Width, No Chef Card Sidebar)
          ========================================================================= */}
      <div className="container" style={{ marginTop: '0.8rem' }}>
        
        {/* TAB 1: ABOUT */}
        {displayedContentTab === 'about' && (
          <div
            className="tab-panel"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h2 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '1.2rem', fontWeight: 600 }}>
              About this Masterclass
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.75, marginBottom: '2.2rem' }}>
              {courseDescription}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
              {/* Prerequisites Column */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} color="var(--color-berry)" />
                  Prerequisites
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-muted)', padding: 0 }}>
                  {prerequisites.map((prereq, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-berry)', fontWeight: 700 }}>•</span>
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Equipment Column */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChefHat size={16} color="var(--color-berry)" />
                  Required Equipment
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-muted)', padding: 0 }}>
                  {equipmentNeeded.map((eq, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-berry)', fontWeight: 700 }}>•</span>
                      <span>{eq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OUTCOMES ("What You'll Master in This Course") */}
        {displayedContentTab === 'outcomes' && (
          <div
            className="tab-panel"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ marginBottom: '1.8rem' }}>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '0.4rem', fontWeight: 600 }}>
                What You'll Master in This Course
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Key culinary competencies, practical pastry skills, and professional techniques acquired upon completion
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.4rem' }}>
              {learningOutcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.9rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--color-cream)',
                    borderRadius: '12px',
                    border: '1px solid rgba(220, 165, 175, 0.3)'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(169, 87, 104, 0.12)',
                      color: 'var(--color-berry)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: '0.93rem', color: 'var(--color-plum)', lineHeight: 1.55, fontWeight: 500 }}>
                    {outcome}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COURSES (HORIZONTAL Curriculum Layout) */}
        {displayedContentTab === 'courses' && (
          <div
            className="tab-panel"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Course Curriculum
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  {modules.length} Modules • {totalLessons} Structured Video Lessons • {totalDuration} Total Duration
                </p>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 600 }}>
                {modules.length} Multi-Angle Masterclass Modules
              </div>
            </div>

            {/* HORIZONTAL Module Presentation Grid */}
            <div
              className="horizontal-curriculum-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}
            >
              {modules.map((mod, mIdx) => {
                const isOpen = !!openModules[mod.id];
                const lessonCount = mod.lessons?.length || 0;

                return (
                  <div
                    key={mod.id}
                    className="module-horizontal-card"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(87, 51, 58, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Module Header Card Content */}
                    <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: 'var(--color-berry)',
                            backgroundColor: 'rgba(169, 87, 104, 0.08)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px'
                          }}
                        >
                          Module {mIdx + 1}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {lessonCount} Lessons
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                        {mod.title}
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, marginBottom: '1.2rem' }}>
                        {mod.description || 'Master step-by-step techniques, precise ratios, and professional tactile finishing.'}
                      </p>

                      {/* Expand / View Lessons Toggle Button */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 1rem',
                          backgroundColor: isOpen ? 'var(--color-plum)' : 'var(--color-cream)',
                          color: isOpen ? '#FFFFFF' : 'var(--color-plum)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{isOpen ? 'Hide Lessons' : `View Lessons (${lessonCount})`}</span>
                        <ChevronDown
                          size={16}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.25s ease'
                          }}
                        />
                      </button>
                    </div>

                    {/* Lessons Drawer When Expanded */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: '#FAF8F7', padding: '0.75rem 1.25rem' }}>
                        {mod.lessons.map(lesson => (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 0',
                              borderBottom: '1px solid rgba(87, 51, 58, 0.06)',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                              <div style={{ color: lesson.isPreview ? 'var(--color-berry)' : 'var(--text-light)', flexShrink: 0 }}>
                                {lesson.isPreview ? <Play size={14} fill="var(--color-berry)" /> : <Lock size={14} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--color-plum)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {lesson.title}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {lesson.duration}
                                </div>
                              </div>
                            </div>

                            <div style={{ flexShrink: 0 }}>
                              {lesson.isPreview ? (
                                <button
                                  onClick={() => setPreviewVideoUrl(lesson.videoReference)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem', borderRadius: '6px' }}
                                >
                                  Preview
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Lock size={11} /> Enrolled
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: INCLUDES ("This Masterclass Includes") */}
        {displayedContentTab === 'includes' && (
          <div
            className="tab-panel"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ marginBottom: '1.8rem' }}>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '0.4rem', fontWeight: 600 }}>
                This Masterclass Includes
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Complete learning toolkit, resource downloads, and accredited studio verification provided with your enrollment
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {[
                {
                  icon: <Play size={20} color="var(--color-berry)" />,
                  title: `${totalDuration} On-Demand Video`,
                  desc: 'Structured high-definition lessons you can pause, rewind, and rewatch anytime'
                },
                {
                  icon: <Download size={20} color="var(--color-berry)" />,
                  title: 'Downloadable Recipe Scales',
                  desc: 'Exact gram formulas, pan size conversion tables, and ingredient matrix PDFs'
                },
                {
                  icon: <Clock size={20} color="var(--color-berry)" />,
                  title: 'Full Lifetime Studio Access',
                  desc: 'Learn on your own schedule with perpetual access across mobile, tablet, and desktop'
                },
                {
                  icon: <Award size={20} color="var(--color-berry)" />,
                  title: 'Certificate of Completion',
                  desc: 'Official accredited Cakexperiment Studio Diploma upon completing your cake milestone'
                },
                {
                  icon: <Video size={20} color="var(--color-berry)" />,
                  title: 'Multi-Angle 4K Macro Footage',
                  desc: 'Close-up camera angles showing exact wrist movements, batter sheen, and petal piping'
                },
                {
                  icon: <ShieldCheck size={20} color="var(--color-berry)" />,
                  title: '14-Day Satisfaction Guarantee',
                  desc: 'Explore Module 1 risk-free with our unconditional satisfaction pledge'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.4rem',
                    backgroundColor: 'var(--color-cream)',
                    borderRadius: '14px',
                    border: '1px solid rgba(220, 165, 175, 0.3)'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(87, 51, 58, 0.05)',
                      flexShrink: 0
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.25rem' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          5. PERMANENT RATINGS & REVIEWS SECTION (Google Play Store-Style)
          Permanently placed below the selectable content area
          ========================================================================= */}
      <div
        id="course-reviews-section"
        ref={reviewsSectionRef}
        className="container"
        style={{ marginTop: '3.5rem', scrollMarginTop: '6rem' }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Ratings and Reviews
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Ratings and reviews from verified students who completed this masterclass
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2E7D32', fontSize: '0.82rem', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              Verified Student Feedback
            </div>
          </div>

          {/* A. Play Store-Style Review Summary Grid */}
          <div
            className="playstore-summary-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 1fr) 2fr',
              gap: '2.5rem',
              alignItems: 'center',
              paddingBottom: '2.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '2rem'
            }}
          >
            {/* Left: Big Score & Stars */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '3.6rem', fontWeight: 700, color: 'var(--color-plum)', lineHeight: 1 }}>
                {ratingStats.average}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '0.6rem 0', color: '#C47C8B' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#C47C8B" color="#C47C8B" strokeWidth={0} />
                ))}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {ratingStats.total} total reviews
              </div>
            </div>

            {/* Right: Horizontal Rating Distribution Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = ratingStats.distribution[stars] || 0;
                const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;

                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.84rem' }}>
                    <div style={{ width: '18px', textAlign: 'right', fontWeight: 600, color: 'var(--color-plum)' }}>
                      {stars}
                    </div>
                    <Star size={12} fill="#C47C8B" color="#C47C8B" strokeWidth={0} />
                    <div
                      style={{
                        flex: 1,
                        height: '9px',
                        backgroundColor: '#F0E6E8',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: 'var(--color-berry)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                    <div style={{ width: '36px', fontSize: '0.78rem', color: 'var(--text-light)', textAlign: 'right' }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave a Comment & Review Division (Enrolled students can write, non-enrolled see enrollment notice) */}
          <div style={{ marginBottom: '2.5rem' }}>
            <CourseReviewForm
              courseId={course.id}
              courseTitle={course.title}
              isEnrolled={isEnrolled}
              user={user}
              coursePrice={course.price}
              onEnrollClick={handleEnrollClick}
              onReviewSubmitted={handleNewReviewSubmitted}
              onReviewDeleted={handleReviewDeleted}
            />
          </div>

          {/* B. Individual Reviews List (First 3–4 items) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {courseReviews.slice(0, 3).map((review, rIdx) => {
              const helpfulData = helpfulVotes[review.id] || { count: 6, voted: false };
              const initialLetter = (review.userName || 'S').charAt(0).toUpperCase();

              return (
                <div
                  key={review.id}
                  style={{
                    paddingTop: rIdx === 0 ? 0 : '1.75rem',
                    paddingBottom: '1.75rem',
                    borderBottom: rIdx === 2 ? 'none' : '1px solid rgba(87, 51, 58, 0.08)'
                  }}
                >
                  {/* User Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-blush)',
                        color: 'var(--color-berry)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.92rem'
                      }}
                    >
                      {initialLetter}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                          {review.userName}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: '#2E7D32',
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
                            padding: '0.1rem 0.42rem',
                            borderRadius: '9999px'
                          }}
                        >
                          <Check size={9} strokeWidth={2.5} />
                          Verified
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                        <div style={{ display: 'flex', gap: '2px', color: '#C47C8B' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < review.rating ? '#C47C8B' : '#E0D0D4'}
                              color={i < review.rating ? '#C47C8B' : '#E0D0D4'}
                              strokeWidth={0}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                          {new Date(review.createdAt || '2026-02-15').toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p style={{ fontSize: '0.92rem', color: '#3A2027', lineHeight: 1.6, margin: '0 0 0.85rem 0' }}>
                    "{review.comment}"
                  </p>

                  {/* Helpful Interaction */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Was this review helpful?</span>
                    <button
                      onClick={() => handleHelpfulClick(review.id)}
                      disabled={helpfulData.voted}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.78rem',
                        color: helpfulData.voted ? '#2E7D32' : 'var(--color-plum)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: helpfulData.voted ? 'default' : 'pointer',
                        backgroundColor: helpfulData.voted ? 'rgba(46, 125, 50, 0.08)' : 'transparent'
                      }}
                    >
                      <ThumbsUp size={12} />
                      <span>Yes ({helpfulData.count})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* C. See All Reviews Action Button */}
          {courseReviews.length > 0 && (
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <button
                onClick={() => setReviewsModalOpen(true)}
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 1.8rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--color-berry)',
                  borderColor: 'var(--color-berry)'
                }}
              >
                See all {ratingStats.total} reviews
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          D. ALL REVIEWS MODAL (Google Play Store-Style App Review Modal)
          Portaled to document.body to ensure true viewport centering
          ========================================================================= */}
      {reviewsModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setReviewsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(87, 51, 58, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
        >
          <div
            className="reviews-playstore-modal"
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            {/* Top Fixed Area (Header + Filter & Sort Bar) with Elevated Downward Shadow Effect */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                boxShadow: '0 8px 24px -4px rgba(87, 51, 58, 0.12), 0 2px 8px -1px rgba(87, 51, 58, 0.06)',
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.4rem 1.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--color-cream)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', margin: 0, fontWeight: 700 }}>
                    Ratings and reviews
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {course.title}
                  </div>
                </div>
                <button
                  onClick={() => setReviewsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    color: 'var(--color-plum)',
                    borderRadius: '50%'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter & Sort Bar */}
              <div
                style={{
                  padding: '0.85rem 1.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {/* Star Filters */}
                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  {(['all', 5, 4, 3] as const).map(f => (
                    <button
                      key={String(f)}
                      onClick={() => setRatingFilter(f)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: ratingFilter === f ? '1px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                        backgroundColor: ratingFilter === f ? 'var(--color-blush)' : '#FFFFFF',
                        color: ratingFilter === f ? 'var(--color-berry)' : 'var(--color-plum)',
                        cursor: 'pointer'
                      }}
                    >
                      {f === 'all' ? 'All ratings' : `${f} ★`}
                    </button>
                  ))}
                </div>

                {/* Sort By Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <SlidersHorizontal size={14} />
                  <select
                    value={reviewSort}
                    onChange={e => setReviewSort(e.target.value as any)}
                    style={{
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--color-plum)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="relevant">Most relevant</option>
                    <option value="newest">Newest first</option>
                    <option value="highest">Highest rating</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Review Scrollable List */}
            <div
              style={{
                padding: '1.5rem 1.75rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              {/* Leave a Comment & Review Division in Modal */}
              <CourseReviewForm
                courseId={course.id}
                courseTitle={course.title}
                isEnrolled={isEnrolled}
                user={user}
                coursePrice={course.price}
                onEnrollClick={() => {
                  setReviewsModalOpen(false);
                  handleEnrollClick();
                }}
                onReviewSubmitted={handleNewReviewSubmitted}
                onReviewDeleted={handleReviewDeleted}
              />

              {modalReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  No reviews match the selected filter.
                </div>
              ) : (
                modalReviews.map(review => {
                  const helpfulData = helpfulVotes[review.id] || { count: 5, voted: false };
                  const initialLetter = (review.userName || 'S').charAt(0).toUpperCase();

                  return (
                    <div
                      key={review.id}
                      style={{
                        paddingBottom: '1.25rem',
                        borderBottom: '1px solid rgba(87, 51, 58, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-blush)',
                            color: 'var(--color-berry)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.88rem'
                          }}
                        >
                          {initialLetter}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                              {review.userName}
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.66rem',
                                fontWeight: 600,
                                color: '#2E7D32',
                                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                                padding: '0.08rem 0.38rem',
                                borderRadius: '9999px'
                              }}
                            >
                              <Check size={8} strokeWidth={2.5} />
                              Verified
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                            <div style={{ display: 'flex', gap: '2px', color: '#C47C8B' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  fill={i < review.rating ? '#C47C8B' : '#E0D0D4'}
                                  color={i < review.rating ? '#C47C8B' : '#E0D0D4'}
                                  strokeWidth={0}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                              {new Date(review.createdAt || '2026-02-15').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: '#3A2027', lineHeight: 1.55, margin: '0 0 0.75rem 0' }}>
                        "{review.comment}"
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>Was this review helpful?</span>
                        <button
                          onClick={() => handleHelpfulClick(review.id)}
                          disabled={helpfulData.voted}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '0.2rem 0.55rem',
                            fontSize: '0.76rem',
                            color: helpfulData.voted ? '#2E7D32' : 'var(--color-plum)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: helpfulData.voted ? 'default' : 'pointer',
                            backgroundColor: helpfulData.voted ? 'rgba(46, 125, 50, 0.08)' : 'transparent'
                          }}
                        >
                          <ThumbsUp size={11} />
                          <span>Yes ({helpfulData.count})</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          VIDEO PREVIEW MODAL
          ========================================================================= */}
      {previewVideoUrl && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={() => setPreviewVideoUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(87, 51, 58, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
        >
          <div className="modal-content" style={{ maxWidth: '820px', width: '100%', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
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
              <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Play size={18} color="var(--color-berry)" />
                Lesson Preview — {course.title}
              </div>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000' }}>
              <video
                controls
                autoPlay
                src={previewVideoUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          SIMULATED CHECKOUT MODAL
          ========================================================================= */}
      {checkoutModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={() => !isProcessing && setCheckoutModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(87, 51, 58, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
        >
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-cream)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="var(--color-berry)" />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', margin: 0 }}>
                  Simulated Course Checkout
                </h3>
              </div>
              {!isProcessing && (
                <button onClick={() => setCheckoutModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} color="var(--color-plum)" />
                </button>
              )}
            </div>

            <div style={{ padding: '2rem' }}>
              {purchaseSuccess ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <Check size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>
                    Enrollment Confirmed!
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                    You now have full lifetime access to <strong>{course.title}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      navigate(`/learn/${course.id}`);
                    }}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                  >
                    Start Learning Now &rarr;
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      Selected Masterclass
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                      {course.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Amount</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                        {storageService.formatINR(course.price)}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.8rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.8rem' }}>
                      Choose Simulated Payment Method
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      {(['Credit Card', 'Debit Card', 'UPI'] as const).map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          style={{
                            padding: '0.8rem 0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: paymentMethod === method ? '2px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                            backgroundColor: paymentMethod === method ? 'var(--color-blush)' : '#FFFFFF',
                            color: 'var(--color-plum)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSimulatePayment}
                    disabled={isProcessing}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', gap: '0.6rem' }}
                  >
                    {isProcessing ? 'Confirming Enrollment...' : `Pay ${storageService.formatINR(course.price)} & Unlock Course`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Responsive & 3D Interactive Styles for Course Highlights and Curriculum Grid */}
      <style>{`
        .course-hero-section {
          padding-bottom: 6rem !important;
        }
        .course-highlight-bar {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .course-highlight-bar:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 30px 60px -10px rgba(87, 51, 58, 0.22), 0 16px 28px -6px rgba(87, 51, 58, 0.14), 0 6px 12px -1px rgba(87, 51, 58, 0.08), inset 0 1px 0 0 #FFFFFF !important;
        }

        @media (max-width: 900px) {
          .course-hero-section {
            padding-bottom: 4.5rem !important;
          }
          .course-highlight-wrapper {
            margin-top: -30px !important;
          }
          .course-highlight-bar {
            grid-template-columns: repeat(2, 1fr) !important;
            padding: 1.25rem 1.5rem !important;
          }
          .highlight-col:nth-child(2) {
            border-right: none !important;
            box-shadow: none !important;
          }
          .highlight-col:nth-child(3) {
            padding-left: 0 !important;
            border-top: 1px solid rgba(87, 51, 58, 0.08);
            box-shadow: 0 -1px 0 0 rgba(255, 255, 255, 0.9) !important;
            padding-top: 1rem;
          }
          .highlight-col:nth-child(4) {
            border-top: 1px solid rgba(87, 51, 58, 0.08);
            box-shadow: 0 -1px 0 0 rgba(255, 255, 255, 0.9) !important;
            padding-top: 1rem;
          }
          .playstore-summary-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }

        @media (max-width: 600px) {
          .course-hero-section {
            padding-bottom: 3.5rem !important;
          }
          .course-highlight-wrapper {
            margin-top: 1.5rem !important;
          }
          .course-highlight-bar {
            grid-template-columns: 1fr !important;
          }
          .highlight-col {
            padding: 0.85rem 0 !important;
            border-right: none !important;
            box-shadow: none !important;
            border-bottom: 1px solid rgba(87, 51, 58, 0.08);
          }
          .highlight-col:last-child {
            border-bottom: none !important;
          }
          .reviews-playstore-modal {
            max-height: 94vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }
      `}</style>

    </div>
  );
};
