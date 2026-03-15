// Vercel Serverless Function — save skin analysis results to Data Cloud Ingestion API
// Auth: Salesforce client credentials with cdp_ingest_api scope
// The token response instance_url is the Data Cloud tenant base URL.

const SF_INSTANCE    = process.env.VITE_AGENTFORCE_INSTANCE_URL || 'https://me1769724439764.my.salesforce.com';
const CLIENT_ID      = process.env.VITE_AGENTFORCE_CLIENT_ID;
const CLIENT_SECRET  = process.env.VITE_AGENTFORCE_CLIENT_SECRET;
const SOURCE_API     = process.env.VITE_DC_SOURCE_API_NAME;   // set in Vercel env + .env.local
const OBJECT_NAME    = process.env.VITE_DC_OBJECT_NAME || 'Skin_Analysis';

/** Fetch a Data Cloud access token using client credentials. */
async function getDcToken() {
  const params = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope:         'cdp_ingest_api',
  });

  const res = await fetch(`${SF_INSTANCE}/services/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DC token request failed (${res.status}): ${text}`);
  }

  const { access_token, instance_url } = await res.json();
  return { access_token, instance_url };
}

/** Flatten SkinAnalysisResult into a DC-friendly flat record. */
function buildRecord(email, analysisResult) {
  const record = {
    email,
    ...(crmContactId && { crm_contact_id: crmContactId }),
    analysis_date:   analysisResult.analyzedAt,
    overall_score:   analysisResult.overallScore,
    skin_age:        analysisResult.skinAge,
    skin_type:       analysisResult.skinType,
    primary_concern: analysisResult.primaryConcern,
    source:          'web_skin_advisor',
  };

  // Flatten each concern into {name}_score / {name}_severity
  if (Array.isArray(analysisResult.concerns)) {
    for (const c of analysisResult.concerns) {
      const key = c.concern.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      record[`${key}_score`]    = c.score;
      record[`${key}_severity`] = c.severity;
    }
  }

  return record;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, analysisResult, crmContactId } = req.body ?? {};

  if (!email || !analysisResult) {
    return res.status(400).json({ error: 'email and analysisResult are required' });
  }

  if (!SOURCE_API) {
    return res.status(500).json({ error: 'VITE_DC_SOURCE_API_NAME is not configured' });
  }

  try {
    const { access_token, instance_url } = await getDcToken();

    const record  = buildRecord(email, analysisResult);
    const ingestUrl = `${instance_url}/api/v1/ingest/sources/${SOURCE_API}/${OBJECT_NAME}`;

    const ingestRes = await fetch(ingestUrl, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [record] }),
    });

    if (!ingestRes.ok) {
      const text = await ingestRes.text();
      console.error('[save-skin-analysis] DC ingest error:', ingestRes.status, text);
      return res.status(502).json({ error: 'Data Cloud ingest failed', detail: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[save-skin-analysis] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
