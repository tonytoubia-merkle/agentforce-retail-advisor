/**
 * Compress hero images using Sharp.
 *
 * Usage:
 *   node scripts/compress-hero-images.js
 */

import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HERO_DIR = join(__dirname, '..', 'public', 'assets', 'hero');

async function compressHeroImages() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Hero Image Compression                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const files = readdirSync(HERO_DIR).filter(f => f.endsWith('.png'));
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const filePath = join(HERO_DIR, file);
    const beforeSize = statSync(filePath).size;
    totalBefore += beforeSize;

    try {
      // Read and compress with sharp
      const buffer = await sharp(filePath)
        .png({
          quality: 85,
          compressionLevel: 9,
          palette: true,  // Use palette-based PNG for smaller size
          colors: 256,
        })
        .toBuffer();

      // Only write if smaller
      if (buffer.length < beforeSize) {
        await sharp(buffer).toFile(filePath);
        const afterSize = buffer.length;
        totalAfter += afterSize;
        const savings = ((1 - afterSize / beforeSize) * 100).toFixed(1);
        console.log(`✅ ${file}: ${(beforeSize / 1024).toFixed(0)}KB → ${(afterSize / 1024).toFixed(0)}KB (-${savings}%)`);
      } else {
        totalAfter += beforeSize;
        console.log(`⏭️  ${file}: ${(beforeSize / 1024).toFixed(0)}KB (already optimal)`);
      }
    } catch (err) {
      totalAfter += beforeSize;
      console.error(`❌ ${file}: ${err.message}`);
    }
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(`Total: ${(totalBefore / 1024).toFixed(0)}KB → ${(totalAfter / 1024).toFixed(0)}KB`);
  console.log(`Saved: ${((totalBefore - totalAfter) / 1024).toFixed(0)}KB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
  console.log('');
}

compressHeroImages().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
