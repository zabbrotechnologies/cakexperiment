import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import https from 'https';
import { getDb } from './neonDb.ts';
import type { AuthenticatedSession } from './neonApi.ts';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

// Scope strictly for private backend Drive file management (No read access to unrelated user files)
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Dedicated folder name in the private Google Drive account
const FOLDER_NAME = 'Cakexperiment Masterclass Videos';

// Active upload sessions map: sessionToken -> { resumableUrl, lessonId, courseId, moduleId, filename, size, mimeType, createdAt }
const activeUploadSessions = new Map<string, {
  resumableUrl: string;
  lessonId: string;
  courseId: string;
  moduleId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  createdAt: number;
}>();

// Clean up stale upload sessions older than 2 hours (unref to avoid hanging node builds/exits)
const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - 2 * 3600 * 1000;
  for (const [key, session] of activeUploadSessions.entries()) {
    if (session.createdAt < cutoff) {
      activeUploadSessions.delete(key);
    }
  }
}, 15 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

export function getDriveOAuthRedirectUri(req: IncomingMessage): string {
  // If explicitly configured in environment variables, use that exact URI
  const envUri = (process.env.GOOGLE_DRIVE_REDIRECT_URI || '').trim();
  if (envUri) {
    return envUri;
  }
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:5173/api/admin/storage/google-drive/callback';
  }
  if (host.includes('thecakexperiment.com')) {
    return 'https://thecakexperiment.com/api/admin/storage/google-drive/callback';
  }
  if (host.includes('vercel.app')) {
    return `https://${host}/api/admin/storage/google-drive/callback`;
  }
  const appBase = process.env.APP_BASE_URL || 'https://thecakexperiment.com';
  return `${appBase.replace(/\/$/, '')}/api/admin/storage/google-drive/callback`;
}

/**
 * Validates or refreshes the Google Drive storage access token.
 */
export async function getValidDriveAccessToken(): Promise<{ accessToken: string; folderId: string }> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, refresh_token, access_token, token_expiry, folder_id, is_connected
    FROM google_drive_storage
    WHERE id = 'default';
  `;

  if (rows.length === 0 || !rows[0].refresh_token) {
    throw new Error('Google Drive storage is not authorized. Please connect via Admin Settings.');
  }

  const record = rows[0];
  const now = new Date();
  const expiry = record.token_expiry ? new Date(record.token_expiry) : new Date(0);

  // If token is still valid for at least 5 minutes, return it
  if (record.access_token && expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return { accessToken: record.access_token, folderId: record.folder_id || '' };
  }

  // Refresh token using stored refresh_token
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive client credentials are not configured on the server.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: record.refresh_token,
    grant_type: 'refresh_token'
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    // Mark disconnected if refresh token was revoked or expired (e.g. 7-day limit in Testing mode)
    await sql`
      UPDATE google_drive_storage
      SET is_connected = FALSE, updated_at = NOW()
      WHERE id = 'default';
    `;
    throw new Error(`Failed to refresh Google Drive access token: ${errText}. Please reauthorize in Admin Settings.`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);

  let folderId = record.folder_id;
  if (!folderId) {
    folderId = await ensureDriveFolder(data.access_token);
  }

  await sql`
    UPDATE google_drive_storage
    SET access_token = ${data.access_token},
        token_expiry = ${newExpiry.toISOString()},
        folder_id = ${folderId},
        is_connected = TRUE,
        last_verified_at = NOW(),
        updated_at = NOW()
    WHERE id = 'default';
  `;

  return { accessToken: data.access_token, folderId };
}

/**
 * Locates or creates the dedicated Cakexperiment folder in Google Drive.
 */
async function ensureDriveFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await fetch(`${GOOGLE_DRIVE_API}/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files: Array<{ id: string; name: string }> };
    if (data.files && data.files.length > 0 && data.files[0].id) {
      return data.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch(`${GOOGLE_DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Private Cakexperiment Masterclass Video Repository'
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Cakexperiment video folder: ${errText}`);
  }

  const created = (await createRes.json()) as { id: string };
  return created.id;
}

/**
 * Checks Google Drive account storage quota.
 */
async function fetchDriveQuota(accessToken: string): Promise<{ used: number; total: number }> {
  try {
    const res = await fetch(`${GOOGLE_DRIVE_API}/about?fields=storageQuota`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = (await res.json()) as { storageQuota?: { usage?: string; limit?: string } };
      const used = parseInt(data.storageQuota?.usage || '0', 10);
      const total = parseInt(data.storageQuota?.limit || '16106127360', 10);
      return { used, total };
    }
  } catch (err) {
    console.warn('Could not query Drive quota:', err);
  }
  return { used: 0, total: 16106127360 };
}

