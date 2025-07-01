/**
 * Core Command & Control Types
 * Unified type definitions for the Global Command Interface
 */

// ===============================
// ADVANCED TYPESCRIPT UTILITIES
// ===============================

// TODO: Implement comprehensive type validation at runtime for enhanced safety - PRIORITY: MEDIUM
// ✅ PARTIALLY COMPLETED: Basic runtime validation utilities implemented below
// ✅ IMPLEMENTED: Advanced TypeScript features (conditional types, mapped types)
// Utility types for enhanced type safety and developer experience
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type NonEmptyArray<T> = [T, ...T[]];
export type ValueOf<T> = T[keyof T];

// Conditional types for runtime validation
export type Validator<T> = (value: unknown) => value is T;
export type ValidationResult<T> = { success: true; data: T } | { success: false; error: string };

// Mapped types for configuration management
export type ConfigurationSchema<T> = {
  [K in keyof T]: {
    value: T[K];
    required: boolean;
    validator?: Validator<T[K]>;
    description?: string;
  };
};

// ===============================
// RUNTIME TYPE VALIDATION UTILITIES
// ===============================

/**
 * Runtime type validation utilities for enhanced safety
 */
export class TypeValidator {
  /**
   * Validates if a value is a string
   */
  static isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  /**
   * Validates if a value is a number
   */
  static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * Validates if a value is a boolean
   */
  static isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Validates if a value is an array
   */
  static isArray<T>(value: unknown, itemValidator?: Validator<T>): value is T[] {
    if (!Array.isArray(value)) return false;
    if (itemValidator) {
      return value.every(item => itemValidator(item));
    }
    return true;
  }

  /**
   * Validates if a value is an object (and not null or array)
   */
  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Validates if a value matches one of the allowed enum values
   */
  static isEnumValue<T extends string>(value: unknown, enumValues: readonly T[]): value is T {
    return TypeValidator.isString(value) && enumValues.includes(value as T);
  }

  /**
   * Creates a validator for a specific object schema
   */
  static createObjectValidator<T extends Record<string, unknown>>(schema: {
    [K in keyof T]: Validator<T[K]>;
  }): Validator<T> {
    return (value: unknown): value is T => {
      if (!TypeValidator.isObject(value)) return false;
      
      for (const [key, validatorFn] of Object.entries(schema)) {
        const typedValue = value as Record<string, unknown>;
        if (!validatorFn(typedValue[key])) return false;
      }
      return true;
    };
  }

  /**
   * Safe validation with detailed error reporting
   */
  static validate<T>(value: unknown, validator: Validator<T>, context?: string): ValidationResult<T> {
    try {
      if (validator(value)) {
        return { success: true, data: value };
      } else {
        return { 
          success: false, 
          error: `Type validation failed${context ? ` for ${context}` : ''}: expected valid type, got ${typeof value}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Validation error${context ? ` for ${context}` : ''}: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

// ===============================
// OPERATION & DISPLAY MODES
// ===============================

// TODO: Implement comprehensive type validation at runtime for enhanced safety - PRIORITY: MEDIUM
// ✅ COMPLETED: Runtime validators implemented above for these types
// TODO: Add support for advanced TypeScript features (conditional types, mapped types) - PRIORITY: LOW
// ✅ COMPLETED: Advanced TypeScript features implemented
export type OperationMode = 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';
export type DisplayMode = '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuthLevel = 'BASIC' | 'SECURE' | 'TOP_SECRET';

// Runtime validators for operation modes
export const OperationModeValidator: Validator<OperationMode> = (value): value is OperationMode =>
  TypeValidator.isEnumValue(value, ['PLANETARY', 'SPACE', 'CYBER', 'STELLAR'] as const);

export const DisplayModeValidator: Validator<DisplayMode> = (value): value is DisplayMode =>
  TypeValidator.isEnumValue(value, ['3D_GLOBE', 'TIMELINE_VIEW', 'NODE_GRAPH'] as const);

export const PriorityLevelValidator: Validator<PriorityLevel> = (value): value is PriorityLevel =>
  TypeValidator.isEnumValue(value, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const);

export const AuthLevelValidator: Validator<AuthLevel> = (value): value is AuthLevel =>
  TypeValidator.isEnumValue(value, ['BASIC', 'SECURE', 'TOP_SECRET'] as const);

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
