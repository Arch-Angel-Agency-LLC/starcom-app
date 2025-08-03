/**
 * Intel Reports 3D - Multi-Context Types
 * 
 * Types for multi-context display scenarios including split-screen,
 * cross-layer synchronization, and floating panel integration.
 */

import type { 
  IntelReport3DData 
} from '../../models/Intel/IntelVisualization3D';
import type { 
  IntelReport3DContextState, 
  GeographicRegion 
} from './IntelContextTypes';

// =============================================================================
// MULTI-CONTEXT DISPLAY TYPES
// =============================================================================

/**
 * Multi-context configuration for split-screen scenarios
 */
export interface IntelReport3DMultiContext {
  // Context configurations
  contexts: IntelReport3DContextState[];
  
  // Synchronization settings
  syncState: IntelMultiContextSync;
  
  // Split-screen configuration
  splitScreenConfig?: IntelSplitScreenConfig;
  
  // Performance optimization for multi-context
  performanceConfig?: IntelMultiContextPerformance;
  
  // Cross-context communication
  communicationConfig?: IntelContextCommunication;
}

/**
 * Synchronization configuration between contexts
 */
export interface IntelMultiContextSync {
  // Temporal synchronization
  temporalSync: boolean;
  temporalTolerance?: number; // milliseconds
  
  // Geospatial synchronization
  geospatialSync: boolean;
  geospatialTolerance?: number; // kilometers
  
  // Entity synchronization (same intel across contexts)
  entitySync: boolean;
  entityPropagation?: 'selection' | 'focus' | 'all';
  
  // Threat synchronization
  threatSync: boolean;
  threatPropagation?: 'critical' | 'high' | 'all';
  
  // Custom synchronization rules
  customSync?: IntelCustomSyncRule[];
}

/**
 * Custom synchronization rule
 */
export interface IntelCustomSyncRule {
  id: string;
  name: string;
  description: string;
  
  // Trigger conditions
  trigger: IntelSyncTrigger;
  
  // Synchronization action
  action: IntelSyncAction;
  
  // Target contexts (indices in multi-context array)
  targetContexts: number[];
  
  // Priority and timing
  priority: number;
  debounceMs?: number;
  enabled: boolean;
}

/**
 * Synchronization trigger conditions
 */
export interface IntelSyncTrigger {
  eventType: 'selection' | 'focus' | 'filter' | 'search' | 'timeline' | 'custom';
  
  // Event-specific conditions
  conditions?: {
    intelIds?: string[];
    categories?: string[];
    priorities?: string[];
    classifications?: string[];
    geographicBounds?: GeographicRegion;
    timeRange?: { start: Date; end: Date; };
  };
  
  // Custom trigger function
  customTrigger?: (context: IntelReport3DContextState, intel: IntelReport3DData[]) => boolean;
}

/**
 * Synchronization action to perform
 */
export interface IntelSyncAction {
  type: 'propagate' | 'highlight' | 'filter' | 'focus' | 'custom';
  
  // Action-specific parameters
  parameters?: {
    propagateSelection?: boolean;
    highlightDuration?: number;
    filterCriteria?: Record<string, unknown>;
    focusTransition?: boolean;
    animationDuration?: number;
  };
  
  // Custom action function
  customAction?: (
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[],
    intel: IntelReport3DData[]
  ) => void;
}

// =============================================================================
// SPLIT-SCREEN CONFIGURATION
// =============================================================================

/**
 * Split-screen layout configuration
 */
export interface IntelSplitScreenConfig {
  // Layout type
  layout: IntelSplitScreenLayout;
  
  // Context mapping to screen regions
  contextMapping: Record<number, IntelSplitScreenRegion>;
  
  // Primary context (receives focus)
  primaryContext: number;
  
  // Layout properties
  layoutProps: IntelSplitScreenProps;
  
  // Interaction behavior
  interactionBehavior: IntelSplitScreenInteraction;
}

/**
 * Split-screen layout types
 */
export type IntelSplitScreenLayout = 
  | 'horizontal'      // Side-by-side contexts
  | 'vertical'        // Top/bottom contexts  
  | 'quad'           // Four-quadrant display
  | 'picture-in-picture'  // Small overlay context
  | 'tabbed'         // Tab-based context switching
  | 'floating'       // Floating panel contexts
  | 'custom';        // Custom layout configuration

/**
 * Screen region definition for context placement
 */
export interface IntelSplitScreenRegion {
  id: string;
  bounds: {
    x: number;      // 0-1, relative position
    y: number;      // 0-1, relative position
    width: number;  // 0-1, relative size
    height: number; // 0-1, relative size
  };
  zIndex: number;
  resizable: boolean;
  movable: boolean;
  minimizable: boolean;
}

