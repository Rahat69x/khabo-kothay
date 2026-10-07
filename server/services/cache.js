import thresholdsConfig from '../config/thresholds.json' with { type: 'json' };
import featureFlags from '../config/featureFlags.js';
import logger from './logger.js';

const costControl = thresholdsConfig.costControl || {
  candidateCacheTtlSeconds: 600,
  trafficCacheTtlSeconds: 120,
  swrGraceWindowSeconds: 300,
  coarseGridDegreesLat: 0.0027,
  coarseGridDegreesLng: 0.0029
};

/**
 * Maps raw GPS coordinates to a coarse ~300m grid cell to maximize cache hit rates
 */
export function getCoarseGrid(lat, lng) {
  const stepLat = costControl.coarseGridDegreesLat || 0.0027;
  const stepLng = costControl.coarseGridDegreesLng || 0.0029;
  const gridLat = (Math.round(Number(lat) / stepLat) * stepLat).toFixed(4);
  const gridLng = (Math.round(Number(lng) / stepLng) * stepLng).toFixed(4);
  return { gridLat, gridLng, gridKey: `${gridLat}_${gridLng}` };
}

/**
 * In-memory TTL Cache with Stale-While-Revalidate (SWR) support
 */
class MemoryCache {
  constructor(defaultTtlSeconds = 300) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      swrHits: 0
    };
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    const now = Date.now();
    if (now > item.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttlSeconds = this.defaultTtlSeconds) {
    const now = Date.now();
    const expiresAt = now + (ttlSeconds * 1000);
    const swrExpiresAt = expiresAt + ((costControl.swrGraceWindowSeconds || 300) * 1000);
    this.store.set(key, { value, expiresAt, swrExpiresAt });
    return value;
  }

  /**
   * Stale-While-Revalidate lookup:
   * Returns fresh or stale data immediately if available, triggers background revalidation if stale.
   */
  async getWithSWR(key, fetcher, ttlSeconds = this.defaultTtlSeconds) {
    const item = this.store.get(key);
    const now = Date.now();

    if (item) {
      if (now <= item.expiresAt) {
        // Fresh hit
        this.stats.hits++;
        return { data: item.value, isStale: false, source: 'cache-fresh' };
      }

      if (now <= item.swrExpiresAt && featureFlags.enableStaleWhileRevalidate) {
        // Stale hit: return immediately and revalidate asynchronously in background
        this.stats.swrHits++;
        this.stats.hits++;
        this.revalidateInBackground(key, fetcher, ttlSeconds);
        return { data: item.value, isStale: true, source: 'cache-stale-swr' };
      }
    }

    // Cache miss or past SWR window
    this.stats.misses++;
    const freshValue = await fetcher();
    this.set(key, freshValue, ttlSeconds);
    return { data: freshValue, isStale: false, source: 'fresh-network' };
  }

  revalidateInBackground(key, fetcher, ttlSeconds) {
    Promise.resolve().then(async () => {
      try {
        const fresh = await fetcher();
        this.set(key, fresh, ttlSeconds);
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Background SWR revalidation failed');
      }
    });
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  size() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.swrExpiresAt) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      swrHits: this.stats.swrHits,
      totalQueries: total,
      hitRatio: total > 0 ? Number((this.stats.hits / total).toFixed(3)) : 0,
      activeKeys: this.store.size
    };
  }
}

/**
 * Optional Redis Cache (Upstash REST API client with in-memory fallback)
 */
class RedisCacheAdapter {
  constructor(memoryFallback) {
    this.memory = memoryFallback;
    this.upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
    this.upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.hasRedis = Boolean(this.upstashUrl && this.upstashToken);
  }

  isConfigured() {
    return this.hasRedis;
  }

  get(key) {
    return this.memory.get(key);
  }

  async getAsync(key) {
    const local = this.memory.get(key);
    if (local !== null) return local;
    if (!this.hasRedis) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.upstashUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.upstashToken}` },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.result !== null && data.result !== undefined) {
          try {
            const parsed = JSON.parse(data.result);
            this.memory.set(key, parsed);
            return parsed;
          } catch {
            this.memory.set(key, data.result);
            return data.result;
          }
        }
      }
    } catch (e) {
      logger.debug({ error: e.message }, 'Redis getAsync failed');
    }
    return null;
  }

  set(key, value, ttlSeconds = 300) {
    // Keep memory cache populated synchronously for instantaneous retrieval
    this.memory.set(key, value, ttlSeconds);

    if (this.hasRedis) {
      this.syncToRedis(key, value, ttlSeconds);
    }
    return value;
  }

  syncToRedis(key, value, ttlSeconds) {
    Promise.resolve().then(async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const payload = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await fetch(`${this.upstashUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}?ex=${ttlSeconds}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.upstashToken}` },
          signal: controller.signal
        });
        clearTimeout(timeout);
      } catch (e) {
        logger.debug({ error: e.message }, 'Redis async sync failed');
      }
    });
  }

  async getWithSWR(key, fetcher, ttlSeconds) {
    return this.memory.getWithSWR(key, fetcher, ttlSeconds);
  }

  delete(key) {
    return this.memory.delete(key);
  }

  clear() {
    this.memory.clear();
  }

  size() {
    return this.memory.size();
  }

  getStats() {
    const stats = this.memory.getStats();
    stats.backend = this.hasRedis ? 'upstash-redis' : 'in-memory';
    return stats;
  }
}

export const memoryCache = new MemoryCache();
export const globalCache = new RedisCacheAdapter(memoryCache);

export default globalCache;
