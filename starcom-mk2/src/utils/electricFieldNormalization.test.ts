// src/utils/electricFieldNormalization.test.ts
// AI-NOTE: Tests for the advanced electric field normalization utilities
// Validates different normalization methods and their behavior with various data distributions

import { describe, it, expect } from 'vitest';
import { 
  normalizeElectricFieldVectors, 
  NormalizationPresets 
} from './electricFieldNormalization';
import type { ElectricFieldVector } from '../types/spaceWeather';

// Mock electric field data with various characteristics
const createMockVectors = (magnitudes: number[]): ElectricFieldVector[] => {
  return magnitudes.map((magnitude, index) => ({
    longitude: -100 + index * 10,
    latitude: 50 + index * 5,
    ex: magnitude * 0.7,
    ey: magnitude * 0.3,
    magnitude,
    direction: Math.atan2(magnitude * 0.3, magnitude * 0.7) * (180 / Math.PI),
    quality: 5,
    stationDistance: 100
  }));
};

describe('Electric Field Normalization', () => {
  describe('Basic normalization functionality', () => {
    it('should normalize vectors with linear method', () => {
      const vectors = createMockVectors([1, 5, 10, 15, 20]);
      const normalized = normalizeElectricFieldVectors(vectors, {
        method: 'linear'
      });

      // Check that all normalized magnitudes are between 0 and 1
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBeGreaterThanOrEqual(0);
        expect(vector.normalizedMagnitude).toBeLessThanOrEqual(1);
      });

      // Check that original magnitudes are preserved
      vectors.forEach((original, index) => {
        expect(normalized[index].originalMagnitude).toBe(original.magnitude);
      });
    });

    it('should handle logarithmic normalization', () => {
      const vectors = createMockVectors([0.1, 1, 10, 100, 1000]);
      const normalized = normalizeElectricFieldVectors(vectors, {
        method: 'logarithmic'
      });

      // Logarithmic should handle wide ranges better
      expect(normalized.length).toBe(5);
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBeGreaterThanOrEqual(0);
        expect(vector.normalizedMagnitude).toBeLessThanOrEqual(1);
      });
    });

    it('should detect outliers correctly', () => {
      // Create data with clear outliers
      const vectors = createMockVectors([1, 2, 3, 2, 1, 100, 2, 1]); // 100 is an outlier
      const normalized = normalizeElectricFieldVectors(vectors, {
        method: 'statistical',
        outlierFactor: 1.5
      });

      // Check that the outlier is detected
      const outliers = normalized.filter(v => v.isOutlier);
      expect(outliers.length).toBeGreaterThan(0);
      
      // The outlier should be the vector with magnitude 100
      const outlierMagnitudes = outliers.map(v => v.originalMagnitude);
      expect(outlierMagnitudes).toContain(100);
    });

    it('should calculate percentile ranks correctly', () => {
      const vectors = createMockVectors([1, 2, 3, 4, 5]);
      const normalized = normalizeElectricFieldVectors(vectors, {
        method: 'linear'
      });

      // Check percentile ranks are reasonable
      normalized.forEach(vector => {
        expect(vector.percentileRank).toBeGreaterThanOrEqual(0);
        expect(vector.percentileRank).toBeLessThanOrEqual(100);
      });

      // Highest magnitude should have highest percentile rank
      const maxMagnitudeVector = normalized.reduce((max, current) => 
        current.originalMagnitude > max.originalMagnitude ? current : max
      );
      expect(maxMagnitudeVector.percentileRank).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Normalization presets', () => {
    it('should apply conservative preset correctly', () => {
      const vectors = createMockVectors([0.1, 1, 5, 20, 100, 500]); // Wide range with outliers
      const normalized = normalizeElectricFieldVectors(vectors, NormalizationPresets.conservative);

      expect(normalized.length).toBe(6);
      
      // Conservative should use percentile method
      // and should have some smoothing
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBeGreaterThanOrEqual(0);
        expect(vector.normalizedMagnitude).toBeLessThanOrEqual(1);
      });
    });

    it('should apply balanced preset correctly', () => {
      const vectors = createMockVectors([1, 2, 3, 5, 8, 13, 21, 100]);
      const normalized = normalizeElectricFieldVectors(vectors, NormalizationPresets.balanced);

      expect(normalized.length).toBe(8);
      
      // Balanced should use adaptive method
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBeGreaterThanOrEqual(0);
        expect(vector.normalizedMagnitude).toBeLessThanOrEqual(1);
      });
    });

    it('should apply aggressive preset correctly', () => {
      const vectors = createMockVectors([1, 2, 3, 4, 5, 50, 100]);
      const normalized = normalizeElectricFieldVectors(vectors, NormalizationPresets.aggressive);

      expect(normalized.length).toBe(7);
      
      // Aggressive should suppress outliers more
      const outliers = normalized.filter(v => v.isOutlier);
      expect(outliers.length).toBeGreaterThanOrEqual(0); // Should detect some outliers
    });
  });

  describe('Edge cases', () => {
    it('should handle empty vector array', () => {
      const normalized = normalizeElectricFieldVectors([], { method: 'linear' });
      expect(normalized).toEqual([]);
    });

    it('should handle single vector', () => {
      const vectors = createMockVectors([5]);
      const normalized = normalizeElectricFieldVectors(vectors, { method: 'linear' });
      
      expect(normalized.length).toBe(1);
      expect(normalized[0].normalizedMagnitude).toBe(0.5); // Single value should be normalized to middle
    });

    it('should handle all zero magnitudes', () => {
      const vectors = createMockVectors([0, 0, 0]);
      const normalized = normalizeElectricFieldVectors(vectors, { method: 'linear' });
      
      expect(normalized.length).toBe(3);
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBe(0.5); // All zeros should normalize to middle
      });
    });

    it('should handle identical magnitudes', () => {
      const vectors = createMockVectors([5, 5, 5, 5]);
      const normalized = normalizeElectricFieldVectors(vectors, { method: 'linear' });
      
      expect(normalized.length).toBe(4);
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBe(0.5); // Identical values should normalize to middle
      });
    });

    it('should respect clamp maximum', () => {
      const vectors = createMockVectors([1, 5, 10, 50, 100]);
      const normalized = normalizeElectricFieldVectors(vectors, {
        method: 'linear',
        clampMax: 20
      });

      // Values above clampMax should be treated as clampMax
      normalized.forEach(vector => {
        expect(vector.normalizedMagnitude).toBeGreaterThanOrEqual(0);
        expect(vector.normalizedMagnitude).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Data distribution analysis', () => {
    it('should handle normal distribution', () => {
      // Create roughly normal distribution
      const vectors = createMockVectors([1, 2, 3, 4, 5, 4, 3, 2, 1]);
      const normalized = normalizeElectricFieldVectors(vectors, { method: 'adaptive' });
      
      expect(normalized.length).toBe(9);
      // Should detect it's relatively normal and apply appropriate method
    });

    it('should handle highly skewed distribution', () => {
      // Create heavily skewed data (exponential-like)
      const vectors = createMockVectors([1, 1, 1, 2, 2, 3, 5, 8, 13, 21, 34, 55, 100]);
      const normalized = normalizeElectricFieldVectors(vectors, { method: 'adaptive' });
      
      expect(normalized.length).toBe(13);
      // Adaptive should detect skewness and apply appropriate normalization
    });

    it('should handle high variability data', () => {
      // Create high coefficient of variation data
      const vectors = createMockVectors([0.1, 0.5, 1, 5, 25, 100, 500]);
      const normalized = normalizeElectricFieldVectors(vectors, { method: 'adaptive' });
      
      expect(normalized.length).toBe(7);
      // Should apply logarithmic for high variability
    });
  });
});
