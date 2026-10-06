// Rend la version web utilisable hors connexion (PWA) : manifeste + service worker + enregistrement.
// À lancer après `npx expo export --platform web` (dossier dist).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = '/arbitrage-escrime/';
const DIST = path.join(__dirname, '..', 'dist');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Icônes
fs.copyFileSync(path.join(__dirname, '..', 'assets', 'icon-192.png'), path.join(DIST, 'icon-192.png'));
fs.copyFileSync(path.join(__dirname, '..', 'assets', 'icon-512.png'), path.join(DIST, 'icon-512.png'));

// Manifeste
fs.writeFileSync(
  path.join(DIST, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Arbitrage Escrime',
      short_name: 'Escrime',
      start_url: BASE,
      scope: BASE,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#121826',
      theme_color: '#121826',
      icons: [
        { src: BASE + 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: BASE + 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    null,
    2
  )
);

// Liste des fichiers à garder en mémoire
const files = walk(DIST)
  .map((p) => path.relative(DIST, p).split(path.sep).join('/'))
  .filter((f) => f !== 'sw.js' && !f.endsWith('.map'));
const hash = crypto.createHash('sha1');
for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(DIST, f)));
const version = hash.digest('hex').slice(0, 10);
const urls = [BASE, ...files.map((f) => BASE + encodeURI(f))];

fs.writeFileSync(
  path.join(DIST, 'sw.js'),
  `const CACHE = 'escrime-${version}';
const URLS = ${JSON.stringify(urls)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request).catch(() =>
          e.request.mode === 'navigate' ? caches.match('${BASE}index.html').then((r) => r || caches.match('${BASE}')) : Response.error()
        )
    )
  );
});
`
);

// index.html : manifeste + enregistrement du service worker
const idx = path.join(DIST, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
const head =
  `<link rel="manifest" href="${BASE}manifest.webmanifest">` +
  `<meta name="theme-color" content="#121826">` +
  `<link rel="apple-touch-icon" href="${BASE}icon-192.png">`;
const reg =
  `<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('${BASE}sw.js',{scope:'${BASE}'}).catch(function(){})})}</script>`;
html = html.replace('</head>', head + '</head>').replace('</body>', reg + '</body>');
fs.writeFileSync(idx, html);
console.log(`PWA prête : ${urls.length} fichiers, version ${version}`);
