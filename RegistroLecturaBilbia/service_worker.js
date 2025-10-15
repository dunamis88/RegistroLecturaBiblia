// Nombre del caché (es buena práctica versionarlo)
const CACHE_NAME = 'mi-camino-biblia-cache-v1';

// Lista de archivos fundamentales para que la app funcione sin conexión
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'biblia-192.png',
  'biblia-512.png'
];

// Evento 'install': se dispara cuando el Service Worker se instala por primera vez.
// Aquí es donde guardamos los archivos en el caché.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto y guardando archivos principales');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': se dispara cada vez que la app solicita un recurso (una página, una imagen, etc.).
// Aquí implementamos la estrategia "Cache First".
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en el caché, lo devolvemos desde ahí.
        if (response) {
          return response;
        }
        // Si no está en el caché, lo buscamos en la red.
        return fetch(event.request);
      })
  );
});
