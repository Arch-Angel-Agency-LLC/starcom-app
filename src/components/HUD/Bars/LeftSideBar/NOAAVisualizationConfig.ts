// NOAA Visualization Configuration for Globe Controls
// Defines how each primary NOAA dataset can be visualized on the 3D globe

export interface NOAAVisualizationOption {
  id: string;
  name: string;
  description: string;
  type: 'heatmap' | 'particles' | 'field_lines' | 'markers' | 'atmosphere' | 'rings';
  intensity: 'low' | 'medium' | 'high';
  color: string;
  enabled: boolean;
}

export interface NOAADatasetVisualization {
  datasetId: string;
  name: string;
  description: string;
  icon: string;
  category: 'solar' | 'geomagnetic' | 'radiation' | 'cosmic';
  options: NOAAVisualizationOption[];
  globalEffects?: {
    atmosphere?: boolean;
    lighting?: boolean;
    auroras?: boolean;
  };
}

// Comprehensive visualization configurations for all primary NOAA datasets
export const NOAA_VISUALIZATIONS: NOAADatasetVisualization[] = [
  {
    datasetId: 'solar-xray-flux',
    name: 'Solar X-ray Activity',
    description: 'Real-time solar X-ray flux intensity and classification',
    icon: '☀️',
    category: 'solar',
    options: [
      {
        id: 'xray-sun-glow',
        name: 'Solar Intensity Glow',
        description: 'Dynamic sun glow based on X-ray flux levels',
        type: 'atmosphere',
        intensity: 'medium',
        color: '#ffaa00',
        enabled: false
      },
      {
        id: 'xray-radiation-waves',
        name: 'X-ray Wave Propagation',
        description: 'Animated waves showing X-ray radiation spreading from sun',
        type: 'particles',
        intensity: 'high',
        color: '#ff4500',
        enabled: false
      },
      {
        id: 'xray-earth-impact',
        name: 'Ionosphere X-ray Impact',
        description: 'Earth atmosphere coloring based on X-ray absorption',
        type: 'atmosphere',
        intensity: 'low',
        color: '#ff6b6b',
        enabled: false
      }
    ],
    globalEffects: {
      atmosphere: true,
      lighting: true
    }
  },
  
  {
    datasetId: 'solar-xray-flares',
    name: 'Solar Flare Events',
    description: 'Latest solar flare events with M and X-class classifications',
    icon: '💥',
    category: 'solar',
    options: [
      {
        id: 'flare-burst-markers',
        name: 'Flare Event Markers',
        description: 'Pulsating markers on sun surface for recent flares',
        type: 'markers',
        intensity: 'high',
        color: '#ff0000',
        enabled: true
      },
      {
        id: 'flare-energy-jets',
        name: 'Solar Energy Jets',
        description: 'Particle jets emanating from flare locations',
        type: 'particles',
        intensity: 'high',
        color: '#ffff00',
        enabled: false
      },
      {
        id: 'flare-impact-trails',
        name: 'Earth Impact Prediction',
        description: 'Predicted particle arrival paths to Earth',
        type: 'field_lines',
        intensity: 'medium',
        color: '#ff8c00',
        enabled: false
      }
    ],
    globalEffects: {
      lighting: true
    }
  },

  {
    datasetId: 'geomagnetic-kp-index',
    name: 'Global Magnetic Activity',
    description: 'Planetary Kp index showing global geomagnetic disturbance',
    icon: '🧲',
    category: 'geomagnetic',
    options: [
      {
        id: 'kp-aurora-ovals',
        name: 'Aurora Oval Visualization',
        description: 'Dynamic aurora ovals sized by Kp index intensity',
        type: 'heatmap',
        intensity: 'medium',
        color: '#00ff41',
        enabled: true
      },
      {
        id: 'kp-magnetic-field',
        name: 'Global Magnetic Field Lines',
        description: 'Earth magnetic field lines distorted by Kp activity',
        type: 'field_lines',
        intensity: 'low',
        color: '#4ecdc4',
        enabled: false
      },
      {
        id: 'kp-storm-rings',
        name: 'Geomagnetic Storm Rings',
        description: 'Expanding rings around Earth during high Kp activity',
        type: 'rings',
        intensity: 'high',
        color: '#e74c3c',
        enabled: false
      }
    ],
    globalEffects: {
      auroras: true,
      atmosphere: true
    }
  },

  {
    datasetId: 'geomagnetic-dst-index',
    name: 'Magnetic Storm Intensity',
    description: 'DST index showing magnetic storm phases and intensity',
    icon: '⛈️',
    category: 'geomagnetic',
    options: [
      {
        id: 'dst-magnetosphere-compression',
        name: 'Magnetosphere Compression',
        description: 'Visual compression of magnetosphere during storms',
        type: 'atmosphere',
        intensity: 'medium',
        color: '#9b59b6',
        enabled: true
      },
      {
        id: 'dst-storm-phases',
        name: 'Storm Phase Indicators',
        description: 'Color-coded indicators for storm phases (initial, main, recovery)',
        type: 'markers',
        intensity: 'low',
        color: '#3498db',
        enabled: false
      },
      {
        id: 'dst-current-systems',
        name: 'Ring Current Visualization',
        description: 'Ring current around Earth varying with DST intensity',
        type: 'rings',
        intensity: 'high',
        color: '#f39c12',
        enabled: false
      }
    ],
    globalEffects: {
      atmosphere: true
    }
  },

  {
    datasetId: 'solar-wind-plasma',
    name: 'Solar Wind Flow',
    description: 'Solar wind speed, density, and temperature from space',
    icon: '💨',
    category: 'solar',
    options: [
      {
        id: 'wind-particle-stream',
        name: 'Solar Wind Particle Stream',
        description: 'Flowing particles from sun to Earth based on wind speed',
        type: 'particles',
        intensity: 'medium',
        color: '#00bcd4',
        enabled: true
      },
      {
        id: 'wind-density-clouds',
        name: 'Plasma Density Clouds',
        description: 'Variable density clouds showing solar wind compression',
        type: 'heatmap',
        intensity: 'low',
        color: '#607d8b',
        enabled: false
      },
      {
        id: 'wind-bow-shock',
        name: 'Bow Shock Boundary',
        description: 'Dynamic bow shock formation based on wind pressure',
        type: 'atmosphere',
        intensity: 'high',
        color: '#ff5722',
        enabled: false
      }
    ]
  },

  {
    datasetId: 'solar-wind-magnetic',
    name: 'Interplanetary Magnetic Field',
    description: 'Magnetic field carried by solar wind affecting Earth',
    icon: '🌊',
    category: 'geomagnetic',
    options: [
      {
        id: 'imf-field-lines',
        name: 'IMF Field Line Visualization',
        description: 'Interplanetary magnetic field lines from sun to Earth',
        type: 'field_lines',
        intensity: 'medium',
        color: '#2196f3',
        enabled: true
      },
      {
        id: 'imf-reconnection-sites',
        name: 'Magnetic Reconnection Zones',
        description: 'Active reconnection sites where IMF connects with Earth field',
        type: 'markers',
        intensity: 'high',
        color: '#e91e63',
        enabled: false
      },
      {
        id: 'imf-sector-boundaries',
        name: 'Sector Boundary Crossings',
        description: 'Visualization of magnetic sector boundaries in solar wind',
        type: 'heatmap',
        intensity: 'low',
        color: '#795548',
        enabled: false
      }
    ],
    globalEffects: {
      auroras: true
    }
  },

  {
    datasetId: 'magnetometers-primary',
    name: 'Satellite Magnetometers',
    description: 'GOES satellite magnetic field measurements in space',
    icon: '🛰️',
    category: 'geomagnetic',
    options: [
      {
        id: 'sat-mag-readings',
        name: 'Satellite Magnetic Readings',
        description: 'Real-time magnetic field strength at GOES locations',
        type: 'markers',
        intensity: 'medium',
        color: '#4caf50',
        enabled: true
      },
      {
        id: 'sat-field-vectors',
        name: 'Magnetic Field Vectors',
        description: '3D vectors showing magnetic field direction at satellites',
        type: 'field_lines',
        intensity: 'low',
        color: '#009688',
        enabled: false
      },
      {
        id: 'sat-substorm-detection',
        name: 'Substorm Detection Alerts',
        description: 'Alert markers when satellites detect magnetic substorms',
        type: 'markers',
        intensity: 'high',
        color: '#ff9800',
        enabled: false
      }
    ]
  },

  {
    datasetId: 'proton-flux-integral',
    name: 'Proton Radiation Environment',
    description: 'High-energy proton flux measurements for radiation monitoring',
    icon: '☢️',
    category: 'radiation',
    options: [
      {
        id: 'proton-radiation-belt',
        name: 'Proton Radiation Belt',
        description: 'Van Allen radiation belt visualization with proton intensity',
        type: 'rings',
        intensity: 'medium',
        color: '#ff5722',
        enabled: true
      },
      {
        id: 'proton-sep-events',
        name: 'Solar Energetic Proton Events',
        description: 'Particle streams during solar energetic proton events',
        type: 'particles',
        intensity: 'high',
        color: '#d32f2f',
        enabled: false
      },
      {
        id: 'proton-dose-rates',
        name: 'Radiation Dose Rate Map',
        description: 'Global radiation dose rate heatmap for aviation/space',
        type: 'heatmap',
        intensity: 'low',
        color: '#7b1fa2',
        enabled: false
      }
    ]
  },

  {
    datasetId: 'electron-flux-integral',
    name: 'Electron Radiation Belts',
    description: 'Electron flux in radiation belts affecting satellites',
    icon: '⚡',
    category: 'radiation',
    options: [
      {
        id: 'electron-inner-belt',
        name: 'Inner Electron Belt',
        description: 'Inner Van Allen belt with electron flux intensity',
        type: 'rings',
        intensity: 'medium',
        color: '#1976d2',
        enabled: true
      },
      {
        id: 'electron-outer-belt',
        name: 'Outer Electron Belt',
        description: 'Dynamic outer belt showing electron flux variations',
        type: 'rings',
        intensity: 'high',
        color: '#303f9f',
        enabled: false
      },
      {
        id: 'electron-precipitation',
        name: 'Electron Precipitation Aurora',
        description: 'Aurora caused by electron precipitation into atmosphere',
        type: 'heatmap',
        intensity: 'low',
        color: '#00e676',
        enabled: false
      }
    ],
    globalEffects: {
      auroras: true
    }
  },

  {
    datasetId: 'cosmic-ray-flux',
    name: 'Cosmic Ray Environment',
    description: 'Galactic cosmic ray and solar energetic particle monitoring',
    icon: '🌌',
    category: 'cosmic',
    options: [
      {
        id: 'gcr-flux-intensity',
        name: 'Galactic Cosmic Ray Intensity',
        description: 'Global cosmic ray intensity with solar modulation effects',
        type: 'atmosphere',
        intensity: 'low',
        color: '#6a1b9a',
        enabled: true
      },
      {
        id: 'cosmic-ray-showers',
        name: 'Cosmic Ray Air Showers',
        description: 'Particle cascade visualization from cosmic ray impacts',
        type: 'particles',
        intensity: 'medium',
        color: '#4a148c',
        enabled: false
      },
      {
        id: 'cosmic-ray-anisotropy',
        name: 'Cosmic Ray Anisotropy',
        description: 'Directional variations in cosmic ray arrival',
        type: 'heatmap',
        intensity: 'high',
        color: '#8e24aa',
        enabled: false
      }
    ]
  }
];

