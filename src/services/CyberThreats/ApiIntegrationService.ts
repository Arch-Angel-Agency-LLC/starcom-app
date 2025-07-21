/**
 * API Integration Service
 * Week 3 Day 4+: Real API integration with free threat intelligence sources
 * 
 * Manages integration with multiple threat intelligence APIs:
 * - VirusTotal (free tier)
 * - AbuseIPDB (free tier) 
 * - Shodan (free tier)
 * - MISP communities
 * - AlienVault OTX
 */

import type {
  CyberThreatData,
  ThreatCategory,
  ConfidenceLevel,
  IOCType
} from '../../types/CyberThreats';

import type { GeoCoordinate } from '../../types/CyberCommandVisualization';

// =============================================================================
// API CONFIGURATION TYPES
// =============================================================================

export interface ApiEndpoint {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  api_key_required: boolean;
  rate_limit_per_minute: number;
  free_tier: boolean;
  enabled: boolean;
  last_used: Date;
  error_count: number;
  success_count: number;
}

export interface ApiCredentials {
  provider: string;
  api_key?: string;
  username?: string;
  password?: string;
  additional_headers?: Record<string, string>;
}

export interface ApiConfiguration {
  endpoints: ApiEndpoint[];
  credentials: ApiCredentials[];
  global_rate_limit: number; // requests per minute across all APIs
  timeout_ms: number;
  retry_attempts: number;
  enable_caching: boolean;
  cache_ttl_minutes: number;
}

// =============================================================================
// FREE API CONFIGURATIONS
// =============================================================================

const FREE_API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'virustotal_free',
    name: 'VirusTotal Public API',
    provider: 'VirusTotal',
    base_url: 'https://www.virustotal.com/vtapi/v2',
    api_key_required: true,
    rate_limit_per_minute: 4,
    free_tier: true,
    enabled: true,
    last_used: new Date(0),
    error_count: 0,
    success_count: 0
  },
  {
    id: 'abuseipdb_free',
    name: 'AbuseIPDB Free Tier',
    provider: 'AbuseIPDB',
    base_url: 'https://api.abuseipdb.com/api/v2',
    api_key_required: true,
    rate_limit_per_minute: 60, // 1000 per day = ~60 per minute
    free_tier: true,
    enabled: true,
    last_used: new Date(0),
    error_count: 0,
    success_count: 0
  },
  {
    id: 'shodan_free',
    name: 'Shodan Free Tier',
    provider: 'Shodan',
    base_url: 'https://api.shodan.io',
    api_key_required: true,
    rate_limit_per_minute: 1, // Very limited free tier
    free_tier: true,
    enabled: false, // Disabled by default due to limits
    last_used: new Date(0),
    error_count: 0,
    success_count: 0
  },
  {
    id: 'otx_free',
    name: 'AlienVault OTX',
    provider: 'AlienVault',
    base_url: 'https://otx.alienvault.com/api/v1',
    api_key_required: true,
    rate_limit_per_minute: 30,
    free_tier: true,
    enabled: true,
    last_used: new Date(0),
    error_count: 0,
    success_count: 0
  },
  {
    id: 'misp_demo',
    name: 'MISP Demo Instance',
    provider: 'MISP',
    base_url: 'https://demo.misp-project.org',
    api_key_required: false, // Demo instance
    rate_limit_per_minute: 10,
    free_tier: true,
    enabled: true,
    last_used: new Date(0),
    error_count: 0,
    success_count: 0
  }
];

// =============================================================================
// RATE LIMITING SYSTEM
// =============================================================================

class RateLimiter {
  private requestCounts = new Map<string, number[]>();
  private lastReset = new Map<string, number>();

  canMakeRequest(endpointId: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get or initialize request times for this endpoint
    if (!this.requestCounts.has(endpointId)) {
      this.requestCounts.set(endpointId, []);
    }

    const requests = this.requestCounts.get(endpointId)!;
    
    // Remove requests older than 1 minute
    const recentRequests = requests.filter(time => time > windowStart);
    this.requestCounts.set(endpointId, recentRequests);

    // Check if under limit
    return recentRequests.length < limitPerMinute;
  }

  recordRequest(endpointId: string): void {
    const requests = this.requestCounts.get(endpointId) || [];
    requests.push(Date.now());
    this.requestCounts.set(endpointId, requests);
  }

  getRequestCount(endpointId: string): number {
    const now = Date.now();
    const windowStart = now - 60000;
    const requests = this.requestCounts.get(endpointId) || [];
    return requests.filter(time => time > windowStart).length;
  }
}

// =============================================================================
// API INTEGRATION SERVICE
// =============================================================================

