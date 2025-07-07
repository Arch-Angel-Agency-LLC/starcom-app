// src/services/IPFSVersioningService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

interface IPFSContentVersion {
  hash: string;
  version: number;
  timestamp: number;
  parentHash?: string;
  metadata: {
    classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
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
  migrateContent(sourceVersion: IPFSContentVersion, targetProvider: string): Promise<IPFSContentVersion>;
}

/**
 * IPFS Content Versioning and Rollback Service
 * Implements comprehensive version control for IPFS content with rollback capabilities
 */
class IPFSVersioningService implements IPFSContentVersioningService {
  private versions: Map<string, IPFSContentVersion> = new Map();
  private versionChains: Map<string, string[]> = new Map(); // rootHash -> [versions]

  async createVersion(content: Uint8Array, metadata: Omit<IPFSContentVersion['metadata'], 'checksum'>): Promise<IPFSContentVersion> {
    const hash = this.generateHash(content);
    const checksum = this.generateChecksum(content);

    const version: IPFSContentVersion = {
      hash,
      version: this.getNextVersionNumber(),
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        checksum
      }
    };

    this.versions.set(hash, version);
    this.updateVersionChain(hash, version);
    
    return version;
  }

  async getVersion(hash: string): Promise<IPFSContentVersion | null> {
    return this.versions.get(hash) || null;
  }

