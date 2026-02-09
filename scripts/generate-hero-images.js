/**
 * Generate hero images for personalization scenarios using Google Imagen 4.
 *
 * Usage:
 *   node scripts/generate-hero-images.js
 *   node scripts/generate-hero-images.js --dry-run  # preview prompts only
 *   node scripts/generate-hero-images.js --only hero-spa-mask.png
 *
 * Prerequisites:
 *   - VITE_IMAGEN_API_KEY in .env.local (Google AI API key)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HERO_DIR = join(ROOT, 'public', 'assets', 'hero');

const IMAGEN_MODEL = 'imagen-4.0-generate-001';
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;

// ─── Load env ───────────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  try {
    const content = readFileSync(join(ROOT, '.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      if (!env[key]) env[key] = trimmed.slice(eqIdx + 1);
    }
  } catch { /* .env.local not found */ }
  return env;
}

const env = loadEnv();
const API_KEY = env.VITE_IMAGEN_API_KEY;

// ─── CLI args ───────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_IDX = process.argv.indexOf('--only');
const ONLY_FILE = ONLY_IDX !== -1 ? process.argv[ONLY_IDX + 1] : null;

// ─── Hero image definitions ─────────────────────────────────────
const HERO_IMAGES = [
  // PEOPLE-BASED (you'll handle bg removal)
  {
    filename: 'hero-face-wash.png',
    category: 'people',
    prompt: [
      'Close-up beauty photography of a woman washing her face.',
      'Crystal clear water droplets splashing around her face, eyes closed peacefully.',
      'Fresh, dewy skin, natural morning skincare routine moment.',
      'Soft natural lighting, clean and refreshing aesthetic.',
      'High-end skincare advertisement quality, editorial beauty shot.',
      'Focus on the face and water interaction, minimal background.',
      'Pure white background (#FFFFFF) for easy cutout.',
    ].join(' '),
  },
  {
    filename: 'hero-spa-mask.png',
    category: 'people',
    prompt: [
      'Luxurious spa beauty portrait of a woman with a green clay face mask.',
      'Hair elegantly wrapped in a white towel or soft bun.',
      'Wearing a plush white spa robe, neck and shoulders visible.',
      'Eyes closed, serene expression, ultimate relaxation.',
      'Soft diffused lighting suggesting high-end spa environment.',
      'Clean, minimal composition focusing on face and upper body.',
      'Editorial beauty photography, luxury skincare campaign style.',
      'Pure white background (#FFFFFF) for easy cutout.',
    ].join(' '),
  },
  {
    filename: 'hero-glowing-skin.png',
    category: 'people',
    prompt: [
      'Stunning close-up beauty portrait showcasing radiant, glowing skin.',
      'Dewy, luminous complexion with natural highlight on cheekbones.',
      'Soft golden-hour lighting creating a warm, ethereal glow.',
      'Minimal makeup, natural beauty, healthy skin aesthetic.',
      'High-fashion editorial beauty photography style.',
      'Focus on skin texture and natural radiance.',
      'Pure white background (#FFFFFF) for easy cutout.',
    ].join(' '),
  },
  {
    filename: 'hero-wellness-yoga.png',
    category: 'people',
    prompt: [
      'Wellness lifestyle portrait of a woman in a peaceful yoga or meditation pose.',
      'Clean athletic wear, natural and healthy appearance.',
      'Calm, centered expression, embodying mind-body wellness.',
      'Soft natural lighting, fresh and energetic yet serene.',
      'Active lifestyle beauty, health and wellness aesthetic.',
      'Upper body focus, clean composition.',
      'Pure white background (#FFFFFF) for easy cutout.',
    ].join(' '),
  },

  // NON-PEOPLE (for personalization scenarios)
  {
    filename: 'hero-clean-botanicals.png',
    category: 'lifestyle',
    prompt: [
      'Flat lay of clean beauty ingredients and botanicals.',
      'Fresh green leaves, aloe vera slices, chamomile flowers, lavender sprigs.',
      'Natural wooden elements, stone textures, water droplets.',
      'Organic, sustainable, eco-friendly aesthetic.',
      'Soft natural lighting, clean and pure composition.',
      'High-end clean beauty brand campaign style.',
      'Overhead shot, scattered arrangement on pure white surface.',
      'Pure white background (#FFFFFF).',
    ].join(' '),
  },
  {
    filename: 'hero-luxury-textures.png',
    category: 'lifestyle',
    prompt: [
      'CRITICAL: Solid pure white background (#FFFFFF) - absolutely no gradients, shadows, or colored tones.',
      'Luxurious beauty flat lay with premium textures and elements.',
      'Rose gold accents, silk fabric, pearl elements, gold leaf details.',
      'Elegant glass bottles, crystal perfume atomizer.',
      'Soft rose petals, champagne bubbles, velvet textures.',
      'High-end luxury beauty aesthetic, sophisticated and glamorous.',
      'Soft even lighting, no harsh shadows on background.',
      'Clean white studio background, product photography style.',
    ].join(' '),
  },
  {
    filename: 'hero-fragrance-essence.png',
    category: 'lifestyle',
    prompt: [
      'CRITICAL: Solid pure white background (#FFFFFF) - absolutely no gradients, shadows, or colored tones.',
      'Artistic fragrance and scent visualization.',
      'Elegant perfume bottle with visible scent mist or vapor.',
      'Floating flower petals, citrus slices, vanilla pods, sandalwood.',
      'Ethereal, dreamy quality suggesting beautiful fragrance notes.',
      'Soft even lighting, no harsh shadows on background.',
      'High-end perfume advertisement style, clean white studio shot.',
    ].join(' '),
  },
  {
    filename: 'hero-wellness-lifestyle.png',
    category: 'lifestyle',
    prompt: [
      'Wellness and self-care lifestyle flat lay.',
      'Yoga mat corner, smoothie bowl, fresh fruits, eucalyptus.',
      'Natural skincare products, jade roller, gua sha.',
      'Morning routine essentials, healthy lifestyle aesthetic.',
      'Bright, fresh, energizing natural lighting.',
      'Clean and organized composition suggesting balance and wellness.',
      'Pure white background (#FFFFFF).',
    ].join(' '),
  },
];