/**
 * Split-screen layout properties
 */
export interface IntelSplitScreenProps {
  // Spacing and borders
  gap: number;
  borderWidth: number;
  borderColor: string;
  
  // Responsive behavior
  responsive: boolean;
  minContextSize: { width: number; height: number; };
  
  // Transition animations
  transitionDuration: number;
  transitionEasing: string;
  
  // Performance settings
  sharedResources: boolean;
  isolatedRendering: boolean;
}

/**
 * Split-screen interaction behavior
 */
export interface IntelSplitScreenInteraction {
  // Focus management
  focusFollowsMouse: boolean;
  clickToFocus: boolean;
  keyboardNavigation: boolean;
  
  // Cross-context interactions
  dragAndDrop: boolean;
  crossContextSelection: boolean;
  sharedTooltips: boolean;
  
  // Context switching
  tabSwitching: boolean;
  gestureSupport: boolean;
  keyboardShortcuts: Record<string, string>;
}

// =============================================================================
// FLOATING PANEL INTEGRATION
// =============================================================================

/**
 * Floating panel configuration for Intel Reports
 */
export interface IntelReport3DFloatingPanel {
  // Panel identification
  panelId: string;
  type: IntelFloatingPanelType;
  
  // Trigger configuration
  triggerConfig: IntelFloatingPanelTrigger;
  
  // Position and layout
  position: IntelFloatingPanelPosition;
  
  // Content configuration
  contentConfig: IntelFloatingPanelContent;
  
  // Behavior settings
  behavior: IntelFloatingPanelBehavior;
  
  // Priority and lifecycle
  priority: 'primary' | 'secondary' | 'tertiary';
  lifecycle: IntelFloatingPanelLifecycle;
}

/**
 * Types of floating panels for Intel Reports
 */
export type IntelFloatingPanelType = 
  | 'detail'         // Intel report detail view
  | 'analysis'       // Intel analysis tools
  | 'relationships'  // Intel relationship visualization
  | 'timeline'       // Temporal analysis
  | 'collaboration'  // Team collaboration tools
  | 'comparison'     // Multi-intel comparison
  | 'classification' // Classification management
  | 'export'         // Export and sharing tools
  | 'search'         // Advanced search interface
  | 'custom';        // Custom panel type

/**
 * Floating panel trigger configuration
 */
export interface IntelFloatingPanelTrigger {
  triggerType: 'geographic' | 'selection' | 'context' | 'alert' | 'manual' | 'api';
  
  // Geographic triggers
  geographic?: {
    anchor: 'globe' | 'marker' | 'region';
    coordinates?: [number, number];
    region?: GeographicRegion;
    followMovement: boolean;
  };
  
  // Selection triggers
  selection?: {
    intelTypes: string[];
    multiSelection: boolean;
    autoTrigger: boolean;
    delay: number;
  };
  
  // Context triggers
  context?: {
    operationModes: string[];
    centerModes: string[];
    layerStates: string[];
    conditions: Record<string, unknown>;
  };
  
  // Alert triggers
  alert?: {
    severityLevels: string[];
    categories: string[];
    autoShow: boolean;
    dismissible: boolean;
  };
}

/**
 * Floating panel position configuration
 */
export interface IntelFloatingPanelPosition {
  // Position strategy
  anchor: 'globe' | 'screen' | 'relative' | 'mouse' | 'custom';
  
  // Coordinates (strategy-dependent)
  coordinates: [number, number];
  offset?: [number, number];
  
  // Positioning constraints
  constraints?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    keepInViewport: boolean;
    avoidOverlap: boolean;
  };
  
  // Dynamic positioning
  dynamic?: {
    followTarget: boolean;
    updateFrequency: number;
    smoothTransition: boolean;
  };
}

/**
 * Floating panel content configuration
 */
export interface IntelFloatingPanelContent {
  // Content source
  source: 'intel' | 'analysis' | 'external' | 'computed' | 'custom';
  
  // Content data
  data: IntelFloatingPanelData;
  
  // Display properties
  display: {
    width: number;
    height: number;
    maxWidth?: number;
    maxHeight?: number;
    resizable: boolean;
    scrollable: boolean;
  };
  
  // Styling
  styling: {
    theme: string;
    customCSS?: string;
    transparency: number;
    borderRadius: number;
  };
}

/**
 * Floating panel data configuration
 */
export interface IntelFloatingPanelData {
  // Static content
  title?: string;
  description?: string;
  
