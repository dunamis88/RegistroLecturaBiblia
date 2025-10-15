// Nombre del caché. Se debe incrementar este número cada vez que actualices archivos.
const CACHE_NAME = 'bible-tracker-cache-v1'; 

// Lista de archivos esenciales para el modo offline
// IMPORTANTE: Incluye index.html, el manifest y las librerías CDN (Tailwind)
const urlsToCache = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap'
  // Las imágenes de placehold.co se omiten ya que son placeholders simples.
];

// --- FASE 1: INSTALACIÓN ---
// Se activa cuando el navegador intenta instalar el Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando y Cacheadando Archivos...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Agrega todos los archivos esenciales al caché
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forzar activación del nuevo Service Worker
      .catch((error) => {
        console.error('[Service Worker] Fallo al cachear archivos:', error);
      })
  );
});

// --- FASE 2: ACTIVACIÓN ---
// Limpia cachés antiguos para que solo la versión actual permanezca
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando y Limpiando Cachés Viejos...');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Elimina cachés que no están en la lista blanca (viejas versiones)
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Reclama clientes para que las páginas existentes comiencen a usar el nuevo SW inmediatamente
  event.waitUntil(self.clients.claim());
});

// --- FASE 3: FETCH (Estrategia de Cache-First) ---
// Intercepta las solicitudes de red para servir los archivos desde el caché
self.addEventListener('fetch', (event) => {
  // Aseguramos que solo interceptamos peticiones GET (para archivos estáticos)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // 1. Intentar encontrar el recurso en el caché
    caches.match(event.request)
      .then((response) => {
        // Si se encuentra, devolver la versión cacheada (offline)
        if (response) {
          return response;
        }
        
        // 2. Si no se encuentra en el caché, hacer una solicitud normal a la red
        return fetch(event.request)
          .then((response) => {
            // Verificar si la respuesta es válida (ej. no error 404, etc.)
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta. Una respuesta es un flujo de datos y solo se puede consumir una vez.
            // Necesitamos una copia para el navegador y otra para el caché.
            const responseToCache = response.clone();

            // Guardar el nuevo recurso en el caché para uso futuro (opcional, para recursos dinámicos)
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Solo cacheamos URLs que sean archivos (no consultas de API o datos dinámicos)
                if (urlsToCache.some(url => event.request.url.includes(url) || event.request.mode === 'navigate')) {
                     cache.put(event.request, responseToCache);
                }
              });

            return response;
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Fallo de Fetch:', event.request.url, error);
        // Si la red falla y no hay caché, se puede devolver una página de fallback
        // En este caso, simplemente dejamos que falle (si no se encuentra en caché)
      })
  );
});

