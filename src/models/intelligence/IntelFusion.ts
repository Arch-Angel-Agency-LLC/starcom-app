// Simplified Intel Fusion Service for UI
// Uses the base Intel types from intelligence directory

import { Intel } from './Intel';
import { IntelligenceReportData } from './IntelligenceReport';

interface AnalysisContext {
  analystId: string;
  reportTitle: string;
  keyQuestions: string[];
  timeframe: { start: number; end: number };
}

export class IntelFusionService {
  static fuseIntelIntoReport(
    intelRecords: Intel[],
    analysisContext: AnalysisContext
  ): Partial<IntelligenceReportData> {
    
    if (!intelRecords.length) {
      throw new Error('Cannot create report without intel records');
    }

    // Calculate average reliability
    const reliabilityScores = {
      'A': 100, 'B': 80, 'C': 60, 'D': 40, 'E': 20, 'F': 10, 'X': 0
    };
    
    const totalScore = intelRecords.reduce((sum, intel) => {
      return sum + (reliabilityScores[intel.reliability as keyof typeof reliabilityScores] || 0);
    }, 0);
    
    const avgReliability = Math.round(totalScore / intelRecords.length);

    // Determine highest classification
    const levels = ['UNCLASS', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    let highest = 'UNCLASS';
    
    for (const intel of intelRecords) {
      const currentIndex = levels.indexOf(intel.classification);
      const highestIndex = levels.indexOf(highest);
      if (currentIndex > highestIndex) {
        highest = intel.classification;
      }
    }

    // Generate coordinates
    const coordinates = intelRecords
      .filter(intel => intel.latitude && intel.longitude)
      .map(intel => ({
        latitude: intel.latitude!,
        longitude: intel.longitude!,
        description: `Intel from ${intel.source}`
      }));

    // Generate key findings
    const keyFindings = [];
    const uniqueSources = new Set(intelRecords.map(intel => intel.source));
    
    if (uniqueSources.size > 2) {
      keyFindings.push(`Multi-source intelligence corroboration from ${uniqueSources.size} disciplines`);
    }
    
    const highReliability = intelRecords.filter(intel => ['A', 'B'].includes(intel.reliability));
    if (highReliability.length > 0) {
      keyFindings.push(`${highReliability.length} high-reliability intelligence reports confirm key assessments`);
    }
    
    if (coordinates.length > 1) {
      keyFindings.push(`Intelligence activity identified across ${coordinates.length} geographic locations`);
    }

    // Generate executive summary
    const executiveSummary = `Analysis of ${intelRecords.length} intelligence records reveals ${keyFindings.length} key findings requiring attention.`;

    // Generate content
    const content = `# Intelligence Analysis Report

## Overview
This report analyzes ${intelRecords.length} intelligence records collected between ${new Date(analysisContext.timeframe.start).toLocaleDateString()} and ${new Date(analysisContext.timeframe.end).toLocaleDateString()}.

## Source Summary
${Array.from(uniqueSources).map(source => `- ${source}: ${intelRecords.filter(r => r.source === source).length} reports`).join('\n')}

## Detailed Analysis
Analysis of collected intelligence reveals patterns and insights across multiple sources and timeframes.`;

    // Generate recommendations
    const recommendations = [];
    const classified = intelRecords.filter(intel => intel.classification !== 'UNCLASS');
    if (classified.length > 0) {
      recommendations.push('Maintain appropriate security controls for classified intelligence');
    }
    
    const lowReliability = intelRecords.filter(intel => ['D', 'E', 'F', 'X'].includes(intel.reliability));
    if (lowReliability.length > 0) {
      recommendations.push('Seek additional sources to corroborate low-reliability intelligence');
    }

    return {
      id: 'intel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: analysisContext.reportTitle,
      content,
      reportType: 'ANALYSIS_REPORT',
      
      // Content structure
      executiveSummary,
      keyFindings: keyFindings.length > 0 ? keyFindings : ['Analysis of collected intelligence data completed'],
      analysisAndAssessment: content,
      conclusions: `Based on analysis of ${intelRecords.length} intelligence reports, the intelligence picture indicates ${keyFindings.length > 0 ? 'significant findings' : 'routine activity'} requiring attention.`,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue intelligence collection and analysis'],
      intelligenceGaps: analysisContext.keyQuestions.length > intelRecords.length ? ['Insufficient intelligence to answer all priority intelligence requirements'] : [],
      
      // Classification
      classification: {
        level: highest
      },
      
      // Source attribution
      sources: intelRecords.map(intel => ({
        primary: intel.source,
        sourceId: intel.collectedBy,
        collectionDate: intel.timestamp,
        confidence: reliabilityScores[intel.reliability as keyof typeof reliabilityScores] || 50,
        reliability: intel.reliability
      })),
      sourceSummary: `Analysis based on ${intelRecords.length} intelligence reports from ${uniqueSources.size} distinct sources`,
      collectionDisciplines: Array.from(uniqueSources),
      
      // Geographic scope
      geographicScope: {
        type: coordinates.length > 0 ? 'SPECIFIC' : 'GLOBAL',
        coordinates: coordinates.length > 0 ? coordinates : undefined
      },
      
      // Timeframe
      timeframe: analysisContext.timeframe,
      
      // Quality metrics
      confidence: Math.min(95, avgReliability + Math.min(uniqueSources.size * 10, 30)),
      reliabilityScore: avgReliability,
      completeness: Math.min(100, (intelRecords.length / Math.max(analysisContext.keyQuestions.length, 1)) * 80),
      timeliness: 85, // Simplified calculation
      
      // Production metadata
      author: analysisContext.analystId,
      timestamp: Date.now(),
      
      // Legacy compatibility
      tags: [...new Set(intelRecords.flatMap(intel => intel.tags || []))],
      latitude: coordinates[0]?.latitude,
      longitude: coordinates[0]?.longitude
    };
  }
}
