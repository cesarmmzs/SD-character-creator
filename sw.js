// Guarda os arquivos do app para funcionar sem internet.
const CACHE = 'sdcc-v4';
const FILES = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg',
  'js/app.js', 'js/rules.js', 'js/random.js', 'js/wizard.js', 'js/sheet.js', 'js/ui.js', 'js/storage.js',
  'js/data/index.js', 'js/data/base.js', 'js/data/diabruras.js', 'js/data/areias-rubras.js', 'js/data/sol-da-meia-noite.js', 'js/data/glossary.js',
  'js/data/magias-base.js', 'js/data/magias-suplementos.js', 'js/icons.js',
  'img/sd_background.jpg', 'img/sd_logo.png', 'img/livro_base_cover.jpg',
  'img/sd_suplemento_1_cover.jpg', 'img/sd_suplemento_2_cover.jpg', 'img/sd_suplemento_3_cover.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Rede primeiro (para receber atualizações), cache se estiver offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
