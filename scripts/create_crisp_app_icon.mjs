import sharp from 'sharp';

const iconsDir = 'C:/Games/GENZOKU/public/icons';

// Create 512x512 squircle background with subtle gradient & border
const size = 512;
const rx = 120;
const bgSvg = Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="appBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e1322" />
      <stop offset="100%" stop-color="#050811" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#c026d3" stop-opacity="0.4" />
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="496" height="496" rx="${rx}" fill="url(#appBg)" stroke="url(#borderGrad)" stroke-width="6" />
</svg>
`);

// Resize glowing R to fit nicely inside the 512x512 container (~320px)
const rLogoBuffer = await sharp(`${iconsDir}/renkei_r_cyber.png`)
  .resize(320, 350, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

await sharp(bgSvg)
  .composite([
    {
      input: rLogoBuffer,
      gravity: 'center'
    }
  ])
  .png()
  .toFile('C:/Games/GENZOKU/public/icon-512.png');

// Also create 192x192
await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile('C:/Games/GENZOKU/public/icon-192.png');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(64, 64)
  .toFile('C:/Games/GENZOKU/public/favicon.ico');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile(`${iconsDir}/renkei_app_icon_cyber.png`);

console.log('Crisp 512x512 and 192x192 Renkei App Icons created!');
