# Nmap Tool Implementation Guide

## Overview
The Nmap tool provides comprehensive network discovery and security auditing capabilities through integration with the Nmap network scanner, enabling port scanning, service detection, and vulnerability assessment.

## Current State
**Status:** ❌ Mock/Demo Implementation
- Basic UI mockup with static scan results
- No actual Nmap integration or execution
- Limited scan configuration options
- No real-time scanning capabilities

## Technical Requirements

### Component Location
- **File:** `src/applications/netrunner/components/PowerToolsPanel.tsx`
- **Adapter:** `src/applications/netrunner/tools/adapters/NmapAdapterProd.ts` (to be created)
- **Integration Point:** Network reconnaissance toolkit

### Required Functionality
1. **Port Scanning**
   - TCP/UDP port scanning
   - Stealth SYN scanning
   - Port range specification
   - Service version detection

2. **Host Discovery**
   - Network range scanning
   - Live host identification
   - OS fingerprinting
   - MAC address detection

3. **Service Enumeration**
   - Service version detection
   - Script scanning (NSE)
   - Vulnerability detection
   - SSL/TLS analysis

4. **Advanced Scanning**
   - Custom timing templates
   - Fragmentation and decoy scanning
   - IPv6 support
   - Firewall evasion techniques

## Implementation Plan

### Phase 1: Core Nmap Integration
1. **Nmap Adapter Development**
   ```typescript
   // src/applications/netrunner/tools/adapters/NmapAdapterProd.ts
   class NmapAdapterProd implements OSINTAdapter {
     async portScan(target: string, options: ScanOptions): Promise<ScanResult>
     async hostDiscovery(network: string, options: DiscoveryOptions): Promise<HostResult[]>
     async serviceDetection(target: string, ports: number[]): Promise<ServiceResult[]>
     async scriptScan(target: string, scripts: string[]): Promise<ScriptResult[]>
   }
   ```

2. **Scan Configuration Management**
   ```typescript
   interface ScanOptions {
     scanType: 'tcp' | 'udp' | 'syn' | 'ack' | 'connect';
     ports: string; // "1-1000", "80,443,8080", "top-ports 1000"
     timing: 0 | 1 | 2 | 3 | 4 | 5; // T0-T5 timing templates
     aggressive: boolean; // -A flag
     serviceDetection: boolean; // -sV flag
     osDetection: boolean; // -O flag
     scriptScan: string[]; // NSE scripts
     fragmentPackets: boolean; // -f flag
     decoys: string[]; // -D flag
     sourcePort: number; // --source-port
     randomizeHosts: boolean; // --randomize-hosts
   }
   ```

### Phase 2: Command Execution Engine
1. **Secure Command Execution**
   ```typescript
   class NmapExecutor {
     private sanitizeInput(input: string): string;
     private validateCommand(command: string[]): boolean;
     private executeCommand(command: string[]): Promise<ExecutionResult>;
     private parseOutput(output: string): ScanResult;
   }
   ```

2. **Real-time Progress Monitoring**
   ```typescript
   interface ScanProgress {
     scanId: string;
     status: 'initializing' | 'scanning' | 'completed' | 'error';
     progress: number; // 0-100
     currentTarget: string;
     hostsCompleted: number;
     hostsTotal: number;
     portsCompleted: number;
     portsTotal: number;
     estimatedTimeRemaining: number;
   }
   ```

### Phase 3: Advanced Features and Analysis
1. **NSE Script Management**
   ```typescript
   interface NSEScriptManager {
     getAvailableScripts(): Promise<NSEScript[]>;
     getScriptCategories(): string[];
     getScriptsByCategory(category: string): NSEScript[];
     validateScript(scriptName: string): boolean;
     getScriptDocumentation(scriptName: string): Promise<string>;
   }
   ```

2. **Result Analysis Engine**
   ```typescript
   class NmapResultAnalyzer {
     analyzeVulnerabilities(results: ScanResult[]): VulnerabilityReport;
     identifyServiceVersions(results: ScanResult[]): ServiceInventory;
     assessSecurityPosture(results: ScanResult[]): SecurityAssessment;
     generateRecommendations(results: ScanResult[]): SecurityRecommendation[];
   }
   ```

## Nmap Command Integration

### Command Builder
```typescript
class NmapCommandBuilder {
  buildPortScanCommand(target: string, options: ScanOptions): string[] {
    const command = ['nmap'];
    
    // Scan type
    switch (options.scanType) {
      case 'syn': command.push('-sS'); break;
      case 'tcp': command.push('-sT'); break;
      case 'udp': command.push('-sU'); break;
      case 'ack': command.push('-sA'); break;
    }
    
    // Port specification
    if (options.ports) {
      command.push('-p', options.ports);
    }
    
    // Timing template
    command.push(`-T${options.timing}`);
    
    // Additional flags
    if (options.serviceDetection) command.push('-sV');
    if (options.osDetection) command.push('-O');
    if (options.aggressive) command.push('-A');
    if (options.fragmentPackets) command.push('-f');
    
    // Scripts
    if (options.scriptScan.length > 0) {
      command.push('--script', options.scriptScan.join(','));
    }
    
    // Output format
    command.push('-oX', '-'); // XML output to stdout
    
    command.push(target);
    return command;
  }
}
```

