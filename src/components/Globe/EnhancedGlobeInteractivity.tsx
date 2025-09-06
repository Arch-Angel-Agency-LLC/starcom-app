// EnhancedGlobeInteractivity.tsx
// Enhanced Globe component with Intel Report 3D model interactivity

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction } from '@solana/web3.js';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { useIntelReportInteractivity } from '../../hooks/useIntelReportInteractivity';
import { IntelReportTooltip } from '../ui/IntelReportTooltip/IntelReportTooltip';
import { IntelReportPopup } from '../ui/IntelReportPopup/IntelReportPopup';
import { EnhancedTeamCollaborationService } from '../../services/collaboration/EnhancedTeamCollaborationService';

interface EnhancedGlobeInteractivityProps {
  globeRef: React.RefObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  intelReports: IntelReportOverlayMarker[];
  visualizationMode: {
    mode: string;
    subMode: string;
  };
  models?: ModelInstance[]; // Add models prop
  onHoverChange?: (reportId: string | null) => void; // Add hover callback
  containerRef?: React.RefObject<HTMLDivElement>; // Add container ref
  // Advanced interaction configuration (game development pattern)
  interactionConfig?: {
    dragThreshold?: number;    // pixels - default 5
    timeThreshold?: number;    // ms - default 300
    enableHoverDuringDrag?: boolean; // default false
  };
}

interface GlobeControls {
  enableRotate: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  dampingFactor: number;
  enableDamping: boolean;
}

interface GlobeInstance {
  controls: () => GlobeControls;
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

export const EnhancedGlobeInteractivity: React.FC<EnhancedGlobeInteractivityProps> = ({
  globeRef,
  intelReports,
  visualizationMode,
  models = [],
  onHoverChange,
  containerRef: parentContainerRef,
  interactionConfig
}) => {
  const { publicKey } = useWallet();
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = parentContainerRef || localContainerRef; // Use parent container if provided
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Team collaboration state
  const [collaborationService, setCollaborationService] = useState<EnhancedTeamCollaborationService | null>(null);
  const [currentTeam] = useState<string | null>(null); // TODO: Connect to team selection UI
  
  // Extract interaction configuration with defaults
  const {
    dragThreshold = 5,
    timeThreshold = 300
    // enableHoverDuringDrag = false // Reserved for future enhancement
  } = interactionConfig || {};
  
  // Advanced interaction state management (game development pattern)
  // This implements a robust click vs drag detection system commonly used in 3D games:
  // 1. Track mouse down position and time
  // 2. Calculate drag distance during mouse move
  // 3. On mouse up, determine if it was a click (small distance, short time) or drag
  // 4. Only trigger click actions for actual clicks, not drag releases
  // This prevents the common UX issue where rotating the globe accidentally creates intel reports
  const [interactionState, setInteractionState] = useState({
    isMouseDown: false,
    dragStartPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    dragDistance: 0,
    mouseDownTime: 0,
    isDragging: false,
    hasDraggedPastThreshold: false
  });
  
  // Mouse position indicator state
  const [mousePositionIndicator, setMousePositionIndicator] = useState<THREE.Mesh | null>(null);
  const [globeHoverPosition, setGlobeHoverPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // Connection lines for Intel Reports
  const connectionLinesRef = useRef<THREE.Group>(new THREE.Group());

  // Initialize interactivity hook
  const {
    hoveredReport,
    selectedReport,
    tooltipVisible,
    popupVisible,
    handleModelHover,
    handleModelClick,
    handlePopupClose
  } = useIntelReportInteractivity({
    hoverDebounceMs: 100,
    enableKeyboardNavigation: true,
    enableTouchInteractions: true
  });

  // Initialize mouse position indicator
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj?.scene();
    if (!scene) return;

    // Create a small sphere to indicate mouse position on globe
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff41, 
      transparent: true, 
      opacity: 0.7,
      wireframe: true
    });
    const indicator = new THREE.Mesh(geometry, material);
    indicator.visible = false; // Initially hidden
    scene.add(indicator);
    setMousePositionIndicator(indicator);

