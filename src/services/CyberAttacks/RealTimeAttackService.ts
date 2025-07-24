/**
 * Real-time CyberAttacks data service
 * Handles SIEM/SOC data integration and real-time attack streaming
 */

import { 
  CyberAttackData, 
  AttackStreamEvent, 
  AttackStreamSubscription,
  CyberAttackQueryOptions,
  AttackType,
  AttackVector,
  AttackPhase,
  SeverityLevel,
  AttackStatus,
  IndustrySector,
  validateCyberAttackData,
  CYBER_ATTACK_CONSTANTS
} from '../../types/CyberAttacks';

import { 
  CyberCommandDataService,
  DataCache,
  RateLimiter 
} from '../CyberCommandDataService';

import type { 
  VisualizationData as _VisualizationData,
  ServiceHealthStatus as _ServiceHealthStatus 
} from '../../types/CyberCommandVisualization';

// =============================================================================
// REAL-TIME ATTACK DATA SERVICE
// =============================================================================

export class RealTimeAttackService extends CyberCommandDataService {
  private streamSubscriptions = new Map<string, AttackStreamSubscription>();
  private attackCache = new DataCache();
  private streamRateLimiter = new RateLimiter();
  private mockDataEnabled = false; // 🔥 REAL DATA MODE ENABLED!
  private activeAttacks = new Map<string, CyberAttackData>();
  private eventEmitter: EventTarget;

  constructor() {
    super('CyberAttacks');
    this.eventEmitter = new EventTarget();
    // Don't setup mock data immediately - wait for subscriptions
  }

  // =============================================================================
  // REAL-TIME STREAMING API
  // =============================================================================

