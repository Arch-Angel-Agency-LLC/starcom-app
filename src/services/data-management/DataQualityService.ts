// Enterprise Data Quality Service
// Phase 2: Enhanced Integration - Comprehensive data quality assessment and validation

import type { ProcessedElectricFieldData, SpaceWeatherAlert } from '../../types';

export interface DataQualityMetrics {
  overall: number; // 0-1 overall quality score
  completeness: number; // 0-1 data completeness
  accuracy: number; // 0-1 estimated accuracy
  timeliness: number; // 0-1 data freshness
  consistency: number; // 0-1 internal consistency
  coverage: number; // 0-1 geographic/temporal coverage
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'completeness' | 'accuracy' | 'timeliness' | 'consistency' | 'coverage';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDataPoints?: number;
  suggestedAction?: string;
}

export interface QualityValidationRule {
  id: string;
  name: string;
  category: QualityIssue['category'];
  enabled: boolean;
  validate: (data: ProcessedElectricFieldData) => QualityIssue[];
}

export interface QualityThresholds {
  minDataPoints: number;
  maxMagnitude: number; // V/m
  minQualityFlag: number;
  maxStationDistance: number; // km
  minCoverageArea: number; // square degrees
  maxDataAge: number; // hours
  minHighQualityRatio: number; // 0-1
}

export class DataQualityService {
  private static instance: DataQualityService;
  private validationRules: Map<string, QualityValidationRule> = new Map();
  private qualityThresholds: QualityThresholds;
  private metrics = {
    assessments: 0,
    totalIssues: 0,
    averageQuality: 0,
    criticalIssues: 0
  };

  constructor(thresholds?: Partial<QualityThresholds>) {
    this.qualityThresholds = {
      minDataPoints: 10,
      maxMagnitude: 1.0, // V/m - reasonable upper limit for electric fields
      minQualityFlag: 1,
      maxStationDistance: 1000, // km
      minCoverageArea: 100, // square degrees
      maxDataAge: 24, // hours
      minHighQualityRatio: 0.5,
      ...thresholds
    };

    this.initializeValidationRules();
  }

  static getInstance(thresholds?: Partial<QualityThresholds>): DataQualityService {
    if (!DataQualityService.instance) {
      DataQualityService.instance = new DataQualityService(thresholds);
    }
    return DataQualityService.instance;
  }

