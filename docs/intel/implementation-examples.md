# Implementation Examples

## NetRunner → Intelligence Flow

### Example 1: Email Discovery and Processing

#### NetRunner Collection
```typescript
// NetRunner WebsiteScanner discovers email
const rawHtml = await scanner.fetchWebsite('https://target.com');
const osintData = scanner.extractOSINTData(rawHtml, doc, 'https://target.com');

// Raw data collected
const rawData: RawData = {
  id: 'raw-001',
  sourceUrl: 'https://target.com',
  collectionMethod: 'web-scrape',
  timestamp: Date.now(),
  collectorId: 'netrunner-websitescanner',
  content: '<html><div class="contact">Email: admin@target.com</div></html>',
  contentType: 'html',
  contentLength: 2048,
  httpStatus: 200,
  responseTime: 1250
};
```

#### Observation Generation
```typescript
// Email extracted from HTML
const observation: Observation = {
  id: 'obs-001',
  type: 'email',
  value: 'admin@target.com',
  context: 'Found in contact section of homepage',
  confidence: 88,
  timestamp: Date.now(),
  extractedFrom: 'raw-001',
  extractionMethod: 'regex',
  verified: false
};
```

#### Intelligence Transformation
```typescript
// Observation becomes Intelligence
const intelligence: Intelligence = {
  id: 'intel-001',
  source: 'OSINT',
  classification: 'UNCLASS',
  reliability: 'C', // Web scraping is fairly reliable
  timestamp: Date.now(),
  collectedBy: 'netrunner-websitescanner',
  data: 'admin@target.com',
  derivedFrom: {
    observations: ['obs-001'],
    rawData: ['raw-001']
  },
  tags: ['email', 'contact', 'administrative'],
  confidence: 88,
  implications: ['Potential administrative access vector'],
  verified: false
};
```

### Example 2: Subdomain Discovery Chain

#### Multi-Step Discovery Process
```typescript
// Step 1: Initial website scan discovers subdomain reference
const mainSiteRaw: RawData = {
  id: 'raw-002',
  sourceUrl: 'https://target.com',
  collectionMethod: 'web-scrape',
  content: '<a href="https://api.target.com/docs">API Documentation</a>',
  // ... other properties
};

// Step 2: Subdomain observation
const subdomainObs: Observation = {
  id: 'obs-002',
  type: 'domain',
  value: 'api.target.com',
  context: 'Linked from main navigation menu',
  confidence: 94,
  extractedFrom: 'raw-002',
  extractionMethod: 'dom-parsing'
};

// Step 3: Follow-up DNS lookup
const dnsRaw: RawData = {
  id: 'raw-003',
  sourceUrl: 'api.target.com',
  collectionMethod: 'dns-lookup',
  content: {
    A: ['192.168.1.100'],
    CNAME: ['target-api-prod.amazonaws.com']
  },
  contentType: 'json'
};

// Step 4: IP address observation  
const ipObs: Observation = {
  id: 'obs-003',
  type: 'ip-address',
  value: '192.168.1.100',
  context: 'DNS A record for api.target.com',
  confidence: 98,
  extractedFrom: 'raw-003',
  extractionMethod: 'api-lookup'
};

// Step 5: Pattern recognition
const infraPattern: Pattern = {
  id: 'pattern-001',
  type: 'structural',
  name: 'AWS-hosted API infrastructure',
  description: 'API subdomain points to AWS infrastructure',
  confidence: 92,
  components: ['obs-002', 'obs-003'],
  frequency: 1,
  strength: 85,
  stability: 90,
  uniqueness: 75
};
```

## IntelAnalyzer Processing Examples

### Example 3: Entity Extraction and Analysis

#### Input Intelligence
```typescript
const inputIntel: Intelligence[] = [
  {
    id: 'intel-001',
    data: 'admin@target.com',
    tags: ['email', 'contact'],
    // ... other properties
  },
  {
    id: 'intel-002', 
    data: 'api.target.com',
    tags: ['subdomain', 'infrastructure'],
    // ... other properties
  },
  {
    id: 'intel-003',
    data: '192.168.1.100',
    tags: ['ip-address', 'server'],
    // ... other properties
  }
];
```

