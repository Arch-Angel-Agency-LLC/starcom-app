/**
 * Unit tests for CyberCommand visualization types
 * Testing type guards, validation functions, and data sanitization
 */

import {
  VisualizationType,
  GeoCoordinate,
  VisualizationData,
  PERFORMANCE_LIMITS,
  DEFAULT_VISUALIZATION_SETTINGS,
  isValidVisualizationType,
  isValidPriority,
  validateGeoCoordinate,
  sanitizeVisualizationData,
  VisualizationError
} from '../CyberCommandVisualization';

describe('CyberCommandVisualization Types', () => {
  
  // =============================================================================
  // TYPE GUARD TESTS
  // =============================================================================
  
  describe('isValidVisualizationType', () => {
    test('should return true for valid visualization types', () => {
      expect(isValidVisualizationType('IntelReports')).toBe(true);
      expect(isValidVisualizationType('CyberAttacks')).toBe(true);
      expect(isValidVisualizationType('CyberThreats')).toBe(true);
      expect(isValidVisualizationType('NetworkInfrastructure')).toBe(true);
      expect(isValidVisualizationType('CommHubs')).toBe(true);
    });

    test('should return false for invalid visualization types', () => {
      expect(isValidVisualizationType('InvalidType')).toBe(false);
      expect(isValidVisualizationType('')).toBe(false);
      expect(isValidVisualizationType('intelreports')).toBe(false); // case sensitive
      expect(isValidVisualizationType('cyber-attacks')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isValidVisualizationType(null as unknown as string)).toBe(false);
      expect(isValidVisualizationType(undefined as unknown as string)).toBe(false);
      expect(isValidVisualizationType(123 as unknown as string)).toBe(false);
    });
  });

  describe('isValidPriority', () => {
    test('should return true for valid priorities', () => {
      expect(isValidPriority('low')).toBe(true);
      expect(isValidPriority('medium')).toBe(true);
      expect(isValidPriority('high')).toBe(true);
      expect(isValidPriority('critical')).toBe(true);
    });

    test('should return false for invalid priorities', () => {
      expect(isValidPriority('urgent')).toBe(false);
      expect(isValidPriority('LOW')).toBe(false); // case sensitive
      expect(isValidPriority('')).toBe(false);
      expect(isValidPriority('1')).toBe(false);
    });
  });

  // =============================================================================
  // GEO COORDINATE VALIDATION TESTS
  // =============================================================================
  
  describe('validateGeoCoordinate', () => {
    test('should validate correct coordinates', () => {
      const validCoords: GeoCoordinate[] = [
        { latitude: 0, longitude: 0 },
        { latitude: 40.7128, longitude: -74.0060 }, // NYC
        { latitude: -90, longitude: -180 }, // extreme valid values
        { latitude: 90, longitude: 180 }, // extreme valid values
        { latitude: 51.5074, longitude: -0.1278, altitude: 100 }, // London with altitude
      ];

      validCoords.forEach(coord => {
        expect(validateGeoCoordinate(coord)).toBe(true);
      });
    });

    test('should reject invalid coordinates', () => {
      const invalidCoords = [
        { latitude: 91, longitude: 0 }, // latitude too high
        { latitude: -91, longitude: 0 }, // latitude too low
        { latitude: 0, longitude: 181 }, // longitude too high
        { latitude: 0, longitude: -181 }, // longitude too low
        { latitude: 'invalid', longitude: 0 }, // non-numeric latitude
        { latitude: 0, longitude: 'invalid' }, // non-numeric longitude
        { longitude: 0 }, // missing latitude
        { latitude: 0 }, // missing longitude
        null,
        undefined,
        'string',
        123,
        { lat: 40, lng: -74 }, // wrong property names
      ];

      invalidCoords.forEach(coord => {
        expect(validateGeoCoordinate(coord)).toBe(false);
      });
    });
  });

  // =============================================================================
  // DATA SANITIZATION TESTS
  // =============================================================================
  
  describe('sanitizeVisualizationData', () => {
    const validRawData = {
      id: 'test-123',
      type: 'IntelReports',
      location: { latitude: 40.7128, longitude: -74.0060 },
      timestamp: new Date('2025-07-19T10:00:00Z'),
      metadata: { source: 'test', confidence: 0.9 },
      priority: 'high',
      status: 'active'
    };

    test('should sanitize valid data correctly', () => {
      const result = sanitizeVisualizationData(validRawData);
      
      expect(result).toEqual({
        id: 'test-123',
        type: 'IntelReports',
        location: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date('2025-07-19T10:00:00Z'),
        metadata: { source: 'test', confidence: 0.9 },
        priority: 'high',
        status: 'active'
      });
    });

    test('should handle missing metadata gracefully', () => {
      const dataWithoutMetadata = { ...validRawData };
      delete (dataWithoutMetadata as { metadata?: unknown }).metadata;
      
      const result = sanitizeVisualizationData(dataWithoutMetadata);
      expect(result?.metadata).toEqual({});
    });

    test('should use default values for invalid priority/status', () => {
      const dataWithInvalidValues = {
        ...validRawData,
        priority: 'invalid-priority',
        status: 'invalid-status'
      };
      
      const result = sanitizeVisualizationData(dataWithInvalidValues);
      expect(result?.priority).toBe('medium');
      expect(result?.status).toBe('active');
    });

    test('should return null for invalid data', () => {
      const invalidDataSets = [
        null,
        undefined,
        'string',
        123,
        {},
        { id: 'test' }, // missing required fields
        { ...validRawData, id: null }, // invalid id
        { ...validRawData, type: 'InvalidType' }, // invalid type
        { ...validRawData, location: { latitude: 91, longitude: 0 } }, // invalid location
        { ...validRawData, timestamp: 'invalid-date' }, // invalid timestamp
      ];

      invalidDataSets.forEach(data => {
        expect(sanitizeVisualizationData(data)).toBeNull();
      });
    });
  });

  // =============================================================================
  // DEFAULT SETTINGS TESTS
  // =============================================================================
  
  describe('DEFAULT_VISUALIZATION_SETTINGS', () => {
    test('should have settings for all visualization types', () => {
      const expectedTypes: VisualizationType[] = [
        'IntelReports',
        'CyberAttacks', 
        'CyberThreats',
        'NetworkInfrastructure',
        'CommHubs'
      ];

      expectedTypes.forEach(type => {
        expect(DEFAULT_VISUALIZATION_SETTINGS[type]).toBeDefined();
        expect(DEFAULT_VISUALIZATION_SETTINGS[type].type).toBe(type);
      });
    });

    test('should have valid default values', () => {
      Object.values(DEFAULT_VISUALIZATION_SETTINGS).forEach(settings => {
        expect(settings.opacity).toBeGreaterThanOrEqual(0);
        expect(settings.opacity).toBeLessThanOrEqual(100);
        expect(settings.refreshInterval).toBeGreaterThan(0);
        expect(settings.maxDataPoints).toBeGreaterThan(0);
        expect(settings.animationSpeed).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(settings.detailLevel);
      });
    });

    test('should have realistic refresh intervals based on data type', () => {
      // CyberAttacks should refresh most frequently (real-time)
      expect(DEFAULT_VISUALIZATION_SETTINGS.CyberAttacks.refreshInterval).toBeLessThan(
        DEFAULT_VISUALIZATION_SETTINGS.IntelReports.refreshInterval
      );

      // NetworkInfrastructure should refresh least frequently (static data)
      expect(DEFAULT_VISUALIZATION_SETTINGS.NetworkInfrastructure.refreshInterval).toBeGreaterThan(
        DEFAULT_VISUALIZATION_SETTINGS.CyberAttacks.refreshInterval
      );
    });
  });

  // =============================================================================
  // PERFORMANCE LIMITS TESTS
  // =============================================================================
  
  describe('PERFORMANCE_LIMITS', () => {
    test('should have reasonable performance limits', () => {
      expect(PERFORMANCE_LIMITS.maxObjectsPerScene).toBeGreaterThan(0);
      expect(PERFORMANCE_LIMITS.maxRefreshRate).toBeGreaterThan(0);
      expect(PERFORMANCE_LIMITS.memoryThreshold).toBeGreaterThan(0);
      expect(PERFORMANCE_LIMITS.minFrameRate).toBeGreaterThan(0);
      expect(PERFORMANCE_LIMITS.maxDataPointsPerVisualization).toBeGreaterThan(0);
      expect(PERFORMANCE_LIMITS.maxConcurrentRequests).toBeGreaterThan(0);
    });

    test('should have limits that make sense relative to each other', () => {
      expect(PERFORMANCE_LIMITS.maxDataPointsPerVisualization).toBeLessThanOrEqual(
        PERFORMANCE_LIMITS.maxObjectsPerScene
      );
      expect(PERFORMANCE_LIMITS.minFrameRate).toBeLessThanOrEqual(60); // Reasonable FPS
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================
  
  describe('VisualizationError', () => {
    test('should create error with correct properties', () => {
      const error = new VisualizationError(
        'Test error message',
        'IntelReports',
        'TEST_ERROR',
        true
      );

      expect(error.message).toBe('Test error message');
      expect(error.type).toBe('IntelReports');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('VisualizationError');
      expect(error).toBeInstanceOf(Error);
    });

    test('should default retryable to false', () => {
      const error = new VisualizationError(
        'Test error',
        'CyberAttacks',
        'NON_RETRYABLE'
      );

      expect(error.retryable).toBe(false);
    });
  });

  // =============================================================================
  // INTERFACE COMPLIANCE TESTS
  // =============================================================================
  
  describe('Interface Compliance', () => {
    test('VisualizationData should be serializable', () => {
      const data: VisualizationData = {
        id: 'test-123',
        type: 'IntelReports',
        location: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: new Date(),
        metadata: { test: 'value' },
        priority: 'high',
        status: 'active'
      };

      expect(() => JSON.stringify(data)).not.toThrow();
      
      const serialized = JSON.stringify(data);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.id).toBe(data.id);
      expect(parsed.type).toBe(data.type);
      expect(parsed.location).toEqual(data.location);
      expect(parsed.priority).toBe(data.priority);
      expect(parsed.status).toBe(data.status);
    });

    test('should have valid ranges for settings', () => {
      Object.values(DEFAULT_VISUALIZATION_SETTINGS).forEach(settings => {
        // Opacity should be 0-100
        expect(settings.opacity).toBeGreaterThanOrEqual(0);
        expect(settings.opacity).toBeLessThanOrEqual(100);
        
        // Animation speed should be reasonable
        expect(settings.animationSpeed).toBeGreaterThan(0);
        expect(settings.animationSpeed).toBeLessThanOrEqual(3);
        
        // Refresh interval should be at least 1 second
        expect(settings.refreshInterval).toBeGreaterThanOrEqual(1000);
      });
    });
  });
});
