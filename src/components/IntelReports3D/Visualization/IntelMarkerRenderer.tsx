/**
 * Intel Marker Renderer Component
 * 
 * Individual marker rendering component for Intel Reports 3D.
 * Handles the visual representation and interaction of individual Intel markers.
 */

import React, { useMemo } from 'react';
import type { IntelReport3DData } from '../../../models/Intel/IntelVisualization3D';

// =============================================================================
// COMPONENT PROPS AND TYPES
// =============================================================================

export interface IntelMarkerRendererProps {
  // Data
  report: IntelReport3DData;
  
  // State
  isHovered?: boolean;
  isSelected?: boolean;
  isVisible?: boolean;
  
  // Configuration
  scale?: number;
  opacity?: number;
  
  // Interaction
  onHover?: (report: IntelReport3DData, isHovered: boolean) => void;
  onClick?: (report: IntelReport3DData) => void;
  onSelect?: (report: IntelReport3DData, isSelected: boolean) => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

// =============================================================================
// INTEL MARKER RENDERER COMPONENT
// =============================================================================

export const IntelMarkerRenderer: React.FC<IntelMarkerRendererProps> = ({
  report,
  isHovered = false,
  isSelected = false,
  isVisible = true,
  scale = 1,
  opacity = 1,
  onHover,
  onClick,
  onSelect,
  className = 'intel-marker-renderer',
  style
}) => {
  
  // Memoize marker styling based on report properties
  const markerStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      transform: `scale(${scale})`,
      opacity: isVisible ? opacity : 0,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      zIndex: isSelected ? 1000 : isHovered ? 900 : 800,
      ...style
    };
    
    // Apply visualization properties from report
    if (report.visualization.color) {
      baseStyle.color = report.visualization.color;
      baseStyle.borderColor = report.visualization.color;
    }
    
    if (isHovered) {
      baseStyle.transform = `scale(${scale * 1.2})`;
      baseStyle.boxShadow = `0 0 10px ${report.visualization.color || '#0066cc'}`;
    }
    
    if (isSelected) {
      baseStyle.transform = `scale(${scale * 1.4})`;
      baseStyle.boxShadow = `0 0 15px ${report.visualization.color || '#0066cc'}`;
      baseStyle.border = `2px solid ${report.visualization.color || '#0066cc'}`;
    }
    
    return baseStyle;
  }, [report.visualization, scale, opacity, isVisible, isHovered, isSelected, style]);
  
  // Determine marker icon based on report category and priority
  const markerIcon = useMemo(() => {
    const { category } = report.metadata;
    const { priority } = report.visualization;
    
    // Map categories to icons
    const categoryIcons: Record<string, string> = {
      'threat': '⚠️',
      'intelligence': '🕵️',
      'surveillance': '👁️',
      'communication': '📡',
      'military': '⚔️',
      'cyber': '💻',
      'economic': '💰',
      'political': '🏛️',
      'environmental': '🌍',
      'general': '📍'
    };
    
    // High priority markers get different styling
    if (priority === 'critical' || priority === 'high') {
      return '🔴';
    }
    
    return categoryIcons[category] || categoryIcons.general;
  }, [report.metadata, report.visualization]);
  
  // Handle marker interactions
  const handleMouseEnter = () => {
    onHover?.(report, true);
  };
  
  const handleMouseLeave = () => {
    onHover?.(report, false);
  };
  
  const handleClick = () => {
    onClick?.(report);
  };
  
  const handleToggleSelect = () => {
    onSelect?.(report, !isSelected);
  };
  
  // For 3D Globe integration, this component is primarily for 2D overlays
  // The actual 3D rendering happens in the Globe service layer
  return (
    <div
      className={`${className} ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
      style={markerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleToggleSelect}
      title={`${report.title} (${report.metadata.category})`}
      role="button"
      tabIndex={0}
      aria-label={`Intel report: ${report.title}`}
      aria-pressed={isSelected}
    >
      <div className="marker-icon" style={{ fontSize: '16px' }}>
        {markerIcon}
      </div>
      
      {/* Marker label (visible on hover or selection) */}
      {(isHovered || isSelected) && (
        <div 
          className="marker-label"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            marginTop: '4px',
            zIndex: 1001
          }}
        >
          {report.title}
        </div>
      )}
      
      {/* Priority indicator */}
      {(report.visualization.priority === 'critical' || report.visualization.priority === 'high') && (
        <div
          className="priority-indicator"
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: report.visualization.priority === 'critical' ? '#ff0000' : '#ff6600',
            border: '1px solid white',
            zIndex: 1002
          }}
        />
      )}
    </div>
  );
};

// =============================================================================
// DISPLAY NAME FOR DEBUGGING
// =============================================================================

IntelMarkerRenderer.displayName = 'IntelMarkerRenderer';
