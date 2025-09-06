// Operational Context and Intelligence Operations
// Mission-specific context and operational metadata for intelligence

import { Intel } from './Intel';
import type { IntelClassification } from './IntelEnums';
import { CollectionTasking } from './Tasking';
import { IntelDataLifecycle } from './Lifecycle';
import { RealTimeProcessingStatus } from './RealTimeProcessing';
// Minimal fusion metadata for operations context
export interface IntelFusionMetadata {
  fusedFromIds?: string[];
  fusionMethod?: string;
  fusionScore?: number;
}
import { CollectionPerformance } from './Performance';

/**
 * Dissemination methods for intelligence products
 */
export type DisseminationMethod = 'FORMAL_REPORT' | 'BRIEFING' | 'ALERT' | 'RAW_INTEL' | 'SUMMARY';

/**
 * Record of intelligence dissemination
 */
export interface DisseminationRecord {
  timestamp: number;
  recipient: string;
  method: DisseminationMethod;
  classification?: IntelClassification;
  acknowledgmentReceived: boolean;
  feedback?: string;
}

/**
 * Operational context for intelligence
 */
export interface OperationalContext {
  missionRelevance: number; // 0-100
  strategicValue: number; // 0-100
  tacticalUtility: number; // 0-100
  timeDecayRate: number; // how quickly intel loses value (0-1 per hour)
  sharingRestrictions: string[];
  disseminationHistory: DisseminationRecord[];
}

/**
 * Enhanced Intel with comprehensive operational capabilities
 */
export interface EnhancedIntel extends Intel {
  // Collection and tasking
  taskingReference?: CollectionTasking;
  collectionPriority: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH';
  
  // Data lifecycle
  lifecycle: IntelDataLifecycle;
  
  // Real-time processing
  realTimeStatus: RealTimeProcessingStatus;
  
  // Fusion and correlation
  fusionData: IntelFusionMetadata;
  
  // Performance tracking
  performance: CollectionPerformance;
  
  // Operational context
  operationalContext: OperationalContext;
}

/**
 * Intelligence operations utilities
 */
export class IntelOperations {
  /**
   * Check if intel requires immediate processing
   */
  static requiresImmediateProcessing(intel: EnhancedIntel): boolean {
    return intel.collectionPriority === 'IMMEDIATE' || 
           intel.collectionPriority === 'FLASH' ||
           intel.realTimeStatus.priority === 'CRITICAL' ||
           intel.realTimeStatus.priority === 'EMERGENCY';
  }

  /**
   * Calculate intel decay factor based on time and type
   */
  static calculateIntelDecay(intel: EnhancedIntel): number {
    const ageHours = (Date.now() - intel.timestamp) / (1000 * 60 * 60);
    const decayRate = intel.operationalContext.timeDecayRate;
    return Math.max(0, 1 - (ageHours * decayRate));
  }

  /**
   * Calculate current intel value considering decay
   */
  static calculateCurrentValue(intel: EnhancedIntel): number {
    const decayFactor = this.calculateIntelDecay(intel);
    const baseValue = (
      intel.operationalContext.missionRelevance * 0.40 +
      intel.operationalContext.strategicValue * 0.35 +
      intel.operationalContext.tacticalUtility * 0.25
    );
    return baseValue * decayFactor;
  }

  /**
   * Determine if intel should be archived
   */
  static shouldArchive(intel: EnhancedIntel): boolean {
    const daysSinceCollection = (Date.now() - intel.lifecycle.collectionTimestamp) / (1000 * 60 * 60 * 24);
    return daysSinceCollection >= intel.lifecycle.retentionPolicy.archiveAfterDays;
  }

  /**
   * Check sharing restrictions for recipient
   */
  static canShareWith(intel: EnhancedIntel, recipient: string): boolean {
    const restrictions = intel.operationalContext.sharingRestrictions;
    
    // Check for specific recipient restrictions
    if (restrictions.includes(`NO_${recipient.toUpperCase()}`)) {
      return false;
    }

    // Check for general restrictions
    if (restrictions.includes('NOFORN') && recipient.includes('FOREIGN')) {
      return false;
    }

    if (restrictions.includes('NOCONTRACTOR') && recipient.includes('CONTRACTOR')) {
      return false;
    }

    return true;
  }

  /**
   * Record dissemination of intelligence
   */
  static recordDissemination(
    intel: EnhancedIntel,
    recipient: string,
    method: DisseminationMethod,
  classification?: IntelClassification
  ): void {
    intel.operationalContext.disseminationHistory.push({
      timestamp: Date.now(),
      recipient,
      method,
      classification,
      acknowledgmentReceived: false
    });
  }

  /**
   * Generate operational summary
   */
  static generateOperationalSummary(intel: EnhancedIntel[]): {
    totalItems: number;
    highPriorityItems: number;
    averageValue: number;
    recentDisseminations: number;
    topSharedWith: string[];
    pendingAcknowledgments: number;
  } {
    const totalItems = intel.length;
    const highPriorityItems = intel.filter(i => 
      i.collectionPriority === 'IMMEDIATE' || i.collectionPriority === 'FLASH'
    ).length;

    const averageValue = intel.length > 0 
      ? intel.reduce((sum, i) => sum + this.calculateCurrentValue(i), 0) / intel.length 
      : 0;

    // Recent disseminations (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentDisseminations = intel.reduce((count, i) => 
      count + i.operationalContext.disseminationHistory
        .filter(d => d.timestamp > oneDayAgo).length, 0
    );

    // Top recipients
    const recipientCounts = new Map<string, number>();
    intel.forEach(i => {
      i.operationalContext.disseminationHistory.forEach(d => {
        recipientCounts.set(d.recipient, (recipientCounts.get(d.recipient) || 0) + 1);
      });
    });

    const topSharedWith = Array.from(recipientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([recipient]) => recipient);

    // Pending acknowledgments
    const pendingAcknowledgments = intel.reduce((count, i) => 
      count + i.operationalContext.disseminationHistory
        .filter(d => !d.acknowledgmentReceived).length, 0
    );

    return {
      totalItems,
      highPriorityItems,
      averageValue,
      recentDisseminations,
      topSharedWith,
      pendingAcknowledgments
    };
  }

  /**
   * Prioritize intel list for processing
   */
  static prioritizeForProcessing(intel: EnhancedIntel[]): EnhancedIntel[] {
    return intel.sort((a, b) => {
      // Priority order: FLASH > IMMEDIATE > PRIORITY > ROUTINE
      const priorityOrder = { 'FLASH': 4, 'IMMEDIATE': 3, 'PRIORITY': 2, 'ROUTINE': 1 };
      const aPriority = priorityOrder[a.collectionPriority];
      const bPriority = priorityOrder[b.collectionPriority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // If same priority, sort by current value
      const aValue = this.calculateCurrentValue(a);
      const bValue = this.calculateCurrentValue(b);
      return bValue - aValue;
    });
  }
}
