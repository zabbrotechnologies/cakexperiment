import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';
import { useShopStore } from '../../store/useShopStore';
import { useAuth } from '../../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateQuantity,
    removeItem,
    storeConfig,
    toastMessage,
    clearToast
  } = useShopStore();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.unitPrice ?? item.product?.basePrice ?? 0) * item.quantity,
    0
  );
  const freeThresh = storeConfig.freeShippingThreshold || 1499;
  const remainingForFree = Math.max(0, freeThresh - subtotal);

  return (
    <>
      {/* Global Toast Notification */}
      {toastMessage &&
        createPortal(
          <div
            onClick={clearToast}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 10050,
              backgroundColor: 'var(--color-plum)',
              color: '#FFFFFF',
              padding: '0.85rem 1.25rem',
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(87, 51, 58, 0.28)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={18} color="#81C784" />
            <span>{toastMessage}</span>
          </div>,
          document.body
        )}

      {/* Slide-Over Cart Drawer */}
      {cartDrawerOpen &&
        createPortal(
          <div
            onClick={() => setCartDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              backgroundColor: 'rgba(87, 51, 58, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '430px',
                height: '100dvh',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 35px rgba(0,0,0,0.16)'
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--color-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShoppingBag size={20} color="var(--color-berry)" />
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-plum)' }}>
                    Shopping Bag ({cartItems.reduce((a, b) => a + b.quantity, 0)})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum)', padding: '4px' }}
                  aria-label="Close Cart"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Free Shipping Progress Bar */}
              {cartItems.length > 0 && (
                <div style={{ padding: '0.85rem 1.5rem', backgroundColor: '#FFF9FA', borderBottom: '1px solid #F4E2E6', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-plum)', marginBottom: '0.45rem' }}>
                    <Truck size={15} color="var(--color-berry)" />
                    {remainingForFree === 0 ? (
                      <span style={{ fontWeight: 600, color: '#2E7D32' }}>
                        You unlocked FREE Standard Delivery!
                      </span>
                    ) : (
                      <span>
                        Add <strong>₹{remainingForFree.toLocaleString('en-IN')}</strong> more for free standard shipping
                      </span>
                    )}
                  </div>
                  <div style={{ height: '5px', backgroundColor: 'var(--color-blush)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((subtotal / freeThresh) * 100))}%`,
                        height: '100%',
                        backgroundColor: remainingForFree === 0 ? '#2E7D32' : 'var(--color-berry)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!isAuthenticated ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <ShoppingBag size={40} color="var(--color-rose)" style={{ marginBottom: '0.8rem' }} />
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Please sign in to access your personal shopping bag.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCartDrawerOpen(false);
                        navigate('/signin');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Sign In
                    </button>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <ShoppingBag size={40} color="var(--color-rose)" style={{ marginBottom: '0.8rem' }} />
                    <h4 style={{ color: 'var(--color-plum)', marginBottom: '0.4rem' }}>Your bag is empty</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                      Explore our luxury hampers, designer cakes, and baking studio tools.
                    </p>
                    <Link
                      to="/shop"
                      onClick={() => setCartDrawerOpen(false)}
                      className="btn btn-primary btn-sm"
                    >
                      Browse Shop
                    </Link>
                  </div>
                ) : (
                  cartItems.map(item => {
                    const price = Number(item.unitPrice ?? item.product?.basePrice ?? 0);
                    const img = item.variant?.image || item.product?.images?.[0] || '/images/hero-cake.png';
                    const maxStock = item.availableStock ?? item.variant?.stock ?? item.product?.stock ?? 99;
                    const key = `${item.productId}:${item.variantId}`;

                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          gap: '0.85rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid #F6EAED'
                        }}
                      >
                        <img
                          src={img}
                          alt={item.product?.name || 'Product'}
                          style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            to={`/shop/${item.product?.slug || item.productId}`}
                            onClick={() => setCartDrawerOpen(false)}
                            style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-plum)', textDecoration: 'none', display: 'block' }}
                          >
                            {item.product?.name}
                          </Link>
                          {item.variant && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {item.variant.variantName}
                            </div>
                          )}
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-berry)', marginTop: '0.3rem' }}>
                            ₹{(price * item.quantity).toLocaleString('en-IN')}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                style={{ background: 'none', border: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'var(--color-plum)' }}
                              >
                                <Minus size={13} />
                              </button>
                              <span style={{ padding: '0 0.55rem', fontSize: '0.84rem', fontWeight: 600 }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={item.quantity >= maxStock}
                                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0.25rem 0.5rem',
                                  cursor: item.quantity >= maxStock ? 'not-allowed' : 'pointer',
                                  opacity: item.quantity >= maxStock ? 0.4 : 1,
                                  color: 'var(--color-plum)'
                                }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id || key, item.productId, item.variantId)}
                              style={{ background: 'none', border: 'none', color: '#B75E6A', cursor: 'pointer', padding: '4px' }}
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {isAuthenticated && cartItems.length > 0 && (
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--color-cream)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.9rem', fontSize: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Subtotal</span>
                    <span style={{ fontWeight: 800, color: 'var(--color-plum)', fontSize: '1.15rem' }}>
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCartDrawerOpen(false);
                        navigate('/product-checkout');
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                    >
                      <span>Proceed to COD Checkout</span>
                      <ArrowRight size={16} />
                    </button>
                    <Link
                      to="/cart"
                      onClick={() => setCartDrawerOpen(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
                    >
                      Review Full Cart
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

