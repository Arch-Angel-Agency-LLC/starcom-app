import { useState, useEffect, useRef, useCallback } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Hook to manage ALL CyberCommand visualization settings with localStorage persistence
// Updated to support all 5 visualization types: IntelReports, CyberAttacks, CyberThreats, DigitalAssets, CommHubs

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

  // Cyber Attacks settings (NEW - Phase 2 Priority 1)
  cyberAttacks: {
    overlayOpacity: number; // 0-100
    alertThreshold: number; // 1-10 severity scale
    showTrajectories: boolean;
    trajectorySpeed: number; // 0.5-3.0
    showDefenses: boolean;
    autoCorrelation: boolean;
    attackFiltering: {
      showDDoS: boolean;
      showMalware: boolean;
      showPhishing: boolean;
      showBreaches: boolean;
      showRansomware: boolean;
    };
    refreshInterval: number; // seconds (real-time updates)
    maxAttacks: number;
    showAttribution: boolean;
    impactVisualization: boolean;
  };

  // Cyber Threats settings (NEW - Phase 2 Priority 2)
  cyberThreats: {
    overlayOpacity: number; // 0-100
    confidenceThreshold: number; // 0.0-1.0
    showHeatMap: boolean;
    heatMapIntensity: number; // 0.1-2.0
    showC2Networks: boolean;
    showBotnets: boolean;
    showAttribution: boolean;
    attributionMinConfidence: number; // 0.0-1.0
    threatFiltering: {
      showC2Servers: boolean;
      showMalwareFamilies: boolean;
      showThreatActors: boolean;
      showIOCs: boolean;
    };
    refreshInterval: number; // minutes
    maxThreats: number;
    campaignGrouping: boolean;
    showTimelines: boolean;
  };

  // Digital Assets settings (NEW - Phase 3 Priority 3) 
  digitalAssets: {
    overlayOpacity: number; // 0-100
    showBlockchainNodes: boolean;
    showCryptoExchanges: boolean;
    showDeFiProtocols: boolean;
    showSmartContracts: boolean;
    showCrosschainBridges: boolean;
    showNFTMarketplaces: boolean;
    showDAOs: boolean;
    vulnerabilityAlerts: boolean;
    securityScoring: boolean;
    assetFiltering: {
      showMajorChains: boolean;
      showAltcoins: boolean;
      showTestnets: boolean;
      showStablecoins: boolean;
    };
    refreshInterval: number; // minutes
    maxAssets: number;
    showLabels: boolean;
    riskVisualization: boolean;
  };

  // Communication Hubs settings (NEW - Phase 3 Priority 4)
  commHubs: {
    overlayOpacity: number; // 0-100
    showSatellites: boolean;
    showGroundStations: boolean;
    showSIGINT: boolean;
    showCellTowers: boolean;
    coverageRadius: number; // km
    showCoverageAreas: boolean;
    signalStrength: boolean;
    frequencyBands: {
      showHF: boolean;
      showVHF: boolean;
      showUHF: boolean;
      showSHF: boolean;
    };
    classificationFilter: {
      showUnclassified: boolean;
      showConfidential: boolean;
      showSecret: boolean;
    };
    refreshInterval: number; // minutes
    maxHubs: number;
    showSignalPaths: boolean;
    interferenceDetection: boolean;
  };
  
  // Legacy Timeline settings (keeping for backward compatibility)
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
  
  // Legacy Crisis Zones settings (keeping for backward compatibility)
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

  // NEW: CyberAttacks default configuration
  cyberAttacks: {
    overlayOpacity: 90,
    alertThreshold: 5,
    showTrajectories: true,
    trajectorySpeed: 1.5,
    showDefenses: true,
    autoCorrelation: true,
    attackFiltering: {
      showDDoS: true,
      showMalware: true,
      showPhishing: true,
      showBreaches: true,
      showRansomware: true
    },
    refreshInterval: 5, // 5 seconds for real-time
    maxAttacks: 100,
    showAttribution: true,
    impactVisualization: true
  },

  // NEW: CyberThreats default configuration
  cyberThreats: {
    overlayOpacity: 75,
    confidenceThreshold: 0.7,
    showHeatMap: true,
    heatMapIntensity: 1.0,
    showC2Networks: true,
    showBotnets: true,
    showAttribution: true,
    attributionMinConfidence: 0.6,
    threatFiltering: {
      showC2Servers: true,
      showMalwareFamilies: true,
      showThreatActors: true,
      showIOCs: false
    },
    refreshInterval: 5, // 5 minutes
    maxThreats: 200,
    campaignGrouping: true,
    showTimelines: false
  },

  // NEW: DigitalAssets default configuration
  digitalAssets: {
    overlayOpacity: 60,
    showBlockchainNodes: true,
    showCryptoExchanges: true,
    showDeFiProtocols: true,
    showSmartContracts: false,
    showCrosschainBridges: true,
    showNFTMarketplaces: false,
    showDAOs: true,
    vulnerabilityAlerts: true,
    securityScoring: true,
    assetFiltering: {
      showMajorChains: true,
      showAltcoins: false,
      showTestnets: false,
      showStablecoins: true
    },
    refreshInterval: 10, // 10 minutes  
    maxAssets: 500,
    showLabels: true,
    riskVisualization: true
  },

  // NEW: CommHubs default configuration
  commHubs: {
    overlayOpacity: 70,
    showSatellites: true,
    showGroundStations: true,
    showSIGINT: true,
    showCellTowers: false,
    coverageRadius: 100,
    showCoverageAreas: true,
    signalStrength: true,
    frequencyBands: {
      showHF: false,
      showVHF: true,
      showUHF: true,
      showSHF: true
    },
    classificationFilter: {
      showUnclassified: true,
      showConfidential: true,
      showSecret: false
    },
    refreshInterval: 10, // 10 minutes
    maxHubs: 150,
    showSignalPaths: false,
    interferenceDetection: true
  },
  
  // Legacy configurations (kept for backward compatibility)
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

  // NEW: CyberAttacks update function
  const updateCyberAttacks = (updates: Partial<CyberCommandConfig['cyberAttacks']>) => {
    setConfig(prev => ({
      ...prev,
      cyberAttacks: { ...prev.cyberAttacks, ...updates }
    }));
  };

  // NEW: CyberThreats update function
  const updateCyberThreats = (updates: Partial<CyberCommandConfig['cyberThreats']>) => {
    setConfig(prev => ({
      ...prev,
      cyberThreats: { ...prev.cyberThreats, ...updates }
    }));
  };

  // NEW: DigitalAssets update function
  const updateDigitalAssets = (updates: Partial<CyberCommandConfig['digitalAssets']>) => {
    setConfig(prev => ({
      ...prev,
      digitalAssets: { ...prev.digitalAssets, ...updates }
    }));
  };

  // NEW: CommHubs update function
  const updateCommHubs = (updates: Partial<CyberCommandConfig['commHubs']>) => {
    setConfig(prev => ({
      ...prev,
      commHubs: { ...prev.commHubs, ...updates }
    }));
  };

  // Legacy update functions (kept for backward compatibility)
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

  // UPDATED: Support all visualization types in reset
  const resetSubMode = (subMode: 'intelReports' | 'cyberAttacks' | 'cyberThreats' | 'digitalAssets' | 'commHubs' | 'timelines' | 'crisisZones' | 'globalSettings') => {
    setConfig(prev => ({
      ...prev,
      [subMode]: defaultConfig[subMode]
    }));
  };

  return {
    config,
    updateConfig,
    
    // All visualization type update functions
    updateIntelReports,
    updateCyberAttacks,
    updateCyberThreats,
    updateDigitalAssets,
    updateCommHubs,
    
    // Legacy update functions (backward compatibility)
    updateTimelines,
    updateCrisisZones,
    updateGlobalSettings,
    
    // Reset functions
    resetConfig,
    resetSubMode,
    
    // UPDATED: Convenience getter supporting all visualization types
    currentSubModeConfig: (subMode: 'IntelReports' | 'CyberAttacks' | 'CyberThreats' | 'DigitalAssets' | 'CommHubs' | 'Timelines' | 'CrisisZones') => {
      switch (subMode) {
        case 'IntelReports':
          return config.intelReports;
        case 'CyberAttacks':
          return config.cyberAttacks;
        case 'CyberThreats':
          return config.cyberThreats;
        case 'DigitalAssets':
          return config.digitalAssets;
        case 'CommHubs':
          return config.commHubs;
        case 'Timelines':
          return config.timelines;
        case 'CrisisZones':
          return config.crisisZones;
        default:
          return config.intelReports; // Fallback to IntelReports
      }
    },
    
    // Enhanced convenience getters
    isAlertsEnabled: config.crisisZones.blinkAlerts || config.crisisZones.soundAlerts,
    effectiveOpacity: config.intelReports.overlayOpacity / 100,
    animationSettings: {
      enabled: config.globalSettings.enableAnimations,
      speed: config.timelines.animationSpeed
    },
    
    // NEW: Additional convenience getters for new visualization types
    cyberAttacksRealTime: config.cyberAttacks.refreshInterval <= 10, // Real-time if <= 10 seconds
    threatIntelligenceEnabled: config.cyberThreats.confidenceThreshold > 0,
    assetSecurity: config.digitalAssets.securityScoring,
    commSecurity: config.commHubs.classificationFilter.showSecret || config.commHubs.classificationFilter.showConfidential
  };
};

export default useCyberCommandSettings;
