/**
 * Improved Time Data Types
 * Replaces generic 'any' with proper generics
 */

export interface CacheEntry<T = unknown> {
  timestamp: number;
  data: T[];
}

export interface TimestampedData<T = unknown> {
  timestamp: number;
  value: T;
  metadata?: Record<string, unknown>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimeSeriesData<T = unknown> {
  timeRange: TimeRange;
  entries: TimestampedData<T>[];
  sampleRate?: number; // Hz
  interpolationMethod?: 'linear' | 'cubic' | 'nearest';
}

export interface TemporalQuery {
  timeRange: TimeRange;
  resolution?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
  aggregation?: 'sum' | 'average' | 'min' | 'max' | 'count';
}
