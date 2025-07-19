/**
 * NetRunner Intelligence Bridge Component
 * 
 * This component bridges NetRunner scan results with the RightSideBar visualization
 * using the enhanced Intel architecture integration.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { enhancedWebsiteScanner, EnhancedScanResult } from '../applications/netrunner/services/EnhancedWebsiteScanner';
import { useIntelBridge } from '../core/intel/hooks/useIntelBridge';

interface NetRunnerIntelligenceBridgeProps {
  onIntelGenerated?: (scanResult: EnhancedScanResult) => void;
  onVisualizationRequested?: (entities: any[], nodes: any[]) => void;
}

const NetRunnerIntelligenceBridge: React.FC<NetRunnerIntelligenceBridgeProps> = ({
  onIntelGenerated,
  onVisualizationRequested
}) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [scanResult, setScanResult] = useState<EnhancedScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use the Intel bridge for transformation and visualization
  const bridge = useIntelBridge({
    autoTransform: true,
    confidenceThreshold: 50,
    enableNodeGeneration: true,
    trackLineage: true
  });
  
  const handleScan = useCallback(async () => {
    if (!targetUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }
    
    setIsScanning(true);
    setError(null);
    setScanProgress(0);
    setScanMessage('Initializing scan...');
    
    try {
      // Run enhanced NetRunner scan with Intel generation
      const result = await enhancedWebsiteScanner.scan(
        targetUrl,
        (progress, message) => {
          setScanProgress(progress);
          setScanMessage(message);
        },
        {
          generateIntel: true,
          storeIntel: true,
          confidenceThreshold: 30
        }
      );
      
      setScanResult(result);
      
      // Transform Intel objects to entities using the bridge
      if (result.intelObjects.length > 0) {
        setScanMessage('Transforming to visualization entities...');
        
        // Use bridge to transform Intelligence objects to entities
        const entities = bridge.batchTransformIntelligence(result.intelligenceObjects);
        const nodes = bridge.batchGenerateNodes(result.intelligenceObjects);
        
        console.log(`🔄 Bridge transformed ${entities.length} entities and ${nodes.length} nodes`);
        
        // Notify parent components
        onIntelGenerated?.(result);
        onVisualizationRequested?.(entities, nodes);
      }
      
      setScanMessage('Scan completed successfully!');
      
    } catch (err) {
      console.error('NetRunner scan failed:', err);
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, [targetUrl, bridge, onIntelGenerated, onVisualizationRequested]);
  
  const handleVisualize = useCallback(() => {
    if (scanResult && bridge.entities.length > 0) {
      onVisualizationRequested?.(bridge.entities, bridge.nodes);
    }
  }, [scanResult, bridge.entities, bridge.nodes, onVisualizationRequested]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        NetRunner Intelligence Bridge
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Advanced OSINT collection with Intel architecture integration for enhanced visualization and analysis.
      </Typography>
      
      {/* Scan Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Target Analysis
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Target URL"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isScanning}
              variant="outlined"
            />
            
            <Button
              variant="contained"
              onClick={handleScan}
              disabled={isScanning || !targetUrl.trim()}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 120 }}
            >
              {isScanning ? 'Scanning...' : 'Scan'}
            </Button>
          </Box>
          
          {isScanning && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={scanProgress} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {scanMessage} ({scanProgress}%)
              </Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Bridge Statistics */}
      {bridge.stats.totalEntities > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bridge Statistics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {bridge.stats.totalEntities}
                  </Typography>
                  <Typography variant="caption">Entities</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {bridge.nodes.length}
                  </Typography>
                  <Typography variant="caption">Nodes</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {bridge.stats.averageConfidence}%
                  </Typography>
                  <Typography variant="caption">Avg Confidence</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {bridge.stats.transformationCount}
                  </Typography>
                  <Typography variant="caption">Transformations</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Reliability Distribution:
              </Typography>
              {Object.entries(bridge.stats.reliabilityDistribution).map(([rating, count]) => (
                <Chip 
                  key={rating}
                  label={`${rating}: ${count}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View in NodeWeb">
                <IconButton 
                  onClick={handleVisualize}
                  disabled={bridge.entities.length === 0}
                  color="primary"
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="View Timeline">
                <IconButton 
                  disabled={bridge.entities.length === 0}
                  color="secondary"
                >
                  <TimelineIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Storage Details">
                <IconButton color="info">
                  <StorageIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Scan Results */}
      {scanResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scan Results
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Traditional OSINT Data
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Emails: </Typography>
                  <Typography variant="body2">
                    {scanResult.osintData.emails.length} found
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Technologies: </Typography>
                  <Typography variant="body2">
                    {scanResult.osintData.technologies.length} detected
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Subdomains: </Typography>
                  <Typography variant="body2">
                    {scanResult.osintData.subdomains.length} discovered
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Vulnerabilities: </Typography>
                  <Typography variant="body2">
                    {scanResult.vulnerabilities.length} identified
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Enhanced Intel Architecture
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Intel Objects: </Typography>
                  <Typography variant="body2" color="primary">
                    {scanResult.intelObjects.length} generated
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Intelligence Objects: </Typography>
                  <Typography variant="body2" color="secondary">
                    {scanResult.intelligenceObjects.length} processed
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Quality Score: </Typography>
                  <Typography variant="body2" color="success.main">
                    {scanResult.bridgeMetadata.qualityScore}%
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Processing Duration: </Typography>
                  <Typography variant="body2">
                    {Math.round(scanResult.bridgeMetadata.processingDuration)}ms
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {scanResult.intelObjects.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="success.main">
                  ✅ Intel objects are now available for visualization in NodeWeb, Timeline, and Case Management
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default NetRunnerIntelligenceBridge;
