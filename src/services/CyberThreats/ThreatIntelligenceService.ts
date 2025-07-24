/**
 * Threat Intelligence Service
 * Part of Week 3: CyberThreats Implementation - Day 2
 * 
 * This service provides comprehensive threat intelligence data processing,
 * geographic mapping, and real-time streaming capabilities for the Starcom
 * CyberCommand visualization system.
 */

import type {
  CyberThreatData,
  ThreatCategory,
  ThreatSophistication,
  ThreatActorType,
  ConfidenceLevel,
  ThreatStatus,
  ThreatQueryOptions,
  ThreatStreamEvent,
  ThreatEventType,
  ThreatStreamCallback,
  ThreatCorrelation,
  ThreatHeatMapPoint,
  IOC,
  IOCType,
  ThreatActor
} from '../../types/CyberThreats';

import type { GeoCoordinate } from '../../types/CyberCommandVisualization';

// =============================================================================
// SERVICE CONFIGURATION
// =============================================================================

interface ThreatIntelligenceConfig {
  updateInterval: number;          // milliseconds between updates
  maxActiveThreatss: number;        // memory limit for active threats
  enableGeographicCorrelation: boolean;
  enableTemporalCorrelation: boolean;
  enableActorAttribution: boolean;
  correlationThreshold: number;    // 0-1 confidence threshold
  heatMapResolution: number;       // grid resolution for heat maps
  c2NetworkDepth: number;          // max relationship depth for C2 networks
  debugMode: boolean;
}

const DEFAULT_CONFIG: ThreatIntelligenceConfig = {
  updateInterval: 5000,            // 5 seconds
  maxActiveThreatss: 5000,
  enableGeographicCorrelation: true,
  enableTemporalCorrelation: true,
  enableActorAttribution: true,
  correlationThreshold: 0.7,
  heatMapResolution: 50,
  c2NetworkDepth: 3,
  debugMode: false
};

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

/**
 * Mock threat intelligence data generator
 * Provides realistic threat data for development and testing
 */
class MockThreatDataGenerator {
  private threatCounter = 0;
  private actorCounter = 0;
  private iocCounter = 0;

  // Sample data pools for realistic generation
  private readonly threatCategories: ThreatCategory[] = [
    'Malware', 'APT', 'Botnet', 'Phishing', 'DataBreach', 
    'Infrastructure', 'SupplyChain', 'Insider'
  ];

  private readonly sophisticationLevels: ThreatSophistication[] = [
    'Basic', 'Intermediate', 'Advanced', 'Expert'
  ];

  private readonly actorTypes: ThreatActorType[] = [
    'NationState', 'Criminal', 'Hacktivist', 'Insider', 'Terrorist'
  ];

  private readonly confidenceLevels: ConfidenceLevel[] = [
    'Low', 'Medium', 'High', 'Confirmed'
  ];

  private readonly threatStatuses: ThreatStatus[] = [
    'Emerging', 'Active', 'Contained', 'Neutralized', 'Dormant'
  ];

  private readonly countryCodePools = {
    source: ['CN', 'RU', 'KP', 'IR', 'SY', 'VE', 'BY', 'MM'],
    target: ['US', 'GB', 'DE', 'FR', 'JP', 'KR', 'AU', 'CA', 'IL', 'UA']
  };

  private readonly sectorTargets = [
    'Financial', 'Healthcare', 'Energy', 'Government', 'Technology',
    'Defense', 'Education', 'Telecommunications', 'Manufacturing',
    'Transportation', 'Critical Infrastructure'
  ];

  private readonly mitreATTCKTechniques = [
    'T1566', 'T1055', 'T1047', 'T1003', 'T1059', 'T1190', 'T1021',
    'T1083', 'T1082', 'T1057', 'T1012', 'T1016', 'T1033', 'T1018'
  ];

