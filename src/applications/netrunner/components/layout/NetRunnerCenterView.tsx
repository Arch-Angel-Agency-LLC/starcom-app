/**
 * NetRunner Center View - Main Work Area
 * 
 * Clean main workspace for NetRunner operations.
 * Ready for real OSINT tool implementation.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  Search,
  Target,
  Shield,
  Activity
} from 'lucide-react';

interface NetRunnerCenterViewProps {
  width: string;
  height: string;
}

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
      id={`netrunner-tabpanel-${index}`}
      aria-labelledby={`netrunner-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 0.75, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NetRunnerCenterView: React.FC<NetRunnerCenterViewProps> = ({
  width,
  height
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleScan = () => {
    if (!target.trim()) return;
    
    setIsScanning(true);
    // TODO: Implement real scanning logic
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Aldrich', 'Courier New', monospace"
      }}
    >
      {/* Tab Headers */}
      <Box
        sx={{
          borderBottom: '1px solid #00f5ff',
          backgroundColor: '#0a0a0a'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: '32px',
            '& .MuiTab-root': {
              color: '#aaaaaa',
              fontSize: '0.7rem',
              minHeight: '32px',
              textTransform: 'uppercase',
              fontFamily: "'Aldrich', monospace",
              letterSpacing: '0.05em',
              py: 0.5,
              px: 1,
              '&.Mui-selected': {
                color: '#00f5ff'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00f5ff',
              height: 1
            }
          }}
        >
          <Tab icon={<Search size={14} />} label="OSINT" iconPosition="start" sx={{ gap: 0.5 }} />
          <Tab icon={<Target size={14} />} label="SCANNER" iconPosition="start" sx={{ gap: 0.5 }} />
          <Tab icon={<Shield size={14} />} label="INTEL" iconPosition="start" sx={{ gap: 0.5 }} />
          <Tab icon={<Activity size={14} />} label="ANALYSIS" iconPosition="start" sx={{ gap: 0.5 }} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* OSINT Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
            <Typography variant="h5" sx={{ 
              color: '#00f5ff',
              fontFamily: "'Aldrich', monospace",
              fontSize: '1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              mb: 0.5
            }}>
              OSINT_SCANNER
            </Typography>
            
            <Card sx={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #00f5ff',
              borderRadius: 0
            }}>
              <CardContent sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-end' }}>
                  <TextField
                    label="TARGET"
                    placeholder="domain.com | 192.168.1.1 | identifier"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    variant="outlined"
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.75rem',
                        borderRadius: 0,
                        '& fieldset': { borderColor: '#333333' },
                        '&:hover fieldset': { borderColor: '#555555' },
                        '&.Mui-focused fieldset': { borderColor: '#00f5ff' }
                      },
                      '& .MuiInputLabel-root': { 
                        color: '#aaaaaa',
                        fontFamily: "'Aldrich', monospace",
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleScan}
                    disabled={!target.trim() || isScanning}
                    size="small"
                    sx={{
                      backgroundColor: '#00f5ff',
                      color: '#000000',
                      fontFamily: "'Aldrich', monospace",
                      fontSize: '0.7rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderRadius: 0,
                      px: 1.5,
                      py: 0.75,
                      '&:hover': { backgroundColor: '#00d4e6' },
                      '&:disabled': { backgroundColor: '#333333' }
                    }}
                  >
                    {isScanning ? 'SCANNING...' : 'SCAN'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {isScanning && (
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: '#0a0a0a', 
                  color: '#00f5ff',
                  border: '1px solid #00f5ff',
                  borderRadius: 0,
                  fontFamily: "'Aldrich', monospace",
                  fontSize: '0.7rem',
                  '& .MuiAlert-icon': { color: '#00f5ff' }
                }}
              >
                SCANNING_IN_PROGRESS... PLACEHOLDER_FOR_REAL_FUNCTIONALITY
              </Alert>
            )}

            <Box sx={{ 
              flex: 1, 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #333333', 
              borderRadius: 0,
              p: 0.75 
            }}>
              <Typography variant="body2" sx={{ 
                color: '#aaaaaa',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.7rem'
              }}>
                RESULTS_DISPLAY_AREA :: AWAITING_IMPLEMENTATION
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Scanner Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h5" sx={{ 
            color: '#00f5ff',
            fontFamily: "'Aldrich', monospace",
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 1
          }}>
            PORT_SCANNER
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#aaaaaa',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.7rem'
          }}>
            PORT_SCANNING_MODULE :: AWAITING_IMPLEMENTATION
          </Typography>
        </TabPanel>

        {/* Intel Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" sx={{ 
            color: '#00f5ff',
            fontFamily: "'Aldrich', monospace",
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 1
          }}>
            INTEL_DATABASE
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#aaaaaa',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.7rem'
          }}>
            INTEL_CORRELATION_MODULE :: AWAITING_IMPLEMENTATION
          </Typography>
        </TabPanel>

        {/* Analysis Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={{ 
            color: '#00f5ff',
            fontFamily: "'Aldrich', monospace",
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 1
          }}>
            DATA_ANALYSIS
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#aaaaaa',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.7rem'
          }}>
            ANALYSIS_TOOLS_MODULE :: AWAITING_IMPLEMENTATION
          </Typography>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default NetRunnerCenterView;
