import Cache from './Cache';

class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, Cache<any>>;

  private constructor() {
    this.caches = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  createCache<T>(name: string, defaultTTL?: number): Cache<T> {
    if (this.caches.has(name)) {
      throw new Error(`Cache with name ${name} already exists`);
    }
    const cache = new Cache<T>(defaultTTL);
    this.caches.set(name, cache);
    console.log(`Cache created: ${name} with TTL: ${defaultTTL}`);
    return cache;
  }

  getCache<T>(name: string): Cache<T> | null {
    const cache = this.caches.get(name) as Cache<T> || null;
    if (!cache) {
      console.warn(`Cache not found: ${name}`);
    }
    return cache;
  }

  deleteCache(name: string) {
    if (this.caches.delete(name)) {
      console.log(`Cache deleted: ${name}`);
    } else {
      console.warn(`Cache delete failed: ${name} not found`);
    }
  }

  clearAllCaches() {
    this.caches.forEach(cache => cache.clear());
    console.log('All caches cleared');
  }

  getAllCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  hasCache(name: string): boolean {
    return this.caches.has(name);
  }
}

export default CacheManager;
