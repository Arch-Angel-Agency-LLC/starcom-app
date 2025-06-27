// NOAA Data Configuration - Priority-based dataset mapping
// Defines all available NOAA endpoints organized by priority tiers

export interface NOAAEndpointConfig {
  id: string;
  url: string;
  description: string;
  dataType: string;
  updateFrequency: number; // minutes
  priority: 'primary' | 'secondary' | 'tertiary';
  dependencies?: string[]; // Other endpoints this depends on
}

export interface NOAADataPriorities {
  primary: NOAAEndpointConfig[];
  secondary: NOAAEndpointConfig[];
  tertiary: NOAAEndpointConfig[];
}

// Primary datasets - Critical for core space weather monitoring
export const PRIMARY_DATASETS: NOAAEndpointConfig[] = [
  {
    id: 'solar-xray-flux',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
    description: 'Solar X-ray flux measurements for flare detection and classification',
    dataType: 'solar_radiation',
    updateFrequency: 1, // Every minute during active periods
    priority: 'primary'
  },
  {
    id: 'solar-xray-flares',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json',
    description: 'Latest solar flare events and classifications',
    dataType: 'solar_events',
    updateFrequency: 5,
    priority: 'primary'
  },
  {
    id: 'geomagnetic-kp-index',
    url: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    description: 'Global geomagnetic activity index (Kp)',
    dataType: 'geomagnetic',
    updateFrequency: 180, // 3 hours (standard Kp update interval)
    priority: 'primary'
  },
  {
    id: 'geomagnetic-dst-index',
    url: 'https://services.swpc.noaa.gov/json/geospace/geospace_dst_1_hour.json',
    description: 'Disturbance Storm Time index for magnetic storm intensity',
    dataType: 'geomagnetic',
    updateFrequency: 60,
    priority: 'primary'
  },
  {
    id: 'solar-wind-plasma',
    url: 'https://services.swpc.noaa.gov/json/ace/swepam/ace_swepam_1h.json',
    description: 'Solar wind speed, density, and temperature from ACE/SWEPAM',
    dataType: 'solar_wind',
    updateFrequency: 60,
    priority: 'primary'
  },
  {
    id: 'solar-wind-magnetic',
    url: 'https://services.swpc.noaa.gov/json/ace/mag/ace_mag_1h.json',
    description: 'Interplanetary magnetic field from ACE/MAG',
    dataType: 'solar_wind',
    updateFrequency: 60,
    priority: 'primary'
  },
  {
    id: 'magnetometers-primary',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/magnetometers-6-hour.json',
    description: 'GOES magnetometer data for space environment monitoring',
    dataType: 'magnetosphere',
    updateFrequency: 60,
    priority: 'primary'
  },
  {
    id: 'proton-flux-integral',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json',
    description: 'Integral proton flux for radiation storm monitoring',
    dataType: 'particle_radiation',
    updateFrequency: 15,
    priority: 'primary'
  },
  {
    id: 'electron-flux-integral',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/integral-electrons-6-hour.json',
    description: 'Integral electron flux for radiation belt monitoring',
    dataType: 'particle_radiation',
    updateFrequency: 15,
    priority: 'primary'
  },
  {
    id: 'cosmic-ray-flux',
    url: 'https://services.swpc.noaa.gov/json/ace/sis/ace_sis_5m.json',
    description: 'Cosmic ray and solar energetic particle flux from ACE/SIS',
    dataType: 'cosmic_rays',
    updateFrequency: 5,
    priority: 'primary'
  }
];

// Secondary datasets - Important for comprehensive analysis
export const SECONDARY_DATASETS: NOAAEndpointConfig[] = [
  {
    id: 'geomagnetic-kp-7day',
    url: 'https://services.swpc.noaa.gov/json/geospace/geospace_pred_est_kp_7_day.json',
    description: '7-day Kp index prediction and historical data',
    dataType: 'geomagnetic',
    updateFrequency: 360, // 6 hours
    priority: 'secondary',
    dependencies: ['geomagnetic-kp-index']
  },
  {
    id: 'geomagnetic-dst-7day',
    url: 'https://services.swpc.noaa.gov/json/geospace/geospace_dst_7_day.json',
    description: '7-day DST index historical and forecast data',
    dataType: 'geomagnetic',
    updateFrequency: 360,
    priority: 'secondary',
    dependencies: ['geomagnetic-dst-index']
  },
  {
    id: 'proton-flux-differential',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/differential-protons-6-hour.json',
    description: 'Differential proton flux by energy channel',
    dataType: 'particle_radiation',
    updateFrequency: 15,
    priority: 'secondary',
    dependencies: ['proton-flux-integral']
  },
  {
    id: 'electron-flux-differential',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/differential-electrons-6-hour.json',
    description: 'Differential electron flux by energy channel',
    dataType: 'particle_radiation',
    updateFrequency: 15,
    priority: 'secondary',
    dependencies: ['electron-flux-integral']
  },
  {
    id: 'solar-wind-density-historical',
    url: 'https://services.swpc.noaa.gov/products/solar-wind/density-7-day.json',
    description: 'Historical solar wind density trends',
    dataType: 'solar_wind',
    updateFrequency: 60,
    priority: 'secondary',
    dependencies: ['solar-wind-plasma']
  },
  {
    id: 'solar-wind-speed-historical',
    url: 'https://services.swpc.noaa.gov/products/solar-wind/speed-7-day.json',
    description: 'Historical solar wind speed trends',
    dataType: 'solar_wind',
    updateFrequency: 60,
    priority: 'secondary',
    dependencies: ['solar-wind-plasma']
  },
  {
    id: 'xray-background',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/xray-background-7-day.json',
    description: 'Solar X-ray background levels for baseline monitoring',
    dataType: 'solar_radiation',
    updateFrequency: 60,
    priority: 'secondary',
    dependencies: ['solar-xray-flux']
  },
  {
    id: 'plasma-pressure',
    url: 'https://services.swpc.noaa.gov/products/solar-wind/pressure-7-day.json',
    description: 'Solar wind dynamic pressure measurements',
    dataType: 'solar_wind',
    updateFrequency: 60,
    priority: 'secondary'
  }
];

