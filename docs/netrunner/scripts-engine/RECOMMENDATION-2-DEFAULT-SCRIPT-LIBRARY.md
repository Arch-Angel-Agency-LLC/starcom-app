# Default Script Library Implementation - Recommendation #2

**Priority**: High  
**Phase**: Default Scripts (Week 2)  
**Impact**: Core OSINT processing capabilities  
**Dependencies**: Script Execution Architecture (Recommendation #1)

## 📋 **EXECUTIVE SUMMARY**

The Default Script Library provides four essential OSINT processing scripts that transform raw website scanning data into structured, actionable intelligence. These scripts represent the most common use cases in OSINT operations: email discovery, domain analysis, technology fingerprinting, and contact harvesting. Each script is designed for autonomous operation with intelligent categorization and confidence scoring.

### **Library Overview**
1. **Email Extractor** - Enhanced email discovery with validation and categorization
2. **Domain Parser** - Subdomain enumeration with relationship mapping  
3. **Tech Stack Analyzer** - Technology fingerprinting with version detection
4. **Contact Harvester** - Social media and contact information aggregation

### **Key Features**
- **Zero Configuration** - Works immediately with WebsiteScanner output
- **Intelligent Processing** - AI-enhanced pattern recognition and categorization
- **Confidence Scoring** - Reliability metrics for each extracted data point
- **Progressive Enhancement** - Builds upon existing NetRunner capabilities

---

## 🎯 **SCRIPT SPECIFICATIONS**

### **1. Email Extractor Script**

#### **Purpose & Scope**
Discovers, validates, and categorizes email addresses from OSINT data with enhanced pattern recognition and reputation analysis.

```typescript
interface EmailExtractorScript {
  name: 'Email Extractor';
  version: '1.0.0';
  description: 'Enhanced email discovery with validation and categorization';
  
  input: OSINTData;
  output: EmailIntelligence;
  
  capabilities: {
    patternRecognition: 'advanced';
    validation: 'dns-mx-smtp';
    categorization: 'automatic';
    deduplication: 'fuzzy-matching';
    confidenceScoring: 'ml-enhanced';
  };
}
```

#### **Implementation Details**
```typescript
// File: src/applications/netrunner/scripts/EmailExtractorScript.ts

export class EmailExtractorScript implements ScriptInterface {
  private emailPatterns = [
    // Standard email patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    // Obfuscated patterns
    /\b[A-Za-z0-9._%+-]+\s*\[at\]\s*[A-Za-z0-9.-]+\s*\[dot\]\s*[A-Z|a-z]{2,}\b/g,
    /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g,
    
    // URL encoded patterns
    /\b[A-Za-z0-9._%+-]+%40[A-Za-z0-9.-]+%2E[A-Z|a-z]{2,}\b/g,
    
    // Social media patterns
    /mailto:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g
  ];
  
  async execute(input: OSINTData): Promise<EmailIntelligence> {
    try {
      const extractedEmails = await this.extractEmails(input);
      const validatedEmails = await this.validateEmails(extractedEmails);
      const categorizedEmails = await this.categorizeEmails(validatedEmails);
      const enrichedEmails = await this.enrichEmailData(categorizedEmails);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'EmailExtractorScript',
        data: {
          emails: enrichedEmails,
          statistics: this.calculateStatistics(enrichedEmails),
          confidence: this.calculateOverallConfidence(enrichedEmails)
        },
        metadata: {
          patternsUsed: this.emailPatterns.length,
          processingTime: Date.now() - startTime,
          validationMethods: ['syntax', 'dns', 'mx', 'reputation']
        }
      };
      
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private async extractEmails(input: OSINTData): Promise<RawEmail[]> {
    const emails: RawEmail[] = [];
    const sources = [
      input.htmlContent,
      input.textContent,
      input.metaData?.description || '',
      input.metaData?.keywords || '',
      JSON.stringify(input.socialMedia || {}),
      JSON.stringify(input.contactInfo || {})
    ];
    
    for (const source of sources) {
      for (const pattern of this.emailPatterns) {
        const matches = source.match(pattern) || [];
        emails.push(...matches.map(email => ({
          address: this.normalizeEmail(email),
          source: this.identifySource(source),
          context: this.extractContext(source, email),
          confidence: this.calculateInitialConfidence(email, pattern)
        })));
      }
    }
    
    return this.deduplicateEmails(emails);
  }
  
  private async validateEmails(emails: RawEmail[]): Promise<ValidatedEmail[]> {
    const validatedEmails: ValidatedEmail[] = [];
    
    for (const email of emails) {
      const validation = await this.performEmailValidation(email.address);
      
      validatedEmails.push({
        ...email,
        validation: {
          syntax: validation.syntaxValid,
          domain: validation.domainExists,
          mx: validation.mxRecordExists,
          smtp: validation.smtpReachable,
          reputation: validation.reputationScore,
          disposable: validation.isDisposable,
          role: validation.isRoleAccount
        },
        confidence: this.adjustConfidenceBasedOnValidation(
          email.confidence,
          validation
        )
      });
    }
    
    return validatedEmails;
  }
  
  private async categorizeEmails(emails: ValidatedEmail[]): Promise<CategorizedEmail[]> {
    return emails.map(email => ({
      ...email,
      category: this.determineEmailCategory(email),
      priority: this.determinePriority(email),
      tags: this.generateTags(email)
    }));
  }
  
  private determineEmailCategory(email: ValidatedEmail): EmailCategory {
    const address = email.address.toLowerCase();
    const domain = address.split('@')[1];
    
    // Executive/Leadership emails
    if (/^(ceo|cto|cfo|president|director|vp|manager)@/.test(address)) {
      return 'executive';
    }
    
    // Contact/Support emails
    if (/^(contact|support|help|info|sales|marketing)@/.test(address)) {
      return 'contact';
    }
    
    // Technical emails
    if (/^(admin|webmaster|tech|it|dev|security)@/.test(address)) {
      return 'technical';
    }
    
    // Personal emails (common providers)
    if (['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      return 'personal';
    }
    
    // Corporate emails
    return 'corporate';
  }
}
```

### **2. Domain Parser Script**

#### **Purpose & Scope**
Analyzes domain relationships, discovers subdomains, and maps organizational structure from OSINT data.

```typescript
interface DomainParserScript {
  name: 'Domain Parser';
  version: '1.0.0';
  description: 'Subdomain enumeration with relationship mapping';
  
  input: OSINTData;
  output: DomainIntelligence;
  
  capabilities: {
    subdomainDiscovery: 'comprehensive';
    relationshipMapping: 'automated';
    dnsAnalysis: 'advanced';
    certificateAnalysis: 'included';
    geolocationMapping: 'enabled';
  };
}
```

#### **Implementation Strategy**
```typescript
// File: src/applications/netrunner/scripts/DomainParserScript.ts

export class DomainParserScript implements ScriptInterface {
  private subdomainPatterns = [
    // Direct subdomain references
    /([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g,
    
    // SSL certificate references
    /CN=([^,\s]+\.[a-zA-Z]{2,})/g,
    
    // DNS records in text
    /(\w+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\s+(A|AAAA|CNAME|MX|NS|TXT|SOA)/g,
    
    // URL references
    /https?:\/\/([^\/\s]+)/g
  ];
  
  async execute(input: OSINTData): Promise<DomainIntelligence> {
    const startTime = Date.now();
    
    try {
      const discoveredDomains = await this.discoverDomains(input);
      const analyzedDomains = await this.analyzeDomains(discoveredDomains);
      const mappedRelationships = await this.mapRelationships(analyzedDomains);
      const enrichedData = await this.enrichDomainData(mappedRelationships);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'DomainParserScript',
        data: {
          domains: enrichedData,
          relationships: mappedRelationships,
          statistics: this.calculateDomainStatistics(enrichedData),
          confidence: this.calculateOverallConfidence(enrichedData)
        },
        metadata: {
          discoveryMethods: ['pattern-matching', 'dns-analysis', 'certificate-parsing'],
          processingTime: Date.now() - startTime,
          totalDomains: enrichedData.length
        }
      };
      
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private async discoverDomains(input: OSINTData): Promise<RawDomain[]> {
    const domains: RawDomain[] = [];
    const baseDomain = this.extractBaseDomain(input.url);
    
    // Extract from HTML content
    domains.push(...this.extractDomainsFromHTML(input.htmlContent, baseDomain));
    
    // Extract from DNS data if available
    if (input.dnsRecords) {
      domains.push(...this.extractDomainsFromDNS(input.dnsRecords, baseDomain));
    }
    
    // Extract from SSL certificates
    if (input.sslInfo) {
      domains.push(...this.extractDomainsFromSSL(input.sslInfo, baseDomain));
    }
    
    // Extract from redirects and links
    domains.push(...this.extractDomainsFromLinks(input.links || [], baseDomain));
    
    return this.deduplicateDomains(domains);
  }
  
  private async analyzeDomains(domains: RawDomain[]): Promise<AnalyzedDomain[]> {
    const analyzed: AnalyzedDomain[] = [];
    
    for (const domain of domains) {
      const analysis = await this.performDomainAnalysis(domain);
      
      analyzed.push({
        ...domain,
        analysis: {
          isActive: analysis.responds,
          ipAddress: analysis.ipAddress,
          technology: analysis.detectedTechnology,
          security: analysis.securityHeaders,
          certificates: analysis.sslCertificates,
          geolocation: analysis.geolocation,
          organization: analysis.whoisData?.organization,
          registrar: analysis.whoisData?.registrar,
          creationDate: analysis.whoisData?.creationDate
        },
        confidence: this.calculateDomainConfidence(domain, analysis)
      });
    }
    
    return analyzed;
  }
  
  private async mapRelationships(domains: AnalyzedDomain[]): Promise<DomainRelationship[]> {
    const relationships: DomainRelationship[] = [];
    
    for (const domain of domains) {
      // Parent-child relationships
      const parentDomain = this.findParentDomain(domain, domains);
      if (parentDomain) {
        relationships.push({
          type: 'subdomain',
          source: domain.domain,
          target: parentDomain.domain,
          confidence: 0.95
        });
      }
      
      // Technology relationships
      const techRelated = this.findTechnologyRelatedDomains(domain, domains);
      relationships.push(...techRelated);
      
      // Organizational relationships
      const orgRelated = this.findOrganizationallyRelatedDomains(domain, domains);
      relationships.push(...orgRelated);
    }
    
    return relationships;
  }
}
```

### **3. Tech Stack Analyzer Script**

#### **Purpose & Scope**
Identifies technologies, frameworks, and services used by target websites with version detection and vulnerability assessment.

```typescript
interface TechStackAnalyzerScript {
  name: 'Tech Stack Analyzer';
  version: '1.0.0';
  description: 'Technology fingerprinting with version detection';
  
  input: OSINTData;
  output: TechnicalIntelligence;
  
  capabilities: {
    fingerprinting: 'comprehensive';
    versionDetection: 'automated';
    vulnerabilityAssessment: 'cve-lookup';
    performanceAnalysis: 'included';
    securityAnalysis: 'advanced';
  };
}
```

#### **Technology Detection Implementation**
```typescript
// File: src/applications/netrunner/scripts/TechStackAnalyzerScript.ts

export class TechStackAnalyzerScript implements ScriptInterface {
  private technologySignatures = {
    frameworks: {
      'React': {
        patterns: [
          /react/i,
          /__REACT_DEVTOOLS_GLOBAL_HOOK__/,
          /data-reactroot/,
          /_owner.*_store.*stateNode/
        ],
        headers: ['X-Powered-By: React'],
        meta: ['generator=React']
      },
      'Vue.js': {
        patterns: [
          /vue\.js/i,
          /__VUE__/,
          /data-v-[a-f0-9]{8}/,
          /v-[a-z-]+=/
        ],
        headers: ['X-Powered-By: Vue.js'],
        meta: ['generator=Vue.js']
      },
      'Angular': {
        patterns: [
          /angular/i,
          /ng-[a-z-]+=/,
          /_angular_core/,
          /\[ng-version\]/
        ],
        headers: ['X-Powered-By: Angular'],
        meta: ['generator=Angular']
      }
    },
    servers: {
      'Apache': {
        headers: ['Server: Apache'],
        patterns: [/apache/i],
        signatures: ['Apache Server']
      },
      'Nginx': {
        headers: ['Server: nginx', 'Server: nginx/'],
        patterns: [/nginx/i],
        signatures: ['nginx']
      },
      'IIS': {
        headers: ['Server: Microsoft-IIS'],
        patterns: [/iis/i],
        signatures: ['Microsoft-IIS']
      }
    },
    cms: {
      'WordPress': {
        patterns: [
          /wp-content/i,
          /wp-includes/i,
          /wordpress/i,
          /wp-json/
        ],
        meta: ['generator=WordPress'],
        files: ['/wp-admin/', '/wp-login.php']
      },
      'Drupal': {
        patterns: [
          /drupal/i,
          /sites\/default\/files/,
          /misc\/drupal\.js/
        ],
        meta: ['generator=Drupal'],
        headers: ['X-Drupal-Cache']
      }
    },
    analytics: {
      'Google Analytics': {
        patterns: [
          /google-analytics\.com/,
          /gtag\(/,
          /ga\('create'/,
          /UA-\d+-\d+/
        ]
      },
      'Facebook Pixel': {
        patterns: [
          /connect\.facebook\.net/,
          /fbq\(/,
          /facebook\.com\/tr/
        ]
      }
    }
  };
  
  async execute(input: OSINTData): Promise<TechnicalIntelligence> {
    const startTime = Date.now();
    
    try {
      const detectedTechnologies = await this.detectTechnologies(input);
      const analyzedVersions = await this.analyzeVersions(detectedTechnologies);
      const securityAssessment = await this.assessSecurity(analyzedVersions);
      const performanceAnalysis = await this.analyzePerformance(input);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'TechStackAnalyzerScript',
        data: {
          technologies: analyzedVersions,
          security: securityAssessment,
          performance: performanceAnalysis,
          architecture: this.analyzeArchitecture(analyzedVersions),
          confidence: this.calculateOverallConfidence(analyzedVersions)
        },
        metadata: {
          detectionMethods: ['pattern-matching', 'header-analysis', 'file-detection'],
          processingTime: Date.now() - startTime,
          totalTechnologies: analyzedVersions.length
        }
      };
      
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private async detectTechnologies(input: OSINTData): Promise<DetectedTechnology[]> {
    const technologies: DetectedTechnology[] = [];
    
    // Analyze HTML content
    technologies.push(...this.analyzeHTMLContent(input.htmlContent));
    
    // Analyze HTTP headers
    technologies.push(...this.analyzeHTTPHeaders(input.headers || {}));
    
    // Analyze JavaScript files
    technologies.push(...this.analyzeJavaScript(input.scripts || []));
    
    // Analyze CSS files
    technologies.push(...this.analyzeCSS(input.stylesheets || []));
    
    // Analyze meta tags
    technologies.push(...this.analyzeMetaTags(input.metaData || {}));
    
    return this.deduplicateTechnologies(technologies);
  }
  
  private analyzeHTMLContent(htmlContent: string): DetectedTechnology[] {
    const detected: DetectedTechnology[] = [];
    
    for (const [category, technologies] of Object.entries(this.technologySignatures)) {
      for (const [name, signatures] of Object.entries(technologies)) {
        const confidence = this.calculatePatternConfidence(
          htmlContent,
          signatures.patterns || []
        );
        
        if (confidence > 0.3) {
          detected.push({
            name,
            category,
            confidence,
            version: this.extractVersion(htmlContent, name),
            evidence: this.collectEvidence(htmlContent, signatures),
            source: 'html-content'
          });
        }
      }
    }
    
    return detected;
  }
  
  private async analyzeVersions(technologies: DetectedTechnology[]): Promise<AnalyzedTechnology[]> {
    const analyzed: AnalyzedTechnology[] = [];
    
    for (const tech of technologies) {
      const versionInfo = await this.getVersionInformation(tech);
      const vulnerabilities = await this.checkVulnerabilities(tech, versionInfo);
      
      analyzed.push({
        ...tech,
        version: versionInfo.version,
        versionConfidence: versionInfo.confidence,
        releaseDate: versionInfo.releaseDate,
        isLatest: versionInfo.isLatest,
        vulnerabilities: vulnerabilities,
        riskScore: this.calculateRiskScore(tech, vulnerabilities)
      });
    }
    
    return analyzed;
  }
}
```

### **4. Contact Harvester Script**

#### **Purpose & Scope**
Aggregates contact information, social media profiles, and communication channels from OSINT data with relationship mapping.

```typescript
interface ContactHarvesterScript {
  name: 'Contact Harvester';
  version: '1.0.0';
  description: 'Social media and contact information aggregation';
  
  input: OSINTData;
  output: ContactIntelligence;
  
  capabilities: {
    socialMediaDiscovery: 'comprehensive';
    contactValidation: 'automated';
    relationshipMapping: 'enabled';
    profileEnrichment: 'api-enhanced';
    confidenceScoring: 'ml-based';
  };
}
```

#### **Contact Discovery Implementation**
```typescript
// File: src/applications/netrunner/scripts/ContactHarvesterScript.ts

export class ContactHarvesterScript implements ScriptInterface {
  private socialPlatforms = {
    'LinkedIn': {
      patterns: [
        /linkedin\.com\/in\/([a-zA-Z0-9-]+)/g,
        /linkedin\.com\/company\/([a-zA-Z0-9-]+)/g
      ],
      validation: 'api-check',
      priority: 'high'
    },
    'Twitter': {
      patterns: [
        /twitter\.com\/([a-zA-Z0-9_]+)/g,
        /@([a-zA-Z0-9_]+)/g
      ],
      validation: 'profile-check',
      priority: 'medium'
    },
    'Facebook': {
      patterns: [
        /facebook\.com\/([a-zA-Z0-9.]+)/g,
        /fb\.me\/([a-zA-Z0-9.]+)/g
      ],
      validation: 'existence-check',
      priority: 'medium'
    },
    'Instagram': {
      patterns: [
        /instagram\.com\/([a-zA-Z0-9_.]+)/g
      ],
      validation: 'profile-check',
      priority: 'low'
    }
  };
  
  private contactPatterns = {
    phone: [
      /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\d{3}-\d{3}-\d{4}/g,
      /\(\d{3}\)\s*\d{3}-\d{4}/g
    ],
    address: [
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)(?:\s+\w+)*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}(-\d{4})?/g
    ],
    skype: [
      /skype:\s*([a-zA-Z0-9._-]+)/g,
      /skype\.com\/([a-zA-Z0-9._-]+)/g
    ]
  };
  
  async execute(input: OSINTData): Promise<ContactIntelligence> {
    const startTime = Date.now();
    
    try {
      const discoveredContacts = await this.discoverContacts(input);
      const validatedContacts = await this.validateContacts(discoveredContacts);
      const enrichedContacts = await this.enrichContactData(validatedContacts);
      const mappedRelationships = await this.mapContactRelationships(enrichedContacts);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'ContactHarvesterScript',
        data: {
          contacts: enrichedContacts,
          socialProfiles: this.extractSocialProfiles(enrichedContacts),
          relationships: mappedRelationships,
          statistics: this.calculateContactStatistics(enrichedContacts),
          confidence: this.calculateOverallConfidence(enrichedContacts)
        },
        metadata: {
          discoveryMethods: ['pattern-matching', 'social-parsing', 'contact-extraction'],
          processingTime: Date.now() - startTime,
          totalContacts: enrichedContacts.length
        }
      };
      
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private async discoverContacts(input: OSINTData): Promise<RawContact[]> {
    const contacts: RawContact[] = [];
    
    // Extract social media profiles
    contacts.push(...this.extractSocialMediaProfiles(input));
    
    // Extract phone numbers
    contacts.push(...this.extractPhoneNumbers(input));
    
    // Extract physical addresses
    contacts.push(...this.extractAddresses(input));
    
    // Extract communication platforms
    contacts.push(...this.extractCommunicationPlatforms(input));
    
    // Extract from metadata
    if (input.metaData) {
      contacts.push(...this.extractFromMetadata(input.metaData));
    }
    
    return this.deduplicateContacts(contacts);
  }
  
  private extractSocialMediaProfiles(input: OSINTData): RawContact[] {
    const profiles: RawContact[] = [];
    const content = [
      input.htmlContent,
      input.textContent,
      JSON.stringify(input.socialMedia || {}),
      JSON.stringify(input.links || [])
    ].join(' ');
    
    for (const [platform, config] of Object.entries(this.socialPlatforms)) {
      for (const pattern of config.patterns) {
        const matches = content.match(pattern) || [];
        
        profiles.push(...matches.map(match => ({
          type: 'social-media',
          platform,
          value: match,
          confidence: this.calculateSocialConfidence(match, platform),
          context: this.extractContext(content, match),
          source: 'pattern-extraction'
        })));
      }
    }
    
    return profiles;
  }
  
  private async validateContacts(contacts: RawContact[]): Promise<ValidatedContact[]> {
    const validated: ValidatedContact[] = [];
    
    for (const contact of contacts) {
      const validation = await this.performContactValidation(contact);
      
      validated.push({
        ...contact,
        validation: {
          isValid: validation.exists,
          isActive: validation.active,
          lastSeen: validation.lastActivity,
          reputation: validation.reputationScore,
          verification: validation.verificationMethods
        },
        confidence: this.adjustConfidenceBasedOnValidation(
          contact.confidence,
          validation
        )
      });
    }
    
    return validated;
  }
  
  private async enrichContactData(contacts: ValidatedContact[]): Promise<EnrichedContact[]> {
    const enriched: EnrichedContact[] = [];
    
    for (const contact of contacts) {
      const enrichmentData = await this.performContactEnrichment(contact);
      
      enriched.push({
        ...contact,
        enrichment: {
          profileData: enrichmentData.profile,
          connections: enrichmentData.connections,
          activity: enrichmentData.recentActivity,
          interests: enrichmentData.interests,
          location: enrichmentData.location,
          organization: enrichmentData.organization
        },
        tags: this.generateContactTags(contact, enrichmentData),
        priority: this.calculateContactPriority(contact, enrichmentData)
      });
    }
    
    return enriched;
  }
}
```

---

## 📊 **INTEGRATION STRATEGY**

### **Script Registration System**
```typescript
// File: src/applications/netrunner/scripts/ScriptRegistry.ts

export class DefaultScriptRegistry {
  private static scripts: Map<string, ScriptInterface> = new Map([
    ['email-extractor', new EmailExtractorScript()],
    ['domain-parser', new DomainParserScript()],
    ['tech-stack-analyzer', new TechStackAnalyzerScript()],
    ['contact-harvester', new ContactHarvesterScript()]
  ]);
  
  static getScript(name: string): ScriptInterface | null {
    return this.scripts.get(name) || null;
  }
  
  static getAllScripts(): ScriptInterface[] {
    return Array.from(this.scripts.values());
  }
  
  static getScriptMetadata(): ScriptMetadata[] {
    return Array.from(this.scripts.values()).map(script => ({
      name: script.name,
      description: script.description,
      version: script.version,
      capabilities: script.capabilities,
      inputType: script.inputType,
      outputType: script.outputType
    }));
  }
}
```

### **WebsiteScanner Integration**
```typescript
// Integration with existing WebsiteScanner output
interface OSINTDataAdapter {
  adaptWebsiteScannerOutput(scanResult: WebsiteScanResult): OSINTData;
  adaptToIntelAnalyzerInput(scriptResults: ScriptResult[]): IntelligenceInput;
}

class OSINTDataAdapter implements OSINTDataAdapter {
  adaptWebsiteScannerOutput(scanResult: WebsiteScanResult): OSINTData {
    return {
      url: scanResult.url,
      htmlContent: scanResult.content?.html || '',
      textContent: scanResult.content?.text || '',
      metaData: scanResult.metadata,
      headers: scanResult.headers,
      links: scanResult.links,
      scripts: scanResult.resources?.scripts || [],
      stylesheets: scanResult.resources?.stylesheets || [],
      socialMedia: scanResult.socialMedia,
      contactInfo: scanResult.contactInfo,
      technologies: scanResult.technologies,
      timestamp: scanResult.timestamp
    };
  }
  
  adaptToIntelAnalyzerInput(scriptResults: ScriptResult[]): IntelligenceInput {
    return {
      rawData: scriptResults.map(result => result.data),
      metadata: {
        sources: scriptResults.map(result => result.source),
        processingTime: scriptResults.reduce((sum, result) => 
          sum + (result.metadata?.processingTime || 0), 0),
        confidence: this.calculateAggregateConfidence(scriptResults)
      },
      correlationHints: this.generateCorrelationHints(scriptResults)
    };
  }
}
```

---

## 📈 **TESTING STRATEGY**

### **Individual Script Testing**
```typescript
// File: tests/netrunner/scripts/EmailExtractorScript.test.ts

describe('EmailExtractorScript', () => {
  let script: EmailExtractorScript;
  
  beforeEach(() => {
    script = new EmailExtractorScript();
  });
  
  describe('Email Extraction', () => {
    it('should extract standard email formats', async () => {
      const input = createOSINTData({
        htmlContent: `
          <p>Contact us at info@example.com</p>
          <div>Support: support@test.org</div>
        `
      });
      
      const result = await script.execute(input);
      
      expect(result.data.emails).toHaveLength(2);
      expect(result.data.emails[0].address).toBe('info@example.com');
      expect(result.data.emails[1].address).toBe('support@test.org');
    });
    
    it('should handle obfuscated email formats', async () => {
      const input = createOSINTData({
        htmlContent: 'Contact: admin [at] example [dot] com'
      });
      
      const result = await script.execute(input);
      
      expect(result.data.emails).toHaveLength(1);
      expect(result.data.emails[0].address).toBe('admin@example.com');
    });
    
    it('should validate email addresses', async () => {
      const input = createOSINTData({
        htmlContent: 'Valid: test@gmail.com Invalid: not-an-email'
      });
      
      const result = await script.execute(input);
      
      expect(result.data.emails).toHaveLength(1);
      expect(result.data.emails[0].validation.syntax).toBe(true);
    });
  });
  
  describe('Email Categorization', () => {
    it('should categorize executive emails', async () => {
      const input = createOSINTData({
        htmlContent: 'CEO: ceo@company.com CTO: cto@company.com'
      });
      
      const result = await script.execute(input);
      
      expect(result.data.emails[0].category).toBe('executive');
      expect(result.data.emails[1].category).toBe('executive');
    });
    
    it('should categorize contact emails', async () => {
      const input = createOSINTData({
        htmlContent: 'Support: support@company.com Info: info@company.com'
      });
      
      const result = await script.execute(input);
      
      result.data.emails.forEach(email => {
        expect(email.category).toBe('contact');
      });
    });
  });
});
```

### **Integration Testing**
```typescript
// File: tests/netrunner/scripts/ScriptIntegration.test.ts

describe('Script Integration', () => {
  let adapter: OSINTDataAdapter;
  let registry: DefaultScriptRegistry;
  
  beforeEach(() => {
    adapter = new OSINTDataAdapter();
    registry = new DefaultScriptRegistry();
  });
  
  it('should process WebsiteScanner output through all scripts', async () => {
    const websiteScanResult = createMockWebsiteScanResult();
    const osintData = adapter.adaptWebsiteScannerOutput(websiteScanResult);
    
    const scriptResults = await Promise.all(
      registry.getAllScripts().map(script => script.execute(osintData))
    );
    
    expect(scriptResults).toHaveLength(4);
    scriptResults.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
  
  it('should maintain data consistency across script executions', async () => {
    const osintData = createTestOSINTData();
    
    const emailResult = await registry.getScript('email-extractor')!.execute(osintData);
    const domainResult = await registry.getScript('domain-parser')!.execute(osintData);
    
    // Verify cross-script data consistency
    const emailDomains = emailResult.data.emails.map(e => e.address.split('@')[1]);
    const discoveredDomains = domainResult.data.domains.map(d => d.domain);
    
    emailDomains.forEach(domain => {
      expect(discoveredDomains).toContain(domain);
    });
  });
});
```

---

## 🚀 **DEPLOYMENT PLAN**

### **Week 2 Implementation Schedule**

#### **Days 1-2: Email Extractor Implementation**
- Core email extraction patterns
- Validation pipeline (DNS, MX, SMTP)
- Categorization engine
- Initial testing

#### **Days 3-4: Domain Parser & Tech Stack Analyzer**
- Domain discovery and analysis
- Technology fingerprinting
- Version detection
- Security assessment

#### **Day 5: Contact Harvester & Integration**
- Social media extraction
- Contact validation
- Script registry implementation
- End-to-end integration testing

---

## 📊 **SUCCESS METRICS**

### **Performance Targets**
- **Execution Time**: Each script completes within 3 seconds
- **Memory Usage**: < 25MB per script execution
- **Accuracy**: > 95% precision for extracted data
- **Coverage**: > 90% recall for common patterns

### **Quality Metrics**
- **False Positive Rate**: < 5% for all extractions
- **Confidence Accuracy**: ±10% of actual reliability
- **Validation Success**: > 98% successful validations
- **Integration Compatibility**: 100% with existing systems

This comprehensive script library transforms NetRunner into a powerful automated intelligence processing platform, bridging the gap between raw data collection and actionable intelligence analysis.
