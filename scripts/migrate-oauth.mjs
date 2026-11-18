import dotenv from 'dotenv';
import https from 'https';
import { neon, neonConfig } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const CANDIDATE_IPS = {
  'api.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'ep-silent-union-bdr8bzds-pooler.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'ep-silent-union-bdr8bzds.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241']
};

function tryFetch(url, targetIp, opts) {
  const hostname = url.hostname;
  const headers = {
    ...(opts.headers || {}),
    Host: url.host
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: targetIp,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: opts.method || 'POST',
        headers,
        servername: hostname,
        timeout: 6000
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            status: res.statusCode || 500,
            statusText: res.statusMessage || '',
            headers: new Headers(res.headers),
            json: async () => JSON.parse(bodyText),
            text: async () => bodyText
          });
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error(`Timeout connecting to ${targetIp}`)));
    req.on('error', reject);
    if (opts.body) {
      req.write(opts.body);
    }
    req.end();
  });
}

neonConfig.fetchFunction = async (urlStr, opts = {}) => {
  const url = new URL(urlStr);
  const hostname = url.hostname;
  const ips = CANDIDATE_IPS[hostname] || [hostname];

  let lastErr;
  for (const ip of ips) {
    try {
      return await tryFetch(url, ip, opts);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`Failed connecting to ${hostname}`);
};

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('--- Migrating Neon DB for Google OAuth 2.0 ---');

  // Check columns on users table
  const existingCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users';
  `;
  console.log('Existing columns on users table:');
  console.log(existingCols.map(c => `${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`).join(', '));

  // 1. Add google_id column if not exists
  console.log('Adding google_id column...');
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128);`;

  // 2. Add auth_provider column if not exists
  console.log('Adding auth_provider column...');
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) DEFAULT 'email';`;

  // 3. Make password_hash nullable for OAuth-only users
  console.log('Allowing nullable password_hash...');
  await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`;

  // 4. Create unique index on google_id where google_id is not null
  console.log('Creating unique index on google_id...');
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;`;

  // 5. Ensure user_profiles has avatar
  console.log('Ensuring user_profiles avatar column...');
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar TEXT;`;

  console.log('Migration complete!');
}

migrate().catch(console.error);
