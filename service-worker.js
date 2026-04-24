const CACHE_NAME = 'umpsa-sport-v3';

// Core assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/UMPSA-Pekan-Sport-Facility-Booking-System/',
  '/UMPSA-Pekan-Sport-Facility-Booking-System/index.html',
  '/UMPSA-Pekan-Sport-Facility-Booking-System/manifest.json',
  '/UMPSA-Pekan-Sport-Facility-Booking-System/icons/icon-192x192.png',
  '/UMPSA-Pekan-Sport-Facility-Booking-System/icons/icon-512x512.png',
  '/UMPSA-Pekan-Sport-Facility-Booking-System/LogInPage/LogInPage.html',
];

// Install: cache static shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML/API, cache-first for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests (e.g. Supabase API)
  if (request.method !== 'GET') return;
  if (!url.origin.includes('github.io') && !url.origin.includes('localhost')) return;

  // Network-first strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else (images, CSS, JS)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