/**
 * GET /api/admin/storage/google-drive/auth
 * Initiates the one-time admin authorization for the dedicated Google Drive account.
 */
export async function handleDriveAuth(
  req: IncomingMessage,
  res: ServerResponse,
  adminUser: AuthenticatedSession
): Promise<void> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Google Drive client credentials are not configured on the server.' }));
    return;
  }

  const redirectUri = getDriveOAuthRedirectUri(req);
  const nonce = crypto.randomBytes(24).toString('hex');
  const payload = JSON.stringify({ nonce, adminId: adminUser.userId, timestamp: Date.now() });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', clientSecret).update(b64).digest('base64url');
  const state = `${b64}.${sig}`;

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', DRIVE_SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Required to receive refresh_token
  authUrl.searchParams.set('state', state);

  const isProduction = process.env.NODE_ENV === 'production' || (req.headers.host && !req.headers.host.includes('localhost'));
  const secureFlag = isProduction ? '; Secure' : '';

  res.statusCode = 302;
  res.setHeader('Location', authUrl.toString());
  res.setHeader(
    'Set-Cookie',
    `cakexperiment_drive_state=${nonce}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600${secureFlag}`
  );
  res.end();
}

/**
 * GET /api/admin/storage/google-drive/callback
 * Handles the OAuth code exchange, obtains offline refresh token, establishes folder, and stores credentials.
 */
export async function handleDriveCallback(
  rawUrl: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.statusCode = 302;
    res.setHeader('Location', '/admin/settings?error=drive_config_missing');
    res.end();
    return;
  }

  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const code = parsedUrl.searchParams.get('code');
  const state = parsedUrl.searchParams.get('state');
  const error = parsedUrl.searchParams.get('error');

  if (error || !code || !state) {
    res.statusCode = 302;
    res.setHeader('Location', `/admin/settings?error=drive_auth_cancelled&message=${encodeURIComponent(error || 'Authorization was cancelled')}`);
    res.end();
    return;
  }

  // Validate state signature
  const parts = state.split('.');
  if (parts.length !== 2) {
    res.statusCode = 302;
    res.setHeader('Location', '/admin/settings?error=invalid_drive_state');
    res.end();
    return;
  }

  const [b64Payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', clientSecret).update(b64Payload).digest('base64url');
  if (sig !== expectedSig) {
    res.statusCode = 302;
    res.setHeader('Location', '/admin/settings?error=drive_state_tampered');
    res.end();
    return;
  }

  const redirectUri = getDriveOAuthRedirectUri(req);

  try {
    // Exchange code for tokens
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokenData.access_token) {
      throw new Error('No access token received from Google.');
    }

    // Identify connected email
    let connectedEmail = 'storage@thecakexperiment.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (userinfoRes.ok) {
        const u = (await userinfoRes.json()) as { email?: string };
        if (u.email) connectedEmail = u.email;
      }
    } catch {
      // Non-critical
    }

    // Ensure dedicated folder exists in Drive (fail-safe)
    let folderId = '';
    try {
      folderId = await ensureDriveFolder(tokenData.access_token);
    } catch (e: any) {
      console.warn('Could not auto-create folder in Drive:', e?.message || e);
    }

    // Fetch quota (fail-safe)
    let used = 0;
    let total = 15 * 1024 * 1024 * 1024;
    try {
      const q = await fetchDriveQuota(tokenData.access_token);
      used = q.used;
      total = q.total;
    } catch (e: any) {
      console.warn('Could not fetch Drive quota:', e?.message || e);
    }
    const expiry = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    const sql = getDb();

    // Preserve existing refresh token if Google didn't reissue a new one on this prompt
    if (tokenData.refresh_token) {
      await sql`
        INSERT INTO google_drive_storage (
          id, connected_email, refresh_token, access_token, token_expiry,
          folder_id, folder_name, storage_quota_used, storage_quota_total,
          is_connected, last_verified_at, updated_at
        )
        VALUES (
          'default', ${connectedEmail}, ${tokenData.refresh_token}, ${tokenData.access_token}, ${expiry.toISOString()},
          ${folderId}, ${FOLDER_NAME}, ${used}, ${total},
          TRUE, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          connected_email = EXCLUDED.connected_email,
          refresh_token = EXCLUDED.refresh_token,
          access_token = EXCLUDED.access_token,
          token_expiry = EXCLUDED.token_expiry,
          folder_id = EXCLUDED.folder_id,
          storage_quota_used = EXCLUDED.storage_quota_used,
          storage_quota_total = EXCLUDED.storage_quota_total,
          is_connected = TRUE,
          last_verified_at = NOW(),
          updated_at = NOW();
      `;
    } else {
      await sql`
        UPDATE google_drive_storage
        SET connected_email = ${connectedEmail},
            access_token = ${tokenData.access_token},
            token_expiry = ${expiry.toISOString()},
            folder_id = ${folderId},
            storage_quota_used = ${used},
            storage_quota_total = ${total},
            is_connected = TRUE,
            last_verified_at = NOW(),
            updated_at = NOW()
        WHERE id = 'default';
      `;
    }

    res.statusCode = 302;
    res.setHeader('Location', '/admin/settings?drive=connected');
    res.end();
  } catch (err: any) {
    console.error('Google Drive authorization callback exception:', err);
    res.statusCode = 302;
    res.setHeader('Location', `/admin/settings?error=drive_exchange_failed&message=${encodeURIComponent(err.message || 'Storage authorization failed')}`);
    res.end();
  }
}

