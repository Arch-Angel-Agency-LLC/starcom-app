# NetRunnerBottomBar Component

## Overview

The NetRunnerBottomBar provides critical operational status information, terminal access, and system monitoring capabilities. It serves as the command center footer, offering real-time feedback and quick access to system-level functions.

## Component Specification

### Purpose
- Real-time operational status display
- System performance monitoring and metrics
- Terminal and command-line interface access
- Log monitoring and system diagnostics
- Quick action buttons and system controls

### Props Interface
```typescript
interface NetRunnerBottomBarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showTerminal?: boolean;
  onToggleTerminal?: () => void;
  operationStatus?: OperationStatus;
  systemMetrics?: SystemMetrics;
  activeLogs?: LogEntry[];
  onClearLogs?: () => void;
  terminalHistory?: TerminalCommand[];
  onExecuteCommand?: (command: string) => Promise<CommandResult>;
}
```

### State Management
```typescript
interface BottomBarState {
  activeTab: BottomBarTab;
  terminalInput: string;
  terminalHistory: TerminalCommand[];
  logFilter: LogFilter;
  isTerminalOpen: boolean;
  systemAlerts: SystemAlert[];
}

type BottomBarTab = 'status' | 'terminal' | 'logs' | 'metrics' | 'diagnostics';

interface LogFilter {
  level: LogLevel[];
  source: string[];
  timeRange: TimeRange;
  searchQuery: string;
}
```

## Key Features

### 1. **Operation Status Center**
- Real-time operation progress tracking
- Current task status and completion estimates
- Success/failure indicators with detailed reporting
- Operation queue management and prioritization
- Resource allocation and utilization display

### 2. **Integrated Terminal Interface**
- Full command-line access with NetRunner commands
- Command history and auto-completion
- Multi-tab terminal sessions
- Custom command aliases and shortcuts
- Script execution and automation tools

### 3. **System Monitoring Dashboard**
- CPU, memory, and network utilization metrics
- Service health monitoring and alerts
- Performance trend analysis and reporting
- Resource usage optimization recommendations
- Real-time error and warning notifications

### 4. **Advanced Logging System**
- Multi-level log filtering and search capabilities
- Real-time log streaming and updates
- Log export and analysis tools
- Custom log pattern matching
- Integration with external logging systems

### 5. **Diagnostic and Troubleshooting Tools**
- System health checks and diagnostics
- Network connectivity testing
- Service dependency analysis
- Performance bottleneck identification
- Automated problem detection and reporting

## UI Architecture

### Tab-Based Interface Design
```typescript
const bottomBarTabs = [
  {
    id: 'status',
    label: 'Status',
    icon: <Activity />,
    component: OperationStatusPanel,
    defaultActive: true
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: <Terminal />,
    component: TerminalPanel,
    requiresElevatedAccess: true
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: <FileText />,
    component: LogPanel,
    badge: () => getUnreadLogCount()
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: <BarChart />,
    component: MetricsPanel,
    refreshInterval: 5000
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: <Tool />,
    component: DiagnosticsPanel,
    requiresElevatedAccess: true
  }
];
```

### Collapsible Layout System
```typescript
interface CollapsibleLayoutProps {
  isCollapsed: boolean;
  collapsedHeight: number;
  expandedHeight: number;
  animationDuration: number;
  onToggle: () => void;
}

const CollapsibleBottomBar: React.FC<CollapsibleLayoutProps> = ({
  isCollapsed,
  collapsedHeight = 40,
  expandedHeight = 300,
  animationDuration = 300,
  onToggle
}) => {
  const height = isCollapsed ? collapsedHeight : expandedHeight;
  
  return (
    <div
      className="bottom-bar"
      style={{
        height: `${height}px`,
        transition: `height ${animationDuration}ms ease-in-out`
      }}
    >
      <BottomBarHeader onToggle={onToggle} isCollapsed={isCollapsed} />
      {!isCollapsed && <BottomBarContent />}
    </div>
  );
};
```

## Terminal Integration

### Command Processing System
```typescript
class NetRunnerTerminal {
  private commandHistory: TerminalCommand[] = [];
  private aliases = new Map<string, string>();
  private currentDirectory = '/netrunner';
  
  async executeCommand(input: string): Promise<CommandResult> {
    const command = this.parseCommand(input);
    this.addToHistory(command);
    
    try {
      const result = await this.processCommand(command);
      return {
        success: true,
        output: result.output,
        timestamp: Date.now(),
        executionTime: result.executionTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  private async processCommand(command: ParsedCommand): Promise<ExecutionResult> {
    switch (command.name) {
      case 'scan':
        return await this.executeScanCommand(command.args);
      case 'crawl':
        return await this.executeCrawlCommand(command.args);
      case 'status':
        return await this.executeStatusCommand(command.args);
      case 'logs':
        return await this.executeLogsCommand(command.args);
      case 'help':
        return this.executeHelpCommand(command.args);
      default:
        throw new Error(`Unknown command: ${command.name}`);
    }
  }
}
```