export class ApiIntegrationService {
  private config: ApiConfiguration;
  private rateLimiter: RateLimiter;
  private cache = new Map<string, { data: any; expires: number }>();

  constructor(config?: Partial<ApiConfiguration>) {
    this.config = {
      endpoints: FREE_API_ENDPOINTS,
      credentials: [],
      global_rate_limit: 100, // Conservative global limit
      timeout_ms: 10000,
      retry_attempts: 3,
      enable_caching: true,
      cache_ttl_minutes: 15,
      ...config
    };
    
    this.rateLimiter = new RateLimiter();
  }

  // =============================================================================
  // CONFIGURATION MANAGEMENT
  // =============================================================================

  /**
   * Get current API configuration for settings UI
   */
  getConfiguration(): ApiConfiguration {
    return { ...this.config };
  }

  /**
   * Update API credentials (called from settings UI)
   */
  updateCredentials(credentials: ApiCredentials[]): void {
    this.config.credentials = credentials;
    
    // Enable endpoints that now have credentials
    this.config.endpoints.forEach(endpoint => {
      if (endpoint.api_key_required) {
        const hasCredentials = credentials.some(cred => cred.provider === endpoint.provider);
        endpoint.enabled = hasCredentials && endpoint.free_tier;
      }
    });
  }