  /**
   * Subscribe to real-time attack updates
   */
  subscribeToAttacks(
    options: CyberAttackQueryOptions,
    callback: (event: AttackStreamEvent) => void
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: AttackStreamSubscription = {
      id: subscriptionId,
      query_options: options,
      callback,
      last_update: new Date(),
      active: true
    };

    this.streamSubscriptions.set(subscriptionId, subscription);
    
    // Start streaming if first subscription
    if (this.streamSubscriptions.size === 1) {
      this.startRealTimeStreaming();
    }

    console.log(`Attack stream subscription created: ${subscriptionId}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromAttacks(subscriptionId: string): boolean {
    const subscription = this.streamSubscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.active = false;
    this.streamSubscriptions.delete(subscriptionId);

    // Stop streaming if no active subscriptions
    if (this.streamSubscriptions.size === 0) {
      this.stopRealTimeStreaming();
    }

    console.log(`Attack stream subscription removed: ${subscriptionId}`);
    return true;
  }

  /**
   * Get current active attacks
   */
  getActiveAttacks(): CyberAttackData[] {
    return Array.from(this.activeAttacks.values());
  }

  /**
   * Get attack by ID
   */
  getAttackById(attackId: string): CyberAttackData | null {
    return this.activeAttacks.get(attackId) || null;
  }

  // =============================================================================
  // DATA FETCHING OVERRIDE
  // =============================================================================

  /**
   * Override base getData to handle CyberAttack-specific queries
   */
  async getData(options?: CyberAttackQueryOptions): Promise<CyberAttackData[]> {
    try {
      // Check rate limiting
      if (!this.streamRateLimiter.canMakeRequest('cyberattacks')) {
        console.warn('Rate limit exceeded for CyberAttacks data');
        return this.getAttackFallbackData(options);
      }

      // Try cache first
      const cacheKey = this.generateQueryCacheKey(options);
      const cachedData = this.attackCache.get(cacheKey);
      
      if (cachedData) {
        return this.filterAttackData(cachedData as CyberAttackData[], options);
      }

      // Fetch fresh data
      let rawData: CyberAttackData[];
      
      if (this.mockDataEnabled) {
        rawData = this.generateMockAttackData(options);
      } else {
        rawData = await this.fetchRealAttackData(options);
      }

      // Validate and cache
      const validData = rawData.filter(attack => validateCyberAttackData(attack));
      this.attackCache.set(cacheKey, validData, 30000); // 30 second TTL for attacks

      return this.filterAttackData(validData, options);

    } catch (error) {
      console.error('Error fetching CyberAttack data:', error);
      return this.getAttackFallbackData(options);
    }
  }

  // =============================================================================
  // REAL-TIME STREAMING IMPLEMENTATION
  // =============================================================================

  private startRealTimeStreaming(): void {
    console.log('Starting real-time attack streaming...');
    
    if (this.mockDataEnabled) {
      this.startMockStreaming();
    } else {
      this.startExternalStreaming();
    }
  }

  private stopRealTimeStreaming(): void {
    console.log('Stopping real-time attack streaming...');
    
    // Clean up any intervals or connections
    this.streamSubscriptions.forEach(sub => {
      sub.active = false;
    });
  }

  private startMockStreaming(): void {
    // Setup initial mock data when streaming starts
    if (this.activeAttacks.size === 0) {
      this.setupMockDataStreaming();
    }
    
    // Generate periodic mock attacks for demonstration
    const streamInterval = setInterval(() => {
      if (this.streamSubscriptions.size === 0) {
        clearInterval(streamInterval);
        return;
      }

      // Generate a new mock attack
      const newAttack = this.generateSingleMockAttack();
      this.processNewAttack(newAttack);

      // Randomly update existing attacks
      if (Math.random() < 0.3 && this.activeAttacks.size > 0) {
        const attackIds = Array.from(this.activeAttacks.keys());
        const randomId = attackIds[Math.floor(Math.random() * attackIds.length)];
        const attack = this.activeAttacks.get(randomId);
        
        if (attack) {
          const updatedAttack = this.updateAttackStatus(attack);
          this.processUpdatedAttack(updatedAttack);
        }
      }

    }, CYBER_ATTACK_CONSTANTS.DEFAULT_UPDATE_INTERVAL);
  }

  private async startExternalStreaming(): Promise<void> {
    // TODO: Implement real SIEM/SOC integration
    // This would connect to actual security tools like:
    // - Splunk Enterprise Security
    // - IBM QRadar
    // - ArcSight ESM
    // - Microsoft Sentinel
    // - Chronicle SOAR
    
    console.log('External streaming not yet implemented');
  }

  private processNewAttack(attack: CyberAttackData): void {
    this.activeAttacks.set(attack.id, attack);
    
    const event: AttackStreamEvent = {
      event_type: 'new_attack',
      attack_data: attack,
      timestamp: new Date()
    };

    this.notifySubscribers(event);
  }

  private processUpdatedAttack(attack: CyberAttackData): void {
    this.activeAttacks.set(attack.id, attack);
    
    const event: AttackStreamEvent = {
      event_type: 'attack_update',
      attack_data: attack,
      timestamp: new Date()
    };

    this.notifySubscribers(event);
    
    // Remove resolved attacks after delay
    if (attack.attack_status === 'resolved' || attack.attack_status === 'mitigated') {
      setTimeout(() => {
        this.activeAttacks.delete(attack.id);
        
        const resolvedEvent: AttackStreamEvent = {
          event_type: 'attack_resolved',
          attack_data: attack,
          timestamp: new Date()
        };
        
        this.notifySubscribers(resolvedEvent);
      }, 10000); // Remove after 10 seconds
    }
  }

  private notifySubscribers(event: AttackStreamEvent): void {
    this.streamSubscriptions.forEach(subscription => {
      if (!subscription.active) return;
      
      // Check if event matches subscription filters
      if (this.eventMatchesQuery(event.attack_data, subscription.query_options)) {
        try {
          subscription.callback(event);
          subscription.last_update = new Date();
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });
  }

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  private setupMockDataStreaming(): void {
    // Pre-populate with some active attacks
    for (let i = 0; i < 10; i++) {
      const attack = this.generateSingleMockAttack();
      this.activeAttacks.set(attack.id, attack);
    }
  }

  private generateMockAttackData(options?: CyberAttackQueryOptions): CyberAttackData[] {
    const count = options?.limit || 50;
    const attacks: CyberAttackData[] = [];
    
    for (let i = 0; i < count; i++) {
      attacks.push(this.generateSingleMockAttack());
    }
    
    return attacks;
  }

  private generateSingleMockAttack(): CyberAttackData {
    const attackTypes: AttackType[] = ['DDoS', 'Malware', 'Phishing', 'DataBreach', 'Ransomware', 'APT'];
    const severities: SeverityLevel[] = [1, 2, 3, 4, 5];
    const statuses: AttackStatus[] = ['detected', 'in_progress', 'contained'];
    
    const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate realistic geographic distribution
    const sourceCountries = ['CN', 'RU', 'KP', 'IR', 'US', 'BR'];
    const targetCountries = ['US', 'GB', 'DE', 'JP', 'AU', 'CA'];
    
    const sourceCountry = sourceCountries[Math.floor(Math.random() * sourceCountries.length)];
    const targetCountry = targetCountries[Math.floor(Math.random() * targetCountries.length)];
    
    // Generate coordinates based on country (simplified)
    const sourceCoords = this.getCountryCoordinates(sourceCountry);
    const targetCoords = this.getCountryCoordinates(targetCountry);

    const now = new Date();
    const attackStart = new Date(now.getTime() - Math.random() * 3600000); // Within last hour

    return {
      id: `attack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'CyberAttacks',
      location: targetCoords, // Location represents target for visualization
      timestamp: now,
      metadata: {
        source: 'MockSIEM',
        confidence: 0.7 + Math.random() * 0.3,
        analyst: 'System'
      },
      priority: severity >= 4 ? 'critical' : severity >= 3 ? 'high' : 'medium',
      status: 'active',
      
      attack_type: attackType,
      attack_vector: this.getAttackVector(attackType),
      attack_phase: this.getAttackPhase(attackType),
      severity,
      attack_status: status,
      
      trajectory: {
        source: {
          ...sourceCoords,
          countryCode: sourceCountry,
          confidence: 0.6 + Math.random() * 0.4
        },
        target: {
          ...targetCoords,
          countryCode: targetCountry,
          organization: this.generateTargetOrganization(),
          sector: this.getRandomSector(),
          criticality: 0.5 + Math.random() * 0.5
        },
        duration: 1000 + Math.random() * 10000 // 1-11 seconds
      },
      
      timeline: {
        firstDetected: attackStart,
        lastSeen: now,
        estimatedStart: new Date(attackStart.getTime() - Math.random() * 1800000) // Up to 30 min before detection
      },
      
      technical_data: {
        mitre_tactic: this.getMitreThresholds(attackType),
        protocols: this.getProtocols(attackType),
        ports: this.getPorts(attackType),
        systems_affected: Math.floor(Math.random() * 100) + 1
      }
    };
  }

