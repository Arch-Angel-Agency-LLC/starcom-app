# AdvancedOSINTCrawler Service Documentation

## Overview

The AdvancedOSINTCrawler service provides military-grade deep web reconnaissance capabilities, discovering hidden URLs, endpoints, and intelligence assets across target domains through multiple discovery techniques and external intelligence sources.

## Service Specification

### Purpose
- Deep web reconnaissance and hidden endpoint discovery
- Multi-source URL and intelligence gathering
- Historical data analysis through Wayback Machine integration
- GitHub repository scanning for sensitive data leaks
- Comprehensive target domain mapping

### Core Capabilities
- **URL Discovery**: Robots.txt, sitemaps, directory brute-forcing
- **Historical Analysis**: Wayback Machine integration
- **Source Code Intelligence**: GitHub leak detection
- **Credential Discovery**: Sensitive data pattern matching
- **Intelligence Correlation**: Cross-source data analysis

## API Interface

### Primary Methods

#### crawlTarget()
```typescript
async crawlTarget(
  domain: string,
  options: CrawlOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<CrawlResult>
```

**Parameters:**
- `domain`: Target domain for reconnaissance
- `options`: Crawl configuration and limits
- `onProgress`: Real-time progress updates

**Returns:** Comprehensive crawl results with discovered URLs and intelligence

### Data Structures

#### CrawlResult
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

#### CrawlTarget
```typescript
interface CrawlTarget {
  url: string;
  depth: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: 'robots' | 'sitemap' | 'links' | 'directory' | 'wordlist' | 'wayback' | 'github';
  discovered: number;
}
```

#### IntelligenceData
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

## Discovery Techniques

### 1. Robots.txt Analysis
```typescript
private async analyzeRobots(baseUrl: string): Promise<CrawlTarget[]> {
  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await this.fetchWithFallback(robotsUrl);
    
    const disallowedPaths = this.parseRobotsDisallow(response.html);
    return disallowedPaths.map(path => ({
      url: `${baseUrl}${path}`,
      depth: 1,
      priority: 'high',
      source: 'robots',
      discovered: Date.now()
    }));
  } catch (error) {
    console.log('Robots.txt not accessible');
    return [];
  }
}
```

### 2. Sitemap Discovery
```typescript
private async discoverSitemaps(baseUrl: string): Promise<CrawlTarget[]> {
  const commonSitemaps = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemaps.xml',
    '/sitemap.txt'
  ];
  
  const discovered: CrawlTarget[] = [];
  
  for (const sitemapPath of commonSitemaps) {
    try {
      const sitemapUrl = `${baseUrl}${sitemapPath}`;
      const response = await this.fetchWithFallback(sitemapUrl);
      const urls = this.parseSitemap(response.html);
      
      discovered.push(...urls.map(url => ({
        url,
        depth: 1,
        priority: 'medium',
        source: 'sitemap',
        discovered: Date.now()
      })));
    } catch (error) {
      // Sitemap not found, continue
    }
  }
  
  return discovered;
}
```

### 3. Directory Brute-Forcing
```typescript
private async bruteForceDirectories(baseUrl: string): Promise<CrawlTarget[]> {
  const commonDirectories = [
    '/admin', '/administrator', '/wp-admin', '/cpanel',
    '/api', '/v1', '/v2', '/rest', '/graphql',
    '/backup', '/backups', '/old', '/bak',
    '/config', '/configuration', '/settings',
    '/test', '/testing', '/dev', '/development',
    '/uploads', '/files', '/assets', '/media'
  ];
  
  const discovered: CrawlTarget[] = [];
  
  const checkPromises = commonDirectories.map(async (dir) => {
    try {
      const testUrl = `${baseUrl}${dir}`;
      const response = await fetch(testUrl, { method: 'HEAD' });
      
      if (response.status < 400) {
        discovered.push({
          url: testUrl,
          depth: 1,
          priority: this.prioritizeDirectory(dir),
          source: 'directory',
          discovered: Date.now()
        });
      }
    } catch (error) {
      // Directory not accessible
    }
  });
  
  await Promise.allSettled(checkPromises);
  return discovered;
}
```

