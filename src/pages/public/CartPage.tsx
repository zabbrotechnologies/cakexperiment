import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, ChevronLeft, Truck, PackageCheck } from 'lucide-react';
import { useShopStore } from '../../store/useShopStore';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, storeConfig } = useShopStore();

  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.unitPrice ?? item.product?.basePrice ?? 0) * item.quantity,
    0
  );
  const freeThreshold = storeConfig.freeShippingThreshold || 1499;
  const standardFee = subtotal >= freeThreshold ? 0 : storeConfig.standardShippingFee;

  return (
    <div style={{ minHeight: '80vh', backgroundColor: 'var(--color-cream)', padding: '3rem 0 5rem 0' }}>
      <div className="container">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-berry)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              <ChevronLeft size={16} /> Continue Shopping
            </Link>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.3rem', color: 'var(--color-plum)', margin: 0 }}>
              Your Shopping Cart ({totalQty})
            </h1>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <ShoppingBag size={46} color="var(--color-rose)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--color-plum)', marginBottom: '0.5rem' }}>Your Shopping Cart is Empty</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Add freshly crafted hampers, celebration cakes, or baking tools to start your order.
            </p>
            <Link to="/shop" className="btn btn-primary">
              Explore Shop Catalog
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '2rem', alignItems: 'start' }} className="cart-layout-grid">
            {/* Cart Items List */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid var(--border-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cartItems.map(item => {
                const price = Number(item.unitPrice ?? item.product?.basePrice ?? 0);
                const img = item.variant?.image || item.product?.images?.[0] || '/images/hero-cake.png';
                const maxStock = item.availableStock ?? item.variant?.stock ?? item.product?.stock ?? 99;
                const itemKey = `${item.productId}:${item.variantId}`;

                return (
                  <div
                    key={itemKey}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                      paddingBottom: '1.25rem',
                      borderBottom: '1px solid #F6E9EC',
                      alignItems: 'center'
                    }}
                  >
                    <Link to={`/shop/${item.product?.slug || item.productId}`}>
                      <img
                        src={img}
                        alt={item.product?.name || 'Product'}
                        style={{ width: '96px', height: '96px', borderRadius: '14px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                    </Link>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <Link
                        to={`/shop/${item.product?.slug || item.productId}`}
                        style={{ fontWeight: 700, fontSize: '1.08rem', color: 'var(--color-plum)', textDecoration: 'none' }}
                      >
                        {item.product?.name}
                      </Link>
                      {item.variant && (
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Variant: <strong>{item.variant.variantName}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: maxStock > 0 ? '#2E7D32' : '#C62828', marginTop: '0.25rem', fontWeight: 600 }}>
                        {maxStock > 0 ? `${maxStock} available in stock` : 'Out of stock'}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Unit Price: ₹{price.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          style={{ padding: '0.45rem 0.7rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '0 0.7rem', fontWeight: 700, fontSize: '0.92rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= maxStock}
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          style={{
                            padding: '0.45rem 0.7rem',
                            background: 'none',
                            border: 'none',
                            cursor: item.quantity >= maxStock ? 'not-allowed' : 'pointer',
                            opacity: item.quantity >= maxStock ? 0.4 : 1,
                            color: 'var(--color-plum)'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div style={{ minWidth: '95px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-plum)' }}>
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id || itemKey, item.productId, item.variantId)}
                        style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', padding: '6px' }}
                        title="Remove from cart"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid var(--border-subtle)', padding: '1.65rem', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-plum)', marginBottom: '1.2rem' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.94rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'items'})</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Standard Shipping</span>
                  <span style={{ fontWeight: 600, color: standardFee === 0 ? '#2E7D32' : 'var(--color-plum)' }}>
                    {standardFee === 0 ? 'FREE' : `₹${standardFee}`}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-plum)' }}>
                  <span>Estimated Total</span>
                  <span>₹{(subtotal + standardFee).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-cream)', borderRadius: '12px', padding: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={16} color="var(--color-berry)" style={{ flexShrink: 0 }} />
                <span>
                  {standardFee === 0
                    ? 'Free Standard Delivery unlocked!'
                    : `Add ₹${(freeThreshold - subtotal).toLocaleString('en-IN')} more for Free Standard Delivery.`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/product-checkout')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#2E7D32', fontWeight: 600 }}>
                <PackageCheck size={15} /> Cash on Delivery Available
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cart-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

