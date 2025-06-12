import CacheManager from './CacheManager';

class CacheRegistry {
  private static instance: CacheRegistry;
  private cacheManager: CacheManager;
  private services: Map<string, any>;

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.services = new Map();
  }

  public static getInstance(): CacheRegistry {
    if (!CacheRegistry.instance) {
      CacheRegistry.instance = new CacheRegistry();
    }
    return CacheRegistry.instance;
  }

  registerService(name: string, service: any) {
    if (this.services.has(name)) {
      throw new Error(`Service with name ${name} already registered`);
    }
    this.services.set(name, service);
    console.log(`Service registered: ${name}`);
  }

  getService<T>(name: string): T | null {
    const service = this.services.get(name) || null;
    if (!service) {
      console.warn(`Service not found: ${name}`);
    }
    return service;
  }

  getCacheManager(): CacheManager {
    return this.cacheManager;
  }
}

export default CacheRegistry;
