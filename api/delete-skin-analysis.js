// Vercel Serverless Function — delete a single Skin_Analysis record from Data Cloud
// Uses composite primary key: email + analysis_date
// Auth: two-step token exchange via dc-token.js — SF client_credentials → DC JWT + tenant URL

import { getDcToken } from './dc-token.js';

const SOURCE_API  = process.env.VITE_DC_SOURCE_API_NAME || 'SkinAdvisor';
const OBJECT_NAME = process.env.VITE_DC_OBJECT_NAME    || 'Skin_Analysis';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const { email, analysis_date } = req.body ?? {};
  if (!email || !analysis_date) {
    return res.status(400).json({ error: 'email and analysis_date are required' });
  }

  try {
    const { access_token: token, instance_url: dcInstance } = await getDcToken();

    const r = await fetch(
      `${dcInstance}/api/v1/ingest/sources/${SOURCE_API}/${OBJECT_NAME}`,
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
