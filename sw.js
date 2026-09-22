const CACHE_NAME = 'lucid-focus-v3';
const ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './css/style.css',
  './css/animations.css',
  './css/components.css',
  './js/app.js',
  './js/breathing.js',
  './js/particles.js',
  './js/settings.js',
  './js/sounds.js',
  './js/stats.js',
  './js/tasks.js',
  './js/timer.js'
];

// Offline fallback HTML — served when both network and cache miss
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lucid — Offline</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  font-family:'Inter',sans-serif;background:#07080f;color:#e4e4ed;text-align:center}
  .wrap{padding:2rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#8888a8;font-size:.9rem}
</style></head><body><div class="wrap"><h1>🌊 You're Offline</h1>
<p>Lucid couldn't load this page. Check your connection and try again.</p></div></body></html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the fresh response for offline use
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // If the request is for a page (HTML), return the offline fallback
          if (event.request.headers.get('Accept')?.includes('text/html')) {
            return new Response(OFFLINE_HTML, {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            });
          }
        });
      })
  );
});
