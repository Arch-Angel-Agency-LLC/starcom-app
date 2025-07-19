// GlobeSolarSystemIntegration.tsx - Integration component for solar system in Globe

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GlobeMethods } from 'react-globe.gl';
import { SolarSystemManager } from '../../solar-system/SolarSystemManager';
import type { SolarSystemManagerDependencies, SolarSystemState } from '../../solar-system/SolarSystemManager';

interface GlobeSolarSystemIntegrationProps {
  globeRef: React.RefObject<GlobeMethods>;
  enabled?: boolean;
  debugMode?: boolean;
  onStateChange?: (state: SolarSystemState) => void;
}

export const useGlobeSolarSystemIntegration = ({
  globeRef,
  enabled = true,
  debugMode = false,
  onStateChange
}: GlobeSolarSystemIntegrationProps) => {
  const [solarSystemManager, setSolarSystemManager] = useState<SolarSystemManager | null>(null);
  const [solarSystemState, setSolarSystemState] = useState<SolarSystemState | null>(null);
  const animationFrameRef = useRef<number>();
  const managerRef = useRef<SolarSystemManager | null>(null);

  // Initialize SolarSystemManager when Globe is ready
  useEffect(() => {
    if (!enabled || !globeRef.current) {
      // Clean up existing manager if disabled
      if (managerRef.current) {
        try {
          managerRef.current.dispose();
          setSolarSystemManager(null);
          setSolarSystemState(null);
          managerRef.current = null;
          if (debugMode) {
            console.log('SolarSystemManager disposed - integration disabled');
          }
        } catch (error) {
          console.warn('Error disposing solar system manager:', error);
        }
      }
      return;
    }

    try {
      const globe = globeRef.current;
      
      // Add safety checks for globe methods
      if (!globe || typeof globe.scene !== 'function' || typeof globe.camera !== 'function') {
        console.warn('Globe scene or camera not available for solar system integration');
        return;
      }

      const scene = globe.scene();
      const camera = globe.camera();

      if (!scene || !camera) {
        console.warn('Globe scene or camera returned null for solar system integration');
        return;
      }

      const dependencies: SolarSystemManagerDependencies = {
        scene,
        camera,
        globe: {
          scene: () => {
            try {
              return globe.scene();
            } catch (error) {
              console.warn('Error accessing globe scene:', error);
              return null;
            }
          },
          camera: () => {
            try {
              return globe.camera();
            } catch (error) {
              console.warn('Error accessing globe camera:', error);
              return null;
            }
          }
        }
      };

      const manager = new SolarSystemManager(dependencies, {
        globeRadius: 100, // Match Globe.gl default
        enableTransitions: true,
        transitionDuration: 500,
        performanceMode: 'balanced',
        debugMode
      });

      // Set up state change listener
      manager.onStateChange((state) => {
        setSolarSystemState(state);
        onStateChange?.(state);
      });

      setSolarSystemManager(manager);
      managerRef.current = manager;

      if (debugMode) {
        console.log('SolarSystemManager initialized for Globe integration');
      }

    } catch (error) {
      console.error('Failed to initialize solar system integration:', error);
    }

    return () => {
      // Cleanup when effect re-runs or component unmounts
      if (managerRef.current) {
        try {
          managerRef.current.dispose();
          if (debugMode) {
            console.log('SolarSystemManager disposed during cleanup');
          }
        } catch (error) {
          console.warn('Error during solar system cleanup:', error);
        }
        managerRef.current = null;
      }
    };
  }, [globeRef, enabled, debugMode, onStateChange]);

  // Set up camera distance monitoring
  useEffect(() => {
    if (!managerRef.current || !globeRef.current) return;

    const updateCameraDistance = () => {
      try {
        const globe = globeRef.current;
        if (!globe || typeof globe.camera !== 'function') return;
        
        const camera = globe.camera();
        if (!camera || !camera.position) return;
        
        const earthCenter = new THREE.Vector3(0, 0, 0);
        const distance = camera.position.distanceTo(earthCenter);
        
        // Add safety check for valid distance
        if (!isFinite(distance) || distance < 0) {
          console.warn('Invalid camera distance calculated:', distance);
          return;
        }
        
        managerRef.current?.updateScale(distance);
      } catch (error) {
        if (debugMode) {
          console.warn('Error updating camera distance:', error);
        }
      }
    };

    // Initial update
    updateCameraDistance();

    // Set up animation loop for continuous monitoring
    const animate = () => {
      updateCameraDistance();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [globeRef, debugMode]); // Now we only depend on globeRef and debugMode

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        try {
          managerRef.current.dispose();
        } catch (error) {
          console.warn('Error during final cleanup:', error);
        }
        managerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty dependency array for cleanup on unmount only

  return {
    solarSystemManager,
    solarSystemState,
    isActive: !!solarSystemManager,
    sunVisible: solarSystemState?.sunState?.isVisible || false,
    currentScale: solarSystemState?.currentContext
  };
};
