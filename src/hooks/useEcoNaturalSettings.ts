import { useState, useEffect, useRef, useCallback } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Hook to manage EcoNatural visualization settings with localStorage persistence
// Used by SpaceWeatherSettings and other EcoNatural components

export interface EcoNaturalConfig {
  // Space Weather settings (updated for new compact design)
  spaceWeather: {
  // Tertiary visualization active layer (single-select for now)
  activeLayer: string; // e.g. 'electricFields'
    // New preset-based configuration
    preset?: 'quiet' | 'moderate' | 'storm' | 'extreme';
    
    // New simplified category toggles
    showSolarActivity?: boolean;
    showRadiation?: boolean;
    
    // Existing fields (preserved for compatibility)
  showElectricFields: boolean;
  // Renamed (Aug 2025): showGemagneticIndex -> showGeomagneticIndex (migration retained below)
  showGeomagneticIndex: boolean;
    showAlerts: boolean;
    vectorIntensity: number; // 0-100
    vectorOpacity: number; // 0-100
    vectorScale: number; // 0.5-5.0
    heatMapIntensity: number; // 0-100
    showMagneticField: boolean;
    showAuroralOval: boolean;
    showKpIndex: boolean;
    showSolarWind: boolean;
    showMagnetopause: boolean;
    timeWindow: number; // hours
    alertThresholds: {
      moderate: number;
      high: number;
      extreme: number;
    };
    autoRefresh: boolean;
    refreshInterval: number; // minutes
    showStatistics: boolean;
    // Advanced normalization settings
    normalization: {
      method: 'linear' | 'logarithmic' | 'percentile' | 'statistical' | 'adaptive';
      outlierFactor: number; // 1.0-3.0
      smoothingFactor: number; // 0-1
      percentileRange: [number, number]; // e.g., [5, 95]
      clampMax: number | null; // Optional maximum clamp value
    };
  // Phase 0 feature flag persistence
  enhancedSampling?: boolean;
  // Phase 1 pipeline feature flag
  pipelineEnabled?: boolean;
    enabledDatasets: {
      intermag: boolean;
      usCanada: boolean;
      pipeline: boolean;
    };
    samplingMode: 'legacy-topN' | 'grid-binning';
    gridBinSize: number;
    legacyCap: number;
    magnitudeFloor: number;
  };
  
  // Ecological Disasters settings
  ecologicalDisasters: {
    disasterTypes: {
      wildfires: boolean;
      floods: boolean;
      droughts: boolean;
      hurricanes: boolean;
      earthquakes: boolean;
      volcanoes: boolean;
    };
    severity: {
      showMinor: boolean;
      showMajor: boolean;
      showCatastrophic: boolean;
    };
    timeRange: number; // days
    showImpactRadius: boolean;
    radiusOpacity: number; // 0-100
    showEvacuationZones: boolean;
    alertSettings: {
      enableAlerts: boolean;
      soundAlerts: boolean;
      alertThreshold: 'minor' | 'major' | 'catastrophic';
    };
    dataLayers: {
      showPopulationDensity: boolean;
      showInfrastructure: boolean;
      showEnvironmentalData: boolean;
    };
  };
  
  // Earth Weather settings
  earthWeather: {
    weatherLayers: {
      temperature: boolean;
      precipitation: boolean;
      windPatterns: boolean;
      pressure: boolean;
      humidity: boolean;
      clouds: boolean;
    };
    displayMode: 'realtime' | 'forecast' | 'historical';
    forecastRange: number; // hours
    temperatureUnit: 'celsius' | 'fahrenheit' | 'kelvin';
    windUnit: 'kmh' | 'mph' | 'ms' | 'knots';
    pressureUnit: 'hPa' | 'inHg' | 'mmHg';
    overlayOpacity: number; // 0-100
    animationSpeed: number; // 0.1-3.0
    showStormTracking: boolean;
    stormTypes: {
      tropical: boolean;
      extratropical: boolean;
      severe: boolean;
    };
  };
  
