import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  Info,
  Package
} from 'lucide-react';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { PhysicalProduct, ProductVariant } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useShopStore } from '../../store/useShopStore';
import { ProductCard } from '../../components/shop/ProductCard';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addItem, toggleWishlist, isInWishlist, setPendingAction, showToast, storeConfig } = useShopStore();

  const [product, setProduct] = useState<PhysicalProduct | null>(null);
  const [related, setRelated] = useState<PhysicalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setLoading(true);
    setNotFound(false);

    ecommerceApi
      .getProductDetail(slug)
      .then(data => {
        if (!mounted) return;
        const p = data.product;
        setProduct(p);
        setRelated(data.related || []);

        const activeVars = (p.variants || []).filter(v => v.isActive);
        const defaultVar = activeVars.find(v => v.stock > 0) || activeVars[0] || null;
        setSelectedColour(defaultVar?.colour || null);
        setSelectedSize(defaultVar?.size || null);
        setActiveImage(defaultVar?.image || p.images?.[0] || '/images/hero-cake.png');
        setQuantity(1);
      })
      .catch(() => {
        if (mounted) setNotFound(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const activeVariants = useMemo(
    () => (product?.variants || []).filter(v => v.isActive),
    [product]
  );

  // Unique colours and sizes
  const colours = useMemo(() => {
    const map = new Map<string, { colour: string; hex: string; image: string | null }>();
    for (const v of activeVariants) {
      if (v.colour && !map.has(v.colour)) {
        map.set(v.colour, {
          colour: v.colour,
          hex: v.colourHex || '#A95768',
          image: v.image || null
        });
      }
    }
    return Array.from(map.values());
  }, [activeVariants]);

  const sizes = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const v of activeVariants) {
      if (v.size && !seen.has(v.size)) {
        seen.add(v.size);
        list.push(v.size);
      }
    }
    return list;
  }, [activeVariants]);

  // Resolve exact selected variant matching selectedColour & selectedSize
  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (activeVariants.length === 0) return null;
    const exact = activeVariants.find(
      v =>
        (colours.length === 0 || v.colour === selectedColour) &&
        (sizes.length === 0 || v.size === selectedSize)
    );
    if (exact) return exact;
    // Fallback to matching colour if exact size not available for that colour
    if (selectedColour) {
      const byCol = activeVariants.find(v => v.colour === selectedColour);
      if (byCol) return byCol;
    }
    return activeVariants[0] || null;
  }, [activeVariants, selectedColour, selectedSize, colours.length, sizes.length]);

  const galleryImages = useMemo(() => {
    const list = new Set<string>(product?.images || []);
    for (const v of activeVariants) {
      if (v.image) list.add(v.image);
    }
    return Array.from(list);
  }, [product, activeVariants]);

  const handleSelectColour = (colour: string) => {
    setSelectedColour(colour);
    // Find a variant for this colour (preferring currently selected size if available)
    const matchExact = activeVariants.find(v => v.colour === colour && v.size === selectedSize);
    const matchFirst = activeVariants.find(v => v.colour === colour && v.stock > 0) || activeVariants.find(v => v.colour === colour);
    const chosen = matchExact || matchFirst;
    if (chosen) {
      if (chosen.size) setSelectedSize(chosen.size);
      if (chosen.image) setActiveImage(chosen.image);
      setQuantity(q => Math.min(q, Math.max(1, chosen.stock)));
    }
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    const chosen =
      activeVariants.find(v => v.size === size && (colours.length === 0 || v.colour === selectedColour)) ||
      activeVariants.find(v => v.size === size);
    if (chosen) {
      if (chosen.colour) setSelectedColour(chosen.colour);
      if (chosen.image) setActiveImage(chosen.image);
      setQuantity(q => Math.min(q, Math.max(1, chosen.stock)));
    }
  };

  const handleThumbnailClick = (imgUrl: string) => {
    setActiveImage(imgUrl);
    // If this thumbnail maps to a specific variant colour, switch to it cleanly
    const matchingVar = activeVariants.find(v => v.image === imgUrl);
    if (matchingVar) {
      if (matchingVar.colour) setSelectedColour(matchingVar.colour);
      if (matchingVar.size) {
        const sameSize = activeVariants.find(v => v.image === imgUrl && v.size === selectedSize);
        if (!sameSize) setSelectedSize(matchingVar.size);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading product details from Neon PostgreSQL...
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h2 style={{ color: 'var(--color-plum)', marginBottom: '0.6rem' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          This product may have been archived or is no longer available.
        </p>
        <Link to="/shop" className="btn btn-primary">
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const unitPrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isAvailable = product.isActive && availableStock > 0;
  const wishlisted = isInWishlist(product.id, selectedVariant?.id);

  const handleAddToCart = async () => {
    if (!isAvailable) return;
    if (!isAuthenticated) {
      setPendingAction({
        type: 'ADD_TO_CART',
        productId: product.id,
        variantId: selectedVariant?.id || '',
        quantity,
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
      await addItem(product, selectedVariant, quantity);
    } catch (err: any) {
      showToast(err.message || 'Could not add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
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
          message: `Sign in to save "${product.name}" to your wishlist.`
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
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--color-cream)', padding: '2.5rem 0 5rem 0' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-berry)', fontWeight: 600 }}>
            <ChevronLeft size={16} /> Back to Shop
          </Link>
          <span style={{ color: 'var(--text-light)' }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{product.categoryName || 'Products'}</span>
          <span style={{ color: 'var(--text-light)' }}>/</span>
          <span style={{ color: 'var(--color-plum)', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Main Product Showcase */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            padding: 'clamp(1.5rem, 3vw, 2.75rem)',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.75rem',
            marginBottom: '4rem'
          }}
        >
          {/* Gallery Column */}
          <div>
            <div style={{ borderRadius: '18px', overflow: 'hidden', backgroundColor: 'var(--color-cream)', aspectRatio: '4/4', border: '1px solid var(--border-subtle)' }}>
              <img
                src={activeImage || product.images?.[0] || '/images/hero-cake.png'}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbnailClick(imgUrl)}
                    style={{
                      width: '72px',
                      height: '72px',
                      padding: 0,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: activeImage === imgUrl ? '2.5px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      backgroundColor: '#FFF'
                    }}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-berry)', backgroundColor: 'var(--color-blush)', padding: '0.28rem 0.75rem', borderRadius: '999px' }}>
                {product.categoryName || 'Artisan Product'}
              </span>
              {product.isExclusive && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', fontWeight: 700, backgroundColor: 'var(--color-plum)', color: '#FFE29A', padding: '0.28rem 0.75rem', borderRadius: '999px' }}>
                  Studio Exclusive
                </span>
              )}
              {selectedVariant?.sku && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                  SKU: {selectedVariant.sku}
                </span>
              )}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 3.2vw, 2.5rem)', color: 'var(--color-plum)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Dynamic Variant Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--color-plum)' }}>
                ₹{unitPrice.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && product.compareAtPrice > unitPrice && (
                <>
                  <span style={{ fontSize: '1.15rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                    ₹{product.compareAtPrice.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                    SAVE ₹{(product.compareAtPrice - unitPrice).toLocaleString('en-IN')}
                  </span>
                </>
              )}
              {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  (Base ₹{product.basePrice.toLocaleString('en-IN')} + ₹{selectedVariant.priceAdjustment.toLocaleString('en-IN')} option)
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            {/* Colour Selector */}
            {activeVariants.length > 1 && colours.length > 1 && (
              <div style={{ marginBottom: '1.35rem' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '0.55rem' }}>
                  Colour / Finish: <span style={{ color: 'var(--color-berry)' }}>{selectedColour}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {colours.map(c => {
                    const active = selectedColour === c.colour;
                    return (
                      <button
                        key={c.colour}
                        type="button"
                        onClick={() => handleSelectColour(c.colour)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0.9rem',
                          borderRadius: '10px',
                          border: active ? '2px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                          backgroundColor: active ? '#FFF5F7' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--color-plum)'
                        }}
                      >
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c.hex, border: '1px solid rgba(0,0,0,0.2)' }} />
                        <span>{c.colour}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {activeVariants.length > 1 && sizes.length > 1 && (
              <div style={{ marginBottom: '1.35rem' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-plum)', marginBottom: '0.55rem' }}>
                  Size / Edition: <span style={{ color: 'var(--color-berry)' }}>{selectedSize}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {sizes.map(sz => {
                    const variantForSize =
                      activeVariants.find(
                        v => v.size === sz && (colours.length === 0 || v.colour === selectedColour)
                      ) || activeVariants.find(v => v.size === sz);
                    const availableForThisCombo = variantForSize ? variantForSize.stock > 0 : false;
                    const existsForColour = activeVariants.some(
                      v => v.size === sz && (colours.length === 0 || v.colour === selectedColour)
                    );
                    const active = selectedSize === sz;
                    const disabled = !variantForSize || (!existsForColour && colours.length > 0) || !availableForThisCombo;

                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectSize(sz)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '10px',
                          border: active ? '2px solid var(--color-berry)' : '1px solid var(--border-subtle)',
                          backgroundColor: disabled ? '#F5F3F3' : active ? 'var(--color-berry)' : '#FFFFFF',
                          color: disabled ? '#ACA2A4' : active ? '#FFFFFF' : 'var(--color-plum)',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          textDecoration: disabled ? 'line-through' : 'none'
                        }}
                      >
                        {sz}
                        {variantForSize && variantForSize.priceAdjustment > 0 && (
                          <span style={{ marginLeft: '0.35rem', fontSize: '0.76rem', opacity: 0.85 }}>
                            (+₹{variantForSize.priceAdjustment})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Indicator */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: isAvailable ? '#2E7D32' : '#C62828' }}>
              <Package size={16} />
              {isAvailable ? (
                <span>In Stock — {availableStock} available</span>
              ) : (
                <span>Currently Out of Stock for this option</span>
              )}
            </div>

            {/* Quantity + Add to Cart + Wishlist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid var(--border-subtle)', borderRadius: '12px', backgroundColor: '#FFF' }}>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={!isAvailable || quantity <= 1}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ padding: '0.75rem 0.9rem', background: 'none', border: 'none', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', color: 'var(--color-plum)' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ padding: '0 0.9rem', fontWeight: 700, fontSize: '1rem', color: 'var(--color-plum)' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={!isAvailable || quantity >= availableStock}
                  onClick={() => setQuantity(q => Math.min(availableStock, q + 1))}
                  style={{ padding: '0.75rem 0.9rem', background: 'none', border: 'none', cursor: quantity >= availableStock ? 'not-allowed' : 'pointer', color: 'var(--color-plum)' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                disabled={!isAvailable || adding}
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, minWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {adding ? <Check size={18} /> : <ShoppingBag size={18} />}
                <span>{isAvailable ? (adding ? 'Adding to Cart...' : 'Add to Cart') : 'Unavailable'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className="btn btn-secondary btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', color: wishlisted ? '#D81B60' : 'var(--color-plum)' }}
              >
                <Heart size={18} fill={wishlisted ? '#D81B60' : 'none'} />
                <span>{wishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            {/* Product Info & Delivery Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}>
              {product.productInfo && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--color-plum)' }}>
                  <Info size={17} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Product Information:</strong> <span style={{ color: 'var(--text-muted)' }}>{product.productInfo}</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--color-plum)' }}>
                <Truck size={17} color="var(--color-berry)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Delivery Information:</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>
                    {product.deliveryInfo || `Standard (${storeConfig.standardDeliveryDaysMin}–${storeConfig.standardDeliveryDaysMax} business days) or Express (${storeConfig.expressDeliveryDaysMin}–${storeConfig.expressDeliveryDaysMax} business days). Free Standard Delivery on orders ₹${storeConfig.freeShippingThreshold.toLocaleString('en-IN')}+.`}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--color-plum)' }}>
                <ShieldCheck size={17} color="#2E7D32" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Payment Method:</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>Cash on Delivery (Pay at your doorstep when delivered)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-plum)', marginBottom: '1.5rem' }}>
              You May Also Love
            </h2>
            <div className="products-grid">
              {related.map(r => (
                <ProductCard key={r.id} product={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

