import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  CircularProgress,
  TextField,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Card,
  CardContent
} from '@mui/material';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Filter, 
  RotateCcw, 
  Plus,
  Maximize2
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

// Node and link data types
interface Node {
  id: string;
  name: string;
  type: string;
  value: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
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
 * Node Web Visualizer
 * 
 * A powerful graph visualization component for displaying and analyzing
 * connections between entities in an investigation.
 */
const NodeWebVisualizer: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [nodeTypes, setNodeTypes] = useState<string[]>([]);
  const [linkTypes, setLinkTypes] = useState<string[]>([]);
  const [filteredNodeTypes, setFilteredNodeTypes] = useState<string[]>([]);
  const [filteredLinkTypes, setFilteredLinkTypes] = useState<string[]>([]);
  const [nodeSize, setNodeSize] = useState<number>(8);
  const [linkWidth, setLinkWidth] = useState<number>(2);
  const [graphDistance, setGraphDistance] = useState<number>(200);
  const [searchTerm, setSearchTerm] = useState('');
  
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load sample data for the graph visualization
  useEffect(() => {
    const loadSampleData = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, this would load from an API or service
        // For now, we'll create some sample data
        const sampleNodes: Node[] = [
          { id: 'p1', name: 'John Smith', type: 'person', value: 10 },
          { id: 'p2', name: 'Alice Johnson', type: 'person', value: 8 },
          { id: 'p3', name: 'Robert Chen', type: 'person', value: 6 },
          { id: 'o1', name: 'Acme Corp', type: 'organization', value: 15 },
          { id: 'o2', name: 'Globex Industries', type: 'organization', value: 12 },
          { id: 'w1', name: '0x1a2b3c...', type: 'wallet', value: 7 },
          { id: 'd1', name: 'example.com', type: 'domain', value: 9 },
          { id: 'd2', name: 'test-domain.org', type: 'domain', value: 7 },
          { id: 'a1', name: '@jsmith', type: 'account', value: 8 },
          { id: 'e1', name: 'Conference Call', type: 'event', value: 6 },
          { id: 'dev1', name: 'iPhone 13', type: 'device', value: 5 },
          { id: 'f1', name: 'financial_report.pdf', type: 'file', value: 4 }
        ];
        
        const sampleLinks: Link[] = [
          { source: 'p1', target: 'o1', type: 'employee', value: 1 },
          { source: 'p2', target: 'o1', type: 'employee', value: 1 },
          { source: 'p3', target: 'o2', type: 'employee', value: 1 },
          { source: 'o1', target: 'o2', type: 'associate', value: 0.5 },
          { source: 'p1', target: 'w1', type: 'owner', value: 1 },
          { source: 'p1', target: 'd1', type: 'owner', value: 1 },
          { source: 'o1', target: 'd1', type: 'owner', value: 1 },
          { source: 'p1', target: 'a1', type: 'owner', value: 1 },
          { source: 'p1', target: 'p2', type: 'communication', value: 2 },
          { source: 'p2', target: 'p3', type: 'communication', value: 1 },
          { source: 'p1', target: 'e1', type: 'access', value: 1 },
          { source: 'p2', target: 'e1', type: 'access', value: 1 },
          { source: 'p3', target: 'e1', type: 'access', value: 1 },
          { source: 'p1', target: 'dev1', type: 'owner', value: 1 },
          { source: 'p1', target: 'f1', type: 'access', value: 1 }
        ];
        
        // Extract all node and link types for filtering
        const uniqueNodeTypes = [...new Set(sampleNodes.map(node => node.type))];
        const uniqueLinkTypes = [...new Set(sampleLinks.map(link => link.type))];
        
        setNodeTypes(uniqueNodeTypes);
        setLinkTypes(uniqueLinkTypes);
        setFilteredNodeTypes(uniqueNodeTypes);
        setFilteredLinkTypes(uniqueLinkTypes);
        
        setGraphData({ nodes: sampleNodes, links: sampleLinks });
      } catch (error) {
        console.error('Error loading graph data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSampleData();
  }, []);
  
  // Apply filters to the graph data
  const filteredGraphData = useCallback(() => {
    if (!graphData) return { nodes: [], links: [] };
    
    // Filter nodes by type and search term
    const filteredNodes = graphData.nodes.filter(node => 
      filteredNodeTypes.includes(node.type) && 
      (searchTerm === '' || node.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Get IDs of filtered nodes for link filtering
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links by type and connected nodes
    const filteredLinks = graphData.links.filter(link => 
      filteredLinkTypes.includes(link.type) && 
      nodeIds.has(link.source.toString()) && 
      nodeIds.has(link.target.toString())
    );
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filteredNodeTypes, filteredLinkTypes, searchTerm]);
  
  // Handle node click event
  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    setSelectedLink(null);
    
    // In a real implementation, you might load additional data about the node
  }, []);
  
  // Handle link click event
  const handleLinkClick = useCallback((link: Link) => {
    setSelectedLink(link);
    setSelectedNode(null);
    
    // In a real implementation, you might load additional data about the link
  }, []);
  
  // Handle zoom in
  const handleZoomIn = () => {
    graphRef.current?.zoomIn();
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    graphRef.current?.zoomOut();
  };
  
  // Handle reset view
  const handleResetView = () => {
    graphRef.current?.resetView();
  };
  
  // Handle download graph as image
  const handleDownloadImage = () => {
    if (!graphRef.current) return;
    
    const canvas = document.querySelector('.react-force-graph-2d canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'node-web-visualization.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  
  // Toggle node type filter
  const toggleNodeTypeFilter = (type: string) => {
    if (filteredNodeTypes.includes(type)) {
      setFilteredNodeTypes(filteredNodeTypes.filter(t => t !== type));
    } else {
      setFilteredNodeTypes([...filteredNodeTypes, type]);
    }
  };
  
  // Toggle link type filter
  const toggleLinkTypeFilter = (type: string) => {
    if (filteredLinkTypes.includes(type)) {
      setFilteredLinkTypes(filteredLinkTypes.filter(t => t !== type));
    } else {
      setFilteredLinkTypes([...filteredLinkTypes, type]);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Node Web Visualizer
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Network />}
          href="/info-analysis"
        >
          Analysis Tools
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <Paper elevation={3} sx={{ p: 2, mr: 2, flexGrow: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button size="small" startIcon={<ZoomIn />} onClick={handleZoomIn}>
              Zoom In
            </Button>
            <Button size="small" startIcon={<ZoomOut />} onClick={handleZoomOut}>
              Zoom Out
            </Button>
            <Button size="small" startIcon={<RotateCcw />} onClick={handleResetView}>
              Reset
            </Button>
            <Button size="small" startIcon={<Download />} onClick={handleDownloadImage}>
              Save
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Node Size
          </Typography>
          <Slider
            size="small"
            min={2}
            max={20}
            value={nodeSize}
            onChange={(_, value) => setNodeSize(value as number)}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Link Width
          </Typography>
          <Slider
            size="small"
            min={1}
            max={10}
            value={linkWidth}
            onChange={(_, value) => setLinkWidth(value as number)}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle2" gutterBottom>
            Node Distance
          </Typography>
          <Slider
            size="small"
            min={50}
            max={500}
            value={graphDistance}
            onChange={(_, value) => setGraphDistance(value as number)}
            sx={{ mb: 2 }}
          />
        </Paper>
        
        <Paper elevation={3} sx={{ p: 2, width: '300px' }}>
          {selectedNode ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Node Details
              </Typography>
              <Typography variant="subtitle1">{selectedNode.name}</Typography>
              <Chip
                label={selectedNode.type}
                sx={{ 
                  bgcolor: nodeColorMap[selectedNode.type] || '#999', 
                  color: 'white',
                  my: 1
                }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                ID: {selectedNode.id}
              </Typography>
              <Typography variant="body2">
                Value: {selectedNode.value}
              </Typography>
              <Typography variant="body2">
                Connections: {graphData.links.filter(link => 
                  link.source === selectedNode.id || link.target === selectedNode.id
                ).length}
              </Typography>
            </Box>
          ) : selectedLink ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Link Details
              </Typography>
              <Typography variant="subtitle1">
                {typeof selectedLink.source === 'object' 
                  ? selectedLink.source.name || selectedLink.source.id
                  : selectedLink.source}
                {' → '}
                {typeof selectedLink.target === 'object'
                  ? selectedLink.target.name || selectedLink.target.id
                  : selectedLink.target}
              </Typography>
              <Chip
                label={selectedLink.type}
                sx={{ 
                  bgcolor: linkColorMap[selectedLink.type] || '#999', 
                  color: 'white',
                  my: 1
                }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                Relationship Type: {selectedLink.type}
              </Typography>
              <Typography variant="body2">
                Strength: {selectedLink.value}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Node Types
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {nodeTypes.map(type => (
                  <Chip
                    key={type}
                    label={type}
                    size="small"
                    onClick={() => toggleNodeTypeFilter(type)}
                    sx={{ 
                      mb: 1,
                      bgcolor: filteredNodeTypes.includes(type) 
                        ? nodeColorMap[type] || '#999' 
                        : 'transparent',
                      color: filteredNodeTypes.includes(type) ? 'white' : 'inherit',
                      border: !filteredNodeTypes.includes(type) 
                        ? `1px solid ${nodeColorMap[type] || '#999'}` 
                        : 'none'
                    }}
                  />
                ))}
              </Stack>
              
              <Typography variant="subtitle2" gutterBottom>
                Link Types
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {linkTypes.map(type => (
                  <Chip
                    key={type}
                    label={type}
                    size="small"
                    onClick={() => toggleLinkTypeFilter(type)}
                    sx={{ 
                      mb: 1,
                      bgcolor: filteredLinkTypes.includes(type) 
                        ? linkColorMap[type] || '#999' 
                        : 'transparent',
                      color: filteredLinkTypes.includes(type) ? 'white' : 'inherit',
                      border: !filteredLinkTypes.includes(type) 
                        ? `1px solid ${linkColorMap[type] || '#999'}` 
                        : 'none'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
      
      <Paper elevation={3} sx={{ flex: 1, overflow: 'hidden', position: 'relative' }} ref={containerRef}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredGraphData()}
            nodeId="id"
            nodeLabel="name"
            nodeColor={node => nodeColorMap[node.type] || '#999'}
            nodeVal={node => node.value * 2}
            nodeRelSize={nodeSize}
            linkColor={link => linkColorMap[link.type] || '#999'}
            linkWidth={link => link.value * linkWidth}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={link => linkColorMap[link.type] || '#999'}
            backgroundColor="#f5f5f5"
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            cooldownTicks={100}
            linkDistance={graphDistance}
            height={containerRef.current?.clientHeight || 500}
            width={containerRef.current?.clientWidth || 800}
          />
        )}
      </Paper>
    </Box>
  );
};

export default NodeWebVisualizer;