#### Entity Extraction Process
```typescript
// IntelAnalyzer processes intelligence
const extractedEntities = IntelAnalyzer.extractEntities(inputIntel, 'infrastructure_analysis', 75);

// Generated entities
const entities: IntelEntity[] = [
  {
    id: 'entity-001',
    name: 'admin@target.com',
    type: 'service_account',
    confidence: 88,
    properties: {
      domain: 'target.com',
      role: 'administrative',
      accountType: 'email'
    },
    sources: ['intel-001'],
    identifiers: { email: 'admin@target.com' }
  },
  {
    id: 'entity-002',
    name: 'api.target.com',
    type: 'server',
    confidence: 94,
    properties: {
      subdomain: 'api',
      purpose: 'api-endpoint',
      cloudProvider: 'aws'
    },
    sources: ['intel-002'],
    identifiers: { domain: 'api.target.com' }
  }
];
```

#### Relationship Discovery
```typescript
// IntelAnalyzer identifies relationships
const relationships: IntelRelationship[] = [
  {
    id: 'rel-001',
    sourceEntityId: 'entity-001',
    targetEntityId: 'entity-002', 
    type: 'manages',
    confidence: 76,
    evidence: ['Same domain suffix', 'Administrative account pattern'],
    discoveredThrough: 'domain-correlation-analysis'
  }
];
```

### Example 4: Threat Assessment Package

#### Vulnerability Analysis
```typescript
// IntelAnalyzer generates threat assessment
const threatPackage: ThreatAssessmentPackage = {
  id: 'threat-001',
  targetEntities: ['entity-002'], // api.target.com
  threats: [
    {
      id: 'threat-indicator-001',
      type: 'exposed-api',
      severity: 'medium',
      description: 'Publicly accessible API endpoint without apparent authentication',
      confidence: 82,
      indicators: ['No authentication headers observed', 'Direct IP access possible'],
      mitigations: ['Implement API authentication', 'Add rate limiting']
    }
  ],
  riskScore: 65,
  overallAssessment: 'Medium risk due to exposed API infrastructure',
  recommendations: [
    'Conduct API security assessment',
    'Implement proper authentication mechanisms',
    'Review access controls'
  ]
};
```

## Complete Processing Workflow

### Example 5: End-to-End Intelligence Production

#### Phase 1: Collection
```typescript
// NetRunner initiates scan
const scanTarget = 'https://target.com';
const rawCollections: RawData[] = await NetRunner.comprehensiveScan(scanTarget);

// Multiple raw data sources collected
const collections = {
  website: rawCollections.filter(r => r.collectionMethod === 'web-scrape'),
  dns: rawCollections.filter(r => r.collectionMethod === 'dns-lookup'),
  certificates: rawCollections.filter(r => r.collectionMethod === 'certificate-scan')
};
```

#### Phase 2: Extraction
```typescript
// Extract observations from all raw data
const observations: Observation[] = [];

for (const raw of rawCollections) {
  const extracted = await DataExtractor.extract(raw);
  observations.push(...extracted);
}

// Generated observations include:
// - 12 email addresses
// - 8 subdomains  
// - 4 IP addresses
// - 6 technology signatures
// - 3 social media profiles
```

#### Phase 3: Intelligence Generation
```typescript
// Transform observations to intelligence
const intelligenceObjects: Intelligence[] = observations.map(obs => ({
  id: generateId(),
  source: 'OSINT',
  classification: 'UNCLASS',
  reliability: calculateReliability(obs),
  timestamp: Date.now(),
  collectedBy: 'netrunner-system',
  data: obs.value,
  derivedFrom: { observations: [obs.id] },
  tags: generateTags(obs),
  confidence: obs.confidence,
  verified: false
}));
```

