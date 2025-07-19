/**
 * Enhanced Intel Operations Example - Refactored
 * 
 * This demonstrates how the enhanced Intel.ts functionality would be used
 * in real-world intelligence operations with proper modular organization.
 */

import { Intel, IntelRequirement } from '../../models/Intel/Intel';
import { EnhancedIntel, IntelOperations } from '../../models/Intel/Operations';
import { CollectionTasking, TaskingPriority } from '../../models/Intel/Tasking';
import { DataLifecycleManager } from '../../models/Intel/Lifecycle';
import { RealTimeProcessor } from '../../models/Intel/RealTimeProcessing';
import { PerformanceTracker } from '../../models/Intel/Performance';

// =============================================================================
// ENHANCED INTELLIGENCE WORKFLOW EXAMPLE
// =============================================================================

export class RefactoredIntelligenceWorkflow {

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

    // Create basic intel first
    const basicIntel: Intel = {
      id: 'INTEL-2024-001',
      source: 'SIGINT',
      classification: 'SECRET',
      reliability: 'B',
      timestamp: Date.now(),
      collectedBy: 'sigint-sensor-array-001',
      data: {
        threat_indicators: ['malicious_ip_ranges', 'c2_domains'],
        attack_vectors: ['spear_phishing', 'supply_chain'],
        timeline: 'immediate_to_72_hours'
      },
      tags: ['threat', 'apt', 'immediate'],
      verified: false
    };

    // Create enhanced intel with comprehensive lifecycle management
    const enhancedIntel: EnhancedIntel = {
      ...basicIntel,
      
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
    const currentValue = IntelOperations.calculateCurrentValue(intel);
    console.log(`💎 Current Intel Value: ${currentValue.toFixed(1)}/100`);

    // 3. Check lifecycle status
    if (DataLifecycleManager.shouldArchive(intel.lifecycle)) {
      console.log('📦 Intel ready for archival');
      await this.initiateArchival(intel);
    }

    // 4. Update data lineage
    DataLifecycleManager.addLineageEntry(
      intel.lifecycle, 
      'PROCESSED', 
      'enhanced-workflow-system', 
      'INTEL-PROCESSING-ENGINE',
      ['workflow_processing_completed']
    );

    // 5. Check real-time processing requirements
    if (RealTimeProcessor.requiresExpediting(intel.realTimeStatus)) {
      console.log('⚡ Real-time processing required');
    }

    // 6. Generate performance feedback
    const performanceScore = PerformanceTracker.calculateOverallScore(intel.performance);
    console.log(`📈 Performance Score: ${performanceScore.toFixed(1)}/100`);

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
   * Generate comprehensive intelligence report
   */
  async generateIntelligenceReport(intelItems: EnhancedIntel[]): Promise<void> {
    console.log('📋 Generating Comprehensive Intelligence Report');

    // Generate operational summary
    const operationalSummary = IntelOperations.generateOperationalSummary(intelItems);
    
    console.log('📊 Operational Summary:');
    console.log(`   Total Items: ${operationalSummary.totalItems}`);
    console.log(`   High Priority Items: ${operationalSummary.highPriorityItems}`);
    console.log(`   Average Value: ${operationalSummary.averageValue.toFixed(1)}/100`);
    console.log(`   Recent Disseminations: ${operationalSummary.recentDisseminations}`);
    console.log(`   Top Recipients: ${operationalSummary.topSharedWith.slice(0, 3).join(', ')}`);
    console.log(`   Pending Acknowledgments: ${operationalSummary.pendingAcknowledgments}`);

    // Generate collection statistics
    const taskingStats = this.analyzeTaskingPerformance(intelItems);
    console.log('\n🎯 Collection Tasking Analysis:');
    console.log(`   Flash Priority: ${taskingStats.flash} items`);
    console.log(`   Immediate Priority: ${taskingStats.immediate} items`);
    console.log(`   Priority: ${taskingStats.priority} items`);
    console.log(`   Routine: ${taskingStats.routine} items`);

    // Generate performance analysis
    if (intelItems.length > 0) {
      const avgPerformance = PerformanceTracker.calculateOverallScore(intelItems[0].performance);
      console.log('\n📈 Performance Analysis:');
      console.log(`   Average Performance Score: ${avgPerformance.toFixed(1)}/100`);
      
      const recommendations = PerformanceTracker.generateRecommendations(intelItems[0].performance);
      console.log(`   Recommendations: ${recommendations.slice(0, 2).join(', ')}`);
    }
  }

  /**
   * Analyze tasking performance
   */
  private analyzeTaskingPerformance(intelItems: EnhancedIntel[]): {
    flash: number;
    immediate: number;
    priority: number;
    routine: number;
  } {
    const flash = intelItems.filter(i => i.collectionPriority === 'FLASH').length;
    const immediate = intelItems.filter(i => i.collectionPriority === 'IMMEDIATE').length;
    const priority = intelItems.filter(i => i.collectionPriority === 'PRIORITY').length;
    const routine = intelItems.filter(i => i.collectionPriority === 'ROUTINE').length;

    return { flash, immediate, priority, routine };
  }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

export async function demonstrateRefactoredIntelligence(): Promise<void> {
  console.log('🚀 Refactored Enhanced Intelligence Operations Demonstration\n');

  const workflow = new RefactoredIntelligenceWorkflow();

  try {
    // Process high-priority intelligence
    await workflow.processHighPriorityIntel();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Refactored Intelligence Demonstration Complete');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error in refactored intelligence workflow:', error);
  }
}
