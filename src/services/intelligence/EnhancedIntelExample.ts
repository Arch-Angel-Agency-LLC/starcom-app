/**
 * Enhanced Intel Operations Example
 * 
 * This demonstrates how the enhanced Intel.ts functionality would be used
 * in real-world intelligence operations with proper lifecycle management,
 * collection tasking, and operational workflow integration.
 */

import { 
  EnhancedIntel, 
  IntelOperations, 
  CollectionTasking, 
  TaskingPriority,
  ProcessingPriority,
  IntelDataLifecycle,
  RealTimeProcessingStatus,
  IntelFusionMetadata,
  CollectionPerformance
} from '../../models/Intel';
import { ClassificationLevel } from '../../models/Intel/Classification';
import { PrimaryIntelSource } from '../../models/Intel/Sources';

// =============================================================================
// ENHANCED INTELLIGENCE WORKFLOW EXAMPLE
// =============================================================================

export class EnhancedIntelligenceWorkflow {

  /**
   * Example: High-priority intelligence collection and processing
   */
  async processHighPriorityIntel(): Promise<void> {
    console.log('🔥 Processing High-Priority Intelligence Collection');

    // Create collection tasking for immediate threat
    const tasking: CollectionTasking = {
      taskingId: 'TASK-2024-001',
      priority: 'IMMEDIATE',
      deadline: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
      requestingOrganization: 'THREAT-INTEL-UNIT',
      specificRequirements: [
        'Identify threat actor capabilities',
        'Assess immediate risk to infrastructure',
        'Determine attack vector probability'
      ],
      collectionMethod: ['SIGINT', 'CYBER', 'OSINT'],
      geographicScope: {
        region: 'CONUS',
        country: 'USA',
        coordinates: { lat: 40.7128, lon: -74.0060 },
        radius: 50
      },
      targetEntities: ['APT-29', 'LAZARUS-GROUP'],
      successCriteria: [
        'Technical indicators identified',
        'Attack timeline established',
        'Mitigation recommendations provided'
      ],
      resourcesRequired: ['SIGINT-ANALYST', 'CYBER-ANALYST', 'OSINT-COLLECTOR'],
      status: 'ASSIGNED',
      assignedCollectors: ['analyst-001', 'analyst-002'],
      created: Date.now(),
      lastUpdated: Date.now()
    };

    // Create enhanced intel with comprehensive lifecycle management
    const enhancedIntel: EnhancedIntel = {
      // Base intel properties
      id: 'INTEL-2024-001',
      source: 'SIGINT',
      classification: 'SECRET',
      reliability: 'B',
      timestamp: Date.now(),
      collectedBy: 'sigint-sensor-array-001',
      metadata: {
        collection_platform: 'NSA-SIGINT-001',
        processing_version: '2.1.0',
        confidence_score: 85
      },
      data: {
        threat_indicators: ['malicious_ip_ranges', 'c2_domains'],
        attack_vectors: ['spear_phishing', 'supply_chain'],
        timeline: 'immediate_to_72_hours'
      },

      // Enhanced properties
      taskingReference: tasking,
      collectionPriority: 'IMMEDIATE',

      lifecycle: {
        collectionTimestamp: Date.now(),
        processingTimestamp: undefined,
        analysisTimestamp: undefined,
        disseminationTimestamp: undefined,
        lastAccessedTimestamp: Date.now(),
        accessCount: 1,
        retentionPolicy: {
          classificationBased: true,
          retentionPeriodDays: 2555, // 7 years for SECRET
          archiveAfterDays: 1825, // 5 years
          autoDestruction: true,
          legalHold: false,
          policyVersion: '1.2',
          lastReviewed: Date.now()
        },
        destructionDate: undefined,
        archiveStatus: 'ACTIVE',
        dataLineage: [{
          timestamp: Date.now(),
          operation: 'COLLECTED',
          operator: 'automated-collection-system',
          system: 'SIGINT-PLATFORM-001',
          changes: ['initial_collection'],
          confidence: 85
        }],
        qualityHistory: [{
          timestamp: Date.now(),
          assessor: 'quality-control-system',
          reliabilityRating: 'B',
          completeness: 80,
          timeliness: 95,
          accuracy: 85,
          relevance: 90,
          confidence: 85,
          notes: 'High-confidence SIGINT collection with immediate relevance'
        }],
        versionHistory: [{
          version: '1.0',
          timestamp: Date.now(),
          changes: ['initial_version'],
          operator: 'collection-system',
          previousVersion: undefined
        }]
      },

      realTimeStatus: {
        isRealTime: true,
        priority: 'CRITICAL',
        alertTriggers: [{
          triggerId: 'THREAT-ALERT-001',
          condition: {
            field: 'threat_level',
            operator: 'GREATER_THAN',
            value: 80,
            sensitivity: 90
          },
          alertLevel: 'CRITICAL',
          recipients: ['threat-intel-team', 'incident-response'],
          message: 'Immediate threat detected requiring urgent response',
          enabled: true
        }],
        processingDeadline: Date.now() + (30 * 60 * 1000), // 30 minutes
        escalationRules: [{
          condition: 'processing_time > 15_minutes',
          delayMinutes: 15,
          escalateTo: ['supervisor', 'duty-officer'],
          actions: ['notify_management', 'prioritize_processing']
        }],
        notificationTargets: ['threat-intel-team', 'cyber-ops', 'incident-response'],
        automatedActions: [{
          actionId: 'AUTO-PROCESS-001',
          trigger: 'high_confidence_threat',
          actionType: 'PROCESS',
          parameters: { workflow: 'immediate-threat-assessment' },
          enabled: true
        }]
      },

      fusionData: {
        fusionId: undefined,
        relatedIntel: [],
        correlationStrength: 0,
        fusionConfidence: 0,
        fusionMethod: 'TEMPORAL',
        crossSourceValidation: [],
        contradictions: [],
        synergies: [],
        fusionTimestamp: Date.now(),
        fusionOperator: 'fusion-engine'
      },

      performance: {
        collectionEfficiency: 90,
        responseTime: 180000, // 3 minutes
        accuracyRating: 85,
        costEffectiveness: 80,
        riskAssessment: {
          overallRisk: 'MEDIUM',
          riskFactors: [{
            factor: 'source_exposure_risk',
            likelihood: 30,
            impact: 70,
            riskScore: 21
          }],
          mitigationMeasures: ['source_protection_protocols'],
          acceptableRisk: true,
          lastAssessed: Date.now()
        },
        feedbackLoop: [],
        improvementRecommendations: [
          'Increase collection frequency for this target',
          'Improve correlation with HUMINT sources'
        ]
      },

      operationalContext: {
        missionRelevance: 95,
        strategicValue: 85,
        tacticalUtility: 90,
        timeDecayRate: 0.1, // 10% per hour
        sharingRestrictions: ['NOFORN', 'NOCONTRACTOR'],
        disseminationHistory: []
      }
    };

    // Process the enhanced intel through operational workflow
    await this.executeEnhancedIntelWorkflow(enhancedIntel);
  }