/**
 * GET /api/admin/storage/google-drive/status
 * Reports connection state, account email, folder ID, and quota metrics.
 */
export async function handleDriveStatus(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, connected_email, folder_id, folder_name, storage_quota_used, storage_quota_total, is_connected, last_verified_at
    FROM google_drive_storage
    WHERE id = 'default';
  `;

  if (rows.length === 0 || !rows[0].is_connected) {
    res.statusCode = 200;
    res.end(JSON.stringify({
      connected: false,
      message: 'Google Drive storage is not connected.'
    }));
    return;
  }

  const record = rows[0];

  // Try refreshing live quota if possible
  let quotaUsed = Number(record.storage_quota_used || 0);
  let quotaTotal = Number(record.storage_quota_total || 16106127360);
  try {
    const { accessToken } = await getValidDriveAccessToken();
    const live = await fetchDriveQuota(accessToken);
    quotaUsed = live.used;
    quotaTotal = live.total;
    await sql`
      UPDATE google_drive_storage
      SET storage_quota_used = ${quotaUsed}, storage_quota_total = ${quotaTotal}, updated_at = NOW()
      WHERE id = 'default';
    `;
  } catch {
    // Return cached quota if live check is unavailable
  }

  const quotaRemaining = Math.max(0, quotaTotal - quotaUsed);

  res.statusCode = 200;
  res.end(JSON.stringify({
    connected: true,
    email: record.connected_email || 'Connected Dedicated Account',
    folderName: record.folder_name || FOLDER_NAME,
    quotaUsed,
    quotaTotal,
    quotaRemaining,
    quotaUsedFormatted: (quotaUsed / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
    quotaTotalFormatted: (quotaTotal / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
    quotaPercentUsed: Math.min(100, Math.round((quotaUsed / quotaTotal) * 100)),
    lastVerifiedAt: record.last_verified_at
  }));
}

/**
 * POST /api/admin/storage/google-drive/disconnect
 */
export async function handleDriveDisconnect(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE google_drive_storage
    SET is_connected = FALSE, access_token = NULL, refresh_token = NULL, updated_at = NOW()
    WHERE id = 'default';
  `;

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Google Drive storage disconnected.' }));
}

/**
 * POST /api/admin/videos/initiate-upload
 * Creates a Google Drive API Resumable Upload session for a video file.
 * Returns an internal uploadSessionId so the browser never interacts directly with Google Drive.
 */
