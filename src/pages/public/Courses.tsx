import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Course } from '../../types';
import {
  Search,
  Filter,
  X,
  Star,
  Clock,
  Sparkles,
  ChevronDown,
  RotateCcw,
  BookOpen,
  ChefHat,
  Palette,
  Flame,
  Cake,
  Wand2,
  Check
} from 'lucide-react';

export const Courses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasCourseAccess } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');
  const [purchasedOnly, setPurchasedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(6);

  const categories = useMemo(() => storageService.getCategories(), []);
  const allCourses = useMemo(() => storageService.getCourses(), []);

  // Category course count map (only counting active/published courses)
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allCourses.forEach(c => {
      if (c.categoryId) {
        map[c.categoryId] = (map[c.categoryId] || 0) + 1;
      }
    });
    return map;
  }, [allCourses]);

  // Category Icon Resolver
  const getCategoryIcon = (slugOrId: string) => {
    switch (slugOrId) {
      case 'cake-baking':
      case 'cat-1':
        return <ChefHat size={16} />;
      case 'cake-decorating':
      case 'cat-2':
        return <Palette size={16} />;
      case 'fondant-art':
      case 'cat-3':
        return <Wand2 size={16} />;
      case 'chocolate-techniques':
      case 'cat-4':
        return <Flame size={16} />;
      case 'cupcakes-and-desserts':
      case 'cat-5':
        return <Cake size={16} />;
      case 'celebration-cakes':
      case 'cat-6':
        return <Sparkles size={16} />;
      default:
        return <BookOpen size={16} />;
    }
  };

  // Filter & Sort Logic
  const filteredCourses = useMemo(() => {
    return allCourses
      .filter(course => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = course.title.toLowerCase().includes(query);
          const matchesDesc = (course.shortDescription || '').toLowerCase().includes(query);
          const matchesCategory = (course.categoryName || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
        }

        // 2. Category
        if (selectedCategory !== 'all') {
          const cat = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
          if (cat && course.categoryId !== cat.id) {
            return false;
          }
        }

        // 3. Skill Level
        if (selectedLevel !== 'all' && course.skillLevel !== selectedLevel) {
          return false;
        }

        // 4. Price Filter
        if (selectedPriceFilter === 'under-500' && course.price > 499) return false;
        if (selectedPriceFilter === '500-1000' && (course.price < 500 || course.price > 1000)) return false;
        if (selectedPriceFilter === 'above-1000' && course.price <= 1000) return false;

        // 5. Duration
        if (selectedDuration === 'short' && !course.totalDuration?.includes('1h') && !course.totalDuration?.includes('50m'))
          return false;
        if (selectedDuration === 'medium' && !course.totalDuration?.includes('2h')) return false;
        if (selectedDuration === 'long' && !course.totalDuration?.includes('3h')) return false;

        // 6. Purchased status
        if (purchasedOnly && user) {
          const isEnrolled = hasCourseAccess(course.id);
          if (!isEnrolled) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price-low') {
          return a.price - b.price;
        }
        if (sortBy === 'price-high') {
          return b.price - a.price;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'popular') {
          return b.reviewCount - a.reviewCount;
        }
        // default: recommended (featured first)
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [
    allCourses,
    categories,
    searchQuery,
    selectedCategory,
    selectedLevel,
    selectedPriceFilter,
    selectedDuration,
    purchasedOnly,
    sortBy,
    user,
    hasCourseAccess
  ]);

  const activeCourses = filteredCourses.slice(0, displayCount);

  // Category Selection Handler with URL Sync
  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setDisplayCount(6);
    const newParams = new URLSearchParams(searchParams);
    if (catSlug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catSlug);
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedDuration('all');
    setSelectedPriceFilter('all');
    setPurchasedOnly(false);
    setSortBy('recommended');
    setSearchParams({});
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    selectedDuration !== 'all' ||
    selectedPriceFilter !== 'all' ||
    purchasedOnly;

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Catalogue Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-subtle)',
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem'
        }}
      >
        <div className="container">
          {/* Breadcrumb */}
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-light)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Link to="/" style={{ color: 'var(--color-berry)', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--color-plum)', fontWeight: 500 }}>Academy Courses</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '1.5rem'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--color-berry)',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.35rem'
                }}
              >
                Curriculum Directory
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
                  color: 'var(--color-plum)',
                  margin: '0 0 0.5rem 0',
                  lineHeight: 1.15
                }}
              >
                Explore Masterclasses
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: '600px', margin: 0 }}>
                Learn bespoke baking, piping, sugar art, and cake architecture through structured video masterclasses
                led by French-trained pastry chefs.
              </p>
            </div>

            {/* Live Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <input
                type="text"
                placeholder="Search lessons, topics, instructors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: '2.6rem',
                  paddingRight: searchQuery ? '2.4rem' : '1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  backgroundColor: 'var(--color-cream)',
                  borderColor: searchQuery ? 'var(--color-berry)' : 'var(--border-subtle)'
                }}
              />
              <Search
                size={16}
                color="var(--color-berry)"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-light)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Course Grid Area */}
      <div className="container" style={{ marginTop: '2rem' }}>
        {/* Top Control Bar: Result count & Sort Dropdown */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-plum)' }}>
              Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
            </span>
            {selectedCategory !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--color-berry)',
                  backgroundColor: 'var(--color-blush)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {categories.find(c => c.slug === selectedCategory || c.id === selectedCategory)?.name ||
                  'Filtered Category'}
                <button
                  onClick={() => handleSelectCategory('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-berry)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove category filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile Filter Button (opens drawer) */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="btn btn-secondary btn-sm mobile-filter-trigger"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem'
              }}
            >
              <Filter size={14} /> Filter & Tracks
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  color: 'var(--color-plum)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Swipeable Category Bar (Visible only on mobile/tablet) */}
        <div className="mobile-category-bar" style={{ display: 'none', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: selectedCategory === 'all' ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: selectedCategory === 'all' ? '1px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                backgroundColor: selectedCategory === 'all' ? 'var(--color-berry)' : '#FFFFFF',
                color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--color-plum)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <BookOpen size={14} />
              All Courses ({allCourses.length})
            </button>
            {categories.map(cat => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(isSelected ? 'all' : cat.slug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--color-berry)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--color-plum)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {getCategoryIcon(cat.slug || cat.id)}
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT: Desktop Category Sidebar + Course Results Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '250px 1fr',
            gap: '2.25rem',
            alignItems: 'start'
          }}
          className="catalogue-layout"
        >
          {/* DESKTOP VERTICAL CATEGORY & FILTER SIDEBAR */}
          <aside className="desktop-category-sidebar" aria-label="Course categories and filters">
            {/* Panel 1: Vertical Category Navigation */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem 1rem',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.5rem'
              }}
            >
              {/* Category Sidebar Title */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.75rem',
                  marginBottom: '0.6rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--color-plum)',
                      margin: 0
                    }}
                  >
                    Curriculum Tracks
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filter by subject category</span>
                </div>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleSelectCategory('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-berry)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px'
                    }}
                    title="View all courses"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Vertical Category Items */}
              <nav aria-label="Categories" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {/* All Courses Option */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="category-nav-btn"
                  style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                    fontWeight: selectedCategory === 'all' ? 600 : 500,
                    backgroundColor: selectedCategory === 'all' ? '#FBF0F2' : 'transparent',
                    color: selectedCategory === 'all' ? 'var(--color-berry)' : 'var(--color-plum)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  aria-pressed={selectedCategory === 'all'}
                >
                  {/* Active Indicator Accent Bar */}
                  {selectedCategory === 'all' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        height: '70%',
                        width: '3.5px',
                        backgroundColor: 'var(--color-berry)',
                        borderRadius: '0 4px 4px 0'
                      }}
                    />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        color: selectedCategory === 'all' ? 'var(--color-berry)' : 'var(--color-rose)',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <BookOpen size={16} />
                    </span>
                    <span>All Courses</span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: selectedCategory === 'all' ? 'var(--color-blush)' : '#F5EDEF',
                      color: selectedCategory === 'all' ? 'var(--color-berry)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {allCourses.length}
                  </span>
                </button>

                {/* Individual Categories */}
                {categories.map(cat => {
                  const count = categoryCounts[cat.id] || 0;
                  const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(isSelected ? 'all' : cat.slug)}
                      className="category-nav-btn"
                      style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 600 : 500,
                        backgroundColor: isSelected ? '#FBF0F2' : 'transparent',
                        color: isSelected ? 'var(--color-berry)' : 'var(--color-plum)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      aria-pressed={isSelected}
                    >
                      {/* Active Indicator Accent Bar */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '15%',
                            height: '70%',
                            width: '3.5px',
                            backgroundColor: 'var(--color-berry)',
                            borderRadius: '0 4px 4px 0'
                          }}
                        />
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            color: isSelected ? 'var(--color-berry)' : 'var(--color-rose)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {getCategoryIcon(cat.slug || cat.id)}
                        </span>
                        <span>{cat.name}</span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isSelected ? 'var(--color-blush)' : '#F5EDEF',
                          color: isSelected ? 'var(--color-berry)' : 'var(--text-muted)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Panel 2: Secondary Refinements (Level, Price, Duration) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.6rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-plum)', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}>
                  <Filter size={15} color="var(--color-berry)" />
                  Filter Options
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-berry)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
              </div>

              {/* Skill Level Filter */}
              <div style={{ marginBottom: '1.4rem' }}>
                <h4
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-plum)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.65rem'
                  }}
                >
                  Skill Level
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                  {['all', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'].map(level => (
                    <label
                      key={level}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        cursor: 'pointer',
                        color: selectedLevel === level ? 'var(--color-plum)' : 'var(--text-muted)',
                        fontWeight: selectedLevel === level ? 600 : 400
                      }}
                    >
                      <input
                        type="radio"
                        name="level"
                        checked={selectedLevel === level}
                        onChange={() => setSelectedLevel(level)}
                        style={{ accentColor: 'var(--color-berry)', width: '15px', height: '15px' }}
                      />
                      <span>{level === 'all' ? 'All Skill Levels' : level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div style={{ marginBottom: '1.4rem' }}>
                <h4
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-plum)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.65rem'
                  }}
                >
                  Price Range
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-500', label: 'Under ₹500 (Default ₹499)' },
                    { id: '500-1000', label: '₹500 - ₹1,000' },
                    { id: 'above-1000', label: '₹1,000+' }
                  ].map(p => (
                    <label
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        cursor: 'pointer',
                        color: selectedPriceFilter === p.id ? 'var(--color-plum)' : 'var(--text-muted)',
                        fontWeight: selectedPriceFilter === p.id ? 600 : 400
                      }}
                    >
                      <input
                        type="radio"
                        name="priceFilter"
                        checked={selectedPriceFilter === p.id}
                        onChange={() => setSelectedPriceFilter(p.id)}
                        style={{ accentColor: 'var(--color-berry)', width: '15px', height: '15px' }}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
              <div style={{ marginBottom: '1.4rem' }}>
                <h4
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-plum)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.65rem'
                  }}
                >
                  Total Duration
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                  {[
                    { id: 'all', label: 'Any Duration' },
                    { id: 'short', label: 'Under 2 Hours' },
                    { id: 'medium', label: '2 - 3 Hours' },
                    { id: 'long', label: '3+ Hours Masterclass' }
                  ].map(d => (
                    <label
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        cursor: 'pointer',
                        color: selectedDuration === d.id ? 'var(--color-plum)' : 'var(--text-muted)',
                        fontWeight: selectedDuration === d.id ? 600 : 400
                      }}
                    >
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === d.id}
                        onChange={() => setSelectedDuration(d.id)}
                        style={{ accentColor: 'var(--color-berry)', width: '15px', height: '15px' }}
                      />
                      <span>{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Signed-in user filter: Enrolled vs Unenrolled */}
              {user && (
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      color: 'var(--color-plum)',
                      fontWeight: 500
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={purchasedOnly}
                      onChange={e => setPurchasedOnly(e.target.checked)}
                      style={{ accentColor: 'var(--color-berry)', width: '15px', height: '15px' }}
                    />
                    <span>My Enrolled Courses Only</span>
                  </label>
                </div>
              )}
            </div>
          </aside>

          {/* COURSE RESULTS GRID AREA */}
          <main aria-label="Course results">
            {filteredCourses.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blush)',
                    color: 'var(--color-berry)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem auto'
                  }}
                >
                  <Search size={26} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.6rem',
                    color: 'var(--color-plum)',
                    marginBottom: '0.5rem'
                  }}
                >
                  No Courses Found
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
                  We couldn't find any courses matching your selected curriculum track or filter criteria.
                </p>
                <button onClick={resetFilters} className="btn btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  key={`${selectedCategory}-${selectedLevel}-${selectedPriceFilter}-${selectedDuration}-${sortBy}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.75rem'
                  }}
                >
                  {activeCourses.map(course => {
                    const isEnrolled = user ? hasCourseAccess(course.id) : false;
                    return (
                      <div
                        key={course.id}
                        className="cake-card course-card-animated"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle)',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                      >
                        {/* Cover Image */}
                        <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.4rem' }}>
                            <span className="badge badge-berry">{course.skillLevel}</span>
                            {isEnrolled && (
                              <span className="badge" style={{ backgroundColor: '#2E7D32', color: '#FFF' }}>
                                Enrolled
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '12px',
                              right: '12px',
                              backgroundColor: 'rgba(255, 255, 255, 0.94)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: 'var(--color-plum)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                            }}
                          >
                            <Clock size={12} color="var(--color-berry)" />
                            {course.totalDuration}
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.5rem',
                              fontSize: '0.78rem'
                            }}
                          >
                            <span style={{ color: 'var(--color-berry)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {course.categoryName}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#B36B00', fontWeight: 600 }}>
                              <Star size={13} fill="#FFB800" color="#FFB800" />
                              <span>{course.rating.toFixed(1)}</span>
                              <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>({course.reviewCount})</span>
                            </div>
                          </div>

                          <h3
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '1.25rem',
                              marginBottom: '0.5rem',
                              lineHeight: 1.28
                            }}
                          >
                            <Link
                              to={`/courses/${course.slug}`}
                              style={{ color: 'var(--color-plum)', textDecoration: 'none' }}
                            >
                              {course.title}
                            </Link>
                          </h3>

                          <p
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.86rem',
                              lineHeight: 1.5,
                              marginBottom: '1.2rem',
                              flex: 1
                            }}
                          >
                            {course.shortDescription}
                          </p>

                          {/* Price & Action */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '1rem',
                              borderTop: '1px solid var(--border-subtle)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Masterclass Fee
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                                  {storageService.formatINR(course.price)}
                                </span>
                                {course.originalPrice && (
                                  <span style={{ fontSize: '0.82rem', textDecoration: 'line-through', color: 'var(--text-light)' }}>
                                    {storageService.formatINR(course.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isEnrolled ? (
                              <Link
                                to={`/learn/${course.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: '#2E7D32', color: '#2E7D32' }}
                              >
                                Go to Class &rarr;
                              </Link>
                            ) : (
                              <Link to={`/courses/${course.slug}`} className="btn btn-primary btn-sm">
                                View Details &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {filteredCourses.length > displayCount && (
                  <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <button
                      onClick={() => setDisplayCount(prev => prev + 6)}
                      className="btn btn-secondary btn-lg"
                      style={{ padding: '0.75rem 2rem' }}
                    >
                      Load More Masterclasses
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTER & CATEGORY SLIDE-OVER DRAWER */}
      {mobileFilterOpen && (
        <div
          className="modal-overlay"
          onClick={() => setMobileFilterOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(87,51,58,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            style={{
              width: '85%',
              maxWidth: '360px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem'
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--color-plum)', margin: 0 }}>
                Categories & Filters
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Category Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-plum)', marginBottom: '0.75rem' }}>
                Curriculum Track
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCategory('all');
                    setMobileFilterOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.86rem',
                    fontWeight: selectedCategory === 'all' ? 600 : 400,
                    backgroundColor: selectedCategory === 'all' ? '#FBF0F2' : '#FFFFFF',
                    color: selectedCategory === 'all' ? 'var(--color-berry)' : 'var(--color-plum)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={15} /> All Courses
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{allCourses.length}</span>
                </button>
                {categories.map(cat => {
                  const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        handleSelectCategory(cat.slug);
                        setMobileFilterOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        fontWeight: isSelected ? 600 : 400,
                        backgroundColor: isSelected ? '#FBF0F2' : '#FFFFFF',
                        color: isSelected ? 'var(--color-berry)' : 'var(--color-plum)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getCategoryIcon(cat.slug || cat.id)} {cat.name}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{categoryCounts[cat.id] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Skill Level */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-plum)', marginBottom: '0.75rem' }}>
                Skill Level
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['all', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'].map(level => (
                  <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.86rem' }}>
                    <input
                      type="radio"
                      name="mLevel"
                      checked={selectedLevel === level}
                      onChange={() => setSelectedLevel(level)}
                      style={{ accentColor: 'var(--color-berry)' }}
                    />
                    <span>{level === 'all' ? 'All Skill Levels' : level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                Reset
              </button>
              <button onClick={() => setMobileFilterOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS for Responsive Layout & Micro-animations */}
      <style>{`
        .category-nav-btn:hover {
          background-color: rgba(244, 221, 224, 0.4) !important;
          color: var(--color-berry) !important;
        }

        .category-nav-btn:focus-visible {
          outline: 2px solid var(--color-berry);
          outline-offset: 2px;
        }

        .course-card-animated {
          animation: fadeInCourse 0.22s ease-out;
        }

        @keyframes fadeInCourse {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .course-card-animated {
            animation: none !important;
            transition: none !important;
          }
          .category-nav-btn {
            transition: none !important;
          }
        }

        @media (max-width: 860px) {
          .catalogue-layout {
            grid-template-columns: 1fr !important;
          }
          .desktop-category-sidebar {
            display: none !important;
          }
          .mobile-filter-trigger {
            display: inline-flex !important;
          }
          .mobile-category-bar {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
