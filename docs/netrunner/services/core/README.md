# Core Services Documentation

Core services provide the fundamental scanning and crawling capabilities that form the foundation of all NetRunner operations.

## Services Overview

### WebsiteScanner.ts
**Production-ready website analysis service**

- **Purpose**: Comprehensive website vulnerability analysis and OSINT data extraction
- **Capabilities**:
  - Security vulnerability detection
  - Technology stack identification
  - OSINT data extraction (emails, social media, etc.)
  - Performance and metadata analysis
- **Integration**: Used by crawler services and manual scanning operations

### AdvancedOSINTCrawler.ts
**Military-grade deep web reconnaissance engine**

- **Purpose**: Deep web intelligence gathering and hidden endpoint discovery
- **Capabilities**:
  - Multi-source URL discovery
  - Wayback Machine integration
  - GitHub leak detection
  - Credential and sensitive data identification
- **Integration**: Primary crawler for automated reconnaissance operations

## Service Architecture

### Data Flow
```
Target URL → WebsiteScanner → Vulnerability Analysis → OSINT Extraction
     ↓
Advanced Crawler → URL Discovery → Batch Scanning → Intelligence Correlation
```

### Service Dependencies
- **WebsiteScanner**: Standalone service with CORS proxy fallback
- **AdvancedOSINTCrawler**: Depends on WebsiteScanner for individual URL analysis

### Performance Characteristics
- **WebsiteScanner**: 2-5 seconds per URL analysis
- **AdvancedOSINTCrawler**: 30-300 seconds per target domain
- **Concurrent Operations**: Up to 10 parallel scanning operations
- **Memory Usage**: ~50-100MB per active scanning session

## Integration Patterns

### Service Communication
```typescript
// WebsiteScanner usage
const result = await websiteScanner.scanWebsite(url, progressCallback);

// AdvancedOSINTCrawler usage
const crawlResult = await advancedOSINTCrawler.crawlTarget(domain, options);
```

### Error Handling
- CORS proxy fallback mechanisms
- Network timeout handling
- Rate limiting compliance
- Graceful degradation for unavailable services

### Progress Tracking
Both services provide real-time progress callbacks for UI integration:

```typescript
const progressCallback = (progress: number, status: string) => {
  updateProgressBar(progress);
  updateStatusMessage(status);
};
```

## Configuration Options

### WebsiteScanner Configuration
```typescript
interface ScannerConfig {
  timeout: number;          // Request timeout in milliseconds
  maxRetries: number;       // Maximum retry attempts
  corsProxies: string[];    // Available CORS proxy URLs
  userAgent: string;        // User agent for requests
}
```

### AdvancedOSINTCrawler Configuration
```typescript
interface CrawlerConfig {
  maxDepth: number;         // Maximum crawl depth
  maxUrls: number;          // Maximum URLs to discover
  includeWayback: boolean;  // Enable Wayback Machine integration
  includeGitHub: boolean;   // Enable GitHub leak detection
  directoryWordlist: string[]; // Custom directory wordlist
}
```

## Security Considerations

### Browser Security
- CORS compliance for cross-origin requests
- Content Security Policy adherence
- Secure handling of external resources
- XSS prevention in dynamic content

### Data Privacy
- Client-side only processing
- No persistent storage of scan results
- Secure disposal of sensitive data
- Privacy-compliant data handling

## Performance Optimization

### Scanning Optimization
- Parallel request processing
- Intelligent request batching
- Connection pooling
- Cache utilization

### Memory Management
- Efficient data structures
- Garbage collection optimization
- Resource cleanup
- Memory leak prevention

## Error Recovery

### Network Failures
- Automatic retry mechanisms
- CORS proxy rotation
- Timeout handling
- Partial result recovery

### Service Degradation
- Fallback scanning modes
- Reduced functionality operation
- User notification systems
- Recovery suggestions

## Testing Strategy

### Unit Tests
- Individual method testing
- Mock service integration
- Error condition simulation
- Performance benchmarking

### Integration Tests
- End-to-end scanning workflows
- Service communication testing
- Real-world target testing
- Cross-browser compatibility

## Maintenance Guidelines

### Performance Monitoring
- Response time tracking
- Success rate monitoring
- Error frequency analysis
- Resource usage tracking

### Service Updates
- CORS proxy rotation
- Vulnerability detection updates
- Technology detection improvements
- Performance optimization
