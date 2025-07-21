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
  private mockDataEnabled = true; // For development/testing
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

  private async fetchRealAttackData(_options?: CyberAttackQueryOptions): Promise<CyberAttackData[]> {
    // TODO: Implement real SIEM/SOC API calls
    // This would integrate with actual security platforms
    throw new Error('Real attack data fetching not yet implemented');
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
  // CLEANUP
  // =============================================================================

  public dispose(): void {
    this.stopRealTimeStreaming();
    this.streamSubscriptions.clear();
    this.activeAttacks.clear();
    this.attackCache.clear();
  }
}
