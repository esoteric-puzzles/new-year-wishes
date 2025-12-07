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

async function processAllImages() {
  const blurhashes = {};
  
  console.log('🎨 Generating blurhashes for wish images...\n');
  
  const files = fs.readdirSync(wishesDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
  
  for (const file of files) {
    const imagePath = path.join(wishesDir, file);
    const fileName = path.parse(file).name;
    
    try {
      console.log(`Processing: ${file}...`);
      const data = await generateBlurhash(imagePath);
      blurhashes[fileName] = data;
      console.log(`✅ ${file}: ${data.hash} (${data.width}x${data.height})\n`);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message, '\n');
    }
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(blurhashes, null, 2));
  console.log(`\n🎉 Done! Generated ${Object.keys(blurhashes).length} blurhashes`);
  console.log(`📝 Saved to: ${outputFile}`);
}

processAllImages().catch(console.error);

