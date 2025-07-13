// Processed Intelligence Types
// Intelligence that has been analyzed and contextualized

import { Intel, IntelSource, ClassificationLevel } from './Intel';

/**
 * Processed Intelligence
 * Raw intel that has been analyzed and given context
 */
export interface Intelligence extends Intel {
  // Analysis fields
  analysis: string;
  confidence: number; // 0-100 confidence score
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Processing metadata  
  processedBy: string;
  processedAt: number;
  analysisMethod?: string;
  
  // Correlation with other intel
  relatedIntel?: string[]; // IDs of related intel
  contradictoryIntel?: string[]; // IDs of contradictory intel
  
  // Derived insights
  threats?: ThreatAssessment[];
  opportunities?: string[];
  recommendations?: string[];
}

/**
 * Threat Assessment derived from intelligence
 */
export interface ThreatAssessment {
  type: string; // threat category
  likelihood: number; // 0-100
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  mitigation?: string[];
}

/**
 * Intelligence Summary
 * High-level summary of processed intelligence
 */
export interface IntelligenceSummary {
  id: string;
  title: string;
  timeframe: {
    start: number;
    end: number;
  };
  coverage: {
    geographic: {
      minLat: number;
      maxLat: number; 
      minLng: number;
      maxLng: number;
    };
    sources: IntelSource[];
  };
  keyFindings: string[];
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  classification: ClassificationLevel;
  createdBy: string;
  createdAt: number;
}
