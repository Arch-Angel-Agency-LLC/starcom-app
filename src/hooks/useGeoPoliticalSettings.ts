import { useState, useEffect, useRef, useCallback } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Hook to manage GeoPolitical visualization settings with localStorage persistence
// Used by GeoPoliticalSettings component and can be consumed by geopolitical visualizations

export interface GeoPoliticalConfig {
  // National Territories settings
  nationalTerritories: {
    borderVisibility: number; // 0-100
    borderThickness: number; // 0.5-5.0
    territoryColors: {
      useCustomColors: boolean;
      colorScheme: 'default' | 'political' | 'economic' | 'population';
      opacity: number; // 0-100
    };
    showDisputedTerritories: boolean;
    showMaritimeBorders: boolean;
    labelVisibility: number; // 0-100
    highlightOnHover: boolean;
    lod?: {
      mode: 'auto' | 'locked';
      lockedLevel: 0 | 1 | 2;
      hysteresis: number; // distance margin (units)
    };
  };
  
  // Diplomatic Events settings
  diplomaticEvents: {
    eventTypes: {
      treaties: boolean;
      summits: boolean;
      conflicts: boolean;
      sanctions: boolean;
      tradeAgreements: boolean;
    };
    timeRange: number; // days
    markerSize: number; // 0.5-3.0
    showConnections: boolean;
    connectionOpacity: number; // 0-100
    animateEvents: boolean;
    eventFiltering: {
      importance: 'low' | 'medium' | 'high' | 'all';
      regions: string[]; // Array of region names
    };
  };
  
  // Resource Zones settings
  resourceZones: {
    resourceTypes: {
      oil: boolean;
      gas: boolean;
      minerals: boolean;
      water: boolean;
      renewable: boolean;
    };
    showProductionRates: boolean;
    showReserveData: boolean;
    zoneOpacity: number; // 0-100
    showTradeRoutes: boolean;
    tradeRouteIntensity: number; // 0-100
    conflictZones: {
      show: boolean;
      highlightDisputed: boolean;
      alertLevel: 'low' | 'medium' | 'high';
    };
  };
  
  // Global GeoPolitical settings
  globalSettings: {
    mapProjection: 'mercator' | 'equirectangular' | 'orthographic';
    showCoordinateGrid: boolean;
    gridOpacity: number; // 0-100
    enableTooltips: boolean;
    dataUpdateInterval: number; // minutes
    autoRefresh: boolean;
    interfaceTheme: 'light' | 'dark' | 'auto';
  };
}

const defaultConfig: GeoPoliticalConfig = {
  nationalTerritories: {
    borderVisibility: 70,
    borderThickness: 1.0,
    territoryColors: {
      useCustomColors: false,
      colorScheme: 'default',
      opacity: 50
    },
    showDisputedTerritories: true,
    showMaritimeBorders: false,
    labelVisibility: 60,
    highlightOnHover: true,
    lod: { mode: 'auto', lockedLevel: 2, hysteresis: 25 }
  },
  
  diplomaticEvents: {
    eventTypes: {
      treaties: true,
      summits: true,
      conflicts: true,
      sanctions: true,
      tradeAgreements: false
    },
    timeRange: 30,
    markerSize: 1.0,
    showConnections: true,
    connectionOpacity: 40,
    animateEvents: true,
    eventFiltering: {
      importance: 'medium',
      regions: []
    }
  },
  
  resourceZones: {
    resourceTypes: {
      oil: true,
      gas: true,
      minerals: true,
      water: false,
      renewable: false
    },
    showProductionRates: true,
    showReserveData: false,
    zoneOpacity: 60,
    showTradeRoutes: true,
    tradeRouteIntensity: 50,
    conflictZones: {
      show: true,
      highlightDisputed: true,
      alertLevel: 'medium'
    }
  },
  
  globalSettings: {
    mapProjection: 'mercator',
    showCoordinateGrid: false,
    gridOpacity: 20,
    enableTooltips: true,
    dataUpdateInterval: 15,
    autoRefresh: true,
    interfaceTheme: 'dark'
  }
};

const STORAGE_KEY = 'geo-political-settings';

export const useGeoPoliticalSettings = () => {
  const [config, setConfig] = useState<GeoPoliticalConfig>(defaultConfig);

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
  
  const debouncedSave = useCallback((configToSave: GeoPoliticalConfig) => {
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

  const updateConfig = (updates: Partial<GeoPoliticalConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateNationalTerritories = (updates: Partial<GeoPoliticalConfig['nationalTerritories']>) => {
    setConfig(prev => ({
      ...prev,
      nationalTerritories: { ...prev.nationalTerritories, ...updates }
    }));
  };

  const updateDiplomaticEvents = (updates: Partial<GeoPoliticalConfig['diplomaticEvents']>) => {
    setConfig(prev => ({
      ...prev,
      diplomaticEvents: { ...prev.diplomaticEvents, ...updates }
    }));
  };

  const updateResourceZones = (updates: Partial<GeoPoliticalConfig['resourceZones']>) => {
    setConfig(prev => ({
      ...prev,
      resourceZones: { ...prev.resourceZones, ...updates }
    }));
  };

  const updateGlobalSettings = (updates: Partial<GeoPoliticalConfig['globalSettings']>) => {
    setConfig(prev => ({
      ...prev,
      globalSettings: { ...prev.globalSettings, ...updates }
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  const resetSubMode = (subMode: 'nationalTerritories' | 'diplomaticEvents' | 'resourceZones' | 'globalSettings') => {
    setConfig(prev => ({
      ...prev,
      [subMode]: defaultConfig[subMode]
    }));
  };

  return {
    config,
    updateConfig,
    updateNationalTerritories,
    updateDiplomaticEvents,
    updateResourceZones,
    updateGlobalSettings,
    resetConfig,
    resetSubMode,
    
    // Convenience getters for common operations
    currentSubModeConfig: (subMode: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones') => {
      switch (subMode) {
        case 'NationalTerritories':
          return config.nationalTerritories;
        case 'DiplomaticEvents':
          return config.diplomaticEvents;
        case 'ResourceZones':
          return config.resourceZones;
        default:
          return config.nationalTerritories;
      }
    },
    
    isAutoRefreshEnabled: config.globalSettings.autoRefresh,
    effectiveBorderOpacity: config.nationalTerritories.borderVisibility / 100,
    territoryStyle: {
      opacity: config.nationalTerritories.territoryColors.opacity / 100,
      scheme: config.nationalTerritories.territoryColors.colorScheme,
      thickness: config.nationalTerritories.borderThickness,
      lod: config.nationalTerritories.lod
    },
    eventSettings: {
      timeRangeMs: config.diplomaticEvents.timeRange * 24 * 60 * 60 * 1000,
      showAnimations: config.diplomaticEvents.animateEvents,
      connectionOpacity: config.diplomaticEvents.connectionOpacity / 100
    }
  };
};

export default useGeoPoliticalSettings;
