// Shared Data Cloud token helper — two-step exchange required for DC APIs
// Step 1: client_credentials → SF access token
// Step 2: SF token → DC JWT via urn:salesforce:grant-type:external:cdp

const SF_INSTANCE   = process.env.VITE_AGENTFORCE_INSTANCE_URL || 'https://me1769724439764.my.salesforce.com';
const CLIENT_ID     = process.env.VITE_AGENTFORCE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_AGENTFORCE_CLIENT_SECRET;

let cachedDcToken       = null;
let cachedDcInstanceUrl = null;
let dcTokenExpiresAt    = 0;

export async function getDcToken() {
  if (cachedDcToken && Date.now() < dcTokenExpiresAt) {
    return { access_token: cachedDcToken, instance_url: cachedDcInstanceUrl };
  }

  // Step 1 — SF client credentials token
  const sfRes = await fetch(`${SF_INSTANCE}/services/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }).toString(),
  });
  if (!sfRes.ok) { const t = await sfRes.text(); throw new Error(`SF token failed (${sfRes.status}): ${t}`); }
  const { access_token: sfToken, instance_url: sfInstanceUrl } = await sfRes.json();

  // Step 2 — Exchange SF token for DC token
  const a360Base = sfInstanceUrl || SF_INSTANCE;
  const dcRes = await fetch(`${a360Base}/services/a360/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:         'urn:salesforce:grant-type:external:cdp',
      subject_token:      sfToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      client_id:          CLIENT_ID,
      client_secret:      CLIENT_SECRET,
    }).toString(),
  });
  if (!dcRes.ok) { const t = await dcRes.text(); throw new Error(`DC token exchange failed (${dcRes.status}): ${t}`); }
  const dcData = await dcRes.json();
  console.log('[dc-token] DC exchange response keys:', Object.keys(dcData).join(', '));
  if (dcData.error) {
    throw new Error(`DC token exchange error: ${dcData.error} — ${dcData.error_description}`);
  }

  const dcToken       = dcData.access_token;
  // SF docs say the field is "instance_url"; some orgs return it as a bare hostname without scheme
  const rawInstanceUrl = dcData.instance_url || process.env.VITE_DC_TENANT_URL || 'mzrdcnz-gvrwgzldg04dqy3cg1.c360a.salesforce.com';
  const expires_in    = dcData.expires_in;

  cachedDcToken       = dcToken;
  cachedDcInstanceUrl = rawInstanceUrl.startsWith('http') ? rawInstanceUrl : `https://${rawInstanceUrl}`;
  dcTokenExpiresAt    = Date.now() + (expires_in ? expires_in * 1000 : 7200_000) - 300_000;

  console.log('[dc-token] DC token obtained, instance_url:', cachedDcInstanceUrl);
  return { access_token: cachedDcToken, instance_url: cachedDcInstanceUrl };
}
