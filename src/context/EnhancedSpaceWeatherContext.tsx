// Enhanced Space Weather Context with Enterprise Integration
// Phase 1: Foundation Merge - supports both legacy and enterprise data providers

import React, { createContext, ReactNode, useState, useCallback } from 'react';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useSpaceWeatherData } from '../hooks/useSpaceWeatherData';
import { useEnterpriseSpaceWeatherData } from '../hooks/useEnterpriseSpaceWeatherData';
import { useVisualizationMode } from './VisualizationModeContext';
import { normalizeElectricFieldVectors, NormalizationConfig } from '../utils/electricFieldNormalization';
import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types';

// Data provider options for Phase 1 testing
type SpaceWeatherDataProvider = 'legacy' | 'enterprise';

interface EnhancedSpaceWeatherContextType {
  // Settings
  settings: ReturnType<typeof useEcoNaturalSettings>['config']['spaceWeather'];
  updateSettings: ReturnType<typeof useEcoNaturalSettings>['updateSpaceWeather'];
  isElectricFieldsEnabled: boolean;
  
  // Data
  interMagData: ProcessedElectricFieldData | null;
  usCanadaData: ProcessedElectricFieldData | null;
  alerts: SpaceWeatherAlert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  
  // Provider management for Phase 1
  currentProvider: SpaceWeatherDataProvider;
  switchProvider: (provider: SpaceWeatherDataProvider) => void;
  providerStatus: {
    legacy: { available: boolean; lastTested?: Date; error?: string };
    enterprise: { available: boolean; lastTested?: Date; error?: string };
  };
  
  // Computed values for visualization
  shouldShowOverlay: boolean;
  visualizationVectors: Array<{
    latitude: number;
    longitude: number;
    magnitude: number;
    direction: number;
    quality: number;
    intensity: number; // 0-1 based on settings
    opacity: number;   // 0-1 based on settings
    color: string;
    size: number;
  }>;
}

const EnhancedSpaceWeatherContext = createContext<EnhancedSpaceWeatherContextType | undefined>(undefined);

