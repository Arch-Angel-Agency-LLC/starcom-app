/**
 * Intel Reports 3D - Context-Aware Types
 * 
 * Types for HUD context integration and context-aware functionality.
 * These types enable Intel Reports to participate in the Starcom HUD
 * contextual hierarchy system.
 */

import type { 
  IntelReport3DData, 
  IntelPriority, 
  IntelCategory, 
  IntelVisualization 
} from './IntelReportTypes';

// =============================================================================
// HUD CONTEXT INTEGRATION TYPES
// =============================================================================

/**
 * HUD operation modes that affect Intel Reports display
 */
export type OperationMode = 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';

/**
 * CENTER display modes that Intel Reports must adapt to
 */
export type CenterMode = '3D_GLOBE' | 'TIMELINE' | 'NODE_GRAPH';

/**
 * Data layer types for cross-layer integration
 */
export interface DataLayer {
  id: string;
  type: string;
  active: boolean;
  opacity: number;
  priority: number;
}

/**
 * CYBER-specific data layers for intel integration
 */
export interface CyberDataLayer extends DataLayer {
  type: 'security' | 'intelligence' | 'networks' | 'financial' | 'threats';
  classification?: string;
  source?: string;
}

/**
 * Geographic region for context-based filtering
 */
export interface GeographicRegion {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom?: number;
}

/**
 * Mission state for operational context
 */
export interface MissionState {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime?: Date;
  endTime?: Date;
  objectives?: string[];
}

// =============================================================================
// INTEL CONTEXT STATE
// =============================================================================

/**
 * Complete context state for Intel Reports 3D
 * Integrates with HUD contextual hierarchy
 */
export interface IntelReport3DContextState {
  // Current HUD state
  hudContext: HUDContextData;
  
  // Context-sensitive display configuration
  displayContext: IntelDisplayContext;
  
  // HUD zone integration state
  integrationState: HUDIntegrationState;
  
  // Performance and optimization context
  performanceContext?: IntelPerformanceContext;
}

/**
 * HUD context data that affects Intel Reports
 */
export interface HUDContextData {
  operationMode: OperationMode;
  centerMode: CenterMode;
  activeLayers: string[];
  selectedObject: string | null;
  focusRegion?: GeographicRegion;
  missionContext?: MissionState;
  
  // Zone-specific state
  leftSideState?: {
    expandedCategories: string[];
    activeControls: string[];
  };
  
  rightSideState?: {
    activeTools: string[];
    visiblePanels: string[];
  };
  
  bottomBarState?: {
    activeTab: string;
    expandedPanels: string[];
  };
  
  topBarState?: {
    alerts: string[];
    statusItems: string[];
  };
}

/**
 * Display context configuration for Intel Reports
 */
export interface IntelDisplayContext {
  priority: 'primary' | 'secondary' | 'tertiary';
  visibility: 'full' | 'minimal' | 'hidden';
  adaptiveRendering: boolean;
  
  // Context-sensitive styling
  theme?: {
    colorScheme: 'cyber' | 'planetary' | 'space' | 'stellar';
    intensity: 'low' | 'medium' | 'high';
  };
  
  // Display optimization
  optimization?: {
    maxVisible: number;
    lodStrategy: 'distance' | 'priority' | 'hybrid';
    cullingEnabled: boolean;
  };
}

/**
 * HUD zone integration state
 */
export interface HUDIntegrationState {
  leftSideControls: boolean;      // Show intel controls in LEFT SIDE
  rightSideTools: boolean;        // Show intel tools in RIGHT SIDE
  bottomBarDetails: boolean;      // Show intel details in BOTTOM BAR
  topBarStatus: boolean;          // Show intel status in TOP BAR
  
  // Zone-specific configuration
  zones?: {
    leftSide?: IntelLeftSideConfig;
    rightSide?: IntelRightSideConfig;
    bottomBar?: IntelBottomBarConfig;
    topBar?: IntelTopBarConfig;
  };
}

/**
 * LEFT SIDE intel controls configuration
 */
export interface IntelLeftSideConfig {
  showInCyberCategory: boolean;
  enableLayerToggle: boolean;
  showClassificationFilter: boolean;
  showPriorityFilter: boolean;
  compactMode: boolean;
}

