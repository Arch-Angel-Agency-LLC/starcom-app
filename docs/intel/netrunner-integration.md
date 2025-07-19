# NetRunner Integration

## Overview

NetRunner serves as the primary OSINT collection system, gathering raw data from web sources and transforming it into structured intelligence. This document details how NetRunner integrates with the broader intelligence architecture.

## Collection Architecture

### WebsiteScanner Integration

NetRunner's WebsiteScanner is the core collection engine that:
- Scrapes web content using CORS proxy fallback systems
- Extracts multiple data types from HTML, JavaScript, and HTTP headers
- Handles rate limiting and anti-bot detection
- Maintains collection metadata and quality metrics

### Data Collection Types

#### Raw HTML Content
```typescript
{
  id: "raw-website-001",
  sourceUrl: "https://target.com",
  collectionMethod: "web-scrape",
  content: "<html>...</html>",
  contentType: "html",
  httpStatus: 200,
  responseTime: 1250,
  headers: {
    "server": "nginx/1.18.0",
    "x-powered-by": "PHP/7.4.3"
  }
}
```

#### API Responses
```typescript
{
  id: "raw-api-001", 
  sourceUrl: "https://api.target.com/users",
  collectionMethod: "api-call",
  content: { "users": [...] },
  contentType: "json",
  httpStatus: 200
}
```

#### DNS Records
```typescript
{
  id: "raw-dns-001",
  sourceUrl: "target.com",
  collectionMethod: "dns-lookup", 
  content: {
    "A": ["192.168.1.1"],
    "MX": ["mail.target.com"],
    "NS": ["ns1.target.com", "ns2.target.com"]
  },
  contentType: "json"
}
```

#### SSL Certificates
```typescript
{
  id: "raw-cert-001",
  sourceUrl: "https://target.com",
  collectionMethod: "certificate-scan",
  content: {
    "subject": "CN=target.com",
    "issuer": "CN=Let's Encrypt Authority X3",
    "validFrom": "2025-01-01",
    "validTo": "2025-04-01",
    "altNames": ["www.target.com", "api.target.com"]
  },
  contentType: "json"
}
```

## Data Extraction Pipeline

### OSINT Data Extraction

The `extractOSINTData()` method processes raw HTML and extracts:

#### Email Addresses
- **Pattern**: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
- **Confidence Calculation**: Context analysis for email-related keywords
- **Deduplication**: Unique email addresses only
- **Limit**: Maximum 20 emails per scan

#### Social Media Links
- **Platforms**: Facebook, Twitter, LinkedIn, Instagram, YouTube, TikTok, Discord
- **Extraction**: DOM parsing for platform-specific URLs
- **Validation**: URL structure verification
- **Limit**: Maximum 15 social links per scan

#### Technology Stack
- **Server Detection**: Header analysis for web servers (Nginx, Apache)
- **Framework Detection**: HTML pattern matching for frameworks
- **CDN Detection**: Resource URL analysis for CDN usage
- **Cloud Provider Detection**: Header and URL pattern analysis

#### Infrastructure Information
- **Subdomains**: Cross-reference discovery through internal links
- **Server Headers**: HTTP response header analysis
- **Network Information**: IP ranges and hosting provider detection
- **Certificate Chains**: SSL certificate hierarchy analysis

### Observation Generation

Each extracted data point becomes an Observation:

```typescript
// Email extraction → Observation
{
  id: "obs-email-001",
  type: "email",
  value: "contact@target.com",
  context: "Found in footer contact section",
  confidence: 85,
  extractedFrom: "raw-website-001",
  extractionMethod: "regex",
  verified: false,
  timestamp: 1721721600000
}

// Subdomain discovery → Observation  
{
  id: "obs-subdomain-001",
  type: "domain", 
  value: "api.target.com",
  context: "Discovered in navigation menu",
  confidence: 92,
  extractedFrom: "raw-website-001",
  extractionMethod: "dom-parsing",
  verified: false,
  timestamp: 1721721600000
}

// Technology detection → Observation
{
  id: "obs-tech-001",
  type: "technology",
  value: "WordPress 5.8.1",
  context: "Detected in HTML meta tags",
  confidence: 95,
  extractedFrom: "raw-website-001", 
  extractionMethod: "regex",
  verified: false,
  timestamp: 1721721600000
}
```

## Intelligence Transformation

### Raw Data → Intelligence Conversion

NetRunner data gets transformed into Intelligence objects:

```typescript
// Single email becomes Intelligence
{
  id: "intel-001",
  source: "OSINT",
  classification: "UNCLASS",
  reliability: "C", // Web scraping is "Fairly reliable"
  timestamp: 1721721600000,
  collectedBy: "netrunner-websitescanner",
  data: "contact@target.com",
  derivedFrom: {
    observations: ["obs-email-001"],
    rawData: ["raw-website-001"]
  },
  tags: ["email", "contact", "communication"],
  verified: false,
  confidence: 85
}

// Subdomain becomes Intelligence
{
  id: "intel-002", 
  source: "OSINT",
  classification: "UNCLASS",
  reliability: "B", // DNS/subdomain info is "Usually reliable"
  timestamp: 1721721600000,
  collectedBy: "netrunner-websitescanner",
  data: "api.target.com",
  derivedFrom: {
    observations: ["obs-subdomain-001"],
    rawData: ["raw-website-001"]
  },
  tags: ["subdomain", "infrastructure", "api"],
  verified: false,
  confidence: 92
}
```

