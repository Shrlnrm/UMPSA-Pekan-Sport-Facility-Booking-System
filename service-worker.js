const CACHE_NAME = 'umpsa-sport-v5';

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

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'UMPSA Sports';
    const options = {
      body: data.body || 'You have a new notification.',
      icon: '/UMPSA-Pekan-Sport-Facility-Booking-System/icons/icon-192x192.png',
      badge: '/UMPSA-Pekan-Sport-Facility-Booking-System/icons/icon-192x192.png',
      data: data.url || '/UMPSA-Pekan-Sport-Facility-Booking-System/index.html',
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error parsing push data', err);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
