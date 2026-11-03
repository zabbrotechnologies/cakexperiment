import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import https from 'https';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { getDb, hashPassword, verifyPassword } from './neonDb.ts';
import {
  generateOrderCreatedEmail,
  generateCourseActivatedEmail
} from './emailService.ts';

const S3_HOST_IPS: Record<string, string> = {
  'br-soft-queen-bdn8ofgg.storage.c-8.us-east-2.aws.neon.tech': '18.119.63.132',
  'storage.c-8.us-east-2.aws.neon.tech': '18.119.63.132'
};

function getS3() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || 'https://br-soft-queen-bdn8ofgg.storage.c-8.us-east-2.aws.neon.tech';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'nak_live_a59babbf885c4501aa6025aebda5d7a9';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'nsk_live_d9ce3a6253dff1837ff53dc7da62655f13111a7207df4336ad5b2aebad647072';
  const region = process.env.AWS_REGION || 'us-east-2';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Neon Object Storage credentials not fully configured');
  }

  const agent = new https.Agent({
    lookup: (hostname: string, options: any, callback: any) => {
      const cb = typeof options === 'function' ? options : callback;
      const opts = typeof options === 'object' ? options : {};
      const ip = S3_HOST_IPS[hostname] || '18.119.63.132';
      if (opts && opts.all) {
        return cb(null, [{ address: ip, family: 4 }]);
      }
      return cb(null, ip, 4);
    }
  });

  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    requestHandler: new NodeHttpHandler({
      httpsAgent: agent
    }),
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

const loginRateLimitMap = new Map<string, { attempts: number; lockedUntil: number }>();

function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (!rc) return list;

  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURI(parts.join('='));
    }
  });
  return list;
}

function extractSessionToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookies = parseCookies(req);
  if (cookies['cakexperiment_session']) {
    return cookies['cakexperiment_session'].trim();
  }
  return null;
}

export interface AuthenticatedSession {
  userId: string;
  role: 'USER' | 'ADMIN';
  email: string;
  name: string;
}

