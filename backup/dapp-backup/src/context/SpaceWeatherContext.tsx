// src/context/SpaceWeatherContext.tsx
// AI-NOTE: Context for sharing space weather data and settings across components
// Bridges the gap between settings, data fetching, and Globe visualization
// Updated with advanced normalization for electric field visualization

import React, { createContext, useContext, ReactNode } from 'react';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useSpaceWeatherData } from '../hooks/useSpaceWeatherData';
import { useVisualizationMode } from './VisualizationModeContext';
import { normalizeElectricFieldVectors, NormalizationConfig } from '../utils/electricFieldNormalization';
import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types';

interface SpaceWeatherContextType {
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

const SpaceWeatherContext = createContext<SpaceWeatherContextType | undefined>(undefined);

export const SpaceWeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { visualizationMode } = useVisualizationMode();
  const { 
    config, 
    updateSpaceWeather, 
    isElectricFieldsEnabled,
    vectorSettings,
    alertThresholds,
    dataSettings 
  } = useEcoNaturalSettings();
  
  const spaceWeatherData = useSpaceWeatherData({
    autoRefresh: dataSettings.autoRefresh,
    refreshInterval: dataSettings.refreshIntervalMs,
    enableAlerts: config.spaceWeather.showAlerts
  });

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
    
    if (!spaceWeatherData.interMagData && !spaceWeatherData.usCanadaData) return [];
    
    const allVectors = [
      ...(spaceWeatherData.interMagData?.vectors || []),
      ...(spaceWeatherData.usCanadaData?.vectors || [])
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
    
    return normalizedVectors
      .filter(vector => {
        // Magnitude threshold (still applied to original magnitude)
        const magnitudeThreshold = alertThresholds.moderate / 1000; // Convert mV to V
        return vector.originalMagnitude >= magnitudeThreshold;
      })
      .map(vector => {
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
  }, [
    spaceWeatherData.interMagData, 
    spaceWeatherData.usCanadaData, 
    vectorSettings, 
    alertThresholds, 
    config.spaceWeather.vectorScale,
    config.spaceWeather.normalization,
    shouldShowSpaceWeatherVisualization
  ]);

  const contextValue: SpaceWeatherContextType = {
    // Settings
    settings: config.spaceWeather,
    updateSettings: updateSpaceWeather,
    isElectricFieldsEnabled,
    
    // Data
    interMagData: spaceWeatherData.interMagData,
    usCanadaData: spaceWeatherData.usCanadaData,
    alerts: spaceWeatherData.alerts,
    isLoading: spaceWeatherData.isLoading,
    error: spaceWeatherData.error,
    lastUpdated: spaceWeatherData.lastUpdated,
    refresh: spaceWeatherData.refresh,
    
    // Computed
    shouldShowOverlay: isElectricFieldsEnabled,
    visualizationVectors
  };

  return (
    <SpaceWeatherContext.Provider value={contextValue}>
      {children}
    </SpaceWeatherContext.Provider>
  );
};

export const useSpaceWeatherContext = () => {
  const context = useContext(SpaceWeatherContext);
  if (!context) {
    throw new Error('useSpaceWeatherContext must be used within a SpaceWeatherProvider');
  }
  return context;
};

export default SpaceWeatherProvider;
