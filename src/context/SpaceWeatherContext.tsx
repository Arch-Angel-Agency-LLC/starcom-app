// src/context/SpaceWeatherContext.tsx
// AI-NOTE: Context for sharing space weather data and settings across components
// Bridges the gap between settings, data fetching, and Globe visualization
// Enhanced with enterprise capabilities and advanced data processing

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useSpaceWeatherData } from '../hooks/useSpaceWeatherData';
import { useEnterpriseSpaceWeatherData } from '../hooks/useEnterpriseSpaceWeatherData';
import { useVisualizationMode } from './VisualizationModeContext';
import { DataTransformService } from '../services/data-management/DataTransformService';
import { DataQualityService, DataQualityMetrics } from '../services/data-management/DataQualityService';
import { normalizeElectricFieldVectors, NormalizationConfig } from '../utils/electricFieldNormalization';
import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types';

// Data provider options
type DataProvider = 'legacy' | 'enterprise' | 'enhanced';

export interface VisualizationVector {
  latitude: number;
  longitude: number;
  magnitude: number;
  direction: number;
  quality: number;
  intensity: number; // 0-1 based on settings
  opacity: number;   // 0-1 based on settings
  color: string;
  size: number;
  // Enhanced properties (optional for backward compatibility)
  correlationScore?: number;
  qualityScore?: number;
  anomaly?: boolean;
}

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
  
  // Provider management (enhanced capabilities)
  currentProvider: DataProvider;
  switchProvider: (provider: DataProvider) => void;
  providerStatus: {
    legacy: { available: boolean; lastTested?: Date; error?: string };
    enterprise: { available: boolean; lastTested?: Date; error?: string };
    enhanced: { available: boolean; lastTested?: Date; error?: string };
  };
  
  // Enhanced data insights (optional - only available in enhanced mode)
  qualityMetrics?: DataQualityMetrics;
  enhancedAlerts: SpaceWeatherAlert[];
  
  // Computed values for visualization
  shouldShowOverlay: boolean;
  visualizationVectors: VisualizationVector[];
  
  // Enhanced feature controls
  enableDataCorrelation: boolean;
  setEnableDataCorrelation: (enabled: boolean) => void;
  enableQualityAssessment: boolean;
  setEnableQualityAssessment: (enabled: boolean) => void;
}

const SpaceWeatherContext = createContext<SpaceWeatherContextType | undefined>(undefined);

