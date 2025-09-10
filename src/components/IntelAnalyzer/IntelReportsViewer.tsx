/**
 * Intel Reports Viewer Component
 * 
 * Displays intelligence reports with filtering, search, and detailed view capabilities
 * Moved from NodeWeb to be properly integrated into IntelAnalyzer
 */

import React, { useState, useCallback } from 'react';
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
  FileText, 
  Tag,
  Eye,
  Edit,
  Share,
  BookOpen,
  Brain,
  Zap
} from 'lucide-react';

// Centralized Intel system imports
import { useIntelWorkspace } from '../../services/intel/IntelWorkspaceContext';
import { intelReportService } from '../../services/intel/IntelReportService';
import { IntelReportUI, IntelClassification } from '../../types/intel/IntelReportUI';

const IntelReportsViewer: React.FC = () => {
  // State management
  const { reports, loading } = useIntelWorkspace();
  const [selectedReport, setSelectedReport] = useState<IntelReportUI | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detailed'>('list');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Create report form state (mapped to IntelReportUI input)
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    category: 'report' as string,
    tags: '',
    classification: 'UNCLASSIFIED' as IntelClassification
  });

  // Handle create report via intelReportService
  const handleCreateReport = useCallback(() => {
    if (!createForm.title.trim() || !createForm.content.trim()) return;
    (async () => {
      const input = {
        title: createForm.title,
        content: createForm.content,
        category: createForm.category,
        tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        classification: createForm.classification,
        status: 'DRAFT' as const
      };
      try {
        const created = await intelReportService.createReport(input, 'Current User');
        setSelectedReport(created);
        setIsCreateDialogOpen(false);
        setCreateForm({ title: '', content: '', category: 'report', tags: '', classification: 'UNCLASSIFIED' });
      } catch (e) {
        console.error('Failed to create report', e);
      }
    })();
  }, [createForm]);

  // Filter reports based on search and category
  const filteredReports = reports.filter(report => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      report.title.toLowerCase().includes(q) ||
      report.content.toLowerCase().includes(q) ||
      report.tags.some(tag => tag.toLowerCase().includes(q));
    const matchesCategory = filterCategory === 'all' || (report.category || '').toLowerCase() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Icon by category
  const getReportTypeIcon = (category: string) => {
    switch ((category || '').toLowerCase()) {
      case 'report': return <FileText size={16} />;
      case 'analysis': return <Brain size={16} />;
      case 'entity': return <Tag size={16} />;
      case 'hypothesis': return <Zap size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Classification helpers
  const getClassificationColor = (classification: IntelClassification) => {
    switch (classification) {
      case 'UNCLASSIFIED': return '#4CAF50';
      case 'CONFIDENTIAL': return '#FF9800';
      case 'SECRET': return '#FF5722';
      case 'TOP_SECRET': return '#F44336';
      default: return '#2196F3';
    }
  };
  const formatClassification = (classification: IntelClassification) => {
    switch (classification) {
      case 'UNCLASSIFIED': return 'Unclassified';
      case 'CONFIDENTIAL': return 'Confidential';
      case 'SECRET': return 'Secret';
      case 'TOP_SECRET': return 'Top Secret';
      default: return String(classification);
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
                  {(() => {
                    const vals = filteredReports.map(r => (typeof r.confidence === 'number' ? r.confidence : 0));
                    const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
                    return Math.round(avg * 100);
                  })()}%
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
                  {filteredReports.filter(r => (r.sourceIntelIds?.length || 0) > 0).length}
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

          {/* Category Filter */}
          <FormControl size="small">
            <InputLabel sx={{ color: '#888' }}>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => setFilterCategory(e.target.value)}
              sx={{ 
                minWidth: 120,
                backgroundColor: '#1e1e1e',
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
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
                  border: `2px solid ${getClassificationColor(report.classification)}`,
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
                      {getReportTypeIcon(report.category)}
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="#ccc" sx={{ mb: 1 }}>
                      {report.content.substring(0, 150)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={report.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={formatClassification(report.classification)} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getClassificationColor(report.classification),
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
                      Author: {report.author} • Confidence: {typeof report.confidence === 'number' ? Math.round(report.confidence * 100) : '—'}%
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
              {getReportTypeIcon(selectedReport.category)}
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
                <Typography variant="body2" sx={{ color: '#ccc' }}>Category:</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>{selectedReport.category}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Classification:</Typography>
                <Chip 
                  label={formatClassification(selectedReport.classification)} 
                  size="small"
                  sx={{ 
                    backgroundColor: getClassificationColor(selectedReport.classification),
                    color: 'white'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Confidence:</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                  {typeof selectedReport.confidence === 'number' ? Math.round(selectedReport.confidence * 100) : '—'}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Author:</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>{selectedReport.author}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#ccc' }}>Created:</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {selectedReport.createdAt.toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#00ff00' }}>
                Linked Sources ({selectedReport.sourceIntelIds?.length || 0}):
              </Typography>
              {(selectedReport.sourceIntelIds && selectedReport.sourceIntelIds.length > 0) ? (
                <Stack spacing={1}>
                  {selectedReport.sourceIntelIds.map(srcId => (
                    <Paper key={srcId} sx={{ p: 1, bgcolor: '#2a2a2a', border: '1px solid #333' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                        {srcId}
                      </Typography>
                      <Typography variant="caption" color="#888">
                        Source Intel ID
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="#888">
                  No linked sources
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
              <InputLabel sx={{ color: '#888' }}>Category</InputLabel>
              <Select
                value={createForm.category}
                label="Category"
                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value as string }))}
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
                onChange={(e) => setCreateForm(prev => ({ ...prev, classification: e.target.value as IntelClassification }))}
                sx={{
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ff00' },
                }}
              >
                <MenuItem value="UNCLASSIFIED">Unclassified</MenuItem>
                <MenuItem value="CONFIDENTIAL">Confidential</MenuItem>
                <MenuItem value="SECRET">Secret</MenuItem>
                <MenuItem value="TOP_SECRET">Top Secret</MenuItem>
              </Select>
            </FormControl>
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
