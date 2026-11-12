import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem,
  WishlistItem,
  PhysicalProduct,
  ProductVariant,
  StoreConfig
} from '../types';
import { ecommerceApi } from '../services/ecommerceApi';

const PENDING_ACTION_KEY = 'cakexperiment_pending_shop_action';

export interface PendingShopAction {
  type: 'ADD_TO_CART' | 'TOGGLE_WISHLIST' | 'CHECKOUT';
  productId?: string;
  variantId?: string;
  quantity?: number;
  returnTo?: string;
}

const DEFAULT_STORE_CONFIG: StoreConfig = {
  standardShippingFee: 79,
  expressShippingFee: 199,
  freeShippingThreshold: 1499,
  standardDeliveryDaysMin: 5,
  standardDeliveryDaysMax: 7,
  expressDeliveryDaysMin: 2,
  expressDeliveryDaysMax: 3,
  whatsappNumber: '918248957918'
};

interface ShopState {
  activeUserId: string | null;
  cartsByUser: Record<string, CartItem[]>;
  wishlistsByUser: Record<string, WishlistItem[]>;
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  cartDrawerOpen: boolean;
  loadingCart: boolean;
  storeConfig: StoreConfig;
  toastMessage: string | null;

  setCartDrawerOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  loadStoreConfig: () => Promise<void>;
  syncForUser: (userId: string) => Promise<void>;
  clearActiveUser: () => void;

