/**
 * Unified Global Command Context
 * Combines base and enhanced functionality with progressive enhancement
 * Replaces GlobalCommandContext.tsx and EnhancedGlobalCommandContext.tsx
 */

import React, { 
  createContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  useMemo 
} from 'react';
import { settingsStorage } from '../utils/settingsStorage';
import { useFeatureFlag } from '../utils/featureFlags';

// ===============================
// CORE TYPES (Always Available)
// ===============================

export type OperationMode = 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';
export type DisplayMode = '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuthLevel = 'BASIC' | 'SECURE' | 'TOP_SECRET';

// Data Layer Categories
export interface DataLayerType {
  PLANETARY: {
    Weather: 'EarthWeather' | 'SpaceWeather' | 'StarWeather' | 'ClimateModels';
    Transport: 'Aircraft' | 'Ships' | 'Vehicles' | 'Railways' | 'Pipelines';
    Infrastructure: 'PowerGrids' | 'Communications' | 'Internet' | 'Supply';
    Ecological: 'Disasters' | 'Seismic' | 'Volcanic' | 'Biological';
  };
  SPACE: {
    Assets: 'Satellites' | 'SpaceStations' | 'Spacecraft' | 'Debris';
    Navigation: 'GPS' | 'GNSS' | 'Beacons' | 'Orbits';
    Communications: 'Relays' | 'DeepSpace' | 'Emergency';
    Weather: 'Solar' | 'Magnetic' | 'Radiation' | 'Cosmic';
  };
  CYBER: {
    Intelligence: 'OSINT' | 'HUMINT' | 'SIGINT' | 'Reports';
    Security: 'CrisisZones' | 'Threats' | 'Vulnerabilities' | 'Incidents';
    Networks: 'Infrastructure' | 'Traffic' | 'Topology' | 'Performance';
    Financial: 'Markets' | 'Crypto' | 'DeFi' | 'Trading';
  };
  STELLAR: {
    Monitoring: 'StarWeather' | 'SolarEvents' | 'GalacticEvents';
    Markets: 'PlanetaryHarmonics' | 'AstroTrading' | 'CommodityFlow';
    Navigation: 'StellarBeacons' | 'GalacticMaps' | 'DeepSpaceRoutes';
    Communications: 'InterstellarRelay' | 'QuantumComm' | 'Signals';
  };
}

export interface DataLayer {
  id: string;
  name: string;
  type: string;
  category: OperationMode;
  isActive: boolean;
  opacity: number;
  dataSource: string;
  lastUpdated: Date;
  metadata: Record<string, unknown>;
}

export interface LayoutState {
  megaCategoryPanel: 'expanded' | 'collapsed';
  intelHub: 'expanded' | 'collapsed';
  timelinePanel: 'expanded' | 'collapsed' | 'compact';
  floatingPanels: FloatingPanel[];
  miniViews: MiniView[];
}

export interface FloatingPanel {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  isDocked: boolean;
  zIndex: number;
}

export interface MiniView {
  id: string;
  type: 'metrics' | 'alerts' | 'timeline' | 'chat';
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'bottomCenter';
  isVisible: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface Operation {
  id: string;
  name: string;
  type: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: PriorityLevel;
  startTime: Date;
  estimatedDuration: number;
  progress: number;
  assignedTeam: string[];
  objectives: string[];
  resources: string[];
}

export interface MissionState {
  activeOperations: Operation[];
  priorityLevel: PriorityLevel;
  authLevel: AuthLevel;
  missionTime: Date;
  isRealTime: boolean;
  recordingEnabled: boolean;
}

// ===============================
// ENHANCED TYPES (Feature-Flagged)
// ===============================

export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  label: string;
  operationMode: OperationMode;
  displayMode: DisplayMode;
  centerState: CenterViewState;
  selection: SelectionState | null;
  activeLayers: DataLayer[];
  viewConfiguration: ViewConfiguration;
  userNotes?: string;
}