### Command Auto-Completion
```typescript
class CommandAutoComplete {
  private commands = new Map<string, CommandDefinition>();
  private aliases = new Map<string, string>();
  
  getCompletions(input: string): Completion[] {
    const parts = input.trim().split(' ');
    const commandName = parts[0];
    
    if (parts.length === 1) {
      // Complete command names
      return this.getCommandCompletions(commandName);
    } else {
      // Complete command arguments
      return this.getArgumentCompletions(commandName, parts.slice(1));
    }
  }
  
  private getCommandCompletions(partial: string): Completion[] {
    const matches: Completion[] = [];
    
    // Match command names
    for (const [name, definition] of this.commands) {
      if (name.startsWith(partial.toLowerCase())) {
        matches.push({
          value: name,
          description: definition.description,
          type: 'command'
        });
      }
    }
    
    // Match aliases
    for (const [alias, command] of this.aliases) {
      if (alias.startsWith(partial.toLowerCase())) {
        matches.push({
          value: alias,
          description: `Alias for ${command}`,
          type: 'alias'
        });
      }
    }
    
    return matches.sort((a, b) => a.value.localeCompare(b.value));
  }
}
```

## System Monitoring

### Real-Time Metrics Collection
```typescript
interface SystemMetrics {
  cpu: {
    usage: number;
    temperature?: number;
    cores: CoreMetric[];
  };
  memory: {
    used: number;
    available: number;
    cached: number;
    buffers: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    latency: number;
  };
  disk: {
    read: number;
    write: number;
    usage: number;
    available: number;
  };
  services: ServiceMetric[];
}

class SystemMetricsCollector {
  private metricsHistory: SystemMetrics[] = [];
  private maxHistoryLength = 100;
  
  async collectMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      cpu: await this.getCPUMetrics(),
      memory: await this.getMemoryMetrics(),
      network: await this.getNetworkMetrics(),
      disk: await this.getDiskMetrics(),
      services: await this.getServiceMetrics()
    };
    
    this.addToHistory(metrics);
    return metrics;
  }
  
  private addToHistory(metrics: SystemMetrics): void {
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }
  }
  
  getMetricsTrend(metric: string, duration: number): MetricTrend {
    const relevantMetrics = this.metricsHistory
      .filter(m => Date.now() - m.timestamp < duration);
    
    return this.calculateTrend(relevantMetrics, metric);
  }
}
```

### Performance Alerts System
```typescript
class PerformanceAlertSystem {
  private thresholds = new Map<string, AlertThreshold>();
  private activeAlerts = new Set<string>();
  
  checkThresholds(metrics: SystemMetrics): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    
    // CPU usage alert
    if (metrics.cpu.usage > this.getThreshold('cpu.usage')) {
      alerts.push(this.createAlert('high-cpu-usage', {
        current: metrics.cpu.usage,
        threshold: this.getThreshold('cpu.usage'),
        severity: 'warning'
      }));
    }
    
    // Memory usage alert
    const memoryUsagePercent = (metrics.memory.used / (metrics.memory.used + metrics.memory.available)) * 100;
    if (memoryUsagePercent > this.getThreshold('memory.usage')) {
      alerts.push(this.createAlert('high-memory-usage', {
        current: memoryUsagePercent,
        threshold: this.getThreshold('memory.usage'),
        severity: 'warning'
      }));
    }
    
    // Service health alerts
    metrics.services.forEach(service => {
      if (service.health === 'unhealthy') {
        alerts.push(this.createAlert('service-unhealthy', {
          service: service.name,
          status: service.health,
          severity: 'error'
        }));
      }
    });
    
    return alerts;
  }
}
```

## Logging System

