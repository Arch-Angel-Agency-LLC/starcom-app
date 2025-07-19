// Intelligence Data Lifecycle Management
// Comprehensive data governance for intelligence operations

import { ReliabilityRating } from './Intel';

/**
 * Archive status for intelligence data
 */
export type ArchiveStatus = 'ACTIVE' | 'ARCHIVED' | 'MARKED_FOR_DESTRUCTION' | 'DESTROYED';

/**
 * Data lifecycle operations
 */
export type DataOperation = 'COLLECTED' | 'PROCESSED' | 'ANALYZED' | 'ENRICHED' | 'FUSED' | 'DISSEMINATED';

/**
 * Data retention policy configuration
 */
export interface RetentionPolicy {
  classificationBased: boolean;
  retentionPeriodDays: number;
  archiveAfterDays: number;
  autoDestruction: boolean;
  legalHold: boolean;
  policyVersion: string;
  lastReviewed: number;
}

/**
 * Data lineage entry for audit trail
 */
export interface DataLineageEntry {
  timestamp: number;
  operation: DataOperation;
  operator: string;
  system: string;
  changes: string[];
  confidence: number;
}

/**
 * Quality assessment for intelligence data
 */
export interface QualityAssessment {
  timestamp: number;
  assessor: string;
  reliabilityRating: ReliabilityRating;
  completeness: number; // 0-100
  timeliness: number; // 0-100
  accuracy: number; // 0-100
  relevance: number; // 0-100
  confidence: number; // 0-100
  notes: string;
}

/**
 * Version tracking for intelligence updates
 */
export interface IntelVersion {
  version: string;
  timestamp: number;
  changes: string[];
  operator: string;
  previousVersion?: string;
}

/**
 * Comprehensive intelligence data lifecycle
 */
export interface IntelDataLifecycle {
  collectionTimestamp: number;
  processingTimestamp?: number;
  analysisTimestamp?: number;
  disseminationTimestamp?: number;
  lastAccessedTimestamp: number;
  accessCount: number;
  retentionPolicy: RetentionPolicy;
  destructionDate?: number;
  archiveStatus: ArchiveStatus;
  dataLineage: DataLineageEntry[];
  qualityHistory: QualityAssessment[];
  versionHistory: IntelVersion[];
}

/**
 * Data governance utilities
 */
export class DataLifecycleManager {
  /**
   * Check if data should be archived based on policy
   */
  static shouldArchive(lifecycle: IntelDataLifecycle): boolean {
    const daysSinceCollection = (Date.now() - lifecycle.collectionTimestamp) / (1000 * 60 * 60 * 24);
    return daysSinceCollection >= lifecycle.retentionPolicy.archiveAfterDays;
  }

  /**
   * Check if data should be destroyed based on policy
   */
  static shouldDestroy(lifecycle: IntelDataLifecycle): boolean {
    if (lifecycle.retentionPolicy.legalHold) return false;
    if (!lifecycle.retentionPolicy.autoDestruction) return false;
    
    const daysSinceCollection = (Date.now() - lifecycle.collectionTimestamp) / (1000 * 60 * 60 * 24);
    return daysSinceCollection >= lifecycle.retentionPolicy.retentionPeriodDays;
  }

  /**
   * Add data lineage entry
   */
  static addLineageEntry(
    lifecycle: IntelDataLifecycle, 
    operation: DataOperation, 
    operator: string, 
    system: string, 
    changes: string[]
  ): void {
    lifecycle.dataLineage.push({
      timestamp: Date.now(),
      operation,
      operator,
      system,
      changes,
      confidence: 100
    });
    lifecycle.lastAccessedTimestamp = Date.now();
    lifecycle.accessCount += 1;
  }

  /**
   * Get latest quality assessment
   */
  static getLatestQuality(lifecycle: IntelDataLifecycle): QualityAssessment | undefined {
    return lifecycle.qualityHistory[lifecycle.qualityHistory.length - 1];
  }

  /**
   * Calculate composite quality score
   */
  static calculateQualityScore(lifecycle: IntelDataLifecycle): number {
    const latest = this.getLatestQuality(lifecycle);
    if (!latest) return 0;

    return (
      latest.completeness * 0.20 +
      latest.timeliness * 0.20 +
      latest.accuracy * 0.25 +
      latest.relevance * 0.20 +
      latest.confidence * 0.15
    );
  }
}
