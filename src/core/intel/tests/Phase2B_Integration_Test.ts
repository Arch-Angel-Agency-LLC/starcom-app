/**
 * Phase 2B Integration Test (Simplified)
 * Tests the enhanced visualization adapters with sample Intel data
 * Focuses on what's actually implemented and working
 */

import { EnhancedNodeWebAdapter } from '../adapters/EnhancedNodeWebAdapter';
import { EnhancedTimelineAdapter } from '../adapters/EnhancedTimelineAdapter';

interface TestResults {
  nodeWebResults: any;
  timelineResults: any;
  validationResults: {
    nodeWebValid: boolean;
    timelineValid: boolean;
    integrationValid: boolean;
  };
}

/**
 * Sample data generator for testing
 */
class TestDataGenerator {
  static generateSampleOSINTData() {
    return {
      id: 'test-scan-001',
      url: 'https://example-target.com',
      timestamp: new Date(),
      confidence: 85,
      
      // Sample OSINT data as would come from NetRunner
      osintData: {
        emails: [
          'contact@example-target.com',
          'admin@example-target.com'
        ],
        socialMedia: [
          { platform: 'twitter', url: 'https://twitter.com/exampletarget' }
        ],
        technologies: [
          { name: 'React', version: '18.2.0', confidence: 90 },
          { name: 'Node.js', version: '18.x', confidence: 85 }
        ],
        serverInfo: {
          headers: {
            'Server': 'nginx/1.20.1',
            'X-Powered-By': 'Express'
          },
          ssl: {
            issuer: 'Let\'s Encrypt',
            validFrom: '2024-01-01',
            validTo: '2024-12-31'
          }
        },
        subdomains: [
          'api.example-target.com',
          'blog.example-target.com'
        ]
      }
    };
  }

  static generateSampleIntelEntity() {
    return {
      id: 'intel-entity-001',
      type: 'website',
      metadata: {
        url: 'https://example-target.com',
        lastScanned: new Date(),
        scanType: 'osint'
      },
      bridgeMetadata: {
        sourceId: 'test-scan-001',
        sourceType: 'netrunner-scan',
        transformationType: 'osint-to-intel',
        qualityScore: 82,
        timestamp: new Date(),
        bridgeVersion: '2.0.0'
      },
      processingLineage: {
        lineage: [
          {
            id: 'step-001',
            transformationType: 'raw-data',
            type: 'collection',
            confidence: 85,
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            processor: 'NetRunner'
          },
          {
            id: 'step-002',
            transformationType: 'observation',
            type: 'analysis',
            confidence: 78,
            timestamp: new Date(Date.now() - 240000), // 4 minutes ago
            processor: 'IntelAnalyzer'
          },
          {
            id: 'step-003',
            transformationType: 'intelligence',
            type: 'synthesis',
            confidence: 82,
            timestamp: new Date(Date.now() - 180000), // 3 minutes ago
            processor: 'IntelSynthesizer'
          }
        ]
      },
      
      // Sample intelligence data
      intelligenceData: {
        threats: ['Information disclosure via headers', 'Subdomain enumeration exposure'],
        technologies: ['React 18.2.0', 'Node.js 18.x', 'nginx 1.20.1'],
        contacts: ['contact@example-target.com', 'admin@example-target.com'],
        socialPresence: ['@exampletarget on Twitter']
      },
      
      // Relations to other entities
      relations: [
        {
          targetId: 'intel-entity-002',
          type: 'subdomain',
          confidence: 90,
          metadata: { subdomain: 'api.example-target.com' }
        },
        {
          targetId: 'intel-entity-003', 
          type: 'technology-stack',
          confidence: 85,
          metadata: { sharedTech: ['React', 'Node.js'] }
        }
      ]
    };
  }

  static generateSampleIntelCollection() {
    const entities = [
      this.generateSampleIntelEntity(),
      {
        ...this.generateSampleIntelEntity(),
        id: 'intel-entity-002',
        metadata: {
          url: 'https://api.example-target.com',
          lastScanned: new Date(),
          scanType: 'subdomain'
        }
      },
      {
        ...this.generateSampleIntelEntity(),
        id: 'intel-entity-003',
        type: 'technology',
        metadata: {
          name: 'React',
          version: '18.2.0',
          category: 'frontend-framework'
        }
      }
    ];

    return {
      entities,
      metadata: {
        collectionId: 'test-collection-001',
        created: new Date(),
        totalEntities: entities.length,
        averageConfidence: 82
      }
    };
  }
}

/**
 * Main test runner for Phase 2B integration
 */
export class Phase2BIntegrationTest {
  private nodeWebAdapter: EnhancedNodeWebAdapter;
  private timelineAdapter: EnhancedTimelineAdapter;

  constructor() {
    this.nodeWebAdapter = new EnhancedNodeWebAdapter();
    this.timelineAdapter = new EnhancedTimelineAdapter();
  }

