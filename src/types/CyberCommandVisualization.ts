/**
 * Common type definitions for all CyberCommand visualizations
 * Created as part of Phase 1: Foundation & Architecture
 * 
 * This file establishes the unified type system for all 5 visualization modes
 */

// =============================================================================
// CORE VISUALIZATION TYPES
// =============================================================================

export type VisualizationType = 
  | 'IntelReports'
  | 'NetworkInfrastructure' 
  | 'CyberThreats'
  | 'CommHubs'
  | 'CyberAttacks';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface VisualizationData {
  id: string;
  type: VisualizationType;
  location: GeoCoordinate;
  timestamp: Date;
  metadata: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'pending' | 'resolved';
}

// =============================================================================
// PERFORMANCE & HEALTH MONITORING
// =============================================================================

export interface PerformanceMetrics {
  renderTime: number;
  objectCount: number;
  memoryUsage: number;
  frameRate: number;
  dataLoadTime: number;
}

export interface ServiceHealthStatus {
  isOnline: boolean;
  latency: number;
  errorRate: number;
  lastUpdate: Date;
  dataQuality: 'good' | 'degraded' | 'poor';
}

// =============================================================================
// VISUALIZATION COMPONENT INTERFACE
// =============================================================================

export interface VisualizationComponent {
  // Data management
  data: VisualizationData[];
  loading: boolean;
  error: Error | null;
  
  // Settings
  settings: VisualizationSettings;
  onSettingsChange: (settings: VisualizationSettings) => void;
  
  // Globe integration
  globeRef: React.RefObject<unknown>;
  onDataClick: (data: VisualizationData) => void;
  onDataHover?: (data: VisualizationData | null) => void;
  
  // Performance
  visible: boolean;
  detailLevel: 'low' | 'medium' | 'high';
  performanceMetrics?: PerformanceMetrics;
}

export interface VisualizationSettings {
  type: VisualizationType;
  enabled: boolean;
  opacity: number; // 0-100
  refreshInterval: number; // milliseconds
  maxDataPoints: number;
  showLabels: boolean;
  showTimestamps: boolean;
  animationSpeed: number; // 0.1-2.0
  detailLevel: 'low' | 'medium' | 'high';
  customFilters: Record<string, unknown>;
}

// =============================================================================
// DATA SERVICE INTERFACES
// =============================================================================

export interface VisualizationDataService {
  readonly type: VisualizationType;
  
  // Core data operations
  getData(options?: DataQueryOptions): Promise<VisualizationData[]>;
  getHealthStatus(): ServiceHealthStatus;
  
  // Real-time operations
  startRealTimeUpdates?(callback: (data: VisualizationData[]) => void): void;
  stopRealTimeUpdates?(): void;
  
  // Fallback and caching
  enableFallbackMode(): void;
  getCachedData(): VisualizationData[] | null;
  clearCache(): void;
}

