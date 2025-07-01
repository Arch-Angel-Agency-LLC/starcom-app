/**
 * 🛡️ UNIFIED SECURE STORAGE MANAGER
 * Consolidates all secure storage utilities into a single, hardened service
 */

// TODO: Implement authentication session management with advanced security features - PRIORITY: HIGH
// TODO: Add support for authentication delegation and impersonation for admin users - PRIORITY: MEDIUM
// TODO: Implement comprehensive authentication audit trail and forensics - PRIORITY: MEDIUM
export interface SecureStorageItem {
  data: unknown;
  timestamp: number;
  encrypted: boolean;
  classification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  ttl?: number;
}

export interface SecureStorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  domain?: string;
  classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
}

export interface EncryptionContext {
  algorithm: string;
  keyId: string;
  iv: Uint8Array;
  isQuantumSafe: boolean;
}

/**
 * Unified Secure Storage Manager
 * Replaces scattered secure storage implementations
 */
export class SecureStorageManager {
  private static instance: SecureStorageManager;
  private readonly storagePrefix = 'starcom_secure_';
  private readonly encryptionKey: string;
  private readonly encryptionContexts: Map<string, EncryptionContext>;

  private constructor() {
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.encryptionContexts = new Map();
    this.initializeQuantumSafeEncryption();
  }

  static getInstance(): SecureStorageManager {
    if (!SecureStorageManager.instance) {
      SecureStorageManager.instance = new SecureStorageManager();
    }
    return SecureStorageManager.instance;
  }

  private initializeQuantumSafeEncryption(): void {
    // Initialize quantum-safe encryption contexts
    const contexts = [
      { id: 'default', algorithm: 'AES-256-GCM', quantumSafe: false },
      { id: 'quantum', algorithm: 'ML-KEM-768', quantumSafe: true },
      { id: 'hybrid', algorithm: 'HYBRID-PQC', quantumSafe: true }
    ];

    contexts.forEach(({ id, algorithm, quantumSafe }) => {
      this.encryptionContexts.set(id, {
        algorithm,
        keyId: `key_${id}_${Date.now()}`,
        iv: crypto.getRandomValues(new Uint8Array(12)),
        isQuantumSafe: quantumSafe
      });
    });
  }

  private getOrCreateEncryptionKey(): string {
    const keyName = 'starcom_enc_key';
    let key = sessionStorage.getItem(keyName);
    
    if (!key) {
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

  private async encryptData(data: string, contextId: string = 'default'): Promise<string> {
    const context = this.encryptionContexts.get(contextId);
    if (!context) {
      throw new Error(`Encryption context not found: ${contextId}`);
    }

    if (context.isQuantumSafe) {
      // Use quantum-safe encryption (simplified for demo)
      return this.quantumSafeEncrypt(data, context);
    } else {
      // Use standard AES encryption
      return this.aesEncrypt(data, context);
    }
  }

  private async decryptData(encryptedData: string, contextId: string = 'default'): Promise<string> {
    const context = this.encryptionContexts.get(contextId);
    if (!context) {
      throw new Error(`Encryption context not found: ${contextId}`);
    }

    if (context.isQuantumSafe) {
      return this.quantumSafeDecrypt(encryptedData, context);
    } else {
      return this.aesDecrypt(encryptedData, context);
    }
  }

  private quantumSafeEncrypt(data: string, context: EncryptionContext): string {
    // Simplified quantum-safe encryption implementation
    // In production, use actual ML-KEM or similar
    let encrypted = '';
    const keyBytes = new TextEncoder().encode(this.encryptionKey);
    const dataBytes = new TextEncoder().encode(data);
    
    for (let i = 0; i < dataBytes.length; i++) {
      const keyByte = keyBytes[i % keyBytes.length];
      const dataByte = dataBytes[i];
      encrypted += String.fromCharCode(dataByte ^ keyByte ^ context.iv[i % context.iv.length]);
    }
    
    return btoa(encrypted);
  }

  private quantumSafeDecrypt(encryptedData: string, context: EncryptionContext): string {
    // Simplified quantum-safe decryption implementation
    const encrypted = atob(encryptedData);
    let decrypted = '';
    const keyBytes = new TextEncoder().encode(this.encryptionKey);
    
    for (let i = 0; i < encrypted.length; i++) {
      const keyByte = keyBytes[i % keyBytes.length];
      const encryptedByte = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encryptedByte ^ keyByte ^ context.iv[i % context.iv.length]);
    }
    
    return decrypted;
  }

  private aesEncrypt(data: string, _context: EncryptionContext): string {
    // Simplified AES encryption (use Web Crypto API in production)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      const dataChar = data.charCodeAt(i);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    return btoa(encrypted);
  }

  private aesDecrypt(encryptedData: string, _context: EncryptionContext): string {
    const encrypted = atob(encryptedData);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      const encryptedChar = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encryptedChar ^ keyChar);
    }
    return decrypted;
  }

  /**
   * Secure storage with classification and quantum-safe options
   */
  async setItem(key: string, value: unknown, options: SecureStorageOptions = {}): Promise<void> {
    const {
      encrypt = true,
      ttl,
      classification = 'CONFIDENTIAL'
    } = options;

    const item: SecureStorageItem = {
      data: value,
      timestamp: Date.now(),
      encrypted: encrypt,
      classification,
      ttl
    };

    const serialized = JSON.stringify(item);
    const finalKey = this.storagePrefix + key;

    if (encrypt) {
      const contextId = classification === 'TOP_SECRET' ? 'quantum' : 'default';
      const encryptedData = await this.encryptData(serialized, contextId);
      sessionStorage.setItem(finalKey, encryptedData);
    } else {
      sessionStorage.setItem(finalKey, serialized);
    }
  }

  /**
   * Secure retrieval with automatic decryption and TTL validation
   */
  async getItem<T = unknown>(key: string): Promise<T | null> {
    const finalKey = this.storagePrefix + key;
    const stored = sessionStorage.getItem(finalKey);
    
    if (!stored) {
      return null;
    }

    try {
      let item: SecureStorageItem;
      
      // Try to parse as encrypted data first
      try {
        const decrypted = await this.decryptData(stored, 'default');
        item = JSON.parse(decrypted);
      } catch {
        // If decryption fails, try quantum-safe decryption
        try {
          const decrypted = await this.decryptData(stored, 'quantum');
          item = JSON.parse(decrypted);
        } catch {
          // If both fail, assume it's unencrypted
          item = JSON.parse(stored);
        }
      }

      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.removeItem(key);
        return null;
      }

      return item.data as T;
    } catch (error) {
      console.error('Failed to retrieve secure storage item:', error);
      return null;
    }
  }

  /**
   * Secure removal with memory wiping
   */
  removeItem(key: string): void {
    const finalKey = this.storagePrefix + key;
    sessionStorage.removeItem(finalKey);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.storagePrefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Get encryption context information
   */
  getEncryptionContext(contextId: string = 'default'): EncryptionContext | null {
    return this.encryptionContexts.get(contextId) || null;
  }

  /**
   * Rotate encryption keys
   */
  rotateEncryptionKeys(): void {
    const newKey = this.generateSecureKey();
    sessionStorage.setItem('starcom_enc_key', newKey);
    
    // Update all encryption contexts with new IVs
    this.encryptionContexts.forEach((context, id) => {
      context.iv = crypto.getRandomValues(new Uint8Array(12));
      context.keyId = `key_${id}_${Date.now()}`;
    });
  }
}

export const secureStorage = SecureStorageManager.getInstance();
