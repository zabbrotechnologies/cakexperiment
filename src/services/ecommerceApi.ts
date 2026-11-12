import type {
  PhysicalProduct,
  ProductCategory,
  StoreConfig,
  CartItem,
  WishlistItem,
  ShippingAddress,
  DeliveryMethod,
  ProductOrder,
  ProductOrderStatus
} from '../types';

const TOKEN_KEY = 'cakexperiment_auth_token';
const SYNC_EVENT_KEY = 'cakexperiment_shop_cache_sync';

interface ClientCacheEntry {
  value: any;
  expiresAt: number;
}

const clientCache = new Map<string, ClientCacheEntry>();
const CACHE_TTL_MS = 25_000;

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function invalidateClientShopCache(broadcast = true): void {
  clientCache.clear();
  if (broadcast && typeof window !== 'undefined') {
    try {
      localStorage.setItem(SYNC_EVENT_KEY, String(Date.now()));
    } catch {}
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SYNC_EVENT_KEY) {
      clientCache.clear();
    }
  });
}

async function cachedGet<T>(url: string, ttlMs = CACHE_TTL_MS): Promise<T> {
  const hit = clientCache.get(url);
  if (hit && Date.now() < hit.expiresAt) {
    return hit.value as T;
  }
  const res = await fetch(url, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  clientCache.set(url, { value: data, expiresAt: Date.now() + ttlMs });
  return data as T;
}

async function apiMutate<T>(url: string, method: string, body?: any, invalidate = true): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  if (invalidate) {
    invalidateClientShopCache(true);
  }
  return data as T;
}

// =========================================================================
// IMAGE OPTIMIZATION BEFORE UPLOAD TO NEON OBJECT STORAGE
// =========================================================================

export async function optimizeAndUploadProductImage(file: File): Promise<{ url: string; key: string; size: number }> {
  const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  if (!allowedMimes.has(file.type)) {
    throw new Error('Unsupported image format. Please choose a JPEG, PNG, WEBP, or AVIF file.');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Source image exceeds 12 MB limit.');
  }

  // Resize & compress via Canvas
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas optimization context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpUrl = canvas.toDataURL('image/webp', 0.82);
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl);
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  const mimeMatch = dataUrl.match(/^data:(image\/[a-z+]+);base64,/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/webp';
  const ext = contentType.split('/')[1] || 'webp';
  const baseName = file.name.replace(/\.[^.]+$/, '');

  return apiMutate<{ success: boolean; url: string; key: string; size: number }>(
    '/api/admin/upload-image',
    'POST',
    {
      dataUrl,
      contentType,
      filename: `${baseName}.${ext}`
    },
    false
  );
}

// =========================================================================
// STOREFRONT & ACCOUNT API CLIENT
// =========================================================================

