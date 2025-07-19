# Intel System Component Reference

## Core Types and Interfaces

### Base Intelligence Types

#### Intel
```typescript
interface Intel {
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
  
  // Raw data payload
  data: unknown;
  
  // Metadata
  tags: string[];
  hash?: string;
  verified?: boolean;
}
```

#### ReliabilityRating
```typescript
type ReliabilityRating = 
  | 'A' // Completely reliable
  | 'B' // Usually reliable  
  | 'C' // Fairly reliable
  | 'D' // Not usually reliable
  | 'E' // Unreliable
  | 'F' // Reliability cannot be judged
  | 'X'; // Deliberate deception suspected
```

#### IntelRequirement
```typescript
interface IntelRequirement {
  id: string;
  priority: 'IMMEDIATE' | 'PRIORITY' | 'ROUTINE';
  description: string;
  targetLocation?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  deadline?: number;
  requiredSources: PrimaryIntelSource[];
  classification: ClassificationLevel;
  requestedBy: string;
}
```

### Collection Layer Types

#### RawData
```typescript
interface RawData {
  id: string;
  sourceUrl: string;
  collectionMethod: 'web-scrape' | 'api-call' | 'dns-lookup' | 'certificate-scan' | 'port-scan';
  timestamp: number;
  collectorId: string;
  content: unknown;
  contentType: 'html' | 'json' | 'xml' | 'binary' | 'text' | 'image';
  contentLength: number;
  httpStatus?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  errors?: string[];
}
```

#### Artifact
```typescript
interface Artifact {
  id: string;
  type: 'file' | 'certificate' | 'log-entry' | 'configuration' | 'image' | 'document';
  name: string;
  source: string;
  content: unknown;
  hash: string;
  size: number;
  timestamp: number;
  derivedFrom?: string[];
  relatedArtifacts?: string[];
  metadata: {
    mimeType?: string;
    encoding?: string;
    permissions?: string;
    owner?: string;
    signatures?: string[];
  };
}
```

#### Signal
```typescript
interface Signal {
  id: string;
  type: 'anomaly' | 'signature' | 'pattern' | 'behavior' | 'frequency';
  strength: number; // 0-100
  frequency: number;
  description: string;
  timestamp: number;
  detectedIn: string[];
  detectionMethod: 'rule-based' | 'ml-model' | 'statistical' | 'manual';
  confidence: number;
}
```

### Processing Layer Types

#### Observation
```typescript
interface Observation {
  id: string;
  type: 'email' | 'domain' | 'ip-address' | 'phone' | 'technology' | 'person' | 'organization';
  value: string;
  context: string;
  confidence: number;
  timestamp: number;
  extractedFrom: string;
  extractionMethod: 'regex' | 'dom-parsing' | 'ml-model' | 'manual' | 'api-lookup';
  verified: boolean;
  verificationMethod?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}
```

#### Pattern
```typescript
interface Pattern {
  id: string;
  type: 'temporal' | 'geographic' | 'behavioral' | 'structural' | 'communication';
  name: string;
  description: string;
  confidence: number;
  components: string[];
  frequency: number;
  timespan?: { start: number; end: number };
  strength: number;
  stability: number;
  uniqueness: number;
}
```

#### Evidence
```typescript
interface Evidence {
  id: string;
  type: 'compromise' | 'attribution' | 'capability' | 'intent' | 'timeline';
  description: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  supportingObservations: string[];
  supportingPatterns?: string[];
  supportingArtifacts?: string[];
  reliability: ReliabilityRating;
  verifiable: boolean;
  chainOfCustody: string[];
  timestamp: number;
  analystId: string;
}
```

### Analysis Layer Types

#### Intelligence (Enhanced)
```typescript
interface Intelligence {
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
  
  // Intelligence payload
  data: unknown;
  
  // Relationship tracking
  derivedFrom: {
    observations?: string[];
    patterns?: string[];
    evidence?: string[];
    indicators?: string[];
    rawData?: string[];
    artifacts?: string[];
  };
  
  // Metadata
  tags: string[];
  hash?: string;
  verified?: boolean;
  confidence: number;
  implications: string[];
  recommendations?: string[];
}
```

#### Indicator
```typescript
interface Indicator {
  id: string;
  type: 'compromise' | 'threat' | 'vulnerability' | 'opportunity' | 'risk';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  basedOn: string[];
  confidence: number;
  reliability: ReliabilityRating;
  actionable: boolean;
  recommendations?: string[];
  firstSeen: number;
  lastSeen: number;
  active: boolean;
}
```

