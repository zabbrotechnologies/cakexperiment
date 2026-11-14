import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cake, ArrowRight, ShoppingBag } from 'lucide-react';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { PhysicalProduct, ProductCategory } from '../../types';
import { ProductCard } from '../shop/ProductCard';

export const BakeryProductsSection: React.FC = () => {
  const [products, setProducts] = useState<PhysicalProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      ecommerceApi.getProductCategories().catch(() => []),
      ecommerceApi.getProducts({ sort: 'featured', limit: 8 }).catch(() => ({ products: [] }))
    ])
      .then(([cats, prodRes]) => {
        if (!mounted) return;
        setCategories(cats);
        setProducts(prodRes.products || []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter(p => p.categoryId === activeCategory);

  return (
    <section
      id="products"
      className="bakery-products-section"
      style={{
        padding: '6.5rem 0 5.5rem 0',
        backgroundColor: '#FFFFFF',
        scrollMarginTop: '6rem',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div className="bakery-section-header" style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.75rem auto' }}>
          <div className="section-eyebrow-badge" style={{ marginBottom: '1rem' }}>
            <span className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Studio Shop &amp; Artisanal Creations</span>
            <span className="section-eyebrow-line" />
          </div>

          <h2
            className="bakery-section-title"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)',
              color: 'var(--color-plum)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1rem'
            }}
          >
            Handcrafted Cakes, Chocolates &amp; Studio Tools
          </h2>

          <p
            className="bakery-section-desc"
            style={{
              fontSize: '1rem',
              color: '#6F5B60',
              lineHeight: 1.6,
              maxWidth: '580px',
              margin: '0 auto'
            }}
          >
            Handcrafted cakes, chocolates, hampers, and studio essentials — Cash on Delivery across India.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="bakery-filter-pills">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`bakery-filter-pill-btn ${activeCategory === 'all' ? 'is-active' : ''}`}
          >
            All Featured
          </button>
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`bakery-filter-pill-btn ${isActive ? 'is-active' : ''}`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Product Grid — Desktop Auto-fill & Mobile 2x2 Tiles */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading physical store products from studio catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No active products found in this category yet.
          </div>
        ) : (
          <div className="bakery-products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Explore Full Shop CTA */}
        <div style={{ textAlign: 'center', marginTop: '3.25rem' }}>
          <Link
            to="/shop"
            className="btn btn-primary btn-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
          >
            <ShoppingBag size={18} />
            <span>Explore Full Shop Catalog</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <style>{`
        /* Filter Pills Desktop */
        .bakery-filter-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.65rem;
          margin-bottom: 2.75rem;
        }
        .bakery-filter-pill-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          border: 1px solid #EEDCE0;
          background-color: #FFFFFF;
          color: var(--color-plum);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .bakery-filter-pill-btn:hover {
          border-color: var(--color-berry);
          color: var(--color-berry);
        }
        .bakery-filter-pill-btn.is-active {
          border: 1.5px solid var(--color-berry);
          background-color: var(--color-berry);
          color: #FFFFFF;
        }

        /* Products Grid Desktop */
        .bakery-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.75rem;
        }

        /* Mobile View: 2x2 Grid Tiles Shape Only on Mobile */
        @media (max-width: 640px) {
          .bakery-products-section {
            padding: 3.8rem 0 3.5rem 0 !important;
          }
          .bakery-section-header {
            margin-bottom: 1.8rem !important;
          }
          .bakery-filter-pills {
            justify-content: flex-start !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            padding-bottom: 0.4rem !important;
            margin-bottom: 1.6rem !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch;
          }
          .bakery-filter-pills::-webkit-scrollbar {
            display: none;
          }
          .bakery-filter-pill-btn {
            flex-shrink: 0 !important;
            padding: 0.4rem 0.95rem !important;
            font-size: 0.8rem !important;
          }

          /* Explicit 2x2 2-column tiles layout */
          .bakery-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }

        @media (max-width: 360px) {
          .bakery-products-grid {
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </section>
  );
};