  private readonly knownActors: ThreatActor[] = [
    {
      id: 'actor_apt29',
      name: 'APT29',
      aliases: ['Cozy Bear', 'The Dukes', 'NOBELIUM'],
      type: 'NationState',
      sophistication: 'Expert',
      attribution: {
        country: 'RU',
        organization: 'SVR',
        confidence: 'High'
      },
      motivations: ['Espionage', 'Intelligence Gathering'],
      techniques: ['T1566', 'T1055', 'T1047'],
      targets: ['Government', 'Healthcare', 'Research'],
      first_seen: new Date('2008-01-01'),
      last_activity: new Date()
    },
    {
      id: 'actor_apt28',
      name: 'APT28',
      aliases: ['Fancy Bear', 'Pawn Storm', 'Strontium'],
      type: 'NationState',
      sophistication: 'Expert',
      attribution: {
        country: 'RU',
        organization: 'GRU',
        confidence: 'Confirmed'
      },
      motivations: ['Espionage', 'Disruption'],
      techniques: ['T1190', 'T1021', 'T1083'],
      targets: ['Military', 'Government', 'Media'],
      first_seen: new Date('2007-01-01'),
      last_activity: new Date()
    },
    {
      id: 'actor_lazarus',
      name: 'Lazarus Group',
      aliases: ['HIDDEN COBRA', 'ZINC', 'APT38'],
      type: 'NationState',
      sophistication: 'Advanced',
      attribution: {
        country: 'KP',
        organization: 'RGB',
        confidence: 'High'
      },
      motivations: ['Financial', 'Espionage', 'Sabotage'],
      techniques: ['T1059', 'T1012', 'T1016'],
      targets: ['Financial', 'Cryptocurrency', 'Entertainment'],
      first_seen: new Date('2009-01-01'),
      last_activity: new Date()
    }
  ];

  private readonly malwareFamilies = [
    'TrickBot', 'Emotet', 'QakBot', 'Cobalt Strike', 'Mimikatz',
    'PowerShell Empire', 'Metasploit', 'SolarWinds', 'NotPetya',
    'WannaCry', 'Olympic Destroyer', 'BadRabbit', 'Ryuk'
  ];

  /**
   * Generate a realistic geographic coordinate with bias toward major cities
   */
  private generateRealisticLocation(): GeoCoordinate {
    const majorCities = [
      { latitude: 39.9042, longitude: 116.4074 },   // Beijing
      { latitude: 55.7558, longitude: 37.6173 },    // Moscow
      { latitude: 40.7128, longitude: -74.0060 },   // New York
      { latitude: 51.5074, longitude: -0.1278 },    // London
      { latitude: 35.6762, longitude: 139.6503 },   // Tokyo
      { latitude: 37.7749, longitude: -122.4194 },  // San Francisco
      { latitude: 52.5200, longitude: 13.4050 },    // Berlin
      { latitude: 48.8566, longitude: 2.3522 },     // Paris
      { latitude: 37.5665, longitude: 126.9780 },   // Seoul
      { latitude: 25.2048, longitude: 55.2708 }     // Dubai
    ];

    // 70% chance of major city, 30% chance of random location
    if (Math.random() < 0.7) {
      const city = majorCities[Math.floor(Math.random() * majorCities.length)];
      return {
        latitude: city.latitude + (Math.random() - 0.5) * 2, // Add some noise
        longitude: city.longitude + (Math.random() - 0.5) * 2
      };
    }

    return {
      latitude: (Math.random() - 0.5) * 180,
      longitude: (Math.random() - 0.5) * 360
    };
  }

  /**
   * Generate severity based on threat category and sophistication
   */
  private calculateSeverity(category: ThreatCategory, sophistication: ThreatSophistication): number {
    let baseSeverity = 5;

    // Category modifiers
    switch (category) {
      case 'APT': baseSeverity = 8; break;
      case 'Infrastructure': baseSeverity = 9; break;
      case 'DataBreach': baseSeverity = 7; break;
      case 'SupplyChain': baseSeverity = 9; break;
      case 'Phishing': baseSeverity = 4; break;
      case 'Malware': baseSeverity = 6; break;
      default: baseSeverity = 5;
    }

    // Sophistication modifiers
    switch (sophistication) {
      case 'Expert': baseSeverity += 2; break;
      case 'Advanced': baseSeverity += 1; break;
      case 'Basic': baseSeverity -= 1; break;
    }

    return Math.max(1, Math.min(10, baseSeverity + Math.floor(Math.random() * 3) - 1));
  }

