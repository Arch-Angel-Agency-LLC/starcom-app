/**
 * Intel Reports Viewer Component
 * 
 * Displays intelligence reports with filtering, search, and detailed view capabilities
 * Moved from NodeWeb to be properly integrated into IntelAnalyzer
 */

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
  Divider,
  Card,
  CardContent
} from '@mui/material';
import Grid from '@mui/material/Grid';
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
  Zap,
  TrendingUp,
  Shield,
  Users
} from 'lucide-react';

// Intelligence Report Interface
interface IntelReport {
  id: string;
  title: string;
  content: string;
  type: 'report' | 'analysis' | 'entity' | 'connection' | 'hypothesis';
  tags: string[];
  connections: string[]; // IDs of connected reports
  metadata: {
    author: string;
    created: string;
    updated: string;
  classification: 'unclassified' | 'confidential' | 'secret' | 'top-secret'; // legacy-only; UI will display neutral messaging
    confidence: number;
    source: string;
  };
}

const IntelReportsViewer: React.FC = () => {
  // State management
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detailed'>('list');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Create report form state
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'report' as IntelReport['type'],
    tags: '',
    classification: 'unclassified' as IntelReport['metadata']['classification'],
    source: ''
  });

  // Load intelligence reports
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual data loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock intelligence reports
        const mockReports: IntelReport[] = [
          {
            id: '1',
            title: 'Cyber Threat Analysis - Q4 2024',
            content: 'Comprehensive analysis of emerging cyber threats targeting critical infrastructure. This report consolidates intelligence from multiple sources to provide a holistic view of the current threat landscape...',
            type: 'analysis',
            tags: ['cyber-security', 'threats', 'infrastructure'],
            connections: ['2', '3'],
            metadata: {
              author: 'Analyst Smith',
              created: '2024-12-01T10:00:00Z',
              updated: '2024-12-01T10:00:00Z',
              classification: 'confidential',
              confidence: 90,
              source: 'Internal Analysis'
            }
          },
          {
            id: '2',
            title: 'APT Group Activities',
            content: 'Documentation of recent APT group activities and TTPs (Tactics, Techniques, and Procedures). Analysis indicates increased sophistication in attack vectors and potential state-sponsored coordination...',
            type: 'report',
            tags: ['apt', 'tactics', 'malware'],
            connections: ['1', '4'],
            metadata: {
              author: 'Intel Team',
              created: '2024-11-28T14:30:00Z',
              updated: '2024-11-30T09:15:00Z',
              classification: 'secret',
              confidence: 85,
              source: 'Multi-source Intelligence'
            }
          },
          {
            id: '3',
            title: 'Critical Infrastructure Entity',
            content: 'Power grid facility - potential target of interest. Located in key metropolitan area with high strategic value. Security assessment reveals multiple vulnerabilities that could be exploited...',
            type: 'entity',
            tags: ['infrastructure', 'power-grid', 'target'],
            connections: ['1'],
            metadata: {
              author: 'Geographic Intel',
              created: '2024-11-25T11:20:00Z',
              updated: '2024-11-25T11:20:00Z',
              classification: 'confidential',
              confidence: 95,
              source: 'Open Source Intelligence'
            }
          },
          {
            id: '4',
            title: 'Network Intrusion Hypothesis',
            content: 'Working hypothesis about coordinated network intrusion campaign. Evidence suggests systematic approach targeting similar infrastructure across multiple geographic regions...',
            type: 'hypothesis',
            tags: ['hypothesis', 'intrusion', 'coordination'],
            connections: ['2'],
            metadata: {
              author: 'Lead Analyst',
              created: '2024-12-02T16:45:00Z',
              updated: '2024-12-02T16:45:00Z',
              classification: 'confidential',
              confidence: 70,
              source: 'Analytical Assessment'
            }
          },
          {
            id: '5',
            title: 'Economic Intelligence Brief',
            content: 'Analysis of economic indicators and market movements that may impact security operations. Focus on cryptocurrency flows and sanctions evasion techniques...',
            type: 'analysis',
            tags: ['economic', 'cryptocurrency', 'sanctions'],
            connections: [],
            metadata: {
              author: 'Economic Analysis Unit',
              created: '2024-12-03T08:30:00Z',
              updated: '2024-12-03T08:30:00Z',
              classification: 'unclassified',
              confidence: 75,
              source: 'Financial Intelligence'
            }
          }
        ];

        setReports(mockReports);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Handle create report
  const handleCreateReport = useCallback(() => {
    if (!createForm.title.trim() || !createForm.content.trim()) return;

    const newReport: IntelReport = {
      id: Date.now().toString(),
      title: createForm.title,
      content: createForm.content,
      type: createForm.type,
      tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      connections: [],
      metadata: {
        author: 'Current User',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        classification: createForm.classification,
        confidence: 80,
        source: createForm.source || 'Manual Entry'
      }
    };

    setReports(prev => [...prev, newReport]);
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

  // Filter reports based on search and type
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get report type icon
  const getReportTypeIcon = (type: IntelReport['type']) => {
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
        <CircularProgress sx={{ color: '#00ff00' }} />
        <Typography variant="h6" sx={{ ml: 2, color: '#00ff00' }}>Loading Intelligence Reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#00ff00', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={24} />
          Intelligence Reports Database
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#00ff00' }}>
                  {reports.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Total Reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#2196f3' }}>
                  {filteredReports.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Filtered Results
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#ff9800' }}>
                  {Math.round((filteredReports.reduce((sum, r) => sum + r.metadata.confidence, 0) / Math.max(filteredReports.length, 1)))}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Avg Confidence
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#4caf50' }}>
                  {filteredReports.filter(r => r.connections.length > 0).length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Connected Reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8 }} />
            }}
            sx={{ 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1e1e1e',
                color: '#fff',
                '& fieldset': { borderColor: '#333' },
                '&:hover fieldset': { borderColor: '#00ff00' },
                '&.Mui-focused fieldset': { borderColor: '#00ff00' },
              }
            }}
          />

          {/* View Mode */}
          <FormControl size="small">
            <InputLabel sx={{ color: '#888' }}>View</InputLabel>
            <Select
              value={viewMode}
              label="View"
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              sx={{ 
                minWidth: 100,
                backgroundColor: '#1e1e1e',
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
              }}
            >
              <MenuItem value="list">List</MenuItem>
              <MenuItem value="grid">Grid</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>

          {/* Filter Type */}
          <FormControl size="small">
            <InputLabel sx={{ color: '#888' }}>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ 
                minWidth: 120,
                backgroundColor: '#1e1e1e',
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="report">Reports</MenuItem>
              <MenuItem value="analysis">Analysis</MenuItem>
              <MenuItem value="entity">Entities</MenuItem>
              <MenuItem value="hypothesis">Hypotheses</MenuItem>
            </Select>
          </FormControl>

          {/* Create Report Button */}
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{
              backgroundColor: '#00ff00',
              color: '#000',
              '&:hover': { backgroundColor: '#00dd00' }
            }}
          >
            Create Report
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 350px)' }}>
        {/* Reports List */}
        <Paper sx={{ 
          flex: selectedReport ? 2 : 1, 
          p: 2, 
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          border: '1px solid #333'
        }}>
          <Typography variant="h6" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: '#00ff00'
          }}>
            <BookOpen size={20} />
            Intelligence Reports ({filteredReports.length})
          </Typography>
          
          <Stack spacing={2}>
            {filteredReports.map((report) => (
              <Paper 
                key={report.id} 
                sx={{ 
                  p: 2, 
                  border: `2px solid ${getClassificationColor(report.metadata.classification)}`,
                  cursor: 'pointer',
                  backgroundColor: selectedReport?.id === report.id ? '#2e2e2e' : '#1a1a1a',
                  '&:hover': { 
                    boxShadow: 3,
                    backgroundColor: '#2a2a2a'
                  }
                }}
                onClick={() => setSelectedReport(report)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#fff'
                    }}>
                      {getReportTypeIcon(report.type)}
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="#ccc" sx={{ mb: 1 }}>
                      {report.content.substring(0, 150)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={report.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={report.metadata.classification} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getClassificationColor(report.metadata.classification),
                          color: 'white'
                        }}
                      />
                      {report.tags.slice(0, 3).map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                      {report.tags.length > 3 && (
                        <Chip label={`+${report.tags.length - 3} more`} size="small" variant="outlined" />
                      )}
                    </Box>

                    <Typography variant="caption" color="#888">
                      Author: {report.metadata.author} • Confidence: {report.metadata.confidence}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" sx={{ color: '#888' }}>
                      <Eye size={16} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#888' }}>
                      <Edit size={16} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#888' }}>
                      <Share size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>

        {/* Report Details Panel */}
        {selectedReport && (
          <Paper sx={{ 
            flex: 1, 
            p: 2, 
            overflow: 'auto',
            backgroundColor: '#1e1e1e',
            border: '1px solid #333'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#00ff00'
            }}>
              {getReportTypeIcon(selectedReport.type)}
              Report Details
            </Typography>
            
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#fff' }}>
              {selectedReport.title}
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ color: '#ccc' }}>
              {selectedReport.content}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#00ff00' }}>Tags:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedReport.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </Box>
            
            <Divider sx={{ my: 2, borderColor: '#333' }} />
            
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#00ff00' }}>Metadata:</Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Type:</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>{selectedReport.type}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Classification:</Typography>
                <Chip 
                  label={selectedReport.metadata.classification} 
                  size="small"
                  sx={{ 
                    backgroundColor: getClassificationColor(selectedReport.metadata.classification),
                    color: 'white'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Confidence:</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                  {selectedReport.metadata.confidence}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Author:</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>{selectedReport.metadata.author}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Source:</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>{selectedReport.metadata.source}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Created:</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {new Date(selectedReport.metadata.created).toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#00ff00' }}>
                Connections ({selectedReport.connections.length}):
              </Typography>
              {selectedReport.connections.length > 0 ? (
                <Stack spacing={1}>
                  {selectedReport.connections.map(connId => {
                    const connectedReport = reports.find(r => r.id === connId);
                    return connectedReport ? (
                      <Paper key={connId} sx={{ p: 1, bgcolor: '#2a2a2a', border: '1px solid #333' }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                          {connectedReport.title}
                        </Typography>
                        <Typography variant="caption" color="#888">
                          {connectedReport.type}
                        </Typography>
                      </Paper>
                    ) : null;
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="#888">
                  No connections found
                </Typography>
              )}
            </Box>
          </Paper>
        )}
      </Box>

      {/* Create Report Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: '#fff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#00ff00' }}>Create New Intelligence Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={createForm.title}
              onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff00' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff00' },
                },
                '& .MuiInputLabel-root': { color: '#888' }
              }}
            />
            
            <TextField
              label="Content"
              value={createForm.content}
              onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
              multiline
              rows={4}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff00' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff00' },
                },
                '& .MuiInputLabel-root': { color: '#888' }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#888' }}>Type</InputLabel>
              <Select
                value={createForm.type}
                label="Type"
                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as IntelReport['type'] }))}
                sx={{
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                }}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff00' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff00' },
                },
                '& .MuiInputLabel-root': { color: '#888' }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#888' }}>Classification</InputLabel>
              <Select
                value={createForm.classification}
                label="Classification"
                onChange={(e) => setCreateForm(prev => ({ ...prev, classification: e.target.value as IntelReport['metadata']['classification'] }))}
                sx={{
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                }}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#00ff00' },
                  '&.Mui-focused fieldset': { borderColor: '#00ff00' },
                },
                '& .MuiInputLabel-root': { color: '#888' }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)} sx={{ color: '#888' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateReport} 
            variant="contained"
            sx={{
              backgroundColor: '#00ff00',
              color: '#000',
              '&:hover': { backgroundColor: '#00dd00' }
            }}
          >
            Create Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntelReportsViewer;
