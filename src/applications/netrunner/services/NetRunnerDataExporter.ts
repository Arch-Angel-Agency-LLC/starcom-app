/**
 * NetRunnerDataExporter - NetRunner Intel Export Service
 * 
 * Connects NetRunner Intel generation to the DataVault export system,
 * providing secure export capabilities for NetRunner-generated Intel data.
 * 
 * Features:
 * - Batch Intel export from NetRunner operations
 * - Integration with existing DataVaultService infrastructure
 * - Metadata preservation for quality assessment and classification
 * - Configurable export options for different use cases
 * - Audit trail and compliance support
 */

import { createDataVaultService } from '../../../services/DataVaultService';
import { storageOrchestrator } from '../../../core/intel/storage/storageOrchestrator';
import { Intel } from '../../../models/Intel/Intel';
import type { 
  ExportOptions,
  IntelDataVault,
  EncryptionConfig,
  CompressionConfig 
} from '../../../types/intel-foundation';
import type { IntelQueryOptions } from '../../../core/intel/types/intelDataModels';

/**
 * NetRunner-specific export configuration
 */
export interface NetRunnerExportConfig {
  includeMetadata?: boolean;
  includeAuditTrail?: boolean;
  encryptionPassword?: string;
  compressionLevel?: number;
  exportedBy?: string;
  exportTitle?: string;
  exportDescription?: string;
}

/**
 * NetRunner export result
 */
export interface NetRunnerExportResult {
  success: boolean;
  vault?: IntelDataVault;
  exportId?: string;
  exportedItemCount?: number;
  error?: string;
  warnings?: string[];
}

/**
 * NetRunnerDataExporter service for exporting NetRunner-generated Intel
 */
export class NetRunnerDataExporter {
  private intelVaultService;
  
  constructor() {
    // Initialize Intel-specific DataVault service
    this.intelVaultService = createDataVaultService('intel');
  }

