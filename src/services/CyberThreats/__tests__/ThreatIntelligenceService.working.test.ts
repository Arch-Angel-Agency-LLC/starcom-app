/**
 * Threat Intelligence Service Tests
 * Week 3 Day 1: CyberThreats Implementation - TDD approach
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThreatIntelligenceService } from '../ThreatIntelligenceService';
import type {
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
    // Clean up any subscriptions
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create service with default options', () => {
      const defaultService = new ThreatIntelligenceService();
      expect(defaultService).toBeDefined();
      expect(defaultService).toBeInstanceOf(ThreatIntelligenceService);
    });

    it('should create service with custom options', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ThreatIntelligenceService);
    });

    it('should have all required methods', () => {
      expect(typeof service.getData).toBe('function');
      expect(typeof service.getActiveThreats).toBe('function');
      expect(typeof service.subscribeToThreats).toBe('function');
      expect(typeof service.generateHeatMap).toBe('function');
    });
  });

  describe('Data Query Operations', () => {
    it('should return threat data with default query', async () => {
      const data = await service.getData();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle custom query options', async () => {
      const queryOptions: ThreatQueryOptions = {
        categories: ['Malware', 'Phishing'],
        confidence: ['Medium'],
        limit: 50
      };
      
      const data = await service.getData(queryOptions);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(50);
    });

    it('should filter threats by category', async () => {
      const malwareQuery: ThreatQueryOptions = {
        categories: ['Malware']
      };
      
      const malwareThreats = await service.getData(malwareQuery);
      expect(malwareThreats).toBeDefined();
      expect(Array.isArray(malwareThreats)).toBe(true);
    });
  });

  describe('Real-time Threat Monitoring', () => {
    it('should subscribe to threat updates', () => {
      const queryOptions: ThreatQueryOptions = {
        categories: ['Malware']
      };
      
      const subscriptionId = service.subscribeToThreats(queryOptions, mockCallback);
      expect(typeof subscriptionId).toBe('string');
      expect(subscriptionId.length).toBeGreaterThan(0);
      
      // Cleanup
      service.unsubscribeFromThreats(subscriptionId);
    });

    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const queryOptions: ThreatQueryOptions = { categories: ['Malware'] };
      
      const sub1 = service.subscribeToThreats(queryOptions, callback1);
      const sub2 = service.subscribeToThreats(queryOptions, callback2);
      
      expect(typeof sub1).toBe('string');
      expect(typeof sub2).toBe('string');
      expect(sub1).not.toBe(sub2);
      
      // Cleanup
      service.unsubscribeFromThreats(sub1);
      service.unsubscribeFromThreats(sub2);
    });

    it('should get active threats', () => {
      const activeThreats = service.getActiveThreats();
      expect(activeThreats).toBeDefined();
      expect(Array.isArray(activeThreats)).toBe(true);
    });
  });

  describe('Heat Map Generation', () => {
    it('should generate threat heat map', async () => {
      const heatMap = await service.generateHeatMap();
      expect(heatMap).toBeDefined();
      expect(Array.isArray(heatMap)).toBe(true);
    });

    it('should generate heat map with custom options', async () => {
      const options: ThreatQueryOptions = {
        categories: ['Malware'] as ThreatCategory[],
        limit: 100
      };
      
      const heatMap = await service.generateHeatMap(options);
      expect(heatMap).toBeDefined();
      expect(Array.isArray(heatMap)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const invalidQuery: ThreatQueryOptions = {
        limit: -1, // Invalid limit
        categories: [] // Empty categories
      };
      
      // Should not throw but return valid data
      const data = await service.getData(invalidQuery);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Performance and Streaming', () => {
    it('should manage subscriptions properly', () => {
      const queryOptions: ThreatQueryOptions = { categories: ['Malware'] };
      
      // Start streaming by subscribing
      const subId = service.subscribeToThreats(queryOptions, mockCallback);
      expect(typeof subId).toBe('string');
      
      // Cleanup
      service.unsubscribeFromThreats(subId);
    });

    it('should handle unsubscribe', () => {
      const queryOptions: ThreatQueryOptions = { categories: ['Malware'] };
      const subId = service.subscribeToThreats(queryOptions, mockCallback);
      
      expect(typeof subId).toBe('string');
      
      // Should not throw when unsubscribing
      expect(() => service.unsubscribeFromThreats(subId)).not.toThrow();
    });
  });
});
