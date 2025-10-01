/**
 * Intel Reports 3D - Main Hook
 * 
 * Provides unified access to Intel Reports 3D with context-aware behavior,
 * HUD integration, and performance optimization.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  IntelReport3DData,
  IntelReport3DViewport,
  IntelPerformanceMetrics
} from '../../models/Intel/IntelVisualization3D';
import type {
  IntelCategory,
  IntelPriority,
  IntelThreatLevel
} from '../../models/Intel/IntelEnums';
import type {
  IntelReport3DContextState
} from '../../types/intelligence/IntelContextTypes';
import { IntelReports3DService, type IntelReportFilters, type IntelServiceMetrics } from '../../services/intelligence/IntelReports3DService';
import { IntelContextService } from '../../services/intelligence/IntelContextService';

// =============================================================================
// HOOK OPTIONS AND CONFIGURATION
// =============================================================================

// TODO: Implement adaptive rendering quality based on device performance - PRIORITY: MEDIUM
// TODO: Add support for 3D object picking and selection optimization - PRIORITY: MEDIUM
// TODO: Implement comprehensive 3D state management and persistence - PRIORITY: MEDIUM
export interface IntelReports3DOptions {
  // Performance options
  maxCacheSize?: number;
  viewportCulling?: boolean;
  realTimeUpdates?: boolean;
  debounceDelay?: number;
  
  // Context options
  adaptToHUD?: boolean;
  contextPriority?: 'primary' | 'secondary' | 'tertiary';
  
  // Data options
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: IntelReportFilters;
  
  // Advanced options
  enablePersistence?: boolean;
  enableBatching?: boolean;
}

export interface IntelReports3DState {
  // Core data
  intelReports: IntelReport3DData[];
  filteredReports: IntelReport3DData[];
  
  // Context and state
  context: IntelReport3DContextState | null;
  viewport: IntelReport3DViewport | null;
  
  // Loading and error states
  loading: boolean;
  error: Error | null;
  
  // Performance metrics
  metrics: IntelPerformanceMetrics;
}

export interface IntelReports3DActions {
  // Data management
  addIntelReport: (report: IntelReport3DData) => Promise<void>;
  updateIntelReport: (id: string, updates: Partial<IntelReport3DData>) => Promise<void>;
  removeIntelReport: (id: string) => Promise<void>;
  refreshIntelReports: () => Promise<void>;
  
  // Context management
  updateContext: (context: Partial<IntelReport3DContextState>) => void;
  setViewport: (viewport: IntelReport3DViewport) => void;
  
  // Filtering and querying
  setFilters: (filters: IntelReportFilters) => void;
  clearFilters: () => void;
  queryByFilters: (filters: IntelReportFilters) => Promise<IntelReport3DData[]>;
  
  // Selection and interaction
  selectIntelReport: (id: string) => void;
  clearSelection: () => void;
  
  // Utility actions
  exportIntelData: (format: 'json' | 'csv') => string;
  importIntelData: (data: string, format: 'json' | 'csv') => Promise<void>;
}

export interface IntelReports3DUtilities {
  // Data queries
  getIntelById: (id: string) => IntelReport3DData | undefined;
  getIntelByLocation: (lat: number, lng: number, radius: number) => IntelReport3DData[];
  getIntelByCategory: (category: string) => IntelReport3DData[];
  getIntelByPriority: (priority: string) => IntelReport3DData[];
  
  // Context utilities
  isContextActive: () => boolean;
  getContextPriority: () => 'primary' | 'secondary' | 'tertiary' | null;
  isHUDIntegrated: () => boolean;
  
  // Performance utilities
  getLoadTime: () => number;
  getCacheHitRate: () => number;
  getVisibleCount: () => number;
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

export const useIntelReports3D = (
  options: IntelReports3DOptions = {}
): IntelReports3DState & IntelReports3DActions & IntelReports3DUtilities => {
  
  // Memoize config to prevent unnecessary re-initializations
  const config = useMemo(() => {
    return {
      maxCacheSize: options.maxCacheSize ?? 1000,
      viewportCulling: options.viewportCulling ?? true,
      realTimeUpdates: options.realTimeUpdates ?? true,
      debounceDelay: options.debounceDelay ?? 300,
      adaptToHUD: options.adaptToHUD ?? true,
      contextPriority: options.contextPriority ?? 'primary' as const,
      autoRefresh: options.autoRefresh ?? false,
      refreshInterval: options.refreshInterval ?? 30000,
      initialFilters: options.initialFilters ?? {},
      enablePersistence: options.enablePersistence ?? false,
      enableBatching: options.enableBatching ?? true
    };
  }, [
    options.maxCacheSize,
    options.viewportCulling,
    options.realTimeUpdates,
    options.debounceDelay,
    options.adaptToHUD,
    options.contextPriority,
    options.autoRefresh,
    options.refreshInterval,
    options.initialFilters,
    options.enablePersistence,
    options.enableBatching
  ]);
  
  // Enhanced error tracking and debugging
  const errorCount = useRef(0);
  const lastError = useRef<Error | null>(null);
  const errorHistory = useRef<Array<{ error: Error; timestamp: Date; action: string }>>([]);
  
  // Service instances with initialization tracking
  const intelServiceRef = useRef<IntelReports3DService | null>(null);
  const contextServiceRef = useRef<IntelContextService | null>(null);
  const serviceInitialized = useRef<boolean>(false);
  
  // Cleanup and resource management
  const cleanupFns = useRef<Array<() => void>>([]);
  const isUnmounted = useRef<boolean>(false);
  
  // Performance monitoring
  const performanceMetrics = useRef({
    renderTimes: [] as number[],
    memoryUsage: [] as number[],
    lastCleanup: new Date()
  });
  
  // Enhanced error handler
  const handleError = useCallback((error: Error, action: string) => {
    if (isUnmounted.current) return;
    
    errorCount.current++;
    lastError.current = error;
    errorHistory.current.push({ error, timestamp: new Date(), action });
    
    // Keep error history manageable
    if (errorHistory.current.length > 50) {
      errorHistory.current = errorHistory.current.slice(-30);
    }
    
    setState(prevState => ({ 
      ...prevState, 
      error,
      loading: false
    }));
    
    // Log detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Intel Reports 3D Hook Error [${action}]:`, {
        error,
        errorCount: errorCount.current,
        timestamp: new Date(),
        serviceInitialized: serviceInitialized.current
      });
    }
  }, []);
  
  // Cleanup utility
  const addCleanupFn = useCallback((fn: () => void) => {
    cleanupFns.current.push(fn);
  }, []);
  
  // Performance monitoring utility
  const updatePerformanceMetrics = useCallback(() => {
    const now = performance.now();
    performanceMetrics.current.renderTimes.push(now);
    // Keep metrics arrays manageable
    if (performanceMetrics.current.renderTimes.length > 100) {
      performanceMetrics.current.renderTimes = performanceMetrics.current.renderTimes.slice(-50);
    }
    
    // Memory cleanup every 5 minutes
    if (Date.now() - performanceMetrics.current.lastCleanup.getTime() > 300000) {
      performanceMetrics.current.lastCleanup = new Date();
      // Trigger garbage collection hint if available
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as unknown as { gc: () => void }).gc();
      }
    }
  }, []);
  
  // Component unmount detection
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
    };
  }, []);
  
  // State management
  const [state, setState] = useState<IntelReports3DState>({
    intelReports: [],
    filteredReports: [],
    context: null,
    viewport: null,
    loading: false,
    error: null,
    metrics: {
      fps: 60,
      renderTime: 0,
      markerCount: 0,
      visibleMarkers: 0,
      memoryUsage: 0,
      totalIntelReports: 0,
      visibleIntelReports: 0,
      frameRate: 60,
      lastUpdate: new Date()
    }
  });
  
  // Filters and subscriptions
  const [currentFilters, setCurrentFilters] = useState<IntelReportFilters>(config.initialFilters);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // =============================================================================
  // SERVICE INITIALIZATION
  // =============================================================================
  
  useEffect(() => {
    // Prevent initialization if already initialized or unmounted
    if (serviceInitialized.current || isUnmounted.current) return;
    
    try {
      // Initialize services
      if (!intelServiceRef.current) {
        const initialContext = state.context || createDefaultContext();
        
        intelServiceRef.current = new IntelReports3DService(initialContext, {
          maxCacheSize: config.maxCacheSize,
          viewportCulling: config.viewportCulling,
          realTimeUpdates: config.realTimeUpdates,
          persistenceEnabled: config.enablePersistence,
          debounceDelay: config.debounceDelay
        });
        
        addCleanupFn(() => {
          if (intelServiceRef.current) {
            intelServiceRef.current.destroy?.();
            intelServiceRef.current = null;
          }
        });
      }
      
      if (!contextServiceRef.current) {
        contextServiceRef.current = new IntelContextService(state.context || undefined, {
          enableAutoSync: config.adaptToHUD,
          debugMode: process.env.NODE_ENV === 'development'
        });
        
        addCleanupFn(() => {
          if (contextServiceRef.current) {
            contextServiceRef.current.destroy?.();
            contextServiceRef.current = null;
          }
        });
      }
      
      serviceInitialized.current = true;
      
    } catch (error) {
      handleError(error as Error, 'service-initialization');
    }
    
    return () => {
      // Cleanup subscriptions and services
      if (subscriptionId && intelServiceRef.current) {
        intelServiceRef.current.unsubscribe(subscriptionId);
      }
      
      // Execute all cleanup functions
      cleanupFns.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      cleanupFns.current = [];
    };
  }, [
    config.adaptToHUD,
    config.debounceDelay,
    config.enablePersistence,
    config.maxCacheSize,
    config.realTimeUpdates,
    config.viewportCulling,
    state.context,
    subscriptionId,
    handleError,
    addCleanupFn
  ]);
  
  // =============================================================================
  // DATA SUBSCRIPTION AND UPDATES
  // =============================================================================
  
  useEffect(() => {
    if (!intelServiceRef.current || !serviceInitialized.current || isUnmounted.current) return;
    
    const service = intelServiceRef.current;
    
    try {
      // Subscribe to data updates with a unique key
      const subscriptionKey = `hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const unsubscribeFn = service.subscribe(subscriptionKey, (reports) => {
        if (isUnmounted.current) return;
        
        updatePerformanceMetrics();
        
        setState(prevState => ({
          ...prevState,
          intelReports: reports,
          filteredReports: applyFilters(reports, currentFilters),
          loading: false,
          error: null, // Clear error on successful update
          metrics: convertServiceMetricsToPerformanceMetrics(service.getMetrics())
        }));
      });
      
      setSubscriptionId(subscriptionKey);
      
      // Set loading state and perform initial load
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      return () => {
        try {
          unsubscribeFn();
        } catch (error) {
          console.warn('Failed to unsubscribe from service:', error);
        }
      };
      
    } catch (error) {
      handleError(error as Error, 'data-subscription');
    }
  }, [currentFilters, handleError, updatePerformanceMetrics]);
  
  // =============================================================================
  // CONTEXT MANAGEMENT
  // =============================================================================
  
  useEffect(() => {
    if (!contextServiceRef.current || !config.adaptToHUD) return;
    
    const contextService = contextServiceRef.current;
    
    // Listen for context changes
    const handleContextChange = (newContext: IntelReport3DContextState) => {
      setState(prevState => ({
        ...prevState,
        context: newContext
      }));
      
      // Update intel service with new context
      if (intelServiceRef.current) {
        intelServiceRef.current.updateContext(newContext);
      }
    };
    
    const unsubscribeContext = contextService.on('contextChanged', handleContextChange);
    
    return () => {
      unsubscribeContext();
    };
  }, [config.adaptToHUD]);
  
  // =============================================================================
  // AUTO REFRESH
  // =============================================================================
  
  useEffect(() => {
    if (!config.autoRefresh || !intelServiceRef.current) return;
    
    const interval = setInterval(() => {
      // Trigger re-query instead of refreshData
      if (intelServiceRef.current) {
        intelServiceRef.current.queryAll().then(reports => {
          setState(prevState => ({
            ...prevState,
            intelReports: reports,
            filteredReports: applyFilters(reports, currentFilters)
          }));
        });
      }
    }, config.refreshInterval);
    
    return () => clearInterval(interval);
  }, [config.autoRefresh, config.refreshInterval, currentFilters]);
  
  // =============================================================================
  // ACTIONS IMPLEMENTATION
  // =============================================================================
  
  const addIntelReport = useCallback(async (report: IntelReport3DData): Promise<void> => {
    if (!intelServiceRef.current) throw new Error('Intel service not initialized');
    if (isUnmounted.current) return;
    
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      await intelServiceRef.current.addReport(report);
      updatePerformanceMetrics();
    } catch (error) {
      handleError(error as Error, 'add-intel-report');
      throw error;
    }
  }, [handleError, updatePerformanceMetrics]);
  
  const updateIntelReport = useCallback(async (id: string, updates: Partial<IntelReport3DData>): Promise<void> => {
    if (!intelServiceRef.current) throw new Error('Intel service not initialized');
    if (isUnmounted.current) return;
    
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      await intelServiceRef.current.updateReport(id, updates);
      updatePerformanceMetrics();
    } catch (error) {
      handleError(error as Error, 'update-intel-report');
      throw error;
    }
  }, [handleError, updatePerformanceMetrics]);
  
  const removeIntelReport = useCallback(async (id: string): Promise<void> => {
    if (!intelServiceRef.current) throw new Error('Intel service not initialized');
    if (isUnmounted.current) return;
    
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      await intelServiceRef.current.deleteReport(id);
      updatePerformanceMetrics();
    } catch (error) {
      handleError(error as Error, 'remove-intel-report');
      throw error;
    }
  }, [handleError, updatePerformanceMetrics]);
  
  const refreshIntelReports = useCallback(async (): Promise<void> => {
    if (!intelServiceRef.current || isUnmounted.current) return;
    
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      const reports = await intelServiceRef.current.queryAll();
      
      if (!isUnmounted.current) {
        setState(prevState => ({
          ...prevState,
          intelReports: reports,
          filteredReports: applyFilters(reports, currentFilters),
          loading: false
        }));
        updatePerformanceMetrics();
      }
    } catch (error) {
      handleError(error as Error, 'refresh-intel-reports');
    }
  }, [currentFilters, handleError, updatePerformanceMetrics]);
  
  const updateContext = useCallback((contextUpdates: Partial<IntelReport3DContextState>): void => {
    if (!contextServiceRef.current) return;
    
    const newContext = {
      ...state.context,
      ...contextUpdates
    } as IntelReport3DContextState;
    
    contextServiceRef.current.updateContext(newContext);
  }, [state.context]);
  
  const setViewport = useCallback((viewport: IntelReport3DViewport): void => {
    setState(prevState => ({ ...prevState, viewport }));
    
    // Note: IntelReports3DService doesn't have setViewport method
    // Viewport is handled at the component level
  }, []);
  
  const setFilters = useCallback((filters: IntelReportFilters): void => {
    // Debounce filter updates
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setCurrentFilters(filters);
      setState(prevState => ({
        ...prevState,
        filteredReports: applyFilters(prevState.intelReports, filters)
      }));
    }, config.debounceDelay);
  }, [config.debounceDelay]);
  
  const clearFilters = useCallback((): void => {
    setCurrentFilters({});
    setState(prevState => ({
      ...prevState,
      filteredReports: prevState.intelReports
    }));
  }, []);
  
  const queryByFilters = useCallback(async (filters: IntelReportFilters): Promise<IntelReport3DData[]> => {
    if (!intelServiceRef.current) return [];
    
    try {
      return await intelServiceRef.current.queryByFilters(filters);
    } catch (error) {
      setState(prevState => ({ ...prevState, error: error as Error }));
      return [];
    }
  }, []);
  
  const selectIntelReport = useCallback((id: string): void => {
    updateContext({
      hudContext: {
        ...state.context?.hudContext,
        selectedObject: id
      }
    });
  }, [state.context, updateContext]);
  
  const clearSelection = useCallback((): void => {
    updateContext({
      hudContext: {
        ...state.context?.hudContext,
        selectedObject: null
      }
    });
  }, [state.context, updateContext]);
  
  const exportIntelData = useCallback((format: 'json' | 'csv'): string => {
    const data = state.filteredReports.length > 0 ? state.filteredReports : state.intelReports;
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export
      const headers = ['id', 'title', 'category', 'priority', 'lat', 'lng', 'timestamp'];
      const rows = data.map(report => [
        report.id,
        report.title,
        report.metadata.category,
        report.visualization.priority,
        report.location.lat,
        report.location.lng,
        report.timestamp.toISOString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }, [state.filteredReports, state.intelReports]);
  
  const importIntelData = useCallback(async (data: string, format: 'json' | 'csv'): Promise<void> => {
    if (!intelServiceRef.current) throw new Error('Intel service not initialized');
    
    try {
      let reports: IntelReport3DData[];
      
      if (format === 'json') {
        reports = JSON.parse(data);
      } else {
        // Simple CSV parsing
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        reports = lines.slice(1).map(line => {
          const values = line.split(',');
          // Basic CSV to IntelReport3DData conversion
          // This is simplified - real implementation would be more robust
          return createIntelReportFromCSV(headers, values);
        });
      }
      
      // Import reports
      for (const report of reports) {
        await intelServiceRef.current.addReport(report);
      }
      
    } catch (error) {
      setState(prevState => ({ ...prevState, error: error as Error }));
      throw error;
    }
  }, []);
  
  // =============================================================================
  // UTILITIES IMPLEMENTATION
  // =============================================================================
  
  const getIntelById = useCallback((id: string): IntelReport3DData | undefined => {
    return state.intelReports.find(report => report.id === id);
  }, [state.intelReports]);
  
  const getIntelByLocation = useCallback((lat: number, lng: number, radius: number): IntelReport3DData[] => {
    return state.intelReports.filter(report => {
      const distance = calculateDistance(
        { lat, lng },
        { lat: report.location.lat, lng: report.location.lng }
      );
      return distance <= radius;
    });
  }, [state.intelReports]);
  
  const getIntelByCategory = useCallback((category: string): IntelReport3DData[] => {
    return state.intelReports.filter(report => report.metadata.category === category);
  }, [state.intelReports]);
  
  const getIntelByPriority = useCallback((priority: string): IntelReport3DData[] => {
    return state.intelReports.filter(report => report.visualization.priority === priority);
  }, [state.intelReports]);
  
  const isContextActive = useCallback((): boolean => {
    return state.context !== null;
  }, [state.context]);
  
  const getContextPriority = useCallback((): 'primary' | 'secondary' | 'tertiary' | null => {
    return state.context?.displayContext.priority || null;
  }, [state.context]);
  
  const isHUDIntegrated = useCallback((): boolean => {
    return config.adaptToHUD && state.context !== null;
  }, [config.adaptToHUD, state.context]);
  
  const getLoadTime = useCallback((): number => {
    return state.metrics.renderTime;
  }, [state.metrics]);
  
  const getCacheHitRate = useCallback((): number => {
    if (!intelServiceRef.current) return 0;
    return intelServiceRef.current.getMetrics().cacheHitRate || 0;
  }, []);
  
  const getVisibleCount = useCallback((): number => {
    return state.metrics.visibleIntelReports;
  }, [state.metrics]);
  
  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================
  
  return {
    // State
    ...state,
    
    // Actions
    addIntelReport,
    updateIntelReport,
    removeIntelReport,
    refreshIntelReports,
    updateContext,
    setViewport,
    setFilters,
    clearFilters,
    queryByFilters,
    selectIntelReport,
    clearSelection,
    exportIntelData,
    importIntelData,
    
    // Utilities
    getIntelById,
    getIntelByLocation,
    getIntelByCategory,
    getIntelByPriority,
    isContextActive,
    getContextPriority,
    isHUDIntegrated,
    getLoadTime,
    getCacheHitRate,
    getVisibleCount
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert service metrics to performance metrics
 */