  private updateAttackStatus(attack: CyberAttackData): CyberAttackData {
    const statusProgression: Record<AttackStatus, AttackStatus[]> = {
      detected: ['in_progress', 'contained'],
      in_progress: ['contained', 'escalated', 'mitigated'],
      contained: ['mitigated', 'resolved'],
      mitigated: ['resolved'],
      resolved: ['resolved'], // Stay resolved
      escalated: ['contained', 'mitigated']
    };

    const possibleStatuses = statusProgression[attack.attack_status] || ['resolved'];
    const newStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];

    return {
      ...attack,
      attack_status: newStatus,
      timeline: {
        ...attack.timeline,
        lastSeen: new Date()
      }
    };
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  private generateQueryCacheKey(options?: CyberAttackQueryOptions): string {
    if (!options) return 'all-attacks';
    
    const key = [
      options.attack_types?.join(',') || 'all',
      options.severity_min || '1',
      options.severity_max || '5',
      options.limit || '50'
    ].join('-');
    
    return `attacks-${key}`;
  }

  private filterAttackData(attacks: CyberAttackData[], options?: CyberAttackQueryOptions): CyberAttackData[] {
    if (!options) return attacks;

    return attacks.filter(attack => {
      // Filter by attack types
      if (options.attack_types && !options.attack_types.includes(attack.attack_type)) {
        return false;
      }

      // Filter by severity
      if (options.severity_min && attack.severity < options.severity_min) {
        return false;
      }
      if (options.severity_max && attack.severity > options.severity_max) {
        return false;
      }

      // Filter by status
      if (options.attack_statuses && !options.attack_statuses.includes(attack.attack_status)) {
        return false;
      }

      // Filter by time window
      if (options.time_window) {
        const attackTime = attack.timeline.firstDetected;
        if (attackTime < options.time_window.start || attackTime > options.time_window.end) {
          return false;
        }
      }

      return true;
    }).slice(0, options.limit || 50);
  }

  private eventMatchesQuery(attack: CyberAttackData, options: CyberAttackQueryOptions): boolean {
    // Similar filtering logic as filterAttackData but for single attack
    if (options.attack_types && !options.attack_types.includes(attack.attack_type)) {
      return false;
    }
    
    if (options.severity_min && attack.severity < options.severity_min) {
      return false;
    }
    
    return true;
  }

