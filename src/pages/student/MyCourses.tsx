import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { BookOpen, Play, Clock, Sparkles } from 'lucide-react';

export const MyCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMyCourses = async () => {
      try {
        const token = localStorage.getItem('cakexperiment_auth_token');
        const res = await fetch('/api/user/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const data = await res.json();
          if (data.courses) {
            setCourses(data.courses);
            return;
          }
        }
      } catch {
        // Fallback
      }

      // Fallback: local storage
      const enrollments = storageService.getStudentEnrollments(user.id);
      const allCourses = storageService.getCourses();
      const enrolledCourses = allCourses
        .filter(c => enrollments.some(e => e.courseId === c.id))
        .map(c => {
          const enr = enrollments.find(e => e.courseId === c.id)!;
          return {
            ...c,
            course_id: c.id,
            progress: enr.progress || 0,
            completed_lessons: enr.completedLessonIds || []
          };
        });
      setCourses(enrolledCourses);
    };

    fetchMyCourses().finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)' }}>My Enrolled Masterclasses</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            All your purchased lifetime courses and practice tracks
          </p>
        </div>
        <Link to="/courses" className="btn btn-secondary btn-sm">
          Browse Marketplace &rarr;
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading your enrolled courses from database...</p>
        </div>
      ) : courses.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <BookOpen size={26} />
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>No Courses Enrolled Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            You haven't enrolled in any baking masterclasses yet. Explore our courses to start learning.
          </p>
          <Link to="/courses" className="btn btn-primary">
            Explore Courses
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {courses.map((c) => {
            const courseId = c.course_id || c.id;
            const progress = c.progress || 0;
            const thumbnail = c.thumbnail || c.image || '/images/hero-cake.png';

            return (
              <div key={courseId} className="cake-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '200px' }}>
                  <img src={thumbnail} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '0.25rem 0.7rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {progress}% Finished
                  </div>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    {c.tag || c.category_name || 'Masterclass'}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.8rem', lineHeight: 1.3 }}>
                    <Link to={`/learn/${courseId}`} style={{ color: 'var(--color-plum)' }}>
                      {c.title}
                    </Link>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.2rem', flex: 1 }}>
                    {c.short_description || c.description || 'Master pastry art with this comprehensive studio masterclass.'}
                  </p>

                  {/* Progress */}
                  <div style={{ marginBottom: '1.2rem' }}>
                    <div style={{ height: '6px', backgroundColor: 'var(--color-blush)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: progress === 100 ? '#2E7D32' : 'var(--color-berry)',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>
                      <span>{c.completed_lessons?.length || 0} lessons completed</span>
                      <span>{progress}%</span>
                    </div>
                  </div>

                  <Link to={`/learn/${courseId}`} className="btn btn-primary" style={{ width: '100%' }}>
                    <Play size={15} fill="#FFF" /> Resume Lesson
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MyCourses;
