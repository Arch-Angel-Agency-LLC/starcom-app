/**
 * Advanced OSINT Crawler - Deep Web Intelligence Gathering
 * 
 * Military-grade reconnaissance crawler for discovering and analyzing
 * hidden URLs, endpoints, and intelligence assets across target domains.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import { websiteScanner, type ScanResult } from './WebsiteScanner';

export interface CrawlTarget {
  url: string;
  depth: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: 'robots' | 'sitemap' | 'links' | 'directory' | 'wordlist' | 'wayback' | 'github';
  discovered: number;
}

export interface CrawlResult {
  targetUrl: string;
  discoveredUrls: CrawlTarget[];
  scannedResults: Map<string, ScanResult>;
  intelligence: IntelligenceData;
  progress: number;
  status: 'crawling' | 'completed' | 'error';
  timestamp: number;
}

export interface IntelligenceData {
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

export interface CredentialLeak {
  type: 'username' | 'password' | 'api_key' | 'token' | 'certificate';
  value: string;
  context: string;
  confidence: number;
  source: string;
}

export interface SensitiveDataLeak {
  type: 'pii' | 'financial' | 'medical' | 'internal' | 'debug';
  data: string;
  context: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  source: string;
}

export interface WaybackSnapshot {
  url: string;
  timestamp: string;
  status: number;
  digest: string;
  length: number;
}

export interface GitHubLeak {
  repository: string;
  file: string;
  content: string;
  type: 'api_key' | 'password' | 'config' | 'database';
  url: string;
}

export class AdvancedOSINTCrawler {
  private corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  private currentProxyIndex = 0;
  private maxDepth = 3;
  private maxUrls = 100;
  private crawlDelay = 1000; // 1 second between requests

  // Common directories and files to discover
  private commonDirectories = [
    'admin', 'administrator', 'wp-admin', 'cpanel', 'controlpanel',
    'login', 'signin', 'auth', 'dashboard', 'panel', 'manage',
    'api', 'v1', 'v2', 'rest', 'graphql', 'swagger',
    'backup', 'backups', 'old', 'temp', 'tmp', 'test',
    'dev', 'staging', 'development', 'production',
    'config', 'configuration', 'settings', 'env',
    'docs', 'documentation', 'help', 'support',
    'assets', 'static', 'uploads', 'files', 'download',
    'db', 'database', 'sql', 'dump', 'export'
  ];

  private commonFiles = [
    'robots.txt', 'sitemap.xml', 'sitemap_index.xml',
    '.htaccess', '.htpasswd', 'web.config', '.env',
    'config.php', 'config.ini', 'settings.json',
    'backup.sql', 'dump.sql', 'database.sql',
    'wp-config.php', 'config.inc.php', 'configuration.php',
    'admin.php', 'login.php', 'auth.php',
    'phpinfo.php', 'test.php', 'info.php',
    'readme.txt', 'readme.md', 'changelog.txt',
    'version.txt', 'version.json', 'package.json',
    'composer.json', 'yarn.lock', 'package-lock.json'
  ];

  private sensitivePatterns = [
    // Credentials
    { pattern: /password\s*[:=]\s*["']?([^"'\s\n]+)/gi, type: 'password' },
    { pattern: /username\s*[:=]\s*["']?([^"'\s\n]+)/gi, type: 'username' },
    { pattern: /api[_-]?key\s*[:=]\s*["']?([^"'\s\n]+)/gi, type: 'api_key' },
    { pattern: /secret[_-]?key\s*[:=]\s*["']?([^"'\s\n]+)/gi, type: 'api_key' },
    { pattern: /access[_-]?token\s*[:=]\s*["']?([^"'\s\n]+)/gi, type: 'token' },
    
    // Database connections
    { pattern: /mysql:\/\/([^"\s\n]+)/gi, type: 'database' },
    { pattern: /postgresql:\/\/([^"\s\n]+)/gi, type: 'database' },
    { pattern: /mongodb:\/\/([^"\s\n]+)/gi, type: 'database' },
    
    // AWS/Cloud credentials
    { pattern: /AKIA[0-9A-Z]{16}/g, type: 'aws_key' },
    { pattern: /[0-9a-zA-Z/+]{40}/g, type: 'aws_secret' },
    
    // Private keys
    { pattern: /-----BEGIN PRIVATE KEY-----/g, type: 'private_key' },
    { pattern: /-----BEGIN RSA PRIVATE KEY-----/g, type: 'rsa_key' }
  ];

  /**
   * Starts comprehensive OSINT crawling
   */
  async startAdvancedCrawl(
    targetUrl: string,
    options: {
      maxDepth?: number;
      maxUrls?: number;
      includeWayback?: boolean;
      includeGitHub?: boolean;
      includeDirectoryBruteforce?: boolean;
    } = {},
    onProgress?: (progress: number, status: string, found?: number) => void
  ): Promise<CrawlResult> {
    const startTime = Date.now();
    this.maxDepth = options.maxDepth || 3;
    this.maxUrls = options.maxUrls || 100;

    const result: CrawlResult = {
      targetUrl,
      discoveredUrls: [],
      scannedResults: new Map(),
      intelligence: {
        hiddenDirectories: [],
        adminPanels: [],
        apiEndpoints: [],
        backupFiles: [],
        configFiles: [],
        databaseFiles: [],
        logFiles: [],
        documentFiles: [],
        archiveFiles: [],
        sourceCodeLeaks: [],
        credentials: [],
        sensitiveData: [],
        waybackHistory: [],
        githubLeaks: []
      },
      progress: 0,
      status: 'crawling',
      timestamp: startTime
    };

    try {
      // Phase 1: Initial reconnaissance
      onProgress?.(10, 'Starting reconnaissance phase...');
      await this.performInitialRecon(targetUrl, result);

      // Phase 2: Directory and file discovery
      onProgress?.(25, 'Discovering hidden directories and files...');
      if (options.includeDirectoryBruteforce !== false) {
        await this.performDirectoryBruteforce(targetUrl, result);
      }

      // Phase 3: Deep link crawling
      onProgress?.(45, 'Crawling discovered URLs...');
      await this.performDeepCrawl(result, onProgress);

      // Phase 4: Wayback Machine analysis
      if (options.includeWayback) {
        onProgress?.(70, 'Analyzing Wayback Machine history...');
        await this.analyzeWaybackMachine(targetUrl, result);
      }

      // Phase 5: GitHub leak detection
      if (options.includeGitHub) {
        onProgress?.(85, 'Searching for GitHub code leaks...');
        await this.searchGitHubLeaks(targetUrl, result);
      }

      // Phase 6: Intelligence analysis
      onProgress?.(95, 'Analyzing collected intelligence...');
      await this.analyzeIntelligence(result);

      onProgress?.(100, 'OSINT crawling completed');
      result.status = 'completed';
      result.progress = 100;

      return result;

    } catch (error) {
      console.error('Advanced OSINT crawl failed:', error);
      result.status = 'error';
      throw error;
    }
  }

  /**
   * Initial reconnaissance - robots.txt, sitemap.xml, basic scanning
   */
  private async performInitialRecon(targetUrl: string, result: CrawlResult): Promise<void> {
    const baseUrl = new URL(targetUrl).origin;
    
    // Check robots.txt
    await this.discoverFromRobots(baseUrl, result);
    
    // Check sitemap.xml
    await this.discoverFromSitemap(baseUrl, result);
    
    // Scan main page
    try {
      const scanResult = await websiteScanner.scanWebsite(targetUrl);
      result.scannedResults.set(targetUrl, scanResult);
      
      // Extract links from main page
      this.extractLinksFromScanResult(scanResult, result, 0);
    } catch (error) {
      console.error('Failed to scan main page:', error);
    }
  }

  /**
   * Discover URLs from robots.txt
   */
  private async discoverFromRobots(baseUrl: string, result: CrawlResult): Promise<void> {
    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      const response = await this.fetchWithProxy(robotsUrl);
      
      if (response) {
        const lines = response.split('\n');
        for (const line of lines) {
          const disallowMatch = line.match(/Disallow:\s*(.+)/i);
          const allowMatch = line.match(/Allow:\s*(.+)/i);
          
          if (disallowMatch || allowMatch) {
            const path = (disallowMatch || allowMatch)![1].trim();
            if (path && path !== '/') {
              const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
              result.discoveredUrls.push({
                url: fullUrl,
                depth: 1,
                priority: 'high',
                source: 'robots',
                discovered: Date.now()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch robots.txt:', error);
    }
  }

  /**
   * Discover URLs from sitemap.xml
   */
  private async discoverFromSitemap(baseUrl: string, result: CrawlResult): Promise<void> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemaps.xml`
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await this.fetchWithProxy(sitemapUrl);
        if (response) {
          // Extract URLs from XML
          const urlMatches = response.match(/<loc>(.*?)<\/loc>/g);
          if (urlMatches) {
            for (const match of urlMatches) {
              const url = match.replace(/<\/?loc>/g, '');
              if (url && url.startsWith('http')) {
                result.discoveredUrls.push({
                  url,
                  depth: 1,
                  priority: 'medium',
                  source: 'sitemap',
                  discovered: Date.now()
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch sitemap ${sitemapUrl}:`, error);
      }
    }
  }

  /**
   * Brute force common directories and files
   */
  private async performDirectoryBruteforce(targetUrl: string, result: CrawlResult): Promise<void> {
    const baseUrl = new URL(targetUrl).origin;
    
    // Test common directories
    for (const dir of this.commonDirectories) {
      const testUrl = `${baseUrl}/${dir}`;
      const exists = await this.checkUrlExists(testUrl);
      
      if (exists) {
        result.discoveredUrls.push({
          url: testUrl,
          depth: 1,
          priority: this.categorizePriority(dir),
          source: 'directory',
          discovered: Date.now()
        });

        // Categorize discovered directories
        this.categorizeDiscoveredUrl(testUrl, dir, result);
      }
      
      // Rate limiting
      await this.sleep(this.crawlDelay);
    }

    // Test common files
    for (const file of this.commonFiles) {
      const testUrl = `${baseUrl}/${file}`;
      const exists = await this.checkUrlExists(testUrl);
      
      if (exists) {
        result.discoveredUrls.push({
          url: testUrl,
          depth: 1,
          priority: this.categorizePriority(file),
          source: 'wordlist',
          discovered: Date.now()
        });

        // Categorize discovered files
        this.categorizeDiscoveredUrl(testUrl, file, result);
      }
      
      // Rate limiting
      await this.sleep(this.crawlDelay);
    }
  }

  /**
   * Perform deep crawling of discovered URLs
   */
  private async performDeepCrawl(
    result: CrawlResult, 
    onProgress?: (progress: number, status: string, found?: number) => void
  ): Promise<void> {
    const urlsToScan = result.discoveredUrls
      .filter(target => target.depth <= this.maxDepth)
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
      .slice(0, this.maxUrls);

    for (let i = 0; i < urlsToScan.length; i++) {
      const target = urlsToScan[i];
      
      try {
        // Update progress
        const progress = 45 + (i / urlsToScan.length) * 20; // 45-65% range
        onProgress?.(progress, `Scanning: ${target.url}`, result.discoveredUrls.length);

        // Scan the URL
        const scanResult = await websiteScanner.scanWebsite(target.url);
        result.scannedResults.set(target.url, scanResult);

        // Extract additional links if depth allows
        if (target.depth < this.maxDepth) {
          this.extractLinksFromScanResult(scanResult, result, target.depth + 1);
        }

        // Analyze for sensitive data
        this.analyzeSensitiveData(scanResult, result);

        // Rate limiting
        await this.sleep(this.crawlDelay);

      } catch (error) {
        console.error(`Failed to scan ${target.url}:`, error);
      }
    }
  }

  /**
   * Extract links from scan result
   */
  private extractLinksFromScanResult(scanResult: ScanResult, result: CrawlResult, depth: number): void {
    const doc = new DOMParser().parseFromString(scanResult.sourceCode, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    const baseDomain = new URL(result.targetUrl).hostname;

    links.forEach(link => {
      try {
        const href = (link as HTMLAnchorElement).href;
        const url = new URL(href);
        
        // Only crawl same domain
        if (url.hostname === baseDomain) {
          const exists = result.discoveredUrls.some(target => target.url === href);
          if (!exists) {
            result.discoveredUrls.push({
              url: href,
              depth,
              priority: 'low',
              source: 'links',
              discovered: Date.now()
            });
          }
        }        } catch {
          // Invalid URL, skip
        }
    });
  }

  /**
   * Analyze Wayback Machine history
   */
  private async analyzeWaybackMachine(targetUrl: string, result: CrawlResult): Promise<void> {
    try {
      const domain = new URL(targetUrl).hostname;
      const waybackApiUrl = `http://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&limit=100`;
      
      const response = await this.fetchWithProxy(waybackApiUrl);
      if (response) {
        const data = JSON.parse(response);
        
        if (Array.isArray(data) && data.length > 1) {
          // Skip header row
          for (let i = 1; i < data.length; i++) {
            const [, timestamp, original, , statuscode, digest, length] = data[i];
            
            result.intelligence.waybackHistory.push({
              url: original,
              timestamp,
              status: parseInt(statuscode),
              digest,
              length: parseInt(length) || 0
            });

            // Add historical URLs to discovery list
            if (original && !result.discoveredUrls.some(t => t.url === original)) {
              result.discoveredUrls.push({
                url: original,
                depth: 1,
                priority: 'low',
                source: 'wayback',
                discovered: Date.now()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to analyze Wayback Machine:', error);
    }
  }

  /**
   * Search for GitHub code leaks
   */
  private async searchGitHubLeaks(targetUrl: string, _result: CrawlResult): Promise<void> {
    try {
      const domain = new URL(targetUrl).hostname;
      const searchQueries = [
        `"${domain}" password`,
        `"${domain}" api_key`,
        `"${domain}" secret`,
        `"${domain}" config`,
        `"${domain}" database`
      ];

      for (const query of searchQueries) {
        try {
          // Note: This would require GitHub API access in a real implementation
          // For now, we'll simulate the structure
          console.log(`Searching GitHub for: ${query}`);
          
          // In a real implementation, you would:
          // 1. Use GitHub API with authentication
          // 2. Search code repositories
          // 3. Analyze results for sensitive data
          
        } catch (error) {
          console.error(`GitHub search failed for query: ${query}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to search GitHub leaks:', error);
    }
  }

  /**
   * Analyze sensitive data in scan results
   */
  private analyzeSensitiveData(scanResult: ScanResult, result: CrawlResult): void {
    const content = scanResult.sourceCode;

    for (const { pattern, type } of this.sensitivePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const value = match[1] || match[0];
        const context = content.substring(Math.max(0, match.index - 50), match.index + 50);

        result.intelligence.credentials.push({
          type: type as CredentialLeak['type'],
          value,
          context,
          confidence: this.calculateConfidence(type, value),
          source: scanResult.url
        });
      }
    }
  }

  /**
   * Analyze and categorize all collected intelligence
   */
  private async analyzeIntelligence(result: CrawlResult): Promise<void> {
    // Process all discovered URLs and categorize them
    for (const target of result.discoveredUrls) {
      const url = target.url.toLowerCase();
      const path = new URL(target.url).pathname.toLowerCase();

      // Categorize by URL patterns
      if (this.isAdminPanel(url)) {
        result.intelligence.adminPanels.push(target.url);
      }
      
      if (this.isApiEndpoint(url)) {
        result.intelligence.apiEndpoints.push(target.url);
      }
      
      if (this.isBackupFile(path)) {
        result.intelligence.backupFiles.push(target.url);
      }
      
      if (this.isConfigFile(path)) {
        result.intelligence.configFiles.push(target.url);
      }
      
      if (this.isDatabaseFile(path)) {
        result.intelligence.databaseFiles.push(target.url);
      }
    }

    // Remove duplicates
    result.intelligence.adminPanels = [...new Set(result.intelligence.adminPanels)];
    result.intelligence.apiEndpoints = [...new Set(result.intelligence.apiEndpoints)];
    result.intelligence.backupFiles = [...new Set(result.intelligence.backupFiles)];
    result.intelligence.configFiles = [...new Set(result.intelligence.configFiles)];
    result.intelligence.databaseFiles = [...new Set(result.intelligence.databaseFiles)];
  }

  // Helper methods
  private async fetchWithProxy(url: string): Promise<string | null> {
    for (let i = 0; i < this.corsProxies.length; i++) {
      try {
        const proxyUrl = this.corsProxies[this.currentProxyIndex] + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          return await response.text();
        }
      } catch {
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
      }
    }
    return null;
  }

  private async checkUrlExists(url: string): Promise<boolean> {
    try {
      const response = await this.fetchWithProxy(url);
      return response !== null;
    } catch {
      return false;
    }
  }

  private categorizePriority(path: string): CrawlTarget['priority'] {
    const critical = ['admin', 'login', 'config', '.env', 'backup'];
    const high = ['api', 'database', 'wp-admin', 'cpanel'];
    const medium = ['docs', 'help', 'support', 'uploads'];
    
    if (critical.some(keyword => path.includes(keyword))) return 'critical';
    if (high.some(keyword => path.includes(keyword))) return 'high';
    if (medium.some(keyword => path.includes(keyword))) return 'medium';
    return 'low';
  }

  private getPriorityWeight(priority: CrawlTarget['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private categorizeDiscoveredUrl(url: string, path: string, result: CrawlResult): void {
    if (this.isAdminPanel(url)) {
      result.intelligence.adminPanels.push(url);
    }
    if (this.isConfigFile(path)) {
      result.intelligence.configFiles.push(url);
    }
    if (this.isBackupFile(path)) {
      result.intelligence.backupFiles.push(url);
    }
  }

  private isAdminPanel(url: string): boolean {
    return /admin|login|cpanel|dashboard|panel|manage/i.test(url);
  }

  private isApiEndpoint(url: string): boolean {
    return /\/api\/|\/rest\/|\/graphql|\/v\d+\//i.test(url);
  }

  private isBackupFile(path: string): boolean {
    return /\.(bak|backup|old|tmp|zip|tar|gz|sql)$/i.test(path);
  }

  private isConfigFile(path: string): boolean {
    return /config|\.env|settings|\.ini|\.conf/i.test(path);
  }

  private isDatabaseFile(path: string): boolean {
    return /\.(sql|db|sqlite|mdb)$/i.test(path);
  }

  private calculateConfidence(type: string, value: string): number {
    // Simple confidence calculation based on pattern strength
    if (type === 'private_key' || type === 'rsa_key') return 95;
    if (type === 'aws_key' && value.length === 20) return 90;
    if (type === 'api_key' && value.length > 20) return 85;
    if (type === 'password' && value.length > 8) return 70;
    return 50;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const advancedOSINTCrawler = new AdvancedOSINTCrawler();
