/**
 * Threat Intelligence Service Tests
 * Week 3 Day 1: CyberThreats Implementation - TDD approach
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThreatIntelligenceService } from '../ThreatIntelligenceService';
import {
  ThreatQueryOptions,
  CyberThreatData,
  ThreatCategory,
  ConfidenceLevel,
  ThreatStatus,
  ThreatHeatMapPoint
} from '../../../types/CyberThreats';

describe('ThreatIntelligenceService', () => {
  let service: ThreatIntelligenceService;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new ThreatIntelligenceService({
      debugMode: true,
      updateInterval: 100,
      heatMapResolution: 10
    });
    mockCallback = vi.fn();
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllMocks();
  });

  // =============================================================================
  // BASIC SERVICE OPERATIONS
  // =============================================================================

  describe('Basic Service Operations', () => {
    it('should initialize with proper configuration', () => {
      expect(service).toBeDefined();
      expect(typeof service.getData).toBe('function');
      expect(typeof service.subscribeToThreats).toBe('function');
      expect(typeof service.getActiveThreats).toBe('function');
      expect(typeof service.dispose).toBe('function');
    });

    it('should have empty threats initially', () => {
      const threats = service.getActiveThreats();
      expect(Array.isArray(threats)).toBe(true);
      expect(threats.length).toBe(0);
    });

    it('should return null for non-existent threat ID', () => {
      const threat = service.getThreatById('non-existent-id');
      expect(threat).toBeNull();
    });

    it('should handle disposal gracefully', () => {
      expect(() => service.dispose()).not.toThrow();
    });
  });

  // =============================================================================
  // THREAT DATA FETCHING
  // =============================================================================

  describe('Threat Data Fetching', () => {
    it('should fetch mock threat data without options', async () => {
      const threats = await service.getData();
      
      expect(Array.isArray(threats)).toBe(true);
      expect(threats.length).toBeGreaterThan(0);
      
      // Validate data structure
      const threat = threats[0];
      expect(threat).toHaveProperty('id');
      expect(threat).toHaveProperty('type', 'CyberThreats');
      expect(threat).toHaveProperty('category');
      expect(threat).toHaveProperty('location');
      expect(threat).toHaveProperty('timestamp');
    });

    it('should respect query limit option', async () => {
      const limit = 5;
      const threats = await service.getData({ limit });
      
      expect(threats.length).toBeLessThanOrEqual(limit);
    });

    it('should filter by threat categories', async () => {
      const categories = ['Malware', 'APT'] as ThreatCategory[];
      const threats = await service.getData({ categories });
      
      threats.forEach(threat => {
        expect(categories).toContain(threat.category);
      });
    });

    it('should filter by confidence level', async () => {
      const confidence = ['Medium'] as ConfidenceLevel[];
      const threats = await service.getData({ confidence });
      
      const validConfidenceLevels = ['Medium', 'High', 'Confirmed'];
      threats.forEach(threat => {
        expect(validConfidenceLevels).toContain(threat.confidence);
      });
    });

    it('should filter by threat status', async () => {
      const status = ['Active'] as ThreatStatus[];
      const threats = await service.getData({ status });
      
      threats.forEach(threat => {
        expect(status).toContain(threat.status);
      });
    });

    it('should handle time window filtering', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const threats = await service.getData({
        time_window: {
          start: yesterday,
          end: now
        }
      });
      
      threats.forEach(threat => {
        expect(threat.timestamp.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(threat.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  // =============================================================================
  // REAL-TIME STREAMING
  // =============================================================================

  describe('Real-Time Streaming', () => {
    it('should create subscription successfully', () => {
      const options: ThreatQueryOptions = { limit: 10 };
      const subscriptionId = service.subscribeToThreats(options, mockCallback);
      
      expect(typeof subscriptionId).toBe('string');
      expect(subscriptionId.length).toBeGreaterThan(0);
    });

    it('should handle multiple subscriptions', () => {
      const subscription1 = service.subscribeToThreats({ limit: 5 }, mockCallback);
      const subscription2 = service.subscribeToThreats({ limit: 10 }, mockCallback);
      
      expect(subscription1).not.toBe(subscription2);
      expect(typeof subscription1).toBe('string');
      expect(typeof subscription2).toBe('string');
    });

    it('should unsubscribe successfully', () => {
      const subscriptionId = service.subscribeToThreats({ limit: 1 }, mockCallback);
      expect(() => service.unsubscribeFromThreats(subscriptionId)).not.toThrow();
    });

    it('should handle unsubscribing non-existent subscription', () => {
      expect(() => service.unsubscribeFromThreats('non-existent')).not.toThrow();
    });

    it('should process streaming events within reasonable time', async () => {
      const options: ThreatQueryOptions = { limit: 1 };
      service.subscribeToThreats(options, mockCallback);
      
      // Wait for mock streaming to generate events
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for events
      
      expect(mockCallback).toHaveBeenCalled();
      
      // Check event structure if callback was called
      if (mockCallback.mock.calls.length > 0) {
        const [event] = mockCallback.mock.calls[0];
        expect(event).toHaveProperty('event_type');
        expect(event).toHaveProperty('threat_data');
        expect(event).toHaveProperty('timestamp');
      }
    }, 8000); // Longer timeout for streaming test
  });

  // =============================================================================
  // THREAT DATA VALIDATION
  // =============================================================================

  describe('Threat Data Validation', () => {
    it('should generate valid threat data structures', async () => {
      const threats = await service.getData({ limit: 5 });
      
      threats.forEach(threat => {
        // Required fields
        expect(typeof threat.id).toBe('string');
        expect(threat.type).toBe('CyberThreats');
        expect(threat.location).toHaveProperty('latitude');
        expect(threat.location).toHaveProperty('longitude');
        expect(threat.timestamp).toBeInstanceOf(Date);
        
        // Threat-specific fields
        expect(['Malware', 'APT', 'Botnet', 'Phishing', 'DataBreach', 'Infrastructure', 'SupplyChain', 'Insider', 'Unknown']).toContain(threat.category);
        expect(['Basic', 'Intermediate', 'Advanced', 'Expert', 'Unknown']).toContain(threat.sophistication);
        expect(['Low', 'Medium', 'High', 'Confirmed']).toContain(threat.confidence);
        expect(['Emerging', 'Active', 'Contained', 'Neutralized', 'Dormant']).toContain(threat.status);
      });
    });

    it('should generate realistic geographic distribution', async () => {
      const threats = await service.getData({ limit: 20 });
      
      const latitudes = threats.map(t => t.location.latitude);
      const longitudes = threats.map(t => t.location.longitude);
      
      // Check latitude range
      expect(Math.min(...latitudes)).toBeGreaterThanOrEqual(-90);
      expect(Math.max(...latitudes)).toBeLessThanOrEqual(90);
      
      // Check longitude range
      expect(Math.min(...longitudes)).toBeGreaterThanOrEqual(-180);
      expect(Math.max(...longitudes)).toBeLessThanOrEqual(180);
    });

    it('should maintain consistent threat progression', async () => {
      const initialThreats = await service.getData({ limit: 5 });
      
      // Wait for some progression
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedThreats = await service.getData({ limit: 5 });
      
      // Should have some threats (may be different due to progression)
      expect(updatedThreats.length).toBeGreaterThan(0);
      expect(updatedThreats.every(t => t.timestamp instanceof Date)).toBe(true);
    });
  });

  // =============================================================================
  // HEAT MAP GENERATION
  // =============================================================================

  describe('Heat Map Generation', () => {
    it('should generate threat heat map points', async () => {
      const heatMapPoints = await service.generateHeatMap({
        limit: 100,
        time_window: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        }
      });
      
      expect(Array.isArray(heatMapPoints)).toBe(true);
      
      if (heatMapPoints.length > 0) {
        const point = heatMapPoints[0];
        expect(point).toHaveProperty('location');
        expect(point).toHaveProperty('threat_density');
        expect(point).toHaveProperty('active_threats');
        expect(point.threat_density).toBeGreaterThanOrEqual(0);
        expect(point.threat_density).toBeLessThanOrEqual(1);
        expect(point.active_threats).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', async () => {
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      const options: ThreatQueryOptions = { limit: 1 };
      service.subscribeToThreats(options, faultyCallback);
      
      // Wait for streaming events
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should not crash the service
      expect(service.getActiveThreats().length).toBeGreaterThanOrEqual(0);
    }, 3000);

    it('should handle invalid query options gracefully', async () => {
      const invalidOptions = {
        limit: -5
      };
      
      const threats = await service.getData(invalidOptions);
      expect(Array.isArray(threats)).toBe(true);
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('Performance Characteristics', () => {
    it('should handle large data requests efficiently', async () => {
      const startTime = Date.now();
      const threats = await service.getData({ limit: 500 });
      const endTime = Date.now();
      
      expect(threats.length).toBeLessThanOrEqual(500);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle multiple concurrent subscriptions', () => {
      const subscriptionCount = 5;
      const subscriptions: string[] = [];
      
      for (let i = 0; i < subscriptionCount; i++) {
        const options: ThreatQueryOptions = { limit: i + 1 };
        const sub = service.subscribeToThreats(options, mockCallback);
        subscriptions.push(sub);
      }
      
      expect(subscriptions.length).toBe(subscriptionCount);
      
      // Clean up
      subscriptions.forEach(sub => {
        service.unsubscribeFromThreats(sub);
      });
    });
  });

  // =============================================================================
  // INTEGRATION READINESS
  // =============================================================================

  describe('Integration Readiness', () => {
    it('should be ready for real threat intelligence feeds', () => {
      // Check that service has necessary methods for real integration
      expect(typeof service.getData).toBe('function');
      expect(typeof service.subscribeToThreats).toBe('function');
      expect(typeof service.unsubscribeFromThreats).toBe('function');
      expect(typeof service.getActiveThreats).toBe('function');
      expect(typeof service.getThreatById).toBe('function');
      expect(typeof service.generateHeatMap).toBe('function');
      expect(typeof service.dispose).toBe('function');
    });

    it('should maintain service consistency over time', async () => {
      const initialState = service.getActiveThreats().length;
      
      // Subscribe and let it run
      const options: ThreatQueryOptions = { limit: 5 };
      const subscription = service.subscribeToThreats(options, mockCallback);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const finalState = service.getActiveThreats().length;
      
      // State should be reasonable (not empty, not growing infinitely)
      expect(finalState).toBeGreaterThanOrEqual(0);
      expect(finalState).toBeLessThan(1000); // Reasonable upper bound
      
      service.unsubscribeFromThreats(subscription);
    }, 3000);
  });
});
