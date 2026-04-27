const CACHE_PREFIXES = ["bumpcity", "bump-city", "vite", "workbox"];
const RELOAD_FLAG = "bumpcity-cache-recovery-reloaded";

const isRecoverableCache = (name: string) => {
  const normalized = name.toLowerCase();
  return CACHE_PREFIXES.some((prefix) => normalized.includes(prefix));
};

export const clearAppCaches = async () => {
  if (!("caches" in window)) return;

  const keys = await window.caches.keys();
  await Promise.all(keys.filter(isRecoverableCache).map((key) => window.caches.delete(key)));
};

export const unregisterServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return false;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  return registrations.length > 0;
};

export const recoverFromStaleAppCache = async (forceReload = false) => {
  try {
    const isPreviewHost = window.location.hostname.endsWith("lovableproject.com");
    if (isPreviewHost && !forceReload) return;

    const hadServiceWorker = await unregisterServiceWorkers();
    await clearAppCaches();

    const shouldReload = forceReload || hadServiceWorker || !!navigator.serviceWorker?.controller;
    if (shouldReload && sessionStorage.getItem(RELOAD_FLAG) !== "1") {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
      return;
    }

    sessionStorage.removeItem(RELOAD_FLAG);
  } catch (error) {
    console.warn("Cache recovery skipped", error);
  }
};
