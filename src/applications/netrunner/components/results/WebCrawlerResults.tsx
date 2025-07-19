/**
 * Web Crawler Scan Results Visualization
 * 
 * Comprehensive visualization of discovered pathways, intel opportunities,
 * and navigation routes for NetRunner web crawling operations.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  LinearProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Collapse
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import {
  Globe,
  FileText,
  Database,
  Lock,
  Unlock,
  Eye,
  Download,
  Shield,
  AlertTriangle,
  ExternalLink,
  Folder,
  File,
  Search,
  Users,
  Mail,
  Terminal,
  Key,
  Filter,
  ArrowUpDown,
  Zap
} from 'lucide-react';

// NetRunner services
import { websiteScanner, ScanResult as ServiceScanResult } from '../../services/WebsiteScanner';

interface ScanResult {
  id: string;
  url: string;
  type: 'page' | 'directory' | 'file' | 'api' | 'form' | 'admin' | 'login' | 'database';
  status: number;
  title?: string;
  description?: string;
  size?: number;
  lastModified?: Date;
  security: 'open' | 'protected' | 'restricted' | 'vulnerable';
  intelValue: 'low' | 'medium' | 'high' | 'critical';
  discoveredAt: Date;
  parentUrl?: string;
  depth: number;
  technologies?: string[];
  credentials?: boolean;
  personalInfo?: boolean;
  adminAccess?: boolean;
  apiEndpoints?: number;
  forms?: number;
  emails?: string[];
  phones?: string[];
  socialLinks?: string[];
  metadata?: Record<string, string>;
}

interface PathwayGroup {
  category: string;
  icon: string;
  count: number;
  intelValue: 'low' | 'medium' | 'high' | 'critical';
  results: ScanResult[];
}

interface WebCrawlerResultsProps {
  targetUrl: string;
  isScanning: boolean;
  progress: number;
  onNavigate: (url: string) => void;
  onDeepScan: (url: string) => void;
  onExportResults: () => void;
}

const WebCrawlerResults: React.FC<WebCrawlerResultsProps> = ({
  targetUrl,
  isScanning,
  progress,
  onNavigate,
  onDeepScan,
  onExportResults
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['high-value']);

  // Advanced filtering and sorting state
  const [filterBy, setFilterBy] = useState<'all' | 'critical' | 'high' | 'vulnerable'>('all');
  const [sortBy, setSortBy] = useState<'intelValue' | 'depth' | 'discovered' | 'threat'>('intelValue');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Real-time threat assessment
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);

  // Real scan results state
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  // Adapter to convert service scan results to UI format
  const adaptServiceScanResult = (serviceScan: ServiceScanResult, index: number): ScanResult => {
    // Extract intel value based on vulnerabilities
    const criticalVulns = serviceScan.vulnerabilities?.filter(v => v.severity === 'critical') || [];
    const highVulns = serviceScan.vulnerabilities?.filter(v => v.severity === 'high') || [];
    
    let intelValue: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalVulns.length > 0) intelValue = 'critical';
    else if (highVulns.length > 0) intelValue = 'high';
    else if (serviceScan.vulnerabilities?.length > 0) intelValue = 'medium';

    // Determine type based on URL and technologies
    let type: ScanResult['type'] = 'page';
    const url = serviceScan.url.toLowerCase();
    if (url.includes('/admin') || url.includes('/dashboard')) type = 'admin';
    else if (url.includes('/api/')) type = 'api';
    else if (url.includes('/login')) type = 'login';
    else if (url.includes('/database') || url.includes('/db')) type = 'database';
    else if (url.includes('/upload') || url.includes('/form')) type = 'form';
    else if (url.endsWith('/')) type = 'directory';

    // Determine security status
    let security: 'open' | 'protected' | 'vulnerable' = 'protected';
    if (serviceScan.vulnerabilities?.length > 0) security = 'vulnerable';
    else if (url.includes('/public') || url.includes('/open')) security = 'open';

    return {
      id: `scan-${index}`,
      url: serviceScan.url,
      type,
      status: serviceScan.status === 'error' ? 404 : 200,
      title: serviceScan.title || 'Unknown Page',
      security,
      intelValue,
      discoveredAt: new Date(serviceScan.timestamp),
      depth: 1,
      technologies: serviceScan.osintData?.technologies?.map(t => t.name) || [],
      // Additional data based on type
      ...(type === 'admin' && { adminAccess: security === 'vulnerable' }),
      ...(type === 'api' && { 
        apiEndpoints: serviceScan.osintData?.technologies?.length || 0,
        personalInfo: serviceScan.osintData?.emails?.length > 0
      }),
      ...(serviceScan.vulnerabilities?.length > 0 && { 
        vulnerabilities: serviceScan.vulnerabilities.length 
      })
    };
  };

  // Scan function
  const performScan = React.useCallback(async (targetUrl: string) => {
    if (!targetUrl || isScanning) return;
    
    try {
      // Use the websiteScanner service to scan the target URL
      const scanResult = await websiteScanner.scanWebsite(targetUrl, (progressValue, status) => {
        // Progress callback - the parent component manages the progress state
        console.log(`Scan progress: ${progressValue}% - ${status}`);
      });
      
      // Convert the single scan result to our UI format
      const adaptedResult = adaptServiceScanResult(scanResult, 0);
      setScanResults([adaptedResult]);
      
    } catch (error) {
      console.error('Error scanning website:', error);
      setScanResults([]);
    }
  }, [isScanning]);

  // Trigger scan when targetUrl changes
  React.useEffect(() => {
    if (targetUrl && targetUrl.startsWith('http') && !isScanning) {
      performScan(targetUrl);
    }
  }, [targetUrl, performScan, isScanning]);

  // Grouping and filtering logic
  const groupResultsByCategory = (results: ScanResult[] = filteredResults): PathwayGroup[] => {
    const groups: Record<string, PathwayGroup> = {};

    results.forEach(result => {
      let category: string;
      let icon: string;

      switch (result.type) {
        case 'admin':
          category = 'Admin Panels';
          icon = 'shield';
          break;
        case 'api':
          category = 'API Endpoints';
          icon = 'terminal';
          break;
        case 'database':
          category = 'Databases';
          icon = 'database';
          break;
        case 'login':
          category = 'Login Pages';
          icon = 'key';
          break;
        case 'directory':
          category = 'Directories';
          icon = 'folder';
          break;
        case 'file':
          category = 'Files';
          icon = 'file';
          break;
        case 'form':
          category = 'Forms';
          icon = 'fileText';
          break;
        default:
          category = 'Web Pages';
          icon = 'globe';
      }

      if (!groups[category]) {
        groups[category] = {
          category,
          icon,
          count: 0,
          intelValue: 'low',
          results: []
        };
      }

      groups[category].results.push(result);
      groups[category].count++;

      // Update intel value to highest in group
      const valueOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      if (valueOrder[result.intelValue] > valueOrder[groups[category].intelValue]) {
        groups[category].intelValue = result.intelValue;
      }
    });

    return Object.values(groups);
  };

  const getIntelValueColor = (value: string) => {
    switch (value) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#ffffff';
    }
  };

  const getSecurityColor = (security: string) => {
    switch (security) {
      case 'vulnerable': return '#ff4444';
      case 'restricted': return '#ff8800';
      case 'protected': return '#ffaa00';
      case 'open': return '#00ff88';
      default: return '#ffffff';
    }
  };

  const getSecurityIcon = (security: string) => {
    switch (security) {
      case 'vulnerable': return <AlertTriangle size={16} />;
      case 'restricted': return <Lock size={16} />;
      case 'protected': return <Shield size={16} />;
      case 'open': return <Unlock size={16} />;
      default: return <Eye size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'admin': return <Shield size={16} />;
      case 'api': return <Terminal size={16} />;
      case 'database': return <Database size={16} />;
      case 'login': return <Key size={16} />;
      case 'directory': return <Folder size={16} />;
      case 'file': return <File size={16} />;
      case 'form': return <FileText size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  // Calculate real-time threat scores for each result
  const calculateThreatScore = (result: ScanResult): number => {
    let score = 0;
    
    // Intel value scoring
    const intelScores = { low: 1, medium: 3, high: 7, critical: 10 };
    score += intelScores[result.intelValue];
    
    // Security status scoring
    const securityScores = { open: 1, protected: 3, restricted: 5, vulnerable: 10 };
    score += securityScores[result.security];
    
    // Content-based scoring
    if (result.credentials) score += 8;
    if (result.adminAccess) score += 9;
    if (result.personalInfo) score += 6;
    if (result.apiEndpoints && result.apiEndpoints > 5) score += 4;
    
    // Depth penalty (deeper findings are often more valuable)
    score += Math.max(0, 5 - result.depth);
    
    return Math.min(score, 10); // Cap at 10
  };

  // Filter and sort results based on current settings
  const getFilteredAndSortedResults = (): ScanResult[] => {
    let filtered = [...scanResults];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result => 
        result.url.toLowerCase().includes(query) ||
        result.title?.toLowerCase().includes(query) ||
        result.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (filterBy !== 'all') {
      if (filterBy === 'vulnerable') {
        filtered = filtered.filter(result => result.security === 'vulnerable');
      } else {
        filtered = filtered.filter(result => result.intelValue === filterBy);
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'threat':
          return calculateThreatScore(b) - calculateThreatScore(a);
        case 'intelValue': {
          const intelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          return intelOrder[b.intelValue] - intelOrder[a.intelValue];
        }
        case 'depth':
          return a.depth - b.depth;
        case 'discovered':
          return b.discoveredAt.getTime() - a.discoveredAt.getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Update threat assessment when results change
  // Get filtered results for display
  const filteredResults = getFilteredAndSortedResults();

  const pathwayGroups = groupResultsByCategory(filteredResults);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: "'Aldrich', 'Courier New', monospace",
      fontSize: '0.75rem'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 0.75, 
        borderBottom: '1px solid #00f5ff',
        backgroundColor: '#000000'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h6" sx={{ 
            color: '#00f5ff', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontFamily: "'Aldrich', monospace",
            fontSize: '0.8rem',
            fontWeight: 400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            <Search size={16} />
            SCAN_RESULTS
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <Tooltip title="Toggle Advanced Filters">
              <IconButton 
                size="small" 
                sx={{ 
                  color: showAdvancedFilters ? '#00f5ff' : '#ffffff',
                  p: 0.25,
                  minWidth: 'auto',
                  width: 24,
                  height: 24,
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 245, 255, 0.1)',
                    color: '#00f5ff'
                  }
                }}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sort Results">
              <IconButton size="small" sx={{ 
                color: '#ffffff',
                p: 0.25,
                minWidth: 'auto',
                width: 24,
                height: 24,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}>
                <ArrowUpDown size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Results">
              <IconButton size="small" sx={{ 
                color: '#00ff88',
                p: 0.25,
                minWidth: 'auto',
                width: 24,
                height: 24,
                '&:hover': { backgroundColor: 'rgba(0, 255, 136, 0.1)' }
              }} onClick={onExportResults}>
                <Download size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title={`AI Analysis: ${aiAnalysisEnabled ? 'ON' : 'OFF'}`}>
              <IconButton 
                size="small" 
                sx={{ 
                  color: aiAnalysisEnabled ? '#00f5ff' : '#666666',
                  p: 0.25,
                  minWidth: 'auto',
                  width: 24,
                  height: 24,
                  '&:hover': { 
                    backgroundColor: aiAnalysisEnabled ? 'rgba(0, 245, 255, 0.1)' : 'rgba(102, 102, 102, 0.1)'
                  }
                }}
                onClick={() => setAiAnalysisEnabled(!aiAnalysisEnabled)}
              >
                <Zap size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Target URL */}
        <Typography variant="body2" sx={{ 
          color: '#aaaaaa', 
          mb: 0.5,
          fontFamily: "'Courier New', monospace",
          fontSize: '0.7rem'
        }}>
          TARGET: {targetUrl}
        </Typography>

        {/* Progress Bar */}
        {isScanning && (
          <Box sx={{ mb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" sx={{ 
                color: '#00f5ff',
                fontFamily: "'Aldrich', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.05em'
              }}>
                SCANNING...
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#00f5ff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.65rem'
              }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 2,
                backgroundColor: '#111111',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#00f5ff'
                }
              }}
            />
          </Box>
        )}

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={`${filteredResults.length} PATHS`}
            size="small"
            sx={{ 
              backgroundColor: 'rgba(0, 245, 255, 0.15)', 
              color: '#00f5ff',
              fontFamily: "'Aldrich', monospace",
              fontSize: '0.6rem',
              height: 20,
              '& .MuiChip-label': { px: 0.75, py: 0 }
            }}
          />
          <Chip
            label={`${filteredResults.filter(r => r.intelValue === 'critical').length} CRIT`}
            size="small"
            sx={{ 
              backgroundColor: 'rgba(255, 68, 68, 0.15)', 
              color: '#ff4444',
              fontFamily: "'Aldrich', monospace",
              fontSize: '0.6rem',
              height: 20,
              '& .MuiChip-label': { px: 0.75, py: 0 }
            }}
          />
          <Chip
            label={`${filteredResults.filter(r => r.security === 'vulnerable').length} VULN`}
            size="small"
            sx={{ 
              backgroundColor: 'rgba(255, 136, 0, 0.15)', 
              color: '#ff8800',
              fontFamily: "'Aldrich', monospace",
              fontSize: '0.6rem',
              height: 20,
              '& .MuiChip-label': { px: 0.75, py: 0 }
            }}
          />
          {aiAnalysisEnabled && (
            <Chip
              label={`THR: ${(filteredResults.reduce((sum, r) => sum + calculateThreatScore(r), 0) / filteredResults.length || 0).toFixed(1)}`}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(0, 255, 136, 0.15)', 
                color: '#00ff88',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.6rem',
                height: 20,
                '& .MuiChip-label': { px: 0.75, py: 0 }
              }}
            />
          )}
        </Box>

        {/* Advanced Filters Panel */}
        <Collapse in={showAdvancedFilters}>
          <Box sx={{ 
            mt: 0.5, 
            p: 0.75, 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #00f5ff',
            borderRadius: 0
          }}>
            <Typography variant="subtitle2" sx={{ 
              color: '#00f5ff', 
              mb: 0.75,
              fontFamily: "'Aldrich', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              ADV_FILTERS
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Field */}
              <TextField
                size="small"
                placeholder="Search URLs, titles, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                  minWidth: '200px',
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.7rem',
                    height: 28,
                    '& fieldset': { borderColor: '#333333', borderRadius: 0 },
                    '&:hover fieldset': { borderColor: '#555555' },
                    '&.Mui-focused fieldset': { borderColor: '#00f5ff' }
                  },
                  '& .MuiInputLabel-root': { color: '#aaaaaa' },
                  '& .MuiInputBase-input': { py: 0.5 }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={14} color="#aaaaaa" />
                    </InputAdornment>
                  )
                }}
              />

              {/* Filter by Category */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ 
                  color: '#aaaaaa',
                  fontFamily: "'Aldrich', monospace",
                  fontSize: '0.65rem'
                }}>FILTER</InputLabel>
                <Select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                  sx={{
                    color: '#ffffff',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.7rem',
                    height: 28,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333', borderRadius: 0 },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00f5ff' }
                  }}
                >
                  <MenuItem value="all" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>ALL</MenuItem>
                  <MenuItem value="critical" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>CRITICAL</MenuItem>
                  <MenuItem value="high" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>HIGH</MenuItem>
                  <MenuItem value="vulnerable" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>VULNERABLE</MenuItem>
                </Select>
              </FormControl>

              {/* Sort by */}
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel sx={{ 
                  color: '#aaaaaa',
                  fontFamily: "'Aldrich', monospace",
                  fontSize: '0.65rem'
                }}>SORT</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  sx={{
                    color: '#ffffff',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.7rem',
                    height: 28,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333', borderRadius: 0 },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00f5ff' }
                  }}
                >
                  <MenuItem value="threat" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>THREAT</MenuItem>
                  <MenuItem value="intelValue" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>INTEL</MenuItem>
                  <MenuItem value="depth" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>DEPTH</MenuItem>
                  <MenuItem value="discovered" sx={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>TIME</MenuItem>
                </Select>
              </FormControl>

              {/* AI Analysis Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={aiAnalysisEnabled}
                    onChange={(e) => setAiAnalysisEnabled(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#00f5ff' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00f5ff' },
                      '& .MuiSwitch-track': { backgroundColor: '#333333' }
                    }}
                  />
                }
                label="AI_THREAT"
                sx={{ 
                  color: '#ffffff',
                  fontFamily: "'Aldrich', monospace",
                  fontSize: '0.65rem',
                  '& .MuiFormControlLabel-label': { fontSize: '0.65rem' }
                }}
              />
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Results Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 0.5,
        backgroundColor: '#000000'
      }}>
        {pathwayGroups.map((group) => (
          <Card
            key={group.category}
            sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #333333',
              borderRadius: 0,
              mb: 0.5,
              '&:last-child': { mb: 0 }
            }}
          >
            <Accordion
              expanded={expandedGroups.includes(group.category)}
              onChange={() => toggleGroup(group.category)}
              sx={{
                backgroundColor: 'transparent',
                boxShadow: 'none',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#ffffff', fontSize: '1rem' }} />}
                sx={{
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  minHeight: 36,
                  '& .MuiAccordionSummary-content': { 
                    margin: '6px 0',
                    '&.Mui-expanded': { margin: '6px 0' }
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                  <Box sx={{ color: getIntelValueColor(group.intelValue) }}>
                    {group.icon === 'shield' && <Shield size={16} />}
                    {group.icon === 'terminal' && <Terminal size={16} />}
                    {group.icon === 'database' && <Database size={16} />}
                    {group.icon === 'key' && <Key size={16} />}
                    {group.icon === 'folder' && <Folder size={16} />}
                    {group.icon === 'file' && <File size={16} />}
                    {group.icon === 'fileText' && <FileText size={16} />}
                    {group.icon === 'globe' && <Globe size={16} />}
                  </Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: '#ffffff', 
                    flex: 1,
                    fontFamily: "'Aldrich', monospace",
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {group.category}
                  </Typography>
                  <Badge
                    badgeContent={group.count}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: getIntelValueColor(group.intelValue),
                        color: '#000000',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.6rem',
                        minWidth: 16,
                        height: 16,
                        borderRadius: 0
                      }
                    }}
                  >
                    <Box />
                  </Badge>
                  <Chip
                    label={group.intelValue.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: `${getIntelValueColor(group.intelValue)}15`,
                      color: getIntelValueColor(group.intelValue),
                      fontFamily: "'Aldrich', monospace",
                      fontSize: '0.6rem',
                      height: 18,
                      '& .MuiChip-label': { px: 0.5, py: 0 },
                      borderRadius: 0,
                      textTransform: 'uppercase'
                    }}
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 0 }}>
                <List sx={{ p: 0 }}>
                  {group.results.map((result) => (
                    <React.Fragment key={result.id}>
                      <ListItem
                        sx={{
                          backgroundColor: '#111111',
                          borderRadius: 0,
                          mb: 0.25,
                          border: '1px solid #333333',
                          cursor: 'pointer',
                          py: 0.5,
                          px: 0.75,
                          transition: 'all 0.1s ease',
                          '&:hover': {
                            backgroundColor: '#1a1a1a',
                            borderColor: '#00f5ff',
                            borderLeft: '3px solid #00f5ff'
                          }
                        }}
                        onClick={() => onNavigate(result.url)}
                      >
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                          {getTypeIcon(result.type)}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#ffffff',
                                  fontFamily: "'Courier New', monospace",
                                  fontSize: '0.7rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}
                              >
                                {result.url}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.25 }}>
                                <Chip
                                  label={result.status}
                                  size="small"
                                  sx={{
                                    backgroundColor: result.status === 200 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 68, 0.15)',
                                    color: result.status === 200 ? '#00ff88' : '#ff4444',
                                    fontFamily: "'Courier New', monospace",
                                    fontSize: '0.6rem',
                                    height: '16px',
                                    borderRadius: 0,
                                    '& .MuiChip-label': { px: 0.5, py: 0 }
                                  }}
                                />
                                <Box sx={{ color: getSecurityColor(result.security) }}>
                                  {getSecurityIcon(result.security)}
                                </Box>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              {result.title && (
                                <Typography variant="caption" sx={{ 
                                  color: '#aaaaaa',
                                  fontFamily: "'Courier New', monospace",
                                  fontSize: '0.65rem'
                                }}>
                                  {result.title}
                                </Typography>
                              )}
                              
                              {/* Intel Indicators */}
                              <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap' }}>
                                {result.credentials && (
                                  <Chip
                                    icon={<Key size={10} />}
                                    label="CREDS"
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255, 68, 68, 0.2)',
                                      color: '#ff4444',
                                      fontSize: '0.65rem',
                                      height: '18px'
                                    }}
                                  />
                                )}
                                {result.personalInfo && (
                                  <Chip
                                    icon={<Users size={12} />}
                                    label="Personal Data"
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255, 136, 0, 0.2)',
                                      color: '#ff8800',
                                      fontSize: '0.65rem',
                                      height: '18px'
                                    }}
                                  />
                                )}
                                {result.adminAccess && (
                                  <Chip
                                    icon={<Shield size={12} />}
                                    label="Admin Access"
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255, 68, 68, 0.2)',
                                      color: '#ff4444',
                                      fontSize: '0.65rem',
                                      height: '18px'
                                    }}
                                  />
                                )}
                                {result.apiEndpoints && (
                                  <Chip
                                    icon={<Terminal size={12} />}
                                    label={`${result.apiEndpoints} APIs`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(0, 245, 255, 0.2)',
                                      color: '#00f5ff',
                                      fontSize: '0.65rem',
                                      height: '18px'
                                    }}
                                  />
                                )}
                                {result.emails && result.emails.length > 0 && (
                                  <Chip
                                    icon={<Mail size={12} />}
                                    label={`${result.emails.length} Emails`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(0, 255, 136, 0.2)',
                                      color: '#00ff88',
                                      fontSize: '0.65rem',
                                      height: '18px'
                                    }}
                                  />
                                )}
                                <Chip
                                  label={`Depth: ${result.depth}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(170, 170, 170, 0.2)',
                                    color: '#aaaaaa',
                                    fontSize: '0.65rem',
                                    height: '18px'
                                  }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                          <Tooltip title="Deep Scan">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeepScan(result.url);
                              }}
                              sx={{ color: '#00f5ff' }}
                            >
                              <Zap size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open in New Tab">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(result.url, '_blank');
                              }}
                              sx={{ color: '#ffffff' }}
                            >
                              <ExternalLink size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default WebCrawlerResults;
