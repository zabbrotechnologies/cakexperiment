import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { Course, Module, Lesson, SkillLevel, Category } from '../../types';
import { ConfirmActionModal } from '../../components/admin/ConfirmActionModal';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Play,
  Layers,
  CheckCircle
} from 'lucide-react';

export const AdminCourseEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [pendingRemoval, setPendingRemoval] = useState<{
    type: 'module' | 'lesson';
    modId: string;
    lessonId?: string;
    label: string;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('/images/hero-cake.png');
  const [previewMedia, setPreviewMedia] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('All Levels');
  const [price, setPrice] = useState<number>(499); // CRITICAL: defaults to ₹499
  const [originalPrice, setOriginalPrice] = useState<number>(1499);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [featured, setFeatured] = useState(false);
  const [totalDuration, setTotalDuration] = useState('2h 30m');
  const [modules, setModules] = useState<Module[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (Array.isArray(data?.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          storageService.setCategories(data.categories);
        }
      })
      .catch(() => {});

    if (id) {
      fetch(`/api/courses/${id}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          const existing = data?.course || storageService.getCourseById(id);
          if (existing) {
            setTitle(existing.title || '');
            setSlug(existing.slug || '');
            setShortDescription(existing.shortDescription || existing.short_description || '');
            setDescription(existing.description || '');
            setThumbnail(existing.thumbnail || '/images/hero-cake.png');
            setPreviewMedia(existing.previewMedia || existing.preview_media || '');
            setCategoryId(existing.categoryId || existing.category_id || categories[0]?.id || 'cat-1');
            setSkillLevel(existing.skillLevel || existing.skill_level || 'All Levels');
            setPrice(Number(existing.price) || 499);
            setOriginalPrice(Number(existing.originalPrice || existing.original_price) || 1499);
            setStatus(existing.status === 'published' ? 'published' : 'draft');
            setFeatured(Boolean(existing.featured));
            setTotalDuration(existing.totalDuration || existing.total_duration || '2h 30m');
            setModules(existing.modules || []);
          }
        })
        .catch(() => {
          const existing = storageService.getCourseById(id);
          if (existing) {
            setTitle(existing.title);
            setSlug(existing.slug);
            setShortDescription(existing.shortDescription);
            setDescription(existing.description);
            setThumbnail(existing.thumbnail);
            setPreviewMedia(existing.previewMedia);
            setCategoryId(existing.categoryId);
            setSkillLevel(existing.skillLevel);
            setPrice(existing.price);
            setOriginalPrice(existing.originalPrice || 1499);
            setStatus(existing.status === 'published' ? 'published' : 'draft');
            setFeatured(existing.featured);
            setTotalDuration(existing.totalDuration);
            setModules(existing.modules || []);
          }
        });
    } else {
      // Default initial module for new course
      setModules([
        {
          id: `mod-${Date.now()}-1`,
          courseId: 'new',
          title: 'Module 1: Foundations & Preparation',
          description: 'Essential equipment, base prep and recipe chemistry.',
          order: 1,
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              moduleId: `mod-${Date.now()}-1`,
              title: 'Lesson 1: Introduction and Mise en Place',
              description: 'Setting up your workstation and balancing ingredients.',
              videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              duration: '15:00',
              isPreview: true,
              status: 'published',
              order: 1
            }
          ]
        }
      ]);
    }
  }, [id]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleAddModule = () => {
    const newMod: Module = {
      id: `mod-${Date.now()}`,
      courseId: id || 'new',
      title: `Module ${modules.length + 1}: Advanced Finishing`,
      description: 'Technique drills and composition finishing.',
      order: modules.length + 1,
      lessons: [
        {
          id: `les-${Date.now()}`,
          moduleId: `mod-${Date.now()}`,
          title: 'Lesson 1: Essential Method',
          description: 'Hands-on practice instructions.',
          videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          duration: '14:20',
          isPreview: false,
          status: 'published',
          order: 1
        }
      ]
    };
    setModules([...modules, newMod]);
  };

  const handleRemoveModule = (modId: string) => {
    const target = modules.find(m => m.id === modId);
    setPendingRemoval({
      type: 'module',
      modId,
      label: target?.title || 'this module'
    });
  };

  const handleAddLesson = (modId: string) => {
    setModules(modules.map(m => {
      if (m.id !== modId) return m;
      const newLesson: Lesson = {
        id: `les-${Date.now()}`,
        moduleId: modId,
        title: `Lesson ${m.lessons.length + 1}: Technique Drill`,
        description: 'Step-by-step guidance.',
        videoReference: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '12:00',
        isPreview: false,
        status: 'published',
        order: m.lessons.length + 1
      };
      return { ...m, lessons: [...m.lessons, newLesson] };
    }));
  };

  const handleRemoveLesson = (modId: string, lessonId: string) => {
    const mod = modules.find(m => m.id === modId);
    const les = mod?.lessons.find(l => l.id === lessonId);
    setPendingRemoval({
      type: 'lesson',
      modId,
      lessonId,
      label: les?.title || 'this lesson'
    });
  };

  const confirmCurriculumRemoval = () => {
    if (!pendingRemoval) return;
    if (pendingRemoval.type === 'module') {
      setModules(modules.filter(m => m.id !== pendingRemoval.modId));
    } else if (pendingRemoval.lessonId) {
      setModules(
        modules.map(m =>
          m.id === pendingRemoval.modId
            ? { ...m, lessons: m.lessons.filter(l => l.id !== pendingRemoval.lessonId) }
            : m
        )
      );
    }
    setPendingRemoval(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const selectedCategoryObj = categories.find(c => c.id === categoryId);

    const courseData: Partial<Course> & { title: string } = {
      id: id || undefined,
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      shortDescription,
      description,
      thumbnail,
      previewMedia,
      categoryId,
      categoryName: selectedCategoryObj?.name || 'Cake Baking',
      skillLevel,
      price: Number(price) || 499,
      originalPrice: Number(originalPrice) || 1499,
      status,
      featured,
      totalDuration,
      modules
    };

    // Immediate local cache
    storageService.saveCourse(courseData);

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const url = id ? `/api/admin/courses/${id}` : '/api/admin/courses';
      const method = id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(courseData)
      });
    } catch (err) {
      console.error('Failed to sync course to Neon database:', err);
    } finally {
      setIsSaving(false);
      navigate('/admin/courses');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Link to="/admin/courses" style={{ color: 'var(--color-plum)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <ArrowLeft size={18} /> Back to Courses
          </Link>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', fontWeight: 600, margin: 0 }}>
            {isNew ? 'Create New Masterclass' : `Edit: ${title}`}
          </h1>
        </div>

        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Save size={16} /> Save Masterclass
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Core Metadata Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-plum)', marginBottom: '1.2rem' }}>
            Course Overview & Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Course Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Modern Floral Palette Masterclass"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                URL Slug *
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
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-field"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="input-field"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Course Fee (INR) * <span style={{ color: 'var(--color-berry)', fontWeight: 400 }}>(Default ₹499)</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Original Price (INR)
              </label>
              <input
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="input-field"
              />
            </div>

          </div>

          <div style={{ marginTop: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              Short Teaser Description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-line summary for course cards"
              className="input-field"
            />
          </div>

          <div style={{ marginTop: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
              Full Syllabus Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Thumbnail Image URL
              </label>
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                Preview Video URL
              </label>
              <input
                type="text"
                value={previewMedia}
                onChange={(e) => setPreviewMedia(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={status === 'published'}
                onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                style={{ accentColor: 'var(--color-berry)', width: '16px', height: '16px' }}
              />
              <span>Published on Website</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                style={{ accentColor: 'var(--color-berry)', width: '16px', height: '16px' }}
              />
              <span>Feature on Homepage</span>
            </label>
          </div>

        </div>

        {/* Curriculum Builder Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', margin: 0 }}>
                Structured Curriculum Builder
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Organize learning modules and assign video lessons
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddModule}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Add Module
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {modules.map((mod, mIdx) => (
              <div
                key={mod.id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  backgroundColor: 'var(--color-cream)'
                }}
              >
                {/* Module Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="var(--color-berry)" />
                    <span>Module {mIdx + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveModule(mod.id)}
                    style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={14} /> Remove Module
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => {
                      const updated = [...modules];
                      updated[mIdx].title = e.target.value;
                      setModules(updated);
                    }}
                    placeholder="Module Title"
                    className="input-field"
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                  <input
                    type="text"
                    value={mod.description}
                    onChange={(e) => {
                      const updated = [...modules];
                      updated[mIdx].description = e.target.value;
                      setModules(updated);
                    }}
                    placeholder="Module Short Summary"
                    className="input-field"
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                </div>

                {/* Lessons in Module */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-plum)', textTransform: 'uppercase' }}>
                      Lessons in Module ({mod.lessons?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-berry)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Plus size={14} /> Add Lesson
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {mod.lessons?.map((les, lIdx) => (
                      <div
                        key={les.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-cream)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Play size={14} color="var(--color-berry)" />
                        <input
                          type="text"
                          value={les.title}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[mIdx].lessons[lIdx].title = e.target.value;
                            setModules(updated);
                          }}
                          className="input-field"
                          style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.85rem', backgroundColor: '#FFF' }}
                        />
                        <input
                          type="text"
                          value={les.duration}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[mIdx].lessons[lIdx].duration = e.target.value;
                            setModules(updated);
                          }}
                          placeholder="15:00"
                          className="input-field"
                          style={{ width: '80px', padding: '0.35rem 0.6rem', fontSize: '0.85rem', backgroundColor: '#FFF' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-plum)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={les.isPreview}
                            onChange={(e) => {
                              const updated = [...modules];
                              updated[mIdx].lessons[lIdx].isPreview = e.target.checked;
                              setModules(updated);
                            }}
                            style={{ accentColor: 'var(--color-berry)' }}
                          />
                          Preview
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveLesson(mod.id, les.id)}
                          style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Bottom Save Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/admin/courses" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Save Masterclass & Publish Updates
          </button>
        </div>

      </form>

      <ConfirmActionModal
        open={Boolean(pendingRemoval)}
        title={pendingRemoval?.type === 'module' ? 'Remove Course Module?' : 'Remove Course Lesson?'}
        itemLabel={pendingRemoval ? `"${pendingRemoval.label}"` : undefined}
        description={
          pendingRemoval?.type === 'module'
            ? 'This will remove the module and all lessons inside it from this course curriculum.'
            : 'This will remove the lesson from this module.'
        }
        confirmLabel={pendingRemoval?.type === 'module' ? 'Remove Module' : 'Remove Lesson'}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmCurriculumRemoval}
      />

    </div>
  );
};
