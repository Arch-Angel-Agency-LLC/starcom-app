/* eslint-disable react-refresh/only-export-components */
// src/context/SpaceWeatherContext.tsx
// AI-NOTE: Context for sharing space weather data and settings across components
// Bridges the gap between settings, data fetching, and Globe visualization
// Enhanced with enterprise capabilities and advanced data processing

import React, { createContext, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
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
  // Telemetry (Phase 0 diagnostics)
  telemetry: {
    rawInterMag: number;
    rawUSCanada: number;
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
      geomagnetic: { active: boolean; kp: number | null; lastUpdate: number | null };
      auroralOval: { active: boolean; resolution: string | null; lastUpdate: number | null };
      solarWind: { active: boolean; speed: number | null; density: number | null; bz: number | null; lastUpdate: number | null };
      magnetopause: { active: boolean; standoffRe: number | null; lastUpdate: number | null };
      magneticField: { active: boolean; sampleCount: number | null; lastUpdate: number | null };
    };
  };
  
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
    const cacheKey = `${baseData.interMagData?.timestamp || 'none'}|${baseData.usCanadaData?.timestamp || 'none'}|${config.spaceWeather.enhancedSampling ? 1:0}|${config.spaceWeather.normalization.method}|${config.spaceWeather.normalization.outlierFactor}|${config.spaceWeather.normalization.smoothingFactor}|${config.spaceWeather.pipelineEnabled ? 1:0}`;

    // Local static cache (scoped to provider lifetime)
  const cache = vectorCacheRef.current;
  if (cache.key === cacheKey) return cache.vectors;

    const totalStart = performance.now();
    let samplingMs = 0;
    let normalizationMs = 0;
    let degraded = false;
    const degradationStages: number[] = [];

    // Source vectors: prefer pipeline when enabled & available
    const interMagVectors = baseData.interMagData?.vectors || [];
    const usCanadaVectors = baseData.usCanadaData?.vectors || [];
    const legacyAll = [...interMagVectors, ...usCanadaVectors];
    const pipelineActive = config.spaceWeather.pipelineEnabled && pipelineVectors && pipelineVectors.length > 0;
    // When pipeline active, treat pipelineVectors as already (legacy) normalized raw domain vectors for sampling path
    interface RawVectorLike { latitude: number; longitude: number; magnitude: number; direction: number; quality: number; ex: number; ey: number; stationDistance?: number }
    function toRaw(v: ElectricFieldVector): RawVectorLike {
      return {
        latitude: v.latitude,
        longitude: v.longitude,
        magnitude: v.magnitude,
        direction: v.direction,
        quality: v.quality,
        ex: v.ex ?? 0,
        ey: v.ey ?? 0,
        stationDistance: (v as unknown as { stationDistance?: number }).stationDistance ?? 0
      };
    }
    const allVectors: RawVectorLike[] = pipelineActive
      ? pipelineVectors.map(v => ({ latitude: v.latitude, longitude: v.longitude, magnitude: v.magnitude, direction: v.direction, quality: v.quality, ex: 0, ey: 0, stationDistance: 0 }))
      : (legacyAll as ElectricFieldVector[]).map(toRaw);

    if (!allVectors.length) return [];

  const legacySamplingCap = 500;
  // Feature flag (persisted setting OR window global) for new sampling approach
  const enhancedSamplingEnabled: boolean = config.spaceWeather.enhancedSampling === true || window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING === true;

    let sampledVectors: typeof allVectors = [];
    const samplingStart = performance.now();
    if (enhancedSamplingEnabled) {
      // Provisional grid/bin sampling (simple lat/lon binning) to improve spatial fairness
  const BIN_SIZE_DEG = 5; // base grid size
      const bins = new Map<string, { v: typeof allVectors[number] }>();
      for (const v of allVectors) {
        if (v.quality < 3) continue; // quality pre-filter
        const latBin = Math.floor((v.latitude + 90) / BIN_SIZE_DEG);
        const lonBin = Math.floor((v.longitude + 180) / BIN_SIZE_DEG);
        const key = `${latBin}:${lonBin}`;
        const existing = bins.get(key);
        if (!existing) {
          bins.set(key, { v });
        } else {
          // Pick representative: higher magnitude*quality wins
            const scoreNew = v.magnitude * (v.quality || 1);
            const scoreOld = existing.v.magnitude * (existing.v.quality || 1);
            if (scoreNew > scoreOld) bins.set(key, { v });
        }
      }
      sampledVectors = Array.from(bins.values()).map(b => b.v);
    } else {
      // Legacy biased top-N sampling
      if (allVectors.length > legacySamplingCap) {
        const sortedVectors = allVectors
          .filter(v => v.quality >= 3)
          .sort((a, b) => (b.magnitude * b.quality) - (a.magnitude * a.quality));
        sampledVectors = sortedVectors.slice(0, legacySamplingCap);
      } else {
        sampledVectors = allVectors.filter(v => v.quality >= 3);
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
  const combinedRaw = allVectors.length;
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
  const isInterMag = !pipelineActive && interMagVectors.some(v => v.latitude === vector.latitude && v.longitude === vector.longitude && v.magnitude === vector.originalMagnitude);
        const datasetHue = isInterMag ? 'cyan' : 'orange';
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
  shouldShowSpaceWeatherVisualization,
  pipelineVectors
  ]);
  // Performance metrics ref
  // (perfRef already declared above)

  // Telemetry diagnostics (extended)
  const telemetry = React.useMemo(() => {
    const rawInterMag = baseData.interMagData?.vectors.length || 0;
    const rawUSCanada = baseData.usCanadaData?.vectors.length || 0;
    const combinedRaw = rawInterMag + rawUSCanada;
    const enhancedSamplingActive = config.spaceWeather.enhancedSampling === true || window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING === true;
    let gatingReason: null | 'inactiveLayer' | 'disabled' | 'noData' = null;
    if (!shouldShowSpaceWeatherVisualization) {
      if (config.spaceWeather.activeLayer !== 'electricFields') gatingReason = 'inactiveLayer';
      else if (!isElectricFieldsEnabled) gatingReason = 'disabled';
      else if (combinedRaw === 0) gatingReason = 'noData';
    }
    return {
      rawInterMag,
      rawUSCanada,
      combinedRaw,
      sampled: visualizationVectors.length,
      rendered: visualizationVectors.length,
      samplingStrategy: (enhancedSamplingActive ? 'grid-binning' : 'legacy-topN') as 'grid-binning' | 'legacy-topN',
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
      pipelineActive: !!(config.spaceWeather.pipelineEnabled && pipelineMeta),
      modes: {
        geomagnetic: { active: geomagneticActive, kp: geomagnetic.data?.kp ?? null, lastUpdate: geomagnetic.lastUpdated?.getTime() ?? null },
        auroralOval: { active: auroralOvalActive, resolution: auroralOval.data?.resolution ?? null, lastUpdate: auroralOval.lastUpdated?.getTime() ?? null },
        solarWind: { active: solarWindActive, speed: solarWind.data?.speed ?? null, density: solarWind.data?.density ?? null, bz: solarWind.data?.bz ?? null, lastUpdate: solarWind.lastUpdated?.getTime() ?? null },
        magnetopause: { active: magnetopauseActive, standoffRe: magnetopause.data?.standoffRe ?? null, lastUpdate: magnetopause.lastUpdated?.getTime() ?? null },
        magneticField: { active: magneticFieldActive, sampleCount: magneticField.data?.sampleCount ?? null, lastUpdate: magneticField.lastUpdated?.getTime() ?? null }
      }
    };
  }, [
    baseData.interMagData,
    baseData.usCanadaData,
    visualizationVectors,
    config.spaceWeather.enhancedSampling,
    config.spaceWeather.activeLayer,
    isElectricFieldsEnabled,
    shouldShowSpaceWeatherVisualization,
    pipelineMeta,
  config.spaceWeather.pipelineEnabled,
  lastPipelineError,
  geomagneticActive, auroralOvalActive, solarWindActive, magnetopauseActive, magneticFieldActive,
  geomagnetic.data, auroralOval.data, solarWind.data, magnetopause.data, magneticField.data,
  geomagnetic.lastUpdated, auroralOval.lastUpdated, solarWind.lastUpdated, magnetopause.lastUpdated, magneticField.lastUpdated
  ]);

  // Pipeline async fetch effect
  useEffect(() => {
    // Cleanup helper
    const clearTimer = () => {
      if (pipelineIntervalRef.current) {
        clearInterval(pipelineIntervalRef.current);
        pipelineIntervalRef.current = null;
      }
    };
    if (!(config.spaceWeather.pipelineEnabled && shouldShowSpaceWeatherVisualization)) {
      clearTimer();
  setPipelineVectors(null);
  setPipelineMeta(null);
  setLastPipelineError(null);
      return;
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
    return () => clearTimer();
  }, [config.spaceWeather.pipelineEnabled, shouldShowSpaceWeatherVisualization, dataSettings.refreshIntervalMs]);

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
  telemetry
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
