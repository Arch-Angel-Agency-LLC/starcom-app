/**
 * NetRunnerDataImporter - NetRunner Intel Import Service
 * 
 * Handles import of Intel data from DataVault packages back into the NetRunner system,
 * providing secure import capabilities for previously exported NetRunner Intel data.
 * 
 * Features:
 * - Import Intel from encrypted DataVault packages
 * - Validation and integrity checking
 * - Conflict resolution for duplicate data
 * - Audit trail for imported data
 * - Integration with existing storage infrastructure
 */

import { createDataVaultService } from '../../../services/DataVaultService';
import { storageOrchestrator } from '../../../core/intel/storage/storageOrchestrator';
import { Intel } from '../../../models/Intel/Intel';
import type { 
  IntelDataVault,
  ImportResult,
  ValidationResult 
} from '../../../types/intel-foundation';

/**
 * NetRunner-specific import configuration
 */
export interface NetRunnerImportConfig {
  validateIntegrity?: boolean;
  allowDuplicates?: boolean;
  conflictResolution?: 'skip' | 'overwrite' | 'rename';
  importedBy?: string;
  preserveOriginalIds?: boolean;
  tagImportedData?: boolean;
  importTag?: string;
}

/**
 * NetRunner import result
 */
export interface NetRunnerImportResult {
  success: boolean;
  importedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  importedIds?: string[];
  skippedIds?: string[];
  errors?: string[];
  warnings?: string[];
  importId?: string;
}

/**
 * Import conflict information
 */
export interface ImportConflict {
  existingId: string;
  existingIntel: Intel;
  incomingIntel: Intel;
  conflictType: 'duplicate_id' | 'duplicate_content' | 'timestamp_mismatch';
}

/**
 * NetRunnerDataImporter service for importing Intel from DataVault packages
 */
export class NetRunnerDataImporter {
  private intelVaultService;
  
  constructor() {
    // Initialize Intel-specific DataVault service
    this.intelVaultService = createDataVaultService('intel');
  }

  /**
   * Import Intel data from a DataVault package
   */
  async importFromVault(
    vaultData: IntelDataVault,
    password?: string,
    config: NetRunnerImportConfig = {}
  ): Promise<NetRunnerImportResult> {
    try {
      // Validate vault data first
      const validationResult = await this.validateVaultData(vaultData);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(w => w.message)
        };
      }

      // Import Intel from vault using DataVaultService
      const importResult = await this.intelVaultService.importIntelFromVault(vaultData, password);
      
      if (!importResult || importResult.length === 0) {
        return {
          success: false,
          errors: ['No Intel data found in vault or import failed']
        };
      }