  /**
   * Generate a mock IOC
   */
  private generateIOC(): IOC {
    const types: IOCType[] = ['domain', 'ip_address', 'url', 'file_hash'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let value: string;
    switch (type) {
      case 'domain':
        value = `malicious-${Math.random().toString(36).substr(2, 8)}.com`;
        break;
      case 'ip_address':
        value = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
        break;
      case 'url':
        value = `https://malicious-${Math.random().toString(36).substr(2, 8)}.com/payload`;
        break;
      case 'file_hash':
        value = `sha256:${Math.random().toString(36).substr(2, 64)}`;
        break;
      default:
        value = 'unknown';
    }

    return {
      id: `ioc_${++this.iocCounter}`,
      type,
      value,
      description: `Malicious ${type} indicator`,
      confidence: this.confidenceLevels[Math.floor(Math.random() * this.confidenceLevels.length)],
      first_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      last_seen: new Date(),
      malware_families: [this.malwareFamilies[Math.floor(Math.random() * this.malwareFamilies.length)]],
      campaigns: [],
      threat_actors: [],
      tags: ['malicious', 'indicator'],
      source: {
        provider: 'MockIntel',
        report_id: `report_${Math.random().toString(36).substr(2, 8)}`,
        url: 'https://mockintel.com/report'
      }
    };
  }

  /**
   * Generate a complete threat data object
   */
  generateThreat(): CyberThreatData {
    const threatId = `TH-${new Date().getFullYear()}-${String(++this.threatCounter).padStart(6, '0')}`;
    const category = this.threatCategories[Math.floor(Math.random() * this.threatCategories.length)];
    const sophistication = this.sophisticationLevels[Math.floor(Math.random() * this.sophisticationLevels.length)];
    const actor = this.knownActors[Math.floor(Math.random() * this.knownActors.length)];
    const location = this.generateRealisticLocation();
    const severity = this.calculateSeverity(category, sophistication);
    
    const firstSeen = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const lastSeen = new Date(firstSeen.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);

    // Generate IOCs
    const iocCount = Math.floor(Math.random() * 5) + 1;
    const iocs: IOC[] = [];
    for (let i = 0; i < iocCount; i++) {
      iocs.push(this.generateIOC());
    }

    const threat: CyberThreatData = {
      // Core visualization properties
      id: `threat_${this.threatCounter}`,
      type: 'CyberThreats',
      location,
      timestamp: new Date(),
      metadata: {
        source: 'MockThreatIntel',
        generated: true,
        version: '1.0'
      },
      priority: severity >= 8 ? 'critical' : severity >= 6 ? 'high' : severity >= 4 ? 'medium' : 'low',
      
      // Threat-specific properties
      threat_id: threatId,
      category,
      subcategory: category === 'APT' ? 'Nation State' : undefined,
      name: `${category} Campaign ${this.threatCounter}`,
      description: `Mock ${category} threat for testing and development`,
      severity,
      confidence: this.confidenceLevels[Math.floor(Math.random() * this.confidenceLevels.length)],
      status: this.threatStatuses[Math.floor(Math.random() * this.threatStatuses.length)],
      sophistication,
      
      // Attribution
      threat_actor: actor,
      actor_id: actor.id,
      campaigns: [`campaign_${Math.floor(Math.random() * 100) + 1}`],
      
      // Technical details
      malware_families: [this.malwareFamilies[Math.floor(Math.random() * this.malwareFamilies.length)]],
      iocs,
      techniques: this.mitreATTCKTechniques.slice(0, Math.floor(Math.random() * 4) + 1),
      
      // Geographic and targeting
      source_countries: [this.countryCodePools.source[Math.floor(Math.random() * this.countryCodePools.source.length)]],
      target_countries: this.countryCodePools.target.slice(0, Math.floor(Math.random() * 3) + 1),
      target_sectors: this.sectorTargets.slice(0, Math.floor(Math.random() * 3) + 1),
      target_organizations: [`Organization ${Math.floor(Math.random() * 1000)}`],
      
      // Temporal information
      first_seen: firstSeen,
      last_seen: lastSeen,
      peak_activity: new Date(firstSeen.getTime() + (lastSeen.getTime() - firstSeen.getTime()) * Math.random()),
      
      // Impact assessment
      impact_assessment: {
        scope: severity >= 8 ? 'Global' : severity >= 6 ? 'Regional' : 'Limited',
        affected_systems: Math.floor(Math.random() * 10000) + 1,
        financial_impact: Math.floor(Math.random() * 10000000),
        data_compromised: Math.floor(Math.random() * 1000000),
        downtime: Math.floor(Math.random() * 168) // Up to 1 week
      },
      
      // Intelligence sources
      sources: [{
        provider: 'MockThreatIntel',
        feed_name: 'Development Feed',
        confidence: this.confidenceLevels[Math.floor(Math.random() * this.confidenceLevels.length)],
        timestamp: new Date(),
        classification: 'TLP:Green'
      }],
      
      // Relationships
      related_threats: [],
      child_threats: [],
      
      // Visualization metadata
      visualization_data: {
        color: this.getCategoryColor(category),
        intensity: severity / 10,
        animation_type: severity >= 8 ? 'pulse' : severity >= 6 ? 'flow' : 'heat',
        show_connections: sophistication === 'Expert' || sophistication === 'Advanced',
        show_attribution: actor.attribution.confidence === 'High' || actor.attribution.confidence === 'Confirmed'
      }
    };

    return threat;
  }

  /**
   * Get color coding for threat categories
   */
  private getCategoryColor(category: ThreatCategory): string {
    const colorMap: Record<ThreatCategory, string> = {
      'APT': '#ff0000',           // Red - Nation state threats
      'Malware': '#ff6600',       // Orange - General malware
      'Botnet': '#cc00ff',        // Purple - Botnets
      'Phishing': '#ffcc00',      // Yellow - Phishing campaigns
      'DataBreach': '#ff3300',    // Dark red - Data breaches
      'Infrastructure': '#990000', // Dark red - Critical infrastructure
      'SupplyChain': '#ff0066',   // Pink - Supply chain attacks
      'Insider': '#0066ff',       // Blue - Insider threats
      'Unknown': '#666666'        // Gray - Unknown threats
    };

    return colorMap[category] || '#666666';
  }
}

// =============================================================================
// MAIN SERVICE CLASS
// =============================================================================

/**
 * Threat Intelligence Service
 * Provides comprehensive threat intelligence data processing and visualization
 */
export class ThreatIntelligenceService {
  private config: ThreatIntelligenceConfig;
  private dataGenerator: MockThreatDataGenerator;
  private activeThreats: Map<string, CyberThreatData> = new Map();
  private subscriptions: Map<string, {
    options: ThreatQueryOptions;
    callback: ThreatStreamCallback;
    isActive: boolean;
  }> = new Map();
  private isStreaming = false;
  private streamingInterval?: NodeJS.Timeout;
  private heatMapCache: Map<string, ThreatHeatMapPoint[]> = new Map();
  private correlationCache: Map<string, ThreatCorrelation[]> = new Map();

