const CACHE_NAME = 'pk-cargo-link-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/nafeesweb.ttf'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-First Strategy: Always fetch fresh code from server first!
// index.html is NEVER served from cache (always network) so users always
// get the latest version without manual cache clear.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip API routes and dynamic slip pages
  if (event.request.url.includes('/api/') || event.request.url.includes('/slip/')) {
    return;
  }

  // index.html: network only, no cache fallback (prevents blank screens from stale HTML)
  const isIndexHtml = event.request.url.endsWith('/index.html') ||
    event.request.url === self.registration.scope ||
    (event.request.mode === 'navigate');

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          // Don't cache index.html — always fetch fresh
          if (!isIndexHtml) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // Only fall back to cache for non-HTML assets
        if (isIndexHtml) {
          // Last resort: try cache for index.html if network completely fails
          return caches.match(event.request);
        }
        return caches.match(event.request);
      })
  );
});
