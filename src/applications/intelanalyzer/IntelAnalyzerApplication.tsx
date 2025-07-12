import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { FileText, BarChart3, Map, TrendingUp } from 'lucide-react';

// Types
interface IntelReport {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED';
  confidence: number;
  sources: string[];
}

interface AnalysisMetric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

interface IntelAnalyzerTab {
  id: string;
  label: string;
  icon: React.ComponentType;
  component: React.ComponentType;
}

/**
 * Consolidated IntelAnalyzer Application
 * 
 * Combines:
 * - Intelligence report management
 * - Analysis tools and workflows
 * - Data visualization and mapping
 * - Collaborative analysis features
 * - Report generation and export
 */
const IntelAnalyzerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(null);

  // Mock data for demonstration
  React.useEffect(() => {
    const mockReports: IntelReport[] = [
      {
        id: '1',
        title: 'Cyber Threat Intelligence Report #2024-001',
        content: 'Comprehensive analysis of emerging cyber threats...',
        author: 'Agent Smith',
        category: 'CYBER',
        tags: ['malware', 'APT', 'critical'],
        createdAt: new Date(),
        updatedAt: new Date(),
        classification: 'CONFIDENTIAL',
        status: 'APPROVED',
        confidence: 95,
        sources: ['OSINT', 'Technical Analysis', 'Human Intelligence']
      },
      {
        id: '2',
        title: 'Geopolitical Analysis: Regional Stability',
        content: 'Analysis of regional political stability factors...',
        author: 'Analyst Jones',
        category: 'GEOINT',
        tags: ['geopolitical', 'stability', 'monitoring'],
        latitude: 40.7128,
        longitude: -74.0060,
        createdAt: new Date(),
        updatedAt: new Date(),
        classification: 'SECRET',
        status: 'REVIEWED',
        confidence: 87,
        sources: ['Satellite Imagery', 'Communications Intelligence', 'Open Sources']
      }
    ];
    setReports(mockReports);
  }, []);

  // Reports Dashboard Panel
  const ReportsPanel: React.FC = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#00ff00', fontFamily: 'monospace' }}>
        📊 Intelligence Reports Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                Active Intelligence Reports
              </Typography>
              
              {reports.map((report) => (
                <Box 
                  key={report.id} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0, 255, 0, 0.05)' }
                  }}
                  onClick={() => setSelectedReport(report)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: '#00ff00' }}>
                      {report.title}
                    </Typography>
                    <Chip 
                      label={report.classification} 
                      size="small" 
                      sx={{ 
                        bgcolor: report.classification === 'TOP_SECRET' ? '#ff0000' : 
                               report.classification === 'SECRET' ? '#ff8800' :
                               report.classification === 'CONFIDENTIAL' ? '#ffff00' : '#00ff00',
                        color: '#000',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    {report.content.substring(0, 100)}...
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {report.tags.map((tag) => (
                      <Chip 
                        key={tag} 
                        label={tag} 
                        size="small" 
                        variant="outlined"
                        sx={{ color: '#888', borderColor: '#888' }}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Author: {report.author} | Status: {report.status} | Confidence: {report.confidence}%
                  </Typography>
                </Box>
              ))}
              
              <Button 
                variant="outlined" 
                sx={{ mt: 2, color: '#00ff00', borderColor: '#00ff00' }}
                onClick={() => {/* Add new report logic */}}
              >
                + Create New Report
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                Intelligence Summary
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}>Total Reports: {reports.length}</div>
                <div style={{ marginBottom: '8px' }}>Pending Review: {reports.filter(r => r.status === 'SUBMITTED').length}</div>
                <div style={{ marginBottom: '8px' }}>Approved: {reports.filter(r => r.status === 'APPROVED').length}</div>
                <div style={{ marginBottom: '8px' }}>Classification Levels: {new Set(reports.map(r => r.classification)).size}</div>
              </Box>
            </CardContent>
          </Card>
          
          {selectedReport && (
            <Card sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                  Report Details
                </Typography>
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '8px' }}>ID: {selectedReport.id}</div>
                  <div style={{ marginBottom: '8px' }}>Category: {selectedReport.category}</div>
                  <div style={{ marginBottom: '8px' }}>Sources: {selectedReport.sources.length}</div>
                  <div style={{ marginBottom: '8px' }}>Created: {selectedReport.createdAt.toLocaleDateString()}</div>
                  {selectedReport.latitude && selectedReport.longitude && (
                    <div style={{ marginBottom: '8px' }}>
                      Location: {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
                    </div>
                  )}
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    sx={{ color: '#00ff00', borderColor: '#00ff00' }}
                    onClick={() => {/* Add analyze functionality */}}
                  >
                    Analyze Report
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    sx={{ color: '#00ff00', borderColor: '#00ff00' }}
                    onClick={() => {/* Add edit functionality */}}
                  >
                    Edit Report
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  // Analysis Tools Panel
  const AnalysisPanel: React.FC = () => {
    const metrics: AnalysisMetric[] = [
      { label: 'Threat Level', value: 75, trend: 'up', unit: '%' },
      { label: 'Source Reliability', value: 92, trend: 'stable', unit: '%' },
      { label: 'Data Completeness', value: 68, trend: 'up', unit: '%' },
      { label: 'Confidence Score', value: 87, trend: 'down', unit: '%' }
    ];

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#00ff00', fontFamily: 'monospace' }}>
          🔬 Intelligence Analysis Tools
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                  Analysis Metrics
                </Typography>
                
                {metrics.map((metric) => (
                  <Box key={metric.label} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        {metric.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#00ff00' }}>
                          {metric.value}{metric.unit}
                        </Typography>
                        <TrendingUp 
                          size={16} 
                          style={{ 
                            color: metric.trend === 'up' ? '#00ff00' : 
                                   metric.trend === 'down' ? '#ff0000' : '#888',
                            transform: metric.trend === 'down' ? 'rotate(180deg)' : 'none'
                          }} 
                        />
                      </Box>
                    </Box>
                    <Box sx={{ 
                      width: '100%', 
                      height: '8px', 
                      bgcolor: 'rgba(0, 0, 0, 0.3)', 
                      borderRadius: '4px' 
                    }}>
                      <Box sx={{ 
                        width: `${metric.value}%`, 
                        height: '100%', 
                        bgcolor: '#00ff00', 
                        borderRadius: '4px' 
                      }} />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                  Analysis Tools
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    sx={{ color: '#00ff00', borderColor: '#00ff00', justifyContent: 'flex-start' }}
                  >
                    📊 Pattern Recognition Analysis
                  </Button>
                  <Button 
                    variant="outlined" 
                    sx={{ color: '#00ff00', borderColor: '#00ff00', justifyContent: 'flex-start' }}
                  >
                    🎯 Threat Assessment Matrix
                  </Button>
                  <Button 
                    variant="outlined" 
                    sx={{ color: '#00ff00', borderColor: '#00ff00', justifyContent: 'flex-start' }}
                  >
                    🔗 Link Analysis & Correlation
                  </Button>
                  <Button 
                    variant="outlined" 
                    sx={{ color: '#00ff00', borderColor: '#00ff00', justifyContent: 'flex-start' }}
                  >
                    📈 Trend Prediction Model
                  </Button>
                  <Button 
                    variant="outlined" 
                    sx={{ color: '#00ff00', borderColor: '#00ff00', justifyContent: 'flex-start' }}
                  >
                    🌐 Geographic Intelligence Mapping
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Visualization Panel
  const VisualizationPanel: React.FC = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#00ff00', fontFamily: 'monospace' }}>
        📈 Intelligence Visualization
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                Intelligence Data Visualization
              </Typography>
              
              <Box sx={{ 
                height: '400px', 
                bgcolor: 'rgba(0, 0, 0, 0.7)', 
                border: '1px solid #00ff00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace'
              }}>
                <Typography sx={{ color: '#888' }}>
                  [Interactive visualization charts and maps will be implemented here]
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Define tabs for the consolidated IntelAnalyzer interface
  const tabs: IntelAnalyzerTab[] = [
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      component: ReportsPanel
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: BarChart3,
      component: AnalysisPanel
    },
    {
      id: 'visualization',
      label: 'Visualization',
      icon: Map,
      component: VisualizationPanel
    }
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const ActiveComponent = tabs[activeTab]?.component || ReportsPanel;

  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: '#000', 
      color: '#00ff00',
      overflow: 'hidden'
    }}>
      {/* Header */}


      {/* Tab Navigation */}
      <Box sx={{ borderBottom: '1px solid #00ff00' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#888',
              fontFamily: 'monospace',
              '&.Mui-selected': {
                color: '#00ff00'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00ff00'
            }
          }}
        >
          {tabs.map((tab, index) => {
            const IconComponent = tab.icon;
            return (
              <Tab 
                key={tab.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconComponent size={16} />
                    {tab.label}
                  </Box>
                }
                value={index}
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}>
        <ActiveComponent />
      </Box>
    </Box>
  );
};

export default IntelAnalyzerApp;