export const ecommerceApi = {
  // Public Catalog
  async getStoreConfig(): Promise<StoreConfig> {
    const data = await cachedGet<{ config: StoreConfig }>('/api/store-config', 45_000);
    return data.config;
  },

  async getProductCategories(): Promise<ProductCategory[]> {
    const data = await cachedGet<{ categories: ProductCategory[] }>('/api/product-categories');
    return data.categories || [];
  },

  async getProducts(params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    exclusive?: boolean;
    inStock?: boolean;
    sort?: 'featured' | 'newest' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
  }): Promise<{ products: PhysicalProduct[]; total: number; page: number; limit: number; totalPages: number }> {
    const qs = new URLSearchParams();
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
    if (params?.featured) qs.set('featured', 'true');
    if (params?.exclusive) qs.set('exclusive', 'true');
    if (params?.inStock) qs.set('inStock', 'true');
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const queryStr = qs.toString();
    return cachedGet(`/api/products${queryStr ? `?${queryStr}` : ''}`);
  },

  async getProductDetail(idOrSlug: string): Promise<{ product: PhysicalProduct; related: PhysicalProduct[] }> {
    return cachedGet(`/api/products/${encodeURIComponent(idOrSlug)}`);
  },

  // Cart & Wishlist
  async getCart(): Promise<CartItem[]> {
    const data = await cachedGet<{ items: CartItem[] }>('/api/cart', 5_000);
    return data.items || [];
  },

  async addToCart(productId: string, variantId: string, quantity: number): Promise<CartItem[]> {
    const data = await apiMutate<{ items: CartItem[] }>('/api/cart/items', 'POST', {
      productId,
      variantId: variantId || '',
      quantity
    });
    return data.items || [];
  },

  async setCartItemQuantity(productId: string, variantId: string, quantity: number): Promise<CartItem[]> {
    const data = await apiMutate<{ items: CartItem[] }>('/api/cart/items', 'PATCH', {
      productId,
      variantId: variantId || '',
      quantity
    });
    return data.items || [];
  },

  async removeCartItem(itemIdOrKey: string): Promise<CartItem[]> {
    const data = await apiMutate<{ items: CartItem[] }>(
      `/api/cart/items/${encodeURIComponent(itemIdOrKey)}`,
      'DELETE'
    );
    return data.items || [];
  },

  async clearCart(): Promise<void> {
    await apiMutate('/api/cart', 'DELETE');
  },

  async getWishlist(): Promise<WishlistItem[]> {
    const data = await cachedGet<{ items: WishlistItem[] }>('/api/wishlist', 5_000);
    return data.items || [];
  },

  async toggleWishlist(productId: string, variantId: string = ''): Promise<{ added: boolean; items: WishlistItem[] }> {
    return apiMutate('/api/wishlist/toggle', 'POST', { productId, variantId });
  },

  // Addresses & Profile
  async getSavedAddresses(): Promise<any[]> {
    const res = await fetch('/api/user/addresses', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.addresses || [];
  },

  // COD Checkout & Orders (Never cached on tracking queries so updates show fresh)
  async createCodProductOrder(payload: {
    idempotencyKey: string;
    shippingAddress: ShippingAddress;
    deliveryMethod: DeliveryMethod;
    items: { productId: string; variantId: string; quantity: number }[];
  }): Promise<ProductOrder> {
    const data = await apiMutate<{ success: boolean; order: ProductOrder }>(
      '/api/orders/product/create',
      'POST',
      payload
    );
    return data.order;
  },

  async createHamperOrder(payload: {
    idempotencyKey: string;
    customerName: string;
    customerPhone: string;
    deliveryDate: string;
    deliveryAddress: string;
    occasion: string;
    ribbonStyle: string;
    recipientName?: string;
    greetingMessage?: string;
    specialRequirements?: string;
    quantity: number;
  }): Promise<ProductOrder> {
    const data = await apiMutate<{ success: boolean; order: ProductOrder }>(
      '/api/orders/hamper/create',
      'POST',
      payload
    );
    return data.order;
  },

  async trackHamperOrder(orderNumber: string): Promise<ProductOrder> {
    const res = await fetch(`/api/hamper-orders/${encodeURIComponent(orderNumber)}/track`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load Gift Hamper order.');
    return data.order;
  },

  async getMyProductOrders(): Promise<ProductOrder[]> {
    const res = await fetch('/api/user/product-orders', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load orders.');
    return data.orders || [];
  },

  async getSingleProductOrder(orderIdOrNumber: string): Promise<ProductOrder> {
    const res = await fetch(`/api/user/product-orders/${encodeURIComponent(orderIdOrNumber)}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load order.');
    return data.order;
  },

  // Admin Operations
  async adminGetProducts(): Promise<{ products: PhysicalProduct[]; movements: any[] }> {
    const res = await fetch('/api/admin/products', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load admin products.');
    return data;
  },

  async adminSaveProduct(product: any): Promise<PhysicalProduct> {
    const url = product.id ? `/api/admin/products/${encodeURIComponent(product.id)}` : '/api/admin/products';
    const method = product.id ? 'PUT' : 'POST';
    const data = await apiMutate<{ product: PhysicalProduct }>(url, method, product);
    return data.product;
  },

  async adminToggleProductActive(productId: string): Promise<boolean> {
    const data = await apiMutate<{ isActive: boolean }>(
      `/api/admin/products/${encodeURIComponent(productId)}/toggle-active`,
      'POST'
    );
    return data.isActive;
  },

  async adminDeleteProduct(productId: string): Promise<{ archived: boolean }> {
    return apiMutate(`/api/admin/products/${encodeURIComponent(productId)}`, 'DELETE');
  },

  async adminAdjustStock(productId: string, stock: number, variantId?: string): Promise<void> {
    await apiMutate(`/api/admin/products/${encodeURIComponent(productId)}/stock`, 'POST', {
      stock,
      variantId: variantId || null
    });
  },

  async adminGetCategories(): Promise<ProductCategory[]> {
    const res = await fetch('/api/admin/product-categories', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load categories.');
    return data.categories || [];
  },

  async adminSaveCategory(cat: any): Promise<any> {
    const url = cat.id
      ? `/api/admin/product-categories/${encodeURIComponent(cat.id)}`
      : '/api/admin/product-categories';
    const method = cat.id ? 'PUT' : 'POST';
    return apiMutate(url, method, cat);
  },

  async adminDeleteCategory(id: string): Promise<void> {
    await apiMutate(`/api/admin/product-categories/${encodeURIComponent(id)}`, 'DELETE');
  },

  async adminGetProductAndHamperOrders(
    status = 'all',
    search = ''
  ): Promise<{ orders: ProductOrder[]; hamperOrders: ProductOrder[] }> {
    const qs = new URLSearchParams({ status, search });
    const res = await fetch(`/api/admin/product-orders?${qs.toString()}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load product orders.');
    return {
      orders: data.orders || [],
      hamperOrders: data.hamperOrders || []
    };
  },

  async adminGetProductOrders(status = 'all', search = ''): Promise<ProductOrder[]> {
    const { orders } = await this.adminGetProductAndHamperOrders(status, search);
    return orders;
  },

  async adminUpdateProductOrderStatus(
    orderId: string,
    status: ProductOrderStatus,
    note?: string
  ): Promise<ProductOrder> {
    const data = await apiMutate<{ order: ProductOrder }>(
      `/api/admin/product-orders/${encodeURIComponent(orderId)}/status`,
      'POST',
      { status, note }
    );
    return data.order;
  },

  async adminCollectCodPayment(orderId: string): Promise<ProductOrder> {
    const data = await apiMutate<{ order: ProductOrder }>(
      `/api/admin/product-orders/${encodeURIComponent(orderId)}/collect-cod`,
      'POST'
    );
    return data.order;
  },

  async adminGetCustomers(): Promise<any[]> {
    const res = await fetch('/api/admin/customers', {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load CRM customers.');
    return data.customers || [];
  },

  async adminGetCustomerOrders(userId: string): Promise<any[]> {
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(userId)}/orders`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load customer orders.');
    return data.orders || [];
  },

  async adminGetAnalytics(range = '30d'): Promise<any> {
    const res = await fetch(`/api/admin/analytics?range=${encodeURIComponent(range)}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load analytics.');
    return data;
  },

  async adminUpdateStoreSettings(config: Partial<StoreConfig>): Promise<StoreConfig> {
    const data = await apiMutate<{ config: StoreConfig }>('/api/admin/store-settings', 'PUT', config);
    return data.config;
  }
};