export async function handleInitiateUpload(
  body: any,
  res: ServerResponse
): Promise<void> {
  const { filename, fileSize, mimeType, lessonId, courseId, moduleId } = body;

  if (!filename || !fileSize || !lessonId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing required parameters: filename, fileSize, lessonId.' }));
    return;
  }

  // Validate supported video format
  const validMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg'];
  const ext = filename.split('.').pop()?.toLowerCase();
  const validExts = ['mp4', 'webm', 'mov', 'mkv', 'ogg'];

  if (!validMimes.includes(mimeType) && (!ext || !validExts.includes(ext))) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Unsupported video format. Allowed: MP4, WebM, MOV, MKV.' }));
    return;
  }

  const { accessToken, folderId } = await getValidDriveAccessToken();

  // Create clean internal filename: cakexperiment-course-lesson-[timestamp].[ext]
  const cleanExt = ext || 'mp4';
  const internalFilename = `cakexperiment-${lessonId}-${Date.now()}.${cleanExt}`;

  // Initiate resumable upload with Google Drive API
  const metadata = {
    name: internalFilename,
    parents: folderId ? [folderId] : undefined,
    description: `Cakexperiment Lesson Video | Original: ${filename}`
  };

  const initRes = await fetch(`${GOOGLE_UPLOAD_API}/files?uploadType=resumable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType || 'video/mp4',
      'X-Upload-Content-Length': String(fileSize)
    },
    body: JSON.stringify(metadata)
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Google Drive resumable upload session creation failed: ${errText}`);
  }

  const resumableUrl = initRes.headers.get('location');
  if (!resumableUrl) {
    throw new Error('Google Drive did not return a resumable upload location header.');
  }

  const sessionToken = crypto.randomBytes(24).toString('hex');
  activeUploadSessions.set(sessionToken, {
    resumableUrl,
    lessonId,
    courseId: courseId || '',
    moduleId: moduleId || '',
    filename,
    fileSize: Number(fileSize),
    mimeType: mimeType || 'video/mp4',
    createdAt: Date.now()
  });

  res.statusCode = 200;
  res.end(JSON.stringify({
    success: true,
    uploadSessionId: sessionToken,
    chunkSizeRecommended: 2 * 1024 * 1024 // 2 MB chunks (safe for Vercel serverless 4.5 MB payload limit)
  }));
}

/**
 * POST /api/admin/videos/upload-chunk
 * Receives a 2 MB chunk from the admin dashboard and streams it to the private Google Drive resumable session.
 * Query: ?sessionId=...&start=...&end=...&total=...
 */
export async function handleUploadChunk(
  req: IncomingMessage,
  res: ServerResponse,
  parsedUrl: URL
): Promise<void> {
  const sessionId = parsedUrl.searchParams.get('sessionId');
  const start = parseInt(parsedUrl.searchParams.get('start') || '0', 10);
  const end = parseInt(parsedUrl.searchParams.get('end') || '0', 10);
  const total = parseInt(parsedUrl.searchParams.get('total') || '0', 10);

  if (!sessionId || !activeUploadSessions.has(sessionId)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Upload session not found or expired. Please retry.' }));
    return;
  }

  const session = activeUploadSessions.get(sessionId)!;

  // Read binary chunk from incoming request
  const chunks: Buffer[] = [];
  req.on('data', c => chunks.push(Buffer.from(c)));

  await new Promise<void>((resolve, reject) => {
    req.on('end', resolve);
    req.on('error', reject);
  });

  const chunkBuffer = Buffer.concat(chunks);

  // Forward chunk to Google Drive Resumable Upload URL
  const driveRes = await fetch(session.resumableUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(chunkBuffer.length),
      'Content-Range': `bytes ${start}-${end}/${total}`
    },
    body: chunkBuffer
  });

  // Google Drive returns 308 Resume Incomplete while chunks remain
  if (driveRes.status === 308) {
    const rangeHeader = driveRes.headers.get('range');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'in_progress',
      range: rangeHeader,
      bytesUploaded: end + 1,
      totalBytes: total,
      progressPercent: Math.round(((end + 1) / total) * 100)
    }));
    return;
  }

  // Google Drive returns 200 or 201 when upload is complete!
  if (driveRes.status === 200 || driveRes.status === 201) {
    const fileData = (await driveRes.json()) as { id: string; name: string; size?: string };
    const driveFileId = fileData.id;

    // Save metadata in Neon PostgreSQL database
    const sql = getDb();
    const streamReference = `/api/videos/stream/${session.lessonId}`;

    await sql`
      UPDATE lessons
      SET drive_file_id = ${driveFileId},
          video_filename = ${session.filename},
          video_size = ${session.fileSize},
          video_mime = ${session.mimeType},
          video_reference = ${streamReference},
          video_uploaded_at = NOW()
      WHERE id = ${session.lessonId};
    `;

    // Clean up active session
    activeUploadSessions.delete(sessionId);

    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'complete',
      success: true,
      lessonId: session.lessonId,
      videoReference: streamReference,
      filename: session.filename,
      size: session.fileSize,
      message: 'Video successfully uploaded and configured in Google Drive.'
    }));
    return;
  }

  // Failure
  const errText = await driveRes.text();
  res.statusCode = 502;
  res.end(JSON.stringify({
    error: `Google Drive rejected chunk (${driveRes.status}): ${errText}`
  }));
}

