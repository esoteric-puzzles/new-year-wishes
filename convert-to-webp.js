const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const wishesDir = path.join(__dirname, 'src', 'assets', 'images', 'wishes');
const backgroundsDir = path.join(__dirname, 'src', 'assets', 'images', 'backgrounds');

console.log('🔄 Converting PNG to WebP...\n');

function convertDirectory(directory, dirName) {
  console.log(`📁 Processing ${dirName}...`);
  
  const files = fs.readdirSync(directory)
    .filter(f => f.endsWith('.png'));
  
  let converted = 0;
  let skipped = 0;
  
  files.forEach(file => {
    const pngPath = path.join(directory, file);
    const webpPath = pngPath.replace('.png', '.webp');
    
    // Check if WebP already exists and is newer
    if (fs.existsSync(webpPath)) {
      const pngStat = fs.statSync(pngPath);
      const webpStat = fs.statSync(webpPath);
      
      if (webpStat.mtime > pngStat.mtime) {
        skipped++;
        return;
      }
    }
    
    try {
      // Convert with quality 80
      execSync(`cwebp -q 80 "${pngPath}" -o "${webpPath}"`, { stdio: 'ignore' });
      
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
  return { converted, skipped };
}

// Check if cwebp is installed
try {
  execSync('which cwebp', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ cwebp not found!');
  console.log('\n💡 Install it:');
  console.log('   macOS: brew install webp');
  console.log('   Ubuntu: sudo apt install webp');
  process.exit(1);
}

// Convert wishes
const wishesStats = convertDirectory(wishesDir, 'wishes');

// Convert backgrounds  
const bgStats = convertDirectory(backgroundsDir, 'backgrounds');

const total = wishesStats.converted + bgStats.converted;
console.log(`\n🎉 Done! Converted ${total} images to WebP`);
console.log('💾 Original PNG files kept as fallback');



