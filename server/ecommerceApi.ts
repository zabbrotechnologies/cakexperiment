import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import {
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getDb } from './neonDb.ts';
import type { AuthenticatedSession } from './neonApi.ts';
import {
  dispatchEmailAsync,
  generateProductOrderPlacedEmail,
  generateHamperOrderPlacedEmail,
  generateProductOrderStatusEmail,
  generatePaymentCollectedEmail
} from './emailService.ts';

// =========================================================================
// IN-MEMORY CACHE WITH TTL & WRITE INVALIDATION
// =========================================================================

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

const serverCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL_MS = 30_000;

export function getCached<T = any>(key: string): T | null {
  const entry = serverCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    serverCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T = any>(key: string, value: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
  serverCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of serverCache.keys()) {
    if (key.startsWith(prefix)) {
      serverCache.delete(key);
    }
  }
}

export function invalidateAllCommerceCache(): void {
  invalidateCachePrefix('products:');
  invalidateCachePrefix('product:');
  invalidateCachePrefix('product-categories');
  invalidateCachePrefix('store-config');
}

// =========================================================================
// RATE LIMITER FOR ORDER CREATION & SENSITIVE ADMIN MUTATIONS
// =========================================================================

const orderRateMap = new Map<string, number[]>();

function checkOrderRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxAttempts = 6;
  const existing = (orderRateMap.get(userId) || []).filter(t => now - t < windowMs);
  if (existing.length >= maxAttempts) {
    return false;
  }
  existing.push(now);
  orderRateMap.set(userId, existing);
  return true;
}

// =========================================================================
// VALIDATION HELPERS
// =========================================================================

const VALID_INDIAN_STATES = new Set([
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa',
  'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala',
  'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland',
  'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
  'uttar pradesh', 'uttarakhand', 'west bengal', 'andaman and nicobar islands',
  'chandigarh', 'dadra and nagar haveli and daman and diu', 'delhi',
  'jammu and kashmir', 'ladakh', 'lakshadweep', 'puducherry'
]);

const PRODUCT_ORDER_STATUSES = [
  'pending',
  'placed',
  'confirmed',
  'crafting',
  'dispatched',
  'delivered',
  'cancelled'
] as const;

