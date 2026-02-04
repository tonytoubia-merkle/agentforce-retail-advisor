/**
 * Seed Salesforce Product2 with beauty product catalog.
 *
 * Usage:
 *   node scripts/seed-products.js
 *
 * Prerequisites:
 *   - The Express proxy server must be running (npm run dev)
 *   - .env.local must have valid VITE_AGENTFORCE_CLIENT_ID / SECRET / INSTANCE_URL
 *
 * This script will:
 *   1. Load products from data/Product2.json
 *   2. Check which products already exist (by Name)
 *   3. Create new products that don't exist
 *   4. Optionally update existing products
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:3001';

// ─── Load env ───────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  } catch { /* .env.local not found */ }
  return env;
}

const env = loadEnv();

// ─── OAuth ──────────────────────────────────────────────────────
async function getAccessToken() {
  const clientId = env.VITE_AGENTFORCE_CLIENT_ID;
  const clientSecret = env.VITE_AGENTFORCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing VITE_AGENTFORCE_CLIENT_ID or SECRET in .env.local');

  const res = await fetch(`${API_BASE}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) throw new Error(`OAuth failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

// ─── Salesforce REST helpers ────────────────────────────────────
async function sfCreate(token, sobject, fields) {
  const res = await fetch(`${API_BASE}/api/datacloud/sobjects/${sobject}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const text = await res.text();
  if (!res.ok) {
    // Check if it's a duplicate error
    if (text.includes('DUPLICATE_VALUE')) {
      return { duplicate: true };
    }
    console.error(`  ✗ Create ${sobject} failed (${res.status}): ${text}`);
    return null;
  }
  const result = JSON.parse(text);
  return { id: result.id };
}

async function sfUpdate(token, sobject, id, fields) {
  const res = await fetch(`${API_BASE}/api/datacloud/sobjects/${sobject}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    console.error(`  ✗ Update ${sobject}/${id} failed (${res.status}): ${text}`);
    return false;
  }
  return true;
}

async function sfQuery(token, soql) {
  const res = await fetch(`${API_BASE}/api/datacloud/query?q=${encodeURIComponent(soql)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    console.error(`  ✗ Query failed (${res.status}): ${await res.text()}`);
    return { records: [] };
  }
  return res.json();
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Authenticating with Salesforce...');
  const token = await getAccessToken();
  console.log('  ✓ Token acquired\n');

  // Load product data
  console.log('📦 Loading product catalog from data/Product2.json...');
  const productData = JSON.parse(readFileSync(resolve(__dirname, '..', 'data', 'Product2.json'), 'utf-8'));
  const products = productData.records;
  console.log(`  Found ${products.length} products to seed\n`);

  // Get existing products
  console.log('🔍 Checking existing products in Salesforce...');
  const existingData = await sfQuery(token, "SELECT Id, Name FROM Product2");
  const existingMap = {};
  for (const r of existingData.records || []) {
    existingMap[r.Name] = r.Id;
  }
  console.log(`  Found ${Object.keys(existingMap).length} existing products\n`);

  // Seed products
  let created = 0;
  let skipped = 0;
  let updated = 0;
  let failed = 0;

  console.log('🌱 Seeding products...\n');

  for (const product of products) {
    const { attributes, ...fields } = product;
    const name = fields.Name;

    if (existingMap[name]) {
      // Product exists - update it
      const success = await sfUpdate(token, 'Product2', existingMap[name], fields);
      if (success) {
        console.log(`  ↻ Updated: ${name}`);
        updated++;
      } else {
        failed++;
      }
    } else {
      // Product doesn't exist - create it
      const result = await sfCreate(token, 'Product2', fields);
      if (result?.id) {
        console.log(`  ✓ Created: ${name}`);
        created++;
      } else if (result?.duplicate) {
        console.log(`  ⊘ Skipped (duplicate): ${name}`);
        skipped++;
      } else {
        failed++;
      }
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log('📊 Summary');
  console.log('══════════════════════════════════════');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Total:   ${products.length}`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