#### Finding
```typescript
interface Finding {
  id: string;
  type: 'vulnerability' | 'attribution' | 'capability' | 'infrastructure' | 'relationship';
  title: string;
  description: string;
  severity: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  supportingIntelligence: string[];
  supportingEvidence: string[];
  contradictingEvidence?: string[];
  confidence: number;
  reliability: ReliabilityRating;
  analystAssessment: string;
  discoveredBy: string;
  discoveredAt: number;
  lastUpdated: number;
  status: 'draft' | 'review' | 'validated' | 'published';
}
```

### Reporting Layer Types

#### IntelReport
```typescript
interface IntelReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  classification: ClassificationLevel;
  disseminationControls: string[];
  releasability: string[];
  baseIntelligence: string[];
  keyFindings: string[];
  criticalIndicators: string[];
  authoredBy: string[];
  reviewedBy: string[];
  approvedBy: string;
  publishedAt: number;
  expiresAt?: number;
  distributionList: string[];
  accessLog: Array<{
    userId: string;
    accessedAt: number;
    action: 'viewed' | 'downloaded' | 'shared';
  }>;
}
```

### Relationship Types

#### IntelligenceRelationship
```typescript
interface IntelligenceRelationship {
  id: string;
  type: 'derived-from' | 'supports' | 'contradicts' | 'correlates-with' | 'contextualizes';
  sourceId: string;
  targetId: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  description?: string;
  establishedBy: string;
  establishedAt: number;
}
```

#### DataLineage
```typescript
interface DataLineage {
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
```

## Enumeration Types

### ClassificationLevel
```typescript
type ClassificationLevel = 
  | 'UNCLASS'
  | 'CONFIDENTIAL' 
  | 'SECRET'
  | 'TOP_SECRET';
```

### PrimaryIntelSource
```typescript
type PrimaryIntelSource =
  | 'HUMINT'    // Human Intelligence
  | 'SIGINT'    // Signals Intelligence  
  | 'GEOINT'    // Geospatial Intelligence
  | 'OSINT'     // Open Source Intelligence
  | 'COMINT'    // Communications Intelligence
  | 'ELINT'     // Electronic Intelligence
  | 'IMINT'     // Imagery Intelligence
  | 'MASINT';   // Measurement and Signatures Intelligence
```

### IntelType
```typescript
type IntelType = 
  | 'identity'        // Personal identity information
  | 'network'         // Network infrastructure data
  | 'financial'       // Financial information
  | 'geospatial'      // Geographic and location data
  | 'social'          // Social media and communication data
  | 'infrastructure'  // Technical infrastructure data
  | 'vulnerability'   // Security vulnerabilities
  | 'darkweb'        // Dark web intelligence
  | 'threat'         // Threat intelligence
  | 'temporal';      // Time-based intelligence
```

### SourceType
```typescript
type SourceType = 
  | 'public_web'      // Public web sources
  | 'social_media'    // Social media platforms
  | 'search_engine'   // Search engine results
  | 'database'        // Public databases
  | 'api'            // API endpoints
  | 'dark_web'       // Dark web sources
  | 'file_system'    // File system sources
  | 'network_scan'   // Network scanning results
  | 'manual';        // Manually entered data
```

## Utility Types

### Quality Metrics
```typescript
interface QualityMetrics {
  confidence: number;        // 0-100
  completeness: number;      // 0-100
  accuracy: number;          // 0-100
  timeliness: number;        // 0-100
  relevance: number;         // 0-100
  reliability: ReliabilityRating;
}
```

### Processing Status
```typescript
type ProcessingStatus = 
  | 'raw'           // Unprocessed data
  | 'processed'     // Basic processing complete
  | 'analyzed'      // Analysis complete
  | 'validated'     // Validation complete
  | 'published'     // Published in reports
  | 'archived';     // Archived/retired
```

### Priority Levels
```typescript
type PriorityLevel = 
  | 'IMMEDIATE'     // Process immediately
  | 'PRIORITY'      // High priority processing
  | 'ROUTINE'       // Standard processing
  | 'BATCH';        // Batch processing acceptable
```

## Configuration Types

### CollectionConfig
```typescript
interface CollectionConfig {
  sources: SourceType[];
  classification: ClassificationLevel;
  retentionPeriod: number; // days
  qualityThreshold: number; // 0-100
  autoProcessing: boolean;
  alertThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
}
```

### AnalysisConfig
```typescript
interface AnalysisConfig {
  confidenceThreshold: number;
  patternMatchingEnabled: boolean;
  crossValidationEnabled: boolean;
  temporalAnalysisWindow: number; // hours
  geospatialAnalysisRadius: number; // meters
  maxProcessingTime: number; // milliseconds
}
```

### ReportingConfig
```typescript
interface ReportingConfig {
  defaultClassification: ClassificationLevel;
  autoDistribution: boolean;
  retentionPeriod: number; // days
  accessLogging: boolean;
  encryptionRequired: boolean;
  digitalSignatures: boolean;
}
```
