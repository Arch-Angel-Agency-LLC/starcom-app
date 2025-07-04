import React, { useState, useRef, useEffect } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize, Download, Filter, RotateCcw, GitBranch } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import styles from './GraphPanel.module.css';

interface GraphPanelProps {
  data: Record<string, any>;
  panelId: string;
}

// Mock data for the entity graph
const mockGraphData = {
  nodes: [
    { id: 'n1', group: 'person', name: 'John Anderson', value: 20 },
    { id: 'n2', group: 'organization', name: 'TechCorp', value: 30 },
    { id: 'n3', group: 'wallet', name: '0x7Fc66...DDaE9', value: 15 },
    { id: 'n4', group: 'person', name: 'Sarah Miller', value: 18 },
    { id: 'n5', group: 'organization', name: 'CryptoFund', value: 25 },
    { id: 'n6', group: 'domain', name: 'techcorp.com', value: 12 },
    { id: 'n7', group: 'account', name: '@john_tech', value: 10 },
    { id: 'n8', group: 'person', name: 'Michael Wong', value: 17 },
    { id: 'n9', group: 'wallet', name: '0x9Fc12...FFbA2', value: 14 },
  ],
  links: [
    { source: 'n1', target: 'n2', type: 'employee' },
    { source: 'n1', target: 'n3', type: 'owner' },
    { source: 'n1', target: 'n7', type: 'owner' },
    { source: 'n2', target: 'n6', type: 'owner' },
    { source: 'n3', target: 'n5', type: 'transaction' },
    { source: 'n4', target: 'n2', type: 'employee' },
    { source: 'n4', target: 'n8', type: 'associate' },
    { source: 'n5', target: 'n9', type: 'transaction' },
    { source: 'n8', target: 'n9', type: 'owner' },
  ]
};

// Node color map by group
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
const GraphPanel: React.FC<GraphPanelProps> = ({ data, panelId }) => {
  const [graphData, setGraphData] = useState(mockGraphData);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState<any>(null);
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
    setSelectedNode(node);
    setSelectedLink(null);
  };
  
  // Handle link click
  const handleLinkClick = (link: any) => {
    setSelectedLink(link);
    setSelectedNode(null);
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
          <button className={styles.toolButton} title="Show connections">
            <GitBranch size={14} />
          </button>
        </div>
        
        <div className={styles.toolSection}>
          <button className={styles.toolButton} onClick={handleExportImage} title="Export as image">
            <Download size={14} />
          </button>
          <button className={styles.toolButton} title="Full screen">
            <Maximize size={14} />
          </button>
        </div>
      </div>
      
      <div className={styles.graphContainer}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeId="id"
          nodeVal={node => node.value}
          nodeLabel={node => node.name}
          nodeColor={node => {
            const isHighlighted = !highlightNodes.size || highlightNodes.has(node.id);
            return isHighlighted 
              ? nodeColorMap[node.group] || '#4184e4'
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
              ? linkColorMap[link.type] || '#a0b4d8'
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
            <h4 className={styles.detailsTitle}>{selectedNode.name}</h4>
            <div className={styles.detailType}>
              <span className={styles.detailLabel}>Type:</span>
              <span className={styles.detailValue}>{selectedNode.group}</span>
            </div>
            <div className={styles.detailConnections}>
              <span className={styles.detailLabel}>Connections:</span>
              <span className={styles.detailValue}>
                {graphData.links.filter(link => 
                  link.source.id === selectedNode.id || 
                  link.target.id === selectedNode.id
                ).length}
              </span>
            </div>
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
                  ? selectedLink.source.name 
                  : graphData.nodes.find(n => n.id === selectedLink.source)?.name}
              </span>
            </div>
            <div className={styles.detailTarget}>
              <span className={styles.detailLabel}>Target:</span>
              <span className={styles.detailValue}>
                {typeof selectedLink.target === 'object' 
                  ? selectedLink.target.name 
                  : graphData.nodes.find(n => n.id === selectedLink.target)?.name}
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
