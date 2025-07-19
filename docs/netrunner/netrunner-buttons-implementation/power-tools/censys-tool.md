# Censys Tool Implementation Guide

## Overview
The Censys tool provides comprehensive internet-wide scanning and asset discovery capabilities for cybersecurity reconnaissance and threat intelligence gathering.

## Current State
**Status:** ⚠️ Limited Implementation - API Policy Restricted
- Production adapter implemented but non-functional
- Censys discontinued free API access (requires paid Starter tier minimum)
- Alternative implementation strategies required
- Mock/fallback implementation available

## Technical Requirements

### Component Location
- **File:** `src/applications/netrunner/components/PowerToolsPanel.tsx`
- **Adapter:** `src/applications/netrunner/tools/adapters/CensysAdapterProd.ts`
- **Integration Point:** OSINT tool ecosystem

### API Access Limitations ⚠️
**Important Update:** Censys eliminated their free API tier as of 2024. Access now requires:
- **Starter Tier:** $99/month (10,000 queries)
- **Team Tier:** $299/month (50,000 queries)
- **Enterprise Tier:** Custom pricing

### Alternative Implementation Strategies

#### Strategy 1: Paid API Integration
```typescript
interface CensysPaidAPIConfig {
  tier: 'starter' | 'team' | 'enterprise';
  apiKey: string;
  monthlyQuota: number;
  rateLimits: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
}
```

#### Strategy 2: Web Scraping Approach (Limited)
```typescript
interface CensysWebScrapingAdapter {
  // Limited free search via web interface
  searchHosts(query: string): Promise<HostResult[]>;
  getCertificates(query: string): Promise<CertificateResult[]>;
  // Note: Rate limited and terms of service restrictions apply
}
```

#### Strategy 3: Alternative Services Integration
```typescript
interface AlternativeServices {
  shodan: ShodanAdapter; // Primary alternative
  binaryEdge: BinaryEdgeAdapter; // Similar capabilities
  fofa: FOFAAdapter; // Chinese alternative
  zoomeye: ZoomEyeAdapter; // Another alternative
}
```

## Required Functionality (If API Access Available)

### 1. Host Discovery and Analysis
```typescript
interface CensysHostSearch {
  searchHosts(query: string, options: SearchOptions): Promise<HostResult[]>;
  getHostDetails(ip: string): Promise<HostDetails>;
  getHostHistory(ip: string): Promise<HostHistory[]>;
  findSimilarHosts(ip: string): Promise<SimilarHost[]>;
}

interface HostResult {
  ip: string;
  ports: Port[];
  services: Service[];
  location: GeoLocation;
  autonomous_system: ASInfo;
  last_updated: Date;
  protocols: string[];
}
```

### 2. Certificate Analysis
```typescript
interface CensysCertificateSearch {
  searchCertificates(query: string): Promise<CertificateResult[]>;
  getCertificateDetails(fingerprint: string): Promise<CertificateDetails>;
  findRelatedCertificates(domain: string): Promise<CertificateResult[]>;
  analyzeCertificateChain(fingerprint: string): Promise<CertificateChain>;
}

interface CertificateResult {
  fingerprint: string;
  commonName: string;
  subjectAlternativeNames: string[];
  issuer: string;
  validFrom: Date;
  validTo: Date;
  keyAlgorithm: string;
  signatureAlgorithm: string;
  hosts: string[];
}
```

### 3. Service and Protocol Analysis
```typescript
interface CensysServiceAnalysis {
  analyzeService(ip: string, port: number): Promise<ServiceDetails>;
  findServiceVulnerabilities(service: ServiceDetails): Promise<Vulnerability[]>;
  getServiceBanner(ip: string, port: number): Promise<ServiceBanner>;
  analyzeProtocolImplementation(ip: string, protocol: string): Promise<ProtocolAnalysis>;
}
```

## Implementation Plan

### Phase 1: Alternative Service Integration
Given Censys's pricing model, prioritize alternative services:

1. **Enhanced Shodan Integration**
   ```typescript
   // Expand existing Shodan adapter to cover Censys use cases
   class EnhancedShodanAdapter {
     async findInternetAssets(query: string): Promise<AssetResult[]>
     async analyzeCertificates(domain: string): Promise<CertificateInfo[]>
     async discoverServices(ip: string): Promise<ServiceInfo[]>
   }
   ```

2. **BinaryEdge Integration**
   ```typescript
   // Alternative service with similar capabilities
   class BinaryEdgeAdapter implements OSINTAdapter {
     async searchHosts(query: string): Promise<HostResult[]>
     async searchCertificates(query: string): Promise<CertificateResult[]>
     async getVulnerabilities(target: string): Promise<VulnerabilityResult[]>
   }
   ```

### Phase 2: Multi-Source Aggregation
```typescript
class AssetDiscoveryAggregator {
  private sources: OSINTAdapter[];
  
  async aggregateHostData(target: string): Promise<AggregatedHostData> {
    const results = await Promise.all(
      this.sources.map(source => source.searchHosts(target))
    );
    return this.mergeResults(results);
  }
  
  async crossValidateFindings(findings: Finding[]): Promise<ValidatedFindings> {
    // Validate findings across multiple sources
  }
}
```

### Phase 3: Paid API Integration (Optional)
For organizations with Censys subscriptions:

```typescript
class CensysPaidAdapter implements OSINTAdapter {
  private config: CensysPaidAPIConfig;
  private rateLimiter: RateLimiter;
  
  async searchHosts(query: string): Promise<HostResult[]> {
    await this.rateLimiter.waitForToken();
    return this.apiClient.searchHosts(query);
  }
  
  async getQuotaStatus(): Promise<QuotaStatus> {
    return this.apiClient.getQuotaInfo();
  }
}
```

## User Interface Design

### Tool Selection Panel
```typescript
interface AssetDiscoveryToolProps {
  availableServices: OSINTService[];
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
  onSearch: (query: string, services: string[]) => void;
}
```

### Results Aggregation View
```typescript
interface AggregatedResultsProps {
  results: Map<string, OSINTResult[]>; // service -> results
  onResultSelect: (result: OSINTResult) => void;
  onExport: (format: ExportFormat) => void;
  onCrossReference: (result: OSINTResult) => void;
}
```

### Service Status Dashboard
```typescript
interface ServiceStatusDashboard {
  services: ServiceStatus[];
  quotaUsage: Map<string, QuotaInfo>;
  lastUpdated: Date;
  onRefresh: () => void;
}

interface ServiceStatus {
  name: string;
  status: 'available' | 'limited' | 'unavailable' | 'quota-exceeded';
  responseTime: number;
  successRate: number;
  lastError?: string;
}
```

## Alternative Services Configuration

### 1. BinaryEdge Setup
```typescript
interface BinaryEdgeConfig {
  apiKey: string;
  tier: 'free' | 'paid';
  endpoints: {
    hosts: string;
    certificates: string;
    vulnerabilities: string;
  };
  quotaLimits: {
    monthly: number;
    daily: number;
  };
}
```

### 2. FOFA Setup (International Users)
```typescript
interface FOFAConfig {
  email: string;
  apiKey: string;
  baseUrl: string;
  maxResults: number;
}
```

### 3. ZoomEye Setup
```typescript
interface ZoomEyeConfig {
  apiKey: string;
  baseUrl: string;
  quotaLimits: {
    searches: number;
    exports: number;
  };
}
```

## Query Translation Layer

### Universal Query Interface
```typescript
interface UniversalAssetQuery {
  target: string;
  queryType: 'ip' | 'domain' | 'certificate' | 'service';
  filters: QueryFilter[];
  options: QueryOptions;
}

class QueryTranslator {
  translateToShodan(query: UniversalAssetQuery): string;
  translateToBinaryEdge(query: UniversalAssetQuery): string;
  translateToFOFA(query: UniversalAssetQuery): string;
  translateToZoomEye(query: UniversalAssetQuery): string;
}
```

### Result Normalization
```typescript
class ResultNormalizer {
  normalizeHostResult(result: any, source: string): NormalizedHostResult;
  normalizeCertificateResult(result: any, source: string): NormalizedCertificateResult;
  normalizeServiceResult(result: any, source: string): NormalizedServiceResult;
}
```