export const EnhancedSpaceWeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { visualizationMode } = useVisualizationMode();
  const [currentProvider, setCurrentProvider] = useState<SpaceWeatherDataProvider>('legacy');
  const [providerStatus, setProviderStatus] = useState({
    legacy: { available: true, lastTested: new Date() },
    enterprise: { available: true, lastTested: new Date() }
  });

  const { 
    config, 
    updateSpaceWeather, 
    isElectricFieldsEnabled,
    vectorSettings,
    dataSettings 
  } = useEcoNaturalSettings();

  // Legacy data provider (existing system)
  const legacyData = useSpaceWeatherData({
    autoRefresh: currentProvider === 'legacy' ? dataSettings.autoRefresh : false,
    refreshInterval: dataSettings.refreshIntervalMs,
    enableAlerts: config.spaceWeather.showAlerts
  });

  // Enterprise data provider (new system)
  const enterpriseData = useEnterpriseSpaceWeatherData({
    autoRefresh: currentProvider === 'enterprise' ? dataSettings.autoRefresh : false,
    refreshInterval: dataSettings.refreshIntervalMs,
    enableAlerts: config.spaceWeather.showAlerts
  });

  // Provider switching logic
  const switchProvider = useCallback((provider: SpaceWeatherDataProvider) => {
    console.log(`🔄 SpaceWeather: Switching from ${currentProvider} to ${provider} provider`);
    setCurrentProvider(provider);
    
    // Update provider status
    setProviderStatus(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        lastTested: new Date()
      }
    }));
  }, [currentProvider]);

  // Get active data based on current provider
  const activeData = currentProvider === 'enterprise' ? enterpriseData : legacyData;

  // Monitor provider health and switch if necessary
  React.useEffect(() => {
    if (activeData.error) {
      const errorMessage = `${currentProvider} provider error: ${activeData.error}`;
      console.warn('🚨 SpaceWeather:', errorMessage);
      
      setProviderStatus(prev => ({
        ...prev,
        [currentProvider]: {
          ...prev[currentProvider],
          available: false,
          error: errorMessage,
          lastTested: new Date()
        }
      }));

      // Auto-failover to other provider if current fails
      const fallbackProvider: SpaceWeatherDataProvider = currentProvider === 'legacy' ? 'enterprise' : 'legacy';
      if (providerStatus[fallbackProvider].available) {
        console.log(`🔄 SpaceWeather: Auto-switching to ${fallbackProvider} provider due to error`);
        switchProvider(fallbackProvider);
      }
    } else if (activeData.lastUpdated) {
      // Provider is working - mark as available
      setProviderStatus(prev => ({
        ...prev,
        [currentProvider]: {
          ...prev[currentProvider],
          available: true,
          error: undefined,
          lastTested: new Date()
        }
      }));
    }
  }, [activeData.error, activeData.lastUpdated, currentProvider, providerStatus, switchProvider]);

  // Check if we should show space weather visualization based on mode
  const shouldShowSpaceWeatherVisualization = (
    visualizationMode.mode === 'EcoNatural' && 
    visualizationMode.subMode === 'SpaceWeather' &&
    isElectricFieldsEnabled
  );

  // Compute visualization vectors based on settings and visualization mode
  const visualizationVectors = React.useMemo(() => {
    // Return empty array if not in correct visualization mode or electric fields are disabled
    if (!shouldShowSpaceWeatherVisualization) {
      return [];
    }
    
    if (!activeData.interMagData && !activeData.usCanadaData) return [];
    
    const allVectors = [
      ...(activeData.interMagData?.vectors || []),
      ...(activeData.usCanadaData?.vectors || [])
    ];
    
    // PERFORMANCE OPTIMIZATION: Limit and batch process vectors
    const MAX_VECTORS = 500; // Further reduced from 1000 to 500 for better performance
    
    let sampledVectors;
    if (allVectors.length > MAX_VECTORS) {
      // Use intelligent sampling - prioritize high-quality, high-magnitude vectors
      const sortedVectors = allVectors
        .filter(v => v.quality >= 3) // Pre-filter for quality
        .sort((a, b) => (b.magnitude * b.quality) - (a.magnitude * a.quality)); // Sort by importance
      
      sampledVectors = sortedVectors.slice(0, MAX_VECTORS);
    } else {
      sampledVectors = allVectors.filter(v => v.quality >= 3);
    }
    
    // Apply advanced normalization only to sampled vectors
    const normalizationConfig: NormalizationConfig = {
      method: config.spaceWeather.normalization.method,
      outlierFactor: config.spaceWeather.normalization.outlierFactor,
      smoothingFactor: config.spaceWeather.normalization.smoothingFactor,
      percentileRange: config.spaceWeather.normalization.percentileRange,
      clampMax: config.spaceWeather.normalization.clampMax || undefined
    };

    const normalizedVectors = normalizeElectricFieldVectors(sampledVectors, normalizationConfig);
    
    const processedVectors = normalizedVectors.map(vector => {
      // Use normalized magnitude instead of raw magnitude
      const scaledIntensity = vector.normalizedMagnitude * vectorSettings.intensity;
      
      // Color based on normalized magnitude and percentile rank
      let color: string;
      if (vector.isOutlier) {
        // Special color for outliers - red with reduced opacity
        color = `rgba(255, 0, 0, ${Math.min(vectorSettings.opacity * 0.7, 0.8)})`;
      } else if (vector.percentileRank >= 90) {
        color = `rgba(255, 165, 0, ${vectorSettings.opacity})`;
      } else if (vector.percentileRank >= 70) {
        color = `rgba(255, 255, 0, ${vectorSettings.opacity})`;
      } else if (vector.percentileRank >= 50) {
        color = `rgba(128, 255, 0, ${vectorSettings.opacity})`;
      } else {
        color = `rgba(128, 0, 255, ${vectorSettings.opacity})`;
      }
      
      return {
        latitude: vector.latitude,
        longitude: vector.longitude,
        magnitude: vector.originalMagnitude, // Keep original for display
        direction: vector.direction,
        quality: vector.quality,
        intensity: scaledIntensity,
        opacity: vectorSettings.opacity,
        color,
        size: Math.min(Math.max(scaledIntensity * config.spaceWeather.vectorScale, 0.1), 2.0)
      };
    });
    
    console.log(`🎯 SpaceWeather (${currentProvider}): Processed ${processedVectors.length} vectors from ${allVectors.length} total`);
    return processedVectors;
  }, [
    shouldShowSpaceWeatherVisualization,
    activeData.interMagData, 
    activeData.usCanadaData,
    config.spaceWeather.normalization,
    config.spaceWeather.vectorScale,
    vectorSettings,
    currentProvider
  ]);

  const contextValue: EnhancedSpaceWeatherContextType = {
    // Settings
    settings: config.spaceWeather,
    updateSettings: updateSpaceWeather,
    isElectricFieldsEnabled,
    
    // Data from active provider
    interMagData: activeData.interMagData,
    usCanadaData: activeData.usCanadaData,
    alerts: activeData.alerts,
    isLoading: activeData.isLoading,
    error: activeData.error,
    lastUpdated: activeData.lastUpdated,
    refresh: activeData.refresh,
    
    // Provider management
    currentProvider,
    switchProvider,
    providerStatus,
    
    // Computed values
    shouldShowOverlay: shouldShowSpaceWeatherVisualization,
    visualizationVectors
  };

  return (
    <EnhancedSpaceWeatherContext.Provider value={contextValue}>
      {children}
    </EnhancedSpaceWeatherContext.Provider>
  );
};

export default EnhancedSpaceWeatherContext;