function convertServiceMetricsToPerformanceMetrics(serviceMetrics: IntelServiceMetrics): IntelPerformanceMetrics {
  return {
    fps: 60, // Default FPS
    renderTime: serviceMetrics.averageQueryTime || 0,
    markerCount: serviceMetrics.totalReports || 0,
    visibleMarkers: serviceMetrics.visibleReports || 0,
    memoryUsage: serviceMetrics.memoryUsage || 0,
    totalIntelReports: serviceMetrics.totalReports || 0,
    visibleIntelReports: serviceMetrics.visibleReports || 0,
    frameRate: 60, // Default framerate
    lastUpdate: serviceMetrics.lastUpdateTime || new Date()
  };
}

/**
 * Create default context for Intel Reports
 */
function createDefaultContext(): IntelReport3DContextState {
  return {
    hudContext: {
      operationMode: 'PLANETARY',
      centerMode: '3D_GLOBE',
      activeLayers: [],
      selectedObject: null
    },
    displayContext: {
      priority: 'primary',
      visibility: 'full',
      adaptiveRendering: true
    },
    integrationState: {
      leftSideControls: false,
      rightSideTools: false,
      bottomBarDetails: false,
      topBarStatus: false
    }
  };
}

/**
 * Apply filters to intel reports
 */