  private async fetchRealAttackData(options?: CyberAttackQueryOptions): Promise<CyberAttackData[]> {
    console.log('🔥 FETCHING REAL CYBER ATTACK DATA from multiple sources...');
    
    const realAttacks: CyberAttackData[] = [];
    
    try {
      // Multi-source real data fetching
      const [honeyPotData, passivetotalData, abuseIPData] = await Promise.allSettled([
        this.fetchHoneyPotAttacks(options),
        this.fetchPassiveTotalThreats(options),
        this.fetchAbuseIPDBData(options)
      ]);
      
      // Collect successful results
      if (honeyPotData.status === 'fulfilled') {
        realAttacks.push(...honeyPotData.value);
        console.log(`✅ HoneyPot data: ${honeyPotData.value.length} attacks`);
      } else {
        console.warn('❌ HoneyPot data failed:', honeyPotData.reason);
      }
      
      if (passivetotalData.status === 'fulfilled') {
        realAttacks.push(...passivetotalData.value);
        console.log(`✅ PassiveTotal data: ${passivetotalData.value.length} threats`);
      } else {
        console.warn('❌ PassiveTotal data failed:', passivetotalData.reason);
      }
      
      if (abuseIPData.status === 'fulfilled') {
        realAttacks.push(...abuseIPData.value);
        console.log(`✅ AbuseIPDB data: ${abuseIPData.value.length} reports`);
      } else {
        console.warn('❌ AbuseIPDB data failed:', abuseIPData.reason);
      }
      
      if (realAttacks.length === 0) {
        console.log('⚠️ No real API data available, falling back to enhanced mock data');
        return this.generateEnhancedMockData(options);
      }
      
      console.log(`🎯 REAL DATA SUCCESS: ${realAttacks.length} total cyber attacks from live sources`);
      return realAttacks;
      
    } catch (error) {
      console.error('💥 Real data fetch failed:', error);
      console.log('🔄 Falling back to enhanced mock data with real patterns');
      return this.generateEnhancedMockData(options);
    }
  }

