// src/context/SpaceWeatherContext.tsx
// AI-NOTE: Context for sharing space weather data and settings across components
// Bridges the gap between settings, data fetching, and Globe visualization

import React, { createContext, useContext, ReactNode } from 'react';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useSpaceWeatherData } from '../hooks/useSpaceWeatherData';
import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types/spaceWeather';

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

  // Compute visualization vectors based on settings
  const visualizationVectors = React.useMemo(() => {
    if (!spaceWeatherData.interMagData && !spaceWeatherData.usCanadaData) return [];
    
    const allVectors = [
      ...(spaceWeatherData.interMagData?.vectors || []),
      ...(spaceWeatherData.usCanadaData?.vectors || [])
    ];
    
    return allVectors
      .filter(vector => {
        // Quality filter
        if (vector.quality < 3) return false;
        
        // Magnitude threshold
        const magnitudeThreshold = alertThresholds.moderate / 1000; // Convert mV to V
        return vector.magnitude >= magnitudeThreshold;
      })
      .map(vector => {
        const intensity = Math.min(vector.magnitude / 10, 1); // Normalize to 0-1
        const scaledIntensity = intensity * vectorSettings.intensity;
        
        // Color based on magnitude and alert thresholds
        let color: string;
        const magnitudeMv = vector.magnitude * 1000; // Convert V to mV
        if (magnitudeMv >= alertThresholds.extreme) {
          color = `rgba(255, 0, 0, ${vectorSettings.opacity})`;
        } else if (magnitudeMv >= alertThresholds.high) {
          color = `rgba(255, 165, 0, ${vectorSettings.opacity})`;
        } else if (magnitudeMv >= alertThresholds.moderate) {
          color = `rgba(255, 255, 0, ${vectorSettings.opacity})`;
        } else {
          color = `rgba(128, 0, 255, ${vectorSettings.opacity})`;
        }
        
        return {
          latitude: vector.latitude,
          longitude: vector.longitude,
          magnitude: vector.magnitude,
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
    config.spaceWeather.vectorScale
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
