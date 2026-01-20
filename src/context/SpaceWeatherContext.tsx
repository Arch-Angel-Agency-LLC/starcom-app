/* eslint-disable react-refresh/only-export-components */
// src/context/SpaceWeatherContext.tsx
// AI-NOTE: Context for sharing space weather data and settings across components
// Bridges the gap between settings, data fetching, and Globe visualization
// Enhanced with enterprise capabilities and advanced data processing

import React, { createContext, ReactNode, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ElectricFieldVector } from '../types';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useSpaceWeatherData } from '../hooks/useSpaceWeatherData';
import { useEnterpriseSpaceWeatherData } from '../hooks/useEnterpriseSpaceWeatherData';
import { useVisualizationMode } from './VisualizationModeContext';
import { DataTransformService } from '../services/data-management/DataTransformService';
import { DataQualityService, DataQualityMetrics } from '../services/data-management/DataQualityService';
import { normalizeElectricFieldVectors, NormalizationConfig } from '../utils/electricFieldNormalization';
import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types';
import { createAdapterOrchestrator } from '../services/space-weather/AdapterOrchestrator';
import { createNoaaInterMagAdapter } from '../services/space-weather/adapters/NoaaInterMagAdapter';
import { createNoaaUSCanadaAdapter } from '../services/space-weather/adapters/NoaaUSCanadaAdapter';
import { spaceWeatherDiagnostics, SpaceWeatherDiagnosticsState } from '../services/space-weather/SpaceWeatherDiagnostics';
import { visualizationResourceMonitor } from '../services/visualization/VisualizationResourceMonitor';
import { recordSpaceWeatherTelemetrySnapshot, getSpaceWeatherTelemetryHistory, type SpaceWeatherTelemetrySnapshot } from '../utils/spaceWeatherTelemetryTracker';
// Tertiary mode data hooks (Phase 1 stubs)
import { useGeomagneticData } from '../hooks/useGeomagneticData';
import { useAuroralOvalData } from '../hooks/useAuroralOvalData';
import { useSolarWindData } from '../hooks/useSolarWindData';
import { useMagnetopauseData } from '../hooks/useMagnetopauseData';
import { useMagneticFieldData } from '../hooks/useMagneticFieldData';

// Global flag typing for enhanced sampling (Phase 0)
declare global {
  interface Window {
    STARCOM_SPACEWEATHER_ENHANCED_SAMPLING?: boolean;
  }
}

// Data provider options
type DataProvider = 'legacy' | 'enterprise' | 'enhanced';

const SPACE_WEATHER_MODE_KEY = 'EcoNatural.SpaceWeather' as const;
const VECTOR_BYTES_ESTIMATE = 64;
const PIPELINE_VECTOR_BYTES_ESTIMATE = 48;
const DIAGNOSTIC_ENTRY_BYTES_ESTIMATE = 128;

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

export interface SpaceWeatherContextType {
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
  // Telemetry (Phase 0 diagnostics)
  telemetry: {
    rawInterMag: number;
    rawUSCanada: number;
    rawPipeline: number;
    combinedRaw: number;
    sampled: number;
    rendered: number;
    samplingStrategy: 'legacy-topN' | 'grid-binning';
    unit: 'mV/km';
  gatingReason: null | 'inactiveLayer' | 'disabled' | 'noData';
  timings: { samplingMs: number; normalizationMs: number; totalMs: number };
  degraded: boolean;
  degradationStages: number[]; // numeric stage markers applied this cycle
  pipeline: null | { adapterCount: number; failures: number; fetchMs: number; totalVectors: number; lastFetch: number; lastError: string | null };
  pipelineActive: boolean;
    // Tertiary visualization modes (stub telemetry Phase 1)
    modes: {
      geomagnetic: { active: boolean; kp: number | null; lastUpdate: number | null; quality?: 'live' | 'fallback' | 'stale' };
      auroralOval: { active: boolean; resolution: string | null; lastUpdate: number | null; quality?: 'live' | 'fallback' | 'stale' };
      solarWind: { active: boolean; speed: number | null; density: number | null; bz: number | null; lastUpdate: number | null; quality?: 'live' | 'fallback' | 'stale' };
      magnetopause: { active: boolean; standoffRe: number | null; lastUpdate: number | null; quality?: 'live' | 'fallback' | 'stale' };
      magneticField: { active: boolean; sampleCount: number | null; lastUpdate: number | null; quality?: 'live' | 'fallback' | 'stale' };
    };
    diagnostics: SpaceWeatherDiagnosticsState;
  };
  telemetryHistory: SpaceWeatherTelemetrySnapshot[];
  diagnostics: SpaceWeatherDiagnosticsState;
  
