/**
 * Compress product images using sharp with high-quality settings.
 *
 * Strategies:
 *   - PNG: Use pngquant-style compression (palette reduction) or oxipng-style
 *   - Reduce color depth while maintaining visual quality
 *   - Strip metadata
 *   - Use maximum compression level
 *
 * Usage:
 *   node scripts/compress-product-images.cjs
 *   node scripts/compress-product-images.cjs --dry-run  # preview without saving
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'products');
const DRY_RUN = process.argv.includes('--dry-run');

async function compressImage(filePath) {
  const filename = path.basename(filePath);

  try {
    const originalBuffer = fs.readFileSync(filePath);
    const originalSize = originalBuffer.length;

    // Skip very small files (likely already optimized or placeholder)
    if (originalSize < 5000) {
      return {
        filename,
        status: 'skipped',
        reason: 'too small',
        originalKB: (originalSize / 1024).toFixed(1)
      };
    }

    // Get image info
    const metadata = await sharp(originalBuffer).metadata();

    // Skip non-PNG
    if (metadata.format !== 'png') {
      return { filename, status: 'skipped', reason: 'not PNG' };
    }

    // Compress with high quality settings
    // - compressionLevel 9: maximum zlib compression
    // - palette: true enables 256-color palette mode (great for product images with limited colors)
    // - effort: 10 maximum compression effort
    // - colors: 256 for palette mode
    const compressedBuffer = await sharp(originalBuffer)
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 90,  // For palette mode, this affects dithering
        effort: 10,   // Maximum compression effort (1-10)
        colors: 256,  // Max colors for palette
      })
      .toBuffer();

    const newSize = compressedBuffer.length;
    const savings = originalSize - newSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    // Only save if we actually reduced size
    if (savings <= 0) {
      return {
        filename,
        status: 'unchanged',
        originalKB: (originalSize / 1024).toFixed(1),
        reason: 'already optimal'
      };
    }

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, compressedBuffer);
    }

    return {
      filename,
      status: 'compressed',
      originalKB: (originalSize / 1024).toFixed(1),
      newKB: (newSize / 1024).toFixed(1),
      savedKB: (savings / 1024).toFixed(1),
      savingsPercent
    };
  } catch (err) {
    return { filename, status: 'error', error: err.message };
  }
}

async function main() {
  console.log(`Product Image Compressor`);
  console.log(`════════════════════════`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE (will modify files)'}\n`);

  const files = fs.readdirSync(PRODUCTS_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(PRODUCTS_DIR, f));

  // Calculate original total
  let originalTotal = 0;
  files.forEach(f => { originalTotal += fs.statSync(f).size; });

  console.log(`Found ${files.length} PNG files`);
  console.log(`Original total: ${(originalTotal / 1024 / 1024).toFixed(2)} MB\n`);

  let compressed = 0;
  let unchanged = 0;
  let errors = 0;
  let skipped = 0;
  let totalSaved = 0;

  for (const file of files) {
    const result = await compressImage(file);

    if (result.status === 'compressed') {
      console.log(`✓ ${result.filename}: ${result.originalKB}KB → ${result.newKB}KB (-${result.savingsPercent}%)`);
      compressed++;
      totalSaved += parseFloat(result.savedKB);
    } else if (result.status === 'unchanged') {
      console.log(`- ${result.filename}: ${result.originalKB}KB (${result.reason})`);
      unchanged++;
    } else if (result.status === 'skipped') {
      console.log(`⊘ ${result.filename}: ${result.reason}`);
      skipped++;
    } else {
      console.log(`✗ ${result.filename}: ${result.error}`);
      errors++;
    }
  }

  // Calculate new total
  let newTotal = 0;
  if (!DRY_RUN) {
    files.forEach(f => { newTotal += fs.statSync(f).size; });
  } else {
    newTotal = originalTotal - (totalSaved * 1024);
  }

  console.log(`\n════════════════════════`);
  console.log(`Compressed: ${compressed}  Unchanged: ${unchanged}  Skipped: ${skipped}  Errors: ${errors}`);
  console.log(`Total saved: ${(totalSaved / 1024).toFixed(2)} MB`);
  console.log(`New total: ${(newTotal / 1024 / 1024).toFixed(2)} MB`);
  if (DRY_RUN) console.log(`(Dry run - no files modified)`);
  console.log(`════════════════════════`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