export const SpaceWeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { visualizationMode } = useVisualizationMode();
  const [currentProvider, setCurrentProvider] = useState<DataProvider>('legacy');
  const [providerStatus, setProviderStatus] = useState({
    legacy: { available: true, lastTested: new Date() },
    enterprise: { available: true, lastTested: new Date() },
    enhanced: { available: true, lastTested: new Date() }
  });
  
  // Enhanced feature flags
  const [enableDataCorrelation, setEnableDataCorrelation] = useState(false);
  const [enableQualityAssessment, setEnableQualityAssessment] = useState(false);
  
  // Enhanced data state
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics | undefined>();
  const [enhancedAlerts, setEnhancedAlerts] = useState<SpaceWeatherAlert[]>([]);

  const { 
    config, 
    updateSpaceWeather, 
    isElectricFieldsEnabled,
    vectorSettings,
    dataSettings 
  } = useEcoNaturalSettings();
  
  // Data providers
  const legacyData = useSpaceWeatherData({
    autoRefresh: currentProvider === 'legacy' ? dataSettings.autoRefresh : false,
    refreshInterval: dataSettings.refreshIntervalMs,
    enableAlerts: config.spaceWeather.showAlerts
  });

  const enterpriseData = useEnterpriseSpaceWeatherData({
    autoRefresh: ['enterprise', 'enhanced'].includes(currentProvider) ? dataSettings.autoRefresh : false,
    refreshInterval: dataSettings.refreshIntervalMs,
    enableAlerts: config.spaceWeather.showAlerts
  });

  // Get active data based on current provider
  const baseData = ['enhanced', 'enterprise'].includes(currentProvider) ? enterpriseData : legacyData;

  // Service instances for enhanced mode
  const [_transformService] = useState(() => DataTransformService.getInstance());
  const [qualityService] = useState(() => DataQualityService.getInstance());

  // Provider switching logic
  const switchProvider = useCallback((provider: DataProvider) => {
    console.log(`🔄 SpaceWeather: Switching from ${currentProvider} to ${provider} provider`);
    setCurrentProvider(provider);
    
    setProviderStatus(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        lastTested: new Date()
      }
    }));
  }, [currentProvider]);

  // Enhanced data processing for enhanced mode
  const processEnhancedData = useCallback(async () => {
    if (currentProvider !== 'enhanced' || (!enableDataCorrelation && !enableQualityAssessment)) {
      return;
    }

    if (!baseData.interMagData && !baseData.usCanadaData) {
      return;
    }

    try {
      // Quality assessment
      if (enableQualityAssessment) {
        const qualityPromises: Promise<DataQualityMetrics>[] = [];
        
        if (baseData.interMagData) {
          qualityPromises.push(qualityService.assessDataQuality(baseData.interMagData));
        }
        if (baseData.usCanadaData) {
          qualityPromises.push(qualityService.assessDataQuality(baseData.usCanadaData));
        }

        if (qualityPromises.length > 0) {
          const qualityResults = await Promise.all(qualityPromises);
          
          // Combine quality metrics (average scores)
          const combinedMetrics: DataQualityMetrics = {
            overall: qualityResults.reduce((sum, q) => sum + q.overall, 0) / qualityResults.length,
            completeness: qualityResults.reduce((sum, q) => sum + q.completeness, 0) / qualityResults.length,
            accuracy: qualityResults.reduce((sum, q) => sum + q.accuracy, 0) / qualityResults.length,
            timeliness: qualityResults.reduce((sum, q) => sum + q.timeliness, 0) / qualityResults.length,
            consistency: qualityResults.reduce((sum, q) => sum + q.consistency, 0) / qualityResults.length,
            coverage: qualityResults.reduce((sum, q) => sum + q.coverage, 0) / qualityResults.length,
            issues: qualityResults.flatMap(q => q.issues),
            recommendations: [...new Set(qualityResults.flatMap(q => q.recommendations))]
          };

          setQualityMetrics(combinedMetrics);

          // Generate quality-based alerts
          const qualityAlerts: SpaceWeatherAlert[] = [];
          for (const dataset of [baseData.interMagData, baseData.usCanadaData]) {
            if (dataset) {
              const alerts = await qualityService.validateForAlerts(dataset);
              qualityAlerts.push(...alerts);
            }
          }
          setEnhancedAlerts(qualityAlerts);

          console.log(`📊 SpaceWeather: Quality assessment complete (overall: ${(combinedMetrics.overall * 100).toFixed(1)}%)`);
        }
      }

    } catch (error) {
      console.error('❌ SpaceWeather: Enhanced processing failed:', error);
    }
  }, [baseData.interMagData, baseData.usCanadaData, currentProvider, enableDataCorrelation, enableQualityAssessment, qualityService]);

  // Monitor provider health and run enhanced processing
  useEffect(() => {
    if (baseData.error) {
      const errorMessage = `${currentProvider} provider error: ${baseData.error}`;
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

      // Auto-failover logic (enhanced -> enterprise -> legacy)
      if (currentProvider === 'enhanced' && providerStatus.enterprise.available) {
        console.log('🔄 SpaceWeather: Auto-switching to enterprise provider');
        switchProvider('enterprise');
      } else if (currentProvider === 'enterprise' && providerStatus.legacy.available) {
        console.log('🔄 SpaceWeather: Auto-switching to legacy provider');
        switchProvider('legacy');
      }
      
    } else if (baseData.lastUpdated) {
      // Provider is working
      setProviderStatus(prev => ({
        ...prev,
        [currentProvider]: {
          ...prev[currentProvider],
          available: true,
          error: undefined,
          lastTested: new Date()
        }
      }));

      // Run enhanced processing when data updates
      if (currentProvider === 'enhanced') {
        processEnhancedData();
      }
    }
  }, [baseData.error, baseData.lastUpdated, currentProvider, providerStatus, switchProvider, processEnhancedData]);

  // Check if we should show space weather visualization based on mode
  const shouldShowSpaceWeatherVisualization = (
    visualizationMode.mode === 'EcoNatural' && 
    visualizationMode.subMode === 'SpaceWeather' &&
    isElectricFieldsEnabled
  );
  const visualizationVectors = React.useMemo(() => {
    // Return empty array if not in correct visualization mode or electric fields are disabled
    if (!shouldShowSpaceWeatherVisualization) {
      return [];
    }
    
    if (!baseData.interMagData && !baseData.usCanadaData) return [];
    
    const allVectors = [
      ...(baseData.interMagData?.vectors || []),
      ...(baseData.usCanadaData?.vectors || [])
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
        // Magnitude threshold for visualization
        const magnitudeThreshold = 50 / 1000; // 50 mV converted to V
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
    baseData.interMagData, 
    baseData.usCanadaData, 
    vectorSettings, 
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
    interMagData: baseData.interMagData,
    usCanadaData: baseData.usCanadaData,
    alerts: baseData.alerts,
    isLoading: baseData.isLoading,
    error: baseData.error,
    lastUpdated: baseData.lastUpdated,
    refresh: baseData.refresh,
    
    // Provider management (enhanced capabilities)
    currentProvider,
    switchProvider,
    providerStatus,
    
    // Enhanced data insights
    qualityMetrics,
    enhancedAlerts,
    
    // Enhanced feature controls
    enableDataCorrelation,
    setEnableDataCorrelation,
    enableQualityAssessment,
    setEnableQualityAssessment,
    
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
