/* Attach srcset/sizes to images that have a smaller derivative, so browsers can pick
   the cheaper file instead of always downloading the full-size original.
   Idempotent: skips any img that already has a srcset. Run: node build-srcset.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const pub = path.join(__dirname, '..', 'public');

// which derivative and which layout sizes apply to each family of images
const rules = [
  { test: /^assets\/product-([a-z-]+)\.webp$/, suffix: '-640', small: 640,
    sizes: '(max-width:640px) calc(100vw - 40px), (max-width:960px) calc(50vw - 40px), 380px' },
  { test: /^assets\/app-([a-z-]+)\.webp$/, suffix: '-700', small: 700,
    sizes: '(max-width:760px) calc(100vw - 40px), (max-width:960px) calc(50vw - 30px), 400px' },
  { test: /^assets\/hero\/(hero-0[1259])\.webp$/, suffix: '-card', small: 1200,
    sizes: '(max-width:760px) calc(100vw - 40px), (max-width:960px) calc(50vw - 30px), 580px' },
];

const widthCache = new Map();
const nativeWidth = async rel => {
  if (!widthCache.has(rel)) widthCache.set(rel, (await sharp(path.join(pub, rel)).metadata()).width);
  return widthCache.get(rel);
};

(async () => {
  let total = 0;
  for (const file of ['index.html', 'products.html', 'about.html', 'contact.html']) {
    const p = path.join(pub, file);
    let html = fs.readFileSync(p, 'utf8');
    const imgs = [...html.matchAll(/<img\s[^>]*?>/g)].map(m => m[0]);
    let changed = 0;

    for (const tag of new Set(imgs)) {
      if (/\ssrcset=/.test(tag) || /\sdata-src=/.test(tag)) continue;      // already responsive, or a deferred hero slide
      const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
      if (!src) continue;
      const rule = rules.find(r => r.test.test(src));
      if (!rule) continue;
      const derivative = src.replace(/\.webp$/, rule.suffix + '.webp');
      if (!fs.existsSync(path.join(pub, derivative))) continue;

      const full = await nativeWidth(src);
      const srcset = `${derivative} ${rule.small}w, ${src} ${full}w`;
      const updated = tag.replace(/<img\s/, `<img srcset="${srcset}" sizes="${rule.sizes}" `);
      html = html.split(tag).join(updated);
      changed++;
    }

    fs.writeFileSync(p, html, 'utf8');
    total += changed;
    console.log(`${file.padEnd(15)} images made responsive: ${changed}`);
  }
  console.log('total:', total);
})();
