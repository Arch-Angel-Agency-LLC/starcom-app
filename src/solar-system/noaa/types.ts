// types.ts - Type definitions for NOAA Solar Data Service
// Phase 2 Week 4: Data Service Architecture Types

export interface NOAASolarDataServiceConfig {
  /** Update interval in milliseconds (default: 60000 = 1 minute) */
  updateInterval?: number;
  
  /** Data retention period in hours (default: 24) */
  dataRetentionHours?: number;
  
  /** Enable local caching (default: true) */
  enableCaching?: boolean;
  
  /** Use fallback data when offline (default: true) */
  fallbackMode?: boolean;
  
  /** API request timeout in milliseconds (default: 30000 = 30 seconds) */
  apiTimeout?: number;
  
  /** NOAA API endpoints (optional, uses defaults) */
  apiEndpoints?: {
    xrayFlux?: string;
    solarFlares?: string;
    solarWind?: string;
  };
}

export interface SolarXrayFlux {
  current: {
    timestamp: Date;
    fluxShort: number; // 1-8 Angstrom flux in W/m²
    fluxLong: number;  // 0.5-4 Angstrom flux in W/m²
    classification: string; // A, B, C, M, X class
    intensityLevel: 'quiet' | 'low' | 'moderate' | 'high' | 'extreme';
    color: string; // Hex color for visualization
  };
  trend: {
    direction: 'rising' | 'falling' | 'stable';
    rate: number; // Change rate per minute
    confidence: number; // 0-1 confidence in trend
  };
  quality: SolarDataQuality;
  qualityScore?: number; // 0-1 quality score
  warnings?: string[]; // Quality warnings
  history?: SolarXrayFlux['current'][];
}

export interface SolarFlareEvent {
  id: string;
  startTime: Date;
  peakTime: Date;
  endTime: Date | null; // null if ongoing
  classification: string; // A1.0, B2.5, C1.2, M5.4, X9.3, etc.
  location: string; // Solar coordinates (e.g., "N15E45")
  peakFlux: number; // Peak X-ray flux in W/m²
  isActive: boolean;
  duration: number; // Duration in seconds (0 if ongoing)
  
  // Optional detailed properties
  region?: string; // Active region number
  confidence?: number; // Detection confidence 0-1
  associatedCME?: boolean; // Whether CME was detected
}

export interface SolarDataUpdateEvent {
  type: 'xray_flux' | 'solar_flare' | 'solar_wind' | 'geomagnetic_storm';
  timestamp: Date;
  data: SolarXrayFlux | SolarFlareEvent | SpaceWeatherSummary | Record<string, unknown>;
  source: 'noaa' | 'cache' | 'fallback';
}

export type SolarDataQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'stale' | 'fallback';

export interface SolarDataCache {
  hits: number;
  misses: number;
  size: number; // Number of cached entries
  memoryUsage: number; // Bytes
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export interface SolarDataError {
  code: string;
  message: string;
  timestamp: Date;
  source?: 'network' | 'api' | 'validation' | 'cache';
  retryable?: boolean;
}

export interface PerformanceStats {
  averageResponseTime: number; // milliseconds
  successRate: number; // 0-1
  errorRate: number; // 0-1
  requestCount: number;
  lastRequestTime: Date | null;
  connectionUptime: number; // milliseconds since last connect
}

export interface SpaceWeatherSummary {
  timestamp: Date;
  solarActivity: {
    level: 'quiet' | 'low' | 'moderate' | 'high' | 'extreme';
    flareIntensity: number; // Current X-ray flux
    flareClass: string; // Current flare classification
    activeFlares: SolarFlareEvent[];
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  visualizationParams: {
    // Parameters for solar system visualization
    coronaIntensity: number; // 0-2 multiplier for corona brightness
    coronaSize: number; // 0-2 multiplier for corona size
    sunColor: string; // Hex color based on activity
    flareParticles: boolean; // Whether to show flare particle effects
    pulseRate: number; // Pulsing animation rate (0-1)
  };
  quality: SolarDataQuality;
  dataAge: number; // Seconds since last update
}

// Event handler types
export type DataUpdateHandler = (event: SolarDataUpdateEvent) => void;
export type ErrorHandler = (error: SolarDataError) => void;
export type SpaceWeatherChangeHandler = (summary: SpaceWeatherSummary) => void;

// API Response types (raw NOAA data)
export interface NOAAXrayResponse {
  data: Array<{
    timestamp: string;
    flux_short: number;
    flux_long: number;
    classification: string;
  }>;
}

export interface NOAAFlareResponse {
  events: Array<{
    id: string;
    start_time: string;
    peak_time: string;
    end_time?: string;
    classification: string;
    location: string;
    peak_flux: number;
    region?: string;
  }>;
}
