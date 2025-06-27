// Enhanced NOAA Data Types for comprehensive space weather monitoring
// Supports all priority levels: primary, secondary, and tertiary datasets

// Base interface for all NOAA data
export interface NOAABaseData {
  time_tag: string;
  source_satellite?: string;
  data_quality?: number;
  status_flag?: string;
}

// Solar Radiation Data Types
export interface NOAASolarXRayData extends NOAABaseData {
  satellite: string;
  flux: number; // W/m²
  observed_flux?: number;
  electron_correction?: number;
  electron_contamination?: boolean;
  energy: string; // "0.05-0.4nm" or "0.1-0.8nm"
  flux_class: 'A' | 'B' | 'C' | 'M' | 'X';
  flux_scale: number; // numerical scale within class
}

export interface NOAASolarFlareEvent extends NOAABaseData {
  event_id: string;
  begin_time: string;
  max_time: string;
  end_time?: string;
  class_type: string; // e.g., "M2.3", "X1.5"
  location?: string; // solar coordinates if available
  peak_flux: number;
  integrated_flux?: number;
  status: 'ongoing' | 'completed' | 'predicted';
}

export interface NOAAXRayBackground extends NOAABaseData {
  background_flux: number;
  baseline_period: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Geomagnetic Data Types
export interface NOAAGeomagneticKpData extends NOAABaseData {
  kp_index: number;
  kp_fraction: number; // more precise fractional value
  storm_level: 'quiet' | 'unsettled' | 'active' | 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
  predicted?: boolean;
  confidence?: number; // for predictions
}

export interface NOAAGeomagneticDstData extends NOAABaseData {
  dst_index: number; // nT
  storm_phase: 'main' | 'recovery' | 'quiet' | 'initial';
  predicted?: boolean;
  storm_intensity: 'weak' | 'moderate' | 'intense' | 'super';
}

// Solar Wind Data Types
export interface NOAASolarWindPlasmaData extends NOAABaseData {
  velocity: number; // km/s
  density: number; // particles/cm³
  temperature: number; // K
  dynamic_pressure?: number; // nPa
  thermal_speed?: number;
  source: 'ACE' | 'DSCOVR' | 'Wind';
}

export interface NOAASolarWindMagneticData extends NOAABaseData {
  bt: number; // total field magnitude (nT)
  bx_gsm: number; // nT in GSM coordinates
  by_gsm: number;
  bz_gsm: number;
  phi_angle: number; // degrees
  theta_angle: number; // degrees
  source: 'ACE' | 'DSCOVR' | 'Wind';
}

// Magnetosphere Data Types
export interface NOAAMagnetometerData extends NOAABaseData {
  satellite: string; // GOES-16, GOES-18, etc.
  hp: number; // parallel component (nT)
  he: number; // eastward component (nT)
  hn: number; // northward component (nT)
  total: number; // total field magnitude (nT)
  coordinate_system: 'ENP' | 'GSM' | 'GSE';
}

// Particle Radiation Data Types
export interface NOAAIntegralParticleData extends NOAABaseData {
  satellite: string;
  particle_type: 'proton' | 'electron' | 'alpha';
  energy_channel: string; // e.g., ">10 MeV", ">100 MeV"
  flux: number; // particles/(cm²·s·sr)
  flux_uncertainty?: number;
  background_subtracted?: boolean;
}

export interface NOAADifferentialParticleData extends NOAABaseData {
  satellite: string;
  particle_type: 'proton' | 'electron' | 'alpha';
  energy_channels: {
    channel_id: string;
    energy_min: number; // MeV
    energy_max: number; // MeV
    flux: number; // particles/(cm²·s·sr·MeV)
    uncertainty?: number;
  }[];
}

export interface NOAAParticleFluenceData extends NOAABaseData {
  satellite: string;
  particle_type: 'proton' | 'electron';
  energy_threshold: string;
  fluence: number; // particles/cm²
  event_start?: string;
  event_duration?: number; // hours
}

// Cosmic Ray Data Types
export interface NOAACosmicRayData extends NOAABaseData {
  instrument: 'SIS' | 'EPAM' | 'CRS';
  total_counts: number;
  count_rate: number; // counts/second
  energy_channels: {
    element: string; // H, He, CNO, etc.
    energy_range: string;
    flux: number;
    uncertainty?: number;
  }[];
  solar_energetic_particles?: boolean;
}

// Electric Field Data Types (existing, but enhanced)
export interface NOAAElectricFieldData extends NOAABaseData {
  type: 'Feature Collection';
  features: {
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
      Ex: number; // mV/km eastward component
      Ey: number; // mV/km northward component
      magnitude?: number; // calculated total magnitude
      direction?: number; // degrees from north
      quality_flag: number;
      distance_nearest_station?: number;
      measurement_method: string;
    };
  }[];
  network: 'InterMag' | 'US-Canada' | 'EarthScope';
}

