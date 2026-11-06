import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Course, Lesson, Module } from '../../types';
import {
  Play,
  CheckCircle,
  Circle,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Award,
  Lock,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink
} from 'lucide-react';

export const CourseClassroom: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, hasCourseAccess } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'instructor'>('overview');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [isAccessDenied, setIsAccessDenied] = useState<boolean>(false);

  useEffect(() => {
    if (!courseId) return;

    const token = localStorage.getItem('cakexperiment_auth_token');
    fetch(`/api/courses/${courseId}/classroom`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(async (res) => {
        if (res.status === 403) {
          setIsAccessDenied(true);
          return null;
        }
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.course) {
          const raw = data.course;
          const defaultOutcomes = [
            'Master fundamental techniques, precise ingredient ratios, and temperature control',
            'Step-by-step practical atelier execution from preparation to presentation',
            'Professional troubleshooting and bakery kitchen best practices'
          ];
          const formattedCourse: Course = {
            ...raw,
            instructorName: raw.instructorName || raw.instructor_name || 'Chef Camille Laurent',
            instructorBio: raw.instructorBio || raw.instructor_bio || 'Master Pastry Chef & Atelier Instructor',
            instructorAvatar: raw.instructorAvatar || raw.instructor_avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
            learningOutcomes: Array.isArray(raw.learningOutcomes) && raw.learningOutcomes.length > 0
              ? raw.learningOutcomes
              : (Array.isArray(raw.learning_outcomes) && raw.learning_outcomes.length > 0 ? raw.learning_outcomes : defaultOutcomes),
            modules: (raw.modules || []).map((m: any, mIdx: number) => ({
              ...m,
              order: m.order || m.order_num || mIdx + 1,
              lessons: (m.lessons || []).map((l: any, lIdx: number) => ({
                ...l,
                order: l.order || l.order_num || lIdx + 1,
                videoReference: l.videoReference || l.video_reference || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                isPreview: l.isPreview !== undefined ? l.isPreview : Boolean(l.is_preview)
              }))
            }))
          };

          setCourse(formattedCourse);
          const firstMod = formattedCourse.modules?.[0];
          const firstLesson = firstMod?.lessons?.[0];
          if (firstLesson) setActiveLesson(firstLesson);

          const expanded: Record<string, boolean> = {};
          formattedCourse.modules?.forEach((m: any) => { expanded[m.id] = true; });
          setOpenModules(expanded);

          if (data.progress) {
            const completed = data.progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id);
            setCompletedLessonIds(completed);
            const totalLessons = (formattedCourse.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
            if (totalLessons > 0) {
              setProgress(Math.round((completed.length / totalLessons) * 100));
            }
          }
          return;
        }

        // Fallback to local storage if API returned no data
        const loadedCourse = storageService.getCourseById(courseId) || storageService.getCourseBySlug(courseId);
        if (!loadedCourse) {
          navigate('/learn');
          return;
        }

        if (user && !isAdmin && !hasCourseAccess(loadedCourse.id)) {
          setIsAccessDenied(true);
          return;
        }

        setCourse(loadedCourse);
        if (user) {
          const enrollments = storageService.getStudentEnrollments(user.id);
          const enr = enrollments.find(e => e.courseId === loadedCourse.id);
          if (enr) {
            setCompletedLessonIds(enr.completedLessonIds || []);
            setProgress(enr.progress || 0);
          }
        }

        const firstMod = loadedCourse.modules?.[0];
        const firstLesson = firstMod?.lessons?.[0];
        if (firstLesson) setActiveLesson(firstLesson);

        const expanded: Record<string, boolean> = {};
        loadedCourse.modules?.forEach(m => { expanded[m.id] = true; });
        setOpenModules(expanded);
      })
      .catch(() => {
        const loadedCourse = storageService.getCourseById(courseId) || storageService.getCourseBySlug(courseId);
        if (loadedCourse) setCourse(loadedCourse);
      });
  }, [courseId, user, isAdmin, hasCourseAccess, navigate]);

  if (isAccessDenied) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', backgroundColor: '#FFFFFF', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFEBEE', color: '#C62828', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Lock size={30} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>Course Classroom Locked</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Access to this masterclass requires an active enrollment verified by our administrator. If you have submitted a WhatsApp purchase request, access will unlock automatically as soon as payment is confirmed.
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <Link to="/my-purchases" className="btn btn-secondary">
              View My Orders
            </Link>
            <Link to={`/checkout/${courseId}`} className="btn btn-primary">
              Enroll via WhatsApp
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Flatten all lessons for next/prev navigation
  const allLessons: Lesson[] = [];
  course?.modules?.forEach(m => {
    (m.lessons || []).forEach(l => allLessons.push(l));
  });

  if (!course) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading classroom video workspace...</p>
      </div>
    );
  }

  if (allLessons.length === 0 || !activeLesson) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <BookOpen size={48} color="var(--color-berry)" />
        <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', margin: 0 }}>Curriculum Lessons Updating</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '440px', textAlign: 'center', lineHeight: 1.6 }}>
          The studio lessons for this masterclass are being prepared and verified. Please check back shortly!
        </p>
        <Link to="/learn" className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCurrentCompleted = completedLessonIds.includes(activeLesson.id);

  const handleToggleCompletion = async () => {
    if (!user || !activeLesson || !course) return;
    const isCompleted = completedLessonIds.includes(activeLesson.id);
    const newCompleted = !isCompleted;

    const updated = newCompleted
      ? [...completedLessonIds, activeLesson.id]
      : completedLessonIds.filter(id => id !== activeLesson.id);
    setCompletedLessonIds(updated);

    if (allLessons.length > 0) {
      setProgress(Math.min(100, Math.round((updated.length / allLessons.length) * 100)));
    }

    const token = localStorage.getItem('cakexperiment_auth_token');
    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: activeLesson.id,
          completed: newCompleted
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.progress === 'number') {
          setProgress(data.progress);
        }
        if (Array.isArray(data.completedLessons)) {
          setCompletedLessonIds(data.completedLessons);
        }
      }
    } catch {
      // Fallback
    }

    storageService.toggleLessonCompleted(user.id, course.id, activeLesson.id);
  };

  const toggleModule = (modId: string) => {
    setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  return (
    <div style={{ backgroundColor: '#FDF7F5', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* Classroom Top Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/learn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-plum)', fontSize: '0.88rem', fontWeight: 500 }}>
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', fontWeight: 600, margin: 0 }}>
            {course.title}
          </h2>
        </div>

        {/* Course Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--color-blush)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress === 100 ? '#2E7D32' : 'var(--color-berry)', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-plum)' }}>
              {progress}%
            </span>
          </div>

          {progress === 100 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Award size={14} /> Certificate Ready
            </div>
          )}
        </div>
      </div>

      {/* Main Classroom Layout: Player on Left, Modules Sidebar on Right */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }} className="classroom-grid">
          
          {/* Left Column: Video Player & Lesson Body */}
          <div>
            
            {/* HTML5 Video Player Container */}
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                backgroundColor: '#000000',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                paddingTop: '56.25%', // 16:9 ratio
                border: '1px solid var(--border-subtle)'
              }}
            >
              <video
                key={activeLesson.videoReference || (activeLesson as any).video_reference || activeLesson.id}
                controls
                autoPlay
                poster={course.thumbnail || (course as any).image}
                src={activeLesson.videoReference || (activeLesson as any).video_reference || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Lesson Title & Completion Controls */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.8rem', marginTop: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.06em' }}>
                    Active Lesson • {activeLesson.duration}
                  </div>
                  <h1 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', margin: '0.2rem 0' }}>
                    {activeLesson.title}
                  </h1>
                </div>

                {/* Mark as Completed Toggle Button */}
                <button
                  onClick={handleToggleCompletion}
                  className={`btn ${isCurrentCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: isCurrentCompleted ? '#E8F5E9' : undefined,
                    borderColor: isCurrentCompleted ? '#2E7D32' : undefined,
                    color: isCurrentCompleted ? '#2E7D32' : undefined
                  }}
                >
                  {isCurrentCompleted ? (
                    <>
                      <CheckCircle size={18} color="#2E7D32" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle size={18} />
                      Mark Lesson as Complete
                    </>
                  )}
                </button>
              </div>

              {/* Lesson Description */}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.65, marginBottom: '1.8rem' }}>
                {activeLesson.description}
              </p>

              {/* Prev / Next Lesson Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.2rem', borderTop: '1px solid var(--border-subtle)' }}>
                {prevLesson ? (
                  <button
                    onClick={() => setActiveLesson(prevLesson)}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ChevronLeft size={16} /> Previous Lesson
                  </button>
                ) : <div />}

                {nextLesson && (
                  <button
                    onClick={() => setActiveLesson(nextLesson)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    Next Lesson <ChevronRight size={16} />
                  </button>
                )}
              </div>

            </div>

            {/* Tabs: Overview, Resources, Instructor */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.8rem', marginTop: '1.5rem', border: '1px solid var(--border-subtle)' }}>
              
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <button
                  onClick={() => setActiveTab('overview')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: activeTab === 'overview' ? 'var(--color-berry)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    position: 'relative',
                    paddingBottom: '0.4rem'
                  }}
                >
                  Course Guide
                  {activeTab === 'overview' && <span style={{ position: 'absolute', bottom: '-0.8rem', left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-berry)' }} />}
                </button>

                <button
                  onClick={() => setActiveTab('resources')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: activeTab === 'resources' ? 'var(--color-berry)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    position: 'relative',
                    paddingBottom: '0.4rem'
                  }}
                >
                  Downloadable Recipes & Assets ({activeLesson.resources?.length || 1})
                  {activeTab === 'resources' && <span style={{ position: 'absolute', bottom: '-0.8rem', left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-berry)' }} />}
                </button>

                <button
                  onClick={() => setActiveTab('instructor')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: activeTab === 'instructor' ? 'var(--color-berry)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    position: 'relative',
                    paddingBottom: '0.4rem'
                  }}
                >
                  Instructor Q&A
                  {activeTab === 'instructor' && <span style={{ position: 'absolute', bottom: '-0.8rem', left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-berry)' }} />}
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>Mastery Objectives</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                    {(course.learningOutcomes || (course as any).learning_outcomes || [
                      'Master fundamental techniques, precise ingredient ratios, and temperature control',
                      'Step-by-step practical atelier execution from preparation to presentation',
                      'Professional troubleshooting and bakery kitchen best practices'
                    ]).map((o, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={14} color="var(--color-berry)" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'resources' && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Download the printable recipe cards and ratio worksheets to keep by your mixer:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(activeLesson.resources || [
                      { id: 'def-res-1', title: 'Master Recipe Card & Ratio Worksheet (PDF)', type: 'pdf', size: '1.4 MB', url: '#' },
                      { id: 'def-res-2', title: 'Troubleshooting & Temperature Guide', type: 'recipe', size: '820 KB', url: '#' }
                    ]).map((res) => (
                      <div
                        key={res.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.8rem 1.2rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--color-cream)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText size={18} color="var(--color-berry)" />
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-plum)' }}>{res.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{res.size} • Verified Studio Sheet</div>
                          </div>
                        </div>
                        <a
                          href={res.url}
                          download
                          onClick={(e) => { e.preventDefault(); alert(`Simulated downloading: ${res.title}`); }}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instructor' && (
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                  <img
                    src={course.instructorAvatar || (course as any).instructor_avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80'}
                    alt={course.instructorName || (course as any).instructor_name || 'Chef Camille Laurent'}
                    style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-rose)' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--color-plum)', margin: 0 }}>
                      {course.instructorName || (course as any).instructor_name || 'Chef Camille Laurent'}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.4rem 0 0.8rem 0' }}>
                      {course.instructorBio || (course as any).instructor_bio || 'Master Pastry Chef & Atelier Instructor'}
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 500 }}>
                      Have questions about your batter or piping angles? Reach out via studio concierge support.
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Interactive Curriculum Sidebar */}
          <div>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'sticky', top: '100px', boxShadow: 'var(--shadow-sm)' }}>
              
              <div style={{ padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--color-cream)' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', margin: 0 }}>
                  Curriculum Modules
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {completedLessonIds.length} of {allLessons.length} lessons completed
                </div>
              </div>

              {/* Scrollable Modules List */}
              <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
                {course.modules?.map((mod, mIdx) => {
                  const isOpen = !!openModules[mod.id];
                  const modLessons = mod.lessons || [];
                  const modCompletedCount = modLessons.filter(l => completedLessonIds.includes(l.id)).length;

                  return (
                    <div key={mod.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      
                      {/* Module Toggle Header */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          backgroundColor: '#FFFFFF',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600 }}>
                            Module {mIdx + 1}
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-plum)', marginTop: '0.1rem' }}>
                            {mod.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {modCompletedCount}/{modLessons.length} done
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {/* Lesson Items */}
                      {isOpen && (
                        <div style={{ backgroundColor: '#FAF6F4' }}>
                          {modLessons.map((l) => {
                            const isActive = activeLesson.id === l.id;
                            const isDone = completedLessonIds.includes(l.id);

                            return (
                              <button
                                key={l.id}
                                onClick={() => setActiveLesson(l)}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1.2rem',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.75rem',
                                  border: 'none',
                                  borderLeft: isActive ? '3px solid var(--color-berry)' : '3px solid transparent',
                                  backgroundColor: isActive ? 'var(--color-blush)' : 'transparent',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'background-color 0.15s'
                                }}
                              >
                                <div style={{ color: isDone ? '#2E7D32' : (isActive ? 'var(--color-berry)' : 'var(--text-light)'), marginTop: '2px', flexShrink: 0 }}>
                                  {isDone ? <CheckCircle size={15} /> : <Play size={15} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--color-plum)' : 'var(--text-main)', lineHeight: 1.3 }}>
                                    {l.title}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                    {l.duration}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .classroom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
