/* Prove the footer product list resolves to a real two-column grid.
   The earlier bug was a cascade conflict: .footer-links{display:grid} beat
   .footer-products{display:block;column-count:2}, and multi-column is ignored on
   a grid container. This asserts the computed style, not just the source text. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dir = path.join(__dirname, '..', 'public');
const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');

// build the footer list exactly as script.js does
const productCount = (fs.readFileSync(path.join(dir, 'script.js'), 'utf8')
  .match(/\['[^']+','(?:building|plumbing|electrical|hardware)'\]/g) || []).length;
const rows = Math.ceil(productCount / 2);
const links = Array.from({ length: productCount }, (_, i) => `<a href="#">Item ${i + 1}</a>`).join('');

const dom = new JSDOM(
  `<!doctype html><html><head><style>${css}</style></head><body>` +
  `<div class="footer-links footer-products" style="--rows:${rows}">${links}</div></body></html>`
);
const el = dom.window.document.querySelector('.footer-products');
const cs = dom.window.getComputedStyle(el);
const fails = [];

if (cs.display !== 'grid') fails.push(`display is "${cs.display}", expected grid`);
if (cs.columnCount && cs.columnCount !== 'auto') fails.push(`column-count still set to ${cs.columnCount} (ignored on grid, so it would render one column)`);
if (!/column/.test(cs.gridAutoFlow || '')) fails.push(`grid-auto-flow is "${cs.gridAutoFlow}", expected column`);
if (!/var\(--rows|repeat/.test(cs.gridTemplateRows || '')) fails.push(`grid-template-rows is "${cs.gridTemplateRows}"`);

const anchor = dom.window.getComputedStyle(el.querySelector('a'));
if (anchor.marginBottom && anchor.marginBottom !== '0px') fails.push(`link margin-bottom ${anchor.marginBottom} doubles the grid gap`);

console.log(`products in list  : ${productCount}`);
console.log(`rows per column   : ${rows}  -> ${productCount / rows} columns`);
console.log(`computed display  : ${cs.display}`);
console.log(`grid-auto-flow    : ${cs.gridAutoFlow}`);
console.log(`grid-template-rows: ${cs.gridTemplateRows}`);
console.log(`column-count      : ${cs.columnCount || 'auto'}`);
console.log(`link margin-bottom: ${anchor.marginBottom || '0px'}`);
console.log(fails.length ? 'FAILURES:\n  ' + fails.join('\n  ') : 'ALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