  // Global EcoNatural settings
  globalSettings: {
    dataQuality: 'low' | 'medium' | 'high';
    updateFrequency: number; // minutes
    cacheDuration: number; // hours
    enableInterpolation: boolean;
    showDataSources: boolean;
    coordinateSystem: 'geographic' | 'projected';
    timeZone: 'utc' | 'local';
  };
}

const defaultConfig: EcoNaturalConfig = {
  spaceWeather: {
  activeLayer: 'electricFields',
    // New preset-based defaults
    preset: 'moderate',
    showSolarActivity: true,
    showRadiation: false,
    
    // Existing defaults (preserved)
  showElectricFields: true,
  showGeomagneticIndex: false,
    showAlerts: true,
    vectorIntensity: 80,
    vectorOpacity: 60,
    vectorScale: 1.0,
    heatMapIntensity: 50,
    showMagneticField: false,
    showAuroralOval: false,
    showKpIndex: false,
    showSolarWind: false,
    showMagnetopause: false,
    timeWindow: 24,
    alertThresholds: {
      moderate: 1000,
      high: 3000,
      extreme: 5000
    },
    autoRefresh: true,
    refreshInterval: 5,
    showStatistics: true,
    normalization: {
      method: 'adaptive',
      outlierFactor: 1.5,
      smoothingFactor: 0.1,
      percentileRange: [10, 90],
      clampMax: null
  },
  // Phase 0 feature flags
  enhancedSampling: false,
  // Phase 1 pipeline flag (disabled by default until orchestrator validated)
  pipelineEnabled: false,
    enabledDatasets: {
      intermag: true,
      usCanada: true,
      pipeline: false
    },
    samplingMode: 'legacy-topN',
    gridBinSize: 5,
    legacyCap: 500,
    magnitudeFloor: 0
  },
  
  ecologicalDisasters: {
    disasterTypes: {
      wildfires: true,
      floods: true,
      droughts: true,
      hurricanes: true,
      earthquakes: true,
      volcanoes: true
    },
    severity: {
      showMinor: false,
      showMajor: true,
      showCatastrophic: true
    },
    timeRange: 7,
    showImpactRadius: true,
    radiusOpacity: 40,
    showEvacuationZones: true,
    alertSettings: {
      enableAlerts: true,
      soundAlerts: false,
      alertThreshold: 'major'
    },
    dataLayers: {
      showPopulationDensity: true,
      showInfrastructure: false,
      showEnvironmentalData: false
    }
  },
  
  earthWeather: {
    weatherLayers: {
      temperature: true,
      precipitation: true,
      windPatterns: false,
      pressure: false,
      humidity: false,
      clouds: true
    },
    displayMode: 'realtime',
    forecastRange: 48,
    temperatureUnit: 'celsius',
    windUnit: 'kmh',
    pressureUnit: 'hPa',
    overlayOpacity: 70,
    animationSpeed: 1.0,
    showStormTracking: true,
    stormTypes: {
      tropical: true,
      extratropical: false,
      severe: true
    }
  },
  
  globalSettings: {
    dataQuality: 'medium',
    updateFrequency: 10,
    cacheDuration: 2,
    enableInterpolation: true,
    showDataSources: false,
    coordinateSystem: 'geographic',
    timeZone: 'utc'
  }
};

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, num));
};

const coerceBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (value === undefined) return fallback;
  return Boolean(value);
};

