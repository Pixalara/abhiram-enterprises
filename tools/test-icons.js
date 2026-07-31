/* Verify the local icon runtime renders every icon the site references,
   preserves placeholder attributes, and survives a re-run (the hamburger/hero
   toggles swap icon markup and call createIcons again). */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const runtime = fs.readFileSync(path.join(__dirname, '..', 'public', 'icons.js'), 'utf8');

// every icon name referenced anywhere in the site
const sources = ['index.html', 'about.html', 'products.html', 'contact.html', 'script.js']
  .map(f => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8'));
const names = [...new Set(sources.flatMap(t => [...t.matchAll(/data-lucide="([a-z0-9-]+)"/g)].map(m => m[1])))].sort();

const markup = names.map(n => `<i data-lucide="${n}" aria-hidden="true" class="probe"></i>`).join('');
const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, { runScripts: 'outside-only' });
dom.window.eval(runtime);
dom.window.lucide.createIcons();

const doc = dom.window.document;
const svgs = [...doc.querySelectorAll('svg')];
const fails = [];

if (svgs.length !== names.length) fails.push(`rendered ${svgs.length} svgs for ${names.length} icons`);
if (doc.querySelectorAll('[data-lucide]').length) fails.push('some placeholders were left unreplaced');

for (const svg of svgs) {
  const cls = svg.getAttribute('class') || '';
  const name = (cls.match(/lucide-([a-z0-9-]+)/) || [])[1];
  if (!name) { fails.push(`svg without lucide-<name> class: ${cls}`); continue; }
  if (!svg.children.length) fails.push(`${name}: no shape children`);
  if (svg.getAttribute('viewBox') !== '0 0 24 24') fails.push(`${name}: wrong viewBox`);
  if (svg.getAttribute('stroke') !== 'currentColor') fails.push(`${name}: stroke not currentColor`);
  if (svg.getAttribute('aria-hidden') !== 'true') fails.push(`${name}: lost aria-hidden`);
  if (!cls.includes('probe')) fails.push(`${name}: lost original class`);
  for (const child of svg.children) {
    const d = child.getAttribute('d');
    if (child.tagName === 'path' && (!d || d.length < 2)) fails.push(`${name}: empty path`);
  }
}

// re-run must be safe and must pick up newly injected placeholders
const extra = doc.createElement('i');
extra.setAttribute('data-lucide', 'x');
doc.body.appendChild(extra);
dom.window.lucide.createIcons();
if (doc.querySelectorAll('[data-lucide]').length) fails.push('re-run did not convert a newly added placeholder');
if (doc.querySelectorAll('svg').length !== names.length + 1) fails.push('re-run duplicated or dropped icons');

console.log(`icons referenced : ${names.length}`);
console.log(`icons rendered   : ${svgs.length}`);
console.log(`shape children   : ${svgs.reduce((n, s) => n + s.children.length, 0)}`);
console.log(fails.length ? 'FAILURES:\n  ' + fails.join('\n  ') : 'ALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