      // Process and store the imported Intel
      return await this.processImportedIntel(importResult, config);

    } catch (error) {
      return {
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Import Intel from encrypted vault file
   */
  async importFromEncryptedFile(
    encryptedData: string,
    password: string,
    config: NetRunnerImportConfig = {}
  ): Promise<NetRunnerImportResult> {
    try {
      // Parse the encrypted data as a vault
      const vault = JSON.parse(encryptedData) as IntelDataVault;
      return await this.importFromVault(vault, password, config);

    } catch (error) {
      return {
        success: false,
        errors: [`Failed to parse encrypted file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Preview import without actually importing (dry run)
   */
  async previewImport(
    vaultData: IntelDataVault,
    password?: string,
    config: NetRunnerImportConfig = {}
  ): Promise<{
    success: boolean;
    itemCount?: number;
    conflicts?: ImportConflict[];
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Validate vault data
      const validationResult = await this.validateVaultData(vaultData);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(w => w.message)
        };
      }

      // Import Intel data for preview (don't store)
      const importResult = await this.intelVaultService.importIntelFromVault(vaultData, password);
      
      if (!importResult || importResult.length === 0) {
        return {
          success: false,
          errors: ['No Intel data found in vault']
        };
      }

      // Check for conflicts
      const conflicts = await this.detectConflicts(importResult, config);

      return {
        success: true,
        itemCount: importResult.length,
        conflicts,
        warnings: this.generateImportWarnings(importResult, conflicts)
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate vault data integrity and structure
   */
  private async validateVaultData(vaultData: IntelDataVault): Promise<ValidationResult> {
    const errors: { message: string; code: string }[] = [];
    const warnings: { message: string; code: string }[] = [];

    // Check required fields
    if (!vaultData.id) {
      errors.push({ message: 'Vault missing required ID', code: 'MISSING_ID' });
    }

    if (!vaultData.content) {
      errors.push({ message: 'Vault missing content data', code: 'MISSING_CONTENT' });
    }

    if (!vaultData.intelMetadata) {
      warnings.push({ message: 'Vault missing Intel metadata', code: 'MISSING_METADATA' });
    }

    // Check vault version compatibility
    if (vaultData.version && !this.isVersionCompatible(vaultData.version)) {
      warnings.push({ 
        message: `Vault version ${vaultData.version} may not be fully compatible`, 
        code: 'VERSION_WARNING' 
      });
    }

    // Check content encryption status
    if (vaultData.encrypted && !vaultData.encryptionConfig) {
      warnings.push({ 
        message: 'Encrypted vault missing encryption configuration', 
        code: 'ENCRYPTION_CONFIG_MISSING' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Process imported Intel data and store in the system
   */
  private async processImportedIntel(
    intelData: Intel[],
    config: NetRunnerImportConfig
  ): Promise<NetRunnerImportResult> {
    const result: NetRunnerImportResult = {
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      importedIds: [],
      skippedIds: [],
      errors: [],
      warnings: [],
      importId: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Detect conflicts if not allowing duplicates
    const conflicts = config.allowDuplicates ? [] : await this.detectConflicts(intelData, config);

    for (const intel of intelData) {
      try {
        // Check for conflicts
        const conflict = conflicts.find(c => 
          c.incomingIntel.id === intel.id || 
          this.isContentDuplicate(c.incomingIntel, intel)
        );

        if (conflict) {
          const resolution = await this.resolveConflict(conflict, config);
          
          if (resolution.action === 'skip') {
            result.skippedCount!++;
            result.skippedIds!.push(intel.id);
            continue;
          }
          
          if (resolution.action === 'rename') {
            intel.id = resolution.newId!;
          }
          
          if (resolution.action === 'overwrite') {
            // Will overwrite existing data
          }
        }

        // Prepare Intel for import
        const processedIntel = await this.prepareIntelForImport(intel, config);

        // Store the Intel
        const storageResult = await storageOrchestrator.storeIntel(processedIntel);

        if (storageResult.success) {
          result.importedCount!++;
          result.importedIds!.push(processedIntel.id);
        } else {
          result.errorCount!++;
          result.errors!.push(`Failed to store Intel ${intel.id}: ${storageResult.error}`);
        }

      } catch (error) {
        result.errorCount!++;
        result.errors!.push(`Error processing Intel ${intel.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update success status based on results
    result.success = result.errorCount! === 0 && result.importedCount! > 0;

    return result;
  }

  /**
   * Detect conflicts with existing Intel data
   */
  private async detectConflicts(
    intelData: Intel[],
    config: NetRunnerImportConfig
  ): Promise<ImportConflict[]> {
    const conflicts: ImportConflict[] = [];

    for (const intel of intelData) {
      // Check for ID conflicts
      const existingResult = await storageOrchestrator.getEntity<Intel>(intel.id);
      
      if (existingResult.success && existingResult.data) {
        conflicts.push({
          existingId: existingResult.data.id,
          existingIntel: existingResult.data,
          incomingIntel: intel,
          conflictType: 'duplicate_id'
        });
      }

      // Check for content duplicates (simplified check based on hash or content)
      if (intel.hash) {
        const hashQuery = await storageOrchestrator.queryEntities<Intel>({
          filters: { hash: intel.hash },
          limit: 1
        });

        if (hashQuery.success && hashQuery.data && hashQuery.data.length > 0) {
          conflicts.push({
            existingId: hashQuery.data[0].id,
            existingIntel: hashQuery.data[0],
            incomingIntel: intel,
            conflictType: 'duplicate_content'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve import conflicts based on configuration
   */
  private async resolveConflict(
    conflict: ImportConflict,
    config: NetRunnerImportConfig
  ): Promise<{ action: 'skip' | 'overwrite' | 'rename'; newId?: string }> {
    const resolution = config.conflictResolution || 'skip';

    switch (resolution) {
      case 'skip':
        return { action: 'skip' };
      
      case 'overwrite':
        return { action: 'overwrite' };
      
      case 'rename':
        const newId = `${conflict.incomingIntel.id}-imported-${Date.now()}`;
        return { action: 'rename', newId };
      
      default:
        return { action: 'skip' };
    }
  }

  /**
   * Prepare Intel data for import (add import metadata, tags, etc.)
   */
  private async prepareIntelForImport(
    intel: Intel,
    config: NetRunnerImportConfig
  ): Promise<Intel> {
    const preparedIntel = { ...intel };

    // Add import tags if configured
    if (config.tagImportedData) {
      const importTag = config.importTag || 'imported';
      if (!preparedIntel.tags.includes(importTag)) {
        preparedIntel.tags.push(importTag);
      }
    }

    // Add import metadata
    if (!preparedIntel.bridgeMetadata) {
      preparedIntel.bridgeMetadata = {};
    }

    preparedIntel.bridgeMetadata.importedAt = Date.now();
    preparedIntel.bridgeMetadata.importedBy = config.importedBy || 'NetRunner Importer';

    // Generate new ID if not preserving original IDs
    if (!config.preserveOriginalIds) {
      preparedIntel.bridgeMetadata.originalId = preparedIntel.id;
      preparedIntel.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return preparedIntel;
  }

  /**
   * Helper methods
   */
  private isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    const supportedVersions = ['1.0', '1.1', '1.2'];
    return supportedVersions.includes(version);
  }

  private isContentDuplicate(intel1: Intel, intel2: Intel): boolean {
    // Simple content duplicate check
    return intel1.hash === intel2.hash || 
           (JSON.stringify(intel1.data) === JSON.stringify(intel2.data) && 
            intel1.timestamp === intel2.timestamp);
  }

  private generateImportWarnings(intelData: Intel[], conflicts: ImportConflict[]): string[] {
    const warnings: string[] = [];

    if (conflicts.length > 0) {
      warnings.push(`${conflicts.length} potential conflicts detected`);
    }

    const oldDataThreshold = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days
    const oldItems = intelData.filter(intel => intel.timestamp < oldDataThreshold);
    if (oldItems.length > 0) {
      warnings.push(`${oldItems.length} items are older than 90 days`);
    }

    if (intelData.length > 500) {
      warnings.push(`Large import: ${intelData.length} items may take time to process`);
    }

    return warnings;
  }
}

/**
 * Singleton instance for application-wide use
 */
export const netRunnerDataImporter = new NetRunnerDataImporter();

export default NetRunnerDataImporter;