  /**
   * Execute comprehensive workflow for enhanced intel
   */
  private async executeEnhancedIntelWorkflow(intel: EnhancedIntel): Promise<void> {
    console.log(`📊 Processing Enhanced Intel: ${intel.id}`);

    // 1. Check if immediate processing is required
    if (IntelOperations.requiresImmediateProcessing(intel)) {
      console.log('🚨 IMMEDIATE PROCESSING REQUIRED');
      await this.triggerImmediateProcessing(intel);
    }

    // 2. Calculate current intel value
    const decayFactor = IntelOperations.calculateIntelDecay(intel);
    console.log(`📉 Intel Decay Factor: ${(decayFactor * 100).toFixed(1)}%`);

    // 3. Assess quality
    const qualityScore = IntelOperations.calculateCompositeQuality(intel);
    console.log(`⭐ Composite Quality Score: ${qualityScore.toFixed(1)}/100`);

    // 4. Check lifecycle status
    if (IntelOperations.shouldArchive(intel)) {
      console.log('📦 Intel ready for archival');
      await this.initiateArchival(intel);
    }

    // 5. Update data lineage
    await this.updateDataLineage(intel, 'PROCESSED');

    // 6. Trigger fusion if related intel exists
    await this.attemptIntelFusion(intel);

    // 7. Generate performance feedback
    await this.collectPerformanceFeedback(intel);

    console.log('✅ Enhanced Intel Workflow Complete');
  }