export interface DataQueryOptions {
  timeRange?: {
    start: Date;
    end: Date;
  };
  geoFilter?: {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  priorityFilter?: Array<'low' | 'medium' | 'high' | 'critical'>;
  limit?: number;
  offset?: number;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class VisualizationError extends Error {
  constructor(
    message: string,
    public readonly type: VisualizationType,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'VisualizationError';
  }
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  lastFailedType?: VisualizationType;
}

// =============================================================================
// ANIMATION & INTERACTION
// =============================================================================

export interface AnimationConfig {
  enabled: boolean;
  type: 'fade' | 'scale' | 'pulse' | 'trajectory' | 'none';
  duration: number; // milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop: boolean;
  delay?: number;
}

export interface InteractionConfig {
  clickEnabled: boolean;
  hoverEnabled: boolean;
  dragEnabled: boolean;
  selectionEnabled: boolean;
  multiSelectEnabled: boolean;
}

// =============================================================================
// PERFORMANCE CONSTANTS
// =============================================================================

export const PERFORMANCE_LIMITS = {
  maxObjectsPerScene: 1000,
  maxRefreshRate: 5000, // milliseconds
  memoryThreshold: 512 * 1024 * 1024, // 512MB
  minFrameRate: 30,
  maxDataPointsPerVisualization: 500,
  maxConcurrentRequests: 5
} as const;

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const DEFAULT_VISUALIZATION_SETTINGS: Record<VisualizationType, VisualizationSettings> = {
  IntelReports: {
    type: 'IntelReports',
    enabled: true,
    opacity: 80,
    refreshInterval: 30000,
    maxDataPoints: 50,
    showLabels: true,
    showTimestamps: true,
    animationSpeed: 1.0,
    detailLevel: 'medium',
    customFilters: {
      showCritical: true,
      showHigh: true,
      showMedium: true,
      showLow: false
    }
  },
  CyberAttacks: {
    type: 'CyberAttacks',
    enabled: true,
    opacity: 90,
    refreshInterval: 5000, // More frequent for real-time attacks
    maxDataPoints: 100,
    showLabels: true,
    showTimestamps: true,
    animationSpeed: 1.5,
    detailLevel: 'high',
    customFilters: {
      showDDoS: true,
      showMalware: true,
      showBreaches: true,
      showPhishing: true
    }
  },
  CyberThreats: {
    type: 'CyberThreats',
    enabled: true,
    opacity: 75,
    refreshInterval: 60000,
    maxDataPoints: 200,
    showLabels: true,
    showTimestamps: false,
    animationSpeed: 0.8,
    detailLevel: 'medium',
    customFilters: {
      showC2Servers: true,
      showBotnets: true,
      showMalwareFamilies: true,
      showThreatActors: true
    }
  },
  NetworkInfrastructure: {
    type: 'NetworkInfrastructure',
    enabled: true,
    opacity: 60,
    refreshInterval: 300000, // Less frequent - infrastructure changes slowly
    maxDataPoints: 300,
    showLabels: false,
    showTimestamps: false,
    animationSpeed: 0.5,
    detailLevel: 'low',
    customFilters: {
      showDataCenters: true,
      showCables: true,
      showIXPs: true,
      showCDNs: false
    }
  },
  CommHubs: {
    type: 'CommHubs',
    enabled: true,
    opacity: 70,
    refreshInterval: 120000,
    maxDataPoints: 150,
    showLabels: true,
    showTimestamps: false,
    animationSpeed: 0.7,
    detailLevel: 'medium',
    customFilters: {
      showSatellites: true,
      showGroundStations: true,
      showSIGINT: true,
      showCellTowers: false
    }
  }
} as const;

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

export function isValidVisualizationType(type: string): type is VisualizationType {
  return ['IntelReports', 'NetworkInfrastructure', 'CyberThreats', 'CommHubs', 'CyberAttacks'].includes(type);
}

export function isValidPriority(priority: string): priority is 'low' | 'medium' | 'high' | 'critical' {
  return ['low', 'medium', 'high', 'critical'].includes(priority);
}

export function validateGeoCoordinate(coord: unknown): coord is GeoCoordinate {
  return (
    typeof coord === 'object' &&
    coord !== null &&
    typeof (coord as GeoCoordinate).latitude === 'number' &&
    typeof (coord as GeoCoordinate).longitude === 'number' &&
    (coord as GeoCoordinate).latitude >= -90 && (coord as GeoCoordinate).latitude <= 90 &&
    (coord as GeoCoordinate).longitude >= -180 && (coord as GeoCoordinate).longitude <= 180
  );
}

export function sanitizeVisualizationData(data: unknown): VisualizationData | null {
  try {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    if (!obj.id || typeof obj.id !== 'string') return null;
    if (!isValidVisualizationType(obj.type as string)) return null;
    if (!validateGeoCoordinate(obj.location)) return null;
    if (!obj.timestamp || !(obj.timestamp instanceof Date)) return null;
    
    return {
      id: obj.id,
      type: obj.type as VisualizationType,
      location: obj.location as GeoCoordinate,
      timestamp: obj.timestamp,
      metadata: (obj.metadata as Record<string, unknown>) || {},
      priority: isValidPriority(obj.priority as string) ? (obj.priority as 'low' | 'medium' | 'high' | 'critical') : 'medium',
      status: (['active', 'inactive', 'pending', 'resolved'].includes(obj.status as string)) ? (obj.status as 'active' | 'inactive' | 'pending' | 'resolved') : 'active'
    };
  } catch (error) {
    console.error('Data sanitization failed:', error);
    return null;
  }
}
