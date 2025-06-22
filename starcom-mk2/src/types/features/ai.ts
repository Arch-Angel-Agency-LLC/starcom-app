/**
 * AI Co-Investigator Type Definitions
 * Comprehensive type system for AI integration
 */

// ===== CORE AI TYPES =====

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatType = 'CYBER' | 'SPACE' | 'PLANETARY' | 'STELLAR' | 'HYBRID';
export type InsightType = 'PATTERN' | 'THREAT' | 'PREDICTION' | 'CORRELATION' | 'ANOMALY';
export type ActionType = 'INVESTIGATE' | 'ALERT' | 'CORRELATE' | 'ESCALATE' | 'MONITOR';
export type ConfidenceLevel = number; // 0-1 scale

// ===== AI INSIGHT SYSTEM =====

export interface AIInsight {
  id: string;
  type: InsightType;
  severity: ThreatSeverity;
  confidence: ConfidenceLevel;
  timestamp: Date;
  contexts: string[]; // Which contexts this applies to
  title: string;
  description: string;
  data: InsightData;
  recommendedActions: ActionRecommendation[];
  provenanceChain: AnalysisProvenance[];
  geolocation?: GeospatialPoint;
  timeframe?: TimeRange;
}

export interface InsightData {
  correlatedEvents: CorrelatedEvent[];
  patterns: DetectedPattern[];
  predictions: PredictiveModel[];
  anomalies: AnomalyDetection[];
  metadata: Record<string, string | number | boolean>;
}

export interface AnalysisProvenance {
  analysisId: string;
  engineType: string;
  timestamp: Date;
  confidence: ConfidenceLevel;
  methodology: string;
  dataSource: string;
}

// ===== THREAT HORIZON SYSTEM =====

export interface ThreatIndicator {
  id: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  confidence: ConfidenceLevel;
  title: string;
  description: string;
  geolocation?: GeospatialPoint;
  timeframe: TimeRange;
  relatedThreats: string[]; // IDs of related threats
  estimatedImpact: ImpactAssessment;
  recommendedResponse: string[];
  dataPoints: ThreatDataPoint[];
}

export interface ThreatDataPoint {
  source: string;
  timestamp: Date;
  value: number;
  type: string;
  metadata: Record<string, string | number | boolean>;
}

export interface ImpactAssessment {
  scope: 'LOCAL' | 'REGIONAL' | 'GLOBAL' | 'MULTI_DOMAIN';
  timelineToImpact: number; // hours
  estimatedDamage: string;
  criticalAssets: string[];
  affectedContexts: string[];
}

// ===== PATTERN DETECTION =====

export interface DetectedPattern {
  id: string;
  type: 'TEMPORAL' | 'SPATIAL' | 'BEHAVIORAL' | 'NETWORK' | 'CROSS_DOMAIN';
  confidence: ConfidenceLevel;
  description: string;
  occurrences: PatternOccurrence[];
  predictiveValue: number;
  relatedPatterns: string[];
}

export interface PatternOccurrence {
  timestamp: Date;
  location?: GeospatialPoint;
  context: string;
  strength: number;
  associatedData: Record<string, string | number | boolean>;
}

// ===== ACTION RECOMMENDATIONS =====

export interface ActionRecommendation {
  id: string;
  actionType: ActionType;
  priority: number; // 1-10 scale
  contextRelevance: ConfidenceLevel;
  confidence: ConfidenceLevel;
  title: string;
  description: string;
  estimatedImpact: ImpactAssessment;
  executionSteps: ActionStep[];
  prerequisites: string[];
  estimatedDuration: number; // minutes
  resourceRequirements: ResourceRequirement[];
}

export interface ActionStep {
  id: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
  requiredTools: string[];
  estimatedTime: number; // minutes
}

export interface ResourceRequirement {
  type: 'PERSONNEL' | 'TECHNICAL' | 'EXTERNAL_API' | 'COMPUTATION';
  description: string;
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
}

// ===== GEOSPATIAL & TEMPORAL =====

export interface GeospatialPoint {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  elevation?: number;
  region?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  duration: number; // milliseconds
  timezone?: string;
}

// ===== CORRELATION SYSTEM =====

export interface CorrelatedEvent {
  id: string;
  primaryEventId: string;
  correlatedEventId: string;
  correlationType: 'CAUSAL' | 'TEMPORAL' | 'SPATIAL' | 'BEHAVIORAL' | 'PATTERN';
  strength: ConfidenceLevel;
  description: string;
  discoveredBy: string; // AI engine that found the correlation
  timestamp: Date;
}

export interface CorrelationMatrix {
  id: string;
  sourceEvents: string[];
  correlations: CorrelatedEvent[];
  confidenceMetrics: ConfidenceMetrics;
  visualizationData: CorrelationVisualization;
}

export interface ConfidenceMetrics {
  overallConfidence: ConfidenceLevel;
  dataQuality: ConfidenceLevel;
  modelAccuracy: ConfidenceLevel;
  temporalReliability: ConfidenceLevel;
  spatialReliability: ConfidenceLevel;
}

// ===== PREDICTIVE MODELING =====

export interface PredictiveModel {
  id: string;
  modelType: 'THREAT_ESCALATION' | 'PATTERN_CONTINUATION' | 'IMPACT_PREDICTION' | 'BEHAVIOR_FORECAST';
  confidence: ConfidenceLevel;
  timeHorizon: number; // hours into future
  predictions: Prediction[];
  accuracy: ModelAccuracy;
  lastTrainingDate: Date;
}

