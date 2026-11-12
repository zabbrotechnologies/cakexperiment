import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useShopStore } from '../../store/useShopStore';

export const WishlistPage: React.FC = () => {
  const { wishlistItems, toggleWishlist, addItem, showToast } = useShopStore();

  const handleMoveToCart = async (w: any) => {
    if (!w.product) return;
    try {
      await addItem(w.product, w.variant || w.product.variants?.[0] || null, 1);
    } catch (err: any) {
      showToast(err.message || 'Unable to move item to cart.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', margin: '0 0 0.25rem 0' }}>
            My Saved Wishlist ({wishlistItems.length})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0 }}>
            Physical cakes, hampers, and studio gear saved to your account
          </p>
        </div>
        <Link to="/shop" className="btn btn-secondary btn-sm">
          Explore Shop <ArrowRight size={14} style={{ marginLeft: '4px' }} />
        </Link>
      </div>

      {wishlistItems.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <Heart size={42} color="var(--color-rose)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--color-plum)', marginBottom: '0.5rem' }}>Your Wishlist is Empty</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Tap the heart icon on any physical product to save your favourites for gifting and celebrations.
          </p>
          <Link to="/shop" className="btn btn-primary">
            Browse Physical Shop
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {wishlistItems.map(w => {
            const p = w.product;
            if (!p) return null;
            const variant = w.variant || p.variants?.find(v => v.isActive && v.stock > 0) || p.variants?.[0] || null;
            const price = p.basePrice + (variant?.priceAdjustment || 0);
            const stock = variant ? variant.stock : p.stock;
            const img = variant?.image || p.images?.[0] || '/images/hero-cake.png';

            return (
              <div
                key={`${w.productId}:${w.variantId}`}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Link to={`/shop/${p.slug}`} style={{ height: '210px', display: 'block', position: 'relative' }}>
                  <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Link to={`/shop/${p.slug}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-plum)', textDecoration: 'none', marginBottom: '0.3rem' }}>
                    {p.name}
                  </Link>
                  {variant && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {variant.variantName}
                    </div>
                  )}
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-berry)', marginBottom: '1rem' }}>
                    ₹{price.toLocaleString('en-IN')}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={stock <= 0}
                      onClick={() => handleMoveToCart(w)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <ShoppingBag size={14} />
                      {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(w.productId, w.variantId)}
                      className="btn btn-secondary btn-sm"
                      title="Remove from Wishlist"
                      style={{ color: '#C62828', padding: '0.45rem 0.7rem' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