function applyFilters(reports: IntelReport3DData[], filters: IntelReportFilters): IntelReport3DData[] {
  if (!reports.length) return reports;

  let filtered = [...reports];

  if (filters.tags?.length) {
    filtered = filtered.filter(report => {
      const tags = report.metadata?.tags ?? [];
      return filters.tags!.some(tag => tags.includes(tag));
    });
  }

  if (filters.category?.length) {
    filtered = filtered.filter(report => {
      const categoryValue = report.metadata?.category as IntelCategory | undefined;
      return !!categoryValue && filters.category!.includes(categoryValue);
    });
  }

  if (filters.threatLevel?.length) {
    filtered = filtered.filter(report => {
      const threatLevel = report.metadata?.threat_level as IntelThreatLevel | undefined;
      return !!threatLevel && filters.threatLevel!.includes(threatLevel);
    });
  }

  if (filters.timeRange) {
    const { start, end } = filters.timeRange;
    filtered = filtered.filter(report => {
      if (!report.timestamp) return false;
      const timestamp = report.timestamp instanceof Date ? report.timestamp : new Date(report.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  if (filters.geographic) {
    const bounds = filters.geographic.bounds;
    filtered = filtered.filter(report => {
      if (!report.location) return false;
      const { lat, lng } = report.location;
      return lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east;
    });
  }

  if (filters.confidence) {
    filtered = filtered.filter(report => {
      const confidence = report.metadata?.confidence ?? 0;
      return confidence >= filters.confidence!.min && confidence <= filters.confidence!.max;
    });
  }

  if (filters.reliability) {
    filtered = filtered.filter(report => {
      const reliability = report.metadata?.reliability ?? 0;
      return reliability >= filters.reliability!.min && reliability <= filters.reliability!.max;
    });
  }

  if (filters.freshness) {
    filtered = filtered.filter(report => {
      const freshness = report.metadata?.freshness ?? 0;
      return freshness >= filters.freshness!.min && freshness <= filters.freshness!.max;
    });
  }

  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filtered = filtered.filter(report => {
      const tags = report.metadata?.tags ?? [];
      const titleMatch = report.title?.toLowerCase().includes(searchLower);
      const summaryMatch = report.content?.summary?.toLowerCase().includes(searchLower);
      const detailsMatch = report.content?.details?.toLowerCase().includes(searchLower);
      const keywordMatch = (report.content?.keywords ?? []).some(keyword => keyword.toLowerCase().includes(searchLower));
      return titleMatch || summaryMatch || detailsMatch || keywordMatch ||
        tags.some(tag => tag.toLowerCase().includes(searchLower));
    });
  }

  if (filters.authorFilter?.length) {
    filtered = filtered.filter(report => filters.authorFilter!.includes(report.source));
  }

  return filtered;
}

/**
 * Calculate distance between two coordinates (haversine formula)
 */
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Create IntelReport3DData from CSV values (simplified)
 */
function createIntelReportFromCSV(headers: string[], values: string[]): IntelReport3DData {
  const getValue = (header: string) => {
    const index = headers.indexOf(header);
    return index >= 0 ? values[index] : '';
  };
  
  // This is a simplified implementation
  // Real implementation would need more robust CSV parsing and validation
  return {
    id: getValue('id') || `imported-${Date.now()}`,
    title: getValue('title') || 'Imported Report',
    content: {
      summary: getValue('summary') || '',
      details: getValue('details') || '',
      attachments: []
    },
    location: {
      lat: parseFloat(getValue('lat')) || 0,
      lng: parseFloat(getValue('lng')) || 0,
      altitude: parseFloat(getValue('altitude')) || 0
    },
    metadata: {
      tags: getValue('tags') ? getValue('tags').split(';') : [],
      confidence: parseFloat(getValue('confidence')) || 0.5,
      reliability: parseFloat(getValue('reliability')) || 0.5,
      freshness: parseFloat(getValue('freshness')) || 0.5,
      category: (getValue('category') || 'general') as IntelCategory,
      threat_level: (getValue('threat_level') || 'minimal') as IntelThreatLevel
    },
    source: getValue('source') || 'CSV Import',
    visualization: {
      markerType: 'standard',
      color: getValue('color') || '#0066cc',
      size: parseFloat(getValue('size')) || 1,
      opacity: parseFloat(getValue('opacity')) || 1,
      priority: (getValue('priority') || 'medium') as IntelPriority
    },
    timestamp: new Date(getValue('timestamp') || Date.now())
  };
}
