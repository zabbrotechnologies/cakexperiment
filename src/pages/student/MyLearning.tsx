import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { BarChart2, Award, CheckCircle, Clock, BookOpen, Download } from 'lucide-react';

export const MyLearning: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchLearningData = async () => {
      try {
        const token = localStorage.getItem('cakexperiment_auth_token');
        const res = await fetch('/api/user/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.courses) && data.courses.length > 0) {
            const mapped = data.courses.map((c: any) => ({
              id: c.course_id || c.id,
              title: c.title,
              thumbnail: c.thumbnail || c.image || '/images/hero-cake.png',
              categoryName: c.tag || 'Masterclass',
              instructorName: c.instructor_name || 'Chef Camille Laurent',
              totalDuration: c.total_duration || '2h 30m',
              lessonCount: c.lessons_count || 6,
              activatedAt: c.activated_at,
              progress: Number(c.progress) || 0,
              completedLessonIds: Array.isArray(c.completed_lessons) ? c.completed_lessons : []
            }));
            setCourses(mapped);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load user courses for learning page:', err);
      }

      // Fallback
      const enrollments = storageService.getStudentEnrollments(user.id);
      const allCourses = storageService.getCourses();
      const fallbackList = allCourses
        .filter(c => enrollments.some(e => e.courseId === c.id))
        .map(c => {
          const enr = enrollments.find(e => e.courseId === c.id)!;
          return {
            ...c,
            activatedAt: enr.purchasedAt || enr.activatedAt,
            progress: enr.progress || 0,
            completedLessonIds: enr.completedLessonIds || []
          };
        });
      setCourses(fallbackList);
    };

    fetchLearningData();
  }, [user]);

  const totalLessonsDone = courses.reduce((acc, c) => acc + (c.completedLessonIds?.length || 0), 0);
  const completedCourses = courses.filter(c => c.progress === 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)' }}>Learning Progress & Achievements</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Detailed record of completed modules, practice milestones, and awarded certificates
        </p>
      </div>

      {/* Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-plum)' }}>{totalLessonsDone}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Lessons Practiced</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Each completed lesson counts toward your overall Cakexperiment studio mastery badge.
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-plum)' }}>{completedCourses.length}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Certified Masterclasses</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Official Cakexperiment diplomas generated upon 100% course curriculum completion.
          </p>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '1.5rem' }}>
          Course Progress Breakdown
        </h3>
        
        {courses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No courses enrolled yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.8rem 1rem' }}>Masterclass</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Enrolled Date</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Completed Lessons</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Overall Progress</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <img src={c.thumbnail} alt={c.title} style={{ width: '44px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span>{c.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {c.activatedAt ? new Date(c.activatedAt).toLocaleDateString() : 'Active'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {c.completedLessonIds?.length || 0} / {c.lessonCount || 6}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '90px', height: '6px', backgroundColor: 'var(--color-blush)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${c.progress}%`, height: '100%', backgroundColor: c.progress === 100 ? '#2E7D32' : 'var(--color-berry)' }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <Link to={`/learn/${c.id}`} className="btn btn-secondary btn-sm">
                          Continue
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
