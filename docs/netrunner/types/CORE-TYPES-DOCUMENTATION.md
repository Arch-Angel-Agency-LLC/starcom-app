# NetRunner Core Types Documentation

**Document Date**: July 12, 2025  
**Author**: GitHub Copilot  
**Status**: Core Type Definitions  

## 🎯 **OVERVIEW**

This document defines the core TypeScript interfaces and types that form the foundation of the NetRunner OSINT reconnaissance platform. These types ensure type safety, enable intelligent code completion, and provide clear contracts between system components.

## 🏗️ **ARCHITECTURE TYPES**

### **Core System Types**

```typescript
// System-wide operation status tracking
export interface OperationStatus {
  type: 'idle' | 'scanning' | 'crawling' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentTask: string;
  startTime?: number;
  estimatedCompletion?: number;
  details?: OperationDetails;
}

export interface OperationDetails {
  totalSteps: number;
  currentStep: number;
  stepDescription: string;
  warnings: string[];
  errors: string[];
}

// Security classification system
export type SecurityClassification = 'unclassified' | 'confidential' | 'secret' | 'top-secret';

// Threat assessment levels
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

// Priority classification
export type Priority = 'low' | 'medium' | 'high' | 'critical';
```

### **Intelligence Data Types**

```typescript
// Comprehensive target intelligence structure
export interface TargetIntelligence {
  id: string;
  url: string;
  domain: string;
  classification: SecurityClassification;
  threatLevel: ThreatLevel;
  lastUpdated: number;
  scanData?: ScanResult;
  crawlData?: CrawlResult;
  analysisData?: IntelligenceAnalysis;
  metadata: TargetMetadata;
}

export interface TargetMetadata {
  discovered: number;
  firstSeen: number;
  lastScanned: number;
  scanCount: number;
  confidence: number;
  source: IntelligenceSource;
}

export type IntelligenceSource = 'manual' | 'automated' | 'api' | 'osint' | 'passive' | 'active';

// Advanced intelligence analysis results
export interface IntelligenceAnalysis {
  riskScore: number;
  vulnerabilityCount: number;
  exposedData: ExposedDataItem[];
  correlatedThreats: ThreatCorrelation[];
  recommendations: ActionableRecommendation[];
  timeline: IntelligenceTimeline[];
  confidence: number;
}

export interface ExposedDataItem {
  type: DataType;
  value: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  confidence: number;
}

export type DataType = 
  | 'email'
  | 'phone'
  | 'address'
  | 'credential'
  | 'api_key'
  | 'certificate'
  | 'personal_info'
  | 'financial'
  | 'technical'
  | 'organizational';
```

### **Threat Intelligence Types**

```typescript
// Threat correlation and analysis
export interface ThreatCorrelation {
  id: string;
  type: ThreatType;
  confidence: number;
  description: string;
  sources: IntelligenceSource[];
  indicators: ThreatIndicator[];
  mitigation: MitigationStrategy[];
}

export type ThreatType = 
  | 'vulnerability'
  | 'malware'
  | 'phishing'
  | 'data_leak'
  | 'insider_threat'
  | 'supply_chain'
  | 'infrastructure'
  | 'social_engineering';

export interface ThreatIndicator {
  type: IndicatorType;
  value: string;
  confidence: number;
  context: string;
  timestamp: number;
}

export type IndicatorType = 
  | 'domain'
  | 'ip'
  | 'url'
  | 'hash'
  | 'email'
  | 'pattern'
  | 'behavior';

export interface MitigationStrategy {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  effort: EffortLevel;
  timeline: string;
  dependencies: string[];
}

export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'extensive';
```

### **Recommendation System Types**

```typescript
// Actionable intelligence recommendations
export interface ActionableRecommendation {
  id: string;
  priority: Priority;
  category: RecommendationCategory;
  action: string;
  rationale: string;
  estimatedEffort: string;
  impact: ImpactAssessment;
  dependencies: string[];
  timeline: RecommendationTimeline;
}

export type RecommendationCategory = 
  | 'security'
  | 'performance'
  | 'compliance'
  | 'privacy'
  | 'infrastructure'
  | 'monitoring'
  | 'response';

export interface ImpactAssessment {
  securityImprovement: number;
  riskReduction: number;
  operationalImpact: 'minimal' | 'low' | 'medium' | 'high';
  costImplication: 'minimal' | 'low' | 'medium' | 'high';
}

export interface RecommendationTimeline {
  immediate: string[];
  shortTerm: string[];
  mediumTerm: string[];
  longTerm: string[];
}
```

## 🔍 **SCANNING & CRAWLING TYPES**

### **Enhanced Vulnerability Types**