// Utility functions for managing visualizations
export function getVisualizationsByCategory(category: string): NOAADatasetVisualization[] {
  return NOAA_VISUALIZATIONS.filter(viz => viz.category === category);
}

export function getEnabledVisualizations(): NOAAVisualizationOption[] {
  return NOAA_VISUALIZATIONS.flatMap(dataset => 
    dataset.options.filter(option => option.enabled)
  );
}

export function getVisualizationById(datasetId: string): NOAADatasetVisualization | undefined {
  return NOAA_VISUALIZATIONS.find(viz => viz.datasetId === datasetId);
}

export function toggleVisualizationOption(datasetId: string, optionId: string): void {
  const dataset = getVisualizationById(datasetId);
  if (dataset) {
    const option = dataset.options.find(opt => opt.id === optionId);
    if (option) {
      option.enabled = !option.enabled;
    }
  }
}

// Preset visualization configurations
export const VISUALIZATION_PRESETS = {
  'space-weather-overview': {
    name: 'Space Weather Overview',
    description: 'Essential space weather indicators',
    enabled: ['xray-sun-glow', 'kp-aurora-ovals', 'wind-particle-stream', 'proton-radiation-belt']
  },
  'solar-activity-focus': {
    name: 'Solar Activity Focus',
    description: 'Comprehensive solar monitoring',
    enabled: ['xray-sun-glow', 'flare-burst-markers', 'wind-particle-stream', 'imf-field-lines']
  },
  'radiation-environment': {
    name: 'Radiation Environment',
    description: 'Particle radiation monitoring for space operations',
    enabled: ['proton-radiation-belt', 'electron-inner-belt', 'cosmic-ray-flux-intensity', 'sat-mag-readings']
  },
  'geomagnetic-monitoring': {
    name: 'Geomagnetic Monitoring',
    description: 'Earth magnetosphere and storm tracking',
    enabled: ['kp-aurora-ovals', 'dst-magnetosphere-compression', 'imf-field-lines', 'sat-mag-readings']
  },
  'research-mode': {
    name: 'Research Mode',
    description: 'All visualization layers for scientific analysis',
    enabled: NOAA_VISUALIZATIONS.flatMap(dataset => dataset.options.map(opt => opt.id))
  }
};
