/* Integration check: load a real page with icons.js + script.js in jsdom and verify
   the injected chrome, icon rendering and the new hero lazy-loading behaviour. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

void (async () => {
const page = process.argv[2] || 'index.html';
const dir = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(dir, page), 'utf8')
  // strip remote stylesheet/font requests; we only care about script behaviour
  .replace(/<link[^>]*fonts\.(?:googleapis|gstatic)[^>]*>/g, '');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', m => errors.push('console.error: ' + m));

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'https://www.abhiramenterprises.com/' + page });
const { window } = dom;
const doc = window.document;

/* jsdom lacks matchMedia, which every supported browser provides. Shim it so the test
   exercises the real code path. IntersectionObserver and requestIdleCallback are left
   undefined on purpose: the site guards both, and this proves those fallbacks work. */
window.matchMedia = q => ({ media: q, matches: false, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false });

const heroImgs = () => [...doc.querySelectorAll('[data-hero-slide] img')];
const before = { withSrc: heroImgs().filter(i => i.getAttribute('src')).length, deferred: heroImgs().filter(i => i.getAttribute('data-src')).length };

try {
  window.eval(fs.readFileSync(path.join(dir, 'icons.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(dir, 'script.js'), 'utf8'));
} catch (e) { errors.push('script threw: ' + e.message); }

const fails = [];
const has = (sel, label) => { if (!doc.querySelector(sel)) fails.push('missing ' + label); };

// body.is-ready is added inside requestAnimationFrame, so let a frame pass before asserting
await new Promise(r => setTimeout(r, 120));

has('.site-header .brand', 'header brand');
has('.desktop-nav .nav-link', 'desktop nav links');
has('.menu-toggle', 'mobile menu toggle');
has('.site-footer .footer-grid', 'footer grid');
has('.wa-toggle', 'whatsapp toggle');

const leftover = doc.querySelectorAll('[data-lucide]').length;
const svgCount = doc.querySelectorAll('svg').length;
if (leftover) fails.push(`${leftover} unconverted icon placeholders`);
if (svgCount < 10) fails.push(`only ${svgCount} svgs rendered`);

if (doc.querySelector('#year') && !doc.querySelector('#year').textContent.trim()) fails.push('year not filled');
if (!doc.body.classList.contains('is-ready')) fails.push('body never marked ready (page would stay invisible)');

// logo must point at the optimised file
const logos = [...doc.querySelectorAll('.brand img')].map(i => i.getAttribute('src'));
if (logos.some(s => s && s.includes('abhiram_enterprises_logo'))) fails.push('brand still uses the 836 KB master logo');

if (page === 'index.html') {
  if (before.withSrc !== 1) fails.push(`expected 1 eager hero image, found ${before.withSrc}`);
  if (before.deferred !== 6) fails.push(`expected 6 deferred hero images, found ${before.deferred}`);
  // advancing the carousel must attach the next slide's source
  const dots = [...doc.querySelectorAll('.hero-dot')];
  if (dots.length !== 7) fails.push(`expected 7 hero dots, found ${dots.length}`);
  dots[3] && dots[3].dispatchEvent(new window.Event('click', { bubbles: true }));
  const slides = [...doc.querySelectorAll('[data-hero-slide]')];
  const loadedNow = slides.filter(s => s.dataset.loaded).length;
  if (!slides[3].dataset.loaded) fails.push('selected slide did not load its image');
  if (!slides[4].dataset.loaded) fails.push('next slide was not preloaded');
  if (loadedNow > 4) fails.push(`too many slides loaded eagerly (${loadedNow})`);
  console.log(`hero: 1 eager, 6 deferred -> ${loadedNow} loaded after navigating to slide 4`);
}

console.log(`page             : ${page}`);
console.log(`svgs rendered    : ${svgCount}`);
console.log(`runtime errors   : ${errors.length}`);
if (errors.length) console.log('  ' + errors.slice(0, 5).join('\n  '));
console.log(fails.length ? 'FAILURES:\n  ' + fails.join('\n  ') : 'ALL CHECKS PASSED');
process.exit(fails.length || errors.length ? 1 : 0);
})();