#### Phase 4: Analysis
```typescript
// IntelAnalyzer processes all intelligence
const analysisResults = await IntelAnalyzer.analyzeIntelligence(intelligenceObjects);

const {
  entities,
  relationships, 
  patterns,
  indicators,
  findings
} = analysisResults;

// Analysis discovers:
// - 15 distinct entities
// - 23 relationships between entities
// - 4 significant patterns
// - 8 security indicators
// - 3 high-confidence findings
```

#### Phase 5: Report Generation
```typescript
// Generate comprehensive intelligence report
const intelReport: IntelReport = {
  id: 'report-001',
  title: 'OSINT Assessment: target.com Infrastructure Analysis',
  summary: 'Comprehensive analysis of target.com digital infrastructure reveals...',
  content: generateReportContent(findings, entities, patterns),
  classification: 'UNCLASS',
  disseminationControls: ['FOUO'], // For Official Use Only
  baseIntelligence: intelligenceObjects.map(i => i.id),
  keyFindings: findings.filter(f => f.severity === 'high').map(f => f.id),
  criticalIndicators: indicators.filter(i => i.severity === 'critical').map(i => i.id),
  authoredBy: ['netrunner-system', 'intelanalyzer-engine'],
  publishedAt: Date.now(),
  distributionList: ['analyst-team', 'operations-team']
};
```

## Real-World Usage Patterns

### Example 6: Automated Threat Monitoring

#### Continuous Collection
```typescript
// Set up continuous monitoring
const monitoringConfig: CollectionConfig = {
  sources: ['public_web', 'social_media', 'search_engine'],
  classification: 'UNCLASS',
  retentionPeriod: 90,
  qualityThreshold: 70,
  autoProcessing: true,
  alertThresholds: {
    critical: 90,
    high: 75,
    medium: 60
  }
};

// Schedule periodic scans
const scheduler = new IntelligenceScheduler();
scheduler.scheduleRecurring('target.com', {
  frequency: 'daily',
  depth: 'comprehensive',
  config: monitoringConfig
});
```

#### Automated Analysis Pipeline
```typescript
// Process new intelligence automatically
scheduler.onNewIntelligence(async (intel: Intelligence[]) => {
  // Immediate threat assessment
  const threats = await IntelAnalyzer.assessThreats(intel);
  
  // Generate alerts for critical threats
  const criticalThreats = threats.filter(t => t.severity === 'critical');
  if (criticalThreats.length > 0) {
    await AlertSystem.generateAlert({
      type: 'critical-threat',
      intelligence: intel,
      threats: criticalThreats,
      recipients: ['security-team', 'operations-center']
    });
  }
  
  // Update existing patterns
  await PatternAnalyzer.updatePatterns(intel);
  
  // Generate daily summary report
  if (isEndOfDay()) {
    const report = await ReportGenerator.generateDailySummary(intel);
    await DistributionSystem.distribute(report);
  }
});
```

### Example 7: Interactive Analysis Session

#### Analyst-Driven Investigation
```typescript
// Analyst initiates targeted collection
const analystQuery: IntelRequirement = {
  id: 'req-001',
  priority: 'PRIORITY',
  description: 'Investigate potential data breach at target.com',
  requiredSources: ['OSINT', 'SIGINT'],
  classification: 'CONFIDENTIAL',
  requestedBy: 'analyst-smith',
  deadline: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
};

// System responds with focused collection
const focusedCollection = await IntelligenceOrchestrator.fulfillRequirement(analystQuery);

// Analyst reviews and refines results
const refinedAnalysis = await IntelAnalyzer.refineAnalysis(focusedCollection, {
  focus: ['vulnerability', 'compromise', 'attribution'],
  confidenceThreshold: 80,
  crossValidate: true
});

// Generate targeted report
const targetedReport = await ReportGenerator.generateTargetedReport({
  requirement: analystQuery,
  intelligence: focusedCollection,
  analysis: refinedAnalysis,
  template: 'security-incident-assessment'
});
```

This comprehensive documentation provides clear examples of how each component in the intelligence system works together to transform raw data into actionable intelligence reports.