async function getAuthenticatedUser(req: IncomingMessage): Promise<AuthenticatedSession | null> {
  const token = extractSessionToken(req);
  if (!token) return null;

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT s.id as session_id, s.user_id, s.role as session_role, u.name, u.email, u.role as user_role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${token} AND s.expires_at > NOW();
    `;

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      userId: row.user_id,
      role: row.user_role as 'USER' | 'ADMIN',
      email: row.email,
      name: row.name
    };
  } catch (err) {
    console.error('Session authentication error:', err);
    return null;
  }
}

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleNeonApi(req: IncomingMessage, res: ServerResponse, next?: () => void) {
  const rawUrl = req.url || '';
  const parsedUrl = new URL(rawUrl, 'http://localhost');
  
  // Extract path from ?path= query (set by Vercel rewrite /api/(.*) -> /api?path=$1), or matched path header, or parsed pathname
  const queryPath = parsedUrl.searchParams.get('path');
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-invoke-path'] as string);
  
  let pathname = parsedUrl.pathname;
  if (queryPath) {
    pathname = queryPath.startsWith('/') ? `/api${queryPath}` : `/api/${queryPath}`;
  } else if (matchedPath && matchedPath.startsWith('/api/') && matchedPath !== '/api') {
    pathname = matchedPath;
  }

  // If hit at root /api or /api/, return health check
  if (pathname === '/api' || pathname === '/api/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', name: 'Cakexperiment API Engine', time: new Date().toISOString() }));
    return;
  }

  // Intercept all /api/* routes
  if (!pathname.startsWith('/api/')) {
    if (next) return next();
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    // -------------------------------------------------------------
    // 1. NEON INFRASTRUCTURE ENDPOINTS
    // -------------------------------------------------------------
    if (pathname === '/api/neon/status' && req.method === 'GET') {
      await handleStatus(res);
      return;
    }
    if (pathname === '/api/neon/query' && req.method === 'POST') {
      await handleQuery(req, res);
      return;
    }
    if (pathname.startsWith('/api/neon/storage/list') && req.method === 'GET') {
      await handleListStorage(rawUrl, res);
      return;
    }
    if (pathname === '/api/neon/storage/upload' && req.method === 'POST') {
      await handleUpload(req, res);
      return;
    }

    // -------------------------------------------------------------
    // 2. UNIFIED AUTHENTICATION ENDPOINTS
    // -------------------------------------------------------------
    if (pathname === '/api/auth/signup' && req.method === 'POST') {
      await handleSignUp(req, res);
      return;
    }
    if (pathname === '/api/auth/signin' && req.method === 'POST') {
      await handleSignIn(req, res);
      return;
    }
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      await handleAuthMe(req, res);
      return;
    }
    if (pathname === '/api/auth/signout' && req.method === 'POST') {
      await handleSignOut(req, res);
      return;
    }

    // -------------------------------------------------------------
    // 3. USER PROFILE & SETTINGS ENDPOINTS
    // -------------------------------------------------------------
    if (pathname === '/api/user/profile' && req.method === 'GET') {
      await handleUserProfile(req, res);
      return;
    }
    if (pathname === '/api/user/profile' && req.method === 'PUT') {
      await handleUpdateUserProfile(req, res);
      return;
    }
    if (pathname === '/api/user/change-password' && req.method === 'POST') {
      await handleChangePassword(req, res);
      return;
    }

    // -------------------------------------------------------------
    // 4. USER ORDERS & LEARNING (DATA ISOLATION)
    // -------------------------------------------------------------
    if (pathname === '/api/user/orders' && req.method === 'GET') {
      await handleUserOrders(req, res);
      return;
    }
    if (pathname === '/api/user/courses' && req.method === 'GET') {
      await handleUserCourses(req, res);
      return;
    }
    if (pathname === '/api/user/progress' && req.method === 'POST') {
      await handleUserProgress(req, res);
      return;
    }

    // -------------------------------------------------------------
    // 5. PUBLIC COURSE CATALOG (READ-ONLY)
    // -------------------------------------------------------------
    if (pathname === '/api/courses' && req.method === 'GET') {
      await handleListCourses(res);
      return;
    }
    if (pathname.startsWith('/api/courses/') && !pathname.endsWith('/classroom') && req.method === 'GET') {
      const idOrSlug = pathname.replace('/api/courses/', '');
      await handleGetCourseDetail(idOrSlug, res);
      return;
    }
    if (pathname.endsWith('/classroom') && req.method === 'GET') {
      const courseId = pathname.replace('/api/courses/', '').replace('/classroom', '');
      await handleCourseClassroom(courseId, req, res);
      return;
    }

    // -------------------------------------------------------------
    // 6. WHATSAPP E-COMMERCE ORDER CREATION (CRITICAL BUSINESS FLOW)
    // -------------------------------------------------------------
    if (pathname === '/api/orders/create' && req.method === 'POST') {
      await handleCreateWhatsAppOrder(req, res);
      return;
    }

    // -------------------------------------------------------------
    // 7. ADMIN MANAGEMENT ENDPOINTS (ROLE-VERIFIED)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/orders' && req.method === 'GET') {
      await handleAdminOrders(parsedUrl, req, res);
      return;
    }
    if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/confirm-payment') && req.method === 'POST') {
      const orderId = pathname.replace('/api/admin/orders/', '').replace('/confirm-payment', '');
      await handleAdminConfirmPayment(orderId, req, res);
      return;
    }
    if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/cancel') && req.method === 'POST') {
      const orderId = pathname.replace('/api/admin/orders/', '').replace('/cancel', '');
      await handleAdminCancelOrder(orderId, req, res);
      return;
    }
    if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/refund') && req.method === 'POST') {
      const orderId = pathname.replace('/api/admin/orders/', '').replace('/refund', '');
      await handleAdminRefundOrder(orderId, req, res);
      return;
    }
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      await handleAdminUsers(req, res);
      return;
    }
    if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/status') && req.method === 'POST') {
      const targetUserId = pathname.replace('/api/admin/users/', '').replace('/status', '');
      await handleAdminToggleUserStatus(targetUserId, req, res);
      return;
    }
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      await handleAdminStats(req, res);
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err: any) {
    console.error('API execution error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
}

// -------------------------------------------------------------
// Auth Handlers
// -------------------------------------------------------------

async function handleSignUp(req: IncomingMessage, res: ServerResponse) {
  const data = await readJsonBody(req);
  const { name, email, password, confirmPassword } = data;

  if (!name || !email || !password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please provide full name, email, and password.' }));
    return;
  }

  if (password.length < 6) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Password must be at least 6 characters long.' }));
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Passwords do not match.' }));
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();

  const sql = getDb();
  const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${cleanEmail});`;
  if (existing.length > 0) {
    res.statusCode = 409;
    res.end(JSON.stringify({ error: 'An account with this email address already exists.' }));
    return;
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const passwordHash = hashPassword(password);
  // Default role is strictly USER
  const role = 'USER';

  await sql`
    INSERT INTO users (id, name, email, password_hash, role, email_verified)
    VALUES (${userId}, ${cleanName}, ${cleanEmail}, ${passwordHash}, ${role}, TRUE);
  `;

  // Create initial profile row
  await sql`
    INSERT INTO user_profiles (user_id, bio)
    VALUES (${userId}, 'Enthusiastic baker learning with Cakexperiment.')
    ON CONFLICT (user_id) DO NOTHING;
  `;

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO sessions (id, user_id, role, expires_at)
    VALUES (${sessionToken}, ${userId}, ${role}, ${expiresAt.toISOString()});
  `;

  res.setHeader(
    'Set-Cookie',
    `cakexperiment_session=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
  );

  res.statusCode = 201;
  res.end(
    JSON.stringify({
      success: true,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: 'USER',
        emailVerified: true
      },
      token: sessionToken,
      redirectTo: '/learn'
    })
  );
}

