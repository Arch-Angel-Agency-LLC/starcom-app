/**
 * Bot Mission Types and Interfaces
 * 
 * Defines the structure for autonomous bot missions and operations
 * 
 * @author GitHub Copilot
 * @date July 15, 2025
 */

import { Intel } from '../../../models/Intel/Intel';
import { RawData, Observation } from '../../../models/Intel/IntelligenceFlowchart';
import { IntelType } from '../tools/NetRunnerPowerTools';
import { OsintBot } from '../integration/BotRosterIntegration';

export type MissionType = 'reconnaissance' | 'monitoring' | 'assessment' | 'investigation';
export type MissionStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface BotMission {
  id: string;
  botId: string;
  target: string;
  missionType: MissionType;
  status: MissionStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: number;
  completionTime?: number;
  estimatedDuration: number;
  
  // Mission parameters
  objectives: string[];
  constraints: string[];
  toolsAuthorized: string[];
  maxConcurrentOperations: number;
  
  // Results
  intelGenerated: Intel[];
  rawDataCollected: RawData[];
  observationsCreated: Observation[];
  
  // Performance metrics
  successRate: number;
  accuracyScore: number;
  confidenceLevel: number;
  
  // Error handling
  errors: MissionError[];
  retryCount: number;
  maxRetries: number;
}

export interface MissionError {
  timestamp: number;
  errorType: 'tool_failure' | 'network_error' | 'processing_error' | 'validation_error';
  errorMessage: string;
  toolId?: string;
  recoverable: boolean;
  retryAttempted: boolean;
}

export interface MissionPlan {
  id: string;
  missionId: string;
  plannedSteps: MissionStep[];
  estimatedDuration: number;
  resourceRequirements: ResourceRequirement[];
  riskAssessment: RiskAssessment;
  fallbackStrategies: FallbackStrategy[];
}

export interface MissionStep {
  id: string;
  stepNumber: number;
  stepType: 'tool_execution' | 'data_processing' | 'intel_synthesis' | 'validation';
  toolId?: string;
  estimatedDuration: number;
  dependencies: string[];
  successCriteria: string[];
  fallbackOptions: string[];
}

export interface ResourceRequirement {
  resourceType: 'api_calls' | 'bandwidth' | 'processing_power' | 'storage';
  amount: number;
  unit: string;
  critical: boolean;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  factor: string;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface FallbackStrategy {
  triggerId: string;
  triggerCondition: string;
  alternativeAction: string;
  expectedOutcome: string;
}

export interface MissionResult {
  missionId: string;
  botId: string;
  status: MissionStatus;
  completionTime: number;
  actualDuration: number;
  
  // Generated intelligence
  intelGenerated: Intel[];
  rawDataCollected: RawData[];
  observationsCreated: Observation[];
  
  // Performance metrics
  successRate: number;
  accuracyScore: number;
  confidenceLevel: number;
  efficiencyScore: number;
  
  // Quality assessment
  qualityMetrics: QualityMetrics;
  validationResults: ValidationResult[];
  
  // Lessons learned
  performanceInsights: string[];
  improvementSuggestions: string[];
  botLearnings: BotLearning[];
}

export interface QualityMetrics {
  dataAccuracy: number;
  sourceReliability: number;
  processingQuality: number;
  intelRelevance: number;
  crossValidationScore: number;
}

export interface ValidationResult {
  validationType: 'source_verification' | 'cross_reference' | 'confidence_check' | 'relevance_check';
  passed: boolean;
  score: number;
  details: string;
  recommendations: string[];
}

export interface BotLearning {
  learningType: 'tool_effectiveness' | 'target_patterns' | 'success_factors' | 'failure_modes';
  insight: string;
  applicability: string[];
  confidence: number;
}

export interface MissionExecutionContext {
  bot: OsintBot;
  mission: BotMission;
  plan: MissionPlan;
  environmentParams: {
    rateLimits: Record<string, number>;
    apiQuotas: Record<string, number>;
    networkConditions: 'excellent' | 'good' | 'poor' | 'degraded';
    securityLevel: 'standard' | 'enhanced' | 'maximum';
  };
  realTimeMetrics: {
    operationsPerformed: number;
    dataCollected: number;
    errorsEncountered: number;
    currentLoad: number;
    estimatedTimeRemaining: number;
  };
}

export interface AutonomousCapability {
  capabilityId: string;
  capabilityName: string;
  description: string;
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'autonomous';
  applicableSpecializations: IntelType[];
  requiredTools: string[];
  riskLevel: 'low' | 'medium' | 'high';
  learningEnabled: boolean;
}

export interface BotIntelOutput {
  missionId: string;
  botId: string;
  generatedAt: number;
  
  // Primary outputs
  intel: Intel[];
  reports: IntelReport[];
  alerts: IntelAlert[];
  
  // Metadata
  sourceData: RawData[];
  processingSteps: ProcessingStep[];
  qualityAssessment: QualityAssessment;
  
  // Confidence and reliability
  overallConfidence: number;
  sourceReliability: 'A' | 'B' | 'C' | 'D';
  verificationStatus: 'verified' | 'unverified' | 'contradicted';
}

export interface IntelReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  reportType: 'tactical' | 'operational' | 'strategic';
  classification: 'unclassified' | 'internal' | 'confidential';
  targetAudience: string[];
  keyFindings: string[];
  recommendations: string[];
  sourceIntel: string[];
}

export interface IntelAlert {
  id: string;
  alertType: 'threat' | 'opportunity' | 'anomaly' | 'update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredBy: string;
  actionRequired: boolean;
  recommendedActions: string[];
  expiresAt?: number;
}

export interface ProcessingStep {
  stepId: string;
  stepName: string;
  inputData: string[];
  outputData: string[];
  processingTime: number;
  successRate: number;
  errorDetails?: string;
}

export interface QualityAssessment {
  overallQuality: number;
  accuracyScore: number;
  relevanceScore: number;
  freshnessScore: number;
  completenessScore: number;
  reliabilityScore: number;
  detailedAssessment: string;
  improvementSuggestions: string[];
}
