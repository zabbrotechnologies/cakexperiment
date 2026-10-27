import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { Course, Module, Lesson } from '../../types';
import {
  Video,
  Play,
  Plus,
  Clock,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RotateCcw,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  BookOpen,
  Eye,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  List,
  Grid,
  Sparkles
} from 'lucide-react';

export const AdminVideos: React.FC = () => {
  // Master state from storage
  const [courses, setCourses] = useState<Course[]>(() => storageService.getCourses());

  // Filter & Search states
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [accessFilter, setAccessFilter] = useState<'all' | 'preview' | 'enrolled'>('all');
  const [videoStatusFilter, setVideoStatusFilter] = useState<'all' | 'configured' | 'missing'>('all');

  // View presentation state
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>(() => {
    // Expand first 2 courses by default
    const initial: Record<string, boolean> = {};
    storageService.getCourses().forEach((c, idx) => {
      initial[c.id] = idx < 2;
    });
    return initial;
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Modals state
  const [previewLessonModal, setPreviewLessonModal] = useState<{
    lesson: Lesson;
    course: Course;
    module: Module;
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const [lessonFormModal, setLessonFormModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    courseId: string;
    moduleId: string;
    lessonId?: string;
    initialData?: Partial<Lesson>;
  } | null>(null);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    courseId: string;
    moduleId: string;
    lessonId: string;
    lessonTitle: string;
    courseTitle: string;
    moduleTitle: string;
  } | null>(null);

  // Form input state for Lesson Add/Edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    moduleId: '',
    videoReference: '',
    duration: '',
    isPreview: false,
    status: 'published' as 'published' | 'draft'
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Reload courses helper
  const reloadData = () => {
    const updated = storageService.getCourses();
    setCourses(updated);
  };

  // --- Dynamic Summary Metrics ---
  const summaryMetrics = useMemo(() => {
    let totalModules = 0;
    let totalLessons = 0;
    let configuredVideos = 0;
    let freePreviews = 0;

    courses.forEach(c => {
      const mods = c.modules || [];
      totalModules += mods.length;
      mods.forEach(m => {
        (m.lessons || []).forEach(l => {
          totalLessons += 1;
          if (l.videoReference && l.videoReference.trim().length > 0) {
            configuredVideos += 1;
          }
          if (l.isPreview) {
            freePreviews += 1;
          }
        });
      });
    });

    return {
      totalCourses: courses.length,
      totalModules,
      totalLessons,
      configuredVideos,
      freePreviews
    };
  }, [courses]);

  // --- Available Modules for Dropdown Filter ---
  const availableFilterModules = useMemo(() => {
    if (selectedCourseId !== 'all') {
      const course = courses.find(c => c.id === selectedCourseId);
      return course?.modules || [];
    }
    // Return all modules with course context
    const list: { id: string; title: string; courseTitle: string }[] = [];
    courses.forEach(c => {
      (c.modules || []).forEach(m => {
        list.push({ id: m.id, title: m.title, courseTitle: c.title });
      });
    });
    return list;
  }, [courses, selectedCourseId]);

  // Handle Course selection change: reset module filter if invalid
  const handleCourseFilterChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId !== 'all') {
      const course = courses.find(c => c.id === courseId);
      const hasModule = (course?.modules || []).some(m => m.id === selectedModuleId);
      if (!hasModule) {
        setSelectedModuleId('all');
      }
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCourseId('all');
    setSelectedModuleId('all');
    setSearchQuery('');
    setAccessFilter('all');
    setVideoStatusFilter('all');
  };

  const hasActiveFilters =
    selectedCourseId !== 'all' ||
    selectedModuleId !== 'all' ||
    searchQuery.trim().length > 0 ||
    accessFilter !== 'all' ||
    videoStatusFilter !== 'all';

  // --- Filtered Curriculum Hierarchy ---
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const resultCourses: {
      course: Course;
      matchingModules: {
        module: Module;
        matchingLessons: Lesson[];
      }[];
      totalMatchingLessons: number;
    }[] = [];

    let totalLessonsCount = 0;

    courses.forEach(course => {
      // Course filter
      if (selectedCourseId !== 'all' && course.id !== selectedCourseId) {
        return;
      }

      const matchingModules: {
        module: Module;
        matchingLessons: Lesson[];
      }[] = [];

      (course.modules || []).forEach(module => {
        // Module filter
        if (selectedModuleId !== 'all' && module.id !== selectedModuleId) {
          return;
        }

        const matchingLessons = (module.lessons || []).filter(lesson => {
          // Preview Access filter
          if (accessFilter === 'preview' && !lesson.isPreview) return false;
          if (accessFilter === 'enrolled' && lesson.isPreview) return false;

          // Video Status filter
          const hasVideo = lesson.videoReference && lesson.videoReference.trim().length > 0;
          if (videoStatusFilter === 'configured' && !hasVideo) return false;
          if (videoStatusFilter === 'missing' && hasVideo) return false;

          // Search Query
          if (query.length > 0) {
            const matchesLessonTitle = lesson.title.toLowerCase().includes(query);
            const matchesLessonDesc = (lesson.description || '').toLowerCase().includes(query);
            const matchesModuleTitle = module.title.toLowerCase().includes(query);
            const matchesCourseTitle = course.title.toLowerCase().includes(query);
            const matchesVideoRef = (lesson.videoReference || '').toLowerCase().includes(query);

            return (
              matchesLessonTitle ||
              matchesLessonDesc ||
              matchesModuleTitle ||
              matchesCourseTitle ||
              matchesVideoRef
            );
          }

          return true;
        });

        // If module has matching lessons, or if user specifically filtered by module/course and search is empty
        if (matchingLessons.length > 0) {
          matchingModules.push({
            module,
            matchingLessons
          });
          totalLessonsCount += matchingLessons.length;
        } else if (query.length === 0 && selectedModuleId === module.id) {
          // When explicitly selecting an empty module with no search filter
          matchingModules.push({
            module,
            matchingLessons: []
          });
        }
      });

      // Include course if it has matching modules/lessons or if explicitly selected
      if (matchingModules.length > 0 || (selectedCourseId === course.id && query.length === 0)) {
        const courseLessonCount = matchingModules.reduce(
          (acc, m) => acc + m.matchingLessons.length,
          0
        );
        resultCourses.push({
          course,
          matchingModules,
          totalMatchingLessons: courseLessonCount
        });
      }
    });

    return {
      courses: resultCourses,
      totalMatchingLessons: totalLessonsCount
    };
  }, [courses, selectedCourseId, selectedModuleId, searchQuery, accessFilter, videoStatusFilter]);

  // --- Accordion Toggles ---
  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: prev[moduleId] !== undefined ? !prev[moduleId] : false // default is expanded if undefined
    }));
  };

  const isModuleExpanded = (moduleId: string) => {
    return expandedModules[moduleId] === undefined ? true : expandedModules[moduleId];
  };

  const handleExpandAll = () => {
    const allC: Record<string, boolean> = {};
    const allM: Record<string, boolean> = {};
    courses.forEach(c => {
      allC[c.id] = true;
      (c.modules || []).forEach(m => {
        allM[m.id] = true;
      });
    });
    setExpandedCourses(allC);
    setExpandedModules(allM);
  };

  const handleCollapseAll = () => {
    const noneC: Record<string, boolean> = {};
    const noneM: Record<string, boolean> = {};
    courses.forEach(c => {
      noneC[c.id] = false;
      (c.modules || []).forEach(m => {
        noneM[m.id] = false;
      });
    });
    setExpandedCourses(noneC);
    setExpandedModules(noneM);
  };

  // --- Lesson Add / Edit Modal Handlers ---
  const openAddLessonModal = (courseId: string, moduleId: string) => {
    setFormData({
      title: '',
      description: '',
      courseId,
      moduleId,
      videoReference: '',
      duration: '15:00',
      isPreview: false,
      status: 'published'
    });
    setFormError(null);
    setLessonFormModal({
      isOpen: true,
      mode: 'add',
      courseId,
      moduleId
    });
  };

  const openEditLessonModal = (course: Course, module: Module, lesson: Lesson) => {
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      courseId: course.id,
      moduleId: module.id,
      videoReference: lesson.videoReference || '',
      duration: lesson.duration || '12:00',
      isPreview: lesson.isPreview,
      status: lesson.status || 'published'
    });
    setFormError(null);
    setLessonFormModal({
      isOpen: true,
      mode: 'edit',
      courseId: course.id,
      moduleId: module.id,
      lessonId: lesson.id,
      initialData: lesson
    });
  };

  const handleSaveLessonForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Lesson title is required.');
      return;
    }
    if (!formData.duration.trim()) {
      setFormError('Duration is required (e.g. 14:20).');
      return;
    }

    try {
      storageService.saveLesson(formData.courseId, formData.moduleId, {
        id: lessonFormModal?.lessonId,
        title: formData.title,
        description: formData.description,
        videoReference: formData.videoReference,
        duration: formData.duration,
        isPreview: formData.isPreview,
        status: formData.status
      });

      reloadData();
      setLessonFormModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save lesson');
    }
  };

  // --- Lesson Reorder Handlers ---
  const handleReorder = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => {
    storageService.reorderLesson(courseId, moduleId, lessonId, direction);
    reloadData();
  };

  // --- Lesson Delete Handlers ---
  const confirmDeleteLesson = () => {
    if (!deleteConfirmModal) return;
    storageService.deleteLesson(
      deleteConfirmModal.courseId,
      deleteConfirmModal.moduleId,
      deleteConfirmModal.lessonId
    );
    reloadData();
    setDeleteConfirmModal(null);
  };

  // Helper to copy video link
  const handleCopyVideoUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Strip redundant "Lesson X: " or "Lesson 0X: " prefix if present in title for clean display
  const formatCleanTitle = (title: string): string => {
    return title.replace(/^Lesson\s*\d+\s*[:\-–]\s*/i, '').trim() || title;
  };

  // Shorten video URL for display
  const formatShortVideoRef = (ref: string): string => {
    if (!ref || !ref.trim()) return 'No video configured';
    try {
      if (ref.startsWith('http')) {
        const urlObj = new URL(ref);
        const parts = urlObj.pathname.split('/');
        const filename = parts[parts.length - 1] || urlObj.hostname;
        return decodeURIComponent(filename);
      }
      return ref.length > 36 ? ref.substring(0, 36) + '...' : ref;
    } catch {
      return ref.length > 36 ? ref.substring(0, 36) + '...' : ref;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        paddingBottom: '3rem',
        color: 'var(--color-plum)'
      }}
    >
      {/* 4.1 Page Heading */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blush)',
                color: 'var(--color-berry)'
              }}
            >
              <Video size={18} />
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                color: 'var(--color-plum)',
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              Video Media & Lesson References
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '780px' }}>
            Manage course videos, lesson durations, preview access, and curriculum media references.
          </p>
        </div>

        {/* Global actions: View switcher & Expand/Collapse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '3px'
            }}
          >
            <button
              onClick={() => setViewMode('grouped')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grouped' ? 'var(--color-berry)' : 'transparent',
                color: viewMode === 'grouped' ? '#FFFFFF' : 'var(--color-plum)',
                transition: 'all 0.2s ease'
              }}
              title="Hierarchical Curriculum View"
            >
              <Layers size={14} /> Grouped Curriculum
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? 'var(--color-berry)' : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : 'var(--color-plum)',
                transition: 'all 0.2s ease'
              }}
              title="Detailed Table View"
            >
              <List size={14} /> Curriculum Table
            </button>
          </div>

          {viewMode === 'grouped' && (
            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
              <button
                onClick={handleExpandAll}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.7rem' }}
                title="Expand all courses and modules"
              >
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.7rem' }}
                title="Collapse all courses"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4.2 Summary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-cream)',
              border: '1px solid var(--color-blush)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-berry)'
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Total Courses
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-plum)', lineHeight: 1.2 }}>
              {summaryMetrics.totalCourses}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-cream)',
              border: '1px solid var(--color-blush)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-berry)'
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Total Modules
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-plum)', lineHeight: 1.2 }}>
              {summaryMetrics.totalModules}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-cream)',
              border: '1px solid var(--color-blush)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-berry)'
            }}
          >
            <Video size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Total Lessons
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-plum)', lineHeight: 1.2 }}>
              {summaryMetrics.totalLessons}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#EFFBF4',
              border: '1px solid #D2F2E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1B8754'
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Configured Videos
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#1B8754', lineHeight: 1.2 }}>
              {summaryMetrics.configuredVideos}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#FFF2F4',
              border: '1px solid var(--color-blush)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-berry)'
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Free Previews
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-berry)', lineHeight: 1.2 }}>
              {summaryMetrics.freePreviews}
            </div>
          </div>
        </div>
      </div>

      {/* 5. SEARCH AND FILTER TOOLBAR */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          padding: '1.15rem 1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.85rem',
            alignItems: 'flex-end'
          }}
        >
          {/* 5.1 Course Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-plum)',
                marginBottom: '0.35rem'
              }}
            >
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={e => handleCourseFilterChange(e.target.value)}
              className="input-field"
              style={{
                fontSize: '0.86rem',
                padding: '0.55rem 0.75rem',
                backgroundColor: 'var(--color-cream)',
                borderColor: selectedCourseId !== 'all' ? 'var(--color-berry)' : 'var(--border-subtle)'
              }}
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* 5.5 Module Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-plum)',
                marginBottom: '0.35rem'
              }}
            >
              Module
            </label>
            <select
              value={selectedModuleId}
              onChange={e => setSelectedModuleId(e.target.value)}
              className="input-field"
              style={{
                fontSize: '0.86rem',
                padding: '0.55rem 0.75rem',
                backgroundColor: 'var(--color-cream)',
                borderColor: selectedModuleId !== 'all' ? 'var(--color-berry)' : 'var(--border-subtle)'
              }}
            >
              <option value="all">
                {selectedCourseId === 'all' ? 'All Modules (Across Courses)' : 'All Modules in Selected Course'}
              </option>
              {availableFilterModules.map(m => (
                <option key={m.id} value={m.id}>
                  {'courseTitle' in m ? `${m.courseTitle} → ${m.title}` : m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 5.3 Preview Access Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-plum)',
                marginBottom: '0.35rem'
              }}
            >
              Preview Access
            </label>
            <select
              value={accessFilter}
              onChange={e => setAccessFilter(e.target.value as any)}
              className="input-field"
              style={{
                fontSize: '0.86rem',
                padding: '0.55rem 0.75rem',
                backgroundColor: 'var(--color-cream)',
                borderColor: accessFilter !== 'all' ? 'var(--color-berry)' : 'var(--border-subtle)'
              }}
            >
              <option value="all">All Access Types</option>
              <option value="preview">Free Preview Only</option>
              <option value="enrolled">Enrolled-Course Lessons</option>
            </select>
          </div>

          {/* 5.4 Video Status Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-plum)',
                marginBottom: '0.35rem'
              }}
            >
              Video Status
            </label>
            <select
              value={videoStatusFilter}
              onChange={e => setVideoStatusFilter(e.target.value as any)}
              className="input-field"
              style={{
                fontSize: '0.86rem',
                padding: '0.55rem 0.75rem',
                backgroundColor: 'var(--color-cream)',
                borderColor: videoStatusFilter !== 'all' ? 'var(--color-berry)' : 'var(--border-subtle)'
              }}
            >
              <option value="all">All Videos</option>
              <option value="configured">Reference Added</option>
              <option value="missing">Missing Video Reference</option>
            </select>
          </div>
        </div>

        {/* 5.2 Search Bar & 5.6 Clear Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color="var(--color-rose)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search lesson titles, modules, or video references..."
              className="input-field"
              style={{
                paddingLeft: '2.4rem',
                paddingRight: searchQuery ? '2.4rem' : '0.85rem',
                fontSize: '0.88rem',
                backgroundColor: 'var(--color-cream)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap'
              }}
            >
              <RotateCcw size={13} /> Clear Filters
            </button>
          )}
        </div>

        {/* 5.7 Result Count */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            paddingTop: '0.35rem',
            borderTop: '1px dashed var(--border-subtle)'
          }}
        >
          <span>
            Showing{' '}
            <strong style={{ color: 'var(--color-plum)' }}>
              {filteredData.totalMatchingLessons}
            </strong>{' '}
            of {summaryMetrics.totalLessons} lessons across{' '}
            <strong style={{ color: 'var(--color-plum)' }}>{filteredData.courses.length}</strong>{' '}
            {filteredData.courses.length === 1 ? 'course' : 'courses'}.
          </span>
          {selectedCourseId !== 'all' && (
            <button
              onClick={() => setSelectedCourseId('all')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-berry)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                textDecoration: 'underline'
              }}
            >
              ← Back to All Courses
            </button>
          )}
        </div>
      </div>

      {/* 14. Empty State if no courses or no matches */}
      {filteredData.courses.length === 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-cream)',
              color: 'var(--color-berry)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <Filter size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
            No lessons match your current search and filters
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Try broadening your search term, switching the course filter, or clearing active filters to view all curriculum references.
          </p>
          <button onClick={handleClearFilters} className="btn btn-primary btn-sm">
            Reset All Filters
          </button>
        </div>
      )}

      {/* VIEW MODE 1: 6. COURSE GROUPED CURRICULUM VIEW (DEFAULT) */}
      {viewMode === 'grouped' && filteredData.courses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredData.courses.map(({ course, matchingModules, totalMatchingLessons }) => {
            const isCourseExpanded =
              selectedCourseId === course.id ? true : !!expandedCourses[course.id];

            return (
              <div
                key={course.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* 6.1 Course Group Header */}
                <div
                  onClick={() => toggleCourseExpand(course.id)}
                  style={{
                    padding: '1.1rem 1.4rem',
                    backgroundColor: isCourseExpanded ? 'var(--color-cream)' : '#FFFFFF',
                    borderBottom: isCourseExpanded ? '1px solid var(--border-subtle)' : 'none',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                    {/* Course Thumbnail */}
                    <div
                      style={{
                        width: '58px',
                        height: '42px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--color-blush)',
                        flexShrink: 0,
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-berry)' }}>
                          <BookOpen size={18} />
                        </div>
                      )}
                    </div>

                    {/* Course Metadata */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <h2
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.3rem',
                            fontWeight: 600,
                            color: 'var(--color-plum)',
                            margin: 0
                          }}
                        >
                          {course.title}
                        </h2>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: course.status === 'published' ? '#EFFBF4' : '#FFF9E6',
                            color: course.status === 'published' ? '#1B8754' : '#B8860B',
                            border: `1px solid ${course.status === 'published' ? '#D2F2E0' : '#FFEBAA'}`
                          }}
                        >
                          {course.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>{course.categoryName || 'Cake Artistry'}</span>
                        <span>•</span>
                        <span>{course.skillLevel}</span>
                        <span>•</span>
                        <span>
                          <strong style={{ color: 'var(--color-plum)' }}>{course.modules?.length || 0}</strong> Modules
                        </span>
                        <span>•</span>
                        <span>
                          <strong style={{ color: 'var(--color-plum)' }}>{course.lessonCount || 0}</strong> Total Lessons
                          {totalMatchingLessons !== (course.lessonCount || 0) && (
                            <span style={{ color: 'var(--color-berry)', marginLeft: '0.25rem' }}>
                              ({totalMatchingLessons} matching)
                            </span>
                          )}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} color="var(--color-berry)" />
                          {course.totalDuration || '1h 45m'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions (prevent accordion toggle) */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Link
                      to={`/courses/${course.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        padding: '0.35rem 0.65rem'
                      }}
                      title="View public course details"
                    >
                      <ExternalLink size={12} /> View Course
                    </Link>

                    {selectedCourseId !== course.id ? (
                      <button
                        onClick={() => setSelectedCourseId(course.id)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.65rem',
                          color: 'var(--color-berry)',
                          borderColor: 'var(--color-blush)'
                        }}
                        title="Focus only on this course's curriculum"
                      >
                        Focus Course
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedCourseId('all')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                        title="Show all courses"
                      >
                        View All
                      </button>
                    )}

                    <button
                      onClick={() => toggleCourseExpand(course.id)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--color-plum)'
                      }}
                      aria-label={isCourseExpanded ? 'Collapse course' : 'Expand course'}
                    >
                      {isCourseExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Course Modules & Lessons Body */}
                {isCourseExpanded && (
                  <div style={{ padding: '1rem 1.4rem', backgroundColor: '#FAFAFA' }}>
                    {/* Course has no modules state */}
                    {(!course.modules || course.modules.length === 0) && (
                      <div
                        style={{
                          padding: '2.5rem',
                          textAlign: 'center',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px dashed var(--border-subtle)'
                        }}
                      >
                        <Layers size={28} color="var(--color-rose)" style={{ margin: '0 auto 0.75rem' }} />
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
                          This course does not have any modules yet
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          Add curriculum modules to begin organizing lessons and video streams.
                        </p>
                        <button
                          onClick={() => {
                            const mod = storageService.addModule(course.id, 'Module 1: Foundations & Preparation');
                            reloadData();
                            if (mod) openAddLessonModal(course.id, mod.id);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus size={14} /> Create First Module
                        </button>
                      </div>
                    )}

                    {/* 7. Module Grouping */}
                    {matchingModules.map(({ module, matchingLessons }, mIdx) => {
                      const isModOpen = isModuleExpanded(module.id);
                      // Calculate module duration
                      const moduleSeconds = (module.lessons || []).reduce((acc, l) => {
                        if (l.durationSeconds) return acc + l.durationSeconds;
                        const p = (l.duration || '').split(':').map(Number);
                        return acc + (p.length === 2 && !isNaN(p[0]) ? p[0] * 60 + (p[1] || 0) : 600);
                      }, 0);
                      const modMins = Math.round(moduleSeconds / 60);

                      return (
                        <div
                          key={module.id}
                          style={{
                            marginBottom: mIdx === matchingModules.length - 1 ? 0 : '1.25rem',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            border: '1px solid var(--border-subtle)',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(87,51,58,0.03)'
                          }}
                        >
                          {/* 7.1 Module Header */}
                          <div
                            onClick={() => toggleModuleExpand(module.id)}
                            style={{
                              padding: '0.85rem 1.15rem',
                              backgroundColor: '#FCF9F9',
                              borderBottom: isModOpen ? '1px solid var(--border-subtle)' : 'none',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--color-blush)',
                                  color: 'var(--color-berry)',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              >
                                {String(module.order || mIdx + 1).padStart(2, '0')}
                              </span>
                              <div>
                                <h3
                                  style={{
                                    fontSize: '0.98rem',
                                    fontWeight: 600,
                                    color: 'var(--color-plum)',
                                    margin: 0
                                  }}
                                >
                                  {module.title}
                                </h3>
                                {module.description && (
                                  <p
                                    style={{
                                      fontSize: '0.78rem',
                                      color: 'var(--text-muted)',
                                      margin: '0.15rem 0 0',
                                      maxWidth: '650px'
                                    }}
                                  >
                                    {module.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Module stats & Add Lesson button */}
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                              onClick={e => e.stopPropagation()}
                            >
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <strong style={{ color: 'var(--color-plum)' }}>{module.lessons?.length || 0}</strong>{' '}
                                {module.lessons?.length === 1 ? 'Lesson' : 'Lessons'}
                                {modMins > 0 && ` · ${modMins} min`}
                              </span>

                              <button
                                onClick={() => openAddLessonModal(course.id, module.id)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.6rem',
                                  color: 'var(--color-berry)'
                                }}
                              >
                                <Plus size={13} /> Add Lesson
                              </button>

                              <button
                                onClick={() => toggleModuleExpand(module.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--color-plum)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                aria-label="Toggle module"
                              >
                                {isModOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* 8. Lesson Rows inside Module */}
                          {isModOpen && (
                            <div>
                              {matchingLessons.length === 0 ? (
                                <div
                                  style={{
                                    padding: '1.75rem',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  <p style={{ margin: '0 0 0.75rem' }}>
                                    No lessons match your current filters in this module.
                                  </p>
                                  <button
                                    onClick={() => openAddLessonModal(course.id, module.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.78rem' }}
                                  >
                                    <Plus size={13} /> Add New Lesson Here
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {matchingLessons.map((lesson, lIdx) => {
                                    const hasVideoRef =
                                      lesson.videoReference && lesson.videoReference.trim().length > 0;
                                    const scopedNumber = String(lesson.order || lIdx + 1).padStart(2, '0');
                                    const isFirst = lIdx === 0;
                                    const isLast = lIdx === matchingLessons.length - 1;

                                    return (
                                      <div
                                        key={lesson.id}
                                        style={{
                                          padding: '0.9rem 1.15rem',
                                          borderBottom:
                                            lIdx === matchingLessons.length - 1
                                              ? 'none'
                                              : '1px solid #FAF0F2',
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: '0.85rem',
                                          backgroundColor: '#FFFFFF',
                                          transition: 'background-color 0.15s ease'
                                        }}
                                        onMouseEnter={e => {
                                          e.currentTarget.style.backgroundColor = '#FCF9FA';
                                        }}
                                        onMouseLeave={e => {
                                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                                        }}
                                      >
                                        {/* 8.1 Lesson Information */}
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            flex: 2,
                                            minWidth: '260px'
                                          }}
                                        >
                                          {/* Scoped Order Badge & Icon */}
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.35rem',
                                              flexShrink: 0
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.04em',
                                                color: 'var(--color-berry)',
                                                backgroundColor: 'var(--color-cream)',
                                                padding: '0.2rem 0.45rem',
                                                borderRadius: '4px',
                                                border: '1px solid var(--color-blush)'
                                              }}
                                            >
                                              Lesson {scopedNumber}
                                            </span>
                                            <span
                                              style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                backgroundColor: hasVideoRef ? '#EFFBF4' : '#FFF0F2',
                                                color: hasVideoRef ? '#1B8754' : 'var(--color-rose)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                              }}
                                              title={hasVideoRef ? 'Video configured' : 'Missing video reference'}
                                            >
                                              <Video size={13} />
                                            </span>
                                          </div>

                                          {/* Title & Description */}
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                color: 'var(--color-plum)',
                                                lineHeight: 1.3
                                              }}
                                            >
                                              {formatCleanTitle(lesson.title)}
                                            </div>
                                            {lesson.description && (
                                              <div
                                                style={{
                                                  fontSize: '0.78rem',
                                                  color: 'var(--text-muted)',
                                                  marginTop: '0.15rem',
                                                  whiteSpace: 'nowrap',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  maxWidth: '520px'
                                                }}
                                                title={lesson.description}
                                              >
                                                {lesson.description}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* 8.2 Video Reference & Status */}
                                        <div
                                          style={{
                                            flex: 1.2,
                                            minWidth: '170px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.15rem'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                padding: '0.12rem 0.45rem',
                                                borderRadius: '4px',
                                                backgroundColor: hasVideoRef ? '#EFFBF4' : '#FFF2F4',
                                                color: hasVideoRef ? '#1B8754' : '#D0342C',
                                                border: `1px solid ${hasVideoRef ? '#D2F2E0' : '#F8D7DA'}`
                                              }}
                                            >
                                              {hasVideoRef ? 'Reference Added' : 'No Video Configured'}
                                            </span>
                                          </div>
                                          <div
                                            style={{
                                              fontSize: '0.74rem',
                                              color: 'var(--text-muted)',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              maxWidth: '220px'
                                            }}
                                            title={lesson.videoReference || 'No reference URL'}
                                          >
                                            {formatShortVideoRef(lesson.videoReference)}
                                          </div>
                                        </div>

                                        {/* 8.3 Duration */}
                                        <div
                                          style={{
                                            minWidth: '70px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--color-plum)'
                                          }}
                                        >
                                          <Clock size={13} color="var(--color-rose)" />
                                          <span>{lesson.duration || 'Not set'}</span>
                                        </div>

                                        {/* 8.4 Preview Access Tier */}
                                        <div style={{ minWidth: '120px' }}>
                                          <span
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.3rem',
                                              fontSize: '0.72rem',
                                              fontWeight: 600,
                                              padding: '0.2rem 0.55rem',
                                              borderRadius: '4px',
                                              backgroundColor: lesson.isPreview ? 'var(--color-blush)' : 'transparent',
                                              color: lesson.isPreview ? 'var(--color-berry)' : 'var(--text-muted)',
                                              border: `1px solid ${lesson.isPreview ? 'var(--color-rose)' : 'var(--border-subtle)'}`
                                            }}
                                          >
                                            {lesson.isPreview ? (
                                              <>
                                                <Eye size={11} /> Free Preview
                                              </>
                                            ) : (
                                              <>
                                                <Lock size={11} /> Enrolled Only
                                              </>
                                            )}
                                          </span>
                                        </div>

                                        {/* 8.5 Actions */}
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            justifyContent: 'flex-end'
                                          }}
                                        >
                                          {/* Preview Video Button */}
                                          <button
                                            onClick={() =>
                                              setPreviewLessonModal({
                                                lesson,
                                                course,
                                                module
                                              })
                                            }
                                            className="btn btn-secondary btn-sm"
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.35rem',
                                              fontSize: '0.75rem',
                                              padding: '0.35rem 0.6rem',
                                              backgroundColor: hasVideoRef ? '#FFFFFF' : '#FFF9FA',
                                              borderColor: hasVideoRef ? 'var(--border-subtle)' : 'var(--color-blush)'
                                            }}
                                            title="Preview video stream"
                                          >
                                            <Play size={11} fill="var(--color-plum)" /> Preview
                                          </button>

                                          {/* Edit Lesson Button */}
                                          <button
                                            onClick={() => openEditLessonModal(course, module, lesson)}
                                            className="btn btn-secondary btn-sm"
                                            style={{
                                              padding: '0.35rem 0.55rem',
                                              fontSize: '0.75rem'
                                            }}
                                            title="Edit lesson & media reference"
                                          >
                                            <Edit2 size={12} />
                                          </button>

                                          {/* Reorder Buttons */}
                                          <div
                                            style={{
                                              display: 'inline-flex',
                                              borderRadius: '4px',
                                              border: '1px solid var(--border-subtle)',
                                              overflow: 'hidden'
                                            }}
                                          >
                                            <button
                                              onClick={() => handleReorder(course.id, module.id, lesson.id, 'up')}
                                              disabled={isFirst}
                                              style={{
                                                background: '#FFFFFF',
                                                border: 'none',
                                                padding: '0.3rem 0.4rem',
                                                cursor: isFirst ? 'not-allowed' : 'pointer',
                                                opacity: isFirst ? 0.3 : 1,
                                                color: 'var(--color-plum)',
                                                display: 'flex',
                                                alignItems: 'center'
                                              }}
                                              title="Move Up"
                                            >
                                              <ArrowUp size={11} />
                                            </button>
                                            <button
                                              onClick={() => handleReorder(course.id, module.id, lesson.id, 'down')}
                                              disabled={isLast}
                                              style={{
                                                background: '#FFFFFF',
                                                borderLeft: '1px solid var(--border-subtle)',
                                                borderTop: 'none',
                                                borderBottom: 'none',
                                                borderRight: 'none',
                                                padding: '0.3rem 0.4rem',
                                                cursor: isLast ? 'not-allowed' : 'pointer',
                                                opacity: isLast ? 0.3 : 1,
                                                color: 'var(--color-plum)',
                                                display: 'flex',
                                                alignItems: 'center'
                                              }}
                                              title="Move Down"
                                            >
                                              <ArrowDown size={11} />
                                            </button>
                                          </div>

                                          {/* Delete Lesson Button */}
                                          <button
                                            onClick={() =>
                                              setDeleteConfirmModal({
                                                courseId: course.id,
                                                moduleId: module.id,
                                                lessonId: lesson.id,
                                                lessonTitle: lesson.title,
                                                courseTitle: course.title,
                                                moduleTitle: module.title
                                              })
                                            }
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              padding: '0.35rem 0.45rem',
                                              cursor: 'pointer',
                                              color: '#D0342C',
                                              borderRadius: '4px',
                                              display: 'flex',
                                              alignItems: 'center'
                                            }}
                                            title="Delete lesson"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: 13.3 OPTIONAL COMPACT CURRICULUM TABLE MODE */}
      {viewMode === 'table' && filteredData.courses.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.86rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-cream)',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  <th style={{ padding: '0.9rem 1rem' }}>Course & Module Context</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Lesson Title</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Video Reference</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Duration</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Access Tier</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.courses.flatMap(({ course, matchingModules }) =>
                  matchingModules.flatMap(({ module, matchingLessons }) =>
                    matchingLessons.map((lesson, lIdx) => {
                      const hasVideoRef =
                        lesson.videoReference && lesson.videoReference.trim().length > 0;
                      const scopedNumber = String(lesson.order || lIdx + 1).padStart(2, '0');

                      return (
                        <tr
                          key={lesson.id}
                          style={{
                            borderBottom: '1px solid #FAF0F2',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#FCF9FA';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          {/* Course & Module Context */}
                          <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.85rem' }}>
                              {course.title}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-berry)', marginTop: '0.15rem' }}>
                              {module.title}
                            </div>
                          </td>

                          {/* Lesson Title with Scoped Number */}
                          <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: 'var(--color-berry)',
                                  backgroundColor: 'var(--color-cream)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '3px',
                                  border: '1px solid var(--color-blush)'
                                }}
                              >
                                {scopedNumber}
                              </span>
                              <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                                {formatCleanTitle(lesson.title)}
                              </span>
                            </div>
                            {lesson.description && (
                              <div
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.2rem',
                                  maxWidth: '300px'
                                }}
                              >
                                {lesson.description}
                              </div>
                            )}
                          </td>

                          {/* Video Reference */}
                          <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  backgroundColor: hasVideoRef ? '#EFFBF4' : '#FFF2F4',
                                  color: hasVideoRef ? '#1B8754' : '#D0342C',
                                  border: `1px solid ${hasVideoRef ? '#D2F2E0' : '#F8D7DA'}`
                                }}
                              >
                                {hasVideoRef ? 'Reference Added' : 'Missing'}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                marginTop: '0.2rem',
                                maxWidth: '180px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={lesson.videoReference}
                            >
                              {formatShortVideoRef(lesson.videoReference)}
                            </div>
                          </td>

                          {/* Duration */}
                          <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', verticalAlign: 'top' }}>
                            {lesson.duration || 'Not set'}
                          </td>

                          {/* Access Tier */}
                          <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: lesson.isPreview ? 'var(--color-blush)' : 'transparent',
                                color: lesson.isPreview ? 'var(--color-berry)' : 'var(--text-muted)',
                                border: `1px solid ${lesson.isPreview ? 'var(--color-rose)' : 'var(--border-subtle)'}`
                              }}
                            >
                              {lesson.isPreview ? 'Free Preview' : 'Enrolled'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                onClick={() =>
                                  setPreviewLessonModal({
                                    lesson,
                                    course,
                                    module
                                  })
                                }
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                                title="Play Video"
                              >
                                <Play size={10} fill="var(--color-plum)" /> Play
                              </button>
                              <button
                                onClick={() => openEditLessonModal(course, module, lesson)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                                title="Edit"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirmModal({
                                    courseId: course.id,
                                    moduleId: module.id,
                                    lessonId: lesson.id,
                                    lessonTitle: lesson.title,
                                    courseTitle: course.title,
                                    moduleTitle: module.title
                                  })
                                }
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0.3rem',
                                  cursor: 'pointer',
                                  color: '#D0342C'
                                }}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. VIDEO PREVIEW MODAL */}
      {previewLessonModal && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewLessonModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(87,51,58,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '820px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.15rem 1.4rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                backgroundColor: 'var(--color-cream)',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: 'var(--color-berry)',
                      backgroundColor: 'var(--color-blush)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    {previewLessonModal.course.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-plum)', fontWeight: 500 }}>
                    {previewLessonModal.module.title}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.35rem',
                    color: 'var(--color-plum)',
                    fontWeight: 600,
                    margin: 0
                  }}
                >
                  {formatCleanTitle(previewLessonModal.lesson.title)}
                </h3>
              </div>

              <button
                onClick={() => setPreviewLessonModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-plum)',
                  padding: '0.25rem',
                  borderRadius: '6px'
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player or 9.2 Missing Media Fallback */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                backgroundColor: '#1A0E12'
              }}
            >
              {previewLessonModal.lesson.videoReference &&
              previewLessonModal.lesson.videoReference.trim().length > 0 ? (
                <video
                  controls
                  autoPlay
                  src={previewLessonModal.lesson.videoReference}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    padding: '2rem',
                    textAlign: 'center'
                  }}
                >
                  <AlertCircle size={42} color="var(--color-rose)" style={{ marginBottom: '1rem' }} />
                  <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                    No video reference has been configured for this lesson.
                  </h4>
                  <p style={{ color: '#DCA5AF', fontSize: '0.88rem', maxWidth: '420px', marginBottom: '1.25rem' }}>
                    Click below to set the MP4 video stream or hosting reference URL for this lesson.
                  </p>
                  <button
                    onClick={() => {
                      const { course, module, lesson } = previewLessonModal;
                      setPreviewLessonModal(null);
                      openEditLessonModal(course, module, lesson);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Edit2 size={13} /> Configure Video Reference
                  </button>
                </div>
              )}
            </div>

            {/* Media Metadata & Footer */}
            <div
              style={{
                padding: '1.15rem 1.4rem',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                fontSize: '0.84rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} color="var(--color-berry)" />
                  Duration: <strong style={{ color: 'var(--color-plum)' }}>{previewLessonModal.lesson.duration || 'Not set'}</strong>
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                  Access Tier:
                  <span
                    style={{
                      fontWeight: 600,
                      color: previewLessonModal.lesson.isPreview ? 'var(--color-berry)' : 'var(--color-plum)'
                    }}
                  >
                    {previewLessonModal.lesson.isPreview ? 'Free Teaser Preview' : 'Full Enrolled Curriculum'}
                  </span>
                </span>
              </div>

              {previewLessonModal.lesson.videoReference && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleCopyVideoUrl(previewLessonModal.lesson.videoReference)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                  >
                    {copiedUrl ? <Check size={13} color="#1B8754" /> : <Copy size={13} />}
                    {copiedUrl ? 'Copied' : 'Copy Reference URL'}
                  </button>

                  <button
                    onClick={() => {
                      const { course, module, lesson } = previewLessonModal;
                      setPreviewLessonModal(null);
                      openEditLessonModal(course, module, lesson);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10. EDIT / ADD LESSON MODAL */}
      {lessonFormModal && lessonFormModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setLessonFormModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(87,51,58,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--color-cream)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.35rem',
                    color: 'var(--color-plum)',
                    fontWeight: 600,
                    margin: 0
                  }}
                >
                  {lessonFormModal.mode === 'add' ? 'Add New Lesson' : 'Edit Lesson & Media Reference'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  {lessonFormModal.mode === 'add'
                    ? 'Attach a lesson to the selected module with video reference.'
                    : 'Modify lesson title, duration, video URL, or reassign parent module.'}
                </p>
              </div>
              <button
                onClick={() => setLessonFormModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveLessonForm} style={{ overflowY: 'auto', padding: '1.5rem' }}>
              {formError && (
                <div
                  style={{
                    backgroundColor: '#FFF2F4',
                    border: '1px solid #F8D7DA',
                    color: '#D0342C',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Course Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                    Parent Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={e => {
                      const newCourseId = e.target.value;
                      const c = courses.find(item => item.id === newCourseId);
                      const firstModId = c?.modules?.[0]?.id || '';
                      setFormData(prev => ({
                        ...prev,
                        courseId: newCourseId,
                        moduleId: firstModId
                      }));
                    }}
                    className="input-field"
                    style={{ fontSize: '0.88rem' }}
                    required
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                    Parent Module *
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={e => setFormData(prev => ({ ...prev, moduleId: e.target.value }))}
                    className="input-field"
                    style={{ fontSize: '0.88rem' }}
                    required
                  >
                    {courses
                      .find(c => c.id === formData.courseId)
                      ?.modules?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                  </select>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    The lesson will be sequenced automatically inside this module.
                  </span>
                </div>

                {/* Lesson Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Reverse Creaming & Sponge Chemistry"
                    className="input-field"
                    style={{ fontSize: '0.88rem' }}
                    required
                  />
                </div>

                {/* Lesson Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                    Lesson Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short summary of techniques and key takeaways taught in this video lesson..."
                    className="input-field"
                    style={{ fontSize: '0.88rem', resize: 'vertical' }}
                  />
                </div>

                {/* Video Reference Stream URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                    Video Reference / Stream URL
                  </label>
                  <input
                    type="text"
                    value={formData.videoReference}
                    onChange={e => setFormData(prev => ({ ...prev, videoReference: e.target.value }))}
                    placeholder="https://.../video.mp4 or stream reference"
                    className="input-field"
                    style={{ fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Provide an MP4 video URL or media hosting reference for client preview playback.
                  </span>
                </div>

                {/* Duration & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                      Duration (MM:SS) *
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="14:20"
                      className="input-field"
                      style={{ fontSize: '0.88rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-plum)' }}>
                      Publication Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="input-field"
                      style={{ fontSize: '0.88rem' }}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Free Preview Toggle */}
                <div
                  style={{
                    backgroundColor: 'var(--color-cream)',
                    borderRadius: '8px',
                    padding: '0.9rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                      Available as Free Teaser Preview
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Allow prospective students to preview this lesson prior to purchasing the full masterclass.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isPreview}
                    onChange={e => setFormData(prev => ({ ...prev, isPreview: e.target.checked }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--color-berry)'
                    }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setLessonFormModal(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {lessonFormModal.mode === 'add' ? 'Create Lesson' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. DELETE CONFIRMATION MODAL */}
      {deleteConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteConfirmModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(87,51,58,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#FFF2F4',
                color: '#D0342C',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                color: 'var(--color-plum)',
                marginBottom: '0.5rem',
                fontWeight: 600
              }}
            >
              Delete Lesson?
            </h3>

            <p style={{ color: 'var(--color-plum)', fontSize: '0.92rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              "{deleteConfirmModal.lessonTitle}"
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This lesson will be permanently removed from{' '}
              <strong>{deleteConfirmModal.courseTitle}</strong> →{' '}
              <strong>{deleteConfirmModal.moduleTitle}</strong>. Remaining module lessons will be renumbered and course duration totals updated.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLesson}
                style={{
                  backgroundColor: '#D0342C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
