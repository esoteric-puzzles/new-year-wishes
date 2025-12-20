const fs = require('fs');
const path = require('path');

const wishesDir = path.join(__dirname, 'src', 'assets', 'images', 'wishes');
const backgroundsDir = path.join(__dirname, 'src', 'assets', 'images', 'backgrounds');
const maxFreuDir = path.join(__dirname, 'src', 'assets', 'images', 'max-freu');
const outputFile = path.join(__dirname, 'src', 'assets', 'image-data.json');

console.log('📋 Generating image list...');

function getNumericFiles(directory) {
    if (!fs.existsSync(directory)) {
        console.warn(`⚠️ Directory not found: ${directory}`);
        return [];
    }

    const files = fs.readdirSync(directory)
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'))
        .map(f => path.parse(f).name);

    // Filter for numeric filenames only and sort them numerically
    const numericFiles = files
        .filter(name => !isNaN(parseInt(name)))
        .sort((a, b) => parseInt(a) - parseInt(b));

    // Remove duplicates (e.g. if both 1.png and 1.webp exist)
    return [...new Set(numericFiles)];
}

const wishes = getNumericFiles(wishesDir);
const maxFreu = getNumericFiles(maxFreuDir);
const backgrounds = getNumericFiles(backgroundsDir);

const imageData = {
    wishes: wishes,
    'max-freu': maxFreu,
    backgrounds: backgrounds
};

fs.writeFileSync(outputFile, JSON.stringify(imageData, null, 2));

console.log(`✅ Saved to ${outputFile}`);
console.log(`   - Wishes: ${wishes.length}`);
console.log(`   - Max Frei: ${maxFreu.length}`);
console.log(`   - Backgrounds: ${backgrounds.length}`);
