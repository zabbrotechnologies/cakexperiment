import https from 'https';
import crypto from 'crypto';
import { neon, neonConfig } from '@neondatabase/serverless';

// Fallback IPs for Neon Tech across Anycast edge and AWS Ohio endpoints
const CANDIDATE_IPS: Record<string, string[]> = {
  'api.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'ep-silent-union-bdr8bzds-pooler.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'ep-silent-union-bdr8bzds.c-8.us-east-2.aws.neon.tech': ['77.112.129.102', '3.142.41.151', '3.14.138.241'],
  'br-soft-queen-bdn8ofgg.storage.c-8.us-east-2.aws.neon.tech': ['18.119.63.132', '3.142.41.151']
};

function tryFetch(url: URL, targetIp: string, opts: any): Promise<any> {
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
        servername: hostname, // Preserves TLS SNI & certificate verification
        timeout: 6000
      },
      res => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            status: res.statusCode || 500,
            statusText: res.statusMessage || '',
            headers: new Headers(res.headers as any),
            json: async () => JSON.parse(bodyText),
            text: async () => bodyText
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Timeout connecting to ${targetIp}:443`));
    });
    req.on('error', reject);
    if (opts.body) {
      req.write(opts.body);
    }
    req.end();
  });
}

// Custom resilient fetch with multi-IP failover for Neon serverless queries
neonConfig.fetchFunction = async (urlStr: any, opts: any = {}) => {
  // First attempt native fetch with a 3.5s timeout (optimal for cloud/Vercel environments)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const nativeRes = await fetch(urlStr, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return nativeRes;
  } catch (nativeErr) {
    // If native fetch fails (e.g. local Windows DNS ENOTFOUND), failover to candidate IPs
    const url = new URL(urlStr);
    const hostname = url.hostname;
    const ips = CANDIDATE_IPS[hostname] || [hostname];

    let lastErr: any = nativeErr;
    for (const ip of ips) {
      try {
        const res = await tryFetch(url, ip, opts);
        return res;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error(`Failed to connect to Neon database on ${hostname}`);
  }
};

export const DEFAULT_DATABASE_URL = 'postgresql://neondb_owner:npg_zDSxWUQ3nhd5@ep-silent-union-bdr8bzds-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require';

export function getDb() {
  const dbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return neon(dbUrl);
}

// Secure Password Hashing using Node crypto scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, key] = storedHash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(key, 'hex'));
}

