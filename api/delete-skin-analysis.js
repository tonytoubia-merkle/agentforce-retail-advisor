// Vercel Serverless Function — delete a single Skin_Analysis record from Data Cloud
// Uses composite primary key: email + analysis_date

const SF_INSTANCE   = process.env.VITE_AGENTFORCE_INSTANCE_URL || 'https://me1769724439764.my.salesforce.com';
const CLIENT_ID     = process.env.VITE_AGENTFORCE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_AGENTFORCE_CLIENT_SECRET;
const SOURCE_API    = process.env.VITE_DC_SOURCE_API_NAME || 'SkinAdvisor';
const OBJECT_NAME   = process.env.VITE_DC_OBJECT_NAME    || 'Skin_Analysis';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(`${SF_INSTANCE}/services/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope:         'cdp_ingest_api',
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token failed (${res.status}): ${await res.text()}`);
  const { access_token, expires_in } = await res.json();
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in ? expires_in * 1000 : 7200_000) - 300_000;
  return cachedToken;
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const { email, analysis_date } = req.body ?? {};
  if (!email || !analysis_date) {
    return res.status(400).json({ error: 'email and analysis_date are required' });
  }

  try {
    const token = await getToken();

    const r = await fetch(
      `${SF_INSTANCE}/api/v1/ingest/sources/${SOURCE_API}/${OBJECT_NAME}`,
      {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ data: [{ email, analysis_date }] }),
      },
    );

    if (!r.ok) {
      const text = await r.text();
      console.error('[delete-skin-analysis] error:', r.status, text);
      return res.status(502).json({ error: 'DC delete failed', detail: text });
    }

    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('[delete-skin-analysis] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
