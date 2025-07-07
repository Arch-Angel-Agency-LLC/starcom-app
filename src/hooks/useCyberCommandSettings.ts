import { useState, useEffect, useRef, useCallback } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Hook to manage CyberCommand visualization settings with localStorage persistence
// Used by CyberCommandSettings component and can be consumed by cyber command visualizations

export interface CyberCommandConfig {
  // Intel Reports settings
  intelReports: {
    overlayOpacity: number; // 0-100
    reportFiltering: {
      showCritical: boolean;
      showHigh: boolean;
      showMedium: boolean;
      showLow: boolean;
    };
    autoRefresh: boolean;
    refreshInterval: number; // minutes
    maxReports: number;
    showTimestamps: boolean;
    showSources: boolean;
  };
  
  // Timeline settings
  timelines: {
    timeRange: number; // hours
    showEvents: boolean;
    showTrends: boolean;
    eventCategories: {
      security: boolean;
      geopolitical: boolean;
      economic: boolean;
      environmental: boolean;
    };
    animationSpeed: number; // 0.1-2.0
    markerSize: number; // 0.5-2.0
  };
  
  // Crisis Zones settings
  crisisZones: {
    alertLevel: 'low' | 'medium' | 'high' | 'critical';
    showRadius: boolean;
    radiusScale: number; // 0.5-3.0
    blinkAlerts: boolean;
    soundAlerts: boolean;
    zoneCategories: {
      conflict: boolean;
      natural: boolean;
      humanitarian: boolean;
      technological: boolean;
    };
    intensityThreshold: number; // 0-100
  };
  
  // Global CyberCommand settings
  globalSettings: {
    darkMode: boolean;
    showGrid: boolean;
    gridOpacity: number; // 0-100
    interfaceScale: number; // 0.8-1.5
    enableAnimations: boolean;
    highlightActive: boolean;
  };
}

const defaultConfig: CyberCommandConfig = {
  intelReports: {
    overlayOpacity: 80,
    reportFiltering: {
      showCritical: true,
      showHigh: true,
      showMedium: true,
      showLow: false
    },
    autoRefresh: true,
    refreshInterval: 2,
    maxReports: 50,
    showTimestamps: true,
    showSources: true
  },
  
  timelines: {
    timeRange: 48,
    showEvents: true,
    showTrends: true,
    eventCategories: {
      security: true,
      geopolitical: true,
      economic: false,
      environmental: false
    },
    animationSpeed: 1.0,
    markerSize: 1.0
  },
  
  crisisZones: {
    alertLevel: 'medium',
    showRadius: true,
    radiusScale: 1.0,
    blinkAlerts: true,
    soundAlerts: false,
    zoneCategories: {
      conflict: true,
      natural: true,
      humanitarian: true,
      technological: false
    },
    intensityThreshold: 30
  },
  
  globalSettings: {
    darkMode: true,
    showGrid: false,
    gridOpacity: 20,
    interfaceScale: 1.0,
    enableAnimations: true,
    highlightActive: true
  }
};

const STORAGE_KEY = 'cyber-command-settings';

export const useCyberCommandSettings = () => {
  const [config, setConfig] = useState<CyberCommandConfig>(defaultConfig);

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
  
  const debouncedSave = useCallback((configToSave: CyberCommandConfig) => {
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

  const updateConfig = (updates: Partial<CyberCommandConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateIntelReports = (updates: Partial<CyberCommandConfig['intelReports']>) => {
    setConfig(prev => ({
      ...prev,
      intelReports: { ...prev.intelReports, ...updates }
    }));
  };

  const updateTimelines = (updates: Partial<CyberCommandConfig['timelines']>) => {
    setConfig(prev => ({
      ...prev,
      timelines: { ...prev.timelines, ...updates }
    }));
  };

  const updateCrisisZones = (updates: Partial<CyberCommandConfig['crisisZones']>) => {
    setConfig(prev => ({
      ...prev,
      crisisZones: { ...prev.crisisZones, ...updates }
    }));
  };

  const updateGlobalSettings = (updates: Partial<CyberCommandConfig['globalSettings']>) => {
    setConfig(prev => ({
      ...prev,
      globalSettings: { ...prev.globalSettings, ...updates }
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  const resetSubMode = (subMode: 'intelReports' | 'timelines' | 'crisisZones' | 'globalSettings') => {
    setConfig(prev => ({
      ...prev,
      [subMode]: defaultConfig[subMode]
    }));
  };

  return {
    config,
    updateConfig,
    updateIntelReports,
    updateTimelines,
    updateCrisisZones,
    updateGlobalSettings,
    resetConfig,
    resetSubMode,
    
    // Convenience getters for common operations
    currentSubModeConfig: (subMode: 'IntelReports' | 'Timelines' | 'CrisisZones') => {
      switch (subMode) {
        case 'IntelReports':
          return config.intelReports;
        case 'Timelines':
          return config.timelines;
        case 'CrisisZones':
          return config.crisisZones;
        default:
          return config.intelReports;
      }
    },
    
    isAlertsEnabled: config.crisisZones.blinkAlerts || config.crisisZones.soundAlerts,
    effectiveOpacity: config.intelReports.overlayOpacity / 100,
    animationSettings: {
      enabled: config.globalSettings.enableAnimations,
      speed: config.timelines.animationSpeed
    }
  };
};

export default useCyberCommandSettings;