### 4. Wayback Machine Integration
```typescript
private async searchWaybackMachine(domain: string): Promise<WaybackSnapshot[]> {
  try {
    const waybackUrl = `http://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&limit=100`;
    const response = await fetch(waybackUrl);
    const data = await response.json();
    
    return data.slice(1).map((entry: any[]) => ({
      timestamp: entry[1],
      url: entry[2],
      statusCode: entry[4],
      digest: entry[5],
      length: entry[6]
    }));
  } catch (error) {
    console.error('Wayback Machine search failed:', error);
    return [];
  }
}
```

### 5. GitHub Leak Detection
```typescript
private async searchGitHubLeaks(domain: string): Promise<GitHubLeak[]> {
  try {
    const searchQueries = [
      `"${domain}" password`,
      `"${domain}" api_key`,
      `"${domain}" secret`,
      `"${domain}" config`
    ];
    
    const leaks: GitHubLeak[] = [];
    
    for (const query of searchQueries) {
      const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      data.items?.forEach((item: any) => {
        leaks.push({
          repository: item.repository.full_name,
          filename: item.name,
          path: item.path,
          url: item.html_url,
          score: item.score
        });
      });
    }
    
    return leaks;
  } catch (error) {
    console.error('GitHub search failed:', error);
    return [];
  }
}
```

## Intelligence Analysis

### Credential Detection
```typescript
private detectCredentials(content: string, url: string): CredentialLeak[] {
  const patterns = {
    username: /(?:user|username|login)["\s]*[:=]["\s]*([a-zA-Z0-9._-]+)/gi,
    password: /(?:pass|password|pwd)["\s]*[:=]["\s]*([^\s"']+)/gi,
    api_key: /(?:api[_-]?key|apikey)["\s]*[:=]["\s]*([a-zA-Z0-9._-]+)/gi,
    token: /(?:token|access[_-]?token)["\s]*[:=]["\s]*([a-zA-Z0-9._-]+)/gi,
    aws_key: /AKIA[0-9A-Z]{16}/gi,
    private_key: /-----BEGIN (?:RSA )?PRIVATE KEY-----/gi
  };
  
  const credentials: CredentialLeak[] = [];
  
  Object.entries(patterns).forEach(([type, pattern]) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      credentials.push({
        type: type as CredentialType,
        value: match[1] || match[0],
        source: url,
        confidence: this.calculateConfidence(type, match[0]),
        context: this.extractContext(content, match.index || 0)
      });
    }
  });
  
  return credentials;
}
```

### Sensitive Data Detection
```typescript
private detectSensitiveData(content: string, url: string): SensitiveDataLeak[] {
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    phone: /(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/gi,
    ssn: /\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b/gi,
    credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/gi,
    ip_address: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/gi
  };
  
  const sensitiveData: SensitiveDataLeak[] = [];
  
  Object.entries(patterns).forEach(([type, pattern]) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      sensitiveData.push({
        type: type as SensitiveDataType,
        value: match[0],
        source: url,
        riskLevel: this.assessRiskLevel(type, match[0]),
        context: this.extractContext(content, match.index || 0)
      });
    }
  });
  
  return sensitiveData;
}
```

## Configuration Options

### CrawlOptions
```typescript
interface CrawlOptions {
  maxDepth: number;                    // Maximum crawl depth (default: 3)
  maxUrls: number;                    // Maximum URLs to discover (default: 100)
  includeWayback: boolean;            // Enable Wayback Machine (default: true)
  includeGitHub: boolean;             // Enable GitHub search (default: true)
  includeDirectoryBruteforce: boolean; // Enable directory brute-force (default: true)
  customWordlist: string[];           // Custom directory wordlist
  respectRobots: boolean;             // Respect robots.txt (default: true)
  userAgent: string;                  // Custom user agent
  delay: number;                      // Delay between requests (ms)
}
```

### Intelligence Configuration
```typescript
interface IntelligenceConfig {
  enableCredentialDetection: boolean;
  enableSensitiveDataDetection: boolean;
  enableTechnicalAnalysis: boolean;
  customPatterns: DetectionPattern[];
  confidenceThreshold: number;
  riskAssessment: boolean;
}
```

## Performance Optimization

### Concurrent Processing
```typescript
private async processCrawlTargets(targets: CrawlTarget[]): Promise<ScanResult[]> {
  const batchSize = 5; // Process 5 URLs concurrently
  const results: ScanResult[] = [];
  
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const batchPromises = batch.map(target => 
      this.websiteScanner.scanWebsite(target.url)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to scan ${batch[index].url}:`, result.reason);
      }
    });
    
    // Progress update
    const progress = Math.round(((i + batchSize) / targets.length) * 100);
    this.onProgress?.(progress, `Processed ${i + batchSize}/${targets.length} targets`);
  }
  
  return results;
}
```

### Memory Management
- Streaming processing for large result sets
- Garbage collection of processed data
- Efficient data structures for storage
- Resource cleanup after completion

## Error Handling

### Network Errors
```typescript
private async handleNetworkError(error: Error, url: string): Promise<void> {
  console.error(`Network error for ${url}:`, error);
  
  // Implement retry logic
  if (this.retryCount < this.maxRetries) {
    this.retryCount++;
    await this.delay(1000 * this.retryCount); // Exponential backoff
    return this.retryRequest(url);
  }
  
  // Log failed URL for manual review
  this.failedUrls.push({ url, error: error.message, timestamp: Date.now() });
}
```

### Service Degradation
- Graceful degradation when external services fail
- Partial result return with error notifications
- Alternative discovery methods when primary methods fail
- User notification of reduced functionality

## Integration Points

### WebsiteScanner Integration
```typescript
private async analyzeDiscoveredUrl(target: CrawlTarget): Promise<ScanResult> {
  try {
    const result = await this.websiteScanner.scanWebsite(target.url);
    
    // Enhance with crawler-specific intelligence
    result.crawlerData = {
      discoverySource: target.source,
      priority: target.priority,
      depth: target.depth,
      discoveredAt: target.discovered
    };
    
    return result;
  } catch (error) {
    console.error(`Failed to analyze ${target.url}:`, error);
    throw error;
  }
}
```

### AI Service Integration
- Intelligent target prioritization
- Automated decision making for crawl depth
- Pattern recognition for improved discovery
- Risk assessment and threat scoring

## Security Considerations

### Ethical Reconnaissance
- Respect for robots.txt directives
- Rate limiting to prevent service disruption
- No exploitation of discovered vulnerabilities
- Privacy-compliant data handling

### Data Protection
- Secure handling of discovered credentials
- Temporary storage of sensitive findings
- Encrypted communication where possible
- Audit trail for reconnaissance activities

## Testing Strategy

### Unit Tests
```typescript
describe('AdvancedOSINTCrawler', () => {
  test('should discover URLs from robots.txt', async () => {
    const crawler = new AdvancedOSINTCrawler();
    const targets = await crawler.analyzeRobots('https://example.com');
    expect(targets).toBeInstanceOf(Array);
  });
  
  test('should detect credentials in content', () => {
    const content = 'api_key = "abc123"';
    const credentials = crawler.detectCredentials(content, 'test-url');
    expect(credentials).toHaveLength(1);
    expect(credentials[0].type).toBe('api_key');
  });
});
```

### Integration Tests
- Real-world domain crawling
- External service integration testing
- Performance benchmarking
- Error handling validation

## Usage Examples

### Basic Domain Crawling
```typescript
import { advancedOSINTCrawler } from './services/AdvancedOSINTCrawler';

const crawlDomain = async (domain: string) => {
  const options = {
    maxDepth: 2,
    maxUrls: 50,
    includeWayback: true,
    includeGitHub: true
  };
  
  const result = await advancedOSINTCrawler.crawlTarget(domain, options);
  
  console.log('Discovered URLs:', result.discoveredUrls.length);
  console.log('Credentials found:', result.intelligence.credentials.length);
  console.log('Sensitive data:', result.intelligence.sensitiveData.length);
};
```

### Progress Monitoring
```typescript
const crawlWithProgress = async (domain: string) => {
  const result = await advancedOSINTCrawler.crawlTarget(
    domain,
    { maxDepth: 3, maxUrls: 100 },
    (progress, status) => {
      updateProgressBar(progress);
      updateStatusMessage(status);
    }
  );
  
  displayCrawlResults(result);
};
```

### Intelligence Analysis
```typescript
const analyzeIntelligence = (result: CrawlResult) => {
  // High-priority findings
  const criticalFindings = result.intelligence.credentials
    .filter(cred => cred.confidence > 0.8);
  
  // Administrative interfaces
  const adminPanels = result.discoveredUrls
    .filter(target => target.priority === 'critical');
  
  // Historical data
  const historicalUrls = result.intelligence.waybackHistory
    .filter(snapshot => snapshot.statusCode === '200');
  
  return {
    criticalFindings,
    adminPanels,
    historicalUrls,
    riskScore: calculateOverallRisk(result)
  };
};
```
