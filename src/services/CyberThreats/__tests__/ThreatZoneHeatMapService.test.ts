/**
 * ThreatZoneHeatMapService Tests
 * Week 3 Day 3: Comprehensive test suite for threat zone heat map processing
 * 
 * Tests:
 * - Heat map generation with adaptive resolution
 * - Threat zone clustering and analysis
 * - Regional threat analysis
 * - Heat map evolution tracking
 * - Spatial smoothing algorithms
 * - Geographic coordinate utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { 
  ThreatZoneHeatMapService,
  type ThreatZone,
  type EnhancedThreatHeatMapPoint,
  type HeatMapConfig,
  type RegionalAnalysis,
  type HeatMapEvolution
} from '../ThreatZoneHeatMapService';

import type {
  CyberThreatData,
  ThreatCategory,
  ConfidenceLevel,
  ThreatActorType
} from '../../../types/CyberThreats';

import type { GeoCoordinate } from '../../../types/CyberCommandVisualization';

// =============================================================================
// TEST DATA HELPERS
// =============================================================================

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
    category: 'Malware' as ThreatCategory,
    name: 'Mock Cyber Threat',
    description: 'Test threat for heat map analysis',
    severity: 5,
    confidence: 'Medium' as ConfidenceLevel,
    status: 'Active',
    sophistication: 'Intermediate',
    campaigns: ['campaign_001'],
    malware_families: ['TestMalware'],
    iocs: [{
      id: 'ioc_1',
      type: 'ip_address',
      value: '192.168.1.1',
      confidence: 'Medium' as ConfidenceLevel,
      first_seen: new Date('2024-01-15T10:00:00Z'),
      last_seen: new Date('2024-01-15T12:00:00Z'),
      tags: ['test'],
      source: {
        provider: 'Test Provider'
      }
    }],
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

function createTestThreats(): CyberThreatData[] {
  return [
    // Cluster 1: New York area
    createMockThreat({
      id: 'threat_ny_1',
      category: 'Malware',
      severity: 8,
      confidence: 'High',
      location: { latitude: 40.7128, longitude: -74.0060 }
    }),
    createMockThreat({
      id: 'threat_ny_2',
      category: 'Phishing',
      severity: 6,
      confidence: 'Medium',
      location: { latitude: 40.7589, longitude: -73.9851 }
    }),
    createMockThreat({
      id: 'threat_ny_3',
      category: 'APT',
      severity: 9,
      confidence: 'Confirmed',
      location: { latitude: 40.6892, longitude: -74.0445 }
    }),

    // Cluster 2: London area
    createMockThreat({
      id: 'threat_london_1',
      category: 'Botnet',
      severity: 7,
      confidence: 'High',
      location: { latitude: 51.5074, longitude: -0.1278 }
    }),
    createMockThreat({
      id: 'threat_london_2',
      category: 'DataBreach',
      severity: 8,
      confidence: 'Medium',
      location: { latitude: 51.4994, longitude: -0.1244 }
    }),

    // Isolated threat: Tokyo
    createMockThreat({
      id: 'threat_tokyo_1',
      category: 'SupplyChain',
      severity: 9,
      confidence: 'Confirmed',
      location: { latitude: 35.6762, longitude: 139.6503 }
    }),

    // Recent threats for evolution testing
    createMockThreat({
      id: 'threat_recent_1',
      category: 'Malware',
      severity: 7,
      confidence: 'High',
      first_seen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      location: { latitude: 34.0522, longitude: -118.2437 } // Los Angeles
    }),
    createMockThreat({
      id: 'threat_recent_2',
      category: 'Infrastructure',
      severity: 8,
      confidence: 'Medium',
      first_seen: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      location: { latitude: 37.7749, longitude: -122.4194 } // San Francisco
    })
  ];
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('ThreatZoneHeatMapService', () => {
  let service: ThreatZoneHeatMapService;
  let testThreats: CyberThreatData[];

  beforeEach(() => {
    service = new ThreatZoneHeatMapService();
    testThreats = createTestThreats();
  });

  // =============================================================================
  // CONFIGURATION TESTS
  // =============================================================================

  describe('Configuration Management', () => {
    it('should initialize with default configuration', () => {
      const config = service.getConfig();
      
      expect(config.resolution).toBe(1.0);
      expect(config.minRadius).toBe(10);
      expect(config.maxRadius).toBe(200);
      expect(config.intensityThreshold).toBe(0.1);
      expect(config.temporalWeight).toBe(0.4);
      expect(config.confidenceWeight).toBe(0.3);
      expect(config.severityWeight).toBe(0.3);
    });

    it('should update configuration correctly', () => {
      const newConfig: Partial<HeatMapConfig> = {
        resolution: 0.5,
        minRadius: 20,
        intensityThreshold: 0.2
      };

      service.updateConfig(newConfig);
      const updatedConfig = service.getConfig();

      expect(updatedConfig.resolution).toBe(0.5);
      expect(updatedConfig.minRadius).toBe(20);
      expect(updatedConfig.intensityThreshold).toBe(0.2);
      // Unchanged values should remain the same
      expect(updatedConfig.maxRadius).toBe(200);
      expect(updatedConfig.temporalWeight).toBe(0.4);
    });

    it('should clear cache when configuration is updated', () => {
      // Generate heat map to populate cache
      service.generateAdvancedHeatMap(testThreats);
      
      // Update config should clear cache
      service.updateConfig({ resolution: 0.5 });
      
      // This should regenerate the heat map, not use cache
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      expect(heatMap).toBeDefined();
    });
  });

  // =============================================================================
  // HEAT MAP GENERATION TESTS
  // =============================================================================

  describe('Heat Map Generation', () => {
    it('should generate heat map points from threat data', () => {
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      
      expect(heatMap).toBeInstanceOf(Array);
      expect(heatMap.length).toBeGreaterThan(0);
      
      // Check point structure
      heatMap.forEach(point => {
        expect(point).toHaveProperty('id');
        expect(point).toHaveProperty('location');
        expect(point).toHaveProperty('intensity');
        expect(point).toHaveProperty('threat_density');
        expect(point).toHaveProperty('radius');
        expect(point).toHaveProperty('threat_categories');
        expect(point).toHaveProperty('active_threats');
        expect(point).toHaveProperty('avg_severity');
        expect(point).toHaveProperty('confidence_average');
        expect(point).toHaveProperty('last_updated');
        
        expect(point.intensity).toBeGreaterThanOrEqual(0);
        expect(point.intensity).toBeLessThanOrEqual(1);
        expect(point.threat_density).toBeGreaterThan(0);
        expect(point.radius).toBeGreaterThanOrEqual(10); // min radius
      });
    });

    it('should handle empty threat data gracefully', () => {
      const heatMap = service.generateAdvancedHeatMap([]);
      
      expect(heatMap).toBeInstanceOf(Array);
      expect(heatMap.length).toBe(0);
    });

    it('should filter out threats without location data', () => {
      const threatsWithoutLocation = [
        createMockThreat({ location: undefined }),
        createMockThreat({ location: { latitude: 40.7128, longitude: -74.0060 } }),
        createMockThreat({ location: undefined })
      ];

      const heatMap = service.generateAdvancedHeatMap(threatsWithoutLocation);
      
      // Should only process the threat with location
      expect(heatMap.length).toBeGreaterThan(0);
      heatMap.forEach(point => {
        expect(point.location).toBeDefined();
        expect(point.location.latitude).toBeTypeOf('number');
        expect(point.location.longitude).toBeTypeOf('number');
      });
    });

    it('should apply adaptive radius based on threat density', () => {
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      
      // Find points with different threat densities
      const lowDensityPoint = heatMap.find(p => p.threat_density <= 2);
      const highDensityPoint = heatMap.find(p => p.threat_density > 2);
      
      if (lowDensityPoint && highDensityPoint) {
        expect(highDensityPoint.radius).toBeGreaterThanOrEqual(lowDensityPoint.radius);
      }
    });

    it('should cache heat map results for identical inputs', () => {
      const heatMap1 = service.generateAdvancedHeatMap(testThreats);
      const heatMap2 = service.generateAdvancedHeatMap(testThreats);
      
      // Should return same results (cached)
      expect(heatMap1).toEqual(heatMap2);
    });
  });

  // =============================================================================
  // THREAT ZONE CLUSTERING TESTS
  // =============================================================================

  describe('Threat Zone Clustering', () => {
    it('should generate threat zones from clustered threats', () => {
      const zones = service.generateThreatZones(testThreats);
      
      expect(zones).toBeInstanceOf(Array);
      expect(zones.length).toBeGreaterThan(0);
      
      zones.forEach(zone => {
        expect(zone).toHaveProperty('id');
        expect(zone).toHaveProperty('center');
        expect(zone).toHaveProperty('radius');
        expect(zone).toHaveProperty('threatLevel');
        expect(zone).toHaveProperty('threatCount');
        expect(zone).toHaveProperty('primaryCategories');
        expect(zone).toHaveProperty('averageConfidence');
        expect(zone).toHaveProperty('riskScore');
        expect(zone).toHaveProperty('lastUpdated');
        expect(zone).toHaveProperty('threats');
        
        expect(zone.threatLevel).toBeGreaterThan(0);
        expect(zone.threatLevel).toBeLessThanOrEqual(10);
        expect(zone.threatCount).toBeGreaterThan(0);
        expect(zone.threats.length).toBe(zone.threatCount);
        expect(zone.riskScore).toBeGreaterThan(0);
      });
    });

    it('should sort zones by risk score in descending order', () => {
      const zones = service.generateThreatZones(testThreats);
      
      for (let i = 1; i < zones.length; i++) {
        expect(zones[i-1].riskScore).toBeGreaterThanOrEqual(zones[i].riskScore);
      }
    });

    it('should require minimum cluster size for zone creation', () => {
      // Single isolated threat should not create a zone
      const singleThreat = [createMockThreat({
        location: { latitude: 0, longitude: 0 }
      })];
      
      const zones = service.generateThreatZones(singleThreat);
      expect(zones.length).toBe(0);
    });

    it('should calculate zone centroids correctly', () => {
      const zones = service.generateThreatZones(testThreats);
      
      zones.forEach(zone => {
        // Centroid should be within reasonable bounds of constituent threats
        const threatLatitudes = zone.threats.map(t => t.location?.latitude).filter(Boolean) as number[];
        const threatLongitudes = zone.threats.map(t => t.location?.longitude).filter(Boolean) as number[];
        
        if (threatLatitudes.length > 0 && threatLongitudes.length > 0) {
          const minLat = Math.min(...threatLatitudes);
          const maxLat = Math.max(...threatLatitudes);
          const minLng = Math.min(...threatLongitudes);
          const maxLng = Math.max(...threatLongitudes);
          
          expect(zone.center.latitude).toBeGreaterThanOrEqual(minLat);
          expect(zone.center.latitude).toBeLessThanOrEqual(maxLat);
          expect(zone.center.longitude).toBeGreaterThanOrEqual(minLng);
          expect(zone.center.longitude).toBeLessThanOrEqual(maxLng);
        }
      });
    });

    it('should cache zone results for identical inputs', () => {
      const zones1 = service.generateThreatZones(testThreats);
      const zones2 = service.generateThreatZones(testThreats);
      
      expect(zones1).toEqual(zones2);
    });
  });

  // =============================================================================
  // REGIONAL ANALYSIS TESTS
  // =============================================================================

  describe('Regional Analysis', () => {
    it('should analyze threats by geographic region', () => {
      const analyses = service.analyzeRegionalThreats(testThreats);
      
      expect(analyses).toBeInstanceOf(Array);
      expect(analyses.length).toBeGreaterThan(0);
      
      analyses.forEach(analysis => {
        expect(analysis).toHaveProperty('region');
        expect(analysis).toHaveProperty('totalThreats');
        expect(analysis).toHaveProperty('averageSeverity');
        expect(analysis).toHaveProperty('dominantCategories');
        expect(analysis).toHaveProperty('riskTrend');
        expect(analysis).toHaveProperty('zones');
        expect(analysis).toHaveProperty('correlations');
        
        expect(analysis.totalThreats).toBeGreaterThan(0);
        expect(analysis.averageSeverity).toBeGreaterThan(0);
        expect(analysis.averageSeverity).toBeLessThanOrEqual(10);
        expect(['increasing', 'decreasing', 'stable']).toContain(analysis.riskTrend);
      });
    });

    it('should sort regions by total threat count', () => {
      const analyses = service.analyzeRegionalThreats(testThreats);
      
      for (let i = 1; i < analyses.length; i++) {
        expect(analyses[i-1].totalThreats).toBeGreaterThanOrEqual(analyses[i].totalThreats);
      }
    });

    it('should identify dominant threat categories per region', () => {
      const analyses = service.analyzeRegionalThreats(testThreats);
      
      analyses.forEach(analysis => {
        expect(analysis.dominantCategories).toBeInstanceOf(Array);
        expect(analysis.dominantCategories.length).toBeGreaterThan(0);
        expect(analysis.dominantCategories.length).toBeLessThanOrEqual(3);
        
        analysis.dominantCategories.forEach(category => {
          expect(['Malware', 'APT', 'Botnet', 'Phishing', 'DataBreach', 
                   'Infrastructure', 'SupplyChain', 'Insider', 'Unknown']).toContain(category);
        });
      });
    });

    it('should handle threats without location data', () => {
      const mixedThreats = [
        ...testThreats,
        createMockThreat({ location: undefined }),
        createMockThreat({ location: undefined })
      ];
      
      const analyses = service.analyzeRegionalThreats(mixedThreats);
      
      // Should still produce valid regional analyses
      expect(analyses).toBeInstanceOf(Array);
      analyses.forEach(analysis => {
        expect(analysis.totalThreats).toBeGreaterThan(0);
      });
    });
  });

  // =============================================================================
  // HEAT MAP EVOLUTION TESTS
  // =============================================================================

  describe('Heat Map Evolution', () => {
    it('should track heat map evolution over time', () => {
      const evolution = service.trackHeatMapEvolution(testThreats);
      
      expect(evolution).toHaveProperty('timestamp');
      expect(evolution).toHaveProperty('heatMapPoints');
      expect(evolution).toHaveProperty('zones');
      expect(evolution).toHaveProperty('globalMetrics');
      
      expect(evolution.timestamp).toBeInstanceOf(Date);
      expect(evolution.heatMapPoints).toBeInstanceOf(Array);
      expect(evolution.zones).toBeInstanceOf(Array);
      
      expect(evolution.globalMetrics).toHaveProperty('totalThreats');
      expect(evolution.globalMetrics).toHaveProperty('averageIntensity');
      expect(evolution.globalMetrics).toHaveProperty('hottestZone');
      expect(evolution.globalMetrics).toHaveProperty('emergingThreats');
      
      expect(evolution.globalMetrics.totalThreats).toBe(testThreats.length);
      expect(evolution.globalMetrics.averageIntensity).toBeGreaterThanOrEqual(0);
      expect(evolution.globalMetrics.averageIntensity).toBeLessThanOrEqual(1);
    });

    it('should identify emerging threats', () => {
      const evolution = service.trackHeatMapEvolution(testThreats);
      
      expect(evolution.globalMetrics.emergingThreats).toBeInstanceOf(Array);
      
      // Should include recent threats
      const emergingIds = evolution.globalMetrics.emergingThreats.map(t => t.id);
      expect(emergingIds).toContain('threat_recent_1');
      expect(emergingIds).toContain('threat_recent_2');
    });

    it('should identify hottest zone', () => {
      const evolution = service.trackHeatMapEvolution(testThreats);
      
      if (evolution.globalMetrics.hottestZone) {
        expect(evolution.globalMetrics.hottestZone.riskScore).toBeGreaterThan(0);
        expect(evolution.globalMetrics.hottestZone.threatCount).toBeGreaterThan(0);
      }
    });

    it('should maintain evolution history', () => {
      // Track multiple evolutions
      service.trackHeatMapEvolution(testThreats.slice(0, 3));
      service.trackHeatMapEvolution(testThreats.slice(0, 5));
      service.trackHeatMapEvolution(testThreats);
      
      const history = service.getEvolutionHistory();
      
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBe(3);
      
      // Should be chronologically ordered
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i-1].timestamp.getTime()
        );
      }
    });

    it('should limit evolution history to 24 entries', () => {
      // Add more than 24 entries
      for (let i = 0; i < 30; i++) {
        service.trackHeatMapEvolution(testThreats);
      }
      
      const history = service.getEvolutionHistory();
      expect(history.length).toBeLessThanOrEqual(24);
    });
  });

  // =============================================================================
  // SPATIAL ANALYSIS TESTS
  // =============================================================================

  describe('Spatial Analysis', () => {
    it('should apply spatial smoothing to heat map points', () => {
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      
      // All points should have valid intensity values after smoothing
      heatMap.forEach(point => {
        expect(point.intensity).toBeGreaterThanOrEqual(0);
        expect(point.intensity).toBeLessThanOrEqual(1);
        expect(Number.isFinite(point.intensity)).toBe(true);
      });
    });

    it('should handle edge cases in geographic calculations', () => {
      const edgeCaseThreats = [
        createMockThreat({ location: { latitude: 0, longitude: 0 } }),
        createMockThreat({ location: { latitude: 90, longitude: 180 } }),
        createMockThreat({ location: { latitude: -90, longitude: -180 } })
      ];
      
      const heatMap = service.generateAdvancedHeatMap(edgeCaseThreats);
      expect(heatMap).toBeInstanceOf(Array);
      
      const zones = service.generateThreatZones(edgeCaseThreats);
      expect(zones).toBeInstanceOf(Array);
    });

    it('should calculate reasonable grid resolution', () => {
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      
      // Grid points should be reasonably distributed
      const latitudes = heatMap.map(p => p.location.latitude);
      const longitudes = heatMap.map(p => p.location.longitude);
      
      // Should have some distribution (not all the same point)
      const uniqueLatitudes = new Set(latitudes);
      const uniqueLongitudes = new Set(longitudes);
      
      if (heatMap.length > 1) {
        expect(uniqueLatitudes.size).toBeGreaterThan(1);
        expect(uniqueLongitudes.size).toBeGreaterThan(1);
      }
    });
  });

  // =============================================================================
  // UTILITY METHOD TESTS
  // =============================================================================

  describe('Utility Methods', () => {
    it('should clear all caches when requested', () => {
      // Populate caches
      service.generateAdvancedHeatMap(testThreats);
      service.generateThreatZones(testThreats);
      
      // Clear caches
      service.clearCache();
      
      // Should regenerate data (no errors)
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      const zones = service.generateThreatZones(testThreats);
      
      expect(heatMap).toBeDefined();
      expect(zones).toBeDefined();
    });

    it('should handle configuration with extreme values', () => {
      const extremeConfig: Partial<HeatMapConfig> = {
        resolution: 0.01, // Very fine resolution
        minRadius: 1,     // Very small radius
        maxRadius: 1000,  // Very large radius
        intensityThreshold: 0.001, // Very low threshold
        temporalWeight: 1.0,
        confidenceWeight: 1.0,
        severityWeight: 1.0
      };
      
      service.updateConfig(extremeConfig);
      
      // Should still generate valid results
      const heatMap = service.generateAdvancedHeatMap(testThreats);
      const zones = service.generateThreatZones(testThreats);
      
      expect(heatMap).toBeInstanceOf(Array);
      expect(zones).toBeInstanceOf(Array);
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Generate large dataset
      const largeDataset: CyberThreatData[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push(createMockThreat({
          id: `threat_${i}`,
          location: {
            latitude: -90 + Math.random() * 180,
            longitude: -180 + Math.random() * 360
          }
        }));
      }
      
      const startTime = performance.now();
      const heatMap = service.generateAdvancedHeatMap(largeDataset);
      const endTime = performance.now();
      
      // Should complete within reasonable time (less than 5 seconds)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000);
      
      expect(heatMap).toBeInstanceOf(Array);
      expect(heatMap.length).toBeGreaterThan(0);
    });

    it('should benefit from caching on repeated operations', () => {
      const startTime1 = performance.now();
      service.generateAdvancedHeatMap(testThreats);
      const endTime1 = performance.now();
      const firstRun = endTime1 - startTime1;
      
      const startTime2 = performance.now();
      service.generateAdvancedHeatMap(testThreats);
      const endTime2 = performance.now();
      const secondRun = endTime2 - startTime2;
      
      // Second run should be significantly faster (cached)
      expect(secondRun).toBeLessThan(firstRun * 0.1); // At least 10x faster
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('ThreatZoneHeatMapService Integration', () => {
  let service: ThreatZoneHeatMapService;

  beforeEach(() => {
    service = new ThreatZoneHeatMapService();
  });

  it('should integrate all components for complete threat analysis', () => {
    const threats = createTestThreats();
    
    // Generate all analysis components
    const heatMap = service.generateAdvancedHeatMap(threats);
    const zones = service.generateThreatZones(threats);
    const regionalAnalysis = service.analyzeRegionalThreats(threats);
    const evolution = service.trackHeatMapEvolution(threats);
    
    // Verify data consistency across components
    expect(evolution.heatMapPoints).toEqual(heatMap);
    expect(evolution.zones).toEqual(zones);
    expect(evolution.globalMetrics.totalThreats).toBe(threats.length);
    
    // Regional analysis should account for all located threats
    const totalRegionalThreats = regionalAnalysis.reduce((sum, region) => sum + region.totalThreats, 0);
    const locatedThreats = threats.filter(t => t.location).length;
    expect(totalRegionalThreats).toBe(locatedThreats);
  });

  it('should maintain data consistency across configuration changes', () => {
    const threats = createTestThreats();
    
    // Generate with default config
    const heatMap1 = service.generateAdvancedHeatMap(threats);
    
    // Change configuration
    service.updateConfig({ resolution: 0.5 });
    
    // Generate with new config
    const heatMap2 = service.generateAdvancedHeatMap(threats);
    
    // Results should be different but valid
    expect(heatMap1).not.toEqual(heatMap2);
    expect(heatMap2).toBeInstanceOf(Array);
    
    heatMap2.forEach(point => {
      expect(point.intensity).toBeGreaterThanOrEqual(0);
      expect(point.intensity).toBeLessThanOrEqual(1);
    });
  });
});
