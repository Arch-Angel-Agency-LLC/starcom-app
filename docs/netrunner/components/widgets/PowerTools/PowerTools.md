# PowerTools Widget

## Overview

The PowerTools widget provides a comprehensive suite of manual cybersecurity and OSINT tools, enabling operators to perform targeted reconnaissance, vulnerability assessment, and intelligence gathering operations with precision control and advanced configuration options.

## Component Specification

### Purpose
- Manual tool execution and management interface
- Advanced cybersecurity and OSINT tool integration
- Custom tool configuration and parameter tuning
- Real-time tool execution monitoring and results
- Tool orchestration and workflow automation

### Props Interface
```typescript
interface PowerToolsProps {
  availableTools?: ToolDefinition[];
  favoriteTools?: string[];
  onToolExecute?: (toolId: string, config: ToolConfiguration) => Promise<ToolResult>;
  onToolStop?: (executionId: string) => Promise<void>;
  onFavoriteToggle?: (toolId: string) => void;
  executionHistory?: ToolExecution[];
  maxConcurrentExecutions?: number;
  defaultConfigurations?: Record<string, ToolConfiguration>;
}
```

### State Management
```typescript
interface PowerToolsState {
  selectedTool: string | null;
  toolConfiguration: Map<string, ToolConfiguration>;
  activeExecutions: Map<string, ToolExecution>;
  executionQueue: QueuedExecution[];
  toolResults: Map<string, ToolResult>;
  filterCriteria: ToolFilter;
}

interface ToolExecution {
  id: string;
  toolId: string;
  configuration: ToolConfiguration;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  progress?: number;
  currentTask?: string;
  result?: ToolResult;
}
```

## Tool Categories and Definitions

### Network Reconnaissance Tools
```typescript
interface NetworkReconTool extends ToolDefinition {
  category: 'network-recon';
  capabilities: {
    portScanning: boolean;
    serviceEnumeration: boolean;
    osFingerprinting: boolean;
    networkMapping: boolean;
    vulnerabilityScanning: boolean;
  };
  supportedTargets: ('ip' | 'domain' | 'cidr' | 'url')[];
  outputFormats: ('json' | 'xml' | 'csv' | 'text')[];
}

const networkReconTools: NetworkReconTool[] = [
  {
    id: 'nmap-port-scan',
    name: 'Nmap Port Scanner',
    category: 'network-recon',
    description: 'Advanced port scanning and service enumeration',
    capabilities: {
      portScanning: true,
      serviceEnumeration: true,
      osFingerprinting: true,
      networkMapping: false,
      vulnerabilityScanning: false
    },
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'Target IP, domain, or CIDR range'
      },
      {
        name: 'ports',
        type: 'string',
        default: '1-1000',
        description: 'Port range to scan'
      },
      {
        name: 'scanType',
        type: 'select',
        options: ['syn', 'tcp', 'udp', 'stealth'],
        default: 'syn',
        description: 'Type of scan to perform'
      },
      {
        name: 'timing',
        type: 'select',
        options: ['paranoid', 'sneaky', 'polite', 'normal', 'aggressive', 'insane'],
        default: 'normal',
        description: 'Scan timing template'
      }
    ],
    supportedTargets: ['ip', 'domain', 'cidr'],
    outputFormats: ['json', 'xml', 'text']
  }
];
```

### Web Application Tools
```typescript
interface WebAppTool extends ToolDefinition {
  category: 'web-app';
  capabilities: {
    directoryBruteforce: boolean;
    vulnerabilityScanning: boolean;
    technologyDetection: boolean;
    crawling: boolean;
    fuzzing: boolean;
  };
  supportedProtocols: ('http' | 'https')[];
  authenticationMethods: AuthMethod[];
}

const webAppTools: WebAppTool[] = [
  {
    id: 'dirb-directory-scan',
    name: 'Directory Brute Force',
    category: 'web-app',
    description: 'Directory and file discovery through brute force',
    capabilities: {
      directoryBruteforce: true,
      vulnerabilityScanning: false,
      technologyDetection: false,
      crawling: false,
      fuzzing: false
    },
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'Target URL to scan'
      },
      {
        name: 'wordlist',
        type: 'select',
        options: ['common', 'big', 'small', 'custom'],
        default: 'common',
        description: 'Wordlist to use for brute force'
      },
      {
        name: 'extensions',
        type: 'string',
        default: 'php,html,js,txt',
        description: 'File extensions to append'
      },
      {
        name: 'threads',
        type: 'number',
        default: 10,
        min: 1,
        max: 50,
        description: 'Number of concurrent threads'
      }
    ],
    supportedProtocols: ['http', 'https']
  }
];
```