const sanitizeEcologicalDisasters = (
  incoming: EcoNaturalConfig['ecologicalDisasters']
): EcoNaturalConfig['ecologicalDisasters'] => {
  const defaults = defaultConfig.ecologicalDisasters;

  const disasterTypes = {
    ...defaults.disasterTypes,
    ...(incoming?.disasterTypes || {})
  };

  const severity = {
    ...defaults.severity,
    ...(incoming?.severity || {})
  };

  const alertSettings = {
    ...defaults.alertSettings,
    ...(incoming?.alertSettings || {})
  };

  const dataLayers = {
    ...defaults.dataLayers,
    ...(incoming?.dataLayers || {})
  };

  const alertThreshold = ['minor', 'major', 'catastrophic'].includes(alertSettings.alertThreshold)
    ? alertSettings.alertThreshold
    : defaults.alertSettings.alertThreshold;

  return {
    ...defaults,
    ...incoming,
    disasterTypes: Object.fromEntries(
      Object.entries(disasterTypes).map(([key, value]) => [key, coerceBoolean(value, defaults.disasterTypes[key as keyof typeof defaults.disasterTypes])])
    ) as EcoNaturalConfig['ecologicalDisasters']['disasterTypes'],
    severity: {
      showMinor: coerceBoolean(severity.showMinor, defaults.severity.showMinor),
      showMajor: coerceBoolean(severity.showMajor, defaults.severity.showMajor),
      showCatastrophic: coerceBoolean(severity.showCatastrophic, defaults.severity.showCatastrophic)
    },
    timeRange: clampNumber(incoming?.timeRange, 1, 30, defaults.timeRange),
    radiusOpacity: clampNumber(incoming?.radiusOpacity, 0, 100, defaults.radiusOpacity),
    showImpactRadius: coerceBoolean(incoming?.showImpactRadius, defaults.showImpactRadius),
    showEvacuationZones: coerceBoolean(incoming?.showEvacuationZones, defaults.showEvacuationZones),
    alertSettings: {
      enableAlerts: coerceBoolean(alertSettings.enableAlerts, defaults.alertSettings.enableAlerts),
      soundAlerts: coerceBoolean(alertSettings.soundAlerts, defaults.alertSettings.soundAlerts),
      alertThreshold
    },
    dataLayers: {
      showPopulationDensity: coerceBoolean(dataLayers.showPopulationDensity, defaults.dataLayers.showPopulationDensity),
      showInfrastructure: coerceBoolean(dataLayers.showInfrastructure, defaults.dataLayers.showInfrastructure),
      showEnvironmentalData: coerceBoolean(dataLayers.showEnvironmentalData, defaults.dataLayers.showEnvironmentalData)
    }
  };
};

const STORAGE_KEY = 'eco-natural-settings';
const STORAGE_VERSION = 2;

const migrations: Record<number, (data: EcoNaturalConfig) => EcoNaturalConfig> = {
  2: (data) => {
    const ecologicalDisasters = {
      ...defaultConfig.ecologicalDisasters,
      ...(data.ecologicalDisasters || {})
    };

    const disasterTypes = {
      ...defaultConfig.ecologicalDisasters.disasterTypes,
      ...(data.ecologicalDisasters?.disasterTypes || {})
    };

    // Flip defaults to ON for earthquakes/volcanoes during migration
    disasterTypes.earthquakes = true;
    disasterTypes.volcanoes = true;

    return {
      ...data,
      ecologicalDisasters: {
        ...ecologicalDisasters,
        disasterTypes
      }
    } as EcoNaturalConfig;
  }
};

