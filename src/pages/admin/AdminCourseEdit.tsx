import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { Course, Module, Lesson, SkillLevel, Category } from '../../types';
import { ConfirmActionModal } from '../../components/admin/ConfirmActionModal';
import { LessonVideoUploadButton } from '../../components/admin/LessonVideoUploadButton';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Play,
  Layers,
  GraduationCap,
  Award,
  ChevronUp,
  ChevronDown,
  FileText,
  ChefHat,
  ArrowRight,
  Info
} from 'lucide-react';

type EditTab = 'overview' | 'about_outcomes' | 'curriculum';

export const AdminCourseEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [activeTab, setActiveTab] = useState<EditTab>('overview');

  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [pendingRemoval, setPendingRemoval] = useState<{
    type: 'module' | 'lesson';
    modId: string;
    lessonId?: string;
    label: string;
  } | null>(null);

  // Tab 1: Overview & Pricing State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('/images/hero-cake.png');
  const [previewMedia, setPreviewMedia] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('All Levels');
  const [price, setPrice] = useState<number>(499); // CRITICAL: defaults to ₹499
  const [originalPrice, setOriginalPrice] = useState<number>(1499);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [featured, setFeatured] = useState(false);
  const [totalDuration, setTotalDuration] = useState('2h 30m');

  // Tab 2: About & Outcomes State
  const [description, setDescription] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([
    'Master professional pastry formulation, precision ingredient weighing, and emulsion stability',
    'Execute fail-safe sponge textures, clean palette knife finishes, and structural doweling',
    'Formulate silky Swiss meringue buttercream and mirror glazes calibrated for room climate',
    'Troubleshoot common baking anomalies, sinking centers, and crystallization challenges'
  ]);
  const [prerequisites, setPrerequisites] = useState<string[]>([
    'Basic passion for baking and home kitchen oven',
    'Willingness to learn French pastry ratios and precision scales'
  ]);
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([
    'Standard domestic oven with temperature control',
    'Electric hand mixer or planetary stand mixer',
    'Silicone spatulas and stainless steel mixing bowls',
    'Piping bags and standard open-star / round nozzle kit'
  ]);

  // Tab 3: Curriculum State
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
            populateCourseFields(existing);
          }
        })
        .catch(() => {
          const existing = storageService.getCourseById(id);
          if (existing) {
            populateCourseFields(existing);
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

  const populateCourseFields = (existing: Course) => {
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

    // Outcomes & About Details
    const outcomes = existing.learningOutcomes || (existing as any).learning_outcomes;
    if (Array.isArray(outcomes) && outcomes.length > 0) {
      setLearningOutcomes(outcomes);
    }

    if (Array.isArray(existing.prerequisites) && existing.prerequisites.length > 0) {
      setPrerequisites(existing.prerequisites);
    }

    const equip = existing.equipmentNeeded || (existing as any).equipment_needed;
    if (Array.isArray(equip) && equip.length > 0) {
      setEquipmentNeeded(equip);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  // Outcome Handlers
  const handleOutcomeChange = (index: number, value: string) => {
    const updated = [...learningOutcomes];
    updated[index] = value;
    setLearningOutcomes(updated);
  };

  const handleAddOutcome = (initialText?: string) => {
    setLearningOutcomes([
      ...learningOutcomes,
      initialText || ''
    ]);
  };

  const handleRemoveOutcome = (index: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
  };

  const handleMoveOutcome = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= learningOutcomes.length) return;
    const updated = [...learningOutcomes];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLearningOutcomes(updated);
  };

  // Prerequisites Handlers
  const handlePrereqChange = (index: number, value: string) => {
    const updated = [...prerequisites];
    updated[index] = value;
    setPrerequisites(updated);
  };

  const handleAddPrereq = (initialText?: string) => {
    setPrerequisites([...prerequisites, initialText || '']);
  };

  const handleRemovePrereq = (index: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  const handleMovePrereq = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= prerequisites.length) return;
    const updated = [...prerequisites];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPrerequisites(updated);
  };

  // Equipment Handlers
  const handleEquipmentChange = (index: number, value: string) => {
    const updated = [...equipmentNeeded];
    updated[index] = value;
    setEquipmentNeeded(updated);
  };

  const handleAddEquipment = (initialText?: string) => {
    setEquipmentNeeded([...equipmentNeeded, initialText || '']);
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipmentNeeded(equipmentNeeded.filter((_, i) => i !== index));
  };

  const handleMoveEquipment = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= equipmentNeeded.length) return;
    const updated = [...equipmentNeeded];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setEquipmentNeeded(updated);
  };

  // Module & Lesson Handlers
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

    const cleanOutcomes = learningOutcomes.map(s => s.trim()).filter(Boolean);
    const cleanPrereqs = prerequisites.map(s => s.trim()).filter(Boolean);
    const cleanEquip = equipmentNeeded.map(s => s.trim()).filter(Boolean);

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
      learningOutcomes: cleanOutcomes,
      prerequisites: cleanPrereqs,
      equipmentNeeded: cleanEquip,
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
        body: JSON.stringify({
          ...courseData,
          learning_outcomes: cleanOutcomes,
          equipment_needed: cleanEquip
        })
      });
    } catch (err) {
      console.error('Failed to sync course to Neon database:', err);
    } finally {
      setIsSaving(false);
      navigate('/admin/courses');
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.8rem', paddingBottom: '3rem' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Link to="/admin/courses" style={{ color: 'var(--color-plum)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <ArrowLeft size={18} /> Back to Courses
          </Link>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--color-plum)', fontWeight: 600, margin: 0 }}>
            {isNew ? 'Create New Masterclass' : `Edit: ${title || 'Masterclass'}`}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isNew && slug && (
            <Link
              to={`/courses/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <span>View Live Course</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSaving ? 0.7 : 1 }}
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Masterclass'}
          </button>
        </div>
      </div>

      {/* Segmented Top Tab Navigation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.6rem',
          backgroundColor: '#FFFFFF',
          padding: '0.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Tab 1: Overview */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'overview' ? 'var(--color-berry)' : 'transparent',
            color: activeTab === 'overview' ? '#FFFFFF' : 'var(--color-plum)',
            fontWeight: 600,
            fontSize: '0.92rem',
            transition: 'all 0.2s ease'
          }}
        >
          <BookOpen size={18} />
          <span>1. Overview &amp; Pricing</span>
        </button>

        {/* Tab 2: About & Outcomes */}
        <button
          type="button"
          onClick={() => setActiveTab('about_outcomes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'about_outcomes' ? 'var(--color-berry)' : 'transparent',
            color: activeTab === 'about_outcomes' ? '#FFFFFF' : 'var(--color-plum)',
            fontWeight: 600,
            fontSize: '0.92rem',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <GraduationCap size={18} />
          <span>2. About &amp; Outcomes</span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              backgroundColor: activeTab === 'about_outcomes' ? 'rgba(255,255,255,0.25)' : 'var(--color-cream)',
              color: activeTab === 'about_outcomes' ? '#FFFFFF' : 'var(--color-berry)',
              fontWeight: 700
            }}
          >
            {learningOutcomes.length}
          </span>
        </button>

        {/* Tab 3: Curriculum */}
        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'curriculum' ? 'var(--color-berry)' : 'transparent',
            color: activeTab === 'curriculum' ? '#FFFFFF' : 'var(--color-plum)',
            fontWeight: 600,
            fontSize: '0.92rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={18} />
          <span>3. Curriculum ({modules.length})</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* =========================================================================
            TAB 1: OVERVIEW & PRICING
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.4rem' }}>
                <BookOpen size={20} color="var(--color-berry)" />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', margin: 0, fontWeight: 600 }}>
                  Course Overview &amp; Key Details
                </h3>
              </div>

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
                  placeholder="One-line summary for course cards and search previews"
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

              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                    style={{ accentColor: 'var(--color-berry)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>Published on Website</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ({status === 'published' ? 'Visible in academy curriculum' : 'Hidden as draft'})
                  </span>
                </label>
              </div>
            </div>

            {/* Next Tab Switcher Banner */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('about_outcomes')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Continue to About &amp; Outcomes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ABOUT & OUTCOMES (DEDICATED USER-FRIENDLY MANAGER)
            ========================================================================= */}
        {activeTab === 'about_outcomes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Quick Context Tip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', backgroundColor: '#FFF5F6', borderRadius: '12px', border: '1px solid rgba(220, 165, 175, 0.4)', color: 'var(--color-plum)' }}>
              <Info size={18} color="var(--color-berry)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                <strong>Live Course Sync:</strong> Everything configured in this tab directly customizes the <strong>About</strong> and <strong>Outcomes</strong> tabs on the public course page (<code>/courses/{slug || '...'}</code>).
              </div>
            </div>

            {/* -------------------------------------------------------------
                SECTION 1: LEARNING OUTCOMES ("What You'll Master in This Course")
                ------------------------------------------------------------- */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1.5px solid rgba(163, 61, 89, 0.15)', boxShadow: '0 4px 20px rgba(87, 51, 58, 0.04)' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Award size={20} color="var(--color-berry)" />
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', margin: 0, fontWeight: 700 }}>
                      What You'll Master (Learning Outcomes)
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    Add key culinary competencies, formulation formulas, and decorating techniques students achieve.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-berry)', backgroundColor: '#FFF0F3', padding: '0.35rem 0.8rem', borderRadius: '999px' }}>
                    {learningOutcomes.length} Outcomes Listed
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddOutcome()}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={15} /> Add Outcome
                  </button>
                </div>
              </div>

              {/* Dynamic Outcomes List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {learningOutcomes.map((outcome, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-cream)',
                      borderRadius: '12px',
                      border: '1px solid rgba(220, 165, 175, 0.35)',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {/* Number Badge */}
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-berry)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {/* Outcome Text Input */}
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => handleOutcomeChange(idx, e.target.value)}
                      placeholder={`Outcome #${idx + 1} (e.g. Master the Swiss meringue buttercream formula for all weather climates)`}
                      className="input-field"
                      style={{
                        flex: 1,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(87, 51, 58, 0.15)',
                        padding: '0.65rem 0.9rem',
                        fontSize: '0.92rem'
                      }}
                    />

                    {/* Reorder Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveOutcome(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          color: idx === 0 ? 'var(--text-light)' : 'var(--color-plum)',
                          padding: '0.3rem',
                          borderRadius: '4px'
                        }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOutcome(idx, 'down')}
                        disabled={idx === learningOutcomes.length - 1}
                        title="Move Down"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: idx === learningOutcomes.length - 1 ? 'not-allowed' : 'pointer',
                          color: idx === learningOutcomes.length - 1 ? 'var(--text-light)' : 'var(--color-plum)',
                          padding: '0.3rem',
                          borderRadius: '4px'
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveOutcome(idx)}
                      title="Remove Outcome"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#D32F2F',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Outcome & Quick Inspiration Chips */}
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => handleAddOutcome()}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                >
                  <Plus size={16} /> Add Another Outcome
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Quick Starter Chips:</span>
                  {[
                    'Razor-sharp 90° edges & disc smoothing',
                    'Swiss meringue buttercream climate formula',
                    'Multi-tiered cake structural doweling',
                    'Chocolate tempering & mirror shine ratios'
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleAddOutcome(preset)}
                      style={{
                        backgroundColor: '#FFF0F3',
                        border: '1px solid rgba(163, 61, 89, 0.25)',
                        color: 'var(--color-berry)',
                        borderRadius: '999px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-berry)';
                        e.currentTarget.style.color = '#FFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFF0F3';
                        e.currentTarget.style.color = 'var(--color-berry)';
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* -------------------------------------------------------------
                SECTION 2: ABOUT THIS MASTERCLASS DETAILS & REQUIREMENTS
                ------------------------------------------------------------- */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <FileText size={20} color="var(--color-berry)" />
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', margin: 0, fontWeight: 700 }}>
                    About This Masterclass (Narrative &amp; Requirements)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    This comprehensive text is featured under the "About this Masterclass" tab on the course detail page.
                  </p>
                </div>
              </div>

              {/* Masterclass In-depth Description */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                  Full Masterclass Overview &amp; Syllabus Story *
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed multi-paragraph breakdown of what makes this course unique, technique methodologies, and workshop structure..."
                  className="input-field"
                  style={{ lineHeight: 1.6, fontSize: '0.95rem' }}
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
                  Character count: {description.length} • Displays in the primary paragraph block of the About tab.
                </div>
              </div>

              {/* Two-Column Grid: Prerequisites & Equipment Needed */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                
                {/* Column 1: Prerequisites */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FileText size={17} color="var(--color-berry)" />
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-plum)', margin: 0 }}>
                        Prerequisites ({prerequisites.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddPrereq()}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Prerequisite skills or knowledge students should know before enrolling.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {prerequisites.map((prereq, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: 'var(--color-cream)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(220, 165, 175, 0.3)'
                        }}
                      >
                        <span style={{ color: 'var(--color-berry)', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>•</span>
                        <input
                          type="text"
                          value={prereq}
                          onChange={(e) => handlePrereqChange(pIdx, e.target.value)}
                          placeholder="e.g. Basic enthusiasm for baking"
                          className="input-field"
                          style={{ flex: 1, backgroundColor: '#FFF', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleMovePrereq(pIdx, 'up')}
                          disabled={pIdx === 0}
                          style={{ background: 'none', border: 'none', cursor: pIdx === 0 ? 'default' : 'pointer', color: pIdx === 0 ? '#ccc' : 'var(--color-plum)' }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePrereq(pIdx, 'down')}
                          disabled={pIdx === prerequisites.length - 1}
                          style={{ background: 'none', border: 'none', cursor: pIdx === prerequisites.length - 1 ? 'default' : 'pointer', color: pIdx === prerequisites.length - 1 ? '#ccc' : 'var(--color-plum)' }}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePrereq(pIdx)}
                          style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Required Equipment */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <ChefHat size={17} color="var(--color-berry)" />
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-plum)', margin: 0 }}>
                        Required Equipment &amp; Tools ({equipmentNeeded.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddEquipment()}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                    >
                      <Plus size={13} /> Add Tool
                    </button>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Baking tools, pans, turntables, or electric appliances needed.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {equipmentNeeded.map((eq, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: 'var(--color-cream)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(220, 165, 175, 0.3)'
                        }}
                      >
                        <ChefHat size={14} color="var(--color-berry)" style={{ flexShrink: 0 }} />
                        <input
                          type="text"
                          value={eq}
                          onChange={(e) => handleEquipmentChange(eIdx, e.target.value)}
                          placeholder="e.g. Revolving cake turntable"
                          className="input-field"
                          style={{ flex: 1, backgroundColor: '#FFF', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveEquipment(eIdx, 'up')}
                          disabled={eIdx === 0}
                          style={{ background: 'none', border: 'none', cursor: eIdx === 0 ? 'default' : 'pointer', color: eIdx === 0 ? '#ccc' : 'var(--color-plum)' }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveEquipment(eIdx, 'down')}
                          disabled={eIdx === equipmentNeeded.length - 1}
                          style={{ background: 'none', border: 'none', cursor: eIdx === equipmentNeeded.length - 1 ? 'default' : 'pointer', color: eIdx === equipmentNeeded.length - 1 ? '#ccc' : 'var(--color-plum)' }}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eIdx)}
                          style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Tab Navigation Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft size={16} /> Back to Overview
              </button>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>Continue to Curriculum</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 3: STRUCTURED CURRICULUM BUILDER
            ========================================================================= */}
        {activeTab === 'curriculum' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Layers size={20} color="var(--color-berry)" />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', margin: 0, fontWeight: 700 }}>
                      Structured Curriculum Builder
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Organize learning modules and assign video lectures with preview permissions.
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-plum)', cursor: 'pointer', flexShrink: 0, userSelect: 'none' }}>
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
                            <LessonVideoUploadButton
                              lessonId={les.id}
                              lessonTitle={les.title || `Lesson ${lIdx + 1}`}
                              currentVideoReference={les.videoReference}
                              driveFileId={(les as any).driveFileId}
                              videoFilename={(les as any).videoFilename}
                              videoSize={(les as any).videoSize}
                              courseId={id || 'new'}
                              moduleId={mod.id}
                              onVideoUploaded={(streamUrl, driveFileId, filename, size) => {
                                const updated = [...modules];
                                updated[mIdx].lessons[lIdx].videoReference = streamUrl;
                                (updated[mIdx].lessons[lIdx] as any).driveFileId = driveFileId;
                                (updated[mIdx].lessons[lIdx] as any).videoFilename = filename;
                                (updated[mIdx].lessons[lIdx] as any).videoSize = size;
                                setModules(updated);
                              }}
                              onVideoRemoved={() => {
                                const updated = [...modules];
                                updated[mIdx].lessons[lIdx].videoReference = '';
                                (updated[mIdx].lessons[lIdx] as any).driveFileId = undefined;
                                (updated[mIdx].lessons[lIdx] as any).videoFilename = undefined;
                                (updated[mIdx].lessons[lIdx] as any).videoSize = undefined;
                                setModules(updated);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(mod.id, les.id)}
                              style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}
                              title="Delete lesson"
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

            {/* Bottom Curriculum Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveTab('about_outcomes')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft size={16} /> Back to About &amp; Outcomes
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary btn-lg"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={18} /> {isSaving ? 'Saving Masterclass...' : 'Save Masterclass & Publish Updates'}
              </button>
            </div>
          </div>
        )}

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
