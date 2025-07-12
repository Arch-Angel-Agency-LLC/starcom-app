# WebsiteScanner Service Documentation

## Overview

The WebsiteScanner service provides comprehensive website analysis capabilities including security vulnerability detection, technology identification, and OSINT data extraction. It serves as the foundation for all NetRunner scanning operations.

## Service Specification

### Purpose
- Comprehensive website security analysis
- Technology stack identification and fingerprinting
- OSINT data extraction from web content
- Performance and metadata analysis

### Core Capabilities
- **Security Analysis**: Vulnerability detection and assessment
- **Technology Detection**: Framework, library, and tool identification
- **OSINT Extraction**: Email, social media, and intelligence gathering
- **Metadata Analysis**: Server information and performance metrics

## API Interface

### Primary Methods

#### scanWebsite()
```typescript
async scanWebsite(
  url: string, 
  onProgress?: (progress: number, status: string) => void
): Promise<ScanResult>
```

**Parameters:**
- `url`: Target URL to scan
- `onProgress`: Optional callback for real-time progress updates

**Returns:** Complete scan result with vulnerabilities, OSINT data, and metadata

### Data Structures

#### ScanResult
```typescript
interface ScanResult {
  url: string;
  title: string;
  status: 'scanning' | 'completed' | 'error';
  progress: number;
  sourceCode: string;
  vulnerabilities: Vulnerability[];
  osintData: OSINTData;
  metadata: WebsiteMetadata;
  timestamp: number;
}
```

#### Vulnerability
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

#### OSINTData
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

## Security Analysis Features

### Vulnerability Detection
- **Security Headers**: Missing or misconfigured security headers
- **Content Security Policy**: CSP analysis and recommendations
- **Mixed Content**: HTTP resources on HTTPS pages
- **Form Security**: CSRF protection and secure transmission
- **External Dependencies**: Subresource integrity validation
- **Sensitive Data Exposure**: Information leakage detection

### Severity Scoring
```typescript
enum VulnerabilitySeverity {
  LOW = 'low',        // Minor security improvements
  MEDIUM = 'medium',  // Moderate security risks
  HIGH = 'high',      // Significant security vulnerabilities
  CRITICAL = 'critical' // Immediate security threats
}
```

## Technology Detection

### Supported Technologies
- **Frameworks**: React, Angular, Vue.js, Next.js, Nuxt.js
- **Libraries**: jQuery, Lodash, Bootstrap, Tailwind CSS
- **Analytics**: Google Analytics, Google Tag Manager
- **CDNs**: Cloudflare, AWS CloudFront
- **Servers**: Nginx, Apache, IIS

### Detection Methods
- **Source Code Analysis**: Pattern matching in HTML/JavaScript
- **Meta Tag Scanning**: Generator and framework meta tags
- **Header Analysis**: Server and technology headers
- **URL Pattern Recognition**: Framework-specific URL patterns

## OSINT Data Extraction

### Email Discovery
```typescript
private extractEmails(html: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = html.match(emailRegex) || [];
  return [...new Set(emails)].slice(0, 20);
}
```

### Social Media Detection
Automatic discovery of social media profiles and links from major platforms:
- Facebook, Twitter, LinkedIn, Instagram
- YouTube, TikTok, Discord
- Professional and business networks

### Server Information
- **Server Technology**: Web server identification
- **Cloud Providers**: AWS, Azure, Google Cloud detection
- **CDN Services**: Content delivery network identification
- **Security Services**: WAF and protection service detection

## Network and Performance

### CORS Proxy System
Multiple fallback proxies for reliable cross-origin access:

```typescript
private corsProxies = [
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.codetabs.com/v1/proxy?quest='
];
```

### Fallback Strategy
- Automatic proxy rotation on failure
- Error aggregation and reporting
- Graceful degradation for partial failures
- User notification for complete failures

### Performance Optimization
- Connection pooling for multiple requests
- Response caching for repeated scans
- Efficient DOM parsing and analysis
- Memory management for large responses

## Error Handling

### Error Types
```typescript
enum ScanErrorType {
  NETWORK_ERROR = 'network_error',
  CORS_ERROR = 'cors_error',
  TIMEOUT_ERROR = 'timeout_error',
  PARSING_ERROR = 'parsing_error',
  ANALYSIS_ERROR = 'analysis_error'
}
```

### Recovery Strategies
- **Network Errors**: Proxy rotation and retry
- **Timeout Errors**: Extended timeout and simplified analysis
- **Parsing Errors**: Fallback parsing methods
- **Analysis Errors**: Partial result return with error notification

