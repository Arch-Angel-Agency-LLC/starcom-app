/**
 * NodeWebDashboard Component
 * 
 * Main component for the NodeWeb functionality, repurposed from OSINT module.
 */

import React, { useState, useEffect } from 'react';
import { useNodeWeb } from '../hooks/useNodeWeb';
import styles from './NodeWebDashboard.module.css';
import { NodeType } from '../types/nodeWeb';
import NodeWebVisualizer from './NodeWebVisualizer';

const NodeWebDashboard: React.FC = () => {
  const {
    loading,
    error,
    nodes,
    edges,
    stats,
    filter,
    updateFilter,
    applyFilter,
    selectedNode,
    setSelectedNodeId,
    visualizationOptions,
    updateVisualizationOptions
  } = useNodeWeb({ autoLoad: true });

  const [depthValue, setDepthValue] = useState<number>(filter.maxDepth || 3);

  // Update filter when depth slider changes
  useEffect(() => {
    updateFilter({ maxDepth: depthValue });
  }, [depthValue, updateFilter]);

  // Handle node type filter change
  const handleNodeTypeToggle = (type: string) => {
    const currentTypes = filter.types || [];
    const newTypes = currentTypes.includes(type as NodeType)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type as NodeType];
    
    updateFilter({ types: newTypes });
    applyFilter();
  };

  // Handle view type change
  const handleViewTypeChange = (viewType: 'twoD' | 'threeD' | 'hierarchical' | 'forcedirected') => {
    updateVisualizationOptions({ viewType });
  };

  // Handle node selection
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  // Render network graph using the new visualizer component
  const renderNetworkGraph = () => {
    if (loading) {
      return (
        <div className={styles.graphPlaceholder}>
          <div className={styles.graphIcon}>⏳</div>
          <div className={styles.graphLabel}>Loading network data...</div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className={styles.graphPlaceholder}>
          <div className={styles.graphIcon}>❌</div>
          <div className={styles.graphLabel}>Error loading network data</div>
        </div>
      );
    }
    
    if (nodes.length === 0) {
      return (
        <div className={styles.graphPlaceholder}>
          <div className={styles.graphIcon}>🔍</div>
          <div className={styles.graphLabel}>No nodes match the current filter criteria</div>
        </div>
      );
    }
    
    return (
      <NodeWebVisualizer 
        nodes={nodes}
        edges={edges}
        onNodeSelect={handleNodeSelect}
      />
    );
  };

  // Render selected node details
  const renderSelectedNodeDetails = () => {
    if (!selectedNode) {
      return (
        <div className={styles.noNodeSelected}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyMessage}>Select a node to view details</div>
        </div>
      );
    }

    const { incomingEdges, outgoingEdges } = selectedNode;
    
    return (
      <div className={styles.selectedNode}>
        <div className={styles.nodeInfo}>
          <div className={styles.nodeHeader}>
            <div className={styles.nodeName}>{selectedNode.label}</div>
            <div className={styles.nodeType}>{selectedNode.type}</div>
          </div>
          <div className={styles.nodeDetails}>
            {selectedNode.properties.ipAddress && (
              <div className={styles.nodeDetail}>
                <span className={styles.detailLabel}>IP Address:</span>
                <span className={styles.detailValue}>{selectedNode.properties.ipAddress as string}</span>
              </div>
            )}
            {selectedNode.properties.location && (
              <div className={styles.nodeDetail}>
                <span className={styles.detailLabel}>Location:</span>
                <span className={styles.detailValue}>{selectedNode.properties.location as string}</span>
              </div>
            )}
            <div className={styles.nodeDetail}>
              <span className={styles.detailLabel}>Connections:</span>
              <span className={styles.detailValue}>
                {outgoingEdges.length} outbound, {incomingEdges.length} inbound
              </span>
            </div>
            <div className={styles.nodeDetail}>
              <span className={styles.detailLabel}>Threat Level:</span>
              <span className={
                `${styles.detailValue} ${
                  (selectedNode.threatLevel || 0) > 0.7 ? styles.threatHigh :
                  (selectedNode.threatLevel || 0) > 0.4 ? styles.threatMedium :
                  styles.threatLow
                }`
              }>
                {(selectedNode.threatLevel || 0) > 0.7 ? 'High' :
                 (selectedNode.threatLevel || 0) > 0.4 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className={styles.nodeDetail}>
              <span className={styles.detailLabel}>Confidence:</span>
              <span className={styles.detailValue}>
                {Math.round((selectedNode.confidence || 0) * 100)}%
              </span>
            </div>
            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div className={styles.nodeTags}>
                {selectedNode.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.nodeDescription}>
            {selectedNode.description}
          </div>
        </div>
        <div className={styles.nodeActions}>
          <button className={styles.nodeButton}>Analyze</button>
          <button className={styles.nodeButton}>Track</button>
          <button className={styles.nodeButton}>Report</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading network data...</div>;
  }

  if (error) {
    return <div className={styles.errorContainer}>Error: {error.toString()}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.title}>Network Topology</h1>
      
      <div className={styles.content}>
        <div className={styles.networkVisualizer}>
          {/* Network graph visualization area */}
          <div className={styles.networkGraph}>
            {renderNetworkGraph()}
          </div>
          
          {/* Controls and filters */}
          <div className={styles.controlPanel}>
            <div className={styles.controlSection}>
              <h3 className={styles.sectionTitle}>Network Filters</h3>
              <div className={styles.filterOptions}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <input 
                      type="checkbox" 
                      checked={(filter.types || []).includes('threat')}
                      onChange={() => handleNodeTypeToggle('threat')}
                      className={styles.filterCheckbox} 
                    />
                    <span className={styles.checkboxCustom}></span>
                    <span>Known Threat Actors</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input 
                      type="checkbox" 
                      checked={(filter.tags || []).includes('compromised')}
                      onChange={() => {
                        const currentTags = filter.tags || [];
                        const newTags = currentTags.includes('compromised')
                          ? currentTags.filter(t => t !== 'compromised')
                          : [...currentTags, 'compromised'];
                        
                        updateFilter({ tags: newTags });
                        applyFilter();
                      }}
                      className={styles.filterCheckbox} 
                    />
                    <span className={styles.checkboxCustom}></span>
                    <span>Compromised Nodes</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input 
                      type="checkbox" 
                      checked={(filter.tags || []).includes('critical')}
                      onChange={() => {
                        const currentTags = filter.tags || [];
                        const newTags = currentTags.includes('critical')
                          ? currentTags.filter(t => t !== 'critical')
                          : [...currentTags, 'critical'];
                        
                        updateFilter({ tags: newTags });
                        applyFilter();
                      }}
                      className={styles.filterCheckbox} 
                    />
                    <span className={styles.checkboxCustom}></span>
                    <span>Critical Infrastructure</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input 
                      type="checkbox" 
                      checked={filter.showUnconfirmed}
                      onChange={() => {
                        updateFilter({ showUnconfirmed: !filter.showUnconfirmed });
                        applyFilter();
                      }}
                      className={styles.filterCheckbox} 
                    />
                    <span className={styles.checkboxCustom}></span>
                    <span>Unconfirmed Connections</span>
                  </label>
                </div>
                
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Connection Depth</label>
                  <div className={styles.sliderContainer}>
                    <input 
                      type="range" 
                      min="1" 
                      max="6" 
                      value={depthValue}
                      onChange={(e) => setDepthValue(parseInt(e.target.value))}
                      onMouseUp={applyFilter}
                      onTouchEnd={applyFilter}
                      className={styles.slider} 
                    />
                    <span className={styles.sliderValue}>{depthValue}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.controlSection}>
              <h3 className={styles.sectionTitle}>View Options</h3>
              <div className={styles.viewOptions}>
                <button 
                  className={`${styles.viewButton} ${visualizationOptions.viewType === 'twoD' ? styles.active : ''}`}
                  onClick={() => handleViewTypeChange('twoD')}
                >
                  2D View
                </button>
                <button 
                  className={`${styles.viewButton} ${visualizationOptions.viewType === 'threeD' ? styles.active : ''}`}
                  onClick={() => handleViewTypeChange('threeD')}
                >
                  3D View
                </button>
                <button 
                  className={`${styles.viewButton} ${visualizationOptions.viewType === 'hierarchical' ? styles.active : ''}`}
                  onClick={() => handleViewTypeChange('hierarchical')}
                >
                  Hierarchical
                </button>
                <button 
                  className={`${styles.viewButton} ${visualizationOptions.viewType === 'forcedirected' ? styles.active : ''}`}
                  onClick={() => handleViewTypeChange('forcedirected')}
                >
                  Force-Directed
                </button>
              </div>
            </div>
            
            <div className={styles.controlSection}>
              <h3 className={styles.sectionTitle}>Selected Node</h3>
              {renderSelectedNodeDetails()}
            </div>
          </div>
        </div>
        
        <div className={styles.statBar}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.nodeCount}</div>
            <div className={styles.statLabel}>Total Nodes</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.edgeCount}</div>
            <div className={styles.statLabel}>Connections</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.threatNodeCount}</div>
            <div className={styles.statLabel}>Threat Actors</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.criticalNodeCount}</div>
            <div className={styles.statLabel}>Critical Nodes</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.clusterCount}</div>
            <div className={styles.statLabel}>Active Clusters</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeWebDashboard;
