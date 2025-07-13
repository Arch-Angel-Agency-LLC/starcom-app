// Threat and Risk Assessment Models
// Implementation of Improvement #3: Enhanced Type Definitions

import { ClassificationLevel } from './Classification';
import { PrimaryIntelSource } from './Sources';

/**
 * Threat Categories
 */
export type ThreatCategory = 
  | 'CYBER'           // Cyber threats
  | 'PHYSICAL'        // Physical security threats
  | 'INSIDER'         // Insider threats
  | 'TERRORISM'       // Terrorist threats
  | 'ESPIONAGE'       // Foreign intelligence threats
  | 'CRIMINAL'        // Criminal activity
  | 'NATURAL'         // Natural disasters
  | 'TECHNICAL'       // Technical failures
  | 'SUPPLY_CHAIN'    // Supply chain threats
  | 'INFORMATION';    // Information warfare

/**
 * Threat Actor Types
 */
export type ThreatActorType = 
  | 'NATION_STATE'    // Nation-state actors
  | 'TERRORIST'       // Terrorist organizations
  | 'CRIMINAL'        // Criminal organizations
  | 'HACKTIVIST'      // Hacktivist groups
  | 'INSIDER'         // Insider threats
  | 'INDIVIDUAL'      // Individual actors
  | 'UNKNOWN';        // Unknown actors

/**
 * Attack Vector Types
 */
export type AttackVector = 
  | 'NETWORK'         // Network-based attacks
  | 'PHYSICAL'        // Physical access
  | 'SOCIAL'          // Social engineering
  | 'SUPPLY_CHAIN'    // Supply chain compromise
  | 'INSIDER'         // Insider access
  | 'WIRELESS'        // Wireless attacks
  | 'MOBILE'          // Mobile device attacks
  | 'CLOUD'           // Cloud service attacks
  | 'EMAIL'           // Email-based attacks
  | 'WEB';            // Web application attacks

/**
 * Impact Categories
 */
export type ImpactCategory = 
  | 'OPERATIONAL'     // Operational impact
  | 'FINANCIAL'       // Financial impact
  | 'REPUTATIONAL'    // Reputational damage
  | 'REGULATORY'      // Regulatory violations
  | 'STRATEGIC'       // Strategic impact
  | 'SAFETY'          // Safety concerns
  | 'PRIVACY'         // Privacy violations
  | 'NATIONAL_SECURITY'; // National security impact

/**
 * Risk Levels
 */
export type RiskLevel = 
  | 'CRITICAL'        // Critical risk (immediate action required)
  | 'HIGH'            // High risk
  | 'MEDIUM'          // Medium risk
  | 'LOW'             // Low risk
  | 'NEGLIGIBLE';     // Negligible risk

/**
 * Threat Assessment
 */
export interface ThreatAssessment {
  // Identification
  id: string;
  title: string;
  description: string;
  version: string;
  
  // Classification and handling
  classification: ClassificationLevel;
  releasabilityTo?: string[];
  
  // Threat details
  category: ThreatCategory;
  subCategory?: string;
  actorType: ThreatActorType;
  actorName?: string;
  
  // Attack characteristics
  attackVectors: AttackVector[];
  techniques: string[]; // MITRE ATT&CK techniques
  indicators: ThreatIndicator[];
  
  // Assessment details
  likelihood: number; // 0-100 probability
  confidence: number; // 0-100 confidence in assessment
  severity: RiskLevel;
  
  // Impact analysis
  potentialImpacts: ImpactAssessment[];
  affectedAssets: string[];
  businessImpact: string;
  
  // Timeline
  firstObserved?: number;
  lastObserved?: number;
  trending: 'INCREASING' | 'STABLE' | 'DECREASING' | 'NEW';
  
  // Intelligence basis
  basedOnIntel: string[]; // Intel IDs
  supportingSources: PrimaryIntelSource[];
  intelligenceGaps: string[];
  
  // Geographic scope
  geographicScope: 'GLOBAL' | 'REGIONAL' | 'NATIONAL' | 'LOCAL' | 'SPECIFIC';
  affectedRegions?: string[];
  targetLocations?: Array<{
    latitude: number;
    longitude: number;
    description: string;
  }>;
  
  // Mitigation
  recommendations: string[];
  mitigationStrategies: MitigationStrategy[];
  
  // Metadata
  createdBy: string;
  createdAt: number;
  lastUpdated: number;
  nextReview: number;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';
}

/**
 * Threat Indicator
 */