function normalizeIndianPhone(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function sendJson(res: ServerResponse, status: number, payload: any): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function addBusinessDaysFormatted(minDays: number, maxDays: number): string {
  const addDays = (start: Date, bizDays: number) => {
    const d = new Date(start);
    let added = 0;
    while (added < bizDays) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0) added++;
    }
    return d;
  };
  const now = new Date();
  const d1 = addDays(now, minDays);
  const d2 = addDays(now, maxDays);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(d1)} – ${fmt(d2)}`;
}

async function getStoreConfigFromDb() {
  const cached = getCached('store-config');
  if (cached) return cached;

  const sql = getDb();
  const rows = await sql`
    SELECT standard_shipping_fee, express_shipping_fee, free_shipping_threshold,
           standard_delivery_days_min, standard_delivery_days_max,
           express_delivery_days_min, express_delivery_days_max
    FROM settings
    WHERE id = 'default'
    LIMIT 1;
  `;
  const row = rows[0] || {};
  const config = {
    standardShippingFee: Number(row.standard_shipping_fee ?? 79),
    expressShippingFee: Number(row.express_shipping_fee ?? 199),
    freeShippingThreshold: Number(row.free_shipping_threshold ?? 1499),
    standardDeliveryDaysMin: Number(row.standard_delivery_days_min ?? 5),
    standardDeliveryDaysMax: Number(row.standard_delivery_days_max ?? 7),
    expressDeliveryDaysMin: Number(row.express_delivery_days_min ?? 2),
    expressDeliveryDaysMax: Number(row.express_delivery_days_max ?? 3),
    whatsappNumber: '918248957918'
  };
  setCached('store-config', config, 60_000);
  return config;
}

function formatProductRow(p: any, variants: any[]) {
  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images;
  } else if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed)) images = parsed;
    } catch {}
  }

  const formattedVariants = variants.map(v => ({
    id: v.id,
    productId: v.product_id,
    variantName: v.variant_name,
    size: v.size || null,
    colour: v.colour || null,
    colourHex: v.colour_hex || null,
    sku: v.sku || null,
    priceAdjustment: Number(v.price_adjustment || 0),
    stock: Number(v.stock || 0),
    image: v.image || null,
    isActive: v.is_active !== false
  }));

  const activeVariants = formattedVariants.filter(v => v.isActive);
  const variantStockSum = activeVariants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  const totalStock = activeVariants.length > 0 ? variantStockSum : Number(p.stock || 0);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.short_description || '',
    description: p.description || '',
    categoryId: p.category_id || null,
    categoryName: p.category_name || null,
    basePrice: Number(p.base_price || 0),
    compareAtPrice: p.compare_at_price != null ? Number(p.compare_at_price) : null,
    images,
    featured: Boolean(p.featured),
    isExclusive: Boolean(p.is_exclusive),
    isActive: p.is_active !== false,
    stock: totalStock,
    baseStock: Number(p.stock || 0),
    badge: p.badge || null,
    productInfo: p.product_info || null,
    deliveryInfo: p.delivery_info || null,
    variants: formattedVariants,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

// =========================================================================
// MAIN ROUTE DISPATCHER FOR COMMERCE ENDPOINTS
// =========================================================================

export interface CommerceDeps {
  getAuthenticatedUser: (req: IncomingMessage) => Promise<AuthenticatedSession | null>;
  readJsonBody: (req: IncomingMessage) => Promise<any>;
  getS3: () => any;
}

export async function handleCommerceRoute(
  pathname: string,
  parsedUrl: URL,
  req: IncomingMessage,
  res: ServerResponse,
  deps: CommerceDeps
): Promise<boolean> {
  const { getAuthenticatedUser, readJsonBody, getS3 } = deps;

  // -------------------------------------------------------------
  // MEDIA PROXY & OPTIMIZED IMAGE UPLOAD
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/media/') && req.method === 'GET') {
    const key = decodeURIComponent(pathname.replace('/api/media/', ''));
    await handleGetMediaProxy(key, res, getS3);
    return true;
  }

  if (pathname === '/api/admin/upload-image' && req.method === 'POST') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    if (session.role !== 'ADMIN') return sendJson(res, 403, { error: 'Admin access required.' }), true;
    await handleAdminUploadImage(req, res, readJsonBody, getS3);
    return true;
  }

  // -------------------------------------------------------------
  // PUBLIC STOREFRONT PRODUCT ENDPOINTS
  // -------------------------------------------------------------
  if (pathname === '/api/store-config' && req.method === 'GET') {
    const config = await getStoreConfigFromDb();
    sendJson(res, 200, { config });
    return true;
  }

  if (pathname === '/api/product-categories' && req.method === 'GET') {
    await handlePublicCategories(res);
    return true;
  }

  if (pathname === '/api/products' && req.method === 'GET') {
    await handlePublicListProducts(parsedUrl, res);
    return true;
  }

  if (pathname.startsWith('/api/products/') && req.method === 'GET') {
    const idOrSlug = decodeURIComponent(pathname.replace('/api/products/', ''));
    await handlePublicProductDetail(idOrSlug, res);
    return true;
  }

  // -------------------------------------------------------------
  // AUTHENTICATED CART & WISHLIST ENDPOINTS
  // -------------------------------------------------------------
  if (pathname === '/api/cart' && req.method === 'GET') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Please sign in to access your cart.' }), true;
    await handleGetCart(session.userId, res);
    return true;
  }

  if (pathname === '/api/cart/items' && req.method === 'POST') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Please sign in to add items to your cart.' }), true;
    const body = await readJsonBody(req);
    await handleUpsertCartItem(session.userId, body, res, false);
    return true;
  }

  if (pathname === '/api/cart/items' && req.method === 'PATCH') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Please sign in to update your cart.' }), true;
    const body = await readJsonBody(req);
    await handleUpsertCartItem(session.userId, body, res, true);
    return true;
  }

  if (pathname.startsWith('/api/cart/items/') && req.method === 'DELETE') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    const itemId = decodeURIComponent(pathname.replace('/api/cart/items/', ''));
    await handleRemoveCartItem(session.userId, itemId, res);
    return true;
  }

  if (pathname === '/api/cart' && req.method === 'DELETE') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    const sql = getDb();
    await sql`DELETE FROM cart_items WHERE user_id = ${session.userId};`;
    sendJson(res, 200, { success: true, items: [] });
    return true;
  }

  if (pathname === '/api/wishlist' && req.method === 'GET') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Please sign in to view your wishlist.' }), true;
    await handleGetWishlist(session.userId, res);
    return true;
  }

  if (pathname === '/api/wishlist/toggle' && req.method === 'POST') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Please sign in to save items to your wishlist.' }), true;
    const body = await readJsonBody(req);
    await handleToggleWishlist(session.userId, body, res);
    return true;
  }

  if (pathname.startsWith('/api/wishlist/') && req.method === 'DELETE') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    const itemId = decodeURIComponent(pathname.replace('/api/wishlist/', ''));
    const sql = getDb();
    await sql`DELETE FROM wishlists WHERE id = ${itemId} AND user_id = ${session.userId};`;
    await handleGetWishlist(session.userId, res);
    return true;
  }

  if (pathname === '/api/user/addresses' && req.method === 'GET') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    const sql = getDb();
    const addresses = await sql`
      SELECT * FROM shipping_addresses WHERE user_id = ${session.userId} ORDER BY is_default DESC, updated_at DESC;
    `;
    sendJson(res, 200, { addresses });
    return true;
  }

  // -------------------------------------------------------------
  // PRODUCT COD & BESPOKE GIFT HAMPER ORDER CREATION & TRACKING
  // -------------------------------------------------------------
  if (pathname === '/api/orders/product/create' && req.method === 'POST') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Please sign in to complete your COD order.' }), true;
    const body = await readJsonBody(req);
    await handleCreateProductCodOrder(session, body, res);
    return true;
  }

  if (pathname === '/api/orders/hamper/create' && req.method === 'POST') {
    const session = await getAuthenticatedUser(req);
    const body = await readJsonBody(req);
    await handleCreateHamperOrder(session, body, res);
    return true;
  }

  if (pathname.startsWith('/api/hamper-orders/') && pathname.endsWith('/track') && req.method === 'GET') {
    const session = await getAuthenticatedUser(req);
    const orderNumber = decodeURIComponent(
      pathname.replace('/api/hamper-orders/', '').replace('/track', '')
    );
    await handlePublicTrackHamperOrder(session, orderNumber, res);
    return true;
  }

  if (pathname === '/api/user/product-orders' && req.method === 'GET') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    await handleGetUserProductOrders(session.userId, res);
    return true;
  }

  if (pathname.startsWith('/api/user/product-orders/') && req.method === 'GET') {
    const session = await getAuthenticatedUser(req);
    if (!session) return sendJson(res, 401, { error: 'Authentication required.' }), true;
    const idOrNum = decodeURIComponent(pathname.replace('/api/user/product-orders/', ''));
    await handleGetSingleProductOrder(session, idOrNum, res);
    return true;
  }

  // -------------------------------------------------------------
  // ADMIN PRODUCT, CATEGORY, INVENTORY, ORDER & ANALYTICS ROUTES
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/admin/')) {
    const session = await getAuthenticatedUser(req);

    // Let existing non-commerce admin routes pass through if this file doesn't match them
    const commerceAdminPrefixes = [
      '/api/admin/products',
      '/api/admin/product-categories',
      '/api/admin/product-orders',
      '/api/admin/customers',
      '/api/admin/analytics',
      '/api/admin/store-settings'
    ];
    const isCommerceAdmin = commerceAdminPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (!isCommerceAdmin) {
      return false;
    }

    if (!session) return sendJson(res, 401, { error: 'Unauthorized: Authentication required.' }), true;
    if (session.role !== 'ADMIN') return sendJson(res, 403, { error: 'Forbidden: Admin access required.' }), true;

    // Admin Products
    if (pathname === '/api/admin/products' && req.method === 'GET') {
      await handleAdminListProducts(res);
      return true;
    }
    if (pathname === '/api/admin/products' && req.method === 'POST') {
      const body = await readJsonBody(req);
      await handleAdminSaveProduct(null, body, session.userId, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/products/') && pathname.endsWith('/toggle-active') && req.method === 'POST') {
      const pid = pathname.replace('/api/admin/products/', '').replace('/toggle-active', '');
      await handleAdminToggleProductActive(pid, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/products/') && pathname.endsWith('/stock') && req.method === 'POST') {
      const pid = pathname.replace('/api/admin/products/', '').replace('/stock', '');
      const body = await readJsonBody(req);
      await handleAdminAdjustStock(pid, body, session.userId, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/products/') && req.method === 'PUT') {
      const pid = pathname.replace('/api/admin/products/', '');
      const body = await readJsonBody(req);
      await handleAdminSaveProduct(pid, body, session.userId, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/products/') && req.method === 'DELETE') {
      const pid = decodeURIComponent(pathname.replace('/api/admin/products/', ''));
      await handleAdminDeleteProduct(pid, res);
      return true;
    }

    // Admin Product Categories
    if (pathname === '/api/admin/product-categories' && req.method === 'GET') {
      const sql = getDb();
      const rows = await sql`
        SELECT pc.*, COUNT(p.id)::int as product_count
        FROM product_categories pc
        LEFT JOIN products p ON p.category_id = pc.id
        GROUP BY pc.id
        ORDER BY pc.sort_order ASC, pc.name ASC;
      `;
      sendJson(res, 200, { categories: rows });
      return true;
    }
    if (pathname === '/api/admin/product-categories' && req.method === 'POST') {
      const body = await readJsonBody(req);
      await handleAdminSaveCategory(null, body, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/product-categories/') && req.method === 'PUT') {
      const cid = pathname.replace('/api/admin/product-categories/', '');
      const body = await readJsonBody(req);
      await handleAdminSaveCategory(cid, body, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/product-categories/') && req.method === 'DELETE') {
      const cid = decodeURIComponent(pathname.replace('/api/admin/product-categories/', ''));
      const sql = getDb();
      await sql`DELETE FROM product_categories WHERE id = ${cid};`;
      invalidateAllCommerceCache();
      sendJson(res, 200, { success: true });
      return true;
    }

    // Admin Product Orders Fulfillment
    if (pathname === '/api/admin/product-orders' && req.method === 'GET') {
      await handleAdminListProductOrders(parsedUrl, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/product-orders/') && pathname.endsWith('/status') && req.method === 'POST') {
      const orderId = pathname.replace('/api/admin/product-orders/', '').replace('/status', '');
      const body = await readJsonBody(req);
      await handleAdminUpdateProductOrderStatus(orderId, body, session.userId, res);
      return true;
    }
    if (pathname.startsWith('/api/admin/product-orders/') && pathname.endsWith('/collect-cod') && req.method === 'POST') {
      const orderId = pathname.replace('/api/admin/product-orders/', '').replace('/collect-cod', '');
      await handleAdminCollectCodPayment(orderId, session.userId, res);
      return true;
    }

    // Admin Customer CRM
    if (pathname === '/api/admin/customers' && req.method === 'GET') {
      await handleAdminCustomers(res);
      return true;
    }
    if (pathname.startsWith('/api/admin/customers/') && pathname.endsWith('/orders') && req.method === 'GET') {
      const userId = pathname.replace('/api/admin/customers/', '').replace('/orders', '');
      await handleAdminCustomerOrders(userId, res);
      return true;
    }

    // Admin Sales Analytics
    if (pathname === '/api/admin/analytics' && req.method === 'GET') {
      const range = parsedUrl.searchParams.get('range') || '30d';
      await handleAdminAnalytics(range, res);
      return true;
    }

    // Admin Store Shipping Config
    if (pathname === '/api/admin/store-settings' && req.method === 'GET') {
      const config = await getStoreConfigFromDb();
      sendJson(res, 200, { config });
      return true;
    }
    if (pathname === '/api/admin/store-settings' && req.method === 'PUT') {
      const body = await readJsonBody(req);
      await handleAdminUpdateStoreSettings(body, res);
      return true;
    }
  }

  return false;
}

// =========================================================================
// HANDLER IMPLEMENTATIONS
// =========================================================================

async function ensureMediaDataColumn() {
  const sql = getDb();
  try {
    await sql`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS data_base64 TEXT;`;
  } catch {
    // column may already exist or concurrent DDL
  }
}

async function handleGetMediaProxy(key: string, res: ServerResponse, getS3: () => any) {
  if (!key || key.includes('..')) {
    res.statusCode = 400;
    res.end('Invalid media key');
    return;
  }

  try {
    const sql = getDb();
    const dbRows = await sql`
      SELECT content_type, data_base64 FROM media_assets WHERE key = ${key} LIMIT 1;
    `.catch(() => []);
    if (dbRows.length > 0 && dbRows[0].data_base64) {
      res.statusCode = 200;
      res.setHeader('Content-Type', dbRows[0].content_type || 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(Buffer.from(dbRows[0].data_base64, 'base64'));
      return;
    }

    const s3 = getS3();
    const bucket = 'assets';
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    res.statusCode = 200;
    res.setHeader('Content-Type', response.ContentType || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const bytes = await response.Body.transformToByteArray();
    res.end(Buffer.from(bytes));
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Media asset not found' }));
  }
}

async function handleAdminUploadImage(
  req: IncomingMessage,
  res: ServerResponse,
  readJsonBody: (r: IncomingMessage) => Promise<any>,
  getS3: () => any
) {
  const body = await readJsonBody(req);
  const { dataUrl, filename = 'product-image.webp', contentType = 'image/webp' } = body;

  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  if (!allowedTypes.has(contentType)) {
    return sendJson(res, 400, { error: 'Unsupported image format. Only JPEG, PNG, WEBP, and AVIF are allowed.' });
  }

  if (!dataUrl || typeof dataUrl !== 'string') {
    return sendJson(res, 400, { error: 'Image data is required.' });
  }

  const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const buffer = Buffer.from(base64Part, 'base64');

  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    return sendJson(res, 400, { error: 'Image must be non-empty and under 5 MB after optimization.' });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 60);
  const key = `products/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeName}`;
  const bucket = 'assets';

  let uploadedToS3 = false;
  try {
    const s3 = getS3();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      }),
      { abortSignal: controller.signal }
    );
    clearTimeout(timer);
    uploadedToS3 = true;
  } catch (s3Err: any) {
    console.warn('S3 upload unavailable, storing compressed asset in Neon PostgreSQL fallback:', s3Err?.message || s3Err);
  }

  const proxyUrl = `/api/media/${encodeURIComponent(key)}`;
  await ensureMediaDataColumn();
  const sql = getDb();
  const fallbackBase64 = uploadedToS3 ? null : buffer.toString('base64');
  await sql`
    INSERT INTO media_assets (key, bucket, content_type, size_bytes, url, data_base64)
    VALUES (${key}, ${bucket}, ${contentType}, ${buffer.length}, ${proxyUrl}, ${fallbackBase64});
  `;

  sendJson(res, 200, { success: true, key, size: buffer.length, url: proxyUrl });
}

async function handlePublicCategories(res: ServerResponse) {
  const cached = getCached('product-categories');
  if (cached) return sendJson(res, 200, { categories: cached });

  const sql = getDb();
  const rows = await sql`
    SELECT pc.id, pc.name, pc.slug, pc.description, pc.image, pc.sort_order,
           COUNT(p.id) FILTER (WHERE p.is_active = true)::int as product_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category_id = pc.id
    WHERE pc.is_active = true
    GROUP BY pc.id
    ORDER BY pc.sort_order ASC, pc.name ASC;
  `;

  const categories = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description || '',
    image: r.image || '',
    isActive: true,
    sortOrder: Number(r.sort_order || 0),
    productCount: Number(r.product_count || 0)
  }));

  setCached('product-categories', categories, 30_000);
  sendJson(res, 200, { categories });
}

async function handlePublicListProducts(parsedUrl: URL, res: ServerResponse) {
  const cacheKey = `products:${parsedUrl.search}`;
  const cached = getCached(cacheKey);
  if (cached) return sendJson(res, 200, cached);

  const category = (parsedUrl.searchParams.get('category') || '').trim().toLowerCase();
  const search = (parsedUrl.searchParams.get('search') || '').trim().toLowerCase();
  const minPrice = parsedUrl.searchParams.get('minPrice') ? Number(parsedUrl.searchParams.get('minPrice')) : null;
  const maxPrice = parsedUrl.searchParams.get('maxPrice') ? Number(parsedUrl.searchParams.get('maxPrice')) : null;
  const featuredOnly = parsedUrl.searchParams.get('featured') === 'true';
  const exclusiveOnly = parsedUrl.searchParams.get('exclusive') === 'true';
  const inStockOnly = parsedUrl.searchParams.get('inStock') === 'true';
  const sort = parsedUrl.searchParams.get('sort') || 'featured';
  const page = Math.max(1, Number(parsedUrl.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(parsedUrl.searchParams.get('limit') || 24)));

  const sql = getDb();
  const rows = await sql`
    SELECT p.*, pc.name as category_name, pc.slug as category_slug
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.is_active = true;
  `;

  const variantRows = await sql`
    SELECT * FROM product_variants WHERE is_active = true ORDER BY created_at ASC, id ASC;
  `;

  let formatted = rows.map((p: any) =>
    formatProductRow(p, variantRows.filter((v: any) => v.product_id === p.id))
  );

  // Filters
  if (category && category !== 'all') {
    formatted = formatted.filter(
      (p: any) =>
        (p.categoryId || '').toLowerCase() === category ||
        (p.categoryName || '').toLowerCase() === category ||
        (rows.find((r: any) => r.id === p.id)?.category_slug || '').toLowerCase() === category
    );
  }
  if (featuredOnly) formatted = formatted.filter((p: any) => p.featured);
  if (exclusiveOnly) formatted = formatted.filter((p: any) => p.isExclusive);
  if (inStockOnly) formatted = formatted.filter((p: any) => p.stock > 0);
  if (minPrice !== null && !Number.isNaN(minPrice)) formatted = formatted.filter((p: any) => p.basePrice >= minPrice);
  if (maxPrice !== null && !Number.isNaN(maxPrice)) formatted = formatted.filter((p: any) => p.basePrice <= maxPrice);

  if (search) {
    formatted = formatted.filter(
      (p: any) =>
        p.name.toLowerCase().includes(search) ||
        p.shortDescription.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        (p.categoryName || '').toLowerCase().includes(search)
    );
  }

  // Deterministic Sorting
  formatted.sort((a: any, b: any) => {
    if (sort === 'price_asc') {
      return a.basePrice - b.basePrice || a.id.localeCompare(b.id);
    }
    if (sort === 'price_desc') {
      return b.basePrice - a.basePrice || a.id.localeCompare(b.id);
    }
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || a.id.localeCompare(b.id);
    }
    // featured default: exclusive -> featured -> created_at desc -> id
    if (a.isExclusive !== b.isExclusive) return a.isExclusive ? -1 : 1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || a.id.localeCompare(b.id);
  });

  const total = formatted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const paginated = formatted.slice(offset, offset + limit);

  const payload = {
    products: paginated,
    total,
    page: safePage,
    limit,
    totalPages
  };

  setCached(cacheKey, payload, 20_000);
  sendJson(res, 200, payload);
}

async function handlePublicProductDetail(idOrSlug: string, res: ServerResponse) {
  const cacheKey = `product:${idOrSlug}`;
  const cached = getCached(cacheKey);
  if (cached) return sendJson(res, 200, cached);

  const sql = getDb();
  const rows = await sql`
    SELECT p.*, pc.name as category_name
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE (p.id = ${idOrSlug} OR p.slug = ${idOrSlug}) AND p.is_active = true
    LIMIT 1;
  `;

  if (rows.length === 0) {
    return sendJson(res, 404, { error: 'Product not found.' });
  }

  const productRow = rows[0];
  const variants = await sql`
    SELECT * FROM product_variants WHERE product_id = ${productRow.id} AND is_active = true ORDER BY created_at ASC, id ASC;
  `;

  const product = formatProductRow(productRow, variants);

  // Related products
  const relatedRows = await sql`
    SELECT p.*, pc.name as category_name
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.is_active = true AND p.id != ${productRow.id}
    ORDER BY (CASE WHEN p.category_id = ${productRow.category_id} THEN 0 ELSE 1 END), p.featured DESC, p.created_at DESC
    LIMIT 4;
  `;
  const relIds = relatedRows.map((r: any) => r.id);
  const relVariants =
    relIds.length > 0
      ? await sql`SELECT * FROM product_variants WHERE product_id = ANY(${relIds}) AND is_active = true;`
      : [];

  const related = relatedRows.map((r: any) =>
    formatProductRow(r, relVariants.filter((v: any) => v.product_id === r.id))
  );

  const payload = { product, related };
  setCached(cacheKey, payload, 20_000);
  sendJson(res, 200, payload);
}

async function buildEnrichedCart(userId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT ci.id as cart_item_id, ci.product_id, ci.variant_id, ci.quantity,
           p.*, pc.name as category_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE ci.user_id = ${userId} AND p.is_active = true
    ORDER BY ci.created_at DESC;
  `;

  const pIds = rows.map((r: any) => r.product_id);
  const allVars =
    pIds.length > 0
      ? await sql`SELECT * FROM product_variants WHERE product_id = ANY(${pIds}) AND is_active = true;`
      : [];

  return rows.map((r: any) => {
    const pVars = allVars.filter((v: any) => v.product_id === r.product_id);
    const product = formatProductRow(r, pVars);
    const variant = r.variant_id ? product.variants.find((v: any) => v.id === r.variant_id) || null : null;
    const unitPrice = product.basePrice + (variant ? variant.priceAdjustment : 0);
    const availableStock = variant ? variant.stock : product.stock;

    return {
      id: r.cart_item_id,
      productId: r.product_id,
      variantId: r.variant_id || '',
      quantity: Math.min(Number(r.quantity), Math.max(1, availableStock)),
      unitPrice,
      availableStock,
      product,
      variant
    };
  });
}

