/**
 * In-memory TTL Cache helper
 */
class MemoryCache {
  constructor(defaultTtlSeconds = 300) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = this.defaultTtlSeconds) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
    return value;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  size() {
    // Clean expired first
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }
}

export const globalCache = new MemoryCache();
export default MemoryCache;
