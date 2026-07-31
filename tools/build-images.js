/* Generate smaller WebP derivatives for images that render far below their native size.
   Keeps the original crop and aspect ratio, so they are safe srcset candidates.
   Run: node build-images.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assets = path.join(__dirname, '..', 'public', 'assets');

const jobs = [];
// product cards render ~380px on desktop, full width on phones
for (const f of fs.readdirSync(assets).filter(n => /^product-.*\.webp$/.test(n)))
  jobs.push({ src: path.join(assets, f), width: 640, suffix: '-640' });
// application panels render ~400px wide
for (const f of fs.readdirSync(assets).filter(n => /^app-.*\.webp$/.test(n)))
  jobs.push({ src: path.join(assets, f), width: 700, suffix: '-700' });
// four hero stills are reused as category cards (max ~580px wide there)
for (const n of ['hero-01', 'hero-02', 'hero-05', 'hero-09'])
  jobs.push({ src: path.join(assets, 'hero', n + '.webp'), width: 1200, suffix: '-card' });

(async () => {
  let saved = 0, made = 0;
  for (const job of jobs) {
    const meta = await sharp(job.src).metadata();
    if (meta.width <= job.width) { console.log('skip (already small):', path.basename(job.src)); continue; }
    const out = job.src.replace(/\.webp$/, job.suffix + '.webp');
    await sharp(job.src).resize({ width: job.width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(out);
    const a = fs.statSync(job.src).size, b = fs.statSync(out).size;
    saved += a - b; made++;
    console.log(`${path.basename(out).padEnd(34)} ${meta.width}px -> ${job.width}px   ${(a / 1024).toFixed(0)} KB -> ${(b / 1024).toFixed(0)} KB`);
  }
  console.log(`\nderivatives created: ${made}`);
  console.log(`bytes saved when the smaller file is served: ${(saved / 1024 / 1024).toFixed(2)} MB total across all images`);
})();