  /**
   * Trigger immediate processing workflow
   */
  private async triggerImmediateProcessing(intel: EnhancedIntel): Promise<void> {
    console.log('🔥 Triggering immediate processing workflow');
    
    // Update processing timestamp
    intel.lifecycle.processingTimestamp = Date.now();
    
    // Execute automated actions
    for (const action of intel.realTimeStatus.automatedActions) {
      if (action.enabled) {
        console.log(`⚡ Executing automated action: ${action.actionType}`);
        // Implementation would trigger actual workflows
      }
    }

    // Send alerts
    for (const trigger of intel.realTimeStatus.alertTriggers) {
      if (trigger.enabled) {
        console.log(`🚨 Alert triggered: ${trigger.alertLevel} - ${trigger.message}`);
        // Implementation would send actual alerts
      }
    }
  }

  /**
   * Update data lineage tracking
   */
  private async updateDataLineage(intel: EnhancedIntel, operation: string): Promise<void> {
    intel.lifecycle.dataLineage.push({
      timestamp: Date.now(),
      operation: operation as any,
      operator: 'enhanced-workflow-system',
      system: 'INTEL-PROCESSING-ENGINE',
      changes: [`${operation.toLowerCase()}_completed`],
      confidence: 90
    });

    intel.lifecycle.lastAccessedTimestamp = Date.now();
    intel.lifecycle.accessCount += 1;
  }

  /**
   * Attempt fusion with related intelligence
   */
  private async attemptIntelFusion(intel: EnhancedIntel): Promise<void> {
    console.log('🔗 Attempting intel fusion with related items');
    
    // Mock fusion logic - in reality this would search for related intel
    const relatedIntelIds = await this.findRelatedIntel(intel);
    
    if (relatedIntelIds.length > 0) {
      intel.fusionData.relatedIntel = relatedIntelIds;
      intel.fusionData.fusionConfidence = 75;
      intel.fusionData.correlationStrength = 0.8;
      intel.fusionData.fusionTimestamp = Date.now();
      
      console.log(`🎯 Fusion successful with ${relatedIntelIds.length} related items`);
    }
  }

  /**
   * Find related intelligence items
   */
  private async findRelatedIntel(intel: EnhancedIntel): Promise<string[]> {
    // Mock implementation - would use semantic search, entity matching, etc.
    return ['INTEL-2024-002', 'INTEL-2024-003'];
  }

  /**
   * Initiate archival process
   */
  private async initiateArchival(intel: EnhancedIntel): Promise<void> {
    console.log('📦 Initiating archival process');
    intel.lifecycle.archiveStatus = 'MARKED_FOR_DESTRUCTION';
    
    // Set destruction date based on retention policy
    const destructionDate = Date.now() + 
      (intel.lifecycle.retentionPolicy.retentionPeriodDays * 24 * 60 * 60 * 1000);
    intel.lifecycle.destructionDate = destructionDate;
  }

  /**
   * Collect performance feedback
   */
  private async collectPerformanceFeedback(intel: EnhancedIntel): Promise<void> {
    console.log('📈 Collecting performance feedback');
    
    intel.performance.feedbackLoop.push({
      timestamp: Date.now(),
      feedbackType: 'QUALITY',
      rating: 4,
      comments: 'High-quality intel with immediate operational value',
      analyst: 'system-feedback',
      actionItems: ['Continue monitoring this target', 'Increase collection frequency']
    });
  }

