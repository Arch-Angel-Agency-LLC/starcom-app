import { useState, useEffect } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Hook to manage space weather visualization settings with localStorage persistence
// Used by SpaceWeatherSettings component and can be consumed by globe visualizations

export interface SpaceWeatherConfig {
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
}

const defaultConfig: SpaceWeatherConfig = {
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
};

const STORAGE_KEY = 'space-weather-settings';

export const useSpaceWeatherSettings = () => {
  const [config, setConfig] = useState<SpaceWeatherConfig>(defaultConfig);

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

  // Save settings to localStorage when config changes
  useEffect(() => {
    settingsStorage.saveSettings(STORAGE_KEY, config, { version: 1 });
  }, [config]);

  const updateConfig = (updates: Partial<SpaceWeatherConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return {
    config,
    updateConfig,
    resetConfig,
    
    // Convenience getters for common operations
    isElectricFieldsEnabled: config.showElectricFields,
    isAlertsEnabled: config.showAlerts,
    vectorSettings: {
      intensity: config.vectorIntensity / 100, // Convert to 0-1 range
      opacity: config.vectorOpacity / 100
    },
    alertThresholds: config.alertThresholds,
    dataSettings: {
      autoRefresh: config.autoRefresh,
      refreshIntervalMs: config.refreshInterval * 60 * 1000
    }
  };
};

export default useSpaceWeatherSettings;
