/**
 * Intel Globe Sync Hook - Enhanced
 * 
 * Provides Globe component integration for Intel Reports 3D with enhanced
 * error handling, performance optimization, and resource management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import type {
  IntelReport3DData,
  IntelReport3DViewport,
  IntelPerformanceMetrics
} from '../../types/intelligence/IntelReportTypes';
import type {
  IntelReport3DContextState
} from '../../types/intelligence/IntelContextTypes';
import { IntelGlobeService, type IntelGlobeMarker } from '../../services/intelligence/IntelGlobeService';

// =============================================================================
// HOOK INTERFACE
// =============================================================================

// TODO: Add support for data state subscription and real-time updates - PRIORITY: MEDIUM
// TODO: Implement data state backup and recovery mechanisms - PRIORITY: MEDIUM
// TODO: Add comprehensive data state analytics and usage tracking - PRIORITY: LOW
export interface IntelGlobeSyncOptions {
  // Globe configuration
  globeRadius?: number;
  hoverAltitude?: number;
  defaultScale?: number;
  
  // Performance options
  maxMarkers?: number;
  enableLOD?: boolean;
  enableCulling?: boolean;
  
  // Interaction options
  enableInteraction?: boolean;
  enableSelection?: boolean;
  enableHover?: boolean;
}

export interface IntelGlobeSyncState {
  // Globe service state
  initialized: boolean;
  markers: IntelGlobeMarker[];
  visibleMarkers: IntelGlobeMarker[];
  
  // Interaction state
  hoveredMarker: IntelGlobeMarker | null;
  selectedMarkers: IntelGlobeMarker[];
  
  // Context state
  context: IntelReport3DContextState | null;
  viewport: IntelReport3DViewport | null;
  
  // Error and loading state
  error: Error | null;
  loading: boolean;
  
  // Performance metrics
  metrics: IntelPerformanceMetrics;
}

export interface IntelGlobeSyncActions {
  // Service management
  initializeGlobe: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, globe: THREE.Object3D) => void;
  destroyGlobe: () => void;
  
  // Data management
  addIntelReports: (reports: IntelReport3DData[]) => Promise<void>;
  updateIntelReport: (report: IntelReport3DData) => Promise<void>;
  removeIntelReport: (reportId: string) => Promise<void>;
  clearIntelReports: () => void;
  
  // Context management
  updateContext: (context: IntelReport3DContextState) => void;
  setViewport: (viewport: IntelReport3DViewport) => void;
  
  // Interaction management
  setInteractionHandlers: (handlers: {
    onMarkerHover?: (marker: IntelGlobeMarker | null) => void;
    onMarkerClick?: (marker: IntelGlobeMarker) => void;
    onMarkerSelect?: (markers: IntelGlobeMarker[]) => void;
  }) => void;
  
  // Utility actions
  focusOnMarker: (markerId: string) => void;
  getMarkerById: (markerId: string) => IntelGlobeMarker | undefined;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useIntelGlobeSync = (
  options: IntelGlobeSyncOptions = {}
): IntelGlobeSyncState & IntelGlobeSyncActions => {
  
  const {
    globeRadius = 100,
    hoverAltitude = 5,
    defaultScale = 1,
    maxMarkers = 1000,
    enableInteraction = true,
    enableHover = true
  } = options;
  
  // Service reference with enhanced tracking
  const globeServiceRef = useRef<IntelGlobeService | null>(null);
  const isUnmounted = useRef<boolean>(false);
  const initializationAttempts = useRef<number>(0);
  
  // State management
  const [state, setState] = useState<IntelGlobeSyncState>({
    initialized: false,
    markers: [],
    visibleMarkers: [],
    hoveredMarker: null,
    selectedMarkers: [],
    context: null,
    viewport: null,
    error: null,
    loading: false,
    metrics: {
      totalIntelReports: 0,
      visibleIntelReports: 0,
      renderTime: 0,
      memoryUsage: 0,
      frameRate: 60,
      lastUpdate: new Date()
    }
  });
  
  // Enhanced error handler
  const handleError = useCallback((error: Error, action: string) => {
    if (isUnmounted.current) return;
    
    setState(prevState => ({
      ...prevState,
      error,
      loading: false
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`Intel Globe Sync Error [${action}]:`, error);
    }
  }, []);
  
  // Component unmount detection
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
    };
  }, []);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleReportAdded = useCallback((report: IntelReport3DData, marker: IntelGlobeMarker) => {
    setState(prevState => ({
      ...prevState,
      markers: [...prevState.markers, marker],
      metrics: {
        ...prevState.metrics,
        totalIntelReports: prevState.metrics.totalIntelReports + 1,
        lastUpdate: new Date()
      }
    }));
  }, []);
  
  const handleReportUpdated = useCallback((report: IntelReport3DData, marker: IntelGlobeMarker) => {
    setState(prevState => ({
      ...prevState,
      markers: prevState.markers.map(m => m.id === marker.id ? marker : m),
      metrics: {
        ...prevState.metrics,
        lastUpdate: new Date()
      }
    }));
  }, []);
  
  const handleReportRemoved = useCallback((reportId: string) => {
    setState(prevState => ({
      ...prevState,
      markers: prevState.markers.filter(m => m.id !== reportId),
      selectedMarkers: prevState.selectedMarkers.filter(m => m.id !== reportId),
      hoveredMarker: prevState.hoveredMarker?.id === reportId ? null : prevState.hoveredMarker,
      metrics: {
        ...prevState.metrics,
        totalIntelReports: Math.max(0, prevState.metrics.totalIntelReports - 1),
        lastUpdate: new Date()
      }
    }));
  }, []);
  
  const handleReportsCleared = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      markers: [],
      visibleMarkers: [],
      selectedMarkers: [],
      hoveredMarker: null,
      metrics: {
        ...prevState.metrics,
        totalIntelReports: 0,
        visibleIntelReports: 0,
        lastUpdate: new Date()
      }
    }));
  }, []);
  
  const handleMarkerHover = useCallback((marker: IntelGlobeMarker | null) => {
    setState(prevState => ({
      ...prevState,
      hoveredMarker: marker
    }));
  }, []);
  
  const handleMarkerClick = useCallback((marker: IntelGlobeMarker) => {
    // Default click behavior - single selection
    setState(prevState => ({
      ...prevState,
      selectedMarkers: [marker]
    }));
  }, []);
  
  const handleMarkerSelect = useCallback((markers: IntelGlobeMarker[]) => {
    setState(prevState => ({
      ...prevState,
      selectedMarkers: markers
    }));
  }, []);
  
  const handleContextUpdated = useCallback((context: IntelReport3DContextState) => {
    setState(prevState => ({
      ...prevState,
      context
    }));
  }, []);
  
  const handleViewportUpdated = useCallback((viewport: IntelReport3DViewport) => {
    setState(prevState => ({
      ...prevState,
      viewport
    }));
  }, []);
  
  // =============================================================================
  // SERVICE INITIALIZATION
  // =============================================================================
  
  const initializeGlobe = useCallback((
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    globe: THREE.Object3D
  ): void => {
    if (globeServiceRef.current) {
      console.warn('Globe service already initialized');
      return;
    }
    
    if (isUnmounted.current) return;
    
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      initializationAttempts.current++;
      
      // Create service with configuration
      globeServiceRef.current = new IntelGlobeService({
        globeRadius,
        hoverAltitude,
        defaultScale,
        lodDistances: {
          high: 200,
          medium: 500,
          low: 1000
        },
        animationSpeed: 1,
        maxMarkers
      });
      
      // Initialize with Three.js components
      globeServiceRef.current.initialize(scene, camera, renderer, globe);
      
      if (!isUnmounted.current) {
        setState(prevState => ({
          ...prevState,
          initialized: true,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      handleError(error as Error, 'globe-initialization');
    }
  }, [globeRadius, hoverAltitude, defaultScale, maxMarkers, handleError]);
  
  const destroyGlobe = useCallback((): void => {
    try {
      if (globeServiceRef.current) {
        globeServiceRef.current.destroy();
        globeServiceRef.current = null;
      }
      
      if (!isUnmounted.current) {
        setState(prevState => ({
          ...prevState,
          initialized: false,
          markers: [],
          visibleMarkers: [],
          hoveredMarker: null,
          selectedMarkers: [],
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      handleError(error as Error, 'globe-destruction');
    }
  }, [handleError]);
  
  // Set up event listeners when service is initialized
  useEffect(() => {
    if (!globeServiceRef.current || !state.initialized) return;
    
    const service = globeServiceRef.current;
    
    // Marker events
    service.on('reportAdded', handleReportAdded);
    service.on('reportUpdated', handleReportUpdated);
    service.on('reportRemoved', handleReportRemoved);
    service.on('reportsCleared', handleReportsCleared);
    
    // Interaction events
    if (enableHover) {
      service.on('markerHover', handleMarkerHover);
    }
    
    if (enableInteraction) {
      service.on('markerClick', handleMarkerClick);
      service.on('markerSelect', handleMarkerSelect);
    }
    
    // Context events
    service.on('contextUpdated', handleContextUpdated);
    service.on('viewportUpdated', handleViewportUpdated);
  }, [
    state.initialized,
    enableHover,
    enableInteraction,
    handleReportAdded,
    handleReportUpdated,
    handleReportRemoved,
    handleReportsCleared,
    handleMarkerHover,
    handleMarkerClick,
    handleMarkerSelect,
    handleContextUpdated,
    handleViewportUpdated
  ]);
  
  // =============================================================================
  // DATA MANAGEMENT ACTIONS
  // =============================================================================
  
  const addIntelReports = useCallback(async (reports: IntelReport3DData[]): Promise<void> => {
    if (!globeServiceRef.current) {
      throw new Error('Globe service not initialized');
    }
    
    await globeServiceRef.current.addIntelReports(reports);
  }, []);
  
  const updateIntelReport = useCallback(async (report: IntelReport3DData): Promise<void> => {
    if (!globeServiceRef.current) {
      throw new Error('Globe service not initialized');
    }
    
    await globeServiceRef.current.updateIntelReport(report);
  }, []);
  
  const removeIntelReport = useCallback(async (reportId: string): Promise<void> => {
    if (!globeServiceRef.current) {
      throw new Error('Globe service not initialized');
    }
    
    globeServiceRef.current.removeIntelReport(reportId);
  }, []);
  
  const clearIntelReports = useCallback((): void => {
    if (!globeServiceRef.current) return;
    
    globeServiceRef.current.clearIntelReports();
  }, []);
  
  // =============================================================================
  // CONTEXT MANAGEMENT ACTIONS
  // =============================================================================
  
  const updateContext = useCallback((context: IntelReport3DContextState): void => {
    if (!globeServiceRef.current) return;
    
    globeServiceRef.current.updateContext(context);
  }, []);
  
  const setViewport = useCallback((viewport: IntelReport3DViewport): void => {
    if (!globeServiceRef.current) return;
    
    globeServiceRef.current.setViewport(viewport);
  }, []);
  
  // =============================================================================
  // INTERACTION MANAGEMENT
  // =============================================================================
  
  const setInteractionHandlers = useCallback((handlers: {
    onMarkerHover?: (marker: IntelGlobeMarker | null) => void;
    onMarkerClick?: (marker: IntelGlobeMarker) => void;
    onMarkerSelect?: (markers: IntelGlobeMarker[]) => void;
  }): void => {
    if (!globeServiceRef.current) return;
    
    globeServiceRef.current.setInteractionHandlers(handlers);
  }, []);
  
  // =============================================================================
  // UTILITY ACTIONS
  // =============================================================================
  
  const focusOnMarker = useCallback((markerId: string): void => {
    const marker = state.markers.find(m => m.id === markerId);
    if (!marker) return;
    
    // Focus on marker by updating selection
    setState(prevState => ({
      ...prevState,
      selectedMarkers: [marker]
    }));
    
    // Optionally emit focus event for camera movement
    if (globeServiceRef.current) {
      globeServiceRef.current.emit('markerFocus', marker);
    }
  }, [state.markers]);
  
  const getMarkerById = useCallback((markerId: string): IntelGlobeMarker | undefined => {
    return state.markers.find(m => m.id === markerId);
  }, [state.markers]);
  
  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================
  
  useEffect(() => {
    if (!globeServiceRef.current) return;
    
    const updatePerformanceMetrics = () => {
      if (!globeServiceRef.current) return;
      
      const serviceMetrics = globeServiceRef.current.getPerformanceMetrics();
      const visibleMarkers = globeServiceRef.current.getVisibleMarkers();
      
      setState(prevState => ({
        ...prevState,
        visibleMarkers,
        metrics: {
          ...serviceMetrics,
          visibleIntelReports: visibleMarkers.length
        }
      }));
    };
    
    // Initial update
    updatePerformanceMetrics();
    
    // Set up periodic updates
    const interval = setInterval(updatePerformanceMetrics, 1000);
    
    return () => clearInterval(interval);
  }, [state.initialized]);
  
  // =============================================================================
  // CLEANUP
  // =============================================================================
  
  useEffect(() => {
    return () => {
      if (globeServiceRef.current) {
        globeServiceRef.current.destroy();
        globeServiceRef.current = null;
      }
    };
  }, []);
  
  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================
  
  return {
    // State
    ...state,
    
    // Service management
    initializeGlobe,
    destroyGlobe,
    
    // Data management
    addIntelReports,
    updateIntelReport,
    removeIntelReport,
    clearIntelReports,
    
    // Context management
    updateContext,
    setViewport,
    
    // Interaction management
    setInteractionHandlers,
    
    // Utility actions
    focusOnMarker,
    getMarkerById
  };
};
