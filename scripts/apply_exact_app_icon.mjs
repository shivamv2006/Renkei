import sharp from 'sharp';
import fs from 'fs';

const img = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792867601036_ddc961c4.png';
const iconsDir = 'C:/Games/GENZOKU/public/icons';
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// 1. Exact App Icon from the image (left: 450, top: 85, width: 96, height: 96)
// Generate 512x512
await sharp(img)
  .extract({ left: 450, top: 85, width: 96, height: 96 })
  .resize(512, 512, { kernel: 'lanczos3' })
  .png()
  .toFile('C:/Games/GENZOKU/public/icon-512.png');

// Generate 192x192
await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .png()
  .toFile('C:/Games/GENZOKU/public/icon-192.png');

// Generate favicon
await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(64, 64)
  .png()
  .toFile('C:/Games/GENZOKU/public/favicon.ico');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(64, 64)
  .png()
  .toFile('C:/Games/GENZOKU/public/favicon.png');

// Copy to icons dir
await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile(`${iconsDir}/renkei_app_icon.png`);

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile(`${iconsDir}/renkei_app_icon_sapphire.png`);

// 2. Exact Big Glowing R (left: 125, top: 100, width: 110, height: 125)
await sharp(img)
  .extract({ left: 125, top: 100, width: 110, height: 125 })
  .resize(256, 290, { kernel: 'lanczos3' })
  .png()
  .toFile(`${iconsDir}/renkei_r_sapphire.png`);

// 3. Update Android mipmaps
const androidMipmaps = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

for (const m of androidMipmaps) {
  const dir = `C:/Games/GENZOKU/android/app/src/main/res/${m.folder}`;
  if (fs.existsSync(dir)) {
    await sharp('C:/Games/GENZOKU/public/icon-512.png').resize(m.size, m.size).toFile(`${dir}/ic_launcher.png`);
    await sharp('C:/Games/GENZOKU/public/icon-512.png').resize(m.size, m.size).toFile(`${dir}/ic_launcher_round.png`);
  }
}

// 4. Update iOS AppIcon
const iosDir = 'C:/Games/GENZOKU/ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (fs.existsSync(iosDir)) {
  await sharp('C:/Games/GENZOKU/public/icon-512.png').resize(1024, 1024).toFile(`${iosDir}/AppIcon-512@2x.png`);
}

console.log('Exact App Icon and Mobile Assets updated successfully!');
