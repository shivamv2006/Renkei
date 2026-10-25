import sharp from 'sharp';
import fs from 'fs';

const outDir = 'C:/Games/GENZOKU/public/avatars';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Sheet 1 & 2: 1024 x 572
// 5 cols, 3 rows
// Let's determine column centers and row centers:
// Row 0: y ~ 100, radius ~ 80 (box size ~ 160)
// Row 1: y ~ 286, radius ~ 80
// Row 2: y ~ 472, radius ~ 80
// Col 0: x ~ 140
// Col 1: x ~ 325
// Col 2: x ~ 512
// Col 3: x ~ 699
// Col 4: x ~ 884

// Let's test a slice of row 0, col 2 (center avatar)
const avatarSize = 170;
// Test crop
await sharp('C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792865239627_6d2ca615.jpg')
  .extract({ left: Math.round(512 - avatarSize/2), top: Math.round(95 - avatarSize/2), width: avatarSize, height: avatarSize })
  .toFile('C:/Games/GENZOKU/public/avatars/test_center.png');

console.log('Saved test_center.png');
