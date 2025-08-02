/**
 * Unified Type System - Central Export Hub
 * Single source of truth for all Starcom HUD types
 */

// ===============================
// CORE COMMAND & CONTROL TYPES
// ===============================
export type {
  OperationMode,
  DisplayMode,
  PriorityLevel,
  AuthLevel,
  DataLayer,
  DataLayerType,
  LayoutState,
  FloatingPanel,
  MiniView,
  Operation,
  MissionState,
  ContextSnapshot,
  CenterViewState,
  SelectionState,
  ViewConfiguration,
  ViewInstance,
  CoreGlobalCommandState,
  CoreCommandAction
} from './core/command';

// ===============================
// FEATURE TYPES
// ===============================

// AI & Intelligence Types
export type {
  ThreatSeverity,
  ThreatType,
  InsightType,
  ActionType,
  ConfidenceLevel,
  AIInsight,
  InsightData,
  AnalysisProvenance,
  ThreatIndicator,
  ThreatDataPoint,
  ImpactAssessment,
  DetectedPattern,
  PatternOccurrence,
  ActionRecommendation,
  ActionStep,
  ResourceRequirement,
  GeospatialPoint,
  TimeRange,
  CorrelatedEvent,
  CorrelationMatrix,
  ConfidenceMetrics,
  PredictiveModel,
  Prediction,
  ModelAccuracy,
  AnomalyDetection,
  BaselineMetrics,
  CurrentMetrics,
  CorrelationVisualization,
  CorrelationNode,
  CorrelationEdge,
  VisualizationFilter,
  AIAnalysisEngine,
  EnginePerformance,
  EngineConfiguration,
  AIState,
  AIActionType
} from './features/ai';

// Collaboration Types
export type {
  AgencyType,
  ClearanceLevel,
  CollaborationRole,
  Operator,
  CollaborationSession,
  SharedContext,
  ContextPermissions,
  CollaborativeAnnotation,
  AnnotationPosition,
  CommunicationChannel,
  CollaborationMessage,
  MessageAttachment,
  SharedIntelligenceAsset,
  IntelligenceCategory,
  IntelligenceMetadata,
  AccessRequirement,
  AssetPricing,
  ProvenanceChain,
  EncryptionStatus,
  DecryptionLog,
  Web3AuthState,
  GovernmentCertificate,
  CollaborationState,
  SessionInvitation,
  MarketplaceState,
  MarketplaceFilters,
  CollaborationNotification,
  ConnectionStatus,
  CollaborationAction,
  SyncEvent,
  ConflictResolution,
  UseCollaborationReturn
} from './features/collaboration';

// Adaptive Interface Types
export type {
  OperatorRole,
  ExperienceLevel,
  InterfaceComplexity,
  ClearanceLevel as AdaptiveClearanceLevel,
  Specialization,
  OperatorProfile,
  AdaptationPreferences,
  InterfaceCustomization,
  AdaptiveConfiguration,
  UIComplexity,
  GuidanceLevel,
  ToolConfiguration,
  FeatureConfiguration,
  PanelConfiguration,
  PanelPosition,
  PanelSize,
  ProgressiveDisclosureState,
  SkillProgress,
  WorkflowTemplate,
  WorkflowStep,
  WorkflowAction,
  ValidationRule,
  ContextualHelpConfiguration,
  ContextualHelp,
  HelpTrigger,
  HelpCondition,
  AIAdaptationState,
  UserBehaviorProfile,
  TaskPattern,
  ErrorPattern,
  AdaptationRecommendation,
  LearningProgress,
  LearningGoal,
  Milestone,
  Achievement,
  SkillGap,
  PerformanceMetrics,
  PerformanceTrend,
  AdaptationEvent,
  AdaptiveInterfaceState,
  AdaptiveInterfaceAction,
  UseAdaptiveInterfaceReturn
} from './features/adaptive';

// Discord Integration Types
export type {
  DiscordServerStats,
  DiscordMember,
  DiscordChannel,
  DiscordNotificationData,
  DiscordActivityMetrics,
  DiscordWidgetConfig
} from './discord';

// ===============================
// DATA LAYER TYPES
// ===============================

// Space Weather Data
export type {
  NOAAElectricFieldData,
  ElectricFieldFeature,
  ElectricFieldProperties,
  ElectricFieldVector,
  SpaceWeatherAlert,
  NOAAEndpointConfig,
  ProcessedElectricFieldData,
  NOAAElectricFieldResponse
} from './data/spaceWeather';

// Intel Market Data (Blockchain/Solana)
export { IDL } from './data/intel_market';

// Conflict Data
export type {
  UCDPEvent,
  UCDPResponse,
  Conflict
} from './data/ucdpTypes';

// Temporal Data
export type {
  CacheEntry,
  TimestampedData,
  TimeSeriesData,
  TemporalQuery
} from './data/temporal';

// ===============================
// UTILITY TYPES
// ===============================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EventCallback<T = unknown> = (data: T) => void;
export type AsyncEventCallback<T = unknown> = (data: T) => Promise<void>;

export type ID = string;
export type Timestamp = number;
export type ISO8601String = string;

// ===============================
// UNIFIED ACTION TYPES
// ===============================

import { CoreCommandAction, OperationMode, DisplayMode, SelectionState, CoreGlobalCommandState, ContextSnapshot } from './core/command';
import { AIActionType, AIState } from './features/ai';
import { CollaborationAction, CollaborationState } from './features/collaboration';
import { AdaptiveInterfaceAction, AdaptiveInterfaceState, OperatorProfile, InterfaceComplexity } from './features/adaptive';

export type UnifiedAction = 
  | CoreCommandAction
  | AIActionType
  | CollaborationAction
  | AdaptiveInterfaceAction;

// ===============================
// CONTEXT TYPES
// ===============================

export interface UnifiedGlobalCommandState extends CoreGlobalCommandState {
  enhanced?: {
    activeContexts: Map<string, ContextSnapshot>;
    primaryContextId: string;
    ai?: AIState;
    collaboration?: CollaborationState;
    adaptive?: AdaptiveInterfaceState;
  };
}

export interface UnifiedGlobalCommandContextType {
  state: UnifiedGlobalCommandState;
  dispatch: (action: UnifiedAction) => void;
  features: {
    aiEnabled: boolean;
    collaborationEnabled: boolean;
    adaptiveInterfaceEnabled: boolean;
    enhancedContextEnabled: boolean;
  };
  // Core methods
  setOperationMode: (mode: OperationMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleLayer: (layerId: string) => void;
  updateSelection: (selection: SelectionState | null) => void;
  // Enhanced methods (when features enabled)
  updateOperatorProfile?: (profile: OperatorProfile) => void;
  setInterfaceComplexity?: (complexity: InterfaceComplexity) => void;
  shareContext?: (contextId: string) => void;
  joinCollaborationSession?: (sessionId: string) => void;
}
