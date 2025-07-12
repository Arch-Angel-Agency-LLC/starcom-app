/**
 * NetRunner Advanced OSINT Crawler Interface
 * 
 * Military-grade deep web intelligence gathering interface for discovering
 * hidden URLs, endpoints, and conducting comprehensive reconnaissance.
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Radar,
  Target,
  Shield,
  AlertTriangle,
  Database,
  Key,
  Globe,
  History,
  Code,
  ChevronDown,
  Copy,
  ExternalLink,
  Activity,
  Eye
} from 'lucide-react';
import { advancedOSINTCrawler, type CrawlResult, type CrawlTarget } from '../services/AdvancedOSINTCrawler';

interface NetRunnerOSINTCrawlerProps {
  width: string;
  height: string;
}

export const NetRunnerOSINTCrawler: React.FC<NetRunnerOSINTCrawlerProps> = ({
  width,
  height
}) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [crawlData, setCrawlData] = useState<CrawlResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<string | false>('overview');

  // Crawler options
  const [options, setOptions] = useState({
    maxDepth: 3,
    maxUrls: 100,
    includeWayback: true,
    includeGitHub: true,
    includeDirectoryBruteforce: true
  });

  const startAdvancedCrawl = async () => {
    if (!targetUrl.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    setIsScanning(true);
    setCrawlData(null);

    try {
      // Initialize crawl data structure
      setCrawlData({
        targetUrl,
        discoveredUrls: [],
        scannedResults: new Map(),
        intelligence: {
          hiddenDirectories: [],
          adminPanels: [],
          apiEndpoints: [],
          backupFiles: [],
          configFiles: [],
          databaseFiles: [],
          logFiles: [],
          documentFiles: [],
          archiveFiles: [],
          sourceCodeLeaks: [],
          credentials: [],
          sensitiveData: [],
          waybackHistory: [],
          githubLeaks: []
        },
        progress: 0,
        status: 'crawling',
        timestamp: Date.now()
      });

      // Start the crawl
      const result = await advancedOSINTCrawler.startAdvancedCrawl(
        targetUrl,
        options,
        (progress, status) => {
          setCrawlData(prev => prev ? {
            ...prev,
            progress,
            status: status.includes('completed') ? 'completed' : 'crawling'
          } : null);
        }
      );

      setCrawlData(result);
    } catch (error) {
      console.error('Advanced crawl failed:', error);
      setCrawlData(prev => prev ? {
        ...prev,
        status: 'error'
      } : null);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPriorityColor = (priority: CrawlTarget['priority']) => {
    switch (priority) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#ffff00';
      default: return '#666';
    }
  };

  const getSeverityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle size={16} style={{ color: '#ff0000' }} />;
      case 'high': return <Shield size={16} style={{ color: '#ff4444' }} />;
      case 'medium': return <Eye size={16} style={{ color: '#ffaa00' }} />;
      case 'low': return <Activity size={16} style={{ color: '#ffff00' }} />;
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
          linear-gradient(45deg, rgba(255, 0, 100, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 30% 70%, rgba(255, 100, 0, 0.04) 0%, transparent 40%)
        `,
        border: `2px solid transparent`,
        borderImage: `linear-gradient(45deg, 
          rgba(255, 0, 100, 0.6) 0%, 
          rgba(255, 100, 0, 0.4) 50%, 
          rgba(255, 255, 0, 0.6) 100%
        ) 1`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `
          0 0 30px rgba(255, 0, 100, 0.15),
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
              rgba(255, 0, 100, 0.02) 3px,
              rgba(255, 0, 100, 0.02) 6px
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
          borderBottom: `2px solid rgba(255, 0, 100, 0.3)`,
          backgroundColor: 'rgba(255, 0, 100, 0.08)',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#ff0064',
            fontFamily: '"Orbitron", monospace',
            fontSize: '16px',
            fontWeight: 900,
            textAlign: 'center',
            textShadow: '0 0 15px rgba(255, 0, 100, 0.6)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          ▓█ ADVANCED OSINT CRAWLER █▓
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 0, 100, 0.9)',
            display: 'block',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: '4px',
            textShadow: '0 0 8px rgba(255, 0, 100, 0.4)'
          }}
        >
          ▓ DEEP WEB INTELLIGENCE RECONNAISSANCE ▓
        </Typography>
      </Box>

      {/* Control Panel */}
      <Box sx={{ padding: 2, borderBottom: '1px solid rgba(255, 0, 100, 0.2)', position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Target URL"
              variant="outlined"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isScanning}
              InputProps={{
                startAdornment: <Target size={20} style={{ marginRight: 8, color: '#ff0064' }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 0, 100, 0.05)',
                  '& fieldset': { borderColor: 'rgba(255, 0, 100, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 0, 100, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0064' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={options.includeWayback}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeWayback: e.target.checked }))}
                  disabled={isScanning}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff0064' } }}
                />
              }
              label="Wayback"
              sx={{ color: '#ffffff', fontSize: '12px' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={options.includeGitHub}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeGitHub: e.target.checked }))}
                  disabled={isScanning}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff0064' } }}
                />
              }
              label="GitHub"
              sx={{ color: '#ffffff', fontSize: '12px' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={options.includeDirectoryBruteforce}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeDirectoryBruteforce: e.target.checked }))}
                  disabled={isScanning}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff0064' } }}
                />
              }
              label="Brute Force"
              sx={{ color: '#ffffff', fontSize: '12px' }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={startAdvancedCrawl}
            disabled={isScanning || !targetUrl.trim()}
            startIcon={<Radar size={20} />}
            sx={{
              backgroundColor: '#ff0064',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              '&:hover': { backgroundColor: '#cc0050' },
              '&:disabled': { backgroundColor: 'rgba(255, 0, 100, 0.3)' }
            }}
          >
            {isScanning ? 'Crawling...' : 'Start Deep Crawl'}
          </Button>

          {crawlData && (
            <Box sx={{ flex: 1, ml: 2 }}>
              <Typography variant="caption" sx={{ color: '#ffffff', display: 'block' }}>
                Progress: {crawlData.progress}% | Discovered: {crawlData.discoveredUrls.length} URLs
              </Typography>
              <LinearProgress
                variant="determinate"
                value={crawlData.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 0, 100, 0.2)',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ff0064' }
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Results Area */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 2 }}>
        {!crawlData ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <Radar size={64} style={{ marginBottom: 16, color: '#ff0064' }} />
            <Typography variant="h6" sx={{ fontFamily: '"Orbitron", monospace' }}>
              OSINT CRAWLER READY
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
              Enter target URL and configure options to begin deep reconnaissance
            </Typography>
          </Box>
        ) : (
          <Box sx={{ padding: 2 }}>
            {/* Overview Stats */}
            <Accordion
              expanded={expandedPanel === 'overview'}
              onChange={handlePanelChange('overview')}
              sx={{
                backgroundColor: 'rgba(255, 0, 100, 0.05)',
                border: '1px solid rgba(255, 0, 100, 0.2)',
                mb: 1
              }}
            >
              <AccordionSummary expandIcon={<ChevronDown style={{ color: '#ff0064' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Activity size={20} style={{ color: '#ff0064' }} />
                  <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Reconnaissance Overview
                  </Typography>
                  <Chip
                    label={`${crawlData.discoveredUrls.length} URLs`}
                    size="small"
                    sx={{ backgroundColor: '#ff0064', color: '#ffffff', ml: 1 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{ backgroundColor: 'rgba(255, 0, 100, 0.1)', border: '1px solid rgba(255, 0, 100, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Shield size={24} style={{ color: '#ff4444', marginBottom: 8 }} />
                        <Typography variant="h6" sx={{ color: '#ffffff' }}>
                          {crawlData.intelligence.adminPanels.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Admin Panels
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{ backgroundColor: 'rgba(255, 0, 100, 0.1)', border: '1px solid rgba(255, 0, 100, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Code size={24} style={{ color: '#ffaa00', marginBottom: 8 }} />
                        <Typography variant="h6" sx={{ color: '#ffffff' }}>
                          {crawlData.intelligence.apiEndpoints.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          API Endpoints
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{ backgroundColor: 'rgba(255, 0, 100, 0.1)', border: '1px solid rgba(255, 0, 100, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Key size={24} style={{ color: '#ff0000', marginBottom: 8 }} />
                        <Typography variant="h6" sx={{ color: '#ffffff' }}>
                          {crawlData.intelligence.credentials.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Credentials
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{ backgroundColor: 'rgba(255, 0, 100, 0.1)', border: '1px solid rgba(255, 0, 100, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Database size={24} style={{ color: '#00ff88', marginBottom: 8 }} />
                        <Typography variant="h6" sx={{ color: '#ffffff' }}>
                          {crawlData.intelligence.backupFiles.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Backup Files
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Discovered URLs */}
            <Accordion
              expanded={expandedPanel === 'urls'}
              onChange={handlePanelChange('urls')}
              sx={{
                backgroundColor: 'rgba(255, 0, 100, 0.05)',
                border: '1px solid rgba(255, 0, 100, 0.2)',
                mb: 1
              }}
            >
              <AccordionSummary expandIcon={<ChevronDown style={{ color: '#ff0064' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Globe size={20} style={{ color: '#ff0064' }} />
                  <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Discovered URLs ({crawlData.discoveredUrls.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {crawlData.discoveredUrls.slice(0, 50).map((target, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: `1px solid ${getPriorityColor(target.priority)}20`,
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: `${getPriorityColor(target.priority)}10`
                      }}
                    >
                      <ListItemIcon>
                        {getSeverityIcon(target.priority)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#ffffff', flex: 1 }}>
                              {target.url}
                            </Typography>
                            <Chip
                              label={target.source}
                              size="small"
                              sx={{
                                backgroundColor: getPriorityColor(target.priority),
                                color: '#000000',
                                fontSize: '10px'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Depth: {target.depth} | Priority: {target.priority}
                          </Typography>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(target.url)}
                        sx={{ color: '#ff0064' }}
                      >
                        <Copy size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => window.open(target.url, '_blank')}
                        sx={{ color: '#ff0064' }}
                      >
                        <ExternalLink size={16} />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Intelligence Data */}
            {crawlData.intelligence.credentials.length > 0 && (
              <Accordion
                expanded={expandedPanel === 'credentials'}
                onChange={handlePanelChange('credentials')}
                sx={{
                  backgroundColor: 'rgba(255, 0, 0, 0.05)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  mb: 1
                }}
              >
                <AccordionSummary expandIcon={<ChevronDown style={{ color: '#ff0000' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Key size={20} style={{ color: '#ff0000' }} />
                    <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                      Credential Leaks ({crawlData.intelligence.credentials.length})
                    </Typography>
                    <Chip
                      label="CRITICAL"
                      size="small"
                      sx={{ backgroundColor: '#ff0000', color: '#ffffff' }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {crawlData.intelligence.credentials.map((cred, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: '1px solid rgba(255, 0, 0, 0.3)',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: 'rgba(255, 0, 0, 0.1)'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                              {cred.type.toUpperCase()}: {cred.value}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Source: {cred.source}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                                Context: {cred.context.substring(0, 100)}...
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#ffaa00' }}>
                                Confidence: {cred.confidence}%
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(`${cred.type}: ${cred.value}`)}
                          sx={{ color: '#ff0000' }}
                        >
                          <Copy size={16} />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Wayback History */}
            {crawlData.intelligence.waybackHistory.length > 0 && (
              <Accordion
                expanded={expandedPanel === 'wayback'}
                onChange={handlePanelChange('wayback')}
                sx={{
                  backgroundColor: 'rgba(255, 100, 0, 0.05)',
                  border: '1px solid rgba(255, 100, 0, 0.2)',
                  mb: 1
                }}
              >
                <AccordionSummary expandIcon={<ChevronDown style={{ color: '#ff6400' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History size={20} style={{ color: '#ff6400' }} />
                    <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                      Wayback History ({crawlData.intelligence.waybackHistory.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {crawlData.intelligence.waybackHistory.slice(0, 20).map((snapshot, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: '1px solid rgba(255, 100, 0, 0.2)',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: 'rgba(255, 100, 0, 0.05)'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                              {snapshot.url}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {new Date(snapshot.timestamp).toLocaleDateString()} | 
                              Status: {snapshot.status} | 
                              Size: {(snapshot.length / 1024).toFixed(1)}KB
                            </Typography>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => window.open(`https://web.archive.org/web/${snapshot.timestamp}/${snapshot.url}`, '_blank')}
                          sx={{ color: '#ff6400' }}
                        >
                          <ExternalLink size={16} />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
