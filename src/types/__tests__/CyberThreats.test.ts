/**
 * Test suite for CyberThreats type system
 * Part of Week 3: CyberThreats Implementation
 */

import { describe, it, expect } from 'vitest';
import type {
  CyberThreatData,
  ThreatCategory,
  ThreatSophistication,
  ThreatActorType,
  ConfidenceLevel,
  ThreatStatus,
  ThreatActor,
  ThreatCampaign,
  IOC,
  IOCType,
  MalwareFamily,
  MalwareType,
  ThreatQueryOptions,
  ThreatStreamEvent,
  ThreatEventType,
  ThreatCorrelation,
  CorrelationType,
  ThreatTrend,
  ThreatHeatMapPoint,
  C2NetworkData,
  C2Node,
  C2Connection,
  AttackTechnique,
  KillChainPhase,
  ThreatSource,
  ThreatFeedConfig,
  ThreatFeedType,
  TimeWindow,
  MalwareVariant,
  CreateThreatData,
  ThreatDataValidation,
  ThreatBatch
} from '../CyberThreats';

describe('CyberThreats Type System', () => {
  // =============================================================================
  // CORE TYPE VALIDATION
  // =============================================================================

  describe('Core Threat Types', () => {
    it('should validate ThreatCategory enum values', () => {
      const validCategories: ThreatCategory[] = [
        'Malware',
        'APT', 
        'Botnet',
        'Phishing',
        'DataBreach',
        'Infrastructure',
        'SupplyChain',
        'Insider',
        'Unknown'
      ];

      validCategories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category).toBeTruthy();
      });

      expect(validCategories).toHaveLength(9);
    });

    it('should validate ThreatSophistication levels', () => {
      const sophisticationLevels: ThreatSophistication[] = [
        'Basic',
        'Intermediate', 
        'Advanced',
        'Expert',
        'Unknown'
      ];

      sophisticationLevels.forEach(level => {
        expect(typeof level).toBe('string');
        expect(level).toBeTruthy();
      });

      expect(sophisticationLevels).toHaveLength(5);
    });

    it('should validate ThreatActorType classifications', () => {
      const actorTypes: ThreatActorType[] = [
        'NationState',
        'Criminal',
        'Hacktivist',
        'Insider',
        'Terrorist',
        'Unknown'
      ];

      actorTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type).toBeTruthy();
      });

      expect(actorTypes).toHaveLength(6);
    });

    it('should validate ConfidenceLevel values', () => {
      const confidenceLevels: ConfidenceLevel[] = [
        'Low',
        'Medium',
        'High',
        'Confirmed'
      ];

      confidenceLevels.forEach(level => {
        expect(typeof level).toBe('string');
        expect(level).toBeTruthy();
      });

      expect(confidenceLevels).toHaveLength(4);
    });

    it('should validate ThreatStatus lifecycle states', () => {
      const statuses: ThreatStatus[] = [
        'Emerging',
        'Active',
        'Contained',
        'Neutralized',
        'Dormant',
        'Unknown'
      ];

      statuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(status).toBeTruthy();
      });

      expect(statuses).toHaveLength(6);
    });
  });

  // =============================================================================
  // DATA STRUCTURE VALIDATION
  // =============================================================================

  describe('CyberThreatData Structure', () => {
    it('should create valid CyberThreatData object', () => {
      const threatData: CyberThreatData = {
        // Core visualization properties
        id: 'threat_123',
        type: 'CyberThreats',
        location: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date(),
        metadata: { source: 'test' },
        priority: 'high',
        
        // Threat-specific properties
        threat_id: 'TH-2025-001',
        category: 'APT',
        subcategory: 'Nation State',
        name: 'Test APT Campaign',
        description: 'Advanced persistent threat targeting financial sector',
        severity: 8,
        confidence: 'High',
        status: 'Active',
        sophistication: 'Advanced',
        
        // Attribution
        campaigns: ['camp_001'],
        
        // Technical details
        malware_families: ['family_001'],
        iocs: [],
        techniques: ['T1566', 'T1055'],
        
        // Geographic targeting
        source_countries: ['CN'],
        target_countries: ['US', 'EU'],
        target_sectors: ['Financial', 'Healthcare'],
        target_organizations: ['Bank XYZ'],
        
        // Temporal information
        first_seen: new Date('2025-01-01'),
        last_seen: new Date('2025-01-15'),
        peak_activity: new Date('2025-01-10'),
        
        // Impact assessment
        impact_assessment: {
          scope: 'Regional',
          affected_systems: 150,
          financial_impact: 1500000,
          data_compromised: 50000,
          downtime: 24
        },
        
        // Intelligence sources
        sources: [{
          provider: 'CrowdStrike',
          feed_name: 'Threat Intelligence',
          confidence: 'High',
          timestamp: new Date(),
          classification: 'TLP:Amber'
        }],
        
        // Relationships
        related_threats: ['threat_456'],
        child_threats: [],
        
        // Visualization metadata
        visualization_data: {
          color: '#ff0000',
          intensity: 0.8,
          animation_type: 'pulse',
          show_connections: true,
          show_attribution: true
        }
      };

      // Validate core properties
      expect(threatData.id).toBe('threat_123');
      expect(threatData.type).toBe('CyberThreats');
      expect(threatData.threat_id).toBe('TH-2025-001');
      expect(threatData.category).toBe('APT');
      expect(threatData.severity).toBe(8);
      expect(threatData.confidence).toBe('High');
      expect(threatData.status).toBe('Active');
      
      // Validate arrays
      expect(Array.isArray(threatData.campaigns)).toBe(true);
      expect(Array.isArray(threatData.malware_families)).toBe(true);
      expect(Array.isArray(threatData.iocs)).toBe(true);
      expect(Array.isArray(threatData.techniques)).toBe(true);
      expect(Array.isArray(threatData.source_countries)).toBe(true);
      expect(Array.isArray(threatData.target_countries)).toBe(true);
      
      // Validate nested objects
      expect(typeof threatData.location).toBe('object');
      expect(typeof threatData.impact_assessment).toBe('object');
      expect(typeof threatData.visualization_data).toBe('object');
      expect(Array.isArray(threatData.sources)).toBe(true);
    });

    it('should validate required vs optional properties', () => {
      const minimalThreat: CyberThreatData = {
        id: 'threat_minimal',
        type: 'CyberThreats',
        location: { latitude: 0, longitude: 0 },
        timestamp: new Date(),
        metadata: {},
        priority: 'medium',
        threat_id: 'TH-MIN-001',
        category: 'Malware',
        name: 'Minimal Threat',
        description: 'Basic threat data',
        severity: 5,
        confidence: 'Medium',
        status: 'Active',
        sophistication: 'Basic',
        campaigns: [],
        malware_families: [],
        iocs: [],
        techniques: [],
        source_countries: [],
        target_countries: [],
        target_sectors: [],
        target_organizations: [],
        first_seen: new Date(),
        last_seen: new Date(),
        impact_assessment: {
          scope: 'Limited',
          affected_systems: 1
        },
        sources: [],
        related_threats: [],
        child_threats: [],
        visualization_data: {
          color: '#666666',
          intensity: 0.5,
          animation_type: 'pulse',
          show_connections: false,
          show_attribution: false
        }
      };

      expect(minimalThreat.id).toBeTruthy();
      expect(minimalThreat.type).toBe('CyberThreats');
      expect(typeof minimalThreat.subcategory).toBe('undefined');
      expect(typeof minimalThreat.threat_actor).toBe('undefined');
      expect(typeof minimalThreat.peak_activity).toBe('undefined');
    });
  });

  // =============================================================================
  // THREAT ACTOR VALIDATION
  // =============================================================================

  describe('ThreatActor Structure', () => {
    it('should create valid ThreatActor object', () => {
      const actor: ThreatActor = {
        id: 'actor_001',
        name: 'APT29',
        aliases: ['Cozy Bear', 'The Dukes'],
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
        last_activity: new Date('2025-01-15')
      };

      expect(actor.id).toBe('actor_001');
      expect(actor.name).toBe('APT29');
      expect(Array.isArray(actor.aliases)).toBe(true);
      expect(actor.aliases).toContain('Cozy Bear');
      expect(actor.type).toBe('NationState');
      expect(actor.sophistication).toBe('Expert');
      expect(actor.attribution.confidence).toBe('High');
      expect(Array.isArray(actor.motivations)).toBe(true);
      expect(Array.isArray(actor.techniques)).toBe(true);
      expect(Array.isArray(actor.targets)).toBe(true);
    });
  });

  // =============================================================================
  // IOC VALIDATION
  // =============================================================================

  describe('IOC (Indicators of Compromise)', () => {
    it('should validate IOC types', () => {
      const iocTypes: IOCType[] = [
        'domain',
        'ip_address',
        'url',
        'file_hash',
        'email',
        'registry_key',
        'mutex',
        'certificate',
        'user_agent',
        'filename'
      ];

      iocTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type).toBeTruthy();
      });

      expect(iocTypes).toHaveLength(10);
    });

    it('should create valid IOC objects', () => {
      const ioc: IOC = {
        id: 'ioc_001',
        type: 'domain',
        value: 'malicious-domain.com',
        description: 'C2 domain for APT campaign',
        confidence: 'High',
        first_seen: new Date('2025-01-01'),
        last_seen: new Date('2025-01-15'),
        malware_families: ['TrickBot'],
        campaigns: ['camp_001'],
        threat_actors: ['actor_001'],
        tags: ['c2', 'banking', 'trojan'],
        source: {
          provider: 'VirusTotal',
          report_id: 'vt_123456',
          url: 'https://virustotal.com/report/123456'
        }
      };

      expect(ioc.id).toBe('ioc_001');
      expect(ioc.type).toBe('domain');
      expect(ioc.value).toBe('malicious-domain.com');
      expect(ioc.confidence).toBe('High');
      expect(Array.isArray(ioc.tags)).toBe(true);
      expect(typeof ioc.source).toBe('object');
    });
  });

  // =============================================================================
  // MALWARE FAMILY VALIDATION
  // =============================================================================

  describe('MalwareFamily Structure', () => {
    it('should validate malware types', () => {
      const malwareTypes: MalwareType[] = [
        'Virus',
        'Worm',
        'Trojan',
        'Ransomware',
        'Spyware',
        'Adware',
        'Rootkit',
        'Backdoor',
        'Dropper',
        'Loader',
        'RAT',
        'Banking',
        'Cryptominer',
        'Botnet',
        'Unknown'
      ];

      malwareTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type).toBeTruthy();
      });

      expect(malwareTypes).toHaveLength(15);
    });

    it('should create valid MalwareFamily object', () => {
      const malwareFamily: MalwareFamily = {
        id: 'mf_001',
        name: 'TrickBot',
        aliases: ['TrickLoader', 'TheTrick'],
        family_type: 'Banking',
        description: 'Banking trojan with modular architecture',
        capabilities: ['credential_theft', 'screen_capture', 'lateral_movement'],
        platforms: ['Windows'],
        first_seen: new Date('2016-10-01'),
        last_seen: new Date('2025-01-15'),
        threat_actors: ['actor_001'],
        campaigns: ['camp_001'],
        techniques: ['T1055', 'T1547'],
        variants: [{
          id: 'variant_001',
          name: 'TrickBot v2.3',
          hash: 'sha256:abc123...',
          size: 1024000,
          first_seen: new Date('2025-01-01'),
          capabilities: ['credential_theft'],
          c2_servers: ['c2.malicious.com']
        }]
      };

      expect(malwareFamily.id).toBe('mf_001');
      expect(malwareFamily.name).toBe('TrickBot');
      expect(malwareFamily.family_type).toBe('Banking');
      expect(Array.isArray(malwareFamily.aliases)).toBe(true);
      expect(Array.isArray(malwareFamily.capabilities)).toBe(true);
      expect(Array.isArray(malwareFamily.variants)).toBe(true);
      expect(malwareFamily.variants[0].hash).toContain('sha256:');
    });
  });

  // =============================================================================
  // QUERY OPTIONS VALIDATION
  // =============================================================================

  describe('ThreatQueryOptions', () => {
    it('should create valid query options object', () => {
      const queryOptions: ThreatQueryOptions = {
        categories: ['APT', 'Malware'],
        sophistication: ['Advanced', 'Expert'],
        confidence: ['High', 'Confirmed'],
        status: ['Active'],
        actor_types: ['NationState'],
        actor_countries: ['CN', 'RU'],
        source_countries: ['CN'],
        target_countries: ['US'],
        target_sectors: ['Financial'],
        time_window: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31')
        },
        first_seen_after: new Date('2025-01-01'),
        last_seen_before: new Date('2025-01-31'),
        severity_min: 5,
        severity_max: 10,
        malware_types: ['Banking', 'RAT'],
        techniques: ['T1566', 'T1055'],
        campaigns: ['camp_001'],
        limit: 50,
        offset: 0,
        sort_by: 'severity',
        sort_order: 'desc',
        include_related: true,
        max_relationship_depth: 2
      };

      expect(Array.isArray(queryOptions.categories)).toBe(true);
      expect(Array.isArray(queryOptions.sophistication)).toBe(true);
      expect(typeof queryOptions.time_window).toBe('object');
      expect(queryOptions.severity_min).toBe(5);
      expect(queryOptions.severity_max).toBe(10);
      expect(queryOptions.limit).toBe(50);
      expect(queryOptions.sort_by).toBe('severity');
      expect(queryOptions.sort_order).toBe('desc');
    });
  });

  // =============================================================================
  // STREAMING EVENT VALIDATION
  // =============================================================================

  describe('ThreatStreamEvent', () => {
    it('should validate threat event types', () => {
      const eventTypes: ThreatEventType[] = [
        'new_threat',
        'threat_update',
        'threat_escalation',
        'threat_attribution',
        'threat_neutralized',
        'ioc_update',
        'campaign_update',
        'feed_error'
      ];

      eventTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type).toBeTruthy();
      });

      expect(eventTypes).toHaveLength(8);
    });

    it('should create valid ThreatStreamEvent', () => {
      const mockThreatData: CyberThreatData = {
        id: 'threat_stream',
        type: 'CyberThreats',
        location: { latitude: 0, longitude: 0 },
        timestamp: new Date(),
        metadata: {},
        priority: 'high',
        threat_id: 'TH-STREAM-001',
        category: 'APT',
        name: 'Stream Test Threat',
        description: 'Test threat for streaming',
        severity: 7,
        confidence: 'High',
        status: 'Active',
        sophistication: 'Advanced',
        campaigns: [],
        malware_families: [],
        iocs: [],
        techniques: [],
        source_countries: [],
        target_countries: [],
        target_sectors: [],
        target_organizations: [],
        first_seen: new Date(),
        last_seen: new Date(),
        impact_assessment: { scope: 'Limited', affected_systems: 1 },
        sources: [],
        related_threats: [],
        child_threats: [],
        visualization_data: {
          color: '#ff0000',
          intensity: 0.7,
          animation_type: 'pulse',
          show_connections: true,
          show_attribution: true
        }
      };

      const streamEvent: ThreatStreamEvent = {
        event_type: 'new_threat',
        threat_data: mockThreatData,
        timestamp: new Date(),
        source_feed: 'test_feed',
        metadata: {
          correlation_id: 'corr_001',
          confidence_change: 0.1,
          severity_change: 1,
          new_iocs: ['ioc_001'],
          updated_fields: ['severity', 'confidence']
        }
      };

      expect(streamEvent.event_type).toBe('new_threat');
      expect(streamEvent.threat_data.threat_id).toBe('TH-STREAM-001');
      expect(streamEvent.source_feed).toBe('test_feed');
      expect(streamEvent.metadata?.correlation_id).toBe('corr_001');
      expect(Array.isArray(streamEvent.metadata?.new_iocs)).toBe(true);
    });
  });

  // =============================================================================
  // CORRELATION AND ANALYSIS
  // =============================================================================

  describe('Threat Correlation', () => {
    it('should validate correlation types', () => {
      const correlationTypes: CorrelationType[] = [
        'same_actor',
        'same_campaign',
        'same_malware',
        'same_infrastructure',
        'same_targets',
        'same_techniques',
        'temporal_proximity',
        'geographic_proximity'
      ];

      correlationTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type).toBeTruthy();
      });

      expect(correlationTypes).toHaveLength(8);
    });

    it('should create valid ThreatCorrelation object', () => {
      const correlation: ThreatCorrelation = {
        primary_threat: 'threat_001',
        related_threats: [{
          threat_id: 'threat_002',
          correlation_type: 'same_actor',
          confidence: 'High',
          shared_attributes: ['actor_id', 'techniques']
        }],
        correlation_score: 0.85,
        analysis_timestamp: new Date()
      };

      expect(correlation.primary_threat).toBe('threat_001');
      expect(Array.isArray(correlation.related_threats)).toBe(true);
      expect(correlation.correlation_score).toBe(0.85);
      expect(correlation.related_threats[0].correlation_type).toBe('same_actor');
    });
  });

  // =============================================================================
  // VISUALIZATION DATA
  // =============================================================================

  describe('Visualization Structures', () => {
    it('should create valid ThreatHeatMapPoint', () => {
      const heatPoint: ThreatHeatMapPoint = {
        location: { latitude: 40.7128, longitude: -74.0060 },
        threat_density: 0.75,
        threat_categories: ['APT', 'Malware'],
        active_threats: 25,
        avg_severity: 7.2,
        dominant_actor_type: 'NationState'
      };

      expect(typeof heatPoint.location).toBe('object');
      expect(heatPoint.threat_density).toBe(0.75);
      expect(Array.isArray(heatPoint.threat_categories)).toBe(true);
      expect(heatPoint.active_threats).toBe(25);
      expect(heatPoint.avg_severity).toBe(7.2);
    });

    it('should create valid C2NetworkData', () => {
      const c2Network: C2NetworkData = {
        nodes: [{
          id: 'node_001',
          type: 'c2_server',
          location: { latitude: 55.7558, longitude: 37.6173 },
          ip_address: '192.168.1.100',
          domain: 'c2.malicious.com',
          first_seen: new Date('2025-01-01'),
          last_seen: new Date('2025-01-15'),
          status: 'active',
          malware_families: ['TrickBot'],
          threat_actors: ['actor_001']
        }],
        connections: [{
          source_id: 'node_001',
          target_id: 'node_002',
          connection_type: 'command',
          protocol: 'HTTPS',
          port: 443,
          first_seen: new Date('2025-01-01'),
          last_seen: new Date('2025-01-15'),
          volume: 1024000,
          confidence: 'High'
        }],
        campaigns: ['camp_001'],
        discovery_date: new Date('2025-01-01'),
        last_update: new Date('2025-01-15')
      };

      expect(Array.isArray(c2Network.nodes)).toBe(true);
      expect(Array.isArray(c2Network.connections)).toBe(true);
      expect(c2Network.nodes[0].type).toBe('c2_server');
      expect(c2Network.connections[0].connection_type).toBe('command');
    });
  });

  // =============================================================================
  // FEED CONFIGURATION
  // =============================================================================

  describe('Threat Feed Configuration', () => {
    it('should validate feed types', () => {
      const feedTypes: ThreatFeedType[] = [
        'Commercial',
        'Government',
        'OpenSource',
        'Industry',
        'Internal'
      ];

      feedTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type).toBeTruthy();
      });

      expect(feedTypes).toHaveLength(5);
    });

    it('should create valid ThreatFeedConfig', () => {
      const feedConfig: ThreatFeedConfig = {
        id: 'feed_001',
        name: 'CrowdStrike Intel',
        type: 'Commercial',
        provider: 'CrowdStrike',
        url: 'https://api.crowdstrike.com/intel',
        api_key: 'secret_key_123',
        update_interval: 15,
        enabled: true,
        priority: 8,
        categories: ['APT', 'Malware'],
        last_update: new Date(),
        error_count: 0
      };

      expect(feedConfig.id).toBe('feed_001');
      expect(feedConfig.type).toBe('Commercial');
      expect(feedConfig.update_interval).toBe(15);
      expect(feedConfig.enabled).toBe(true);
      expect(feedConfig.priority).toBe(8);
      expect(Array.isArray(feedConfig.categories)).toBe(true);
    });
  });

  // =============================================================================
  // UTILITY TYPES
  // =============================================================================

  describe('Utility Types', () => {
    it('should validate TimeWindow structure', () => {
      const timeWindow: TimeWindow = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31')
      };

      expect(timeWindow.start instanceof Date).toBe(true);
      expect(timeWindow.end instanceof Date).toBe(true);
      expect(timeWindow.start.getTime()).toBeLessThan(timeWindow.end.getTime());
    });

    it('should validate CreateThreatData helper type', () => {
      const createData: CreateThreatData = {
        threat_id: 'TH-CREATE-001',
        category: 'Malware',
        name: 'Test Threat',
        description: 'Test description',
        severity: 6,
        confidence: 'Medium',
        status: 'Active',
        sophistication: 'Intermediate',
        campaigns: [],
        malware_families: [],
        iocs: [],
        techniques: [],
        source_countries: [],
        target_countries: [],
        target_sectors: [],
        target_organizations: [],
        first_seen: new Date(),
        last_seen: new Date(),
        impact_assessment: { scope: 'Limited', affected_systems: 1 },
        sources: [],
        related_threats: [],
        child_threats: [],
        visualization_data: {
          color: '#000000',
          intensity: 0.5,
          animation_type: 'pulse',
          show_connections: false,
          show_attribution: false
        },
        location: { latitude: 0, longitude: 0 },
        metadata: {},
        priority: 'medium'
      };

      // Should work without id, type, timestamp as they're optional
      expect(createData.threat_id).toBe('TH-CREATE-001');
      expect(createData.category).toBe('Malware');
      expect(typeof createData.id).toBe('undefined');
      expect(typeof createData.type).toBe('undefined');
      expect(typeof createData.timestamp).toBe('undefined');
    });

    it('should validate ThreatBatch structure', () => {
      const batch: ThreatBatch = {
        batch_id: 'batch_001',
        threats: [],
        processing_status: 'complete',
        created_at: new Date(),
        processed_at: new Date(),
        errors: []
      };

      expect(batch.batch_id).toBe('batch_001');
      expect(Array.isArray(batch.threats)).toBe(true);
      expect(batch.processing_status).toBe('complete');
      expect(batch.created_at instanceof Date).toBe(true);
      expect(Array.isArray(batch.errors)).toBe(true);
    });
  });
});
