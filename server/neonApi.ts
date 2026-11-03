import type { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';

dotenv.config({ path: '.env.local' });

function getSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in environment or .env.local');
  }
  return neon(dbUrl);
}

function getS3() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-2';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Neon Object Storage credentials not fully configured');
  }

  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

export function handleNeonApi(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || '';

  if (!url.startsWith('/api/neon')) {
    return next();
  }

  res.setHeader('Content-Type', 'application/json');

  // Route 1: Status & Health
  if (url === '/api/neon/status' && req.method === 'GET') {
    handleStatus(res);
    return;
  }

  // Route 2: Query Postgres
  if (url === '/api/neon/query' && req.method === 'POST') {
    handleQuery(req, res);
    return;
  }

  // Route 3: List Storage Assets
  if (url.startsWith('/api/neon/storage/list') && req.method === 'GET') {
    handleListStorage(url, res);
    return;
  }

  // Route 4: Upload Asset
  if (url === '/api/neon/storage/upload' && req.method === 'POST') {
    handleUpload(req, res);
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}

async function handleStatus(res: ServerResponse) {
  const startTime = Date.now();
  let dbOk = false;
  let dbInfo: any = {};
  let storageOk = false;
  let storageInfo: any = {};

  // Check Postgres
  try {
    const sql = getSql();
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

  // Check Object Storage
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
  res.end(JSON.stringify({
    connected: dbOk && storageOk,
    branch: process.env.NEON_BRANCH || 'production',
    database: dbInfo,
    objectStorage: storageInfo
  }));
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

      const sql = getSql();
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

    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix
    }));

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

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: req.headers['content-type'] || 'application/octet-stream'
      }));

      // Also record metadata in Postgres
      try {
        const sql = getSql();
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
      res.end(JSON.stringify({
        success: true,
        key,
        size: buffer.length,
        url: `${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${key}`
      }));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
