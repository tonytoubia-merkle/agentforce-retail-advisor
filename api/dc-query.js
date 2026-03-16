// Vercel Serverless Function — execute a Data Cloud SQL query
// Data Cloud uses a separate SQL API (ssot/queryRunResults) distinct from CRM SOQL.
// Auth: two-step token exchange via dc-token.js — SF client_credentials → DC JWT + tenant URL

import { getDcToken } from './dc-token.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sql } = req.body ?? {};
  if (!sql) return res.status(400).json({ error: 'sql is required' });

  try {
    const { access_token: token, instance_url: dcInstance } = await getDcToken();

    // Data Cloud SQL query API — synchronous for simple queries
    const r = await fetch(`${dcInstance}/services/data/v60.0/ssot/queryRunResults`, {
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
      const poll = await fetch(result.queryStatusUrl, {
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
