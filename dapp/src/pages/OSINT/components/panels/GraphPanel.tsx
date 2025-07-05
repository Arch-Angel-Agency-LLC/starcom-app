import React, { useState, useRef, useEffect } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize, Download, Filter, RotateCcw, GitBranch, Plus } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import styles from './GraphPanel.module.css';

// Hooks and services
import { useEntityGraph } from '../../hooks/useEntityGraph';
import ErrorDisplay from '../common/ErrorDisplay';

interface GraphPanelProps {
  data: Record<string, unknown>;
  panelId: string;
  investigationId?: string;
}

// Node color map by type
const nodeColorMap: Record<string, string> = {
  person: '#4184e4',
  organization: '#41c7e4',
  wallet: '#e49a41',
  domain: '#41e4a9',
  account: '#e44171',
  event: '#9a41e4',
  device: '#e4e441',
  file: '#a9e441',
};

// Link color map by type
const linkColorMap: Record<string, string> = {
  employee: '#6ba5ff',
  owner: '#ff6b6b',
  associate: '#6bffb5',
  transaction: '#ffb56b',
  communication: '#b56bff',
  location: '#6bfff4',
  access: '#f4ff6b',
};

/**
 * Entity Relationship Graph Panel
 * 
 * Visualizes connections between entities in an investigation
 */
