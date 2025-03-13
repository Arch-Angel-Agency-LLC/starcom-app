import cacheRegistry from '../cache/cache';
import EIADataCacheService from '../cache/EIADataCacheService';

const eiaDataCacheService = cacheRegistry.getService<EIADataCacheService>('EIADataCacheService');
const eiaDataCache = eiaDataCacheService?.getCache();

if (eiaDataCache) {
  // Use the cache
}
