const CACHE_NAME = 'agendalink-v2'; // Bumped cache version
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
    // Ignore non-GET requests, chrome-extension requests, and other origins for simplicity.
    const isCachable = event.request.method === 'GET' &&
                      !event.request.url.startsWith('chrome-extension://') &&
                      event.request.url.startsWith('http');
                      
    if (!isCachable) {
        return;
    }

    // Stale-while-revalidate strategy
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);

            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            }).catch(err => {
                console.warn('Fetch failed; returning cached response if available.', err);
            });

            // Return cached response immediately if available, otherwise wait for the network response.
            // The fetch in the background will update the cache for the next visit.
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});