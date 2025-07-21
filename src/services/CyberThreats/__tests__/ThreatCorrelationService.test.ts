/**
 * ThreatCorrelationService Tests
 * Week 3 Day 4: Comprehensive test suite for real-time threat correlation
 * 
 * Tests:
 * - Cross-threat relationship analysis
 * - Network effect modeling
 * - Temporal correlation patterns
 * - Campaign attribution tracking
 * - Real-time correlation updates
 * - Correlation rule engine
 * - Performance and scalability
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { 
  ThreatCorrelationService,
  type ThreatCorrelation,
  type ThreatNetwork,
  type CorrelationRule,
  type RealTimeCorrelationUpdate,
  type CorrelationAnalysisResult,
  type CorrelationType
} from '../ThreatCorrelationService';

import type {
  CyberThreatData,
  ConfidenceLevel,
  ThreatActor,
  IOC
} from '../../../types/CyberThreats';

import type { GeoCoordinate } from '../../../types/CyberCommandVisualization';

// =============================================================================
// TEST DATA HELPERS
// =============================================================================

function createMockThreatActor(overrides: Partial<ThreatActor> = {}): ThreatActor {
  return {
    id: `actor_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test APT Group',
    aliases: ['Test Group'],
    type: 'NationState',
    sophistication: 'Advanced',
    attribution: {
      country: 'Unknown',
      confidence: 'Medium'
    },
    motivations: ['Espionage'],
    techniques: ['T1566.001'],
    targets: ['Technology'],
    first_seen: new Date('2024-01-01T00:00:00Z'),
    last_activity: new Date('2024-06-01T00:00:00Z'),
    ...overrides
  };
}

function createMockIOC(overrides: Partial<IOC> = {}): IOC {
  return {
    id: `ioc_${Math.random().toString(36).substr(2, 9)}`,
    type: 'ip_address',
    value: '192.168.1.1',
    confidence: 'Medium' as ConfidenceLevel,
    first_seen: new Date('2024-01-15T10:00:00Z'),
    last_seen: new Date('2024-01-15T12:00:00Z'),
    tags: ['test'],
    source: {
      provider: 'Test Provider'
    },
    ...overrides
  };
}

function createMockThreat(overrides: Partial<CyberThreatData> = {}): CyberThreatData {
  const defaults: CyberThreatData = {
    id: `threat_${Math.random().toString(36).substr(2, 9)}`,
    type: 'CyberThreats',
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    } as GeoCoordinate,
    timestamp: new Date('2024-01-15T10:00:00Z'),
    metadata: {},
    priority: 'medium',
    threat_id: `threat_${Math.random().toString(36).substr(2, 9)}`,
    category: 'Malware',
    name: 'Mock Cyber Threat',
    description: 'Test threat for correlation analysis',
    severity: 5,
    confidence: 'Medium' as ConfidenceLevel,
    status: 'Active',
    sophistication: 'Intermediate',
    campaigns: ['campaign_001'],
    malware_families: ['TestMalware'],
    iocs: [createMockIOC()],
    techniques: ['T1566.001'],
    source_countries: ['US'],
    target_countries: ['US'],
    target_sectors: ['Technology'],
    target_organizations: ['Test Corp'],
    first_seen: new Date('2024-01-15T10:00:00Z'),
    last_seen: new Date('2024-01-15T12:00:00Z'),
    impact_assessment: {
      scope: 'Limited',
      affected_systems: 10
    },
    sources: [{
      provider: 'Test Intelligence',
      feed_name: 'Test Feed',
      confidence: 'Medium' as ConfidenceLevel,
      timestamp: new Date('2024-01-15T10:00:00Z'),
      classification: 'TLP:White'
    }],
    related_threats: [],
    child_threats: [],
    visualization_data: {
      color: '#ff0000',
      intensity: 0.5,
      animation_type: 'pulse',
      show_connections: true,
      show_attribution: true
    }
  };

  return { ...defaults, ...overrides };
}

function createCorrelatedThreats(): CyberThreatData[] {
  const actor = createMockThreatActor({ id: 'apt_001', name: 'APT Test Group' });
  const sharedIOC = createMockIOC({ value: '192.168.1.100', type: 'ip_address' });
  
  return [
    // Same actor, same IOC
    createMockThreat({
      id: 'threat_001',
      name: 'Threat 1',
      threat_actor: actor,
      iocs: [sharedIOC, createMockIOC({ value: '192.168.1.101' })],
      techniques: ['T1566.001', 'T1059.001'],
      malware_families: ['APTMalware'],
      location: { latitude: 40.7128, longitude: -74.0060 },
      first_seen: new Date('2024-01-15T10:00:00Z'),
      campaigns: ['campaign_alpha']
    }),
    
    // Same actor, shared IOC, different location
    createMockThreat({
      id: 'threat_002',
      name: 'Threat 2',
      threat_actor: actor,
      iocs: [sharedIOC, createMockIOC({ value: '192.168.1.102' })],
      techniques: ['T1566.001', 'T1055'],
      malware_families: ['APTMalware'],
      location: { latitude: 40.7589, longitude: -73.9851 }, // Near NYC
      first_seen: new Date('2024-01-15T11:00:00Z'),
      campaigns: ['campaign_alpha']
    }),
    
    // Different actor, no shared IOCs
    createMockThreat({
      id: 'threat_003',
      name: 'Threat 3',
      threat_actor: createMockThreatActor({ id: 'apt_002', name: 'Different APT' }),
      iocs: [createMockIOC({ value: '10.0.0.1' })],
      techniques: ['T1190'],
      malware_families: ['DifferentMalware'],
      location: { latitude: 51.5074, longitude: -0.1278 }, // London
      first_seen: new Date('2024-01-16T10:00:00Z'),
      campaigns: ['campaign_beta']
    }),
    
    // Geographically close to threat_001, similar timing
    createMockThreat({
      id: 'threat_004',
      name: 'Threat 4',
      threat_actor: createMockThreatActor({ id: 'apt_003', name: 'Regional Group' }),
      iocs: [createMockIOC({ value: '172.16.0.1' })],
      techniques: ['T1566.001'], // Shared technique
      malware_families: ['RegionalMalware'],
      location: { latitude: 40.6892, longitude: -74.0445 }, // Very close to threat_001
      first_seen: new Date('2024-01-15T12:30:00Z'), // 30 min after threat_001 ends
      last_seen: new Date('2024-01-15T13:30:00Z'), // Sequential, not overlapping
      campaigns: ['campaign_gamma']
    }),
    
    // Same malware family as threat_001
    createMockThreat({
      id: 'threat_005',
      name: 'Threat 5',
      threat_actor: createMockThreatActor({ id: 'apt_004', name: 'Related Group' }),
      iocs: [createMockIOC({ value: '203.0.113.1' })],
      techniques: ['T1059.001'], // Shared technique with threat_001
      malware_families: ['APTMalware'], // Same as threat_001, threat_002
      location: { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
      first_seen: new Date('2024-01-15T14:00:00Z'),
      campaigns: ['campaign_delta']
    })
  ];
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('ThreatCorrelationService', () => {
  let service: ThreatCorrelationService;
  let testThreats: CyberThreatData[];

  beforeEach(() => {
    service = new ThreatCorrelationService();
    testThreats = createCorrelatedThreats();
  });

  afterEach(() => {
    service.clearCache();
  });

  // =============================================================================
  // BASIC CORRELATION TESTS
  // =============================================================================

  describe('Basic Correlation Analysis', () => {
    it('should analyze correlations for a single threat', async () => {
      const threat = testThreats[0];
      const candidateThreats = testThreats.slice(1);
      
      const result = await service.analyzeThreatCorrelations(threat);
      
      expect(result).toHaveProperty('threat_id', threat.id);
      expect(result).toHaveProperty('correlations');
      expect(result).toHaveProperty('network_memberships');
      expect(result).toHaveProperty('risk_score');
      expect(result).toHaveProperty('attribution_confidence');
      expect(result).toHaveProperty('recommended_actions');
      expect(result).toHaveProperty('analysis_timestamp');
      
      expect(result.correlations).toBeInstanceOf(Array);
      expect(result.risk_score).toBeGreaterThanOrEqual(0);
      expect(result.risk_score).toBeLessThanOrEqual(1);
      expect(result.attribution_confidence).toBeGreaterThanOrEqual(0);
      expect(result.attribution_confidence).toBeLessThanOrEqual(1);
      expect(result.recommended_actions).toBeInstanceOf(Array);
    });

    it('should find correlations between threats with same actor', async () => {
      const threat1 = testThreats[0]; // APT Test Group
      const threat2 = testThreats[1]; // Same APT Test Group
      
      const correlations = await service.findCorrelations(threat1, [threat2]);
      
      expect(correlations.length).toBeGreaterThan(0);
      
      const actorCorrelation = correlations.find(c => c.correlation_type === 'same_actor');
      expect(actorCorrelation).toBeDefined();
      expect(actorCorrelation!.confidence_score).toBeGreaterThan(0.7);
      expect(actorCorrelation!.evidence.some(e => e.type === 'attribution_link')).toBe(true);
    });

    it('should find correlations between threats with shared IOCs', async () => {
      const threat1 = testThreats[0]; // Has 192.168.1.100
      const threat2 = testThreats[1]; // Also has 192.168.1.100
      
      const correlations = await service.findCorrelations(threat1, [threat2]);
      
      const iocCorrelation = correlations.find(c => c.correlation_type === 'ioc_overlap');
      expect(iocCorrelation).toBeDefined();
      expect(iocCorrelation!.confidence_score).toBeGreaterThan(0.5);
      expect(iocCorrelation!.evidence.some(e => e.type === 'shared_ioc')).toBe(true);
    });

    it('should find correlations between geographically proximate threats', async () => {
      const threat1 = testThreats[0]; // NYC area
      const threat4 = testThreats[3]; // Very close to NYC
      
      const correlations = await service.findCorrelations(threat1, [threat4]);
      
      const geoCorrelation = correlations.find(c => c.correlation_type === 'geographic_proximity');
      expect(geoCorrelation).toBeDefined();
      expect(geoCorrelation!.geographic_overlap).toBeDefined();
      expect(geoCorrelation!.geographic_overlap!.distance_km).toBeLessThan(100);
    });

    it('should find correlations between threats with similar techniques', async () => {
      const threat1 = testThreats[0]; // Has T1566.001
      const threat4 = testThreats[3]; // Also has T1566.001
      
      const correlations = await service.findCorrelations(threat1, [threat4]);
      
      const techniqueCorrelation = correlations.find(c => c.correlation_type === 'technique_similarity');
      expect(techniqueCorrelation).toBeDefined();
      expect(techniqueCorrelation!.evidence.some(e => e.type === 'similar_ttp')).toBe(true);
    });

    it('should not correlate unrelated threats', async () => {
      const threat1 = testThreats[0]; // APT Test Group in NYC
      const threat3 = testThreats[2]; // Different APT in London, no shared IOCs
      
      const correlations = await service.findCorrelations(threat1, [threat3]);
      
      // Should have minimal or no strong correlations
      const strongCorrelations = correlations.filter(c => c.confidence_score > 0.7);
      expect(strongCorrelations.length).toBe(0);
    });
  });

  // =============================================================================
  // CORRELATION DETAIL TESTS
  // =============================================================================

  describe('Correlation Detail Analysis', () => {
    it('should calculate geographic overlap correctly', async () => {
      const threat1 = testThreats[0]; // NYC
      const threat4 = testThreats[3]; // Near NYC
      
      const correlations = await service.findCorrelations(threat1, [threat4]);
      const geoCorrelation = correlations.find(c => c.geographic_overlap);
      
      expect(geoCorrelation?.geographic_overlap).toBeDefined();
      expect(geoCorrelation!.geographic_overlap!.distance_km).toBeLessThan(50);
      expect(geoCorrelation!.geographic_overlap!.overlap_type).toBe('proximity');
    });

    it('should calculate temporal overlap correctly', async () => {
      const threat1 = testThreats[0]; // 10:00:00Z
      const threat4 = testThreats[3]; // 10:30:00Z (30 min later)
      
      const correlations = await service.findCorrelations(threat1, [threat4]);
      const temporalCorrelation = correlations.find(c => c.temporal_overlap);
      
      expect(temporalCorrelation?.temporal_overlap).toBeDefined();
      expect(temporalCorrelation!.temporal_overlap!.time_gap_hours).toBe(0.5);
      expect(temporalCorrelation!.temporal_overlap!.overlap_type).toBe('sequential');
    });

    it('should calculate technical overlap correctly', async () => {
      const threat1 = testThreats[0]; // APTMalware, T1566.001, T1059.001
      const threat2 = testThreats[1]; // APTMalware, T1566.001, T1055
      
      const correlations = await service.findCorrelations(threat1, [threat2]);
      const correlation = correlations[0];
      
      expect(correlation.technical_overlap).toBeDefined();
      expect(correlation.technical_overlap!.shared_malware_families).toContain('APTMalware');
      expect(correlation.technical_overlap!.shared_techniques).toContain('T1566.001');
      expect(correlation.technical_overlap!.technique_similarity_score).toBeGreaterThan(0);
    });

    it('should provide evidence for correlations', async () => {
      const threat1 = testThreats[0];
      const threat2 = testThreats[1];
      
      const correlations = await service.findCorrelations(threat1, [threat2]);
      
      correlations.forEach(correlation => {
        expect(correlation.evidence).toBeInstanceOf(Array);
        expect(correlation.evidence.length).toBeGreaterThan(0);
        
        correlation.evidence.forEach(evidence => {
          expect(evidence).toHaveProperty('type');
          expect(evidence).toHaveProperty('description');
          expect(evidence).toHaveProperty('confidence');
          expect(evidence).toHaveProperty('data_points');
          expect(evidence).toHaveProperty('source');
          expect(evidence).toHaveProperty('timestamp');
          
          expect(['shared_ioc', 'similar_ttp', 'geographic_pattern', 'temporal_pattern', 
                   'infrastructure_link', 'attribution_link', 'target_pattern', 'technical_signature'])
            .toContain(evidence.type);
        });
      });
    });
  });

  // =============================================================================
  // THREAT NETWORK TESTS
  // =============================================================================

  describe('Threat Network Building', () => {
    it('should build threat networks from correlated threats', async () => {
      const networks = await service.buildThreatNetworks(testThreats);
      
      expect(networks).toBeInstanceOf(Array);
      expect(networks.length).toBeGreaterThan(0);
      
      networks.forEach(network => {
        expect(network).toHaveProperty('id');
        expect(network).toHaveProperty('name');
        expect(network).toHaveProperty('threats');
        expect(network).toHaveProperty('correlations');
        expect(network).toHaveProperty('network_type');
        expect(network).toHaveProperty('confidence_score');
        expect(network).toHaveProperty('campaign_timeline');
        expect(network).toHaveProperty('geographic_footprint');
        expect(network).toHaveProperty('impact_assessment');
        
        expect(network.threats.length).toBeGreaterThanOrEqual(2);
        expect(network.confidence_score).toBeGreaterThanOrEqual(0);
        expect(network.confidence_score).toBeLessThanOrEqual(1);
        expect(['campaign', 'actor_group', 'infrastructure', 'supply_chain', 
                 'botnet', 'apt_family', 'ransomware', 'commodity']).toContain(network.network_type);
      });
    });

    it('should determine network type correctly', async () => {
      const networks = await service.buildThreatNetworks(testThreats);
      
      // Should identify actor group networks
      const actorGroupNetwork = networks.find(n => n.network_type === 'actor_group');
      expect(actorGroupNetwork).toBeDefined();
    });

    it('should calculate campaign timeline', async () => {
      const networks = await service.buildThreatNetworks(testThreats);
      const network = networks[0];
      
      expect(network.campaign_timeline).toBeInstanceOf(Array);
      expect(network.campaign_timeline.length).toBeGreaterThan(0);
      
      // Timeline should be chronologically ordered
      for (let i = 1; i < network.campaign_timeline.length; i++) {
        expect(network.campaign_timeline[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(network.campaign_timeline[i-1].timestamp.getTime());
      }
    });

    it('should calculate geographic footprint', async () => {
      const networks = await service.buildThreatNetworks(testThreats);
      const network = networks[0];
      
      expect(network.geographic_footprint).toBeInstanceOf(Array);
      network.geographic_footprint.forEach(coord => {
        expect(coord).toHaveProperty('latitude');
        expect(coord).toHaveProperty('longitude');
        expect(typeof coord.latitude).toBe('number');
        expect(typeof coord.longitude).toBe('number');
      });
    });

    it('should calculate network impact assessment', async () => {
      const networks = await service.buildThreatNetworks(testThreats);
      const network = networks[0];
      
      expect(network.impact_assessment).toHaveProperty('total_targets');
      expect(network.impact_assessment).toHaveProperty('affected_countries');
      expect(network.impact_assessment).toHaveProperty('affected_sectors');
      expect(network.impact_assessment).toHaveProperty('threat_level');
      
      expect(network.impact_assessment.total_targets).toBeGreaterThanOrEqual(0);
      expect(network.impact_assessment.affected_countries).toBeInstanceOf(Array);
      expect(network.impact_assessment.affected_sectors).toBeInstanceOf(Array);
      expect(['low', 'medium', 'high', 'critical']).toContain(network.impact_assessment.threat_level);
    });
  });

  // =============================================================================
  // CORRELATION RULES TESTS
  // =============================================================================

  describe('Correlation Rules Engine', () => {
    it('should have default correlation rules', () => {
      const rules = service.getCorrelationRules();
      
      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      
      rules.forEach(rule => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('rule_type');
        expect(rule).toHaveProperty('conditions');
        expect(rule).toHaveProperty('weight');
        expect(rule).toHaveProperty('threshold');
        expect(rule).toHaveProperty('enabled');
        
        expect(rule.weight).toBeGreaterThan(0);
        expect(rule.weight).toBeLessThanOrEqual(1);
        expect(rule.threshold).toBeGreaterThanOrEqual(0);
        expect(rule.threshold).toBeLessThanOrEqual(1);
      });
    });

    it('should allow adding custom correlation rules', () => {
      const customRule: CorrelationRule = {
        id: 'custom_rule_001',
        name: 'Custom Test Rule',
        description: 'Test rule for correlation',
        rule_type: 'target_overlap',
        conditions: [
          { field: 'target_sectors', operator: 'contains', value: 'Technology', weight: 1.0 }
        ],
        weight: 0.7,
        threshold: 0.6,
        enabled: true,
        created: new Date(),
        last_modified: new Date()
      };
      
      service.addCorrelationRule(customRule);
      const rules = service.getCorrelationRules();
      
      expect(rules.find(r => r.id === 'custom_rule_001')).toBeDefined();
    });

    it('should allow updating correlation rules', () => {
      const rules = service.getCorrelationRules();
      const firstRule = rules[0];
      
      const success = service.updateCorrelationRule(firstRule.id, { enabled: false });
      expect(success).toBe(true);
      
      const updatedRules = service.getCorrelationRules();
      const updatedRule = updatedRules.find(r => r.id === firstRule.id);
      expect(updatedRule?.enabled).toBe(false);
    });

    it('should return false for non-existent rule updates', () => {
      const success = service.updateCorrelationRule('non_existent_rule', { enabled: false });
      expect(success).toBe(false);
    });
  });

  // =============================================================================
  // REAL-TIME PROCESSING TESTS
  // =============================================================================

  describe('Real-time Processing', () => {
    it('should process real-time threat updates', async () => {
      const newThreats = [createMockThreat({ id: 'new_threat_001' })];
      
      return new Promise<void>((resolve) => {
        const unsubscribe = service.subscribeToUpdates((update: RealTimeCorrelationUpdate) => {
          expect(update).toHaveProperty('timestamp');
          expect(update).toHaveProperty('new_correlations');
          expect(update).toHaveProperty('updated_correlations');
          expect(update).toHaveProperty('new_networks');
          expect(update).toHaveProperty('updated_networks');
          expect(update).toHaveProperty('correlation_stats');
          
          expect(update.correlation_stats).toHaveProperty('total_correlations');
          expect(update.correlation_stats).toHaveProperty('high_confidence_correlations');
          expect(update.correlation_stats).toHaveProperty('active_networks');
          expect(update.correlation_stats).toHaveProperty('processing_latency_ms');
          
          unsubscribe();
          resolve();
        });
        
        service.processRealTimeUpdate(newThreats);
      });
    });

    it('should allow subscribing and unsubscribing to updates', () => {
      let callbackInvoked = false;
      
      const unsubscribe = service.subscribeToUpdates(() => {
        callbackInvoked = true;
      });
      
      // Unsubscribe immediately
      unsubscribe();
      
      // Process update - callback should not be invoked
      service.processRealTimeUpdate([createMockThreat()]);
      
      // Wait a bit and check
      setTimeout(() => {
        expect(callbackInvoked).toBe(false);
      }, 100);
    });
  });

  // =============================================================================
  // API ACCESS TESTS
  // =============================================================================

  describe('API Access Methods', () => {
    beforeEach(async () => {
      // Set up some correlations
      await service.findCorrelations(testThreats[0], testThreats.slice(1));
      service.buildThreatNetworks(testThreats);
    });

    it('should retrieve correlations for specific threats', () => {
      const correlations = service.getThreatCorrelations(testThreats[0].id);
      
      expect(correlations).toBeInstanceOf(Array);
      correlations.forEach(correlation => {
        expect(correlation.primary_threat_id).toBe(testThreats[0].id);
      });
    });

    it('should retrieve all networks', () => {
      const networks = service.getAllNetworks();
      
      expect(networks).toBeInstanceOf(Array);
      networks.forEach(network => {
        expect(network).toHaveProperty('id');
        expect(network).toHaveProperty('threats');
        expect(network).toHaveProperty('network_type');
      });
    });

    it('should retrieve specific networks by ID', () => {
      const allNetworks = service.getAllNetworks();
      if (allNetworks.length > 0) {
        const networkId = allNetworks[0].id;
        const network = service.getNetwork(networkId);
        
        expect(network).toBeDefined();
        expect(network!.id).toBe(networkId);
      }
    });

    it('should return undefined for non-existent networks', () => {
      const network = service.getNetwork('non_existent_network_id');
      expect(network).toBeUndefined();
    });

    it('should provide correlation statistics', () => {
      const stats = service.getCorrelationStats();
      
      expect(stats).toHaveProperty('total_correlations');
      expect(stats).toHaveProperty('high_confidence_correlations');
      expect(stats).toHaveProperty('active_networks');
      expect(stats).toHaveProperty('avg_network_size');
      
      expect(typeof stats.total_correlations).toBe('number');
      expect(typeof stats.high_confidence_correlations).toBe('number');
      expect(typeof stats.active_networks).toBe('number');
      expect(typeof stats.avg_network_size).toBe('number');
      
      expect(stats.total_correlations).toBeGreaterThanOrEqual(0);
      expect(stats.high_confidence_correlations).toBeLessThanOrEqual(stats.total_correlations);
    });
  });

  // =============================================================================
  // CACHE MANAGEMENT TESTS
  // =============================================================================

  describe('Cache Management', () => {
    it('should clear all cached data', async () => {
      // Build up some cached data
      await service.findCorrelations(testThreats[0], testThreats.slice(1));
      service.buildThreatNetworks(testThreats);
      
      // Verify we have data
      expect(service.getThreatCorrelations(testThreats[0].id).length).toBeGreaterThan(0);
      expect(service.getAllNetworks().length).toBeGreaterThan(0);
      
      // Clear cache
      service.clearCache();
      
      // Verify data is cleared
      expect(service.getThreatCorrelations(testThreats[0].id).length).toBe(0);
      expect(service.getAllNetworks().length).toBe(0);
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('Performance', () => {
    it('should handle large correlation analysis efficiently', async () => {
      // Generate large dataset
      const largeDataset: CyberThreatData[] = [];
      for (let i = 0; i < 100; i++) {
        largeDataset.push(createMockThreat({
          id: `threat_${i}`,
          location: {
            latitude: -90 + Math.random() * 180,
            longitude: -180 + Math.random() * 360
          }
        }));
      }
      
      const startTime = performance.now();
      const correlations = await service.findCorrelations(largeDataset[0], largeDataset.slice(1));
      const endTime = performance.now();
      
      // Should complete within reasonable time (less than 5 seconds)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000);
      
      expect(correlations).toBeInstanceOf(Array);
    });

    it('should handle network building for large datasets efficiently', () => {
      // Generate dataset with some correlations
      const dataset: CyberThreatData[] = [];
      const sharedActor = createMockThreatActor();
      
      for (let i = 0; i < 50; i++) {
        dataset.push(createMockThreat({
          id: `threat_${i}`,
          threat_actor: i < 25 ? sharedActor : undefined // Half share the same actor
        }));
      }
      
      const startTime = performance.now();
      const networks = service.buildThreatNetworks(dataset);
      const endTime = performance.now();
      
      // Should complete within reasonable time (less than 3 seconds)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(3000);
      
      expect(networks).toBeInstanceOf(Array);
    });
  });

  // =============================================================================
  // EDGE CASE TESTS
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle threats without location data', async () => {
      const threatWithoutLocation = createMockThreat({ location: undefined });
      const threatWithLocation = createMockThreat({
        location: { latitude: 40.7128, longitude: -74.0060 }
      });
      
      const correlations = await service.findCorrelations(threatWithoutLocation, [threatWithLocation]);
      
      // Should not throw errors and should not find geographic correlations
      expect(correlations).toBeInstanceOf(Array);
      expect(correlations.every(c => c.correlation_type !== 'geographic_proximity')).toBe(true);
    });

    it('should handle threats without IOCs', async () => {
      const threatWithoutIOCs = createMockThreat({ iocs: [] });
      const threatWithIOCs = createMockThreat({
        iocs: [createMockIOC({ value: '192.168.1.100' })]
      });
      
      const correlations = await service.findCorrelations(threatWithoutIOCs, [threatWithIOCs]);
      
      // Should not throw errors and should not find IOC correlations
      expect(correlations).toBeInstanceOf(Array);
      expect(correlations.every(c => c.correlation_type !== 'ioc_overlap')).toBe(true);
    });

    it('should handle threats without actors', async () => {
      const threatWithoutActor = createMockThreat({ threat_actor: undefined });
      const threatWithActor = createMockThreat({
        threat_actor: createMockThreatActor()
      });
      
      const correlations = await service.findCorrelations(threatWithoutActor, [threatWithActor]);
      
      // Should not throw errors and should not find actor correlations
      expect(correlations).toBeInstanceOf(Array);
      expect(correlations.every(c => c.correlation_type !== 'same_actor')).toBe(true);
    });

    it('should handle empty threat arrays', async () => {
      const threat = createMockThreat();
      
      const correlations = await service.findCorrelations(threat, []);
      expect(correlations).toEqual([]);
      
      const networks = service.buildThreatNetworks([]);
      expect(networks).toEqual([]);
    });

    it('should handle single threat network building', () => {
      const singleThreat = [createMockThreat()];
      
      const networks = service.buildThreatNetworks(singleThreat);
      
      // Should not create networks with single threats
      expect(networks.length).toBe(0);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('ThreatCorrelationService Integration', () => {
  let service: ThreatCorrelationService;

  beforeEach(() => {
    service = new ThreatCorrelationService();
  });

  afterEach(() => {
    service.clearCache();
  });

  it('should integrate correlation analysis with network building', async () => {
    const threats = createCorrelatedThreats();
    
    // Analyze correlations for all threats
    const analysisResults: CorrelationAnalysisResult[] = [];
    for (const threat of threats) {
      const result = await service.analyzeThreatCorrelations(threat);
      analysisResults.push(result);
    }
    
    // Build networks
    const networks = service.buildThreatNetworks(threats);
    
    // Verify integration
    analysisResults.forEach(result => {
      expect(result.network_memberships.length).toBeGreaterThanOrEqual(0);
      
      if (result.network_memberships.length > 0) {
        // Threat should be in the networks it's listed as member of
        result.network_memberships.forEach(network => {
          expect(network.threats).toContain(result.threat_id);
        });
      }
    });
    
    // Networks should contain threats that have correlations
    networks.forEach(network => {
      expect(network.threats.length).toBeGreaterThanOrEqual(2);
      expect(network.correlations.length).toBeGreaterThan(0);
    });
  });

  it('should maintain consistency across real-time updates', async () => {
    const initialThreats = createCorrelatedThreats().slice(0, 3);
    const newThreats = createCorrelatedThreats().slice(3);
    
    return new Promise<void>((resolve) => {
      let updateCount = 0;
      const unsubscribe = service.subscribeToUpdates((update) => {
        updateCount++;
        
        // Verify update consistency
        expect(update.correlation_stats.total_correlations).toBeGreaterThanOrEqual(0);
        expect(update.correlation_stats.high_confidence_correlations)
          .toBeLessThanOrEqual(update.correlation_stats.total_correlations);
        
        if (updateCount === 2) { // After both updates
          const stats = service.getCorrelationStats();
          expect(stats.total_correlations).toBe(update.correlation_stats.total_correlations);
          expect(stats.active_networks).toBe(update.correlation_stats.active_networks);
          
          unsubscribe();
          resolve();
        }
      });
      
      // Process in phases
      service.processRealTimeUpdate(initialThreats);
      setTimeout(() => {
        service.processRealTimeUpdate(newThreats);
      }, 100);
    });
  });
});
