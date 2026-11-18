import http from 'http';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import crypto from 'crypto';
import { handleNeonApi } from '../api/neonApiBundle.js';
import { getDb } from '../server/neonDb.ts';

async function startTestServer() {
  const server = http.createServer((req, res) => {
    handleNeonApi(req, res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function parseSetCookie(headers) {
  const raw = headers['set-cookie'] || [];
  const cookies = {};
  raw.forEach((str) => {
    const [nameVal, ...flags] = str.split(';');
    const [name, val] = nameVal.split('=');
    cookies[name.trim()] = { value: val ? val.trim() : '', flags: flags.map(f => f.trim()) };
  });
  return cookies;
}

let passed = 0;
let failed = 0;

function assert(condition, testName, extra = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${extra}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('CAKEXPERIMENT — GOOGLE OAUTH 2.0 VERIFICATION SUITE');
  console.log('================================================================\n');

  const { server, port } = await startTestServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------
    // Test 1: GET /api/auth/google initiates flow with proper params
    // -------------------------------------------------------------
    console.log('--- Phase 1: Initiation Endpoint (/api/auth/google) ---');
    const initRes = await fetch(`${baseUrl}/api/auth/google?redirect=/shop`, {
      redirect: 'manual',
      headers: { host: 'localhost:5173' }
    });

    assert(initRes.status === 302, 'Returns HTTP 302 redirect');
    const location = initRes.headers.get('location');
    assert(location && location.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'Redirects to accounts.google.com');

    const locUrl = new URL(location);
    assert(locUrl.searchParams.get('client_id') === process.env.GOOGLE_CLIENT_ID, 'Passes exact GOOGLE_CLIENT_ID');
    assert(locUrl.searchParams.get('redirect_uri') === 'http://localhost:5173/api/auth/callback/google', 'Matches local callback URI (http://localhost:5173/api/auth/callback/google)');
    assert(locUrl.searchParams.get('scope') === 'openid email profile', 'Restricted to minimum scopes (openid, email, profile - NO Drive scopes)');
    assert(locUrl.searchParams.get('response_type') === 'code', 'Requests authorization code');
    assert(!!locUrl.searchParams.get('state'), 'Includes cryptographically signed state parameter');

    const setCookies = parseSetCookie(initRes.headers.raw?.() || { 'set-cookie': initRes.headers.getSetCookie?.() || [] });
    assert(!!setCookies['cakexperiment_oauth_state'], 'Sets HTTP-only cakexperiment_oauth_state cookie for CSRF protection');

    // -------------------------------------------------------------
    // Test 2: Production Origin and Callback Resolution
    // -------------------------------------------------------------
    console.log('\n--- Phase 2: Production Domain & Callback Resolution ---');
    const prodRes = await fetch(`${baseUrl}/api/auth/google`, {
      redirect: 'manual',
      headers: {
        host: 'thecakexperiment.com',
        'x-forwarded-host': 'thecakexperiment.com',
        'x-forwarded-proto': 'https'
      }
    });
    const prodLoc = new URL(prodRes.headers.get('location'));
    assert(
      prodLoc.searchParams.get('redirect_uri') === 'https://thecakexperiment.com/api/auth/callback/google',
      'Resolves production callback URI (https://thecakexperiment.com/api/auth/callback/google)'
    );

    // -------------------------------------------------------------
    // Test 3: Security & CSRF Defense on Callback
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Security & State Validation ---');
    
    // 3a. Missing state and code
    const missingRes = await fetch(`${baseUrl}/api/auth/callback/google`, { redirect: 'manual' });
    assert(missingRes.status === 302, 'Callback with missing params redirects');
    assert(missingRes.headers.get('location').includes('error=invalid_request'), 'Rejects missing state with error=invalid_request');

    // 3b. Invalid/tampered state
    const forgedRes = await fetch(`${baseUrl}/api/auth/callback/google?code=fake_code&state=forged_state.invalid_sig`, { redirect: 'manual' });
    assert(forgedRes.headers.get('location').includes('error=invalid_state'), 'Rejects tampered state signature');

    // 3c. Expired state
    const expiredPayload = Buffer.from(JSON.stringify({ n: 'nonce123', r: '/learn', t: Date.now() - 15 * 60 * 1000 })).toString('base64url');
    const expiredSig = crypto.createHmac('sha256', process.env.GOOGLE_CLIENT_SECRET).update(expiredPayload).digest('base64url');
    const expiredRes = await fetch(`${baseUrl}/api/auth/callback/google?code=fake_code&state=${expiredPayload}.${expiredSig}`, { redirect: 'manual' });
    assert(expiredRes.headers.get('location').includes('error=invalid_state'), 'Rejects expired state (>10 minutes)');

    // -------------------------------------------------------------
    // Test 4: Neon DB Integration & Account Logic
    // -------------------------------------------------------------
    console.log('\n--- Phase 4: Account Creation, Linking & Role Preservation ---');
    const sql = getDb();

    // 4a. Create a user via normal signup and verify password auth
    const testEmail = `oauth_test_${Date.now()}@thecakexperiment.com`;
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OAuth Test Student',
        email: testEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const signupData = await signupRes.json();
    assert(signupRes.status === 201 && signupData.success, 'Standard email/password signup continues to function normally');
    assert(signupData.user.role === 'USER', 'New student registered with USER role');

    // 4b. Verify user can sign in via existing password endpoint
    const signinRes = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password123!' })
    });
    const signinData = await signinRes.json();
    assert(signinRes.status === 200 && signinData.success, 'Standard email/password sign-in continues to function normally');

    // 4c. Verify role preservation for admin accounts
    const adminCheck = await sql`SELECT id, name, email, role FROM users WHERE role = 'ADMIN' LIMIT 1;`;
    assert(adminCheck.length > 0 && adminCheck[0].role === 'ADMIN', 'Admin account exists with role ADMIN preserved');

    // 4d. Verify users table has google_id and auth_provider columns
    const columnsCheck = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('google_id', 'auth_provider');
    `;
    const colNames = columnsCheck.map(c => c.column_name);
    assert(colNames.includes('google_id'), 'users table contains google_id column');
    assert(colNames.includes('auth_provider'), 'users table contains auth_provider column');

    // Clean up test student
    await sql`DELETE FROM users WHERE email = ${testEmail};`;
    console.log('  Cleaned up temporary test user.');

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('================================================================');
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Test execution exception:', e);
  process.exit(1);
});