// Detailed ACE EPAM Data
export interface NOAAACEEPAMData extends NOAABaseData {
  instrument: 'EPAM';
  measurement_type: 'ion' | 'electron';
  energy_channels: {
    channel_name: string;
    energy_range: string; // e.g., "47-65 keV"
    particle_flux: number;
    geometric_factor: number;
    efficiency: number;
  }[];
  sectored_data?: {
    sector: number; // 0-7
    flux_per_sector: number[];
  }[];
}

// DSCOVR High-Resolution Magnetic Data
export interface NOAADSCOVRMagData extends NOAABaseData {
  time_resolution: '1s' | '1m';
  bt: number; // total field (nT)
  bx_gse: number; // GSE coordinates
  by_gse: number;
  bz_gse: number;
  spacecraft_position?: {
    x_gse: number; // Earth radii
    y_gse: number;
    z_gse: number;
  };
  data_gap?: boolean;
}

// Comprehensive union type for all NOAA data
export type NOAADataTypes = 
  | NOAASolarXRayData
  | NOAASolarFlareEvent
  | NOAAXRayBackground
  | NOAAGeomagneticKpData
  | NOAAGeomagneticDstData
  | NOAASolarWindPlasmaData
  | NOAASolarWindMagneticData
  | NOAAMagnetometerData
  | NOAAIntegralParticleData
  | NOAADifferentialParticleData
  | NOAAParticleFluenceData
  | NOAACosmicRayData
  | NOAAElectricFieldData
  | NOAAACEEPAMData
  | NOAADSCOVRMagData;

// Data validation interfaces
export interface NOAADataValidator {
  validateTimeTag(time_tag: string): boolean;
  validateFluxValue(flux: number, type: string): boolean;
  validateCoordinates(coordinates: [number, number]): boolean;
  validateEnergyRange(range: string): boolean;
}

// Aggregated data interfaces for dashboard display
export interface NOAASpaceWeatherSummary {
  timestamp: string;
  solar_activity: {
    xray_class: string;
    flare_count_24h: number;
    background_flux: number;
  };
  geomagnetic_activity: {
    kp_current: number;
    dst_current: number;
    storm_level: string;
  };
  solar_wind: {
    speed: number;
    density: number;
    magnetic_field: number;
    dynamic_pressure: number;
  };
  particle_environment: {
    proton_flux_high: number;
    electron_flux_high: number;
    cosmic_ray_intensity: number;
  };
  alerts: {
    active_warnings: string[];
    risk_level: 'low' | 'moderate' | 'high' | 'extreme';
  };
}

// Historical trending data
export interface NOAAHistoricalTrend {
  parameter: string;
  data_points: {
    timestamp: string;
    value: number;
    quality: number;
  }[];
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  prediction?: {
    next_6h: number;
    next_24h: number;
    uncertainty: number;
  };
}

// Event detection and classification
export interface NOAASpaceWeatherEvent {
  event_id: string;
  event_type: 'solar_flare' | 'geomagnetic_storm' | 'radiation_storm' | 'radio_blackout';
  start_time: string;
  peak_time?: string;
  end_time?: string;
  intensity: string;
  affected_systems: string[];
  source_data: string[]; // dataset IDs that detected the event
  confidence: number;
  impact_assessment: {
    satellites: 'none' | 'minor' | 'moderate' | 'severe';
    communications: 'none' | 'minor' | 'moderate' | 'severe';
    navigation: 'none' | 'minor' | 'moderate' | 'severe';
    power_grids: 'none' | 'minor' | 'moderate' | 'severe';
    aviation: 'none' | 'minor' | 'moderate' | 'severe';
  };
}