  constructor(config: Partial<ThreatIntelligenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dataGenerator = new MockThreatDataGenerator();

    if (this.config.debugMode) {
      console.log('ThreatIntelligenceService initialized with config:', this.config);
    }
  }

  // =============================================================================
  // DATA FETCHING METHODS
  // =============================================================================

  /**
   * Fetch threat intelligence data based on query options
   */
  async getData(options: ThreatQueryOptions = {}): Promise<CyberThreatData[]> {
    const startTime = performance.now();

    try {
      // 🔥 DISABLE REAL API CALLS FOR NOW - Use enhanced mock data with real patterns
      console.log('⚠️ Real API integration temporarily disabled - using enhanced mock data with real-world patterns');
      
      // Enhanced mock data that behaves like real data
      const threatCount = options.limit || 100;
      const threats: CyberThreatData[] = [];

      for (let i = 0; i < threatCount; i++) {
        const threat = this.dataGenerator.generateThreat();
        
        // Apply filters
        if (this.matchesFilters(threat, options)) {
          threats.push(threat);
        }
      }

      // Apply sorting
      if (options.sort_by) {
        threats.sort((a, b) => {
          const aValue = this.getSortValue(a, options.sort_by!);
          const bValue = this.getSortValue(b, options.sort_by!);
          const multiplier = options.sort_order === 'desc' ? -1 : 1;
          return (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) * multiplier;
        });
      }

      // Apply offset and limit
      const offset = options.offset || 0;
      const limit = options.limit || threats.length;
      const result = threats.slice(offset, offset + limit);

      // Store active threats
      result.forEach(threat => {
        if (threat.status === 'Active' || threat.status === 'Emerging') {
          this.activeThreats.set(threat.id, threat);
        }
      });

      const endTime = performance.now();
      if (this.config.debugMode) {
        console.log(`ThreatIntelligenceService.getData: ${result.length} threats in ${endTime - startTime}ms`);
      }

      return result;
    } catch (error) {
      console.error('Error fetching threat data:', error);
      throw new Error(`Failed to fetch threat data: ${error}`);
    }
  }