/**
 * DELETE /api/admin/videos/:lessonId
 * Removes the video from the lesson in Neon DB and optionally trashes it in Google Drive.
 */
export async function handleDeleteVideo(
  lessonId: string,
  res: ServerResponse
): Promise<void> {
  const sql = getDb();
  const rows = await sql`SELECT drive_file_id FROM lessons WHERE id = ${lessonId};`;

  if (rows.length === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Lesson not found' }));
    return;
  }

  const driveFileId = rows[0].drive_file_id;

  // Clear video metadata in DB
  await sql`
    UPDATE lessons
    SET drive_file_id = NULL,
        video_filename = NULL,
        video_size = NULL,
        video_mime = NULL,
        video_reference = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    WHERE id = ${lessonId};
  `;

  // Best-effort trash in Google Drive
  if (driveFileId) {
    try {
      const { accessToken } = await getValidDriveAccessToken();
      await fetch(`${GOOGLE_DRIVE_API}/files/${driveFileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (e) {
      console.warn('Could not delete file from Google Drive:', e);
    }
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, message: 'Video reference removed successfully.' }));
}

/**
 * GET /api/videos/stream/:lessonId
 * High-performance, authenticated video streaming endpoint.
 * Supports HTTP 206 Partial Content and Range headers for fast seeking, scrubbing, pause & resume.
 */
export async function handleVideoStream(
  req: IncomingMessage,
  res: ServerResponse,
  lessonId: string,
  getAuthenticatedUser: (req: IncomingMessage) => Promise<AuthenticatedSession | null>
): Promise<void> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, course_id, title, is_preview, video_reference, drive_file_id, video_mime, video_size
    FROM lessons
    WHERE id = ${lessonId};
  `;

  if (rows.length === 0) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Lesson video not found.' }));
    return;
  }

  const lesson = rows[0];

  // Access validation:
  // 1. If is_preview is true, allow all visitors
  // 2. Otherwise verify user is authenticated and is ADMIN or enrolled in course
  if (!lesson.is_preview) {
    const session = await getAuthenticatedUser(req);
    if (!session) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Authentication required to watch this masterclass video.' }));
      return;
    }

    if (session.role !== 'ADMIN') {
      const enrollments = await sql`
        SELECT id FROM enrollments
        WHERE user_id = ${session.userId} AND course_id = ${lesson.course_id} AND status = 'ACTIVE';
      `;
      if (enrollments.length === 0) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'You are not enrolled in this masterclass.' }));
        return;
      }
    }
  }

  // If no drive_file_id exists, fall back to external video_reference (e.g. demo video)
  if (!lesson.drive_file_id) {
    const fallbackUrl = lesson.video_reference || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    res.statusCode = 302;
    res.setHeader('Location', fallbackUrl);
    res.end();
    return;
  }

  // Stream directly from private Google Drive using server-side access token
  const { accessToken } = await getValidDriveAccessToken();
  const driveFileUrl = `${GOOGLE_DRIVE_API}/files/${lesson.drive_file_id}?alt=media`;

  const driveHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`
  };

  // Propagate incoming Range request (e.g. bytes=1000-5000000) for seamless seeking
  const clientRange = req.headers.range;
  if (clientRange) {
    driveHeaders['Range'] = clientRange;
  }

  const driveReq = https.request(driveFileUrl, {
    method: 'GET',
    headers: driveHeaders
  }, (driveRes) => {
    // Forward status code (200 OK or 206 Partial Content)
    res.statusCode = driveRes.statusCode || 200;

    // Set streaming headers
    res.setHeader('Content-Type', driveRes.headers['content-type'] || lesson.video_mime || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    if (driveRes.headers['content-range']) {
      res.setHeader('Content-Range', driveRes.headers['content-range']);
    }
    if (driveRes.headers['content-length']) {
      res.setHeader('Content-Length', driveRes.headers['content-length']);
    }

    // Pipe audio/video chunks straight into HTML5 video player
    driveRes.pipe(res);
  });

  driveReq.on('error', (err) => {
    console.error('Error streaming video from Google Drive:', err);
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to stream video from storage server.' }));
    }
  });

  driveReq.end();
}