export interface CenterViewState {
  globeCamera?: {
    latitude: number;
    longitude: number;
    altitude: number;
    bearing: number;
    pitch: number;
  };
  timelinePosition?: {
    currentTime: Date;
    timeRange: { start: Date; end: Date };
    playbackSpeed: number;
    isPlaying: boolean;
  };
  nodeGraphLayout?: {
    algorithm: 'force' | 'hierarchical' | 'circular' | 'grid';
    nodePositions: Map<string, { x: number; y: number }>;
    zoomLevel: number;
    centerPoint: { x: number; y: number };
  };
}

export interface SelectionState {
  type: 'location' | 'event' | 'node' | 'edge' | 'region' | 'timeRange';
  id: string;
  data: Record<string, unknown>;
  coordinates?: [number, number];
  timestamp?: Date;
  relatedItems?: string[];
}

export interface ViewConfiguration {
  splitScreenMode: 'single' | 'horizontal' | 'vertical' | 'quad';
  activeViews: ViewInstance[];
  syncedProperties: string[];
}

export interface ViewInstance {
  id: string;
  contextId: string;
  position: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  size: { width: number; height: number };
  isVisible: boolean;
}

// Import enhanced types conditionally
export type { AIState, ThreatIndicator, AIInsight } from '../types';
export type { CollaborationState, CollaborationSession } from '../types';
export type { OperatorProfile, InterfaceComplexity } from '../types';

// ===============================
// UNIFIED STATE INTERFACE
// ===============================

export interface CoreGlobalCommandState {
  // Base state (always available)
  operationMode: OperationMode;
  displayMode: DisplayMode;
  activeLayers: DataLayer[];
  layoutState: LayoutState;
  missionState: MissionState;
  isInitialized: boolean;
}

export interface UnifiedGlobalCommandState extends CoreGlobalCommandState {
  // Enhanced features (feature-flagged)
  enhanced?: {
    activeContexts: Map<string, ContextSnapshot>;
    primaryContextId: string;
    contextHistory: ContextSnapshot[];
    maxContextHistory: number;
    performanceMetrics: {
      lastContextSwitch: Date;
      averageResponseTime: number;
      errorCount: number;
    };
  };
  
  // AI features (feature-flagged)
  ai?: {
    state: Record<string, unknown>;
    threatIndicators: Record<string, unknown>[];
    recentInsights: Record<string, unknown>[];
  };
  
  // Collaboration features (feature-flagged)
  collaboration?: {
    state: Record<string, unknown>;
    currentSession: Record<string, unknown> | null;
  };
  
  // Security features (feature-flagged)
  security?: {
    context: Record<string, unknown>;
    alerts: Record<string, unknown>[];
  };
  
  // Adaptive features (feature-flagged)
  adaptive?: {
    operatorProfile: Record<string, unknown>;
    currentComplexity: string;
    customizations: Record<string, unknown>[];
  };
}

// ===============================
// ACTIONS
// ===============================

