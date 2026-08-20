// دفتر الحصص - Service Worker
// كل شيء بيتخزن محليًا عشان الصفحة تشتغل بدون إنترنت خالص بعد أول زيارة.

const CACHE_NAME = 'jadwal-hisas-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for our own files, network-with-cache-fallback for everything else (e.g. fonts)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  } else {
    // external assets like Google Fonts: try cache, then network, cache the result for offline reuse
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