    return () => {
      scene.remove(indicator);
    };
  }, [globeRef]);

  // Initialize connection lines group
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj?.scene();
    if (!scene) return;

    const linesGroup = connectionLinesRef.current;
    scene.add(linesGroup);

    return () => {
      scene.remove(linesGroup);
    };
  }, [globeRef]);

  // Update connection lines for Intel Reports
  useEffect(() => {
    if (!models.length || visualizationMode.mode !== 'CyberCommand' || visualizationMode.subMode !== 'IntelReports') {
      // Clear all connection lines
      connectionLinesRef.current.clear();
      return;
    }

    // Clear existing lines
    connectionLinesRef.current.clear();

    // Create connection lines for each Intel Report
    models.forEach((model) => {
      // Calculate surface position
      const lat = model.report.latitude;
      const lng = model.report.longitude;
      const globeRadius = 100; // Should match the globe radius

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      
      const surfaceX = -(globeRadius * Math.sin(phi) * Math.cos(theta));
      const surfaceZ = globeRadius * Math.sin(phi) * Math.sin(theta);
      const surfaceY = globeRadius * Math.cos(phi);

      const surfacePosition = new THREE.Vector3(surfaceX, surfaceY, surfaceZ);
      const modelPosition = model.positionContainer.position.clone();

      // Create line geometry
      const points = [surfacePosition, modelPosition];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // Create semi-transparent line material
      const material = new THREE.LineBasicMaterial({ 
        color: 0x00ff41, 
        transparent: true, 
        opacity: 0.3,
        linewidth: 1
      });
      
      const line = new THREE.Line(geometry, material);
      connectionLinesRef.current.add(line);
    });
  }, [models, visualizationMode]);

  // Initialize collaboration service
  useEffect(() => {
    if (publicKey) {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const service = new EnhancedTeamCollaborationService(connection, undefined, {
        enableRealTimeSync: true,
        autoConfirmTransactions: true,
        defaultNetwork: 'devnet'
      });
      setCollaborationService(service);
    }
  }, [publicKey]);

  // Handle Intel Report creation with team collaboration
  const handleCreateIntelReport = useCallback(async (lat: number, lng: number) => {
    console.log('Creating Intel Report at coordinates:', { lat, lng });
    
    try {
      // Import IntelReportService dynamically to handle the report creation
      const { IntelReportService } = await import('../../services/IntelReportService');
      const { Connection } = await import('@solana/web3.js');
      
      // Initialize service with devnet connection in test mode
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const reportService = new IntelReportService(connection, undefined, true); // Test mode enabled
      
      // Create a new intel report with the clicked coordinates
      const reportData = {
        title: `Intel Report at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        content: `Intelligence data collected at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}. This report was created via globe interaction and is ready for team collaboration.`,
        tags: ['globe-interaction', 'geospatial', 'team-collaboration'],
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        author: 'globe-user', // Will be replaced with actual wallet address when connected
  // classification removed in declassified build
  source: 'STARCOM Globe Interface',
  priority: 'ROUTINE'
      };
      
      // Create a mock wallet for test mode
      const mockWallet = {
        publicKey: null,
        signTransaction: undefined
      };
      
      // Submit the report using the IntelReportService in test mode
      const signature = await reportService.submitIntelReport(reportData, mockWallet);
      
      // Team collaboration integration (only if wallet is connected)
      let teamNotification = '';
      if (publicKey && collaborationService && currentTeam) {
        try {
          // Get user's teams
          const userTeams = await collaborationService.getUserTeams(publicKey.toString());
          const activeTeam = userTeams.find(team => team.id === currentTeam);
          
          if (activeTeam) {
            // Create a new package for this report (since wallet is connected)
            const reportWithId = { ...reportData, pubkey: signature };
            const walletSigner = { 
              publicKey, 
              signTransaction: async (tx: Transaction) => tx 
            }; // Mock signer for demo
            
            const result = await collaborationService.createIntelPackage(
              currentTeam,
              [reportWithId],
              {
                name: `Globe Report Package - ${new Date().toLocaleDateString()}`,
                description: `Intel package created from globe interaction at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                classification: 'CONFIDENTIAL',
                tags: ['globe-generated', 'geospatial']
              },
              walletSigner
            );
            teamNotification = `\n📦 Created new team package: ${result.packageId.slice(0, 12)}...`;
          }
        } catch (teamError) {
          console.warn('Team collaboration feature failed:', teamError);
          teamNotification = '\n⚠️ Team collaboration temporarily unavailable';
        }
      }
      
      // Show success notification with team collaboration features
      const message = `Intel Report created successfully at ${lat.toFixed(4)}, ${lng.toFixed(4)}!\n\n` +
                     `📋 Report Details:\n` +
                     '' +
                     `• Tags: ${reportData.tags.join(', ')}\n` +
                     `• Transaction: ${signature}\n\n` +
                     `🤝 Team Features:\n` +
                     `• Ready for team collaboration\n` +
                     `• Can be added to intel packages\n` +
                     `• Blockchain provenance enabled${teamNotification}`;
      
      alert(message);
      
      // TODO: Integrate with team collaboration service to notify team members
      // TODO: Automatically add to current team's active intel package if available
      console.log('Intel Report submitted with enhanced team features:', {
        signature, 
        reportData,
        teamCollaborationReady: true,
        blockchainEnabled: true
      });
      
    } catch (error) {
      console.error('Failed to create Intel Report:', error);
      alert(`Failed to create Intel Report: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Team collaboration features may require wallet connection.`);
    }
  }, [collaborationService, currentTeam, publicKey]);

  // Advanced Mouse Event Handlers (Game Development Pattern)
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;
    
    // Only handle mouse down in Intel Reports mode
    if (visualizationMode.mode !== 'CyberCommand' || visualizationMode.subMode !== 'IntelReports') {
      return;
    }
    
    // CRITICAL FIX: Prevent event from propagating to globe.gl
    event.stopPropagation();
    event.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('🖱️ Mouse Down:', { x, y, timestamp: Date.now() });
    
    setInteractionState(prev => ({
      ...prev,
      isMouseDown: true,
      dragStartPos: { x, y },
      currentPos: { x, y },
      dragDistance: 0,
      mouseDownTime: Date.now(),
      isDragging: false,
      hasDraggedPastThreshold: false
    }));
  }, [containerRef, visualizationMode]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!globeRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate current drag state for immediate use
    let currentDragState = {
      isDragging: false,
      dragDistance: 0
    };

    // Update interaction state for drag detection
    setInteractionState(prev => {
      if (!prev.isMouseDown) return prev;
      
      const dragDistance = Math.sqrt(
        Math.pow(x - prev.dragStartPos.x, 2) + 
        Math.pow(y - prev.dragStartPos.y, 2)
      );
      
      const isDragging = dragDistance > dragThreshold;
      const hasDraggedPastThreshold = prev.hasDraggedPastThreshold || isDragging;
      
      // Update current drag state for immediate use
      currentDragState = { isDragging, dragDistance };
      
      // Debug logging when drag state changes
      if (isDragging && !prev.isDragging) {
        console.log('🖱️ Drag detected:', { dragDistance, dragThreshold, isDragging });
      }
      
      return {
        ...prev,
        currentPos: { x, y },
        dragDistance,
        isDragging,
        hasDraggedPastThreshold
      };
    });

    // Set tooltip position with a stable offset to avoid cursor overlap
    setTooltipPosition({ 
      x: event.clientX + 15, // Small offset to avoid cursor
      y: event.clientY - 10 
    });

    // Normalize mouse coordinates to [-1, 1] range
    mouseRef.current.x = (x / rect.width) * 2 - 1;
    mouseRef.current.y = -(y / rect.height) * 2 + 1;

    // Only process hover detection if we're in the correct visualization mode AND not dragging
    // Use the current drag state, not the potentially stale state from interactionState
    if (visualizationMode.mode !== 'CyberCommand' || 
        visualizationMode.subMode !== 'IntelReports' ||
        currentDragState.isDragging) {
      // Hide mouse position indicator when not in correct mode or when dragging
      if (mousePositionIndicator) {
        mousePositionIndicator.visible = false;
      }
      // Clear hover state during drag
      if (currentDragState.isDragging && hoveredReport) {
        handleModelHover(null);
        onHoverChange?.(null);
      }
      return;
    }

    // Get scene and camera from globe
    const globeObj = globeRef.current as unknown as { 
      scene: () => THREE.Scene; 
      camera: () => THREE.Camera;
    };
    
    const scene = globeObj?.scene();
    const camera = globeObj?.camera();

    if (!scene || !camera) return;

    // Update raycaster for globe intersection detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseRef.current, camera);

    // Find globe mesh (sphere geometry) for surface position
    let globeMesh: THREE.Mesh | null = null;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && 
          child.geometry instanceof THREE.SphereGeometry) {
        globeMesh = child;
      }
    });

    if (!globeMesh) {
      if (mousePositionIndicator) {
        mousePositionIndicator.visible = false;
      }
      return;
    }

    // Check for globe surface intersection
    const globeIntersects = raycaster.intersectObject(globeMesh);
    
    if (globeIntersects.length > 0) {
      // Mouse is over globe surface
      const intersectionPoint = globeIntersects[0].point;
      
      // Convert 3D point to lat/lng for hover position
      const radius = 100; // Globe radius
      const lat = 90 - (Math.acos(intersectionPoint.y / radius) * 180 / Math.PI);
      const lng = ((270 + (Math.atan2(intersectionPoint.x, intersectionPoint.z) * 180 / Math.PI)) % 360) - 180;
      
      setGlobeHoverPosition({ lat, lng });

      // Update mouse position indicator
      if (mousePositionIndicator) {
        mousePositionIndicator.position.copy(intersectionPoint);
        // Offset slightly above surface
        mousePositionIndicator.position.normalize().multiplyScalar(radius + 1);
        mousePositionIndicator.visible = true;
      }
    } else {
      // Mouse is not over globe
      setGlobeHoverPosition(null);
      if (mousePositionIndicator) {
        mousePositionIndicator.visible = false;
      }
    }

    // Handle Intel Report model hover detection
    if (models.length > 0) {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = models.map(model => model.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        // Find the model that was intersected
        const intersectedMesh = intersects[0].object;
        const hoveredModel = models.find(model => 
          model.mesh === intersectedMesh || 
          model.mesh.children.includes(intersectedMesh) ||
          isChildOfModel(intersectedMesh, model.mesh)
        );

        if (hoveredModel && hoveredModel.report !== hoveredReport) {
          console.log('Hovering Intel Report:', hoveredModel.report.title);
          handleModelHover(hoveredModel.report);
          onHoverChange?.(hoveredModel.report.pubkey); // Notify parent of hover change
        }
      } else {
        // No intersection, clear hover if any
        if (hoveredReport) {
          handleModelHover(null);
          onHoverChange?.(null); // Notify parent of hover clear
        }
      }
    }
  }, [globeRef, containerRef, visualizationMode, models, hoveredReport, handleModelHover, onHoverChange, mousePositionIndicator, dragThreshold]);

  // Separated click handler for cleaner logic
  const handleActualClick = useCallback(() => {
    if (hoveredReport) {
      console.log('Clicking Intel Report:', hoveredReport.title);
      handleModelClick(hoveredReport);
    } else if (globeHoverPosition) {
      // Create new Intel Report at clicked position
      console.log('Creating Intel Report at:', globeHoverPosition);
      handleCreateIntelReport(globeHoverPosition.lat, globeHoverPosition.lng);
    }
  }, [hoveredReport, handleModelClick, globeHoverPosition, handleCreateIntelReport]);

  const handleMouseUp = useCallback((event?: MouseEvent) => {
    if (!containerRef.current) return;
    
    // Only handle mouse up if we have an active interaction state
    if (!interactionState.isMouseDown) {
      return;
    }
    
    // CRITICAL FIX: Prevent event from propagating to globe.gl if it's a click
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    const currentTime = Date.now();
    const timeSinceMouseDown = currentTime - interactionState.mouseDownTime;
    
    // Determine if this was a click or drag based on distance and time
    const wasClick = !interactionState.hasDraggedPastThreshold && 
                     timeSinceMouseDown < timeThreshold;
    
    // Debug logging to help diagnose issues
    console.log('🖱️ Mouse Up Analysis:', {
      dragDistance: interactionState.dragDistance,
      dragThreshold,
      timeSinceMouseDown,
      timeThreshold,
      hasDraggedPastThreshold: interactionState.hasDraggedPastThreshold,
      wasClick,
      visualizationMode: `${visualizationMode.mode}.${visualizationMode.subMode}`
    });
    
    // Reset interaction state
    setInteractionState(prev => ({
      ...prev,
      isMouseDown: false,
      isDragging: false,
      hasDraggedPastThreshold: false,
      dragDistance: 0
    }));
    
    // Only process click actions if it was actually a click (not a drag release)
    if (wasClick && visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') {
      console.log('✅ Processing click action - creating intel report');
      handleActualClick();
    } else {
      console.log('❌ Ignoring mouse up - was a drag or wrong mode');
    }
  }, [containerRef, interactionState, visualizationMode, handleActualClick, timeThreshold, dragThreshold]);

  // Helper function to check if object is child of model
  const isChildOfModel = (object: THREE.Object3D, model: THREE.Object3D): boolean => {
    let parent = object.parent;
    while (parent) {
      if (parent === model) return true;
      parent = parent.parent;
    }
    return false;
  };

  // Advanced Mouse Event Listeners (Game Development Pattern)
  // CRITICAL FIX: Disable globe.gl's built-in event handling to prevent conflicts
  useEffect(() => {
    if (!globeRef.current) return;
    
    // Disable globe.gl's built-in event handling that conflicts with our custom handlers
    const globeInstance = globeRef.current as GlobeInstance;
    
    // Disable globe.gl's click handling
    if (globeInstance.controls) {
      // Store original handlers to restore later
      const originalHandlers = {
        enableRotate: globeInstance.controls().enableRotate,
        enableZoom: globeInstance.controls().enableZoom,
        enablePan: globeInstance.controls().enablePan
      };
      
      // Keep rotation and zoom, but prevent conflicts with our click detection
      globeInstance.controls().enableRotate = true;
      globeInstance.controls().enableZoom = true;
      globeInstance.controls().enablePan = true;
      
      // Reduce damping to make interactions feel more responsive
      globeInstance.controls().dampingFactor = 0.1;
      globeInstance.controls().enableDamping = true;
      
      return () => {
        // Restore original settings
        if (globeInstance.controls) {
          globeInstance.controls().enableRotate = originalHandlers.enableRotate;
          globeInstance.controls().enableZoom = originalHandlers.enableZoom;
          globeInstance.controls().enablePan = originalHandlers.enablePan;
        }
      };
    }
  }, [globeRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use capture phase to intercept events before globe.gl processes them
    const options = { capture: true, passive: false };

    container.addEventListener('mousedown', handleMouseDown, options);
    container.addEventListener('mousemove', handleMouseMove, options);
    container.addEventListener('mouseup', handleMouseUp, options);
    container.addEventListener('mouseleave', handleMouseUp, options);
    
    // Touch event handlers for mobile support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true
        });
        handleMouseDown(mouseEvent);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true
        });
        handleMouseMove(mouseEvent);
      }
    };
    
    const handleTouchEnd = () => {
      handleMouseUp();
    };
    
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown, options);
      container.removeEventListener('mousemove', handleMouseMove, options);
      container.removeEventListener('mouseup', handleMouseUp, options);
      container.removeEventListener('mouseleave', handleMouseUp, options);
      container.removeEventListener('touchstart', handleTouchStart, options);
      container.removeEventListener('touchmove', handleTouchMove, options);
      container.removeEventListener('touchend', handleTouchEnd, options);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, containerRef]);

  // Handle cursor changes based on interaction state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update cursor based on hover state and interaction mode
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') {
      if (interactionState.isDragging) {
        container.style.cursor = 'grabbing';
      } else if (hoveredReport) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = 'grab';
      }
    } else {
      container.style.cursor = 'grab';
    }
  }, [hoveredReport, visualizationMode, containerRef, interactionState.isDragging]);

  // Navigation handlers
  const handleNavigatePrevious = () => {
    const currentIndex = intelReports.findIndex(r => r.pubkey === selectedReport?.id);
    if (currentIndex > 0) {
      const previousReport = intelReports[currentIndex - 1];
      handleModelClick(previousReport);
    }
  };

  const handleNavigateNext = () => {
    const currentIndex = intelReports.findIndex(r => r.pubkey === selectedReport?.id);
    if (currentIndex < intelReports.length - 1) {
      const nextReport = intelReports[currentIndex + 1];
      handleModelClick(nextReport);
    }
  };

  // Convert IntelReportData to IntelReportOverlayMarker for popup display
  const selectedReportForPopup = selectedReport ? {
    pubkey: selectedReport.id,
    title: selectedReport.title,
    content: selectedReport.description,
    tags: selectedReport.tags,
    latitude: selectedReport.coordinates.latitude,
    longitude: selectedReport.coordinates.longitude,
    timestamp: Math.floor(selectedReport.lastUpdated.getTime() / 1000),
    author: selectedReport.createdBy
  } : null;

  const currentIndex = selectedReport ? 
    intelReports.findIndex(r => r.pubkey === selectedReport?.id) : -1;

  return (
    <>
      {/* Tooltip for hover state */}
      <IntelReportTooltip
        report={hoveredReport}
        position={tooltipPosition}
        visible={tooltipVisible}
        onClose={() => handleModelHover(null)}
      />

      {/* Popup for detailed view */}
      <IntelReportPopup
        report={selectedReportForPopup}
        visible={popupVisible}
        onClose={handlePopupClose}
        onPrevious={handleNavigatePrevious}
        onNext={handleNavigateNext}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < intelReports.length - 1}
      />

      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {hoveredReport && (
          <div>
            Intel Report: {hoveredReport.title}
          </div>
        )}
      </div>
    </>
  );
};

export default EnhancedGlobeInteractivity;