// Tertiary datasets - Specialized analysis and research
export const TERTIARY_DATASETS: NOAAEndpointConfig[] = [
  {
    id: 'electric-field-intermag',
    url: 'https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/',
    description: 'Electric field measurements from InterMag network',
    dataType: 'electric_field',
    updateFrequency: 15,
    priority: 'tertiary'
  },
  {
    id: 'electric-field-us-canada',
    url: 'https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/',
    description: 'Electric field measurements from US-Canada network',
    dataType: 'electric_field',
    updateFrequency: 15,
    priority: 'tertiary'
  },
  {
    id: 'ace-epam-particles',
    url: 'https://services.swpc.noaa.gov/json/ace/epam/ace_epam_5m.json',
    description: 'Detailed particle measurements from ACE/EPAM',
    dataType: 'particle_detailed',
    updateFrequency: 5,
    priority: 'tertiary'
  },
  {
    id: 'proton-flux-1day',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/differential-protons-1-day.json',
    description: 'Extended 1-day differential proton flux data',
    dataType: 'particle_radiation',
    updateFrequency: 60,
    priority: 'tertiary',
    dependencies: ['proton-flux-differential']
  },
  {
    id: 'electron-flux-1day',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/differential-electrons-1-day.json',
    description: 'Extended 1-day differential electron flux data',
    dataType: 'particle_radiation',
    updateFrequency: 60,
    priority: 'tertiary',
    dependencies: ['electron-flux-differential']
  },
  {
    id: 'proton-flux-3day',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/differential-protons-3-day.json',
    description: 'Extended 3-day differential proton flux data',
    dataType: 'particle_radiation',
    updateFrequency: 180,
    priority: 'tertiary',
    dependencies: ['proton-flux-differential']
  },
  {
    id: 'electron-flux-3day',
    url: 'https://services.swpc.noaa.gov/json/goes/primary/differential-electrons-3-day.json',
    description: 'Extended 3-day differential electron flux data',
    dataType: 'particle_radiation',
    updateFrequency: 180,
    priority: 'tertiary',
    dependencies: ['electron-flux-differential']
  },
  {
    id: 'magnetometers-secondary',
    url: 'https://services.swpc.noaa.gov/json/goes/secondary/magnetometers-6-hour.json',
    description: 'Secondary GOES magnetometer data for redundancy',
    dataType: 'magnetosphere',
    updateFrequency: 60,
    priority: 'tertiary',
    dependencies: ['magnetometers-primary']
  },
  {
    id: 'dscovr-magnetic',
    url: 'https://services.swpc.noaa.gov/json/dscovr/dscovr_mag_1s.json',
    description: 'High-resolution magnetic field from DSCOVR',
    dataType: 'solar_wind',
    updateFrequency: 5,
    priority: 'tertiary'
  }
];

// Combined configuration
export const NOAA_DATA_PRIORITIES: NOAADataPriorities = {
  primary: PRIMARY_DATASETS,
  secondary: SECONDARY_DATASETS,
  tertiary: TERTIARY_DATASETS
};

// Utility functions for working with the configuration
export function getAllDatasets(): NOAAEndpointConfig[] {
  return [...PRIMARY_DATASETS, ...SECONDARY_DATASETS, ...TERTIARY_DATASETS];
}

export function getDatasetsByType(dataType: string): NOAAEndpointConfig[] {
  return getAllDatasets().filter(config => config.dataType === dataType);
}

export function getDatasetById(id: string): NOAAEndpointConfig | undefined {
  return getAllDatasets().find(config => config.id === id);
}

export function getDatasetsByPriority(priority: 'primary' | 'secondary' | 'tertiary'): NOAAEndpointConfig[] {
  return NOAA_DATA_PRIORITIES[priority];
}

// Priority-based fetch order for system initialization
export function getPriorityFetchOrder(): string[] {
  const order: string[] = [];
  
  // Add primary datasets first (most critical)
  PRIMARY_DATASETS.forEach(config => order.push(config.id));
  
  // Add secondary datasets (important but not critical)
  SECONDARY_DATASETS.forEach(config => order.push(config.id));
  
  // Add tertiary datasets last (specialized/research)
  TERTIARY_DATASETS.forEach(config => order.push(config.id));
  
  return order;
}

// Get datasets that should be fetched together (no dependencies)
export function getIndependentDatasets(): string[] {
  return getAllDatasets()
    .filter(config => !config.dependencies || config.dependencies.length === 0)
    .map(config => config.id);
}

// Get datasets that depend on others
export function getDependentDatasets(): Record<string, string[]> {
  const dependent: Record<string, string[]> = {};
  
  getAllDatasets()
    .filter(config => config.dependencies && config.dependencies.length > 0)
    .forEach(config => {
      dependent[config.id] = config.dependencies!;
    });
    
  return dependent;
}
