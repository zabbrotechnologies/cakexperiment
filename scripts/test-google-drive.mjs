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
  console.log('CAKEXPERIMENT — GOOGLE DRIVE VIDEO STORAGE TEST SUITE');
  console.log('================================================================\n');

  const { server, port } = await startTestServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const sql = getDb();

  try {
    // -------------------------------------------------------------
    // Setup: Retrieve provisioned admin token and normal student token
    // -------------------------------------------------------------
    const adminUser = await sql`SELECT id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1;`;
    if (adminUser.length === 0) {
      throw new Error('No admin user found in database');
    }

    const adminToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
    await sql`
      INSERT INTO sessions (id, user_id, role, expires_at)
      VALUES (${adminToken}, ${adminUser[0].id}, 'ADMIN', ${expiresAt.toISOString()});
    `;

    // -------------------------------------------------------------
    // Phase 1: Security & Initiation (/api/admin/storage/google-drive/auth)
    // -------------------------------------------------------------
    console.log('--- Phase 1: OAuth Initiation & Admin Authorization Guard ---');

    // 1a. Deny unauthenticated requests
    const unauthInit = await fetch(`${baseUrl}/api/admin/storage/google-drive/auth`, { redirect: 'manual' });
    assert(unauthInit.status === 403, 'Unauthenticated access to storage setup is blocked with 403 Forbidden');

    // 1b. Allow authenticated admin
    const authInit = await fetch(`${baseUrl}/api/admin/storage/google-drive/auth`, {
      redirect: 'manual',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        host: 'localhost:5173'
      }
    });

    assert(authInit.status === 302, 'Authorized admin initiates Drive OAuth with 302 redirect');
    const locUrl = new URL(authInit.headers.get('location') || '');
    assert(locUrl.origin === 'https://accounts.google.com', 'Redirects to accounts.google.com');
    assert(locUrl.searchParams.get('client_id') === process.env.GOOGLE_DRIVE_CLIENT_ID, 'Passes exact GOOGLE_DRIVE_CLIENT_ID');
    assert(locUrl.searchParams.get('scope') === 'https://www.googleapis.com/auth/drive.file', 'Scope is strictly drive.file (minimum necessary for private video folder)');
    assert(locUrl.searchParams.get('access_type') === 'offline', 'Requests offline access for server-side token refresh');
    assert(locUrl.searchParams.get('prompt') === 'consent', 'Forces consent prompt to guarantee refresh_token generation');
    assert(locUrl.searchParams.get('redirect_uri') === 'http://localhost:5173/api/admin/storage/google-drive/callback', 'Resolves local callback URI (http://localhost:5173/api/admin/storage/google-drive/callback)');

    // 1c. Production domain resolution
    const prodInit = await fetch(`${baseUrl}/api/admin/storage/google-drive/auth`, {
      redirect: 'manual',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        host: 'thecakexperiment.com',
        'x-forwarded-host': 'thecakexperiment.com',
        'x-forwarded-proto': 'https'
      }
    });
    const prodLoc = new URL(prodInit.headers.get('location') || '');
    assert(prodLoc.searchParams.get('redirect_uri') === 'https://thecakexperiment.com/api/admin/storage/google-drive/callback', 'Resolves production callback URI (https://thecakexperiment.com/api/admin/storage/google-drive/callback)');

    // -------------------------------------------------------------
    // Phase 2: Callback Security & CSRF Defense
    // -------------------------------------------------------------
    console.log('\n--- Phase 2: Callback Security & State Signature Validation ---');

    // 2a. Missing state and code
    const missingRes = await fetch(`${baseUrl}/api/admin/storage/google-drive/callback`, { redirect: 'manual' });
    assert(missingRes.status === 302 && missingRes.headers.get('location').includes('error='), 'Missing params safely redirects with error flag');

    // 2b. Tampered state
    const tamperedRes = await fetch(`${baseUrl}/api/admin/storage/google-drive/callback?code=test_code&state=fake_payload.fake_signature`, { redirect: 'manual' });
    assert(tamperedRes.status === 302 && tamperedRes.headers.get('location').includes('drive_state_tampered'), 'Rejects forged state signature');

    // -------------------------------------------------------------
    // Phase 3: Status Endpoint (/api/admin/storage/google-drive/status)
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Drive Storage Status & Quota Inspection ---');

    const statusRes = await fetch(`${baseUrl}/api/admin/storage/google-drive/status`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(statusRes.status === 200, 'Status endpoint returns 200 OK for admin');
    const statusData = await statusRes.json();
    assert(typeof statusData.connected === 'boolean', 'Returns valid connection status boolean');

    // -------------------------------------------------------------
    // Phase 4: Video Upload Initiation & Format Validation
    // -------------------------------------------------------------
    console.log('\n--- Phase 4: Video Upload Validation & Resumable Session ---');

    // 4a. Reject unsupported formats (.exe or .txt)
    const invalidUpload = await fetch(`${baseUrl}/api/admin/videos/initiate-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'malicious.exe',
        fileSize: 1048576,
        mimeType: 'application/x-msdownload',
        lessonId: 'les-test-1'
      })
    });
    assert(invalidUpload.status === 400, 'Rejects non-video files (.exe) with 400 Bad Request');

    // -------------------------------------------------------------
    // Phase 5: Student Video Streaming Endpoint & Permissions
    // -------------------------------------------------------------
    console.log('\n--- Phase 5: Student Video Player Streaming Endpoint ---');

    // Find a preview lesson and non-preview lesson
    const previewLesson = await sql`SELECT id, course_id, is_preview FROM lessons WHERE is_preview = TRUE LIMIT 1;`;
    const lockedLesson = await sql`SELECT id, course_id, is_preview FROM lessons WHERE is_preview = FALSE LIMIT 1;`;

    if (previewLesson.length > 0) {
      // 5a. Public preview video streams without login
      const previewStreamRes = await fetch(`${baseUrl}/api/videos/stream/${previewLesson[0].id}`, {
        redirect: 'manual'
      });
      assert(previewStreamRes.status === 200 || previewStreamRes.status === 206 || previewStreamRes.status === 302, 'Free preview lesson streams publicly');
    }

    if (lockedLesson.length > 0) {
      // 5b. Locked enrolled lesson blocks unauthenticated access
      const lockedStreamRes = await fetch(`${baseUrl}/api/videos/stream/${lockedLesson[0].id}`, {
        redirect: 'manual'
      });
      assert(lockedStreamRes.status === 401, 'Locked lesson blocks unauthenticated requests with 401 Unauthorized');

      // 5c. Admin can always stream/preview any video
      const adminStreamRes = await fetch(`${baseUrl}/api/videos/stream/${lockedLesson[0].id}`, {
        redirect: 'manual',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(adminStreamRes.status === 200 || adminStreamRes.status === 206 || adminStreamRes.status === 302, 'Admin can preview and stream any lesson video');
    }

    // -------------------------------------------------------------
    // Phase 6: Database Schema Verification
    // -------------------------------------------------------------
    console.log('\n--- Phase 6: Database Schema & Metadata Columns ---');

    const storageTable = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'google_drive_storage';`;
    assert(storageTable.length > 0, 'google_drive_storage table exists in Neon PostgreSQL');

    const lessonCols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'lessons' AND column_name IN ('drive_file_id', 'video_filename', 'video_size', 'video_mime', 'video_uploaded_at');
    `;
    const colNames = lessonCols.map(c => c.column_name);
    assert(colNames.includes('drive_file_id'), 'lessons table contains drive_file_id');
    assert(colNames.includes('video_size'), 'lessons table contains video_size');
    assert(colNames.includes('video_mime'), 'lessons table contains video_mime');

    // Clean up temporary session
    await sql`DELETE FROM sessions WHERE id = ${adminToken};`;

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
  console.error('Test execution error:', e);
  process.exit(1);
});
