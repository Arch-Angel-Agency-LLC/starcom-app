/**
 * Enhanced3DGlobeInteractivity - Game-inspired 3D interaction for Intel Reports
 * 
 * This component provides a complete 3D interaction system for Intel Report models
 * using the Intel3DInteractionManager and React hooks.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { useIntel3DInteraction } from '../../hooks/useIntel3DInteraction';
import { useGlobeRightClickInteraction } from '../../hooks/useGlobeRightClickInteraction';
import { IntelReportTooltip } from '../ui/IntelReportTooltip/IntelReportTooltip';
import { IntelReportPopup } from '../ui/IntelReportPopup/IntelReportPopup';
import { GlobeContextAction, GlobeContextActionData } from '../ui/GlobeContextMenu/GlobeContextMenu';

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
  
  // State for UI components
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReportOverlayMarker | null>(null);

  // New features state
  const [mousePositionIndicator, setMousePositionIndicator] = useState<THREE.Mesh | null>(null);
  const [globeHoverPosition, setGlobeHoverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const connectionLinesRef = useRef<THREE.Group>(new THREE.Group());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Check if we're in the correct visualization mode
  const isIntelReportsMode = visualizationMode.mode === 'CyberCommand' && 
                            visualizationMode.subMode === 'IntelReports';

  // Use the 3D interaction hook (for existing model interactions)
  const {
    hoveredModel,
    clickedModel,
    mousePosition,
    clearClickedState,
    getModelScreenPosition
  } = useIntel3DInteraction({
    globeRef,
    containerRef,
    models,
    enabled: isIntelReportsMode
  });

  // Handle context menu actions with custom logic
  const handleCustomContextAction = useCallback((
    action: GlobeContextAction, 
    data?: GlobeContextActionData
  ) => {
    console.log('🎯 Custom context action handler:', { action: action.id, data });

    // Handle specific actions that require parent component integration
    switch (action.id) {
      case 'create-intel-report':
        if (data?.geoLocation && onCreateIntelReport) {
          console.log('📝 Triggering intel report creation at:', data.geoLocation);
          onCreateIntelReport(data.geoLocation);
        }
        break;
      
      default:
        console.log('🔧 Unhandled action:', action.id);
        break;
    }
  }, [onCreateIntelReport]);

  // Use the right-click interaction hook (for globe surface interactions)
  useGlobeRightClickInteraction({
    globeRef,
    containerRef,
    enabled: isIntelReportsMode,
    onContextAction: handleCustomContextAction
  });
  useEffect(() => {
    const shouldShowTooltip = isIntelReportsMode && hoveredModel !== null;
    setTooltipVisible(shouldShowTooltip);
  }, [hoveredModel, isIntelReportsMode]);

  // Update popup visibility and selected report based on clicked state
  useEffect(() => {
    if (clickedModel) {
      setSelectedReport(clickedModel.report);
      setPopupVisible(true);
    }
  }, [clickedModel]);

  // Notify parent of hover changes
  useEffect(() => {
    const reportId = hoveredModel?.report?.pubkey || null;
    onHoverChange?.(reportId);
  }, [hoveredModel, onHoverChange]);

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
    if (!hoveredModel) {
      return mousePosition;
    }

    // Try to get the model's screen position for more accurate tooltip placement
    const screenPos = getModelScreenPosition(hoveredModel.report.pubkey);
    if (screenPos) {
      return {
        x: screenPos.x + 15, // Offset to avoid overlapping the model
        y: screenPos.y - 10
      };
    }

    // Fallback to mouse position
    return {
      x: mousePosition.x + 15,
      y: mousePosition.y - 10
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

  // Enhanced mouse event handler for globe interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isIntelReportsMode) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!globeRef.current) return;

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Normalize mouse coordinates to [-1, 1] range
      mouseRef.current.x = (x / rect.width) * 2 - 1;
      mouseRef.current.y = -(y / rect.height) * 2 + 1;

      const globeObj = globeRef.current;
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
        setGlobeHoverPosition(null);
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
    };

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef, isIntelReportsMode, globeRef, mousePositionIndicator, hoveredModel, globeHoverPosition]);

  return (
    <>
      {/* Tooltip for hover state */}
      {isIntelReportsMode && (
        <IntelReportTooltip
          report={hoveredModel?.report || null}
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
        {hoveredModel && isIntelReportsMode && (
          <div>
            Intel Report: {hoveredModel.report.title}
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
          <div>3D Interaction Debug:</div>
          <div>Mode: {visualizationMode.mode}/{visualizationMode.subMode}</div>
          <div>Models: {models.length}</div>
          <div>Hovered: {hoveredModel ? hoveredModel.report.title : 'None'}</div>
          <div>Clicked: {clickedModel ? clickedModel.report.title : 'None'}</div>
          <div>Tooltip: {tooltipVisible ? 'Visible' : 'Hidden'}</div>
          <div>Popup: {popupVisible ? 'Visible' : 'Hidden'}</div>
        </div>
      )}
    </>
  );
};

export default Enhanced3DGlobeInteractivity;
