/**
 * Generate Tachibana maison imagery via Google Imagen 4.
 *
 * Generates editorial product photography (hero + edge macro + interior
 * reveal) for each piece in the Tachibana catalog, plus the supporting
 * scene shots (atelier portraits, house exteriors, material studies,
 * heritage). Saves PNGs to `public/assets/tachibana/`. A follow-up SQL
 * migration patches `demo_products.image_url` and `images[]` so the SPA
 * picks them up automatically via the LuxuryPlate component.
 *
 * Pipeline:
 *   1. Read the manifest below (kept in lockstep with the seed migration
 *      `supabase/migrations/003_tachibana_products_seed.sql`).
 *   2. For each piece, build hero + edge + interior prompts using its
 *      master / material / tannery / form descriptor.
 *   3. Call Imagen 4 (`imagen-4.0-generate-001`) at 1:1 — the same
 *      endpoint the beauty pipeline already uses, so the API key from
 *      `VITE_IMAGEN_API_KEY` works without any new auth wiring.
 *   4. Save raw PNGs (no background removal — these are STAGED editorial
 *      scenes, not cutouts) to `public/assets/tachibana/`.
 *
 * Usage:
 *   # First five hero shots only (visible smoke-test on home + atelier):
 *   node scripts/generate-tachibana-imagery.js --wave 1
 *
 *   # Generate every hero in the catalog:
 *   node scripts/generate-tachibana-imagery.js --wave 1,2 --kind hero
 *
 *   # Generate everything — heroes + edge + interior, all 34 pieces:
 *   node scripts/generate-tachibana-imagery.js --all
 *
 *   # One specific piece, all three shots:
 *   node scripts/generate-tachibana-imagery.js --only "Kiri Tote"
 *
 *   # Dry-run — print prompts without calling the API:
 *   node scripts/generate-tachibana-imagery.js --wave 1 --dry-run
 *
 *   # Skip pieces that already have a PNG on disk (default re-generates):
 *   node scripts/generate-tachibana-imagery.js --wave 1 --skip-existing
 *
 * Prerequisites:
 *   - VITE_IMAGEN_API_KEY in .env.local (Google AI API key)
 *   - Node 20+
 *
 * After running, follow the printed instructions to:
 *   - Commit the generated PNGs (or upload via migrate-images-to-supabase.js)
 *   - Run the matching SQL update to patch demo_products
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'tachibana');

const IMAGEN_MODEL = 'imagen-4.0-generate-001';
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;

// ─── Env loading (same .env.local pattern as the beauty script) ────
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
  } catch { /* .env.local optional */ }
  return env;
}

const env = loadEnv();
const API_KEY = env.VITE_IMAGEN_API_KEY;

// ─── CLI args ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valOf = (flag) => {
  const idx = args.indexOf(flag);
  return idx === -1 ? null : args[idx + 1];
};

const DRY_RUN = has('--dry-run');
const SKIP_EXISTING = has('--skip-existing');
const ALL = has('--all');
const ONLY_PIECE = valOf('--only');
const KIND_FILTER = valOf('--kind'); // hero | edge | interior
const WAVES = (valOf('--wave') || (ALL ? '1,2,3' : '1'))
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => !Number.isNaN(n));

// ─── Editorial prompt templates ─────────────────────────────────
//
// The maison voice: Aesop / The Row / Hermès archive. Restrained, quiet,
// no models, no text on the product, no logos. We always specify the
// camera and lens to nudge Imagen toward editorial-still-life rather than
// catalog-flat. The light direction is consistent across hero and edge
// shots so a piece feels like one campaign.

const STAGING = {
  // The default hero scene — the kuwa-cha leather of the maison sits
  // best against unbleached cream linen with a soft kinari (raw silk)
  // backdrop, lit by a low north window. This works for every piece in
  // the catalog except jewelry, which needs a darker plinth.
  studio: {
    surface: 'a sheet of unbleached cream linen',
    backdrop: 'a kinari (raw silk) backdrop',
    light: 'soft north-window light from camera-left, fall-off into deep shadow',
  },
  // Jewelry sits on dark sumi-stained wood with a single beam of light;
  // the gold + lacquer pieces want contrast, not paper.
  jewelry: {
    surface: 'a small slab of sumi-stained Japanese oak',
    backdrop: 'an unfocused dark backdrop, near-black',
    light: 'a single hard beam of light from camera-left, glinting off the gold',
  },
  // Outerwear hangs on a single pegged hanger against a paulownia wall.
  outerwear: {
    surface: 'a single black-iron pegged hanger',
    backdrop: 'an unfocused paulownia-wood wall',
    light: 'soft north-window light, fall-off into shadow',
  },
};

