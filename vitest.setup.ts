import '@testing-library/jest-dom/vitest';

// Node 22+ ships a native `localStorage` global (via --experimental-webstorage,
// enabled by default in newer versions). It conflicts with / shadows jsdom's own
// storage implementation and is missing methods like `.clear()`. Replace it with
// a simple in-memory Storage implementation so tests behave consistently.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
  writable: true,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}
