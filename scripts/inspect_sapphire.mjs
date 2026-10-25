import sharp from 'sharp';

const img = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792867601036_ddc961c4.png';
const m = await sharp(img).metadata();
console.log('Sapphire image size:', m.width, 'x', m.height);
