/**
 * Enhanced RightSideBar Integration Example
 * 
 * This demonstrates how to integrate the NetRunner Intelligence Bridge
 * with your existing RightSideBar component to display enhanced Intel data.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Badge,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Email as EmailIcon,
  Language as DomainIcon,
  Build as TechIcon,
  Timeline as TimelineIcon,
  Assessment as AnalysisIcon
} from '@mui/icons-material';
import NetRunnerIntelligenceBridge from './NetRunnerIntelligenceBridge';
import { useIntelBridge } from '../core/intel/hooks/useIntelBridge';
import { EnhancedScanResult } from '../applications/netrunner/services/EnhancedWebsiteScanner';

interface EnhancedRightSideBarProps {
  // Existing props from your RightSideBar
  width?: number;
  onVisualizationUpdate?: (entities: any[], nodes: any[]) => void;
}

const EnhancedRightSideBar: React.FC<EnhancedRightSideBarProps> = ({
  width = 400,
  onVisualizationUpdate
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [scanResult, setScanResult] = useState<EnhancedScanResult | null>(null);
  
  // Use Intel bridge for accessing transformed data
  const bridge = useIntelBridge({
    autoTransform: true,
    confidenceThreshold: 40,
    enableNodeGeneration: true
  });
  
  const handleIntelGenerated = useCallback((result: EnhancedScanResult) => {
    setScanResult(result);
    console.log('📊 Intel generated:', {
      intelObjects: result.intelObjects.length,
      intelligenceObjects: result.intelligenceObjects.length,
      bridgeEntities: bridge.entities.length,
      bridgeNodes: bridge.nodes.length
    });
  }, [bridge.entities.length, bridge.nodes.length]);
  
  const handleVisualizationRequested = useCallback((entities: any[], nodes: any[]) => {
    onVisualizationUpdate?.(entities, nodes);
    console.log('🎨 Visualization update requested:', { entities: entities.length, nodes: nodes.length });
  }, [onVisualizationUpdate]);
  
  const renderIntelEntities = () => {
    if (bridge.entities.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          No Intel entities available. Run a NetRunner scan to generate intelligence data.
        </Typography>
      );
    }
    
    // Group entities by type for better organization
    const entityGroups = bridge.entities.reduce((groups, entity) => {
      const type = entity.tags.find(tag => ['email', 'technology', 'subdomain', 'social-media'].includes(tag)) || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(entity);
      return groups;
    }, {} as Record<string, any[]>);
    
    return (
      <Box>
        {Object.entries(entityGroups).map(([type, entities]) => (
          <Box key={type} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {getTypeIcon(type)}
              {type.charAt(0).toUpperCase() + type.slice(1)} ({entities.length})
            </Typography>
            
            <List dense>
              {entities.map((entity, index) => (
                <ListItem key={entity.id || index} sx={{ pl: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                          {entity.title}
                        </Typography>
                        <Chip 
                          label={`${entity.confidence}%`}
                          size="small"
                          color={entity.confidence > 80 ? 'success' : entity.confidence > 60 ? 'warning' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Reliability: {entity.reliability} | Source: {entity.source}
                        </Typography>
                        {entity.osintMetadata && (
                          <Box sx={{ mt: 0.5 }}>
                            <Chip 
                              label={`Quality: ${entity.osintMetadata.qualityIndicators.accuracy}%`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5 }}
                            />
                            <Chip 
                              label={`Fresh: ${entity.osintMetadata.qualityIndicators.freshness}%`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            {type !== Object.keys(entityGroups)[Object.keys(entityGroups).length - 1] && <Divider />}
          </Box>
        ))}
      </Box>
    );
  };
  
  const renderAnalysisResults = () => {
    if (!scanResult) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          No analysis results available. Run a NetRunner scan to see detailed analysis.
        </Typography>
      );
    }
    
    return (
      <Box>
        {/* Quality Metrics */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Quality Metrics
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Overall Quality:</Typography>
                <Chip 
                  label={`${scanResult.bridgeMetadata.qualityScore}%`}
                  size="small"
                  color={scanResult.bridgeMetadata.qualityScore > 80 ? 'success' : 'warning'}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Average Confidence:</Typography>
                <Typography variant="caption">{bridge.stats.averageConfidence}%</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Processing Time:</Typography>
                <Typography variant="caption">
                  {Math.round(scanResult.bridgeMetadata.processingDuration)}ms
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        {/* Reliability Distribution */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Reliability Distribution
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(scanResult.bridgeMetadata.reliabilityDistribution).map(([rating, count]) => (
                <Chip 
                  key={rating}
                  label={`${rating}: ${count}`}
                  size="small"
                  variant="outlined"
                  color={rating === 'A' ? 'success' : rating === 'B' ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
        
        {/* Intelligence Summary */}
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Intelligence Summary
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={`${scanResult.osintData.emails.length} Email Contacts`}
                  secondary="Communication vectors identified"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><TechIcon fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={`${scanResult.osintData.technologies.length} Technologies`}
                  secondary="Infrastructure components detected"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><DomainIcon fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={`${scanResult.osintData.subdomains.length} Subdomains`}
                  secondary="Additional attack surfaces found"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={`${scanResult.vulnerabilities.length} Vulnerabilities`}
                  secondary="Security issues identified"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <EmailIcon fontSize="small" />;
      case 'technology': return <TechIcon fontSize="small" />;
      case 'subdomain': return <DomainIcon fontSize="small" />;
      case 'social-media': return <Timeline fontSize="small" />;
      default: return <SecurityIcon fontSize="small" />;
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box 
      sx={{ 
        width, 
        height: '100vh', 
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">
          Intelligence Dashboard
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Enhanced NetRunner with Intel Architecture
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={bridge.entities.length} color="primary">
                Intel
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={scanResult ? 1 : 0} color="secondary">
                Analysis
              </Badge>
            } 
          />
          <Tab label="Scanner" />
        </Tabs>
      </Box>
      
      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            {renderIntelEntities()}
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {renderAnalysisResults()}
          </Box>
        )}
        
        {activeTab === 2 && (
          <NetRunnerIntelligenceBridge
            onIntelGenerated={handleIntelGenerated}
            onVisualizationRequested={handleVisualizationRequested}
          />
        )}
      </Box>
    </Box>
  );
};

export default EnhancedRightSideBar;
