// AI-NOTE: Centralized settings persistence utility for all visualization mode settings
// Provides type-safe localStorage operations with error handling and migration support

export interface StorageOptions<T = unknown> {
  version?: number;
  migrations?: Record<number, (data: T) => T>;
  fallback?: T;
}

class SettingsStorage {
  private static instance: SettingsStorage;

  public static getInstance(): SettingsStorage {
    if (!SettingsStorage.instance) {
      SettingsStorage.instance = new SettingsStorage();
    }
    return SettingsStorage.instance;
  }

  private getStorageKey(key: string): string {
    return `starcom-${key}`;
  }

  /**
   * Save settings to localStorage with version and error handling
   */
  public saveSettings<T>(key: string, data: T, options: StorageOptions<T> = {}): boolean {
    try {
      const storageData = {
        version: options.version || 1,
        timestamp: Date.now(),
        data
      };
      
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(storageData));
      
      console.log(`💾 Settings saved: ${key}`, data);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save settings for ${key}:`, error);
      return false;
    }
  }

  /**
   * Load settings from localStorage with migration support
   */
  public loadSettings<T>(key: string, defaultData: T, options: StorageOptions<T> = {}): T {
    try {
      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        console.log(`📂 No stored settings found for ${key}, using defaults`);
        return defaultData;
      }

      const parsed = JSON.parse(stored);
      let data = parsed.data || parsed; // Handle both new format and legacy
      
      // Handle version migrations
      if (options.migrations && parsed.version) {
        const currentVersion = options.version || 1;
        for (let version = parsed.version; version < currentVersion; version++) {
          if (options.migrations[version + 1]) {
            data = options.migrations[version + 1](data);
            console.log(`🔄 Migrated ${key} settings from v${version} to v${version + 1}`);
          }
        }
      }

      // Merge with defaults to ensure all properties exist
      const result = { ...defaultData, ...data };
      
      console.log(`📥 Settings loaded: ${key}`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to load settings for ${key}:`, error);
      return (options.fallback ?? defaultData) as T;
    }
  }

  /**
   * Remove settings from localStorage
   */
  public removeSettings(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Settings removed: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove settings for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all Starcom settings
   */
  public clearAllSettings(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('starcom-'));
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleared all Starcom settings (${keys.length} items)`);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear all settings:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): { totalKeys: number; starcomKeys: number; estimatedSize: number } {
    try {
      const allKeys = Object.keys(localStorage);
      const starcomKeys = allKeys.filter(key => key.startsWith('starcom-'));
      
      let estimatedSize = 0;
      starcomKeys.forEach(key => {
        estimatedSize += key.length + (localStorage.getItem(key)?.length || 0);
      });
      
      return {
        totalKeys: allKeys.length,
        starcomKeys: starcomKeys.length,
        estimatedSize
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return { totalKeys: 0, starcomKeys: 0, estimatedSize: 0 };
    }
  }

  /**
   * Export all Starcom settings as JSON
   */
  public exportSettings(): string {
    try {
      const settings: Record<string, unknown> = {};
      const keys = Object.keys(localStorage).filter(key => key.startsWith('starcom-'));
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          settings[key] = JSON.parse(value);
        }
      });

      return JSON.stringify({
        exported: new Date().toISOString(),
        version: 1,
        settings
      }, null, 2);
    } catch (error) {
      console.error('❌ Failed to export settings:', error);
      return '{}';
    }
  }

  /**
   * Import settings from JSON string
   */
  public importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      
      if (!imported.settings) {
        throw new Error('Invalid import format');
      }

      Object.entries(imported.settings).forEach(([key, value]) => {
        if (key.startsWith('starcom-')) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      console.log(`📥 Imported ${Object.keys(imported.settings).length} settings`);
      return true;
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      return false;
    }
  }
}

export const settingsStorage = SettingsStorage.getInstance();
export default settingsStorage;
