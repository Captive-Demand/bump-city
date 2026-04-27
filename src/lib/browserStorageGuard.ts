const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
};

const storageWorks = (storage: Storage) => {
  const testKey = "__bump_city_storage_test__";
  storage.setItem(testKey, "1");
  storage.removeItem(testKey);
  return true;
};

const installSafeStorage = (name: "localStorage" | "sessionStorage") => {
  try {
    const current = window[name];
    if (current && storageWorks(current)) return;
  } catch {
    // Replace below with in-memory storage so module imports cannot crash.
  }

  try {
    Object.defineProperty(window, name, {
      configurable: true,
      value: createMemoryStorage(),
    });
  } catch (error) {
    console.warn(`Bump City could not install safe ${name}`, error);
  }
};

export const installBrowserStorageGuard = () => {
  if (typeof window === "undefined") return;
  installSafeStorage("localStorage");
  installSafeStorage("sessionStorage");
};

installBrowserStorageGuard();