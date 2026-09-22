const CACHE_NAME = 'lucid-focus-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/css/style.css',
  '/css/animations.css',
  '/css/components.css',
  '/js/app.js',
  '/js/breathing.js',
  '/js/particles.js',
  '/js/settings.js',
  '/js/sounds.js',
  '/js/stats.js',
  '/js/tasks.js',
  '/js/timer.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate new SW immediately
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
  self.clients.claim(); // Take control of all pages immediately
});

// Network-first strategy: try network, cache the response, fall back to cache
self.addEventListener('fetch', (event) => {
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
        return caches.match(event.request);
      })
  );
});