export interface Prediction {
  id: string;
  timestamp: Date; // when this is predicted to occur
  description: string;
  probability: number; // 0-1
  severity: ThreatSeverity;
  affectedContexts: string[];
  mitigationStrategies: string[];
}

export interface ModelAccuracy {
  historicalAccuracy: number; // 0-1
  recentAccuracy: number; // 0-1
  confidenceInterval: [number, number];
  validationDate: Date;
}

// ===== ANOMALY DETECTION =====

export interface AnomalyDetection {
  id: string;
  type: 'STATISTICAL' | 'BEHAVIORAL' | 'PATTERN' | 'TEMPORAL' | 'SPATIAL';
  severity: ThreatSeverity;
  confidence: ConfidenceLevel;
  description: string;
  detectedAt: Date;
  location?: GeospatialPoint;
  context: string;
  baselineData: BaselineMetrics;
  currentData: CurrentMetrics;
  deviationScore: number;
}

export interface BaselineMetrics {
  period: TimeRange;
  averageValue: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
  sampleSize: number;
}

export interface CurrentMetrics {
  timestamp: Date;
  value: number;
  deviationFromBaseline: number;
  significanceLevel: number;
}

// ===== VISUALIZATION INTERFACES =====

export interface CorrelationVisualization {
  nodes: CorrelationNode[];
  edges: CorrelationEdge[];
  layout: 'FORCE_DIRECTED' | 'HIERARCHICAL' | 'CIRCULAR' | 'TIMELINE';
  filters: VisualizationFilter[];
}

export interface CorrelationNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  position?: { x: number; y: number };
  metadata: Record<string, string | number | boolean>;
}

export interface CorrelationEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: string;
  color: string;
  label?: string;
}

export interface VisualizationFilter {
  property: string;
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN_RANGE';
  value: string | number | boolean | [number, number];
  active: boolean;
}

// ===== AI ENGINE INTERFACES =====

export interface AIAnalysisEngine {
  id: string;
  name: string;
  type: 'PATTERN_DETECTION' | 'THREAT_MODELING' | 'CORRELATION' | 'PREDICTION' | 'ANOMALY';
  status: 'ACTIVE' | 'INACTIVE' | 'TRAINING' | 'ERROR';
  lastUpdate: Date;
  performance: EnginePerformance;
  configuration: EngineConfiguration;
}

export interface EnginePerformance {
  accuracy: number;
  processingSpeed: number; // items per second
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  successRate: number; // 0-1
}

export interface EngineConfiguration {
  sensitivity: number; // 0-1
  confidenceThreshold: number; // 0-1
  dataRetentionPeriod: number; // hours
  updateFrequency: number; // minutes
  parameters: Record<string, string | number | boolean>;
}

// ===== STATE MANAGEMENT =====

export interface AIState {
  // Threat Horizon
  threatIndicators: ThreatIndicator[];
  activeThreatCount: number;
  severityDistribution: Record<ThreatSeverity, number>;
  
  // Insights & Patterns
  recentInsights: AIInsight[];
  detectedPatterns: DetectedPattern[];
  correlatedEvents: CorrelatedEvent[];
  
  // Recommendations
  actionRecommendations: ActionRecommendation[];
  priorityActions: ActionRecommendation[];
  
  // AI Engines
  activeEngines: AIAnalysisEngine[];
  engineStatus: Record<string, 'ACTIVE' | 'INACTIVE' | 'ERROR'>;
  
  // Predictive Models
  predictiveModels: PredictiveModel[];
  futurePredictions: Prediction[];
  
  // UI State
  selectedThreat?: string;
  selectedInsight?: string;
  threatHorizonExpanded: boolean;
  actionPanelExpanded: boolean;
  confidenceFilterThreshold: number;
  
  // Performance
  lastUpdateTimestamp: Date;
  processingStatus: 'IDLE' | 'PROCESSING' | 'ERROR';
  errorMessages: string[];
}

// ===== ACTION TYPES =====

export type AIActionType =
  | { type: 'ADD_THREAT_INDICATOR'; payload: ThreatIndicator }
  | { type: 'UPDATE_THREAT_INDICATOR'; payload: { id: string; updates: Partial<ThreatIndicator> } }
  | { type: 'REMOVE_THREAT_INDICATOR'; payload: string }
  | { type: 'ADD_INSIGHT'; payload: AIInsight }
  | { type: 'UPDATE_INSIGHT'; payload: { id: string; updates: Partial<AIInsight> } }
  | { type: 'ADD_ACTION_RECOMMENDATION'; payload: ActionRecommendation }
  | { type: 'EXECUTE_ACTION'; payload: { actionId: string; userId: string } }
  | { type: 'UPDATE_ENGINE_STATUS'; payload: { engineId: string; status: string } }
  | { type: 'SET_CONFIDENCE_THRESHOLD'; payload: number }
  | { type: 'TOGGLE_THREAT_HORIZON'; payload?: boolean }
  | { type: 'TOGGLE_ACTION_PANEL'; payload?: boolean }
  | { type: 'SELECT_THREAT'; payload?: string }
  | { type: 'SELECT_INSIGHT'; payload?: string }
  | { type: 'CLEAR_ERROR_MESSAGES' }
  | { type: 'SET_PROCESSING_STATUS'; payload: 'IDLE' | 'PROCESSING' | 'ERROR' }
  | { type: 'ADD_ERROR_MESSAGE'; payload: string };
