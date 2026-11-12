import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { PhysicalProduct, ProductCategory } from '../../types';
import { ProductCard } from '../../components/shop/ProductCard';

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<PhysicalProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState<'featured' | 'newest' | 'price_asc' | 'price_desc'>(
    (searchParams.get('sort') as any) || 'featured'
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));

  useEffect(() => {
    ecommerceApi.getProductCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 280);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (category && category !== 'all') nextParams.set('category', category);
    if (debouncedSearch) nextParams.set('search', debouncedSearch);
    if (sort !== 'featured') nextParams.set('sort', sort);
    if (minPrice) nextParams.set('minPrice', minPrice);
    if (maxPrice) nextParams.set('maxPrice', maxPrice);
    if (inStockOnly) nextParams.set('inStock', 'true');
    if (page > 1) nextParams.set('page', String(page));
    setSearchParams(nextParams, { replace: true });
  }, [category, debouncedSearch, sort, minPrice, maxPrice, inStockOnly, page, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ecommerceApi
      .getProducts({
        category,
        search: debouncedSearch || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStock: inStockOnly || undefined,
        sort,
        page,
        limit: 9
      })
      .then(res => {
        if (!active) return;
        setProducts(res.products || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, debouncedSearch, minPrice, maxPrice, inStockOnly, sort, page]);

  const handleResetFilters = () => {
    setCategory('all');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSort('featured');
    setPage(1);
  };

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--color-cream)', padding: '3.5rem 0 5rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem auto' }}>
          <div className="section-eyebrow-badge" style={{ marginBottom: '0.9rem' }}>
            <span className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Cakexperiment Boutique Shop</span>
            <span className="section-eyebrow-line" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: 'var(--color-plum)', marginBottom: '0.65rem' }}>
            Artisan Cakes, Hampers & Studio Tools
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.65 }}>
            Explore handcrafted physical products crafted in small batches and curated studio essentials — with Cash on Delivery across India.
          </p>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => { setCategory('all'); setPage(1); }}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '999px',
              border: category === 'all' ? '1.5px solid var(--color-berry)' : '1px solid var(--border-subtle)',
              backgroundColor: category === 'all' ? 'var(--color-berry)' : '#FFFFFF',
              color: category === 'all' ? '#FFFFFF' : 'var(--color-plum)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            All Products
          </button>
          {categories.map(cat => {
            const active = category === cat.id || category === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategory(cat.id); setPage(1); }}
                style={{
                  padding: '0.5rem 1.2rem',
                  borderRadius: '999px',
                  border: active ? '1.5px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                  backgroundColor: active ? 'var(--color-berry)' : '#FFFFFF',
                  color: active ? '#FFFFFF' : 'var(--color-plum)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search, Price Filter & Sorting Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid var(--border-subtle)',
            padding: '1.1rem 1.35rem',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
            <input
              type="text"
              placeholder="Search cakes, hampers, tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.4rem', paddingRight: search ? '2.2rem' : '0.85rem' }}
            />
            <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Price Range + In Stock + Sort */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <SlidersHorizontal size={14} color="var(--color-berry)" />
              <input
                type="number"
                min={0}
                placeholder="Min ₹"
                value={minPrice}
                onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                className="input-field"
                style={{ width: '92px', padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
              />
              <span>–</span>
              <input
                type="number"
                min={0}
                placeholder="Max ₹"
                value={maxPrice}
                onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                className="input-field"
                style={{ width: '92px', padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.86rem', color: 'var(--color-plum)', fontWeight: 500, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => { setInStockOnly(e.target.checked); setPage(1); }}
              />
              In Stock Only
            </label>

            <select
              value={sort}
              onChange={e => { setSort(e.target.value as any); setPage(1); }}
              className="input-field"
              style={{ width: 'auto', minWidth: '175px', padding: '0.5rem 0.85rem', fontSize: '0.88rem' }}
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Count Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          <span>Showing {products.length} of {total} physical products</span>
          {(category !== 'all' || search || minPrice || maxPrice || inStockOnly) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: 'var(--color-berry)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading catalog from Neon PostgreSQL...
          </div>
        ) : products.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <ShoppingBag size={42} color="var(--color-rose)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--color-plum)', marginBottom: '0.5rem' }}>No Matching Products Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Try adjusting your search query, price range, or category selection.
            </p>
            <button type="button" onClick={handleResetFilters} className="btn btn-primary btn-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.8rem' }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-plum)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

