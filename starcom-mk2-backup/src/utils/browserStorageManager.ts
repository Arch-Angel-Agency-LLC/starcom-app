// Browser Storage Management Utility
// AI-NOTE: Prevents excessive browser storage accumulation that could bloat system cache
// Provides monitoring, cleanup, and size limits for localStorage, sessionStorage, and IndexedDB

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
}

export interface StorageStats {
  localStorage: {
    keyCount: number;
    estimatedSize: number;
    starcomKeys: number;
    starcomSize: number;
  };
  sessionStorage: {
    keyCount: number;
    estimatedSize: number;
  };
  indexedDB?: StorageQuota;
  cacheAPI?: StorageQuota;
}

class BrowserStorageManager {
  private static instance: BrowserStorageManager;
  
  // Storage size limits (in bytes)
  private static readonly MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_STARCOM_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB
  private static readonly WARNING_THRESHOLD = 0.8; // 80% of limit

  public static getInstance(): BrowserStorageManager {
    if (!BrowserStorageManager.instance) {
      BrowserStorageManager.instance = new BrowserStorageManager();
    }
    return BrowserStorageManager.instance;
  }

  /**
   * Get comprehensive storage statistics
   */
  public async getStorageStats(): Promise<StorageStats> {
    const stats: StorageStats = {
      localStorage: this.getLocalStorageStats(),
      sessionStorage: this.getSessionStorageStats(),
    };

    // Get storage quota if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          stats.indexedDB = {
            used: estimate.usage,
            available: estimate.quota - estimate.usage,
            total: estimate.quota
          };
        }
      } catch (error) {
        console.warn('Could not get storage estimate:', error);
      }
    }

    return stats;
  }

  /**
   * Get localStorage statistics
   */
  private getLocalStorageStats() {
    const allKeys = Object.keys(localStorage);
    const starcomKeys = allKeys.filter(key => key.startsWith('starcom-'));
    
    let totalSize = 0;
    let starcomSize = 0;
    
    allKeys.forEach(key => {
      const value = localStorage.getItem(key) || '';
      const itemSize = key.length + value.length;
      totalSize += itemSize;
      
      if (key.startsWith('starcom-')) {
        starcomSize += itemSize;
      }
    });

    return {
      keyCount: allKeys.length,
      estimatedSize: totalSize,
      starcomKeys: starcomKeys.length,
      starcomSize
    };
  }

  /**
   * Get sessionStorage statistics
   */
  private getSessionStorageStats() {
    const allKeys = Object.keys(sessionStorage);
    let totalSize = 0;
    
    allKeys.forEach(key => {
      const value = sessionStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    });

    return {
      keyCount: allKeys.length,
      estimatedSize: totalSize
    };
  }

  /**
   * Check if storage usage is approaching limits
   */
  public async checkStorageLimits(): Promise<{
    localStorage: { isNearLimit: boolean; usage: number; limit: number };
    starcom: { isNearLimit: boolean; usage: number; limit: number };
    total?: { isNearLimit: boolean; usage: number; limit: number };
  }> {
    const stats = await this.getStorageStats();
    
    const result: {
      localStorage: { isNearLimit: boolean; usage: number; limit: number };
      starcom: { isNearLimit: boolean; usage: number; limit: number };
      total?: { isNearLimit: boolean; usage: number; limit: number };
    } = {
      localStorage: {
        isNearLimit: stats.localStorage.estimatedSize > (BrowserStorageManager.MAX_LOCAL_STORAGE_SIZE * BrowserStorageManager.WARNING_THRESHOLD),
        usage: stats.localStorage.estimatedSize,
        limit: BrowserStorageManager.MAX_LOCAL_STORAGE_SIZE
      },
      starcom: {
        isNearLimit: stats.localStorage.starcomSize > (BrowserStorageManager.MAX_STARCOM_STORAGE_SIZE * BrowserStorageManager.WARNING_THRESHOLD),
        usage: stats.localStorage.starcomSize,
        limit: BrowserStorageManager.MAX_STARCOM_STORAGE_SIZE
      }
    };

    if (stats.indexedDB) {
      result.total = {
        isNearLimit: stats.indexedDB.used > (stats.indexedDB.total * BrowserStorageManager.WARNING_THRESHOLD),
        usage: stats.indexedDB.used,
        limit: stats.indexedDB.total
      };
    }

    return result;
  }

  /**
   * Clean up old or excessive localStorage entries
   */
  public cleanupLocalStorage(options: {
    maxAge?: number; // milliseconds
    maxEntries?: number;
    targetSize?: number; // bytes
  } = {}): { cleaned: number; sizeFreed: number } {
    const {
      maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days default
      maxEntries = 50,
      targetSize = BrowserStorageManager.MAX_STARCOM_STORAGE_SIZE * 0.7 // 70% of limit
    } = options;

    const starcomKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('starcom-'))
      .map(key => {
        const value = localStorage.getItem(key);
        let timestamp = Date.now();
        const size = key.length + (value?.length || 0);
        
        // Try to extract timestamp from stored data
        try {
          const parsed = JSON.parse(value || '{}');
          if (parsed.timestamp) {
            timestamp = parsed.timestamp;
          }
        } catch {
          // Use current time if parsing fails
        }

        return { key, timestamp, size };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

    let cleaned = 0;
    let sizeFreed = 0;
    const now = Date.now();

    // Remove entries based on age, count, and size
    for (const entry of starcomKeys) {
      const shouldRemove = 
        (now - entry.timestamp > maxAge) ||  // Too old
        (cleaned >= maxEntries) ||           // Too many entries
        (sizeFreed < (this.getLocalStorageStats().starcomSize - targetSize)); // Size target not met

      if (shouldRemove) {
        try {
          localStorage.removeItem(entry.key);
          cleaned++;
          sizeFreed += entry.size;
        } catch (error) {
          console.warn(`Failed to remove ${entry.key}:`, error);
        }
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} localStorage entries, freed ${(sizeFreed / 1024).toFixed(1)}KB`);
    }

    return { cleaned, sizeFreed };
  }

  /**
   * Format storage size for display
   */
  public formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  /**
   * Monitor storage and auto-cleanup if needed
   */
  public async monitorAndCleanup(): Promise<void> {
    const limits = await this.checkStorageLimits();
    
    if (limits.starcom.isNearLimit) {
      console.warn(`⚠️ Starcom storage near limit: ${this.formatSize(limits.starcom.usage)} / ${this.formatSize(limits.starcom.limit)}`);
      this.cleanupLocalStorage({ targetSize: limits.starcom.limit * 0.6 }); // Clean to 60% of limit
    }

    if (limits.localStorage.isNearLimit) {
      console.warn(`⚠️ localStorage near limit: ${this.formatSize(limits.localStorage.usage)} / ${this.formatSize(limits.localStorage.limit)}`);
    }

    if (limits.total?.isNearLimit) {
      console.warn(`⚠️ Total browser storage near limit: ${this.formatSize(limits.total.usage)} / ${this.formatSize(limits.total.limit)}`);
    }
  }
}

export const browserStorageManager = BrowserStorageManager.getInstance();
export default browserStorageManager;
