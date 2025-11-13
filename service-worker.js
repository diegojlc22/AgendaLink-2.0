const CACHE_NAME = 'agendalink-v4'; // Versão do cache incrementada para invalidação
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', (event) => {
  // Pular a espera para ativar o novo Service Worker mais rapidamente
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
    // Ignorar requisições que não sejam GET e extensões do Chrome
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Estratégia: Stale-While-Revalidate
    // Responde com o cache imediatamente para velocidade (stale),
    // depois busca na rede para atualizar o cache para a próxima vez (revalidate).
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Se a requisição à rede for bem-sucedida, clonamos a resposta e a armazenamos no cache.
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(err => {
                console.warn("Fetch failed; returning offline page instead.", err);
                // Opcional: retornar uma página de fallback offline genérica se nem o cache nem a rede funcionarem
            });

            // Retorna a resposta do cache imediatamente se existir, caso contrário, espera a resposta da rede.
            // A requisição de rede para revalidação do cache já foi iniciada.
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Garante que o novo SW assuma o controle imediatamente
  );
});