async function handleSignIn(req: IncomingMessage, res: ServerResponse) {
  const data = await readJsonBody(req);
  const { email, password } = data;

  if (!email || !password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Email and password are required.' }));
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const now = Date.now();
  const record = loginRateLimitMap.get(cleanEmail);

  if (record && record.lockedUntil > now) {
    const secondsRemaining = Math.ceil((record.lockedUntil - now) / 1000);
    res.statusCode = 429;
    res.end(JSON.stringify({ error: `Too many failed attempts. Please try again in ${secondsRemaining}s.` }));
    return;
  }

  const sql = getDb();
  const users = await sql`
    SELECT id, name, email, password_hash, role, email_verified
    FROM users
    WHERE LOWER(email) = LOWER(${cleanEmail});
  `;

  if (users.length === 0) {
    recordFailedLogin(cleanEmail);
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Invalid email or password.' }));
    return;
  }

  const user = users[0];
  const isValid = verifyPassword(password, user.password_hash);

  if (!isValid) {
    recordFailedLogin(cleanEmail);
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Invalid email or password.' }));
    return;
  }

  loginRateLimitMap.delete(cleanEmail);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO sessions (id, user_id, role, expires_at)
    VALUES (${sessionToken}, ${user.id}, ${user.role}, ${expiresAt.toISOString()});
  `;

  res.setHeader(
    'Set-Cookie',
    `cakexperiment_session=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
  );

  const redirectTo = user.role === 'ADMIN' ? '/admin/dashboard' : '/learn';

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified
      },
      token: sessionToken,
      redirectTo
    })
  );
}

function recordFailedLogin(key: string) {
  const record = loginRateLimitMap.get(key) || { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = Date.now() + 60 * 1000;
    record.attempts = 0;
  }
  loginRateLimitMap.set(key, record);
}

async function handleAuthMe(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Session is invalid or has expired.' }));
    return;
  }

  const sql = getDb();
  const profiles = await sql`SELECT phone, profile_image, bio FROM user_profiles WHERE user_id = ${session.userId};`;
  const prof = profiles[0] || {};

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        phone: prof.phone || '',
        avatar: prof.profile_image || '',
        bio: prof.bio || ''
      }
    })
  );
}

async function handleSignOut(req: IncomingMessage, res: ServerResponse) {
  const token = extractSessionToken(req);
  if (token) {
    try {
      const sql = getDb();
      await sql`DELETE FROM sessions WHERE id = ${token};`;
    } catch (e) {
      console.warn('Error deleting session row:', e);
    }
  }

  res.setHeader('Set-Cookie', 'cakexperiment_session=; HttpOnly; Path=/; Max-Age=0');
  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Signed out successfully.' }));
}

// -------------------------------------------------------------
// User Profile Handlers
// -------------------------------------------------------------

async function handleUserProfile(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const sql = getDb();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.email_verified, u.created_at,
           p.phone, p.profile_image, p.bio
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = ${session.userId};
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ profile: rows[0] || null }));
}