### Advanced Log Management
```typescript
interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  category?: string;
  tags?: string[];
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

class AdvancedLogManager {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private filters: LogFilter[] = [];
  
  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      id: generateLogId(),
      timestamp: Date.now()
    };
    
    this.logs.unshift(logEntry);
    
    // Enforce log limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Check for alert conditions
    this.checkLogAlerts(logEntry);
    
    // Notify subscribers
    this.notifyLogSubscribers(logEntry);
  }
  
  filterLogs(filter: LogFilter): LogEntry[] {
    return this.logs.filter(log => {
      // Level filter
      if (filter.level.length > 0 && !filter.level.includes(log.level)) {
        return false;
      }
      
      // Source filter
      if (filter.source.length > 0 && !filter.source.includes(log.source)) {
        return false;
      }
      
      // Time range filter
      if (filter.timeRange) {
        if (log.timestamp < filter.timeRange.start || log.timestamp > filter.timeRange.end) {
          return false;
        }
      }
      
      // Search query filter
      if (filter.searchQuery) {
        const searchLower = filter.searchQuery.toLowerCase();
        if (!log.message.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  exportLogs(format: 'json' | 'csv' | 'txt', filter?: LogFilter): string {
    const logsToExport = filter ? this.filterLogs(filter) : this.logs;
    
    switch (format) {
      case 'json':
        return JSON.stringify(logsToExport, null, 2);
      case 'csv':
        return this.convertToCSV(logsToExport);
      case 'txt':
        return this.convertToText(logsToExport);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}
```

### Real-Time Log Streaming
```typescript
class LogStreamManager {
  private streams = new Map<string, LogStream>();
  private subscribers = new Set<LogSubscriber>();
  
  createStream(source: string, filter?: LogFilter): LogStream {
    const stream = new LogStream(source, filter);
    this.streams.set(source, stream);
    return stream;
  }
  
  broadcastLog(log: LogEntry): void {
    // Send to relevant streams
    this.streams.forEach((stream, source) => {
      if (stream.matchesFilter(log)) {
        stream.addLog(log);
      }
    });
    
    // Notify subscribers
    this.subscribers.forEach(subscriber => {
      subscriber.onLogReceived(log);
    });
  }
}

class LogStream {
  private buffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  
  constructor(
    private source: string,
    private filter?: LogFilter
  ) {}
  
  addLog(log: LogEntry): void {
    if (this.matchesFilter(log)) {
      this.buffer.unshift(log);
      
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.pop();
      }
      
      this.notifyStreamSubscribers(log);
    }
  }
  
  matchesFilter(log: LogEntry): boolean {
    if (!this.filter) return true;
    
    // Apply filter logic
    return this.applyLogFilter(log, this.filter);
  }
}
```

## Diagnostic Tools

### System Health Checker
```typescript
class SystemHealthChecker {
  async performHealthCheck(): Promise<HealthCheckReport> {
    const checks = [
      this.checkCPUHealth(),
      this.checkMemoryHealth(),
      this.checkNetworkHealth(),
      this.checkServiceHealth(),
      this.checkDiskHealth(),
      this.checkDependencyHealth()
    ];
    
    const results = await Promise.allSettled(checks);
    
    return this.compileHealthReport(results);
  }
  
  private async checkServiceHealth(): Promise<ServiceHealthResult> {
    const services = ['scanner', 'crawler', 'intelligence', 'database'];
    const results: ServiceHealthCheck[] = [];
    
    for (const service of services) {
      try {
        const startTime = Date.now();
        const response = await this.pingService(service);
        const responseTime = Date.now() - startTime;
        
        results.push({
          name: service,
          status: response.status === 'healthy' ? 'healthy' : 'unhealthy',
          responseTime,
          details: response.details
        });
      } catch (error) {
        results.push({
          name: service,
          status: 'offline',
          responseTime: -1,
          error: error.message
        });
      }
    }
    
    return {
      overall: this.calculateOverallServiceHealth(results),
      services: results
    };
  }
  
  private async checkDependencyHealth(): Promise<DependencyHealthResult> {
    const dependencies = [
      { name: 'External APIs', check: () => this.checkExternalAPIs() },
      { name: 'Database Connection', check: () => this.checkDatabaseConnection() },
      { name: 'File System', check: () => this.checkFileSystemAccess() },
      { name: 'Network Connectivity', check: () => this.checkNetworkConnectivity() }
    ];
    
    const results = await Promise.all(
      dependencies.map(async dep => ({
        name: dep.name,
        result: await dep.check()
      }))
    );
    
    return {
      overall: results.every(r => r.result.healthy) ? 'healthy' : 'degraded',
      dependencies: results
    };
  }
}
```

