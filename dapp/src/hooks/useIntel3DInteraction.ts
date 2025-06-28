/**
 * useIntel3DInteraction - React hook for game-inspired 3D Intel Report interactions
 * 
 * This hook manages the Intel3DInteractionManager and provides React-friendly
 * state and event handling for 3D Intel Report model interactions.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Intel3DInteractionManager, 
  Intel3DModel,
  Intel3DEventListener 
} from '../services/Intel3DInteractionManager';
import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';

interface UseIntel3DInteractionProps {
  globeRef: React.RefObject<{ camera: () => THREE.Camera; scene: () => THREE.Scene }>;
  containerRef: React.RefObject<HTMLDivElement>;
  models: ModelInstance[];
  enabled?: boolean;
}

interface ModelInstance {
  positionContainer: THREE.Group;
  orientationContainer: THREE.Group;
  rotationContainer: THREE.Group;
  mesh: THREE.Object3D;
  report: IntelReportOverlayMarker;
  basePosition: THREE.Vector3;
  hoverOffset: number;
  localRotationY: number;
}

interface Intel3DInteractionState {
  hoveredModel: Intel3DModel | null;
  clickedModel: Intel3DModel | null;
  mousePosition: { x: number; y: number };
  screenPositions: Map<string, THREE.Vector2>;
}

export function useIntel3DInteraction({
  globeRef,
  containerRef,
  models,
  enabled = true
}: UseIntel3DInteractionProps) {
  const managerRef = useRef<Intel3DInteractionManager>(new Intel3DInteractionManager());
  const [state, setState] = useState<Intel3DInteractionState>({
    hoveredModel: null,
    clickedModel: null,
    mousePosition: { x: 0, y: 0 },
    screenPositions: new Map()
  });

  // Initialize the interaction manager
  useEffect(() => {
    if (!enabled || !globeRef.current) return;

    const manager = managerRef.current;
    const globeObj = globeRef.current as unknown as { 
      camera: () => THREE.Camera;
    };
    
    const camera = globeObj?.camera();
    if (camera) {
      manager.initialize(camera);
    }

    return () => {
      manager.dispose();
    };
  }, [enabled, globeRef]);

  // Register/unregister models with the interaction manager
  useEffect(() => {
    if (!enabled) return;

    const manager = managerRef.current;

    // Register new models
    models.forEach(modelInstance => {
      const existingModel = manager.getModel(modelInstance.report.pubkey);
      if (!existingModel) {
        manager.registerModel(
          modelInstance.report.pubkey,
          modelInstance.mesh,
          modelInstance.report
        );
      }
    });

    // Unregister removed models
    // TODO: Track previous models to unregister removed ones
    // For now, cleanup is handled by manager dispose

    return () => {
      // Cleanup handled by manager dispose
    };
  }, [models, enabled]);

  // Event listeners for interaction events
  useEffect(() => {
    if (!enabled) return;

    const manager = managerRef.current;

    const hoverListener: Intel3DEventListener = (event) => {
      setState(prev => ({
        ...prev,
        hoveredModel: event.model
      }));
    };

    const unhoverListener: Intel3DEventListener = () => {
      setState(prev => ({
        ...prev,
        hoveredModel: null
      }));
    };

    const clickListener: Intel3DEventListener = (event) => {
      setState(prev => ({
        ...prev,
        clickedModel: event.model
      }));
    };

    manager.addEventListener('hover', hoverListener);
    manager.addEventListener('unhover', unhoverListener);
    manager.addEventListener('click', clickListener);

    return () => {
      manager.removeEventListener('hover', hoverListener);
      manager.removeEventListener('unhover', unhoverListener);
      manager.removeEventListener('click', clickListener);
    };
  }, [enabled]);

  // Mouse event handling
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update mouse position state
    setState(prev => ({
      ...prev,
      mousePosition: { 
        x: event.clientX, // Global coordinates for tooltips
        y: event.clientY 
      }
    }));

    // Update interaction manager
    managerRef.current.updateMousePosition(x, y, rect.width, rect.height);
  }, [enabled, containerRef]);

  const handleMouseClick = useCallback(() => {
    if (!enabled) return;
    managerRef.current.handleClick();
  }, [enabled]);

  // Set up mouse event listeners
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleMouseClick);
    };
  }, [enabled, containerRef, handleMouseMove, handleMouseClick]);

  // Update screen positions for UI positioning
  useEffect(() => {
    if (!enabled || !globeRef.current || !containerRef.current) return;

    const updateScreenPositions = () => {
      const globeObj = globeRef.current as unknown as { 
        camera: () => THREE.Camera;
      };
      
      const camera = globeObj?.camera();
      const container = containerRef.current;
      
      if (camera && container) {
        const rect = container.getBoundingClientRect();
        managerRef.current.updateScreenPositions(camera, rect.width, rect.height);
        
        // Update state with screen positions
        const screenPositions = new Map<string, THREE.Vector2>();
        models.forEach(modelInstance => {
          const model = managerRef.current.getModel(modelInstance.report.pubkey);
          if (model && model.screenPosition) {
            screenPositions.set(modelInstance.report.pubkey, model.screenPosition);
          }
        });
        
        setState(prev => ({
          ...prev,
          screenPositions
        }));
      }
    };

    // Update screen positions on animation frame
    const intervalId = setInterval(updateScreenPositions, 16); // ~60fps

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, globeRef, containerRef, models]);

  // Clear clicked state function
  const clearClickedState = useCallback(() => {
    managerRef.current.clearClickedState();
    setState(prev => ({
      ...prev,
      clickedModel: null
    }));
  }, []);

  // Get screen position for a model
  const getModelScreenPosition = useCallback((modelId: string): THREE.Vector2 | null => {
    return state.screenPositions.get(modelId) || null;
  }, [state.screenPositions]);

  // Update cursor based on hover state
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    container.style.cursor = state.hoveredModel ? 'pointer' : 'grab';
  }, [enabled, containerRef, state.hoveredModel]);

  return {
    // State
    hoveredModel: state.hoveredModel,
    clickedModel: state.clickedModel,
    mousePosition: state.mousePosition,
    
    // Functions
    clearClickedState,
    getModelScreenPosition,
    
    // Manager reference (for advanced usage)
    manager: managerRef.current
  };
}

export default useIntel3DInteraction;
