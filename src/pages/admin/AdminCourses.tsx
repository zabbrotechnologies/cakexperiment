import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { Course, Category } from '../../types';
import { ConfirmActionModal } from '../../components/admin/ConfirmActionModal';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';

export const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>(() => storageService.getCourses());
  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdminCourses = async () => {
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [coursesRes, catsRes] = await Promise.all([
        fetch('/api/admin/courses', { headers }),
        fetch('/api/admin/categories', { headers })
      ]);
      if (catsRes.ok) {
        const catData = await catsRes.json();
        if (Array.isArray(catData.categories)) {
          setCategories(catData.categories);
          storageService.setCategories(catData.categories);
        }
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        if (data.courses) {
          setCourses(data.courses);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load courses from database, using cached fallback:', e);
    }
  };

  useEffect(() => {
    fetchAdminCourses();
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !(c.categoryName || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedCat !== 'all' && c.categoryId !== selectedCat) {
      return false;
    }
    return true;
  });

  const handleTogglePublish = async (course: Course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: newStatus } : c));
    storageService.saveCourse({ ...course, status: newStatus });

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      await fetch(`/api/admin/courses/${course.id}/publish`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (e) {
      console.error('Error toggling publish in database:', e);
    }
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDeleteCourse = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      setCourses(prev => prev.filter(c => c.id !== deleteTarget.id));
      storageService.deleteCourse(deleteTarget.id);

      const token = localStorage.getItem('cakexperiment_auth_token');
      await fetch(`/api/admin/courses/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDeleteTarget(null);
    } catch (e) {
      console.error('Error deleting course from database:', e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
            Masterclass Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Create, edit, price, and publish cake baking and decorating courses
          </p>
        </div>

        <Link to="/admin/courses/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={18} /> Create New Course
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1.2rem', border: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.6rem 0.6rem 0.6rem 2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{ padding: '0.55rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Course Details</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Curriculum</th>
                <th style={{ padding: '1rem' }}>Fee (INR)</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No masterclasses found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={c.thumbnail} alt={c.title} style={{ width: '56px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{c.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {c.instructorName} • {c.skillLevel}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--color-plum)' }}>
                      <span className="badge badge-blush">{c.categoryName}</span>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div>{c.moduleCount} Modules</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{c.lessonCount} Lessons • {c.totalDuration}</div>
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                      {storageService.formatINR(c.price)}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => handleTogglePublish(c)}
                        className={`badge ${c.status === 'published' ? 'badge-berry' : 'badge-outline'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle publish status"
                      >
                        {c.status === 'published' ? '● Published' : '○ Draft'}
                      </button>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link
                          to={`/courses/${c.slug}`}
                          target="_blank"
                          title="Preview public course detail"
                          style={{ padding: '0.4rem', color: 'var(--color-plum)', borderRadius: '4px' }}
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/admin/courses/${c.id}/edit`}
                          title="Edit course details & curriculum"
                          style={{ padding: '0.4rem', color: 'var(--color-berry)', borderRadius: '4px' }}
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id, c.title)}
                          title="Delete course"
                          style={{ background: 'none', border: 'none', padding: '0.4rem', color: '#D32F2F', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Delete Masterclass Course?"
        itemLabel={deleteTarget ? `"${deleteTarget.title}"` : undefined}
        description="This will permanently delete the course along with its modules, lessons, and student progress records."
        confirmLabel="Delete Course"
        isProcessing={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteCourse}
      />

    </div>
  );
};
