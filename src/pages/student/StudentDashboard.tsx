import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Course, Enrollment } from '../../types';
import {
  BookOpen,
  Play,
  Award,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (user) {
      const studentEnrollments = storageService.getStudentEnrollments(user.id);
      setEnrollments(studentEnrollments);
      setCourses(storageService.getCourses());
    }
  }, [user]);

  const enrolledCourses = courses
    .filter(c => enrollments.some(e => e.courseId === c.id))
    .map(c => {
      const enr = enrollments.find(e => e.courseId === c.id)!;
      return { ...c, enrollment: enr };
    });

  // Calculate stats
  const totalCompletedLessons = enrollments.reduce((acc, e) => acc + (e.completedLessonIds?.length || 0), 0);
  const completedCoursesCount = enrollments.filter(e => e.progress === 100).length;
  const inProgressCourses = enrolledCourses.filter(c => c.enrollment.progress < 100);
  const recentCourse = enrolledCourses[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.6rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Enrolled Courses</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1 }}>
            {enrolledCourses.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-berry)', marginTop: '0.4rem', fontWeight: 500 }}>
            {inProgressCourses.length} in active progress
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.6rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Lessons Completed</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1 }}>
            {totalCompletedLessons}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Practiced step-by-step
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.6rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Diplomas Earned</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1 }}>
            {completedCoursesCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Verified atelier certificate
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.6rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Learning Streak</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1 }}>
            4 Days
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2E7D32', marginTop: '0.4rem', fontWeight: 500 }}>
            Consistent practice streak!
          </div>
        </div>

      </div>

      {/* Continue Learning Banner */}
      {recentCourse && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            alignItems: 'center',
            gap: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img
              src={recentCourse.thumbnail}
              alt={recentCourse.title}
              style={{ width: '120px', height: '90px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, letterSpacing: '0.08em' }}>
                CURRENTLY ACTIVE COURSE
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--color-plum)', margin: '0.3rem 0' }}>
                {recentCourse.title}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                {recentCourse.instructorName} • {recentCourse.totalDuration}
              </div>

              {/* Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', maxWidth: '300px' }}>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-blush)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${recentCourse.enrollment.progress}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-berry)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                  {recentCourse.enrollment.progress}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to={`/learn/${recentCourse.id}`} className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Play size={16} fill="#FFF" /> Resume Lesson
            </Link>
          </div>
        </div>
      )}

      {/* Enrolled Courses Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-plum)' }}>
            My Enrolled Courses ({enrolledCourses.length})
          </h2>
          <Link to="/courses" style={{ fontSize: '0.9rem', color: 'var(--color-berry)', fontWeight: 600 }}>
            Discover More Courses &rarr;
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '3.5rem 2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>No Courses Enrolled Yet</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Browse our course marketplace to enroll in your first cake baking or decorating masterclass.
            </p>
            <Link to="/courses" className="btn btn-primary">
              Explore Available Courses
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {enrolledCourses.map((c) => (
              <div key={c.id} className="cake-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '180px' }}>
                  <img src={c.thumbnail} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {c.enrollment.progress}% Complete
                  </div>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    {c.categoryName}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.8rem', lineHeight: 1.3 }}>
                    <Link to={`/learn/${c.id}`} style={{ color: 'var(--color-plum)' }}>
                      {c.title}
                    </Link>
                  </h3>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '1.2rem', marginTop: 'auto' }}>
                    <div style={{ height: '6px', backgroundColor: 'var(--color-blush)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${c.enrollment.progress}%`,
                          height: '100%',
                          backgroundColor: c.enrollment.progress === 100 ? '#2E7D32' : 'var(--color-berry)',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>
                      <span>{c.enrollment.completedLessonIds?.length || 0} of {c.lessonCount || 6} lessons</span>
                      <span>{c.enrollment.progress}%</span>
                    </div>
                  </div>

                  <Link to={`/learn/${c.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                    {c.enrollment.progress === 100 ? 'Review Masterclass' : 'Continue Learning'} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