## Cost-Benefit Analysis

### Free Alternatives Comparison
| Service | Free Tier | Capabilities | Limitations |
|---------|-----------|--------------|-------------|
| Shodan | 100 queries/month | Host discovery, service detection | Limited query complexity |
| BinaryEdge | 250 queries/month | Similar to Censys | Smaller dataset |
| FOFA | 10,000 results/month | Large Chinese dataset | Language barrier |
| ZoomEye | 10,000 results/month | Good coverage | Limited documentation |

### Paid Tier ROI Analysis
```typescript
interface ROIAnalysis {
  censysStarterCost: 99; // USD/month
  alternativesCombinedCost: 0; // Free tiers
  additionalCapabilities: string[];
  recommendedApproach: 'free-alternatives' | 'paid-censys' | 'hybrid';
}
```

## Migration Strategy

### Phase 1: Immediate Fallback (Current)
- Use existing Shodan integration
- Implement basic mock responses for UI compatibility
- Document Censys limitations clearly

### Phase 2: Alternative Integration
- Implement BinaryEdge adapter
- Add ZoomEye integration
- Create result aggregation system

### Phase 3: Paid Integration (Optional)
- Implement Censys paid API adapter
- Add quota monitoring and management
- Provide cost tracking and optimization

## Testing Strategy

### Mock Testing (Current Approach)
```typescript
class CensysMockAdapter implements OSINTAdapter {
  async searchHosts(query: string): Promise<HostResult[]> {
    // Return realistic mock data for testing
    return mockHostResults;
  }
  
  async getCertificates(query: string): Promise<CertificateResult[]> {
    return mockCertificateResults;
  }
}
```

### Alternative Service Testing
- Validate each alternative service integration
- Compare result quality and coverage
- Performance benchmarking
- Cost analysis tracking

### Integration Testing
- Multi-source result aggregation
- Query translation accuracy
- Result normalization consistency
- Error handling across services

## Documentation Requirements

### User Guidance
```markdown
# Censys Tool Usage Guide

## Important Notice
Censys no longer offers free API access. This tool now provides:

1. **Mock Data Mode**: For demonstration and testing
2. **Alternative Services**: Free alternatives with similar capabilities
3. **Paid Integration**: For organizations with Censys subscriptions

## Recommended Workflow
1. Start with Shodan and BinaryEdge for free asset discovery
2. Cross-reference findings across multiple sources
3. Consider Censys paid tier for comprehensive coverage
```

### API Migration Guide
```markdown
# Migrating from Censys Free to Alternatives

## Query Translation Examples
- Censys: `services.port:80`
- Shodan: `port:80`
- BinaryEdge: `port:80`

## Feature Mapping
| Censys Feature | Shodan Equivalent | BinaryEdge Equivalent |
|----------------|-------------------|----------------------|
| Host search | host search | host search |
| Certificate search | ssl cert search | ssl search |
| IPv4 enumeration | net search | subnet search |
```

## Success Metrics

### Alternative Service Performance
- Query success rates across services
- Result quality and relevance scores
- Coverage comparison with historical Censys data
- User satisfaction with alternative results

### Cost Optimization
- Free tier quota utilization
- Query efficiency optimization
- Result caching effectiveness
- ROI analysis for paid upgrades

## Future Enhancements

### Advanced Aggregation
- Machine learning for result correlation
- Confidence scoring across sources
- Automated source selection optimization
- Predictive query routing

### Enterprise Features
- Custom result correlation rules
- Automated threat hunting workflows
- Integration with threat intelligence platforms
- Advanced reporting and analytics

---

**Implementation Priority:** Medium (Due to API limitations)
**Estimated Effort:** 2-3 weeks for alternative integration
**Dependencies:** Alternative service API keys, Enhanced Shodan adapter
**Recommended Approach:** Multi-source aggregation with free alternatives

**⚠️ Important Note:** Organizations requiring comprehensive internet scanning should budget for paid Censys access or invest in robust alternative service integration.
