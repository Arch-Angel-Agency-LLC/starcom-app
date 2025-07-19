# NetRunner Service API Reference

## WebsiteScanner Service

**Location:** `src/applications/netrunner/services/WebsiteScanner.ts`

### Core Methods

#### `scanWebsite(url: string, onProgress?: (progress: number, status: string) => void): Promise<ScanResult>`

Performs comprehensive website analysis including security vulnerabilities, technology detection, and OSINT data extraction.

**Parameters:**
- `url` - Target URL to scan
- `onProgress` - Optional callback for progress updates (0-100)

**Returns:** `ScanResult` object containing:
```typescript
interface ScanResult {
  url: string;
  title: string;
  status: 'scanning' | 'completed' | 'error';
  progress: number;
  sourceCode: string;              // Full HTML source
  vulnerabilities: Vulnerability[];
  osintData: OSINTData;
  metadata: WebsiteMetadata;
  timestamp: number;
}
```

**Usage Example:**
```typescript
import { websiteScanner } from '../services/WebsiteScanner';

const result = await websiteScanner.scanWebsite(
  'https://example.com',
  (progress, status) => {
    console.log(`${status}: ${progress}%`);
  }
);

console.log('Source code:', result.sourceCode);
console.log('Vulnerabilities:', result.vulnerabilities);
```

### Data Structures

#### `Vulnerability`
```typescript
interface Vulnerability {
  id: string;
  title: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  impact: string;
  recommendation: string;
  cve?: string;
  score?: number;
}
```

#### `OSINTData`
```typescript
interface OSINTData {
  emails: string[];
  socialMedia: string[];
  technologies: Technology[];
  serverInfo: string[];
  subdomains: string[];
  certificates: CertificateInfo[];
  dns: DNSRecord[];
}
```

---

## AdvancedOSINTCrawler Service

**Location:** `src/applications/netrunner/services/AdvancedOSINTCrawler.ts`

### Core Methods

#### `startAdvancedCrawl(targetUrl: string, options?: CrawlOptions, onProgress?: ProgressCallback): Promise<CrawlResult>`

Performs deep web crawling and intelligence gathering across target domains.

**Parameters:**
```typescript
interface CrawlOptions {
  maxDepth?: number;           // Default: 3
  maxUrls?: number;           // Default: 100  
  includeWayback?: boolean;   // Default: false
  includeGitHub?: boolean;    // Default: false
  includeDirectoryBruteforce?: boolean; // Default: true
}

type ProgressCallback = (progress: number, status: string, found?: number) => void;
```

**Returns:** `CrawlResult` containing:
```typescript
interface CrawlResult {
  targetUrl: string;
  discoveredUrls: CrawlTarget[];
  scannedResults: Map<string, ScanResult>;
  intelligence: IntelligenceData;
  progress: number;
  status: 'crawling' | 'completed' | 'error';
  timestamp: number;
}
```

**Intelligence Data:**
```typescript
interface IntelligenceData {
  hiddenDirectories: string[];
  adminPanels: string[];
  apiEndpoints: string[];
  backupFiles: string[];
  configFiles: string[];
  databaseFiles: string[];
  logFiles: string[];
  documentFiles: string[];
  archiveFiles: string[];
  sourceCodeLeaks: string[];
  credentials: CredentialLeak[];
  sensitiveData: SensitiveDataLeak[];
  waybackHistory: WaybackSnapshot[];
  githubLeaks: GitHubLeak[];
}
```

**Usage Example:**
```typescript
import { advancedOSINTCrawler } from '../services/AdvancedOSINTCrawler';

const crawlResult = await advancedOSINTCrawler.startAdvancedCrawl(
  'https://target.com',
  {
    maxDepth: 3,
    maxUrls: 100,
    includeWayback: true,
    includeGitHub: true
  },
  (progress, status, found) => {
    console.log(`${status}: ${progress}% (${found} URLs found)`);
  }
);

console.log('Hidden directories:', crawlResult.intelligence.hiddenDirectories);
console.log('Admin panels:', crawlResult.intelligence.adminPanels);
```

---

## NetRunnerPowerTools Service

**Location:** `src/applications/netrunner/tools/NetRunnerPowerTools.ts`

### Tool Registry

#### `getPowerToolsByCategory(category: string): PowerTool[]`

Retrieves tools by category (discovery, scraping, analysis, etc.).

#### `getToolById(id: string): PowerTool | undefined`

Gets specific tool by ID.

**Tool Categories:**
- `discovery` - Initial reconnaissance tools
- `scraping` - Data extraction tools  
- `aggregation` - Data consolidation tools
- `analysis` - Data processing tools
- `verification` - Data validation tools
- `visualization` - Data presentation tools
- `automation` - Autonomous operation tools

