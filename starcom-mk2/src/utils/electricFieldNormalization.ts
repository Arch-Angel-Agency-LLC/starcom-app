// src/utils/electricFieldNormalization.ts
// AI-NOTE: Advanced normalization utilities for electric field data visualization
// Implements multiple normalization strategies to handle extreme values and provide
// more visually balanced representations of NOAA geomagnetic data

import { ElectricFieldVector } from '../types/spaceWeather';

export interface NormalizationConfig {
  method: 'linear' | 'logarithmic' | 'percentile' | 'statistical' | 'adaptive';
  clampMin?: number;
  clampMax?: number;
  percentileRange?: [number, number]; // e.g., [10, 90] for 10th to 90th percentile
  outlierFactor?: number; // Factor for outlier detection (e.g., 1.5 for IQR method)
  smoothingFactor?: number; // 0-1, higher values = more smoothing
}

export interface NormalizedVector extends ElectricFieldVector {
  normalizedMagnitude: number; // 0-1 range
  originalMagnitude: number;   // Store original for reference
  isOutlier: boolean;         // Flag for extreme values
  percentileRank: number;     // 0-100 percentile rank
}

/**
 * Calculate statistical metrics for a dataset
 */
function calculateStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const medianIndex = Math.floor(n * 0.5);
  
  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median: sorted[medianIndex],
    stdDev,
    q1: sorted[q1Index],
    q3: sorted[q3Index],
    iqr: sorted[q3Index] - sorted[q1Index],
    percentiles: (p: number) => sorted[Math.floor(n * p / 100)] || sorted[n - 1]
  };
}

/**
 * Detect outliers using IQR method
 */
function detectOutliers(values: number[], factor = 1.5): Set<number> {
  const stats = calculateStatistics(values);
  const lowerBound = stats.q1 - factor * stats.iqr;
  const upperBound = stats.q3 + factor * stats.iqr;
  
  const outliers = new Set<number>();
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.add(index);
    }
  });
  
  return outliers;
}

/**
 * Linear normalization with optional clamping
 */
function normalizeLinear(
  values: number[], 
  config: NormalizationConfig
): number[] {
  const min = config.clampMin ?? Math.min(...values);
  const max = config.clampMax ?? Math.max(...values);
  const range = max - min;
  
  if (range === 0) return values.map(() => 0.5);
  
  return values.map(value => {
    const clamped = Math.max(min, Math.min(max, value));
    return (clamped - min) / range;
  });
}

/**
 * Logarithmic normalization - good for data with exponential distribution
 */
function normalizeLogarithmic(
  values: number[], 
  config: NormalizationConfig
): number[] {
  // Add small epsilon to handle zero values
  const epsilon = 1e-10;
  const logValues = values.map(v => Math.log(Math.max(v, epsilon) + 1));
  
  const minLog = config.clampMin ? Math.log(config.clampMin + 1) : Math.min(...logValues);
  const maxLog = config.clampMax ? Math.log(config.clampMax + 1) : Math.max(...logValues);
  const range = maxLog - minLog;
  
  if (range === 0) return values.map(() => 0.5);
  
  return logValues.map(logValue => {
    const clamped = Math.max(minLog, Math.min(maxLog, logValue));
    return (clamped - minLog) / range;
  });
}

/**
 * Percentile-based normalization - robust against outliers
 */
function normalizePercentile(
  values: number[], 
  config: NormalizationConfig
): number[] {
  const [lowPercentile, highPercentile] = config.percentileRange || [5, 95];
  const stats = calculateStatistics(values);
  
  const minValue = stats.percentiles(lowPercentile);
  const maxValue = stats.percentiles(highPercentile);
  const range = maxValue - minValue;
  
  if (range === 0) return values.map(() => 0.5);
  
  return values.map(value => {
    const clamped = Math.max(minValue, Math.min(maxValue, value));
    return (clamped - minValue) / range;
  });
}

/**
 * Statistical normalization using Z-score with sigmoid transformation
 */
function normalizeStatistical(
  values: number[], 
  config: NormalizationConfig
): number[] {
  const stats = calculateStatistics(values);
  const outlierFactor = config.outlierFactor || 2.0;
  
  return values.map(value => {
    // Calculate Z-score
    const zScore = stats.stdDev > 0 ? (value - stats.mean) / stats.stdDev : 0;
    
    // Clamp extreme Z-scores to reduce outlier impact
    const clampedZScore = Math.max(-outlierFactor, Math.min(outlierFactor, zScore));
    
    // Transform to 0-1 range using sigmoid function
    return 1 / (1 + Math.exp(-clampedZScore));
  });
}

/**
 * Adaptive normalization that combines multiple methods based on data distribution
 */
