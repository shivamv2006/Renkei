import sharp from 'sharp';
import fs from 'fs';

const icon512 = 'C:/Games/GENZOKU/public/icon-512.png';

// Android mipmap sizes
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
    await sharp(icon512).resize(m.size, m.size).toFile(`${dir}/ic_launcher.png`);
    await sharp(icon512).resize(m.size, m.size).toFile(`${dir}/ic_launcher_round.png`);
  }
}

// iOS AppIcon
const iosDir = 'C:/Games/GENZOKU/ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (fs.existsSync(iosDir)) {
  await sharp(icon512).resize(1024, 1024).toFile(`${iosDir}/AppIcon-512@2x.png`);
}

console.log('Mobile icons updated for Android and iOS!');
