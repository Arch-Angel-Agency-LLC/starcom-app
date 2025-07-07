// Enhanced EIA Data Hook - React integration for comprehensive energy intelligence
// Artifacts: eia-data-expansion-specification, eia-implementation-roadmap
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { EnhancedEIAService } from '../services/eia/EIAService';
import { EnhancedEIAData } from '../services/eia/interfaces';

interface UseEnhancedEIADataOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  priority?: 'critical' | 'important' | 'standard' | 'background';
  categories?: string[];
  onError?: (error: Error) => void;
  onSuccess?: (data: EnhancedEIAData) => void;
}

interface UseEnhancedEIADataReturn {
  data: EnhancedEIAData;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  refresh: () => Promise<void>;
  refreshCategory: (category: string) => Promise<void>;
  getCriticalData: () => Promise<void>;
  getServiceHealth: () => Promise<unknown>;
  clearError: () => void;
  // Enhanced state tracking
  loadingStates: Record<string, boolean>;
  dataAvailability: Record<string, boolean>;
  partialData: boolean;
  criticalDataLoaded: boolean;
}

export const useEnhancedEIAData = (
  options: UseEnhancedEIADataOptions = {}
): UseEnhancedEIADataReturn => {
  const serviceRef = useRef<EnhancedEIAService>(new EnhancedEIAService());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Merge options with defaults only once
  const { 
    refreshInterval = 300000, 
    enableAutoRefresh = true, 
    onError, 
    onSuccess 
  } = options;
  
  // State management
  const [data, setData] = useState<EnhancedEIAData>({
    // Energy Markets (Legacy compatibility)
    oilPrice: null,
    gasolinePrice: null,
    oilInventory: null,
    naturalGasStorage: null,
    
    // Energy Security (Critical Infrastructure)
    naturalGasPrice: null,
    electricityGeneration: null,
    electricityPrice: null,
    
    // Renewables (Clean Energy Transition)
    solarGeneration: null,
    windGeneration: null,
    hydroGeneration: null,
    
    // Market Intelligence (Economic Warfare Detection)
    brentCrude: null,
    jetFuelSupply: null,
    refineryUtilization: null,
    
    // Strategic Monitoring (National Security)
    crudeImports: null,
    lngExports: null,
    nuclearGeneration: null,
    coalGeneration: null,
    naturalGasGeneration: null,
    
    // Additional Energy Data
    distillateSupply: null,
    propaneSupply: null,
    crudeInputs: null,
    gasolineProduction: null,
    
    // Metadata
    loading: true,
    error: null,
    lastUpdated: 0,
    dataQuality: 'fair'
  });

  const [loading, setLoading] = useState(false); // Changed to false - we don't show global loading
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  
  // Enhanced state tracking
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [dataAvailability, setDataAvailability] = useState<Record<string, boolean>>({});
  
  // Derived state
  const partialData = useMemo(() => {
    const availableCount = Object.values(dataAvailability).filter(Boolean).length;
    return availableCount > 0 && availableCount < Object.keys(dataAvailability).length;
  }, [dataAvailability]);
  
  const criticalDataLoaded = useMemo(() => {
    const criticalFields = ['oilPrice', 'naturalGasPrice', 'electricityGeneration'];
    return criticalFields.some(field => data[field as keyof EnhancedEIAData] !== null);
  }, [data]);

  // Core data fetching function with progressive loading
  const fetchData = useCallback(async () => {
    setError(null);
    
    try {
      const service = serviceRef.current;
      
      // Validate service instance
      if (!service) {
        throw new Error('EIA service not available');
      }
      
      // Set loading states for critical data points
      const criticalFields = ['oilPrice', 'naturalGasPrice', 'electricityGeneration', 'energySecurity', 'powerGrid'];
      criticalFields.forEach(field => {
        setLoadingStates(prev => ({ ...prev, [field]: true }));
      });
      
      // Start with critical data first for immediate display
      try {
        const criticalData = await service.getCriticalData();
        if (criticalData && Object.keys(criticalData).length > 0) {
          setData(prev => ({ ...prev, ...criticalData }));
          
          // Update loading and availability states for critical data
          Object.keys(criticalData).forEach(key => {
            if (criticalData[key as keyof typeof criticalData] !== null) {
              setDataAvailability(prev => ({ ...prev, [key]: true }));
              setLoadingStates(prev => ({ ...prev, [key]: false }));
            }
          });
          
          setLastUpdated(Date.now());
        }
      } catch (criticalError) {
        console.warn('Critical data fetch failed, continuing with full fetch:', criticalError);
        // Clear loading states for failed critical data
        criticalFields.forEach(field => {
          setLoadingStates(prev => ({ ...prev, [field]: false }));
        });
      }
      
      // Set loading states for all other data points
      const allFields = ['renewables', 'marketIntelligence', 'supplyChain', 'strategicFuels', 'tradeBalance', 'baseloadPower'];
      allFields.forEach(field => {
        setLoadingStates(prev => ({ ...prev, [field]: true }));
      });
      
      // Then fetch all enhanced data
      const enhancedData = await service.getAllEnhancedData();
      
      // Validate data structure
      if (!enhancedData || typeof enhancedData !== 'object') {
        throw new Error('Invalid data structure received from EIA service');
      }
      
      setData(enhancedData);
      setLastUpdated(Date.now());
      
      // Update data availability and loading states for all data
      Object.keys(enhancedData).forEach(key => {
        if (enhancedData[key as keyof EnhancedEIAData] !== null && 
            key !== 'loading' && key !== 'error' && key !== 'lastUpdated' && key !== 'dataQuality') {
          setDataAvailability(prev => ({ ...prev, [key]: true }));
          setLoadingStates(prev => ({ ...prev, [key]: false }));
        } else {
          setLoadingStates(prev => ({ ...prev, [key]: false }));
        }
      });
      
      // Call success callback if provided
      onSuccess?.(enhancedData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      console.error('EIA data fetch error:', err);
      
      // Clear all loading states on error
      setLoadingStates({});
      
      // Call error callback if provided
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      
      // Don't clear existing data on error - graceful degradation
      setData(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        dataQuality: 'poor',
        lastUpdated: Date.now()
      }));
    }
  }, [onSuccess, onError]); // Include callback dependencies

  // Category-specific data fetching with validation
  const refreshCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    
    // Validate category
    const validCategories = ['energy-security', 'renewables', 'market-intelligence', 'supply-chain', 'infrastructure'];
    if (!validCategories.includes(category)) {
      setError(`Invalid category: ${category}`);
      setLoading(false);
      return;
    }
    
    try {
      const service = serviceRef.current;
      
      if (!service) {
        throw new Error('EIA service not available');
      }
      
      let categoryData: Partial<EnhancedEIAData> = {};
      
      switch (category) {
        case 'energy-security':
          categoryData = await service.getEnergySecurityMetrics();
          break;
        case 'renewables':
          categoryData = await service.getRenewableEnergyStatus();
          break;
        case 'market-intelligence':
          categoryData = await service.getMarketIntelligence();
          break;
        case 'supply-chain':
          categoryData = await service.getSupplyChainMetrics();
          break;
        case 'infrastructure':
          categoryData = await service.getInfrastructureStatus();
          break;
        default:
          throw new Error(`Unknown category: ${category}`);
      }
      
      // Validate category data
      if (!categoryData || typeof categoryData !== 'object') {
        throw new Error(`Invalid data received for category: ${category}`);
      }
      
      // Merge category data with existing data
      setData(prev => ({
        ...prev,
        ...categoryData,
        lastUpdated: Date.now(),
        error: null,
        loading: false,
        dataQuality: 'good'
      }));
      
      setLastUpdated(Date.now());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Unknown error occurred for category: ${category}`;
      setError(errorMessage);
      console.error(`Category refresh error for ${category}:`, err);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Critical data refresh (high priority)
  const getCriticalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const service = serviceRef.current;
      const criticalData = await service.getCriticalData();
      
      // Merge critical data with existing data
      setData(prev => ({
        ...prev,
        ...criticalData,
        lastUpdated: Date.now(),
        error: null,
        loading: false,
        dataQuality: 'excellent'
      }));
      
      setLastUpdated(Date.now());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Service health monitoring
  const getServiceHealth = useCallback(async () => {
    try {
      const service = serviceRef.current;
      return await service.getServiceHealth();
    } catch (err) {
      console.error('Failed to get service health:', err);
      return null;
    }
  }, []);

  // Error management
  const clearError = useCallback(() => {
    setError(null);
    setData(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    // Initial data fetch only on mount
    fetchData();
  }, [fetchData]);

  // Separate effect for auto-refresh interval management
  useEffect(() => {
    // Clear existing interval when options change
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Setup auto-refresh if enabled
    if (enableAutoRefresh && refreshInterval) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, enableAutoRefresh, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    refreshCategory,
    getCriticalData,
    getServiceHealth,
    clearError,
    // Enhanced state tracking
    loadingStates,
    dataAvailability,
    partialData,
    criticalDataLoaded
  };
};

// Specialized hooks for specific use cases
export const useEIAEnergySecurityData = () => {
  return useEnhancedEIAData({
    categories: ['energy-security'],
    priority: 'critical',
    refreshInterval: 180000 // 3 minutes for critical data
  });
};

export const useEIARenewableEnergyData = () => {
  return useEnhancedEIAData({
    categories: ['renewables'],
    priority: 'important',
    refreshInterval: 300000 // 5 minutes
  });
};

export const useEIAMarketIntelligenceData = () => {
  return useEnhancedEIAData({
    categories: ['market-intelligence'],
    priority: 'important',
    refreshInterval: 240000 // 4 minutes
  });
};

// Hook for TopBar Marquee - optimized for real-time display
export const useEIATopBarData = () => {
  return useEnhancedEIAData({
    categories: ['energy-security', 'market-intelligence', 'renewables', 'supply-chain'],
    priority: 'critical',
    refreshInterval: 300000, // 5 minutes
    enableAutoRefresh: true
  });
};

export default useEnhancedEIAData;