async function handleUpdateUserProfile(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const data = await readJsonBody(req);
  const { name, phone, bio, profileImage } = data;

  const sql = getDb();
  if (name) {
    await sql`UPDATE users SET name = ${name.trim()}, updated_at = NOW() WHERE id = ${session.userId};`;
  }

  await sql`
    INSERT INTO user_profiles (user_id, phone, profile_image, bio, updated_at)
    VALUES (${session.userId}, ${phone || null}, ${profileImage || null}, ${bio || null}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      profile_image = COALESCE(EXCLUDED.profile_image, user_profiles.profile_image),
      bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
      updated_at = NOW();
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Profile updated successfully.' }));
}

async function handleChangePassword(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const data = await readJsonBody(req);
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please provide valid current and new passwords (at least 6 characters).' }));
    return;
  }

  const sql = getDb();
  const users = await sql`SELECT password_hash FROM users WHERE id = ${session.userId};`;
  if (users.length === 0 || !verifyPassword(currentPassword, users[0].password_hash)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Current password is incorrect.' }));
    return;
  }

  const newHash = hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${session.userId};`;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Password updated successfully.' }));
}

// -------------------------------------------------------------
// WhatsApp E-Commerce Order Creation (CRITICAL BUSINESS FLOW)
// -------------------------------------------------------------

async function handleCreateWhatsAppOrder(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Please log in to purchase this course.' }));
    return;
  }

  const data = await readJsonBody(req);
  const { courseId } = data;

  if (!courseId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing course ID.' }));
    return;
  }

  const sql = getDb();

  // Validate course & get actual price from Neon PostgreSQL (NOT frontend)
  const courses = await sql`
    SELECT id, title, slug, price, thumbnail, image
    FROM courses
    WHERE id = ${courseId} OR slug = ${courseId};
  `;

  if (courses.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Course not found in academy database.' }));
    return;
  }

  const course = courses[0];
  const actualAmount = Number(course.price) || 499;

  // Idempotency check: Reuse existing active pending order if created within the last 15 minutes
  const existingPending = await sql`
    SELECT o.id, o.order_number, o.total_amount, o.status, p.status as payment_status
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN payments p ON o.id = p.order_id
    WHERE o.user_id = ${session.userId}
      AND oi.course_id = ${course.id}
      AND o.status = 'PENDING'
      AND o.created_at > NOW() - INTERVAL '15 minutes'
    ORDER BY o.created_at DESC
    LIMIT 1;
  `;

  let orderId: string;
  let orderNumber: string;

  if (existingPending.length > 0) {
    orderId = existingPending[0].id;
    orderNumber = existingPending[0].order_number;
  } else {
    // Generate unique Order ID & Order Number
    const year = new Date().getFullYear();
    const randPart = Math.floor(10000 + Math.random() * 90000);
    orderNumber = `ORD-${year}-${randPart}`;
    orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Create Order in Neon PostgreSQL (compatible with unified schema & legacy columns)
    await sql`
      INSERT INTO orders (id, order_number, user_id, status, total_amount, amount, course_id, course_title, payment_method)
      VALUES (${orderId}, ${orderNumber}, ${session.userId}, 'PENDING', ${actualAmount}, ${actualAmount}, ${course.id}, ${course.title}, 'WHATSAPP_MANUAL');
    `;

    // Create Order Item
    await sql`
      INSERT INTO order_items (id, order_id, course_id, course_name_snapshot, price_at_purchase)
      VALUES (${`item_${orderId}`}, ${orderId}, ${course.id}, ${course.title}, ${actualAmount});
    `;

    // Create Payment Record (WHATSAPP_MANUAL, AWAITING_CONFIRMATION)
    await sql`
      INSERT INTO payments (id, order_id, payment_method, status)
      VALUES (${`pay_${orderId}`}, ${orderId}, 'WHATSAPP_MANUAL', 'AWAITING_CONFIRMATION');
    `;

    // Trigger non-blocking email
    generateOrderCreatedEmail(session.name, orderNumber, course.title, actualAmount);
  }

  // Construct official WhatsApp concierge message with actual database values
  const whatsappNumber = '918248957918';
  const whatsappMessage = `Hello! I would like to purchase a course from Cakexperiment.

ORDER DETAILS:
User ID: ${session.userId}
Order ID: ${orderNumber}
Course ID: ${course.id}
Course Name: ${course.title}
Amount: ₹${actualAmount}

I would like to proceed with the payment.
Please guide me through the payment process.
Thank you!`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  res.statusCode = 201;
  res.end(
    JSON.stringify({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        userId: session.userId,
        courseId: course.id,
        courseTitle: course.title,
        amount: actualAmount,
        status: 'PENDING',
        paymentStatus: 'AWAITING_CONFIRMATION',
        whatsappUrl
      }
    })
  );
}

