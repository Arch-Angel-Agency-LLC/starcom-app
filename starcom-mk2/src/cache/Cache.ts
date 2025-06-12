type CacheEntry<T> = {
  value: T;
  expiry: number;
};

class Cache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(defaultTTL: number = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = setInterval(() => this.cleanup(), defaultTTL);
  }

  set(key: string, value: T, ttl?: number) {
    if (!key) throw new Error('Key cannot be empty');
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
    //console.log(`Cache set: ${key} with TTL: ${ttl || this.defaultTTL}`);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      //console.warn(`Cache miss: ${key}`);
      return null;
    }
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      console.warn(`Cache expired: ${key}`);
      return null;
    }
    console.log(`Cache hit: ${key}`);
    return entry.value;
  }

  delete(key: string) {
    if (this.cache.delete(key)) {
      console.log(`Cache deleted: ${key}`);
    } else {
      console.warn(`Cache delete failed: ${key} not found`);
    }
  }

  clear() {
    this.cache.clear();
    console.log('All cache cleared');
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private cleanup() {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (entry.expiry <= now) {
        this.cache.delete(key);
        console.log(`Cache cleaned up: ${key}`);
      }
    });
  }

  stopCleanup() {
    clearInterval(this.cleanupInterval);
    console.log('Cache cleanup stopped');
  }
}

export default Cache;
