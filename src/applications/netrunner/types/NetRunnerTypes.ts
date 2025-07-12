/**
 * NetRunner Core Types
 * 
 * Comprehensive type definitions for the NetRunner OSINT reconnaissance platform.
 * Provides type safety, intelligent code completion, and clear contracts between system components.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

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

// Comprehensive target intelligence structure
export interface TargetIntelligence {
  id: string;
  url: string;
  domain: string;
  classification: SecurityClassification;
  threatLevel: ThreatLevel;
  lastUpdated: number;
  scanData?: unknown; // Will be typed as ScanResult from WebsiteScanner
  crawlData?: unknown; // Will be typed as CrawlResult from AdvancedOSINTCrawler
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

export interface IntelligenceTimeline {
  timestamp: number;
  event: string;
  significance: 'low' | 'medium' | 'high';
  details: string;
}

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

export interface AgentParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: string | number | boolean;
  description: string;
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

export interface AgentPerformance {
  operationsCompleted: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastActive: number;
  efficiency: number;
}

export interface AgentDeployment {
  environment: 'development' | 'staging' | 'production';
  version: string;
  deployedAt: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  resources: ResourceAllocation;
}

export interface ResourceAllocation {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

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
  filters: Record<string, string | number | boolean>;
}

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

export interface OperationState {
  activeOperations: OperationStatus[];
  completedOperations: OperationStatus[];
  queuedOperations: OperationStatus[];
  statistics: OperationStatistics;
}

export interface OperationStatistics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  currentLoad: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  security: SecurityPreferences;
}

export interface NotificationPreferences {
  enabled: boolean;
  showProgress: boolean;
  showErrors: boolean;
  showSuccess: boolean;
  sound: boolean;
}

export interface DisplayPreferences {
  compactMode: boolean;
  showTimestamps: boolean;
  showConfidence: boolean;
  groupSimilar: boolean;
  maxResults: number;
}

export interface SecurityPreferences {
  requireConfirmation: boolean;
  logSensitiveOperations: boolean;
  autoLogout: number;
  encryptLocalStorage: boolean;
}

export interface SessionState {
  id: string;
  userId: string;
  startTime: number;
  lastActivity: number;
  authenticated: boolean;
  permissions: string[];
  context: SessionContext;
}

export interface SessionContext {
  ipAddress: string;
  userAgent: string;
  location?: GeolocationData;
  securityLevel: SecurityClassification;
  restrictions: string[];
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  coordinates: Coordinates;
  timezone: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Generic utility types
export type Timestamp = number;
export type UUID = string;
export type URL = string;
export type Domain = string;
export type IPAddress = string;
export type EmailAddress = string;

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  eta?: number;
  rate?: number;
}

export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
  duration: number;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  network: number;
  storage: number;
  timestamp: Timestamp;
}

export interface NetRunnerError {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  context?: Record<string, string | number | boolean>;
  timestamp: Timestamp;
  source: string;
}

export interface NetRunnerEvent {
  id: UUID;
  type: string;
  source: string;
  timestamp: Timestamp;
  data: Record<string, unknown>;
  processed: boolean;
}

// Type guards for runtime validation
export function isTargetIntelligence(obj: unknown): obj is TargetIntelligence {
  return obj !== null && 
    typeof obj === 'object' &&
    'id' in obj &&
    'url' in obj &&
    'domain' in obj &&
    'classification' in obj &&
    'threatLevel' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).url === 'string' &&
    typeof (obj as Record<string, unknown>).domain === 'string' &&
    ['unclassified', 'confidential', 'secret', 'top-secret'].includes((obj as Record<string, unknown>).classification as string) &&
    ['low', 'medium', 'high', 'critical'].includes((obj as Record<string, unknown>).threatLevel as string);
}

export function isValidThreatLevel(level: unknown): level is ThreatLevel {
  return ['low', 'medium', 'high', 'critical'].includes(level as string);
}

export function isValidPriority(priority: unknown): priority is Priority {
  return ['low', 'medium', 'high', 'critical'].includes(priority as string);
}

export function isValidOperationStatus(status: unknown): status is OperationStatus {
  return status !== null &&
    typeof status === 'object' &&
    'type' in status &&
    'progress' in status &&
    'currentTask' in status &&
    ['idle', 'scanning', 'crawling', 'analyzing', 'completed', 'error'].includes((status as Record<string, unknown>).type as string) &&
    typeof (status as Record<string, unknown>).progress === 'number' &&
    typeof (status as Record<string, unknown>).currentTask === 'string';
}

// Constants
export const THREAT_LEVELS: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
export const SECURITY_CLASSIFICATIONS: SecurityClassification[] = ['unclassified', 'confidential', 'secret', 'top-secret'];
export const AGENT_TYPES: AgentType[] = ['reconnaissance', 'vulnerability_scanner', 'threat_hunter', 'analyst', 'responder', 'monitor'];
export const AGENT_STATUSES: AgentStatus[] = ['idle', 'active', 'busy', 'error', 'maintenance', 'offline'];

// Default configurations
export const DEFAULT_OPERATION_STATUS: OperationStatus = {
  type: 'idle',
  progress: 0,
  currentTask: 'Ready for operations'
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'dark',
  autoRefresh: true,
  refreshInterval: 30000,
  notifications: {
    enabled: true,
    showProgress: true,
    showErrors: true,
    showSuccess: true,
    sound: false
  },
  display: {
    compactMode: false,
    showTimestamps: true,
    showConfidence: true,
    groupSimilar: true,
    maxResults: 100
  },
  security: {
    requireConfirmation: true,
    logSensitiveOperations: true,
    autoLogout: 1800000, // 30 minutes
    encryptLocalStorage: true
  }
};
