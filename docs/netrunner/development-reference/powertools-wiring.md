# PowerTools Wiring Guide

## Overview

The NetRunner PowerTools in the left sidebar are currently visual-only buttons. This guide shows how to connect them to the actual OSINT tool execution services for real functionality.

## Current State Analysis

**File:** `src/applications/netrunner/components/layout/NetRunnerLeftSideBar.tsx`

**Issues:**
- Lines 280-290: Tools only toggle visual selection
- No connection to NetRunnerPowerTools service
- No actual tool execution functionality
- No result handling or display
- No integration with center view or right sidebar

## Available Tools & Services

### Existing PowerTools (NetRunnerPowerTools.ts)

The system includes 40+ OSINT tools across 7 categories:

#### Discovery Tools
- **Shodan** - IoT device and service discovery
- **theHarvester** - Email and domain enumeration  
- **SpiderFoot** - Automated reconnaissance
- **Censys** - Internet infrastructure scanning
- **Maltego** - Entity relationship mapping

#### Scraping Tools
- **DataSweeper** - Web scraping and data extraction
- **Scrapy** - Advanced web scraping framework
- **Beautiful Soup** - HTML parsing and extraction

#### Analysis Tools
- **BuiltWith** - Technology stack identification
- **Wappalyzer** - Web technology detection
- **ThreatMapper** - Threat correlation and mapping
- **TemporalScan** - Timeline reconstruction

#### Verification Tools
- **VirusTotal** - File and URL reputation checking
- **URLVoid** - URL reputation analysis
- **SecurityTrails** - DNS and domain intelligence

## Step-by-Step Implementation

### Step 1: Add Required Imports

Add these imports to NetRunnerLeftSideBar.tsx:

```typescript
import { powerToolRegistry, type PowerTool } from '../../tools/NetRunnerPowerTools';
import { AdapterRegistry } from '../../tools/AdapterRegistry';
import { LoggerFactory } from '../../services/logging';
import { NetRunnerError } from '../../services/error/NetRunnerError';
```

### Step 2: Expand Component Props

Add callback props for tool results:

```typescript
interface NetRunnerLeftSideBarProps {
  open: boolean;
  width: number;
  onToolResults?: (toolId: string, results: any) => void;
  onToolError?: (toolId: string, error: string) => void;
  currentTarget?: string;
}
```

### Step 3: Add Tool Execution State

Replace the existing selectedTool state with:

```typescript
const NetRunnerLeftSideBar: React.FC<NetRunnerLeftSideBarProps> = ({
  open,
  width,
  onToolResults,
  onToolError,
  currentTarget
}) => {
  // Enhanced state for tool execution
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [executingTools, setExecutingTools] = useState<Set<string>>(new Set());
  const [toolResults, setToolResults] = useState<Map<string, any>>(new Map());
  const [toolErrors, setToolErrors] = useState<Map<string, string>>(new Map());
  const [toolProgress, setToolProgress] = useState<Map<string, number>>(new Map());

  // Initialize logger
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerPowerTools'), []);

  // Load available tools from registry
  const [availableTools, setAvailableTools] = useState<PowerTool[]>([]);

  useEffect(() => {
    const tools = powerToolRegistry.getAllTools();
    setAvailableTools(tools);
  }, []);
```

### Step 4: Implement Tool Execution Function

Add the core tool execution logic:

```typescript
const executeTool = async (toolId: string, parameters?: any) => {
  if (executingTools.has(toolId)) {
    logger.warn('Tool already executing', { toolId });
    return;
  }

  if (!currentTarget) {
    const error = 'No target specified for tool execution';
    setToolErrors(prev => new Map(prev.set(toolId, error)));
    onToolError?.(toolId, error);
    logger.error('Tool execution failed - no target', { toolId });
    return;
  }

  setExecutingTools(prev => new Set(prev.add(toolId)));
  setToolErrors(prev => new Map(prev.delete(toolId) && prev));
  setToolProgress(prev => new Map(prev.set(toolId, 0)));
  setSelectedTool(toolId);

  logger.info('Starting tool execution', { toolId, target: currentTarget });

  try {
    // Get tool configuration
    const tool = powerToolRegistry.getToolById(toolId);
    if (!tool) {
      throw new NetRunnerError(`Tool ${toolId} not found in registry`, 'TOOL_ERROR');
    }

    // Get or create tool adapter
    const adapter = await AdapterRegistry.getAdapter(toolId);
    if (!adapter) {
      throw new NetRunnerError(`No adapter available for ${tool.name}`, 'TOOL_ERROR');
    }

    // Prepare execution parameters
    const execParams = {
      target: currentTarget,
      options: parameters || {},
      onProgress: (progress: number) => {
        setToolProgress(prev => new Map(prev.set(toolId, progress)));
      }
    };

    // Execute the tool
    const results = await adapter.execute(execParams);

    // Store results
    setToolResults(prev => new Map(prev.set(toolId, results)));
    
    // Notify parent components
    onToolResults?.(toolId, results);

    logger.info('Tool execution completed', { 
      toolId, 
      target: currentTarget,
      resultCount: Array.isArray(results) ? results.length : 1
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setToolErrors(prev => new Map(prev.set(toolId, errorMessage)));
    onToolError?.(toolId, errorMessage);
    
    logger.error('Tool execution failed', { 
      toolId, 
      target: currentTarget, 
      error: errorMessage 
    });
  } finally {
    setExecutingTools(prev => {
      const newSet = new Set(prev);
      newSet.delete(toolId);
      return newSet;
    });
    setToolProgress(prev => new Map(prev.delete(toolId) && prev));
  }
};
```

### Step 5: Add Tool Parameter Collection

Create a parameter input dialog:

```typescript
const [parameterDialog, setParameterDialog] = useState<{
  open: boolean;
  toolId: string;
  tool: PowerTool | null;
}>({
  open: false,
  toolId: '',
  tool: null
});

const [toolParameters, setToolParameters] = useState<Record<string, any>>({});

const openParameterDialog = (toolId: string) => {
  const tool = powerToolRegistry.getToolById(toolId);
  if (!tool) return;

  setParameterDialog({
    open: true,
    toolId,
    tool
  });
  
  // Set default parameters based on tool
  setToolParameters(getDefaultParameters(tool));
};

const getDefaultParameters = (tool: PowerTool): Record<string, any> => {
  const defaults: Record<string, any> = {};
  
  switch (tool.category) {
    case 'discovery':
      defaults.depth = 2;
      defaults.timeout = 30000;
      break;
    case 'scraping':
      defaults.maxPages = 50;
      defaults.respectRobots = true;
      break;
    case 'analysis':
      defaults.detailed = true;
      defaults.includeMetadata = true;
      break;
    default:
      defaults.basic = true;
  }
  
  return defaults;
};

const executeToolWithParameters = async () => {
  const { toolId } = parameterDialog;
  setParameterDialog({ open: false, toolId: '', tool: null });
  
  await executeTool(toolId, toolParameters);
  setToolParameters({});
};
```

### Step 6: Update Tool Button Interface

Replace the existing tool buttons with enhanced functionality:

```typescript
{availableTools.map((tool) => {
  const isExecuting = executingTools.has(tool.id);
  const hasError = toolErrors.has(tool.id);
  const hasResults = toolResults.has(tool.id);
  const progress = toolProgress.get(tool.id) || 0;

  return (
    <Tooltip 
      title={
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {tool.name}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {tool.description}
          </Typography>
          {hasError && (
            <Typography variant="caption" sx={{ color: '#ff4444', display: 'block' }}>
              Error: {toolErrors.get(tool.id)}
            </Typography>
          )}
          {hasResults && (
            <Typography variant="caption" sx={{ color: '#00ff88', display: 'block' }}>
              ✓ Results available
            </Typography>
          )}
        </Box>
      } 
      placement="right" 
      key={tool.id}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={() => {
            if (tool.requiresParameters) {
              openParameterDialog(tool.id);
            } else {
              executeTool(tool.id);
            }
          }}
          disabled={isExecuting}
          sx={{
            width: open ? 'auto' : 28,
            height: open ? 'auto' : 28,
            minWidth: open ? 36 : 28,
            minHeight: open ? 36 : 28,
            backgroundColor: selectedTool === tool.id ? 'rgba(0, 245, 255, 0.15)' : '#0a0a0a',
            border: '1px solid',
            borderColor: hasError ? '#ff4444' : 
                        hasResults ? '#00ff88' : 
                        selectedTool === tool.id ? '#00f5ff' : '#333333',
            borderRadius: 0,
            color: hasError ? '#ff4444' :
                   hasResults ? '#00ff88' :
                   selectedTool === tool.id ? '#00f5ff' : '#ffffff',
            display: 'flex',
            flexDirection: open ? 'column' : 'row',
            gap: open ? 0.25 : 0,
            transition: 'all 0.1s ease',
            '&:hover': {
              borderColor: '#00f5ff',
              backgroundColor: 'rgba(0, 245, 255, 0.1)'
            },
            '&:disabled': {
              opacity: 0.6
            }
          }}
        >
          {/* Tool Icon */}
          {React.createElement(tool.icon, { size: open ? 16 : 14 })}
          
          {/* Tool Name (when expanded) */}
          {open && (
            <Typography
              variant="caption"
              sx={{
                color: 'inherit',
                fontSize: '0.6rem',
                textAlign: 'center',
                lineHeight: 1,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {tool.name.split(' ')[0]}
            </Typography>
          )}
        </IconButton>

        {/* Progress Indicator */}
        {isExecuting && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: '#333333',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#00f5ff',
                transition: 'width 0.2s ease'
              }}
            />
          </Box>
        )}

        {/* Status Indicators */}
        {hasResults && !isExecuting && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              backgroundColor: '#00ff88',
              borderRadius: '50%'
            }}
          />
        )}

        {hasError && !isExecuting && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              backgroundColor: '#ff4444',
              borderRadius: '50%'
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
})}
```

### Step 7: Add Parameter Input Dialog

Add the parameter configuration dialog:

```typescript
{/* Tool Parameter Dialog */}
<Dialog 
  open={parameterDialog.open} 
  onClose={() => setParameterDialog({ open: false, toolId: '', tool: null })}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      backgroundColor: '#0a0a0a',
      border: '1px solid #00f5ff',
      borderRadius: 0
    }
  }}
>
  <DialogTitle sx={{ 
    color: '#00f5ff',
    fontFamily: "'Aldrich', monospace",
    fontSize: '1rem',
    borderBottom: '1px solid #333333'
  }}>
    CONFIGURE_{parameterDialog.tool?.name.toUpperCase().replace(/\s+/g, '_')}
  </DialogTitle>
  
  <DialogContent sx={{ pt: 2 }}>
    {parameterDialog.tool && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ color: '#aaaaaa', mb: 1 }}>
          {parameterDialog.tool.description}
        </Typography>

        <TextField
          label="Target"
          value={currentTarget || ''}
          disabled
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': { borderColor: '#333333' }
            },
            '& .MuiInputLabel-root': { color: '#aaaaaa' }
          }}
        />

        {/* Dynamic parameter fields based on tool category */}
        {parameterDialog.tool.category === 'discovery' && (
          <>
            <TextField
              label="Search Depth"
              type="number"
              value={toolParameters.depth || 2}
              onChange={(e) => setToolParameters(prev => ({
                ...prev,
                depth: parseInt(e.target.value)
              }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' }
                },
                '& .MuiInputLabel-root': { color: '#aaaaaa' }
              }}
            />
            <TextField
              label="Timeout (ms)"
              type="number"
              value={toolParameters.timeout || 30000}
              onChange={(e) => setToolParameters(prev => ({
                ...prev,
                timeout: parseInt(e.target.value)
              }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' }
                },
                '& .MuiInputLabel-root': { color: '#aaaaaa' }
              }}
            />
          </>
        )}

        {parameterDialog.tool.category === 'scraping' && (
          <>
            <TextField
              label="Max Pages"
              type="number"
              value={toolParameters.maxPages || 50}
              onChange={(e) => setToolParameters(prev => ({
                ...prev,
                maxPages: parseInt(e.target.value)
              }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' }
                },
                '& .MuiInputLabel-root': { color: '#aaaaaa' }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={toolParameters.respectRobots || true}
                  onChange={(e) => setToolParameters(prev => ({
                    ...prev,
                    respectRobots: e.target.checked
                  }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00f5ff'
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00f5ff'
                    }
                  }}
                />
              }
              label="Respect robots.txt"
              sx={{ color: '#ffffff' }}
            />
          </>
        )}
      </Box>
    )}
  </DialogContent>
  
  <DialogActions sx={{ borderTop: '1px solid #333333', pt: 1 }}>
    <Button 
      onClick={() => setParameterDialog({ open: false, toolId: '', tool: null })}
      sx={{ color: '#aaaaaa' }}
    >
      Cancel
    </Button>
    <Button 
      onClick={executeToolWithParameters}
      variant="contained"
      sx={{
        backgroundColor: '#00f5ff',
        color: '#000000',
        '&:hover': { backgroundColor: '#00d4e6' }
      }}
    >
      Execute
    </Button>
  </DialogActions>
</Dialog>
```

