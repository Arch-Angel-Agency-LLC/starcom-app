/**
 * DataVaultService - Service implementation for DataVault interface
 * 
 * Implements secure export/import functionality for Intel data including:
 * - Encryption/decryption with multiple algorithms
 * - Compression/decompression for efficient storage
 * - Password protection and integrity validation
 * - Export/import workflows for secure Intel sharing
 * 
 * Based on foundation interface: /src/types/DataVault.ts
 */

import { 
  DataVault, 
  IntelDataVault, 
  IntelReportDataVault,
  EncryptionConfig,
  CompressionConfig,
  ExportOptions,
  ImportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  IntelExportMetadata,
  IntelReportExportMetadata,
  ContentManifest,
  ContentFileInfo,
  SourceProtectionLevel,
  RetentionPolicy,
  AccessLogEntry,
  ApprovalEntry,
  AnalysisLock,
  DistributionEntry
} from '../types/intel-foundation';

// Import additional types from existing system
import type { IntelReportMetadata } from '../types/IntelReportArchitecture';

// Define generic Intel data type for service operations
interface IntelData {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

interface IntelReportData {
  id: string;
  title: string;
  content: string;
  metadata?: IntelReportMetadata;
}

/**
 * Core DataVault service implementing secure export/import operations
 */
export class DataVaultService {
  private compressionLevel: number = 6;
  private defaultEncryption: EncryptionConfig = {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
    saltLength: 32,
    ivLength: 16
  };

  /**
   * Encrypt data using specified configuration
   */
  async encrypt(data: ArrayBuffer, config: EncryptionConfig, password: string): Promise<ArrayBuffer> {
    try {
      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(config.saltLength));
      const iv = crypto.getRandomValues(new Uint8Array(config.ivLength));
      
      // Derive key from password
      const keyMaterial = await this.importKeyMaterial(password);
      const key = await this.deriveKey(keyMaterial, salt, config);
      
      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        { name: config.algorithm.split('-')[0], iv },
        key,
        data
      );
      
