import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Course, Module, Lesson } from '../../types';
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
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, hasCourseAccess } = useAuth();

  const course = storageService.getCourseBySlug(slug || '');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({ 'mod-1-1': true, 'mod-2-1': true });
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'UPI'>('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  if (!course) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Course Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          The requested course masterclass does not exist or has been relocated.
        </p>
        <Link to="/courses" className="btn btn-primary">
          Browse All Courses
        </Link>
      </div>
    );
  }

  const isEnrolled = user ? hasCourseAccess(course.id) : false;
  const modules = course.modules || [];
  const relatedCourses = storageService.getCourses().filter(c => c.id !== course.id).slice(0, 3);

  const toggleModule = (modId: string) => {
    setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      navigate('/signin', { state: { from: { pathname: `/courses/${course.slug}` } } });
      return;
    }
    if (isEnrolled) {
      navigate(`/learn/${course.id}`);
      return;
    }
    setCheckoutModalOpen(true);
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

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* Hero Header Area (Coursera-Inspired Structure with Luxury Editorial Aesthetic) */}
      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)', paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        <div className="container">
          
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/" style={{ color: 'var(--color-berry)' }}>Home</Link>
            <span>/</span>
            <Link to="/courses" style={{ color: 'var(--color-berry)' }}>Courses</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-plum)', fontWeight: 500 }}>{course.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            
            {/* Left: Course Metadata & Overview */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-berry">{course.skillLevel}</span>
                <span className="badge badge-blush">{course.categoryName}</span>
                {isEnrolled && <span className="badge" style={{ backgroundColor: '#2E7D32', color: '#FFF' }}>Enrolled</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', lineHeight: 1.15, color: 'var(--color-plum)', marginBottom: '1rem' }}>
                {course.title}
              </h1>

              <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', lineHeight: 1.65, marginBottom: '1.8rem' }}>
                {course.shortDescription}
              </p>

              {/* Rating & Stats Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#B36B00', fontWeight: 600 }}>
                  <Star size={16} fill="#FFB800" color="#FFB800" />
                  <span>{course.rating.toFixed(2)}</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>({course.reviewCount} reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-plum)' }}>
                  <Clock size={16} color="var(--color-berry)" />
                  <span>{course.totalDuration} on-demand video</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-plum)' }}>
                  <BookOpen size={16} color="var(--color-berry)" />
                  <span>{course.moduleCount} Modules • {course.lessonCount} Lessons</span>
                </div>
              </div>

              {/* Instructor Capsule */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem' }}>
                <img
                  src={course.instructorAvatar}
                  alt={course.instructorName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-rose)' }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Taught by
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {course.instructorName}
                  </div>
                </div>
              </div>

              {/* Price & Primary CTA */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Lifetime Course Fee
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                      {storageService.formatINR(course.price)}
                    </span>
                    {course.originalPrice && (
                      <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-light)' }}>
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
                  <span>Click to watch free preview</span>
                  <Sparkles size={16} color="var(--color-rose)" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Details Body: Coursera Structured Curriculum & Outcomes */}
      <div className="container" style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
          
          {/* Main Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* What you'll learn */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={20} color="var(--color-berry)" />
                What You'll Master in this Course
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {course.learningOutcomes.map((outcome, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--color-plum)' }}>
                    <CheckCircle size={18} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expandable Course Curriculum (Coursera Inspired) */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>Course Curriculum</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {modules.length} Modules • {course.lessonCount} Structured Lessons • {course.totalDuration} Total Duration
                  </p>
                </div>
              </div>

              {/* Module Accordions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {modules.map((mod, mIdx) => {
                  const isOpen = !!openModules[mod.id];
                  const lessonCount = mod.lessons?.length || 0;
                  return (
                    <div
                      key={mod.id}
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        style={{
                          width: '100%',
                          padding: '1.2rem 1.5rem',
                          backgroundColor: isOpen ? 'var(--color-cream)' : '#FFFFFF',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.08em' }}>
                            Module {mIdx + 1}
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-plum)', marginTop: '0.2rem' }}>
                            {mod.title}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {lessonCount} lessons • {mod.description}
                          </div>
                        </div>
                        <ChevronDown
                          size={20}
                          color="var(--color-plum)"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.3s var(--ease-out-editorial)',
                            flexShrink: 0
                          }}
                        />
                      </button>

                      {/* Lessons List with Smooth Collapse */}
                      <div
                        style={{
                          maxHeight: isOpen ? '600px' : '0px',
                          opacity: isOpen ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 0.4s var(--ease-out-editorial), opacity 0.25s var(--ease-out-editorial)',
                          borderTop: isOpen ? '1px solid var(--border-subtle)' : 'none',
                          backgroundColor: '#FFFFFF'
                        }}
                      >
                        {mod.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem 1.5rem',
                              borderBottom: '1px solid #FAF0F2',
                              gap: '1rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{ color: lesson.isPreview ? 'var(--color-berry)' : 'var(--text-light)' }}>
                                {lesson.isPreview ? <Play size={16} fill="var(--color-berry)" /> : <Lock size={16} />}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--color-plum)' }}>
                                  {lesson.title}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {lesson.duration}
                                </div>
                              </div>
                            </div>

                            <div>
                              {lesson.isPreview ? (
                                <button
                                  onClick={() => setPreviewVideoUrl(lesson.videoReference)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                                >
                                  Preview Lesson
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Lock size={12} /> Requires Enrollment
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive Course Description */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.2rem' }}>About this Masterclass</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {course.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.5rem' }}>Prerequisites</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {course.prerequisites.map((prereq, i) => (
                      <li key={i}>• {prereq}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.5rem' }}>Required Equipment</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {course.equipmentNeeded.map((eq, i) => (
                      <li key={i}>• {eq}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sticky Sidebar Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Instructor Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                <img
                  src={course.instructorAvatar}
                  alt={course.instructorName}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-blush)' }}
                />
                <div>
                  <h4 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', marginBottom: '0.2rem' }}>
                    {course.instructorName}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 500 }}>
                    Instructor & Pastry Chef
                  </div>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                {course.instructorBio}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-plum)', fontWeight: 500 }}>
                <Award size={16} color="var(--color-berry)" />
                Certified Master Pastry Educator
              </div>
            </div>

            {/* Course Inclusions Summary */}
            <div style={{ backgroundColor: 'var(--color-blush)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid rgba(220, 165, 175, 0.4)' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', marginBottom: '1.2rem' }}>
                This Masterclass Includes:
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--color-plum)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Play size={16} color="var(--color-berry)" /> {course.totalDuration} On-Demand 4K Video Lessons
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BookOpen size={16} color="var(--color-berry)" /> Downloadable Recipe Scales & Templates
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Clock size={16} color="var(--color-berry)" /> Full Lifetime Studio Access
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Award size={16} color="var(--color-berry)" /> Official Certificate of Completion
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={16} color="var(--color-berry)" /> 14-Day Money Back Guarantee
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="modal-overlay" onClick={() => setPreviewVideoUrl(null)}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--color-cream)' }}>
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
        </div>
      )}

      {/* Simulated Checkout Modal */}
      {checkoutModalOpen && (
        <div className="modal-overlay" onClick={() => !isProcessing && setCheckoutModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--color-berry)" />
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
                    You now have full lifetime access to <strong>{course.title}</strong>. A receipt has been added to your student purchase records.
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
                  {/* Order Summary */}
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

                  {/* Payment Method Selector */}
                  <div style={{ marginBottom: '1.8rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.8rem' }}>
                      Choose Simulated Payment Method
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      {(['Credit Card', 'Debit Card', 'UPI'] as const).map((method) => (
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

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Note: This is a frontend demo checkout. No real money will be charged.
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
        </div>
      )}

    </div>
  );
};