// -------------------------------------------------------------
// User Orders & Courses Handlers (Strict Data Isolation)
// -------------------------------------------------------------

async function handleUserOrders(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const sql = getDb();
  // Server-side isolation: query ONLY by session.userId
  const orders = await sql`
    SELECT o.id, o.order_number, o.status as order_status, COALESCE(o.total_amount, o.amount, 499) as total_amount, o.created_at,
           oi.course_id, oi.course_name_snapshot as course_title,
           c.thumbnail as course_thumbnail, c.image as course_image,
           p.status as payment_status, p.payment_method,
           CASE WHEN e.status = 'ACTIVE' THEN 'UNLOCKED' ELSE 'LOCKED' END as course_access_status
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN courses c ON oi.course_id = c.id
    LEFT JOIN payments p ON o.id = p.order_id
    LEFT JOIN enrollments e ON e.user_id = o.user_id AND e.course_id = oi.course_id
    WHERE o.user_id = ${session.userId}
    ORDER BY o.created_at DESC;
  `;

  // Add dynamic WhatsApp link for each pending order
  const ordersWithLinks = orders.map((o: any) => {
    const msg = `Hello! I have created an order with Cakexperiment.

ORDER DETAILS:
User ID: ${session.userId}
Order ID: ${o.order_number}
Course: ${o.course_title}
Amount: ₹${o.total_amount}

Please guide me through completing the payment.`;
    return {
      ...o,
      whatsappUrl: `https://wa.me/918248957918?text=${encodeURIComponent(msg)}`
    };
  });

  res.statusCode = 200;
  res.end(JSON.stringify({ orders: ordersWithLinks }));
}

async function handleUserCourses(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const sql = getDb();
  // Server-side isolation: only returns courses with ACTIVE enrollments
  const courses = await sql`
    SELECT e.id as enrollment_id, e.course_id, e.progress, e.completed_lessons, e.activated_at,
           c.title, c.slug, c.tag, c.thumbnail, c.image, c.instructor_name, c.total_duration,
           c.modules_count, c.lessons_count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ${session.userId} AND e.status = 'ACTIVE'
    ORDER BY e.activated_at DESC;
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ courses }));
}

async function handleCourseClassroom(courseId: string, req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const sql = getDb();

  // Find course
  const courses = await sql`
    SELECT id, title, slug, tag, description, instructor_name, instructor_bio, instructor_avatar, thumbnail
    FROM courses
    WHERE id = ${courseId} OR slug = ${courseId};
  `;

  if (courses.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Course not found.' }));
    return;
  }

  const course = courses[0];

  // Role verification: must be ADMIN or have ACTIVE enrollment
  if (session.role !== 'ADMIN') {
    const enrollments = await sql`
      SELECT id, status FROM enrollments
      WHERE user_id = ${session.userId} AND course_id = ${course.id} AND status = 'ACTIVE';
    `;
    if (enrollments.length === 0) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Course access locked. Active enrollment required.' }));
      return;
    }
  }

  // Load modules & lessons
  const modules = await sql`
    SELECT id, title, description, order_num
    FROM modules
    WHERE course_id = ${course.id}
    ORDER BY order_num ASC;
  `;

  const lessons = await sql`
    SELECT id, module_id, title, description, video_reference, duration, is_preview, status, order_num
    FROM lessons
    WHERE course_id = ${course.id}
    ORDER BY order_num ASC;
  `;

  // Attach lessons to modules
  const modulesWithLessons = modules.map((m: any) => ({
    ...m,
    lessons: lessons.filter((l: any) => l.module_id === m.id)
  }));

  // Load user progress
  const progressRows = await sql`
    SELECT lesson_id, completed, last_watched_at
    FROM lesson_progress
    WHERE user_id = ${session.userId} AND course_id = ${course.id};
  `;

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      course: {
        ...course,
        modules: modulesWithLessons
      },
      progress: progressRows
    })
  );
}

async function handleUserProgress(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }

  const data = await readJsonBody(req);
  const { courseId, lessonId, completed } = data;

  if (!courseId || !lessonId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Course ID and Lesson ID are required.' }));
    return;
  }

  const sql = getDb();
  const progressId = `prog_${session.userId}_${lessonId}`;

  await sql`
    INSERT INTO lesson_progress (id, user_id, course_id, lesson_id, completed, last_watched_at, updated_at)
    VALUES (${progressId}, ${session.userId}, ${courseId}, ${lessonId}, ${Boolean(completed)}, NOW(), NOW())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      completed = EXCLUDED.completed,
      last_watched_at = NOW(),
      updated_at = NOW();
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Progress saved successfully.' }));
}