  /**
   * Get active threats currently being tracked
   */
  getActiveThreats(): CyberThreatData[] {
    return Array.from(this.activeThreats.values());
  }

  /**
   * Get threat by ID
   */
  getThreatById(threatId: string): CyberThreatData | null {
    return this.activeThreats.get(threatId) || null;
  }

  // =============================================================================
  // REAL-TIME STREAMING
  // =============================================================================

  /**
   * Subscribe to real-time threat intelligence updates
   */
  subscribeToThreats(
    options: ThreatQueryOptions,
    callback: ThreatStreamCallback
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subscriptionId, {
      options,
      callback,
      isActive: true
    });

    if (!this.isStreaming) {
      this.startStreaming();
    }

    if (this.config.debugMode) {
      console.log(`Created threat subscription: ${subscriptionId}`);
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from threat intelligence updates
   */
  unsubscribeFromThreats(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    
    if (this.subscriptions.size === 0 && this.isStreaming) {
      this.stopStreaming();
    }

    if (this.config.debugMode) {
      console.log(`Removed threat subscription: ${subscriptionId}, success: ${removed}`);
    }

    return removed;
  }

  /**
   * Start streaming threat intelligence updates
   */
  private startStreaming(): void {
    if (this.isStreaming) return;

    this.isStreaming = true;
    this.streamingInterval = setInterval(() => {
      this.processStreamingUpdate();
    }, this.config.updateInterval);

    if (this.config.debugMode) {
      console.log('Started threat intelligence streaming');
    }
  }

  /**
   * Stop streaming updates
   */
  private stopStreaming(): void {
    if (!this.isStreaming) return;

    this.isStreaming = false;
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = undefined;
    }

    if (this.config.debugMode) {
      console.log('Stopped threat intelligence streaming');
    }
  }

