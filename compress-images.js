const { execSync } = require('child_process');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets');

console.log('🗜️  Compressing images in src/assets...\n');

try {
  // Compress PNG files
  console.log('📦 Compressing PNG files...');
  execSync(
    `find "${assetsDir}" -name "*.png" -exec pngquant --quality=60-80 --ext .png --force {} \\;`,
    { stdio: 'inherit' }
  );
  console.log('✅ PNG compression complete!\n');
} catch (error) {
  console.log('⚠️  PNG compression skipped (pngquant not installed)\n');
}

try {
  // Compress JPG files
  console.log('📦 Compressing JPG/JPEG files...');
  execSync(
    `find "${assetsDir}" -type f \\( -name "*.jpg" -o -name "*.jpeg" \\) -exec jpegoptim --max=80 --strip-all {} \\;`,
    { stdio: 'inherit' }
  );
  console.log('✅ JPG compression complete!\n');
} catch (error) {
  console.log('⚠️  JPG compression skipped (jpegoptim not installed)\n');
}

console.log('🎉 Image compression finished!');
console.log('\n💡 To install tools:');
console.log('   macOS: brew install pngquant jpegoptim');
console.log('   Ubuntu: sudo apt install pngquant jpegoptim');