  // Dynamic content sources
  intelReports?: string[];      // Intel report IDs
  analysisResults?: unknown[];  // Analysis data
  externalData?: unknown[];     // External data sources
  
  // Content templates
  template?: string;
  templateData?: Record<string, unknown>;
  
  // Real-time updates
  realTime?: {
    enabled: boolean;
    updateInterval: number;
    websocketUrl?: string;
  };
}

/**
 * Floating panel behavior configuration
 */
export interface IntelFloatingPanelBehavior {
  // Interaction behavior
  draggable: boolean;
  resizable: boolean;
  minimizable: boolean;
  closable: boolean;
  
  // Display behavior
  modal: boolean;
  autoHide: boolean;
  autoHideDelay?: number;
  fadeInOut: boolean;
  
  // Focus behavior
  stealFocus: boolean;
  returnFocus: boolean;
  focusable: boolean;
  
  // Event handling
  clickThrough: boolean;
  captureKeyboard: boolean;
  captureMouse: boolean;
}

/**
 * Floating panel lifecycle configuration
 */
export interface IntelFloatingPanelLifecycle {
  // Creation and destruction
  autoCreate: boolean;
  autoDestroy: boolean;
  maxInstances: number;
  
  // Timing
  showDelay: number;
  hideDelay: number;
  maxDisplayTime?: number;
  
  // Persistence
  persistent: boolean;
  saveState: boolean;
  restoreState: boolean;
  
  // Cleanup
  destroyOnContextChange: boolean;
  destroyOnNavigation: boolean;
}

// =============================================================================
// CROSS-LAYER SYNCHRONIZATION
// =============================================================================

/**
 * Cross-layer synchronization with other CYBER data layers
 */
export interface IntelReport3DCyberSync {
  // Related CYBER layers
  securityLayers: string[];
  networkLayers: string[];
  financialLayers: string[];
  threatIntelLayers: string[];
  
  // Synchronization rules
  syncRules: IntelCyberSyncRules;
  
  // Data correlation
  correlationRules: IntelCorrelationRule[];
  
  // Event propagation
  eventPropagation: IntelEventPropagation;
}

/**
 * CYBER layer synchronization rules
 */
export interface IntelCyberSyncRules {
  // Entity matching across layers
  entityMatching: boolean;
  entityMatchCriteria: IntelEntityMatchCriteria;
  
  // Geospatial correlation
  geospatialCorrelation: boolean;
  geospatialTolerance: number;
  
  // Temporal alignment
  temporalAlignment: boolean;
  temporalTolerance: number;
  
  // Threat propagation
  threatPropagation: boolean;
  threatThreshold: string;
}

/**
 * Entity matching criteria for cross-layer sync
 */
export interface IntelEntityMatchCriteria {
  // Matching fields
  ipAddresses: boolean;
  hostnames: boolean;
  userIds: boolean;
  organizationIds: boolean;
  geolocation: boolean;
  
  // Matching algorithms
  exactMatch: boolean;
  fuzzyMatch: boolean;
  fuzzyThreshold: number;
  
  // Custom matching
  customMatchers?: IntelCustomMatcher[];
}

/**
 * Custom entity matcher
 */
export interface IntelCustomMatcher {
  id: string;
  name: string;
  description: string;
  
  // Matching function
  matcher: (
    intelEntity: Record<string, unknown>,
    layerEntity: Record<string, unknown>
  ) => number; // 0-1 confidence score
  
  // Configuration
  threshold: number;
  weight: number;
  enabled: boolean;
}

/**
 * Data correlation rule for cross-layer analysis
 */
export interface IntelCorrelationRule {
  id: string;
  name: string;
  description: string;
  
  // Source layers
  sourceLayers: string[];
  
  // Correlation criteria
  criteria: IntelCorrelationCriteria;
  
  // Action to take when correlation found
  action: IntelCorrelationAction;
  
  // Priority and timing
  priority: number;
  enabled: boolean;
}

/**
 * Correlation criteria
 */
export interface IntelCorrelationCriteria {
  // Field correlations
  fieldCorrelations: Record<string, string[]>;
  
  // Temporal correlation
  temporalWindow?: number; // milliseconds
  
  // Geospatial correlation
  geospatialRadius?: number; // kilometers
  
  // Confidence threshold
  confidenceThreshold: number;
  
  // Custom correlation function
  customCorrelation?: (
    intelData: IntelReport3DData[],
    layerData: Record<string, unknown>[]
  ) => IntelCorrelationResult[];
}

/**
 * Correlation result
 */
export interface IntelCorrelationResult {
  intelId: string;
  layerEntityId: string;
  confidence: number;
  correlationType: string;
  metadata?: Record<string, unknown>;
}