  /**
   * Process a streaming update cycle
   */
  private processStreamingUpdate(): void {
    try {
      // Generate new threat events
      const eventTypes: ThreatEventType[] = [
        'new_threat', 'threat_update', 'threat_escalation', 
        'threat_attribution', 'ioc_update'
      ];

      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const threat = this.dataGenerator.generateThreat();

      // Update active threats tracking
      if (threat.status === 'Active' || threat.status === 'Emerging') {
        this.activeThreats.set(threat.id, threat);
      } else if (threat.status === 'Neutralized') {
        this.activeThreats.delete(threat.id);
      }

      // Create stream event
      const streamEvent: ThreatStreamEvent = {
        event_type: eventType,
        threat_data: threat,
        timestamp: new Date(),
        source_feed: 'MockThreatIntel',
        metadata: {
          correlation_id: `corr_${Math.random().toString(36).substr(2, 9)}`,
          confidence_change: eventType === 'threat_update' ? Math.random() * 0.2 - 0.1 : undefined,
          severity_change: eventType === 'threat_escalation' ? Math.floor(Math.random() * 3) + 1 : undefined,
          new_iocs: eventType === 'ioc_update' ? [`ioc_${Math.random().toString(36).substr(2, 9)}`] : undefined
        }
      };

      // Notify subscribers
      this.notifySubscribers(streamEvent);

    } catch (error) {
      console.error('Error in streaming update:', error);
      
      // Send error event to subscribers
      const errorEvent: ThreatStreamEvent = {
        event_type: 'feed_error',
        threat_data: {} as CyberThreatData, // Empty placeholder
        timestamp: new Date(),
        source_feed: 'MockThreatIntel',
        metadata: {
          correlation_id: `corr_error_${Math.random().toString(36).substr(2, 9)}`
        }
      };
      
      this.notifySubscribers(errorEvent);
    }
  }

  /**
   * Notify all active subscribers of a streaming event
   */
  private notifySubscribers(event: ThreatStreamEvent): void {
    this.subscriptions.forEach((subscription, subscriptionId) => {
      if (!subscription.isActive) return;

      try {
        // Check if event matches subscription filters
        if (this.matchesFilters(event.threat_data, subscription.options)) {
          subscription.callback(event);
        }
      } catch (error) {
        console.error(`Error in subscription callback ${subscriptionId}:`, error);
        // Don't stop processing other subscriptions due to one callback error
      }
    });
  }

  // =============================================================================
  // FILTERING AND MATCHING
  // =============================================================================

  /**
   * Check if a threat matches the given query filters
   */
  private matchesFilters(threat: CyberThreatData, options: ThreatQueryOptions): boolean {
    // Category filter
    if (options.categories?.length && !options.categories.includes(threat.category)) {
      return false;
    }

    // Sophistication filter
    if (options.sophistication?.length && !options.sophistication.includes(threat.sophistication)) {
      return false;
    }

    // Confidence filter
    if (options.confidence?.length && !options.confidence.includes(threat.confidence)) {
      return false;
    }

    // Status filter
    if (options.status?.length && !options.status.includes(threat.status)) {
      return false;
    }

    // Actor type filter
    if (options.actor_types?.length && threat.threat_actor) {
      if (!options.actor_types.includes(threat.threat_actor.type)) {
        return false;
      }
    }

    // Geographic filters
    if (options.source_countries?.length) {
      const hasMatch = threat.source_countries.some(country => 
        options.source_countries!.includes(country)
      );
      if (!hasMatch) return false;
    }

    if (options.target_countries?.length) {
      const hasMatch = threat.target_countries.some(country => 
        options.target_countries!.includes(country)
      );
      if (!hasMatch) return false;
    }

    if (options.target_sectors?.length) {
      const hasMatch = threat.target_sectors.some(sector => 
        options.target_sectors!.includes(sector)
      );
      if (!hasMatch) return false;
    }

    // Severity filter
    if (options.severity_min !== undefined && threat.severity < options.severity_min) {
      return false;
    }

    if (options.severity_max !== undefined && threat.severity > options.severity_max) {
      return false;
    }

    // Temporal filters
    if (options.first_seen_after && threat.first_seen < options.first_seen_after) {
      return false;
    }

    if (options.last_seen_before && threat.last_seen > options.last_seen_before) {
      return false;
    }

    if (options.time_window) {
      if (threat.timestamp < options.time_window.start || 
          threat.timestamp > options.time_window.end) {
        return false;
      }
    }

    // Technical filters
    if (options.techniques?.length) {
      const hasMatch = threat.techniques.some(technique => 
        options.techniques!.includes(technique)
      );
      if (!hasMatch) return false;
    }

    if (options.campaigns?.length) {
      const hasMatch = threat.campaigns.some(campaign => 
        options.campaigns!.includes(campaign)
      );
      if (!hasMatch) return false;
    }

    return true;
  }

