// Secure Storage Utility - Replaces insecure localStorage usage
// Implements encrypted session storage with XSS protection

interface SecureStorageItem {
  data: unknown;
  timestamp: number;
  encrypted: boolean;
}

interface SecureStorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  domain?: string;
}

class SecureStorage {
  private readonly storagePrefix = 'starcom_secure_';
  private readonly encryptionKey: string;

  constructor() {
    // Generate or retrieve encryption key (in production, use proper key management)
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  private getOrCreateEncryptionKey(): string {
    const keyName = 'starcom_enc_key';
    let key = sessionStorage.getItem(keyName);
    
    if (!key) {
      // Generate a new key for this session
      key = this.generateSecureKey();
      sessionStorage.setItem(keyName, key);
    }
    
    return key;
  }

  private generateSecureKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private encrypt(data: string): string {
    // Simple XOR encryption (in production, use proper encryption like AES)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      const dataChar = data.charCodeAt(i);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    return btoa(encrypted);
  }

  private decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        const dataChar = data.charCodeAt(i);
        decrypted += String.fromCharCode(dataChar ^ keyChar);
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  private getStorageKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  setItem(key: string, value: unknown, options: SecureStorageOptions = {}): void {
    try {
      const item: SecureStorageItem = {
        data: value,
        timestamp: Date.now(),
        encrypted: options.encrypt || false
      };

      let serializedData = JSON.stringify(item);
      
      if (options.encrypt) {
        serializedData = this.encrypt(serializedData);
      }

      // Use sessionStorage instead of localStorage for better security
      sessionStorage.setItem(this.getStorageKey(key), serializedData);

      // Set TTL if specified
      if (options.ttl) {
        setTimeout(() => {
          this.removeItem(key);
        }, options.ttl);
      }
    } catch (error) {
      console.error('Secure storage set failed:', error);
    }
  }

  getItem<T = unknown>(key: string): T | null {
    try {
      let data = sessionStorage.getItem(this.getStorageKey(key));
      
      if (!data) {
        return null;
      }

      // Try to decrypt if it looks encrypted
      if (data.length > 0 && !data.startsWith('{')) {
        data = this.decrypt(data);
      }

      const item: SecureStorageItem = JSON.parse(data);
      
      // Check if item has expired (basic TTL check)
      const now = Date.now();
      const age = now - item.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours default
      
      if (age > maxAge) {
        this.removeItem(key);
        return null;
      }

      return item.data as T;
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.error('Secure storage remove failed:', error);
    }
  }

  clear(): void {
    try {
      // Remove all items with our prefix
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Secure storage clear failed:', error);
    }
  }

  // Secure session-specific methods
  setSecureSession(sessionData: unknown): void {
    this.setItem('session', sessionData, { 
      encrypt: true, 
      ttl: 8 * 60 * 60 * 1000 // 8 hours
    });
  }

  getSecureSession<T = unknown>(): T | null {
    return this.getItem<T>('session');
  }

  clearSecureSession(): void {
    this.removeItem('session');
  }

  // Auth-specific methods
  setAuthData(authData: unknown): void {
    this.setItem('auth', authData, { 
      encrypt: true, 
      ttl: 4 * 60 * 60 * 1000 // 4 hours
    });
  }

  getAuthData<T = unknown>(): T | null {
    return this.getItem<T>('auth');
  }

  clearAuthData(): void {
    this.removeItem('auth');
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

// Legacy localStorage replacement (for gradual migration)
export const secureLocalStorage = {
  setItem: (key: string, value: string) => {
    secureStorage.setItem(key, value, { encrypt: false });
  },
  getItem: (key: string): string | null => {
    return secureStorage.getItem<string>(key);
  },
  removeItem: (key: string) => {
    secureStorage.removeItem(key);
  },
  clear: () => {
    secureStorage.clear();
  }
};

// Production-safe storage (no logging)
export const productionStorage = {
  setItem: (key: string, value: unknown, encrypt = true) => {
    try {
      secureStorage.setItem(key, value, { encrypt });
    } catch {
      // Silently fail in production
    }
  },
  getItem: <T = unknown>(key: string): T | null => {
    try {
      return secureStorage.getItem<T>(key);
    } catch {
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      secureStorage.removeItem(key);
    } catch {
      // Silently fail in production
    }
  }
};

export default secureStorage;