export const useEcoNaturalSettings = () => {
  const [config, setConfig] = useState<EcoNaturalConfig>(defaultConfig);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadedConfig = settingsStorage.loadSettings(STORAGE_KEY, defaultConfig, { version: STORAGE_VERSION, migrations });
    // Simplified migration for Aug 2025 rename (showGemagneticIndex -> showGeomagneticIndex)
  type PartialSpaceWeather = Partial<EcoNaturalConfig['spaceWeather']> & { [k: string]: unknown };
  const sw = { ...defaultConfig.spaceWeather, ...(loadedConfig.spaceWeather || {}) } as PartialSpaceWeather as EcoNaturalConfig['spaceWeather'];
    if (!sw.activeLayer) sw.activeLayer = 'electricFields';
    // Migration: showGemagneticIndex (typo) -> showGeomagneticIndex
    const legacyValue = (sw as unknown as Record<string, unknown>).showGemagneticIndex;
    if (typeof sw.showGeomagneticIndex !== 'boolean') {
      if (typeof legacyValue === 'boolean') {
        sw.showGeomagneticIndex = legacyValue;
      } else {
        sw.showGeomagneticIndex = defaultConfig.spaceWeather.showGeomagneticIndex;
      }
    }
  // Drop legacy typo key if present
  if ('showGemagneticIndex' in (sw as unknown as Record<string, unknown>)) delete (sw as unknown as Record<string, unknown>).showGemagneticIndex;
    const eco = sanitizeEcologicalDisasters(loadedConfig.ecologicalDisasters ?? defaultConfig.ecologicalDisasters);
    setConfig({ ...loadedConfig, spaceWeather: sw, ecologicalDisasters: eco });
  }, []);

  // Save settings to localStorage when config changes with debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback((configToSave: EcoNaturalConfig) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      settingsStorage.saveSettings(STORAGE_KEY, configToSave, { version: STORAGE_VERSION });
    }, 500); // Debounce for 500ms
  }, []);

  useEffect(() => {
    // Skip saving the default config on first load
    if (JSON.stringify(config) === JSON.stringify(defaultConfig)) {
      return;
    }
    
    debouncedSave(config);
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, debouncedSave]);

  const updateConfig = (updates: Partial<EcoNaturalConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateSpaceWeather = (updates: Partial<EcoNaturalConfig['spaceWeather']>) => {
    setConfig(prev => ({
      ...prev,
      spaceWeather: { ...prev.spaceWeather, ...updates }
    }));
  };

  const updateEcologicalDisasters = (updates: Partial<EcoNaturalConfig['ecologicalDisasters']>) => {
    setConfig(prev => ({
      ...prev,
      ecologicalDisasters: sanitizeEcologicalDisasters({ ...prev.ecologicalDisasters, ...updates })
    }));
  };

  const updateEarthWeather = (updates: Partial<EcoNaturalConfig['earthWeather']>) => {
    setConfig(prev => ({
      ...prev,
      earthWeather: { ...prev.earthWeather, ...updates }
    }));
  };

  const updateGlobalSettings = (updates: Partial<EcoNaturalConfig['globalSettings']>) => {
    setConfig(prev => ({
      ...prev,
      globalSettings: { ...prev.globalSettings, ...updates }
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  const resetSubMode = (subMode: 'spaceWeather' | 'ecologicalDisasters' | 'earthWeather' | 'globalSettings') => {
    setConfig(prev => ({
      ...prev,
      [subMode]: subMode === 'ecologicalDisasters'
        ? sanitizeEcologicalDisasters(defaultConfig.ecologicalDisasters)
        : defaultConfig[subMode]
    }));
  };

  return {
    config,
    updateConfig,
    updateSpaceWeather,
    updateEcologicalDisasters,
    updateEarthWeather,
    updateGlobalSettings,
    resetConfig,
    resetSubMode,
    
    // Convenience getters for common operations
    currentSubModeConfig: (subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather') => {
      switch (subMode) {
        case 'SpaceWeather':
          return config.spaceWeather;
        case 'EcologicalDisasters':
          return config.ecologicalDisasters;
        case 'EarthWeather':
          return config.earthWeather;
        default:
          return config.spaceWeather;
      }
    },
    
    // Legacy compatibility for existing SpaceWeather components
    spaceWeatherConfig: config.spaceWeather,
    
    // Convenience getters for common operations
    isElectricFieldsEnabled: config.spaceWeather.showElectricFields,
    isAlertsEnabled: config.spaceWeather.showAlerts,
    vectorSettings: {
      intensity: config.spaceWeather.vectorIntensity / 100,
      opacity: config.spaceWeather.vectorOpacity / 100
    },
    alertThresholds: config.spaceWeather.alertThresholds,
    dataSettings: {
      autoRefresh: config.spaceWeather.autoRefresh,
      refreshIntervalMs: config.spaceWeather.refreshInterval * 60 * 1000
    }
  };
};

export default useEcoNaturalSettings;
