/**
 * NetRunner Center View - Advanced OSINT Analysis Interface
 * 
 * Military-grade command center for comprehensive intelligence operations.
 * Multi-tab interface supporting website scanning, OSINT crawling, and intelligence correlation.
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
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Globe,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Activity,
  Radar,
  Brain,
  Network,
  Lock,
  Zap,
  FileText,
  ExternalLink,
  Clock,
  Users,
  Mail,
  Bug
} from 'lucide-react';
import { websiteScanner, type ScanResult } from '../../services/WebsiteScanner';
import { advancedOSINTCrawler, type CrawlResult } from '../../services/AdvancedOSINTCrawler';

interface NetRunnerCenterViewProps {
  width: string;
  height: string;
}

// Enhanced interface definitions for military-grade operations
interface OperationStatus {
  type: 'idle' | 'scanning' | 'crawling' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentTask: string;
  startTime?: number;
  estimatedCompletion?: number;
}

interface TargetIntelligence {
  url: string;
  domain: string;
  classification: 'unclassified' | 'confidential' | 'secret' | 'top-secret';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: number;
  scanData?: ScanResult;
  crawlData?: CrawlResult;
  analysisData?: IntelligenceAnalysis;
}

interface IntelligenceAnalysis {
  riskScore: number;
  vulnerabilityCount: number;
  exposedData: string[];
  correlatedThreats: ThreatCorrelation[];
  recommendations: ActionableRecommendation[];
}

interface ThreatCorrelation {
  id: string;
  type: string;
  confidence: number;
  description: string;
  sources: string[];
}

interface ActionableRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  rationale: string;
  estimatedEffort: string;
}

const NetRunnerCenterView: React.FC<NetRunnerCenterViewProps> = ({
  width,
  height
}) => {
  // Enhanced state management for multi-operation interface
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [currentTab, setCurrentTab] = useState(0);
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    type: 'idle',
    progress: 0,
    currentTask: 'Ready for operations'
  });
  const [targetIntelligence, setTargetIntelligence] = useState<TargetIntelligence | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [crawlResults, setCrawlResults] = useState<CrawlResult | null>(null);

  // Enhanced scanning with intelligence correlation
  const initiateScanning = async () => {
    if (!targetUrl.trim()) {
      return;
    }

    try {
      setOperationStatus({
        type: 'scanning',
        progress: 0,
        currentTask: 'Initializing reconnaissance scan...',
        startTime: Date.now()
      });

      // Start website scanner
      setOperationStatus(prev => ({
        ...prev,
        progress: 20,
        currentTask: 'Performing vulnerability assessment...'
      }));

      const scanResult = await websiteScanner.scanWebsite(targetUrl);
      setScanResults(scanResult);

      setOperationStatus(prev => ({
        ...prev,
        progress: 60,
        currentTask: 'Extracting OSINT intelligence...'
      }));

      // Start OSINT crawler if available
      let crawlResult: CrawlResult | null = null;
      try {
        crawlResult = await advancedOSINTCrawler.startAdvancedCrawl(targetUrl, {
          maxDepth: 2,
          maxUrls: 50,
          includeWayback: true,
          includeGitHub: true
        });
        setCrawlResults(crawlResult);
      } catch (error) {
        console.warn('OSINT crawler not available:', error);
      }

      setOperationStatus(prev => ({
        ...prev,
        progress: 85,
        currentTask: 'Correlating intelligence data...'
      }));

      // Create comprehensive intelligence report
      const intelligence: TargetIntelligence = {
        url: targetUrl,
        domain: new URL(targetUrl).hostname,
        classification: 'unclassified',
        threatLevel: calculateThreatLevel(scanResult, crawlResult),
        lastUpdated: Date.now(),
        scanData: scanResult,
        crawlData: crawlResult || undefined,
        analysisData: {
          riskScore: calculateRiskScore(scanResult),
          vulnerabilityCount: scanResult.vulnerabilities?.length || 0,
          exposedData: extractExposedData(scanResult, crawlResult),
          correlatedThreats: [],
          recommendations: generateRecommendations(scanResult, crawlResult)
        }
      };

      setTargetIntelligence(intelligence);

      setOperationStatus({
        type: 'completed',
        progress: 100,
        currentTask: 'Intelligence analysis complete',
        estimatedCompletion: Date.now()
      });

    } catch (error) {
      setOperationStatus({
        type: 'error',
        progress: 0,
        currentTask: `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Enhanced OSINT crawling operation
  const initiateOSINTCrawling = async () => {
    if (!targetUrl.trim()) {
      return;
    }

    try {
      setOperationStatus({
        type: 'crawling',
        progress: 0,
        currentTask: 'Initializing deep reconnaissance...',
        startTime: Date.now()
      });

      const crawlResult = await advancedOSINTCrawler.startAdvancedCrawl(targetUrl, {
        maxDepth: 3,
        maxUrls: 100,
        includeWayback: true,
        includeGitHub: true,
        includeDirectoryBruteforce: true
      });
      setCrawlResults(crawlResult);

      setOperationStatus({
        type: 'completed',
        progress: 100,
        currentTask: 'OSINT crawling complete'
      });

    } catch (error) {
      setOperationStatus({
        type: 'error',
        progress: 0,
        currentTask: `OSINT operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Helper functions for intelligence analysis
  const calculateThreatLevel = (scanResult: ScanResult, crawlResult: CrawlResult | null): 'low' | 'medium' | 'high' | 'critical' => {
    const criticalVulns = scanResult.vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
    const highVulns = scanResult.vulnerabilities?.filter(v => v.severity === 'high').length || 0;
    const sensitiveData = crawlResult?.discoveredUrls?.length || 0;

    if (criticalVulns > 0) return 'critical';
    if (highVulns > 2 || sensitiveData > 50) return 'high';
    if (highVulns > 0 || sensitiveData > 20) return 'medium';
    return 'low';
  };

  const calculateRiskScore = (scanResult: ScanResult): number => {
    const vulnWeights = { critical: 10, high: 5, medium: 2, low: 1 };
    let score = 0;
    
    scanResult.vulnerabilities?.forEach(vuln => {
      score += vulnWeights[vuln.severity as keyof typeof vulnWeights] || 0;
    });

    return Math.min(100, score);
  };

  const extractExposedData = (scanResult: ScanResult, crawlResult: CrawlResult | null): string[] => {
    const exposed: string[] = [];
    
    if (scanResult.osintData?.emails) {
      exposed.push(...scanResult.osintData.emails);
    }
    
    if (crawlResult?.discoveredUrls) {
      exposed.push(`${crawlResult.discoveredUrls.length} URLs discovered`);
    }

    return [...new Set(exposed)];
  };

  const generateRecommendations = (scanResult: ScanResult, crawlResult: CrawlResult | null): ActionableRecommendation[] => {
    const recommendations: ActionableRecommendation[] = [];

    if (scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Address identified vulnerabilities',
        rationale: `${scanResult.vulnerabilities.length} security issues detected`,
        estimatedEffort: '2-4 hours'
      });
    }

    if (crawlResult?.discoveredUrls && crawlResult.discoveredUrls.length > 10) {
      recommendations.push({
        priority: 'medium',
        action: 'Review discovered endpoints',
        rationale: 'Multiple URLs discovered during reconnaissance',
        estimatedEffort: '1-2 hours'
      });
    }

    return recommendations;
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#888888';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00ff88';
      case 'scanning': 
      case 'crawling':
      case 'analyzing': return '#00aaff';
      case 'error': return '#ff4444';
      default: return '#888888';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#88ff88';
      default: return '#888888';
    }
  };

  const tabLabels = [
    'Mission Control',
    'Vulnerability Assessment',
    'OSINT Intelligence',
    'Threat Analysis',
    'Action Items'
  ];

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: '#000000',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(0, 245, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 136, 0, 0.1) 0%, transparent 50%)
        `,
        color: '#ffffff',
        fontFamily: 'Aldrich, monospace',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(0, 245, 255, 0.3)',
        position: 'relative'
      }}
    >
      {/* Header with Target Input and Controls */}
      <Box
        sx={{
          padding: 2,
          borderBottom: '1px solid rgba(0, 245, 255, 0.3)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#00f5ff',
            marginBottom: 2,
            fontFamily: 'Aldrich, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
        >
          <Target size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          NetRunner Intelligence Center
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', marginBottom: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Target URL"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                borderColor: 'rgba(0, 245, 255, 0.5)',
                '& fieldset': {
                  borderColor: 'rgba(0, 245, 255, 0.5)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 245, 255, 0.8)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00f5ff'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(0, 245, 255, 0.7)'
              }
            }}
          />
          <Button
            variant="contained"
            onClick={initiateScanning}
            disabled={operationStatus.type === 'scanning' || operationStatus.type === 'crawling'}
            sx={{
              backgroundColor: '#ff8800',
              color: '#000000',
              fontFamily: 'Aldrich, monospace',
              fontWeight: 'bold',
              minWidth: 120,
              '&:hover': {
                backgroundColor: '#ffaa00'
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 136, 0, 0.3)'
              }
            }}
            startIcon={<Radar size={16} />}
          >
            SCAN
          </Button>
          <Button
            variant="outlined"
            onClick={initiateOSINTCrawling}
            disabled={operationStatus.type === 'scanning' || operationStatus.type === 'crawling'}
            sx={{
              borderColor: '#00f5ff',
              color: '#00f5ff',
              fontFamily: 'Aldrich, monospace',
              minWidth: 120,
              '&:hover': {
                borderColor: '#00aaff',
                backgroundColor: 'rgba(0, 245, 255, 0.1)'
              },
              '&:disabled': {
                borderColor: 'rgba(0, 245, 255, 0.3)',
                color: 'rgba(0, 245, 255, 0.3)'
              }
            }}
            startIcon={<Search size={16} />}
          >
            OSINT
          </Button>
        </Box>

        {/* Operation Status */}
        {operationStatus.type !== 'idle' && (
          <Box sx={{ marginBottom: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: getStatusColor(operationStatus.type),
                  fontFamily: 'Aldrich, monospace',
                  fontSize: '0.9em'
                }}
              >
                <Activity size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {operationStatus.currentTask}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: getStatusColor(operationStatus.type),
                  fontFamily: 'Aldrich, monospace'
                }}
              >
                {operationStatus.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={operationStatus.progress}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStatusColor(operationStatus.type)
                }
              }}
            />
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{
          borderBottom: '1px solid rgba(0, 245, 255, 0.3)',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          '& .MuiTab-root': {
            color: 'rgba(0, 245, 255, 0.7)',
            fontFamily: 'Aldrich, monospace',
            fontSize: '0.8em',
            textTransform: 'uppercase',
            '&.Mui-selected': {
              color: '#00f5ff'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#ff8800'
          }
        }}
      >
        {tabLabels.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto', padding: 2 }}>
        {currentTab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 2 }}>
              Mission Overview
            </Typography>
            
            {targetIntelligence ? (
              <Paper
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  padding: 2,
                  marginBottom: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {targetIntelligence.domain}
                  </Typography>
                  <Chip
                    label={targetIntelligence.threatLevel.toUpperCase()}
                    sx={{
                      backgroundColor: getThreatLevelColor(targetIntelligence.threatLevel),
                      color: '#000000',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                
                <Divider sx={{ backgroundColor: 'rgba(0, 245, 255, 0.2)', marginY: 2 }} />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#00f5ff', marginBottom: 1 }}>
                      Risk Score
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#ff8800' }}>
                      {targetIntelligence.analysisData?.riskScore || 0}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: '#00f5ff', marginBottom: 1 }}>
                      Vulnerabilities
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#ff4444' }}>
                      {targetIntelligence.analysisData?.vulnerabilityCount || 0}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: '#00f5ff', marginBottom: 1 }}>
                      Exposed Data
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#ffaa00' }}>
                      {targetIntelligence.analysisData?.exposedData.length || 0}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Alert
                severity="info"
                sx={{
                  backgroundColor: 'rgba(0, 170, 255, 0.1)',
                  color: '#00aaff',
                  border: '1px solid rgba(0, 170, 255, 0.3)',
                  '& .MuiAlert-icon': {
                    color: '#00aaff'
                  }
                }}
              >
                Initiate a scan to begin intelligence gathering operations.
              </Alert>
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 2 }}>
              Vulnerability Assessment
            </Typography>
            
            {scanResults?.vulnerabilities ? (
              <List>
                {scanResults.vulnerabilities.map((vuln, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 68, 68, 0.3)',
                      marginBottom: 1,
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      <Bug color={getSeverityColor(vuln.severity)} size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ color: '#ffffff' }}>
                            {vuln.type}
                          </Typography>
                          <Chip
                            label={vuln.severity.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getSeverityColor(vuln.severity),
                              color: '#000000'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: '#cccccc', marginTop: 1 }}>
                          {vuln.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert
                severity="warning"
                sx={{
                  backgroundColor: 'rgba(255, 170, 0, 0.1)',
                  color: '#ffaa00',
                  border: '1px solid rgba(255, 170, 0, 0.3)'
                }}
              >
                No vulnerability data available. Run a scan to assess security status.
              </Alert>
            )}
          </Box>
        )}

        {currentTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 2 }}>
              OSINT Intelligence
            </Typography>
            
            {scanResults?.osintData ? (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {scanResults.osintData.emails && scanResults.osintData.emails.length > 0 && (
                  <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(0, 245, 255, 0.3)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 1 }}>
                        <Mail size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Email Addresses
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {scanResults.osintData.emails.map((email, index) => (
                          <Chip
                            key={index}
                            label={email}
                            size="small"
                            sx={{ backgroundColor: 'rgba(0, 245, 255, 0.2)', color: '#ffffff' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}
                
                {scanResults.osintData.technologies && scanResults.osintData.technologies.length > 0 && (
                  <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(0, 245, 255, 0.3)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 1 }}>
                        <Zap size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Technologies
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {scanResults.osintData.technologies.map((tech, index) => (
                          <Chip
                            key={index}
                            label={`${tech.name}${tech.version ? ` ${tech.version}` : ''}`}
                            size="small"
                            sx={{ backgroundColor: 'rgba(255, 136, 0, 0.2)', color: '#ffffff' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            ) : (
              <Alert
                severity="info"
                sx={{
                  backgroundColor: 'rgba(0, 170, 255, 0.1)',
                  color: '#00aaff',
                  border: '1px solid rgba(0, 170, 255, 0.3)'
                }}
              >
                No OSINT data available. Run a scan to collect intelligence.
              </Alert>
            )}
          </Box>
        )}

        {currentTab === 3 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 2 }}>
              Threat Analysis
            </Typography>
            
            {targetIntelligence ? (
              <Box>
                <Typography variant="body1" sx={{ color: '#ffffff', marginBottom: 2 }}>
                  Comprehensive threat analysis for <strong>{targetIntelligence.domain}</strong>
                </Typography>
                
                <Paper
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    padding: 2
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#ff4444', marginBottom: 1 }}>
                    <Shield size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Threat Level: {targetIntelligence.threatLevel.toUpperCase()}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Risk assessment based on vulnerability count, exposure level, and threat indicators.
                  </Typography>
                </Paper>
              </Box>
            ) : (
              <Alert
                severity="warning"
                sx={{
                  backgroundColor: 'rgba(255, 170, 0, 0.1)',
                  color: '#ffaa00',
                  border: '1px solid rgba(255, 170, 0, 0.3)'
                }}
              >
                No threat analysis available. Complete a scan to generate threat assessment.
              </Alert>
            )}
          </Box>
        )}

        {currentTab === 4 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#00f5ff', marginBottom: 2 }}>
              Action Items
            </Typography>
            
            {targetIntelligence?.analysisData?.recommendations ? (
              <List>
                {targetIntelligence.analysisData.recommendations.map((rec, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(0, 245, 255, 0.3)',
                      marginBottom: 1,
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      <CheckCircle color={getThreatLevelColor(rec.priority)} size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ color: '#ffffff' }}>
                            {rec.action}
                          </Typography>
                          <Chip
                            label={rec.priority.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getThreatLevelColor(rec.priority),
                              color: '#000000'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ marginTop: 1 }}>
                          <Typography sx={{ color: '#cccccc', marginBottom: 0.5 }}>
                            {rec.rationale}
                          </Typography>
                          <Typography sx={{ color: '#888888', fontSize: '0.8em' }}>
                            Estimated effort: {rec.estimatedEffort}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert
                severity="info"
                sx={{
                  backgroundColor: 'rgba(0, 170, 255, 0.1)',
                  color: '#00aaff',
                  border: '1px solid rgba(0, 170, 255, 0.3)'
                }}
              >
                No action items available. Complete intelligence analysis to generate recommendations.
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NetRunnerCenterView;
