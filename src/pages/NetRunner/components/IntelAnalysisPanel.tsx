/**
 * IntelAnalysisPanel.tsx
 * 
 * Component for analyzing and processing intelligence data using the Intel Analyzer.
 * This component integrates with the IntelAnalyzerAdapter to transform raw data into 
 * structured intelligence packages.
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  CircularProgress, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Chip,
  Alert
} from '@mui/material';
import { 
  FileSearch, 
  Brain, 
  BarChart2, 
  Network, 
  Lock, 
  FileCheck,
  AlertTriangle,
  Check,
  FileText
} from 'lucide-react';

import { 
  useToolExecution
} from '../hooks/useToolExecution';
import { IntelPackageType, IntelAnalysisResult } from '../tools/adapters/IntelAnalyzerAdapter';
import { ClassificationLevel } from '../models/IntelReport';
import { SearchResult } from '../types/netrunner';
import IntelResultsViewer from './IntelResultsViewer';

interface IntelAnalysisPanelProps {
  searchResults?: SearchResult[];
  rawData?: Record<string, unknown>;
  onPackageCreated?: (result: IntelAnalysisResult) => void;
}

/**
 * Panel for analyzing and processing intelligence data
 */
const IntelAnalysisPanel: React.FC<IntelAnalysisPanelProps> = ({
  searchResults = [],
  rawData = {},
  onPackageCreated
}) => {
  // Analysis configuration
  const [packageType, setPackageType] = useState<IntelPackageType>('entity_extraction');
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'deep'>('standard');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.65);
  const [includeRawData, setIncludeRawData] = useState<boolean>(false);
  const [classification, setClassification] = useState<ClassificationLevel>('UNCLASSIFIED');
  
  // Analysis data source
  const [useSearchResults, setUseSearchResults] = useState<boolean>(true);
  
  // Combined data for analysis
  const [dataForAnalysis, setDataForAnalysis] = useState<Record<string, unknown>>({});
  
  // Tool execution state
  const [toolParameters, setToolParameters] = useState<Record<string, unknown>>({});
  const {
    executionState,
    isLoading: isExecuting,
    executeTool: execute,
    resetExecution: clearExecution
  } = useToolExecution('intel-analyzer', toolParameters);
  
  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<IntelAnalysisResult | null>(null);
  
  // Update data for analysis whenever inputs change
  useEffect(() => {
    if (useSearchResults && searchResults.length > 0) {
      setDataForAnalysis({
        searchResults,
        queryString: searchResults.length > 0 && 'query' in searchResults[0] 
          ? (searchResults[0] as Record<string, string>).query 
          : '',
        timestamp: new Date().toISOString()
      });
    } else {
      setDataForAnalysis({
        ...rawData,
        timestamp: new Date().toISOString()
      });
    }
  }, [useSearchResults, searchResults, rawData]);
  
  // Handle package type change
  const handlePackageTypeChange = (event: SelectChangeEvent<string>) => {
    setPackageType(event.target.value as IntelPackageType);
  };
  
  // Handle analysis depth change
  const handleAnalysisDepthChange = (event: SelectChangeEvent<string>) => {
    setAnalysisDepth(event.target.value as 'basic' | 'standard' | 'deep');
  };
  
  // Handle confidence threshold change
  const handleConfidenceThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setConfidenceThreshold(value);
    }
  };
  
  // Handle include raw data change
  const handleIncludeRawDataChange = () => {
    setIncludeRawData(!includeRawData);
  };
  
  // Handle classification change
  const handleClassificationChange = (event: SelectChangeEvent<string>) => {
    setClassification(event.target.value as ClassificationLevel);
  };
  
  // Handle data source change
  const handleDataSourceChange = () => {
    setUseSearchResults(!useSearchResults);
  };
  
  // Run the analysis
  const runAnalysis = async () => {
    if (Object.keys(dataForAnalysis).length === 0) {
      console.error('No data available for analysis');
      return;
    }
    
    try {
      // Update parameters in the tool execution hook first
      setToolParameters({
        data: dataForAnalysis,
        packageType,
        analysisDepth,
        confidenceThreshold,
        includeRawData,
        classificationLevel: classification
      });
      
      // Then execute the tool with the updated parameters
      setTimeout(() => {
        execute();
      }, 0);
    } catch (error) {
      console.error('Error executing Intel Analyzer:', error);
    }
  };
  
  // Update analysis result when execution completes
  useEffect(() => {
    if (executionState && executionState.status === 'completed' && executionState.result) {
      setAnalysisResult(executionState.result as IntelAnalysisResult);
      
      // Call the callback if provided
      if (onPackageCreated) {
        onPackageCreated(executionState.result as IntelAnalysisResult);
      }
    }
  }, [executionState, onPackageCreated]);
  
  // Reset analysis
  const resetAnalysis = () => {
    setAnalysisResult(null);
    clearExecution();
  };
  
  // Data available indicator
  const dataAvailable = 
    (useSearchResults && searchResults.length > 0) || 
    (!useSearchResults && Object.keys(rawData).length > 0);
  
  // Export analysis result
  const exportAnalysis = (format: 'json' | 'csv' | 'pdf' = 'json') => {
    if (!analysisResult) return;
    
    try {
      let exportData: string;
      let mimeType: string;
      let fileName: string;
      
      switch (format) {
        case 'json':
          exportData = JSON.stringify(analysisResult, null, 2);
          mimeType = 'application/json';
          fileName = `intel-analysis-${analysisResult.packageType}-${new Date().toISOString().slice(0, 10)}.json`;
          break;
        case 'csv': {
          // Simple CSV export of entities
          const headers = ['id', 'name', 'type', 'confidence', 'sources'];
          const rows = analysisResult.entities.map(entity => 
            [entity.id, entity.name, entity.type, entity.confidence.toString(), entity.sources.join(',')]
          );
          exportData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
          mimeType = 'text/csv';
          fileName = `intel-analysis-${analysisResult.packageType}-${new Date().toISOString().slice(0, 10)}.csv`;
          break;
        }
        case 'pdf':
          // For PDF we would need a PDF generation library, so we'll just alert the user
          alert('PDF export would be implemented with a PDF generation library');
          return;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Create a blob and download link
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analysis:', error);
      alert('Failed to export analysis');
    }
  };
  
  // Render analysis configuration
  const renderAnalysisConfig = () => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flexBasis: '48%', minWidth: '250px' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Package Type</InputLabel>
            <Select
              value={packageType}
              label="Package Type"
              onChange={handlePackageTypeChange}
            >
              <MenuItem value="entity_extraction">Entity Extraction</MenuItem>
              <MenuItem value="relationship_mapping">Relationship Mapping</MenuItem>
              <MenuItem value="threat_assessment">Threat Assessment</MenuItem>
              <MenuItem value="vulnerability_report">Vulnerability Report</MenuItem>
              <MenuItem value="identity_profile">Identity Profile</MenuItem>
              <MenuItem value="network_mapping">Network Mapping</MenuItem>
              <MenuItem value="infrastructure_analysis">Infrastructure Analysis</MenuItem>
              <MenuItem value="financial_intelligence">Financial Intelligence</MenuItem>
              <MenuItem value="temporal_analysis">Temporal Analysis</MenuItem>
              <MenuItem value="geospatial_mapping">Geospatial Mapping</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ flexBasis: '48%', minWidth: '250px' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Analysis Depth</InputLabel>
            <Select
              value={analysisDepth}
              label="Analysis Depth"
              onChange={handleAnalysisDepthChange}
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="deep">Deep</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ flexBasis: '48%', minWidth: '250px' }}>
          <TextField
            fullWidth
            label="Confidence Threshold"
            type="number"
            inputProps={{ min: 0, max: 1, step: 0.05 }}
            value={confidenceThreshold}
            onChange={handleConfidenceThresholdChange}
            sx={{ mb: 2 }}
          />
        </Box>
        
        <Box sx={{ flexBasis: '48%', minWidth: '250px' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Classification</InputLabel>
            <Select
              value={classification}
              label="Classification"
              onChange={handleClassificationChange}
            >
              <MenuItem value="UNCLASSIFIED">UNCLASSIFIED</MenuItem>
              <MenuItem value="CONFIDENTIAL">CONFIDENTIAL</MenuItem>
              <MenuItem value="SECRET">SECRET</MenuItem>
              <MenuItem value="TOP_SECRET">TOP SECRET</MenuItem>
              <MenuItem value="COSMIC">COSMIC</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button
              variant="outlined"
              color={useSearchResults ? 'primary' : 'secondary'}
              onClick={handleDataSourceChange}
              startIcon={useSearchResults ? <FileSearch size={16} /> : <FileCheck size={16} />}
            >
              Using {useSearchResults ? 'Search Results' : 'Raw Data'}
            </Button>
            
            <Button
              variant="outlined"
              color={includeRawData ? 'primary' : 'secondary'}
              onClick={handleIncludeRawDataChange}
              startIcon={includeRawData ? <Check size={16} /> : <AlertTriangle size={16} />}
            >
              {includeRawData ? 'Include Raw Data' : 'Exclude Raw Data'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ mb: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <Brain size={20} style={{ marginRight: '8px' }} />
            Intelligence Analysis
          </Typography>
          
          <Box>
            {analysisResult ? (
              <Button 
                variant="outlined"
                color="secondary"
                onClick={resetAnalysis}
              >
                New Analysis
              </Button>
            ) : (
              <Button 
                variant="contained"
                color="primary"
                onClick={runAnalysis}
                disabled={isExecuting || !dataAvailable}
                startIcon={isExecuting ? <CircularProgress size={16} /> : <BarChart2 size={16} />}
              >
                {isExecuting ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            )}
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Process raw intelligence data into structured intelligence packages using advanced analytics.
          These packages can be used for reporting, marketplace listings, or further analysis.
        </Typography>
        
        {!dataAvailable && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No data available for analysis. Please perform a search or provide raw data.
          </Alert>
        )}
        
        {!analysisResult && renderAnalysisConfig()}
        
        {isExecuting && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Analyzing data using {packageType.replace('_', ' ')} at {analysisDepth} depth...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take a few moments
            </Typography>
          </Box>
        )}
        
        {executionState && executionState.status === 'failed' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {executionState.error || 'Analysis failed for unknown reasons. Please try again.'}
          </Alert>
        )}
        
        {analysisResult && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">Analysis Results</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {analysisResult.summary}
              </Typography>
              
              {/* Export buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<FileText size={16} />}
                  onClick={() => exportAnalysis('json')}
                >
                  Export JSON
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<FileCheck size={16} />}
                  onClick={() => exportAnalysis('csv')}
                >
                  Export CSV
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="secondary"
                  onClick={resetAnalysis}
                >
                  New Analysis
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  icon={<Network size={16} />}
                  label={`${analysisResult.entities.length} Entities`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  icon={<Brain size={16} />}
                  label={`${analysisResult.relationships.length} Relationships`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  icon={<FileCheck size={16} />}
                  label={`${analysisResult.evidence.length} Evidence Items`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  icon={<Lock size={16} />}
                  label={analysisResult.metadata.classificationLevel as string}
                  color="secondary"
                  variant="outlined"
                />
                <Chip 
                  label={`Confidence: ${(analysisResult.confidence * 100).toFixed(0)}%`}
                  color={analysisResult.confidence > 0.8 ? 'success' : 'warning'}
                />
              </Box>
            </Box>
            
            <IntelResultsViewer 
              entities={analysisResult.entities}
              relationships={analysisResult.relationships}
              evidence={analysisResult.evidence}
              packageType={analysisResult.packageType}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default IntelAnalysisPanel;
