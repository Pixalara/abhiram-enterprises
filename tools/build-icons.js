/* Build a minimal local icon runtime containing only the icons this site uses.
   Replaces the 588 KB lucide CDN bundle. Run: node build-icons.js */
const fs = require('fs');
const path = require('path');
const os = require('os');

const bundlePath = path.join(os.tmpdir(), 'lucide.js');
const lucide = require(bundlePath);
const iconSet = lucide.icons || lucide.default?.icons;
if (!iconSet) throw new Error('could not read icon set from lucide bundle');

// collect the icon names actually referenced in the site source
const files = ['index.html', 'about.html', 'products.html', 'contact.html', 'script.js']
  .map(f => path.join(__dirname, '..', 'public', f));
const used = new Set();
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/data-lucide="([a-z0-9-]+)"/g)) used.add(m[1]);
}

const pascal = name => name.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');

const out = {};
const missing = [];
for (const name of [...used].sort()) {
  const key = pascal(name);
  const def = iconSet[key];
  if (!def) { missing.push(name); continue; }
  // each definition is ["svg", wrapperAttrs, children]; keep only the children
  const children = def[2];
  if (!Array.isArray(children)) { missing.push(name); continue; }
  out[name] = children.map(([tag, attrs]) => [tag, attrs]);
}

if (missing.length) throw new Error('icons not found in bundle: ' + missing.join(', '));

const runtime = `/* Minimal icon runtime for Abhiram Enterprises - only the ${Object.keys(out).length} icons this site uses.
   Generated from lucide 0.468.0 by build-icons.js. Replaces a 588 KB CDN bundle. */
(()=>{'use strict';const NS='http://www.w3.org/2000/svg';const I=${JSON.stringify(out)};
const BASE={xmlns:NS,width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'};
const build=(name,src)=>{const def=I[name];if(!def)return null;const svg=document.createElementNS(NS,'svg');
for(const k in BASE)svg.setAttribute(k,BASE[k]);
svg.setAttribute('class',((src.getAttribute('class')||'')+' lucide lucide-'+name).trim());
for(const a of src.attributes)if(a.name!=='data-lucide'&&a.name!=='class')svg.setAttribute(a.name,a.value);
for(const [tag,attrs] of def){const el=document.createElementNS(NS,tag);for(const k in attrs)el.setAttribute(k,attrs[k]);svg.appendChild(el)}
return svg};
const createIcons=()=>{document.querySelectorAll('[data-lucide]').forEach(el=>{const svg=build(el.getAttribute('data-lucide'),el);if(svg)el.replaceWith(svg)})};
window.lucide={createIcons,icons:I};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',createIcons,{once:true}):createIcons()})();
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'icons.js'), runtime, 'utf8');
console.log('icons bundled:', Object.keys(out).length);
console.log('names:', Object.keys(out).join(', '));
console.log('output KB:', (Buffer.byteLength(runtime) / 1024).toFixed(1));
