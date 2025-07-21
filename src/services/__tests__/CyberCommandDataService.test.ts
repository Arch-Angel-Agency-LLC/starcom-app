/**
 * Unit tests for CyberCommand data service
 * Testing data fetching, caching, rate limiting, and mock data generation
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

import { 
  CyberCommandDataService,
  DataCache,
  RateLimiter,
  MockDataGenerator,
  dataServiceRegistry
} from '../CyberCommandDataService';

import type { 
  VisualizationType,
  VisualizationData
} from '../../types/CyberCommandVisualization';

// Mock fetch globally
global.fetch = vi.fn();

describe('CyberCommandDataService', () => {
  let service: CyberCommandDataService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockClear();
    service = new CyberCommandDataService('IntelReports');
    vi.clearAllTimers();
    vi.useFakeTimers();
    dataServiceRegistry.clearAll();
  });

  afterEach(() => {
    vi.useRealTimers();
    service.stopRealTimeUpdates();
    service.clearCache();
    dataServiceRegistry.clearAll();
  });

  // =============================================================================
  // DATA CACHE TESTS
  // =============================================================================

  describe('DataCache', () => {
    let cache: DataCache;

    beforeEach(() => {
      cache = new DataCache();
    });

    test('should store and retrieve cached items', () => {
      const mockData: VisualizationData[] = [{
        id: 'test-1',
        type: 'IntelReports',
        location: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date(),
        metadata: {},
        priority: 'medium',
        status: 'active'
      }];

      cache.set('test-key', mockData, 5000);
      const result = cache.get('test-key');
      
      expect(result).toEqual(mockData);
    });

    test('should return null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    test('should clear all items', () => {
      const mockData: VisualizationData[] = [{
        id: 'test-1',
        type: 'IntelReports',
        location: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date(),
        metadata: {},
        priority: 'medium',
        status: 'active'
      }];

      cache.set('key1', mockData, 5000);
      cache.set('key2', mockData, 5000);
      
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  // =============================================================================
  // RATE LIMITER TESTS
  // =============================================================================

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter();
    });

    test('should allow requests within limit', () => {
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
    });

    test('should reset properly', () => {
      rateLimiter.canMakeRequest('test-key');
      rateLimiter.reset();
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
    });
  });

  // =============================================================================
  // MOCK DATA GENERATOR TESTS
  // =============================================================================

  describe('MockDataGenerator', () => {
    test('should generate valid intel reports data', () => {
      const data = MockDataGenerator.generateIntelReports(5);
      
      expect(data).toHaveLength(5);
      data.forEach(item => {
        expect(item.type).toBe('IntelReports');
        expect(item.id).toBeTruthy();
        expect(item.location.latitude).toBeGreaterThanOrEqual(-90);
        expect(item.location.latitude).toBeLessThanOrEqual(90);
        expect(item.location.longitude).toBeGreaterThanOrEqual(-180);
        expect(item.location.longitude).toBeLessThanOrEqual(180);
        expect(['low', 'medium', 'high', 'critical']).toContain(item.priority);
        expect(['active', 'inactive', 'pending', 'resolved']).toContain(item.status);
      });
    });

    test('should generate valid cyber attacks data', () => {
      const data = MockDataGenerator.generateCyberAttacks(3);
      
      expect(data).toHaveLength(3);
      data.forEach(item => {
        expect(item.type).toBe('CyberAttacks');
        expect(item.metadata.attackType).toBeTruthy();
        expect(item.metadata.severity).toBeTruthy();
        expect(['active', 'inactive', 'pending', 'resolved']).toContain(item.status);
      });
    });

    test('should generate valid cyber threats data', () => {
      const data = MockDataGenerator.generateCyberThreats(4);
      
      expect(data).toHaveLength(4);
      data.forEach(item => {
        expect(item.type).toBe('CyberThreats');
        expect(item.metadata.threatType).toBeTruthy();
        expect(item.metadata.malwareFamily).toBeTruthy();
      });
    });

    test('should generate valid network infrastructure data', () => {
      const data = MockDataGenerator.generateNetworkInfrastructure(2);
      
      expect(data).toHaveLength(2);
      data.forEach(item => {
        expect(item.type).toBe('NetworkInfrastructure');
        expect(item.metadata.infraType).toBeTruthy();
        expect(item.metadata.capacity).toBeTruthy();
        expect(['active', 'inactive', 'pending', 'resolved']).toContain(item.status);
      });
    });

    test('should generate valid comm hubs data', () => {
      const data = MockDataGenerator.generateCommHubs(3);
      
      expect(data).toHaveLength(3);
      data.forEach(item => {
        expect(item.type).toBe('CommHubs');
        expect(item.metadata.hubType).toBeTruthy();
        expect(item.metadata.frequency).toBeTruthy();
      });
    });
  });

  // =============================================================================
  // DATA SERVICE INTEGRATION TESTS
  // =============================================================================

  describe('CyberCommandDataService Integration', () => {
    test('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service.type).toBe('IntelReports');
    });

    test('should have basic methods', () => {
      expect(typeof service.getData).toBe('function');
      expect(typeof service.getHealthStatus).toBe('function');
      expect(typeof service.clearCache).toBe('function');
      expect(typeof service.stopRealTimeUpdates).toBe('function');
    });

    test('should get health status', () => {
      const status = service.getHealthStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('lastUpdate');
      expect(status).toHaveProperty('errorRate');
      expect(status).toHaveProperty('dataQuality');
    });
  });

  // =============================================================================
  // REGISTRY TESTS
  // =============================================================================

  describe('DataServiceRegistry', () => {
    test('should create and manage services', () => {
      const service1 = dataServiceRegistry.getService('IntelReports');
      const service2 = dataServiceRegistry.getService('IntelReports');
      
      expect(service1).toBe(service2); // Should return same instance
      
      const service3 = dataServiceRegistry.getService('CyberAttacks');
      expect(service3).not.toBe(service1); // Different types should be different instances
    });

    test('should clear all services', () => {
      dataServiceRegistry.getService('IntelReports');
      dataServiceRegistry.getService('CyberAttacks');
      
      const allServices = dataServiceRegistry.getAllServices();
      expect(allServices.length).toBeGreaterThan(0);
      
      dataServiceRegistry.clearAll();
      
      // Services should still exist but be reset
      const newService = dataServiceRegistry.getService('IntelReports');
      expect(newService).toBeDefined();
    });
  });
});
