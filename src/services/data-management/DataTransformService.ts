// Enterprise Data Transform Service
// Phase 2: Enhanced Integration - Centralized data transformation pipeline

import { normalizeElectricFieldVectors, NormalizationConfig } from '../../utils/electricFieldNormalization';
import type { ProcessedElectricFieldData, ElectricFieldVector } from '../../types';
import type { NOAAElectricFieldData as EnterpriseElectricFieldData } from './providers/NOAADataTypes';

export interface TransformationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metrics: {
    inputSize: number;
    outputSize: number;
    transformationTime: number;
    qualityScore: number; // 0-1
  };
}

export interface DataCorrelationRequest {
  electricField?: {
    interMag?: ProcessedElectricFieldData;
    usCanada?: ProcessedElectricFieldData;
  };
  solarWind?: unknown; // TODO: Add solar wind types in Phase 3
  geomagnetic?: unknown; // TODO: Add geomagnetic types
  options: {
    timeWindow: number; // minutes
    correlationThreshold: number; // 0-1
    includeStatistics: boolean;
  };
}

export interface CorrelatedSpaceWeatherData {
  timestamp: string;
  electricField: {
    totalVectors: number;
    highQualityVectors: number;
    coverage: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
    maxFieldStrength: number;
    avgFieldStrength: number;
  };
  correlation: {
    confidence: number; // 0-1
    patterns: string[];
    anomalies: string[];
  };
  quality: {
    score: number; // 0-1
    issues: string[];
    dataCompleteness: number; // 0-1
  };
}

export class DataTransformService {
  private static instance: DataTransformService;
  private metrics = {
    transformations: 0,
    correlations: 0,
    totalProcessingTime: 0,
    averageQualityScore: 0
  };

  static getInstance(): DataTransformService {
    if (!DataTransformService.instance) {
      DataTransformService.instance = new DataTransformService();
    }
    return DataTransformService.instance;
  }