export type UnifiedGlobalCommandAction = 
  // Core actions (always available)
  | { type: 'INITIALIZE'; payload: Partial<UnifiedGlobalCommandState> }
  | { type: 'SET_OPERATION_MODE'; payload: OperationMode }
  | { type: 'SET_DISPLAY_MODE'; payload: DisplayMode }
  | { type: 'ADD_DATA_LAYER'; payload: DataLayer }
  | { type: 'REMOVE_DATA_LAYER'; payload: string }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; payload: string }
  | { type: 'UPDATE_DATA_LAYER'; payload: { id: string; updates: Partial<DataLayer> } }
  | { type: 'UPDATE_LAYOUT_STATE'; payload: Partial<LayoutState> }
  | { type: 'START_OPERATION'; payload: Operation }
  | { type: 'UPDATE_OPERATION'; payload: { id: string; updates: Partial<Operation> } }
  | { type: 'END_OPERATION'; payload: string }
  | { type: 'SET_PRIORITY_LEVEL'; payload: PriorityLevel }
  | { type: 'SET_MISSION_TIME'; payload: Date }
  | { type: 'TOGGLE_REAL_TIME'; payload: boolean }
  
  // Enhanced actions (feature-flagged)
  | { type: 'CREATE_CONTEXT_SNAPSHOT'; payload: { label: string; userNotes?: string } }
  | { type: 'SWITCH_PRIMARY_CONTEXT'; payload: string }
  | { type: 'DELETE_CONTEXT'; payload: string }
  | { type: 'UPDATE_CONTEXT_SNAPSHOT'; payload: { id: string; updates: Partial<ContextSnapshot> } }
  | { type: 'UPDATE_SELECTION'; payload: SelectionState | null }
  | { type: 'UPDATE_CENTER_VIEW_STATE'; payload: { contextId: string; state: Partial<CenterViewState> } }
  
  // AI actions (feature-flagged)
  | { type: 'ADD_THREAT_INDICATOR'; payload: Record<string, unknown> }
  | { type: 'REMOVE_THREAT_INDICATOR'; payload: string }
  | { type: 'ADD_AI_INSIGHT'; payload: Record<string, unknown> }
  
  // Collaboration actions (feature-flagged)
  | { type: 'JOIN_COLLABORATION_SESSION'; payload: Record<string, unknown> }
  | { type: 'LEAVE_COLLABORATION_SESSION' }
  
  // Security actions (feature-flagged)
  | { type: 'ADD_SECURITY_ALERT'; payload: Record<string, unknown> }
  | { type: 'RESOLVE_SECURITY_ALERT'; payload: string }
  
  // Adaptive actions (feature-flagged)
  | { type: 'UPDATE_OPERATOR_PROFILE'; payload: Record<string, unknown> }
  | { type: 'SET_INTERFACE_COMPLEXITY'; payload: string };

// ===============================
// CONTEXT INTERFACE
// ===============================

export interface UnifiedGlobalCommandContextType {
  state: UnifiedGlobalCommandState;
  dispatch: React.Dispatch<UnifiedGlobalCommandAction>;
  
  // Feature flags
  features: {
    enhanced: boolean;
    ai: boolean;
    collaboration: boolean;
    security: boolean;
    adaptive: boolean;
  };
  
