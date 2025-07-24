/**
 * GraphControls - Control panel for graph visualization
 * 
 * Phase 3: Provides controls for physics, filters, and mode switching
 */

import React, { useState } from 'react';
import { GraphFilters, PhysicsSettings } from './IntelGraph';

interface GraphControlsProps {
  mode: '2D' | '3D';
  onModeChange: (mode: '2D' | '3D') => void;
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  physics: PhysicsSettings;
  onPhysicsChange: (physics: PhysicsSettings) => void;
  nodeCount: number;
  edgeCount: number;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  mode,
  onModeChange,
  filters,
  onFiltersChange,
  physics,
  onPhysicsChange,
  nodeCount,
  edgeCount
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'physics' | 'layout'>('filters');

  const handleClassificationToggle = (classification: string) => {
    const newClassifications = filters.classifications.includes(classification)
      ? filters.classifications.filter(c => c !== classification)
      : [...filters.classifications, classification];
    
    onFiltersChange({
      ...filters,
      classifications: newClassifications
    });
  };

  const handleNodeTypeToggle = (nodeType: string) => {
    const newNodeTypes = filters.nodeTypes.includes(nodeType)
      ? filters.nodeTypes.filter(t => t !== nodeType)
      : [...filters.nodeTypes, nodeType];
    
    onFiltersChange({
      ...filters,
      nodeTypes: newNodeTypes
    });
  };

  const handleConfidenceChange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      confidenceRange: [min, max]
    });
  };

  const handleSearchChange = (query: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: query
    });
  };

  const handlePhysicsChange = (setting: keyof PhysicsSettings, value: number) => {
    onPhysicsChange({
      ...physics,
      [setting]: value
    });
  };

  return (
    <div className="graph-controls">
      {/* Control Toggle Button */}
      <button 
        className={`controls-toggle ${isPanelOpen ? 'active' : ''}`}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        title="Graph Controls"
      >
        ⚙️
      </button>

      {/* Mode Switcher (always visible) */}
      <div className="mode-switcher">
        <button 
          className={mode === '2D' ? 'active' : ''}
          onClick={() => onModeChange('2D')}
          title="2D Graph View"
        >
          2D
        </button>
        <button 
          className={mode === '3D' ? 'active' : ''}
          onClick={() => onModeChange('3D')}
          title="3D Graph View"
        >
          3D
        </button>
      </div>

      {/* Graph Stats */}
      <div className="graph-stats-mini">
        <span title="Nodes">{nodeCount} 📄</span>
        <span title="Edges">{edgeCount} 🔗</span>
      </div>

      {/* Control Panel */}
      {isPanelOpen && (
        <div className="controls-panel">
          {/* Tab Navigation */}
          <div className="tab-nav">
            <button 
              className={activeTab === 'filters' ? 'active' : ''}
              onClick={() => setActiveTab('filters')}
            >
              Filters
            </button>
            <button 
              className={activeTab === 'physics' ? 'active' : ''}
              onClick={() => setActiveTab('physics')}
            >
              Physics
            </button>
            <button 
              className={activeTab === 'layout' ? 'active' : ''}
              onClick={() => setActiveTab('layout')}
            >
              Layout
            </button>
          </div>

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="tab-content filters-tab">
              {/* Search */}
              <div className="control-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Classification Filters */}
              <div className="control-group">
                <label>Classification</label>
                <div className="checkbox-group">
                  {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].map(level => (
                    <label key={level} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.classifications.includes(level)}
                        onChange={() => handleClassificationToggle(level)}
                      />
                      <span className={`classification-badge ${level.toLowerCase()}`}>
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Node Type Filters */}
              <div className="control-group">
                <label>Node Types</label>
                <div className="checkbox-group">
                  {['report', 'entity', 'location', 'event', 'source'].map(type => (
                    <label key={type} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.nodeTypes.includes(type)}
                        onChange={() => handleNodeTypeToggle(type)}
                      />
                      <span className="node-type-badge">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Confidence Range */}
              <div className="control-group">
                <label>Confidence Range</label>
                <div className="range-inputs">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.confidenceRange[0]}
                    onChange={(e) => handleConfidenceChange(
                      parseFloat(e.target.value),
                      filters.confidenceRange[1]
                    )}
                  />
                  <span>{Math.round(filters.confidenceRange[0] * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.confidenceRange[1]}
                    onChange={(e) => handleConfidenceChange(
                      filters.confidenceRange[0],
                      parseFloat(e.target.value)
                    )}
                  />
                  <span>{Math.round(filters.confidenceRange[1] * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Physics Tab */}
          {activeTab === 'physics' && (
            <div className="tab-content physics-tab">
              <div className="control-group">
                <label>Charge Force: {physics.charge}</label>
                <input
                  type="range"
                  min="-1000"
                  max="0"
                  step="10"
                  value={physics.charge}
                  onChange={(e) => handlePhysicsChange('charge', parseInt(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Link Distance: {physics.linkDistance}</label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={physics.linkDistance}
                  onChange={(e) => handlePhysicsChange('linkDistance', parseInt(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Link Strength: {physics.linkStrength.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={physics.linkStrength}
                  onChange={(e) => handlePhysicsChange('linkStrength', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Friction: {physics.friction.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={physics.friction}
                  onChange={(e) => handlePhysicsChange('friction', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Gravity: {physics.gravity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={physics.gravity}
                  onChange={(e) => handlePhysicsChange('gravity', parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="tab-content layout-tab">
              <div className="layout-presets">
                <button onClick={() => {
                  onPhysicsChange({
                    charge: -300,
                    linkDistance: 100,
                    linkStrength: 0.1,
                    friction: 0.9,
                    gravity: 0.1,
                    theta: 0.8,
                    alpha: 1,
                    alphaDecay: 0.0228
                  });
                }}>
                  Standard
                </button>
                <button onClick={() => {
                  onPhysicsChange({
                    charge: -500,
                    linkDistance: 150,
                    linkStrength: 0.2,
                    friction: 0.95,
                    gravity: 0.05,
                    theta: 0.9,
                    alpha: 1,
                    alphaDecay: 0.0228
                  });
                }}>
                  Spread Out
                </button>
                <button onClick={() => {
                  onPhysicsChange({
                    charge: -150,
                    linkDistance: 80,
                    linkStrength: 0.3,
                    friction: 0.8,
                    gravity: 0.2,
                    theta: 0.7,
                    alpha: 1,
                    alphaDecay: 0.0228
                  });
                }}>
                  Clustered
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GraphControls;