/**
 * RIGHT SIDE intel tools configuration
 */
export interface IntelRightSideConfig {
  showAnalysisTools: boolean;
  showRelationshipView: boolean;
  showClassificationInfo: boolean;
  showExportOptions: boolean;
  contextSensitive: boolean;
}

/**
 * BOTTOM BAR intel details configuration
 */
export interface IntelBottomBarConfig {
  showOnSelection: boolean;
  expandable: boolean;
  showRelatedIntel: boolean;
  showTimeline: boolean;
  showGeospatialData: boolean;
}

/**
 * TOP BAR intel status configuration
 */
export interface IntelTopBarConfig {
  showIntelAlerts: boolean;
  showDataFeedStatus: boolean;
  showClassificationIndicator: boolean;
  alertThreshold: IntelPriority;
}

/**
 * Performance context for optimization
 */
export interface IntelPerformanceContext {
  renderingMode: 'performance' | 'quality' | 'adaptive';
  maxIntelVisible: number;
  updateFrequency: number; // milliseconds
  memoryThreshold: number; // MB
  
  // Performance monitoring
  metrics?: {
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
    lastUpdate: Date;
  };
}

// =============================================================================
// CONTEXT ADAPTATION TYPES
// =============================================================================

/**
 * Context adaptation configuration
 */
export interface IntelContextAdaptation {
  // Adaptation rules
  rules: IntelAdaptationRule[];
  
  // Adaptation callbacks
  callbacks: IntelContextCallbacks;
  
  // Adaptation state
  state: IntelAdaptationState;
}

/**
 * Rules for context adaptation
 */
export interface IntelAdaptationRule {
  id: string;
  name: string;
  condition: IntelAdaptationCondition;
  action: IntelAdaptationAction;
  priority: number;
  enabled: boolean;
}

/**
 * Conditions that trigger adaptation
 */
export interface IntelAdaptationCondition {
  operationMode?: OperationMode[];
  centerMode?: CenterMode[];
  activeLayerCount?: { min?: number; max?: number; };
  selectedObjectType?: string[];
  performanceThreshold?: number;
  customCondition?: (context: IntelReport3DContextState) => boolean;
}

/**
 * Actions to take when adaptation is triggered
 */
export interface IntelAdaptationAction {
  type: 'visibility' | 'priority' | 'style' | 'performance' | 'custom';
  
  // Visibility actions
  visibility?: {
    show: boolean;
    opacity?: number;
    fadeTransition?: boolean;
  };
  
  // Priority actions
  priority?: {
    level: IntelPriority;
    boostFactor?: number;
  };
  
  // Style actions
  style?: {
    markerSize?: number;
    color?: string;
    animation?: string;
  };
  
  // Performance actions
  performance?: {
    lodLevel?: 'high' | 'medium' | 'low';
    maxVisible?: number;
    updateFrequency?: number;
  };
  
  // Custom action
  customAction?: (context: IntelReport3DContextState, intel: IntelReport3DData[]) => void;
}

/**
 * Current adaptation state
 */
export interface IntelAdaptationState {
  activeRules: string[];
  lastAdaptation: Date;
  adaptationCount: number;
  performanceImpact: number; // 0-1, impact on performance
}

/**
 * Context change callbacks
 */
export interface IntelContextCallbacks {
  onOperationModeChange?: (mode: OperationMode, context: IntelReport3DContextState) => void;
  onCenterModeChange?: (mode: CenterMode, context: IntelReport3DContextState) => void;
  onSelectionChange?: (selection: string | null, context: IntelReport3DContextState) => void;
  onLayerChange?: (layers: string[], context: IntelReport3DContextState) => void;
  onFocusChange?: (region: GeographicRegion | null, context: IntelReport3DContextState) => void;
  onPerformanceChange?: (metrics: IntelPerformanceContext, context: IntelReport3DContextState) => void;
  onIntegrationStateChange?: (state: HUDIntegrationState, context: IntelReport3DContextState) => void;
}

// =============================================================================
// CONTEXT UTILITIES
// =============================================================================

/**
 * Context validation result
 */