const GraphPanel: React.FC<GraphPanelProps> = ({ data, panelId, investigationId }) => {
  // Use the entity graph hook
  const {
    graphData,
    loading,
    error,
    expandNode,
    findPath,
    refreshGraph,
    selectedNode,
    setSelectedNode,
    isExpanding
  } = useEntityGraph({
    investigationId: investigationId || (data.investigationId as string),
    autoLoad: true
  });
  
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize dimensions on mount
  useEffect(() => {
    if (graphRef.current && containerRef.current) {
      // Force a redraw after the panel is fully rendered
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.d3Force('charge').strength(-120);
          graphRef.current.d3Force('link').distance(70);
          graphRef.current.zoom(1.2);
        }
      }, 100);
    }
  }, []);
  
  // Handle node hover highlight
  const handleNodeHover = (node: any) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    
    const neighborNodes = new Set([node.id]);
    const neighborLinks = new Set();
    
    graphData.links.forEach(link => {
      if (link.source.id === node.id || link.source === node.id || 
          link.target.id === node.id || link.target === node.id) {
        neighborLinks.add(link);
        neighborNodes.add(link.source.id || link.source);
        neighborNodes.add(link.target.id || link.target);
      }
    });
    
    setHighlightNodes(neighborNodes);
    setHighlightLinks(neighborLinks);
  };
  
  // Handle node click
  const handleNodeClick = (node: any) => {
    setSelectedNode(node.id);
    setSelectedLink(null);
  };
  
  // Handle link click
  const handleLinkClick = (link: any) => {
    setSelectedLink(link);
    setSelectedNode(null);
  };
  
  // Handle node expansion
  const handleExpandNode = async () => {
    if (!selectedNode) return;
    
    try {
      await expandNode(selectedNode);
    } catch (err) {
      console.error('Error expanding node:', err);
    }
  };
  
  // Handle find path between nodes
  const handleFindPath = async () => {
    // This would typically show a UI to select target node
    // For now, just demonstrate finding a path to a random node
    if (!selectedNode || graphData.nodes.length < 2) return;
    
    const otherNodes = graphData.nodes.filter(node => node.id !== selectedNode);
    if (otherNodes.length === 0) return;
    
    const randomTargetNode = otherNodes[Math.floor(Math.random() * otherNodes.length)];
    
    try {
      await findPath(selectedNode, randomTargetNode.id);
    } catch (err) {
      console.error('Error finding path:', err);
    }
  };
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    if (graphRef.current) {
      const newZoom = zoomLevel * 1.2;
      graphRef.current.zoom(newZoom);
      setZoomLevel(newZoom);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      const newZoom = zoomLevel / 1.2;
      graphRef.current.zoom(newZoom);
      setZoomLevel(newZoom);
    }
  };
  
  // Reset graph view
  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.centerAt();
      graphRef.current.zoom(1.2);
      setZoomLevel(1.2);
    }
  };
  
  // Export graph as image
  const handleExportImage = () => {
    if (!graphRef.current) return;
    
    const canvas = document.querySelector('.react-force-graph-2d canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'entity-graph.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  return (
    <div className={styles.graphPanel} ref={containerRef}>
      <div className={styles.toolbar}>
        <div className={styles.toolSection}>
          <button className={styles.toolButton} onClick={handleZoomIn} title="Zoom in">
            <ZoomIn size={14} />
          </button>
          <button className={styles.toolButton} onClick={handleZoomOut} title="Zoom out">
            <ZoomOut size={14} />
          </button>
          <button className={styles.toolButton} onClick={handleResetView} title="Reset view">
            <RotateCcw size={14} />
          </button>
        </div>
        
        <div className={styles.toolSection}>
          <button className={styles.toolButton} title="Filter nodes">
            <Filter size={14} />
          </button>
          <button 
            className={styles.toolButton} 
            onClick={handleFindPath} 
            title="Find connections"
            disabled={!selectedNode}
          >
            <GitBranch size={14} />
          </button>
          <button 
            className={styles.toolButton} 
            onClick={handleExpandNode} 
            title="Expand node"
            disabled={!selectedNode || isExpanding}
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className={styles.toolSection}>
          <button className={styles.toolButton} onClick={handleExportImage} title="Export as image">
            <Download size={14} />
          </button>
          <button className={styles.toolButton} title="Full screen">
            <Maximize size={14} />
          </button>
          <button 
            className={styles.toolButton} 
            onClick={refreshGraph}
            title="Refresh graph"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      
      <div className={styles.graphContainer}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <div className={styles.loadingText}>Loading graph data...</div>
          </div>
        )}
        
        {error && (
          <div className={styles.errorContainer}>
            <ErrorDisplay 
              error={error}
              onRetry={refreshGraph}
              className={styles.graphError}
            />
          </div>
        )}
        
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeId="id"
          nodeVal={node => node.size || 1}
          nodeLabel={node => node.label}
          nodeColor={node => {
            const isHighlighted = !highlightNodes.size || highlightNodes.has(node.id);
            return isHighlighted 
              ? (node.color || nodeColorMap[node.type] || '#4184e4')
              : 'rgba(160, 180, 216, 0.3)';
          }}
          nodeRelSize={6}
          linkWidth={link => {
            const isHighlighted = !highlightLinks.size || highlightLinks.has(link);
            return isHighlighted ? 2 : 1;
          }}
          linkColor={link => {
            const isHighlighted = !highlightLinks.size || highlightLinks.has(link);
            return isHighlighted 
              ? (link.color || linkColorMap[link.type] || '#a0b4d8')
              : 'rgba(160, 180, 216, 0.2)';
          }}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={0.9}
          linkCurvature={0.25}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          backgroundColor="rgba(16, 20, 34, 0)"
          width={containerRef.current?.clientWidth || 800}
          height={(containerRef.current?.clientHeight || 600) - 90}
        />
      </div>
      
      <div className={styles.detailsPanel}>
        {selectedNode ? (
          <div className={styles.entityDetails}>
            {(() => {
              const node = graphData.nodes.find(n => n.id === selectedNode);
              if (!node) return <div>Loading node details...</div>;
              
              return (
                <>
                  <h4 className={styles.detailsTitle}>{node.label}</h4>
                  <div className={styles.detailType}>
                    <span className={styles.detailLabel}>Type:</span>
                    <span className={styles.detailValue}>{node.type}</span>
                  </div>
                  <div className={styles.detailConnections}>
                    <span className={styles.detailLabel}>Connections:</span>
                    <span className={styles.detailValue}>
                      {graphData.links.filter(link => 
                        link.source.id === selectedNode || 
                        link.target.id === selectedNode
                      ).length}
                    </span>
                  </div>
                  {node.metadata && node.metadata.entity && (
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.actionButton}
                        onClick={handleExpandNode}
                        disabled={isExpanding}
                      >
                        {isExpanding ? (
                          <>
                            <div className={styles.buttonSpinner}></div>
                            <span>Expanding...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Expand Connections</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : selectedLink ? (
          <div className={styles.relationshipDetails}>
            <h4 className={styles.detailsTitle}>Relationship</h4>
            <div className={styles.detailType}>
              <span className={styles.detailLabel}>Type:</span>
              <span className={styles.detailValue}>{selectedLink.type}</span>
            </div>
            <div className={styles.detailSource}>
              <span className={styles.detailLabel}>Source:</span>
              <span className={styles.detailValue}>
                {typeof selectedLink.source === 'object' 
                  ? selectedLink.source.label 
                  : graphData.nodes.find(n => n.id === selectedLink.source)?.label}
              </span>
            </div>
            <div className={styles.detailTarget}>
              <span className={styles.detailLabel}>Target:</span>
              <span className={styles.detailValue}>
                {typeof selectedLink.target === 'object' 
                  ? selectedLink.target.label 
                  : graphData.nodes.find(n => n.id === selectedLink.target)?.label}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.helpText}>
            <Network size={14} />
            <span>Click on a node or connection for details</span>
          </div>
        )}
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendSection}>
          <h5 className={styles.legendTitle}>Entity Types</h5>
          <div className={styles.legendItems}>
            {Object.entries(nodeColorMap).slice(0, 4).map(([type, color]) => (
              <div key={type} className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: color }}></span>
                <span className={styles.legendLabel}>{type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.legendSection}>
          <h5 className={styles.legendTitle}>Relationship Types</h5>
          <div className={styles.legendItems}>
            {Object.entries(linkColorMap).slice(0, 4).map(([type, color]) => (
              <div key={type} className={styles.legendItem}>
                <span className={styles.legendLine} style={{ backgroundColor: color }}></span>
                <span className={styles.legendLabel}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphPanel;
