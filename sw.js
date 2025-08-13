
const CACHE_NAME = 'riders-cache-v1';
const ASSETS = [
  '/index.html',
  '/article.html',
  '/map.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/lunr.min.js',
  '/assets/js/marked.min.js',
  '/assets/js/leaflet.js',
  '/assets/css/leaflet.css',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Cache-first for our app shell; network-first for others
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request))
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