```typescript
// Comprehensive vulnerability assessment
export interface EnhancedVulnerability {
  id: string;
  title: string;
  type: VulnerabilityType;
  severity: VulnerabilitySeverity;
  description: string;
  location: VulnerabilityLocation;
  impact: string;
  recommendation: string;
  cve?: string;
  cvss?: CVSSScore;
  exploitability: ExploitabilityAssessment;
  remediation: RemediationGuidance;
}

export type VulnerabilityType = 
  | 'injection'
  | 'authentication'
  | 'session_management'
  | 'access_control'
  | 'security_configuration'
  | 'sensitive_data'
  | 'xss'
  | 'csrf'
  | 'deserialization'
  | 'logging_monitoring'
  | 'server_side_request_forgery';

export type VulnerabilitySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface VulnerabilityLocation {
  url: string;
  method?: string;
  parameter?: string;
  line?: number;
  code?: string;
  context?: string;
}

export interface CVSSScore {
  version: '3.1' | '4.0';
  baseScore: number;
  temporalScore?: number;
  environmentalScore?: number;
  vector: string;
}

export interface ExploitabilityAssessment {
  complexity: 'low' | 'medium' | 'high';
  authentication: 'none' | 'single' | 'multiple';
  userInteraction: 'none' | 'required';
  scope: 'unchanged' | 'changed';
  proofOfConcept: boolean;
  activeExploits: boolean;
}

export interface RemediationGuidance {
  immediateSteps: string[];
  detailedSolution: string;
  preventionMeasures: string[];
  testingApproach: string;
  verificationSteps: string[];
}
```

### **Enhanced OSINT Types**

```typescript
// Comprehensive OSINT data structure
export interface EnhancedOSINTData {
  emails: EmailIntelligence[];
  socialMedia: SocialMediaIntelligence[];
  technologies: TechnologyIntelligence[];
  serverInfo: ServerIntelligence[];
  subdomains: SubdomainIntelligence[];
  certificates: CertificateIntelligence[];
  dns: DNSIntelligence[];
  people: PersonIntelligence[];
  organizations: OrganizationIntelligence[];
  geolocation: GeolocationIntelligence;
}

export interface EmailIntelligence {
  address: string;
  type: 'contact' | 'admin' | 'technical' | 'security' | 'personal';
  verified: boolean;
  breaches: DataBreachInfo[];
  associated: string[];
  source: string;
  confidence: number;
}

export interface SocialMediaIntelligence {
  platform: string;
  handle: string;
  url: string;
  followers?: number;
  verified: boolean;
  activity: 'high' | 'medium' | 'low' | 'inactive';
  lastUpdate?: number;
}

export interface TechnologyIntelligence {
  name: string;
  version?: string;
  category: TechnologyCategory;
  confidence: number;
  vulnerabilities?: string[];
  updateAvailable?: boolean;
  eolDate?: number;
}

export type TechnologyCategory = 
  | 'framework'
  | 'library'
  | 'cms'
  | 'analytics'
  | 'cdn'
  | 'security'
  | 'server'
  | 'database'
  | 'os';

export interface DataBreachInfo {
  breach: string;
  date: number;
  affectedData: string[];
  verified: boolean;
  source: string;
}
```

## 🤖 **AI AGENT TYPES**

### **Agent Management**

```typescript
// AI Agent system types
export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  configuration: AgentConfiguration;
  performance: AgentPerformance;
  deployment: AgentDeployment;
}

export type AgentType = 
  | 'reconnaissance'
  | 'vulnerability_scanner'
  | 'threat_hunter'
  | 'analyst'
  | 'responder'
  | 'monitor';

export type AgentStatus = 
  | 'idle'
  | 'active'
  | 'busy'
  | 'error'
  | 'maintenance'
  | 'offline';

export interface AgentCapability {
  name: string;
  version: string;
  parameters: AgentParameter[];
  limitations: string[];
  requirements: string[];
}

export interface AgentConfiguration {
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'autonomous';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  operatingConstraints: OperatingConstraint[];
  reportingFrequency: number;
  escalationThresholds: EscalationThreshold[];
}

export interface OperatingConstraint {
  type: 'time' | 'resource' | 'scope' | 'legal' | 'ethical';
  description: string;
  enforced: boolean;
}

export interface EscalationThreshold {
  condition: string;
  threshold: number;
  action: 'alert' | 'pause' | 'terminate' | 'human_review';
}
```

### **Decision Making**

```typescript
// AI Decision framework
export interface DecisionMatrix {
  id: string;
  scenario: string;
  options: DecisionOption[];
  criteria: DecisionCriteria[];
  recommendation: string;
  confidence: number;
  reasoning: string[];
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  score: number;
  feasibility: number;
}

export interface DecisionCriteria {
  name: string;
  weight: number;
  type: 'benefit' | 'cost' | 'risk' | 'constraint';
  measurable: boolean;
}
```