async function handleGetCart(userId: string, res: ServerResponse) {
  const items = await buildEnrichedCart(userId);
  sendJson(res, 200, { items });
}

async function handleUpsertCartItem(userId: string, body: any, res: ServerResponse, setExactQuantity: boolean) {
  const productId = body.productId;
  const variantId = body.variantId || '';
  const quantity = Number(body.quantity || 1);

  if (!productId || !Number.isFinite(quantity)) {
    return sendJson(res, 400, { error: 'Valid productId and quantity are required.' });
  }

  const sql = getDb();
  const [products, varCheckRows, existing] = await Promise.all([
    sql`SELECT id, stock, is_active FROM products WHERE id = ${productId} LIMIT 1;`,
    variantId
      ? sql`SELECT id, stock, is_active FROM product_variants WHERE id = ${variantId} AND product_id = ${productId} LIMIT 1;`
      : sql`SELECT SUM(stock)::int as total FROM product_variants WHERE product_id = ${productId} AND is_active = true;`,
    sql`
      SELECT id, quantity FROM cart_items
      WHERE user_id = ${userId} AND product_id = ${productId} AND variant_id = ${variantId}
      LIMIT 1;
    `
  ]);

  if (products.length === 0 || !products[0].is_active) {
    return sendJson(res, 404, { error: 'Product is not available.' });
  }

  let availableStock = Number(products[0].stock || 0);
  if (variantId) {
    if (varCheckRows.length === 0 || !varCheckRows[0].is_active) {
      return sendJson(res, 400, { error: 'Selected variant is unavailable.' });
    }
    availableStock = Number(varCheckRows[0].stock || 0);
  } else if (varCheckRows[0]?.total !== null && varCheckRows[0]?.total !== undefined) {
    availableStock = Number(varCheckRows[0].total);
  }

  if (quantity <= 0) {
    await sql`DELETE FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId} AND variant_id = ${variantId};`;
    const items = await buildEnrichedCart(userId);
    return sendJson(res, 200, { success: true, items });
  }

  if (availableStock <= 0) {
    return sendJson(res, 400, { error: 'This item is currently out of stock.' });
  }

  const desiredQty = setExactQuantity
    ? quantity
    : (existing[0] ? Number(existing[0].quantity) + quantity : quantity);

  if (desiredQty > availableStock) {
    return sendJson(res, 400, {
      error: `Only ${availableStock} unit(s) available in stock for this selection.`
    });
  }

  const itemId = existing[0]?.id || `crt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await sql`
    INSERT INTO cart_items (id, user_id, product_id, variant_id, quantity, created_at, updated_at)
    VALUES (${itemId}, ${userId}, ${productId}, ${variantId}, ${desiredQty}, NOW(), NOW())
    ON CONFLICT (user_id, product_id, variant_id) DO UPDATE SET
      quantity = ${desiredQty},
      updated_at = NOW();
  `;

  const items = await buildEnrichedCart(userId);
  sendJson(res, 200, { success: true, items });
}

async function handleRemoveCartItem(userId: string, itemId: string, res: ServerResponse) {
  const sql = getDb();
  await sql`DELETE FROM cart_items WHERE (id = ${itemId} OR (product_id || ':' || variant_id) = ${itemId}) AND user_id = ${userId};`;
  const items = await buildEnrichedCart(userId);
  sendJson(res, 200, { success: true, items });
}

async function handleGetWishlist(userId: string, res: ServerResponse) {
  const sql = getDb();
  const rows = await sql`
    SELECT w.id as wishlist_id, w.product_id, w.variant_id, w.created_at as saved_at,
           p.*, pc.name as category_name
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE w.user_id = ${userId} AND p.is_active = true
    ORDER BY w.created_at DESC;
  `;

  const pIds = rows.map((r: any) => r.product_id);
  const allVars =
    pIds.length > 0
      ? await sql`SELECT * FROM product_variants WHERE product_id = ANY(${pIds}) AND is_active = true;`
      : [];

  const items = rows.map((r: any) => {
    const product = formatProductRow(r, allVars.filter((v: any) => v.product_id === r.product_id));
    const variant = r.variant_id ? product.variants.find((v: any) => v.id === r.variant_id) || null : null;
    return {
      id: r.wishlist_id,
      productId: r.product_id,
      variantId: r.variant_id || '',
      createdAt: r.saved_at,
      product,
      variant
    };
  });

  sendJson(res, 200, { items });
}

async function handleToggleWishlist(userId: string, body: any, res: ServerResponse) {
  const productId = body.productId;
  const variantId = body.variantId || '';

  if (!productId) {
    return sendJson(res, 400, { error: 'Product ID is required.' });
  }

  const sql = getDb();
  const existing = await sql`
    SELECT id FROM wishlists
    WHERE user_id = ${userId} AND product_id = ${productId} AND variant_id = ${variantId}
    LIMIT 1;
  `;

  let added = false;
  if (existing.length > 0) {
    await sql`DELETE FROM wishlists WHERE id = ${existing[0].id};`;
    added = false;
  } else {
    const wishId = `wsh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await sql`
      INSERT INTO wishlists (id, user_id, product_id, variant_id)
      VALUES (${wishId}, ${userId}, ${productId}, ${variantId});
    `;
    added = true;
  }

  const rows = await sql`
    SELECT w.id as wishlist_id, w.product_id, w.variant_id, w.created_at as saved_at,
           p.*, pc.name as category_name
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE w.user_id = ${userId} AND p.is_active = true
    ORDER BY w.created_at DESC;
  `;
  const pIds = rows.map((r: any) => r.product_id);
  const allVars =
    pIds.length > 0
      ? await sql`SELECT * FROM product_variants WHERE product_id = ANY(${pIds}) AND is_active = true;`
      : [];
  const items = rows.map((r: any) => {
    const product = formatProductRow(r, allVars.filter((v: any) => v.product_id === r.product_id));
    const variant = r.variant_id ? product.variants.find((v: any) => v.id === r.variant_id) || null : null;
    return {
      id: r.wishlist_id,
      productId: r.product_id,
      variantId: r.variant_id || '',
      createdAt: r.saved_at,
      product,
      variant
    };
  });

  sendJson(res, 200, { success: true, added, items });
}

