const CACHE_PREFIXES = ['bumpcity', 'bump-city', 'vite', 'workbox'];

const isAppCache = (name) => {
  const normalized = name.toLowerCase();
  return CACHE_PREFIXES.some((prefix) => normalized.includes(prefix));
};

const clearAppCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(isAppCache).map((key) => caches.delete(key)));
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(clearAppCaches());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearAppCaches()
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('fetch', () => {
});