### OSINT Investigation Tools
```typescript
interface OSINTTool extends ToolDefinition {
  category: 'osint';
  capabilities: {
    domainIntelligence: boolean;
    socialMediaSearch: boolean;
    emailInvestigation: boolean;
    phoneNumberLookup: boolean;
    breachDataSearch: boolean;
  };
  dataSources: string[];
  privacyCompliant: boolean;
}

const osintTools: OSINTTool[] = [
  {
    id: 'whois-lookup',
    name: 'WHOIS Domain Lookup',
    category: 'osint',
    description: 'Domain registration and ownership information',
    capabilities: {
      domainIntelligence: true,
      socialMediaSearch: false,
      emailInvestigation: false,
      phoneNumberLookup: false,
      breachDataSearch: false
    },
    parameters: [
      {
        name: 'domain',
        type: 'string',
        required: true,
        description: 'Domain name to investigate'
      },
      {
        name: 'includeHistory',
        type: 'boolean',
        default: false,
        description: 'Include historical WHOIS data'
      }
    ],
    dataSources: ['WHOIS servers', 'ICANN database'],
    privacyCompliant: true
  },
  {
    id: 'haveibeenpwned-check',
    name: 'Have I Been Pwned Lookup',
    category: 'osint',
    description: 'Check if email addresses appear in known data breaches',
    capabilities: {
      domainIntelligence: false,
      socialMediaSearch: false,
      emailInvestigation: true,
      phoneNumberLookup: false,
      breachDataSearch: true
    },
    parameters: [
      {
        name: 'email',
        type: 'string',
        required: true,
        description: 'Email address to check'
      },
      {
        name: 'includeUnverified',
        type: 'boolean',
        default: false,
        description: 'Include unverified breaches'
      }
    ],
    dataSources: ['HaveIBeenPwned API'],
    privacyCompliant: true
  }
];
```

## Tool Execution Engine

### Execution Management System
```typescript
class ToolExecutionEngine {
  private activeExecutions = new Map<string, ToolExecution>();
  private executionQueue = new Queue<QueuedExecution>();
  private maxConcurrentExecutions: number;
  
  constructor(maxConcurrent = 5) {
    this.maxConcurrentExecutions = maxConcurrent;
  }
  
  async executeTool(
    toolId: string, 
    configuration: ToolConfiguration
  ): Promise<ToolExecution> {
    const executionId = generateExecutionId();
    
    const execution: ToolExecution = {
      id: executionId,
      toolId,
      configuration,
      status: 'queued',
      startTime: Date.now()
    };
    
    // Check if we can execute immediately
    if (this.activeExecutions.size < this.maxConcurrentExecutions) {
      await this.startExecution(execution);
    } else {
      // Queue for later execution
      this.executionQueue.enqueue({
        execution,
        priority: configuration.priority || 'normal'
      });
    }
    
    return execution;
  }
  
  private async startExecution(execution: ToolExecution): Promise<void> {
    execution.status = 'running';
    this.activeExecutions.set(execution.id, execution);
    
    try {
      const toolDefinition = this.getToolDefinition(execution.toolId);
      const executor = this.getToolExecutor(toolDefinition);
      
      // Start execution with progress tracking
      const result = await executor.execute(
        execution.configuration,
        (progress) => this.updateProgress(execution.id, progress)
      );
      
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.result = result;
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.result = {
        success: false,
        error: error.message,
        executionTime: Date.now() - execution.startTime
      };
    } finally {
      this.activeExecutions.delete(execution.id);
      this.processQueue();
    }
  }
  
  private updateProgress(executionId: string, progress: ExecutionProgress): void {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.progress = progress.percentage;
      execution.currentTask = progress.currentTask;
      this.notifyProgressUpdate(execution);
    }
  }
  
  async stopExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = Date.now();
      
      // Signal the executor to stop
      const executor = this.getToolExecutor(execution.toolId);
      await executor.stop(executionId);
      
      this.activeExecutions.delete(executionId);
      this.processQueue();
    }
  }
}
```

