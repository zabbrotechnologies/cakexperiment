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
    <div className="cake-card product-tile-card">
      {/* Image & Overlays */}
      <Link
        to={`/shop/${product.slug}`}
        className="product-tile-image-link"
      >
        <img
          src={displayImage}
          alt={product.name}
          className="product-tile-image"
          style={{
            opacity: product.stock <= 0 ? 0.65 : 1
          }}
        />

        {/* Badges Top-Left */}
        <div className="product-tile-badges">
          {product.isExclusive && (
            <span className="product-badge-exclusive">
              EXCLUSIVE
            </span>
          )}
          {product.badge && !product.isExclusive && (
            <span className="product-badge-custom">
              {product.badge}
            </span>
          )}
          {product.stock <= 0 && (
            <span className="product-badge-outofstock">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Toggle Top-Right */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="product-tile-wishlist-btn"
          style={{
            color: wishlisted ? '#D81B60' : 'var(--color-plum)'
          }}
        >
          <Heart size={16} className="product-wishlist-icon" fill={wishlisted ? '#D81B60' : 'none'} />
        </button>
      </Link>

      {/* Body */}
      <div className="product-tile-body">
        <div className="product-tile-category">
          {product.categoryName || 'Artisan Shop'}
        </div>

        <Link
          to={`/shop/${product.slug}`}
          className="product-tile-title"
        >
          {product.name}
        </Link>

        {/* Colour Swatches only when multiple colour finishes exist */}
        {colourSwatches.length > 1 && (
          <div className="product-tile-swatches">
            {colourSwatches.map(sw => {
              const isSelected = selectedVariant?.colour === sw.colour;
              return (
                <button
                  key={sw.colour}
                  type="button"
                  title={sw.colour}
                  onClick={() => setSelectedVariant(sw.variant)}
                  className={`product-tile-swatch-btn ${isSelected ? 'is-selected' : ''}`}
                  style={{
                    backgroundColor: sw.hex
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Pricing Row */}
        <div className="product-tile-price-row">
          <div className="product-tile-prices">
            <span className="product-tile-current-price">
              ₹{unitPrice.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > unitPrice && (
              <span className="product-tile-compare-price">
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span
            className="product-tile-stock-status"
            style={{ color: isAvailable ? '#2E7D32' : '#C62828' }}
          >
            {isAvailable ? (availableStock <= 5 ? `Only ${availableStock} left` : 'In Stock') : 'Unavailable'}
          </span>
        </div>

        {/* Actions */}
        <div className="product-tile-actions">
          <button
            type="button"
            disabled={!isAvailable || adding}
            onClick={handleQuickAdd}
            className="btn btn-primary btn-sm product-tile-quick-add"
            style={{
              opacity: isAvailable ? 1 : 0.55,
              cursor: isAvailable ? 'pointer' : 'not-allowed'
            }}
          >
            {adding ? (
              <>
                <Check size={13} /> <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} /> <span>{isAvailable ? 'Quick Add' : 'Sold Out'}</span>
              </>
            )}
          </button>

          <Link
            to={`/shop/${product.slug}`}
            className="btn btn-secondary btn-sm product-tile-view-btn"
            title="View Product Details"
          >
            <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
