/**
 * Create custom objects and their fields in Salesforce via Tooling API.
 *
 * Usage:
 *   node scripts/create-custom-objects.js
 *
 * Prerequisites:
 *   - The Express proxy server must be running (npm run dev)
 *   - .env.local must have valid VITE_AGENTFORCE_CLIENT_ID / SECRET / INSTANCE_URL
 *
 * Creates:
 *   1. Chat_Summary__c
 *   2. Meaningful_Event__c
 *   3. Browse_Session__c
 *   4. Agent_Captured_Profile__c
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

// ─── Tooling API helpers ────────────────────────────────────────
async function toolingQuery(token, soql) {
  const res = await fetch(`${API_BASE}/api/datacloud/tooling/query?q=${encodeURIComponent(soql)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { records: [] };
  return res.json();
}

async function toolingCreate(token, sobject, fields) {
  const res = await fetch(`${API_BASE}/api/datacloud/tooling/sobjects/${sobject}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const text = await res.text();
  if (!res.ok) {
    if (text.includes('duplicate') || text.includes('already exists')) {
      return 'exists';
    }
    console.error(`  ✗ Tooling create ${sobject} failed (${res.status}): ${text.substring(0, 300)}`);
    return null;
  }
  const result = JSON.parse(text);
  return result.id;
}

// ─── Standard REST query (to check if object exists) ────────────
async function sfQuery(token, soql) {
  const res = await fetch(`${API_BASE}/api/datacloud/query?q=${encodeURIComponent(soql)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return { records: [], error: true };
  return res.json();
}

// ─── Create custom object ───────────────────────────────────────
async function createCustomObject(token, fullName, label, pluralLabel, nameFieldLabel, nameFieldFormat) {
  // Check if object already exists via Tooling API
  const check = await toolingQuery(token,
    `SELECT Id, DeveloperName FROM CustomObject WHERE DeveloperName = '${fullName.replace('__c', '')}'`
  );
  if (check.records?.length > 0) {
    console.log(`  ✓ ${fullName} already exists (${check.records[0].Id})`);
    return check.records[0].Id;
  }

  console.log(`  Creating ${fullName}...`);
  const id = await toolingCreate(token, 'CustomObject', {
    FullName: fullName,
    Metadata: {
      label,
      pluralLabel,
      nameField: {
        type: 'AutoNumber',
        label: nameFieldLabel,
        displayFormat: nameFieldFormat,
      },
      deploymentStatus: 'Deployed',
      sharingModel: 'ReadWrite',
    },
  });

  if (id === 'exists') {
    console.log(`  ✓ ${fullName} already exists`);
    return 'exists';
  }
  if (!id) {
    console.error(`  ✗ Failed to create ${fullName}`);
    return null;
  }
  console.log(`  ✓ Created ${fullName}: ${id}`);
  return id;
}

// ─── Create custom field on object ──────────────────────────────
async function createCustomField(token, objectName, fieldName, label, type, opts = {}) {
  const fullName = `${objectName}.${fieldName}`;
  const devName = fieldName.replace('__c', '');

  // Check if field already exists
  const check = await toolingQuery(token,
    `SELECT Id FROM CustomField WHERE TableEnumOrId = '${objectName}' AND DeveloperName = '${devName}'`
  );
  if (check.records?.length > 0) {
    console.log(`    ✓ ${fullName} already exists`);
    return true;
  }

  const metadata = {
    label,
    type,
    ...(type === 'Text' && { length: opts.length || 255 }),
    ...(type === 'LongTextArea' && { length: opts.length || 32768, visibleLines: opts.visibleLines || 3 }),
    ...(type === 'Number' && { precision: opts.precision || 18, scale: opts.scale || 0 }),
    ...(type === 'Date' && {}),
  };

  const id = await toolingCreate(token, 'CustomField', {
    FullName: fullName,
    Metadata: metadata,
  });

  if (id === 'exists') {
    console.log(`    ✓ ${fullName} already exists`);
    return true;
  }
  if (!id) return false;
  console.log(`    ✓ Created ${fullName}: ${id}`);
  return true;
}

// ─── Grant FLS for all fields on an object ──────────────────────
async function grantFLS(token, objectName, fieldNames) {
  // Find permission sets with object access
  const psData = await sfQuery(token,
    `SELECT ParentId FROM ObjectPermissions WHERE SobjectType = '${objectName}' AND PermissionsRead = true`
  );
  if (psData.error) {
    // Object might not be queryable yet, try with broader approach
    console.log(`    ⚠ Could not query ObjectPermissions for ${objectName} — FLS may need manual setup`);
    return;
  }

  const parentIds = [...new Set((psData.records || []).map(r => r.ParentId))];

  for (const fieldName of fieldNames) {
    const fieldFullName = `${objectName}.${fieldName}`;
    for (const parentId of parentIds.slice(0, 5)) {
      // Check if FLS already exists
      const existing = await sfQuery(token,
        `SELECT Id FROM FieldPermissions WHERE ParentId = '${parentId}' AND SobjectType = '${objectName}' AND Field = '${fieldFullName}'`
      );
      if (existing.records?.length > 0) continue;

      const res = await fetch(`${API_BASE}/api/datacloud/sobjects/FieldPermissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ParentId: parentId,
          SobjectType: objectName,
          Field: fieldFullName,
          PermissionsRead: true,
          PermissionsEdit: true,
        }),
      });
      if (res.ok) {
        console.log(`    ✓ FLS: ${fieldFullName} → ${parentId}`);
      } else {
        const text = await res.text();
        if (!text.includes('duplicate')) {
          console.log(`    ⚠ FLS ${fieldFullName}: ${text.substring(0, 100)}`);
        }
      }
    }
  }
}

// ─── Object definitions ─────────────────────────────────────────
const OBJECTS = [
  {
    fullName: 'Chat_Summary__c',
    label: 'Chat Summary',
    pluralLabel: 'Chat Summaries',
    nameFieldLabel: 'Chat Summary Number',
    nameFieldFormat: 'CS-{0000}',
    fields: [
      ['Customer_Id__c', 'Customer ID', 'Text', { length: 18 }],
      ['Session_Date__c', 'Session Date', 'Date'],
      ['Summary_Text__c', 'Summary Text', 'LongTextArea', { length: 32768, visibleLines: 5 }],
      ['Sentiment__c', 'Sentiment', 'Text', { length: 50 }],
      ['Topics_Discussed__c', 'Topics Discussed', 'LongTextArea', { length: 5000, visibleLines: 3 }],
    ],
  },
  {
    fullName: 'Meaningful_Event__c',
    label: 'Meaningful Event',
    pluralLabel: 'Meaningful Events',
    nameFieldLabel: 'Event Number',
    nameFieldFormat: 'ME-{0000}',
    fields: [
      ['Customer_Id__c', 'Customer ID', 'Text', { length: 18 }],
      ['Event_Type__c', 'Event Type', 'Text', { length: 100 }],
      ['Description__c', 'Description', 'LongTextArea', { length: 32768, visibleLines: 5 }],
      ['Captured_At__c', 'Captured At', 'Date'],
      ['Agent_Note__c', 'Agent Note', 'LongTextArea', { length: 32768, visibleLines: 3 }],
      ['Metadata_JSON__c', 'Metadata JSON', 'LongTextArea', { length: 32768, visibleLines: 3 }],
    ],
  },
  {
    fullName: 'Browse_Session__c',
    label: 'Browse Session',
    pluralLabel: 'Browse Sessions',
    nameFieldLabel: 'Browse Session Number',
    nameFieldFormat: 'BS-{0000}',
    fields: [
      ['Customer_Id__c', 'Customer ID', 'Text', { length: 18 }],
      ['Session_Date__c', 'Session Date', 'Date'],
      ['Categories_Browsed__c', 'Categories Browsed', 'Text', { length: 255 }],
      ['Products_Viewed__c', 'Products Viewed', 'Text', { length: 255 }],
      ['Duration_Minutes__c', 'Duration Minutes', 'Number', { precision: 6, scale: 0 }],
      ['Device__c', 'Device', 'Text', { length: 50 }],
    ],
  },
  {
    fullName: 'Agent_Captured_Profile__c',
    label: 'Agent Captured Profile',
    pluralLabel: 'Agent Captured Profiles',
    nameFieldLabel: 'Profile Entry Number',
    nameFieldFormat: 'ACP-{0000}',
    fields: [
      ['Customer_Id__c', 'Customer ID', 'Text', { length: 18 }],
      ['Field_Name__c', 'Field Name', 'Text', { length: 100 }],
      ['Field_Value__c', 'Field Value', 'LongTextArea', { length: 32768, visibleLines: 3 }],
      ['Captured_At__c', 'Captured At', 'Date'],
      ['Captured_From__c', 'Captured From', 'Text', { length: 100 }],
      ['Confidence__c', 'Confidence', 'Text', { length: 50 }],
      ['Data_Type__c', 'Data Type', 'Text', { length: 50 }],
    ],
  },
];

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Authenticating with Salesforce...');
  const token = await getAccessToken();
  console.log('  ✓ Token acquired\n');

  for (const obj of OBJECTS) {
    console.log(`\n📦 Creating object: ${obj.fullName}`);
    console.log('─'.repeat(50));

    const objId = await createCustomObject(
      token, obj.fullName, obj.label, obj.pluralLabel,
      obj.nameFieldLabel, obj.nameFieldFormat
    );
    if (!objId) {
      console.error(`  ✗ Skipping fields for ${obj.fullName} — object creation failed`);
      continue;
    }

    // Wait briefly for object metadata to propagate
    console.log('  ⏳ Waiting 5s for object metadata...');
    await new Promise(r => setTimeout(r, 5000));

    console.log(`  Adding fields to ${obj.fullName}:`);
    const fieldNames = [];
    for (const [fieldName, label, type, opts] of obj.fields) {
      await createCustomField(token, obj.fullName, fieldName, label, type, opts || {});
      fieldNames.push(fieldName);
    }

    // Grant FLS
    console.log(`  Granting FLS for ${obj.fullName}:`);
    await grantFLS(token, obj.fullName, fieldNames);
  }

  console.log('\n\n══════════════════════════════════════');
  console.log('✅ Custom objects creation complete!');
  console.log('══════════════════════════════════════');
  console.log('\nNext steps:');
  console.log('  1. Wait ~30s for metadata to propagate');
  console.log('  2. Run: node scripts/seed-salesforce.js');
  console.log('  3. The seed script will populate these objects with demo data');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