// -------------------------------------------------------------
// Course Catalog Handlers (Read-Only)
// -------------------------------------------------------------

async function handleListCourses(res: ServerResponse) {
  const sql = getDb();
  const courses = await sql`
    SELECT id, title, slug, tag, short_description, description, thumbnail, image, preview_media,
           category_id, category_name, instructor_name, instructor_avatar, skill_level,
           price, original_price, rating, reviews_count, status, featured, total_duration,
           modules_count, lessons_count, created_at
    FROM courses
    WHERE status = 'published'
    ORDER BY created_at DESC;
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ courses }));
}

async function handleGetCourseDetail(idOrSlug: string, res: ServerResponse) {
  const sql = getDb();
  const courses = await sql`
    SELECT * FROM courses
    WHERE id = ${idOrSlug} OR slug = ${idOrSlug};
  `;

  if (courses.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Course not found.' }));
    return;
  }

  const course = courses[0];
  const modules = await sql`
    SELECT id, title, description, order_num FROM modules
    WHERE course_id = ${course.id} ORDER BY order_num ASC;
  `;
  const lessons = await sql`
    SELECT id, module_id, title, description, video_reference, duration, is_preview, status, order_num
    FROM lessons WHERE course_id = ${course.id} ORDER BY order_num ASC;
  `;

  const modulesWithLessons = modules.map((m: any) => ({
    ...m,
    lessons: lessons.filter((l: any) => l.module_id === m.id)
  }));

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      course: {
        ...course,
        modules: modulesWithLessons
      }
    })
  );
}

// -------------------------------------------------------------
// Admin Management Handlers (Strict Role Check)
// -------------------------------------------------------------

async function handleAdminOrders(parsedUrl: URL, req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const statusFilter = parsedUrl.searchParams.get('status') || 'all';
  const searchQuery = (parsedUrl.searchParams.get('search') || '').trim().toLowerCase();

  const sql = getDb();
  let query = sql`
    SELECT o.id, o.order_number, o.user_id, o.status as order_status, COALESCE(o.total_amount, o.amount, 499) as total_amount, o.approved_by, o.approved_at, o.created_at,
           u.name as customer_name, u.email as customer_email,
           p.phone as customer_phone,
           oi.course_id, oi.course_name_snapshot as course_name,
           c.thumbnail as course_thumbnail,
           pay.status as payment_status, pay.payment_method,
           CASE WHEN e.status = 'ACTIVE' THEN 'ACTIVE' ELSE 'LOCKED' END as course_access_status
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN courses c ON oi.course_id = c.id
    LEFT JOIN payments pay ON o.id = pay.order_id
    LEFT JOIN enrollments e ON e.user_id = o.user_id AND e.course_id = oi.course_id
    ORDER BY o.created_at DESC;
  `;

  const allOrders = await query;

  let filtered = allOrders;
  if (statusFilter !== 'all') {
    filtered = filtered.filter((o: any) => {
      if (statusFilter === 'pending') return o.order_status === 'PENDING';
      if (statusFilter === 'confirmed') return o.order_status === 'COMPLETED';
      if (statusFilter === 'cancelled') return o.order_status === 'CANCELLED';
      if (statusFilter === 'refunded') return o.order_status === 'REFUNDED';
      return true;
    });
  }

  if (searchQuery) {
    filtered = filtered.filter((o: any) =>
      (o.order_number || '').toLowerCase().includes(searchQuery) ||
      (o.user_id || '').toLowerCase().includes(searchQuery) ||
      (o.customer_email || '').toLowerCase().includes(searchQuery) ||
      (o.customer_name || '').toLowerCase().includes(searchQuery) ||
      (o.course_name || '').toLowerCase().includes(searchQuery)
    );
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ orders: filtered, total: filtered.length }));
}

async function handleAdminConfirmPayment(orderId: string, req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const sql = getDb();

  // Retrieve order details
  const orders = await sql`
    SELECT o.id, o.order_number, o.user_id, o.status, oi.course_id, oi.course_name_snapshot, u.name, u.email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ${orderId} OR o.order_number = ${orderId};
  `;

  if (orders.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Order not found.' }));
    return;
  }

  const ord = orders[0];

  if (ord.status === 'CANCELLED' || ord.status === 'REFUNDED') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `Cannot activate an order with status ${ord.status}.` }));
    return;
  }

  if (ord.status === 'COMPLETED') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Order payment is already confirmed and active.' }));
    return;
  }

  // Transaction: Update Order, Update Payment, Create/Activate Enrollment, Log Audit
  await sql`
    UPDATE orders
    SET status = 'COMPLETED', approved_by = ${session.userId}, approved_at = NOW(), updated_at = NOW()
    WHERE id = ${ord.id};
  `;

  await sql`
    UPDATE payments
    SET status = 'CONFIRMED', confirmed_by = ${session.userId}, confirmed_at = NOW(), updated_at = NOW()
    WHERE order_id = ${ord.id};
  `;

  const enrollmentId = `enr_${ord.user_id}_${ord.course_id}`;
  await sql`
    INSERT INTO enrollments (id, user_id, course_id, order_id, status, progress, activated_at)
    VALUES (${enrollmentId}, ${ord.user_id}, ${ord.course_id}, ${ord.id}, 'ACTIVE', 0, NOW())
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      status = 'ACTIVE',
      order_id = EXCLUDED.order_id,
      activated_at = NOW();
  `;

  await sql`
    INSERT INTO admin_audit_logs (id, admin_user_id, order_id, action, previous_status, new_status)
    VALUES (${`audit_${Date.now()}`}, ${session.userId}, ${ord.id}, 'CONFIRM_PAYMENT_AND_ACTIVATE', ${ord.status}, 'COMPLETED');
  `;

  // Dispatch non-blocking notification
  generateCourseActivatedEmail(ord.name, ord.course_name_snapshot);

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      success: true,
      message: 'Payment confirmed successfully. Course has been unlocked for the student.'
    })
  );
}

async function handleAdminCancelOrder(orderId: string, req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const sql = getDb();
  const orders = await sql`SELECT id, status FROM orders WHERE id = ${orderId} OR order_number = ${orderId};`;
  if (orders.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Order not found.' }));
    return;
  }

  const ord = orders[0];
  await sql`UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = ${ord.id};`;
  await sql`UPDATE payments SET status = 'NOT_CONFIRMED', updated_at = NOW() WHERE order_id = ${ord.id};`;

  await sql`
    INSERT INTO admin_audit_logs (id, admin_user_id, order_id, action, previous_status, new_status)
    VALUES (${`audit_${Date.now()}`}, ${session.userId}, ${ord.id}, 'CANCEL_ORDER', ${ord.status}, 'CANCELLED');
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Order has been cancelled.' }));
}

