import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Check } from 'lucide-react';
import type { PhysicalProduct, ProductVariant } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useShopStore } from '../../store/useShopStore';

interface ProductCardProps {
  product: PhysicalProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, toggleWishlist, isInWishlist, setPendingAction, showToast } = useShopStore();

  const activeVariants = (product.variants || []).filter(v => v.isActive);
  const firstAvailableVariant =
    activeVariants.find(v => v.stock > 0) || activeVariants[0] || null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    firstAvailableVariant
  );
  const [adding, setAdding] = useState(false);

  // Deduplicated colours for swatch previews
  const colourSwatches: { colour: string; hex: string; variant: ProductVariant }[] = [];
  const seenColours = new Set<string>();
  for (const v of activeVariants) {
    if (v.colour && !seenColours.has(v.colour)) {
      seenColours.add(v.colour);
      colourSwatches.push({
        colour: v.colour,
        hex: v.colourHex || '#A95768',
        variant: v
      });
    }
  }

  const displayImage =
    selectedVariant?.image || product.images?.[0] || '/images/hero-cake.png';
  const unitPrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isAvailable = product.isActive && availableStock > 0;
  const wishlisted = isInWishlist(product.id, selectedVariant?.id);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;

    if (!isAuthenticated) {
      setPendingAction({
        type: 'ADD_TO_CART',
        productId: product.id,
        variantId: selectedVariant?.id || '',
        quantity: 1,
        returnTo: location.pathname
      });
      navigate('/signin', {
        state: {
          from: location.pathname,
          message: `Please sign in to add "${product.name}" to your shopping bag.`
        }
      });
      return;
    }

    setAdding(true);
    try {
      await addItem(product, selectedVariant, 1);
    } catch (err: any) {
      showToast(err.message || 'Could not add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setPendingAction({
        type: 'TOGGLE_WISHLIST',
        productId: product.id,
        variantId: selectedVariant?.id || '',
        returnTo: location.pathname
      });
      navigate('/signin', {
        state: {
          from: location.pathname,
          message: `Sign in to save "${product.name}" to your personal wishlist.`
        }
      });
      return;
    }

    try {
      await toggleWishlist(product.id, selectedVariant?.id || '');
    } catch (err: any) {
      showToast(err.message || 'Could not update wishlist.');
    }
  };

  return (
    <div
      className="cake-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
      }}
    >
      {/* Image & Overlays */}
      <Link
        to={`/shop/${product.slug}`}
        style={{
          position: 'relative',
          display: 'block',
          height: '240px',
          backgroundColor: 'var(--color-cream)',
          overflow: 'hidden'
        }}
      >
        <img
          src={displayImage}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: product.stock <= 0 ? 0.65 : 1,
            transition: 'transform 0.35s ease'
          }}
        />

        {/* Badges Top-Left */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {product.isExclusive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#57333A',
                color: '#FFE29A',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              EXCLUSIVE
            </span>
          )}
          {product.badge && !product.isExclusive && (
            <span
              style={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                color: 'var(--color-berry)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              {product.badge}
            </span>
          )}
          {product.stock <= 0 && (
            <span
              style={{
                backgroundColor: '#C62828',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '999px'
              }}
            >
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Toggle Top-Right */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255,255,255,0.94)',
            color: wishlisted ? '#D81B60' : 'var(--color-plum)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        >
          <Heart size={16} fill={wishlisted ? '#D81B60' : 'none'} />
        </button>
      </Link>

      {/* Body */}
      <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-berry)', fontWeight: 700, marginBottom: '0.35rem' }}>
          {product.categoryName || 'Artisan Shop'}
        </div>

        <Link
          to={`/shop/${product.slug}`}
          style={{
            fontSize: '1.08rem',
            fontWeight: 700,
            color: 'var(--color-plum)',
            lineHeight: 1.3,
            marginBottom: '0.65rem',
            textDecoration: 'none',
            fontFamily: 'var(--font-display)'
          }}
        >
          {product.name}
        </Link>

        {/* Colour Swatches only when multiple colour finishes exist */}
        {colourSwatches.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {colourSwatches.map(sw => {
              const isSelected = selectedVariant?.colour === sw.colour;
              return (
                <button
                  key={sw.colour}
                  type="button"
                  title={sw.colour}
                  onClick={() => setSelectedVariant(sw.variant)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: sw.hex,
                    border: isSelected ? '2px solid var(--color-plum)' : '1px solid rgba(0,0,0,0.18)',
                    outline: isSelected ? '2px solid #FFF' : 'none',
                    outlineOffset: '-3px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Pricing Row */}
        <div style={{ marginTop: 'auto', paddingTop: '0.6rem', borderTop: '1px solid #F7E8EC', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--color-plum)' }}>
              ₹{unitPrice.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > unitPrice && (
              <span style={{ fontSize: '0.88rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isAvailable ? '#2E7D32' : '#C62828' }}>
            {isAvailable ? (availableStock <= 5 ? `Only ${availableStock} left` : 'In Stock') : 'Unavailable'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={!isAvailable || adding}
            onClick={handleQuickAdd}
            className="btn btn-primary btn-sm"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              opacity: isAvailable ? 1 : 0.55,
              cursor: isAvailable ? 'pointer' : 'not-allowed'
            }}
          >
            {adding ? (
              <>
                <Check size={14} /> Adding...
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> {isAvailable ? 'Quick Add' : 'Sold Out'}
              </>
            )}
          </button>

          <Link
            to={`/shop/${product.slug}`}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.45rem 0.75rem' }}
            title="View Product Details"
          >
            <Eye size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

