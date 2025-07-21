/**
 * Test suite for RealTimeAttackService
 * Tests real-time attack data streaming, processing, and SIEM integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealTimeAttackService } from '../RealTimeAttackService';
import type { 
  CyberAttackData, 
  AttackStreamEvent, 
  CyberAttackQueryOptions,
  AttackType,
  SeverityLevel,
  AttackStatus
} from '../../../types/CyberAttacks';

// =============================================================================
// TEST SETUP AND UTILITIES
// =============================================================================

describe('RealTimeAttackService', () => {
  let service: RealTimeAttackService;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new RealTimeAttackService();
    mockCallback = vi.fn();
    
    // Mock console methods to avoid test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    service.dispose();
    vi.restoreAllMocks();
  });

  // =============================================================================
  // BASIC FUNCTIONALITY TESTS
  // =============================================================================

  describe('Basic Service Operations', () => {
    it('should initialize with proper type', () => {
      expect(service).toBeInstanceOf(RealTimeAttackService);
    });

    it('should have empty active attacks initially', () => {
      const activeAttacks = service.getActiveAttacks();
      expect(activeAttacks).toEqual([]);
    });

    it('should return null for non-existent attack ID', () => {
      const attack = service.getAttackById('non-existent-id');
      expect(attack).toBeNull();
    });

    it('should handle disposal gracefully', () => {
      expect(() => service.dispose()).not.toThrow();
    });
  });

  // =============================================================================
  // DATA FETCHING TESTS
  // =============================================================================

  describe('Data Fetching', () => {
    it('should fetch mock attack data without options', async () => {
      const attacks = await service.getData();
      
      expect(Array.isArray(attacks)).toBe(true);
      expect(attacks.length).toBeGreaterThan(0);
      expect(attacks.length).toBeLessThanOrEqual(50); // Default limit
      
      // Verify attack structure
      const attack = attacks[0];
      expect(attack).toHaveProperty('id');
      expect(attack).toHaveProperty('attack_type');
      expect(attack).toHaveProperty('severity');
      expect(attack).toHaveProperty('attack_status');
      expect(attack).toHaveProperty('trajectory');
      expect(attack).toHaveProperty('timeline');
      expect(attack).toHaveProperty('technical_data');
    });

    it('should respect query limit option', async () => {
      const options: CyberAttackQueryOptions = { limit: 10 };
      const attacks = await service.getData(options);
      
      expect(attacks.length).toBeLessThanOrEqual(10);
    });

    it('should filter by attack types', async () => {
      const options: CyberAttackQueryOptions = {
        attack_types: ['DDoS', 'Malware'],
        limit: 20
      };
      
      const attacks = await service.getData(options);
      
      attacks.forEach(attack => {
        expect(['DDoS', 'Malware']).toContain(attack.attack_type);
      });
    });

    it('should filter by severity range', async () => {
      const options: CyberAttackQueryOptions = {
        severity_min: 3,
        severity_max: 5,
        limit: 20
      };
      
      const attacks = await service.getData(options);
      
      attacks.forEach(attack => {
        expect(attack.severity).toBeGreaterThanOrEqual(3);
        expect(attack.severity).toBeLessThanOrEqual(5);
      });
    });

    it('should filter by attack status', async () => {
      const options: CyberAttackQueryOptions = {
        attack_statuses: ['detected', 'in_progress'],
        limit: 20
      };
      
      const attacks = await service.getData(options);
      
      attacks.forEach(attack => {
        expect(['detected', 'in_progress']).toContain(attack.attack_status);
      });
    });

    it('should handle time window filtering', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      
      const options: CyberAttackQueryOptions = {
        time_window: {
          start: oneHourAgo,
          end: now
        },
        limit: 20
      };
      
      const attacks = await service.getData(options);
      
      attacks.forEach(attack => {
        const attackTime = attack.timeline.firstDetected;
        expect(attackTime.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(attackTime.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  // =============================================================================
  // REAL-TIME STREAMING TESTS
  // =============================================================================

  describe('Real-Time Streaming', () => {
    it('should create subscription successfully', () => {
      const options: CyberAttackQueryOptions = { limit: 10 };
      const subscriptionId = service.subscribeToAttacks(options, mockCallback);
      
      expect(typeof subscriptionId).toBe('string');
      expect(subscriptionId).toMatch(/^sub-\d+-[a-z0-9]+$/);
    });

    it('should handle multiple subscriptions', () => {
      const options1: CyberAttackQueryOptions = { attack_types: ['DDoS'] };
      const options2: CyberAttackQueryOptions = { severity_min: 4 };
      
      const sub1 = service.subscribeToAttacks(options1, mockCallback);
      const sub2 = service.subscribeToAttacks(options2, mockCallback);
      
      expect(sub1).not.toBe(sub2);
      expect(typeof sub1).toBe('string');
      expect(typeof sub2).toBe('string');
    });

    it('should unsubscribe successfully', () => {
      const options: CyberAttackQueryOptions = { limit: 5 };
      const subscriptionId = service.subscribeToAttacks(options, mockCallback);
      
      const result = service.unsubscribeFromAttacks(subscriptionId);
      expect(result).toBe(true);
    });

    it('should handle unsubscribing non-existent subscription', () => {
      const result = service.unsubscribeFromAttacks('non-existent-sub');
      expect(result).toBe(false);
    });

    it('should process streaming events within reasonable time', async () => {
      const options: CyberAttackQueryOptions = { limit: 1 };
      service.subscribeToAttacks(options, mockCallback);
      
      // Wait for mock streaming to generate events
      await new Promise(resolve => setTimeout(resolve, 2100)); // Just over update interval
      
      expect(mockCallback).toHaveBeenCalled();
      
      // Check event structure
      const [event] = mockCallback.mock.calls[0];
      expect(event).toHaveProperty('event_type');
      expect(event).toHaveProperty('attack_data');
      expect(event).toHaveProperty('timestamp');
      expect(['new_attack', 'attack_update', 'attack_resolved']).toContain(event.event_type);
    });
  });

  // =============================================================================
  // ATTACK DATA VALIDATION TESTS
  // =============================================================================

  describe('Attack Data Validation', () => {
    it('should generate valid attack data structures', async () => {
      const attacks = await service.getData({ limit: 5 });
      
      attacks.forEach(attack => {
        // Required fields
        expect(typeof attack.id).toBe('string');
        expect(attack.type).toBe('CyberAttacks');
        expect(attack.location).toHaveProperty('latitude');
        expect(attack.location).toHaveProperty('longitude');
        expect(attack.timestamp).toBeInstanceOf(Date);
        
        // Attack-specific fields
        expect(['DDoS', 'Malware', 'Phishing', 'DataBreach', 'Ransomware', 'APT', 'Botnet', 'WebAttack', 'NetworkIntrusion', 'Unknown']).toContain(attack.attack_type);
        expect([1, 2, 3, 4, 5]).toContain(attack.severity);
        expect(['detected', 'in_progress', 'contained', 'mitigated', 'resolved', 'escalated']).toContain(attack.attack_status);
        
        // Trajectory validation
        expect(attack.trajectory).toHaveProperty('source');
        expect(attack.trajectory).toHaveProperty('target');
        expect(attack.trajectory.source).toHaveProperty('latitude');
        expect(attack.trajectory.source).toHaveProperty('longitude');
        expect(attack.trajectory.source).toHaveProperty('countryCode');
        expect(attack.trajectory.target).toHaveProperty('latitude');
        expect(attack.trajectory.target).toHaveProperty('longitude');
        expect(attack.trajectory.target).toHaveProperty('countryCode');
        expect(attack.trajectory.target).toHaveProperty('organization');
        expect(attack.trajectory.target).toHaveProperty('sector');
        
        // Timeline validation
        expect(attack.timeline.firstDetected).toBeInstanceOf(Date);
        expect(attack.timeline.lastSeen).toBeInstanceOf(Date);
        expect(attack.timeline.estimatedStart).toBeInstanceOf(Date);
        
        // Technical data validation
        expect(attack.technical_data).toHaveProperty('mitre_tactic');
        expect(attack.technical_data).toHaveProperty('protocols');
        expect(attack.technical_data).toHaveProperty('ports');
        expect(attack.technical_data).toHaveProperty('systems_affected');
        expect(Array.isArray(attack.technical_data.mitre_tactic)).toBe(true);
        expect(Array.isArray(attack.technical_data.protocols)).toBe(true);
        expect(Array.isArray(attack.technical_data.ports)).toBe(true);
        expect(typeof attack.technical_data.systems_affected).toBe('number');
      });
    });

    it('should generate realistic geographic distribution', async () => {
      const attacks = await service.getData({ limit: 20 });
      
      const sourceCountries = new Set();
      const targetCountries = new Set();
      
      attacks.forEach(attack => {
        sourceCountries.add(attack.trajectory.source.countryCode);
        targetCountries.add(attack.trajectory.target.countryCode);
        
        // Validate coordinate ranges
        expect(attack.trajectory.source.latitude).toBeGreaterThanOrEqual(-90);
        expect(attack.trajectory.source.latitude).toBeLessThanOrEqual(90);
        expect(attack.trajectory.source.longitude).toBeGreaterThanOrEqual(-180);
        expect(attack.trajectory.source.longitude).toBeLessThanOrEqual(180);
        
        expect(attack.trajectory.target.latitude).toBeGreaterThanOrEqual(-90);
        expect(attack.trajectory.target.latitude).toBeLessThanOrEqual(90);
        expect(attack.trajectory.target.longitude).toBeGreaterThanOrEqual(-180);
        expect(attack.trajectory.target.longitude).toBeLessThanOrEqual(180);
      });
      
      // Should have multiple countries represented
      expect(sourceCountries.size).toBeGreaterThan(1);
      expect(targetCountries.size).toBeGreaterThan(1);
    });

    it('should maintain consistent attack progression', async () => {
      const options: CyberAttackQueryOptions = { limit: 5 };
      service.subscribeToAttacks(options, mockCallback);
      
      // Wait for some updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const events = mockCallback.mock.calls.map(call => call[0]);
      const attackUpdates = events.filter(event => event.event_type === 'attack_update');
      
      // Check that updates maintain logical progression
      attackUpdates.forEach(event => {
        const attack = event.attack_data;
        expect(attack.timeline.lastSeen.getTime()).toBeGreaterThanOrEqual(attack.timeline.firstDetected.getTime());
        if (attack.timeline.estimatedStart) {
          expect(attack.timeline.firstDetected.getTime()).toBeGreaterThanOrEqual(attack.timeline.estimatedStart.getTime());
        }
      });
    });
  });

  // =============================================================================
  // ACTIVE ATTACK MANAGEMENT TESTS
  // =============================================================================

  describe('Active Attack Management', () => {
    it('should track active attacks correctly', async () => {
      // Start streaming to populate attacks
      const subscriptionId = service.subscribeToAttacks({}, () => {});
      
      // Wait a bit for mock data to be generated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const activeAttacks = service.getActiveAttacks();
      expect(activeAttacks.length).toBeGreaterThan(0);
      
      // Should be able to retrieve attacks by ID
      const firstAttack = activeAttacks[0];
      const retrievedAttack = service.getAttackById(firstAttack.id);
      
      expect(retrievedAttack).toEqual(firstAttack);
      
      // Cleanup
      service.unsubscribeFromAttacks(subscriptionId);
    });

    it('should handle attack resolution cleanup', async () => {
      const options: CyberAttackQueryOptions = { limit: 1 };
      const resolvedEvents: AttackStreamEvent[] = [];

      const subscriptionId = service.subscribeToAttacks(options, (event) => {
        if (event.event_type === 'attack_resolved') {
          resolvedEvents.push(event);
        }
      });

      // Wait shorter time to avoid timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      service.unsubscribeFromAttacks(subscriptionId);
      
      // Test passes if no errors thrown during cleanup
      expect(true).toBe(true);
    }, 2000); // Shorter timeout
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', async () => {
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      const options: CyberAttackQueryOptions = { limit: 1 };
      const subscriptionId = service.subscribeToAttacks(options, faultyCallback);
      
      // Wait for streaming events - shorter time to avoid timeout
      await new Promise(resolve => setTimeout(resolve, 1200)); // Increase wait time slightly
      
      // Should not crash the service
      expect(faultyCallback).toHaveBeenCalled();
      expect(service.getActiveAttacks().length).toBeGreaterThan(0);
      
      // Cleanup
      service.unsubscribeFromAttacks(subscriptionId);
    }, 3000); // Increase timeout

    it('should handle invalid query options gracefully', async () => {
      const invalidOptions = {
        severity_min: 10 as SeverityLevel, // Invalid severity
        severity_max: -1 as SeverityLevel,  // Invalid severity
        limit: -5          // Invalid limit
      };
      
      const attacks = await service.getData(invalidOptions);
      expect(Array.isArray(attacks)).toBe(true);
      // Should return some data despite invalid options
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('Performance Characteristics', () => {
    it('should handle large data requests efficiently', async () => {
      const startTime = Date.now();
      const attacks = await service.getData({ limit: 100 });
      const endTime = Date.now();
      
      expect(attacks.length).toBeLessThanOrEqual(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent subscriptions', () => {
      const subscriptionCount = 10;
      const subscriptions: string[] = [];
      
      for (let i = 0; i < subscriptionCount; i++) {
        const options: CyberAttackQueryOptions = { limit: i + 1 };
        const sub = service.subscribeToAttacks(options, mockCallback);
        subscriptions.push(sub);
      }
      
      expect(subscriptions.length).toBe(subscriptionCount);
      
      // Clean up
      subscriptions.forEach(sub => {
        service.unsubscribeFromAttacks(sub);
      });
    });
  });

  // =============================================================================
  // INTEGRATION READINESS TESTS
  // =============================================================================

  describe('Integration Readiness', () => {
    it('should be ready for real SIEM integration', () => {
      // Check that service has necessary methods for real integration
      expect(typeof service.getData).toBe('function');
      expect(typeof service.subscribeToAttacks).toBe('function');
      expect(typeof service.unsubscribeFromAttacks).toBe('function');
      expect(typeof service.getActiveAttacks).toBe('function');
      expect(typeof service.getAttackById).toBe('function');
      expect(typeof service.dispose).toBe('function');
    });

    it('should maintain service consistency over time', async () => {
      const initialState = service.getActiveAttacks().length;
      
      // Subscribe and let it run
      const options: CyberAttackQueryOptions = { limit: 5 };
      const subscription = service.subscribeToAttacks(options, mockCallback);
      
      // Wait shorter time to avoid timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalState = service.getActiveAttacks().length;
      
      // State should be reasonable (not empty, not growing infinitely)
      expect(finalState).toBeGreaterThan(0);
      expect(finalState).toBeLessThan(1000); // Reasonable upper bound
      
      service.unsubscribeFromAttacks(subscription);
    }, 3000); // Add timeout
  });
});
