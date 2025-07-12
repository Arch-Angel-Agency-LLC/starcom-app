/**
 * NetRunner Center View - Website Code Analysis Interface
 * 
 * Specialized web view for reviewing website code from scanning websites.
 * Comprehensive website analysis interface with vulnerability scanning and OSINT data extraction.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import React, { useState, useEffect } from 'react';
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
  Tooltip
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
  Activity
} from 'lucide-react';
import { websiteScanner, type ScanResult } from '../../services/WebsiteScanner';

interface NetRunnerCenterViewProps {
  width: string;
  height: string;
}

interface WebsiteData {
  url: string;
  title: string;
  status: 'scanning' | 'completed' | 'error';
  progress: number;
  sourceCode: string;
  vulnerabilities: Vulnerability[];
  osintData: OSINTData;
  metadata: WebsiteMetadata;
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
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [currentTab, setCurrentTab] = useState(0);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);

  // Mock website analysis
  useEffect(() => {
    if (websiteData?.status === 'scanning') {
      const interval = setInterval(() => {
        setWebsiteData(prev => {
          if (!prev) return null;
          
          const newProgress = Math.min(100, prev.progress + Math.random() * 15);
          
          if (newProgress >= 100) {
            return {
              ...prev,
              status: 'completed',
              progress: 100,
              sourceCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Website</title>
    <script src="vulnerable-lib.js"></script>
</head>
<body>
    <div id="app">
        <form action="/login" method="post">
            <!-- Potential XSS vulnerability -->
            <input type="text" name="username" value="<?php echo $_GET['user']; ?>">
            <input type="password" name="password">
            <button type="submit">Login</button>
        </form>
    </div>
    <script>
        // Insecure direct object reference
        var userId = location.search.split('id=')[1];
        fetch('/api/user/' + userId);
    </script>
</body>
</html>`,
              vulnerabilities: [
                {
                  id: 'xss-001',
                  type: 'Cross-Site Scripting (XSS)',
                  severity: 'high',
                  description: 'Reflected XSS vulnerability in user parameter',
                  location: 'Line 9: input value attribute',
                  recommendation: 'Sanitize user input and use proper output encoding'
                },
                {
                  id: 'idor-001',
                  type: 'Insecure Direct Object Reference',
                  severity: 'medium',
                  description: 'Direct access to user data via URL parameter',
                  location: 'Line 15-16: JavaScript userId handling',
                  recommendation: 'Implement proper access controls and validation'
                },
                {
                  id: 'lib-001',
                  type: 'Vulnerable Dependencies',
                  severity: 'critical',
                  description: 'Outdated JavaScript library with known vulnerabilities',
                  location: 'Line 6: vulnerable-lib.js',
                  recommendation: 'Update to latest secure version'
                }
              ],
              osintData: {
                emails: ['admin@example.com', 'contact@example.com', 'security@example.com'],
                socialMedia: ['@examplecorp', 'facebook.com/example', 'linkedin.com/company/example'],
                technologies: ['Apache/2.4.41', 'PHP/7.4.3', 'MySQL', 'WordPress 5.8'],
                serverInfo: ['Server: Apache/2.4.41', 'X-Powered-By: PHP/7.4.3', 'Set-Cookie: PHPSESSID'],
                subdomains: ['www.example.com', 'mail.example.com', 'ftp.example.com', 'api.example.com']
              },
              metadata: {
                ip: '93.184.216.34',
                server: 'Apache/2.4.41 (Ubuntu)',
                lastModified: '2024-01-15T10:30:00Z',
                size: '2.4 KB',
                responseTime: 245,
                headers: {
                  'Content-Type': 'text/html; charset=UTF-8',
                  'Server': 'Apache/2.4.41 (Ubuntu)',
                  'Last-Modified': 'Mon, 15 Jan 2024 10:30:00 GMT',
                  'X-Frame-Options': 'DENY',
                  'X-Content-Type-Options': 'nosniff'
                }
              }
            };
          }
          
          return { ...prev, progress: newProgress };
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [websiteData?.status]);

  const startScan = async () => {
    if (!targetUrl.trim()) {
      alert('Please enter a valid URL');
      return;
    }

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
