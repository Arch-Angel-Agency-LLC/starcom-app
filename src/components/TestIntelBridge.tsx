/**
 * TestIntelBridge Component
 * 
 * Simple test component to validate Intel-IntelEntity bridge functionality
 * This can be used to verify the integration is working correctly
 */

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { useIntelBridge } from '../core/intel/hooks/useIntelBridge';
import { Intel, Intelligence } from '../models/Intel/Intel';

const TestIntelBridge: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const bridge = useIntelBridge({
    autoTransform: true,
    confidenceThreshold: 0,
    enableNodeGeneration: true,
    trackLineage: true
  });
  
  // Sample test data
  const sampleIntel: Intel = {
    id: 'test-intel-001',
    source: 'OSINT',
    classification: 'UNCLASS',
    reliability: 'C',
    timestamp: Date.now(),
    collectedBy: 'test-collector',
    data: 'admin@target.com',
    tags: ['email', 'contact', 'administrative'],
    verified: false
  };
  
  const sampleIntelligence: Intelligence = {
    ...sampleIntel,
    id: 'test-intelligence-001',
    derivedFrom: {
      observations: ['obs-001'],
      rawData: ['raw-001']
    },
    confidence: 85,
    implications: ['Potential administrative access vector'],
    recommendations: ['Investigate administrative privileges', 'Check for privilege escalation']
  };
  
  const runBasicTest = () => {
    try {
      // Test Intel to Entity transformation
      const entity = bridge.transformIntelToEntity(sampleIntel);
      setTestResults(prev => [...prev, `✅ Intel to Entity: ${entity.title}`]);
      
      // Test Intelligence to Entity transformation  
      const intelligenceEntity = bridge.transformIntelligenceToEntity(sampleIntelligence);
      setTestResults(prev => [...prev, `✅ Intelligence to Entity: ${intelligenceEntity.title}`]);
      
      // Test Intelligence to Node transformation
      const node = bridge.transformIntelligenceToNode(sampleIntelligence);
      setTestResults(prev => [...prev, `✅ Intelligence to Node: ${node.displayOptions?.label}`]);
      
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Test failed: ${error}`]);
    }
  };
  
  const runBatchTest = () => {
    try {
      // Create multiple test intel objects
      const testIntel: Intel[] = [
        { ...sampleIntel, id: 'batch-001', data: 'user1@example.com', tags: ['email'] },
        { ...sampleIntel, id: 'batch-002', data: 'api.example.com', tags: ['domain', 'api'] },
        { ...sampleIntel, id: 'batch-003', data: '192.168.1.1', tags: ['ip-address', 'server'] }
      ];
      
      const entities = bridge.batchTransformIntel(testIntel);
      setTestResults(prev => [...prev, `✅ Batch Intel: Transformed ${entities.length} objects`]);
      
      // Test batch intelligence transformation
      const testIntelligence: Intelligence[] = testIntel.map(intel => ({
        ...intel,
        derivedFrom: { rawData: [intel.id] },
        confidence: 75,
        implications: [`Analysis of ${intel.data}`]
      }));
      
      const nodes = bridge.batchGenerateNodes(testIntelligence);
      setTestResults(prev => [...prev, `✅ Batch Nodes: Generated ${nodes.length} nodes`]);
      
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Batch test failed: ${error}`]);
    }
  };
  
  const testNetRunnerIntegration = () => {
    try {
      // Simulate NetRunner OSINT data
      const netrunnerData: Intel[] = [
        {
          id: 'netrunner-001',
          source: 'OSINT',
          classification: 'UNCLASS',
          reliability: 'C',
          timestamp: Date.now(),
          collectedBy: 'netrunner-websitescanner',
          data: 'contact@target.com',
          tags: ['email', 'contact', 'osint'],
          verified: false
        },
        {
          id: 'netrunner-002', 
          source: 'OSINT',
          classification: 'UNCLASS',
          reliability: 'B',
          timestamp: Date.now(),
          collectedBy: 'netrunner-websitescanner',
          data: 'api.target.com',
          tags: ['subdomain', 'infrastructure', 'osint'],
          verified: false
        }
      ];
      
      bridge.batchTransformIntel(netrunnerData);
      setTestResults(prev => [...prev, `✅ NetRunner Integration: Processed ${netrunnerData.length} OSINT items`]);
      
    } catch (error) {
      setTestResults(prev => [...prev, `❌ NetRunner integration failed: ${error}`]);
    }
  };
  
  const clearResults = () => {
    setTestResults([]);
    bridge.clearAll();
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Intel Bridge Integration Test
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test the integration between the new Intel architecture and existing IntelDataCore system.
      </Typography>
      
      {bridge.isTransforming && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption">Transforming data...</Typography>
        </Box>
      )}
      
      <Grid container spacing={3}>
        {/* Test Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Controls
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={runBasicTest}
                  disabled={bridge.isTransforming}
                >
                  Run Basic Transformation Test
                </Button>
                
                <Button 
                  variant="contained" 
                  onClick={runBatchTest}
                  disabled={bridge.isTransforming}
                >
                  Run Batch Processing Test
                </Button>
                
                <Button 
                  variant="contained" 
                  onClick={testNetRunnerIntegration}
                  disabled={bridge.isTransforming}
                >
                  Test NetRunner Integration
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={clearResults}
                >
                  Clear Results
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Total Entities: <strong>{bridge.stats.totalEntities}</strong>
                </Typography>
                
                <Typography variant="body2">
                  Total Nodes: <strong>{bridge.nodes.length}</strong>
                </Typography>
                
                <Typography variant="body2">
                  Average Confidence: <strong>{bridge.stats.averageConfidence}%</strong>
                </Typography>
                
                <Typography variant="body2">
                  Transformations: <strong>{bridge.stats.transformationCount}</strong>
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Reliability Distribution:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.entries(bridge.stats.reliabilityDistribution).map(([rating, count]) => (
                      <Chip 
                        key={rating}
                        label={`${rating}: ${count}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Test Results */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              
              {bridge.transformationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {bridge.transformationErrors.length} error(s) occurred during transformation
                </Alert>
              )}
              
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {testResults.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No test results yet. Run a test to see results.
                  </Typography>
                ) : (
                  testResults.map((result, index) => (
                    <Typography 
                      key={index} 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        py: 0.5,
                        color: result.includes('❌') ? 'error.main' : 'success.main'
                      }}
                    >
                      {result}
                    </Typography>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Current Entities Preview */}
        {bridge.entities.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Entities ({bridge.entities.length})
                </Typography>
                
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {bridge.entities.map((entity, index) => (
                    <Box key={entity.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {entity.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {entity.id} | Confidence: {entity.confidence}% | 
                        Reliability: {entity.reliability} | Source: {entity.source}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TestIntelBridge;
