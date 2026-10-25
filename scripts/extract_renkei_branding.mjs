import sharp from 'sharp';

const img1 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792864989181_b4fb0ab4.png';
const iconsDir = 'C:/Games/GENZOKU/public/icons';

// 1. Exact Glowing R Logos (105 width x 115 height)
// 01 Cyber
await sharp(img1)
  .extract({ left: 95, top: 55, width: 105, height: 115 })
  .resize(256, 280, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_r_cyber.png`);

// 02 Sunset
await sharp(img1)
  .extract({ left: 95 + 512, top: 55, width: 105, height: 115 })
  .resize(256, 280, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_r_sunset.png`);

// 03 Mint
await sharp(img1)
  .extract({ left: 95, top: 55 + 286, width: 105, height: 115 })
  .resize(256, 280, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_r_mint.png`);

// 04 Sapphire
await sharp(img1)
  .extract({ left: 95 + 512, top: 55 + 286, width: 105, height: 115 })
  .resize(256, 280, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_r_sapphire.png`);

// 2. Exact Squircle App Icons
// 01 Cyber
await sharp(img1)
  .extract({ left: 362, top: 112, width: 66, height: 66 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_app_icon_cyber.png`);

// 02 Sunset
await sharp(img1)
  .extract({ left: 362 + 512, top: 112, width: 66, height: 66 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_app_icon_sunset.png`);

// 03 Mint
await sharp(img1)
  .extract({ left: 362, top: 112 + 286, width: 66, height: 66 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_app_icon_mint.png`);

// 04 Sapphire
await sharp(img1)
  .extract({ left: 362 + 512, top: 112 + 286, width: 66, height: 66 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile(`${iconsDir}/renkei_app_icon_sapphire.png`);

// 3. Update PWA and browser icons
await sharp(`${iconsDir}/renkei_app_icon_cyber.png`)
  .resize(192, 192)
  .toFile('C:/Games/GENZOKU/public/icon-192.png');

await sharp(`${iconsDir}/renkei_app_icon_cyber.png`)
  .resize(512, 512)
  .toFile('C:/Games/GENZOKU/public/icon-512.png');

await sharp(`${iconsDir}/renkei_app_icon_cyber.png`)
  .resize(64, 64)
  .toFile('C:/Games/GENZOKU/public/favicon.ico');

console.log('Logos and icons re-extracted!');