export interface IntelContextValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Context comparison result
 */
export interface IntelContextComparison {
  equal: boolean;
  differences: IntelContextDifference[];
  significantChange: boolean;
}

/**
 * Context difference details
 */
export interface IntelContextDifference {
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Context snapshot for history tracking
 */
export interface IntelContextSnapshot {
  id: string;
  timestamp: Date;
  context: IntelReport3DContextState;
  trigger: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// CONTEXT MANAGER INTERFACE
// =============================================================================

/**
 * Interface for context management service
 */
export interface IntelContextManager {
  // Current context
  getCurrentContext(): IntelReport3DContextState;
  
  // Context updates
  updateContext(updates: Partial<IntelReport3DContextState>): void;
  setHUDContext(hudContext: HUDContextData): void;
  
  // Context history
  getContextHistory(limit?: number): IntelContextSnapshot[];
  restoreContext(snapshotId: string): boolean;
  
  // Context validation
  validateContext(context: IntelReport3DContextState): IntelContextValidation;
  
  // Context subscription
  subscribe(callback: (context: IntelReport3DContextState) => void): () => void;
  
  // Context adaptation
  addAdaptationRule(rule: IntelAdaptationRule): void;
  removeAdaptationRule(ruleId: string): void;
  setAdaptationCallbacks(callbacks: Partial<IntelContextCallbacks>): void;
}

// =============================================================================
// ADVANCED CONTEXT INTEGRATION TYPES
// =============================================================================

/**
 * Context transition animation configuration
 */
export interface IntelContextTransition {
  enabled: boolean;
  duration: number;        // Transition duration in ms
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom';
  
  // Transition types for different context changes
  transitions: {
    operationMode: {
      fadeOut: number;
      fadeIn: number;
      transform: boolean;
    };
    centerMode: {
      duration: number;
      preserveSelection: boolean;
      smoothPan: boolean;
    };
    layerChange: {
      stagger: number;     // Stagger animation between layers
      batchSize: number;   // How many items to animate at once
    };
  };
}

/**
 * Context-aware filtering and priority adjustment
 */
export interface IntelContextualFiltering {
  // Automatic filtering based on context
  autoFilter: {
    enabled: boolean;
    operationModeFilters: Record<OperationMode, string[]>;
    centerModeFilters: Record<CenterMode, string[]>;
    priorityAdjustment: boolean;
  };
  
  // User-defined contextual rules
  userRules: IntelContextualRule[];
  
  // Performance optimization
  optimization: {
    maxItemsPerContext: number;
    priorityThreshold: IntelPriority;
    geographicCulling: boolean;
    temporalFiltering: boolean;
  };
}

/**
 * User-defined contextual filtering rule
 */
export interface IntelContextualRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Condition for when this rule applies
  condition: {
    operationModes?: OperationMode[];
    centerModes?: CenterMode[];
    timeOfDay?: { start: string; end: string; };
    userRoles?: string[];
    customCondition?: (context: IntelReport3DContextState) => boolean;
  };
  
  // Actions to take when condition is met
  actions: {
    showCategories?: IntelCategory[];
    hideCategories?: IntelCategory[];
    priorityBoost?: Record<string, number>;
    visualOverrides?: Partial<IntelVisualization>;
  };
  
  // Metadata
  priority: number;
  createdBy: string;
  createdAt: Date;
}

/**
 * Cross-layer data integration for CYBER mode
 */
export interface IntelCyberLayerIntegration {
  // Security data layer integration
  securityLayers: {
    threatIntel: boolean;
    vulnScanning: boolean;
    incidentResponse: boolean;
    forensics: boolean;
  };
  
  // Network data integration
  networkLayers: {
    topology: boolean;
    traffic: boolean;
    anomalies: boolean;
    performance: boolean;
  };
  
  // Financial crime integration
  financialLayers: {
    transactions: boolean;
    sanctions: boolean;
    aml: boolean;
    fraud: boolean;
  };
  
  // Data correlation rules
  correlationRules: {
    geospatialMatch: boolean;
    temporalCorrelation: number; // Time window in ms
    entityLinking: boolean;
    behaviorPattern: boolean;
  };
}
