/* Generate the exact icon sizes Google documents as examples (48, 96) from the master
   logo, and place apple-touch-icon at the domain root where some crawlers request it.
   Run: node tools/build-favicons.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const pub = path.join(__dirname, '..', 'public');
const master = path.join(pub, 'assets', 'abhiram_enterprises_logo.png');

(async () => {
  for (const size of [48, 96]) {
    const out = path.join(pub, 'assets', 'favicons', `favicon-${size}x${size}.png`);
    await sharp(master).resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ compressionLevel: 9 }).toFile(out);
    console.log(`favicon-${size}x${size}.png  ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
  }
  // some crawlers and older iOS request this at the root, not via the link tag
  fs.copyFileSync(path.join(pub, 'assets', 'favicons', 'apple-touch-icon.png'), path.join(pub, 'apple-touch-icon.png'));
  console.log('copied apple-touch-icon.png to site root');
})();
