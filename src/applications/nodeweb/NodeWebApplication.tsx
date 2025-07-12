import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Plus, 
  Search, 
  Link, 
  FileText, 
  Tag,
  Eye,
  Edit,
  Share,
  BookOpen,
  Brain,
  Zap
} from 'lucide-react';

// Intelligence Node Interface
interface IntelNode {
  id: string;
  title: string;
  content: string;
  type: 'report' | 'analysis' | 'entity' | 'connection' | 'hypothesis';
  tags: string[];
  connections: string[]; // IDs of connected nodes
  coordinates: { x: number; y: number };
  metadata: {
    author: string;
    created: string;
    updated: string;
    classification: 'unclassified' | 'confidential' | 'secret' | 'top-secret';
    confidence: number;
    source: string;
  };
}

// Connection Interface (for future implementation)
/*
interface NodeConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'relates-to' | 'supports' | 'contradicts' | 'leads-to' | 'part-of';
  strength: number;
  description?: string;
}
*/

const NodeWebApplication: React.FC = () => {
  // State management
  const [nodes, setNodes] = useState<IntelNode[]>([]);
  // const [connections] = useState<NodeConnection[]>([]); // TODO: Implement connections
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<IntelNode | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'grid'>('graph');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Create node form state
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'report' as IntelNode['type'],
    tags: '',
    classification: 'unclassified' as IntelNode['metadata']['classification'],
    source: ''
  });

  // Load intelligence nodes
  useEffect(() => {
    const loadNodes = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual data loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock intelligence nodes
        const mockNodes: IntelNode[] = [
          {
            id: '1',
            title: 'Cyber Threat Analysis - Q4 2024',
            content: 'Comprehensive analysis of emerging cyber threats targeting critical infrastructure...',
            type: 'analysis',
            tags: ['cyber-security', 'threats', 'infrastructure'],
            connections: ['2', '3'],
            coordinates: { x: 100, y: 100 },
            metadata: {
              author: 'Analyst Smith',
              created: '2024-12-01T10:00:00Z',
              updated: '2024-12-01T10:00:00Z',
              classification: 'confidential',
              confidence: 0.9,
              source: 'Internal Analysis'
            }
          },
          {
            id: '2',
            title: 'APT Group Activities',
            content: 'Documentation of recent APT group activities and TTPs...',
            type: 'report',
            tags: ['apt', 'tactics', 'malware'],
            connections: ['1', '4'],
            coordinates: { x: 300, y: 150 },
            metadata: {
              author: 'Intel Team',
              created: '2024-11-28T14:30:00Z',
              updated: '2024-11-30T09:15:00Z',
              classification: 'secret',
              confidence: 0.85,
              source: 'Multi-source Intelligence'
            }
          },
          {
            id: '3',
            title: 'Critical Infrastructure Entity',
            content: 'Power grid facility - potential target of interest...',
            type: 'entity',
            tags: ['infrastructure', 'power-grid', 'target'],
            connections: ['1'],
            coordinates: { x: 200, y: 250 },
            metadata: {
              author: 'Geographic Intel',
              created: '2024-11-25T11:20:00Z',
              updated: '2024-11-25T11:20:00Z',
              classification: 'confidential',
              confidence: 0.95,
              source: 'Open Source Intelligence'
            }
          },
          {
            id: '4',
            title: 'Network Intrusion Hypothesis',
            content: 'Working hypothesis about coordinated network intrusion campaign...',
            type: 'hypothesis',
            tags: ['hypothesis', 'intrusion', 'coordination'],
            connections: ['2'],
            coordinates: { x: 450, y: 200 },
            metadata: {
              author: 'Lead Analyst',
              created: '2024-12-02T16:45:00Z',
              updated: '2024-12-02T16:45:00Z',
              classification: 'confidential',
              confidence: 0.7,
              source: 'Analytical Assessment'
            }
          }
        ];

        // Mock connections for future implementation
        /*
        const mockConnections: NodeConnection[] = [
          {
            id: 'conn1',
            sourceId: '1',
            targetId: '2',
            type: 'supports',
            strength: 0.8,
            description: 'Analysis supports APT activity findings'
          },
          {
            id: 'conn2',
            sourceId: '1',
            targetId: '3',
            type: 'relates-to',
            strength: 0.6,
            description: 'Infrastructure mentioned in threat analysis'
          },
          {
            id: 'conn3',
            sourceId: '2',
            targetId: '4',
            type: 'leads-to',
            strength: 0.75,
            description: 'APT activities lead to intrusion hypothesis'
          }
        ];
        */

        setNodes(mockNodes);
        // setConnections(mockConnections); // TODO: Implement connection management
      } catch (error) {
        console.error('Error loading nodes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNodes();
  }, []);

  // Handle create node
  const handleCreateNode = useCallback(() => {
    if (!createForm.title.trim() || !createForm.content.trim()) return;

    const newNode: IntelNode = {
      id: Date.now().toString(),
      title: createForm.title,
      content: createForm.content,
      type: createForm.type,
      tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      connections: [],
      coordinates: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      metadata: {
        author: 'Current User',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        classification: createForm.classification,
        confidence: 0.8,
        source: createForm.source || 'Manual Entry'
      }
    };

    setNodes(prev => [...prev, newNode]);
    setCreateForm({
      title: '',
      content: '',
      type: 'report',
      tags: '',
      classification: 'unclassified',
      source: ''
    });
    setIsCreateDialogOpen(false);
  }, [createForm]);

  // Filter nodes based on search and type
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = searchQuery === '' || 
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || node.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get node type icon
  const getNodeTypeIcon = (type: IntelNode['type']) => {
    switch (type) {
      case 'report': return <FileText size={16} />;
      case 'analysis': return <Brain size={16} />;
      case 'entity': return <Tag size={16} />;
      case 'connection': return <Link size={16} />;
      case 'hypothesis': return <Zap size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Get classification color
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'unclassified': return '#4CAF50';
      case 'confidential': return '#FF9800';
      case 'secret': return '#FF5722';
      case 'top-secret': return '#F44336';
      default: return '#2196F3';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Intelligence Connections...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8 }} />
            }}
            sx={{ minWidth: 200 }}
          />

          {/* View Mode */}
          <FormControl size="small">
            <InputLabel>View</InputLabel>
            <Select
              value={viewMode}
              label="View"
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="graph">Graph</MenuItem>
              <MenuItem value="list">List</MenuItem>
              <MenuItem value="grid">Grid</MenuItem>
            </Select>
          </FormControl>

          {/* Filter Type */}
          <FormControl size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="report">Reports</MenuItem>
              <MenuItem value="analysis">Analysis</MenuItem>
              <MenuItem value="entity">Entities</MenuItem>
              <MenuItem value="hypothesis">Hypotheses</MenuItem>
            </Select>
          </FormControl>

          {/* Create Node Button */}
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Node
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
        {/* Nodes List */}
        <Paper sx={{ flex: 2, p: 2, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookOpen size={20} />
            Intelligence Nodes ({filteredNodes.length})
          </Typography>
          
          <Stack spacing={2}>
            {filteredNodes.map((node) => (
              <Paper 
                key={node.id} 
                sx={{ 
                  p: 2, 
                  border: `2px solid ${getClassificationColor(node.metadata.classification)}`,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 }
                }}
                onClick={() => setSelectedNode(node)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getNodeTypeIcon(node.type)}
                      {node.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {node.content.substring(0, 150)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={node.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={node.metadata.classification} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getClassificationColor(node.metadata.classification),
                          color: 'white'
                        }}
                      />
                      {node.tags.slice(0, 3).map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                      {node.tags.length > 3 && (
                        <Chip label={`+${node.tags.length - 3} more`} size="small" variant="outlined" />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Author: {node.metadata.author} • Confidence: {(node.metadata.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small">
                      <Eye size={16} />
                    </IconButton>
                    <IconButton size="small">
                      <Edit size={16} />
                    </IconButton>
                    <IconButton size="small">
                      <Share size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>

        {/* Node Details Panel */}
        <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {selectedNode ? (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getNodeTypeIcon(selectedNode.type)}
                Node Details
              </Typography>
              
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {selectedNode.title}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {selectedNode.content}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Tags:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedNode.tags.map(tag => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Metadata:</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Type:</Typography>
                  <Typography variant="body2" fontWeight="bold">{selectedNode.type}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Classification:</Typography>
                  <Chip 
                    label={selectedNode.metadata.classification} 
                    size="small"
                    sx={{ 
                      backgroundColor: getClassificationColor(selectedNode.metadata.classification),
                      color: 'white'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Confidence:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(selectedNode.metadata.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Author:</Typography>
                  <Typography variant="body2">{selectedNode.metadata.author}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Source:</Typography>
                  <Typography variant="body2">{selectedNode.metadata.source}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Created:</Typography>
                  <Typography variant="body2">
                    {new Date(selectedNode.metadata.created).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Connections ({selectedNode.connections.length}):
                </Typography>
                {selectedNode.connections.length > 0 ? (
                  <Stack spacing={1}>
                    {selectedNode.connections.map(connId => {
                      const connectedNode = nodes.find(n => n.id === connId);
                      return connectedNode ? (
                        <Paper key={connId} sx={{ p: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {connectedNode.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {connectedNode.type}
                          </Typography>
                        </Paper>
                      ) : null;
                    })}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No connections found
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Brain size={64} color="#ccc" />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                Select an intelligence node to view details
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Create Node Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Intelligence Node</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={createForm.title}
              onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            
            <TextField
              label="Content"
              value={createForm.content}
              onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
              multiline
              rows={4}
              fullWidth
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={createForm.type}
                label="Type"
                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as IntelNode['type'] }))}
              >
                <MenuItem value="report">Report</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="entity">Entity</MenuItem>
                <MenuItem value="hypothesis">Hypothesis</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Tags (comma-separated)"
              value={createForm.tags}
              onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
              fullWidth
              placeholder="tag1, tag2, tag3"
            />
            
            <FormControl fullWidth>
              <InputLabel>Classification</InputLabel>
              <Select
                value={createForm.classification}
                label="Classification"
                onChange={(e) => setCreateForm(prev => ({ ...prev, classification: e.target.value as IntelNode['metadata']['classification'] }))}
              >
                <MenuItem value="unclassified">Unclassified</MenuItem>
                <MenuItem value="confidential">Confidential</MenuItem>
                <MenuItem value="secret">Secret</MenuItem>
                <MenuItem value="top-secret">Top Secret</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Source"
              value={createForm.source}
              onChange={(e) => setCreateForm(prev => ({ ...prev, source: e.target.value }))}
              fullWidth
              placeholder="Data source or origin"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNode} variant="contained">Create Node</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NodeWebApplication;
