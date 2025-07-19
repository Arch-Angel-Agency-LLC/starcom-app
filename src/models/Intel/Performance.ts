// Collection Performance and Feedback
// Performance tracking and optimization for intelligence collection

/**
 * Feedback types for collection assessment
 */
export type FeedbackType = 'QUALITY' | 'TIMELINESS' | 'RELEVANCE' | 'COMPLETENESS';

/**
 * Risk level assessment
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Risk factor for collection operations
 */
export interface RiskFactor {
  factor: string;
  likelihood: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // calculated
}

/**
 * Risk assessment for collection activities
 */
export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationMeasures: string[];
  acceptableRisk: boolean;
  lastAssessed: number;
}

/**
 * Feedback entry from analysts and operators
 */
export interface FeedbackEntry {
  timestamp: number;
  feedbackType: FeedbackType;
  rating: number; // 1-5
  comments: string;
  analyst: string;
  actionItems: string[];
}

/**
 * Collection performance metrics
 */
export interface CollectionPerformance {
  collectionEfficiency: number; // 0-100
  responseTime: number; // milliseconds
  accuracyRating: number; // 0-100
  costEffectiveness: number; // 0-100
  riskAssessment: RiskAssessment;
  feedbackLoop: FeedbackEntry[];
  improvementRecommendations: string[];
}

/**
 * Performance analytics and trends
 */
export interface PerformanceAnalytics {
  averageResponseTime: number;
  successRate: number;
  qualityTrends: number[]; // historical quality scores
  efficiencyTrends: number[]; // historical efficiency scores
  topRiskFactors: string[];
  improvementOpportunities: string[];
}

/**
 * Collection performance utilities
 */
export class PerformanceTracker {
  /**
   * Calculate overall performance score
   */
  static calculateOverallScore(performance: CollectionPerformance): number {
    return (
      performance.collectionEfficiency * 0.30 +
      performance.accuracyRating * 0.30 +
      performance.costEffectiveness * 0.20 +
      this.calculateTimelinessScore(performance.responseTime) * 0.20
    );
  }

  /**
   * Calculate timeliness score from response time
   */
  private static calculateTimelinessScore(responseTimeMs: number): number {
    const responseTimeHours = responseTimeMs / (1000 * 60 * 60);
    
    // Score based on response time thresholds
    if (responseTimeHours <= 1) return 100;
    if (responseTimeHours <= 4) return 90;
    if (responseTimeHours <= 12) return 75;
    if (responseTimeHours <= 24) return 60;
    if (responseTimeHours <= 48) return 40;
    return 20;
  }

  /**
   * Calculate risk score from factors
   */
  static calculateRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;
    
    const totalRisk = factors.reduce((sum, factor) => sum + factor.riskScore, 0);
    return totalRisk / factors.length;
  }

  /**
   * Generate improvement recommendations
   */
  static generateRecommendations(performance: CollectionPerformance): string[] {
    const recommendations: string[] = [];

    if (performance.collectionEfficiency < 70) {
      recommendations.push('Optimize collection processes to improve efficiency');
    }

    if (performance.responseTime > 24 * 60 * 60 * 1000) { // 24 hours
      recommendations.push('Reduce collection response time through automation');
    }

    if (performance.accuracyRating < 80) {
      recommendations.push('Enhance quality control measures for better accuracy');
    }

    if (performance.riskAssessment.overallRisk === 'HIGH' || performance.riskAssessment.overallRisk === 'CRITICAL') {
      recommendations.push('Implement additional risk mitigation measures');
    }

    // Add feedback-based recommendations
    const recentFeedback = performance.feedbackLoop
      .filter(f => Date.now() - f.timestamp < 30 * 24 * 60 * 60 * 1000) // Last 30 days
      .filter(f => f.rating < 3);

    if (recentFeedback.length > 0) {
      recommendations.push('Address recent negative feedback from analysts');
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  static analyzePerformanceTrends(performanceHistory: CollectionPerformance[]): PerformanceAnalytics {
    if (performanceHistory.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        qualityTrends: [],
        efficiencyTrends: [],
        topRiskFactors: [],
        improvementOpportunities: []
      };
    }

    const avgResponseTime = performanceHistory.reduce((sum, p) => sum + p.responseTime, 0) / performanceHistory.length;
    const avgEfficiency = performanceHistory.reduce((sum, p) => sum + p.collectionEfficiency, 0) / performanceHistory.length;
    
    // Aggregate risk factors
    const allRiskFactors = performanceHistory.flatMap(p => p.riskAssessment.riskFactors);
    const riskFactorCounts = new Map<string, number>();
    
    allRiskFactors.forEach(rf => {
      riskFactorCounts.set(rf.factor, (riskFactorCounts.get(rf.factor) || 0) + 1);
    });

    const topRiskFactors = Array.from(riskFactorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);

    // Aggregate improvement opportunities
    const allRecommendations = performanceHistory.flatMap(p => p.improvementRecommendations);
    const uniqueRecommendations = Array.from(new Set(allRecommendations));

    return {
      averageResponseTime: avgResponseTime,
      successRate: avgEfficiency,
      qualityTrends: performanceHistory.map(p => p.accuracyRating),
      efficiencyTrends: performanceHistory.map(p => p.collectionEfficiency),
      topRiskFactors,
      improvementOpportunities: uniqueRecommendations.slice(0, 10)
    };
  }
}