  /**
   * Assess comprehensive quality metrics for electric field data
   * Phase 2: Advanced quality analysis for enterprise system
   */
  async assessDataQuality(data: ProcessedElectricFieldData): Promise<DataQualityMetrics> {
    const startTime = Date.now();
    
    try {
      // Run all validation rules
      const allIssues: QualityIssue[] = [];
      
      for (const rule of this.validationRules.values()) {
        if (rule.enabled) {
          const ruleIssues = rule.validate(data);
          allIssues.push(...ruleIssues);
        }
      }

      // Calculate individual quality scores
      const completeness = this.calculateCompleteness(data);
      const accuracy = this.calculateAccuracy(data);
      const timeliness = this.calculateTimeliness(data);
      const consistency = this.calculateConsistency(data);
      const coverage = this.calculateCoverage(data);

      // Calculate overall quality score
      const overall = (completeness + accuracy + timeliness + consistency + coverage) / 5;

      // Generate recommendations
      const recommendations = this.generateRecommendations(allIssues, data);

      const qualityMetrics: DataQualityMetrics = {
        overall,
        completeness,
        accuracy,
        timeliness,
        consistency,
        coverage,
        issues: allIssues,
        recommendations
      };

      // Update service metrics
      this.updateMetrics(qualityMetrics);

      const processingTime = Date.now() - startTime;
      console.log(`📊 Quality: Assessed ${data.vectors.length} vectors in ${processingTime}ms (overall: ${(overall * 100).toFixed(1)}%)`);

      return qualityMetrics;

    } catch (error) {
      console.error('❌ Quality: Assessment failed:', error);
      
      return {
        overall: 0,
        completeness: 0,
        accuracy: 0,
        timeliness: 0,
        consistency: 0,
        coverage: 0,
        issues: [{
          type: 'error',
          category: 'accuracy',
          message: `Quality assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical'
        }],
        recommendations: ['Retry quality assessment', 'Check data format']
      };
    }
  }

  /**
   * Validate data against quality thresholds and return alerts
   */
  async validateForAlerts(data: ProcessedElectricFieldData): Promise<SpaceWeatherAlert[]> {
    const qualityMetrics = await this.assessDataQuality(data);
    const alerts: SpaceWeatherAlert[] = [];

    // Generate alerts for critical quality issues
    const criticalIssues = qualityMetrics.issues.filter(issue => issue.severity === 'critical');
    
    for (const issue of criticalIssues) {
      alerts.push({
        id: `quality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        alertType: 'infrastructure_risk',
        severity: 'high',
        regions: ['global'], // Quality issues affect all regions
        message: `Data quality issue: ${issue.message}`,
        electricFieldData: data.vectors.slice(0, 10) // Include sample data
      });
    }

    // Generate alert for overall poor quality
    if (qualityMetrics.overall < 0.3) {
      alerts.push({
        id: `quality-overall-${Date.now()}`,
        timestamp: new Date().toISOString(),
        alertType: 'infrastructure_risk',
        severity: qualityMetrics.overall < 0.1 ? 'extreme' : 'high',
        regions: ['global'],
        message: `Poor overall data quality detected: ${(qualityMetrics.overall * 100).toFixed(1)}% quality score`,
        electricFieldData: data.vectors.slice(0, 5)
      });
    }

    return alerts;
  }

  /**
   * Get current quality thresholds
   */
  getThresholds(): QualityThresholds {
    return { ...this.qualityThresholds };
  }

  /**
   * Update quality thresholds
   */
  updateThresholds(thresholds: Partial<QualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
    console.log('📊 Quality: Updated thresholds', thresholds);
  }

  /**
   * Get service performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset service metrics
   */
  resetMetrics(): void {
    this.metrics = {
      assessments: 0,
      totalIssues: 0,
      averageQuality: 0,
      criticalIssues: 0
    };
  }

  // Private implementation methods

  private initializeValidationRules(): void {
    // Completeness validation rules
    this.validationRules.set('min-data-points', {
      id: 'min-data-points',
      name: 'Minimum Data Points',
      category: 'completeness',
      enabled: true,
      validate: (data) => {
        if (data.vectors.length < this.qualityThresholds.minDataPoints) {
          return [{
            type: 'warning',
            category: 'completeness',
            message: `Insufficient data points: ${data.vectors.length} < ${this.qualityThresholds.minDataPoints}`,
            severity: 'medium',
            affectedDataPoints: data.vectors.length,
            suggestedAction: 'Increase data collection frequency or duration'
          }];
        }
        return [];
      }
    });

    // Accuracy validation rules
    this.validationRules.set('magnitude-bounds', {
      id: 'magnitude-bounds',
      name: 'Electric Field Magnitude Bounds',
      category: 'accuracy',
      enabled: true,
      validate: (data) => {
        const issues: QualityIssue[] = [];
        const extremeVectors = data.vectors.filter(v => v.magnitude > this.qualityThresholds.maxMagnitude);
        
        if (extremeVectors.length > 0) {
          issues.push({
            type: 'warning',
            category: 'accuracy',
            message: `${extremeVectors.length} vectors exceed maximum expected magnitude (${this.qualityThresholds.maxMagnitude} V/m)`,
            severity: extremeVectors.length > data.vectors.length * 0.1 ? 'high' : 'medium',
            affectedDataPoints: extremeVectors.length,
            suggestedAction: 'Review measurement calibration or filtering thresholds'
          });
        }
        
        return issues;
      }
    });

    // Quality flag validation
    this.validationRules.set('quality-flags', {
      id: 'quality-flags',
      name: 'Quality Flag Validation',
      category: 'accuracy',
      enabled: true,
      validate: (data) => {
        const issues: QualityIssue[] = [];
        const lowQualityVectors = data.vectors.filter(v => v.quality < this.qualityThresholds.minQualityFlag);
        const highQualityRatio = data.statistics.highQualityPoints / data.statistics.totalPoints;
        
        if (highQualityRatio < this.qualityThresholds.minHighQualityRatio) {
          issues.push({
            type: 'warning',
            category: 'accuracy',
            message: `Low high-quality data ratio: ${(highQualityRatio * 100).toFixed(1)}% < ${(this.qualityThresholds.minHighQualityRatio * 100).toFixed(1)}%`,
            severity: highQualityRatio < 0.2 ? 'high' : 'medium',
            affectedDataPoints: lowQualityVectors.length,
            suggestedAction: 'Improve measurement conditions or filter low-quality data'
          });
        }
        
        return issues;
      }
    });

    // Coverage validation
    this.validationRules.set('geographic-coverage', {
      id: 'geographic-coverage',
      name: 'Geographic Coverage',
      category: 'coverage',
      enabled: true,
      validate: (data) => {
        const latRange = data.coverage.maxLat - data.coverage.minLat;
        const lonRange = data.coverage.maxLon - data.coverage.minLon;
        const coverageArea = latRange * lonRange;
        
        if (coverageArea < this.qualityThresholds.minCoverageArea) {
          return [{
            type: 'info',
            category: 'coverage',
            message: `Limited geographic coverage: ${coverageArea.toFixed(1)} < ${this.qualityThresholds.minCoverageArea} square degrees`,
            severity: 'low',
            suggestedAction: 'Expand measurement network or use additional data sources'
          }];
        }
        return [];
      }
    });

    // Timeliness validation
    this.validationRules.set('data-age', {
      id: 'data-age',
      name: 'Data Timeliness',
      category: 'timeliness',
      enabled: true,
      validate: (data) => {
        const dataAge = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60); // hours
        
        if (dataAge > this.qualityThresholds.maxDataAge) {
          return [{
            type: 'warning',
            category: 'timeliness',
            message: `Data is ${dataAge.toFixed(1)} hours old, exceeding ${this.qualityThresholds.maxDataAge} hour threshold`,
            severity: dataAge > this.qualityThresholds.maxDataAge * 2 ? 'high' : 'medium',
            suggestedAction: 'Update data source or increase refresh frequency'
          }];
        }
        return [];
      }
    });
  }