  // Core methods (always available)
  setOperationMode: (mode: OperationMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  addDataLayer: (layer: DataLayer) => void;
  removeDataLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  updateLayoutState: (updates: Partial<LayoutState>) => void;
  startOperation: (operation: Operation) => void;
  endOperation: (operationId: string) => void;
  setPriorityLevel: (level: PriorityLevel) => void;
  
  // Enhanced methods (always available, but conditionally functional)
  createContextSnapshot: (label: string, userNotes?: string) => string;
  switchPrimaryContext: (contextId: string) => void;
  deleteContext: (contextId: string) => void;
  updateSelection: (selection: SelectionState | null) => void;
  
  // AI methods (always available, but conditionally functional)
  addThreatIndicator: (threat: Record<string, unknown>) => void;
  removeThreatIndicator: (threatId: string) => void;
  addAIInsight: (insight: Record<string, unknown>) => void;
  
  // Collaboration methods (always available, but conditionally functional)
  joinCollaborationSession: (session: Record<string, unknown>) => void;
  leaveCollaborationSession: () => void;
  
  // Security methods (always available, but conditionally functional)
  addSecurityAlert: (alert: Record<string, unknown>) => void;
  resolveSecurityAlert: (alertId: string) => void;
  
  // Adaptive methods (always available, but conditionally functional)
  updateOperatorProfile: (profile: Record<string, unknown>) => void;
  setInterfaceComplexity: (complexity: string) => void;
  
  // Query methods
  getActiveLayersByCategory: (category: OperationMode) => DataLayer[];
  getLayersByType: (type: string) => DataLayer[];
  getActiveOperations: () => Operation[];
  getCriticalOperations: () => Operation[];
}

// ===============================
// DEFAULT STATES
// ===============================

const DEFAULT_LAYOUT_STATE: LayoutState = {
  megaCategoryPanel: 'collapsed',
  intelHub: 'collapsed',
  timelinePanel: 'compact',
  floatingPanels: [],
  miniViews: [
    { id: 'metrics', type: 'metrics', position: 'bottomRight', isVisible: true, size: 'small' },
    { id: 'alerts', type: 'alerts', position: 'bottomCenter', isVisible: true, size: 'small' }
  ]
};

const DEFAULT_MISSION_STATE: MissionState = {
  activeOperations: [],
  priorityLevel: 'MEDIUM',
  authLevel: 'BASIC',
  missionTime: new Date(),
  isRealTime: true,
  recordingEnabled: false
};

const DEFAULT_CORE_STATE: CoreGlobalCommandState = {
  operationMode: 'CYBER',
  displayMode: '3D_GLOBE',
  activeLayers: [],
  layoutState: DEFAULT_LAYOUT_STATE,
  missionState: DEFAULT_MISSION_STATE,
  isInitialized: false
};

// ===============================
// REDUCER
// ===============================

function unifiedGlobalCommandReducer(
  state: UnifiedGlobalCommandState, 
  action: UnifiedGlobalCommandAction
): UnifiedGlobalCommandState {
  switch (action.type) {
    case 'INITIALIZE': {
      // Handle enhanced state reconstruction if present
      const loadedState = { ...action.payload };
      
      // Reconstruct Map from stored object if enhanced state exists
      if (loadedState.enhanced?.activeContexts && typeof loadedState.enhanced.activeContexts === 'object') {
        loadedState.enhanced = {
          ...loadedState.enhanced,
          activeContexts: new Map(Object.entries(loadedState.enhanced.activeContexts) as [string, ContextSnapshot][])
        };
      }
      
      return { ...state, ...loadedState, isInitialized: true };
    }
    
    case 'SET_OPERATION_MODE':
      return { ...state, operationMode: action.payload };
    
    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.payload };
    
    case 'ADD_DATA_LAYER':
      return {
        ...state,
        activeLayers: [...state.activeLayers, action.payload]
      };
    
    case 'REMOVE_DATA_LAYER':
      return {
        ...state,
        activeLayers: state.activeLayers.filter(layer => layer.id !== action.payload)
      };
    
    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        activeLayers: state.activeLayers.map(layer =>
          layer.id === action.payload
            ? { ...layer, isActive: !layer.isActive }
            : layer
        )
      };
    
    case 'UPDATE_LAYOUT_STATE':
      return {
        ...state,
        layoutState: { ...state.layoutState, ...action.payload }
      };
    
    case 'START_OPERATION':
      return {
        ...state,
        missionState: {
          ...state.missionState,
          activeOperations: [...state.missionState.activeOperations, action.payload]
        }
      };
    
    case 'END_OPERATION':
      return {
        ...state,
        missionState: {
          ...state.missionState,
          activeOperations: state.missionState.activeOperations.filter(op => op.id !== action.payload)
        }
      };
    
    case 'SET_PRIORITY_LEVEL':
      return {
        ...state,
        missionState: { ...state.missionState, priorityLevel: action.payload }
      };
    
