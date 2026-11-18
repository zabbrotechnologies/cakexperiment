import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { getDb } from './neonDb.ts';
import { dispatchEmailAsync, generateWelcomeEmail } from './emailService.ts';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Minimum identity scopes required - NO Drive or external storage permissions
const GOOGLE_SCOPES = ['openid', 'email', 'profile'].join(' ');

function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

function sanitizeRedirectPath(target: string | null | undefined): string {
  if (!target || typeof target !== 'string') return '/learn';
  const trimmed = target.trim();
  // Ensure relative path starting with / and not protocol-relative //
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/learn';
}

/**
 * Dynamically resolves the OAuth redirect URI matching Google Cloud Console config:
 * - Local: http://localhost:5173/api/auth/callback/google
 * - Production: https://thecakexperiment.com/api/auth/callback/google
 */
export function getGoogleOAuthRedirectUri(req: IncomingMessage): string {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:5173/api/auth/callback/google';
  }
  if (host.includes('thecakexperiment.com')) {
    return 'https://thecakexperiment.com/api/auth/callback/google';
  }
  const appBase = process.env.APP_BASE_URL || 'https://thecakexperiment.com';
  return `${appBase.replace(/\/$/, '')}/api/auth/callback/google`;
}

/**
 * Creates an HMAC-signed state payload containing a nonce, destination path, and timestamp.
 */
function createOAuthState(redirectPath: string, secret: string): { state: string; nonce: string } {
  const nonce = crypto.randomBytes(24).toString('hex');
  const payload = JSON.stringify({
    n: nonce,
    r: sanitizeRedirectPath(redirectPath),
    t: Date.now()
  });
  const b64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(b64Payload).digest('base64url');
  return {
    state: `${b64Payload}.${signature}`,
    nonce
  };
}

/**
 * Validates HMAC signature, expiry (10 min), and matching nonce cookie.
 */
function verifyOAuthState(
  stateStr: string,
  secret: string,
  cookieNonce?: string | null
): { valid: boolean; redirect: string; reason?: string } {
  if (!stateStr || typeof stateStr !== 'string') {
    return { valid: false, redirect: '/learn', reason: 'Missing state parameter' };
  }
  const parts = stateStr.split('.');
  if (parts.length !== 2) {
    return { valid: false, redirect: '/learn', reason: 'Invalid state format' };
  }
  const [b64Payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(b64Payload).digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, redirect: '/learn', reason: 'State signature verification failed' };
    }

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    const { n, r, t } = payload;

    // Check expiration (max 10 minutes, no clock skew > 60s into future)
    const now = Date.now();
    if (typeof t !== 'number' || now - t > 10 * 60 * 1000 || t - now > 60 * 1000) {
      return { valid: false, redirect: '/learn', reason: 'State expired. Please restart sign-in.' };
    }

    // Check cookie nonce if present (CSRF defense)
    if (cookieNonce && cookieNonce !== n) {
      return { valid: false, redirect: '/learn', reason: 'OAuth session mismatch. Possible CSRF detected.' };
    }

    return { valid: true, redirect: sanitizeRedirectPath(r) };
  } catch {
    return { valid: false, redirect: '/learn', reason: 'Failed parsing state payload' };
  }
}

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Exchanges the Google authorization code for an ID token and access token.
 */
async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token exchange error (${res.status}): ${errText}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

/**
 * Fetches user profile info from Google OAuth2 UserInfo endpoint.
 */
