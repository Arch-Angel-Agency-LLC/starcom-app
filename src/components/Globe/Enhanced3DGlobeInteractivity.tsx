/**
 * Enhanced3DGlobeInteractivity - UNIFIED 3D interaction for Intel Reports
 * 
 * This component provides a complete 3D interaction system for Intel Report models
 * with consolidated mouse handling to eliminate infinite loops.
 * 
 * ARCHITECTURAL CHANGE: Removed useIntel3DInteraction hook dependency and merged
 * logic directly to eliminate competing event systems.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { useGlobeRightClickInteraction } from '../../hooks/useGlobeRightClickInteraction';
import { IntelReportTooltip } from '../ui/IntelReportTooltip/IntelReportTooltip';
import { IntelReportPopup } from '../ui/IntelReportPopup/IntelReportPopup';
import { GlobeContextAction, GlobeContextActionData } from '../ui/GlobeContextMenu/GlobeContextMenu';
import { OfflineIntelReportService } from '../../services/OfflineIntelReportService';
import { OfflineIntelReportsManager } from '../Intel/OfflineIntelReportsManager';
import { useWallet } from '@solana/wallet-adapter-react';

interface Enhanced3DGlobeInteractivityProps {
  globeRef: React.RefObject<{ camera: () => THREE.Camera; scene: () => THREE.Scene }>;
  intelReports: IntelReportOverlayMarker[];
  visualizationMode: {
    mode: string;
    subMode: string;
  };
  models: ModelInstance[];
  onHoverChange?: (reportId: string | null) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  onCreateIntelReport?: (geoLocation: { lat: number; lng: number }) => void;
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

export const Enhanced3DGlobeInteractivity: React.FC<Enhanced3DGlobeInteractivityProps> = ({
  globeRef,
  intelReports,
  visualizationMode,
  models,
  onHoverChange,
  containerRef: parentContainerRef,
  onCreateIntelReport
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = parentContainerRef || localContainerRef;
  
  // Wallet connection for online/offline Intel Report creation
  const { connected, publicKey } = useWallet();
  
  // Offline Intel Report service
  const offlineService = OfflineIntelReportService.getInstance();
  
  // UI state
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  
  // State for UI components
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReportOverlayMarker | null>(null);

  // New features state
  const [mousePositionIndicator, setMousePositionIndicator] = useState<THREE.Mesh | null>(null);
  const connectionLinesRef = useRef<THREE.Group>(new THREE.Group());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Check if we're in the correct visualization mode
  const isIntelReportsMode = visualizationMode.mode === 'CyberCommand' && 
                            visualizationMode.subMode === 'IntelReports';

  // UNIFIED STATE MANAGEMENT - Direct state instead of hook
  const [unifiedInteractionState, setUnifiedInteractionState] = useState({
    // Mouse interaction state
    hoveredModel: null as ModelInstance | null,
    clickedModel: null as ModelInstance | null,
    mousePosition: { x: 0, y: 0 },
    
    // Drag/click detection state (game development pattern)
    isMouseDown: false,
    dragStartPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    dragDistance: 0,
    mouseDownTime: 0,
    isDragging: false,
    hasDraggedPastThreshold: false,
    
    // Globe hover state
    globeHoverPosition: null as { lat: number; lng: number } | null
  });

  // Configuration for drag/click detection
  const dragThreshold = 5; // pixels
  const timeThreshold = 300; // ms

  // Refs for high-frequency updates that don't need React re-renders
  const currentMousePosRef = useRef({ x: 0, y: 0 });
  const lastMouseStateUpdateRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentCursorRef = useRef<string>('grab');
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster()); // Reuse raycaster for performance
  
  // Advanced throttling configuration
  const MOUSE_STATE_UPDATE_THROTTLE = 100; // Only update React state every 100ms
  const HOVER_DETECTION_THROTTLE = 50; // Hover detection can be more frequent
  const DRAG_DETECTION_THROTTLE = 16; // Drag detection at ~60fps for responsiveness
  
  // Performance tracking refs
  const lastHoverDetectionRef = useRef(0);
  const lastDragDetectionRef = useRef(0);
  const frameSkipCounterRef = useRef(0);
  
  // Performance monitoring (development only)
  const performanceStatsRef = useRef({
    totalMouseMoves: 0,
    skippedFrames: 0,
    reactStateUpdates: 0,
    hoverDetections: 0,
    lastResetTime: Date.now()
  });

  // Direct cursor management without React re-renders
  const updateCursor = useCallback((newCursor: string) => {
    if (currentCursorRef.current !== newCursor && containerRef.current) {
      currentCursorRef.current = newCursor;
      containerRef.current.style.cursor = newCursor;
    }
  }, [containerRef]);

  // Screen position tracking for UI positioning
  const [screenPositions, _setScreenPositions] = useState<Map<string, THREE.Vector2>>(new Map());

  // Helper functions for model interactions
  const clearClickedState = useCallback(() => {
    setUnifiedInteractionState(prev => ({
      ...prev,
      clickedModel: null
    }));
  }, []);

  const getModelScreenPosition = useCallback((modelId: string): THREE.Vector2 | null => {
    return screenPositions.get(modelId) || null;
  }, [screenPositions]);

  // Handle context menu actions with enhanced offline Intel Report support
  const handleCustomContextAction = useCallback(async (
    action: GlobeContextAction, 
    data?: GlobeContextActionData
  ) => {
    console.log('🎯 Context action triggered:', { action: action.id, data });

    if (!data?.geoLocation) {
      console.warn('No geo location provided for action:', action.id);
      return;
    }

    const { lat, lng } = data.geoLocation;

    // Handle specific actions with enhanced offline support
    switch (action.id) {
      case 'create-intel-report': {
        console.log('📝 Creating intel report at:', { lat, lng });
        
        // Enhanced Intel Report creation with comprehensive offline fallback
        if (connected && publicKey && onCreateIntelReport) {
          // User is connected - use standard Web3 flow
          console.log('✅ Wallet connected - using Web3 Intel Report creation');
          onCreateIntelReport(data.geoLocation);
        } else {
          // User not connected - create offline report with comprehensive UX
          console.log('🌐 Wallet not connected - creating offline Intel Report');
          
          try {
            // Prompt user for basic report data
            const title = prompt('Enter Intel Report title:') || 'Untitled Report';
            if (!title || title === 'Untitled Report') {
              const confirmed = confirm('Create report without title? You can edit it later.');
              if (!confirmed) return;
            }
            
            const content = prompt('Enter report content (optional):') || '';
            
            // Create offline report
            const offlineReport = await offlineService.createOfflineReport({
              title,
              content,
              subtitle: '',
              tags: ['location', 'offline'],
              categories: ['intelligence'],
              lat: lat,
              long: lng,
              date: new Date().toISOString(),
              author: 'offline-user',
              metaDescription: `Intel report created offline at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            }, { lat, lng });
            
            // Show success message with options
            const message = `📝 Offline Intel Report Created!\n\n` +
                          `Title: ${title}\n` +
                          `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n` +
                          `Status: Stored locally - will sync when you connect wallet\n\n` +
                          `Choose an option:`;
            
            if (confirm(`${message}\n\n[OK] - View offline reports\n[Cancel] - Continue`)) {
              setShowOfflineManager(true);
            }
            
            console.log('✅ Offline Intel Report created:', offlineReport.offlineId);
          } catch (error) {
            console.error('❌ Failed to create offline Intel Report:', error);
            alert(`Failed to create offline Intel Report: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or connect your wallet for full functionality.`);
          }
        }
        break;
      }
      
      case 'add-marker':
        console.log('📍 Adding marker at:', { lat, lng });
        alert(`Marker added at coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        // TODO: Integrate with marker system
        break;
      
      case 'set-waypoint':
        console.log('🎯 Setting waypoint at:', { lat, lng });
        alert(`Waypoint set at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        // TODO: Integrate with navigation system
        break;
      
      case 'location-details': {
        console.log('🌍 Showing location details for:', { lat, lng });
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        alert(`Location Details:\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\nTimezone: ${timezone}\nRegion: ${lat > 0 ? 'Northern' : 'Southern'} Hemisphere`);
        break;
      }
      
      case 'area-statistics': {
        console.log('📊 Fetching area statistics for:', { lat, lng });
        const mockStats = {
          population: Math.floor(Math.random() * 1000000),
          strategicValue: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          elevation: Math.floor(Math.random() * 3000)
        };
        alert(`Area Statistics:\nEstimated Population: ${mockStats.population.toLocaleString()}\nStrategic Value: ${mockStats.strategicValue}\nElevation: ${mockStats.elevation}m`);
        break;
      }
      
      case 'satellite-view':
        console.log('🛰️ Switching to satellite view at:', { lat, lng });
        alert('Satellite view activated. Enhanced imagery loading...');
        // TODO: Integrate with globe view switching
        break;
      
      case 'historical-data':
        console.log('🗺️ Loading historical data for:', { lat, lng });
        alert('Historical data:\n• Previous intel reports: 3\n• Last activity: 2 days ago\n• Threat level history: Low → Medium');
        // TODO: Integrate with historical data service
        break;
      
      case 'measure-distance':
        console.log('📏 Starting distance measurement from:', { lat, lng });
        alert(`Distance measurement started from: ${lat.toFixed(4)}, ${lng.toFixed(4)}\nClick another location to complete measurement.`);
        // TODO: Integrate with measurement tools
        break;
      
      case 'scan-area':
        console.log('🔍 Scanning area around:', { lat, lng });
        alert('Area scan initiated...\n• Communications: 5 signals detected\n• Movement: 2 contacts identified\n• Infrastructure: 3 facilities mapped');
        // TODO: Integrate with intelligence scanning
        break;
      
      case 'signal-analysis': {
        console.log('📡 Analyzing signals at:', { lat, lng });
        const signalStrength = Math.floor(Math.random() * 100);
        alert(`Signal Analysis:\nSignal Strength: ${signalStrength}%\nEncryption: ${signalStrength > 70 ? 'Military Grade' : 'Standard'}\nInterference: ${signalStrength < 30 ? 'High' : 'Low'}`);
        break;
      }
      
      case 'threat-assessment': {
        console.log('⚠️ Assessing threats at:', { lat, lng });
        const threatLevels = ['Low', 'Medium', 'High', 'Critical'];
        const threatLevel = threatLevels[Math.floor(Math.random() * threatLevels.length)];
        alert(`Threat Assessment:\nCurrent Level: ${threatLevel}\nKey Risks: Environmental, Communications\nRecommendation: ${threatLevel === 'High' || threatLevel === 'Critical' ? 'Exercise Caution' : 'Proceed Normally'}`);
        break;
      }
      
      case 'share-location':
        console.log('� Sharing location:', { lat, lng });
        navigator.clipboard?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        alert(`Location shared!\nCoordinates copied to clipboard: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        break;
      
      case 'leave-comment': {
        console.log('💬 Leaving comment at:', { lat, lng });
        const comment = prompt(`Leave a comment for this location (${lat.toFixed(4)}, ${lng.toFixed(4)}):`);
        if (comment) {
          alert(`Comment saved: "${comment}"\nLocation: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          // TODO: Integrate with comment system
        }
        break;
      }
      
      case 'report-incident': {
        console.log('🚨 Reporting incident at:', { lat, lng });
        const incidentTypes = ['Security Breach', 'Equipment Failure', 'Suspicious Activity', 'Environmental Hazard'];
        const selectedType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
        alert(`Incident Report Submitted\nType: ${selectedType}\nLocation: ${lat.toFixed(4)}, ${lng.toFixed(4)}\nStatus: Under Review\nIncident ID: INC-${Date.now().toString().slice(-6)}`);
        // TODO: Integrate with incident reporting system
        break;
      }
      
      default:
        console.log('🔧 Action not yet implemented:', action.id);
        alert(`Feature "${action.label}" is coming soon!`);
        break;
    }
  }, [onCreateIntelReport, connected, publicKey, offlineService, setShowOfflineManager]);

  // Use the right-click interaction hook (for globe surface interactions)
  useGlobeRightClickInteraction({
    globeRef,
    containerRef,
    enabled: isIntelReportsMode,
    onContextAction: handleCustomContextAction
  });
  useEffect(() => {
    const shouldShowTooltip = isIntelReportsMode && unifiedInteractionState.hoveredModel !== null;
    setTooltipVisible(shouldShowTooltip);
  }, [unifiedInteractionState.hoveredModel, isIntelReportsMode]);

  // Update popup visibility and selected report based on clicked state
  useEffect(() => {
    if (unifiedInteractionState.clickedModel) {
      setSelectedReport(unifiedInteractionState.clickedModel.report);
      setPopupVisible(true);
    }
  }, [unifiedInteractionState.clickedModel]);

  // Notify parent of hover changes
  useEffect(() => {
    const reportId = unifiedInteractionState.hoveredModel?.report?.pubkey || null;
    onHoverChange?.(reportId);
  }, [unifiedInteractionState.hoveredModel, onHoverChange]);

  // Handle popup close
  const handlePopupClose = () => {
    setPopupVisible(false);
    setSelectedReport(null);
    clearClickedState();
  };

  // Navigation handlers for popup
  const handleNavigatePrevious = () => {
    if (!selectedReport) return;
    
    const currentIndex = intelReports.findIndex(r => r.pubkey === selectedReport.pubkey);
    if (currentIndex > 0) {
      const previousReport = intelReports[currentIndex - 1];
      setSelectedReport(previousReport);
    }
  };

  const handleNavigateNext = () => {
    if (!selectedReport) return;
    
    const currentIndex = intelReports.findIndex(r => r.pubkey === selectedReport.pubkey);
    if (currentIndex < intelReports.length - 1) {
      const nextReport = intelReports[currentIndex + 1];
      setSelectedReport(nextReport);
    }
  };

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!unifiedInteractionState.hoveredModel) {
      return unifiedInteractionState.mousePosition;
    }

    // Try to get the model's screen position for more accurate tooltip placement
    const screenPos = getModelScreenPosition(unifiedInteractionState.hoveredModel.report.pubkey);
    if (screenPos) {
      return {
        x: screenPos.x + 15, // Offset to avoid overlapping the model
        y: screenPos.y - 10
      };
    }

    // Fallback to mouse position
    return {
      x: unifiedInteractionState.mousePosition.x + 15,
      y: unifiedInteractionState.mousePosition.y - 10
    };
  };

  // Calculate navigation state
  const currentIndex = selectedReport ? 
    intelReports.findIndex(r => r.pubkey === selectedReport.pubkey) : -1;

  // Initialize mouse position indicator
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current;
    const scene = globeObj?.scene();
    if (!scene || typeof scene.add !== 'function') return; // Defensive check for testing

    try {
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
        if (scene && typeof scene.remove === 'function') {
          scene.remove(indicator);
        }
      };
    } catch (error) {
      console.warn('Failed to initialize mouse position indicator:', error);
    }
  }, [globeRef]);

  // Initialize connection lines group
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current;
    const scene = globeObj?.scene();
    if (!scene || typeof scene.add !== 'function') return; // Defensive check for testing

    try {
      const linesGroup = connectionLinesRef.current;
      scene.add(linesGroup);

      return () => {
        if (scene && typeof scene.remove === 'function') {
          scene.remove(linesGroup);
        }
      };
    } catch (error) {
      console.warn('Failed to initialize connection lines group:', error);
    }
  }, [globeRef]);

  // Update connection lines for Intel Reports
  useEffect(() => {
    if (!models.length || !isIntelReportsMode) {
      // Clear all connection lines
      if (connectionLinesRef.current && typeof connectionLinesRef.current.clear === 'function') {
        connectionLinesRef.current.clear();
      }
      return;
    }

    // Clear existing lines
    if (connectionLinesRef.current && typeof connectionLinesRef.current.clear === 'function') {
      connectionLinesRef.current.clear();
    }

    try {
      // Create connection lines for each Intel Report
      models.forEach((model) => {
        // Defensive checks for model structure
        if (!model || !model.report || !model.positionContainer?.position) return;
        
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
        
        // Defensive clone with fallback
        let modelPosition;
        if (model.positionContainer.position.clone && typeof model.positionContainer.position.clone === 'function') {
          modelPosition = model.positionContainer.position.clone();
        } else {
          // Fallback for testing when clone is not available
          const pos = model.positionContainer.position;
          modelPosition = new THREE.Vector3(pos.x || 0, pos.y || 0, pos.z || 0);
        }

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
        if (connectionLinesRef.current && typeof connectionLinesRef.current.add === 'function') {
          connectionLinesRef.current.add(line);
        }
      });
    } catch (error) {
      console.warn('Failed to update connection lines:', error);
    }
  }, [models, isIntelReportsMode]);

  // Note: Intel Report creation is now handled through the right-click context menu
  // to avoid interference with globe drag interactions

  // UNIFIED COMPREHENSIVE THROTTLED MOUSE HANDLER
  // This is a complete rewrite that consolidates all mouse interactions with advanced throttling
  const handleUnifiedMouseMove = useCallback((event: MouseEvent) => {
    if (!isIntelReportsMode || !containerRef.current || !globeRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const currentTime = Date.now();

    // PERFORMANCE MONITORING (development only)
    if (process.env.NODE_ENV === 'development') {
      performanceStatsRef.current.totalMouseMoves++;
      
      // Reset stats every 10 seconds
      if (currentTime - performanceStatsRef.current.lastResetTime > 10000) {
        console.log('🔧 Mouse Handler Performance Stats (10s):', {
          totalMoves: performanceStatsRef.current.totalMouseMoves,
          skippedFrames: performanceStatsRef.current.skippedFrames,
          reactUpdates: performanceStatsRef.current.reactStateUpdates,
          hoverDetections: performanceStatsRef.current.hoverDetections,
          efficiency: `${(100 - (performanceStatsRef.current.skippedFrames / performanceStatsRef.current.totalMouseMoves * 100)).toFixed(1)}%`
        });
        
        performanceStatsRef.current = {
          totalMouseMoves: 0,
          skippedFrames: 0,
          reactStateUpdates: 0,
          hoverDetections: 0,
          lastResetTime: currentTime
        };
      }
    }

    // LEVEL 1: ALWAYS update mouse position ref (no React re-render, essential for tooltips)
    currentMousePosRef.current = {
      x: event.clientX, // Global coordinates for tooltips
      y: event.clientY
    };

    // LEVEL 2: DRAG DETECTION (high frequency ~60fps for responsive dragging)
    const isDraggingPlanet = isDraggingRef.current;
    let shouldUpdateDragState = false;
    
    if (currentTime - lastDragDetectionRef.current >= DRAG_DETECTION_THROTTLE) {
      shouldUpdateDragState = true;
      lastDragDetectionRef.current = currentTime;
    }

    // LEVEL 3: REACT STATE UPDATES (low frequency 100ms to prevent infinite loops)
    let shouldUpdateReactState = false;
    if (!isDraggingPlanet && currentTime - lastMouseStateUpdateRef.current >= MOUSE_STATE_UPDATE_THROTTLE) {
      shouldUpdateReactState = true;
      lastMouseStateUpdateRef.current = currentTime;
    }

    // LEVEL 4: HOVER DETECTION (medium frequency 50ms for good responsiveness)
    let shouldUpdateHoverState = false;
    if (!isDraggingPlanet && currentTime - lastHoverDetectionRef.current >= HOVER_DETECTION_THROTTLE) {
      shouldUpdateHoverState = true;
      lastHoverDetectionRef.current = currentTime;
    }

    // PERFORMANCE TRACKING: Skip frames if called too frequently
    frameSkipCounterRef.current++;
    if (frameSkipCounterRef.current % 3 === 0) { // Process every 3rd call for heavy operations
      frameSkipCounterRef.current = 0;
    } else if (!shouldUpdateDragState && !shouldUpdateReactState) {
      if (process.env.NODE_ENV === 'development') {
        performanceStatsRef.current.skippedFrames++;
      }
      return; // Skip this frame entirely if no updates are needed
    }

    // === DRAG STATE PROCESSING ===
    if (shouldUpdateDragState && shouldUpdateReactState) {
      if (process.env.NODE_ENV === 'development') {
        performanceStatsRef.current.reactStateUpdates++;
      }
      setUnifiedInteractionState(prev => {
        let newState = { ...prev };
        
        // Update drag detection if mouse is down
        if (prev.isMouseDown) {
          const dragDistance = Math.sqrt(
            Math.pow(x - prev.dragStartPos.x, 2) + 
            Math.pow(y - prev.dragStartPos.y, 2)
          );
          
          const isDragging = dragDistance > dragThreshold;
          const hasDraggedPastThreshold = prev.hasDraggedPastThreshold || isDragging;
          
          // Update the ref immediately for other systems
          isDraggingRef.current = hasDraggedPastThreshold;
          
          newState = {
            ...newState,
            currentPos: { x, y },
            dragDistance,
            isDragging,
            hasDraggedPastThreshold
          };

          // Debug logging (throttled)
          if (isDragging && !prev.isDragging) {
            console.log('🖱️ COMPREHENSIVE Handler - Drag detected:', { dragDistance, dragThreshold });
          }
        }

        // Update mouse position
        newState.mousePosition = { ...currentMousePosRef.current };
        return newState;
      });
    }

    // === EARLY EXIT: Skip expensive 3D operations during dragging ===
    if (isDraggingPlanet) {
      return;
    }

    // === 3D INTERSECTION AND HOVER DETECTION ===
    if (shouldUpdateHoverState) {
      if (process.env.NODE_ENV === 'development') {
        performanceStatsRef.current.hoverDetections++;
      }
      const globeObj = globeRef.current;
      const scene = globeObj?.scene();
      const camera = globeObj?.camera();

      if (!scene || !camera) return;

      // Normalize mouse coordinates to [-1, 1] range
      mouseRef.current.x = (x / rect.width) * 2 - 1;
      mouseRef.current.y = -(y / rect.height) * 2 + 1;

      // Update reused raycaster
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // PRIORITY 1: Intel model intersection detection
      let hoveredIntelModel: ModelInstance | null = null;
      for (const model of models) {
        if (model.mesh) {
          const intersects = raycasterRef.current.intersectObject(model.mesh, true);
          if (intersects.length > 0) {
            hoveredIntelModel = model;
            break; // First hit wins
          }
        }
      }

      // PRIORITY 2: Globe surface intersection (only if no intel model hovered)
      let newGlobeHoverPosition: { lat: number; lng: number } | null = null;
      if (!hoveredIntelModel) {
        let globeMesh: THREE.Mesh | null = null;
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
            globeMesh = child;
          }
        });

        if (globeMesh) {
          const globeIntersects = raycasterRef.current.intersectObject(globeMesh);
          if (globeIntersects.length > 0) {
            const intersectionPoint = globeIntersects[0].point;
            const radius = 100; // Globe radius
            const lat = 90 - (Math.acos(intersectionPoint.y / radius) * 180 / Math.PI);
            const lng = ((270 + (Math.atan2(intersectionPoint.x, intersectionPoint.z) * 180 / Math.PI)) % 360) - 180;
            
            newGlobeHoverPosition = { lat, lng };

            // Update mouse position indicator
            if (mousePositionIndicator) {
              mousePositionIndicator.position.copy(intersectionPoint);
              mousePositionIndicator.position.normalize().multiplyScalar(radius + 1);
              mousePositionIndicator.visible = true;
            }
          } else if (mousePositionIndicator) {
            mousePositionIndicator.visible = false;
          }
        }
      }

      // BATCHED STATE UPDATE: Update hover states together
      if (shouldUpdateReactState) {
        setUnifiedInteractionState(prev => ({
          ...prev,
          hoveredModel: hoveredIntelModel,
          globeHoverPosition: newGlobeHoverPosition
        }));
      }

      // IMMEDIATE CURSOR UPDATE: Don't wait for React state
      if (hoveredIntelModel) {
        updateCursor('pointer');
      } else {
        updateCursor('grab');
      }
    }
  }, [
    isIntelReportsMode, 
    containerRef, 
    globeRef, 
    models, 
    dragThreshold, 
    mousePositionIndicator, 
    updateCursor,
    // Throttling constants (these never change, but including for completeness)
    MOUSE_STATE_UPDATE_THROTTLE,
    HOVER_DETECTION_THROTTLE,
    DRAG_DETECTION_THROTTLE
  ]);

  // COMPREHENSIVE MOUSE DOWN HANDLER
  const handleUnifiedMouseDown = useCallback((event: MouseEvent) => {
    if (!isIntelReportsMode || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('🖱️ COMPREHENSIVE Handler - Mouse Down:', { x, y, timestamp: Date.now() });
    
    // Reset frame skip counter for immediate drag detection
    frameSkipCounterRef.current = 0;
    
    // Batch all mouse down state updates
    setUnifiedInteractionState(prev => ({
      ...prev,
      isMouseDown: true,
      dragStartPos: { x, y },
      currentPos: { x, y },
      dragDistance: 0,
      mouseDownTime: Date.now(),
      isDragging: false,
      hasDraggedPastThreshold: false
    }));
  }, [isIntelReportsMode, containerRef]);

  // COMPREHENSIVE MOUSE UP HANDLER
  const handleUnifiedMouseUp = useCallback((event: MouseEvent) => {
    if (!isIntelReportsMode) return;
    
    console.debug('🖱️ COMPREHENSIVE Handler - Mouse up event at:', event.clientX, event.clientY);
    
    // Reset dragging ref immediately
    isDraggingRef.current = false;
    
    setUnifiedInteractionState(prev => {
      if (!prev.isMouseDown) return prev;
      
      const currentTime = Date.now();
      const timeSinceMouseDown = currentTime - prev.mouseDownTime;
      
      // Determine if this was a click or drag based on distance and time
      const wasClick = !prev.hasDraggedPastThreshold && timeSinceMouseDown < timeThreshold;
      
      console.log('🖱️ COMPREHENSIVE Handler - Mouse Up Analysis:', {
        dragDistance: prev.dragDistance,
        dragThreshold,
        timeSinceMouseDown,
        timeThreshold,
        hasDraggedPastThreshold: prev.hasDraggedPastThreshold,
        wasClick,
        hoveredModel: prev.hoveredModel?.report?.title || 'none',
        globePosition: prev.globeHoverPosition
      });
      
      // Handle click actions
      if (wasClick && prev.hoveredModel) {
        console.log('✅ COMPREHENSIVE Handler - Processing intel model click:', prev.hoveredModel.report.title);
        return {
          ...prev,
          clickedModel: prev.hoveredModel,
          isMouseDown: false,
          isDragging: false,
          hasDraggedPastThreshold: false
        };
      } else if (wasClick && prev.globeHoverPosition) {
        console.log('✅ COMPREHENSIVE Handler - Globe click at:', prev.globeHoverPosition);
        // Globe click - handled via context menu
      }
      
      // Reset interaction state
      return {
        ...prev,
        isMouseDown: false,
        isDragging: false,
        hasDraggedPastThreshold: false,
        dragDistance: 0
      };
    });
  }, [isIntelReportsMode, timeThreshold, dragThreshold]);

  // Set up unified mouse event listeners
  useEffect(() => {
    if (!isIntelReportsMode || !containerRef.current) return;

    const container = containerRef.current;
    
    container.addEventListener('mousemove', handleUnifiedMouseMove);
    container.addEventListener('mousedown', handleUnifiedMouseDown);
    container.addEventListener('mouseup', handleUnifiedMouseUp);
    container.addEventListener('mouseleave', handleUnifiedMouseUp); // Reset on mouse leave

    return () => {
      container.removeEventListener('mousemove', handleUnifiedMouseMove);
      container.removeEventListener('mousedown', handleUnifiedMouseDown);
      container.removeEventListener('mouseup', handleUnifiedMouseUp);
      container.removeEventListener('mouseleave', handleUnifiedMouseUp);
    };
  }, [isIntelReportsMode, containerRef, handleUnifiedMouseMove, handleUnifiedMouseDown, handleUnifiedMouseUp]);

  // Update screen positions for UI positioning (from original useIntel3DInteraction logic)
  useEffect(() => {
    if (!isIntelReportsMode || !globeRef.current || !containerRef.current || !models.length) return;

    let animationFrameId: number;
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 500; // Update every 500ms
    let lastScreenPositions = new Map<string, THREE.Vector2>();
    let isAnimationRunning = false;

    const updateScreenPositions = (currentTime: number = 0) => {
      if (!isAnimationRunning) return;
      
      if (currentTime - lastUpdateTime < UPDATE_THROTTLE) {
        animationFrameId = requestAnimationFrame(updateScreenPositions);
        return;
      }
      
      lastUpdateTime = currentTime;
      
      const globeObj = globeRef.current as unknown as { camera: () => THREE.Camera; };
      const camera = globeObj?.camera();
      const container = containerRef.current;
      
      if (camera && container && models.length > 0) {
        const rect = container.getBoundingClientRect();
        
        // Calculate screen positions for models
        const newScreenPositions = new Map<string, THREE.Vector2>();
        let hasSignificantChanges = false;
        
        models.forEach(modelInstance => {
          if (modelInstance.mesh && modelInstance.report?.pubkey) {
            // Get world position of the model
            const worldPos = new THREE.Vector3();
            modelInstance.mesh.getWorldPosition(worldPos);
            
            // Project to screen coordinates
            const screenPos = worldPos.clone().project(camera);
            const x = (screenPos.x * 0.5 + 0.5) * rect.width;
            const y = (screenPos.y * -0.5 + 0.5) * rect.height;
            
            const currentPos = lastScreenPositions.get(modelInstance.report.pubkey);
            const newPos = new THREE.Vector2(x, y);
            
            // Only update if position changed significantly (> 15 pixels)
            if (!currentPos || 
                Math.abs(currentPos.x - newPos.x) > 15 || 
                Math.abs(currentPos.y - newPos.y) > 15) {
              newScreenPositions.set(modelInstance.report.pubkey, newPos);
              hasSignificantChanges = true;
            } else {
              newScreenPositions.set(modelInstance.report.pubkey, currentPos);
            }
          }
        });
        
        // Only update state if there are significant changes
        if (hasSignificantChanges) {
          lastScreenPositions = new Map(newScreenPositions);
          _setScreenPositions(newScreenPositions);
        }
      }
      
      if (isAnimationRunning) {
        animationFrameId = requestAnimationFrame(updateScreenPositions);
      }
    };

    isAnimationRunning = true;
    animationFrameId = requestAnimationFrame(updateScreenPositions);

    return () => {
      isAnimationRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isIntelReportsMode, globeRef, containerRef, models]); // Include models for proper dependency tracking

  // Set initial cursor
  useEffect(() => {
    if (!isIntelReportsMode || !containerRef.current) return;
    updateCursor('grab');
  }, [isIntelReportsMode, containerRef, updateCursor]);

  return (
    <>
      {/* Tooltip for hover state */}
      {isIntelReportsMode && (
        <IntelReportTooltip
          report={unifiedInteractionState.hoveredModel?.report || null}
          position={getTooltipPosition()}
          visible={tooltipVisible}
          onClose={() => {
            setTooltipVisible(false);
          }}
        />
      )}

      {/* Popup for detailed view */}
      {isIntelReportsMode && (
        <IntelReportPopup
          report={selectedReport}
          visible={popupVisible}
          onClose={handlePopupClose}
          onPrevious={handleNavigatePrevious}
          onNext={handleNavigateNext}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < intelReports.length - 1}
        />
      )}

      {/* Offline Intel Reports Manager */}
      <OfflineIntelReportsManager
        wallet={connected ? { publicKey } : undefined}
        isOpen={showOfflineManager}
        onClose={() => setShowOfflineManager(false)}
        onViewReport={(report) => {
          console.log('Viewing offline report:', report);
        }}
        onEditReport={(report) => {
          console.log('Editing offline report:', report);
        }}
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
        {unifiedInteractionState.hoveredModel && isIntelReportsMode && (
          <div>
            Intel Report: {unifiedInteractionState.hoveredModel.report.title}
          </div>
        )}
      </div>

      {/* Debug information (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 10000
          }}
        >
          <div>🎮 UNIFIED 3D Interaction Debug:</div>
          <div>Mode: {visualizationMode.mode}/{visualizationMode.subMode}</div>
          <div>Models: {models.length}</div>
          <div>Hovered: {unifiedInteractionState.hoveredModel ? unifiedInteractionState.hoveredModel.report.title : 'None'}</div>
          <div>Clicked: {unifiedInteractionState.clickedModel ? unifiedInteractionState.clickedModel.report.title : 'None'}</div>
          <div>Dragging: {unifiedInteractionState.isDragging ? 'Yes' : 'No'}</div>
          <div>Globe Pos: {unifiedInteractionState.globeHoverPosition ? `${unifiedInteractionState.globeHoverPosition.lat.toFixed(2)}, ${unifiedInteractionState.globeHoverPosition.lng.toFixed(2)}` : 'None'}</div>
          <div>Tooltip: {tooltipVisible ? 'Visible' : 'Hidden'}</div>
          <div>Popup: {popupVisible ? 'Visible' : 'Hidden'}</div>
        </div>
      )}
    </>
  );
};

export default Enhanced3DGlobeInteractivity;