    // Enhanced actions (only processed when enhanced features enabled)
    case 'CREATE_CONTEXT_SNAPSHOT': {
      if (!state.enhanced) return state;
      const newSnapshot: ContextSnapshot = {
        id: `context-${Date.now()}`,
        timestamp: new Date(),
        label: action.payload.label,
        operationMode: state.operationMode,
        displayMode: state.displayMode,
        centerState: {},
        selection: null,
        activeLayers: state.activeLayers,
        viewConfiguration: {
          splitScreenMode: 'single',
          activeViews: [],
          syncedProperties: []
        },
        userNotes: action.payload.userNotes
      };
      
      const newContextMap = new Map(
        state.enhanced.activeContexts instanceof Map 
          ? state.enhanced.activeContexts 
          : Object.entries(state.enhanced.activeContexts || {}) as [string, ContextSnapshot][]
      );
      newContextMap.set(newSnapshot.id, newSnapshot);
      
      return {
        ...state,
        enhanced: {
          ...state.enhanced,
          activeContexts: newContextMap,
          primaryContextId: newSnapshot.id,
          contextHistory: [newSnapshot, ...state.enhanced.contextHistory].slice(0, state.enhanced.maxContextHistory)
        }
      };
    }
    
    // AI, Collaboration, Security, and Adaptive actions would be handled similarly
    // with feature flag checks
    
    default:
      return state;
  }
}

// ===============================
// CONTEXT CREATION
// ===============================

const UnifiedGlobalCommandContext = createContext<UnifiedGlobalCommandContextType | undefined>(undefined);

// ===============================
// PROVIDER COMPONENT
// ===============================

interface UnifiedGlobalCommandProviderProps {
  children: React.ReactNode;
}