      // Combine salt + iv + encrypted data
      const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encryptedData), salt.length + iv.length);
      
      return result.buffer;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using password
   */
  async decrypt(encryptedData: ArrayBuffer, password: string, config: EncryptionConfig): Promise<ArrayBuffer> {
    try {
      const data = new Uint8Array(encryptedData);
      
      // Extract salt, IV, and encrypted content
      const salt = data.slice(0, config.saltLength);
      const iv = data.slice(config.saltLength, config.saltLength + config.ivLength);
      const encrypted = data.slice(config.saltLength + config.ivLength);
      
      // Derive key from password
      const keyMaterial = await this.importKeyMaterial(password);
      const key = await this.deriveKey(keyMaterial, salt, config);
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        { name: config.algorithm.split('-')[0], iv },
        key,
        encrypted
      );
      
      return decryptedData;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`);
    }
  }

  /**
   * Compress data using specified settings
   */
  async compress(data: ArrayBuffer, settings: CompressionConfig): Promise<ArrayBuffer> {
    try {
      // For now, implement basic compression using CompressionStream when available
      // In production, consider using a more robust compression library
      if ('CompressionStream' in window) {
        const stream = new CompressionStream(settings.algorithm);
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        // Write data to compression stream
        await writer.write(new Uint8Array(data));
        await writer.close();
        
        // Read compressed data
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        // Combine chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return result.buffer;
      } else {
        // Fallback: return original data if compression not available
        console.warn('CompressionStream not available, returning uncompressed data');
        return data;
      }
    } catch (error) {
      throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decompress data
   */
  async decompress(compressedData: ArrayBuffer, algorithm: string): Promise<ArrayBuffer> {
    try {
      if ('DecompressionStream' in window) {
        const stream = new DecompressionStream(algorithm);
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        // Write compressed data to decompression stream
        await writer.write(new Uint8Array(compressedData));
        await writer.close();
        
        // Read decompressed data
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        // Combine chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return result.buffer;
      } else {
        // Fallback: return original data if decompression not available
        console.warn('DecompressionStream not available, returning data as-is');
        return compressedData;
      }
    } catch (error) {
      throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an export vault from raw data
   */
  async createExport(
    data: IntelData[], 
    exportType: 'intel' | 'intelReport' | 'intelReportPackage' | 'workspace' | 'mixed',
    options: ExportOptions
  ): Promise<DataVault> {
    try {
      // Serialize data to JSON
      const serializedData = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(serializedData);
      
      // Compress data
      let processedData = dataBuffer.buffer;
      const compressionConfig: CompressionConfig = {
        algorithm: 'gzip',
        level: options.compressionLevel || 6,
        enableDictionary: false
      };
      processedData = await this.compress(processedData, compressionConfig);
      
      // Encrypt if password provided
      if (options.password) {
        const encryptionConfig = this.defaultEncryption;
        processedData = await this.encrypt(processedData, encryptionConfig, options.password);
      }
      
      // Create content manifest
      const manifest: ContentManifest = {
        intelFiles: data.map((item, index) => ({
          path: `intel-${index + 1}.intel`,
          size: JSON.stringify(item).length,
          type: 'intel',
          checksum: crypto.randomUUID(), // Placeholder
          createdAt: new Date().toISOString(),
          metadata: item.metadata || {}
        })),
        reportFiles: [],
        packageFolders: [],
        assetFiles: [],
        totalFiles: data.length,
        totalSize: dataBuffer.byteLength,
        fileTypes: ['intel']
      };
      
      // Create vault
      const vault: DataVault = {
        exportId: crypto.randomUUID(),
        exportedAt: new Date().toISOString(),
        exportType,
        title: `Intel Export - ${data.length} items`,
        description: `Exported ${data.length} Intel items`,
        exportedBy: 'system',
        
        encryption: this.defaultEncryption,
        passwordProtection: {
          minLength: 8,
          requireSpecialChars: true,
          requireNumbers: true,
          requireMixedCase: true,
          hashingAlgorithm: 'bcrypt'
        },
        compressionSettings: compressionConfig,
        
        contentManifest: manifest,
        content: processedData,
        checksum: await this.calculateChecksum(processedData),
        version: '1.0',
        
        // Implementation methods (will be implemented by the service)
        package: async () => Buffer.from(processedData),
        validate: async () => this.validateVault(vault),
        calculateSize: async () => processedData.byteLength
      };
      
      return vault;
    } catch (error) {
      throw new Error(`Export creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from a vault
   */
  async importFromVault(vaultData: ArrayBuffer, password?: string): Promise<ImportResult> {
    try {
      // Parse vault metadata (assuming it's JSON at the start)
      const vaultString = new TextDecoder().decode(vaultData);
      const vault: DataVault = JSON.parse(vaultString);
      
      // Validate vault
      const validation = await this.validateVault(vault);
      if (!validation.isValid) {
        throw new Error(`Invalid vault: ${validation.errors.join(', ')}`);
      }
      
      // Decrypt if password protected
      let processedData = vault.content;
      if (vault.passwordProtected) {
        if (!password) {
          throw new Error('Password required for encrypted vault');
        }
        if (!vault.encryption) {
          throw new Error('Encryption configuration missing');
        }
        processedData = await this.decrypt(processedData, password, vault.encryption);
      }
      
      // Decompress if compressed
      if (vault.compression) {
        processedData = await this.decompress(processedData, vault.compression.algorithm);
      }
      
      // Parse the final data
      const dataString = new TextDecoder().decode(processedData);
      const importedData = JSON.parse(dataString);
      
      return {
        success: true,
        data: importedData,
        vault,
        importedAt: new Date().toISOString(),
        dataCount: Array.isArray(importedData) ? importedData.length : 1,
        warnings: validation.warnings || [],
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        vault: null,
        importedAt: new Date().toISOString(),
        dataCount: 0,
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown import error']
      };
    }
  }

  /**
   * Validate vault integrity and structure
   */
  async validateVault(vault: DataVault): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Check required fields
      if (!vault.id) errors.push('Vault ID missing');
      if (!vault.version) errors.push('Vault version missing');
      if (!vault.exportType) errors.push('Export type missing');
      if (!vault.content) errors.push('Vault content missing');
      
      // Validate export type
      const validExportTypes = ['intel', 'intelReport', 'intelReportPackage'];
      if (vault.exportType && !validExportTypes.includes(vault.exportType)) {
        errors.push(`Invalid export type: ${vault.exportType}`);
      }
      
      // Validate encryption config if present
      if (vault.passwordProtected && !vault.encryption) {
        errors.push('Password protected vault missing encryption configuration');
      }
      
      // Validate checksum if present
      if (vault.checksum) {
        const calculatedChecksum = await this.calculateChecksum(vault.content);
        if (calculatedChecksum !== vault.checksum) {
          errors.push('Vault checksum mismatch - data may be corrupted');
        }
      } else {
        warnings.push('No checksum available for integrity verification');
      }
      
      // Check size consistency
      if (vault.compression && vault.compressedSize) {
        if (vault.content.byteLength !== vault.compressedSize) {
          warnings.push('Content size does not match reported compressed size');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate SHA-256 checksum for data integrity
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Import key material from password for encryption
   */
  private async importKeyMaterial(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKey(
    keyMaterial: CryptoKey, 
    salt: Uint8Array, 
    config: EncryptionConfig
  ): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
      {
        name: config.keyDerivation,
        salt,
        iterations: config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: config.algorithm.split('-')[0], length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

/**
 * Intel-specific DataVault service with enhanced metadata handling
 */
export class IntelDataVaultService extends DataVaultService {
  /**
   * Create an Intel-specific export vault
   */
  async exportIntelCollection(
    intel: any[], 
    metadata: IntelMetadata,
    options: ExportOptions
  ): Promise<IntelDataVault> {
    const baseVault = await this.createExport(intel, 'intel', options);
    
    const intelVault: IntelDataVault = {
      ...baseVault,
      intelMetadata: metadata,
      sourceFiles: intel.map((item, index) => `intel-${index + 1}.intel`),
      qualityAssessment: metadata.qualityAssessment,
      classification: metadata.visibility,
      sourceProtection: metadata.sensitivity === 'classified' ? 'high' : 'standard',
      
      // Enhanced Intel-specific features
      retentionPolicy: {
        retainUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        autoDelete: false,
        archiveAfter: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      },
      
      accessLog: [],
      versionHistory: [{
        version: '1.0',
        createdAt: new Date().toISOString(),
        changes: 'Initial export',
        author: options.exportedBy || 'unknown'
      }],
      
      auditTrail: [{
        action: 'export',
        timestamp: new Date().toISOString(),
        user: options.exportedBy || 'unknown',
        details: `Exported ${intel.length} Intel items`
      }]
    };
    
    return intelVault;
  }

  /**
   * Import Intel from a specialized Intel vault
   */
  async importIntelFromVault(vault: IntelDataVault, password?: string): Promise<any[]> {
    const importResult = await this.importFromVault(vault.content, password);
    
    if (!importResult.success) {
      throw new Error(`Intel import failed: ${importResult.errors.join(', ')}`);
    }
    
    // Add audit trail entry
    vault.auditTrail.push({
      action: 'import',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: `Imported ${importResult.dataCount} Intel items`
    });
    
    return importResult.data;
  }
}

/**
 * IntelReport-specific DataVault service
 */
export class IntelReportDataVaultService extends DataVaultService {
  /**
   * Create an IntelReport-specific export vault
   */
  async exportIntelReportCollection(
    reports: any[],
    metadata: IntelReportMetadata,
    options: ExportOptions
  ): Promise<IntelReportDataVault> {
    const baseVault = await this.createExport(reports, 'intelReport', options);
    
    const reportVault: IntelReportDataVault = {
      ...baseVault,
      intelMetadata: metadata,
      reportMetadata: metadata,
      sourceFiles: reports.map((item, index) => `report-${index + 1}.intelReport`),
      
      // Report-specific features
      analysisLocks: [],
      collaborationSettings: {
        allowCollaboration: true,
        maxCollaborators: 10,
        requireApproval: metadata.reviewStatus === 'pending'
      },
      
      distributionHistory: [{
        distributedTo: [],
        distributedAt: new Date().toISOString(),
        distributedBy: options.exportedBy || 'unknown',
        restrictions: metadata.disseminationRestrictions || []
      }],
      
      // Inherited from IntelDataVault
      qualityAssessment: metadata.qualityAssessment,
      classification: metadata.visibility,
      sourceProtection: metadata.sensitivity === 'classified' ? 'high' : 'standard',
      retentionPolicy: {
        retainUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        autoDelete: false,
        archiveAfter: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      accessLog: [],
      versionHistory: [{
        version: '1.0',
        createdAt: new Date().toISOString(),
        changes: 'Initial export',
        author: options.exportedBy || 'unknown'
      }],
      auditTrail: [{
        action: 'export',
        timestamp: new Date().toISOString(),
        user: options.exportedBy || 'unknown',
        details: `Exported ${reports.length} Intel reports`
      }]
    };
    
    return reportVault;
  }
}

// Factory function for creating appropriate vault service
export function createDataVaultService(type: 'standard' | 'intel' | 'report' = 'standard') {
  switch (type) {
    case 'intel':
      return new IntelDataVaultService();
    case 'report':
      return new IntelReportDataVaultService();
    default:
      return new DataVaultService();
  }
}

export default DataVaultService;
