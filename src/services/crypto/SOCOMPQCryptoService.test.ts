// src/services/crypto/SOCOMPQCryptoService.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { SOCOMPQCryptoService, ClassificationLevel } from './SOCOMPQCryptoService';

// TODO: Implement IPFS content migration between different storage providers - PRIORITY: LOW

interface IPFSContentVersion {
  hash: string;
  version: number;
  timestamp: number;
  parentHash?: string;
  metadata: {
    classification: ClassificationLevel;
    author: string;
    description?: string;
    checksum: string;
  };
}

interface IPFSContentVersioningService {
  createVersion(content: Uint8Array, metadata: Omit<IPFSContentVersion['metadata'], 'checksum'>): Promise<IPFSContentVersion>;
  getVersion(hash: string): Promise<IPFSContentVersion | null>;
  getVersionHistory(rootHash: string): Promise<IPFSContentVersion[]>;
  rollbackToVersion(targetHash: string): Promise<IPFSContentVersion>;
  verifyVersionIntegrity(version: IPFSContentVersion): Promise<boolean>;
}

// Mock implementation of IPFS content versioning
class MockIPFSVersioningService implements IPFSContentVersioningService {
  private versions: Map<string, IPFSContentVersion> = new Map();
  private cryptoService: SOCOMPQCryptoService;

  constructor(cryptoService: SOCOMPQCryptoService) {
    this.cryptoService = cryptoService;
  }

  async createVersion(content: Uint8Array, metadata: Omit<IPFSContentVersion['metadata'], 'checksum'>): Promise<IPFSContentVersion> {
    // Generate content hash and checksum
    const hash = this.generateHash(content);
    const checksum = await this.generateChecksum(content);

    const version: IPFSContentVersion = {
      hash,
      version: this.getNextVersionNumber(hash),
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        checksum
      }
    };