async function handleAdminRefundOrder(orderId: string, req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const sql = getDb();
  const orders = await sql`
    SELECT o.id, o.user_id, o.status, oi.course_id
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ${orderId} OR o.order_number = ${orderId};
  `;

  if (orders.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Order not found.' }));
    return;
  }

  const ord = orders[0];
  await sql`UPDATE orders SET status = 'REFUNDED', updated_at = NOW() WHERE id = ${ord.id};`;
  await sql`UPDATE payments SET status = 'REFUNDED', updated_at = NOW() WHERE order_id = ${ord.id};`;
  await sql`UPDATE enrollments SET status = 'REVOKED' WHERE user_id = ${ord.user_id} AND course_id = ${ord.course_id};`;

  await sql`
    INSERT INTO admin_audit_logs (id, admin_user_id, order_id, action, previous_status, new_status)
    VALUES (${`audit_${Date.now()}`}, ${session.userId}, ${ord.id}, 'RECORD_REFUND', ${ord.status}, 'REFUNDED');
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Order refunded and course access revoked.' }));
}

async function handleAdminUsers(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const sql = getDb();
  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, u.email_verified,
           COALESCE(u.status, 'active') as status,
           u.created_at,
           p.phone, p.bio,
           COALESCE(p.profile_image, p.avatar) as avatar,
           COUNT(e.id)::int as active_enrollments_count
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'ACTIVE'
    GROUP BY u.id, u.status, p.phone, p.bio, p.profile_image, p.avatar
    ORDER BY u.created_at DESC;
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ users }));
}

async function handleAdminToggleUserStatus(targetUserId: string, req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const data = await readJsonBody(req);
  const nextStatus = data.status === 'suspended' ? 'suspended' : 'active';

  const sql = getDb();
  await sql`
    UPDATE users
    SET status = ${nextStatus}, updated_at = NOW()
    WHERE id = ${targetUserId};
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, status: nextStatus }));
}

