// Electric Field Data Interfaces for NOAA Space Weather API Integration
// AI-NOTE: Based on analysis of NOAA SWPC electric field datasets

// TODO: Implement type-safe state management with strong typing guarantees - PRIORITY: MEDIUM
// TODO: Add support for type-safe database queries and ORM integration - PRIORITY: MEDIUM
export interface NOAAElectricFieldData {
  time_tag: string;          // ISO date string "2025-02-23"
  cadence: number;           // Update interval in seconds (typically 60)
  product_version: "InterMagEarthScope" | "US-Canada-1D" | string;
  type: "FeatureCollection";
  features: ElectricFieldFeature[];
}

export interface ElectricFieldFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [longitude: number, latitude: number]; // [lon, lat] format
  };
  properties: ElectricFieldProperties;
}

export interface ElectricFieldProperties {
  Ex: number;                        // East-west electric field strength (V/m)
  Ey: number;                        // North-south electric field strength (V/m) 
  quality_flag: number;              // Data reliability indicator (1-5, 5=best)
  distance_nearest_station: number;  // Distance from monitoring station (km)
}

export interface ElectricFieldVector {
  longitude: number;
  latitude: number;
  ex: number;              // East-west component
  ey: number;              // North-south component
  magnitude: number;       // Calculated field strength
  direction: number;       // Angle in degrees (0=North, 90=East)
  quality: number;         // Quality flag
  stationDistance: number; // Distance to nearest station
  unit?: 'mV/km';          // Canonical electric field unit (Phase 0)
  ex_mVkm?: number;        // Converted components (future-proofing)
  ey_mVkm?: number;
  magnitude_mVkm?: number; // Canonical magnitude
}

export interface SpaceWeatherAlert {
  id: string;
  timestamp: string;
  alertType: "geomagnetic_storm" | "electric_field_anomaly" | "infrastructure_risk";
  severity: "low" | "moderate" | "high" | "extreme";
  regions: string[];       // Affected geographic regions
  message: string;
  electricFieldData?: ElectricFieldVector[];
}

export interface NOAAEndpointConfig {
  baseUrl: string;
  endpoints: {
    electricFieldInterMag: string;
    electricFieldUSCanada: string;
  };
  retryConfig: {
    maxRetries: number;
    backoffFactor: number;
    statusCodes: number[];
  };
}

// Utility type for processing raw NOAA data into visualization format
export interface ProcessedElectricFieldData {
  timestamp: string;
  source: "InterMagEarthScope" | "US-Canada-1D";
  vectors: ElectricFieldVector[];
  unit?: 'mV/km'; // Canonical display / processing unit
  coverage: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  statistics: {
    totalPoints: number;
    highQualityPoints: number;
    maxFieldStrength: number;
    avgFieldStrength: number;
  };
}

// Use the shared type for all NOAA electric field data
export type NOAAElectricFieldResponse = NOAAElectricFieldData;