  addItem: (product: PhysicalProduct, variant: ProductVariant | null, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeItem: (itemIdOrKey: string, productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  toggleWishlist: (productId: string, variantId?: string) => Promise<boolean>;
  isInWishlist: (productId: string, variantId?: string) => boolean;

  setPendingAction: (action: PendingShopAction) => void;
  consumePendingAction: () => PendingShopAction | null;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      activeUserId: null,
      cartsByUser: {},
      wishlistsByUser: {},
      cartItems: [],
      wishlistItems: [],
      cartDrawerOpen: false,
      loadingCart: false,
      storeConfig: DEFAULT_STORE_CONFIG,
      toastMessage: null,

      setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),

      showToast: (msg) => {
        set({ toastMessage: msg });
        setTimeout(() => {
          if (get().toastMessage === msg) {
            set({ toastMessage: null });
          }
        }, 3200);
      },

      clearToast: () => set({ toastMessage: null }),

      loadStoreConfig: async () => {
        try {
          const config = await ecommerceApi.getStoreConfig();
          set({ storeConfig: config });
        } catch {
          // Keep default config
        }
      },

      syncForUser: async (userId: string) => {
        const state = get();
        const cachedUserCart = state.cartsByUser[userId] || [];
        const cachedUserWish = state.wishlistsByUser[userId] || [];

        set({
          activeUserId: userId,
          cartItems: cachedUserCart,
          wishlistItems: cachedUserWish,
          loadingCart: true
        });

        try {
          const [serverCart, serverWish, config] = await Promise.all([
            ecommerceApi.getCart().catch(() => null),
            ecommerceApi.getWishlist().catch(() => null),
            ecommerceApi.getStoreConfig().catch(() => null)
          ]);

          const nextCart = serverCart !== null ? serverCart : cachedUserCart;
          const nextWish = serverWish !== null ? serverWish : cachedUserWish;

          set((prev) => ({
            cartItems: prev.activeUserId === userId ? nextCart : prev.cartItems,
            wishlistItems: prev.activeUserId === userId ? nextWish : prev.wishlistItems,
            cartsByUser: { ...prev.cartsByUser, [userId]: nextCart },
            wishlistsByUser: { ...prev.wishlistsByUser, [userId]: nextWish },
            storeConfig: config || prev.storeConfig,
            loadingCart: false
          }));

          // Complete any login-gated pending shopping action
          const pending = get().consumePendingAction();
          if (pending && get().activeUserId === userId) {
            if (pending.type === 'ADD_TO_CART' && pending.productId) {
              const items = await ecommerceApi.addToCart(
                pending.productId,
                pending.variantId || '',
                pending.quantity || 1
              );
              set((prev) => ({
                cartItems: items,
                cartsByUser: { ...prev.cartsByUser, [userId]: items },
                cartDrawerOpen: true
              }));
              get().showToast('Added item to your shopping bag.');
            } else if (pending.type === 'TOGGLE_WISHLIST' && pending.productId) {
              const res = await ecommerceApi.toggleWishlist(pending.productId, pending.variantId || '');
              set((prev) => ({
                wishlistItems: res.items,
                wishlistsByUser: { ...prev.wishlistsByUser, [userId]: res.items }
              }));
              get().showToast(res.added ? 'Saved to your wishlist!' : 'Removed from wishlist.');
            }
          }
        } catch {
          set({ loadingCart: false });
        }
      },

      clearActiveUser: () => {
        set({
          activeUserId: null,
          cartItems: [],
          wishlistItems: [],
          cartDrawerOpen: false,
          loadingCart: false
        });
      },

      addItem: async (product, variant, quantity = 1) => {
        const uid = get().activeUserId;
        if (!uid) {
          throw new Error('AUTH_REQUIRED');
        }
        const vid = variant?.id || '';
        const prevCart = get().cartItems;
        const unitPrice = product.basePrice + (variant?.priceAdjustment || 0);
        const availableStock = variant ? variant.stock : product.stock;
        const existingIdx = prevCart.findIndex(
          (item) => item.productId === product.id && (item.variantId || '') === vid
        );

        let optimisticCart: CartItem[];
        if (existingIdx >= 0) {
          const cur = prevCart[existingIdx];
          const nextQty = Math.min(cur.quantity + quantity, Math.max(1, availableStock));
          optimisticCart = prevCart.map((it, idx) =>
            idx === existingIdx ? { ...it, quantity: nextQty } : it
          );
        } else {
          optimisticCart = [
            {
              id: `opt_${Date.now()}`,
              productId: product.id,
              variantId: vid,
              quantity: Math.min(quantity, Math.max(1, availableStock)),
              unitPrice,
              availableStock,
              product,
              variant: variant || null
            },
            ...prevCart
          ];
        }

        // Instant optimistic UI update
        set((prev) => ({
          cartItems: optimisticCart,
          cartsByUser: { ...prev.cartsByUser, [uid]: optimisticCart },
          cartDrawerOpen: true
        }));
        get().showToast(`Added "${product.name}" to cart`);

        try {
          const items = await ecommerceApi.addToCart(product.id, vid, quantity);
          if (get().activeUserId === uid) {
            set((prev) => ({
              cartItems: items,
              cartsByUser: { ...prev.cartsByUser, [uid]: items }
            }));
          }
        } catch (err) {
          if (get().activeUserId === uid) {
            set((prev) => ({
              cartItems: prevCart,
              cartsByUser: { ...prev.cartsByUser, [uid]: prevCart }
            }));
          }
          throw err;
        }
      },

      updateQuantity: async (productId, variantId, quantity) => {
        const uid = get().activeUserId;
        if (!uid) return;
        const prevCart = get().cartItems;
        const optimisticCart = quantity <= 0
          ? prevCart.filter((it) => !(it.productId === productId && (it.variantId || '') === variantId))
          : prevCart.map((it) =>
              it.productId === productId && (it.variantId || '') === variantId
                ? { ...it, quantity }
                : it
            );

        set((prev) => ({
          cartItems: optimisticCart,
          cartsByUser: { ...prev.cartsByUser, [uid]: optimisticCart }
        }));

        try {
          const items = await ecommerceApi.setCartItemQuantity(productId, variantId, quantity);
          if (get().activeUserId === uid) {
            set((prev) => ({
              cartItems: items,
              cartsByUser: { ...prev.cartsByUser, [uid]: items }
            }));
          }
        } catch (err) {
          if (get().activeUserId === uid) {
            set((prev) => ({
              cartItems: prevCart,
              cartsByUser: { ...prev.cartsByUser, [uid]: prevCart }
            }));
          }
          throw err;
        }
      },

      removeItem: async (itemIdOrKey, productId, variantId) => {
        const uid = get().activeUserId;
        if (!uid) return;
        const prevCart = get().cartItems;
        const optimisticCart = prevCart.filter(
          (it) => !(it.id === itemIdOrKey || (it.productId === productId && (it.variantId || '') === variantId))
        );

        set((prev) => ({
          cartItems: optimisticCart,
          cartsByUser: { ...prev.cartsByUser, [uid]: optimisticCart }
        }));

        try {
          const items = await ecommerceApi.removeCartItem(itemIdOrKey || `${productId}:${variantId}`);
          if (get().activeUserId === uid) {
            set((prev) => ({
              cartItems: items,
              cartsByUser: { ...prev.cartsByUser, [uid]: items }
            }));
          }
        } catch (err) {
          if (get().activeUserId === uid) {
            set((prev) => ({
              cartItems: prevCart,
              cartsByUser: { ...prev.cartsByUser, [uid]: prevCart }
            }));
          }
          throw err;
        }
      },

      clearCart: async () => {
        const uid = get().activeUserId;
        if (uid) {
          set((prev) => ({
            cartItems: [],
            cartsByUser: { ...prev.cartsByUser, [uid]: [] }
          }));
          await ecommerceApi.clearCart().catch(() => {});
        } else {
          set({ cartItems: [] });
        }
      },

      toggleWishlist: async (productId, variantId = '') => {
        const uid = get().activeUserId;
        if (!uid) {
          throw new Error('AUTH_REQUIRED');
        }
        const prevWish = get().wishlistItems;
        const exists = prevWish.some(
          (w) => w.productId === productId && (w.variantId || '') === variantId
        );
        const optimisticWish = exists
          ? prevWish.filter((w) => !(w.productId === productId && (w.variantId || '') === variantId))
          : [
              {
                id: `opt_wsh_${Date.now()}`,
                productId,
                variantId,
                createdAt: new Date().toISOString()
              },
              ...prevWish
            ];

        set((prev) => ({
          wishlistItems: optimisticWish,
          wishlistsByUser: { ...prev.wishlistsByUser, [uid]: optimisticWish }
        }));
        get().showToast(!exists ? 'Saved to your wishlist' : 'Removed from wishlist');

        try {
          const res = await ecommerceApi.toggleWishlist(productId, variantId);
          if (get().activeUserId === uid) {
            set((prev) => ({
              wishlistItems: res.items,
              wishlistsByUser: { ...prev.wishlistsByUser, [uid]: res.items }
            }));
          }
          return res.added;
        } catch (err) {
          if (get().activeUserId === uid) {
            set((prev) => ({
              wishlistItems: prevWish,
              wishlistsByUser: { ...prev.wishlistsByUser, [uid]: prevWish }
            }));
          }
          throw err;
        }
      },

      isInWishlist: (productId, variantId) => {
        const list = get().wishlistItems;
        if (variantId) {
          return list.some(
            w => w.productId === productId && (w.variantId === variantId || !w.variantId)
          );
        }
        return list.some(w => w.productId === productId);
      },

      setPendingAction: (action) => {
        try {
          sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
        } catch {}
      },

      consumePendingAction: () => {
        try {
          const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
          if (!raw) return null;
          sessionStorage.removeItem(PENDING_ACTION_KEY);
          return JSON.parse(raw) as PendingShopAction;
        } catch {
          return null;
        }
      }
    }),
    {
      name: 'cakexperiment_shop_state_v1',
      partialize: (state) => ({
        cartsByUser: state.cartsByUser,
        wishlistsByUser: state.wishlistsByUser
      })
    }
  )
);

