// EnhancedGlobeInteractivity.tsx
// Enhanced Globe component with Intel Report 3D model interactivity

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { useIntelReportInteractivity } from '../../hooks/useIntelReportInteractivity';
import { IntelReportTooltip } from '../ui/IntelReportTooltip/IntelReportTooltip';
import { IntelReportPopup } from '../ui/IntelReportPopup/IntelReportPopup';

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
  containerRef: parentContainerRef
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = parentContainerRef || localContainerRef; // Use parent container if provided
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  // Mouse event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!globeRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Set tooltip position with a stable offset to avoid cursor overlap
    setTooltipPosition({ 
      x: event.clientX + 15, // Small offset to avoid cursor
      y: event.clientY - 10 
    });

    // Normalize mouse coordinates to [-1, 1] range
    mouseRef.current.x = (x / rect.width) * 2 - 1;
    mouseRef.current.y = -(y / rect.height) * 2 + 1;

    // Only process if we're in the correct visualization mode
    if (visualizationMode.mode !== 'CyberCommand' || visualizationMode.subMode !== 'IntelReports') {
      return;
    }

    // Get scene and camera from globe
    const globeObj = globeRef.current as unknown as { 
      scene: () => THREE.Scene; 
      camera: () => THREE.Camera;
    };
    
    const scene = globeObj?.scene();
    const camera = globeObj?.camera();

    if (!scene || !camera || models.length === 0) return;

    // Update raycaster
    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    // Get all Intel Report meshes for raycasting
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
  }, [globeRef, containerRef, visualizationMode, models, hoveredReport, handleModelHover, onHoverChange]);

  const handleMouseClick = useCallback(() => {
    // Only process clicks in Intel Reports mode
    if (visualizationMode.mode !== 'CyberCommand' || visualizationMode.subMode !== 'IntelReports') {
      return;
    }

    if (hoveredReport) {
      console.log('Clicking Intel Report:', hoveredReport.title);
      handleModelClick(hoveredReport);
    }
  }, [visualizationMode, hoveredReport, handleModelClick]);

  // Helper function to check if object is child of model
  const isChildOfModel = (object: THREE.Object3D, model: THREE.Object3D): boolean => {
    let parent = object.parent;
    while (parent) {
      if (parent === model) return true;
      parent = parent.parent;
    }
    return false;
  };

  // Set up mouse event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleMouseClick);
    };
  }, [handleMouseMove, handleMouseClick, containerRef]);

  // Handle cursor changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update cursor based on hover state
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') {
      container.style.cursor = hoveredReport ? 'pointer' : 'grab';
    } else {
      container.style.cursor = 'grab';
    }
  }, [hoveredReport, visualizationMode, containerRef]);

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

  // Convert EnhancedIntelReport to IntelReportOverlayMarker for popup display
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