### Tool Configuration Management
```typescript
class ToolConfigurationManager {
  private configurations = new Map<string, ToolConfiguration>();
  private templates = new Map<string, ConfigurationTemplate>();
  
  getConfiguration(toolId: string): ToolConfiguration {
    return this.configurations.get(toolId) || this.getDefaultConfiguration(toolId);
  }
  
  saveConfiguration(toolId: string, config: ToolConfiguration): void {
    // Validate configuration
    const validation = this.validateConfiguration(toolId, config);
    if (!validation.valid) {
      throw new ConfigurationError(validation.errors);
    }
    
    this.configurations.set(toolId, config);
    this.persistConfiguration(toolId, config);
  }
  
  createTemplate(
    name: string, 
    toolId: string, 
    config: ToolConfiguration
  ): ConfigurationTemplate {
    const template: ConfigurationTemplate = {
      id: generateTemplateId(),
      name,
      toolId,
      configuration: config,
      createdAt: Date.now(),
      usage: 0
    };
    
    this.templates.set(template.id, template);
    return template;
  }
  
  private validateConfiguration(
    toolId: string, 
    config: ToolConfiguration
  ): ValidationResult {
    const toolDefinition = this.getToolDefinition(toolId);
    const errors: string[] = [];
    
    // Check required parameters
    for (const param of toolDefinition.parameters) {
      if (param.required && !config.parameters[param.name]) {
        errors.push(`Required parameter '${param.name}' is missing`);
      }
      
      // Type validation
      const value = config.parameters[param.name];
      if (value !== undefined) {
        const typeError = this.validateParameterType(param, value);
        if (typeError) {
          errors.push(typeError);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## User Interface Components

### Tool Grid Display
```typescript
const PowerToolsGrid: React.FC<{ tools: ToolDefinition[] }> = ({ tools }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // Category filter
      if (selectedCategory !== 'all' && tool.category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!tool.name.toLowerCase().includes(query) &&
            !tool.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Favorite filter
      if (favoriteFilter && !isFavorite(tool.id)) {
        return false;
      }
      
      return true;
    });
  }, [tools, selectedCategory, searchQuery, favoriteFilter]);
  
  return (
    <div className="power-tools-grid">
      <div className="tools-filters">
        <CategoryFilter
          categories={getToolCategories(tools)}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tools..."
        />
        <FavoriteToggle
          enabled={favoriteFilter}
          onChange={setFavoriteFilter}
        />
      </div>
      
      <div className="tools-grid">
        {filteredTools.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onExecute={(config) => handleToolExecution(tool.id, config)}
            onFavorite={() => toggleFavorite(tool.id)}
            isFavorite={isFavorite(tool.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Tool Configuration Interface
```typescript
const ToolConfigurationPanel: React.FC<ToolConfigurationProps> = ({
  tool,
  configuration,
  onChange,
  onExecute,
  onCancel
}) => {
  const [currentConfig, setCurrentConfig] = useState(configuration);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  useEffect(() => {
    const validation = validateConfiguration(tool.id, currentConfig);
    setValidationErrors(validation.errors);
  }, [currentConfig, tool.id]);
  
  return (
    <div className="tool-configuration-panel">
      <div className="tool-header">
        <ToolIcon tool={tool} />
        <div className="tool-info">
          <h3>{tool.name}</h3>
          <p>{tool.description}</p>
        </div>
      </div>
      
      <div className="configuration-form">
        {tool.parameters.map(param => (
          <ParameterInput
            key={param.name}
            parameter={param}
            value={currentConfig.parameters[param.name]}
            onChange={(value) => 
              setCurrentConfig(prev => ({
                ...prev,
                parameters: {
                  ...prev.parameters,
                  [param.name]: value
                }
              }))
            }
            error={getParameterError(param.name, validationErrors)}
          />
        ))}
        
        <AdvancedOptions
          configuration={currentConfig}
          onChange={setCurrentConfig}
        />
      </div>
      
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
      
      <div className="panel-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onExecute(currentConfig)}
          disabled={validationErrors.length > 0}
        >
          Execute Tool
        </Button>
      </div>
    </div>
  );
};
```

### Execution Monitor
```typescript
const ExecutionMonitor: React.FC<{ executions: ToolExecution[] }> = ({
  executions
}) => {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  
  return (
    <div className="execution-monitor">
      <div className="execution-list">
        {executions.map(execution => (
          <ExecutionCard
            key={execution.id}
            execution={execution}
            selected={selectedExecution === execution.id}
            onClick={() => setSelectedExecution(execution.id)}
            onStop={() => handleStopExecution(execution.id)}
          />
        ))}
      </div>
      
      {selectedExecution && (
        <ExecutionDetails
          execution={executions.find(e => e.id === selectedExecution)!}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </div>
  );
};

const ExecutionCard: React.FC<ExecutionCardProps> = ({
  execution,
  selected,
  onClick,
  onStop
}) => {
  const duration = execution.endTime 
    ? execution.endTime - execution.startTime
    : Date.now() - execution.startTime;
  
  return (
    <Card 
      className={`execution-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <CardContent>
        <div className="execution-header">
          <span className="tool-name">{getToolName(execution.toolId)}</span>
          <StatusBadge status={execution.status} />
        </div>
        
        <div className="execution-info">
          <div className="duration">
            Duration: {formatDuration(duration)}
          </div>
          {execution.progress !== undefined && (
            <div className="progress">
              <ProgressBar value={execution.progress} />
              <span>{execution.progress}%</span>
            </div>
          )}
          {execution.currentTask && (
            <div className="current-task">
              {execution.currentTask}
            </div>
          )}
        </div>
        
        {execution.status === 'running' && (
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
          >
            Stop
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

## Results Processing and Display

### Result Aggregation and Analysis
```typescript
class ToolResultProcessor {
  processResult(execution: ToolExecution): ProcessedResult {
    const result = execution.result;
    if (!result || !result.success) {
      return this.createErrorResult(execution);
    }
    
    const processor = this.getResultProcessor(execution.toolId);
    return processor.process(result);
  }
  
  aggregateResults(executions: ToolExecution[]): AggregatedResult {
    const successfulResults = executions
      .filter(e => e.result?.success)
      .map(e => this.processResult(e));
    
    return {
      totalExecutions: executions.length,
      successfulExecutions: successfulResults.length,
      failedExecutions: executions.length - successfulResults.length,
      aggregatedData: this.aggregateData(successfulResults),
      insights: this.generateInsights(successfulResults),
      recommendations: this.generateRecommendations(successfulResults)
    };
  }
  
  private generateInsights(results: ProcessedResult[]): Insight[] {
    const insights: Insight[] = [];
    
    // Common vulnerabilities insight
    const vulnerabilities = this.extractVulnerabilities(results);
    if (vulnerabilities.length > 0) {
      insights.push({
        type: 'vulnerability',
        severity: this.calculateMaxSeverity(vulnerabilities),
        message: `Found ${vulnerabilities.length} potential vulnerabilities`,
        details: vulnerabilities
      });
    }
    
    // Technology stack insight
    const technologies = this.extractTechnologies(results);
    if (technologies.length > 0) {
      insights.push({
        type: 'technology',
        severity: 'info',
        message: `Detected ${technologies.length} technologies`,
        details: technologies
      });
    }
    
    return insights;
  }
}
```

### Interactive Results Viewer
```typescript
const ResultsViewer: React.FC<{ results: ProcessedResult[] }> = ({ results }) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'graph'>('table');
  const [filterCriteria, setFilterCriteria] = useState<ResultFilter>({});
  
  const filteredResults = useMemo(() => {
    return results.filter(result => matchesFilter(result, filterCriteria));
  }, [results, filterCriteria]);
  
  return (
    <div className="results-viewer">
      <div className="results-controls">
        <ViewModeSelector
          mode={viewMode}
          onChange={setViewMode}
        />
        <ResultFilter
          criteria={filterCriteria}
          onChange={setFilterCriteria}
        />
        <ExportButton
          results={filteredResults}
          formats={['json', 'csv', 'pdf']}
        />
      </div>
      
      <div className="results-content">
        {viewMode === 'table' && (
          <ResultsTable results={filteredResults} />
        )}
        {viewMode === 'cards' && (
          <ResultsCards results={filteredResults} />
        )}
        {viewMode === 'graph' && (
          <ResultsGraph results={filteredResults} />
        )}
      </div>
    </div>
  );
};
```

## Testing Strategy

### Component Testing
```typescript
describe('PowerTools', () => {
  it('should display available tools correctly', () => {
    const mockTools: ToolDefinition[] = [
      {
        id: 'nmap',
        name: 'Nmap Port Scanner',
        category: 'network-recon',
        description: 'Network port scanning tool'
      }
    ];
    
    const component = render(<PowerTools availableTools={mockTools} />);
    
    expect(component.getByText('Nmap Port Scanner')).toBeInTheDocument();
  });
  
  it('should handle tool execution', async () => {
    const onExecute = jest.fn().mockResolvedValue({
      success: true,
      output: 'Scan completed'
    });
    
    const component = render(<PowerTools onToolExecute={onExecute} />);
    
    // Configure and execute tool
    fireEvent.click(component.getByText('Nmap Port Scanner'));
    fireEvent.change(component.getByLabelText('Target'), {
      target: { value: '192.168.1.1' }
    });
    fireEvent.click(component.getByText('Execute Tool'));
    
    await waitFor(() => {
      expect(onExecute).toHaveBeenCalledWith(
        'nmap',
        expect.objectContaining({
          parameters: expect.objectContaining({
            target: '192.168.1.1'
          })
        })
      );
    });
  });
  
  it('should validate tool configuration', () => {
    const component = render(<PowerTools />);
    
    // Try to execute with invalid configuration
    fireEvent.click(component.getByText('Nmap Port Scanner'));
    fireEvent.click(component.getByText('Execute Tool'));
    
    expect(component.getByText(/Required parameter/)).toBeInTheDocument();
  });
});
```

## Usage Examples

### Basic Implementation
```typescript
import React from 'react';
import { PowerTools } from './components/widgets/PowerTools';

function NetRunnerApp() {
  const [executionHistory, setExecutionHistory] = useState<ToolExecution[]>([]);
  
  const handleToolExecute = async (toolId: string, config: ToolConfiguration) => {
    const execution = await toolService.execute(toolId, config);
    setExecutionHistory(prev => [execution, ...prev]);
    return execution.result;
  };
  
  return (
    <PowerTools
      availableTools={getAllTools()}
      onToolExecute={handleToolExecute}
      executionHistory={executionHistory}
      maxConcurrentExecutions={3}
    />
  );
}
```

### Advanced Configuration
```typescript
const advancedPowerToolsConfig = {
  toolCategories: ['network-recon', 'web-app', 'osint', 'forensics'],
  customTools: customToolDefinitions,
  executionLimits: {
    maxConcurrent: 5,
    maxDuration: 30 * 60 * 1000, // 30 minutes
    maxMemory: 1024 * 1024 * 1024 // 1GB
  },
  resultProcessing: {
    autoAnalysis: true,
    correlationEnabled: true,
    exportFormats: ['json', 'csv', 'pdf', 'xml']
  }
};

<PowerTools
  config={advancedPowerToolsConfig}
  onToolExecute={handleAdvancedExecution}
  onResultsReady={handleResultsProcessing}
  onInsightGenerated={handleInsightDisplay}
/>
```

This comprehensive documentation covers all aspects of the PowerTools widget, providing detailed implementation guidance for manual cybersecurity and OSINT tool execution within the NetRunner platform.
