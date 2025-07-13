// Intel to Report Transformation - Key Missing Piece
// This addresses the main gap in transforming raw Intel into structured IntelReports

import { Intel } from './Intel';
import { IntelligenceReportData } from './IntelligenceReport';
import { ClassificationLevel } from './Classification';
import { SourceMetadata, CollectionMethod, SourcePlatform, DataQuality } from './Sources';

/**
 * Intel Fusion Service
 * The missing piece that transforms multiple raw Intel records into comprehensive Intelligence Reports
 */
export class IntelFusionService {
  
  /**
   * Transform multiple Intel records into a comprehensive Intelligence Report
   * This is the key missing transformation logic
   */
  static fuseIntelIntoReport(
    intelRecords: Intel[],
    analysisContext: {
      analystId: string;
      reportTitle: string;
      analysisMethod?: string;
      keyQuestions: string[];
      timeframe: { start: number; end: number };
    }
  ): Partial<IntelligenceReportData> {
    
    if (!intelRecords.length) {
      throw new Error('Cannot create report without intel records');
    }

    // Determine geographic scope
    const coordinates = intelRecords
      .filter(intel => intel.latitude && intel.longitude)
      .map(intel => ({
        latitude: intel.latitude!,
        longitude: intel.longitude!,
        description: `Intel from ${intel.source}`
      }));

    // Aggregate sources and determine overall reliability
    const sources = [...new Set(intelRecords.map(intel => intel.source))];
    const avgReliability = this.calculateAverageReliability(intelRecords);
    const overallClassification = this.determineHighestClassification(intelRecords);

    // Generate structured content
    const content = this.generateReportContent(intelRecords, analysisContext);
    const keyFindings = this.extractKeyFindings(intelRecords);
    const recommendations = this.generateRecommendations(intelRecords);

    return {
      id: this.generateId(),
      title: analysisContext.reportTitle,
      content,
      reportType: 'ANALYSIS_REPORT',
      
      // Content structure
      executiveSummary: this.generateExecutiveSummary(intelRecords, keyFindings),
      keyFindings,
      analysisAndAssessment: content,
      conclusions: this.generateConclusions(intelRecords, keyFindings),
      recommendations,
      intelligenceGaps: this.identifyIntelligenceGaps(intelRecords, analysisContext.keyQuestions),
      
      // Classification - use highest from source intel
      classification: {
        level: overallClassification
      },
      
      // Source attribution
      sources: intelRecords.map(intel => this.convertIntelToSourceMetadata(intel)),
      sourceSummary: `Analysis based on ${intelRecords.length} intelligence reports from ${sources.length} distinct sources`,
      collectionDisciplines: sources,
      
      // Geographic scope
      geographicScope: {
        type: coordinates.length > 0 ? 'SPECIFIC' : 'GLOBAL',
        coordinates: coordinates.length > 0 ? coordinates : undefined
      },
      
      // Timeframe
      timeframe: analysisContext.timeframe,
      
      // Quality metrics
      confidence: this.calculateReportConfidence(intelRecords, avgReliability),
      reliabilityScore: avgReliability,
      completeness: this.assessCompleteness(intelRecords, analysisContext.keyQuestions),
      timeliness: this.assessTimeliness(intelRecords),
      
      // Production metadata
      author: analysisContext.analystId,
      timestamp: Date.now(),
      
      // Legacy compatibility
      tags: this.aggregateTags(intelRecords),
      latitude: coordinates[0]?.latitude,
      longitude: coordinates[0]?.longitude
    };
  }

  /**
   * Calculate average reliability from multiple intel sources
   */
  private static calculateAverageReliability(intelRecords: Intel[]): number {
    const reliabilityScores = {
      'A': 100, 'B': 80, 'C': 60, 'D': 40, 'E': 20, 'F': 10, 'X': 0
    };
    
    const totalScore = intelRecords.reduce((sum, intel) => {
      return sum + (reliabilityScores[intel.reliability] || 0);
    }, 0);
    
    return Math.round(totalScore / intelRecords.length);
  }