    this.versions.set(hash, version);
    return version;
  }

  async getVersion(hash: string): Promise<IPFSContentVersion | null> {
    return this.versions.get(hash) || null;
  }

  async getVersionHistory(rootHash: string): Promise<IPFSContentVersion[]> {
    const history: IPFSContentVersion[] = [];
    const visited = new Set<string>();
    let currentHash: string | undefined = rootHash;

    while (currentHash && !visited.has(currentHash)) {
      const version = this.versions.get(currentHash);
      if (version) {
        history.push(version);
        visited.add(currentHash);
        currentHash = version.parentHash;
      } else {
        break;
      }
    }

    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  async rollbackToVersion(targetHash: string): Promise<IPFSContentVersion> {
    const targetVersion = this.versions.get(targetHash);
    if (!targetVersion) {
      throw new Error(`Version ${targetHash} not found`);
    }

    // Verify integrity before rollback
    const isValid = await this.verifyVersionIntegrity(targetVersion);
    if (!isValid) {
      throw new Error(`Version ${targetHash} failed integrity check`);
    }

    return targetVersion;
  }

  async verifyVersionIntegrity(version: IPFSContentVersion): Promise<boolean> {
    // In a real implementation, this would verify the content against the stored checksum
    // For testing, we'll simulate verification
    return version.metadata.checksum.length > 0;
  }

  private generateHash(content: Uint8Array): string {
    // Simple hash generation for testing
    return `ipfs_${content.length}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateChecksum(content: Uint8Array): Promise<string> {
    // Use crypto service for secure checksum
    const encrypted = await this.cryptoService.encryptClassifiedData(content, ClassificationLevel.Confidential);
    return btoa(String.fromCharCode(...encrypted.quantumPart.slice(0, 32)));
  }

  private getNextVersionNumber(hash: string): number {
    const existingVersions = Array.from(this.versions.values())
      .filter(v => v.hash.startsWith(hash.split('_')[1]))
      .length;
    return existingVersions + 1;
  }
}
describe('SOCOMPQCryptoService', () => {
  let cryptoService: SOCOMPQCryptoService;
  let versioningService: MockIPFSVersioningService;

  beforeAll(async () => {
    cryptoService = SOCOMPQCryptoService.getInstance();
    await cryptoService.initialize();
    versioningService = new MockIPFSVersioningService(cryptoService);
  });

  it('should initialize successfully', async () => {
    expect(cryptoService).toBeInstanceOf(SOCOMPQCryptoService);
  });

  it('should generate key pairs', async () => {
    const keyPair = await cryptoService.generateKEMKeyPair();
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.publicKey.length).toBeGreaterThan(0);
    expect(keyPair.privateKey.length).toBeGreaterThan(0);
    expect(keyPair.algorithm).toBe('ML-KEM-768');
  });

  it('should encrypt and decrypt data', async () => {
    const originalData = 'Test message for encryption';
    
    const encrypted = await cryptoService.encryptClassifiedData(
      originalData, 
      ClassificationLevel.Confidential
    );
    
    expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
    expect(encrypted.metadata.classification).toBe(ClassificationLevel.Confidential);
    expect(encrypted.metadata.algorithm).toBe('ChaCha20-Poly1305');
    
    const decrypted = await cryptoService.decryptClassifiedData(
      encrypted
    );
    
    expect(decrypted).toBe('Test message for encryption');
  });

  // IPFS Content Versioning Tests
  describe('IPFS Content Versioning', () => {
    it('should create content versions with metadata', async () => {
      const testContent = new TextEncoder().encode('Test content for versioning');
      
      const version = await versioningService.createVersion(testContent, {
        classification: ClassificationLevel.Confidential,
        author: 'test-user',
        description: 'Initial version of test content'
      });

      expect(version.hash).toBeDefined();
      expect(version.version).toBe(1);
      expect(version.metadata.checksum).toBeDefined();
      expect(version.metadata.classification).toBe(ClassificationLevel.Confidential);
    });

    it('should retrieve content versions by hash', async () => {
      const testContent = new TextEncoder().encode('Another test content');
      
      const createdVersion = await versioningService.createVersion(testContent, {
        classification: ClassificationLevel.Secret,
        author: 'test-user-2',
        description: 'Second test content'
      });

      const retrievedVersion = await versioningService.getVersion(createdVersion.hash);
      
      expect(retrievedVersion).not.toBeNull();
      expect(retrievedVersion?.hash).toBe(createdVersion.hash);
      expect(retrievedVersion?.metadata.author).toBe('test-user-2');
    });

    it('should verify version integrity', async () => {
      const testContent = new TextEncoder().encode('Content for integrity test');
      
      const version = await versioningService.createVersion(testContent, {
        classification: ClassificationLevel.Confidential,
        author: 'integrity-tester'
      });

      const isValid = await versioningService.verifyVersionIntegrity(version);
      expect(isValid).toBe(true);
    });

    it('should handle rollback to previous versions', async () => {
      const testContent = new TextEncoder().encode('Rollback test content');
      
      const version = await versioningService.createVersion(testContent, {
        classification: ClassificationLevel.Secret,
        author: 'rollback-tester'
      });

      const rolledBackVersion = await versioningService.rollbackToVersion(version.hash);
      
      expect(rolledBackVersion.hash).toBe(version.hash);
      expect(rolledBackVersion.metadata.author).toBe('rollback-tester');
    });

    it('should track version history', async () => {
      const baseContent = new TextEncoder().encode('Base content');
      
      const v1 = await versioningService.createVersion(baseContent, {
        classification: ClassificationLevel.Confidential,
        author: 'historian'
      });

      const history = await versioningService.getVersionHistory(v1.hash);
      
      expect(history).toHaveLength(1);
      expect(history[0].hash).toBe(v1.hash);
    });
  });

  it('should enforce classification access control', async () => {
    const originalData = new TextEncoder().encode('Top Secret Data');
    
    const encrypted = await cryptoService.encryptClassifiedData(
      originalData, 
      ClassificationLevel.TopSecret
    );
    
    // Should fail with insufficient clearance
    await expect(
      cryptoService.decryptClassifiedData(encrypted, ClassificationLevel.Confidential)
    ).rejects.toThrow();
  });

  it('should generate consistent hashes', async () => {
    const testData = new TextEncoder().encode('Test data for hashing');
    
    const hash1 = await cryptoService.hashData(testData, 'BLAKE3');
    const hash2 = await cryptoService.hashData(testData, 'BLAKE3');
    
    expect(hash1).toBeInstanceOf(Uint8Array);
    expect(hash2).toBeInstanceOf(Uint8Array);
    expect(hash1).toEqual(hash2);
  });

  it('should generate random bytes', async () => {
    const randomBytes1 = await cryptoService.generateRandomBytes(32);
    const randomBytes2 = await cryptoService.generateRandomBytes(32);
    
    expect(randomBytes1).toBeInstanceOf(Uint8Array);
    expect(randomBytes2).toBeInstanceOf(Uint8Array);
    expect(randomBytes1.length).toBe(32);
    expect(randomBytes2.length).toBe(32);
    expect(randomBytes1).not.toEqual(randomBytes2); // Should be different
  });

  it('should maintain audit log', async () => {
    const auditLog = await cryptoService.getAuditLog();
    expect(Array.isArray(auditLog)).toBe(true);
    expect(auditLog.length).toBeGreaterThan(0);
  });

  it('should provide version information', async () => {
    const status = await cryptoService.getSecurityStatus();
    expect(typeof status.wasmVersion).toBe('string');
    expect(status.wasmVersion.length).toBeGreaterThan(0);
  });
});
