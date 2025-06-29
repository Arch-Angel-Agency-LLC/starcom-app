// Globe3DInputManager.ts - Main orchestrator for all globe interactions
// Replaces the old EnhancedGlobeInteractivity with a clean, modular architecture

import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { InteractionMode, interactionModeManager, ModeConfiguration } from './InteractionModeSystem';
import { AdvancedInputSystem, InputEvent, GestureEvent } from './AdvancedInputSystem';

// Props interface for the new system
export interface Globe3DInputManagerProps {
  globeRef: React.RefObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  containerRef: React.RefObject<HTMLDivElement>;
  
  // Mode configuration
  initialMode?: InteractionMode;
  allowedModes?: InteractionMode[];
  
  // Visual feedback callbacks
  onCursorChange?: (cursor: string) => void;
  onModeChange?: (mode: InteractionMode, config: ModeConfiguration) => void;
  
  // Action callbacks (preserved from original interface)
  onIntelReportCreate?: (lat: number, lng: number) => void;
  onIntelReportSelect?: (reportId: string) => void;
  onIntelReportHover?: (reportId: string | null) => void;
  
  // Measurement callbacks
  onMeasurementStart?: (startPos: { lat: number; lng: number }) => void;
  onMeasurementUpdate?: (points: Array<{ lat: number; lng: number }>) => void;
  onMeasurementComplete?: (result: { distance: number; area?: number }) => void;
  
  // Annotation callbacks
  onAnnotationCreate?: (pos: { lat: number; lng: number }, text: string) => void;
  onAnnotationEdit?: (id: string, text: string) => void;
  
  // Configuration
  config?: {
    dragThreshold?: number;
    tapThreshold?: number;
    enableTouchGestures?: boolean;
    enableKeyboardShortcuts?: boolean;
    debugMode?: boolean;
  };
  
  // Intel Report models (preserve existing functionality)
  intelReportModels?: Array<{
    id: string;
    mesh: THREE.Object3D;
    position: { lat: number; lng: number };
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }>;
}

