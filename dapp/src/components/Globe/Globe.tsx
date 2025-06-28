// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { useGlobeLoading } from '../../context/GlobeLoadingContext';
import { GlobeEngine } from '../../globe-engine/GlobeEngine';
import { useSpaceWeatherContext } from '../../context/SpaceWeatherContext';
import GlobeLoadingManager from './GlobeLoadingManager';
import { useIntelReport3DMarkers } from '../../hooks/useIntelReport3DMarkers';
import { intelReportVisualizationService } from '../../services/IntelReportVisualizationService';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';

const GlobeView: React.FC = () => {
  const [globeData, setGlobeData] = useState<object[]>([]);
  const globeRef = useRef<GlobeMethods>();
  const { setFocusLocation } = useGlobeContext();
  const { visualizationMode } = useVisualizationMode();
  const { hasGlobeLoadedBefore, markGlobeAsLoaded, setGlobeInitialized } = useGlobeLoading();
  const [globeEngine, setGlobeEngine] = useState<GlobeEngine | null>(null);
  const [material, setMaterial] = useState<THREE.Material | null>(null);
  const bordersRef = useRef<THREE.Group>(null);
  const territoriesRef = useRef<THREE.Group>(null);
  
  // Intel Report 3D markers state
  const [intelReports, setIntelReports] = useState<IntelReportOverlayMarker[]>([]);
  const intelMarkerGroupRef = useRef<THREE.Group>(new THREE.Group());
  
  // Space weather integration via context
  const { 
    visualizationVectors 
    // isLoading: _spaceWeatherLoading,
    // error: _spaceWeatherError 
  } = useSpaceWeatherContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(!hasGlobeLoadedBefore);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // Fast track initialization if Globe has loaded before
    const initDelay = hasGlobeLoadedBefore ? 0 : 800; // No delay for subsequent loads
    
    const initTimer = setTimeout(() => {
      const engine = new GlobeEngine({ mode: visualizationMode.mode });
      setGlobeEngine(engine);
      
      // Check for material with appropriate timing
      const materialCheckInterval = hasGlobeLoadedBefore ? 10 : 100; // Faster checks for subsequent loads
      const checkMaterial = setInterval(() => {
        const mat = engine.getMaterial();
        if (mat) {
          setMaterial(mat);
          // Mark as ready for rendering
          const readyDelay = hasGlobeLoadedBefore ? 0 : 100; // Instant for subsequent loads
          setTimeout(() => {
            setIsInitializing(false);
            setGlobeInitialized(true);
            if (!hasGlobeLoadedBefore) {
              markGlobeAsLoaded(); // Mark as loaded only on first successful initialization
            }
          }, readyDelay);
          clearInterval(checkMaterial);
        }
      }, materialCheckInterval);
      
      return () => clearInterval(checkMaterial);
    }, initDelay);

    return () => clearTimeout(initTimer);
  }, [visualizationMode.mode, hasGlobeLoadedBefore, markGlobeAsLoaded, setGlobeInitialized]);

  // Track container size for responsive Globe
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use the full available space, only enforce minimum for very small screens
        setContainerSize({ 
          width: Math.max(rect.width, 200), 
          height: Math.max(rect.height, 200) 
        });
      }
    };

    // Initial size
    updateSize();

    // Create ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Also listen to window resize as backup
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    // Example: update globe data if needed (can be extended for overlays)
    setGlobeData([]); // TODO: Use overlay/event data from GlobeEngine if needed
  }, [globeEngine]);

  // Intel Report 3D markers integration
  useEffect(() => {
    let mounted = true;

    // Fetch Intel Reports for 3D visualization
    const loadIntelReports = async () => {
      try {
        const markers = await intelReportVisualizationService.getIntelReportMarkers({
          maxReports: 50 // Limit for performance
        });
        
        if (mounted) {
          setIntelReports(markers);
          console.log(`Loaded ${markers.length} Intel Report 3D markers`);
        }
      } catch (error) {
        console.error('Error loading Intel Report markers:', error);
      }
    };

    loadIntelReports();

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(loadIntelReports, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Add Intel Report 3D markers to the Globe scene
  useEffect(() => {
    if (!globeRef.current || !intelReports.length) return;

    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj?.scene();
    const intelGroup = intelMarkerGroupRef.current;

    if (scene && intelGroup && !scene.children.includes(intelGroup)) {
      scene.add(intelGroup);
      console.log('Intel Report 3D marker group added to Globe scene');
    }

    return () => {
      if (scene && intelGroup) {
        scene.remove(intelGroup);
      }
    };
  }, [globeRef, intelReports]);

  // Initialize 3D Intel Report markers using the hook
  useIntelReport3DMarkers(
    intelReports, 
    globeRef.current ? (globeRef.current as unknown as { scene: () => THREE.Scene }).scene() : null,
    globeRef.current ? (globeRef.current as unknown as { camera: () => THREE.Camera }).camera() : null,
    null, // No longer need globe object reference
    {
      globeRadius: 100,
      hoverAltitude: 12,  // Increased from 8 to 12 for larger models
      rotationSpeed: 0.005,
      scale: 4.0  // Increased from 0.8 to 4.0 (5x larger)
    }
  );

  useEffect(() => {
    if (!globeRef.current) return;
    // GlobeMethods type does not expose .scene(), so we cast to the correct type
    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj && globeObj.scene();
    const bordersGroup = bordersRef.current;
    const territoriesGroup = territoriesRef.current;
    const intelGroup = intelMarkerGroupRef.current;
    
    if (scene && bordersGroup && !scene.children.includes(bordersGroup)) {
      scene.add(bordersGroup);
    }
    if (scene && territoriesGroup && !scene.children.includes(territoriesGroup)) {
      scene.add(territoriesGroup);
    }
    if (scene && intelGroup && !scene.children.includes(intelGroup)) {
      scene.add(intelGroup);
    }
    
    return () => {
      if (scene && bordersGroup) scene.remove(bordersGroup);
      if (scene && territoriesGroup) scene.remove(territoriesGroup);
      if (scene && intelGroup) scene.remove(intelGroup);
    };
  }, [globeRef, bordersRef, territoriesRef, globeEngine]);

  const handleGlobeClick = ({ lat, lng }: { lat: number; lng: number }) => {
    const newMarker = { lat, lng, size: 0.5, color: 'red' };
    setGlobeData((prevData) => [...prevData, newMarker]);
    setFocusLocation({ lat, lng });
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 1.5 });
    }
  };

  // Add debounce utility for resize handling
  // AI-NOTE: Fix for stack overflow caused by recursive resize event dispatch
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    function handleResize() {
      // Clear any existing timeout to debounce resize calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        // Force Globe to re-render with new window dimensions
        if (globeRef.current) {
          // Access the internal controls to trigger a re-render without dispatching events
          const globeInstance = globeRef.current as unknown as { controls?: { update: () => void } };
          if (globeInstance.controls && typeof globeInstance.controls.update === 'function') {
            globeInstance.controls.update();
          }
        }
      }, 100); // Debounce resize calls by 100ms
    }

    // Handle page visibility changes
    function handleVisibilityChange() {
      if (!document.hidden) {
        // Page became visible, refresh globe
        setTimeout(() => {
          handleResize();
        }, 100);
      }
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial sizing
    setTimeout(handleResize, 50);
    setTimeout(handleResize, 200);

    return () => {
      // Clear any pending debounced resize calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Space weather data visualization effect
  useEffect(() => {
    if (!globeEngine) return;
    
    if (!visualizationVectors.length) {
      // Clear space weather markers when no data or disabled
      setGlobeData(prevData => prevData.filter((d: { type?: string }) => d.type !== 'space-weather'));
      return;
    }
    
    // Use pre-processed visualization vectors from context
    const spaceWeatherMarkers = visualizationVectors.map(vector => ({
      lat: vector.latitude,
      lng: vector.longitude,
      size: vector.size,
      color: vector.color,
      label: `E-Field: ${vector.magnitude.toFixed(2)} V/m`,
      magnitude: vector.magnitude,
      direction: vector.direction,
      quality: vector.quality,
      type: 'space-weather' // Add type for filtering and rendering
    }));
    
    // Update the overlay data using the new method
    globeEngine.updateSpaceWeatherVisualization(spaceWeatherMarkers);
    
    // CRITICAL: Merge space weather data into globe's point data for actual rendering
    setGlobeData(prevData => {
      // Remove existing space weather markers
      const nonSpaceWeatherData = prevData.filter((d: { type?: string }) => d.type !== 'space-weather');
      // Add new space weather markers
      return [...nonSpaceWeatherData, ...spaceWeatherMarkers];
    });
    
  }, [globeEngine, visualizationVectors]);

  return (
    <div ref={containerRef} style={{ 
      position: 'relative',
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      opacity: isInitializing ? 0 : 1,
      transition: 'opacity 0.5s ease-in-out',
      // Remove centering from main container to let Globe fill space
      minWidth: '100%',
      minHeight: '100%'
    }}>
      <GlobeLoadingManager 
        material={material} 
        globeEngine={globeEngine}
        fastTrackMode={false} // TODO: Add user setting for fast loading
      >        {/* Globe render with full space utilization */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}>
          <Globe
          ref={globeRef}
          width={containerSize.width}
          height={containerSize.height}
          pointsData={globeData.filter((d: { lat?: number; lng?: number }) => d.lat !== undefined && d.lng !== undefined)}
          pointAltitude={(d: { size?: number }) => d.size || 0.5}
          pointColor={(d: { type?: string; color?: string }) => {
            if (d.type === 'space-weather') return d.color || 'purple';
            if (d.type === 'intel') return 'orange';
            if (d.type === 'earthquake') return 'red';
            if (d.type === 'volcano') return 'purple';
            if (d.type === 'cyber') return 'cyan';
            if (d.type === 'system') return 'yellow';
            if (d.type === 'storm') return 'blue';
            if (d.type === 'cloud') return 'gray';
            return d.color || 'white';
          }}
          globeMaterial={material ?? undefined}
          onGlobeClick={handleGlobeClick}
          // Configure renderer for optimal space usage
          rendererConfig={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false
          }}
          // Disable automatic camera positioning that might constrain view
          enablePointerInteraction={true}
          // ...existing Globe props...
        />
      </div>
      
      {/* Borders and territories overlays would be attached to the Three.js scene here in a custom renderer or with react-three-fiber */}
      </GlobeLoadingManager>
    </div>
  );
};

export default GlobeView;
// AI-NOTE: Refactored to use GlobeEngine. See globe-engine-api.artifact for integration details.
// Artifact references:
// - Overlay UI/UX: globe-overlays.artifact (UI/UX Guidelines)
// - Overlay logic: globe-engine-api.artifact, globe-modes.artifact