// ─── Imagen API ─────────────────────────────────────────────────
async function generateImage(prompt, allowPeople = false) {
  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '16:9', // Wide format for hero banners
    },
  };

  // Only restrict person generation for non-people shots
  if (!allowPeople) {
    body.parameters.personGeneration = 'dont_allow';
  }

  const res = await fetch(`${IMAGEN_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Imagen API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const base64 = data.predictions?.[0]?.bytesBase64Encoded;

  if (!base64) {
    const reason = data.predictions?.[0]?.raiFilteredReason || 'unknown';
    throw new Error(`No image generated: ${reason}`);
  }

  return Buffer.from(base64, 'base64');
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Hero Image Generator (Imagen 4)                         ║`);
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE (will generate images)'}                       ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);

  if (!DRY_RUN && !API_KEY) {
    console.error('❌ Missing VITE_IMAGEN_API_KEY in .env.local');
    process.exit(1);
  }

  // Ensure hero directory exists
  if (!existsSync(HERO_DIR)) {
    mkdirSync(HERO_DIR, { recursive: true });
    console.log(`📁 Created directory: public/assets/hero/\n`);
  }

  // Filter images to generate
  let queue = HERO_IMAGES;
  if (ONLY_FILE) {
    queue = queue.filter(img => img.filename === ONLY_FILE);
    if (queue.length === 0) {
      console.error(`❌ Image "${ONLY_FILE}" not found in definitions`);
      process.exit(1);
    }
  }

  console.log(`📋 Images to generate: ${queue.length}`);
  console.log(`─────────────────────────────────────────────────────────────`);
  queue.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.filename} (${img.category})`);
  });
  console.log(`─────────────────────────────────────────────────────────────\n`);

  if (DRY_RUN) {
    console.log(`\n📝 Prompts Preview:\n`);
    queue.forEach((img) => {
      console.log(`▸ ${img.filename}`);
      console.log(`  ${img.prompt.slice(0, 150)}...\n`);
    });
    console.log(`\n✋ Dry run complete. Run without --dry-run to generate images.`);
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const img = queue[i];
    const outputPath = join(HERO_DIR, img.filename);

    console.log(`\n[${i + 1}/${queue.length}] ${img.filename}`);
    console.log(`   Category: ${img.category}`);
    console.log(`   Prompt: ${img.prompt.slice(0, 80)}...`);

    try {
      console.log(`   ⏳ Generating...`);
      const allowPeople = img.category === 'people';
      const imageBuffer = await generateImage(img.prompt, allowPeople);
      const sizeKB = (imageBuffer.length / 1024).toFixed(0);

      writeFileSync(outputPath, imageBuffer);
      console.log(`   ✅ Saved: ${img.filename} (${sizeKB} KB)`);

      success++;

      // Rate limit: ~10 req/min for free tier
      if (i < queue.length - 1) {
        console.log(`   ⏳ Waiting 7s (API rate limit)...`);
        await new Promise(r => setTimeout(r, 7000));
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      failed++;

      // Check if quota exhausted
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.error(`\n⚠️  API quota likely exhausted. Try again later.`);
        break;
      }

      // Wait longer on errors
      if (i < queue.length - 1) {
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  }

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Complete!                                               ║`);
  console.log(`║  Generated: ${String(success).padEnd(3)} | Failed: ${String(failed).padEnd(3)} | Total: ${String(queue.length).padEnd(3)}            ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);

  if (success > 0) {
    console.log(`📁 Images saved to: public/assets/hero/`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Remove backgrounds from people shots as needed`);
    console.log(`   2. Update HeroBanner.tsx to use these images for personalization\n`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
