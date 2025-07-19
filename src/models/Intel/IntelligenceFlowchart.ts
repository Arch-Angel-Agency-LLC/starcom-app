/**
 * Non-Linear Intelligence Processing Flow
 * 
 * This defines the complex, interconnected relationships between different
 * types of intelligence data as it flows through collection, processing,
 * analysis, and reporting phases.
 */

import { PrimaryIntelSource } from './Sources';
import { ClassificationLevel } from './Classification';
import { ReliabilityRating } from './Intel';

// ═══════════════════════════════════════════════════════════════════
//                        COLLECTION LAYER
// ═══════════════════════════════════════════════════════════════════

/**
 * RawData - Unprocessed data from collection systems
 * Examples: HTML pages, JSON responses, binary files, network packets
 */
export interface RawData {
  id: string;
  sourceUrl: string;
  collectionMethod: 'web-scrape' | 'api-call' | 'dns-lookup' | 'certificate-scan' | 'port-scan';
  timestamp: number;
  collectorId: string;
  
  // The actual raw content
  content: unknown;
  contentType: 'html' | 'json' | 'xml' | 'binary' | 'text' | 'image';
  contentLength: number;
  
  // Collection context
  httpStatus?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  errors?: string[];
}

/**
 * Artifacts - Discrete pieces of evidence or data objects
 * Examples: Files, certificates, logs, configurations
 */
export interface Artifact {
  id: string;
  type: 'file' | 'certificate' | 'log-entry' | 'configuration' | 'image' | 'document';
  name: string;
  source: string;
  content: unknown;
  hash: string;
  size: number;
  timestamp: number;
  
  // Relationships
  derivedFrom?: string[]; // RawData IDs
  relatedArtifacts?: string[]; // Other Artifact IDs
  
  metadata: {
    mimeType?: string;
    encoding?: string;
    permissions?: string;
    owner?: string;
    signatures?: string[];
  };
}

/**
 * Signals - Indicators or patterns detected in data
 * Examples: Anomalies, signatures, behavioral patterns
 */
export interface Signal {
  id: string;
  type: 'anomaly' | 'signature' | 'pattern' | 'behavior' | 'frequency';
  strength: number; // 0-100
  frequency: number;
  description: string;
  timestamp: number;
  
  // Sources
  detectedIn: string[]; // RawData or Artifact IDs
  detectionMethod: 'rule-based' | 'ml-model' | 'statistical' | 'manual';
  confidence: number; // 0-100
}

// ═══════════════════════════════════════════════════════════════════
//                    EXTRACTION & PROCESSING LAYER
// ═══════════════════════════════════════════════════════════════════

/**
 * Observations - Extracted meaningful data points
 * Examples: Email addresses, IP addresses, domain names, technologies
 */
export interface Observation {
  id: string;
  type: 'email' | 'domain' | 'ip-address' | 'phone' | 'technology' | 'person' | 'organization';
  value: string;
  context: string; // Where/how it was found
  confidence: number; // 0-100
  timestamp: number;
  
  // Extraction details
  extractedFrom: string; // RawData, Artifact, or Signal ID
  extractionMethod: 'regex' | 'dom-parsing' | 'ml-model' | 'manual' | 'api-lookup';
  
  // Validation
  verified: boolean;
  verificationMethod?: string;
  
  // Geographic context (if applicable)
  latitude?: number;
  longitude?: number;
  location?: string;
}

// ═══════════════════════════════════════════════════════════════════
//                    ANALYSIS & CORRELATION LAYER
// ═══════════════════════════════════════════════════════════════════

/**
 * Patterns - Recurring structures or behaviors across data
 * Examples: Attack patterns, communication patterns, infrastructure patterns
 */
export interface Pattern {
  id: string;
  type: 'temporal' | 'geographic' | 'behavioral' | 'structural' | 'communication';
  name: string;
  description: string;
  confidence: number;
  
  // Pattern definition
  components: string[]; // Observation IDs that form this pattern
  frequency: number;
  timespan?: { start: number; end: number };
  
  // Pattern characteristics
  strength: number; // How strong/clear the pattern is
  stability: number; // How consistent the pattern is over time
  uniqueness: number; // How unique/rare this pattern is
}

/**
 * Evidence - Legally or analytically significant data points
 * Examples: Proof of compromise, attribution evidence, capability evidence
 */
export interface Evidence {
  id: string;
  type: 'compromise' | 'attribution' | 'capability' | 'intent' | 'timeline';
  description: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  
  // Supporting data
  supportingObservations: string[]; // Observation IDs
  supportingPatterns?: string[]; // Pattern IDs
  supportingArtifacts?: string[]; // Artifact IDs
  
