import sharp from 'sharp';
import fs from 'fs';

const avatarDir = 'C:/Games/GENZOKU/public/avatars';
const iconsDir = 'C:/Games/GENZOKU/public/icons';
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const img1 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792864989181_b4fb0ab4.png';
const img2 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792865239627_6d2ca615.jpg';
const img3 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792865252441_9dc1236b.jpg';

// 1. Slice all 30 avatars (15 from sheet 1, 15 from sheet 2)
const colX = [116, 314, 512, 710, 908];
const rowY = [95, 286, 477];
const size = 176;

const avatarNames = [
  // Sheet 1 (1 to 15)
  'Aiko Star', 'Shinji Cyber', 'Lumina Beats', 'Kael Sunshine', 'Sora Frost',
  'Hinata Spark', 'Yuki Forest', 'Riku Mecha', 'Neko Gamer', 'Miles Urban',
  'Maya Glam', 'Tariq Smart', 'Kira Neon', 'Viper Prism', 'Mei Blossom',
  // Sheet 2 (16 to 30)
  'Rei Goth', 'Ren Wildfire', 'Hana Pastel', 'Leo Nomad', 'Chloe Idol',
  'Daiki Ember', 'Kage Eclipse', 'Zero Holo', 'Aoi Cozy', 'Jordan Street',
  'Roxie Pop', 'Kenji Tech', 'Cynthia Flow', 'Tatsuya Dread', 'Kuro Neko'
];

let idx = 0;
// Sheet 1
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 5; c++) {
    const filename = `renkei_avatar_${String(idx + 1).padStart(2, '0')}.png`;
    await sharp(img2)
      .extract({
        left: Math.round(colX[c] - size/2),
        top: Math.round(rowY[r] - size/2),
        width: size,
        height: size,
      })
      .toFile(`${avatarDir}/${filename}`);
    idx++;
  }
}

// Sheet 2
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 5; c++) {
    const filename = `renkei_avatar_${String(idx + 1).padStart(2, '0')}.png`;
    await sharp(img3)
      .extract({
        left: Math.round(colX[c] - size/2),
        top: Math.round(rowY[r] - size/2),
        width: size,
        height: size,
      })
      .toFile(`${avatarDir}/${filename}`);
    idx++;
  }
}

console.log(`Successfully generated ${idx} avatars!`);

// 2. Extract App Icons from logo sheet
// Let's crop the 4 App Icons and main glowing R logos
// 01 Cyber App Icon: x ~ 395, y ~ 170, w ~ 70, h ~ 70
// Main Cyber R Logo: x ~ 100, y ~ 140, w ~ 90, h ~ 100
await sharp(img1)
  .extract({ left: 362, top: 110, width: 70, height: 70 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile('C:/Games/GENZOKU/public/icons/renkei_app_icon_cyber.png');

await sharp(img1)
  .extract({ left: 874, top: 110, width: 70, height: 70 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile('C:/Games/GENZOKU/public/icons/renkei_app_icon_sunset.png');

await sharp(img1)
  .extract({ left: 362, top: 396, width: 70, height: 70 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile('C:/Games/GENZOKU/public/icons/renkei_app_icon_mint.png');

await sharp(img1)
  .extract({ left: 874, top: 396, width: 70, height: 70 })
  .resize(192, 192, { kernel: 'lanczos3' })
  .toFile('C:/Games/GENZOKU/public/icons/renkei_app_icon_sapphire.png');

// Primary App Icon (192 and 512)
await sharp('C:/Games/GENZOKU/public/icons/renkei_app_icon_cyber.png')
  .toFile('C:/Games/GENZOKU/public/icon-192.png');

await sharp('C:/Games/GENZOKU/public/icons/renkei_app_icon_cyber.png')
  .resize(512, 512)
  .toFile('C:/Games/GENZOKU/public/icon-512.png');

console.log('App icons generated!');
