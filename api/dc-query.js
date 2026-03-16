// Vercel Serverless Function — execute a Data Cloud SQL query
// Data Cloud uses a separate SQL API (ssot/queryRunResults) distinct from CRM SOQL.
// Auth: same Salesforce client credentials — token reused from warm instance cache.

const SF_INSTANCE   = process.env.VITE_AGENTFORCE_INSTANCE_URL || 'https://me1769724439764.my.salesforce.com';
const CLIENT_ID     = process.env.VITE_AGENTFORCE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_AGENTFORCE_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(`${SF_INSTANCE}/services/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }).toString(),
  });
  if (!res.ok) { const t = await res.text(); console.error('[dc-query] token error:', res.status, t); throw new Error(`Token failed (${res.status}): ${t}`); }
  const { access_token, expires_in } = await res.json();
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in ? expires_in * 1000 : 7200_000) - 300_000;
  return cachedToken;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sql } = req.body ?? {};
  if (!sql) return res.status(400).json({ error: 'sql is required' });

  try {
    const token = await getToken();

    // Data Cloud SQL query API — synchronous for simple queries
    const r = await fetch(`${SF_INSTANCE}/services/data/v60.0/ssot/queryRunResults`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sql }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('[dc-query] error:', r.status, text);
      return res.status(502).json({ error: 'DC query failed', detail: text });
    }

    const result = await r.json();

    // If async (done: false), poll once — simple queries should resolve immediately
    if (!result.done && result.queryStatusUrl) {
      const pollUrl = result.queryStatusUrl.replace(/^.*\/services/, '/services');
      const poll = await fetch(`${SF_INSTANCE}${pollUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (poll.ok) return res.status(200).json(await poll.json());
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[dc-query] unexpected error:', err);
    return res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0,3).join(' | ') });
  }
}