async function handleAdminStats(req: IncomingMessage, res: ServerResponse) {
  const session = await getAuthenticatedUser(req);
  if (!session) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized: Authentication required.' }));
    return;
  }
  if (session.role !== 'ADMIN') {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Forbidden: Admin access required.' }));
    return;
  }

  const sql = getDb();
  const stats = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'USER') as total_students,
      (SELECT COUNT(*)::int FROM orders) as total_orders,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'PENDING') as pending_requests,
      (SELECT COUNT(*)::int FROM enrollments WHERE status = 'ACTIVE') as active_enrollments,
      (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM orders WHERE status = 'COMPLETED') as confirmed_revenue;
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ stats: stats[0] }));
}

// -------------------------------------------------------------
// Existing Neon Infrastructure Handlers
// -------------------------------------------------------------

async function handleStatus(res: ServerResponse) {
  const startTime = Date.now();
  let dbOk = false;
  let dbInfo: any = {};
  let storageOk = false;
  let storageInfo: any = {};

  try {
    const sql = getDb();
    const rows = await sql`SELECT version(), current_database(), current_user;`;
    dbOk = true;
    dbInfo = {
      connected: true,
      name: rows[0]?.current_database || 'neondb',
      user: rows[0]?.current_user || 'neondb_owner',
      version: rows[0]?.version || '',
      latencyMs: Date.now() - startTime
    };
  } catch (err: any) {
    dbInfo = {
      connected: false,
      error: err.message
    };
  }

  try {
    const s3 = getS3();
    const bucket = 'assets';
    const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 10 }));
    storageOk = true;
    storageInfo = {
      connected: true,
      bucket,
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION || 'us-east-2',
      assetCount: list.KeyCount || 0
    };
  } catch (err: any) {
    storageInfo = {
      connected: false,
      bucket: 'assets',
      error: err.message
    };
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      connected: dbOk && storageOk,
      branch: process.env.NEON_BRANCH || 'production',
      database: dbInfo,
      objectStorage: storageInfo
    })
  );
}

async function handleQuery(req: IncomingMessage, res: ServerResponse) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      if (!data.query) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing query in request body' }));
        return;
      }

      const sql = getDb();
      const rows = await sql.query(data.query, data.params || []);
      res.statusCode = 200;
      res.end(JSON.stringify({ rows }));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

async function handleListStorage(urlStr: string, res: ServerResponse) {
  try {
    const s3 = getS3();
    const bucket = 'assets';
    const parsedUrl = new URL(urlStr, 'http://localhost');
    const prefix = parsedUrl.searchParams.get('prefix') || undefined;

    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix
      })
    );

    const assets = (list.Contents || []).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified?.toISOString(),
      url: `${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${item.Key}`
    }));

    res.statusCode = 200;
    res.end(JSON.stringify({ assets }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];
  req.on('data', chunk => chunks.push(Buffer.from(chunk)));
  req.on('end', async () => {
    try {
      const s3 = getS3();
      const bucket = 'assets';
      const buffer = Buffer.concat(chunks);
      const filename = `asset-${Date.now()}.bin`;
      const key = `uploads/${filename}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: (req.headers['content-type'] as string) || 'application/octet-stream'
        })
      );

      try {
        const sql = getDb();
        await sql`
          INSERT INTO media_assets (key, bucket, content_type, size_bytes, url)
          VALUES (
            ${key},
            ${bucket},
            ${req.headers['content-type'] || 'application/octet-stream'},
            ${buffer.length},
            ${`${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${key}`}
          );
        `;
      } catch (dbErr) {
        console.warn('Could not record asset in Postgres:', dbErr);
      }

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          key,
          size: buffer.length,
          url: `${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${key}`
        })
      );
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