## Integration Points

### Service Dependencies
- **No External Dependencies**: Self-contained service
- **Browser APIs**: Fetch API, DOMParser
- **CORS Proxies**: External proxy services for cross-origin access

### Usage Patterns
```typescript
// Basic scanning
const result = await websiteScanner.scanWebsite('https://example.com');

// Scanning with progress tracking
const result = await websiteScanner.scanWebsite(
  'https://example.com',
  (progress, status) => {
    console.log(`${progress}% - ${status}`);
  }
);
```

### Event Integration
- Progress callbacks for UI updates
- Error callbacks for failure handling
- Completion callbacks for result processing
- Cancel support for long-running operations

## Configuration Options

### Scanner Configuration
```typescript
interface ScannerConfiguration {
  timeout: number;              // Request timeout (default: 30000ms)
  maxRetries: number;           // Maximum retry attempts (default: 3)
  userAgent: string;            // User agent string
  followRedirects: boolean;     // Follow HTTP redirects (default: true)
  maxRedirects: number;         // Maximum redirect count (default: 5)
  validateCertificates: boolean; // SSL certificate validation
}
```

### Analysis Configuration
```typescript
interface AnalysisConfiguration {
  enableVulnerabilityScanning: boolean;
  enableTechnologyDetection: boolean;
  enableOSINTExtraction: boolean;
  enablePerformanceAnalysis: boolean;
  customVulnerabilityRules: VulnerabilityRule[];
  customTechnologyPatterns: TechnologyPattern[];
}
```

## Performance Metrics

### Typical Performance
- **Small Sites (< 100KB)**: 2-3 seconds
- **Medium Sites (100KB-1MB)**: 3-5 seconds
- **Large Sites (> 1MB)**: 5-10 seconds
- **Complex Applications**: 10-15 seconds

### Resource Usage
- **Memory**: ~10-50MB per scan
- **CPU**: Low to moderate during analysis
- **Network**: Depends on target site size
- **Concurrent Scans**: Up to 10 parallel operations

## Security Considerations

### Data Privacy
- Client-side only processing
- No data persistence beyond session
- Secure handling of extracted credentials
- Privacy-compliant data collection

### Secure Communication
- HTTPS proxy preference
- Certificate validation
- Secure header handling
- XSS prevention in analysis

## Testing Strategy

### Unit Tests
```typescript
describe('WebsiteScanner', () => {
  test('should scan website successfully', async () => {
    const result = await websiteScanner.scanWebsite('https://example.com');
    expect(result.status).toBe('completed');
    expect(result.vulnerabilities).toBeDefined();
  });
  
  test('should handle CORS errors gracefully', async () => {
    // Test CORS fallback mechanism
  });
  
  test('should detect technologies correctly', async () => {
    // Test technology detection accuracy
  });
});
```

### Integration Tests
- Real-world website scanning
- CORS proxy functionality
- Error handling validation
- Performance benchmarking

## Maintenance and Updates

### Regular Maintenance
- CORS proxy health monitoring
- Vulnerability detection rule updates
- Technology pattern updates
- Performance optimization

### Version Updates
- New vulnerability detection capabilities
- Enhanced technology recognition
- Improved OSINT extraction
- Performance improvements

## Usage Examples

### Basic Website Scanning
```typescript
import { websiteScanner } from './services/WebsiteScanner';

const scanTarget = async (url: string) => {
  try {
    const result = await websiteScanner.scanWebsite(url);
    console.log('Scan completed:', result);
    
    // Process vulnerabilities
    result.vulnerabilities.forEach(vuln => {
      console.log(`${vuln.severity}: ${vuln.title}`);
    });
    
    // Process OSINT data
    console.log('Emails found:', result.osintData.emails);
    console.log('Technologies:', result.osintData.technologies);
    
  } catch (error) {
    console.error('Scan failed:', error);
  }
};
```

### Progress Monitoring
```typescript
const scanWithProgress = async (url: string) => {
  const result = await websiteScanner.scanWebsite(
    url,
    (progress, status) => {
      updateProgressBar(progress);
      updateStatusText(status);
    }
  );
  
  displayResults(result);
};
```

### Batch Scanning
```typescript
const scanMultipleTargets = async (urls: string[]) => {
  const results = await Promise.allSettled(
    urls.map(url => websiteScanner.scanWebsite(url))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Scan ${index + 1} completed:`, result.value);
    } else {
      console.error(`Scan ${index + 1} failed:`, result.reason);
    }
  });
};
```
