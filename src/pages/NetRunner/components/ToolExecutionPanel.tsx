/**
 * ToolExecutionPanel.tsx
 * 
 * Component for executing a NetRunner tool and displaying the results.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ChevronDown,
  Play,
  AlertCircle,
  CheckCircle,
  X,
  Clock,
  RefreshCw
} from 'lucide-react';

import {
  NetRunnerTool,
  IntelType,
  getToolAdapter
} from '../tools/NetRunnerPowerTools';
import useToolExecution from '../hooks/useToolExecution';

interface ToolExecutionPanelProps {
  tool: NetRunnerTool;
  onResultsGenerated?: (result: unknown) => void;
}

/**
 * Panel for executing a NetRunner tool and displaying the results
 */
const ToolExecutionPanel: React.FC<ToolExecutionPanelProps> = ({ 
  tool,
  onResultsGenerated
}) => {
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [autoExecute, setAutoExecute] = useState(false);
  
  const adapter = getToolAdapter(tool.id);
  const toolSchema = adapter?.getToolSchema();
  
  const { 
    executionState, 
    isLoading, 
    error, 
    executeTool, 
    cancelExecution, 
    resetExecution 
  } = useToolExecution(tool.id, parameters, { autoExecute });
  
  // Handle parameter change
  const handleParameterChange = (paramName: string, value: unknown): void => {
    setParameters({
      ...parameters,
      [paramName]: value
    });
  };
  
  // Handle execution
  const handleExecute = async (): Promise<void> => {
    const result = await executeTool();
    if (result?.status === 'success' && onResultsGenerated) {
      onResultsGenerated(result.data);
    }
  };
  
  // Initialize parameters with default values from the schema
  useEffect(() => {
    if (toolSchema) {
      const initialParams: Record<string, unknown> = {};
      toolSchema.parameters.forEach(param => {
        if (param.default !== undefined) {
          initialParams[param.name] = param.default;
        }
      });
      setParameters(initialParams);
    }
  }, [toolSchema]);
  
  // Render parameter inputs based on adapter parameter schema
  const renderParameterInputs = (): React.ReactNode => {
    // Use schema parameters if available, otherwise use defaults
    const schemaParams = toolSchema?.parameters || [
      {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true
      },
      {
        name: 'maxResults',
        type: 'number',
        description: 'Maximum number of results',
        required: false,
        default: 10
      },
      {
        name: 'includeRaw',
        type: 'boolean',
        description: 'Include raw data in results',
        required: false,
        default: false
      }
    ];
    
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Parameters
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {schemaParams.map(param => (
            <Box key={param.name} sx={{ width: '100%', mb: 2 }}>
              {param.type === 'string' && (
                <TextField
                  fullWidth
                  label={param.name}
                  required={param.required}
                  helperText={param.description}
                  value={(parameters[param.name] as string) || ''}
                  onChange={e => handleParameterChange(param.name, e.target.value)}
                  size="small"
                  margin="dense"
                />
              )}
              
              {param.type === 'number' && (
                <TextField
                  fullWidth
                  label={param.name}
                  required={param.required}
                  helperText={param.description}
                  type="number"
                  value={(parameters[param.name] as number) || param.default || ''}
                  onChange={e => handleParameterChange(param.name, parseFloat(e.target.value))}
                  size="small"
                  margin="dense"
                />
              )}
              
              {param.type === 'boolean' && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: 1,
                  mt: 1,
                  width: '100%'
                }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    {param.name}
                    {param.required && <span style={{ color: 'red' }}>*</span>}
                  </Typography>
                  <Button
                    variant={(parameters[param.name] as boolean) ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleParameterChange(param.name, true)}
                    sx={{ mr: 1, minWidth: '60px' }}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={!(parameters[param.name] as boolean) ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleParameterChange(param.name, false)}
                    sx={{ minWidth: '60px' }}
                  >
                    No
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    {param.description}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };
  
  // Render execution status
  const renderExecutionStatus = (): React.ReactNode => {
    if (!executionState) return null;
    
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography>Executing tool...</Typography>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            startIcon={<X size={16} />} 
            sx={{ ml: 2 }}
            onClick={() => cancelExecution()}
          >
            Cancel
          </Button>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }
    
    if (executionState.result) {
      const result = executionState.result;
      const status = executionState.status;
      
      return (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {status === 'completed' ? (
              <CheckCircle color="green" size={20} style={{ marginRight: 8 }} />
            ) : (
              <AlertCircle color="red" size={20} style={{ marginRight: 8 }} />
            )}
            <Typography>
              {status === 'completed' ? 'Execution successful' : 'Execution failed'}
            </Typography>
            <Button 
              variant="text" 
              size="small" 
              startIcon={<RefreshCw size={16} />} 
              sx={{ ml: 2 }}
              onClick={resetExecution}
            >
              Reset
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {executionState.startTime && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                <Clock size={14} style={{ marginRight: 4 }} />
                Started: {new Date(executionState.startTime).toLocaleString()}
              </Typography>
            )}
            {executionState.endTime && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                <Clock size={14} style={{ marginRight: 4 }} />
                Completed: {new Date(executionState.endTime).toLocaleString()}
              </Typography>
            )}
          </Box>
          
          {/* Check if result has intelTypes from the metadata */}
          {typeof result === 'object' && result && 
           result && typeof result === 'object' && '_metadata' in result && 
           result._metadata && typeof result._metadata === 'object' && 
           'intelTypes' in result._metadata && 
           Array.isArray((result._metadata as Record<string, unknown>).intelTypes) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Intel Types:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {((result._metadata as Record<string, unknown>).intelTypes as IntelType[]).map((type: IntelType) => (
                  <Chip key={type} label={type} size="small" />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      );
    }
    
    return null;
  };
  
  // Render results
  const renderResults = (): React.ReactNode => {
    if (!executionState || !executionState.result || executionState.status !== 'completed') {
      return null;
    }
    
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Results
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ChevronDown size={20} />}>
            <Typography>Execution Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ 
              maxHeight: '400px', 
              overflow: 'auto', 
              fontFamily: 'monospace', 
              whiteSpace: 'pre-wrap',
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              p: 2,
              borderRadius: 1
            }}>
              {JSON.stringify(executionState.result, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Execute {tool.name}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <FormControlLabel
        control={
          <Switch
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
          />
        }
        label="Auto-execute on parameter change"
      />
      
      {renderParameterInputs()}
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Play size={16} />}
          onClick={handleExecute}
          disabled={isLoading}
        >
          Execute Tool
        </Button>
      </Box>
      
      {(isLoading || error || executionState) && (
        <>
          <Divider sx={{ mb: 3 }} />
          {renderExecutionStatus()}
          {renderResults()}
        </>
      )}
    </Paper>
  );
};

export default ToolExecutionPanel;
