// Bridge hook to connect enterprise NOAADataProvider to legacy SpaceWeather visualization
// Phase 1: Foundation Merge - maintains same interface as useSpaceWeatherData

import { useState, useEffect, useCallback } from 'react';
import { NOAADataProvider } from '../services/data-management/providers/NOAADataProvider';
import { generateSpaceWeatherAlerts } from '../services/noaaSpaceWeather';
import { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types';
import type { NOAAElectricFieldData as EnterpriseElectricFieldData } from '../services/data-management/providers/NOAADataTypes';
import type { NOAAElectricFieldData as LegacyElectricFieldData, ElectricFieldVector } from '../types/data/spaceWeather';

interface UseEnterpriseSpaceWeatherData {
  interMagData: ProcessedElectricFieldData | null;
  usCanadaData: ProcessedElectricFieldData | null;
  alerts: SpaceWeatherAlert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

interface UseEnterpriseSpaceWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableAlerts?: boolean;
}

export const useEnterpriseSpaceWeatherData = (
  options: UseEnterpriseSpaceWeatherOptions = {}
): UseEnterpriseSpaceWeatherData => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    enableAlerts = true
  } = options;

  const [interMagData, setInterMagData] = useState<ProcessedElectricFieldData | null>(null);
  const [usCanadaData, setUsCanadaData] = useState<ProcessedElectricFieldData | null>(null);
  const [alerts, setAlerts] = useState<SpaceWeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [noaaProvider] = useState(() => new NOAADataProvider());

  const fetchData = useCallback(async (_forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both electric field datasets using enterprise provider
      console.log('🔄 Enterprise: Fetching InterMag electric field data...');
      const interMagRaw = await noaaProvider.fetchData('electric-field-intermag');
      
      console.log('🔄 Enterprise: Fetching US-Canada electric field data...');
      const usCanadaRaw = await noaaProvider.fetchData('electric-field-us-canada');

      // Transform raw data using the same logic as legacy system
      // Note: In Phase 2, this will move to enterprise transform pipeline
      if (interMagRaw && typeof interMagRaw === 'object' && 'features' in interMagRaw) {
        const processedInterMag = transformElectricFieldData(
          interMagRaw as EnterpriseElectricFieldData, 
          'InterMagEarthScope'
        );
        setInterMagData(processedInterMag);
        console.log(`✅ Enterprise: Processed ${processedInterMag.vectors.length} InterMag vectors`);
      }

      if (usCanadaRaw && typeof usCanadaRaw === 'object' && 'features' in usCanadaRaw) {
        const processedUsCanada = transformElectricFieldData(
          usCanadaRaw as EnterpriseElectricFieldData, 
          'US-Canada-1D'
        );
        setUsCanadaData(processedUsCanada);
        console.log(`✅ Enterprise: Processed ${processedUsCanada.vectors.length} US-Canada vectors`);
      }

      // Generate alerts if enabled
      const generatedAlerts: SpaceWeatherAlert[] = [];
      if (enableAlerts) {
        try {
          if (interMagRaw && typeof interMagRaw === 'object' && 'features' in interMagRaw) {
            // Convert enterprise format to legacy format for alert generation
            const legacyFormat = convertToLegacyFormat(interMagRaw as EnterpriseElectricFieldData);
            const interMagAlerts = generateSpaceWeatherAlerts(legacyFormat);
            generatedAlerts.push(...interMagAlerts);
          }
          if (usCanadaRaw && typeof usCanadaRaw === 'object' && 'features' in usCanadaRaw) {
            const legacyFormat = convertToLegacyFormat(usCanadaRaw as EnterpriseElectricFieldData);
            const usCanadaAlerts = generateSpaceWeatherAlerts(legacyFormat);
            generatedAlerts.push(...usCanadaAlerts);
          }
          setAlerts(generatedAlerts);
          console.log(`📊 Enterprise: Generated ${generatedAlerts.length} space weather alerts`);
        } catch (alertError) {
          console.warn('Enterprise: Alert generation failed:', alertError);
          // Don't fail the entire operation for alert errors
        }
      }

      setLastUpdated(new Date());
      console.log('🎉 Enterprise: Space weather data fetch completed successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Enterprise provider failed: ${errorMessage}`);
      console.error('Enterprise space weather data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enableAlerts, noaaProvider]);

  const refresh = useCallback(async () => {
    await fetchData(true); // Force refresh bypasses cache
  }, [fetchData]);

  const clearCache = useCallback(() => {
    // Enterprise provider manages its own cache
    // For Phase 1, we reset local state
    setInterMagData(null);
    setUsCanadaData(null);
    setAlerts([]);
    setLastUpdated(null);
    setError(null);
    console.log('🧹 Enterprise: Cache cleared');
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    interMagData,
    usCanadaData,
    alerts,
    isLoading,
    error,
    lastUpdated,
    refresh,
    clearCache
  };
};

/**
 * Convert enterprise NOAA format to legacy format for alert generation
 * Temporary helper for Phase 1 compatibility
 */
function convertToLegacyFormat(enterpriseData: EnterpriseElectricFieldData): LegacyElectricFieldData {
  return {
    time_tag: enterpriseData.time_tag || new Date().toISOString().split('T')[0],
    cadence: 60, // Default cadence
    product_version: enterpriseData.network === 'InterMag' ? "InterMagEarthScope" : "US-Canada-1D",
    type: "FeatureCollection",
    features: enterpriseData.features.map(feature => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: feature.geometry.coordinates
      },
      properties: {
        Ex: feature.properties.Ex,
        Ey: feature.properties.Ey,
        quality_flag: feature.properties.quality_flag,
        distance_nearest_station: feature.properties.distance_nearest_station || 0
      }
    }))
  };
}

/**
 * Transform raw NOAA electric field data to processed format
 * This duplicates logic from useSpaceWeatherData.ts for Phase 1
 * In Phase 2, this will move to enterprise transform pipeline
 */
function transformElectricFieldData(
  rawData: EnterpriseElectricFieldData, 
  source: 'InterMagEarthScope' | 'US-Canada-1D'
): ProcessedElectricFieldData {
  const vectors: ElectricFieldVector[] = rawData.features.map((f) => ({
    longitude: f.geometry.coordinates[0],
    latitude: f.geometry.coordinates[1],
    ex: f.properties.Ex,
    ey: f.properties.Ey,
    magnitude: Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2),
    direction: Math.atan2(f.properties.Ey, f.properties.Ex) * (180 / Math.PI),
    quality: f.properties.quality_flag || 1,
    stationDistance: f.properties.distance_nearest_station || 0
  }));

  const latitudes = vectors.map((v) => v.latitude);
  const longitudes = vectors.map((v) => v.longitude);
  const magnitudes = vectors.map((v) => v.magnitude);

  return {
    timestamp: rawData.time_tag || new Date().toISOString(),
    source,
    vectors,
    coverage: {
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
      minLon: Math.min(...longitudes),
      maxLon: Math.max(...longitudes)
    },
    statistics: {
      totalPoints: vectors.length,
      highQualityPoints: vectors.filter((v) => v.quality >= 3).length,
      maxFieldStrength: Math.max(...magnitudes),
      avgFieldStrength: magnitudes.reduce((sum: number, mag: number) => sum + mag, 0) / magnitudes.length
    }
  };
}

export default useEnterpriseSpaceWeatherData;