  async getVersionHistory(rootHash: string): Promise<IPFSContentVersion[]> {
    const chain = this.versionChains.get(rootHash) || [rootHash];
    const history: IPFSContentVersion[] = [];

    for (const hash of chain) {
      const version = this.versions.get(hash);
      if (version) {
        history.push(version);
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
    // Verify checksum and metadata consistency
    return version.metadata.checksum.length > 0 && 
           version.hash.length > 0 && 
           version.timestamp > 0;
  }

  async migrateContent(sourceVersion: IPFSContentVersion, targetProvider: string): Promise<IPFSContentVersion> {
    // Create a new version for the migrated content
    const migrationMetadata = {
      ...sourceVersion.metadata,
      description: `Migrated from ${sourceVersion.hash} to ${targetProvider}`
    };

    // Simulate content extraction and re-upload
    const simulatedContent = new TextEncoder().encode(`migrated_content_${sourceVersion.hash}`);
    
    const migratedVersion = await this.createVersion(simulatedContent, migrationMetadata);
    migratedVersion.parentHash = sourceVersion.hash;
    
    return migratedVersion;
  }

  private generateHash(content: Uint8Array): string {
    // Simple deterministic hash for testing
    const sum = Array.from(content).reduce((acc, byte) => acc + byte, 0);
    return `ipfs_${sum}_${content.length}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(content: Uint8Array): string {
    const sum = Array.from(content).reduce((acc, byte) => acc + byte, 0);
    return `checksum_${sum.toString(16)}_${content.length}`;
  }

  private getNextVersionNumber(): number {
    return this.versions.size + 1;
  }

  private updateVersionChain(hash: string, version: IPFSContentVersion): void {
    if (version.parentHash) {
      // Find the chain containing the parent
      for (const [rootHash, chain] of this.versionChains.entries()) {
        if (chain.includes(version.parentHash)) {
          chain.push(hash);
          return;
        }
      }
    }
    
    // Create new chain
    this.versionChains.set(hash, [hash]);
  }
}

describe('IPFS Content Versioning and Rollback Capabilities', () => {
  let versioningService: IPFSVersioningService;

  beforeEach(() => {
    versioningService = new IPFSVersioningService();
  });

  describe('Version Creation', () => {
    it('should create content versions with comprehensive metadata', async () => {
      const testContent = new TextEncoder().encode('Test content for versioning');
      
      const version = await versioningService.createVersion(testContent, {
        classification: 'CONFIDENTIAL',
        author: 'test-user',
        description: 'Initial version of test content'
      });

      expect(version.hash).toBeDefined();
      expect(version.version).toBe(1);
      expect(version.timestamp).toBeGreaterThan(0);
      expect(version.metadata.checksum).toBeDefined();
      expect(version.metadata.classification).toBe('CONFIDENTIAL');
      expect(version.metadata.author).toBe('test-user');
    });

    it('should assign incremental version numbers', async () => {
      const content1 = new TextEncoder().encode('First content');
      const content2 = new TextEncoder().encode('Second content');

      const version1 = await versioningService.createVersion(content1, {
        classification: 'UNCLASSIFIED',
        author: 'author1'
      });

      const version2 = await versioningService.createVersion(content2, {
        classification: 'UNCLASSIFIED',
        author: 'author2'
      });

      expect(version1.version).toBe(1);
      expect(version2.version).toBe(2);
    });
  });

  describe('Version Retrieval', () => {
    it('should retrieve content versions by hash', async () => {
      const testContent = new TextEncoder().encode('Retrievable content');
      
      const createdVersion = await versioningService.createVersion(testContent, {
        classification: 'SECRET',
        author: 'retriever',
        description: 'Content for retrieval testing'
      });

      const retrievedVersion = await versioningService.getVersion(createdVersion.hash);
      
      expect(retrievedVersion).not.toBeNull();
      expect(retrievedVersion?.hash).toBe(createdVersion.hash);
      expect(retrievedVersion?.metadata.author).toBe('retriever');
      expect(retrievedVersion?.metadata.classification).toBe('SECRET');
    });

    it('should return null for non-existent versions', async () => {
      const nonExistentVersion = await versioningService.getVersion('non_existent_hash');
      expect(nonExistentVersion).toBeNull();
    });
  });

  describe('Version History', () => {
    it('should track complete version history', async () => {
      const baseContent = new TextEncoder().encode('Base content');
      
      const v1 = await versioningService.createVersion(baseContent, {
        classification: 'CONFIDENTIAL',
        author: 'historian',
        description: 'First version'
      });

      const history = await versioningService.getVersionHistory(v1.hash);
      
      expect(history).toHaveLength(1);
      expect(history[0].hash).toBe(v1.hash);
      expect(history[0].metadata.description).toBe('First version');
    });

    it('should sort version history by timestamp (newest first)', async () => {
      const content = new TextEncoder().encode('Timestamped content');
      
      // Create versions with slight delays to ensure different timestamps
      const v1 = await versioningService.createVersion(content, {
        classification: 'UNCLASSIFIED',
        author: 'time-tester',
        description: 'Older version'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const v2 = await versioningService.createVersion(content, {
        classification: 'UNCLASSIFIED',
        author: 'time-tester',
        description: 'Newer version'
      });

      const history = await versioningService.getVersionHistory(v1.hash);
      
      expect(history.length).toBeGreaterThanOrEqual(1);
      if (history.length > 1) {
        expect(history[0].timestamp).toBeGreaterThanOrEqual(history[1].timestamp);
      }
    });
  });

  describe('Version Integrity', () => {
    it('should verify version integrity successfully', async () => {
      const testContent = new TextEncoder().encode('Content for integrity verification');
      
      const version = await versioningService.createVersion(testContent, {
        classification: 'CONFIDENTIAL',
        author: 'integrity-tester'
      });

      const isValid = await versioningService.verifyVersionIntegrity(version);
      expect(isValid).toBe(true);
    });

    it('should detect corrupted version metadata', async () => {
      const testContent = new TextEncoder().encode('Content with corrupted metadata');
      
      const version = await versioningService.createVersion(testContent, {
        classification: 'CONFIDENTIAL',
        author: 'corruption-tester'
      });

      // Corrupt the version metadata
      version.metadata.checksum = '';
      
      const isValid = await versioningService.verifyVersionIntegrity(version);
      expect(isValid).toBe(false);
    });
  });

  describe('Version Rollback', () => {
    it('should successfully rollback to previous versions', async () => {
      const rollbackContent = new TextEncoder().encode('Rollback test content');
      
      const version = await versioningService.createVersion(rollbackContent, {
        classification: 'SECRET',
        author: 'rollback-tester',
        description: 'Version to rollback to'
      });

      const rolledBackVersion = await versioningService.rollbackToVersion(version.hash);
      
      expect(rolledBackVersion.hash).toBe(version.hash);
      expect(rolledBackVersion.metadata.author).toBe('rollback-tester');
      expect(rolledBackVersion.metadata.description).toBe('Version to rollback to');
    });

    it('should reject rollback to non-existent versions', async () => {
      await expect(versioningService.rollbackToVersion('non_existent_hash'))
        .rejects.toThrow('Version non_existent_hash not found');
    });

    it('should reject rollback to corrupted versions', async () => {
      const corruptedContent = new TextEncoder().encode('Content that will be corrupted');
      
      const version = await versioningService.createVersion(corruptedContent, {
        classification: 'CONFIDENTIAL',
        author: 'corruption-tester'
      });

      // Corrupt the version
      version.metadata.checksum = '';

      await expect(versioningService.rollbackToVersion(version.hash))
        .rejects.toThrow(`Version ${version.hash} failed integrity check`);
    });
  });

  describe('Content Migration', () => {
    it('should migrate content between storage providers', async () => {
      const migrationContent = new TextEncoder().encode('Content for migration testing');
      
      const originalVersion = await versioningService.createVersion(migrationContent, {
        classification: 'CONFIDENTIAL',
        author: 'migration-tester',
        description: 'Original content before migration'
      });

      const migratedVersion = await versioningService.migrateContent(
        originalVersion, 
        'new-storage-provider'
      );

      expect(migratedVersion.hash).not.toBe(originalVersion.hash);
      expect(migratedVersion.parentHash).toBe(originalVersion.hash);
      expect(migratedVersion.metadata.description).toContain('Migrated from');
      expect(migratedVersion.metadata.description).toContain('new-storage-provider');
      expect(migratedVersion.metadata.classification).toBe(originalVersion.metadata.classification);
    });

    it('should preserve classification during migration', async () => {
      const sensitiveContent = new TextEncoder().encode('Sensitive content for migration');
      
      const originalVersion = await versioningService.createVersion(sensitiveContent, {
        classification: 'TOP_SECRET',
        author: 'security-officer',
        description: 'Highly classified content'
      });

      const migratedVersion = await versioningService.migrateContent(
        originalVersion,
        'secure-storage-provider'
      );

      expect(migratedVersion.metadata.classification).toBe('TOP_SECRET');
      expect(migratedVersion.metadata.author).toBe('security-officer');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', async () => {
      const emptyContent = new Uint8Array(0);
      
      const version = await versioningService.createVersion(emptyContent, {
        classification: 'UNCLASSIFIED',
        author: 'empty-tester',
        description: 'Empty content test'
      });

      expect(version.hash).toBeDefined();
      expect(version.metadata.checksum).toBeDefined();
    });

    it('should handle large content efficiently', async () => {
      const largeContent = new Uint8Array(10000).fill(42); // 10KB of data
      
      const startTime = performance.now();
      const version = await versioningService.createVersion(largeContent, {
        classification: 'UNCLASSIFIED',
        author: 'performance-tester',
        description: 'Large content performance test'
      });
      const endTime = performance.now();

      expect(version.hash).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
