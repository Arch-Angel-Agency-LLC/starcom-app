/**
 * useMapData Hook
 * 
 * Custom hook for map data management and geospatial analysis.
 * Provides map configuration, location data, and search functionality.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  mapService, 
  MapConfig, 
  MapData, 
  MapLocation
} from '../services/map/mapService';
import { ErrorDetail, createErrorDetail } from '../types/errors';

interface UseMapDataOptions {
  initialConfig?: Partial<MapConfig>;
  autoLoad?: boolean;
}

interface UseMapDataResult {
  mapData: MapData;
  loading: boolean;
  error: ErrorDetail | null;
  config: MapConfig;
  setConfig: (config: Partial<MapConfig>) => void;
  refreshMapData: () => Promise<void>;
  searchLocations: (query: string) => Promise<MapLocation[]>;
  selectedLocation: string | null;
  setSelectedLocation: (locationId: string | null) => void;
  locationDetails: MapLocation | null;
  loadingOperations: Record<string, boolean>;
}

// Operation types for tracking loading state
type OperationType = 'loadMapData' | 'searchLocations' | 'loadLocationDetails';

/**
 * Default map configuration
 */
const defaultConfig: MapConfig = {
  activeLayer: 'satellite',
  visualizations: ['pins'],
  filters: {
    minActivity: 0
  }
};

/**
 * Custom hook for map data and geospatial analysis
 */
export function useMapData({
  initialConfig = {},
  autoLoad = true
}: UseMapDataOptions = {}): UseMapDataResult {
  // State management
  const [mapData, setMapData] = useState<MapData>({
    locations: [],
    connections: []
  });
  const [config, setConfigState] = useState<MapConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  const [loadingOperations, setLoadingOperations] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationDetails, setLocationDetails] = useState<MapLocation | null>(null);
  
  // Helper to determine if any operation is loading
  const isLoading = Object.values(loadingOperations).some(Boolean);
  
  // Set loading state for a specific operation
  const setOperationLoading = useCallback((operation: OperationType, isLoading: boolean) => {
    setLoadingOperations(prev => ({
      ...prev,
      [operation]: isLoading
    }));
  }, []);
  
  // Update config with partial changes
  const setConfig = useCallback((newConfig: Partial<MapConfig>) => {
    setConfigState(prev => ({
      ...prev,
      ...newConfig,
      // If filters are provided, merge them with existing filters
      filters: newConfig.filters 
        ? { ...prev.filters, ...newConfig.filters } 
        : prev.filters
    }));
  }, []);
  
  // Load map data on mount if autoLoad is true or when config changes
  useEffect(() => {
    if (autoLoad) {
      refreshMapData();
    }
  }, [config, autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Load location details when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const loadLocationDetails = async () => {
        setOperationLoading('loadLocationDetails', true);
        setError(null);
        
        try {
          const details = await mapService.getLocationDetails(selectedLocation);
          
          if (details === null) {
            setLocationDetails(null);
          } else if ('message' in details && 'timestamp' in details) {
            setError(details);
            setLocationDetails(null);
          } else {
            setLocationDetails(details);
          }
        } catch (err) {
          console.error('Error loading location details:', err);
          setError(createErrorDetail(
            'Failed to load location details',
            {
              operation: 'loadLocationDetails',
              component: 'useMapData',
              originalError: err instanceof Error ? err : undefined,
              recoverable: true,
              retryable: true,
              context: { locationId: selectedLocation },
              userActions: [
                'Try selecting a different location',
                'Refresh the map data'
              ]
            }
          ));
        } finally {
          setOperationLoading('loadLocationDetails', false);
        }
      };
      
      loadLocationDetails();
    } else {
      setLocationDetails(null);
    }
  }, [selectedLocation, setOperationLoading]);
  
  // Refresh map data
  const refreshMapData = useCallback(async () => {
    setOperationLoading('loadMapData', true);
    setError(null);
    
    try {
      const result = await mapService.getMapData(config);
      
      if ('locations' in result) {
        setMapData(result);
      } else {
        setError(result);
      }
    } catch (err) {
      setError(createErrorDetail(
        'Unexpected error loading map data',
        {
          operation: 'refreshMapData',
          component: 'useMapData',
          originalError: err instanceof Error ? err : undefined,
          recoverable: true,
          retryable: true,
          userActions: [
            'Try refreshing the map',
            'Check your network connection',
            'Try different map settings'
          ]
        }
      ));
    } finally {
      setOperationLoading('loadMapData', false);
    }
  }, [config, setOperationLoading]);
  
  // Search for locations
  const searchLocations = useCallback(async (query: string): Promise<MapLocation[]> => {
    setOperationLoading('searchLocations', true);
    setError(null);
    
    try {
      const result = await mapService.searchLocations(query, config);
      
      if (Array.isArray(result)) {
        return result;
      } else {
        setError(result);
        return [];
      }
    } catch (err) {
      setError(createErrorDetail(
        'Error searching locations',
        {
          operation: 'searchLocations',
          component: 'useMapData',
          originalError: err instanceof Error ? err : undefined,
          recoverable: true,
          retryable: true,
          context: { query },
          userActions: [
            'Try a different search term',
            'Check your network connection'
          ]
        }
      ));
      return [];
    } finally {
      setOperationLoading('searchLocations', false);
    }
  }, [config, setOperationLoading]);
  
  return {
    mapData,
    loading: isLoading,
    error,
    config,
    setConfig,
    refreshMapData,
    searchLocations,
    selectedLocation,
    setSelectedLocation,
    locationDetails,
    loadingOperations
  };
}