  private calculateCompleteness(data: ProcessedElectricFieldData): number {
    const { vectors } = data;
    
    if (vectors.length === 0) return 0;
    
    // Check for missing or invalid data
    const completeVectors = vectors.filter(v => 
      !isNaN(v.longitude) && !isNaN(v.latitude) && 
      !isNaN(v.ex) && !isNaN(v.ey) && 
      !isNaN(v.magnitude) && !isNaN(v.direction)
    );
    
    const completenessRatio = completeVectors.length / vectors.length;
    const dataVolumeScore = Math.min(vectors.length / this.qualityThresholds.minDataPoints, 1);
    
    return (completenessRatio * 0.7 + dataVolumeScore * 0.3);
  }

  private calculateAccuracy(data: ProcessedElectricFieldData): number {
    const { vectors } = data;
    
    if (vectors.length === 0) return 0;
    
    // Quality flag assessment
    const qualityScore = data.statistics.highQualityPoints / data.statistics.totalPoints;
    
    // Magnitude plausibility
    const reasonableMagnitudes = vectors.filter(v => 
      v.magnitude >= 0 && v.magnitude <= this.qualityThresholds.maxMagnitude
    ).length;
    const magnitudeScore = reasonableMagnitudes / vectors.length;
    
    // Station distance assessment (closer stations generally more accurate)
    const validDistances = vectors.filter(v => 
      v.stationDistance >= 0 && v.stationDistance <= this.qualityThresholds.maxStationDistance
    ).length;
    const distanceScore = validDistances / vectors.length;
    
    return (qualityScore * 0.5 + magnitudeScore * 0.3 + distanceScore * 0.2);
  }

  private calculateTimeliness(data: ProcessedElectricFieldData): number {
    const dataAge = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60); // hours
    