### Network Diagnostic Tools
```typescript
class NetworkDiagnostics {
  async performNetworkTests(): Promise<NetworkTestResults> {
    const tests = [
      this.testLatency(),
      this.testBandwidth(),
      this.testDNSResolution(),
      this.testExternalConnectivity(),
      this.testAPIEndpoints()
    ];
    
    const results = await Promise.allSettled(tests);
    
    return this.compileNetworkResults(results);
  }
  
  private async testLatency(): Promise<LatencyTestResult> {
    const testHosts = ['8.8.8.8', 'cloudflare.com', 'google.com'];
    const results: LatencyMeasurement[] = [];
    
    for (const host of testHosts) {
      try {
        const startTime = performance.now();
        await fetch(`https://${host}`, { method: 'HEAD', mode: 'no-cors' });
        const latency = performance.now() - startTime;
        
        results.push({
          host,
          latency,
          status: 'success'
        });
      } catch (error) {
        results.push({
          host,
          latency: -1,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return {
      average: results.filter(r => r.status === 'success')
        .reduce((sum, r) => sum + r.latency, 0) / results.length,
      measurements: results
    };
  }
}
```

## Testing Strategy

### Component Testing
```typescript
describe('NetRunnerBottomBar', () => {
  it('should toggle collapse state correctly', () => {
    const onToggle = jest.fn();
    const component = render(
      <NetRunnerBottomBar onToggleCollapse={onToggle} />
    );
    
    fireEvent.click(component.getByTestId('collapse-toggle'));
    expect(onToggle).toHaveBeenCalled();
  });
  
  it('should execute terminal commands', async () => {
    const onExecute = jest.fn().mockResolvedValue({
      success: true,
      output: 'Command executed successfully'
    });
    
    const component = render(
      <NetRunnerBottomBar onExecuteCommand={onExecute} showTerminal={true} />
    );
    
    const input = component.getByTestId('terminal-input');
    fireEvent.change(input, { target: { value: 'status' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(onExecute).toHaveBeenCalledWith('status');
    });
  });
  
  it('should filter logs correctly', () => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: Date.now(),
        level: 'error',
        source: 'scanner',
        message: 'Test error message'
      },
      {
        id: '2',
        timestamp: Date.now(),
        level: 'info',
        source: 'crawler',
        message: 'Test info message'
      }
    ];
    
    const component = render(
      <NetRunnerBottomBar activeLogs={mockLogs} />
    );
    
    // Filter by error level
    fireEvent.click(component.getByTestId('filter-error'));
    
    expect(component.getByText('Test error message')).toBeInTheDocument();
    expect(component.queryByText('Test info message')).not.toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
describe('NetRunnerBottomBar Integration', () => {
  it('should integrate with terminal system', async () => {
    const terminalSystem = new NetRunnerTerminal();
    const component = render(
      <NetRunnerBottomBar terminalSystem={terminalSystem} />
    );
    
    // Execute command through terminal
    await terminalSystem.executeCommand('scan https://example.com');
    
    // Verify command appears in history
    expect(component.getByText('scan https://example.com')).toBeInTheDocument();
  });
  
  it('should respond to system metric updates', async () => {
    const metricsCollector = new SystemMetricsCollector();
    const component = render(
      <NetRunnerBottomBar metricsCollector={metricsCollector} />
    );
    
    // Simulate metric update
    const metrics = await metricsCollector.collectMetrics();
    
    await waitFor(() => {
      expect(component.getByTestId('cpu-usage')).toHaveTextContent(
        `${metrics.cpu.usage}%`
      );
    });
  });
});
```

## Usage Examples

### Basic Implementation
```typescript
import React from 'react';
import { NetRunnerBottomBar } from './components/layout/NetRunnerBottomBar';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  
  const handleExecuteCommand = async (command: string): Promise<CommandResult> => {
    // Custom command execution logic
    return await terminalService.execute(command);
  };
  
  return (
    <NetRunnerBottomBar
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      systemMetrics={systemMetrics}
      onExecuteCommand={handleExecuteCommand}
      showTerminal={true}
    />
  );
}
```

### Advanced Configuration
```typescript
const advancedBottomBarConfig = {
  terminal: {
    maxHistory: 500,
    autoComplete: true,
    customCommands: customCommandSet,
    aliases: commandAliases
  },
  logging: {
    maxLogs: 20000,
    autoExport: true,
    alertThresholds: logAlertConfig
  },
  metrics: {
    updateInterval: 3000,
    historyLength: 200,
    alertThresholds: metricsAlertConfig
  }
};

<NetRunnerBottomBar
  config={advancedBottomBarConfig}
  onSystemAlert={handleSystemAlert}
  onLogExport={handleLogExport}
  onDiagnosticComplete={handleDiagnosticResults}
/>
```

This comprehensive documentation provides complete coverage of the NetRunnerBottomBar component, including all major features, implementation details, and usage examples.
