/**
 * Encrypted Storage Utility
 * Provides secure storage for sensitive session data
 * Implements TDD Feature 2: Enhanced Session Security
 */

import CryptoJS from 'crypto-js';

export interface EncryptedStorageItem {
  data: string; // Encrypted data
  hash: string; // Integrity hash
  timestamp: number;
  version: string;
}

class EncryptedStorage {
  private readonly storageKey: string;
  private readonly encryptionKey: string;
  private readonly version = '1.0';

  constructor(storageKey: string = 'siws-session') {
    this.storageKey = storageKey;
    this.encryptionKey = this.generateOrGetEncryptionKey();
  }

  /**
   * Generate or retrieve encryption key from secure storage
   */
  private generateOrGetEncryptionKey(): string {
    const keyStorageKey = `${this.storageKey}-encryption-key`;
    let key = localStorage.getItem(keyStorageKey);
    
    if (!key) {
      // Generate new 256-bit key
      key = CryptoJS.lib.WordArray.random(32).toString();
      localStorage.setItem(keyStorageKey, key);
    }
    
    return key; // key is guaranteed to be string here since we assign it above
  }

  /**
   * Encrypt data with AES-256-CBC
   */
  private encrypt(data: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    return encrypted;
  }

  /**
   * Decrypt data with AES-256-CBC
   */
  private decrypt(encryptedData: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Compute SHA-256 hash for integrity verification
   */
  private computeHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Verify data integrity
   */
  private verifyHash(data: string, expectedHash: string): boolean {
    const actualHash = this.computeHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Store encrypted data with integrity verification
   */
  setItem<T>(key: string, value: T): void {
    try {
      const serializedData = JSON.stringify(value);
      const hash = this.computeHash(serializedData);
      const encryptedData = this.encrypt(serializedData);
      
      const storageItem: EncryptedStorageItem = {
        data: encryptedData,
        hash,
        timestamp: Date.now(),
        version: this.version
      };
      
      localStorage.setItem(`${this.storageKey}-${key}`, JSON.stringify(storageItem));
    } catch (error) {
      console.error('[EncryptedStorage] Error storing data:', error);
      throw new Error('Failed to store encrypted data');
    }
  }

  /**
   * Retrieve and decrypt data with integrity verification
   */
  getItem<T>(key: string): T | null {
    try {
      const storedData = localStorage.getItem(`${this.storageKey}-${key}`);
      if (!storedData) {
        return null;
      }

      const storageItem: EncryptedStorageItem = JSON.parse(storedData);
      
      // Verify storage format version
      if (storageItem.version !== this.version) {
        console.warn('[EncryptedStorage] Version mismatch, clearing data');
        this.removeItem(key);
        return null;
      }

      // Decrypt data
      const decryptedData = this.decrypt(storageItem.data);
      
      // Verify integrity
      if (!this.verifyHash(decryptedData, storageItem.hash)) {
        console.error('[EncryptedStorage] Data integrity check failed');
        this.removeItem(key); // Remove tampered data
        throw new Error('Data integrity verification failed - possible tampering detected');
      }

      return JSON.parse(decryptedData) as T;
    } catch (error) {
      console.error('[EncryptedStorage] Error retrieving data:', error);
      if (error instanceof Error && error.message.includes('integrity')) {
        throw error; // Re-throw integrity errors
      }
      return null;
    }
  }

  /**
   * Remove encrypted data
   */
  removeItem(key: string): void {
    localStorage.removeItem(`${this.storageKey}-${key}`);
  }

  /**
   * Clear all encrypted data for this storage instance
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.storageKey}-`)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Validate session integrity without decrypting
   */
  validateIntegrity(key: string): boolean {
    try {
      const storedData = localStorage.getItem(`${this.storageKey}-${key}`);
      if (!storedData) {
        return false;
      }

      const storageItem: EncryptedStorageItem = JSON.parse(storedData);
      const decryptedData = this.decrypt(storageItem.data);
      
      return this.verifyHash(decryptedData, storageItem.hash);
    } catch (error) {
      console.error('[EncryptedStorage] Integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Detect if data has been tampered with
   */
  detectTampering(key: string): boolean {
    return !this.validateIntegrity(key);
  }

  /**
   * Get metadata about stored item without decrypting
   */
  getMetadata(key: string): { timestamp: number; version: string } | null {
    try {
      const storedData = localStorage.getItem(`${this.storageKey}-${key}`);
      if (!storedData) {
        return null;
      }

      const storageItem: EncryptedStorageItem = JSON.parse(storedData);
      return {
        timestamp: storageItem.timestamp,
        version: storageItem.version
      };
    } catch (error) {
      console.error('[EncryptedStorage] Error getting metadata:', error);
      return null;
    }
  }
}

// Create default instance for SIWS sessions
export const encryptedSessionStorage = new EncryptedStorage('siws-session');

// Export the class for custom instances
export { EncryptedStorage };
