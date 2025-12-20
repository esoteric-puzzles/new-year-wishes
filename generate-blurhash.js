const { encode } = require('blurhash');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const wishesDir = path.join(__dirname, 'src', 'assets', 'images', 'wishes');
const outputFile = path.join(__dirname, 'src', 'assets', 'blurhash.json');

async function generateBlurhash(imagePath) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(0, 0, image.width, image.height);
  const blurhash = encode(imageData.data, imageData.width, imageData.height, 4, 3);

  return {
    hash: blurhash,
    width: image.width,
    height: image.height
  };
}

async function processDirectory(dirPath, prefix = '', existingHashes = {}) {
  const blurhashes = {};

  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found: ${dirPath}`);
    return {};
  } else {
    console.log(`Debug: Directory found: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.png'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });

  let skipped = 0;
  let processed = 0;

  for (const file of files) {
    const imagePath = path.join(dirPath, file);
    const fileName = path.parse(file).name;
    const key = prefix ? `${prefix}/${fileName}` : fileName;

    if (existingHashes[key]) {
      blurhashes[key] = existingHashes[key];
      skipped++;
      continue;
    }

    try {
      console.log(`Processing: ${prefix ? prefix + '/' : ''}${file}...`);
      const data = await generateBlurhash(imagePath);
      blurhashes[key] = data;
      console.log(`✅ ${key}: ${data.hash.substring(0, 10)}... (${data.width}x${data.height})`);
      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  console.log(`  Stats: ${processed} new, ${skipped} reused`);
  return blurhashes;
}

async function processAllImages() {
  console.log('🎨 Generating blurhashes...\n');

  let existingHashes = {};
  if (fs.existsSync(outputFile)) {
    try {
      existingHashes = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      console.log('📚 Loaded existing hashes to skip regeneration');
    } catch (e) {
      console.warn('⚠️ Could not read existing blurhash.json, starting fresh.');
    }
  }

  console.log('\n📁 Processing wishes...');
  const wishesHashes = await processDirectory(
    path.join(__dirname, 'src', 'assets', 'images', 'wishes'),
    '', // No prefix for wishes
    existingHashes
  );

  console.log('\n📁 Processing max-freu...');
  const maxFreuHashes = await processDirectory(
    path.join(__dirname, 'src', 'assets', 'images', 'max-freu'),
    'max-freu', // Prefix
    existingHashes
  );

  const allHashes = { ...wishesHashes, ...maxFreuHashes };

  fs.writeFileSync(outputFile, JSON.stringify(allHashes, null, 2));
  console.log(`\n🎉 Done! Generated ${Object.keys(allHashes).length} blurhashes`);
  console.log(`📝 Saved to: ${outputFile}`);
}

processAllImages().catch(console.error);


