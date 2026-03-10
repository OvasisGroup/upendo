const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 384, 512];
const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  for (const size of sizes) {
    const outputPath = path.join(__dirname, '..', 'public', `icon-${size}x${size}.png`);
    
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created icon-${size}x${size}.png`);
  }

  // Also create favicon
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  
  console.log('✓ Created favicon.ico');
  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