## 📊 **UI STATE TYPES**

### **Component State Management**

```typescript
// UI State management types
export interface NetRunnerUIState {
  layout: LayoutState;
  navigation: NavigationState;
  operations: OperationState;
  preferences: UserPreferences;
  session: SessionState;
}

export interface LayoutState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomBarOpen: boolean;
  topBarExpanded: boolean;
  centerViewTab: number;
  widgetStates: Map<string, WidgetState>;
}

export interface WidgetState {
  visible: boolean;
  expanded: boolean;
  position: WidgetPosition;
  configuration: WidgetConfiguration;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface WidgetConfiguration {
  refreshInterval?: number;
  autoUpdate: boolean;
  displayMode: 'compact' | 'detailed' | 'minimal';
  filters: Record<string, any>;
}
```

### **Navigation & Routing**

```typescript
// Navigation system types
export interface NavigationState {
  currentRoute: string;
  history: string[];
  targets: NavigationTarget[];
  activeSession: string;
  breadcrumbs: Breadcrumb[];
}

export interface NavigationTarget {
  id: string;
  url: string;
  label: string;
  priority: Priority;
  status: TargetStatus;
  lastVisited?: number;
}

export type TargetStatus = 'queued' | 'active' | 'completed' | 'failed' | 'skipped';

export interface Breadcrumb {
  label: string;
  path: string;
  active: boolean;
}
```

## 🔧 **UTILITY TYPES**

### **Common Utility Types**

```typescript
// Generic utility types used throughout the system
export type Timestamp = number;
export type UUID = string;
export type URL = string;
export type Domain = string;
export type IPAddress = string;
export type EmailAddress = string;

// Progress tracking
export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  eta?: number;
  rate?: number;
}

// Time-based operations
export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
  duration: number;
}

// Geographic data
export interface GeolocationIntelligence {
  country: string;
  region: string;
  city: string;
  coordinates: Coordinates;
  timezone: string;
  isp: string;
  asn: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Resource management
export interface ResourceUsage {
  memory: number;
  cpu: number;
  network: number;
  storage: number;
  timestamp: Timestamp;
}

// Error handling
export interface NetRunnerError {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  context?: Record<string, any>;
  timestamp: Timestamp;
  source: string;
}

// Event system
export interface NetRunnerEvent {
  id: UUID;
  type: string;
  source: string;
  timestamp: Timestamp;
  data: Record<string, any>;
  processed: boolean;
}
```

## 🎯 **TYPE GUARDS & VALIDATION**

### **Runtime Type Checking**

```typescript
// Type guards for runtime validation
export function isTargetIntelligence(obj: any): obj is TargetIntelligence {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.domain === 'string' &&
    ['unclassified', 'confidential', 'secret', 'top-secret'].includes(obj.classification) &&
    ['low', 'medium', 'high', 'critical'].includes(obj.threatLevel);
}

export function isValidThreatLevel(level: any): level is ThreatLevel {
  return ['low', 'medium', 'high', 'critical'].includes(level);
}

export function isValidPriority(priority: any): priority is Priority {
  return ['low', 'medium', 'high', 'critical'].includes(priority);
}

export function isValidOperationStatus(status: any): status is OperationStatus {
  return status &&
    ['idle', 'scanning', 'crawling', 'analyzing', 'completed', 'error'].includes(status.type) &&
    typeof status.progress === 'number' &&
    typeof status.currentTask === 'string';
}
```

## 📈 **METRICS & ANALYTICS TYPES**

### **Performance Monitoring**

```typescript
// System performance and analytics
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  resourceUtilization: ResourceUsage;
  userSatisfaction: number;
}

export interface AnalyticsData {
  sessions: SessionAnalytics[];
  operations: OperationAnalytics[];
  performance: PerformanceMetrics;
  usage: UsageStatistics;
  trends: TrendAnalysis[];
}

export interface SessionAnalytics {
  id: string;
  duration: number;
  operationsCount: number;
  targetsScanned: number;
  errorsEncountered: number;
  userEngagement: number;
}

export interface OperationAnalytics {
  type: string;
  count: number;
  averageDuration: number;
  successRate: number;
  commonErrors: string[];
}

export interface UsageStatistics {
  dailyActiveUsers: number;
  averageSessionDuration: number;
  mostUsedFeatures: string[];
  peakUsageHours: number[];
}

export interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  rate: number;
  significance: number;
}
```

These comprehensive type definitions provide a **military-grade foundation** for the NetRunner platform, ensuring **type safety**, **clear interfaces**, and **maintainable code architecture** across all system components.
