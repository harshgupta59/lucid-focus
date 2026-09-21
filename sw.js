const CACHE_NAME = 'lucid-focus-v1';
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
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