/**
 * Correlation action
 */
export interface IntelCorrelationAction {
  type: 'highlight' | 'link' | 'aggregate' | 'alert' | 'custom';
  
  // Action parameters
  parameters?: {
    highlightDuration?: number;
    linkType?: string;
    aggregationMethod?: string;
    alertSeverity?: string;
  };
  
  // Custom action
  customAction?: (correlations: IntelCorrelationResult[]) => void;
}

/**
 * Event propagation configuration
 */
export interface IntelEventPropagation {
  // Event types to propagate
  eventTypes: IntelEventType[];
  
  // Propagation targets
  targetLayers: string[];
  
  // Propagation rules
  propagationRules: IntelPropagationRule[];
  
  // Event transformation
  eventTransformation?: IntelEventTransformation;
}

/**
 * Intel event types
 */
export type IntelEventType = 
  | 'creation'
  | 'update'
  | 'deletion'
  | 'selection'
  | 'classification_change'
  | 'priority_change'
  | 'location_change'
  | 'relationship_change';

/**
 * Event propagation rule
 */
export interface IntelPropagationRule {
  eventType: IntelEventType;
  targetLayers: string[];
  transformationType?: string;
  delay?: number;
  enabled: boolean;
}

/**
 * Event transformation for cross-layer compatibility
 */
export interface IntelEventTransformation {
  // Field mappings
  fieldMappings: Record<string, string>;
  
  // Data transformations
  transformations: IntelDataTransformation[];
  
  // Event format conversion
  formatConversion?: (intelEvent: IntelEvent) => Record<string, unknown>;
}

/**
 * Data transformation rule
 */
export interface IntelDataTransformation {
  sourceField: string;
  targetField: string;
  transformation: 'copy' | 'convert' | 'aggregate' | 'compute' | 'custom';
  parameters?: Record<string, unknown>;
  customTransform?: (value: unknown) => unknown;
}

/**
 * Intel event structure
 */
export interface IntelEvent {
  id: string;
  type: IntelEventType;
  intelId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// PERFORMANCE OPTIMIZATION FOR MULTI-CONTEXT
// =============================================================================

/**
 * Performance optimization for multi-context scenarios
 */
export interface IntelMultiContextPerformance {
  // Resource sharing
  sharedResources: boolean;
  resourcePool: IntelResourcePool;
  
  // Rendering optimization
  renderingStrategy: IntelMultiContextRenderingStrategy;
  
  // Memory management
  memoryManagement: IntelMultiContextMemory;
  
  // Update optimization
  updateOptimization: IntelMultiContextUpdates;
}

/**
 * Shared resource pool for multi-context
 */
export interface IntelResourcePool {
  // Texture sharing
  sharedTextures: boolean;
  textureCache: boolean;
  maxTextures: number;
  
  // Geometry sharing
  sharedGeometry: boolean;
  geometryCache: boolean;
  maxGeometries: number;
  
  // Shader sharing
  sharedShaders: boolean;
  shaderCache: boolean;
  
  // Data sharing
  sharedDataSources: boolean;
  dataCache: boolean;
  cacheSize: number;
}

/**
 * Multi-context rendering strategy
 */
export interface IntelMultiContextRenderingStrategy {
  strategy: 'isolated' | 'shared' | 'hybrid' | 'adaptive';
  
  // Rendering priorities
  primaryContextPriority: number;
  secondaryContextPriority: number;
  
  // Performance targets
  targetFrameRate: number;
  maxRenderTime: number;
  
  // Adaptive behavior
  adaptiveThresholds: {
    performanceDrop: number;
    memoryPressure: number;
    contextCount: number;
  };
  
  // Fallback strategy
  fallbackStrategy: 'reduce_quality' | 'hide_contexts' | 'simplify_rendering';
}

/**
 * Memory management for multi-context
 */
export interface IntelMultiContextMemory {
  // Memory limits
  maxMemoryPerContext: number;
  totalMemoryLimit: number;
  
  // Garbage collection
  gcStrategy: 'aggressive' | 'conservative' | 'adaptive';
  gcInterval: number;
  
  // Memory pressure handling
  pressureThresholds: {
    warning: number;
    critical: number;
    emergency: number;
  };
  
  // Cleanup strategies
  cleanupStrategies: IntelMemoryCleanupStrategy[];
}

/**
 * Memory cleanup strategy
 */
export interface IntelMemoryCleanupStrategy {
  trigger: 'threshold' | 'interval' | 'context_change' | 'manual';
  priority: number;
  action: 'cache_clear' | 'texture_release' | 'geometry_release' | 'data_purge';
  parameters?: Record<string, unknown>;
}

/**
 * Update optimization for multi-context
 */
export interface IntelMultiContextUpdates {
  // Update batching
  batchUpdates: boolean;
  batchSize: number;
  batchTimeout: number;
  