### Output Parsing
```typescript
interface NmapOutputParser {
  parseXMLOutput(xmlOutput: string): ScanResult;
  parseHostInfo(hostElement: XMLElement): HostInfo;
  parsePortInfo(portElement: XMLElement): PortInfo;
  parseScriptOutput(scriptElement: XMLElement): ScriptResult;
  parseOSInfo(osElement: XMLElement): OSInfo;
}

interface ScanResult {
  scanId: string;
  timestamp: Date;
  command: string;
  targets: string[];
  hosts: HostInfo[];
  summary: ScanSummary;
  warnings: string[];
  errors: string[];
}

interface HostInfo {
  ip: string;
  hostname?: string;
  status: 'up' | 'down' | 'unknown';
  mac?: string;
  vendor?: string;
  os?: OSInfo;
  ports: PortInfo[];
  scripts: ScriptResult[];
  lastSeen: Date;
}

interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered' | 'unfiltered' | 'open|filtered' | 'closed|filtered';
  service?: ServiceInfo;
  reason: string;
  scripts: ScriptResult[];
}
```

## User Interface Design

### Scan Configuration Panel
```typescript
interface NmapScanConfigProps {
  onScanStart: (config: ScanConfiguration) => void;
  presets: ScanPreset[];
  defaultConfig: ScanConfiguration;
}

interface ScanConfiguration {
  targets: string[];
  scanType: ScanType;
  portRange: string;
  timing: number;
  enabledFeatures: ScanFeature[];
  nseScripts: string[];
  outputFormats: OutputFormat[];
}

interface ScanPreset {
  name: string;
  description: string;
  config: ScanConfiguration;
  icon: string;
}
```

### Real-time Scan Monitor
```typescript
interface ScanMonitorProps {
  activeScan: ScanProgress;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSaveResults: () => void;
}
```

### Results Visualization
```typescript
interface NmapResultsViewProps {
  results: ScanResult[];
  selectedHost?: string;
  onHostSelect: (hostId: string) => void;
  onPortSelect: (port: PortInfo) => void;
  onExport: (format: ExportFormat) => void;
}
```

## Scan Templates and Presets

### Pre-configured Scan Types
```typescript
const SCAN_PRESETS: ScanPreset[] = [
  {
    name: 'Quick Scan',
    description: 'Fast scan of most common ports',
    config: {
      scanType: 'syn',
      portRange: 'top-ports 1000',
      timing: 4,
      enabledFeatures: ['service-detection']
    }
  },
  {
    name: 'Comprehensive Scan',
    description: 'Thorough scan with OS detection and scripts',
    config: {
      scanType: 'syn',
      portRange: '1-65535',
      timing: 3,
      enabledFeatures: ['service-detection', 'os-detection', 'script-scan']
    }
  },
  {
    name: 'Stealth Scan',
    description: 'Low-profile scan to avoid detection',
    config: {
      scanType: 'syn',
      portRange: 'top-ports 100',
      timing: 1,
      enabledFeatures: ['fragment-packets', 'randomize-hosts']
    }
  },
  {
    name: 'Vulnerability Scan',
    description: 'Scan focused on vulnerability detection',
    config: {
      scanType: 'syn',
      portRange: 'top-ports 1000',
      timing: 3,
      nseScripts: ['vuln', 'safe']
    }
  }
];
```

### Custom Script Collections
```typescript
const NSE_SCRIPT_CATEGORIES = {
  'Vulnerability Detection': [
    'smb-vuln-ms17-010',
    'http-vuln-cve2017-5638',
    'ssl-heartbleed',
    'smb-vuln-conficker'
  ],
  'Service Enumeration': [
    'http-enum',
    'smb-enum-shares',
    'ftp-anon',
    'ssh-hostkey'
  ],
  'Web Application': [
    'http-title',
    'http-headers',
    'http-methods',
    'http-robots.txt'
  ],
  'SSL/TLS Analysis': [
    'ssl-cert',
    'ssl-enum-ciphers',
    'sslv2-drown',
    'ssl-dh-params'
  ]
};
```

## Security and Safety Features

### Input Validation and Sanitization
```typescript
class NmapInputValidator {
  validateTarget(target: string): ValidationResult {
    // Validate IP addresses, CIDR ranges, hostnames
    // Prevent command injection
    // Check for prohibited targets
  }
  
  validatePortRange(ports: string): ValidationResult {
    // Validate port specifications
    // Prevent invalid ranges
    // Limit maximum port count
  }
  
  validateScripts(scripts: string[]): ValidationResult {
    // Validate NSE script names
    // Check for dangerous scripts
    // Ensure scripts exist
  }
}
```

