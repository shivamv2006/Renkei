import sharp from 'sharp';

const img = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792867601036_ddc961c4.png';

// Image is 632 wide by 360 high
// "App Icon" text is centered around x: 495, y: 68
// The squircle icon is around x: 450 to 540, y: 90 to 180
await sharp(img)
  .extract({ left: 450, top: 85, width: 96, height: 96 })
  .resize(512, 512, { kernel: 'lanczos3' })
  .toFile('C:/Games/GENZOKU/public/icons/test_sapphire_icon.png');

// Also test the big glowing R on the left:
// "04. Ice Sapphire" text is at top left
// Big glowing R is around x: 130 to 230, y: 100 to 220
await sharp(img)
  .extract({ left: 125, top: 100, width: 110, height: 125 })
  .resize(512, 582, { kernel: 'lanczos3' })
  .toFile('C:/Games/GENZOKU/public/icons/test_sapphire_big_r.png');

console.log('Crops generated!');