  /**
   * Get sort value for a threat based on sort field
   */
  private getSortValue(threat: CyberThreatData, sortBy: string): number | string {
    switch (sortBy) {
      case 'severity': return threat.severity;
      case 'confidence': return this.getConfidenceValue(threat.confidence);
      case 'first_seen': return threat.first_seen.getTime();
      case 'last_seen': return threat.last_seen.getTime();
      default: return 0;
    }
  }

  /**
   * Convert confidence level to numeric value for sorting
   */
  private getConfidenceValue(confidence: ConfidenceLevel): number {
    const mapping: Record<ConfidenceLevel, number> = {
      'Low': 1,
      'Medium': 2,
      'High': 3,
      'Confirmed': 4
    };
    return mapping[confidence] || 0;
  }

  // =============================================================================
  // GEOGRAPHIC PROCESSING
  // =============================================================================

  /**
   * Generate threat heat map data
   */
  async generateHeatMap(options: ThreatQueryOptions = {}): Promise<ThreatHeatMapPoint[]> {
    const cacheKey = JSON.stringify(options);
    
    // Check cache first
    if (this.heatMapCache.has(cacheKey)) {
      return this.heatMapCache.get(cacheKey)!;
    }

    const threats = await this.getData(options);
    const heatMapPoints: ThreatHeatMapPoint[] = [];

    // Group threats by geographic region
    const regionSize = 360 / this.config.heatMapResolution;
    const regions: Map<string, CyberThreatData[]> = new Map();

    threats.forEach(threat => {
      const regionLat = Math.floor(threat.location.latitude / regionSize) * regionSize;
      const regionLon = Math.floor(threat.location.longitude / regionSize) * regionSize;
      const regionKey = `${regionLat},${regionLon}`;

      if (!regions.has(regionKey)) {
        regions.set(regionKey, []);
      }
      regions.get(regionKey)!.push(threat);
    });

    // Create heat map points
    regions.forEach((regionThreats, regionKey) => {
      const [latStr, lonStr] = regionKey.split(',');
      const avgSeverity = regionThreats.reduce((sum, t) => sum + t.severity, 0) / regionThreats.length;
      const categories = [...new Set(regionThreats.map(t => t.category))];
      const actorTypes = regionThreats
        .filter(t => t.threat_actor)
        .map(t => t.threat_actor!.type);
      const dominantActorType = this.getMostFrequent(actorTypes);

      const heatPoint: ThreatHeatMapPoint = {
        location: {
          latitude: parseFloat(latStr) + regionSize / 2,
          longitude: parseFloat(lonStr) + regionSize / 2
        },
        threat_density: Math.min(1, regionThreats.length / 10), // Normalize to 0-1
        threat_categories: categories,
        active_threats: regionThreats.filter(t => t.status === 'Active').length,
        avg_severity: avgSeverity,
        dominant_actor_type: dominantActorType
      };

      heatMapPoints.push(heatPoint);
    });

    // Cache results
    this.heatMapCache.set(cacheKey, heatMapPoints);

    return heatMapPoints;
  }

  /**
   * Get most frequent item in array
   */
  private getMostFrequent<T>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;

    const counts = new Map<T, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    let maxCount = 0;
    let mostFrequent: T | undefined;
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    });

    return mostFrequent;
  }

  // =============================================================================
  // CLEANUP AND LIFECYCLE
  // =============================================================================

  /**
   * Clean up resources and stop all streaming
   */
  dispose(): void {
    this.stopStreaming();
    this.subscriptions.clear();
    this.activeThreats.clear();
    this.heatMapCache.clear();
    this.correlationCache.clear();

    if (this.config.debugMode) {
      console.log('ThreatIntelligenceService disposed');
    }
  }

  /**
   * Get service health and statistics
   */
  getServiceStats() {
    return {
      activeThreats: this.activeThreats.size,
      activeSubscriptions: this.subscriptions.size,
      isStreaming: this.isStreaming,
      cacheSize: {
        heatMap: this.heatMapCache.size,
        correlation: this.correlationCache.size
      },
      config: this.config
    };
  }
}
