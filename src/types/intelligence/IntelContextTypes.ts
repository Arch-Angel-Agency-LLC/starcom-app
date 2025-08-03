/**
 * Intel Reports 3D - Context-Aware Types
 * 
 * Types for HUD context integration and context-aware functionality.
 * These types enable Intel Reports to participate in the Starcom HUD
 * contextual hierarchy system.
 */

import type { 
  IntelPriority
} from '../../models/Intel/IntelEnums';

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
 * Context change callbacks for basic event handling
 */
export interface IntelContextCallbacks {
  onOperationModeChange?: (mode: OperationMode, context: IntelReport3DContextState) => void;
  onCenterModeChange?: (mode: CenterMode, context: IntelReport3DContextState) => void;
  onSelectionChange?: (selection: string | null, context: IntelReport3DContextState) => void;
  onLayerChange?: (layers: string[], context: IntelReport3DContextState) => void;
  onFocusChange?: (region: GeographicRegion | null, context: IntelReport3DContextState) => void;
}

/**
 * Basic context manager interface
 */
export interface IntelContextManager {
  // Current context
  getCurrentContext(): IntelReport3DContextState;
  
  // Context updates
  updateContext(updates: Partial<IntelReport3DContextState>): void;
  setHUDContext(hudContext: HUDContextData): void;
  
  // Context validation
  validateContext(context: IntelReport3DContextState): IntelContextValidation;
  
  // Context subscription
  subscribe(callback: (context: IntelReport3DContextState) => void): () => void;
  
  // Basic callbacks
  setCallbacks(callbacks: Partial<IntelContextCallbacks>): void;
}
