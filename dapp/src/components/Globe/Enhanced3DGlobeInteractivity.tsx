/**
 * Enhanced3DGlobeInteractivity - Game-inspired 3D interaction for Intel Reports
 * 
 * This component provides a complete 3D interaction system for Intel Report models
 * using the Intel3DInteractionManager and React hooks.
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { useIntel3DInteraction } from '../../hooks/useIntel3DInteraction';
import { IntelReportTooltip } from '../ui/IntelReportTooltip/IntelReportTooltip';
import { IntelReportPopup } from '../ui/IntelReportPopup/IntelReportPopup';

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
  containerRef: parentContainerRef
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = parentContainerRef || localContainerRef;
  
  // State for UI components
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReportOverlayMarker | null>(null);

  // Check if we're in the correct visualization mode
  const isIntelReportsMode = visualizationMode.mode === 'CyberCommand' && 
                            visualizationMode.subMode === 'IntelReports';

  // Use the 3D interaction hook
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

  // Update tooltip visibility based on hover state
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
