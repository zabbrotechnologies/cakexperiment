export default async function handler(req, res) {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    const url = new URL(req.url || '', 'http://localhost');
    const qPath = url.searchParams.get('path');

    // Root /api healthcheck
    if (!qPath && (url.pathname === '/api' || url.pathname === '/api/')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'ok',
          runtime: 'Vercel Node.js Serverless',
          hasDbUrl: !!process.env.DATABASE_URL,
          time: new Date().toISOString()
        })
      );
      return;
    }

    // Lazy load the full API engine
    const { handleNeonApi } = await import('./neonApiBundle.js');
    await handleNeonApi(req, res);
  } catch (err) {
    console.error('API Error in Vercel handler:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'SERVERLESS_HANDLER_EXCEPTION',
        message: err?.message || String(err),
        stack: err?.stack,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeVersion: process.version
      })
    );
  }
}
