/**
 * Intel Fusion Interface
 * 
 * Core UI for transforming raw Intel data into structured Intelligence Reports
 * Uses the IntelFusionService to aggregate multiple intel sources
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  PlayArrow as FuseIcon,
  Download as ExportIcon,
  Visibility as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Import our Intel domain models
import { Intel, IntelSource, ClassificationLevel, ReliabilityRating } from '../../models/intelligence/Intel';
import { IntelligenceReportData } from '../../models/intelligence/IntelligenceReport';
import { IntelFusionService } from '../../models/intelligence/IntelFusion';

interface IntelFusionInterfaceProps {
  onReportGenerated?: (report: Partial<IntelligenceReportData>) => void;
}

interface AnalysisContext {
  analystId: string;
  reportTitle: string;
  keyQuestions: string[];
  timeframe: { start: number; end: number };
}

export const IntelFusionInterface: React.FC<IntelFusionInterfaceProps> = ({
  onReportGenerated
}) => {
  // State management
  const [selectedIntel, setSelectedIntel] = useState<Intel[]>([]);
  const [availableIntel, setAvailableIntel] = useState<Intel[]>([]);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext>({
    analystId: 'analyst_001', // TODO: Get from auth context
    reportTitle: '',
    keyQuestions: [],
    timeframe: {
      start: Date.now() - (7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: Date.now()
    }
  });
  const [generatedReport, setGeneratedReport] = useState<Partial<IntelligenceReportData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Load available intel (mock data for now)
  useEffect(() => {
    // TODO: Replace with actual intel service call
    const mockIntel: Intel[] = [
      {
        id: 'intel_001',
        source: 'OSINT',
        classification: 'UNCLASS',
        reliability: 'B',
        timestamp: Date.now() - 3600000,
        collectedBy: 'sensor_alpha',
        data: { type: 'network_scan', findings: 'Suspicious traffic detected' },
        tags: ['network', 'surveillance'],
        latitude: 40.7128,
        longitude: -74.0060,
        location: 'New York, NY',
        verified: true
      },
      {
        id: 'intel_002',
        source: 'SIGINT',
        classification: 'CONFIDENTIAL',
        reliability: 'A',
        timestamp: Date.now() - 7200000,
        collectedBy: 'sensor_beta',
        data: { type: 'communications', content: 'Encrypted communications intercepted' },
        tags: ['communications', 'encrypted'],
        latitude: 40.7589,
        longitude: -73.9851,
        location: 'Manhattan, NY',
        verified: true
      },
      {
        id: 'intel_003',
        source: 'HUMINT',
        classification: 'SECRET',
        reliability: 'C',
        timestamp: Date.now() - 10800000,
        collectedBy: 'asset_gamma',
        data: { type: 'observation', report: 'Unusual activity at target location' },
        tags: ['observation', 'target'],
        latitude: 40.7505,
        longitude: -73.9934,
        location: 'Times Square, NY',
        verified: false
      }
    ];
    setAvailableIntel(mockIntel);
  }, []);

  // Add intel to fusion selection
  const addIntelToSelection = (intel: Intel) => {
    if (!selectedIntel.find(item => item.id === intel.id)) {
      setSelectedIntel([...selectedIntel, intel]);
    }
  };

  // Remove intel from fusion selection
  const removeIntelFromSelection = (intelId: string) => {
    setSelectedIntel(selectedIntel.filter(item => item.id !== intelId));
  };

  // Add key question
  const addKeyQuestion = () => {
    if (newQuestion.trim() && !analysisContext.keyQuestions.includes(newQuestion.trim())) {
      setAnalysisContext({
        ...analysisContext,
        keyQuestions: [...analysisContext.keyQuestions, newQuestion.trim()]
      });
      setNewQuestion('');
    }
  };

  // Remove key question
  const removeKeyQuestion = (index: number) => {
    const updatedQuestions = [...analysisContext.keyQuestions];
    updatedQuestions.splice(index, 1);
    setAnalysisContext({
      ...analysisContext,
      keyQuestions: updatedQuestions
    });
  };

  // Generate intelligence report using IntelFusion
  const generateReport = async () => {
    if (selectedIntel.length === 0) {
      setError('Please select at least one intel record to analyze');
      return;
    }

    if (!analysisContext.reportTitle.trim()) {
      setError('Please provide a report title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const report = IntelFusionService.fuseIntelIntoReport(selectedIntel, analysisContext);
      setGeneratedReport(report);
      onReportGenerated?.(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Get reliability color
  const getReliabilityColor = (reliability: ReliabilityRating): string => {
    const colors = {
      'A': '#4caf50', 'B': '#8bc34a', 'C': '#ffeb3b',
      'D': '#ff9800', 'E': '#f44336', 'F': '#9e9e9e', 'X': '#e91e63'
    };
    return colors[reliability] || '#9e9e9e';
  };

  // Get classification color
  const getClassificationColor = (classification: ClassificationLevel): string => {
    const colors = {
      'UNCLASS': '#4caf50',
      'CONFIDENTIAL': '#2196f3',
      'SECRET': '#ff9800',
      'TOP_SECRET': '#f44336'
    };
    return colors[classification];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#00ff00', fontFamily: 'monospace' }}>
        🔬 Intel Fusion Laboratory
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#888' }}>
        Transform raw intelligence data into comprehensive intelligence reports
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Intel Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#00ff00' }}>
                📡 Available Intelligence
              </Typography>
              
              {availableIntel.length === 0 ? (
                <Alert severity="info">No intelligence data available</Alert>
              ) : (
                <List>
                  {availableIntel.map((intel) => (
                    <ListItem key={intel.id} sx={{ mb: 1, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={intel.source} 
                              size="small" 
                              sx={{ backgroundColor: '#333', color: '#fff' }}
                            />
                            <Chip 
                              label={intel.reliability} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getReliabilityColor(intel.reliability),
                                color: '#000'
                              }}
                            />
                            <Chip 
                              label={intel.classification} 
                              size="small" 
                              sx={{ 
                                backgroundColor: getClassificationColor(intel.classification),
                                color: '#fff'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                              {intel.location} • {new Date(intel.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                              {intel.tags.join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          onClick={() => addIntelToSelection(intel)}
                          disabled={selectedIntel.some(item => item.id === intel.id)}
                          sx={{ color: '#00ff00' }}
                        >
                          <AddIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Selected Intel for Fusion */}
          <Card sx={{ mt: 2, backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#00ff00' }}>
                🎯 Selected for Fusion ({selectedIntel.length})
              </Typography>
              
              {selectedIntel.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Add intel records to begin fusion analysis
                </Typography>
              ) : (
                <List>
                  {selectedIntel.map((intel) => (
                    <ListItem key={intel.id} sx={{ backgroundColor: '#2a2a2a', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={`${intel.source} • ${intel.reliability} • ${intel.classification}`}
                        secondary={intel.location}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          onClick={() => removeIntelFromSelection(intel.id)}
                          sx={{ color: '#ff4444' }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Analysis Configuration */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#00ff00' }}>
                ⚙️ Analysis Configuration
              </Typography>

              {/* Report Title */}
              <TextField
                fullWidth
                label="Report Title"
                value={analysisContext.reportTitle}
                onChange={(e) => setAnalysisContext({
                  ...analysisContext,
                  reportTitle: e.target.value
                })}
                sx={{ mb: 2 }}
                variant="outlined"
              />

              {/* Key Questions */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#ccc' }}>
                Priority Intelligence Requirements (PIRs)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter key question to investigate..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyQuestion()}
                />
                <Button variant="outlined" onClick={addKeyQuestion}>
                  Add
                </Button>
              </Box>

              {analysisContext.keyQuestions.map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  onDelete={() => removeKeyQuestion(index)}
                  sx={{ mr: 1, mb: 1, backgroundColor: '#333' }}
                />
              ))}

              {/* Timeframe */}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#ccc' }}>
                Analysis Timeframe
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="datetime-local"
                    value={new Date(analysisContext.timeframe.start).toISOString().slice(0, 16)}
                    onChange={(e) => setAnalysisContext({
                      ...analysisContext,
                      timeframe: {
                        ...analysisContext.timeframe,
                        start: new Date(e.target.value).getTime()
                      }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="datetime-local"
                    value={new Date(analysisContext.timeframe.end).toISOString().slice(0, 16)}
                    onChange={(e) => setAnalysisContext({
                      ...analysisContext,
                      timeframe: {
                        ...analysisContext.timeframe,
                        end: new Date(e.target.value).getTime()
                      }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>

            <CardActions>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <FuseIcon />}
                onClick={generateReport}
                disabled={loading || selectedIntel.length === 0}
                sx={{ 
                  backgroundColor: '#00ff00', 
                  color: '#000',
                  '&:hover': { backgroundColor: '#00dd00' }
                }}
                fullWidth
              >
                {loading ? 'Generating Report...' : 'Fuse Intel into Report'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Generated Report Preview */}
      {generatedReport && (
        <Card sx={{ mt: 3, backgroundColor: '#1e1e1e', border: '1px solid #00ff00' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#00ff00' }}>
                📋 Generated Intelligence Report
              </Typography>
              <Box>
                <Button
                  startIcon={<PreviewIcon />}
                  onClick={() => setPreviewDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Full Preview
                </Button>
                <Button
                  startIcon={<ExportIcon />}
                  variant="outlined"
                  onClick={() => {
                    // TODO: Implement export functionality
                    console.log('Export report:', generatedReport);
                  }}
                >
                  Export
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#ccc' }}>Title:</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{generatedReport.title}</Typography>

                <Typography variant="subtitle2" sx={{ color: '#ccc' }}>Classification:</Typography>
                <Chip 
                  label={generatedReport.classification?.level} 
                  sx={{ 
                    backgroundColor: getClassificationColor(generatedReport.classification?.level || 'UNCLASS'),
                    color: '#fff',
                    mb: 1
                  }}
                />

                <Typography variant="subtitle2" sx={{ color: '#ccc' }}>Confidence:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={generatedReport.confidence || 0} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2">{generatedReport.confidence}%</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#ccc' }}>Executive Summary:</Typography>
                <Typography variant="body2" sx={{ mb: 1, maxHeight: 100, overflow: 'auto' }}>
                  {generatedReport.executiveSummary}
                </Typography>

                <Typography variant="subtitle2" sx={{ color: '#ccc' }}>Key Findings:</Typography>
                <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                  {generatedReport.keyFindings?.map((finding, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      • {finding}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Full Report Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Intelligence Report Preview</DialogTitle>
        <DialogContent>
          {generatedReport && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>{generatedReport.title}</Typography>
              
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Executive Summary</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{generatedReport.executiveSummary}</Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Key Findings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {generatedReport.keyFindings?.map((finding, index) => (
                    <Typography key={index} sx={{ mb: 1 }}>• {finding}</Typography>
                  ))}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Analysis & Assessment</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {generatedReport.analysisAndAssessment}
                  </pre>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Recommendations</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {generatedReport.recommendations?.map((rec, index) => (
                    <Typography key={index} sx={{ mb: 1 }}>• {rec}</Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
