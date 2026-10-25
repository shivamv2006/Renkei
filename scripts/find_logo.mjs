import sharp from 'sharp';

const img1 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792864989181_b4fb0ab4.png';

// Let's test a slice centered at the big glowing R logo
// Big glowing R is prominent on the left
await sharp(img1)
  .extract({ left: 80, top: 120, width: 140, height: 160 })
  .toFile('C:/Games/GENZOKU/public/icons/test_big_r.png');

// App icon is under "App Icon"
await sharp(img1)
  .extract({ left: 360, top: 100, width: 75, height: 75 })
  .toFile('C:/Games/GENZOKU/public/icons/test_app_icon.png');