  /**
   * Export Intel data from a specific NetRunner operation
   */
  async exportFromOperation(
    operationId: string,
    config: NetRunnerExportConfig = {}
  ): Promise<NetRunnerExportResult> {
    try {
      // Query Intel data from the specific operation
      const queryOptions: IntelQueryOptions = {
        filters: { 'bridgeMetadata.transformationId': operationId },
        limit: 1000 // Reasonable limit for operation export
      };

      const storageResult = await storageOrchestrator.queryEntities<Intel>(queryOptions);
      
      if (!storageResult.success || !storageResult.data) {
        return {
          success: false,
          error: `Failed to retrieve Intel for operation ${operationId}: ${storageResult.error}`
        };
      }

      return await this.exportIntelCollection(storageResult.data, {
        ...config,
        exportTitle: config.exportTitle || `NetRunner Operation ${operationId}`,
        exportDescription: config.exportDescription || `Intel exported from NetRunner operation ${operationId}`
      });

    } catch (error) {
      return {
        success: false,
        error: `Export failed for operation ${operationId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export Intel data from a date range
   */
  async exportFromDateRange(
    startDate: string,
    endDate: string,
    config: NetRunnerExportConfig = {}
  ): Promise<NetRunnerExportResult> {
    try {
      // Query Intel data from date range
      const queryOptions: IntelQueryOptions = {
        startDate,
        endDate,
        types: ['intel'], // Filter for Intel entities
        limit: 5000 // Reasonable limit for date range export
      };

      const storageResult = await storageOrchestrator.queryEntities<Intel>(queryOptions);
      
      if (!storageResult.success || !storageResult.data) {
        return {
          success: false,
          error: `Failed to retrieve Intel for date range ${startDate} to ${endDate}: ${storageResult.error}`
        };
      }

      return await this.exportIntelCollection(storageResult.data, {
        ...config,
        exportTitle: config.exportTitle || `NetRunner Intel Export ${startDate} to ${endDate}`,
        exportDescription: config.exportDescription || `Intel exported from NetRunner operations between ${startDate} and ${endDate}`
      });

    } catch (error) {
      return {
        success: false,
        error: `Export failed for date range ${startDate} to ${endDate}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export Intel data by tags
   */
  async exportByTags(
    tags: string[],
    config: NetRunnerExportConfig = {}
  ): Promise<NetRunnerExportResult> {
    try {
      // Query Intel data by tags
      const queryOptions: IntelQueryOptions = {
        tags,
        types: ['intel'],
        limit: 5000
      };

      const storageResult = await storageOrchestrator.queryEntities<Intel>(queryOptions);
      
      if (!storageResult.success || !storageResult.data) {
        return {
          success: false,
          error: `Failed to retrieve Intel for tags ${tags.join(', ')}: ${storageResult.error}`
        };
      }

      return await this.exportIntelCollection(storageResult.data, {
        ...config,
        exportTitle: config.exportTitle || `NetRunner Intel Export - Tags: ${tags.join(', ')}`,
        exportDescription: config.exportDescription || `Intel exported from NetRunner operations with tags: ${tags.join(', ')}`
      });

    } catch (error) {
      return {
        success: false,
        error: `Export failed for tags ${tags.join(', ')}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export all NetRunner Intel data
   */
  async exportAll(
    config: NetRunnerExportConfig = {}
  ): Promise<NetRunnerExportResult> {
    try {
      // Query all Intel data
      const queryOptions: IntelQueryOptions = {
        types: ['intel'],
        limit: 10000 // High limit for full export
      };

      const storageResult = await storageOrchestrator.queryEntities<Intel>(queryOptions);
      
      if (!storageResult.success || !storageResult.data) {
        return {
          success: false,
          error: `Failed to retrieve all Intel data: ${storageResult.error}`
        };
      }

      return await this.exportIntelCollection(storageResult.data, {
        ...config,
        exportTitle: config.exportTitle || 'Complete NetRunner Intel Export',
        exportDescription: config.exportDescription || 'Complete export of all NetRunner-generated Intel data'
      });

    } catch (error) {
      return {
        success: false,
        error: `Complete export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Core method to export a collection of Intel using DataVaultService
   */
  private async exportIntelCollection(
    intelData: Intel[],
    config: NetRunnerExportConfig
  ): Promise<NetRunnerExportResult> {
    try {
      if (intelData.length === 0) {
        return {
          success: false,
          error: 'No Intel data found to export'
        };
      }

      // Prepare export options
      const exportOptions: ExportOptions = {
        title: config.exportTitle || 'NetRunner Intel Export',
        description: config.exportDescription || 'Intel data exported from NetRunner operations',
        exportedBy: config.exportedBy || 'NetRunner',
        includeMetadata: config.includeMetadata !== false, // Default to true
        compression: config.compressionLevel ? {
          algorithm: 'gzip',
          level: config.compressionLevel
        } as CompressionConfig : undefined,
        encryption: config.encryptionPassword ? {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000,
          saltLength: 32,
          ivLength: 16
        } as EncryptionConfig : undefined
      };

      // Prepare Intel metadata
      const intelMetadata = {
        qualityAssessment: this.aggregateQualityAssessment(intelData),
        visibility: this.determineHighestClassification(intelData),
        sensitivity: this.determineSensitivityLevel(intelData),
        sourceCount: this.countUniqueSources(intelData),
        timeRange: this.calculateTimeRange(intelData),
        generatedBy: 'NetRunner System',
        exportedAt: new Date().toISOString()
      };

      // Export using IntelDataVaultService
      const vault = await this.intelVaultService.exportIntelCollection(
        intelData,
        intelMetadata,
        exportOptions
      );

      return {
        success: true,
        vault,
        exportId: vault.id,
        exportedItemCount: intelData.length,
        warnings: this.generateExportWarnings(intelData, config)
      };

    } catch (error) {
      return {
        success: false,
        error: `Intel collection export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Helper methods for metadata aggregation
   */
  private aggregateQualityAssessment(intelData: Intel[]) {
    // Aggregate quality assessments from all Intel items
    const qualities = intelData.map(intel => intel.qualityAssessment);
    // Return the most conservative (lowest) quality assessment
    return qualities.reduce((min, current) => 
      current.overallScore < min.overallScore ? current : min
    );
  }

  private determineHighestClassification(intelData: Intel[]): string {
    // Determine the highest classification level in the dataset
    const classifications = intelData.map(intel => intel.qualityAssessment.visibility);
    if (classifications.includes('classified')) return 'classified';
    if (classifications.includes('sensitive')) return 'sensitive';
    if (classifications.includes('internal')) return 'internal';
    return 'public';
  }

  private determineSensitivityLevel(intelData: Intel[]): string {
    // Determine the highest sensitivity level
    const sensitivities = intelData.map(intel => intel.qualityAssessment.sensitivity);
    if (sensitivities.includes('classified')) return 'classified';
    if (sensitivities.includes('sensitive')) return 'sensitive';
    return 'unclassified';
  }

  private countUniqueSources(intelData: Intel[]): number {
    const sources = new Set(intelData.map(intel => intel.source));
    return sources.size;
  }

  private calculateTimeRange(intelData: Intel[]): { start: number; end: number } {
    const timestamps = intelData.map(intel => intel.timestamp);
    return {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps)
    };
  }

  private generateExportWarnings(intelData: Intel[], config: NetRunnerExportConfig): string[] {
    const warnings: string[] = [];

    // Check for unencrypted sensitive data
    if (!config.encryptionPassword && this.determineSensitivityLevel(intelData) !== 'unclassified') {
      warnings.push('Sensitive data exported without encryption');
    }

    // Check for large export size
    if (intelData.length > 1000) {
      warnings.push(`Large export: ${intelData.length} items may take time to process`);
    }

    // Check for old data
    const oldDataThreshold = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    const oldItems = intelData.filter(intel => intel.timestamp < oldDataThreshold);
    if (oldItems.length > 0) {
      warnings.push(`Export includes ${oldItems.length} items older than 30 days`);
    }

    return warnings;
  }
}

/**
 * Singleton instance for application-wide use
 */
export const netRunnerDataExporter = new NetRunnerDataExporter();

export default NetRunnerDataExporter;
