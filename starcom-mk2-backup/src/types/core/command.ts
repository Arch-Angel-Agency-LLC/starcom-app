/**
 * Core Command & Control Types
 * Unified type definitions for the Global Command Interface
 */

// ===============================
// OPERATION & DISPLAY MODES
// ===============================

export type OperationMode = 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';
export type DisplayMode = '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuthLevel = 'BASIC' | 'SECURE' | 'TOP_SECRET';

// ===============================
// DATA LAYER SYSTEM
// ===============================

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

// ===============================
// LAYOUT & UI SYSTEM
// ===============================

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

// ===============================
// OPERATIONS & MISSIONS
// ===============================

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
// CONTEXT & SELECTION SYSTEM
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

// ===============================
// CORE STATE INTERFACE
// ===============================

export interface CoreGlobalCommandState {
  operationMode: OperationMode;
  displayMode: DisplayMode;
  activeLayers: DataLayer[];
  layoutState: LayoutState;
  missionState: MissionState;
  isInitialized: boolean;
}

// ===============================
// ACTION TYPES
// ===============================

export type CoreCommandAction = 
  | { type: 'SET_OPERATION_MODE'; payload: OperationMode }
  | { type: 'SET_DISPLAY_MODE'; payload: DisplayMode }
  | { type: 'TOGGLE_LAYER'; payload: string }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<LayoutState> }
  | { type: 'SET_MISSION_STATE'; payload: Partial<MissionState> }
  | { type: 'ADD_FLOATING_PANEL'; payload: FloatingPanel }
  | { type: 'REMOVE_FLOATING_PANEL'; payload: string }
  | { type: 'UPDATE_MINI_VIEW'; payload: { id: string; updates: Partial<MiniView> } }
  | { type: 'SAVE_CONTEXT_SNAPSHOT'; payload: ContextSnapshot }
  | { type: 'RESTORE_CONTEXT_SNAPSHOT'; payload: string }
  | { type: 'UPDATE_SELECTION'; payload: SelectionState | null }
  | { type: 'INITIALIZE_SYSTEM'; payload?: undefined };
