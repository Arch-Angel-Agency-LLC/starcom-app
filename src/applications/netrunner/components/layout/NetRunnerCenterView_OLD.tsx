/**
 * NetRunner Center View - Advanced OSINT Analysis Interface
 * 
 * Military-grade command center for comprehensive intelligence operations.
 * Multi-tab interface supporting website scanning, OSINT crawling, and intelligence correlation.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Badge,
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
  Code,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Download,
  Copy,
  Eye,
  Database,
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

interface Vulnerability {
  id: string;
  title: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  impact: string;
  recommendation: string;
}

interface OSINTData {
  emails: string[];
  socialMedia: string[];
  technologies: string[];
  serverInfo: string[];
  subdomains: string[];
}

interface WebsiteMetadata {
  ip: string;
  server: string;
  lastModified: string;
  size: string;
  responseTime: number;
  headers: { [key: string]: string };
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
      alert('Please enter a valid target URL');
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

      // Start OSINT crawler
      const crawlResult = await advancedOSINTCrawler.crawlTarget(targetUrl);
      setCrawlResults(crawlResult);

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
        crawlData: crawlResult,
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
        currentTask: `Operation failed: ${error.message}`
      });
    }
  };

  // Enhanced OSINT crawling operation
  const initiateOSINTCrawling = async () => {
    if (!targetUrl.trim()) {
      alert('Please enter a valid target URL');
      return;
    }

    try {
      setOperationStatus({
        type: 'crawling',
        progress: 0,
        currentTask: 'Initializing deep reconnaissance...',
        startTime: Date.now()
      });

      const crawlResult = await advancedOSINTCrawler.crawlTarget(targetUrl);
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
        currentTask: `OSINT operation failed: ${error.message}`
      });
    }
  };

  // Helper functions for intelligence analysis
  const calculateThreatLevel = (scanResult: ScanResult, crawlResult: CrawlResult): 'low' | 'medium' | 'high' | 'critical' => {
    const criticalVulns = scanResult.vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
    const highVulns = scanResult.vulnerabilities?.filter(v => v.severity === 'high').length || 0;
    const sensitiveData = crawlResult.discoveredUrls?.length || 0;

    if (criticalVulns > 0) return 'critical';
    if (highVulns > 2 || sensitiveData > 50) return 'high';
    if (highVulns > 0 || sensitiveData > 20) return 'medium';
    return 'low';
  };

  const calculateRiskScore = (scanResult: ScanResult): number => {
    const vulnWeights = { critical: 10, high: 5, medium: 2, low: 1 };
    let score = 0;
    
    scanResult.vulnerabilities?.forEach(vuln => {
      score += vulnWeights[vuln.severity] || 0;
    });

    return Math.min(100, score);
  };

  const extractExposedData = (scanResult: ScanResult, crawlResult: CrawlResult): string[] => {
    const exposed: string[] = [];
    
    if (scanResult.osintData?.emails) {
      exposed.push(...scanResult.osintData.emails);
    }
    
    if (crawlResult.leakedCredentials) {
      exposed.push(...crawlResult.leakedCredentials.map(cred => cred.type));
    }

    return [...new Set(exposed)];
  };

  const generateRecommendations = (scanResult: ScanResult, crawlResult: CrawlResult): ActionableRecommendation[] => {
    const recommendations: ActionableRecommendation[] = [];

    if (scanResult.vulnerabilities?.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Address identified vulnerabilities',
        rationale: `${scanResult.vulnerabilities.length} security issues detected`,
        estimatedEffort: '2-4 hours'
      });
    }

    if (crawlResult.waybackUrls?.length > 10) {
      recommendations.push({
        priority: 'medium',
        action: 'Review historical data exposure',
        rationale: 'Significant historical data available',
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

    // Ensure URL has protocol
    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setWebsiteData({
      url: formattedUrl,
      title: 'Scanning...',
      status: 'scanning',
      progress: 0,
      sourceCode: '',
      vulnerabilities: [],
      osintData: {
        emails: [],
        socialMedia: [],
        technologies: [],
        serverInfo: [],
        subdomains: []
      },
      metadata: {
        ip: '',
        server: '',
        lastModified: '',
        size: '',
        responseTime: 0,
        headers: {}
      }
    });

    try {
      await performWebsiteScan(formattedUrl);
    } catch (error) {
      console.error('Scan failed:', error);
      setWebsiteData(prev => prev ? {
        ...prev,
        status: 'error',
        title: 'Scan Failed'
      } : null);
    }
  };

  const performWebsiteScan = async (url: string) => {
    try {
      // Use the production-ready website scanner service
      const result = await websiteScanner.scanWebsite(url, (progress, status) => {
        setWebsiteData(prev => prev ? {
          ...prev,
          progress,
          title: status || prev.title
        } : null);
      });

      // Convert the ScanResult to our component's data format
      setWebsiteData({
        url: result.url,
        title: result.title,
        status: result.status,
        progress: result.progress,
        sourceCode: result.sourceCode,
        vulnerabilities: result.vulnerabilities.map(vuln => ({
          id: vuln.id,
          title: vuln.title,
          type: vuln.type,
          severity: vuln.severity,
          description: vuln.description,
          location: vuln.location,
          impact: vuln.impact,
          recommendation: vuln.recommendation
        })),
        osintData: {
          emails: result.osintData.emails,
          socialMedia: result.osintData.socialMedia,
          technologies: result.osintData.technologies.map(tech => tech.name),
          serverInfo: result.osintData.serverInfo,
          subdomains: result.osintData.subdomains
        },
        metadata: {
          ip: result.metadata.ip || 'N/A',
          server: result.metadata.server || 'Unknown',
          lastModified: result.metadata.lastModified || 'Unknown',
          size: result.metadata.size || 'Unknown',
          responseTime: result.metadata.responseTime,
          headers: result.metadata.headers
        }
      });

    } catch (error) {
      console.error('Website scan failed:', error);
      setWebsiteData(prev => prev ? {
        ...prev,
        status: 'error',
        title: 'Scan Failed - ' + (error as Error).message
      } : null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#ffff00';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle size={16} />;
      case 'high': return <AlertTriangle size={16} />;
      case 'medium': return <AlertTriangle size={16} />;
      case 'low': return <CheckCircle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: '#000000',
        backgroundImage: `
          linear-gradient(45deg, rgba(0, 245, 255, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.04) 0%, transparent 40%)
        `,
        border: `2px solid transparent`,
        borderImage: `linear-gradient(45deg, 
          rgba(0, 245, 255, 0.6) 0%, 
          rgba(139, 92, 246, 0.4) 50%, 
          rgba(0, 255, 136, 0.6) 100%
        ) 1`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `
          0 0 30px rgba(0, 245, 255, 0.15),
          inset 0 0 30px rgba(0, 0, 0, 0.5)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(0, 245, 255, 0.02) 3px,
              rgba(0, 245, 255, 0.02) 6px
            )
          `,
          pointerEvents: 'none',
          zIndex: 1
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          borderBottom: `2px solid rgba(0, 245, 255, 0.3)`,
          backgroundColor: 'rgba(0, 245, 255, 0.08)',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#00f5ff',
            fontFamily: '"Orbitron", monospace',
            fontSize: '16px',
            fontWeight: 900,
            textAlign: 'center',
            textShadow: '0 0 15px rgba(0, 245, 255, 0.6)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          ▓█ WEBSITE CODE ANALYSIS █▓
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(0, 245, 255, 0.9)',
            display: 'block',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: '4px',
            textShadow: '0 0 8px rgba(0, 245, 255, 0.4)'
          }}
        >
          ▓ DEEP WEB INTELLIGENCE SCANNER ▓
        </Typography>
      </Box>

      {/* Current Website Display */}
      <Box sx={{ padding: 2, borderBottom: '1px solid rgba(0, 245, 255, 0.2)', position: 'relative', zIndex: 2 }}>
        <Typography
          variant="h6"
          sx={{
            color: '#ccc',
            fontSize: '16px',
            fontWeight: 700,
            textAlign: 'center',
            mb: 2
          }}
        >
          WEBSITE CODE ANALYSIS INTERFACE
        </Typography>

        {/* Target Input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Globe size={20} color="#00f5ff" />
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter target URL..."
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1a1a1a',
                color: '#ccc',
                fontSize: '14px',
                '& fieldset': { borderColor: '#333' },
                '&:hover fieldset': { borderColor: '#00f5ff' },
                '&.Mui-focused fieldset': { borderColor: '#00f5ff' }
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search size={16} />}
            onClick={startScan}
            disabled={websiteData?.status === 'scanning'}
            sx={{
              backgroundColor: '#00f5ff',
              color: '#000',
              '&:hover': { backgroundColor: '#00d4d4' },
              '&:disabled': { backgroundColor: '#333', color: '#666' }
            }}
          >
            Scan
          </Button>
        </Box>
      </Box>

      {/* Scanning Progress */}
      {websiteData?.status === 'scanning' && (
        <Box sx={{ padding: 2, borderBottom: '1px solid #333' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Scanning: {websiteData.url}
            </Typography>
            <Typography variant="body2" sx={{ color: '#00ff88' }}>
              {Math.round(websiteData.progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={websiteData.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#00ff88',
                borderRadius: 4
              }
            }}
          />
        </Box>
      )}

      {/* Results Tabs */}
      {websiteData?.status === 'completed' && (
        <>
          <Box sx={{ borderBottom: '1px solid #333' }}>
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: '#666',
                  '&.Mui-selected': { color: '#00f5ff' }
                },
                '& .MuiTabs-indicator': { backgroundColor: '#00f5ff' }
              }}
            >
              <Tab icon={<Code size={16} />} label="Source Code" />
              <Tab icon={<Shield size={16} />} label="Vulnerabilities" />
              <Tab icon={<Target size={16} />} label="OSINT Data" />
              <Tab icon={<Database size={16} />} label="Metadata" />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', padding: 2 }}>
            {/* Source Code Tab */}
            {currentTab === 0 && (
              <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#00f5ff' }}>
                      Source Code Analysis
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Copy Code">
                        <IconButton size="small" sx={{ color: '#00f5ff' }}>
                          <Copy size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" sx={{ color: '#00f5ff' }}>
                          <Download size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: 1,
                      padding: 2,
                      overflow: 'auto',
                      maxHeight: '400px'
                    }}
                  >
                    <Typography
                      component="pre"
                      sx={{
                        color: '#ccc',
                        fontSize: '12px',
                        fontFamily: '"Monaco", "Menlo", monospace',
                        whiteSpace: 'pre-wrap',
                        margin: 0
                      }}
                    >
                      {websiteData.sourceCode}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Vulnerabilities Tab */}
            {currentTab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#ff4444', mb: 2 }}>
                  Security Vulnerabilities ({websiteData.vulnerabilities.length})
                </Typography>
                
                {websiteData.vulnerabilities.map((vuln) => (
                  <Accordion
                    key={vuln.id}
                    sx={{
                      backgroundColor: '#1a1a1a',
                      border: `1px solid ${getSeverityColor(vuln.severity)}`,
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary expandIcon={<ChevronDown style={{ color: '#00f5ff' }} />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        {getSeverityIcon(vuln.severity)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ color: '#ccc', fontWeight: 600 }}>
                            {vuln.type}
                          </Typography>
                          <Chip
                            label={vuln.severity.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: `${getSeverityColor(vuln.severity)}20`,
                              color: getSeverityColor(vuln.severity),
                              fontSize: '10px'
                            }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>Description:</Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>{vuln.description}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>Location:</Typography>
                          <Typography variant="body2" sx={{ color: '#ffaa00' }}>{vuln.location}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>Recommendation:</Typography>
                          <Typography variant="body2" sx={{ color: '#00ff88' }}>{vuln.recommendation}</Typography>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {/* OSINT Data Tab */}
            {currentTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ color: '#ffaa00' }}>
                  OSINT Intelligence Data
                </Typography>

                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00f5ff', mb: 1 }}>Email Addresses</Typography>
                    {websiteData.osintData.emails.map((email, index) => (
                      <Chip
                        key={index}
                        label={email}
                        size="small"
                        sx={{ mr: 1, mb: 1, backgroundColor: '#333', color: '#ccc' }}
                      />
                    ))}
                  </CardContent>
                </Card>

                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00f5ff', mb: 1 }}>Social Media</Typography>
                    {websiteData.osintData.socialMedia.map((social, index) => (
                      <Chip
                        key={index}
                        label={social}
                        size="small"
                        sx={{ mr: 1, mb: 1, backgroundColor: '#333', color: '#ccc' }}
                      />
                    ))}
                  </CardContent>
                </Card>

                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00f5ff', mb: 1 }}>Technologies</Typography>
                    {websiteData.osintData.technologies.map((tech, index) => (
                      <Chip
                        key={index}
                        label={tech}
                        size="small"
                        sx={{ mr: 1, mb: 1, backgroundColor: '#333', color: '#ccc' }}
                      />
                    ))}
                  </CardContent>
                </Card>

                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00f5ff', mb: 1 }}>Subdomains</Typography>
                    {websiteData.osintData.subdomains.map((subdomain, index) => (
                      <Chip
                        key={index}
                        label={subdomain}
                        size="small"
                        sx={{ mr: 1, mb: 1, backgroundColor: '#333', color: '#ccc' }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Metadata Tab */}
            {currentTab === 3 && (
              <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2 }}>
                    Website Metadata
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666' }}>IP Address:</Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>{websiteData.metadata.ip}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666' }}>Server:</Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>{websiteData.metadata.server}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666' }}>Response Time:</Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>{websiteData.metadata.responseTime}ms</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666' }}>Size:</Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>{websiteData.metadata.size}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ color: '#8b5cf6', mt: 2, mb: 1 }}>
                    HTTP Headers
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: 1,
                      padding: 1,
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  >
                    {Object.entries(websiteData.metadata.headers).map(([key, value]) => (
                      <Box key={key} sx={{ mb: 0.5 }}>
                        <Typography component="span" sx={{ color: '#00f5ff' }}>{key}:</Typography>{' '}
                        <Typography component="span" sx={{ color: '#ccc' }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </>
      )}

      {/* Initial State */}
      {!websiteData && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Eye size={64} color="#333" />
          <Typography variant="h6" sx={{ color: '#666' }}>
            Enter a target URL to begin website analysis
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', maxWidth: 400 }}>
            Comprehensive OSINT scanning, vulnerability assessment, and code analysis
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NetRunnerCenterView;
