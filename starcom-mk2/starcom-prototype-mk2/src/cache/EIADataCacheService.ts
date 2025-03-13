import CacheRegistry from './CacheRegistry';
import Cache from './Cache';

class EIADataCacheService {
  private cache: Cache<number>;

  constructor() {
    const cacheRegistry = CacheRegistry.getInstance();
    this.cache = cacheRegistry.getCacheManager().createCache<number>('EIADataCache', 60000); // 1 minute TTL
  }

  getCache(): Cache<number> {
    return this.cache;
  }

  stopCacheCleanup() {
    this.cache.stopCleanup();
  }
}

export default EIADataCacheService;
