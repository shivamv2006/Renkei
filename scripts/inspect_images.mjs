import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const img1 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792864989181_b4fb0ab4.png';
const img2 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792865239627_6d2ca615.jpg';
const img3 = 'C:/Users/sv910/.gemini/antigravity/brain/64e13f4c-1e97-45f0-92b1-660e0cf1fa3c/.user_uploaded/media_1792865252441_9dc1236b.jpg';

const m1 = await sharp(img1).metadata();
const m2 = await sharp(img2).metadata();
const m3 = await sharp(img3).metadata();

console.log('Logo sheet:', m1.width, 'x', m1.height);
console.log('Avatar sheet 1:', m2.width, 'x', m2.height);
console.log('Avatar sheet 2:', m3.width, 'x', m3.height);
