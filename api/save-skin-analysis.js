// Vercel Serverless Function — save skin analysis results to Data Cloud Ingestion API
// Auth: two-step token exchange via dc-token.js — SF client_credentials → DC JWT + tenant URL

import { getDcToken } from './dc-token.js';

const SOURCE_API  = process.env.VITE_DC_SOURCE_API_NAME;   // set in Vercel env + .env.local
const OBJECT_NAME = process.env.VITE_DC_OBJECT_NAME || 'Skin_Analysis';

/** Flatten SkinAnalysisResult into a DC-friendly flat record. */
function buildRecord(email, analysisResult, crmContactId) {
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
    console.error('[save-skin-analysis] VITE_DC_SOURCE_API_NAME is not set');
    return res.status(500).json({ error: 'VITE_DC_SOURCE_API_NAME env var is not configured on this server' });
  }

  try {
    const { access_token, instance_url: dcInstance } = await getDcToken();

    const record  = buildRecord(email, analysisResult, crmContactId);
    const ingestUrl = `${dcInstance}/api/v1/ingest/sources/${SOURCE_API}/${OBJECT_NAME}`;
    console.log('[save-skin-analysis] POST', ingestUrl);

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
      return res.status(502).json({ error: 'Data Cloud ingest failed', status: ingestRes.status, detail: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[save-skin-analysis] unexpected error:', err);
    return res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0,3).join(' | ') });
  }
}