### Reliability Assessment

NetRunner assigns reliability ratings based on collection method:

- **A (Completely reliable)**: Not applicable to OSINT
- **B (Usually reliable)**: DNS records, certificate data, server headers
- **C (Fairly reliable)**: Website content, HTML meta tags, structured data
- **D (Not usually reliable)**: Social media links, user-generated content
- **E (Unreliable)**: Cached content, third-party aggregators
- **F (Cannot be judged)**: Dynamically generated content
- **X (Deliberate deception)**: Suspected honeypots or misleading content

### Confidence Scoring

Confidence scores (0-100) based on:

#### Pattern Strength
- **Regex Matches**: Higher confidence for well-formed patterns
- **Context Keywords**: Boost confidence when context supports finding
- **Multiple Sources**: Higher confidence when found in multiple locations

#### Validation Indicators
- **Well-formed Data**: Properly formatted emails, valid domains
- **Consistent Patterns**: Data that fits expected organizational patterns
- **Cross-validation**: Data confirmed through multiple collection methods

#### Risk Factors
- **Dynamic Content**: JavaScript-generated content gets lower confidence
- **Third-party Content**: External widgets and advertisements
- **Cached Data**: Potentially stale information

## RightSideBar Integration

### Scan Results Display

The NetRunnerRightSideBar shows real-time scan progress and results:

#### Active Scanning Tab
- **Progress Indicators**: Real-time scan progress (0-100%)
- **Target Information**: Current scan target URL
- **Collection Statistics**: Items found, processing speed, errors

#### Results Tab (WebCrawlerResults)
Categorizes findings by intelligence value:

- **Critical Value**: Admin panels, environment files, credentials
- **High Value**: API endpoints, backup directories, databases
- **Medium Value**: Contact forms, login pages, social profiles  
- **Low Value**: Regular pages, basic directories

#### Status Tab
- **Task Status**: Web crawler, port scanner, vulnerability assessment
- **System Metrics**: CPU usage, memory consumption, API call limits
- **Performance Data**: Response times, success rates, error counts

### Data Flow to UI

```typescript
// NetRunner scan → WebCrawlerResults display
NetRunner.scanWebsite(url) 
  → extractOSINTData(html, doc, url)
  → ScanResult[] with intelligence values
  → WebCrawlerResults.groupResultsByCategory()
  → NetRunnerRightSideBar display

// Real-time updates
ScanProgress → RightSideBar progress indicators
NewFindings → RightSideBar results update  
Errors → RightSideBar error display
```

## Integration Points

### OSINT Search Services
NetRunner integrates with broader OSINT search capabilities:
- **Enhanced Search Service**: NetRunner adapters for search providers
- **Search Query Translation**: OSINT queries → NetRunner parameters
- **Result Transformation**: NetRunner results → OSINT search format

### IntelAnalyzer Connection
NetRunner Intelligence feeds into IntelAnalyzer for:
- **Entity Extraction**: Advanced pattern recognition
- **Relationship Mapping**: Connections between discoveries
- **Threat Assessment**: Security implication analysis
- **Report Generation**: Structured intelligence products

### Data Storage
- **StorageOrchestrator**: Persistent storage for all NetRunner data
- **Caching Layer**: Frequently accessed scan results
- **Archive System**: Long-term retention of collection data
- **Search Indexing**: Fast retrieval of historical collections

## Performance Optimization

### Collection Efficiency
- **Rate Limiting**: Respect target site limits
- **Concurrent Scanning**: Parallel collection from multiple sources
- **Smart Retries**: Exponential backoff for failed requests
- **Cache Utilization**: Avoid redundant collections

### Processing Speed
- **Streaming Analysis**: Process data as it's collected
- **Parallel Extraction**: Concurrent OSINT data extraction
- **Batch Operations**: Group similar processing tasks
- **Lazy Loading**: Defer expensive analysis until needed

### Resource Management
- **Memory Optimization**: Efficient data structures
- **Connection Pooling**: Reuse HTTP connections
- **Garbage Collection**: Timely cleanup of processed data
- **Load Balancing**: Distribute work across instances

## Error Handling

### Collection Errors
- **Network Failures**: Retry logic with exponential backoff
- **Rate Limiting**: Adaptive delay mechanisms
- **Anti-bot Detection**: CORS proxy fallback
- **Invalid Content**: Graceful degradation

### Processing Errors
- **Malformed Data**: Skip invalid content with logging
- **Extraction Failures**: Continue with partial results
- **Confidence Calculation**: Default to conservative estimates
- **Verification Failures**: Mark as unverified but preserve data

### Recovery Mechanisms
- **Checkpoint System**: Resume interrupted scans
- **Partial Results**: Save intermediate findings
- **Alternative Sources**: Fallback collection methods
- **Manual Override**: Human intervention for critical targets