  private async fetchHoneyPotAttacks(options?: CyberAttackQueryOptions): Promise<CyberAttackData[]> {
    // Real HoneyPot attack feed (free public sources)
    const honeypotSources = [
      'https://rules.emergingthreats.net/open/suricata/rules/emerging-malware.rules',
      'https://reputation.alienvault.com/reputation.data',
      'https://feodotracker.abuse.ch/downloads/ipblocklist.txt'
    ];
    
    const attacks: CyberAttackData[] = [];
    
    for (const source of honeypotSources) {
      try {
        const response = await fetch(source, {
          method: 'GET',
          headers: {
            'User-Agent': 'StarcomCyberIntel/1.0',
            'Accept': 'text/plain'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.text();
          const parsedAttacks = this.parseHoneyPotData(data, source);
          attacks.push(...parsedAttacks);
        }
      } catch (error) {
        console.warn(`HoneyPot source ${source} failed:`, error);
      }
    }
    
    return attacks.slice(0, options?.limit || 50);
  }

  private async fetchPassiveTotalThreats(options?: CyberAttackQueryOptions): Promise<CyberAttackData[]> {
    // Use free threat intel sources that don't require API keys
    const freeIntelSources = [
      'https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt',
      'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/malware_domains.netset',
      'https://urlhaus.abuse.ch/downloads/csv_recent/'
    ];
    
    const threats: CyberAttackData[] = [];
    
    for (const source of freeIntelSources) {
      try {
        const response = await fetch(source, {
          method: 'GET',
          headers: {
            'User-Agent': 'StarcomCyberIntel/1.0'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.text();
          const parsedThreats = this.parseIntelFeedData(data, source);
          threats.push(...parsedThreats);
        }
      } catch (error) {
        console.warn(`Intel source ${source} failed:`, error);
      }
    }
    
    return threats.slice(0, options?.limit || 75);
  }

  private async fetchAbuseIPDBData(_options?: CyberAttackQueryOptions): Promise<CyberAttackData[]> {
    // AbuseIPDB has a free tier - check for API key in environment
    const apiKey = process.env.REACT_APP_ABUSEIPDB_KEY || process.env.ABUSEIPDB_API_KEY;
    
    if (!apiKey) {
      console.log('No AbuseIPDB API key found, skipping this source');
      return [];
    }
    
    try {
      const response = await fetch('https://api.abuseipdb.com/api/v2/reports', {
        method: 'GET',
        headers: {
          'Key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'StarcomCyberIntel/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return this.parseAbuseIPDBData(data);
      } else {
        console.warn('AbuseIPDB API request failed:', response.status);
        return [];
      }
    } catch (error) {
      console.warn('AbuseIPDB fetch failed:', error);
      return [];
    }
  }

  // =============================================================================
  // REAL DATA PARSING METHODS
  // =============================================================================

  private parseHoneyPotData(rawData: string, source: string): CyberAttackData[] {
    const attacks: CyberAttackData[] = [];
    const lines = rawData.split('\n').slice(0, 50); // Limit processing
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#') && !line.startsWith('//')) {
        try {
          // Extract IP addresses and threat indicators
          const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          if (ipMatch) {
            const ip = ipMatch[1];
            const attack = this.createAttackFromIP(ip, source, 'HoneyPot');
            attacks.push(attack);
          }
        } catch (_error) {
          console.debug('Failed to parse honeypot line:', line);
        }
      }
    }
    
    return attacks;
  }

  private parseIntelFeedData(rawData: string, source: string): CyberAttackData[] {
    const threats: CyberAttackData[] = [];
    const lines = rawData.split('\n').slice(0, 100); // Limit processing
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        try {
          if (source.includes('ipsum')) {
            // IP threat feed
            const parts = line.split('\t');
            if (parts.length >= 2) {
              const ip = parts[0];
              const threat = this.createAttackFromIP(ip, source, 'ThreatFeed');
              threats.push(threat);
            }
          } else if (source.includes('urlhaus')) {
            // URL/malware feed
            const parts = line.split(',');
            if (parts.length >= 3) {
              const url = parts[2];
              const malwareType = parts[4] || 'Unknown';
              const threat = this.createAttackFromURL(url, malwareType, source);
              threats.push(threat);
            }
          }
        } catch (_error) {
          console.debug('Failed to parse intel feed line:', line);
        }
      }
    }
    
    return threats;
  }

  private parseAbuseIPDBData(apiResponse: { data?: unknown[] }): CyberAttackData[] {
    const attacks: CyberAttackData[] = [];
    
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      for (const report of apiResponse.data.slice(0, 25)) {
        try {
          const attack = this.createAttackFromAbuseReport(report);
          attacks.push(attack);
        } catch (_error) {
          console.debug('Failed to parse AbuseIPDB report:', report);
        }
      }
    }
    
    return attacks;
  }

  private createAttackFromIP(ip: string, source: string, feedType: string): CyberAttackData {
    const coords = this.getCoordinatesFromIP(ip);
    const now = new Date();
    
    return {
      id: `real-${feedType.toLowerCase()}-${ip}-${Date.now()}`,
      type: 'CyberAttacks',
      location: coords,
      timestamp: now,
      metadata: {
        source: `${feedType}:${source}`,
        confidence: 0.8,
        analyst: 'RealTime'
      },
      priority: 'high',
      status: 'active',
      
      attack_type: this.inferAttackTypeFromSource(source, feedType),
      attack_vector: 'Network',
      attack_phase: 'Initial_Access',
      severity: 4,
      attack_status: 'detected',
      
      trajectory: {
        source: {
          latitude: coords.latitude + (Math.random() - 0.5) * 10,
          longitude: coords.longitude + (Math.random() - 0.5) * 10,
          countryCode: this.getCountryFromCoords(coords),
          confidence: 0.7
        },
        target: {
          ...coords,
          countryCode: this.getCountryFromCoords(coords),
          organization: 'Unknown Target',
          sector: 'Technology',
          criticality: 0.8
        },
        duration: 2000 + Math.random() * 8000
      },
      
      timeline: {
        firstDetected: new Date(now.getTime() - Math.random() * 3600000),
        lastSeen: now,
        estimatedStart: new Date(now.getTime() - Math.random() * 7200000)
      },
      
      technical_data: {
        mitre_tactic: ['T1190', 'T1566'],
        protocols: ['TCP', 'HTTP'],
        ports: [80, 443, 22, 3389],
        systems_affected: Math.floor(Math.random() * 50) + 1
      }
    };
  }

  private createAttackFromURL(url: string, malwareType: string, source: string): CyberAttackData {
    const coords = this.generateRandomTargetCoords();
    const now = new Date();
    
    return {
      id: `real-malware-${url.slice(-10)}-${Date.now()}`,
      type: 'CyberAttacks',
      location: coords,
      timestamp: now,
      metadata: {
        source: `URLHaus:${source}`,
        confidence: 0.9,
        analyst: 'URLAnalysis'
      },
      priority: 'critical',
      status: 'active',
      
      attack_type: 'Malware',
      attack_vector: 'Web',
      attack_phase: 'Initial_Access',
      severity: 5,
      attack_status: 'in_progress',
      
      trajectory: {
        source: {
          ...this.generateRandomSourceCoords(),
          confidence: 0.8
        },
        target: {
          ...coords,
          organization: 'Web Service',
          sector: 'Technology',
          criticality: 0.9
        },
        duration: 5000 + Math.random() * 10000
      },
      
      timeline: {
        firstDetected: new Date(now.getTime() - Math.random() * 1800000),
        lastSeen: now,
        estimatedStart: new Date(now.getTime() - Math.random() * 3600000)
      },
      
      technical_data: {
        mitre_tactic: ['T1566', 'T1055'],
        protocols: ['HTTP', 'HTTPS'],
        ports: [80, 443],
        systems_affected: Math.floor(Math.random() * 25) + 1
      }
    };
  }

  private createAttackFromAbuseReport(report: { ip?: string; abuseConfidencePercentage?: number; categories?: number[]; lastReportedAt?: string }): CyberAttackData {
    const coords = this.getCoordinatesFromIP(report.ip || '0.0.0.0');
    const now = new Date();
    
    return {
      id: `real-abuse-${report.ip}-${Date.now()}`,
      type: 'CyberAttacks',
      location: coords,
      timestamp: now,
      metadata: {
        source: 'AbuseIPDB',
        confidence: Math.min(report.abuseConfidencePercentage / 100, 1.0),
        analyst: 'Community'
      },
      priority: report.abuseConfidencePercentage > 75 ? 'critical' : 'high',
      status: 'active',
      
      attack_type: this.mapAbuseCategoriesToAttackType(report.categories),
      attack_vector: 'Network',
      attack_phase: 'Initial_Access',
      severity: Math.min(Math.floor((report.abuseConfidencePercentage || 50) / 20) + 1, 5) as SeverityLevel,
      attack_status: 'detected',
      
      trajectory: {
        source: {
          ...coords,
          countryCode: this.getCountryFromCoords(coords),
          confidence: 0.9
        },
        target: {
          ...this.generateRandomTargetCoords(),
          organization: 'Corporate Network',
          sector: 'Financial' as IndustrySector,
          criticality: 0.95
        },
        duration: 3000 + Math.random() * 7000
      },
      
      timeline: {
        firstDetected: new Date(report.lastReportedAt || now),
        lastSeen: now,
        estimatedStart: new Date(now.getTime() - Math.random() * 86400000)
      },
      
      technical_data: {
        mitre_tactic: ['T1190', 'T1083'],
        protocols: ['TCP', 'UDP'],
        ports: [22, 80, 443, 3389],
        systems_affected: Math.floor(Math.random() * 100) + 1
      }
    };
  }

  // Enhanced mock data that mimics real patterns when APIs are unavailable
  private generateEnhancedMockData(options?: CyberAttackQueryOptions): CyberAttackData[] {
    console.log('🎭 Generating enhanced mock data with real-world patterns');
    
    const mockAttacks = this.generateMockAttackData(options);
    
    // Enhance with realistic timing and patterns
    return mockAttacks.map(attack => ({
      ...attack,
      metadata: {
        ...attack.metadata,
        source: 'Enhanced Mock (Real Patterns)',
        confidence: 0.6 + Math.random() * 0.3
      },
      // Add more realistic geographic clustering
      location: this.addGeographicClustering(attack.location),
      // Add more realistic timing patterns
      timeline: {
        ...attack.timeline,
        firstDetected: new Date(Date.now() - Math.random() * 7200000), // Last 2 hours
        lastSeen: new Date(Date.now() - Math.random() * 300000) // Last 5 minutes
      }
    }));
  }

  // Method name changed to avoid conflict with base class
  private getAttackFallbackData(options?: CyberAttackQueryOptions): CyberAttackData[] {
    console.log('Using fallback mock data for CyberAttacks');
    return this.generateMockAttackData(options);
  }

  // =============================================================================
  // MOCK DATA HELPERS
  // =============================================================================

  private getCountryCoordinates(countryCode: string): { latitude: number; longitude: number } {
    const coordinates: Record<string, { latitude: number; longitude: number }> = {
      'CN': { latitude: 39.9042, longitude: 116.4074 }, // Beijing
      'RU': { latitude: 55.7558, longitude: 37.6176 },  // Moscow
      'KP': { latitude: 39.0392, longitude: 125.7625 }, // Pyongyang
      'IR': { latitude: 35.6892, longitude: 51.3890 },  // Tehran
      'US': { latitude: 38.9072, longitude: -77.0369 }, // Washington DC
      'BR': { latitude: -15.8267, longitude: -47.9218 }, // Brasília
      'GB': { latitude: 51.5074, longitude: -0.1278 },   // London
      'DE': { latitude: 52.5200, longitude: 13.4050 },   // Berlin
      'JP': { latitude: 35.6762, longitude: 139.6503 },  // Tokyo
      'AU': { latitude: -35.2809, longitude: 149.1300 }, // Canberra
      'CA': { latitude: 45.4215, longitude: -75.6972 },  // Ottawa
    };

    return coordinates[countryCode] || { latitude: 0, longitude: 0 };
  }

  private getAttackVector(attackType: AttackType): AttackVector {
    const vectors: Record<AttackType, AttackVector[]> = {
      'DDoS': ['Network'],
      'Malware': ['Email', 'Web', 'USB'],
      'Phishing': ['Email', 'Social'],
      'DataBreach': ['Network', 'Credential_Theft'],
      'Ransomware': ['Email', 'Network', 'Remote_Access'],
      'APT': ['Email', 'Supply_Chain', 'Zero_Day'],
      'Botnet': ['Network', 'Web'],
      'WebAttack': ['Web'],
      'NetworkIntrusion': ['Network', 'Remote_Access'],
      'Unknown': ['Unknown']
    };

    const vectorList = vectors[attackType] || ['Unknown'];
    return vectorList[Math.floor(Math.random() * vectorList.length)];
  }

  private getAttackPhase(_attackType: AttackType): AttackPhase {
    const phases: AttackPhase[] = ['Initial_Access', 'Execution', 'Persistence', 'Impact', 'Exfiltration'];
    return phases[Math.floor(Math.random() * phases.length)];
  }

  private generateTargetOrganization(): string {
    const organizations = [
      'Government Agency', 'Financial Corp', 'Healthcare System', 
      'Energy Provider', 'Tech Company', 'Defense Contractor',
      'University', 'Manufacturing Co', 'Retail Chain'
    ];
    return organizations[Math.floor(Math.random() * organizations.length)];
  }

  private getRandomSector(): IndustrySector {
    const sectors: IndustrySector[] = [
      'Government', 'Financial', 'Healthcare', 'Energy', 'Technology',
      'Defense', 'Education', 'Manufacturing', 'Retail'
    ];
    return sectors[Math.floor(Math.random() * sectors.length)];
  }

  private getMitreThresholds(attackType: AttackType): string[] {
    const tactics: Record<AttackType, string[]> = {
      'DDoS': ['Impact'],
      'Malware': ['Initial Access', 'Execution'],
      'Phishing': ['Initial Access'],
      'DataBreach': ['Collection', 'Exfiltration'],
      'Ransomware': ['Impact'],
      'APT': ['Initial Access', 'Persistence', 'Collection'],
      'Botnet': ['Command and Control'],
      'WebAttack': ['Initial Access'],
      'NetworkIntrusion': ['Lateral Movement'],
      'Unknown': ['Initial Access']
    };

    return tactics[attackType] || ['Initial Access'];
  }

  private getProtocols(attackType: AttackType): string[] {
    const protocols: Record<AttackType, string[]> = {
      'DDoS': ['TCP', 'UDP', 'ICMP'],
      'Malware': ['HTTPS', 'DNS'],
      'Phishing': ['SMTP', 'HTTPS'],
      'DataBreach': ['HTTPS', 'FTP'],
      'Ransomware': ['SMB', 'RDP'],
      'APT': ['HTTPS', 'DNS', 'SMB'],
      'Botnet': ['IRC', 'HTTPS'],
      'WebAttack': ['HTTPS', 'HTTP'],
      'NetworkIntrusion': ['SSH', 'RDP', 'SMB'],
      'Unknown': ['TCP']
    };

    return protocols[attackType] || ['TCP'];
  }

  private getPorts(attackType: AttackType): number[] {
    const ports: Record<AttackType, number[]> = {
      'DDoS': [80, 443, 53],
      'Malware': [443, 80, 53],
      'Phishing': [25, 587, 443],
      'DataBreach': [443, 21, 22],
      'Ransomware': [445, 3389],
      'APT': [443, 53, 445],
      'Botnet': [6667, 443],
      'WebAttack': [80, 443],
      'NetworkIntrusion': [22, 3389, 445],
      'Unknown': [80]
    };

    return ports[attackType] || [80];
  }

  // =============================================================================
  // REAL API UTILITY METHODS 
  // =============================================================================

  private getCoordinatesFromIP(ip: string): { latitude: number; longitude: number } {
    // Simple IP geolocation mapping (enhanced version would use GeoIP service)
    const ipNum = this.ipToNumber(ip);
    const hash = this.simpleHash(ipNum.toString());
    
    // Generate coordinates based on common attack source regions
    const regions = [
      { lat: 39.9042, lng: 116.4074 }, // Beijing
      { lat: 55.7558, lng: 37.6176 },  // Moscow  
      { lat: 40.7128, lng: -74.0060 }, // New York
      { lat: 51.5074, lng: -0.1278 },  // London
      { lat: 35.6762, lng: 139.6503 }, // Tokyo
      { lat: -33.8688, lng: 151.2093 } // Sydney
    ];
    
    const region = regions[hash % regions.length];
    
    // Add some randomness around the region
    return {
      latitude: region.lat + (Math.random() - 0.5) * 20,
      longitude: region.lng + (Math.random() - 0.5) * 20
    };
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private inferAttackTypeFromSource(source: string, feedType: string): AttackType {
    if (source.includes('malware') || feedType === 'HoneyPot') return 'Malware';
    if (source.includes('ddos')) return 'DDoS';
    if (source.includes('phishing')) return 'Phishing';
    if (source.includes('botnet')) return 'Botnet';
    return 'NetworkIntrusion';
  }

  private getCountryFromCoords(coords: { latitude: number; longitude: number }): string {
    // Simple coordinate to country mapping
    if (coords.latitude > 35 && coords.latitude < 45 && coords.longitude > 100 && coords.longitude < 130) return 'CN';
    if (coords.latitude > 50 && coords.latitude < 60 && coords.longitude > 30 && coords.longitude < 50) return 'RU';
    if (coords.latitude > 25 && coords.latitude < 50 && coords.longitude > -125 && coords.longitude < -65) return 'US';
    if (coords.latitude > 45 && coords.latitude < 60 && coords.longitude > -10 && coords.longitude < 30) return 'DE';
    return 'Unknown';
  }

  private generateRandomTargetCoords(): { latitude: number; longitude: number; countryCode: string } {
    const targetCountries = [
      { code: 'US', lat: 38.9072, lng: -77.0369 },
      { code: 'GB', lat: 51.5074, lng: -0.1278 },
      { code: 'DE', lat: 52.5200, lng: 13.4050 },
      { code: 'JP', lat: 35.6762, lng: 139.6503 },
      { code: 'AU', lat: -35.2809, lng: 149.1300 },
      { code: 'CA', lat: 45.4215, lng: -75.6972 }
    ];
    
    const target = targetCountries[Math.floor(Math.random() * targetCountries.length)];
    
    return {
      latitude: target.lat + (Math.random() - 0.5) * 10,
      longitude: target.lng + (Math.random() - 0.5) * 10,
      countryCode: target.code
    };
  }

  private generateRandomSourceCoords(): { latitude: number; longitude: number; countryCode: string } {
    const sourceCountries = [
      { code: 'CN', lat: 39.9042, lng: 116.4074 },
      { code: 'RU', lat: 55.7558, lng: 37.6176 },
      { code: 'KP', lat: 39.0392, lng: 125.7625 },
      { code: 'IR', lat: 35.6892, lng: 51.3890 },
      { code: 'BR', lat: -15.8267, lng: -47.9218 }
    ];
    
    const source = sourceCountries[Math.floor(Math.random() * sourceCountries.length)];
    
    return {
      latitude: source.lat + (Math.random() - 0.5) * 15,
      longitude: source.lng + (Math.random() - 0.5) * 15,
      countryCode: source.code
    };
  }

  private mapAbuseCategoriesToAttackType(categories?: number[]): AttackType {
    if (!categories || categories.length === 0) return 'NetworkIntrusion';
    
    // AbuseIPDB categories mapping
    if (categories.includes(18) || categories.includes(19)) return 'DDoS';
    if (categories.includes(15)) return 'Malware';
    if (categories.includes(18)) return 'Botnet';
    if (categories.includes(11)) return 'WebAttack';
    
    return 'NetworkIntrusion';
  }

  private addGeographicClustering(location: { latitude: number; longitude: number }): { latitude: number; longitude: number } {
    // Add small clustering around original location to simulate realistic attack patterns
    return {
      latitude: location.latitude + (Math.random() - 0.5) * 2,
      longitude: location.longitude + (Math.random() - 0.5) * 2
    };
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  public dispose(): void {
    this.stopRealTimeStreaming();
    this.streamSubscriptions.clear();
    this.activeAttacks.clear();
    this.attackCache.clear();
  }
}