// =========================================================================
// PHASE 9 & 14: TRANSACTIONAL COD ORDER CREATION WITH ATOMIC STOCK LOCKING
// =========================================================================

async function handleCreateProductCodOrder(session: AuthenticatedSession, body: any, res: ServerResponse) {
  if (!checkOrderRateLimit(session.userId)) {
    return sendJson(res, 429, { error: 'Too many order requests. Please wait a minute before trying again.' });
  }

  const sql = getDb();
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : null;

  // 1. Idempotency check to prevent duplicate submissions
  if (idempotencyKey) {
    const existing = await sql`
      SELECT id, order_number FROM orders
      WHERE idempotency_key = ${idempotencyKey} AND user_id = ${session.userId}
      LIMIT 1;
    `;
    if (existing.length > 0) {
      const full = await fetchSingleProductOrder(existing[0].id);
      return sendJson(res, 200, { success: true, idempotent: true, order: full });
    }
  }

  // 2. Validate Shipping Address & Customer Information
  const addr = body.shippingAddress || {};
  const firstName = String(addr.firstName || '').trim();
  const lastName = String(addr.lastName || '').trim();
  const email = String(addr.email || session.email || '').trim().toLowerCase();
  const phone = normalizeIndianPhone(String(addr.phone || ''));
  const streetAddress = String(addr.streetAddress || '').trim();
  const apartment = String(addr.apartment || '').trim();
  const city = String(addr.city || '').trim();
  const state = String(addr.state || '').trim();
  const pincode = String(addr.pincode || '').trim();
  const deliveryMethod = body.deliveryMethod === 'EXPRESS' ? 'EXPRESS' : 'STANDARD';

  if (!firstName || !lastName) {
    return sendJson(res, 400, { error: 'First name and last name are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, { error: 'Please provide a valid email address.' });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return sendJson(res, 400, { error: 'Please provide a valid 10-digit Indian mobile number.' });
  }
  if (streetAddress.length < 5 || !city) {
    return sendJson(res, 400, { error: 'Complete street address and city are required.' });
  }
  if (!VALID_INDIAN_STATES.has(state.toLowerCase())) {
    return sendJson(res, 400, { error: 'Please select a valid Indian state or union territory.' });
  }
  if (!/^\d{6}$/.test(pincode)) {
    return sendJson(res, 400, { error: 'Please enter a valid 6-digit Indian pincode.' });
  }

  // 3. Load active cart from DB for this user (or sync items if DB cart is empty & client passed cartSnapshot)
  let cartRows = await sql`
    SELECT id, product_id, variant_id, quantity FROM cart_items WHERE user_id = ${session.userId};
  `;

  if (cartRows.length === 0 && Array.isArray(body.items) && body.items.length > 0) {
    for (const rawItem of body.items) {
      const pid = String(rawItem.productId || '');
      const vid = String(rawItem.variantId || '');
      const qty = Math.max(1, Math.floor(Number(rawItem.quantity || 1)));
      if (pid) {
        const crtId = `crt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        await sql`
          INSERT INTO cart_items (id, user_id, product_id, variant_id, quantity)
          VALUES (${crtId}, ${session.userId}, ${pid}, ${vid}, ${qty})
          ON CONFLICT (user_id, product_id, variant_id) DO UPDATE SET quantity = ${qty};
        `;
      }
    }
    cartRows = await sql`SELECT id, product_id, variant_id, quantity FROM cart_items WHERE user_id = ${session.userId};`;
  }

  if (cartRows.length === 0) {
    return sendJson(res, 400, { error: 'Your shopping cart is empty.' });
  }

  // 4. Validate every product, variant, authoritative server-side price, and atomic stock deduction
  const deductedItems: {
    cartItemId: string;
    productId: string;
    variantId: string;
    productName: string;
    variantLabel: string | null;
    size: string | null;
    colour: string | null;
    sku: string | null;
    image: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    prevStock: number;
    newStock: number;
  }[] = [];

  const rollbackDeductions = async () => {
    for (const d of deductedItems) {
      if (d.variantId) {
        await sql`UPDATE product_variants SET stock = stock + ${d.quantity} WHERE id = ${d.variantId};`;
      }
      await sql`UPDATE products SET stock = stock + ${d.quantity} WHERE id = ${d.productId};`;
    }
  };

  try {
    for (const ci of cartRows) {
      const qty = Number(ci.quantity);
      if (qty < 1) {
        await rollbackDeductions();
        return sendJson(res, 400, { error: 'Invalid item quantity in cart.' });
      }

      const prodRows = await sql`
        SELECT id, name, base_price, stock, images, is_active
        FROM products WHERE id = ${ci.product_id} LIMIT 1;
      `;
      if (prodRows.length === 0 || !prodRows[0].is_active) {
        await rollbackDeductions();
        return sendJson(res, 400, { error: 'One or more products in your cart are no longer available.' });
      }
      const prod = prodRows[0];
      let prodImages: string[] = [];
      if (Array.isArray(prod.images)) prodImages = prod.images;
      else if (typeof prod.images === 'string') {
        try { prodImages = JSON.parse(prod.images); } catch {}
      }

      let unitPrice = Number(prod.base_price);
      let variantLabel: string | null = null;
      let sizeSnap: string | null = null;
      let colourSnap: string | null = null;
      let skuSnap: string | null = null;
      let imageSnap: string | null = prodImages[0] || null;
      let prevStock = Number(prod.stock || 0);
      let newStock = prevStock;

      if (ci.variant_id) {
        const varRows = await sql`
          SELECT * FROM product_variants
          WHERE id = ${ci.variant_id} AND product_id = ${prod.id} AND is_active = true
          LIMIT 1;
        `;
        if (varRows.length === 0) {
          await rollbackDeductions();
          return sendJson(res, 400, { error: `Selected option for "${prod.name}" is no longer available.` });
        }
        const v = varRows[0];
        prevStock = Number(v.stock || 0);

        // Atomic conditional update prevents overselling under concurrent requests
        const updatedVar = await sql`
          UPDATE product_variants
          SET stock = stock - ${qty}, updated_at = NOW()
          WHERE id = ${v.id} AND stock >= ${qty}
          RETURNING stock;
        `;
        if (updatedVar.length === 0) {
          await rollbackDeductions();
          return sendJson(res, 409, {
            error: `Insufficient stock for "${prod.name} (${v.variant_name})". Available: ${prevStock}.`
          });
        }
        newStock = Number(updatedVar[0].stock);
        await sql`UPDATE products SET stock = GREATEST(0, stock - ${qty}), updated_at = NOW() WHERE id = ${prod.id};`;

        unitPrice = unitPrice + Number(v.price_adjustment || 0);
        variantLabel = v.variant_name;
        sizeSnap = v.size || null;
        colourSnap = v.colour || null;
        skuSnap = v.sku || null;
        if (v.image) imageSnap = v.image;
      } else {
        const updatedProd = await sql`
          UPDATE products
          SET stock = stock - ${qty}, updated_at = NOW()
          WHERE id = ${prod.id} AND stock >= ${qty}
          RETURNING stock;
        `;
        if (updatedProd.length === 0) {
          await rollbackDeductions();
          return sendJson(res, 409, {
            error: `Insufficient stock for "${prod.name}". Available: ${prevStock}.`
          });
        }
        newStock = Number(updatedProd[0].stock);
      }

      deductedItems.push({
        cartItemId: ci.id,
        productId: prod.id,
        variantId: ci.variant_id || '',
        productName: prod.name,
        variantLabel,
        size: sizeSnap,
        colour: colourSnap,
        sku: skuSnap,
        image: imageSnap,
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        prevStock,
        newStock
      });
    }

    // 5. Recalculate subtotal, configurable shipping & final total strictly on backend
    const storeConfig = await getStoreConfigFromDb();
    const subtotal = deductedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    let shippingAmount = 0;
    let expectedDeliveryDate = '';
    if (deliveryMethod === 'EXPRESS') {
      shippingAmount = storeConfig.expressShippingFee;
      expectedDeliveryDate = addBusinessDaysFormatted(
        storeConfig.expressDeliveryDaysMin,
        storeConfig.expressDeliveryDaysMax
      );
    } else {
      shippingAmount = subtotal >= storeConfig.freeShippingThreshold ? 0 : storeConfig.standardShippingFee;
      expectedDeliveryDate = addBusinessDaysFormatted(
        storeConfig.standardDeliveryDaysMin,
        storeConfig.standardDeliveryDaysMax
      );
    }
    const finalTotal = subtotal + shippingAmount;

    // 6. Generate Order ID & CAK-<timestamp>-<unique-suffix>
    const ts = Date.now();
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderId = `pord_${ts}_${suffix}`;
    const orderNumber = `CAK-${ts}-${suffix}`;
    const customerFullName = `${firstName} ${lastName}`.trim();
    const shippingSnapshot = {
      firstName,
      lastName,
      email,
      phone,
      streetAddress,
      apartment,
      city,
      state,
      pincode
    };

    // 7. Insert Order
    await sql`
      INSERT INTO orders (
        id, order_number, user_id, order_type, status,
        amount, subtotal_amount, shipping_amount, total_amount,
        payment_method, delivery_method, expected_delivery_date,
        shipping_address, customer_name, customer_email, customer_phone,
        cod_collected, inventory_deducted, idempotency_key,
        created_at, updated_at
      ) VALUES (
        ${orderId}, ${orderNumber}, ${session.userId}, 'PRODUCT', 'placed',
        ${finalTotal}, ${subtotal}, ${shippingAmount}, ${finalTotal},
        'COD', ${deliveryMethod}, ${expectedDeliveryDate},
        ${JSON.stringify(shippingSnapshot)}::jsonb, ${customerFullName}, ${email}, ${phone},
        false, true, ${idempotencyKey},
        NOW(), NOW()
      );
    `;

    // 8. Insert Order Items + Inventory Movements
    for (const item of deductedItems) {
      const oiId = `poi_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await sql`
        INSERT INTO order_items (
          id, order_id, product_id, variant_id,
          course_name_snapshot, product_name_snapshot,
          variant_label_snapshot, size_snapshot, colour_snapshot, sku_snapshot, image_snapshot,
          quantity, unit_price, line_total, price_at_purchase
        ) VALUES (
          ${oiId}, ${orderId}, ${item.productId}, ${item.variantId || null},
          ${item.productName}, ${item.productName},
          ${item.variantLabel}, ${item.size}, ${item.colour}, ${item.sku}, ${item.image},
          ${item.quantity}, ${item.unitPrice}, ${item.lineTotal}, ${item.unitPrice}
        );
      `;

      const movId = `inv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await sql`
        INSERT INTO inventory_movements (
          id, product_id, variant_id, order_id, change_amount, previous_stock, new_stock, reason, created_by
        ) VALUES (
          ${movId}, ${item.productId}, ${item.variantId || null}, ${orderId},
          ${-item.quantity}, ${item.prevStock}, ${item.newStock}, 'ORDER_PLACED', ${session.userId}
        );
      `;
    }

    // 9. Insert COD Payment record & Initial Order Status History
    const payId = `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await sql`
      INSERT INTO payments (id, order_id, payment_method, status, amount, created_at, updated_at)
      VALUES (${payId}, ${orderId}, 'COD', 'PENDING_COD', ${finalTotal}, NOW(), NOW());
    `;

    const histId = `osh_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await sql`
      INSERT INTO order_status_history (id, order_id, status, note, changed_by)
      VALUES (${histId}, ${orderId}, 'placed', 'COD order placed by customer and queued for studio confirmation.', ${session.userId});
    `;

    // 10. Save/update user shipping address & phone profile
    const addrId = `addr_${session.userId}`;
    await sql`
      INSERT INTO shipping_addresses (
        id, user_id, first_name, last_name, email, phone, street_address, apartment, city, state, pincode, is_default, updated_at
      ) VALUES (
        ${addrId}, ${session.userId}, ${firstName}, ${lastName}, ${email}, ${phone},
        ${streetAddress}, ${apartment}, ${city}, ${state}, ${pincode}, true, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        street_address = EXCLUDED.street_address,
        apartment = EXCLUDED.apartment,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        updated_at = NOW();
    `;

    await sql`
      UPDATE user_profiles SET phone = COALESCE(NULLIF(phone, ''), ${phone}), updated_at = NOW()
      WHERE user_id = ${session.userId};
    `;

    // 11. Clear active cart & invalidate product caches
    await sql`DELETE FROM cart_items WHERE user_id = ${session.userId};`;
    invalidateAllCommerceCache();

    const fullOrder = await fetchSingleProductOrder(orderId);
    if (fullOrder?.customerEmail) {
      await dispatchEmailAsync(generateProductOrderPlacedEmail(fullOrder.customerEmail, fullOrder));
    }
    sendJson(res, 200, { success: true, order: fullOrder });
  } catch (err: any) {
    await rollbackDeductions();
    throw err;
  }
}

async function handleCreateHamperOrder(
  session: AuthenticatedSession | null,
  body: any,
  res: ServerResponse
) {
  const customerName = String(body.customerName || '').trim();
  const customerPhone = String(body.customerPhone || '').trim();
  const deliveryDate = String(body.deliveryDate || '').trim();
  const deliveryAddress = String(body.deliveryAddress || '').trim();
  const occasion = String(body.occasion || 'Birthday Celebration').trim();
  const ribbonStyle = String(body.ribbonStyle || 'Royal Gold & Ivory Ribbon').trim();
  const recipientName = String(body.recipientName || '').trim();
  const greetingMessage = String(body.greetingMessage || '').trim();
  const specialRequirements = String(body.specialRequirements || '').trim();
  const quantity = Math.max(1, Math.min(50, Math.floor(Number(body.quantity || 1))));
  const idempotencyKey = String(body.idempotencyKey || '').trim() || null;

  if (!customerName || !customerPhone || !deliveryDate || !deliveryAddress) {
    return sendJson(res, 400, {
      error: 'Customer name, WhatsApp phone, delivery date, and delivery address are required.'
    });
  }

  const sql = getDb();

  if (idempotencyKey) {
    const existing = await sql`
      SELECT id FROM orders WHERE idempotency_key = ${idempotencyKey} LIMIT 1;
    `;
    if (existing.length > 0) {
      const existingOrder = await fetchSingleProductOrder(existing[0].id);
      return sendJson(res, 200, { success: true, order: existingOrder, duplicatePrevented: true });
    }
  }

  const unitPrice = 1599;
  const totalAmount = unitPrice * quantity;
  const orderId = `ord_hmp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const orderNumber = `CAK-HMP-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const hamperDetails = {
    hamperName: 'Artisan Keepsake Gift Hamper',
    occasion,
    ribbonStyle,
    recipientName: recipientName || null,
    greetingMessage: greetingMessage || null,
    specialRequirements: specialRequirements || null,
    preferredDeliveryDate: deliveryDate,
    quantity,
    unitPrice
  };

  const shippingAddr = {
    fullName: customerName,
    phone: customerPhone,
    streetAddress: deliveryAddress,
    preferredDeliveryDate: deliveryDate
  };

  await sql`
    INSERT INTO orders (
      id, order_number, user_id, order_type, status,
      amount, subtotal_amount, shipping_amount, total_amount,
      payment_method, delivery_method, expected_delivery_date,
      shipping_address, hamper_details,
      customer_name, customer_email, customer_phone,
      cod_collected, inventory_deducted, idempotency_key,
      created_at, updated_at
    ) VALUES (
      ${orderId}, ${orderNumber}, ${session?.userId || null}, 'HAMPER', 'placed',
      ${totalAmount}, ${totalAmount}, ${0}, ${totalAmount},
      'WHATSAPP_MANUAL', 'BESPOKE', ${deliveryDate},
      ${JSON.stringify(shippingAddr)}::jsonb, ${JSON.stringify(hamperDetails)}::jsonb,
      ${customerName}, ${session?.email || ''}, ${customerPhone},
      false, false, ${idempotencyKey},
      NOW(), NOW()
    );
  `;

  const orderItemId = `oi_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const variantLabel = `${occasion} • ${ribbonStyle}`;
  await sql`
    INSERT INTO order_items (
      id, order_id, product_id, variant_id,
      course_name_snapshot, product_name_snapshot, variant_label_snapshot,
      size_snapshot, colour_snapshot, sku_snapshot, image_snapshot,
      quantity, unit_price, line_total, price_at_purchase, created_at
    ) VALUES (
      ${orderItemId}, ${orderId}, NULL, NULL,
      'Artisan Keepsake Gift Hamper', 'Artisan Keepsake Gift Hamper', ${variantLabel},
      NULL, ${ribbonStyle}, 'CAK-HMP-BESPOKE', '/images/gift-hamper-poster.jpg',
      ${quantity}, ${unitPrice}, ${totalAmount}, ${totalAmount}, NOW()
    );
  `;

  const payId = `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await sql`
    INSERT INTO payments (id, order_id, payment_method, status, amount, created_at, updated_at)
    VALUES (${payId}, ${orderId}, 'WHATSAPP_MANUAL', 'AWAITING_CONFIRMATION', ${totalAmount}, NOW(), NOW());
  `;

  const histId = `osh_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await sql`
    INSERT INTO order_status_history (id, order_id, status, note, changed_by, created_at)
    VALUES (
      ${histId}, ${orderId}, 'placed',
      'Bespoke Gift Hamper request submitted via WhatsApp concierge.',
      ${session?.userId || null}, NOW()
    );
  `;

  invalidateAllCommerceCache();
  const fullOrder = await fetchSingleProductOrder(orderId);
  const hamperEmail = fullOrder?.customerEmail || session?.email;
  if (hamperEmail && fullOrder) {
    await dispatchEmailAsync(generateHamperOrderPlacedEmail(hamperEmail, fullOrder));
  }
  sendJson(res, 200, { success: true, order: fullOrder });
}

async function handlePublicTrackHamperOrder(
  session: AuthenticatedSession | null,
  orderNumberOrId: string,
  res: ServerResponse
) {
  const order = await fetchSingleProductOrder(orderNumberOrId);
  if (!order || order.orderType !== 'HAMPER') {
    return sendJson(res, 404, { error: 'Gift Hamper order not found.' });
  }

  const isPrivileged = Boolean(
    session && (session.role === 'ADMIN' || (order.userId && order.userId === session.userId))
  );

  if (isPrivileged) {
    return sendJson(res, 200, { order });
  }

  // Mask private contact & street details for unauthenticated tracking links while preserving customization & status
  const maskedName = order.customerName
    ? order.customerName
        .split(' ')
        .map((part: string) => (part.length <= 1 ? part : `${part[0]}${'*'.repeat(Math.min(part.length - 1, 4))}`))
        .join(' ')
    : 'Guest';

  sendJson(res, 200, {
    order: {
      ...order,
      customerName: maskedName,
      customerEmail: '',
      customerPhone: order.customerPhone ? `******${order.customerPhone.slice(-4)}` : '',
      shippingAddress: {
        preferredDeliveryDate: order.expectedDeliveryDate
      }
    }
  });
}

async function fetchSingleProductOrder(orderIdOrNum: string) {
  const sql = getDb();
  const orders = await sql`
    SELECT o.*, pay.status as payment_status
    FROM orders o
    LEFT JOIN payments pay ON o.id = pay.order_id
    WHERE (o.id = ${orderIdOrNum} OR o.order_number = ${orderIdOrNum})
      AND o.order_type IN ('PRODUCT', 'HAMPER')
    LIMIT 1;
  `;
  if (orders.length === 0) return null;

  const ord = orders[0];
  const items = await sql`
    SELECT * FROM order_items WHERE order_id = ${ord.id} ORDER BY created_at ASC;
  `;
  const history = await sql`
    SELECT * FROM order_status_history WHERE order_id = ${ord.id} ORDER BY created_at ASC;
  `;

  return formatProductOrder(ord, items, history);
}

function formatProductOrder(ord: any, items: any[], history: any[]) {
  let shippingAddr = ord.shipping_address || {};
  if (typeof shippingAddr === 'string') {
    try { shippingAddr = JSON.parse(shippingAddr); } catch {}
  }

  let hamperDetails = ord.hamper_details || null;
  if (typeof hamperDetails === 'string') {
    try { hamperDetails = JSON.parse(hamperDetails); } catch { hamperDetails = null; }
  }

  const orderType = ord.order_type === 'HAMPER' ? ('HAMPER' as const) : ('PRODUCT' as const);
  const fullNameFromAddr = shippingAddr.firstName
    ? `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim()
    : (shippingAddr.fullName || '');

  return {
    id: ord.id,
    orderNumber: ord.order_number,
    userId: ord.user_id,
    orderType,
    customerName: ord.customer_name || fullNameFromAddr || 'Customer',
    customerEmail: ord.customer_email || shippingAddr.email || '',
    customerPhone: ord.customer_phone || shippingAddr.phone || '',
    subtotalAmount: Number(ord.subtotal_amount ?? ord.total_amount ?? ord.amount ?? 0),
    shippingAmount: Number(ord.shipping_amount ?? 0),
    totalAmount: Number(ord.total_amount ?? ord.amount ?? 0),
    deliveryMethod: ord.delivery_method || (orderType === 'HAMPER' ? 'BESPOKE' : 'STANDARD'),
    expectedDeliveryDate: ord.expected_delivery_date || '5–7 Business Days',
    shippingAddress: shippingAddr,
    hamperDetails,
    paymentMethod: ord.payment_method || (orderType === 'HAMPER' ? 'WHATSAPP_MANUAL' : 'COD'),
    paymentStatus: ord.cod_collected
      ? 'COLLECTED'
      : (ord.payment_status || (orderType === 'HAMPER' ? 'AWAITING_CONFIRMATION' : 'PENDING_COD')),
    codCollected: Boolean(ord.cod_collected),
    codCollectedAt: ord.cod_collected_at || null,
    status: ord.status || 'placed',
    items: items.map((it: any) => ({
      id: it.id,
      productId: it.product_id,
      variantId: it.variant_id,
      productName: it.product_name_snapshot || it.course_name_snapshot,
      variantLabel: it.variant_label_snapshot,
      size: it.size_snapshot,
      colour: it.colour_snapshot,
      sku: it.sku_snapshot,
      image: it.image_snapshot,
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unit_price ?? it.price_at_purchase ?? 0),
      lineTotal: Number(it.line_total ?? it.price_at_purchase ?? 0)
    })),
    statusHistory: history.map((h: any) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      changedBy: h.changed_by,
      createdAt: h.created_at
    })),
    createdAt: ord.created_at,
    updatedAt: ord.updated_at
  };
}

async function handleGetUserProductOrders(userId: string, res: ServerResponse) {
  const sql = getDb();
  const orders = await sql`
    SELECT o.*, pay.status as payment_status
    FROM orders o
    LEFT JOIN payments pay ON o.id = pay.order_id
    WHERE o.user_id = ${userId} AND o.order_type IN ('PRODUCT', 'HAMPER')
    ORDER BY o.created_at DESC;
  `;

  if (orders.length === 0) {
    return sendJson(res, 200, { orders: [] });
  }

  const orderIds = orders.map((o: any) => o.id);
  const items = await sql`SELECT * FROM order_items WHERE order_id = ANY(${orderIds}) ORDER BY created_at ASC;`;
  const history = await sql`SELECT * FROM order_status_history WHERE order_id = ANY(${orderIds}) ORDER BY created_at ASC;`;

  const formatted = orders.map((o: any) =>
    formatProductOrder(
      o,
      items.filter((i: any) => i.order_id === o.id),
      history.filter((h: any) => h.order_id === o.id)
    )
  );

  sendJson(res, 200, { orders: formatted });
}

async function handleGetSingleProductOrder(session: AuthenticatedSession, idOrNum: string, res: ServerResponse) {
  const order = await fetchSingleProductOrder(idOrNum);
  if (!order) {
    return sendJson(res, 404, { error: 'Product order not found.' });
  }
  if (order.userId !== session.userId && session.role !== 'ADMIN') {
    return sendJson(res, 403, { error: 'Forbidden: You do not have access to this order.' });
  }
  sendJson(res, 200, { order });
}

// =========================================================================
// ADMIN PRODUCT & INVENTORY MANAGEMENT
// =========================================================================

async function handleAdminListProducts(res: ServerResponse) {
  const sql = getDb();
  const rows = await sql`
    SELECT p.*, pc.name as category_name
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    ORDER BY p.created_at DESC;
  `;
  const variants = await sql`SELECT * FROM product_variants ORDER BY created_at ASC, id ASC;`;
  const movements = await sql`SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 50;`;

  const products = rows.map((r: any) =>
    formatProductRow(r, variants.filter((v: any) => v.product_id === r.id))
  );

  sendJson(res, 200, { products, movements });
}

async function handleAdminSaveProduct(
  existingId: string | null,
  body: any,
  adminUserId: string,
  res: ServerResponse
) {
  const name = String(body.name || '').trim();
  if (!name) return sendJson(res, 400, { error: 'Product name is required.' });

  const basePrice = Number(body.basePrice ?? body.price ?? 0);
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return sendJson(res, 400, { error: 'Base price must be greater than zero.' });
  }

  const compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
  const slug =
    String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '') ||
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

  const productId = existingId || `prod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const images = Array.isArray(body.images) && body.images.length > 0
    ? body.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0)
    : ['/images/hero-cake.png'];

  const incomingVariants = Array.isArray(body.variants) ? body.variants : [];
  const totalVariantStock = incomingVariants
    .filter((v: any) => v.isActive !== false)
    .reduce((sum: number, v: any) => sum + Math.max(0, Number(v.stock || 0)), 0);
  const overallStock = incomingVariants.length > 0
    ? totalVariantStock
    : Math.max(0, Number(body.stock ?? 0));

  const sql = getDb();

  await sql`
    INSERT INTO products (
      id, slug, name, short_description, description, category_id,
      base_price, compare_at_price, images, featured, is_exclusive, is_active, stock,
      badge, product_info, delivery_info, created_at, updated_at
    ) VALUES (
      ${productId}, ${slug}, ${name}, ${body.shortDescription || ''}, ${body.description || ''},
      ${body.categoryId || null}, ${basePrice}, ${compareAtPrice}, ${JSON.stringify(images)}::jsonb,
      ${Boolean(body.featured)}, ${Boolean(body.isExclusive)}, ${body.isActive !== false}, ${overallStock},
      ${body.badge || null}, ${body.productInfo || null}, ${body.deliveryInfo || null}, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      name = EXCLUDED.name,
      short_description = EXCLUDED.short_description,
      description = EXCLUDED.description,
      category_id = EXCLUDED.category_id,
      base_price = EXCLUDED.base_price,
      compare_at_price = EXCLUDED.compare_at_price,
      images = EXCLUDED.images,
      featured = EXCLUDED.featured,
      is_exclusive = EXCLUDED.is_exclusive,
      is_active = EXCLUDED.is_active,
      stock = EXCLUDED.stock,
      badge = EXCLUDED.badge,
      product_info = EXCLUDED.product_info,
      delivery_info = EXCLUDED.delivery_info,
      updated_at = NOW();
  `;

  // Sync variants cleanly (soft/delete removed variants & upsert active ones)
  const keptVariantIds: string[] = [];
  for (let i = 0; i < incomingVariants.length; i++) {
    const v = incomingVariants[i];
    const vid = v.id && String(v.id).startsWith('var')
      ? String(v.id)
      : `var_${Date.now()}_${i}_${crypto.randomBytes(2).toString('hex')}`;
    keptVariantIds.push(vid);

    const vName = String(v.variantName || `${v.colour || ''} ${v.size || ''}`.trim() || `Option ${i + 1}`);
    await sql`
      INSERT INTO product_variants (
        id, product_id, variant_name, size, colour, colour_hex, sku, price_adjustment, stock, image, is_active, updated_at
      ) VALUES (
        ${vid}, ${productId}, ${vName}, ${v.size || null}, ${v.colour || null}, ${v.colourHex || null},
        ${v.sku || null}, ${Number(v.priceAdjustment || 0)}, ${Math.max(0, Number(v.stock || 0))},
        ${v.image || null}, ${v.isActive !== false}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        variant_name = EXCLUDED.variant_name,
        size = EXCLUDED.size,
        colour = EXCLUDED.colour,
        colour_hex = EXCLUDED.colour_hex,
        sku = EXCLUDED.sku,
        price_adjustment = EXCLUDED.price_adjustment,
        stock = EXCLUDED.stock,
        image = EXCLUDED.image,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `;
  }

  if (existingId) {
    if (keptVariantIds.length > 0) {
      await sql`
        DELETE FROM product_variants WHERE product_id = ${productId} AND id != ALL(${keptVariantIds});
      `;
    } else {
      await sql`DELETE FROM product_variants WHERE product_id = ${productId};`;
    }
  }

  // Record audit/inventory note
  const movId = `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await sql`
    INSERT INTO inventory_movements (id, product_id, change_amount, previous_stock, new_stock, reason, created_by)
    VALUES (${movId}, ${productId}, 0, ${overallStock}, ${overallStock}, 'ADMIN_ADJUSTMENT', ${adminUserId});
  `;

  invalidateAllCommerceCache();

  const savedRows = await sql`SELECT p.*, pc.name as category_name FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.id = ${productId};`;
  const savedVars = await sql`SELECT * FROM product_variants WHERE product_id = ${productId};`;
  sendJson(res, 200, { success: true, product: formatProductRow(savedRows[0], savedVars) });
}

async function handleAdminToggleProductActive(productId: string, res: ServerResponse) {
  const sql = getDb();
  const rows = await sql`
    UPDATE products SET is_active = NOT is_active, updated_at = NOW()
    WHERE id = ${productId} RETURNING id, is_active;
  `;
  if (rows.length === 0) return sendJson(res, 404, { error: 'Product not found.' });
  invalidateAllCommerceCache();
  sendJson(res, 200, { success: true, isActive: rows[0].is_active });
}

async function handleAdminDeleteProduct(productId: string, res: ServerResponse) {
  const sql = getDb();
  // Detach order_items product_id while preserving full product/variant snapshot fields on historical orders
  await sql`UPDATE order_items SET product_id = NULL WHERE product_id = ${productId};`;
  const deleted = await sql`DELETE FROM products WHERE id = ${productId} RETURNING id;`;
  if (deleted.length === 0) {
    return sendJson(res, 404, { error: 'Product not found.' });
  }
  invalidateAllCommerceCache();
  sendJson(res, 200, { success: true, archived: false, deleted: true });
}

async function handleAdminAdjustStock(productId: string, body: any, adminUserId: string, res: ServerResponse) {
  const variantId = body.variantId || null;
  const newStock = Math.max(0, Math.floor(Number(body.stock ?? 0)));
  const sql = getDb();

  if (variantId) {
    const vRows = await sql`SELECT stock FROM product_variants WHERE id = ${variantId} AND product_id = ${productId};`;
    if (vRows.length === 0) return sendJson(res, 404, { error: 'Variant not found.' });
    const prev = Number(vRows[0].stock || 0);
    await sql`UPDATE product_variants SET stock = ${newStock}, updated_at = NOW() WHERE id = ${variantId};`;

    // Recompute parent product total stock
    const sumRows = await sql`SELECT COALESCE(SUM(stock), 0)::int as total FROM product_variants WHERE product_id = ${productId} AND is_active = true;`;
    await sql`UPDATE products SET stock = ${sumRows[0].total}, updated_at = NOW() WHERE id = ${productId};`;

    const movId = `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await sql`
      INSERT INTO inventory_movements (id, product_id, variant_id, change_amount, previous_stock, new_stock, reason, created_by)
      VALUES (${movId}, ${productId}, ${variantId}, ${newStock - prev}, ${prev}, ${newStock}, 'ADMIN_RESTOCK', ${adminUserId});
    `;
  } else {
    const pRows = await sql`SELECT stock FROM products WHERE id = ${productId};`;
    if (pRows.length === 0) return sendJson(res, 404, { error: 'Product not found.' });
    const prev = Number(pRows[0].stock || 0);
    await sql`UPDATE products SET stock = ${newStock}, updated_at = NOW() WHERE id = ${productId};`;

    const movId = `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await sql`
      INSERT INTO inventory_movements (id, product_id, change_amount, previous_stock, new_stock, reason, created_by)
      VALUES (${movId}, ${productId}, ${newStock - prev}, ${prev}, ${newStock}, 'ADMIN_RESTOCK', ${adminUserId});
    `;
  }

  invalidateAllCommerceCache();
  sendJson(res, 200, { success: true });
}

async function handleAdminSaveCategory(existingId: string | null, body: any, res: ServerResponse) {
  const name = String(body.name || '').trim();
  if (!name) return sendJson(res, 400, { error: 'Category name is required.' });
  const slug =
    String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '') ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = existingId || `cat-prod-${Date.now()}`;

  const sql = getDb();
  await sql`
    INSERT INTO product_categories (id, name, slug, description, image, is_active, sort_order, updated_at)
    VALUES (${id}, ${name}, ${slug}, ${body.description || ''}, ${body.image || ''}, ${body.isActive !== false}, ${Number(body.sortOrder || 0)}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      is_active = EXCLUDED.is_active,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW();
  `;

  invalidateAllCommerceCache();
  const rows = await sql`SELECT * FROM product_categories WHERE id = ${id};`;
  sendJson(res, 200, { success: true, category: rows[0] });
}

// =========================================================================
// ADMIN PRODUCT ORDER FULFILLMENT, COD COLLECTION & INVENTORY RESTORATION
// =========================================================================

async function handleAdminListProductOrders(parsedUrl: URL, res: ServerResponse) {
  const statusFilter = (parsedUrl.searchParams.get('status') || 'all').toLowerCase();
  const search = (parsedUrl.searchParams.get('search') || '').trim().toLowerCase();

  const sql = getDb();
  const orders = await sql`
    SELECT o.*, pay.status as payment_status, u.name as account_name, u.email as account_email
    FROM orders o
    LEFT JOIN payments pay ON o.id = pay.order_id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.order_type IN ('PRODUCT', 'HAMPER')
    ORDER BY o.created_at DESC;
  `;

  const orderIds = orders.map((o: any) => o.id);
  const items = orderIds.length > 0 ? await sql`SELECT * FROM order_items WHERE order_id = ANY(${orderIds});` : [];
  const history = orderIds.length > 0 ? await sql`SELECT * FROM order_status_history WHERE order_id = ANY(${orderIds}) ORDER BY created_at ASC;` : [];

  let formatted = orders.map((o: any) =>
    formatProductOrder(
      { ...o, customer_name: o.customer_name || o.account_name, customer_email: o.customer_email || o.account_email },
      items.filter((i: any) => i.order_id === o.id),
      history.filter((h: any) => h.order_id === o.id)
    )
  );

  if (statusFilter !== 'all') {
    formatted = formatted.filter((o: any) => o.status.toLowerCase() === statusFilter);
  }

  if (search) {
    formatted = formatted.filter((o: any) =>
      o.orderNumber.toLowerCase().includes(search) ||
      o.customerName.toLowerCase().includes(search) ||
      o.customerEmail.toLowerCase().includes(search) ||
      o.customerPhone.toLowerCase().includes(search) ||
      (o.hamperDetails?.occasion || '').toLowerCase().includes(search) ||
      (o.hamperDetails?.recipientName || '').toLowerCase().includes(search)
    );
  }

  const productOrders = formatted.filter((o: any) => o.orderType === 'PRODUCT');
  const hamperOrders = formatted.filter((o: any) => o.orderType === 'HAMPER');

  sendJson(res, 200, {
    orders: productOrders,
    hamperOrders,
    total: productOrders.length,
    hamperTotal: hamperOrders.length
  });
}

async function handleAdminUpdateProductOrderStatus(
  orderId: string,
  body: any,
  adminUserId: string,
  res: ServerResponse
) {
  const nextStatus = String(body.status || '').toLowerCase() as any;
  const note = String(body.note || '').trim();

  if (!PRODUCT_ORDER_STATUSES.includes(nextStatus)) {
    return sendJson(res, 400, { error: 'Invalid product order status.' });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT id, order_number, order_type, status, inventory_deducted
    FROM orders
    WHERE (id = ${orderId} OR order_number = ${orderId})
    LIMIT 1;
  `;

  if (rows.length === 0) return sendJson(res, 404, { error: 'Order not found.' });
  const ord = rows[0];

  if (ord.order_type !== 'PRODUCT' && ord.order_type !== 'HAMPER') {
    return sendJson(res, 400, { error: 'Course orders use course payment confirmation, not delivery fulfillment.' });
  }

  if (ord.status === 'cancelled' && nextStatus !== 'cancelled') {
    return sendJson(res, 400, { error: 'Cancelled orders cannot be reopened directly.' });
  }

  // Handle stock restoration atomically if cancelling an eligible order
  if (nextStatus === 'cancelled' && ord.inventory_deducted) {
    const orderItems = await sql`SELECT * FROM order_items WHERE order_id = ${ord.id};`;
    for (const item of orderItems) {
      if (!item.product_id) continue;
      const qty = Number(item.quantity || 1);
      if (item.variant_id) {
        const vRows = await sql`
          UPDATE product_variants SET stock = stock + ${qty}, updated_at = NOW()
          WHERE id = ${item.variant_id}
          RETURNING stock;
        `;
        await sql`UPDATE products SET stock = stock + ${qty}, updated_at = NOW() WHERE id = ${item.product_id};`;
        const newStk = vRows[0] ? Number(vRows[0].stock) : qty;
        const movId = `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        await sql`
          INSERT INTO inventory_movements (id, product_id, variant_id, order_id, change_amount, previous_stock, new_stock, reason, created_by)
          VALUES (${movId}, ${item.product_id}, ${item.variant_id}, ${ord.id}, ${qty}, ${newStk - qty}, ${newStk}, 'ORDER_CANCELLED', ${adminUserId});
        `;
      } else {
        const pRows = await sql`
          UPDATE products SET stock = stock + ${qty}, updated_at = NOW()
          WHERE id = ${item.product_id}
          RETURNING stock;
        `;
        const newStk = pRows[0] ? Number(pRows[0].stock) : qty;
        const movId = `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        await sql`
          INSERT INTO inventory_movements (id, product_id, order_id, change_amount, previous_stock, new_stock, reason, created_by)
          VALUES (${movId}, ${item.product_id}, ${ord.id}, ${qty}, ${newStk - qty}, ${newStk}, 'ORDER_CANCELLED', ${adminUserId});
        `;
      }
    }

    await sql`UPDATE orders SET inventory_deducted = false WHERE id = ${ord.id};`;
    await sql`UPDATE payments SET status = 'CANCELLED', updated_at = NOW() WHERE order_id = ${ord.id} AND status != 'COLLECTED';`;
  }

  await sql`
    UPDATE orders SET status = ${nextStatus}, updated_at = NOW() WHERE id = ${ord.id};
  `;

  const histId = `osh_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await sql`
    INSERT INTO order_status_history (id, order_id, status, note, changed_by)
    VALUES (${histId}, ${ord.id}, ${nextStatus}, ${note || `Status updated to ${nextStatus.toUpperCase()} by administrator.`}, ${adminUserId});
  `;

  const auditId = `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await sql`
    INSERT INTO admin_audit_logs (id, admin_user_id, order_id, action, previous_status, new_status)
    VALUES (${auditId}, ${adminUserId}, ${ord.id}, 'UPDATE_PRODUCT_ORDER_STATUS', ${ord.status}, ${nextStatus});
  `;

  invalidateAllCommerceCache();
  const updated = await fetchSingleProductOrder(ord.id);
  if (updated?.customerEmail) {
    await dispatchEmailAsync(generateProductOrderStatusEmail(updated.customerEmail, updated, nextStatus, note));
  }
  sendJson(res, 200, { success: true, order: updated });
}

async function handleAdminCollectCodPayment(orderId: string, adminUserId: string, res: ServerResponse) {
  const sql = getDb();
  const rows = await sql`
    SELECT id, order_type, status, cod_collected FROM orders WHERE (id = ${orderId} OR order_number = ${orderId}) LIMIT 1;
  `;
  if (rows.length === 0) return sendJson(res, 404, { error: 'Order not found.' });
  const ord = rows[0];

  if (ord.order_type !== 'PRODUCT' && ord.order_type !== 'HAMPER') {
    return sendJson(res, 400, { error: 'Only physical product or gift hamper orders can mark payment collected here.' });
  }
  if (ord.status === 'cancelled') {
    return sendJson(res, 400, { error: 'Cannot record payment for a cancelled order.' });
  }
  if (ord.cod_collected) {
    return sendJson(res, 400, { error: 'Payment has already been recorded for this order.' });
  }

  await sql`
    UPDATE orders
    SET cod_collected = true, cod_collected_at = NOW(), cod_collected_by = ${adminUserId}, updated_at = NOW()
    WHERE id = ${ord.id};
  `;
  await sql`
    UPDATE payments
    SET status = 'COLLECTED', confirmed_by = ${adminUserId}, confirmed_at = NOW(), updated_at = NOW()
    WHERE order_id = ${ord.id};
  `;
  const auditId = `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await sql`
    INSERT INTO admin_audit_logs (id, admin_user_id, order_id, action, previous_status, new_status)
    VALUES (
      ${auditId}, ${adminUserId}, ${ord.id},
      ${ord.order_type === 'HAMPER' ? 'RECORD_HAMPER_PAYMENT' : 'RECORD_COD_COLLECTION'},
      ${ord.order_type === 'HAMPER' ? 'AWAITING_CONFIRMATION' : 'PENDING_COD'},
      'COLLECTED'
    );
  `;

  invalidateAllCommerceCache();
  const updated = await fetchSingleProductOrder(ord.id);
  if (updated?.customerEmail) {
    await dispatchEmailAsync(generatePaymentCollectedEmail(updated.customerEmail, updated));
  }
  sendJson(res, 200, { success: true, order: updated });
}

// =========================================================================
// PHASE 15: ADMIN CUSTOMER CRM & DUAL-COMMERCE ANALYTICS
// =========================================================================

async function handleAdminCustomers(res: ServerResponse) {
  const sql = getDb();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
           p.phone, p.bio,
           COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'ACTIVE')::int as active_enrollments_count,
           COUNT(DISTINCT o.id) FILTER (WHERE o.order_type IN ('PRODUCT', 'HAMPER'))::int as product_orders_count,
           COUNT(DISTINCT o.id) FILTER (WHERE COALESCE(o.order_type, 'COURSE') = 'COURSE' AND o.status = 'COMPLETED')::int as course_orders_count,
           COALESCE(SUM(COALESCE(o.total_amount, o.amount, 0)) FILTER (WHERE o.order_type IN ('PRODUCT', 'HAMPER') AND o.status != 'cancelled'), 0)::numeric as product_spend,
           COALESCE(SUM(COALESCE(o.total_amount, o.amount, 0)) FILTER (WHERE COALESCE(o.order_type, 'COURSE') = 'COURSE' AND o.status = 'COMPLETED'), 0)::numeric as course_spend,
           MAX(o.created_at) as latest_order_at
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN enrollments e ON u.id = e.user_id
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, p.phone, p.bio
    ORDER BY u.created_at DESC;
  `;

  const users = rows.map((r: any) => ({
    ...r,
    product_spend: Number(r.product_spend || 0),
    course_spend: Number(r.course_spend || 0)
  }));

  sendJson(res, 200, { customers: users, users });
}

async function handleAdminCustomerOrders(userId: string, res: ServerResponse) {
  const sql = getDb();
  const orders = await sql`
    SELECT o.*, oi.course_name_snapshot, oi.product_name_snapshot, oi.variant_label_snapshot, oi.quantity, pay.status as payment_status
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN payments pay ON o.id = pay.order_id
    WHERE o.user_id = ${userId}
    ORDER BY o.created_at DESC;
  `;
  sendJson(res, 200, { orders });
}

async function handleAdminAnalytics(range: string, res: ServerResponse) {
  const sql = getDb();

  let dateCutoff: Date | null = null;
  const now = new Date();
  if (range === 'today') {
    dateCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7d') {
    dateCutoff = new Date(now.getTime() - 7 * 86400_000);
  } else if (range === '30d') {
    dateCutoff = new Date(now.getTime() - 30 * 86400_000);
  } else if (range === '1y') {
    dateCutoff = new Date(now.getTime() - 365 * 86400_000);
  }

  const allOrders = await sql`
    SELECT id, order_number, user_id, COALESCE(order_type, 'COURSE') as order_type, status,
           COALESCE(total_amount, amount, 0)::numeric as total_amount,
           cod_collected, created_at, customer_name
    FROM orders
    ORDER BY created_at DESC;
  `;

  const scopedOrders = dateCutoff
    ? allOrders.filter((o: any) => new Date(o.created_at) >= dateCutoff!)
    : allOrders;

  const productOrders = scopedOrders.filter((o: any) => o.order_type === 'PRODUCT' || o.order_type === 'HAMPER');
  const courseOrders = scopedOrders.filter((o: any) => o.order_type !== 'PRODUCT' && o.order_type !== 'HAMPER');

  const collectedCodRevenue = productOrders
    .filter((o: any) => o.status !== 'cancelled' && Boolean(o.cod_collected))
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

  const pendingCodValue = productOrders
    .filter((o: any) => o.status !== 'cancelled' && !o.cod_collected)
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

  const activeProductOrders = productOrders.filter(
    (o: any) => !['delivered', 'cancelled'].includes(String(o.status).toLowerCase())
  ).length;

  const cancelledProductOrders = productOrders.filter(
    (o: any) => String(o.status).toLowerCase() === 'cancelled'
  ).length;

  const nonCancelledProductOrders = productOrders.filter((o: any) => String(o.status).toLowerCase() !== 'cancelled');
  const totalProductGmv = nonCancelledProductOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);
  const averageProductOrderValue =
    nonCancelledProductOrders.length > 0 ? Math.round(totalProductGmv / nonCancelledProductOrders.length) : 0;

  const courseRevenue = courseOrders
    .filter((o: any) => String(o.status).toUpperCase() === 'COMPLETED')
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

  const refundedCourseOrders = courseOrders.filter(
    (o: any) => String(o.status).toUpperCase() === 'REFUNDED'
  ).length;

  const totalRevenue = collectedCodRevenue + courseRevenue;

  // Sales by product category & best-selling products
  const scopedProductOrderIds = nonCancelledProductOrders.map((o: any) => o.id);
  let salesByCategory: any[] = [];
  let bestSellingProducts: any[] = [];

  if (scopedProductOrderIds.length > 0) {
    const itemStats = await sql`
      SELECT oi.product_id,
             COALESCE(p.name, oi.product_name_snapshot) as product_name,
             COALESCE(pc.name, 'Uncategorized') as category_name,
             SUM(oi.quantity)::int as units_sold,
             SUM(COALESCE(oi.line_total, oi.price_at_purchase))::numeric as gross_sales
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE oi.order_id = ANY(${scopedProductOrderIds})
      GROUP BY oi.product_id, COALESCE(p.name, oi.product_name_snapshot), COALESCE(pc.name, 'Uncategorized')
      ORDER BY units_sold DESC;
    `;

    bestSellingProducts = itemStats.slice(0, 6).map((r: any) => ({
      productId: r.product_id,
      productName: r.product_name,
      categoryName: r.category_name,
      unitsSold: Number(r.units_sold),
      grossSales: Number(r.gross_sales)
    }));

    const catAgg: Record<string, { categoryName: string; unitsSold: number; grossSales: number }> = {};
    for (const r of itemStats) {
      const cname = r.category_name;
      if (!catAgg[cname]) catAgg[cname] = { categoryName: cname, unitsSold: 0, grossSales: 0 };
      catAgg[cname].unitsSold += Number(r.units_sold);
      catAgg[cname].grossSales += Number(r.gross_sales);
    }
    salesByCategory = Object.values(catAgg).sort((a, b) => b.grossSales - a.grossSales);
  }

  // Customers & Inventory Summary
  const customerCountRows = await sql`SELECT COUNT(*)::int as cnt FROM users WHERE role = 'USER';`;
  const courseStatsRows = await sql`
    SELECT COUNT(*)::int as total_courses,
           COUNT(*) FILTER (WHERE status = 'published')::int as published_courses
    FROM courses;
  `;

  const inventoryRows = await sql`
    SELECT p.id, p.name, p.stock, p.is_active,
           COUNT(v.id)::int as variant_count,
           MIN(v.stock) as min_variant_stock
    FROM products p
    LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
    WHERE p.is_active = true
    GROUP BY p.id;
  `;

  const outOfStockProducts = inventoryRows.filter((r: any) => Number(r.stock) <= 0);
  const lowStockProducts = inventoryRows.filter((r: any) => Number(r.stock) > 0 && Number(r.stock) <= 10);

  const recentStudents = await sql`
    SELECT id, name, email, created_at FROM users WHERE role = 'USER' ORDER BY created_at DESC LIMIT 5;
  `;

  sendJson(res, 200, {
    range,
    kpis: {
      totalRevenue,
      collectedCodRevenue,
      pendingCodValue,
      courseRevenue,
      totalProductOrders: productOrders.length,
      totalCoursePurchases: courseOrders.filter((o: any) => String(o.status).toUpperCase() === 'COMPLETED').length,
      totalCourseOrders: courseOrders.length,
      activeProductOrders,
      cancelledProductOrders,
      refundedOrders: refundedCourseOrders,
      totalCustomers: customerCountRows[0]?.cnt || 0,
      averageProductOrderValue,
      totalCourses: courseStatsRows[0]?.total_courses || 0,
      publishedCourses: courseStatsRows[0]?.published_courses || 0,
      totalActiveProducts: inventoryRows.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length
    },
    salesByCategory,
    bestSellingProducts,
    lowStockProducts: lowStockProducts.concat(outOfStockProducts).slice(0, 8),
    recentProductOrders: productOrders.slice(0, 6),
    recentCourseOrders: courseOrders.slice(0, 6),
    recentStudents
  });
}

async function handleAdminUpdateStoreSettings(body: any, res: ServerResponse) {
  const stdFee = Math.max(0, Number(body.standardShippingFee ?? 79));
  const expFee = Math.max(0, Number(body.expressShippingFee ?? 199));
  const freeThresh = Math.max(0, Number(body.freeShippingThreshold ?? 1499));
  const stdMin = Math.max(1, Number(body.standardDeliveryDaysMin ?? 5));
  const stdMax = Math.max(stdMin, Number(body.standardDeliveryDaysMax ?? 7));
  const expMin = Math.max(1, Number(body.expressDeliveryDaysMin ?? 2));
  const expMax = Math.max(expMin, Number(body.expressDeliveryDaysMax ?? 3));

  const sql = getDb();
  await sql`
    UPDATE settings
    SET standard_shipping_fee = ${stdFee},
        express_shipping_fee = ${expFee},
        free_shipping_threshold = ${freeThresh},
        standard_delivery_days_min = ${stdMin},
        standard_delivery_days_max = ${stdMax},
        express_delivery_days_min = ${expMin},
        express_delivery_days_max = ${expMax}
    WHERE id = 'default';
  `;

  invalidateAllCommerceCache();
  const config = await getStoreConfigFromDb();
  sendJson(res, 200, { success: true, config });
}