**Tool Structure:**
```typescript
interface PowerTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  capabilities: string[];
  premium: boolean;
  automationCompatible: boolean;
  source: string;
  license: string;
  apiEndpoints?: string[];
  intelTypes: IntelType[];
}
```

**Usage Example:**
```typescript
import { powerToolRegistry } from '../tools/NetRunnerPowerTools';

const discoveryTools = powerToolRegistry.getPowerToolsByCategory('discovery');
const shodanTool = powerToolRegistry.getToolById('shodan-search');

if (shodanTool) {
  console.log('Shodan capabilities:', shodanTool.capabilities);
}
```

---

## NetRunnerLogger Service

**Location:** `src/applications/netrunner/services/logging/NetRunnerLogger.ts`

### Logging Methods

#### `LoggerFactory.getLogger(component: string): Logger`

Creates logger instance for specific component.

**Log Levels:**
- `debug(message, context?)` - Development debugging
- `info(message, context?)` - General information
- `warn(message, context?)` - Warning conditions
- `error(message, context?)` - Error conditions

**Usage Example:**
```typescript
import { LoggerFactory } from '../services/logging';

const logger = LoggerFactory.getLogger('NetRunnerCenterView');

logger.info('Scan started', { target: url, timestamp: Date.now() });
logger.error('Scan failed', { error: error.message, target: url });
```

---

## WorkflowEngine Service

**Location:** `src/applications/netrunner/integration/WorkflowEngine.ts`

### Workflow Management

#### `createWorkflow(config: WorkflowConfig): Promise<Workflow>`

Creates new automated workflow.

#### `executeWorkflow(workflowId: string): Promise<WorkflowResult>`

Executes existing workflow.

**Workflow Types:**
- Intelligence Gathering
- Vulnerability Assessment  
- Competitive Analysis
- Digital Forensics
- Threat Hunting

**Usage Example:**
```typescript
import { workflowEngine } from '../integration/WorkflowEngine';

const workflow = await workflowEngine.createWorkflow({
  name: 'Domain Intelligence',
  target: 'example.com',
  tools: ['shodan', 'theHarvester', 'builtwith'],
  automation: true
});

const result = await workflowEngine.executeWorkflow(workflow.id);
```

---

## Error Handling

### NetRunnerError Service

**Location:** `src/applications/netrunner/services/error/NetRunnerError.ts`

**Error Categories:**
- `NETWORK_ERROR` - Connection/proxy issues
- `SCAN_ERROR` - Scanning operation failures  
- `ANALYSIS_ERROR` - Data processing failures
- `TOOL_ERROR` - OSINT tool execution failures
- `WORKFLOW_ERROR` - Automation workflow failures

**Usage Example:**
```typescript
import { NetRunnerError, ErrorCodes } from '../services/error/NetRunnerError';

try {
  const result = await websiteScanner.scanWebsite(url);
} catch (error) {
  if (error instanceof NetRunnerError) {
    console.log('Error code:', error.code);
    console.log('Error category:', error.category);
  }
}
```

---

## Integration Examples

### Center View Integration
```typescript
// Complete center view scanning integration
const handleScan = async () => {
  const logger = LoggerFactory.getLogger('CenterView');
  
  try {
    setIsScanning(true);
    
    // Start basic scan
    const scanResult = await websiteScanner.scanWebsite(target, (progress, status) => {
      setProgress(progress);
      setStatus(status);
    });
    
    // Display source code
    setSourceCode(scanResult.sourceCode);
    
    // Start advanced crawl if needed
    if (enableAdvancedCrawl) {
      const crawlResult = await advancedOSINTCrawler.startAdvancedCrawl(target);
      setIntelligenceData(crawlResult.intelligence);
    }
    
    logger.info('Scan completed successfully', { target, timestamp: Date.now() });
    
  } catch (error) {
    logger.error('Scan failed', { error: error.message, target });
    setError(error.message);
  } finally {
    setIsScanning(false);
  }
};
```

### PowerTool Execution
```typescript
// Execute OSINT tool with error handling
const executeTool = async (toolId: string, params: any) => {
  const logger = LoggerFactory.getLogger('PowerTools');
  
  try {
    const tool = powerToolRegistry.getToolById(toolId);
    if (!tool) throw new NetRunnerError(`Tool ${toolId} not found`, 'TOOL_ERROR');
    
    const adapter = await AdapterRegistry.getAdapter(toolId);
    const results = await adapter.execute(params);
    
    logger.info('Tool executed successfully', { toolId, results: results.length });
    return results;
    
  } catch (error) {
    logger.error('Tool execution failed', { toolId, error: error.message });
    throw error;
  }
};
```

---
*Complete API documentation for all NetRunner services*
