/**
 * Intel Transformation Dashboard
 * 
 * Main interface for Intel → IntelReport transformation workflow
 * Combines search, fusion, and report management capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  Alert,
  Fab,
  Badge,
  Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Transform as TransformIcon,
  Search as SearchIcon,
  Assessment as ReportsIcon,
  Timeline as AnalyticsIcon
} from '@mui/icons-material';

import { Intel } from '../../models/Intel/Intel';
import { IntelReportData } from '../../models/IntelReportData';
import { IntelFusionInterface } from './IntelFusionInterface';
import { IntelSearch } from './IntelSearch';
import IntelReportsViewer from './IntelReportsViewer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`intel-tabpanel-${index}`}
      aria-labelledby={`intel-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const IntelTransformationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [intelDatabase, setIntelDatabase] = useState<Intel[]>([]);
  const [filteredIntel, setFilteredIntel] = useState<Intel[]>([]);
  const [generatedReports, setGeneratedReports] = useState<Partial<IntelReportData>[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize intel database (mock data for now)
  useEffect(() => {
    const initializeIntelDatabase = async () => {
      setLoading(true);
      
      // TODO: Replace with actual service calls
      const mockIntelDatabase: Intel[] = [
        {
          id: 'intel_20250712_001',
          source: 'OSINT',
          qualityAssessment: { sourceQuality: 'reliable', visibility: 'public', sensitivity: 'open' },
          reliability: 'B',
          timestamp: Date.now() - 3600000,
          collectedBy: 'osint_scanner_alpha',
          data: { 
            type: 'network_analysis',
            findings: 'Unusual traffic patterns detected on target network',
            confidence: 0.85,
            indicators: ['port_scan', 'data_exfiltration']
          },
          tags: ['network', 'surveillance', 'anomaly'],
          latitude: 40.7128,
          longitude: -74.0060,
          location: 'New York Financial District',
          verified: true,
          hash: 'sha256:a1b2c3d4e5f6...'
        },
        {
          id: 'intel_20250712_002',
          source: 'SIGINT',
          qualityAssessment: { sourceQuality: 'verified', visibility: 'limited', sensitivity: 'careful' },
          reliability: 'A',
          timestamp: Date.now() - 7200000,
          collectedBy: 'sigint_station_bravo',
          data: {
            type: 'communications_intercept',
            frequency: 2.4,
            protocol: 'encrypted',
            metadata: 'High-priority communications detected'
          },
          tags: ['communications', 'encrypted', 'priority'],
          latitude: 40.7589,
          longitude: -73.9851,
          location: 'Manhattan Midtown',
          verified: true,
          hash: 'sha256:b2c3d4e5f6a1...'
        },
        {
          id: 'intel_20250712_003',
          source: 'HUMINT',
          qualityAssessment: { sourceQuality: 'unverified', visibility: 'private', sensitivity: 'protected' },
          reliability: 'C',
          timestamp: Date.now() - 10800000,
          collectedBy: 'asset_charlie',
          data: {
            type: 'observation_report',
            subject: 'Personnel movement patterns',
            details: 'Increased security presence observed at target facility'
          },
          tags: ['observation', 'security', 'facility'],
          latitude: 40.7505,
          longitude: -73.9934,
          location: 'Times Square Area',
          verified: false,
          hash: 'sha256:c3d4e5f6a1b2...'
        },
        {
          id: 'intel_20250712_004',
          source: 'GEOINT',
          qualityAssessment: { sourceQuality: 'reliable', visibility: 'public', sensitivity: 'open' },
          reliability: 'A',
          timestamp: Date.now() - 14400000,
          collectedBy: 'satellite_delta',
          data: {
            type: 'imagery_analysis',
            resolution: '0.5m',
            findings: 'New infrastructure development identified'
          },
          tags: ['imagery', 'infrastructure', 'development'],
          latitude: 40.7282,
          longitude: -74.0776,
          location: 'Jersey City',
          verified: true,
          hash: 'sha256:d4e5f6a1b2c3...'
        },
        {
          id: 'intel_20250712_005',
          source: 'ELINT',
          qualityAssessment: { sourceQuality: 'reliable', visibility: 'limited', sensitivity: 'careful' },
          reliability: 'B',
          timestamp: Date.now() - 18000000,
          collectedBy: 'elint_sensor_echo',
          data: {
            type: 'electronic_signature',
            frequency_range: '1-6_GHz',
            signature_type: 'radar_emissions'
          },
          tags: ['electronic', 'radar', 'emissions'],
          latitude: 40.6892,
          longitude: -74.0445,
          location: 'Brooklyn Heights',
          verified: true,
          hash: 'sha256:e5f6a1b2c3d4...'
        }
      ];

      setIntelDatabase(mockIntelDatabase);
      setFilteredIntel(mockIntelDatabase);
      setLoading(false);
    };

    initializeIntelDatabase();
  }, []);

  // Handle report generation
  const handleReportGenerated = (report: Partial<IntelReportData>) => {
    setGeneratedReports(prev => [report, ...prev]);
    // Switch to reports tab to show the new report
    setActiveTab(2);
  };

  // Handle intel filtering from search component
  const handleIntelFiltered = (filtered: Intel[]) => {
    setFilteredIntel(filtered);
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header: keep compact stats only */}
      <Box sx={{ mb: 3 }}>
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#00ff00' }}>
                  {intelDatabase.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Intel Records
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#2196f3' }}>
                  {filteredIntel.length}
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
                  {generatedReports.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Generated Reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#4caf50' }}>
                  {Math.round((filteredIntel.filter(i => i.verified).length / Math.max(filteredIntel.length, 1)) * 100)}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  Verified Intel
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="intel transformation tabs"
          sx={{
            '& .MuiTab-root': { color: '#888' },
            '& .Mui-selected': { color: '#00ff00' },
            '& .MuiTabs-indicator': { backgroundColor: '#00ff00' }
          }}
        >
          <Tab 
            icon={<SearchIcon />} 
            label="Intel Search" 
            id="intel-tab-0"
            aria-controls="intel-tabpanel-0"
          />
          <Tab 
            icon={<TransformIcon />} 
            label="Intel Fusion" 
            id="intel-tab-1"
            aria-controls="intel-tabpanel-1"
          />
          <Tab 
            icon={
              <Badge badgeContent={generatedReports.length} color="primary">
                <ReportsIcon />
              </Badge>
            } 
            label="Intelligence Reports" 
            id="intel-tab-2"
            aria-controls="intel-tabpanel-2"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Analytics" 
            id="intel-tab-3"
            aria-controls="intel-tabpanel-3"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h5" sx={{ mb: 3, color: '#00ff00' }}>
          🔍 Intel Database Search
        </Typography>
        {loading ? (
          <Alert severity="info">Loading intel database...</Alert>
        ) : (
          <IntelSearch 
            intel={intelDatabase} 
            onFilteredResults={handleIntelFiltered}
          />
        )}
        
        {/* Filtered Results Summary */}
        {!loading && (
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
                📊 Search Results Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Total Records: {filteredIntel.length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Verified: {filteredIntel.filter(i => i.verified).length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    With Location: {filteredIntel.filter(i => i.latitude && i.longitude).length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" sx={{ mb: 3, color: '#00ff00' }}>
          🔬 Intel Fusion Laboratory
        </Typography>
        {loading ? (
          <Alert severity="info">Loading fusion interface...</Alert>
        ) : (
          <IntelFusionInterface onReportGenerated={handleReportGenerated} />
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <IntelReportsViewer />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" sx={{ mb: 3, color: '#00ff00' }}>
          📊 Intelligence Analytics
        </Typography>
        <Alert severity="info">
          Advanced analytics dashboard coming soon. This will include:
          <ul>
            <li>Intel source reliability trends</li>
            <li>Geographic intelligence distribution maps</li>
            <li>Classification level statistics</li>
            <li>Report generation patterns</li>
            <li>Data quality metrics</li>
          </ul>
        </Alert>
      </TabPanel>

      {/* Floating Action Button for Quick Fusion */}
      {activeTab !== 1 && (
        <Tooltip title="Quick Intel Fusion">
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              backgroundColor: '#00ff00',
              color: '#000',
              '&:hover': { backgroundColor: '#00dd00' }
            }}
            onClick={() => setActiveTab(1)}
          >
            <TransformIcon />
          </Fab>
        </Tooltip>
      )}
    </Container>
  );
};
