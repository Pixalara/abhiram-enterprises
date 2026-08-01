/* Check the live site the way Google's favicon crawler would:
   is the icon reachable, uncached-redirected, correctly typed and not robots-blocked,
   and does the home page still declare it? */
const https = require('https');

const host = 'www.abhiramenterprises.com';
const UA = 'Mozilla/5.0 (compatible; Googlebot-Image/1.0; +http://www.google.com/bot.html)';

const get = (p, method = 'GET') => new Promise(res => {
  https.request({ host, path: p, method, headers: { 'User-Agent': UA } }, r => {
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res({ status: r.statusCode, headers: r.headers, body: Buffer.concat(chunks) }));
  }).on('error', e => res({ error: e.message })).end();
});

(async () => {
  const paths = ['/favicon.ico', '/assets/favicons/android-chrome-192x192.png', '/assets/favicons/apple-touch-icon.png', '/robots.txt'];
  for (const p of paths) {
    const r = await get(p);
    if (r.error) { console.log(`${p} -> ERROR ${r.error}`); continue; }
    console.log(`${p}`);
    console.log(`   status        : ${r.status}`);
    console.log(`   content-type  : ${r.headers['content-type']}`);
    console.log(`   bytes         : ${r.body.length}`);
    console.log(`   x-robots-tag  : ${r.headers['x-robots-tag'] || 'none (good)'}`);
    if (r.headers.location) console.log(`   redirects to  : ${r.headers.location}`);
    console.log(`   cache-control : ${r.headers['cache-control'] || 'none'}`);
  }

  const home = await get('/');
  const html = home.body.toString();
  console.log('\nhome page as seen by the crawler');
  console.log('   status         :', home.status);
  console.log('   title          :', (html.match(/<title>(.*?)<\/title>/) || [])[1]);
  console.log('   icon links     :', (html.match(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g) || []).length);
  for (const m of html.match(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g) || []) console.log('     ', m);
  console.log('   robots meta    :', (html.match(/<meta name="robots" content="([^"]+)"/) || [])[1]);

  // non-www must not break the icon path either
  const bare = await new Promise(res => https.request({ host: 'abhiramenterprises.com', path: '/favicon.ico', method: 'GET', headers: { 'User-Agent': UA } }, r => res({ status: r.statusCode, loc: r.headers.location })).on('error', e => res({ error: e.message })).end());
  console.log('\nnon-www /favicon.ico ->', bare.status || bare.error, bare.loc || '');
})();
