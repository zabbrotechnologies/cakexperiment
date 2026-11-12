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
      style={{
        padding: '6.5rem 0 5.5rem 0',
        backgroundColor: '#FFFFFF',
        scrollMarginTop: '6rem',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.75rem auto' }}>
          <div className="section-eyebrow-badge" style={{ marginBottom: '1rem' }}>
            <span className="section-eyebrow-line" />
            <span className="section-eyebrow-text">Studio Shop &amp; Artisanal Creations</span>
            <span className="section-eyebrow-line" />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)',
              color: 'var(--color-plum)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1rem'
            }}
          >
            Handcrafted Cakes, Chocolates & Studio Tools
          </h2>

          <p
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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.65rem',
            marginBottom: '2.75rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: activeCategory === 'all' ? '1.5px solid var(--color-berry)' : '1px solid #EEDCE0',
              backgroundColor: activeCategory === 'all' ? 'var(--color-berry)' : '#FFFFFF',
              color: activeCategory === 'all' ? '#FFFFFF' : 'var(--color-plum)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
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
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '999px',
                  border: isActive ? '1.5px solid var(--color-berry)' : '1px solid #EEDCE0',
                  backgroundColor: isActive ? 'var(--color-berry)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : 'var(--color-plum)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading physical store products from studio catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No active products found in this category yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem'
            }}
          >
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
    </section>
  );
};
