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

async function run() {
  console.log('--- Migrating Neon Database for Google Drive Video Storage ---');

  // 1. Create google_drive_storage table
  console.log('Ensuring table: google_drive_storage...');
  await sql`
    CREATE TABLE IF NOT EXISTS google_drive_storage (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
      connected_email VARCHAR(255),
      refresh_token TEXT,
      access_token TEXT,
      token_expiry TIMESTAMP WITH TIME ZONE,
      folder_id VARCHAR(128),
      folder_name VARCHAR(255) DEFAULT 'Cakexperiment Masterclass Videos',
      storage_quota_used BIGINT DEFAULT 0,
      storage_quota_total BIGINT DEFAULT 16106127360, -- 15 GB default
      is_connected BOOLEAN DEFAULT FALSE,
      last_verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Ensure default row exists
  await sql`
    INSERT INTO google_drive_storage (id, is_connected)
    VALUES ('default', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `;

  // 2. Add video metadata columns to lessons table
  console.log('Adding video metadata columns to lessons table...');
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(128);`;
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_filename VARCHAR(255);`;
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_size BIGINT;`;
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_mime VARCHAR(64);`;
  await sql`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMP WITH TIME ZONE;`;

  // 3. Index on drive_file_id
  await sql`CREATE INDEX IF NOT EXISTS idx_lessons_drive_file_id ON lessons (drive_file_id);`;

  console.log('Migration completed successfully!');
}

run().catch(console.error);
