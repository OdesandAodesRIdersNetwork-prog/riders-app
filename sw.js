
const CACHE_NAME = 'riders-cache-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/article.html',
  '/map.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/lunr.min.js',
  '/manifest.v3.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (ASSETS.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
  } else {
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
  }
});
