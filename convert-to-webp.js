const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pngquant = require('pngquant-bin').default || require('pngquant-bin');
const cwebp = require('cwebp-bin').default || require('cwebp-bin');

const wishesDir = path.join(__dirname, 'src', 'assets', 'images', 'wishes');
const backgroundsDir = path.join(__dirname, 'src', 'assets', 'images', 'backgrounds');
const maxFreuDir = path.join(__dirname, 'src', 'assets', 'images', 'max-freu');

console.log('🔄 Converting PNG to WebP...\n');

function convertDirectory(directory, dirName) {
  console.log(`📁 Processing ${dirName}...`);

  const files = fs.readdirSync(directory)
    .filter(f => f.endsWith('.png'));

  let converted = 0;
  let skipped = 0;

  files.forEach(file => {
    const pngPath = path.join(directory, file);
    const webpDir = path.join(directory, 'webp');
    const webpPath = path.join(webpDir, file.replace('.png', '.webp'));
    const legacyWebpPath = pngPath.replace('.png', '.webp'); // Old location
    const tempPngPath = pngPath.replace('.png', '.temp.png');

    // Cleanup legacy WebP file if it exists
    if (fs.existsSync(legacyWebpPath)) {
      try {
        fs.unlinkSync(legacyWebpPath);
        console.log(`  🗑️  Removed legacy file: ${file.replace('.png', '.webp')}`);
      } catch (e) {
        console.error(`  ⚠️  Failed to remove legacy file: ${legacyWebpPath}`);
      }
    }

    // Ensure webp directory exists
    if (!fs.existsSync(webpDir)) {
      fs.mkdirSync(webpDir, { recursive: true });
    }

    // Check if WebP already exists
    if (fs.existsSync(webpPath)) {
      skipped++;
      return;
    } else {
      // console.log('DEBUG: WebP not found at:', webpPath);
    }

    try {
      // Convert PNG directly to WebP with high quality (90)
      // No intermediate pngquant step to preserve full color palette
      execSync(`"${cwebp}" -q 90 "${pngPath}" -o "${webpPath}"`, { stdio: 'ignore' });

      const pngSize = fs.statSync(pngPath).size;
      const webpSize = fs.statSync(webpPath).size;
      const savings = ((1 - webpSize / pngSize) * 100).toFixed(1);

      console.log(`  ✅ ${file} → ${file.replace('.png', '.webp')} (${savings}% smaller)`);
      converted++;
    } catch (error) {
      console.log(`  ❌ ${file} - conversion failed`);
    }
  });

  console.log(`  ${converted} converted, ${skipped} skipped\n`);

  // Return list of valid numeric filenames for this directory
  return {
    stats: { converted, skipped },
    files: files
      .map(f => path.parse(f).name)
      .filter(name => !isNaN(parseInt(name))) // Only include numeric names (exclude 'main')
      .sort((a, b) => parseInt(a) - parseInt(b)) // Numeric sort
  };
}

// Convert wishes
const wishesData = convertDirectory(wishesDir, 'wishes');

// Convert backgrounds  
const bgData = convertDirectory(backgroundsDir, 'backgrounds');

// Convert Max Frei images
const maxFreuData = convertDirectory(maxFreuDir, 'max-freu');

const total = wishesData.stats.converted + bgData.stats.converted + maxFreuData.stats.converted;
// Generate image-data.json with lists of files
// (MOVED to generate-image-list.js)
console.log(`\n🎉 Done! Converted ${total} images to WebP`);
console.log('💾 Original PNG files kept as fallback');




