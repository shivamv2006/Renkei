import sharp from 'sharp';
import fs from 'fs';

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#050811" />
      <stop offset="100%" stop-color="#020307" />
    </radialGradient>

    <!-- Neon Rim Glow Gradient -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#6366f1" stop-opacity="0.6" />
      <stop offset="70%" stop-color="#ec4899" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.4" />
    </linearGradient>

    <!-- Nexus R Gradient -->
    <linearGradient id="rGrad" x1="15%" y1="10%" x2="90%" y2="95%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="35%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Radial Cyan Bloom Behind R -->
    <radialGradient id="centerBloom" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#6366f1" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Inner Glow Filter -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Base Squircle Background -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGlow)" />
  <rect x="16" y="16" width="480" height="480" rx="108" stroke="url(#rimGrad)" stroke-width="6" stroke-opacity="0.85" />
  <rect x="26" y="26" width="460" height="460" rx="98" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.08" />

  <!-- Center Ambient Radial Bloom -->
  <circle cx="256" cy="256" r="190" fill="url(#centerBloom)" />

  <!-- Futuristic Corner Cyber Crosshairs -->
  <path d="M 64 88 L 64 64 L 88 64" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" opacity="0.6" />
  <path d="M 448 88 L 448 64 L 424 64" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" opacity="0.6" />
  <path d="M 64 424 L 64 448 L 88 448" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" opacity="0.6" />
  <path d="M 448 424 L 448 448 L 424 448" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" opacity="0.6" />

  <!-- Subtle Concentric Cyber Circles -->
  <circle cx="256" cy="256" r="185" stroke="#38bdf8" stroke-width="2" stroke-dasharray="16 12" opacity="0.25" />
  <circle cx="256" cy="256" r="145" stroke="url(#rimGrad)" stroke-width="3" stroke-dasharray="24 16 8 16" opacity="0.5" />

  <!-- Outer Orbiting Nexus Quantum Ring -->
  <g filter="url(#softGlow)">
    <circle cx="256" cy="256" r="172" stroke="url(#rGrad)" stroke-width="3.5" stroke-dasharray="55 20 15 20" opacity="0.75" />
  </g>

  <!-- Orbiting Nexus Nodes -->
  <circle cx="256" cy="84" r="7" fill="#00f0ff" filter="url(#neonGlow)" />
  <circle cx="415" cy="320" r="5.5" fill="#f43f5e" filter="url(#neonGlow)" />
  <circle cx="97" cy="256" r="5" fill="#38bdf8" />
  <circle cx="340" cy="115" r="4" fill="#ffffff" />

  <!-- High-Tech Central Capital 'R' Emblem -->
  <!-- Backing shadow for extreme contrast & depth -->
  <path
    d="M 160 120 L 290 120 C 352 120, 396 160, 396 220 C 396 268, 360 302, 305 312 L 395 400 L 330 400 L 248 318 L 210 318 L 210 400 L 160 400 Z"
    fill="#02050d"
    opacity="0.9"
  />

  <!-- Main Glow pass -->
  <g filter="url(#softGlow)">
    <path
      d="M 160 120 L 290 120 C 352 120, 396 160, 396 220 C 396 268, 360 302, 305 312 L 395 400 L 330 400 L 248 318 L 210 318 L 210 400 L 160 400 Z"
      fill="none"
      stroke="url(#rGrad)"
      stroke-width="14"
      stroke-linejoin="round"
      stroke-linecap="round"
      opacity="0.7"
    />
  </g>

  <!-- Crisp Core Stroke -->
  <path
    d="M 160 120 L 290 120 C 352 120, 396 160, 396 220 C 396 268, 360 302, 305 312 L 395 400 L 330 400 L 248 318 L 210 318 L 210 400 L 160 400 Z"
    fill="url(#rGrad)"
    fill-opacity="0.12"
    stroke="url(#rGrad)"
    stroke-width="26"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  <!-- High-Tech Inner Hollow of the R -->
  <path
    d="M 218 172 L 285 172 C 322 172, 342 192, 342 222 C 342 252, 322 268, 285 268 L 218 268 Z"
    fill="#040814"
    stroke="url(#rGrad)"
    stroke-width="12"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  <!-- Cyan High-Voltage Core Laser Beam in R stem -->
  <line x1="184" y1="140" x2="184" y2="380" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.9" filter="url(#neonGlow)" />
  <line x1="184" y1="140" x2="184" y2="380" stroke="#00f0ff" stroke-width="8" stroke-linecap="round" opacity="0.7" />

  <!-- Sparkling Apex Nexus Crystals -->
  <circle cx="160" cy="120" r="9" fill="#ffffff" filter="url(#neonGlow)" />
  <circle cx="395" cy="400" r="10" fill="#00f0ff" filter="url(#neonGlow)" />
  <circle cx="396" cy="220" r="8" fill="#f43f5e" filter="url(#neonGlow)" />
</svg>
`;

const iconsDir = 'C:/Games/GENZOKU/public/icons';
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Convert SVG to 512x512 PNG
const svgBuffer = Buffer.from(svg);

await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('C:/Games/GENZOKU/public/icon-512.png');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .png()
  .toFile('C:/Games/GENZOKU/public/icon-192.png');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(64, 64)
  .png()
  .toFile('C:/Games/GENZOKU/public/favicon.png');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(64, 64)
  .toFile('C:/Games/GENZOKU/public/favicon.ico');

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile(`${iconsDir}/renkei_app_icon.png`);

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile(`${iconsDir}/renkei_app_icon_cyber.png`);

await sharp('C:/Games/GENZOKU/public/icon-512.png')
  .resize(192, 192)
  .toFile(`${iconsDir}/renkei_app_icon_sapphire.png`);

// Update Android mipmaps
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

// Update iOS AppIcon
const iosDir = 'C:/Games/GENZOKU/ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (fs.existsSync(iosDir)) {
  await sharp('C:/Games/GENZOKU/public/icon-512.png').resize(1024, 1024).toFile(`${iosDir}/AppIcon-512@2x.png`);
}

console.log('Gorgeous new Cyber-Nexus App Icon generated and applied across Android & Web!');