### Step 8: Update NetRunnerControlStation Integration

Modify the control station to pass target and handle results:

```typescript
const NetRunnerControlStation: React.FC<NetRunnerControlStationProps> = ({ 
  className
}) => {
  const [currentTarget, setCurrentTarget] = useState('');
  const [toolResults, setToolResults] = useState<Map<string, any>>(new Map());

  const handleToolResults = (toolId: string, results: any) => {
    setToolResults(prev => new Map(prev.set(toolId, results)));
    
    // Route results to appropriate displays
    // Could send to center view, right sidebar, etc.
  };

  const handleToolError = (toolId: string, error: string) => {
    console.error(`Tool ${toolId} failed:`, error);
    // Handle error display
  };

  return (
    <Box>
      <NetRunnerLeftSideBar
        open={leftSidebarOpen}
        width={leftSidebarWidth}
        onToolResults={handleToolResults}
        onToolError={handleToolError}
        currentTarget={currentTarget}
      />

      <NetRunnerCenterView
        width={`calc(100% - ${leftSidebarWidth}px - ${rightSidebarWidth}px)`}
        height={`calc(100% - ${bottomBarHeight}px)`}
        onTargetChange={setCurrentTarget}
        toolResults={toolResults}
      />
    </Box>
  );
};
```

## Tool Categories & Use Cases

### Discovery Tools Usage
```typescript
// Shodan: Find exposed services
await executeTool('shodan-search', {
  query: 'apache',
  facets: 'country,org',
  limit: 100
});

// theHarvester: Email enumeration
await executeTool('theHarvester', {
  domain: 'example.com',
  sources: ['google', 'bing', 'linkedin'],
  limit: 500
});
```

### Analysis Tools Usage
```typescript
// BuiltWith: Technology detection
await executeTool('builtwith', {
  domain: 'example.com',
  categories: ['cms', 'analytics', 'javascript']
});

// ThreatMapper: Threat correlation
await executeTool('threatmapper', {
  indicators: ['suspicious_ip', 'malware_hash'],
  timeRange: '7d'
});
```

## Testing the Integration

1. **Single Tool Test:**
   - Select a discovery tool (e.g., Shodan)
   - Enter target domain
   - Execute and verify results

2. **Multiple Tool Test:**
   - Execute several tools in sequence
   - Verify no conflicts or resource issues
   - Check result aggregation

3. **Error Handling Test:**
   - Test with invalid targets
   - Test with missing API keys
   - Test network timeout scenarios

4. **Parameter Test:**
   - Test tools requiring parameters
   - Verify parameter validation
   - Test parameter persistence

## Performance Considerations

- Tools execute asynchronously to prevent UI blocking
- Progress indicators provide user feedback
- Results are cached to prevent duplicate executions
- Error boundaries prevent tool failures from crashing the interface

---
*Complete guide for connecting PowerTools to real OSINT tool execution*
