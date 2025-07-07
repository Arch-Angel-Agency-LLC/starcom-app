/**
 * Intel Globe Markers Component
 * 
 * 3D markers for Globe integration using the enterprise-grade useIntelGlobeSync hook.
 * Replaces fragmented Globe Intel logic with unified, context-aware rendering.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useIntelReportsGlobe, useIntelReportsMain } from '../Core/IntelReports3DProvider';

// =============================================================================
// COMPONENT PROPS AND TYPES
// =============================================================================

export interface IntelGlobeMarkersProps {
  // Three.js integration
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  renderer: THREE.WebGLRenderer | null;
  globeObject: THREE.Object3D | null;
  
  // Marker configuration
  globeRadius?: number;
  hoverAltitude?: number;
  defaultScale?: number;
  
  // Interaction callbacks
  onMarkerHover?: (markerId: string | null) => void;
  onMarkerClick?: (markerId: string) => void;
  onMarkerSelect?: (markerIds: string[]) => void;
  
  // Styling
  className?: string;
}

// =============================================================================
// INTEL GLOBE MARKERS COMPONENT
// =============================================================================

export const IntelGlobeMarkers: React.FC<IntelGlobeMarkersProps> = ({
  scene,
  camera,
  renderer,
  globeObject,
  globeRadius = 100,
  hoverAltitude = 5,
  defaultScale = 1,
  onMarkerHover,
  onMarkerClick,
  onMarkerSelect,
  className = 'intel-globe-markers'
}) => {
  
  // Debug logging for unused parameters
  console.debug('Intel Globe Markers initialized with:', {
    globeRadius,
    hoverAltitude,
    defaultScale
  });
  
  // Access Intel Reports 3D hooks through context
  const { 
    intelReports,
    loading: reportsLoading,
    error: reportsError
  } = useIntelReportsMain();
  
  const {
    initialized: globeInitialized,
    markers,
    hoveredMarker,
    selectedMarkers,
    loading: globeLoading,
    error: globeError,
    initializeGlobe,
    destroyGlobe,
    addIntelReports,
    setInteractionHandlers
  } = useIntelReportsGlobe();
  
  // Refs for tracking initialization state
  const isInitializedRef = useRef<boolean>(false);
  const lastReportsCountRef = useRef<number>(0);
  
  // Initialize globe service when Three.js components are available
  useEffect(() => {
    if (!scene || !camera || !renderer || !globeObject) {
      return;
    }
    
    if (!globeInitialized && !isInitializedRef.current) {
      try {
        initializeGlobe(scene, camera, renderer, globeObject);
        isInitializedRef.current = true;
        
        console.log('Intel Globe Markers: Globe service initialized');
      } catch (error) {
        console.error('Intel Globe Markers: Failed to initialize globe service:', error);
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (isInitializedRef.current) {
        destroyGlobe();
        isInitializedRef.current = false;
      }
    };
  }, [scene, camera, renderer, globeObject, globeInitialized, initializeGlobe, destroyGlobe]);
  
  // Setup interaction handlers
  useEffect(() => {
    if (!globeInitialized) return;
    
    setInteractionHandlers({
      onMarkerHover: (marker) => {
        const markerId = marker?.id || null;
        onMarkerHover?.(markerId);
      },
      onMarkerClick: (marker) => {
        if (marker?.id) {
          onMarkerClick?.(marker.id);
        }
      },
      onMarkerSelect: (markers) => {
        const markerIds = markers.map(m => m.id);
        onMarkerSelect?.(markerIds);
      }
    });
  }, [globeInitialized, setInteractionHandlers, onMarkerHover, onMarkerClick, onMarkerSelect]);
  
  // Sync Intel reports with globe markers
  useEffect(() => {
    if (!globeInitialized || reportsLoading || !intelReports.length) {
      return;
    }
    
    // Only update if the reports count has changed to prevent unnecessary re-renders
    if (intelReports.length !== lastReportsCountRef.current) {
      try {
        addIntelReports(intelReports);
        lastReportsCountRef.current = intelReports.length;
        
        console.log(`Intel Globe Markers: Updated ${intelReports.length} markers`);
      } catch (error) {
        console.error('Intel Globe Markers: Failed to add reports to globe:', error);
      }
    }
  }, [globeInitialized, intelReports, reportsLoading, addIntelReports]);
  
  // Component doesn't render any DOM elements - it's purely for Three.js integration
  // The actual 3D markers are rendered directly into the Three.js scene
  
  // For debugging purposes, we can optionally render a status indicator
  if (process.env.NODE_ENV === 'development') {
    const hasErrors = reportsError || globeError;
    const isLoading = reportsLoading || globeLoading;
    
    return (
      <div 
        className={`${className} intel-globe-markers-debug`}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: hasErrors ? '#ffebee' : isLoading ? '#fff3e0' : '#e8f5e8',
          color: hasErrors ? '#c62828' : isLoading ? '#ef6c00' : '#2e7d32',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
          border: '1px solid',
          borderColor: hasErrors ? '#ffcdd2' : isLoading ? '#ffcc02' : '#c8e6c9'
        }}
      >
        Intel 3D: {hasErrors ? 'Error' : isLoading ? 'Loading' : `${markers.length} markers`}
        {hoveredMarker && <div>Hover: {hoveredMarker.id}</div>}
        {selectedMarkers.length > 0 && <div>Selected: {selectedMarkers.length}</div>}
      </div>
    );
  }
  
  // In production, render nothing (Three.js rendering happens in background)
  return null;
};

// =============================================================================
// DISPLAY NAME FOR DEBUGGING
// =============================================================================

IntelGlobeMarkers.displayName = 'IntelGlobeMarkers';