// Per-material craft language. The hero prompt picks the verb + origin
// noun that fits the substance, so leather pieces read "hand-stitched in
// Pisa" and jewelry pieces read "hand-cast in our Vicenza atelier".
const CRAFT_BY_NOUN = {
  leather:           { verb: 'hand-stitched',                       origin: 'provenance' },
  gold:              { verb: 'hand-cast and brushed',               origin: 'atelier' },
  'gold and pearl':  { verb: 'hand-set with a freshwater pearl',    origin: 'atelier' },
  lacquer:           { verb: 'hand-lacquered in urushi over forty days', origin: 'atelier' },
  silk:              { verb: 'hand-woven on a Nishijin loom',       origin: 'workshop' },
  wood:              { verb: 'hand-cut and lightly fire-marked',    origin: 'atelier' },
  incense:           { verb: 'hand-blended and rolled',             origin: 'atelier' },
};

const buildHeroPrompt = (piece) => {
  const stage = STAGING[piece.staging] || STAGING.studio;
  const craft = CRAFT_BY_NOUN[piece.materialNoun] || CRAFT_BY_NOUN.leather;
  return [
    `Editorial product photograph of ${piece.subject}.`,
    `${piece.material} ${piece.materialNoun}, ${craft.verb}, ${piece.tannery} ${craft.origin}.`,
    `${piece.threeQuarter ? 'Three-quarter angle' : 'Front angle'}, on ${stage.surface}, against ${stage.backdrop}.`,
    `${stage.light}.`,
    `Shot on Hasselblad H6D, 80mm lens, f/4. Single subject. Cinematic, restrained.`,
    `Mood: Aesop meets The Row meets Hermès archive. Quiet, expensive, hand-made.`,
    `CRITICAL: no human, no model, no hands, no logos, no text, no watermarks, no brand names, no QR codes, no price tags, no labels.`,
    `Square 1:1 composition, single subject centered.`,
  ].join(' ');
};

const buildEdgePrompt = (piece) => [
  `Macro photograph of a saddle-stitched leather edge.`,
  `${piece.material} leather, ${piece.tannery} vegetable-tanned, two stitches per inch by hand,`,
  `hand-burnished edge finished in beeswax.`,
  `100mm macro lens, f/8, focus locked on the seam,`,
  `soft north-window light from camera-left.`,
  `CRITICAL: no human, no hands, no logos, no text, no watermarks.`,
  `Square 1:1 composition. Editorial, restrained.`,
].join(' ');

const buildInteriorPrompt = (piece) => [
  `Editorial photograph of the open interior of ${piece.subject},`,
  `revealing the Nishijin silk lining woven in Kyoto by the Nishikawa workshop.`,
  `The lining is a quiet pattern of dyed sumi over a kinari ground.`,
  `${piece.material} ${piece.materialNoun} exterior visible at the edge of frame.`,
  `Soft north-window light, fall-off into shadow.`,
  `Shot on Hasselblad H6D, 80mm lens, f/4.`,
  `CRITICAL: no human, no hands, no logos, no text, no watermarks.`,
  `Square 1:1 composition.`,
].join(' ');

// ─── Manifest — lockstep with migration 003 ─────────────────────
//
// Each piece gets:
//   slug      → output filename stem (kebab-case)
//   name      → matches `demo_products.name`
//   wave      → rollout phase (1=top sellers, 2=remaining catalog,
//                 3=full PDP supporting shots, 4=scene/heritage)
//   subject       → natural-language description of the piece for the prompt
//   material      → leather color or metal (kuwa-cha, sumi, 18k Japanese gold, ...)
//   materialNoun  → "leather", "gold", "lacquer" — what to call the substance
//   tannery       → "Pisa", "Lucca", "Vicenza", "Wajima", "Kyoto"
//   staging       → which staging recipe to use (studio | jewelry | outerwear)
//   threeQuarter  → if false, prompts will use a front-angle shot instead

