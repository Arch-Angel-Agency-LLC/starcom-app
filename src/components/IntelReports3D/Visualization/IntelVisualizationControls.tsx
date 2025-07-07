/**
 * Intel Visualization Controls Component
 * 
 * Control panel for Globe-specific Intel Reports 3D visualization settings.
 * Provides user controls for markers, filters, and display options.
 */

import React, { useState, useCallback } from 'react';
import { useIntelReportsMain, useIntelReportsGlobe } from '../Core/IntelReports3DProvider';
import type { IntelReportFilters } from '../../../services/intelligence/IntelReports3DService';
import type { IntelCategory } from '../../../types/intelligence/IntelReportTypes';

// =============================================================================
// COMPONENT PROPS AND TYPES
// =============================================================================

export interface IntelVisualizationControlsProps {
  // Configuration
  showAdvancedControls?: boolean;
  compactMode?: boolean;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Callbacks
  onSettingsChange?: (settings: VisualizationSettings) => void;
}

export interface VisualizationSettings {
  showMarkers: boolean;
  showLabels: boolean;
  showConnections: boolean;
  markerScale: number;
  markerOpacity: number;
  filterBy: string;
  sortBy: string;
}

// =============================================================================
// INTEL VISUALIZATION CONTROLS COMPONENT
// =============================================================================

export const IntelVisualizationControls: React.FC<IntelVisualizationControlsProps> = ({
  showAdvancedControls = false,
  compactMode = false,
  className = 'intel-visualization-controls',
  style,
  onSettingsChange
}) => {
  
  // Access Intel Reports 3D functionality
  const {
    intelReports,
    filteredReports,
    loading,
    setFilters,
    clearFilters
  } = useIntelReportsMain();
  
  const {
    markers,
    visibleMarkers,
    initialized: globeInitialized
  } = useIntelReportsGlobe();
  
  // Local state for controls
  const [settings, setSettings] = useState<VisualizationSettings>({
    showMarkers: true,
    showLabels: false,
    showConnections: false,
    markerScale: 1.0,
    markerOpacity: 1.0,
    filterBy: 'all',
    sortBy: 'timestamp'
  });
  
  const [activeFilters, setActiveFilters] = useState<IntelReportFilters>({});
  
  // Update settings and notify parent
  const updateSettings = useCallback((newSettings: Partial<VisualizationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  }, [settings, onSettingsChange]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    const newFilters: IntelReportFilters = { ...activeFilters };
    
    switch (filterType) {
      case 'category':
        newFilters.category = value === 'all' ? undefined : [value as IntelCategory]; // Type assertion for category
        break;
      case 'priority':
        // Map priority filter to report structure
        newFilters.searchText = value === 'all' ? undefined : value;
        break;
      case 'timeRange':
        if (value !== 'all') {
          const now = new Date();
          const hours = parseInt(value);
          newFilters.timeRange = {
            start: new Date(now.getTime() - hours * 60 * 60 * 1000),
            end: now
          };
        } else {
          delete newFilters.timeRange;
        }
        break;
    }
    
    setActiveFilters(newFilters);
    setFilters(newFilters);
  }, [activeFilters, setFilters]);
  
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    clearFilters();
  }, [clearFilters]);
  
  // Get unique categories from reports
  const availableCategories = React.useMemo(() => {
    const categories = new Set(intelReports.map(report => report.metadata.category));
    return Array.from(categories).sort();
  }, [intelReports]);
  
  if (!globeInitialized) {
    return (
      <div className={`${className} loading`} style={style}>
        <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
          Initializing visualization controls...
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`${className} ${compactMode ? 'compact' : 'expanded'}`}
      style={{
        padding: compactMode ? '8px' : '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '8px',
        minWidth: compactMode ? '200px' : '280px',
        ...style
      }}
    >
      {/* Header */}
      <div className="controls-header" style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          Intel Visualization
        </h4>
        <div style={{ fontSize: '12px', color: '#ccc' }}>
          {filteredReports.length} of {intelReports.length} reports
          {globeInitialized && ` • ${visibleMarkers.length} markers`}
        </div>
      </div>
      
      {/* Display Controls */}
      <div className="display-controls" style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500' }}>
          Display
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={settings.showMarkers}
            onChange={(e) => updateSettings({ showMarkers: e.target.checked })}
            style={{ marginRight: '8px' }}
          />
          Show Markers
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={settings.showLabels}
            onChange={(e) => updateSettings({ showLabels: e.target.checked })}
            style={{ marginRight: '8px' }}
          />
          Show Labels
        </label>
        
        {showAdvancedControls && (
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={settings.showConnections}
              onChange={(e) => updateSettings({ showConnections: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Show Connections
          </label>
        )}
      </div>
      
      {/* Scale and Opacity Controls */}
      {showAdvancedControls && (
        <div className="appearance-controls" style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500' }}>
            Appearance
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#ccc' }}>
              Scale: {settings.markerScale.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.markerScale}
              onChange={(e) => updateSettings({ markerScale: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#ccc' }}>
              Opacity: {settings.markerOpacity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.markerOpacity}
              onChange={(e) => updateSettings({ markerOpacity: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="filter-controls" style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500' }}>
          Filters
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: '#ccc' }}>Category</label>
          <select
            value={activeFilters.category?.[0] || 'all'}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              marginTop: '2px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          >
            <option value="all">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: '#ccc' }}>Time Range</label>
          <select
            value={activeFilters.timeRange ? '24' : 'all'}
            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              marginTop: '2px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          >
            <option value="all">All Time</option>
            <option value="1">Last Hour</option>
            <option value="24">Last 24 Hours</option>
            <option value="168">Last Week</option>
            <option value="720">Last Month</option>
          </select>
        </div>
        
        <button
          onClick={handleClearFilters}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#444',
            color: 'white',
            border: '1px solid #666',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Clear Filters
        </button>
      </div>
      
      {/* Status */}
      <div className="status" style={{ fontSize: '11px', color: '#888' }}>
        {loading ? 'Loading...' : `${markers.length} total markers`}
      </div>
    </div>
  );
};

// =============================================================================
// DISPLAY NAME FOR DEBUGGING
// =============================================================================

IntelVisualizationControls.displayName = 'IntelVisualizationControls';
