// Vercel Serverless Function — track retailer click events to Data Cloud Ingestion API
// Auth: two-step token exchange via dc-token.js — SF client_credentials → DC JWT + tenant URL

import { getDcToken } from './dc-token.js';

const SOURCE_API  = process.env.VITE_DC_SOURCE_API_NAME;
const OBJECT_NAME = process.env.VITE_DC_RETAILER_CLICK_OBJECT || 'Retailer_Click';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, retailer, products } = req.body ?? {};

  if (!email || !retailer || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'email, retailer, and products[] are required' });
  }

  if (!SOURCE_API) {
    return res.status(500).json({ error: 'VITE_DC_SOURCE_API_NAME is not configured' });
  }

  try {
    const { access_token, instance_url: dcInstance } = await getDcToken();
    const clickedAt = new Date().toISOString();
    const ingestUrl = `${dcInstance}/api/v1/ingest/sources/${SOURCE_API}/${OBJECT_NAME}`;

    // One event record per product — enables product-level segmentation
    const data = products.map((p) => ({
      email,
      retailer_name:  retailer.name,
      retailer_url:   retailer.url,
      is_online:      retailer.online ?? true,
      is_in_store:    retailer.inStore ?? false,
      product_id:     p.id,
      product_name:   p.name,
      product_brand:  p.brand,
      product_price:  p.price,
      clicked_at:     clickedAt,
      source:         'web_skin_advisor',
    }));

    const ingestRes = await fetch(ingestUrl, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!ingestRes.ok) {
      const text = await ingestRes.text();
      console.error('[track-retailer-click] DC ingest error:', ingestRes.status, text);
      return res.status(502).json({ error: 'Data Cloud ingest failed', detail: text });
    }

    return res.status(200).json({ success: true, eventsWritten: data.length });
  } catch (err) {
    console.error('[track-retailer-click] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
