import sharp from 'sharp';

const img2 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792865239627_6d2ca615.jpg';

// Let's test Col 0 and Col 4
const size = 176;
const colX = [102, 307, 512, 717, 922];
const rowY = [95, 286, 477];

for (let c = 0; c < 5; c++) {
  await sharp(img2)
    .extract({
      left: Math.round(colX[c] - size/2),
      top: Math.round(rowY[0] - size/2),
      width: size,
      height: size
    })
    .toFile(`C:/Games/GENZOKU/public/avatars/test_r0_c${c}.png`);
}

for (let r = 0; r < 3; r++) {
  await sharp(img2)
    .extract({
      left: Math.round(colX[0] - size/2),
      top: Math.round(rowY[r] - size/2),
      width: size,
      height: size
    })
    .toFile(`C:/Games/GENZOKU/public/avatars/test_r${r}_c0.png`);
}
console.log('Tested row 0 cols and col 0 rows');
