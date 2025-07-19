import { useState, useEffect, useRef, useCallback } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Hook to manage EcoNatural visualization settings with localStorage persistence
// Used by SpaceWeatherSettings and other EcoNatural components

export interface EcoNaturalConfig {
  // Space Weather settings (updated for new compact design)
  spaceWeather: {
    // New preset-based configuration
    preset?: 'quiet' | 'moderate' | 'storm' | 'extreme';
    
    // New simplified category toggles
    showSolarActivity?: boolean;
    showRadiation?: boolean;
    
    // Existing fields (preserved for compatibility)
    showElectricFields: boolean;
    showGemagneticIndex: boolean;
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
    // New preset-based defaults
    preset: 'moderate',
    showSolarActivity: true,
    showRadiation: false,
    
    // Existing defaults (preserved)
    showElectricFields: true,
    showGemagneticIndex: false,
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
    }
  },
  
  ecologicalDisasters: {
    disasterTypes: {
      wildfires: true,
      floods: true,
      droughts: true,
      hurricanes: true,
      earthquakes: false,
      volcanoes: false
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

const STORAGE_KEY = 'eco-natural-settings';

export const useEcoNaturalSettings = () => {
  const [config, setConfig] = useState<EcoNaturalConfig>(defaultConfig);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadedConfig = settingsStorage.loadSettings(STORAGE_KEY, defaultConfig, {
      version: 1,
      migrations: {
        // Add future migration functions here
      }
    });
    setConfig(loadedConfig);
  }, []);

  // Save settings to localStorage when config changes with debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback((configToSave: EcoNaturalConfig) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      settingsStorage.saveSettings(STORAGE_KEY, configToSave, { version: 1 });
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
      ecologicalDisasters: { ...prev.ecologicalDisasters, ...updates }
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
      [subMode]: defaultConfig[subMode]
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