### Execution Safety
```typescript
interface ExecutionSafeguards {
  maxConcurrentScans: number;
  maxScanDuration: number;
  prohibitedTargets: string[];
  rateLimiting: RateLimitConfig;
  resourceLimits: ResourceLimits;
}
```

### Network Safety
```typescript
interface NetworkSafety {
  preventSelfScan: boolean;
  blockInternalNetworks: boolean;
  requireTargetWhitelisting: boolean;
  auditAllScans: boolean;
  respectRateLimits: boolean;
}
```

## Integration Points

### Workflow Integration
```typescript
interface NmapWorkflowIntegration {
  // Automated follow-up scans
  schedulePeriodicScan(target: string, interval: string): Promise<ScheduledScan>;
  
  // Integration with other tools
  sendToVulnerabilityScanner(ports: PortInfo[]): Promise<VulnScanJob>;
  sendToServiceAnalyzer(services: ServiceInfo[]): Promise<ServiceAnalysis>;
  
  // Alert generation
  generateAlertsForNewServices(baseline: ScanResult, current: ScanResult): Alert[];
  detectChanges(previous: ScanResult, current: ScanResult): ChangeDetection[];
}
```

### Export and Reporting
```typescript
interface NmapExporter {
  exportToXML(results: ScanResult[]): Promise<string>;
  exportToJSON(results: ScanResult[]): Promise<string>;
  exportToCSV(results: ScanResult[]): Promise<string>;
  generatePenetrationTestReport(results: ScanResult[]): Promise<ReportDocument>;
  createNetworkMap(results: ScanResult[]): Promise<NetworkDiagram>;
}
```

## Performance Optimization

### Scan Optimization
```typescript
class ScanOptimizer {
  optimizePortRange(target: string, objective: ScanObjective): string;
  selectOptimalTiming(networkConditions: NetworkConditions): number;
  distributeTargets(targets: string[]): ScanBatch[];
  estimateScanDuration(config: ScanConfiguration): number;
}
```

### Resource Management
```typescript
interface ResourceManager {
  manageConcurrentScans(scans: ActiveScan[]): Promise<void>;
  monitorSystemResources(): SystemResources;
  adjustScanParameters(resources: SystemResources): ScanAdjustments;
  cleanupCompletedScans(): Promise<void>;
}
```

## Testing Strategy

### Unit Testing
```typescript
describe('NmapAdapter', () => {
  test('should build correct nmap command', () => {
    const command = builder.buildPortScanCommand('192.168.1.1', options);
    expect(command).toContain('nmap');
    expect(command).toContain('-sS');
    expect(command).toContain('192.168.1.1');
  });
  
  test('should parse XML output correctly', () => {
    const result = parser.parseXMLOutput(sampleXMLOutput);
    expect(result.hosts).toHaveLength(1);
    expect(result.hosts[0].ports).toHaveLength(greaterThan(0));
  });
});
```

### Integration Testing
- Command execution and output parsing
- Real network scanning (controlled environment)
- Error handling and recovery
- Performance under load

### Security Testing
- Input validation effectiveness
- Command injection prevention
- Access control verification
- Audit trail completeness

## Dependencies

### System Requirements
```json
{
  "nmap": "^7.93",
  "node": ">=16.0.0",
  "platform": ["linux", "darwin", "win32"]
}
```

### Node.js Packages
```json
{
  "child_process": "built-in",
  "xml2js": "^0.4.23",
  "validator": "^13.7.0",
  "ip-range-check": "^0.2.0"
}
```

## Success Metrics

### Functional Metrics
- Scan accuracy and completeness
- Service detection accuracy
- Script execution success rate
- Vulnerability detection effectiveness

### Performance Metrics
- Scan completion times
- Resource utilization efficiency
- Concurrent scan handling
- Error rates and recovery

### Security Metrics
- Input validation effectiveness
- Command injection prevention
- Access control compliance
- Audit completeness

## Future Enhancements

### Advanced Features
- Machine learning for scan optimization
- Automated vulnerability correlation
- Intelligent target prioritization
- Custom NSE script development

### Integration Enhancements
- SIEM integration for alerting
- Vulnerability management system integration
- Asset management system updates
- Continuous compliance monitoring

---

**Implementation Priority:** High (Core network reconnaissance tool)
**Estimated Effort:** 3-4 weeks
**Dependencies:** System nmap installation, command execution framework
**Testing Required:** Unit, Integration, Security, Performance

**⚠️ Security Note:** Nmap integration requires careful security controls to prevent misuse and ensure compliance with network scanning policies.