  /**
   * Generate comprehensive intelligence report
   */
  async generateIntelligenceReport(intelItems: EnhancedIntel[]): Promise<void> {
    console.log('📋 Generating Comprehensive Intelligence Report');

    const report = IntelOperations.generatePerformanceReport(intelItems);
    
    console.log('📊 Performance Report:');
    console.log(`   Average Quality: ${report.averageQuality.toFixed(1)}%`);
    console.log(`   Average Response Time: ${(report.averageResponseTime / 1000).toFixed(1)}s`);
    console.log(`   Collection Efficiency: ${report.collectionEfficiency.toFixed(1)}%`);
    console.log(`   Top Risk Factors: ${report.topRiskFactors.join(', ')}`);
    console.log(`   Improvement Areas: ${report.improvementAreas.slice(0, 3).join(', ')}`);

    // Generate collection statistics
    const taskingStats = this.analyzeTaskingPerformance(intelItems);
    console.log('\n🎯 Collection Tasking Analysis:');
    console.log(`   Immediate Priority: ${taskingStats.immediate} items`);
    console.log(`   Priority: ${taskingStats.priority} items`);
    console.log(`   Routine: ${taskingStats.routine} items`);
    console.log(`   Average Processing Time: ${taskingStats.avgProcessingTime.toFixed(1)} minutes`);

    // Generate fusion analysis
    const fusionStats = this.analyzeFusionEffectiveness(intelItems);
    console.log('\n🔗 Fusion Analysis:');
    console.log(`   Items with Fusion: ${fusionStats.fusedItems} of ${intelItems.length}`);
    console.log(`   Average Fusion Confidence: ${fusionStats.avgConfidence.toFixed(1)}%`);
    console.log(`   Cross-Source Validations: ${fusionStats.validations}`);
  }

  /**
   * Analyze tasking performance
   */
  private analyzeTaskingPerformance(intelItems: EnhancedIntel[]): {
    immediate: number;
    priority: number;
    routine: number;
    avgProcessingTime: number;
  } {
    const immediate = intelItems.filter(i => i.collectionPriority === 'IMMEDIATE').length;
    const priority = intelItems.filter(i => i.collectionPriority === 'PRIORITY').length;
    const routine = intelItems.filter(i => i.collectionPriority === 'ROUTINE').length;
    
    const processingTimes = intelItems
      .filter(i => i.lifecycle.processingTimestamp)
      .map(i => (i.lifecycle.processingTimestamp! - i.lifecycle.collectionTimestamp) / (1000 * 60));
    
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    return { immediate, priority, routine, avgProcessingTime };
  }

  /**
   * Analyze fusion effectiveness
   */
  private analyzeFusionEffectiveness(intelItems: EnhancedIntel[]): {
    fusedItems: number;
    avgConfidence: number;
    validations: number;
  } {
    const fusedItems = intelItems.filter(i => i.fusionData.relatedIntel.length > 0).length;
    
    const confidences = intelItems
      .filter(i => i.fusionData.fusionConfidence > 0)
      .map(i => i.fusionData.fusionConfidence);
    
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : 0;

    const validations = intelItems.reduce((sum, i) => 
      sum + i.fusionData.crossSourceValidation.length, 0);

    return { fusedItems, avgConfidence, validations };
  }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

export async function demonstrateEnhancedIntelligence(): Promise<void> {
  console.log('🚀 Enhanced Intelligence Operations Demonstration\n');

  const workflow = new EnhancedIntelligenceWorkflow();

  try {
    // Process high-priority intelligence
    await workflow.processHighPriorityIntel();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Enhanced Intelligence Demonstration Complete');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error in enhanced intelligence workflow:', error);
  }
}