  /**
   * Enable/disable specific endpoints
   */
  configureEndpoint(endpointId: string, enabled: boolean): void {
    const endpoint = this.config.endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      endpoint.enabled = enabled;
    }
  }

  // =============================================================================
  // VIRUSTOTAL INTEGRATION
  // =============================================================================

  private async queryVirusTotal(ioc: string, type: IOCType): Promise<CyberThreatData[]> {
    const endpoint = this.config.endpoints.find(e => e.id === 'virustotal_free');
    if (!endpoint?.enabled) return [];

    const credentials = this.config.credentials.find(c => c.provider === 'VirusTotal');
    if (!credentials?.api_key) return [];

    const cacheKey = `vt_${type}_${ioc}`;
    if (this.config.enable_caching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached;
    }

    if (!this.rateLimiter.canMakeRequest(endpoint.id, endpoint.rate_limit_per_minute)) {
      throw new Error(`Rate limit exceeded for ${endpoint.name}`);
    }

    try {
      let url: string;
      switch (type) {
        case 'ip_address':
          url = `${endpoint.base_url}/ip-address/report?apikey=${credentials.api_key}&ip=${ioc}`;
          break;
        case 'domain':
          url = `${endpoint.base_url}/domain/report?apikey=${credentials.api_key}&domain=${ioc}`;
          break;
        case 'file_hash':
          url = `${endpoint.base_url}/file/report?apikey=${credentials.api_key}&resource=${ioc}`;
          break;
        default:
          return [];
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Starcom-CyberCommand/1.0'
        },
        signal: AbortSignal.timeout(this.config.timeout_ms)
      });

      if (!response.ok) {
        throw new Error(`VirusTotal API error: ${response.status}`);
      }

      const data = await response.json();
      const threats = this.parseVirusTotalResponse(data, ioc, type);
      
      // Cache the results
      if (this.config.enable_caching) {
        this.setCachedResult(cacheKey, threats);
      }

      this.rateLimiter.recordRequest(endpoint.id);
      endpoint.success_count++;
      endpoint.last_used = new Date();

      return threats;

    } catch (error) {
      endpoint.error_count++;
      console.error('VirusTotal API error:', error);
      return [];
    }
  }

  private parseVirusTotalResponse(data: any, ioc: string, type: IOCType): CyberThreatData[] {
    if (data.response_code !== 1) {
      return []; // No data found
    }

    const threats: CyberThreatData[] = [];

    // Extract threat information from VirusTotal response
    const detections = data.positives || 0;
    const totalScans = data.total || 1;
    const detectionRatio = detections / totalScans;

    if (detections > 0) {
      // Create threat based on detection data
      const threat: CyberThreatData = {
        id: `vt_${type}_${ioc}_${Date.now()}`,
        threat_id: `VT-${ioc.substring(0, 8).toUpperCase()}`,
        name: `Malicious ${type.replace('_', ' ')} - ${ioc}`,
        description: `Detected by ${detections}/${totalScans} antivirus engines on VirusTotal`,
        category: this.mapVirusTotalCategory(data),
        severity: Math.min(10, Math.ceil(detectionRatio * 10)),
        confidence: this.mapVirusTotalConfidence(detectionRatio),
        status: 'Active',
        sophistication: this.mapVirusTotalSophistication(detectionRatio),
        
        // Geographic data (if available)
        location: this.extractGeographicData(data),
        source_countries: data.country ? [data.country] : [],
        target_countries: [],
        target_sectors: [],
        target_organizations: [],

        // IOC data
        iocs: [{
          id: `vt_ioc_${Date.now()}`,
          type,
          value: ioc,
          confidence: this.mapVirusTotalConfidence(detectionRatio),
          first_seen: data.scan_date ? new Date(data.scan_date) : new Date(),
          last_seen: new Date(),
          source: 'VirusTotal'
        }],

        // Metadata
        first_seen: data.scan_date ? new Date(data.scan_date) : new Date(),
        last_seen: new Date(),
        campaigns: [],
        malware_families: this.extractMalwareFamilies(data),
        techniques: [],
        sources: [{
          provider: 'VirusTotal',
          feed_name: 'Public API',
          url: data.permalink || '',
          confidence: this.mapVirusTotalConfidence(detectionRatio),
          timestamp: new Date(),
          classification: 'TLP:White'
        }],

        // Relationships
        threat_actor: null,
        related_threats: [],
        child_threats: [],

        // Visualization
        timestamp: new Date(),
        metadata: {
          detection_ratio: detectionRatio,
          total_detections: detections,
          scan_engines: totalScans,
          vt_permalink: data.permalink
        },
        priority: detectionRatio > 0.3 ? 'high' : 'medium',
        
        impact_assessment: {
          scope: detectionRatio > 0.5 ? 'Widespread' : 'Limited',
          affected_systems: Math.ceil(detectionRatio * 100)
        },

        visualization_data: {
          color: detectionRatio > 0.5 ? '#ff0000' : '#ff8800',
          intensity: detectionRatio,
          animation_type: 'pulse',
          show_connections: true,
          show_attribution: false
        }
      };

      threats.push(threat);
    }

    return threats;
  }

  // =============================================================================
  // ABUSEIPDB INTEGRATION  
  // =============================================================================

  private async queryAbuseIPDB(ip: string): Promise<CyberThreatData[]> {
    const endpoint = this.config.endpoints.find(e => e.id === 'abuseipdb_free');
    if (!endpoint?.enabled) return [];

    const credentials = this.config.credentials.find(c => c.provider === 'AbuseIPDB');
    if (!credentials?.api_key) return [];

    const cacheKey = `abuse_${ip}`;
    if (this.config.enable_caching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached;
    }

    if (!this.rateLimiter.canMakeRequest(endpoint.id, endpoint.rate_limit_per_minute)) {
      throw new Error(`Rate limit exceeded for ${endpoint.name}`);
    }

    try {
      const url = `${endpoint.base_url}/check?ipAddress=${ip}&maxAgeInDays=90&verbose`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Key': credentials.api_key,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.config.timeout_ms)
      });

      if (!response.ok) {
        throw new Error(`AbuseIPDB API error: ${response.status}`);
      }

      const data = await response.json();
      const threats = this.parseAbuseIPDBResponse(data, ip);
      
      if (this.config.enable_caching) {
        this.setCachedResult(cacheKey, threats);
      }

      this.rateLimiter.recordRequest(endpoint.id);
      endpoint.success_count++;
      endpoint.last_used = new Date();

      return threats;

    } catch (error) {
      endpoint.error_count++;
      console.error('AbuseIPDB API error:', error);
      return [];
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private mapVirusTotalCategory(data: any): ThreatCategory {
    // Map based on scan results and metadata
    if (data.scans) {
      const results = Object.values(data.scans) as any[];
      const malwareTypes = results
        .filter(scan => scan.detected)
        .map(scan => scan.result?.toLowerCase() || '');
      
      if (malwareTypes.some(type => type.includes('trojan'))) return 'Malware';
      if (malwareTypes.some(type => type.includes('botnet'))) return 'Botnet';
      if (malwareTypes.some(type => type.includes('phish'))) return 'Phishing';
    }
    
    return 'Malware'; // Default
  }

  private mapVirusTotalConfidence(detectionRatio: number): ConfidenceLevel {
    if (detectionRatio > 0.7) return 'High';
    if (detectionRatio > 0.4) return 'Medium';
    if (detectionRatio > 0.1) return 'Low';
    return 'Low';
  }

  private mapVirusTotalSophistication(detectionRatio: number): string {
    if (detectionRatio > 0.8) return 'Advanced';
    if (detectionRatio > 0.5) return 'Intermediate';
    return 'Basic';
  }

  private extractGeographicData(data: any): GeoCoordinate | undefined {
    // VirusTotal doesn't typically provide geographic data directly
    // This would need to be enriched from other sources
    return undefined;
  }

  private extractMalwareFamilies(data: any): string[] {
    if (!data.scans) return [];
    
    const families = new Set<string>();
    Object.values(data.scans as any[]).forEach(scan => {
      if (scan.detected && scan.result) {
        // Extract family names from scan results
        const result = scan.result.toLowerCase();
        if (result.includes('emotet')) families.add('Emotet');
        if (result.includes('trickbot')) families.add('TrickBot');
        if (result.includes('cobalt')) families.add('CobaltStrike');
        // Add more family detection logic
      }
    });
    
    return Array.from(families);
  }

  private parseAbuseIPDBResponse(data: any, ip: string): CyberThreatData[] {
    if (!data.data || data.data.abuseConfidencePercentage === 0) {
      return [];
    }

    const confidence = data.data.abuseConfidencePercentage / 100;
    
    const threat: CyberThreatData = {
      id: `abuse_${ip}_${Date.now()}`,
      threat_id: `ABUSE-${ip.replace(/\./g, '-')}`,
      name: `Malicious IP - ${ip}`,
      description: `Reported with ${data.data.abuseConfidencePercentage}% confidence on AbuseIPDB`,
      category: 'Infrastructure',
      severity: Math.min(10, Math.ceil(confidence * 10)),
      confidence: confidence > 0.7 ? 'High' : confidence > 0.4 ? 'Medium' : 'Low',
      status: 'Active',
      sophistication: 'Basic',
      
      location: {
        latitude: parseFloat(data.data.latitude) || 0,
        longitude: parseFloat(data.data.longitude) || 0
      },
      source_countries: data.data.countryCode ? [data.data.countryCode] : [],
      target_countries: [],
      target_sectors: [],
      target_organizations: [],

      iocs: [{
        id: `abuse_ioc_${Date.now()}`,
        type: 'ip_address',
        value: ip,
        confidence: confidence > 0.7 ? 'High' : 'Medium',
        first_seen: new Date(data.data.lastReportedAt || Date.now()),
        last_seen: new Date(),
        source: 'AbuseIPDB'
      }],

      first_seen: new Date(data.data.lastReportedAt || Date.now()),
      last_seen: new Date(),
      campaigns: [],
      malware_families: [],
      techniques: [],
      sources: [{
        provider: 'AbuseIPDB',
        feed_name: 'Abuse Reports',
        url: `https://www.abuseipdb.com/check/${ip}`,
        confidence: confidence > 0.7 ? 'High' : 'Medium',
        timestamp: new Date(),
        classification: 'TLP:White'
      }],

      threat_actor: null,
      related_threats: [],
      child_threats: [],

      timestamp: new Date(),
      metadata: {
        abuse_confidence: data.data.abuseConfidencePercentage,
        usage_type: data.data.usageType,
        isp: data.data.isp,
        total_reports: data.data.totalReports
      },
      priority: confidence > 0.5 ? 'high' : 'medium',
      
      impact_assessment: {
        scope: 'Limited',
        affected_systems: data.data.totalReports || 1
      },

      visualization_data: {
        color: confidence > 0.5 ? '#ff4444' : '#ffaa44',
        intensity: confidence,
        animation_type: 'pulse',
        show_connections: true,
        show_attribution: false
      }
    };

    return [threat];
  }

  // =============================================================================
  // CACHING SYSTEM
  // =============================================================================

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    const expires = Date.now() + (this.config.cache_ttl_minutes * 60 * 1000);
    this.cache.set(key, { data, expires });
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /**
   * Query multiple APIs for threat intelligence on an IOC
   */
  async queryThreatIntelligence(ioc: string, type: IOCType): Promise<CyberThreatData[]> {
    const promises: Promise<CyberThreatData[]>[] = [];

    // VirusTotal for all IOC types
    if (this.config.endpoints.find(e => e.id === 'virustotal_free')?.enabled) {
      promises.push(this.queryVirusTotal(ioc, type));
    }

    // AbuseIPDB for IP addresses only
    if (type === 'ip_address' && 
        this.config.endpoints.find(e => e.id === 'abuseipdb_free')?.enabled) {
      promises.push(this.queryAbuseIPDB(ioc));
    }

    // Wait for all APIs to respond
    const results = await Promise.allSettled(promises);
    
    // Combine successful results
    const threats: CyberThreatData[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        threats.push(...result.value);
      }
    });

    return threats;
  }

  /**
   * Get API status for monitoring
   */
  getApiStatus() {
    return this.config.endpoints.map(endpoint => ({
      id: endpoint.id,
      name: endpoint.name,
      provider: endpoint.provider,
      enabled: endpoint.enabled,
      rate_limit_used: this.rateLimiter.getRequestCount(endpoint.id),
      rate_limit_max: endpoint.rate_limit_per_minute,
      success_count: endpoint.success_count,
      error_count: endpoint.error_count,
      last_used: endpoint.last_used,
      free_tier: endpoint.free_tier
    }));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
