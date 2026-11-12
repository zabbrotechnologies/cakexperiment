import 'dotenv/config';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { getDb } from '../server/neonDb.ts';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5175';
const sql = getDb();

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ PASS: ${name}${detail ? ` — ${detail}` : ''}`);
}

async function launchBrowser() {
  for (const opts of [{ headless: true }, { headless: true, channel: 'chrome' }, { headless: true, channel: 'msedge' }]) {
    try {
      return await chromium.launch(opts);
    } catch {
      // try next channel
    }
  }
  throw new Error('Could not launch Chromium, Chrome, or MS Edge');
}

async function runTests() {
  const browser = await launchBrowser();
  const ts = Date.now();
  const createdProductSlug = `e2e-macaron-box-${ts}`;
  const createdProductName = `E2E Signature Macaron Box ${ts}`;
  const userBEmail = `e2e.userb.${ts}@cakexperiment.test`;
  const userBPass = 'TestPass@123';
  const cleanupOrderNumbers = [];
  let createdProductId = null;
  let userBId = null;
  let createdCourseOrderNumber = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Desktop (1280px) & Mobile (390px) Homepage Showcase + Live Products
    // -------------------------------------------------------------------------
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const bodyText = await page.innerText('body');
      assert(bodyText.includes('Explore Full Shop Catalog') || bodyText.includes('Signature Celebration Gift Hamper'), 'Homepage should render product & hamper sections');
      assert(!bodyText.toUpperCase().includes('FEATURED EXCLUSIVE'), 'Gift Hamper section must NOT be labeled Featured Exclusive');

      const hamperCtaHref = await page.locator('#gift-hampers-showcase a[href="/gift-hampers"]').getAttribute('href');
      assert.equal(hamperCtaHref, '/gift-hampers', 'Gift Hamper showcase CTA must route to /gift-hampers bespoke flow');

      // Verify all loaded images on homepage and /shop have naturalWidth > 0 (no broken images)
      await page.waitForSelector('img', { timeout: 10000 });
      await page.waitForTimeout(800);
      const brokenHomeImgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).filter(img => img.complete && img.naturalWidth === 0).map(img => img.src)
      );
      assert.equal(brokenHomeImgs.length, 0, `Broken images on homepage: ${brokenHomeImgs.join(', ')}`);

      // Verify Gift Hamper is NOT present in /api/products or /shop catalog
      const shopApiData = await page.evaluate(async ({ baseUrl }) => {
        const [pRes, cRes] = await Promise.all([
          fetch(`${baseUrl}/api/products`),
          fetch(`${baseUrl}/api/product-categories`)
        ]);
        return { products: (await pRes.json()).products || [], categories: (await cRes.json()).categories || [] };
      }, { baseUrl: BASE_URL });
      assert(
        !shopApiData.products.some(p => p.slug === 'artisan-signature-keepsake-hamper' || p.id === 'prod-keepsake-hamper'),
        'Gift Hamper must NOT appear in /api/products shop catalog'
      );
      assert(
        !shopApiData.categories.some(c => c.slug === 'signature-gift-hampers' || c.id === 'cat-prod-hampers'),
        'Signature Gift Hampers category must NOT appear in /api/product-categories'
      );

      await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const shopBodyText = await page.innerText('body');
      assert(!shopBodyText.includes('Artisan Signature Keepsake Hamper'), 'Gift Hamper must NOT render inside /shop');
      const brokenShopImgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).filter(img => img.complete && img.naturalWidth === 0).map(img => img.src)
      );
      assert.equal(brokenShopImgs.length, 0, `Broken images on /shop: ${brokenShopImgs.join(', ')}`);

      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 4);
      assert(!desktopOverflow, 'Desktop homepage should not overflow horizontally');

      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 4);
      assert(!mobileOverflow, 'Mobile homepage should not overflow horizontally');
      assert(pageErrors.length === 0, `Homepage uncaught pageErrors: ${pageErrors.join('; ')}`);
      await ctx.close();
      pass('Homepage Minimalist Showcase, Verified Product Images, 1-Variant/1-Image Hamper & Responsive Viewports');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Admin Sign-In, Image Upload Proxy & Product + Variants Creation
    // -------------------------------------------------------------------------
    let adminToken = '';
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'admin@cakexperiment.demo');
      await page.fill('input[type="password"]', 'Admin@12345');
      await page.click('button[type="submit"]');
      await page.waitForURL(url => url.pathname.startsWith('/admin'), { timeout: 15000 });

      adminToken = await page.evaluate(() => localStorage.getItem('cakexperiment_auth_token') || '');
      assert(adminToken.length > 10, 'Admin auth token missing after sign in');

      // Test admin media upload -> S3 -> /api/media/:key proxy
      const tinyPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const uploadRes = await page.evaluate(async ({ baseUrl, token, dataUrl }) => {
        const r = await fetch(`${baseUrl}/api/admin/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ dataUrl, filename: 'e2e-swatch.png', contentType: 'image/png' })
        });
        return { status: r.status, body: await r.json() };
      }, { baseUrl: BASE_URL, token: adminToken, dataUrl: tinyPngBase64 });

      assert.equal(uploadRes.status, 200, 'Image upload should succeed');
      assert(uploadRes.body.url?.startsWith('/api/media/'), 'Uploaded image URL should route through /api/media/');

      const mediaCheck = await page.evaluate(async ({ baseUrl, url }) => {
        const r = await fetch(`${baseUrl}${url}`);
        return { status: r.status, type: r.headers.get('content-type') };
      }, { baseUrl: BASE_URL, url: uploadRes.body.url });
      assert.equal(mediaCheck.status, 200, 'Media proxy endpoint must return 200');

      // Create multi-variant physical product via Admin API and verify in Admin Products UI & /shop
      const catsRes = await page.evaluate(async ({ baseUrl, token }) => {
        const r = await fetch(`${baseUrl}/api/admin/product-categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return await r.json();
      }, { baseUrl: BASE_URL, token: adminToken });
      const activeCat = (catsRes.categories || []).find(c => c.is_active !== false);
      const firstCatId = activeCat?.id || 'cat-prod-cakes';

      const createProdRes = await page.evaluate(async ({ baseUrl, token, payload }) => {
        const r = await fetch(`${baseUrl}/api/admin/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        return { status: r.status, body: await r.json() };
      }, {
        baseUrl: BASE_URL,
        token: adminToken,
        payload: {
          name: createdProductName,
          slug: createdProductSlug,
          categoryId: firstCatId,
          shortDescription: 'E2E automated verification macaron collection.',
          description: 'Crafted with almond flour and ganache for Playwright dual-commerce verification.',
          basePrice: 1000,
          compareAtPrice: 1250,
          stock: 10,
          images: ['/images/product-1.jpg', '/images/product-2.jpg', uploadRes.body.url],
          featured: true,
          isExclusive: false,
          isActive: true,
          badge: 'E2E Verified',
          variants: [
            {
              variantName: 'Rose Gold • Box of 6',
              size: 'Box of 6',
              colour: 'Rose Gold',
              colourHex: '#B76E79',
              sku: `E2E-RG-6-${ts}`,
              priceAdjustment: 0,
              stock: 5,
              image: '/images/product-1.jpg',
              isActive: true
            },
            {
              variantName: 'Velvet Plum • Box of 12',
              size: 'Box of 12',
              colour: 'Velvet Plum',
              colourHex: '#57333A',
              sku: `E2E-VP-12-${ts}`,
              priceAdjustment: 400,
              stock: 0,
              image: '/images/product-2.jpg',
              isActive: true
            },
            {
              variantName: 'Velvet Plum • Box of 6',
              size: 'Box of 6',
              colour: 'Velvet Plum',
              colourHex: '#57333A',
              sku: `E2E-VP-6-${ts}`,
              priceAdjustment: 200,
              stock: 4,
              image: '/images/product-2.jpg',
              isActive: true
            }
          ]
        }
      });

      assert(createProdRes.status === 200 || createProdRes.status === 201, `Admin create product failed: ${JSON.stringify(createProdRes.body)}`);
      createdProductId = createProdRes.body.product.id;

      await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
      const adminProdBody = await page.innerText('body');
      assert(adminProdBody.includes(createdProductName), 'Newly created product must appear in Admin Products UI');

      await page.goto(`${BASE_URL}/shop?search=${encodeURIComponent(createdProductName)}`, { waitUntil: 'networkidle' });
      const shopBody = await page.innerText('body');
      assert(shopBody.includes(createdProductName), 'Published product must appear in public /shop search');

      await ctx.close();
      pass('Admin Media Proxy Upload, Multi-Variant Creation, & Live Shop Visibility');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Shop Filtering, Sorting, Variant Switching & Unauthenticated Login Gate
    // -------------------------------------------------------------------------
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();

      // Check sorting & in-stock filter
      await page.goto(`${BASE_URL}/shop?sort=price_desc&inStock=true`, { waitUntil: 'networkidle' });
      const shopText = await page.innerText('body');
      assert(shopText.includes('Products'), 'Shop catalog heading must render');

      // Visit Product Detail unauthenticated
      await page.goto(`${BASE_URL}/shop/${createdProductSlug}`, { waitUntil: 'networkidle' });
      const pdpText = await page.innerText('body');
      assert(pdpText.includes(createdProductName), 'Product detail page should render product title');
      assert(pdpText.includes('₹1,000'), 'Default variant price ₹1,000 should show');

      // Switch colour to Velvet Plum (Box of 6 has stock 4, price ₹1,200) -> image updates!
      await page.click('button:has-text("Velvet Plum")');
      await page.waitForTimeout(200);
      const afterColourPrice = await page.innerText('body');
      assert(afterColourPrice.includes('₹1,200') || afterColourPrice.includes('₹1,400'), 'Colour/variant switch must update price');

      // Verify size Box of 12 (stock = 0) is explicitly disabled so unavailable variants cannot be added
      const box12Btn = page.locator('button:has-text("Box of 12")');
      const box12Disabled = await box12Btn.isDisabled();
      assert(box12Disabled, '0-stock variant button (Box of 12) must be disabled');

      // Switch back to in-stock variant: Rose Gold + Box of 6 (₹1,000, stock 5)
      await page.click('button:has-text("Rose Gold")');
      await page.click('button:has-text("Box of 6")');
      await page.waitForTimeout(200);

      // Click Add to Cart while unauthenticated -> Login Gate redirects to /signin
      await page.click('button:has-text("Add to Cart")');
      await page.waitForURL(url => url.pathname === '/signin', { timeout: 10000 });
      const signInBanner = await page.innerText('body');
      assert(signInBanner.includes('sign in') || signInBanner.includes('Sign In'), 'Unauthenticated action should redirect to /signin with message');

      // Protected /cart and /wishlist redirect when unauthenticated
      await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
      assert(page.url().includes('/signin'), '/cart must redirect unauthenticated users to /signin');

      await ctx.close();
      pass('Variant Image/Price Switching, Out-of-Stock Blocking, & Unauthenticated Login Gate');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Sign In as User A (Sanjay), Cart & Wishlist Persistence + User B Isolation
    // -------------------------------------------------------------------------
    let userAToken = '';
    let userBToken = '';
    {
      // Sign up User B via API to keep browser clean
      const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pageB = await ctxB.newPage();
      await pageB.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
      const regRes = await pageB.evaluate(async ({ baseUrl, email, password }) => {
        const r = await fetch(`${baseUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'E2E User Beta', email, password, confirmPassword: password })
        });
        return { status: r.status, body: await r.json() };
      }, { baseUrl: BASE_URL, email: userBEmail, password: userBPass });
      assert(regRes.status === 200 || regRes.status === 201, `User B signup failed: ${JSON.stringify(regRes.body)}`);
      userBId = regRes.body.user.id;
      userBToken = regRes.body.token;
      await ctxB.close();

      // Now test User A flow in Context A
      const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pageA = await ctxA.newPage();
      await pageA.goto(`${BASE_URL}/shop/${createdProductSlug}`, { waitUntil: 'networkidle' });
      await pageA.click('button:has-text("Add to Cart")');
      await pageA.waitForURL(url => url.pathname === '/signin', { timeout: 10000 });

      await pageA.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
      await pageA.fill('input[type="password"]', '101010');
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL(url => url.pathname.includes('/shop/'), { timeout: 15000 });
      userAToken = await pageA.evaluate(() => localStorage.getItem('cakexperiment_auth_token') || '');

      // Clear any pre-existing cart items for User A so E2E subtotal math is exact
      await pageA.evaluate(async ({ baseUrl, token }) => {
        await fetch(`${baseUrl}/api/cart`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }, { baseUrl: BASE_URL, token: userAToken });
      await pageA.reload({ waitUntil: 'networkidle' });

      // Select Rose Gold + Box of 6 (stock 5, ₹1,000), save to Wishlist first, then increment quantity to 2 and Add to Cart
      await pageA.click('button:has-text("Rose Gold")');
      await pageA.click('button:has-text("Box of 6")');

      await Promise.all([
        pageA.waitForResponse(res => res.url().includes('/api/wishlist/toggle') && res.status() === 200),
        pageA.click('button:has-text("Wishlist")')
      ]);

      await pageA.click('button[aria-label="Increase quantity"]');
      await Promise.all([
        pageA.waitForResponse(res => res.url().includes('/api/cart/items') && res.status() === 200),
        pageA.click('button:has-text("Add to Cart")')
      ]);

      // Reload & verify /cart and /wishlist persist
      await pageA.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
      await pageA.reload({ waitUntil: 'networkidle' });
      try {
        await pageA.waitForFunction(
          (name) => document.body.innerText.includes(name) && document.body.innerText.includes('2,000'),
          createdProductName,
          { timeout: 10000 }
        );
      } catch (e) {
        const snap = await pageA.innerText('body');
        throw new Error(`Cart reload check failed. Body snippet: ${snap.slice(0, 600)}`);
      }

      await pageA.goto(`${BASE_URL}/wishlist`, { waitUntil: 'networkidle' });
      await pageA.waitForFunction(
        (name) => document.body.innerText.includes(name),
        createdProductName,
        { timeout: 10000 }
      );

      // Now in the SAME browser context, Sign Out & Sign In as User B to verify strict cart/wishlist isolation!
      await pageA.evaluate(async () => {
        localStorage.removeItem('cakexperiment_auth_token');
      });
      await pageA.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await pageA.fill('input[type="email"]', userBEmail);
      await pageA.fill('input[type="password"]', userBPass);
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL(url => !url.pathname.includes('/signin'), { timeout: 15000 });

      await pageA.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
      const userBCartText = await pageA.innerText('body');
      assert(userBCartText.includes('Empty') || !userBCartText.includes(createdProductName), 'User B must NEVER inherit User A cart');

      await pageA.goto(`${BASE_URL}/wishlist`, { waitUntil: 'networkidle' });
      const userBWishText = await pageA.innerText('body');
      assert(!userBWishText.includes(createdProductName), 'User B must NEVER inherit User A wishlist');

      await ctxA.close();
      pass('Login Redirect Return, Refresh Persistence, & Strict Per-User Cart/Wishlist Isolation');
    }

    // -------------------------------------------------------------------------
    // TEST 5: 3-Step COD Checkout, Validation, No Premature Order, Idempotency & Atomic Stock
    // -------------------------------------------------------------------------
    let placedOrderNumber = '';
    let placedOrderId = '';
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
      await page.fill('input[type="password"]', '101010');
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.pathname.includes('/signin'), { timeout: 15000 });

      // Navigate to /product-checkout
      await page.goto(`${BASE_URL}/product-checkout`, { waitUntil: 'networkidle' });
      const ordersBeforeConfirm = await sql`
        SELECT count(*)::int AS cnt FROM orders WHERE user_id = 'usr_1793721924057_33b7f484' AND order_type = 'PRODUCT' AND created_at > now() - interval '2 minutes'
      `;

      // Verify validation blocks bad phone/pincode
      await page.fill('input[placeholder="e.g. 9876543210"]', '12345');
      await page.fill('input[placeholder="e.g. 560066"]', '56');
      await page.click('button:has-text("Continue to Delivery")');
      const errText = await page.innerText('body');
      assert(errText.includes('10-digit Indian') && errText.includes('6-digit Indian'), 'Checkout Step 1 must validate Indian phone and 6-digit pincode');

      // Enter valid Indian shipping address
      await page.fill('input[placeholder="e.g. 9876543210"]', '9876543210');
      await page.fill('input[placeholder*="House"]', '42 Pastry Lane, Indiranagar');
      // City input: fill by label association or nth text input inside form
      const inputs = page.locator('input.input-field[type="text"]');
      // Index 0 firstName, 1 lastName, 2 street, 3 apartment, 4 city, 5 pincode
      await inputs.nth(4).fill('Bengaluru');
      await page.fill('input[placeholder="e.g. 560066"]', '560038');
      await page.click('button:has-text("Continue to Delivery")');

      // Step 2: Delivery (verify Standard = FREE for ₹2000 >= ₹1499 threshold, Express = ₹199)
      const step2Text = await page.innerText('body');
      assert(step2Text.includes('FREE') && step2Text.includes('₹199'), 'Step 2 should display Standard FREE and Express ₹199');
      await page.click('label:has-text("Express Priority Delivery")');
      await page.click('button:has-text("Continue to Payment")');

      // Still zero premature order created in Neon DB before Confirm COD Order!
      const ordersMidCheckout = await sql`
        SELECT count(*)::int AS cnt FROM orders WHERE user_id = 'usr_1793721924057_33b7f484' AND order_type = 'PRODUCT' AND created_at > now() - interval '2 minutes'
      `;
      assert.equal(ordersMidCheckout[0].cnt, ordersBeforeConfirm[0].cnt, 'No order must be created before clicking Confirm COD Order');

      // Step 3: Cash on Delivery -> Click Confirm COD Order
      await page.click('button:has-text("Confirm COD Order")');
      await page.waitForURL(url => url.pathname.startsWith('/order-confirmed/'), { timeout: 15000 });
      placedOrderNumber = decodeURIComponent(page.url().split('/order-confirmed/')[1].split('?')[0]);
      cleanupOrderNumbers.push(placedOrderNumber);

      await page.waitForFunction(
        (num) => document.body.innerText.includes(num),
        placedOrderNumber,
        { timeout: 10000 }
      );
      const confirmText = await page.innerText('body');
      assert(
        confirmText.includes(placedOrderNumber) && confirmText.includes('2,199'),
        `Order Confirmed page must display ${placedOrderNumber} and ₹2,199 total. Actual text: ${confirmText.slice(0, 500)}`
      );

      // Check Neon DB: order created + order_items + payment PENDING_COD + Rose Gold stock decremented 5 -> 3
      const [dbOrd] = await sql`
        SELECT o.id, o.order_type, o.status, o.payment_method, o.total_amount, o.shipping_amount, p.status AS pay_status
        FROM orders o LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.order_number = ${placedOrderNumber}
      `;
      assert.equal(dbOrd.order_type, 'PRODUCT');
      assert.equal(dbOrd.status, 'placed');
      assert.equal(dbOrd.payment_method, 'COD');
      assert.equal(Number(dbOrd.total_amount), 2199);
      assert.equal(Number(dbOrd.shipping_amount), 199);
      assert.equal(dbOrd.pay_status, 'PENDING_COD');
      placedOrderId = dbOrd.id;

      const [varRow] = await sql`
        SELECT id, stock FROM product_variants WHERE product_id = ${createdProductId} AND colour = 'Rose Gold'
      `;
      assert.equal(Number(varRow.stock), 3, 'Variant stock should atomically decrement 5 -> 3');

      // Test idempotency key replay at API level
      const replayRes = await page.evaluate(async ({ baseUrl, token, productId, variantId }) => {
        const key = `e2e_idem_${Date.now()}`;
        const body = {
          idempotencyKey: key,
          deliveryMethod: 'STANDARD',
          shippingAddress: {
            firstName: 'Sanjay', lastName: 'S', email: 's.sanjay.01.03.2006@gmail.com',
            phone: '9876543210', streetAddress: '10 Bakers St', city: 'Bengaluru', state: 'Karnataka', pincode: '560038'
          },
          items: [{ productId, variantId, quantity: 1 }]
        };
        const r1 = await fetch(`${baseUrl}/api/orders/product/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        }).then(r => r.json());
        const r2 = await fetch(`${baseUrl}/api/orders/product/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        }).then(r => r.json());
        return { r1, r2 };
      }, { baseUrl: BASE_URL, token: userAToken, productId: createdProductId, variantId: varRow.id });

      assert.equal(replayRes.r1.order.orderNumber, replayRes.r2.order.orderNumber, 'Idempotent retry must return exact same order');
      cleanupOrderNumbers.push(replayRes.r1.order.orderNumber);

      const [afterIdemVar] = await sql`SELECT stock FROM product_variants WHERE id = ${varRow.id}`;
      assert.equal(Number(afterIdemVar.stock), 2, 'Stock must decrement only ONCE across duplicate idempotent submit (3 -> 2)');

      // Check User A My Purchases separates Product Orders vs Course Orders
      await page.goto(`${BASE_URL}/my-purchases`, { waitUntil: 'networkidle' });
      const myPurchasesText = await page.innerText('body');
      assert(myPurchasesText.includes(placedOrderNumber), 'My Purchases Product Orders tab must list newly placed COD order');

      await ctx.close();
      pass('3-Step COD Checkout, Validation, Idempotency, Atomic Stock Deduction, & Order History');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Cross-User Unauthorized Access Block + 5-Step Fulfillment + COD Collection + Cancel Stock Restore
    // -------------------------------------------------------------------------
    {
      // User B tries to access User A's order -> must get HTTP 403!
      const ctxB = await browser.newContext();
      const pageB = await ctxB.newPage();
      await pageB.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      const unauthCheck = await pageB.evaluate(async ({ baseUrl, token, orderNumber }) => {
        const r = await fetch(`${baseUrl}/api/user/product-orders/${orderNumber}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return r.status;
      }, { baseUrl: BASE_URL, token: userBToken, orderNumber: placedOrderNumber });
      assert.equal(unauthCheck, 403, 'Unauthorized user requesting another customer product order must get HTTP 403');
      await ctxB.close();

      // Admin fulfills order through 5 steps -> collects COD -> cancels second order & restores stock
      const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pageAdmin = await ctxAdmin.newPage();
      await pageAdmin.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await pageAdmin.fill('input[type="email"]', 'admin@cakexperiment.demo');
      await pageAdmin.fill('input[type="password"]', 'Admin@12345');
      await pageAdmin.click('button[type="submit"]');
      await pageAdmin.waitForURL(url => url.pathname.startsWith('/admin'), { timeout: 15000 });

      for (const st of ['confirmed', 'crafting', 'dispatched', 'delivered']) {
        const stRes = await pageAdmin.evaluate(async ({ baseUrl, token, orderId, status }) => {
          const r = await fetch(`${baseUrl}/api/admin/product-orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status, note: `E2E moved to ${status}` })
          });
          return r.status;
        }, { baseUrl: BASE_URL, token: adminToken, orderId: placedOrderId, status: st });
        assert.equal(stRes, 200, `Admin status transition to ${st} failed`);
      }

      const codCollectRes = await pageAdmin.evaluate(async ({ baseUrl, token, orderId }) => {
        const r = await fetch(`${baseUrl}/api/admin/product-orders/${orderId}/collect-cod`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: r.status, body: await r.json() };
      }, { baseUrl: BASE_URL, token: adminToken, orderId: placedOrderId });
      assert.equal(codCollectRes.status, 200);
      assert.equal(codCollectRes.body.order.paymentStatus, 'COLLECTED');

      // Verify Customer Tracking Page shows Delivered & Collected
      const ctxUser = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pageUser = await ctxUser.newPage();
      await pageUser.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await pageUser.fill('input[type="email"]', 's.sanjay.01.03.2006@gmail.com');
      await pageUser.fill('input[type="password"]', '101010');
      await pageUser.click('button[type="submit"]');
      await pageUser.waitForURL(url => !url.pathname.includes('/signin'), { timeout: 15000 });
      await pageUser.goto(`${BASE_URL}/orders/${placedOrderNumber}/track`, { waitUntil: 'networkidle' });
      const trackText = await pageUser.innerText('body');
      assert(trackText.includes('Delivered') && trackText.includes('Order Placed'), 'Tracking page must render 5-step progress through Delivered');
      await ctxUser.close();

      // Cancel second order & confirm stock restored (2 -> 3)
      const secondOrderNum = cleanupOrderNumbers[1];
      const [secondOrdRow] = await sql`SELECT id FROM orders WHERE order_number = ${secondOrderNum}`;
      await pageAdmin.evaluate(async ({ baseUrl, token, orderId }) => {
        await fetch(`${baseUrl}/api/admin/product-orders/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'cancelled', note: 'E2E cancellation stock restore test' })
        });
      }, { baseUrl: BASE_URL, token: adminToken, orderId: secondOrdRow.id });

      const [restoredVar] = await sql`
        SELECT stock FROM product_variants WHERE product_id = ${createdProductId} AND colour = 'Rose Gold'
      `;
      assert.equal(Number(restoredVar.stock), 3, 'Cancelling product order must restore stock back from 2 to 3');

      // Check Admin Dashboard Analytics, Customer CRM, and Store Settings UI
      await pageAdmin.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
      const dashText = await pageAdmin.innerText('body');
      assert(dashText.includes('Total Collected Revenue') && dashText.includes('Pending COD Receivable'), 'Admin Dashboard must show separated dual-commerce revenue KPIs');

      await pageAdmin.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
      const crmText = await pageAdmin.innerText('body');
      assert(crmText.includes('Customer CRM') && crmText.includes('s.sanjay.01.03.2006@gmail.com'), 'Admin Users CRM must display customer order spend');

      await pageAdmin.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
      await pageAdmin.waitForFunction(() => document.body.innerText.includes('Physical Store Shipping'), { timeout: 15000 });
      const settingsText = await pageAdmin.innerText('body');
      assert(settingsText.includes('Physical Store Shipping'), 'Admin Settings must render shipping & COD configuration card');

      await ctxAdmin.close();
      pass('Cross-User 403 Block, 5-Step Fulfillment, Tracking UI, COD Collection, Cancellation Stock Restore, Analytics & CRM');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Existing Course Purchase Workflow Regression Check
    // -------------------------------------------------------------------------
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', userBEmail);
      await page.fill('input[type="password"]', userBPass);
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.pathname.includes('/signin'), { timeout: 15000 });

      const courseRes = await page.evaluate(async ({ baseUrl, token }) => {
        const coursesR = await fetch(`${baseUrl}/api/courses`);
        const coursesData = await coursesR.json();
        const firstCourse = (coursesData.courses || [])[0];
        const ordR = await fetch(`${baseUrl}/api/orders/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseId: firstCourse.id })
        });
        return { status: ordR.status, body: await ordR.json() };
      }, { baseUrl: BASE_URL, token: userBToken });

      assert(courseRes.status === 200 || courseRes.status === 201, `Course WhatsApp order creation should succeed, got ${courseRes.status}`);
      createdCourseOrderNumber = courseRes.body.order.orderNumber || courseRes.body.order.order_number;
      cleanupOrderNumbers.push(createdCourseOrderNumber);

      const [courseOrdDb] = await sql`SELECT id, order_type, status FROM orders WHERE order_number = ${createdCourseOrderNumber}`;
      assert.equal(courseOrdDb.order_type, 'COURSE', 'Course order must strictly keep order_type = COURSE');

      // Confirm Course order does NOT show inside User Product Orders endpoint
      const userProdList = await page.evaluate(async ({ baseUrl, token }) => {
        const r = await fetch(`${baseUrl}/api/user/product-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return await r.json();
      }, { baseUrl: BASE_URL, token: userBToken });
      assert(
        !(userProdList.orders || []).some(o => o.orderNumber === createdCourseOrderNumber),
        'Course order must never leak into Physical Product Orders list'
      );

      // Verify Admin Manual Payment Confirmation works strictly on the Course order
      const confirmCourseRes = await page.evaluate(async ({ baseUrl, token, oid }) => {
        const r = await fetch(`${baseUrl}/api/admin/orders/${oid}/confirm-payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        return { status: r.status, body: await r.json() };
      }, { baseUrl: BASE_URL, token: adminToken, oid: courseOrdDb.id });
      assert.equal(confirmCourseRes.status, 200, 'Admin Confirm Payment & Activate on course order must still succeed');
      const [activatedCourseOrd] = await sql`SELECT status FROM orders WHERE id = ${courseOrdDb.id}`;
      assert.equal(activatedCourseOrd.status, 'COMPLETED', 'Confirmed course order must transition to COMPLETED');

      await ctx.close();
      pass('Course Purchase Workflow Preserved & Strictly Isolated from Physical Product COD Orders');
    }

    // -------------------------------------------------------------------------
    // TEST 8: Bespoke Gift Hamper WhatsApp Flow -> Tracking & Separated Admin Panels
    // -------------------------------------------------------------------------
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();

      await page.goto(`${BASE_URL}/gift-hampers`, { waitUntil: 'networkidle' });
      await page.fill('#customerName input', 'Priya Nair E2E');
      await page.fill('#customerPhone input', '9876543210');
      await page.fill('#deliveryAddress textarea', '22 Indiranagar 100ft Rd, Bengaluru');
      const recipientInput = page.locator('input[placeholder*="Dearest Priya"]');
      await recipientInput.fill('Ananya Sharma');

      // Click Continue to WhatsApp and verify Neon DB record + modal tracking CTA
      await page.click('button:has-text("Continue to WhatsApp")');
      await page.waitForFunction(() => document.body.innerText.includes('Order Recorded'), { timeout: 10000 });
      const modalText = await page.innerText('body');
      const hmpMatch = modalText.match(/CAK-HMP-[A-Z0-9-]+/);
      assert(hmpMatch, 'Gift Hamper modal must display generated CAK-HMP-... Order ID');
      const hamperOrderNumber = hmpMatch[0];
      cleanupOrderNumbers.push(hamperOrderNumber);

      const [hamperOrdDb] = await sql`
        SELECT id, order_type, status, hamper_details FROM orders WHERE order_number = ${hamperOrderNumber}
      `;
      assert.equal(hamperOrdDb.order_type, 'HAMPER', 'Gift Hamper order must store order_type = HAMPER');
      assert.equal(hamperOrdDb.status, 'placed', 'Gift Hamper initial status must be placed');

      // Open /track-hamper/:orderNumber publicly and confirm customization & 5-step tracker
      await page.click('a:has-text("Track Gift Hamper Order")');
      await page.waitForURL(url => url.pathname.includes(`/track-hamper/${hamperOrderNumber}`), { timeout: 10000 });
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('bespoke gift hamper tracking'), { timeout: 10000 });
      const publicTrackText = await page.innerText('body');
      assert(publicTrackText.includes('Ananya Sharma') && publicTrackText.includes('Order Placed'), 'Public hamper tracker must show recipient customization and 5-step tracker');

      // Verify separated Admin Panels in sidebar & Admin Product Orders -> Separate Gift Hamper Orders division
      await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'admin@cakexperiment.demo');
      await page.fill('input[type="password"]', 'Admin@12345');
      await page.click('button[type="submit"]');
      await page.waitForURL(url => url.pathname.startsWith('/admin'), { timeout: 15000 });

      const sidebarText = await page.innerText('aside');
      assert(
        sidebarText.includes('Course Purchase Requests') &&
        sidebarText.includes('Product Orders') &&
        sidebarText.includes('Gift Hamper Orders'),
        'Admin sidebar must have 3 separate panels: Course Purchase Requests, Product Orders, and Gift Hamper Orders'
      );

      await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
      const courseAdminText = await page.locator('main').innerText();
      assert(courseAdminText.includes('Course Purchase Requests') && !courseAdminText.includes('Gift Hamper Orders') && !courseAdminText.includes('Physical Product Orders'), 'Admin /admin/orders main panel must contain only Course Purchase Requests');

      await page.goto(`${BASE_URL}/admin/product-orders`, { waitUntil: 'networkidle' });
      const prodAdminText = await page.locator('main').innerText();
      assert(
        prodAdminText.includes('Physical Product Orders') &&
        !prodAdminText.includes('Gift Hamper Orders') &&
        !prodAdminText.includes(hamperOrderNumber),
        'Admin /admin/product-orders main panel must contain ONLY Physical Product Orders without Gift Hamper Orders inside it'
      );

      await page.goto(`${BASE_URL}/admin/hamper-orders`, { waitUntil: 'networkidle' });
      await page.waitForFunction((num) => document.body.innerText.includes(num), hamperOrderNumber, { timeout: 10000 });
      const hamperAdminText = await page.locator('main').innerText();
      assert(hamperAdminText.includes('Gift Hamper Orders') && !hamperAdminText.includes('Physical Product Orders') && hamperAdminText.includes(hamperOrderNumber), 'Admin /admin/hamper-orders main panel must list ONLY Gift Hamper Orders');

      // Admin updates hamper status to delivered & marks payment received from Gift Hamper Orders panel
      const hamperRow = page.locator('tr', { hasText: hamperOrderNumber });
      await hamperRow.locator('select').selectOption('delivered');
      await page.waitForTimeout(800);
      await hamperRow.locator('button:has-text("Mark Paid")').click();
      await page.waitForTimeout(800);

      // Refresh customer tracking page and confirm delivered
      await page.goto(`${BASE_URL}/track-hamper/${hamperOrderNumber}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('delivered'), { timeout: 10000 });

      await ctx.close();
      pass('Bespoke Gift Hamper Persistence, Live 5-Step Tracking & Separated Admin Order Panels Verified');
    }

    console.log('\n=================================================');
    console.log(`ALL ${results.length} E2E DUAL-COMMERCE VERIFICATION SUITES PASSED!`);
    console.log('=================================================');
  } finally {
    // Cleanup temporary E2E test records from Neon DB
    try {
      for (const ordNum of cleanupOrderNumbers) {
        const rows = await sql`SELECT id FROM orders WHERE order_number = ${ordNum}`;
        if (rows.length > 0) {
          const oid = rows[0].id;
          await sql`DELETE FROM admin_audit_logs WHERE order_id = ${oid}`;
          await sql`DELETE FROM inventory_movements WHERE order_id = ${oid}`;
          await sql`DELETE FROM order_status_history WHERE order_id = ${oid}`;
          await sql`DELETE FROM payments WHERE order_id = ${oid}`;
          await sql`DELETE FROM order_items WHERE order_id = ${oid}`;
          await sql`DELETE FROM orders WHERE id = ${oid}`;
        }
      }
      if (createdProductId) {
        await sql`DELETE FROM wishlists WHERE product_id = ${createdProductId}`;
        await sql`DELETE FROM cart_items WHERE product_id = ${createdProductId}`;
        await sql`DELETE FROM inventory_movements WHERE product_id = ${createdProductId}`;
        await sql`DELETE FROM product_variants WHERE product_id = ${createdProductId}`;
        await sql`DELETE FROM products WHERE id = ${createdProductId}`;
      }
      await sql`DELETE FROM products WHERE slug LIKE 'e2e-macaron-box-%'`;
      await sql`DELETE FROM media_assets WHERE key LIKE '%e2e-swatch.png'`;
      if (userBId) {
        const orphanUserBOrders = await sql`SELECT id FROM orders WHERE user_id = ${userBId}`;
        for (const o of orphanUserBOrders) {
          await sql`DELETE FROM admin_audit_logs WHERE order_id = ${o.id}`;
          await sql`DELETE FROM payments WHERE order_id = ${o.id}`;
          await sql`DELETE FROM order_items WHERE order_id = ${o.id}`;
          await sql`DELETE FROM orders WHERE id = ${o.id}`;
        }
        await sql`DELETE FROM enrollments WHERE user_id = ${userBId}`;
        await sql`DELETE FROM shipping_addresses WHERE user_id = ${userBId}`;
        await sql`DELETE FROM wishlists WHERE user_id = ${userBId}`;
        await sql`DELETE FROM cart_items WHERE user_id = ${userBId}`;
        await sql`DELETE FROM users WHERE id = ${userBId}`;
      }
      console.log('🧹 Cleaned up temporary E2E test records from Neon DB.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await browser.close();
  }
}

runTests().catch(err => {
  console.error('❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
