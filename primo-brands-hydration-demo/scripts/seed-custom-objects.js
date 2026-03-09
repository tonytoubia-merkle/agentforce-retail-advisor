/**
 * Seed ONLY the 4 custom objects for existing demo Contacts.
 *
 * Usage:
 *   node scripts/seed-custom-objects.js
 *
 * Prerequisites:
 *   - The Express proxy server must be running (npm run dev)
 *   - .env.local must have valid VITE_AGENTFORCE_CLIENT_ID / SECRET
 *   - Contacts already exist with Email addresses matching the personas
 *   - Custom object fields must be manually created and visible in the REST API
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
    console.error(`  ✗ Create ${sobject} failed (${res.status}): ${text}`);
    return null;
  }
  const result = JSON.parse(text);
  console.log(`  ✓ Created ${sobject}: ${result.id}`);
  return result.id;
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

// ─── Persona data (custom objects only) ─────────────────────────
const personas = [
  {
    email: 'sarah.chen@example.com',
    chatSummaries: [
      { date: '2025-09-08', summary: 'Asked about overnight hydration for sensitive skin. Recommended Deep Dew Hydrating Mask. Confirmed she avoids all fragranced products.', sentiment: 'positive', topics: 'overnight hydration;sensitive skin;fragrance allergy' },
      { date: '2025-12-18', summary: 'Asked for travel-friendly skincare for work trip to Mumbai. Recommended SPF 50 and Cooling Mist. Also interested in retinol but worried about sensitivity.', sentiment: 'positive', topics: 'travel skincare;hot climate;SPF;retinol interest' },
    ],
    meaningfulEvents: [
      { type: 'preference', desc: 'Strictly fragrance-free — allergic reaction to fragranced products', at: '2025-09-08', note: 'Never recommend fragranced products' },
      { type: 'life-event', desc: 'Work trip to Mumbai, India (2 weeks, hot/humid climate)', at: '2025-12-18', note: 'Purchased travel SPF kit before departure', meta: { destination: 'Mumbai, India', climate: 'hot' } },
      { type: 'concern', desc: 'Interested in retinol but concerned about irritation on sensitive skin', at: '2025-12-18', note: 'Consider recommending encapsulated retinol' },
    ],
    capturedProfile: [
      { field: 'workEnvironment', value: 'Office, travels frequently for work', at: '2025-12-18', from: 'chat', confidence: 'stated' },
      { field: 'morningRoutineTime', value: 'Has about 10 minutes in the morning, prefers to do more at night', at: '2025-09-08', from: 'chat', confidence: 'stated' },
      { field: 'beautyPriority', value: 'Ingredient-conscious, prioritizes gentle/clean formulations', at: '2025-09-08', from: 'chat', confidence: 'inferred' },
    ],
    browseSessions: [
      { date: '2026-01-22', categories: 'serum', products: 'serum-retinol;serum-anti-aging', duration: 8, device: 'mobile' },
      { date: '2026-01-28', categories: 'eye-cream;serum', products: 'eye-cream;serum-vitamin-c', duration: 5, device: 'desktop' },
    ],
  },
  {
    email: 'james.rodriguez@example.com',
    chatSummaries: [
      { date: '2025-07-10', summary: 'New to skincare, asked for help with oily skin and breakouts. Recommended Clear Start Salicylic Cleanser.', sentiment: 'positive', topics: 'oily skin;acne;beginner routine' },
      { date: '2026-01-25', summary: 'Looking for fragrance gift for partner — anniversary coming up. Browsed Jardin de Nuit and Bois Sauvage. Also wants to expand skincare routine.', sentiment: 'positive', topics: 'fragrance;gifting;anniversary;skincare routine expansion' },
    ],
    meaningfulEvents: [
      { type: 'intent', desc: 'Wants to build a proper skincare routine beyond just a cleanser', at: '2025-07-10', note: 'Good candidate for serum + moisturizer step-up' },
      { type: 'intent', desc: 'Anniversary coming up — looking for fragrance gift for partner', at: '2026-01-25', note: 'Drawn to floral scents for gifting', meta: { occasion: 'anniversary', giftFor: 'partner' } },
    ],
    capturedProfile: [
      { field: 'anniversary', value: 'Coming up in February', at: '2026-01-25', from: 'chat', confidence: 'stated' },
      { field: 'giftsFor', value: 'partner', at: '2026-01-25', from: 'chat', confidence: 'stated', dataType: 'array' },
      { field: 'beautyPriority', value: 'Wants to keep it simple, new to skincare', at: '2025-07-10', from: 'chat', confidence: 'stated' },
    ],
    browseSessions: [
      { date: '2026-01-25', categories: 'fragrance', products: 'fragrance-floral;fragrance-woody', duration: 12, device: 'mobile' },
      { date: '2026-01-20', categories: 'serum', products: 'serum-niacinamide', duration: 4, device: 'desktop' },
    ],
  },
  {
    email: 'maya.thompson@example.com',
    chatSummaries: [
      { date: '2025-06-02', summary: 'In-store, found signature fragrance Jardin de Nuit. Said jasmine-sandalwood blend felt "like her." Also picked up lip color.', sentiment: 'positive', topics: 'fragrance;in-store experience;lipstick' },
      { date: '2025-12-05', summary: 'Returning Peptide Lift Pro — felt too heavy, wants lighter anti-aging alternative.', sentiment: 'neutral', topics: 'product return;anti-aging;serum texture' },
      { date: '2026-01-10', summary: 'Asked about haircare for color-treated hair. Recently got highlights, worried about damage. Purchased Bond Repair duo.', sentiment: 'positive', topics: 'haircare;color-treated hair;damage repair' },
    ],
    meaningfulEvents: [
      { type: 'preference', desc: 'Jardin de Nuit is her signature fragrance', at: '2025-06-02', note: 'Use for personalized scent recommendations' },
      { type: 'concern', desc: 'Returned Peptide Lift Pro — too heavy, wants lighter anti-aging', at: '2025-12-05', note: 'Avoid heavy serums. Try Vitamin C or encapsulated retinol.' },
      { type: 'life-event', desc: 'Recently got hair highlights, concerned about color damage', at: '2026-01-10', note: 'Recommend bond-repair and color-safe formulas' },
    ],
    capturedProfile: [
      { field: 'beautyPriority', value: 'Loves makeup and fragrance, views beauty as self-expression', at: '2025-06-02', from: 'chat', confidence: 'inferred' },
      { field: 'priceRange', value: 'Willing to spend on premium but expects results', at: '2025-12-05', from: 'chat', confidence: 'inferred' },
      { field: 'makeupFrequency', value: 'Daily — foundation, blush, mascara are staples', at: '2025-06-02', from: 'purchase pattern', confidence: 'inferred' },
    ],
    browseSessions: [
      { date: '2026-01-20', categories: 'foundation;blush', products: 'foundation-dewy;blush-silk', duration: 6, device: 'mobile' },
    ],
  },
  {
    email: 'david.kim@example.com',
    chatSummaries: [
      { date: '2025-08-15', summary: 'Asked for help building a routine for combination skin. Wanted to address pores and oiliness. Very methodical — asked about ingredient interactions.', sentiment: 'positive', topics: 'combination skin;pores;routine building;ingredient interactions' },
    ],
    meaningfulEvents: [
      { type: 'preference', desc: 'Very methodical about skincare — wants to understand ingredient interactions', at: '2025-08-15', note: 'Provide detailed ingredient explanations' },
    ],
    capturedProfile: [
      { field: 'beautyPriority', value: 'Science-driven, wants to understand how ingredients interact', at: '2025-08-15', from: 'chat', confidence: 'stated' },
      { field: 'morningRoutineTime', value: 'Has time for a full routine — not rushed', at: '2025-08-15', from: 'chat', confidence: 'inferred' },
    ],
    browseSessions: [
      { date: '2026-01-15', categories: 'serum;moisturizer', products: 'serum-retinol;moisturizer-sensitive', duration: 11, device: 'desktop' },
      { date: '2026-01-27', categories: 'eye-cream', products: 'eye-cream', duration: 3, device: 'mobile' },
    ],
  },
  {
    email: 'marcus.w@example.com',
    chatSummaries: [
      { date: '2026-01-24', summary: 'Brand new to skincare. A friend recommended this brand. Has dry, dull skin. Purchased Cloud Cream Cleanser as first step. Asked what to add next.', sentiment: 'positive', topics: 'beginner skincare;dry skin;first purchase;next steps' },
    ],
    meaningfulEvents: [
      { type: 'intent', desc: 'Complete skincare beginner — wants to know what to add next', at: '2026-01-24', note: 'Recommend moisturizer then SPF. Keep it simple.' },
    ],
    capturedProfile: [
      { field: 'beautyPriority', value: 'Total beginner, friend recommended the brand', at: '2026-01-24', from: 'chat', confidence: 'stated' },
    ],
    browseSessions: [],
  },
];

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Authenticating with Salesforce...');
  const token = await getAccessToken();
  console.log('  ✓ Token acquired\n');

  for (const persona of personas) {
    console.log(`\n══════════════════════════════════════`);
    console.log(`Seeding custom objects for: ${persona.email}`);
    console.log(`══════════════════════════════════════`);

    // Look up existing Contact by Email
    const contactData = await sfQuery(token,
      `SELECT Id FROM Contact WHERE Email = '${persona.email}' LIMIT 1`
    );
    const contactId = contactData.records?.[0]?.Id;
    if (!contactId) {
      console.error(`  ✗ No Contact found for ${persona.email} — skipping`);
      continue;
    }
    console.log(`  ✓ Found Contact: ${contactId}`);

    // Chat Summaries
    for (const chat of persona.chatSummaries) {
      await sfCreate(token, 'Chat_Summary__c', {
        Customer_Id__c: contactId,
        Session_Date__c: chat.date,
        Summary_Text__c: chat.summary,
        Sentiment__c: chat.sentiment,
        Topics_Discussed__c: chat.topics,
      });
    }

    // Meaningful Events
    for (const event of persona.meaningfulEvents) {
      await sfCreate(token, 'Meaningful_Event__c', {
        Customer_Id__c: contactId,
        Event_Type__c: event.type,
        Description__c: event.desc,
        Captured_At__c: event.at,
        Agent_Note__c: event.note,
        Metadata_JSON__c: event.meta ? JSON.stringify(event.meta) : null,
      });
    }

    // Agent Captured Profile
    for (const field of persona.capturedProfile) {
      await sfCreate(token, 'Agent_Captured_Profile__c', {
        Customer_Id__c: contactId,
        Field_Name__c: field.field,
        Field_Value__c: typeof field.value === 'object' ? JSON.stringify(field.value) : field.value,
        Captured_At__c: field.at,
        Captured_From__c: field.from,
        Confidence__c: field.confidence,
        Data_Type__c: field.dataType || 'string',
      });
    }

    // Browse Sessions
    for (const browse of persona.browseSessions) {
      await sfCreate(token, 'Browse_Session__c', {
        Customer_Id__c: contactId,
        Session_Date__c: browse.date,
        Categories_Browsed__c: browse.categories,
        Products_Viewed__c: browse.products,
        Duration_Minutes__c: browse.duration,
        Device__c: browse.device,
      });
    }

    console.log(`  ✅ Done: ${persona.email}`);
  }

  console.log('\n\n══════════════════════════════════════');
  console.log('✅ Custom object seeding complete!');
  console.log('══════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
