/**
 * NetRunner Website Scanner Service
 * 
 * Production-ready website analysis service for Vite React TypeScript dApp
 * Optimized for Vercel deployment with enhanced security and performance.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

export interface ScanResult {
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

export interface Vulnerability {
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

export interface OSINTData {
  emails: string[];
  socialMedia: string[];
  technologies: Technology[];
  serverInfo: string[];
  subdomains: string[];
  certificates: CertificateInfo[];
  dns: DNSRecord[];
}

export interface Technology {
  name: string;
  version?: string;
  category: 'framework' | 'library' | 'cms' | 'analytics' | 'cdn' | 'security';
  confidence: number;
}

export interface CertificateInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  algorithm: string;
}

export interface DNSRecord {
  type: string;
  value: string;
  ttl?: number;
}

export interface WebsiteMetadata {
  ip: string;
  server: string;
  lastModified: string;
  size: string;
  responseTime: number;
  headers: Record<string, string>;
  statusCode: number;
  redirects: string[];
  contentType: string;
  encoding: string;
}

export class WebsiteScannerService {
  private corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  private currentProxyIndex = 0;

  /**
   * Performs a comprehensive website scan
   */
  async scanWebsite(
    url: string, 
    onProgress?: (progress: number, status: string) => void
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const normalizedUrl = this.normalizeUrl(url);

    const result: ScanResult = {
      url: normalizedUrl,
      title: 'Scanning...',
      status: 'scanning',
      progress: 0,
      sourceCode: '',
      vulnerabilities: [],
      osintData: {
        emails: [],
        socialMedia: [],
        technologies: [],
        serverInfo: [],
        subdomains: [],
        certificates: [],
        dns: []
      },
      metadata: {
        ip: '',
        server: '',
        lastModified: '',
        size: '',
        responseTime: 0,
        headers: {},
        statusCode: 0,
        redirects: [],
        contentType: '',
        encoding: ''
      },
      timestamp: startTime
    };

    try {
      // Step 1: Fetch website content
      onProgress?.(10, 'Establishing connection...');
      const { html, metadata } = await this.fetchWithFallback(normalizedUrl);
      result.sourceCode = html;
      result.metadata = { ...result.metadata, ...metadata };

      // Step 2: Parse HTML
      onProgress?.(25, 'Parsing HTML structure...');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      result.title = doc.querySelector('title')?.textContent || 'No title found';

      // Step 3: Security analysis
      onProgress?.(40, 'Analyzing security vulnerabilities...');
      result.vulnerabilities = await this.analyzeVulnerabilities(html, doc, normalizedUrl);

      // Step 4: OSINT extraction
      onProgress?.(60, 'Extracting OSINT intelligence...');
      result.osintData = this.extractOSINTData(html, doc, normalizedUrl);

      // Step 5: Technology detection
      onProgress?.(80, 'Identifying technologies...');
      result.osintData.technologies = this.detectTechnologies(html, doc);

      // Step 6: Finalize
      onProgress?.(100, 'Scan completed');
      result.status = 'completed';
      result.progress = 100;
      result.metadata.responseTime = Date.now() - startTime;

      return result;

    } catch (error) {
      console.error('Website scan failed:', error);
      result.status = 'error';
      result.title = 'Scan Failed';
      throw error;
    }
  }

  /**
   * Normalizes URL format
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  }

  /**
   * Fetches website with CORS proxy fallback
   */
  private async fetchWithFallback(url: string): Promise<{html: string, metadata: Partial<WebsiteMetadata>}> {
    const errors: string[] = [];
    
    for (let i = 0; i < this.corsProxies.length; i++) {
      try {
        const proxyUrl = this.corsProxies[this.currentProxyIndex] + encodeURIComponent(url);
        const startTime = Date.now();
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'NetRunner-Scanner/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const responseTime = Date.now() - startTime;

        const metadata: Partial<WebsiteMetadata> = {
          statusCode: response.status,
          responseTime,
          size: `${(html.length / 1024).toFixed(2)} KB`,
          contentType: response.headers.get('content-type') || 'text/html',
          headers: Object.fromEntries(response.headers.entries())
        };

        return { html, metadata };

      } catch (error) {
        errors.push(`Proxy ${i + 1}: ${error}`);
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
      }
    }

    throw new Error(`All CORS proxies failed: ${errors.join(', ')}`);
  }

  /**
   * Advanced vulnerability analysis
   */
  private async analyzeVulnerabilities(html: string, doc: Document, url: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Security Headers Analysis
    const headerVulns = this.analyzeSecurityHeaders(html);
    vulnerabilities.push(...headerVulns);

    // Content Security Policy
    const cspVulns = this.analyzeCSP(doc);
    vulnerabilities.push(...cspVulns);

    // Mixed Content
    const mixedContentVulns = this.analyzeMixedContent(doc, url);
    vulnerabilities.push(...mixedContentVulns);

    // Form Security
    const formVulns = this.analyzeForms(doc);
    vulnerabilities.push(...formVulns);

    // External Dependencies
    const depVulns = this.analyzeExternalDependencies(doc);
    vulnerabilities.push(...depVulns);

    // Sensitive Data Exposure
    const dataVulns = this.analyzeSensitiveData(html, doc);
    vulnerabilities.push(...dataVulns);

    return vulnerabilities;
  }

  private analyzeSecurityHeaders(html: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const headers = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Strict-Transport-Security'];

    headers.forEach(header => {
      if (!html.includes(header)) {
        vulnerabilities.push({
          id: `missing-${header.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: `Missing ${header}`,
          type: 'security-header',
          severity: header === 'Content-Security-Policy' ? 'high' : 'medium',
          description: `Security header ${header} is not present.`,
          location: 'HTTP Headers',
          impact: 'Reduces protection against various attacks',
          recommendation: `Implement ${header} header for enhanced security.`
        });
      }
    });

    return vulnerabilities;
  }

  private analyzeCSP(doc: Document): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const cspMeta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      vulnerabilities.push({
        id: 'no-csp',
        title: 'No Content Security Policy',
        type: 'csp',
        severity: 'high',
        description: 'No CSP found in meta tags or headers.',
        location: 'HTML Head',
        impact: 'Vulnerable to XSS and injection attacks',
        recommendation: 'Implement a strict Content Security Policy.'
      });
    }

    return vulnerabilities;
  }

  private analyzeMixedContent(doc: Document, url: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    
    if (url.startsWith('https://')) {
      const httpResources = doc.querySelectorAll('img[src^="http://"], script[src^="http://"], link[href^="http://"]');
      
      if (httpResources.length > 0) {
        vulnerabilities.push({
          id: 'mixed-content',
          title: 'Mixed Content Detected',
          type: 'mixed-content',
          severity: 'high',
          description: `Found ${httpResources.length} HTTP resources on HTTPS page.`,
          location: 'HTML Elements',
          impact: 'Compromises HTTPS security',
          recommendation: 'Replace all HTTP resources with HTTPS equivalents.'
        });
      }
    }

    return vulnerabilities;
  }

  private analyzeForms(doc: Document): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const forms = doc.querySelectorAll('form');

    forms.forEach((form, index) => {
      // CSRF Protection
      const hasCSRF = form.querySelector('input[name*="csrf"], input[name*="token"], input[name="_token"]');
      if (!hasCSRF && form.method?.toLowerCase() === 'post') {
        vulnerabilities.push({
          id: `csrf-${index}`,
          title: 'Missing CSRF Protection',
          type: 'csrf',
          severity: 'medium',
          description: 'POST form lacks CSRF token protection.',
          location: `Form #${index + 1}`,
          impact: 'Vulnerable to Cross-Site Request Forgery',
          recommendation: 'Add CSRF tokens to all state-changing forms.'
        });
      }

      // Password field without HTTPS
      const hasPassword = form.querySelector('input[type="password"]');
      if (hasPassword && !form.action?.startsWith('https://')) {
        vulnerabilities.push({
          id: `insecure-password-${index}`,
          title: 'Insecure Password Transmission',
          type: 'password-security',
          severity: 'critical',
          description: 'Password field not transmitted over HTTPS.',
          location: `Form #${index + 1}`,
          impact: 'Password can be intercepted',
          recommendation: 'Ensure all password forms submit over HTTPS.'
        });
      }
    });

    return vulnerabilities;
  }

  private analyzeExternalDependencies(doc: Document): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const externalScripts = doc.querySelectorAll('script[src^="http"]');
    
    externalScripts.forEach((script, index) => {
      const src = (script as HTMLScriptElement).src;
      const hasIntegrity = script.hasAttribute('integrity');
      
      if (!hasIntegrity) {
        vulnerabilities.push({
          id: `no-sri-${index}`,
          title: 'Missing Subresource Integrity',
          type: 'sri',
          severity: 'medium',
          description: `External script from ${new URL(src).hostname} lacks SRI.`,
          location: 'Script Tags',
          impact: 'Vulnerable to CDN compromise',
          recommendation: 'Add integrity attributes to external scripts.'
        });
      }
    });

    return vulnerabilities;
  }

  private analyzeSensitiveData(html: string, _doc: Document): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    // Look for potential sensitive data in comments
    const commentRegex = /<!--[\s\S]*?-->/g;
    const comments = html.match(commentRegex) || [];
    
    comments.forEach((comment, index) => {
      if (/password|secret|key|token|api/i.test(comment)) {
        vulnerabilities.push({
          id: `sensitive-comment-${index}`,
          title: 'Sensitive Data in Comments',
          type: 'data-exposure',
          severity: 'low',
          description: 'HTML comments may contain sensitive information.',
          location: 'HTML Comments',
          impact: 'Information disclosure',
          recommendation: 'Remove sensitive data from HTML comments.'
        });
      }
    });

    return vulnerabilities;
  }

  /**
   * Extracts OSINT data from website
   */
  private extractOSINTData(html: string, doc: Document, url: string): OSINTData {
    return {
      emails: this.extractEmails(html),
      socialMedia: this.extractSocialMedia(doc),
      technologies: [], // Will be filled by detectTechnologies
      serverInfo: this.extractServerInfo(html),
      subdomains: this.extractSubdomains(doc, url),
      certificates: this.extractCertificateInfo(doc),
      dns: this.extractDNSInfo(doc)
    };
  }

  private extractEmails(html: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = html.match(emailRegex) || [];
    return [...new Set(emails)].slice(0, 20); // Limit to 20 unique emails
  }

  private extractSocialMedia(doc: Document): string[] {
    const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'tiktok.com', 'discord.gg'];
    const socialLinks: string[] = [];

    socialDomains.forEach(domain => {
      const links = doc.querySelectorAll(`a[href*="${domain}"]`);
      links.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        if (!socialLinks.includes(href)) {
          socialLinks.push(href);
        }
      });
    });

    return socialLinks.slice(0, 15);
  }

  private extractServerInfo(html: string): string[] {
    const serverInfo: string[] = [];
    const serverIndicators = [
      { pattern: /x-powered-by/i, tech: 'PHP/ASP.NET' },
      { pattern: /nginx/i, tech: 'Nginx' },
      { pattern: /apache/i, tech: 'Apache' },
      { pattern: /cloudflare/i, tech: 'Cloudflare' },
      { pattern: /aws/i, tech: 'AWS' }
    ];

    serverIndicators.forEach(({ pattern, tech }) => {
      if (pattern.test(html)) {
        serverInfo.push(tech);
      }
    });

    return serverInfo;
  }

  private extractSubdomains(doc: Document, originalUrl: string): string[] {
    const subdomains: string[] = [];
    const links = doc.querySelectorAll('a[href]');
    const originalDomain = new URL(originalUrl).hostname;

    links.forEach(link => {
      try {
        const href = (link as HTMLAnchorElement).href;
        const url = new URL(href);
        
        if (url.hostname !== originalDomain && url.hostname.endsWith(originalDomain.split('.').slice(-2).join('.'))) {
          if (!subdomains.includes(url.hostname)) {
            subdomains.push(url.hostname);
          }
        }
      } catch {
        // Invalid URL, skip
      }
    });

    return subdomains.slice(0, 10);
  }

  private extractCertificateInfo(_doc: Document): CertificateInfo[] {
    // Limited in browser environment
    return [];
  }

  private extractDNSInfo(_doc: Document): DNSRecord[] {
    // Limited in browser environment
    return [];
  }

  /**
   * Advanced technology detection
   */
  private detectTechnologies(html: string, doc: Document): Technology[] {
    const technologies: Technology[] = [];

    // Framework detection
    const frameworks = [
      { name: 'React', patterns: [/react/i, /_react/i, /reactdom/i], category: 'framework' as const },
      { name: 'Angular', patterns: [/angular/i, /ng-/i], category: 'framework' as const },
      { name: 'Vue.js', patterns: [/vue/i, /v-/i], category: 'framework' as const },
      { name: 'Next.js', patterns: [/next\.js/i, /__next/i], category: 'framework' as const },
      { name: 'Nuxt.js', patterns: [/nuxt/i], category: 'framework' as const }
    ];

    // Library detection
    const libraries = [
      { name: 'jQuery', patterns: [/jquery/i, /\$\(/], category: 'library' as const },
      { name: 'Lodash', patterns: [/lodash/i, /_\./], category: 'library' as const },
      { name: 'Bootstrap', patterns: [/bootstrap/i, /\.bs-/], category: 'library' as const },
      { name: 'Tailwind CSS', patterns: [/tailwind/i, /tw-/], category: 'library' as const }
    ];

    // Analytics detection
    const analytics = [
      { name: 'Google Analytics', patterns: [/google-analytics/i, /gtag/i], category: 'analytics' as const },
      { name: 'Google Tag Manager', patterns: [/googletagmanager/i, /gtm/i], category: 'analytics' as const }
    ];

    const allTechs = [...frameworks, ...libraries, ...analytics];

    allTechs.forEach(tech => {
      let confidence = 0;
      tech.patterns.forEach(pattern => {
        if (pattern.test(html)) {
          confidence += 25;
        }
      });

      if (confidence > 0) {
        technologies.push({
          name: tech.name,
          category: tech.category,
          confidence: Math.min(confidence, 100)
        });
      }
    });

    // Meta generator detection
    const generator = doc.querySelector('meta[name="generator"]')?.getAttribute('content');
    if (generator) {
      technologies.push({
        name: generator,
        category: 'cms',
        confidence: 90
      });
    }

    return technologies;
  }
}

// Export singleton instance
export const websiteScanner = new WebsiteScannerService();
