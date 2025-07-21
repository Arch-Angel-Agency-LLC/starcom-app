/**
 * Simplified ThreatIntelligenceService test suite
 * Tests core functionality for Week 3 Day 1 implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ThreatIntelligenceService } from '../ThreatIntelligenceService';

describe('ThreatIntelligenceService - Simple Tests', () => {
  let service: ThreatIntelligenceService;

  beforeEach(() => {
    service = new ThreatIntelligenceService();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ThreatIntelligenceService);
    });

    it('should have required methods', () => {
      expect(typeof service.getData).toBe('function');
      expect(typeof service.getActiveThreats).toBe('function');
      expect(typeof service.subscribeToThreats).toBe('function');
      expect(typeof service.generateHeatMap).toBe('function');
    });
  });

  describe('Basic Data Operations', () => {
    it('should get threat data', async () => {
      const threats = await service.getData();
      expect(Array.isArray(threats)).toBe(true);
    });

    it('should get active threats', async () => {
      const activeThreats = await service.getActiveThreats();
      expect(Array.isArray(activeThreats)).toBe(true);
    });

    it('should generate heat map', async () => {
      const heatMap = await service.generateHeatMap();
      expect(Array.isArray(heatMap)).toBe(true);
    });
  });

  describe('Service Management', () => {
    it('should handle disposal', () => {
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