  // Enhanced feature controls
  enableDataCorrelation: boolean;
  setEnableDataCorrelation: (enabled: boolean) => void;
  enableQualityAssessment: boolean;
  setEnableQualityAssessment: (enabled: boolean) => void;
}

export const SpaceWeatherContext = createContext<SpaceWeatherContextType | undefined>(undefined);

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
  // Pipeline state (Phase 1 wiring)
  const [pipelineVectors, setPipelineVectors] = useState<VisualizationVector[] | null>(null);
  const [pipelineMeta, setPipelineMeta] = useState<null | { adapterCount: number; fetchMs: number; failures: number; totalVectors: number; lastFetch: number }>(null);
  const [lastPipelineError, setLastPipelineError] = useState<string | null>(null);
  const pipelineIntervalRef = useRef<number | null>(null);
  const orchestratorRef = useRef<ReturnType<typeof createAdapterOrchestrator> | null>(null);
  const [diagnosticsState, setDiagnosticsState] = useState<SpaceWeatherDiagnosticsState>(() => spaceWeatherDiagnostics.getState());

  // Subscribe to diagnostics store so context stays in sync with backend instrumentation
  useEffect(() => {
    const unsubscribe = spaceWeatherDiagnostics.subscribe(setDiagnosticsState);
    return () => unsubscribe();
  }, []);

  const { 
    config, 
    updateSpaceWeather, 
    isElectricFieldsEnabled,
    vectorSettings,
    dataSettings 
  } = useEcoNaturalSettings();

  // Tertiary mode activation flags
  const geomagneticActive = config.spaceWeather.showGeomagneticIndex === true;
  const auroralOvalActive = config.spaceWeather.showAuroralOval === true;
  const solarWindActive = config.spaceWeather.showSolarWind === true;
  const magnetopauseActive = config.spaceWeather.showMagnetopause === true;
  const magneticFieldActive = config.spaceWeather.showMagneticField === true;

  // Mode data hooks (mock/stub data)
  const geomagnetic = useGeomagneticData(geomagneticActive);
  const auroralOval = useAuroralOvalData(auroralOvalActive);
  const solarWind = useSolarWindData(solarWindActive);
  const magnetopause = useMagnetopauseData(magnetopauseActive);
  const magneticField = useMagneticFieldData(magneticFieldActive);
  
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
  const activeLayer = config.spaceWeather.activeLayer;
  const shouldShowSpaceWeatherVisualization = (
    visualizationMode.mode === 'EcoNatural' &&
    visualizationMode.subMode === 'SpaceWeather' &&
    activeLayer === 'electricFields' &&
    isElectricFieldsEnabled
  );
  // Performance metrics ref must be defined before hooks that reference it
  const perfRef = React.useRef({ samplingMs: 0, normalizationMs: 0, totalMs: 0, degraded: false, degradationStages: [] as number[] });
  // Instance-scoped vector cache (avoids cross-provider leakage)
  const vectorCacheRef = React.useRef<{ key?: string; vectors: VisualizationVector[] }>({ key: undefined, vectors: [] });

  const visualizationVectors = React.useMemo(() => {
    // Return empty array if not in correct visualization mode or electric fields are disabled
    if (!shouldShowSpaceWeatherVisualization) {
      return [];
    }
    
    // Simple cache key (timestamps + key normalization settings + flags)
    const cacheKey = [
      baseData.interMagData?.timestamp || 'none',
      baseData.usCanadaData?.timestamp || 'none',
      config.spaceWeather.enhancedSampling ? 1 : 0,
      config.spaceWeather.samplingMode || 'legacy-topN',
      config.spaceWeather.gridBinSize,
      config.spaceWeather.legacyCap,
      config.spaceWeather.magnitudeFloor,
      config.spaceWeather.normalization.method,
      config.spaceWeather.normalization.outlierFactor,
      config.spaceWeather.normalization.smoothingFactor,
      config.spaceWeather.pipelineEnabled ? 1 : 0,
      config.spaceWeather.enabledDatasets.intermag ? 1 : 0,
      config.spaceWeather.enabledDatasets.usCanada ? 1 : 0,
      config.spaceWeather.enabledDatasets.pipeline ? 1 : 0
    ].join('|');

    // Local static cache (scoped to provider lifetime)
  const cache = vectorCacheRef.current;
  if (cache.key === cacheKey) return cache.vectors;

    const totalStart = performance.now();
    let samplingMs = 0;
    let normalizationMs = 0;
    let degraded = false;
    const degradationStages: number[] = [];

    // Source vectors: prefer pipeline when enabled & available
    const pipelineDatasetEnabled = config.spaceWeather.enabledDatasets.pipeline;
    const pipelineActive = config.spaceWeather.pipelineEnabled && pipelineDatasetEnabled && pipelineVectors && pipelineVectors.length > 0;
    // When pipeline active, treat pipelineVectors as already (legacy) normalized raw domain vectors for sampling path
    type VectorDataset = 'intermag' | 'uscanada' | 'pipeline';
    interface RawVectorLike {
      latitude: number;
      longitude: number;
      magnitude: number;
      direction: number;
      quality: number;
      ex: number;
      ey: number;
      stationDistance?: number;
      dataset?: VectorDataset;
    }
    function toRaw(v: ElectricFieldVector, dataset: VectorDataset): RawVectorLike {
      return {
        latitude: v.latitude,
        longitude: v.longitude,
        magnitude: v.magnitude,
        direction: v.direction,
        quality: v.quality,
        ex: v.ex ?? 0,
        ey: v.ey ?? 0,
        stationDistance: (v as unknown as { stationDistance?: number }).stationDistance ?? 0,
        dataset
      };
    }
    const rawInterMagVectors = baseData.interMagData?.vectors || [];
    const rawUSCanadaVectors = baseData.usCanadaData?.vectors || [];
    const interMagVectors = config.spaceWeather.enabledDatasets.intermag ? rawInterMagVectors : [];
    const usCanadaVectors = config.spaceWeather.enabledDatasets.usCanada ? rawUSCanadaVectors : [];

    const sourceVectors: RawVectorLike[] = pipelineActive
      ? pipelineVectors.map(v => ({ latitude: v.latitude, longitude: v.longitude, magnitude: v.magnitude, direction: v.direction, quality: v.quality, ex: 0, ey: 0, stationDistance: 0, dataset: 'pipeline' }))
      : [
          ...(interMagVectors as ElectricFieldVector[]).map(vec => toRaw(vec, 'intermag')),
          ...(usCanadaVectors as ElectricFieldVector[]).map(vec => toRaw(vec, 'uscanada'))
        ];

    if (!sourceVectors.length) return [];

    const magnitudeFloor = Math.max(0, config.spaceWeather.magnitudeFloor ?? 0);
    const filteredVectors = magnitudeFloor > 0
      ? sourceVectors.filter(v => Math.abs(v.magnitude) >= magnitudeFloor)
      : sourceVectors;

    if (!filteredVectors.length) return [];

    const legacySamplingCap = Math.max(50, config.spaceWeather.legacyCap ?? 500);
    // Feature flag (persisted setting OR window global) for new sampling approach
    const enhancedSamplingEnabled: boolean = config.spaceWeather.enhancedSampling === true || window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING === true;
    const samplingModeSetting: 'legacy-topN' | 'grid-binning' = config.spaceWeather.samplingMode || (enhancedSamplingEnabled ? 'grid-binning' : 'legacy-topN');
    const useGridSampling = samplingModeSetting === 'grid-binning';
    const gridBinSize = Math.max(1, config.spaceWeather.gridBinSize ?? 5);

    let sampledVectors: RawVectorLike[] = [];
    const samplingStart = performance.now();
    const gridSampleVectors = (vectors: RawVectorLike[]) => {
      const bins = new Map<string, RawVectorLike>();
      for (const v of vectors) {
        if (v.quality < 3) continue; // quality pre-filter
        const latBin = Math.floor((v.latitude + 90) / gridBinSize);
        const lonBin = Math.floor((v.longitude + 180) / gridBinSize);
        const key = `${latBin}:${lonBin}`;
        const existing = bins.get(key);
        if (!existing) {
          bins.set(key, v);
        } else {
          const scoreNew = v.magnitude * (v.quality || 1);
          const scoreOld = existing.magnitude * (existing.quality || 1);
          if (scoreNew > scoreOld) bins.set(key, v);
        }
      }
      return Array.from(bins.values());
    };

    if (useGridSampling) {
      if (pipelineActive) {
        sampledVectors = gridSampleVectors(filteredVectors);
      } else {
        // Ensure each legacy feed contributes representatives per spatial bin
        const interMagSampled = gridSampleVectors(filteredVectors.filter(v => v.dataset === 'intermag'));
        const usCanadaSampled = gridSampleVectors(filteredVectors.filter(v => v.dataset === 'uscanada'));
        sampledVectors = [...interMagSampled, ...usCanadaSampled];
      }
    } else {
      // Legacy biased top-N sampling
      if (filteredVectors.length > legacySamplingCap) {
        const sortedVectors = filteredVectors
          .filter(v => v.quality >= 3)
          .sort((a, b) => (b.magnitude * b.quality) - (a.magnitude * a.quality));
        sampledVectors = sortedVectors.slice(0, legacySamplingCap);
      } else {
        sampledVectors = filteredVectors.filter(v => v.quality >= 3);
      }
    }
    samplingMs = performance.now() - samplingStart;
    
    // Apply advanced normalization only to sampled vectors
    let normalizationConfig: NormalizationConfig = {
      method: config.spaceWeather.normalization.method,
      outlierFactor: config.spaceWeather.normalization.outlierFactor,
      smoothingFactor: config.spaceWeather.normalization.smoothingFactor,
      percentileRange: config.spaceWeather.normalization.percentileRange,
      clampMax: config.spaceWeather.normalization.clampMax || undefined
    };
    
    // Adaptive degradation triggers
  const combinedRaw = filteredVectors.length;
    const adaptiveStart = performance.now();
    // Bridge type for normalization (expects ElectricFieldVector shape). Pipeline-injected vectors include minimal ex/ey.
  const normalizedVectorsPrePass = normalizeElectricFieldVectors(sampledVectors as unknown as ElectricFieldVector[], normalizationConfig);
    normalizationMs = performance.now() - adaptiveStart;

    if (combinedRaw > 2500) { degraded = true; degradationStages.push(1); }
    if (normalizationMs > 30) { degraded = true; degradationStages.push(2); }

    // Degradation adjustments (simple for now)
    if (degraded) {
      // Remove smoothing & lighten method if adaptive heavy path selected
      if (normalizationConfig.method === 'adaptive' || normalizationConfig.smoothingFactor) {
        normalizationConfig = { ...normalizationConfig, method: 'percentile', smoothingFactor: 0 };
        degradationStages.push(3);
      }
    }

    const normalizedVectors = (degraded && (normalizationConfig.method !== config.spaceWeather.normalization.method || normalizationConfig.smoothingFactor === 0))
  ? normalizeElectricFieldVectors(sampledVectors as unknown as ElectricFieldVector[], normalizationConfig)
      : normalizedVectorsPrePass;
    
  const finalVectors = normalizedVectors
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
        
        // Dataset hue shift (Phase 0 differentiation)
  // Determine dataset by approximate matching (compare coordinates & magnitude) – Phase 0 lightweight approach
        const datasetTag = (vector as typeof vector & { dataset?: VectorDataset }).dataset;
        const datasetHue = pipelineActive
          ? 'white'
          : datasetTag === 'intermag'
            ? 'cyan'
            : datasetTag === 'uscanada'
              ? 'orange'
              : 'magenta';
        // Blend dataset hue with magnitude-based color by simple precedence (keep existing ramp if high percentile)
        const finalColor = vector.percentileRank >= 50 ? color : (datasetHue === 'cyan' ? `rgba(0,200,255,${vectorSettings.opacity})` : `rgba(255,140,0,${vectorSettings.opacity})`);
        const result = {
          latitude: vector.latitude,
          longitude: vector.longitude,
          magnitude: vector.originalMagnitude, // Keep original for display
          direction: vector.direction,
          quality: vector.quality,
          intensity: scaledIntensity,
          opacity: vectorSettings.opacity,
          color: finalColor,
          size: Math.min(Math.max(scaledIntensity * config.spaceWeather.vectorScale, 0.1), 2.0)
        };
        return result;
      });
    // Record performance metrics
    const totalMs = performance.now() - totalStart;
    perfRef.current = { samplingMs, normalizationMs, totalMs, degraded, degradationStages };
    // Update cache
  cache.key = cacheKey;
  cache.vectors = finalVectors;
    return finalVectors;
  }, [
    baseData.interMagData, 
    baseData.usCanadaData, 
    vectorSettings, 
    config.spaceWeather.vectorScale,
    config.spaceWeather.normalization,
  config.spaceWeather.pipelineEnabled,
  config.spaceWeather.enhancedSampling,
  config.spaceWeather.enabledDatasets,
  config.spaceWeather.gridBinSize,
  config.spaceWeather.legacyCap,
  config.spaceWeather.magnitudeFloor,
  config.spaceWeather.samplingMode,
  shouldShowSpaceWeatherVisualization,
  pipelineVectors
  ]);
  // Performance metrics ref
  // (perfRef already declared above)

  // Telemetry diagnostics (extended)
  const telemetry = React.useMemo(() => {
    const datasetPrefs = config.spaceWeather.enabledDatasets;
    const rawInterMagTotal = baseData.interMagData?.vectors.length || 0;
    const rawUSCanadaTotal = baseData.usCanadaData?.vectors.length || 0;
    const pipelineCountTotal = pipelineVectors?.length || 0;
    const rawInterMag = datasetPrefs.intermag ? rawInterMagTotal : 0;
    const rawUSCanada = datasetPrefs.usCanada ? rawUSCanadaTotal : 0;
    const rawPipeline = datasetPrefs.pipeline ? pipelineCountTotal : 0;
    const enhancedSamplingFlag = config.spaceWeather.enhancedSampling === true || window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING === true;
    const samplingModeSetting: 'legacy-topN' | 'grid-binning' = config.spaceWeather.samplingMode || (enhancedSamplingFlag ? 'grid-binning' : 'legacy-topN');
    const combinedRaw = rawInterMag + rawUSCanada + rawPipeline;
    let gatingReason: null | 'inactiveLayer' | 'disabled' | 'noData' = null;
    if (!shouldShowSpaceWeatherVisualization) {
      if (config.spaceWeather.activeLayer !== 'electricFields') gatingReason = 'inactiveLayer';
      else if (!isElectricFieldsEnabled) gatingReason = 'disabled';
      else if (combinedRaw === 0) gatingReason = 'noData';
    }
    return {
      rawInterMag,
      rawUSCanada,
      rawPipeline,
      combinedRaw,
      sampled: visualizationVectors.length,
      rendered: visualizationVectors.length,
      samplingStrategy: samplingModeSetting,
      unit: 'mV/km' as const,
      gatingReason,
      timings: { samplingMs: perfRef.current.samplingMs, normalizationMs: perfRef.current.normalizationMs, totalMs: perfRef.current.totalMs },
      degraded: perfRef.current.degraded,
      degradationStages: perfRef.current.degradationStages,
      // Pipeline extension (null when inactive)
      pipeline: pipelineMeta ? {
        adapterCount: pipelineMeta.adapterCount,
        failures: pipelineMeta.failures,
        fetchMs: pipelineMeta.fetchMs,
        totalVectors: pipelineMeta.totalVectors,
        lastFetch: pipelineMeta.lastFetch,
        lastError: lastPipelineError
      } : null,
      pipelineActive: !!(config.spaceWeather.pipelineEnabled && datasetPrefs.pipeline && pipelineMeta),
      modes: {
        geomagnetic: { active: geomagneticActive, kp: geomagnetic.data?.kp ?? null, lastUpdate: geomagnetic.lastUpdated?.getTime() ?? null, quality: geomagnetic.data?.quality ?? 'live' },
        auroralOval: { active: auroralOvalActive, resolution: auroralOval.data?.resolution ?? null, lastUpdate: auroralOval.lastUpdated?.getTime() ?? null, quality: auroralOval.data?.quality ?? 'live' },
        solarWind: { active: solarWindActive, speed: solarWind.data?.speed ?? null, density: solarWind.data?.density ?? null, bz: solarWind.data?.bz ?? null, lastUpdate: solarWind.lastUpdated?.getTime() ?? null, quality: solarWind.data?.quality ?? 'live' },
        magnetopause: { active: magnetopauseActive, standoffRe: magnetopause.data?.standoffRe ?? null, lastUpdate: magnetopause.lastUpdated?.getTime() ?? null, quality: magnetopause.data?.quality ?? 'live' },
        magneticField: { active: magneticFieldActive, sampleCount: magneticField.data?.sampleCount ?? null, lastUpdate: magneticField.lastUpdated?.getTime() ?? null, quality: magneticField.data?.quality ?? 'live' }
      },
      diagnostics: diagnosticsState
    };
  }, [
    baseData.interMagData,
    baseData.usCanadaData,
    visualizationVectors,
    config.spaceWeather.enhancedSampling,
    config.spaceWeather.samplingMode,
    config.spaceWeather.activeLayer,
    config.spaceWeather.enabledDatasets,
    isElectricFieldsEnabled,
    shouldShowSpaceWeatherVisualization,
    pipelineMeta,
  config.spaceWeather.pipelineEnabled,
  pipelineVectors,
  lastPipelineError,
  geomagneticActive, auroralOvalActive, solarWindActive, magnetopauseActive, magneticFieldActive,
  geomagnetic.data, auroralOval.data, solarWind.data, magnetopause.data, magneticField.data,
  geomagnetic.lastUpdated, auroralOval.lastUpdated, solarWind.lastUpdated, magnetopause.lastUpdated, magneticField.lastUpdated,
  diagnosticsState
  ]);

  // Phase 2.4: telemetry snapshot tracker
  useEffect(() => {
    recordSpaceWeatherTelemetrySnapshot({
      provider: currentProvider,
      activeLayer: config.spaceWeather.activeLayer,
      samplingStrategy: telemetry.samplingStrategy,
      rawInterMag: telemetry.rawInterMag,
      rawUSCanada: telemetry.rawUSCanada,
      rawPipeline: telemetry.rawPipeline,
      combinedRaw: telemetry.combinedRaw,
      sampled: telemetry.sampled,
      rendered: telemetry.rendered,
      gatingReason: telemetry.gatingReason,
      datasetFlags: {
        intermag: config.spaceWeather.enabledDatasets.intermag,
        usCanada: config.spaceWeather.enabledDatasets.usCanada,
        pipeline: config.spaceWeather.enabledDatasets.pipeline
      },
      pipeline: telemetry.pipeline
        ? {
            totalVectors: telemetry.pipeline.totalVectors,
            failures: telemetry.pipeline.failures,
            lastFetch: telemetry.pipeline.lastFetch ?? null,
            active: telemetry.pipelineActive
          }
        : undefined,
      degradationStages: telemetry.degradationStages
    });
  }, [
    telemetry.rawInterMag,
    telemetry.rawUSCanada,
    telemetry.rawPipeline,
    telemetry.combinedRaw,
    telemetry.sampled,
    telemetry.rendered,
    telemetry.samplingStrategy,
    telemetry.pipeline ? telemetry.pipeline.totalVectors : null,
    telemetry.pipeline ? telemetry.pipeline.failures : null,
    telemetry.pipeline ? telemetry.pipeline.lastFetch : null,
    telemetry.gatingReason,
    telemetry.degradationStages,
    telemetry.pipelineActive,
    config.spaceWeather.activeLayer,
    config.spaceWeather.enabledDatasets,
    currentProvider
  ]);

  const telemetryHistory = useMemo(() => getSpaceWeatherTelemetryHistory(), [
    telemetry.rawInterMag,
    telemetry.rawUSCanada,
    telemetry.rawPipeline,
    telemetry.sampled,
    telemetry.rendered,
    telemetry.samplingStrategy,
    telemetry.gatingReason,
    telemetry.pipeline ? telemetry.pipeline.totalVectors : null,
    telemetry.degradationStages,
    telemetry.pipelineActive,
    config.spaceWeather.activeLayer,
    currentProvider
  ]);

  // Pipeline async fetch effect
  useEffect(() => {
    const clearTimer = () => {
      if (pipelineIntervalRef.current) {
        clearInterval(pipelineIntervalRef.current);
        pipelineIntervalRef.current = null;
      }
    };

    const disposeOrchestrator = () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.clear();
        orchestratorRef.current = null;
      }
    };

    const resetPipelineState = () => {
      setPipelineVectors(null);
      setPipelineMeta(null);
      setLastPipelineError(null);
      vectorCacheRef.current = { key: undefined, vectors: [] };
      visualizationResourceMonitor.clearMode(SPACE_WEATHER_MODE_KEY);
    };

    const tearDownPipeline = () => {
      clearTimer();
      disposeOrchestrator();
      resetPipelineState();
    };

    if (!(config.spaceWeather.pipelineEnabled && config.spaceWeather.enabledDatasets.pipeline && shouldShowSpaceWeatherVisualization)) {
      tearDownPipeline();
      return () => tearDownPipeline();
    }
    // Lazy init orchestrator
    if (!orchestratorRef.current) {
      try {
        orchestratorRef.current = createAdapterOrchestrator()
          .register(createNoaaInterMagAdapter())
          .register(createNoaaUSCanadaAdapter());
      } catch (e) {
        console.warn('Pipeline orchestrator creation failed', e);
        return;
      }
    }
    const fetchPipeline = async () => {
      if (!orchestratorRef.current) return;
      try {
        const start = performance.now();
        const result = await orchestratorRef.current.fetchAll();
        const fetchMs = performance.now() - start;
        setPipelineMeta({
          adapterCount: result.metrics.adapterCount,
          fetchMs,
          failures: result.metrics.failures,
          totalVectors: result.metrics.totalVectors,
          lastFetch: Date.now()
        });
        setLastPipelineError(null);
        // Adapt vectors minimally (VisualizationVector partial); further normalization occurs in memo
        setPipelineVectors(result.vectors.map(v => ({
          latitude: v.latitude,
          longitude: v.longitude,
          magnitude: v.magnitude,
          direction: v.direction,
          quality: v.quality,
          intensity: 1,
          opacity: 1,
          color: '#fff',
          size: 1
        })));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown pipeline error';
        console.warn('Pipeline fetch failed', message);
        setLastPipelineError(message);
        setPipelineMeta(prev => ({
          adapterCount: prev?.adapterCount ?? 0,
          fetchMs: prev?.fetchMs ?? 0,
          failures: (prev?.failures ?? 0) + 1,
          totalVectors: prev?.totalVectors ?? 0,
          lastFetch: Date.now()
        }));
      }
    };
    // Initial fetch
    fetchPipeline();
    // Schedule
    const intervalMs = Math.max(15_000, dataSettings.refreshIntervalMs || 60_000); // floor 15s
    pipelineIntervalRef.current = window.setInterval(fetchPipeline, intervalMs);
    return () => {
      tearDownPipeline();
    };
  }, [config.spaceWeather.pipelineEnabled, config.spaceWeather.enabledDatasets, shouldShowSpaceWeatherVisualization, dataSettings.refreshIntervalMs]);

  // Resource instrumentation: capture vector counts, diagnostics footprint, and heap usage when data changes
  useEffect(() => {
    if (!shouldShowSpaceWeatherVisualization) {
      visualizationResourceMonitor.clearMode(SPACE_WEATHER_MODE_KEY);
      return;
    }

    const vectorCount = visualizationVectors.length;
    visualizationResourceMonitor.recordVectors(SPACE_WEATHER_MODE_KEY, {
      count: vectorCount,
      approxBytes: vectorCount * VECTOR_BYTES_ESTIMATE
    });

    const pipelineCount = pipelineVectors?.length ?? 0;
    visualizationResourceMonitor.recordPipelineVectors(SPACE_WEATHER_MODE_KEY, {
      count: pipelineCount,
      approxBytes: pipelineCount * PIPELINE_VECTOR_BYTES_ESTIMATE
    });

    const diagnosticsEntries = (
      diagnosticsState.cache.snapshot.length +
      diagnosticsState.providers.entries.length +
      diagnosticsState.adapters.entries.length
    );
    visualizationResourceMonitor.recordDiagnosticsUsage(
      SPACE_WEATHER_MODE_KEY,
      diagnosticsEntries,
      diagnosticsEntries * DIAGNOSTIC_ENTRY_BYTES_ESTIMATE
    );

    const cachedVectors = vectorCacheRef.current.vectors.length;
    visualizationResourceMonitor.recordOverlayCache(
      SPACE_WEATHER_MODE_KEY,
      cachedVectors * VECTOR_BYTES_ESTIMATE
    );

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      visualizationResourceMonitor.recordHeap(SPACE_WEATHER_MODE_KEY, mem.usedJSHeapSize, mem.jsHeapSizeLimit);
    }
  }, [shouldShowSpaceWeatherVisualization, visualizationVectors, pipelineVectors, diagnosticsState]);

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
  shouldShowOverlay: shouldShowSpaceWeatherVisualization,
  visualizationVectors,
    telemetry,
    telemetryHistory,
    diagnostics: diagnosticsState
  };

  return (
    <SpaceWeatherContext.Provider value={contextValue}>
      {children}
    </SpaceWeatherContext.Provider>
  );
};

export default SpaceWeatherProvider;

export const useSpaceWeatherContext = () => {
  const ctx = React.useContext(SpaceWeatherContext);
  if (!ctx) throw new Error('useSpaceWeatherContext must be used within a SpaceWeatherProvider');
  return ctx;
};