export const UnifiedGlobalCommandProvider: React.FC<UnifiedGlobalCommandProviderProps> = ({ children }) => {
  // Feature flag checks
  const enhancedEnabled = useFeatureFlag('enhancedContextEnabled');
  const aiEnabled = useFeatureFlag('aiSuggestionsEnabled');
  const collaborationEnabled = useFeatureFlag('collaborationEnabled');
  const securityEnabled = useFeatureFlag('securityHardeningEnabled');
  const adaptiveEnabled = useFeatureFlag('adaptiveInterfaceEnabled');
  
  // Initialize state with feature-flagged sections
  const initialState: UnifiedGlobalCommandState = useMemo(() => ({
    ...DEFAULT_CORE_STATE,
    enhanced: enhancedEnabled ? {
      activeContexts: new Map(),
      primaryContextId: '',
      contextHistory: [],
      maxContextHistory: 10,
      performanceMetrics: {
        lastContextSwitch: new Date(),
        averageResponseTime: 0,
        errorCount: 0
      }
    } : undefined,
    ai: aiEnabled ? {
      state: {},
      threatIndicators: [],
      recentInsights: []
    } : undefined,
    collaboration: collaborationEnabled ? {
      state: {},
      currentSession: null
    } : undefined,
    security: securityEnabled ? {
      context: {},
      alerts: []
    } : undefined,
    adaptive: adaptiveEnabled ? {
      operatorProfile: {},
      currentComplexity: 'standard',
      customizations: []
    } : undefined
  }), [enhancedEnabled, aiEnabled, collaborationEnabled, securityEnabled, adaptiveEnabled]);
  
  const [state, dispatch] = useReducer(unifiedGlobalCommandReducer, initialState);
  
  // Load persisted state on initialization
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const savedState = settingsStorage.loadSettings('unified-global-command-state', {});
        if (Object.keys(savedState).length > 0) {
          dispatch({ type: 'INITIALIZE', payload: savedState });
        } else {
          dispatch({ type: 'INITIALIZE', payload: {} });
        }
      } catch (error) {
        console.warn('Failed to load persisted unified state:', error);
        dispatch({ type: 'INITIALIZE', payload: {} });
      }
    };

    loadPersistedState();
  }, []);
  
  // Persist state changes
  useEffect(() => {
    if (!state.isInitialized) return;

    const persistState = () => {
      try {
        const stateToPersist = {
          operationMode: state.operationMode,
          displayMode: state.displayMode,
          layoutState: state.layoutState,
          missionState: {
            ...state.missionState,
            activeOperations: state.missionState.activeOperations.filter(op => op.status === 'active')
          },
          // Only persist enhanced state if enabled
          ...(enhancedEnabled && state.enhanced ? {
            enhanced: {
              primaryContextId: state.enhanced.primaryContextId || '',
              contextHistory: state.enhanced.contextHistory || [],
              // Convert Map to object for storage - with safe fallback
              activeContexts: state.enhanced.activeContexts instanceof Map 
                ? Object.fromEntries(state.enhanced.activeContexts)
                : {}
            }
          } : {})
        };
        settingsStorage.saveSettings('unified-global-command-state', stateToPersist);
      } catch (error) {
        console.warn('Failed to persist unified state:', error);
      }
    };

    const timeoutId = setTimeout(persistState, 1000);
    return () => clearTimeout(timeoutId);
  }, [state, enhancedEnabled]);
  
  // Core methods (always available)
  const setOperationMode = useCallback((mode: OperationMode) => {
    dispatch({ type: 'SET_OPERATION_MODE', payload: mode });
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    dispatch({ type: 'SET_DISPLAY_MODE', payload: mode });
  }, []);

  const addDataLayer = useCallback((layer: DataLayer) => {
    dispatch({ type: 'ADD_DATA_LAYER', payload: layer });
  }, []);

  const removeDataLayer = useCallback((layerId: string) => {
    dispatch({ type: 'REMOVE_DATA_LAYER', payload: layerId });
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: layerId });
  }, []);

  const updateLayoutState = useCallback((updates: Partial<LayoutState>) => {
    dispatch({ type: 'UPDATE_LAYOUT_STATE', payload: updates });
  }, []);

  const startOperation = useCallback((operation: Operation) => {
    dispatch({ type: 'START_OPERATION', payload: operation });
  }, []);

  const endOperation = useCallback((operationId: string) => {
    dispatch({ type: 'END_OPERATION', payload: operationId });
  }, []);

  const setPriorityLevel = useCallback((level: PriorityLevel) => {
    dispatch({ type: 'SET_PRIORITY_LEVEL', payload: level });
  }, []);
  
  // Enhanced methods (always defined, but conditionally functional)
  const createContextSnapshot = useCallback((label: string, userNotes?: string) => {
    if (!enhancedEnabled) return '';
    const contextId = `context-${Date.now()}`;
    dispatch({ type: 'CREATE_CONTEXT_SNAPSHOT', payload: { label, userNotes } });
    return contextId;
  }, [enhancedEnabled]);

  const switchPrimaryContext = useCallback((contextId: string) => {
    if (!enhancedEnabled) return;
    dispatch({ type: 'SWITCH_PRIMARY_CONTEXT', payload: contextId });
  }, [enhancedEnabled]);

  const deleteContext = useCallback((contextId: string) => {
    if (!enhancedEnabled) return;
    dispatch({ type: 'DELETE_CONTEXT', payload: contextId });
  }, [enhancedEnabled]);

  const updateSelection = useCallback((selection: SelectionState | null) => {
    if (!enhancedEnabled) return;
    dispatch({ type: 'UPDATE_SELECTION', payload: selection });
  }, [enhancedEnabled]);
  
  // AI methods (always defined, but conditionally functional)
  const addThreatIndicator = useCallback((threat: Record<string, unknown>) => {
    if (!aiEnabled) return;
    dispatch({ type: 'ADD_THREAT_INDICATOR', payload: threat });
  }, [aiEnabled]);

  const removeThreatIndicator = useCallback((threatId: string) => {
    if (!aiEnabled) return;
    dispatch({ type: 'REMOVE_THREAT_INDICATOR', payload: threatId });
  }, [aiEnabled]);

  const addAIInsight = useCallback((insight: Record<string, unknown>) => {
    if (!aiEnabled) return;
    dispatch({ type: 'ADD_AI_INSIGHT', payload: insight });
  }, [aiEnabled]);
  
  // Collaboration methods (always defined, but conditionally functional)
  const joinCollaborationSession = useCallback((session: Record<string, unknown>) => {
    if (!collaborationEnabled) return;
    dispatch({ type: 'JOIN_COLLABORATION_SESSION', payload: session });
  }, [collaborationEnabled]);

  const leaveCollaborationSession = useCallback(() => {
    if (!collaborationEnabled) return;
    dispatch({ type: 'LEAVE_COLLABORATION_SESSION' });
  }, [collaborationEnabled]);
  
  // Security methods (always defined, but conditionally functional)
  const addSecurityAlert = useCallback((alert: Record<string, unknown>) => {
    if (!securityEnabled) return;
    dispatch({ type: 'ADD_SECURITY_ALERT', payload: alert });
  }, [securityEnabled]);

  const resolveSecurityAlert = useCallback((alertId: string) => {
    if (!securityEnabled) return;
    dispatch({ type: 'RESOLVE_SECURITY_ALERT', payload: alertId });
  }, [securityEnabled]);
  
  // Adaptive methods (always defined, but conditionally functional)
  const updateOperatorProfile = useCallback((profile: Record<string, unknown>) => {
    if (!adaptiveEnabled) return;
    dispatch({ type: 'UPDATE_OPERATOR_PROFILE', payload: profile });
  }, [adaptiveEnabled]);

  const setInterfaceComplexity = useCallback((complexity: string) => {
    if (!adaptiveEnabled) return;
    dispatch({ type: 'SET_INTERFACE_COMPLEXITY', payload: complexity });
  }, [adaptiveEnabled]);
  
  // Query methods
  const getActiveLayersByCategory = useCallback((category: OperationMode) => {
    return state.activeLayers.filter(layer => layer.category === category && layer.isActive);
  }, [state.activeLayers]);

  const getLayersByType = useCallback((type: string) => {
    return state.activeLayers.filter(layer => layer.type === type);
  }, [state.activeLayers]);

  const getActiveOperations = useCallback(() => {
    return state.missionState.activeOperations.filter(op => op.status === 'active');
  }, [state.missionState.activeOperations]);

  const getCriticalOperations = useCallback(() => {
    return state.missionState.activeOperations.filter(op => 
      op.priority === 'CRITICAL' && op.status === 'active'
    );
  }, [state.missionState.activeOperations]);

  const contextValue: UnifiedGlobalCommandContextType = {
    state,
    dispatch,
    features: {
      enhanced: enhancedEnabled,
      ai: aiEnabled,
      collaboration: collaborationEnabled,
      security: securityEnabled,
      adaptive: adaptiveEnabled
    },
    setOperationMode,
    setDisplayMode,
    addDataLayer,
    removeDataLayer,
    toggleLayerVisibility,
    updateLayoutState,
    startOperation,
    endOperation,
    setPriorityLevel,
    createContextSnapshot,
    switchPrimaryContext,
    deleteContext,
    updateSelection,
    addThreatIndicator,
    removeThreatIndicator,
    addAIInsight,
    joinCollaborationSession,
    leaveCollaborationSession,
    addSecurityAlert,
    resolveSecurityAlert,
    updateOperatorProfile,
    setInterfaceComplexity,
    getActiveLayersByCategory,
    getLayersByType,
    getActiveOperations,
    getCriticalOperations
  };

  return (
    <UnifiedGlobalCommandContext.Provider value={contextValue}>
      {children}
    </UnifiedGlobalCommandContext.Provider>
  );
};

// ===============================
// NOTE: Main hook moved to hooks/useUnifiedGlobalCommand.ts for Fast Refresh compatibility
// ===============================

// ===============================
// EXPORTS
// ===============================

export default UnifiedGlobalCommandContext;
export type { 
  UnifiedGlobalCommandState as GlobalCommandState,
  UnifiedGlobalCommandAction as GlobalCommandAction,
  UnifiedGlobalCommandContextType as GlobalCommandContextType
};