export interface ThreatIndicator {
  id: string;
  type: 'IOC' | 'TTP' | 'BEHAVIORAL' | 'CONTEXTUAL';
  category: string; // e.g., 'IP', 'DOMAIN', 'HASH', 'EMAIL'
  value: string;
  description: string;
  confidence: number; // 0-100
  firstSeen: number;
  lastSeen: number;
  sources: string[]; // Source IDs
  falsePositiveRate?: number;
}

/**
 * Impact Assessment
 */
export interface ImpactAssessment {
  category: ImpactCategory;
  description: string;
  likelihood: number; // 0-100
  magnitude: RiskLevel;
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  cost: {
    min: number;
    max: number;
    currency: string;
  };
  recoveryTime: {
    min: number; // hours
    max: number; // hours
  };
  cascadingEffects: string[];
}

/**
 * Mitigation Strategy
 */
export interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'COMPENSATING';
  effectiveness: number; // 0-100
  cost: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  timeToImplement: number; // days
  requiredResources: string[];
  dependencies: string[];
  status: 'PROPOSED' | 'APPROVED' | 'IMPLEMENTING' | 'IMPLEMENTED' | 'TESTING' | 'ACTIVE';
}

/**
 * Risk Assessment
 */
export interface RiskAssessment {
  id: string;
  title: string;
  description: string;
  
  // Scope
  assets: string[];
  processes: string[];
  geographicScope: string[];
  
  // Threats analyzed
  threatsAssessed: string[]; // ThreatAssessment IDs
  
  // Risk calculation
  inherentRisk: RiskLevel;
  residualRisk: RiskLevel;
  riskScore: number; // 0-100
  
  // Risk factors
  vulnerabilities: string[];
  existingControls: string[];
  controlEffectiveness: number; // 0-100
  
  // Risk treatment
  riskTolerance: RiskLevel;
  treatmentPlan: string;
  mitigationActions: string[];
  
  // Ownership and accountability
  riskOwner: string;
  businessOwner: string;
  assessedBy: string;
  approvedBy: string;
  
  // Timeline
  assessmentDate: number;
  nextReview: number;
  validUntil: number;
  
  // Status
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'EXPIRED';
}

/**
 * Threat Assessment Utilities
 */
export class ThreatAssessmentUtils {
  /**
   * Calculate overall risk score
   */
  static calculateRiskScore(
    likelihood: number,
    impact: number,
    confidence: number
  ): number {
    // Risk = Likelihood × Impact × Confidence
    return Math.round((likelihood * impact * confidence) / 10000);
  }

  /**
   * Determine risk level from score
   */
  static getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'NEGLIGIBLE';
  }

  /**
   * Validate threat assessment
   */
  static validateAssessment(assessment: ThreatAssessment): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!assessment.title?.trim()) {
      errors.push('Title is required');
    }

    if (!assessment.description?.trim()) {
      errors.push('Description is required');
    }

    if (!assessment.attackVectors?.length) {
      errors.push('At least one attack vector is required');
    }

    // Validate ranges
    if (assessment.likelihood < 0 || assessment.likelihood > 100) {
      errors.push('Likelihood must be between 0 and 100');
    }

    if (assessment.confidence < 0 || assessment.confidence > 100) {
      errors.push('Confidence must be between 0 and 100');
    }

    // Warnings
    if (!assessment.basedOnIntel?.length) {
      warnings.push('No supporting intelligence specified');
    }

    if (!assessment.recommendations?.length) {
      warnings.push('No recommendations provided');
    }

    if (assessment.nextReview < Date.now()) {
      warnings.push('Review date is overdue');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate threat summary
   */
  static generateSummary(assessment: ThreatAssessment): string {
    const riskLevel = this.getRiskLevel(
      this.calculateRiskScore(
        assessment.likelihood,
        assessment.potentialImpacts.reduce((max, impact) => {
          const impactScore = this.getImpactScore(impact.magnitude);
          return Math.max(max, impactScore);
        }, 0),
        assessment.confidence
      )
    );

    return `${riskLevel} risk ${assessment.category.toLowerCase()} threat from ${assessment.actorType.toLowerCase()} actors with ${assessment.likelihood}% likelihood and ${assessment.confidence}% confidence.`;
  }

  /**
   * Get numeric score for impact level
   */
  private static getImpactScore(level: RiskLevel): number {
    const scores = {
      'CRITICAL': 100,
      'HIGH': 80,
      'MEDIUM': 60,
      'LOW': 40,
      'NEGLIGIBLE': 20
    };
    return scores[level];
  }
}