  /**
   * Determine highest classification level from intel records
   */
  private static determineHighestClassification(intelRecords: Intel[]): ClassificationLevel {
    const levels = ['UNCLASS', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    let highest = 'UNCLASS';
    
    for (const intel of intelRecords) {
      const currentIndex = levels.indexOf(intel.classification);
      const highestIndex = levels.indexOf(highest);
      if (currentIndex > highestIndex) {
        highest = intel.classification;
      }
    }
    
    return highest as ClassificationLevel;
  }

  /**
   * Generate report content from intel data
   */
  private static generateReportContent(
    intelRecords: Intel[], 
    context: {
      analystId: string;
      reportTitle: string;
      keyQuestions: string[];
      timeframe: { start: number; end: number };
    }
  ): string {
    let content = '# Intelligence Analysis Report\n\n';
    content += '## Overview\n';
    content += `This report analyzes ${intelRecords.length} intelligence records collected between ${new Date(context.timeframe.start).toLocaleDateString()} and ${new Date(context.timeframe.end).toLocaleDateString()}.\n\n`;
    
    content += '## Source Summary\n';
    const sourceCounts = intelRecords.reduce((acc, intel) => {
      acc[intel.source] = (acc[intel.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (const [source, count] of Object.entries(sourceCounts)) {
      content += `- ${source}: ${count} reports\n`;
    }
    
    content += '\n## Detailed Analysis\n';
    content += 'Analysis of collected intelligence reveals patterns and insights across multiple sources and timeframes.\n\n';
    
    return content;
  }

  /**
   * Extract key findings from intel data
   */
  private static extractKeyFindings(intelRecords: Intel[]): string[] {
    const findings: string[] = [];
    
    // Geographic clustering
    const locations = intelRecords.filter(intel => intel.latitude && intel.longitude);
    if (locations.length > 1) {
      findings.push(`Intelligence activity identified across ${locations.length} geographic locations`);
    }
    
    // Source diversity
    const uniqueSources = new Set(intelRecords.map(intel => intel.source));
    if (uniqueSources.size > 2) {
      findings.push(`Multi-source intelligence corroboration from ${uniqueSources.size} disciplines`);
    }
    
    // Reliability assessment
    const highReliability = intelRecords.filter(intel => ['A', 'B'].includes(intel.reliability));
    if (highReliability.length > 0) {
      findings.push(`${highReliability.length} high-reliability intelligence reports confirm key assessments`);
    }
    
    return findings.length > 0 ? findings : ['Analysis of collected intelligence data completed'];
  }

  /**
   * Generate recommendations based on intel analysis
   */
  private static generateRecommendations(intelRecords: Intel[]): string[] {
    const recommendations: string[] = [];
    
    // Based on classification levels
    const classified = intelRecords.filter(intel => intel.classification !== 'UNCLASS');
    if (classified.length > 0) {
      recommendations.push('Maintain appropriate security controls for classified intelligence');
    }
    
    // Based on reliability concerns
    const lowReliability = intelRecords.filter(intel => ['D', 'E', 'F', 'X'].includes(intel.reliability));
    if (lowReliability.length > 0) {
      recommendations.push('Seek additional sources to corroborate low-reliability intelligence');
    }
    
    return recommendations.length > 0 ? recommendations : ['Continue intelligence collection and analysis'];
  }

  // Additional helper methods
  private static generateExecutiveSummary(intelRecords: Intel[], keyFindings: string[]): string {
    return `Analysis of ${intelRecords.length} intelligence records reveals ${keyFindings.length} key findings requiring attention.`;
  }

  private static generateConclusions(intelRecords: Intel[], keyFindings: string[]): string {
    const activity = keyFindings.length > 0 ? 'significant findings' : 'routine activity';
    return `Based on analysis of ${intelRecords.length} intelligence reports, the intelligence picture indicates ${activity}.`;
  }

  private static identifyIntelligenceGaps(intelRecords: Intel[], keyQuestions: string[]): string[] {
    const gaps: string[] = [];
    
    if (keyQuestions.length > intelRecords.length) {
      gaps.push('Insufficient intelligence to answer all priority intelligence requirements');
    }
    
    return gaps;
  }

  private static convertIntelToSourceMetadata(intel: Intel): SourceMetadata {
    return {
      primary: intel.source as any,
      method: 'MANUAL' as CollectionMethod,
      platform: 'GROUND' as SourcePlatform,
      quality: this.mapReliabilityToQuality(intel.reliability) as DataQuality,
      
      sourceId: intel.collectedBy,
      collectionDate: intel.timestamp,
      
      custodyChain: [intel.collectedBy],
      lastHandler: intel.collectedBy,
      confidence: this.mapReliabilityToConfidence(intel.reliability),
      completeness: intel.verified ? 90 : 70,
      timeliness: this.calculateTimeliness(intel.timestamp)
    };
  }

  private static mapReliabilityToQuality(reliability: string): string {
    const mapping = {
      'A': 'VERIFIED', 'B': 'ANALYZED', 'C': 'CORRELATED',
      'D': 'FILTERED', 'E': 'RAW', 'F': 'RAW', 'X': 'RAW'
    };
    return mapping[reliability as keyof typeof mapping] || 'RAW';
  }

  private static calculateTimeliness(timestamp: number): number {
    const age = Date.now() - timestamp;
    const dayMs = 24 * 60 * 60 * 1000;
    
    if (age < dayMs) return 100;
    if (age < 7 * dayMs) return 80;
    if (age < 30 * dayMs) return 60;
    return 40;
  }

  private static mapReliabilityToConfidence(reliability: string): number {
    const mapping = { 'A': 95, 'B': 85, 'C': 75, 'D': 60, 'E': 40, 'F': 30, 'X': 10 };
    return mapping[reliability as keyof typeof mapping] || 50;
  }

  private static calculateReportConfidence(intelRecords: Intel[], avgReliability: number): number {
    const sourceCount = new Set(intelRecords.map(intel => intel.source)).size;
    const sourceBonus = Math.min(sourceCount * 10, 30);
    return Math.min(95, avgReliability + sourceBonus);
  }

  private static assessCompleteness(intelRecords: Intel[], keyQuestions: string[]): number {
    const ratio = intelRecords.length / Math.max(keyQuestions.length, 1);
    return Math.min(100, ratio * 80);
  }

  private static assessTimeliness(intelRecords: Intel[]): number {
    const now = Date.now();
    const avgAge = intelRecords.reduce((sum, intel) => sum + (now - intel.timestamp), 0) / intelRecords.length;
    const dayMs = 24 * 60 * 60 * 1000;
    
    if (avgAge < dayMs) return 100;
    if (avgAge < 7 * dayMs) return 80;
    return 60;
  }

  private static aggregateTags(intelRecords: Intel[]): string[] {
    const allTags = intelRecords.flatMap(intel => intel.tags || []);
    return [...new Set(allTags)];
  }

  private static generateId(): string {
    return 'intel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
