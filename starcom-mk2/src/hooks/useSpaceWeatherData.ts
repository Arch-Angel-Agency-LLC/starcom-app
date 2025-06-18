import { useState, useEffect, useCallback } from 'react';
import { fetchLatestElectricFieldData, generateSpaceWeatherAlerts } from '../services/noaaSpaceWeather';
import { ProcessedElectricFieldData, SpaceWeatherAlert } from '../types/spaceWeather';
import { SpaceWeatherCacheService } from '../services/SpaceWeatherCacheService';

// AI-NOTE: Updated to use proper caching service for better performance and data persistence
// TODO: Integrate with existing globe overlays and intelligence context

interface UseSpaceWeatherData {
  interMagData: ProcessedElectricFieldData | null;
  usCanadaData: ProcessedElectricFieldData | null;
  alerts: SpaceWeatherAlert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

interface UseSpaceWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableAlerts?: boolean;
}

// Singleton cache service instance
const cacheService = new SpaceWeatherCacheService();

export const useSpaceWeatherData = (options: UseSpaceWeatherOptions = {}): UseSpaceWeatherData => {
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

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first unless forcing refresh
      if (!forceRefresh && cacheService.isDataFresh()) {
        const cachedData = cacheService.get('spaceWeatherData');
        if (cachedData) {
          setInterMagData(cachedData.interMagData || null);
          setUsCanadaData(cachedData.usCanadaData || null);
          setAlerts(cachedData.alerts || []);
          setLastUpdated(cachedData.lastUpdated || null);
          setIsLoading(false);
          return;
        }
      }

      // Fetch both datasets
      const [interMagRaw, usCanadaRaw] = await Promise.all([
        fetchLatestElectricFieldData('InterMag'),
        fetchLatestElectricFieldData('US-Canada')
      ]);
      
      // Convert raw data to ProcessedElectricFieldData format
      const interMagProcessed: ProcessedElectricFieldData = {
        timestamp: interMagRaw.time_tag || new Date().toISOString(),
        source: "InterMagEarthScope",
        vectors: interMagRaw.features.map(f => ({
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
          ex: f.properties.Ex,
          ey: f.properties.Ey,
          magnitude: Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2),
          direction: Math.atan2(f.properties.Ey, f.properties.Ex) * (180 / Math.PI),
          quality: f.properties.quality_flag || 1,
          stationDistance: f.properties.distance_nearest_station || 0
        })),
        coverage: {
          minLat: Math.min(...interMagRaw.features.map(f => f.geometry.coordinates[1])),
          maxLat: Math.max(...interMagRaw.features.map(f => f.geometry.coordinates[1])),
          minLon: Math.min(...interMagRaw.features.map(f => f.geometry.coordinates[0])),
          maxLon: Math.max(...interMagRaw.features.map(f => f.geometry.coordinates[0]))
        },
        statistics: {
          totalPoints: interMagRaw.features.length,
          highQualityPoints: interMagRaw.features.filter(f => (f.properties.quality_flag || 1) >= 3).length,
          maxFieldStrength: Math.max(...interMagRaw.features.map(f => Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2))),
          avgFieldStrength: interMagRaw.features.reduce((sum, f) => sum + Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2), 0) / interMagRaw.features.length
        }
      };

      const usCanadaProcessed: ProcessedElectricFieldData = {
        timestamp: usCanadaRaw.time_tag || new Date().toISOString(),
        source: "US-Canada-1D",
        vectors: usCanadaRaw.features.map(f => ({
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
          ex: f.properties.Ex,
          ey: f.properties.Ey,
          magnitude: Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2),
          direction: Math.atan2(f.properties.Ey, f.properties.Ex) * (180 / Math.PI),
          quality: f.properties.quality_flag || 1,
          stationDistance: f.properties.distance_nearest_station || 0
        })),
        coverage: {
          minLat: Math.min(...usCanadaRaw.features.map(f => f.geometry.coordinates[1])),
          maxLat: Math.max(...usCanadaRaw.features.map(f => f.geometry.coordinates[1])),
          minLon: Math.min(...usCanadaRaw.features.map(f => f.geometry.coordinates[0])),
          maxLon: Math.max(...usCanadaRaw.features.map(f => f.geometry.coordinates[0]))
        },
        statistics: {
          totalPoints: usCanadaRaw.features.length,
          highQualityPoints: usCanadaRaw.features.filter(f => (f.properties.quality_flag || 1) >= 3).length,
          maxFieldStrength: Math.max(...usCanadaRaw.features.map(f => Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2))),
          avgFieldStrength: usCanadaRaw.features.reduce((sum, f) => sum + Math.sqrt(f.properties.Ex ** 2 + f.properties.Ey ** 2), 0) / usCanadaRaw.features.length
        }
      };
      
      setInterMagData(interMagProcessed);
      setUsCanadaData(usCanadaProcessed);
      
      let generatedAlerts: SpaceWeatherAlert[] = [];
      if (enableAlerts) {
        const interMagAlerts = generateSpaceWeatherAlerts(interMagRaw);
        const usCanadaAlerts = generateSpaceWeatherAlerts(usCanadaRaw);
        generatedAlerts = [...interMagAlerts, ...usCanadaAlerts];
        setAlerts(generatedAlerts);
      }
      
      const now = new Date();
      setLastUpdated(now);

      // Cache the processed data
      cacheService.set('spaceWeatherData', {
        interMagData: interMagProcessed,
        usCanadaData: usCanadaProcessed,
        alerts: generatedAlerts,
        lastUpdated: now
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch space weather data: ${errorMessage}`);
      console.error('Space weather data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enableAlerts]);

  const refresh = useCallback(async () => {
    await fetchData(true); // Force refresh bypasses cache
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cacheService.clear();
    setInterMagData(null);
    setUsCanadaData(null);
    setAlerts([]);
    setLastUpdated(null);
  }, []);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      await fetchData(); // Will use cache if available
    };

    initializeData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Page visibility handling - pause/resume data fetching
  useEffect(() => {
    if (!autoRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh data when tab becomes visible
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchData]);

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

// Additional utility hook for electric field visualization data
export const useElectricFieldVisualization = () => {
  const spaceWeatherData = useSpaceWeatherData();

  const getVisualizationVectors = useCallback(() => {
    const vectors = [];
    
    if (spaceWeatherData.interMagData) {
      vectors.push(...spaceWeatherData.interMagData.vectors);
    }
    
    if (spaceWeatherData.usCanadaData) {
      vectors.push(...spaceWeatherData.usCanadaData.vectors);
    }

    // Filter for high-quality data points only
    return vectors.filter(vector => vector.quality >= 4);
  }, [spaceWeatherData.interMagData, spaceWeatherData.usCanadaData]);

  const getAlertRegions = useCallback(() => {
    return spaceWeatherData.alerts
      .filter(alert => alert.alertType === 'electric_field_anomaly')
      .flatMap(alert => 
        alert.electricFieldData?.map(vector => ({
          longitude: vector.longitude,
          latitude: vector.latitude,
          intensity: vector.magnitude,
          severity: alert.severity
        })) || []
      );
  }, [spaceWeatherData.alerts]);

  return {
    ...spaceWeatherData,
    visualizationVectors: getVisualizationVectors(),
    alertRegions: getAlertRegions()
  };
};