  /**
   * Run Phase 2B visualization adapter tests
   */
  async runVisualizationTests(): Promise<TestResults> {
    console.log('🚀 Starting Phase 2B Visualization Tests...');
    
    // Generate test data
    const intelCollection = TestDataGenerator.generateSampleIntelCollection();
    
    console.log('📊 Generated test data with', intelCollection.entities.length, 'entities');

    // Test 1: NodeWeb adapter with enhanced visualization
    console.log('\n🕸️  Testing enhanced NodeWeb adapter...');
    const nodeWebResults = await this.testNodeWebAdapter(intelCollection);
    
    // Test 2: Timeline adapter with processing history
    console.log('\n📅 Testing enhanced Timeline adapter...');
    const timelineResults = await this.testTimelineAdapter(intelCollection);
    
    // Validation
    console.log('\n✅ Running validation tests...');
    const validationResults = this.validateResults({
      nodeWebResults,
      timelineResults
    });

    const results = {
      nodeWebResults,
      timelineResults,
      validationResults
    };

    this.printTestSummary(results);
    return results;
  }

  private async testNodeWebAdapter(collection: any) {
    const startTime = Date.now();
    
    try {
      // Use the actual method name from the adapter
      const nodeWebData = await this.nodeWebAdapter.getEnhancedGraphData({
        includeProcessingHistory: true,
        confidenceThreshold: 0,
        qualityThreshold: 0
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✓ NodeWeb transformation completed in ${duration}ms`);
      console.log(`   ✓ Generated ${nodeWebData.nodes.length} enhanced nodes`);
      console.log(`   ✓ Generated ${nodeWebData.edges.length} relationships`);
      console.log(`   ✓ Intelligence summary included: ${nodeWebData.intelligence ? 'Yes' : 'No'}`);
      
      // Test confidence visualization
      const highConfidenceNodes = nodeWebData.nodes.filter(n => n.confidence && n.confidence > 80);
      console.log(`   ✓ ${highConfidenceNodes.length} high-confidence nodes (>80%)`);
      
      return {
        success: true,
        duration,
        nodeCount: nodeWebData.nodes.length,
        linkCount: nodeWebData.edges.length,
        highConfidenceCount: highConfidenceNodes.length,
        hasIntelligence: !!nodeWebData.intelligence,
        data: nodeWebData
      };
    } catch (error) {
      console.error('   ✗ NodeWeb transformation failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async testTimelineAdapter(collection: any) {
    const startTime = Date.now();
    
    try {
      // Use the actual method name from the adapter
      const timelineData = await this.timelineAdapter.getIntelTimelineData({
        showProcessingHistory: true,
        confidenceThreshold: 0
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✓ Timeline transformation completed in ${duration}ms`);
      console.log(`   ✓ Generated ${timelineData.items.length} timeline items`);
      console.log(`   ✓ Intelligence summary included: ${timelineData.intelligence ? 'Yes' : 'No'}`);
      
      // Test processing history
      const processingItems = timelineData.items.filter(item => item.type === 'processing');
      console.log(`   ✓ ${processingItems.length} processing history items`);
      
      // Test confidence visualization
      const highConfidenceItems = timelineData.items.filter(item => item.confidence && item.confidence > 80);
      console.log(`   ✓ ${highConfidenceItems.length} high-confidence items (>80%)`);
      
      return {
        success: true,
        duration,
        itemCount: timelineData.items.length,
        processingItemCount: processingItems.length,
        highConfidenceCount: highConfidenceItems.length,
        hasIntelligence: !!timelineData.intelligence,
        data: timelineData
      };
    } catch (error) {
      console.error('   ✗ Timeline transformation failed:', error);
      return { success: false, error: error.message };
    }
  }

  private validateResults(results: any) {
    const nodeWebValid = 
      results.nodeWebResults.success &&
      results.nodeWebResults.nodeCount > 0 &&
      results.nodeWebResults.hasIntelligence;

    const timelineValid = 
      results.timelineResults.success &&
      results.timelineResults.itemCount > 0 &&
      results.timelineResults.hasIntelligence;

    const integrationValid = nodeWebValid && timelineValid;

    return {
      nodeWebValid,
      timelineValid,
      integrationValid
    };
  }

  private printTestSummary(results: TestResults) {
    console.log('\n📋 Phase 2B Visualization Test Summary');
    console.log('====================================');
    
    console.log('\n🕸️  Enhanced NodeWeb:');
    console.log(`   Status: ${results.nodeWebResults.success ? '✅ PASS' : '❌ FAIL'}`);
    if (results.nodeWebResults.success) {
      console.log(`   Duration: ${results.nodeWebResults.duration}ms`);
      console.log(`   Nodes Generated: ${results.nodeWebResults.nodeCount}`);
      console.log(`   Relationships: ${results.nodeWebResults.linkCount}`);
      console.log(`   High Confidence: ${results.nodeWebResults.highConfidenceCount}`);
      console.log(`   Intelligence Data: ${results.nodeWebResults.hasIntelligence ? '✅' : '❌'}`);
    }
    
    console.log('\n📅 Enhanced Timeline:');
    console.log(`   Status: ${results.timelineResults.success ? '✅ PASS' : '❌ FAIL'}`);
    if (results.timelineResults.success) {
      console.log(`   Duration: ${results.timelineResults.duration}ms`);
      console.log(`   Timeline Items: ${results.timelineResults.itemCount}`);
      console.log(`   Processing History: ${results.timelineResults.processingItemCount}`);
      console.log(`   High Confidence: ${results.timelineResults.highConfidenceCount}`);
      console.log(`   Intelligence Data: ${results.timelineResults.hasIntelligence ? '✅' : '❌'}`);
    }
    
    console.log('\n🎯 Overall Validation:');
    console.log(`   NodeWeb Valid: ${results.validationResults.nodeWebValid ? '✅' : '❌'}`);
    console.log(`   Timeline Valid: ${results.validationResults.timelineValid ? '✅' : '❌'}`);
    console.log(`   Integration Valid: ${results.validationResults.integrationValid ? '✅' : '❌'}`);
    
    const overallStatus = results.validationResults.integrationValid ? 
      '🎉 PHASE 2B VISUALIZATION: SUCCESS' : 
      '❌ PHASE 2B VISUALIZATION: FAILED';
    
    console.log(`\n${overallStatus}`);
    console.log('====================================\n');
  }

  /**
   * Test individual entity processing timeline
   */
  async testEntityProcessingTimeline(entityId: string) {
    console.log(`\n🔍 Testing entity processing timeline for: ${entityId}`);
    
    try {
      const timelineData = await this.timelineAdapter.getEntityProcessingTimeline(entityId);
      
      console.log(`   ✓ Processing timeline generated`);
      console.log(`   ✓ Timeline items: ${timelineData.items.length}`);
      console.log(`   ✓ Intelligence included: ${timelineData.intelligence ? 'Yes' : 'No'}`);
      
      return { success: true, data: timelineData };
    } catch (error) {
      console.error(`   ✗ Processing timeline failed:`, error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Example usage patterns for Phase 2B
 */
export class Phase2BUsageExamples {
  static getBasicUsageExample() {
    return `
// Basic usage of enhanced visualization adapters

import { EnhancedNodeWebAdapter } from '../adapters/EnhancedNodeWebAdapter';
import { EnhancedTimelineAdapter } from '../adapters/EnhancedTimelineAdapter';

const nodeWebAdapter = new EnhancedNodeWebAdapter();
const timelineAdapter = new EnhancedTimelineAdapter();

// Enhanced NodeWeb with confidence visualization
const nodeWebData = await nodeWebAdapter.getEnhancedGraphData({
  includeProcessingHistory: true,
  confidenceThreshold: 70,
  qualityThreshold: 60
});

// Enhanced Timeline with processing history
const timelineData = await timelineAdapter.getIntelTimelineData({
  showProcessingHistory: true,
  confidenceThreshold: 70
});

// Individual entity processing timeline
const entityTimeline = await timelineAdapter.getEntityProcessingTimeline('entity-id');
`;
  }

  static getUIIntegrationExample() {
    return `
// React component integration example

import React, { useState, useEffect } from 'react';
import { EnhancedNodeWebAdapter } from '../adapters/EnhancedNodeWebAdapter';
import { EnhancedTimelineAdapter } from '../adapters/EnhancedTimelineAdapter';

const IntelDashboard = ({ intelEntities }) => {
  const [nodeWebData, setNodeWebData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadEnhancedVisualizations = async () => {
      try {
        const nodeWebAdapter = new EnhancedNodeWebAdapter();
        const timelineAdapter = new EnhancedTimelineAdapter();
        
        const [nodeData, timeData] = await Promise.all([
          nodeWebAdapter.getEnhancedGraphData({
            includeProcessingHistory: true,
            confidenceThreshold: 70,
            qualityThreshold: 60
          }),
          timelineAdapter.getIntelTimelineData({
            showProcessingHistory: true,
            confidenceThreshold: 70
          })
        ]);
        
        setNodeWebData(nodeData);
        setTimelineData(timeData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load enhanced visualizations:', error);
        setLoading(false);
      }
    };
    
    loadEnhancedVisualizations();
  }, []);
  
  if (loading) return <div>Loading enhanced visualizations...</div>;
  
  return (
    <div className="intel-dashboard">
      {/* Enhanced NodeWeb */}
      <div className="nodeweb-section">
        <h3>Intelligence Network</h3>
        <NodeWebComponent 
          data={nodeWebData}
          showConfidenceRings={true}
          showQualityIndicators={true}
          intelligence={nodeWebData?.intelligence}
        />
      </div>
      
      {/* Enhanced Timeline */}
      <div className="timeline-section">
        <h3>Processing Timeline</h3>
        <TimelineComponent 
          data={timelineData}
          showProcessingHistory={true}
          showConfidenceBars={true}
          intelligence={timelineData?.intelligence}
        />
      </div>
    </div>
  );
};
`;
  }
}

// Export test runner for immediate execution
export default Phase2BIntegrationTest;