async function fetchGoogleProfile(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google userinfo error (${res.status}): ${errText}`);
  }

  return (await res.json()) as GoogleUserInfo;
}

/**
 * Parses and verifies basic claims of the Google ID Token.
 */
function verifyGoogleIdToken(idToken: string, clientId: string) {
  if (!idToken || typeof idToken !== 'string') return null;
  const parts = idToken.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);

    // Validate Issuer
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      console.warn('ID token invalid issuer:', payload.iss);
      return null;
    }

    // Validate Audience
    if (payload.aud !== clientId) {
      console.warn('ID token audience mismatch:', payload.aud);
      return null;
    }

    // Validate Expiration (with 30-second grace window)
    if (typeof payload.exp === 'number' && payload.exp < nowSec - 30) {
      console.warn('ID token expired:', payload.exp);
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Handler for GET /api/auth/google
 * Initiates the Google OAuth 2.0 flow
 */
export async function handleGoogleAuth(
  rawUrl: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Google OAuth credentials are not configured on the server.' }));
    return;
  }

  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const redirectTarget = parsedUrl.searchParams.get('redirect') || '/learn';
  const redirectUri = getGoogleOAuthRedirectUri(req);

  const { state, nonce } = createOAuthState(redirectTarget, clientSecret);

  const isProduction = process.env.NODE_ENV === 'production' || (req.headers.host && !req.headers.host.includes('localhost'));
  const cookieFlags = isProduction ? '; Secure' : '';

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GOOGLE_SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  res.statusCode = 302;
  res.setHeader('Location', authUrl.toString());
  res.setHeader(
    'Set-Cookie',
    `cakexperiment_oauth_state=${nonce}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600${cookieFlags}`
  );
  res.end();
}

/**
 * Handler for GET /api/auth/callback/google
 * Processes the authorization code callback, validates tokens, updates DB, creates session.
 */
export async function handleGoogleCallback(
  rawUrl: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.statusCode = 302;
    res.setHeader('Location', '/signin?error=server_error&message=Google+OAuth+not+configured+on+server');
    res.end();
    return;
  }

  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const code = parsedUrl.searchParams.get('code');
  const state = parsedUrl.searchParams.get('state');
  const error = parsedUrl.searchParams.get('error');
  const errorDescription = parsedUrl.searchParams.get('error_description');

  // Handle user cancelled or denied access
  if (error) {
    const errorMsg = errorDescription || error || 'Google sign-in was cancelled';
    res.statusCode = 302;
    res.setHeader('Location', `/signin?error=oauth_cancelled&message=${encodeURIComponent(errorMsg)}`);
    res.end();
    return;
  }

  if (!code || !state) {
    res.statusCode = 302;
    res.setHeader('Location', '/signin?error=invalid_request&message=Missing+authorization+code+or+state');
    res.end();
    return;
  }

  // Verify State & CSRF Cookie
  const cookies = parseCookies(req);
  const cookieNonce = cookies['cakexperiment_oauth_state'];
  const stateValidation = verifyOAuthState(state, clientSecret, cookieNonce);

  if (!stateValidation.valid) {
    console.warn('OAuth state verification failed:', stateValidation.reason);
    res.statusCode = 302;
    res.setHeader(
      'Location',
      `/signin?error=invalid_state&message=${encodeURIComponent(stateValidation.reason || 'Security verification failed')}`
    );
    res.end();
    return;
  }

  const redirectUri = getGoogleOAuthRedirectUri(req);

  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeGoogleCode(code, redirectUri, clientId, clientSecret);

    // 2. Verify Google ID token claims
    const idClaims = verifyGoogleIdToken(tokens.id_token, clientId);
    if (!idClaims) {
      throw new Error('Google ID token verification failed (issuer, audience, or expiry mismatch).');
    }

    // 3. Fetch Google user profile info
    const profile = await fetchGoogleProfile(tokens.access_token);

    // 4. Validate user identity and verified email
    const googleSub = String(profile.sub || idClaims.sub || '').trim();
    const email = String(profile.email || idClaims.email || '').trim().toLowerCase();
    const emailVerified = Boolean(profile.email_verified ?? idClaims.email_verified);
    const name = String(profile.name || idClaims.name || email.split('@')[0] || 'Cakexperiment Baker').trim();
    const picture = profile.picture || idClaims.picture || '';

    if (!googleSub) {
      throw new Error('Missing immutable Google subject identifier (sub).');
    }
    if (!email) {
      throw new Error('No email address provided by Google account.');
    }
    if (!emailVerified) {
      res.statusCode = 302;
      res.setHeader('Location', '/signin?error=unverified_email&message=Your+Google+email+is+not+verified+by+Google');
      res.end();
      return;
    }

    // 5. Database lookup & User creation / Linking
    const sql = getDb();

    // Check by google_id first
    let userRow: any = null;
    const existingByGoogle = await sql`
      SELECT id, name, email, role, status, google_id
      FROM users
      WHERE google_id = ${googleSub};
    `;

    if (existingByGoogle.length > 0) {
      userRow = existingByGoogle[0];
      // Sync verified email if changed
      if (userRow.email.toLowerCase() !== email) {
        await sql`UPDATE users SET email = ${email}, updated_at = NOW() WHERE id = ${userRow.id};`;
        userRow.email = email;
      }
    } else {
      // Check by email (Account Linking)
      const existingByEmail = await sql`
        SELECT id, name, email, role, status, google_id
        FROM users
        WHERE LOWER(email) = LOWER(${email});
      `;

      if (existingByEmail.length > 0) {
        userRow = existingByEmail[0];

        // Ensure this email isn't already claimed by another distinct Google ID
        if (userRow.google_id && userRow.google_id !== googleSub) {
          res.statusCode = 302;
          res.setHeader(
            'Location',
            '/signin?error=account_conflict&message=This+email+is+already+linked+to+a+different+Google+account.'
          );
          res.end();
          return;
        }

        // Link existing account to Google sub
        await sql`
          UPDATE users
          SET google_id = ${googleSub},
              email_verified = TRUE,
              updated_at = NOW()
          WHERE id = ${userRow.id};
        `;
      } else {
        // Create brand-new student account
        const newUserId = 'usr_' + crypto.randomBytes(12).toString('hex');
        await sql`
          INSERT INTO users (id, name, email, google_id, auth_provider, role, status, email_verified, created_at, updated_at)
          VALUES (${newUserId}, ${name}, ${email}, ${googleSub}, 'google', 'USER', 'active', TRUE, NOW(), NOW());
        `;

        await sql`
          INSERT INTO user_profiles (user_id, avatar, bio)
          VALUES (${newUserId}, ${picture || ''}, 'Enthusiastic baker learning with Cakexperiment.')
          ON CONFLICT (user_id) DO UPDATE SET avatar = COALESCE(NULLIF(user_profiles.avatar, ''), EXCLUDED.avatar);
        `;

        userRow = {
          id: newUserId,
          name,
          email,
          role: 'USER',
          status: 'active'
        };

        // Send welcome email to new student
        await dispatchEmailAsync(generateWelcomeEmail(email, name));
      }
    }

    // Check account status
    if (userRow.status && userRow.status !== 'active') {
      res.statusCode = 302;
      res.setHeader('Location', '/signin?error=account_disabled&message=Your+account+has+been+deactivated.');
      res.end();
      return;
    }

    // Update avatar if available and currently empty
    if (picture) {
      try {
        await sql`
          UPDATE user_profiles
          SET avatar = ${picture}
          WHERE user_id = ${userRow.id} AND (avatar IS NULL OR avatar = '');
        `;
      } catch (e) {
        console.warn('Could not update avatar for user:', e);
      }
    }

    // 6. Create authenticated session in sessions table
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO sessions (id, user_id, role, expires_at)
      VALUES (${sessionToken}, ${userRow.id}, ${userRow.role}, ${expiresAt.toISOString()});
    `;

    // 7. Determine clean redirect destination
    let finalTarget = stateValidation.redirect || (userRow.role === 'ADMIN' ? '/admin/dashboard' : '/learn');
    // Guard against regular user landing in admin pages
    if (userRow.role !== 'ADMIN' && finalTarget.startsWith('/admin')) {
      finalTarget = '/learn';
    }

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      (req.headers.host && !req.headers.host.includes('localhost'));
    const secureFlag = isProduction ? '; Secure' : '';

    // Set session cookie & clear oauth state cookie
    res.statusCode = 302;
    res.setHeader('Set-Cookie', [
      `cakexperiment_session=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}${secureFlag}`,
      `cakexperiment_oauth_state=; HttpOnly; Path=/; Max-Age=0`
    ]);

    // Append token query param as client-side fallback
    const sep = finalTarget.includes('?') ? '&' : '?';
    res.setHeader('Location', `${finalTarget}${sep}token=${sessionToken}&auth=google`);
    res.end();
  } catch (err: any) {
    console.error('Google OAuth callback processing error:', err);
    res.statusCode = 302;
    res.setHeader(
      'Location',
      `/signin?error=oauth_error&message=${encodeURIComponent(err.message || 'Google authentication failed')}`
    );
    res.end();
  }
}