  // Update prioritization
  prioritizeVisible: boolean;
  prioritizeActive: boolean;
  prioritizeFocused: boolean;
  
  // Differential updates
  differentialUpdates: boolean;
  deltaThreshold: number;
  
  // Synchronization optimization
  syncBatching: boolean;
  syncDelay: number;
  syncCoalescing: boolean;
}

// =============================================================================
// CONTEXT COMMUNICATION
// =============================================================================

/**
 * Communication configuration between contexts
 */
export interface IntelContextCommunication {
  // Communication channels
  channels: IntelCommunicationChannel[];
  
  // Message routing
  routing: IntelMessageRouting;
  
  // Event coordination
  eventCoordination: IntelEventCoordination;
  
  // State synchronization
  stateSynchronization: IntelStateSynchronization;
}

/**
 * Communication channel between contexts
 */
export interface IntelCommunicationChannel {
  id: string;
  type: 'direct' | 'broadcast' | 'pubsub' | 'custom';
  
  // Channel participants
  sourceContexts: number[];
  targetContexts: number[];
  
  // Message types
  messageTypes: string[];
  
  // Channel properties
  properties: {
    persistent: boolean;
    guaranteed: boolean;
    ordered: boolean;
    encrypted: boolean;
  };
}

/**
 * Message routing configuration
 */
export interface IntelMessageRouting {
  // Routing strategy
  strategy: 'direct' | 'hub' | 'mesh' | 'custom';
  
  // Routing rules
  rules: IntelRoutingRule[];
  
  // Message transformation
  transformation: boolean;
  transformationRules?: IntelMessageTransformation[];
}

/**
 * Message routing rule
 */
export interface IntelRoutingRule {
  messageType: string;
  sourcePattern: string;
  targetPattern: string;
  priority: number;
  enabled: boolean;
}

/**
 * Message transformation rule
 */
export interface IntelMessageTransformation {
  messageType: string;
  sourceFormat: string;
  targetFormat: string;
  transformer: (message: unknown) => unknown;
}

/**
 * Event coordination between contexts
 */
export interface IntelEventCoordination {
  // Coordinated event types
  coordinatedEvents: string[];
  
  // Coordination strategy
  strategy: 'sequential' | 'parallel' | 'conditional' | 'custom';
  
  // Coordination rules
  rules: IntelCoordinationRule[];
  
  // Conflict resolution
  conflictResolution: IntelConflictResolution;
}

/**
 * Event coordination rule
 */
export interface IntelCoordinationRule {
  eventType: string;
  coordinationStrategy: string;
  dependencies: string[];
  timeout: number;
  enabled: boolean;
}

/**
 * Conflict resolution strategy
 */
export interface IntelConflictResolution {
  strategy: 'priority' | 'timestamp' | 'merge' | 'user' | 'custom';
  parameters?: Record<string, unknown>;
  customResolver?: (conflicts: IntelEventConflict[]) => IntelEvent;
}

/**
 * Event conflict
 */
export interface IntelEventConflict {
  events: IntelEvent[];
  conflictType: string;
  resolution?: IntelEvent;
  timestamp: Date;
}

/**
 * State synchronization configuration
 */
export interface IntelStateSynchronization {
  // Synchronized state fields
  synchronizedFields: string[];
  
  // Synchronization strategy
  strategy: 'immediate' | 'batched' | 'lazy' | 'custom';
  
  // Conflict resolution
  conflictResolution: IntelStateConflictResolution;
  
  // Performance optimization
  optimization: {
    deltaSync: boolean;
    compression: boolean;
    deduplication: boolean;
  };
}

/**
 * State conflict resolution
 */
export interface IntelStateConflictResolution {
  strategy: 'last_write_wins' | 'merge' | 'user_choice' | 'custom';
  mergingRules?: IntelStateMergingRule[];
  customResolver?: (conflicts: IntelStateConflict[]) => Record<string, unknown>;
}

/**
 * State merging rule
 */
export interface IntelStateMergingRule {
  field: string;
  strategy: 'overwrite' | 'merge' | 'append' | 'custom';
  customMerger?: (values: unknown[]) => unknown;
}

/**
 * State conflict
 */
export interface IntelStateConflict {
  field: string;
  values: { contextId: number; value: unknown; timestamp: Date; }[];
  resolution?: unknown;
}