// Main hook for the new system
export const useGlobe3DInputManager = ({
  globeRef,
  containerRef,
  initialMode = InteractionMode.NAVIGATION,
  allowedModes = Object.values(InteractionMode),
  onCursorChange,
  onModeChange,
  onIntelReportCreate,
  onIntelReportSelect,
  onIntelReportHover,
  onMeasurementStart,
  onMeasurementUpdate,
  onMeasurementComplete,
  onAnnotationCreate,
  onAnnotationEdit,
  config = {},
  intelReportModels = []
}: Globe3DInputManagerProps) => {
  
  // Core system references
  const inputSystemRef = useRef<AdvancedInputSystem | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mousePositionRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // State for globe interactions
  const [globeHoverPosition, setGlobeHoverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  
  // Mode management state
  const [currentMode, setCurrentMode] = useState<InteractionMode>(initialMode);
  const [isInputSystemReady, setIsInputSystemReady] = useState(false);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  
  // Initialize the input system
  useEffect(() => {
    if (!containerRef.current) return;
    
    const inputSystem = new AdvancedInputSystem({
      dragThreshold: config.dragThreshold || 5,
      tapThreshold: config.tapThreshold || 3,
      enableTouchGestures: config.enableTouchGestures !== false,
      enableKeyboardShortcuts: config.enableKeyboardShortcuts !== false,
      ...config
    });
    
    inputSystem.initialize(containerRef.current);
    inputSystemRef.current = inputSystem;
    setIsInputSystemReady(true);
    
    // Set initial mode
    interactionModeManager.switchMode(initialMode);
    
    return () => {
      inputSystem.destroy();
      inputSystemRef.current = null;
      setIsInputSystemReady(false);
    };
  }, [containerRef, config, initialMode]);
  
  // Globe intersection utilities
  const getGlobeIntersection = useCallback((mousePos: { x: number; y: number }): { lat: number; lng: number } | null => {
    if (!globeRef.current || !containerRef.current) return null;
    
    const globeObj = globeRef.current as unknown as { 
      scene: () => THREE.Scene; 
      camera: () => THREE.Camera;
    };
    
    const scene = globeObj?.scene();
    const camera = globeObj?.camera();
    if (!scene || !camera) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    mousePositionRef.current.x = (mousePos.x / rect.width) * 2 - 1;
    mousePositionRef.current.y = -(mousePos.y / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mousePositionRef.current, camera);
    
    // Find globe mesh
    let globeMesh: THREE.Mesh | null = null;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
        globeMesh = child;
      }
    });
    
    if (!globeMesh) return null;
    
    const intersects = raycasterRef.current.intersectObject(globeMesh);
    if (intersects.length === 0) return null;
    
    const point = intersects[0].point;
    const radius = 100; // Globe radius
    
    // Convert 3D point to lat/lng
    const lat = 90 - (Math.acos(point.y / radius) * 180 / Math.PI);
    const lng = ((270 + (Math.atan2(point.x, point.z) * 180 / Math.PI)) % 360) - 180;
    
    return { lat, lng };
  }, [globeRef, containerRef]);
  
  // Intel Report model intersection
  const getIntelReportIntersection = useCallback((mousePos: { x: number; y: number }): string | null => {
    if (!globeRef.current || !containerRef.current || intelReportModels.length === 0) return null;
    
    const globeObj = globeRef.current as unknown as { 
      scene: () => THREE.Scene; 
      camera: () => THREE.Camera;
    };
    
    const camera = globeObj?.camera();
    if (!camera) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    mousePositionRef.current.x = (mousePos.x / rect.width) * 2 - 1;
    mousePositionRef.current.y = -(mousePos.y / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mousePositionRef.current, camera);
    
    const meshes = intelReportModels.map(model => model.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes, true);
    
    if (intersects.length === 0) return null;
    
    // Find which model was intersected
    const intersectedMesh = intersects[0].object;
    const model = intelReportModels.find(m => 
      m.mesh === intersectedMesh || 
      m.mesh.children.includes(intersectedMesh) ||
      isChildOfMesh(intersectedMesh, m.mesh)
    );
    
    return model?.id || null;
  }, [globeRef, containerRef, intelReportModels]);
  
  // Helper function
  const isChildOfMesh = (object: THREE.Object3D, parent: THREE.Object3D): boolean => {
    let current = object.parent;
    while (current) {
      if (current === parent) return true;
      current = current.parent;
    }
    return false;
  };
  
  // Mode-specific input handlers
  const handleNavigationMode = useCallback((event: InputEvent | GestureEvent) => {
    // Navigation mode allows all globe controls (rotation, zoom, pan)
    // This preserves existing Three.js/react-globe-gl behavior
    if (config.debugMode) {
      setDebugInfo(prev => ({ ...prev, navigation: { event: event.type, timestamp: event.timestamp } }));
    }
  }, [config.debugMode]);
  
  const handleIntelCreationMode = useCallback((event: InputEvent | GestureEvent) => {
    if (event.type === 'mouse' && event.action === 'up') {
      const inputEvent = event as InputEvent;
      if (!inputEvent.position) return;
      
      const globePos = getGlobeIntersection(inputEvent.position);
      if (globePos) {
        onIntelReportCreate?.(globePos.lat, globePos.lng);
        // Optionally switch back to inspection mode after creation
        interactionModeManager.switchMode(InteractionMode.INTEL_INSPECTION);
      }
    }
  }, [getGlobeIntersection, onIntelReportCreate]);
  
  const handleIntelInspectionMode = useCallback((event: InputEvent | GestureEvent) => {
    if (event.type !== 'mouse') return;
    
    const inputEvent = event as InputEvent;
    if (!inputEvent.position) return;
    
    if (inputEvent.action === 'move') {
      // Handle hover
      const intelId = getIntelReportIntersection(inputEvent.position);
      if (intelId !== hoveredObjectId) {
        setHoveredObjectId(intelId);
        onIntelReportHover?.(intelId);
      }
      
      // Update globe hover position for potential creation
      const globePos = getGlobeIntersection(inputEvent.position);
      setGlobeHoverPosition(globePos);
      
    } else if (inputEvent.action === 'up') {
      // Handle click/selection
      const intelId = getIntelReportIntersection(inputEvent.position);
      if (intelId) {
        setSelectedObjects([intelId]);
        onIntelReportSelect?.(intelId);
      } else {
        // Click on empty globe area - create new intel report
        const globePos = getGlobeIntersection(inputEvent.position);
        if (globePos) {
          onIntelReportCreate?.(globePos.lat, globePos.lng);
        }
      }
    }
  }, [getIntelReportIntersection, getGlobeIntersection, hoveredObjectId, onIntelReportHover, onIntelReportSelect, onIntelReportCreate]);
  
  const handleMeasurementMode = useCallback((event: InputEvent | GestureEvent) => {
    if (event.type === 'mouse' && event.action === 'up') {
      const inputEvent = event as InputEvent;
      if (!inputEvent.position) return;
      
      const globePos = getGlobeIntersection(inputEvent.position);
      if (globePos) {
        onMeasurementStart?.(globePos);
        // Implement measurement logic here
      }
    }
  }, [getGlobeIntersection, onMeasurementStart]);
  
  const handleAnnotationMode = useCallback((event: InputEvent | GestureEvent) => {
    if (event.type === 'mouse' && event.action === 'up') {
      const inputEvent = event as InputEvent;
      if (!inputEvent.position) return;
      
      const globePos = getGlobeIntersection(inputEvent.position);
      if (globePos) {
        // Trigger annotation creation dialog
        const text = prompt('Enter annotation text:');
        if (text) {
          onAnnotationCreate?.(globePos, text);
        }
      }
    }
  }, [getGlobeIntersection, onAnnotationCreate]);
  
  const handleSimulationMode = useCallback((event: InputEvent | GestureEvent) => {
    // Simulation mode - custom interaction logic
    if (config.debugMode) {
      setDebugInfo(prev => ({ ...prev, simulation: { event: event.type, timestamp: event.timestamp } }));
    }
  }, [config.debugMode]);
  
  // Set up input event listeners based on current mode
  useEffect(() => {
    if (!inputSystemRef.current || !isInputSystemReady) return;
    
    const inputSystem = inputSystemRef.current;
    const modeConfig = interactionModeManager.getCurrentConfig();
    
    // Clear previous listeners
    inputSystem.off('mouse_move', handleNavigationMode);
    inputSystem.off('mouse_up', handleNavigationMode);
    inputSystem.off('mouse_move', handleIntelCreationMode);
    inputSystem.off('mouse_up', handleIntelCreationMode);
    inputSystem.off('mouse_move', handleIntelInspectionMode);
    inputSystem.off('mouse_up', handleIntelInspectionMode);
    inputSystem.off('mouse_up', handleMeasurementMode);
    inputSystem.off('mouse_up', handleAnnotationMode);
    inputSystem.off('mouse_move', handleSimulationMode);
    inputSystem.off('mouse_up', handleSimulationMode);
    
    // Set up listeners based on current mode
    switch (currentMode) {
      case InteractionMode.NAVIGATION:
        inputSystem.on('mouse_move', handleNavigationMode);
        inputSystem.on('mouse_up', handleNavigationMode);
        break;
        
      case InteractionMode.INTEL_CREATION:
        inputSystem.on('mouse_move', handleIntelCreationMode);
        inputSystem.on('mouse_up', handleIntelCreationMode);
        break;
        
      case InteractionMode.INTEL_INSPECTION:
        inputSystem.on('mouse_move', handleIntelInspectionMode);
        inputSystem.on('mouse_up', handleIntelInspectionMode);
        break;
        
      case InteractionMode.MEASUREMENT:
        inputSystem.on('mouse_up', handleMeasurementMode);
        break;
        
      case InteractionMode.ANNOTATION:
        inputSystem.on('mouse_up', handleAnnotationMode);
        break;
        
      case InteractionMode.SIMULATION:
        inputSystem.on('mouse_move', handleSimulationMode);
        inputSystem.on('mouse_up', handleSimulationMode);
        break;
    }
    
    // Update cursor
    onCursorChange?.(modeConfig.visual.cursor);
    
  }, [currentMode, isInputSystemReady, onCursorChange, 
      handleNavigationMode, handleIntelCreationMode, handleIntelInspectionMode,
      handleMeasurementMode, handleAnnotationMode, handleSimulationMode]);
  
  // Mode change handler
  useEffect(() => {
    const handleModeChange = (newMode: InteractionMode) => {
      setCurrentMode(newMode);
      const config = interactionModeManager.getCurrentConfig();
      onModeChange?.(newMode, config);
      
      console.log(`🎮 Globe interaction mode: ${newMode}`);
    };
    
    interactionModeManager.onModeChange(handleModeChange);
  }, [onModeChange, config.debugMode]);
  
  // Keyboard shortcuts for mode switching
  useEffect(() => {
    if (!config.enableKeyboardShortcuts) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      // Mode switching shortcuts
      const modeShortcuts: Record<string, InteractionMode> = {
        'n': InteractionMode.NAVIGATION,
        'i': InteractionMode.INTEL_CREATION,
        'e': InteractionMode.INTEL_INSPECTION,
        'm': InteractionMode.MEASUREMENT,
        'a': InteractionMode.ANNOTATION,
        's': InteractionMode.SIMULATION
      };
      
      const targetMode = modeShortcuts[key];
      if (targetMode && allowedModes.includes(targetMode)) {
        event.preventDefault();
        interactionModeManager.switchMode(targetMode);
      }
      
      // ESC to go back to navigation
      if (key === 'escape') {
        interactionModeManager.switchMode(InteractionMode.NAVIGATION);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [config.enableKeyboardShortcuts, allowedModes]);
  
  // Public API
  const api = {
    // Mode control
    switchMode: (mode: InteractionMode) => interactionModeManager.switchMode(mode),
    getCurrentMode: () => currentMode,
    getCurrentConfig: () => interactionModeManager.getCurrentConfig(),
    
    // State access
    getGlobeHoverPosition: () => globeHoverPosition,
    getSelectedObjects: () => selectedObjects,
    getHoveredObject: () => hoveredObjectId,
    
    // Manual interaction triggers
    createIntelAtPosition: (lat: number, lng: number) => onIntelReportCreate?.(lat, lng),
    selectIntel: (id: string) => {
      setSelectedObjects([id]);
      onIntelReportSelect?.(id);
    },
    
    // Debug
    getDebugInfo: () => debugInfo,
    getInputState: () => inputSystemRef.current?.getInputState() || null
  };
  
  return api;
};