    if (dataAge <= 1) return 1.0; // Excellent - within 1 hour
    if (dataAge <= 6) return 0.8; // Good - within 6 hours
    if (dataAge <= 24) return 0.6; // Fair - within 24 hours
    if (dataAge <= 72) return 0.4; // Poor - within 3 days
    return 0.2; // Very poor - older than 3 days
  }

  private calculateConsistency(data: ProcessedElectricFieldData): number {
    const { vectors } = data;
    
    if (vectors.length < 2) return 1; // Cannot assess consistency with < 2 points
    
    // Check magnitude-component consistency
    const consistentMagnitudes = vectors.filter(v => {
      const calculatedMagnitude = Math.sqrt(v.ex ** 2 + v.ey ** 2);
      const difference = Math.abs(v.magnitude - calculatedMagnitude);
      return difference < v.magnitude * 0.01; // Within 1% tolerance
    }).length;
    
    const magnitudeConsistency = consistentMagnitudes / vectors.length;
    
    // Check direction-component consistency
    const consistentDirections = vectors.filter(v => {
      const calculatedDirection = Math.atan2(v.ey, v.ex) * (180 / Math.PI);
      const normalizedCalculated = ((calculatedDirection % 360) + 360) % 360;
      const normalizedStored = ((v.direction % 360) + 360) % 360;
      const difference = Math.min(
        Math.abs(normalizedCalculated - normalizedStored),
        360 - Math.abs(normalizedCalculated - normalizedStored)
      );
      return difference < 5; // Within 5 degrees tolerance
    }).length;
    
    const directionConsistency = consistentDirections / vectors.length;
    
    return (magnitudeConsistency * 0.6 + directionConsistency * 0.4);
  }

  private calculateCoverage(data: ProcessedElectricFieldData): number {
    const { coverage, vectors } = data;
    
    if (vectors.length === 0) return 0;
    
    // Geographic coverage assessment
    const latRange = coverage.maxLat - coverage.minLat;
    const lonRange = coverage.maxLon - coverage.minLon;
    const coverageArea = latRange * lonRange;
    
    const areaScore = Math.min(coverageArea / this.qualityThresholds.minCoverageArea, 1);
    
    // Spatial distribution assessment
    const latBins = 10;
    const lonBins = 10;
    const latBinSize = latRange / latBins;
    const lonBinSize = lonRange / lonBins;
    
    const occupiedBins = new Set<string>();
    
    for (const vector of vectors) {
      const latBin = Math.floor((vector.latitude - coverage.minLat) / latBinSize);
      const lonBin = Math.floor((vector.longitude - coverage.minLon) / lonBinSize);
      occupiedBins.add(`${latBin},${lonBin}`);
    }
    
    const distributionScore = occupiedBins.size / (latBins * lonBins);
    
    return (areaScore * 0.6 + distributionScore * 0.4);
  }

  private generateRecommendations(issues: QualityIssue[], data: ProcessedElectricFieldData): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical data quality issues immediately');
      recommendations.push('Consider suspending data usage until issues are resolved');
    }
    
    if (highIssues.length > 0) {
      recommendations.push('Review and address high-severity quality issues');
    }
    
    if (data.statistics.totalPoints < this.qualityThresholds.minDataPoints) {
      recommendations.push('Increase data collection frequency or duration');
    }
    
    if (data.statistics.highQualityPoints / data.statistics.totalPoints < 0.5) {
      recommendations.push('Improve measurement conditions or filtering');
    }
    
    const dataAge = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60);
    if (dataAge > this.qualityThresholds.maxDataAge) {
      recommendations.push('Update data refresh frequency for more timely data');
    }
    
    return recommendations;
  }

  private updateMetrics(qualityMetrics: DataQualityMetrics): void {
    this.metrics.assessments++;
    this.metrics.totalIssues += qualityMetrics.issues.length;
    this.metrics.criticalIssues += qualityMetrics.issues.filter(i => i.severity === 'critical').length;
    
    // Update average quality (running average)
    this.metrics.averageQuality = (
      (this.metrics.averageQuality * (this.metrics.assessments - 1) + qualityMetrics.overall) / 
      this.metrics.assessments
    );
  }
}

export default DataQualityService;