  // Legal/analytical weight
  reliability: ReliabilityRating;
  verifiable: boolean;
  chainOfCustody: string[];
  
  timestamp: number;
  analystId: string;
}

/**
 * Indicators - Signs pointing to specific conditions or threats
 * Examples: IOCs, TTPs, compromise indicators
 */
export interface Indicator {
  id: string;
  type: 'compromise' | 'threat' | 'vulnerability' | 'opportunity' | 'risk';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Indicator composition
  basedOn: string[]; // Observation, Pattern, Evidence, or Signal IDs
  confidence: number;
  reliability: ReliabilityRating;
  
  // Actionability
  actionable: boolean;
  recommendations?: string[];
  
  // Temporal relevance
  firstSeen: number;
  lastSeen: number;
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════
//                    SYNTHESIS & REPORTING LAYER
// ═══════════════════════════════════════════════════════════════════

/**
 * Intelligence - Correlated and analyzed information with context
 * This is our current Intel interface but with relationship tracking
 */
export interface Intelligence {
  id: string;
  source: PrimaryIntelSource;
  classification: ClassificationLevel;
  reliability: ReliabilityRating;
  timestamp: number;
  collectedBy: string;
  
  // Geographic context
  latitude?: number;
  longitude?: number;
  location?: string;
  
  // Intelligence payload (now with rich context)
  data: unknown;
  
  // Relationship tracking
  derivedFrom: {
    observations?: string[]; // Observation IDs
    patterns?: string[]; // Pattern IDs
    evidence?: string[]; // Evidence IDs
    indicators?: string[]; // Indicator IDs
    rawData?: string[]; // RawData IDs
    artifacts?: string[]; // Artifact IDs
  };
  
  // Metadata
  tags: string[];
  hash?: string;
  verified?: boolean;
  
  // Analysis context
  confidence: number;
  implications: string[];
  recommendations?: string[];
}

/**
 * Findings - Specific discoveries or conclusions
 * Examples: Security vulnerabilities, attribution findings, capability assessments
 */
export interface Finding {
  id: string;
  type: 'vulnerability' | 'attribution' | 'capability' | 'infrastructure' | 'relationship';
  title: string;
  description: string;
  severity: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  
  // Supporting intelligence
  supportingIntelligence: string[]; // Intelligence IDs
  supportingEvidence: string[]; // Evidence IDs
  contradictingEvidence?: string[]; // Evidence that challenges this finding
  
  // Assessment
  confidence: number;
  reliability: ReliabilityRating;
  analystAssessment: string;
  
  // Metadata
  discoveredBy: string;
  discoveredAt: number;
  lastUpdated: number;
  status: 'draft' | 'review' | 'validated' | 'published';
}

/**
 * IntelReport - Final intelligence product for dissemination
 * (This would be the processed report that gets shared/displayed)
 */
export interface IntelReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  
  // Classification and handling
  classification: ClassificationLevel;
  disseminationControls: string[];
  releasability: string[];
  
  // Intelligence composition
  baseIntelligence: string[]; // Intelligence IDs
  keyFindings: string[]; // Finding IDs
  criticalIndicators: string[]; // Indicator IDs
  
  // Report metadata
  authoredBy: string[];
  reviewedBy: string[];
  approvedBy: string;
  publishedAt: number;
  expiresAt?: number;
  
  // Distribution
  distributionList: string[];
  accessLog: Array<{
    userId: string;
    accessedAt: number;
    action: 'viewed' | 'downloaded' | 'shared';
  }>;
}

// ═══════════════════════════════════════════════════════════════════
//                        RELATIONSHIP TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Defines how different intelligence objects relate to each other
 */
export interface IntelligenceRelationship {
  id: string;
  type: 'derived-from' | 'supports' | 'contradicts' | 'correlates-with' | 'contextualizes';
  sourceId: string;
  targetId: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  description?: string;
  establishedBy: string; // Analyst or system ID
  establishedAt: number;
}

/**
 * Cross-layer data flow tracking
 */
export interface DataLineage {
  targetId: string;
  targetType: 'observation' | 'pattern' | 'evidence' | 'indicator' | 'intelligence' | 'finding' | 'report';
  lineage: Array<{
    id: string;
    type: 'rawdata' | 'artifact' | 'signal' | 'observation' | 'pattern' | 'evidence' | 'indicator' | 'intelligence';
    transformationType: 'extraction' | 'correlation' | 'analysis' | 'synthesis';
    timestamp: number;
    confidence: number;
  }>;
}
