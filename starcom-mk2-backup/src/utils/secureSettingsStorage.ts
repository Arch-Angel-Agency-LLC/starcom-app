// Secure Settings Storage - Production Security Enhanced
// Provides type-safe secure storage operations with encryption and error handling

import { secureStorage } from './secureStorage';

const STORAGE_VERSION = '2.0';
const CURRENT_SETTINGS_VERSION = '1.0';

interface StorageData<T> {
  version: string;
  settingsVersion: string;
  data: T;
  timestamp: number;
}

interface SettingsStorageOptions {
  migrate?: boolean;
  ttl?: number; // Time to live in milliseconds
}

export class SecureSettingsStorage {
  /**
   * Save settings to secure storage with version and error handling
   */
  static saveSettings<T>(
    key: string, 
    data: T, 
    options: SettingsStorageOptions = {}
  ): boolean {
    try {
      const storageKey = `starcom-${key}`;
      const storageData: StorageData<T> = {
        version: STORAGE_VERSION,
        settingsVersion: CURRENT_SETTINGS_VERSION,
        data,
        timestamp: Date.now()
      };

      secureStorage.setItem(storageKey, storageData, { 
        encrypt: true,
        ttl: options.ttl || 24 * 60 * 60 * 1000 // Default 24 hours
      });

      return true;
    } catch {
      // Silent failure for production security
      return false;
    }
  }

  /**
   * Load settings from secure storage with migration support
   */
  static loadSettings<T>(
    key: string, 
    defaultValue: T, 
    options: SettingsStorageOptions = {}
  ): T {
    try {
      const storageKey = `starcom-${key}`;
      const result = secureStorage.getItem<StorageData<T>>(storageKey);
      
      if (!result) {
        return defaultValue;
      }

      // Check if migration is needed
      if (options.migrate && result.version !== STORAGE_VERSION) {
        // Perform migration and save updated version
        this.saveSettings(key, result.data, options);
      }

      // Check if data is stale (basic TTL)
      const maxAge = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default
      const age = Date.now() - result.timestamp;
      
      if (age > maxAge) {
        this.removeSettings(key);
        return defaultValue;
      }

      return result.data;
    } catch {
      // Silent failure for production security
      return defaultValue;
    }
  }

  /**
   * Remove settings from secure storage
   */
  static removeSettings(key: string): boolean {
    try {
      const storageKey = `starcom-${key}`;
      secureStorage.removeItem(storageKey);
      return true;
    } catch {
      // Silent failure for production security
      return false;
    }
  }

  /**
   * Clear all Starcom settings
   */
  static clearAllSettings(): boolean {
    try {
      secureStorage.clear();
      return true;
    } catch {
      // Silent failure for production security
      return false;
    }
  }

  /**
   * Check if storage quota is available (simplified for secure storage)
   */
  static isStorageAvailable(): boolean {
    try {
      // Test if storage is available
      const testKey = 'starcom-storage-test';
      secureStorage.setItem(testKey, 'test');
      secureStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all settings keys (development use only)
   */
  static getAllSettingsKeys(): string[] {
    try {
      // This is a simplified version since secureStorage doesn't expose all keys
      // In production, maintain a separate index if needed
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Migration helper - moves data from old storage to secure storage
   */
  static migrateFromLegacyStorage(key: string, defaultValue: unknown): unknown {
    try {
      // Check if data exists in localStorage (legacy)
      const legacyData = localStorage.getItem(`starcom-${key}`);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        // Move to secure storage
        this.saveSettings(key, parsed.data || parsed);
        // Remove from localStorage
        localStorage.removeItem(`starcom-${key}`);
        return parsed.data || parsed;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

// Legacy compatibility exports
export const saveSettings = SecureSettingsStorage.saveSettings.bind(SecureSettingsStorage);
export const loadSettings = SecureSettingsStorage.loadSettings.bind(SecureSettingsStorage);
export const removeSettings = SecureSettingsStorage.removeSettings.bind(SecureSettingsStorage);
export const clearAllSettings = SecureSettingsStorage.clearAllSettings.bind(SecureSettingsStorage);

export default SecureSettingsStorage;