const PIECES = [
  // ── Wave 1: top 5 hero shots (smoke test on home + atelier) ──
  { slug: 'kiri-tote', name: 'Kiri Tote', wave: 1,
    subject: 'a structured leather tote with two rolled handles, open top, magnetic concealed closure',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'sumi-briefcase', name: 'Sumi Briefcase', wave: 1,
    subject: 'a single-handle leather briefcase with a softly rolled top handle and brass-soft hardware',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'tachibana-voyage', name: 'Tachibana Voyage', wave: 1,
    subject: 'a large soft-sided leather weekender with twin handles, brass-soft buckle straps, no shoulder strap',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'hana-minaudiere', name: 'Hana Minaudière', wave: 1,
    subject: 'a small evening clutch with a slim brass-soft chain folded inside, soft envelope shape',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Lucca',
    staging: 'studio', threeQuarter: true },
  { slug: 'tachibana-crest-signet', name: 'Tachibana Crest Signet', wave: 1,
    subject: 'a heavy 18k gold signet ring with a five-petal mandarin orange crest pressed into the face',
    material: '18k Japanese', materialNoun: 'gold', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: true },

  // ── Wave 2: remaining leather goods ──
  { slug: 'kiri-tote-mini', name: 'Kiri Tote Mini', wave: 2,
    subject: 'a small structured leather tote, half the height of a full tote, two rolled handles',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'sumi-slim-folio', name: 'Sumi Slim Folio', wave: 2,
    subject: 'a slim leather laptop folio, single hinge, magnetic closure, no handle',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'tachibana-voyage-24h', name: 'Tachibana Voyage 24h', wave: 2,
    subject: 'a smaller soft-sided overnight bag with twin handles and brass-soft buckle straps',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'hana-mini', name: 'Hana Mini', wave: 2,
    subject: 'a tiny crossbody clutch with a long brass-soft chain, softly rounded',
    material: 'akakuchiba (fallen-autumn-leaf red)', materialNoun: 'leather', tannery: 'Lucca',
    staging: 'studio', threeQuarter: true },
  { slug: 'hana-tote', name: 'Hana Tote', wave: 2,
    subject: 'a soft open-top leather tote with two flat handles, no closure',
    material: 'akakuchiba (fallen-autumn-leaf red)', materialNoun: 'leather', tannery: 'Lucca',
    staging: 'studio', threeQuarter: true },
  { slug: 'camellia-backpack', name: 'Camellia Backpack', wave: 2,
    subject: 'a leather rucksack with a single roll-top closure and two flat-leather shoulder straps',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'sumi-card-case', name: 'Sumi Card Case', wave: 2,
    subject: 'a flat leather card case, six slots, no closure, kept open at a slight angle',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'sumi-bifold-wallet', name: 'Sumi Bifold Wallet', wave: 2,
    subject: 'a small bifold leather wallet, kept slightly open showing eight card slots',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'kuwa-cha-long-wallet', name: 'Kuwa-cha Long Wallet', wave: 2,
    subject: 'a long leather wallet with a single fold, brass-soft zip on one side',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'kuwa-cha-belt-35mm', name: 'Kuwa-cha Belt 35mm', wave: 2,
    subject: 'a single 35mm leather belt, coiled once on itself, an 18k gold buckle visible',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: false },
  { slug: 'hisashi-document-folio', name: 'Hisashi Document Folio', wave: 2,
    subject: 'an A4 leather document folio, magnetic closure, a single hinge',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: false },
  { slug: 'edo-pen-roll', name: 'Edo Pen Roll', wave: 2,
    subject: 'a single-piece leather pen roll, kept slightly unfurled, three pen slots visible',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },

  // ── Wave 2 jewelry ──
  { slug: 'tachibana-crest-pendant', name: 'Tachibana Crest Pendant', wave: 2,
    subject: 'a small 18k gold kamon pendant on a slim 50cm rolo chain',
    material: '18k Japanese', materialNoun: 'gold', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: false },
  { slug: 'kiku-cuff', name: 'Kiku Cuff', wave: 2,
    subject: 'a wide 18k gold cuff bracelet with a chrysanthemum motif worked in low relief',
    material: '18k Japanese', materialNoun: 'gold', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: true },
  { slug: 'mizuhiki-bracelet', name: 'Mizuhiki Bracelet', wave: 2,
    subject: 'a triple-strand bracelet of 18k gold cord knotted in the mizuhiki style',
    material: '18k Japanese', materialNoun: 'gold', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: true },
  { slug: 'mon-stud-earrings', name: 'Mon Stud Earrings', wave: 2,
    subject: 'a pair of small 18k gold stud earrings, the kamon visible on each face, butterfly backs',
    material: '18k Japanese', materialNoun: 'gold', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: false },
  { slug: 'hana-drop-earrings', name: 'Hana Drop Earrings', wave: 2,
    subject: 'a pair of drop earrings, a small kamon in 18k gold suspended above a freshwater pearl',
    material: '18k Japanese', materialNoun: 'gold and pearl', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: false },
  { slug: 'sumi-lacquer-hairpin', name: 'Sumi Lacquer Hairpin', wave: 2,
    subject: 'a single hair stick in sumi black urushi lacquer over boxwood, gold-leaf kamon at the head',
    material: 'urushi lacquer over boxwood', materialNoun: 'lacquer', tannery: 'Wajima',
    staging: 'jewelry', threeQuarter: false },
  { slug: 'mon-cufflinks', name: 'Mon Cufflinks', wave: 2,
    subject: 'a pair of 18k gold cufflinks with brushed-finish kamon faces and T-bar backs',
    material: '18k Japanese', materialNoun: 'gold', tannery: 'Vicenza',
    staging: 'jewelry', threeQuarter: true },

  // ── Wave 2 outerwear ──
  { slug: 'kuwa-cha-travel-coat', name: 'Kuwa-cha Travel Coat', wave: 2,
    subject: 'a single-breasted leather travel coat in mulberry-tea brown, mid-calf length',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa + Kyoto',
    staging: 'outerwear', threeQuarter: false },
  { slug: 'sumi-bomber', name: 'Sumi Bomber', wave: 2,
    subject: 'a short leather bomber jacket in sumi black, a single front zip, ribbed silk hem and cuff',
    material: 'sumi-dyed', materialNoun: 'leather', tannery: 'Pisa + Kyoto',
    staging: 'outerwear', threeQuarter: false },
  { slug: 'kinari-wrap', name: 'Kinari Wrap', wave: 2,
    subject: 'a long undyed Nishijin silk wrap, draped softly over a black-iron hanger',
    material: 'undyed Nishijin', materialNoun: 'silk', tannery: 'Kyoto',
    staging: 'outerwear', threeQuarter: false },
  { slug: 'aijiro-haori', name: 'Aijiro Haori', wave: 2,
    subject: 'a formal indigo-white silk haori jacket with a kamon embroidered at the collar',
    material: 'aijiro indigo-white', materialNoun: 'silk', tannery: 'Kyoto',
    staging: 'outerwear', threeQuarter: false },

  // ── Wave 2 lifestyle ──
  { slug: 'paulownia-stationery-box', name: 'Paulownia Stationery Box', wave: 2,
    subject: 'a traditional kiri-paulownia wood stationery box, lid open at a slight angle, six interior compartments visible',
    material: 'paulownia (kiri-wood)', materialNoun: 'wood', tannery: 'Kyoto',
    staging: 'studio', threeQuarter: true },
  { slug: 'sumi-fountain-pen', name: 'Sumi Fountain Pen', wave: 2,
    subject: 'a sumi-black urushi-lacquered fountain pen with an exposed 18k gold nib, cap removed and resting alongside',
    material: 'urushi lacquer + 18k gold', materialNoun: 'lacquer', tannery: 'Wajima',
    staging: 'jewelry', threeQuarter: true },
  { slug: 'tachibana-incense-set', name: 'Tachibana Incense Set', wave: 2,
    subject: 'three coils of Kyoto incense and a small black-iron incense holder, on a small paulownia tray',
    material: 'kyara, sandalwood, plum', materialNoun: 'incense', tannery: 'Kyoto',
    staging: 'studio', threeQuarter: true },
  { slug: 'kuwa-cha-a5-notebook', name: 'Kuwa-cha A5 Notebook', wave: 2,
    subject: 'a leather A5 notebook with a soft cover, kept slightly open showing cream writing paper',
    material: 'kuwa-cha mulberry-tea', materialNoun: 'leather', tannery: 'Pisa',
    staging: 'studio', threeQuarter: true },
  { slug: 'kinari-tea-towel-set', name: 'Kinari Tea Towel Set', wave: 2,
    subject: 'three folded undyed Nishijin silk tea towels, stacked, with a tiny woven kamon visible on the corner',
    material: 'undyed Nishijin', materialNoun: 'silk', tannery: 'Kyoto',
    staging: 'studio', threeQuarter: false },
  { slug: 'mon-coasters', name: 'Mon Coasters', wave: 2,
    subject: 'four paulownia wood coasters, fanned in an arc, each lightly burned with a kamon at center',
    material: 'paulownia (kiri-wood)', materialNoun: 'wood', tannery: 'Kyoto',
    staging: 'studio', threeQuarter: false },
];

