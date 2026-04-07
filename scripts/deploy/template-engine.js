#!/usr/bin/env node
/**
 * Template Engine — substitutes brand-specific variables into Salesforce
 * GenAI prompt templates before deploying to a scratch org.
 *
 * Usage:
 *   node scripts/deploy/template-engine.js <demo-slug>
 *
 * Reads:
 *   - salesforce/force-app/main/default/genAiPromptTemplates/*.xml (golden templates)
 *   - Demo config from Supabase (brand name, tagline, voice notes)
 *   - demo_prompt_overrides from Supabase (per-template variable overrides)
 *
 * Writes:
 *   - Copies to a temp directory with substitutions applied
 *   - Returns the temp path for the deploy script to use
 *
 * Template variables (wrapped in {{DOUBLE_BRACES}}):
 *   {{BRAND_NAME}}          — e.g., "Gucci"
 *   {{BRAND_TAGLINE}}       — e.g., "Your Personal Style Advisor"
 *   {{BRAND_VOICE}}         — AI-generated brand voice description
 *   {{PRODUCT_DOMAIN}}      — e.g., "luxury fashion, accessories, leather goods"
 *   {{VERTICAL}}            — e.g., "fashion"
 *   {{CUSTOMER_GREETING}}   — e.g., "Welcome to the Gucci experience"
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const TEMPLATES_DIR = resolve(PROJECT_ROOT, 'salesforce/force-app/main/default/genAiPromptTemplates');

// ─── Config from env ────────────────────────────────────────────────

function loadEnv() {
  const env = {};
  try {
    const content = readFileSync(resolve(PROJECT_ROOT, '.env.local'), 'utf-8');
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
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

// ─── Supabase helpers ───────────────────────────────────────────────

async function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const req = https.get(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

// ─── Vertical descriptions ──────────────────────────────────────────

const VERTICAL_DOMAINS = {
  beauty: 'skincare, cosmetics, fragrance, and beauty products',
  fashion: 'luxury fashion, accessories, footwear, and leather goods',
  wellness: 'health supplements, wellness products, and fitness equipment',
  cpg: 'consumer packaged goods, food, beverage, and household products',
};

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node template-engine.js <demo-slug>');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
  }

  // 1. Fetch demo config
  console.log(`[template-engine] Fetching config for: ${slug}`);
  const demos = await fetchJson(`/rest/v1/demos?slug=eq.${slug}&select=*`);
  const demo = demos[0];
  if (!demo) {
    console.error(`Demo "${slug}" not found`);
    process.exit(1);
  }

  // 2. Fetch prompt overrides
  const overrides = await fetchJson(`/rest/v1/demo_prompt_overrides?demo_id=eq.${demo.id}&select=*`);
  const overrideMap = {};
  for (const o of overrides) {
    overrideMap[o.template_name] = o;
  }

  // 3. Build variable map
  const vars = {
    BRAND_NAME: demo.brand_name,
    BRAND_TAGLINE: demo.brand_tagline || `Your Personal ${demo.brand_name} Advisor`,
    BRAND_VOICE: '', // populated from overrides or AI research
    PRODUCT_DOMAIN: VERTICAL_DOMAINS[demo.vertical] || VERTICAL_DOMAINS.beauty,
    VERTICAL: demo.vertical,
    CUSTOMER_GREETING: `Welcome to ${demo.brand_name}`,
  };

  // Check if there's a brand voice override stored
  const voiceOverride = overrideMap['_brand_voice'];
  if (voiceOverride?.variables?.brandVoice) {
    vars.BRAND_VOICE = voiceOverride.variables.brandVoice;
  }

  console.log(`[template-engine] Variables:`, vars);

  // 4. Create output directory
  const outDir = resolve(PROJECT_ROOT, '.tmp', `templates-${slug}`);
  mkdirSync(outDir, { recursive: true });

  // 5. Copy and substitute templates
  if (!existsSync(TEMPLATES_DIR)) {
    console.warn(`[template-engine] No templates directory found at ${TEMPLATES_DIR}`);
    console.log(outDir); // still output the dir
    return;
  }

  const files = readdirSync(TEMPLATES_DIR);
  let substituted = 0;

  for (const file of files) {
    const srcPath = join(TEMPLATES_DIR, file);
    const destPath = join(outDir, file);

    // Check for full content override
    const templateName = file.replace('.genAiPromptTemplate-meta.xml', '');
    const override = overrideMap[templateName];

    if (override?.content_override) {
      // Full override — use it directly
      writeFileSync(destPath, override.content_override, 'utf-8');
      console.log(`  [override] ${file}`);
      substituted++;
      continue;
    }

    // Read template and substitute variables
    let content = readFileSync(srcPath, 'utf-8');
    let changed = false;

    // Apply per-template variable overrides
    if (override?.variables) {
      for (const [key, value] of Object.entries(override.variables)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        if (pattern.test(content)) {
          content = content.replace(pattern, value);
          changed = true;
        }
      }
    }

    // Apply global variables
    for (const [key, value] of Object.entries(vars)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      if (pattern.test(content)) {
        content = content.replace(pattern, value);
        changed = true;
      }
    }

    // Also do a simple brand name replacement in prompt content
    // Replace "SERENE" (the golden template brand) with the demo brand
    if (demo.brand_name !== 'SERENE') {
      const serenePattern = /\bSERENE\b/g;
      if (serenePattern.test(content)) {
        content = content.replace(serenePattern, demo.brand_name);
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(destPath, content, 'utf-8');
      console.log(`  [substituted] ${file}`);
      substituted++;
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`  [copied] ${file}`);
    }
  }

  console.log(`[template-engine] ${substituted}/${files.length} templates customized → ${outDir}`);
  // Output the directory path for the deploy script to consume
  console.log(outDir);
}

main().catch((err) => {
  console.error('[template-engine] Fatal:', err);
  process.exit(1);
});