  /**
   * Transform raw electric field data with advanced normalization
   * Phase 2: Integrates legacy normalization logic into enterprise pipeline
   */
  async transformElectricFieldData(
    rawData: EnterpriseElectricFieldData,
    normalizationConfig: NormalizationConfig
  ): Promise<TransformationResult<ProcessedElectricFieldData>> {
    const startTime = Date.now();
    
    try {
      // Convert enterprise format to processed format
      const vectors: ElectricFieldVector[] = rawData.features.map(feature => ({
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        ex: feature.properties.Ex,
        ey: feature.properties.Ey,
        magnitude: Math.sqrt(feature.properties.Ex ** 2 + feature.properties.Ey ** 2),
        direction: Math.atan2(feature.properties.Ey, feature.properties.Ex) * (180 / Math.PI),
        quality: feature.properties.quality_flag || 1,
        stationDistance: feature.properties.distance_nearest_station || 0
      }));

      // Apply advanced normalization
      const normalizedVectors = normalizeElectricFieldVectors(vectors, normalizationConfig);

      // Calculate statistics
      const latitudes = vectors.map(v => v.latitude);
      const longitudes = vectors.map(v => v.longitude);
      const magnitudes = vectors.map(v => v.magnitude);

      const processedData: ProcessedElectricFieldData = {
        timestamp: rawData.time_tag || new Date().toISOString(),
        source: rawData.network === 'InterMag' ? 'InterMagEarthScope' : 'US-Canada-1D',
        vectors: normalizedVectors,
        coverage: {
          minLat: Math.min(...latitudes),
          maxLat: Math.max(...latitudes),
          minLon: Math.min(...longitudes),
          maxLon: Math.max(...longitudes)
        },
        statistics: {
          totalPoints: vectors.length,
          highQualityPoints: vectors.filter(v => v.quality >= 3).length,
          maxFieldStrength: Math.max(...magnitudes),
          avgFieldStrength: magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length
        }
      };

      // Calculate quality score
      const qualityScore = this.calculateDataQuality(processedData);
      const processingTime = Date.now() - startTime;

      // Update metrics
      this.metrics.transformations++;
      this.metrics.totalProcessingTime += processingTime;
      this.metrics.averageQualityScore = (
        (this.metrics.averageQualityScore * (this.metrics.transformations - 1) + qualityScore) / 
        this.metrics.transformations
      );

      console.log(`🔄 Transform: Processed ${vectors.length} electric field vectors in ${processingTime}ms (quality: ${(qualityScore * 100).toFixed(1)}%)`);

      return {
        success: true,
        data: processedData,
        metrics: {
          inputSize: rawData.features.length,
          outputSize: normalizedVectors.length,
          transformationTime: processingTime,
          qualityScore
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown transformation error';
      
      console.error('❌ Transform: Electric field transformation failed:', error);
      
      return {
        success: false,
        error: errorMessage,
        metrics: {
          inputSize: rawData.features?.length || 0,
          outputSize: 0,
          transformationTime: processingTime,
          qualityScore: 0
        }
      };
    }
  }

  /**
   * Correlate multiple space weather data sources
   * Phase 2: Foundation for multi-source analysis
   */
  async correlateSpaceWeatherData(
    request: DataCorrelationRequest
  ): Promise<TransformationResult<CorrelatedSpaceWeatherData>> {
    const startTime = Date.now();
    
    try {
      const { electricField, options } = request;
      
      if (!electricField?.interMag && !electricField?.usCanada) {
        throw new Error('At least one electric field dataset required for correlation');
      }

      // Combine electric field data
      const allVectors = [
        ...(electricField.interMag?.vectors || []),
        ...(electricField.usCanada?.vectors || [])
      ];

      // Calculate combined statistics
      const magnitudes = allVectors.map(v => v.magnitude);
      const qualityScores = allVectors.map(v => v.quality);

      // Basic correlation analysis (Phase 2 foundation)
      const correlationPatterns = this.analyzeElectricFieldPatterns(allVectors);
      const anomalies = this.detectAnomalies(allVectors);
      
      // Calculate correlation confidence
      const confidence = this.calculateCorrelationConfidence(allVectors, options);
      
      // Calculate overall quality
      const dataCompleteness = allVectors.length > 0 ? 
        qualityScores.filter(q => q >= 3).length / qualityScores.length : 0;
      
      const qualityScore = (confidence + dataCompleteness) / 2;

      const correlatedData: CorrelatedSpaceWeatherData = {
        timestamp: new Date().toISOString(),
        electricField: {
          totalVectors: allVectors.length,
          highQualityVectors: allVectors.filter(v => v.quality >= 3).length,
          coverage: this.calculateCombinedCoverage(electricField),
          maxFieldStrength: Math.max(...magnitudes, 0),
          avgFieldStrength: magnitudes.length > 0 ? 
            magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length : 0
        },
        correlation: {
          confidence,
          patterns: correlationPatterns,
          anomalies
        },
        quality: {
          score: qualityScore,
          issues: this.identifyQualityIssues(allVectors),
          dataCompleteness
        }
      };

      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.metrics.correlations++;
      this.metrics.totalProcessingTime += processingTime;

      console.log(`🔗 Correlate: Analyzed ${allVectors.length} vectors in ${processingTime}ms (confidence: ${(confidence * 100).toFixed(1)}%)`);

      return {
        success: true,
        data: correlatedData,
        metrics: {
          inputSize: allVectors.length,
          outputSize: 1, // Single correlation result
          transformationTime: processingTime,
          qualityScore
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown correlation error';
      
      console.error('❌ Correlate: Space weather correlation failed:', error);
      
      return {
        success: false,
        error: errorMessage,
        metrics: {
          inputSize: 0,
          outputSize: 0,
          transformationTime: processingTime,
          qualityScore: 0
        }
      };
    }
  }

  /**
   * Get service metrics and performance statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.transformations > 0 ? 
        this.metrics.totalProcessingTime / this.metrics.transformations : 0
    };
  }

  /**
   * Reset service metrics
   */
  resetMetrics() {
    this.metrics = {
      transformations: 0,
      correlations: 0,
      totalProcessingTime: 0,
      averageQualityScore: 0
    };
  }

  // Private helper methods

  private calculateDataQuality(data: ProcessedElectricFieldData): number {
    const { statistics } = data;
    
    if (statistics.totalPoints === 0) return 0;
    
    // Quality factors
    const highQualityRatio = statistics.highQualityPoints / statistics.totalPoints;
    const coverageScore = this.calculateCoverageScore(data.coverage);
    const dataCompletenessScore = Math.min(statistics.totalPoints / 100, 1); // Prefer more data points
    
    return (highQualityRatio * 0.5 + coverageScore * 0.3 + dataCompletenessScore * 0.2);
  }

  private calculateCoverageScore(coverage: ProcessedElectricFieldData['coverage']): number {
    // Calculate how well the data covers the expected geographic range
    const latRange = coverage.maxLat - coverage.minLat;
    const lonRange = coverage.maxLon - coverage.minLon;
    
    // Ideal coverage for electric field data (rough estimates)
    const idealLatRange = 40; // degrees
    const idealLonRange = 60; // degrees
    
    const latScore = Math.min(latRange / idealLatRange, 1);
    const lonScore = Math.min(lonRange / idealLonRange, 1);
    
    return (latScore + lonScore) / 2;
  }

  private analyzeElectricFieldPatterns(vectors: ElectricFieldVector[]): string[] {
    const patterns: string[] = [];
    
    if (vectors.length === 0) return patterns;
    
    const magnitudes = vectors.map(v => v.magnitude);
    const avgMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    const maxMagnitude = Math.max(...magnitudes);
    
    // Pattern detection
    if (maxMagnitude > avgMagnitude * 3) {
      patterns.push('high-intensity-hotspots');
    }
    
    if (avgMagnitude > 0.01) { // V/m threshold
      patterns.push('elevated-background-activity');
    }
    
    // Geographic clustering analysis
    const highIntensityVectors = vectors.filter(v => v.magnitude > avgMagnitude * 2);
    if (highIntensityVectors.length > vectors.length * 0.1) {
      patterns.push('widespread-activity');
    }
    
    return patterns;
  }

  private detectAnomalies(vectors: ElectricFieldVector[]): string[] {
    const anomalies: string[] = [];
    
    if (vectors.length === 0) return anomalies;
    
    const magnitudes = vectors.map(v => v.magnitude);
    const avgMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    const maxMagnitude = Math.max(...magnitudes);
    
    // Anomaly detection
    if (maxMagnitude > avgMagnitude * 10) {
      anomalies.push('extreme-field-strength');
    }
    
    const lowQualityCount = vectors.filter(v => v.quality < 2).length;
    if (lowQualityCount > vectors.length * 0.2) {
      anomalies.push('poor-data-quality');
    }
    
    return anomalies;
  }

  private calculateCorrelationConfidence(
    vectors: ElectricFieldVector[], 
    _options: DataCorrelationRequest['options']
  ): number {
    if (vectors.length === 0) return 0;
    
    // Base confidence factors
    const dataVolumeScore = Math.min(vectors.length / 100, 1);
    const qualityScore = vectors.filter(v => v.quality >= 3).length / vectors.length;
    const timelinessScore = 1.0; // TODO: Implement time-based scoring
    
    return (dataVolumeScore * 0.4 + qualityScore * 0.4 + timelinessScore * 0.2);
  }

  private calculateCombinedCoverage(electricField: DataCorrelationRequest['electricField']) {
    const allLatitudes: number[] = [];
    const allLongitudes: number[] = [];
    
    if (electricField?.interMag) {
      allLatitudes.push(...electricField.interMag.vectors.map(v => v.latitude));
      allLongitudes.push(...electricField.interMag.vectors.map(v => v.longitude));
    }
    
    if (electricField?.usCanada) {
      allLatitudes.push(...electricField.usCanada.vectors.map(v => v.latitude));
      allLongitudes.push(...electricField.usCanada.vectors.map(v => v.longitude));
    }
    
    return {
      minLat: Math.min(...allLatitudes),
      maxLat: Math.max(...allLatitudes),
      minLon: Math.min(...allLongitudes),
      maxLon: Math.max(...allLongitudes)
    };
  }

  private identifyQualityIssues(vectors: ElectricFieldVector[]): string[] {
    const issues: string[] = [];
    
    if (vectors.length === 0) {
      issues.push('no-data-available');
      return issues;
    }
    
    const lowQualityRatio = vectors.filter(v => v.quality < 3).length / vectors.length;
    if (lowQualityRatio > 0.3) {
      issues.push('high-low-quality-ratio');
    }
    
    const missingDistanceData = vectors.filter(v => v.stationDistance === 0).length;
    if (missingDistanceData > vectors.length * 0.5) {
      issues.push('missing-station-distance-data');
    }
    
    return issues;
  }
}

export default DataTransformService;
