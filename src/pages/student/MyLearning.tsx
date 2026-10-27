import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { BarChart2, Award, CheckCircle, Clock, BookOpen, Download } from 'lucide-react';

export const MyLearning: React.FC = () => {
  const { user } = useAuth();
  const enrollments = user ? storageService.getStudentEnrollments(user.id) : [];
  const courses = storageService.getCourses();

  const totalLessonsDone = enrollments.reduce((acc, e) => acc + (e.completedLessonIds?.length || 0), 0);
  const completedCourses = enrollments
    .filter(e => e.progress === 100)
    .map(e => courses.find(c => c.id === e.courseId))
    .filter(Boolean);

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
        
        {enrollments.length === 0 ? (
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
                {enrollments.map((enr) => {
                  const course = courses.find(c => c.id === enr.courseId);
                  if (!course) return null;
                  return (
                    <tr key={enr.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <img src={course.thumbnail} alt={course.title} style={{ width: '44px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span>{course.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {new Date(enr.purchasedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {enr.completedLessonIds?.length || 0} / {course.lessonCount || 6}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '90px', height: '6px', backgroundColor: 'var(--color-blush)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${enr.progress}%`, height: '100%', backgroundColor: enr.progress === 100 ? '#2E7D32' : 'var(--color-berry)' }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{enr.progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <Link to={`/learn/${course.id}`} className="btn btn-secondary btn-sm">
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
