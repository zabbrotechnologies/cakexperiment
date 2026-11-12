import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { storageService } from '../../services/storage';
import { Category } from '../../types';
import { Plus, Edit, Trash2, X, Search, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { ConfirmActionModal } from '../../components/admin/ConfirmActionModal';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('cakexperiment_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
          storageService.setCategories(data.categories);
          return;
        }
      }
    } catch {
      // Fall back cleanly to local storage cache
    }
    setCategories(storageService.getCategories());
  };

  useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [modalOpen, saving]);

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      id: editingCat?.id,
      name: name.trim(),
      slug: (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description.trim(),
      image: image.trim(),
      status: 'active' as const
    };

    try {
      const url = editingCat
        ? `/api/admin/categories/${encodeURIComponent(editingCat.id)}`
        : '/api/admin/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save course category.');
      }

      if (data.category) {
        storageService.saveCategory(data.category);
      } else {
        storageService.saveCategory(payload);
      }

      await loadCategories();
      setModalOpen(false);
      setSuccessMsg(editingCat ? `Updated "${payload.name}" course category.` : `Added "${payload.name}" course category.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to save course category.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 404) {
        throw new Error(data.error || 'Failed to delete course category.');
      }

      storageService.deleteCategory(deleteTarget.id);
      await loadCategories();
      const deletedTitle = deleteTarget.name;
      const deletedCount = Number(data.deletedCoursesCount ?? 0);
      setDeleteTarget(null);
      setSuccessMsg(
        deletedCount > 0
          ? `Deleted "${deletedTitle}" and ${deletedCount} associated course(s).`
          : `Deleted "${deletedTitle}" course category.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete course category.');
    } finally {
      setDeleting(false);
    }
  };

  const getLocalCourseCount = (cat: Category) => {
    if (typeof cat.courseCount === 'number') return cat.courseCount;
    return storageService.getCourses().filter(c => c.categoryId === cat.id).length;
  };

  const filtered = categories.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
            Course Categories
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage course disciplines, vertical home carousel cards, and automatic course catalog filters
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={18} /> Add Course Category
        </button>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #C8E6C9', fontSize: '0.88rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && !modalOpen && !deleteTarget && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #FFCDD2', fontSize: '0.88rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', maxWidth: '380px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search course categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading course categories from database...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          No course categories found matching "{search}".
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((cat) => {
            const count = getLocalCourseCount(cat);
            return (
              <div
                key={cat.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '140px', position: 'relative' }}>
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                    Slug: {cat.slug}
                  </div>
                </div>

                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--color-plum)', margin: 0 }}>
                      {cat.name}
                    </h3>
                    <span className="badge badge-blush" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BookOpen size={11} /> {count} {count === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.2rem', flex: 1 }}>
                    {cat.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setDeleteTarget(cat);
                      }}
                      className="btn btn-sm"
                      title={`Delete ${cat.name}`}
                      style={{ backgroundColor: 'transparent', color: '#D32F2F', border: '1px solid #FFCDD2' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && createPortal(
        <div
          className="modal-overlay"
          onClick={() => !saving && setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(40, 15, 22, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxHeight: 'calc(100dvh - 40px)',
              overflowY: 'auto',
              margin: 'auto',
              boxShadow: '0 24px 60px rgba(40,15,22,0.22)',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-plum)', margin: 0 }}>
                {editingCat ? 'Edit Course Category' : 'Create Course Category'}
              </h3>
              <button type="button" disabled={saving} onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-plum)" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {errorMsg && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '8px', fontSize: '0.84rem' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Course Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCat) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Save Course Category'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Popup for Course Category + Cascade Course Deletion */}
      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Delete Course Category?"
        itemLabel={deleteTarget ? `"${deleteTarget.name}"` : undefined}
        description={
          deleteTarget ? (
            <>
              Deleting this course category will also permanently delete{' '}
              <strong>
                {getLocalCourseCount(deleteTarget)}{' '}
                {getLocalCourseCount(deleteTarget) === 1 ? 'course' : 'courses'}
              </strong>{' '}
              assigned to it (along with their modules, lessons, and active enrollments) and remove it from the homepage carousel.
            </>
          ) : null
        }
        confirmLabel="Delete Category & Courses"
        isProcessing={deleting}
        errorMessage={deleteTarget ? errorMsg : null}
        onCancel={() => {
          setDeleteTarget(null);
          setErrorMsg(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
