import CacheRegistry from './CacheRegistry';
import Cache from './Cache';

class EIADataCacheService {
  private cache: Cache<number>;

  constructor() {
    const cacheRegistry = CacheRegistry.getInstance();
    try {
      this.cache = cacheRegistry.getCacheManager().createCache<number>('EIADataCache', 60000); // 1 minute TTL
    } catch (error) {
      console.error('[EIADataCacheService] Failed to create cache:', error);
      throw error;
    }
  }

  getCache(): Cache<number> {
    if (!this.cache) {
      throw new Error('[EIADataCacheService] Cache is not initialized.');
    }
    return this.cache;
  }

  stopCacheCleanup() {
    try {
      this.cache.stopCleanup();
      console.log('[EIADataCacheService] Cache cleanup stopped.');
    } catch (error) {
      console.error('[EIADataCacheService] Failed to stop cache cleanup:', error);
    }
  }
}

export default EIADataCacheService;
