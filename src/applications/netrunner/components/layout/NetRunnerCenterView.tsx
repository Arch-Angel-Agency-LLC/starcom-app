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
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  Target,
  Shield,
  Activity,
  Code,
  Globe,
  ChevronDown
} from 'lucide-react';
import { WebsiteScannerService, type ScanResult } from '../../services/WebsiteScanner';

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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const websiteScanner = new WebsiteScannerService();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleScan = async () => {
    if (!target.trim()) return;
    
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setScanProgress(0);
    setScanStatus('Initializing scan...');

    try {
      const result = await websiteScanner.scanWebsite(
        target,
        (progress, status) => {
          setScanProgress(progress);
          setScanStatus(status);
        }
      );
      
      setScanResult(result);
      setScanStatus('Scan completed successfully');
    } catch (err) {
      console.error('Scan failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setScanStatus('Scan failed');
    } finally {
      setIsScanning(false);
    }
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

            {/* Scanning Progress */}
            {isScanning && (
              <Card sx={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #00f5ff',
                borderRadius: 0,
                mb: 1
              }}>
                <CardContent sx={{ p: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Activity size={16} style={{ color: '#00f5ff' }} />
                    <Typography sx={{ 
                      color: '#00f5ff',
                      fontFamily: "'Aldrich', monospace",
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Scanning Progress: {scanProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={scanProgress}
                    sx={{
                      height: 4,
                      borderRadius: 0,
                      backgroundColor: '#333333',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00f5ff'
                      }
                    }}
                  />
                  <Typography sx={{ 
                    color: '#aaaaaa',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.65rem',
                    mt: 0.5
                  }}>
                    {scanStatus}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  backgroundColor: '#1a0000', 
                  color: '#ff4444',
                  border: '1px solid #ff4444',
                  borderRadius: 0,
                  fontFamily: "'Aldrich', monospace",
                  fontSize: '0.7rem',
                  mb: 1,
                  '& .MuiAlert-icon': { color: '#ff4444' }
                }}
              >
                SCAN_ERROR: {error}
              </Alert>
            )}

            {/* Results Display Area */}
            <Box sx={{ 
              flex: 1, 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #333333', 
              borderRadius: 0,
              p: 0.75,
              overflow: 'auto'
            }}>
              {scanResult ? (
                <Box>
                  {/* Results Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Globe size={16} style={{ color: '#00f5ff' }} />
                    <Typography sx={{ 
                      color: '#00f5ff',
                      fontFamily: "'Aldrich', monospace",
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Scan Results: {scanResult.url}
                    </Typography>
                  </Box>

                  {/* Source Code Section */}
                  <Accordion 
                    defaultExpanded
                    sx={{
                      backgroundColor: 'rgba(0, 245, 255, 0.05)',
                      border: '1px solid rgba(0, 245, 255, 0.2)',
                      borderRadius: 0,
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ChevronDown size={16} style={{ color: '#00f5ff' }} />}
                      sx={{ 
                        backgroundColor: 'rgba(0, 245, 255, 0.1)',
                        minHeight: 'auto',
                        '& .MuiAccordionSummary-content': { 
                          margin: '8px 0',
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Code size={14} style={{ color: '#00f5ff' }} />
                        <Typography sx={{ 
                          color: '#ffffff',
                          fontFamily: "'Aldrich', monospace",
                          fontSize: '0.7rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          Website Source Code ({(scanResult.sourceCode.length / 1024).toFixed(2)} KB)
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1 }}>
                      <Box sx={{
                        backgroundColor: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 0,
                        p: 1,
                        maxHeight: '400px',
                        overflow: 'auto'
                      }}>
                        <pre style={{
                          color: '#00ff88',
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.65rem',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {scanResult.sourceCode}
                        </pre>
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* Website Metadata */}
                  <Accordion 
                    sx={{
                      backgroundColor: 'rgba(0, 245, 255, 0.05)',
                      border: '1px solid rgba(0, 245, 255, 0.2)',
                      borderRadius: 0,
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ChevronDown size={16} style={{ color: '#00f5ff' }} />}
                      sx={{ 
                        backgroundColor: 'rgba(0, 245, 255, 0.1)',
                        minHeight: 'auto',
                        '& .MuiAccordionSummary-content': { 
                          margin: '8px 0',
                          alignItems: 'center'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Shield size={14} style={{ color: '#00f5ff' }} />
                        <Typography sx={{ 
                          color: '#ffffff',
                          fontFamily: "'Aldrich', monospace",
                          fontSize: '0.7rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          Website Metadata
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1 }}>
                      <Box sx={{ 
                        color: '#aaaaaa',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.65rem'
                      }}>
                        <Typography component="div" sx={{ mb: 0.5 }}>
                          <strong style={{ color: '#00f5ff' }}>Title:</strong> {scanResult.title}
                        </Typography>
                        <Typography component="div" sx={{ mb: 0.5 }}>
                          <strong style={{ color: '#00f5ff' }}>Status Code:</strong> {scanResult.metadata.statusCode}
                        </Typography>
                        <Typography component="div" sx={{ mb: 0.5 }}>
                          <strong style={{ color: '#00f5ff' }}>Content Type:</strong> {scanResult.metadata.contentType}
                        </Typography>
                        <Typography component="div" sx={{ mb: 0.5 }}>
                          <strong style={{ color: '#00f5ff' }}>Response Time:</strong> {scanResult.metadata.responseTime}ms
                        </Typography>
                        <Typography component="div" sx={{ mb: 0.5 }}>
                          <strong style={{ color: '#00f5ff' }}>Content Size:</strong> {scanResult.metadata.size}
                        </Typography>
                        {scanResult.osintData.technologies.length > 0 && (
                          <Typography component="div" sx={{ mb: 0.5 }}>
                            <strong style={{ color: '#00f5ff' }}>Technologies:</strong> {scanResult.osintData.technologies.map(tech => tech.name).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ 
                  color: '#aaaaaa',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.7rem'
                }}>
                  RESULTS_DISPLAY_AREA :: Enter a URL and click SCAN to begin
                </Typography>
              )}
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