function normalizeAdaptive(
  values: number[], 
  config: NormalizationConfig
): number[] {
  const stats = calculateStatistics(values);
  
  // Analyze data distribution characteristics
  const coeffOfVariation = stats.stdDev / stats.mean;
  const skewness = calculateSkewness(values, stats.mean, stats.stdDev);
  
  // Choose normalization method based on data characteristics
  if (coeffOfVariation > 1.5) {
    // High variability - use logarithmic
    return normalizeLogarithmic(values, config);
  } else if (Math.abs(skewness) > 1.0) {
    // Highly skewed - use percentile
    return normalizePercentile(values, { ...config, percentileRange: [10, 90] });
  } else {
    // Relatively normal distribution - use statistical
    return normalizeStatistical(values, config);
  }
}

/**
 * Calculate skewness of a dataset
 */
function calculateSkewness(values: number[], mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  
  const n = values.length;
  const sumCubes = values.reduce((sum, val) => {
    const standardized = (val - mean) / stdDev;
    return sum + Math.pow(standardized, 3);
  }, 0);
  
  return sumCubes / n;
}

/**
 * Apply smoothing to normalized values to reduce visual noise
 */
function applySmoothing(values: number[], factor: number): number[] {
  if (factor <= 0) return values;
  
  const smoothed = [...values];
  const kernelSize = Math.max(1, Math.floor(values.length * factor * 0.1));
  
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - kernelSize); j <= Math.min(values.length - 1, i + kernelSize); j++) {
      sum += values[j];
      count++;
    }
    
    smoothed[i] = sum / count;
  }
  
  return smoothed;
}

/**
 * Main normalization function that processes electric field vectors
 */
export function normalizeElectricFieldVectors(
  vectors: ElectricFieldVector[],
  config: NormalizationConfig
): NormalizedVector[] {
  if (vectors.length === 0) return [];
  
  // Extract magnitudes for normalization
  const magnitudes = vectors.map(v => v.magnitude);
  const outliers = detectOutliers(magnitudes, config.outlierFactor);
  
  // Apply selected normalization method
  let normalizedMagnitudes: number[];
  
  switch (config.method) {
    case 'linear':
      normalizedMagnitudes = normalizeLinear(magnitudes, config);
      break;
    case 'logarithmic':
      normalizedMagnitudes = normalizeLogarithmic(magnitudes, config);
      break;
    case 'percentile':
      normalizedMagnitudes = normalizePercentile(magnitudes, config);
      break;
    case 'statistical':
      normalizedMagnitudes = normalizeStatistical(magnitudes, config);
      break;
    case 'adaptive':
      normalizedMagnitudes = normalizeAdaptive(magnitudes, config);
      break;
    default:
      normalizedMagnitudes = normalizeLinear(magnitudes, config);
  }
  
  // Apply smoothing if requested
  if (config.smoothingFactor && config.smoothingFactor > 0) {
    normalizedMagnitudes = applySmoothing(normalizedMagnitudes, config.smoothingFactor);
  }
  
  // Calculate percentile ranks
  const sortedMagnitudes = [...magnitudes].sort((a, b) => a - b);
  
  // Combine with original vector data
  return vectors.map((vector, index) => ({
    ...vector,
    normalizedMagnitude: normalizedMagnitudes[index],
    originalMagnitude: vector.magnitude,
    isOutlier: outliers.has(index),
    percentileRank: calculatePercentileRank(vector.magnitude, sortedMagnitudes)
  }));
}

/**
 * Calculate percentile rank of a value in a sorted array
 */
function calculatePercentileRank(value: number, sortedValues: number[]): number {
  let count = 0;
  for (const val of sortedValues) {
    if (val < value) count++;
    else if (val === value) count += 0.5; // Count half for equal values
  }
  
  if (sortedValues.length === 0) return 0;
  return Math.min(100, Math.max(0, (count / sortedValues.length) * 100));
}

/**
 * Predefined normalization configurations for common use cases
 */
export const NormalizationPresets = {
  // Conservative approach - gentle normalization with outlier protection
  conservative: {
    method: 'percentile' as const,
    percentileRange: [10, 90] as [number, number],
    smoothingFactor: 0.2
  },
  
  // Balanced approach - good for most datasets
  balanced: {
    method: 'adaptive' as const,
    outlierFactor: 1.5,
    smoothingFactor: 0.1
  },
  
  // Aggressive approach - strong outlier suppression
  aggressive: {
    method: 'statistical' as const,
    outlierFactor: 1.0,
    smoothingFactor: 0.3
  },
  
  // Scientific approach - preserves data characteristics
  scientific: {
    method: 'logarithmic' as const,
    clampMin: 0.001,
    smoothingFactor: 0.05
  }
} as const;