// ─── Imagen call ────────────────────────────────────────────────
async function generateImage(prompt) {
  const res = await fetch(`${IMAGEN_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        personGeneration: 'dont_allow',
      },
    }),
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

// ─── Build queue ────────────────────────────────────────────────
function buildQueue() {
  const KINDS = KIND_FILTER ? [KIND_FILTER] : ['hero', 'edge', 'interior'];
  const out = [];

  for (const piece of PIECES) {
    if (ONLY_PIECE && piece.name !== ONLY_PIECE) continue;
    if (!ONLY_PIECE && !WAVES.includes(piece.wave)) continue;

    for (const kind of KINDS) {
      // Wave 3 controls the supporting shots (edge + interior). Wave 1
      // and 2 only generate hero unless the user explicitly asks for the
      // supporting kinds via `--kind`.
      if (!ONLY_PIECE && !KIND_FILTER && (kind === 'edge' || kind === 'interior') && !WAVES.includes(3)) {
        continue;
      }
      // Jewelry / lifestyle pieces don't have a "Nishijin silk lining"
      // interior to reveal — skip the interior shot for them.
      if (kind === 'interior' && (piece.staging === 'jewelry' || piece.materialNoun === 'wood' || piece.materialNoun === 'incense' || piece.materialNoun === 'silk' || piece.materialNoun === 'lacquer' || piece.materialNoun === 'gold' || piece.materialNoun === 'gold and pearl')) {
        continue;
      }

      const filename = `${piece.slug}-${kind}.png`;
      const outPath = join(OUT_DIR, filename);
      if (SKIP_EXISTING && existsSync(outPath)) continue;

      let prompt;
      if (kind === 'hero') prompt = buildHeroPrompt(piece);
      else if (kind === 'edge') prompt = buildEdgePrompt(piece);
      else if (kind === 'interior') prompt = buildInteriorPrompt(piece);
      else continue;

      out.push({ piece, kind, filename, outPath, prompt });
    }
  }
  return out;
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  if (!DRY_RUN && !API_KEY) {
    console.error('Missing VITE_IMAGEN_API_KEY in .env.local');
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const queue = buildQueue();
  if (queue.length === 0) {
    console.log('Nothing to generate. Try --wave 1 or --all.');
    return;
  }

  console.log(`Tachibana Imagery Generator (Imagen 4)`);
  console.log(`══════════════════════════════════════`);
  console.log(`  Waves:      ${WAVES.join(', ')}`);
  console.log(`  Kind:       ${KIND_FILTER || 'hero (+ edge/interior if wave 3)'}`);
  console.log(`  Pieces:     ${ONLY_PIECE || `${PIECES.filter((p) => WAVES.includes(p.wave)).length} in scope`}`);
  console.log(`  Output:     ${OUT_DIR}`);
  console.log(`  To run:     ${queue.length} image${queue.length === 1 ? '' : 's'}`);
  console.log(`  Dry run:    ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`══════════════════════════════════════\n`);

  if (DRY_RUN) {
    for (const job of queue) {
      console.log(`[${job.kind.toUpperCase()}] ${job.piece.name}`);
      console.log(`  → ${job.filename}`);
      console.log(`  ${job.prompt}\n`);
    }
    return;
  }

  let success = 0;
  let failed = 0;
  for (let i = 0; i < queue.length; i++) {
    const { piece, kind, filename, outPath, prompt } = queue[i];
    console.log(`[${i + 1}/${queue.length}] ${piece.name} — ${kind}`);
    console.log(`  ${prompt.slice(0, 140)}...`);
    try {
      const buf = await generateImage(prompt);
      writeFileSync(outPath, buf);
      const kb = (buf.length / 1024).toFixed(0);
      console.log(`  ✓ Saved: ${filename} (${kb} KB)\n`);
      success++;
      if (i < queue.length - 1) {
        await new Promise((r) => setTimeout(r, 7000)); // ~10 req/min Imagen rate-limit
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
      failed++;
      if (i < queue.length - 1) await new Promise((r) => setTimeout(r, 15000));
    }
  }

  console.log(`══════════════════════════════════════`);
  console.log(`Done. Generated: ${success}  Failed: ${failed}`);
  console.log(`══════════════════════════════════════`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Visually review the PNGs in ${OUT_DIR}`);
  console.log('  2. Commit them to git, OR run scripts/migrate-images-to-supabase.js to push to Storage');
  console.log('  3. Run a SQL UPDATE to point demo_products at the URLs:');
  console.log('       update demo_products dp');
  console.log("       set image_url = '/assets/tachibana/' || lower(replace(dp.name, ' ', '-')) || '-hero.png'");
  console.log("       where dp.demo_id = (select id from demos where slug = 'tachibana');");
  console.log('     (or use the matching SQL helper once you commit the asset filenames)');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
