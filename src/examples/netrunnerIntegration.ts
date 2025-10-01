/**
 * NetRunner Intel Integration Example
 * 
 * This file demonstrates how to integrate NetRunner's OSINT data collection
 * with the new Intel architecture and existing IntelDataCore system.
 */

import { Intel } from '../models/Intel/Intel';
import { IntelEntity } from '../core/intel/types/intelDataModels';
import { storageOrchestrator } from '../core/intel/storage/storageOrchestrator';
import { useIntelBridge } from '../core/intel/hooks/useIntelBridge';

/**
 * Example: Convert NetRunner WebsiteScanner results to Intel objects
 */
export async function processNetRunnerResults(websiteUrl: string, scanResults: any[]): Promise<Intel[]> {
  const intelObjects: Intel[] = [];
  
  for (const result of scanResults) {
    // Convert each NetRunner result to Intel format
    const intel: Intel = {
      id: `netrunner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'OSINT',
      classification: 'UNCLASS',
      reliability: assessReliability(result),
      timestamp: Date.now(),
      collectedBy: 'netrunner-websitescanner',
      data: result.value || result.data,
      tags: generateTags(result),
      verified: false,
      bridgeMetadata: {
        transformationId: `netrunner-transform-${Date.now()}`,
        transformedAt: Date.now(),
        transformationVersion: '1.0.0',
        preservedFields: ['data', 'source', 'timestamp'],
        enhancedFields: ['reliability', 'tags', 'classification'],
        qualityScore: calculateQualityScore(result)
      }
    };
    
    intelObjects.push(intel);
  }
  
  return intelObjects;
}

/**
 * Example: Process Intel through to Intelligence and store
 */
export async function processAndStoreIntel(intelObjects: Intel[]): Promise<IntelEntity[]> {
  const entities: IntelEntity[] = [];
  
  // Store raw Intel data
  const storeResult = await storageOrchestrator.batchStoreIntel(intelObjects);
  
  if (!storeResult.success) {
    throw new Error(`Failed to store Intel data: ${storeResult.error}`);
  }
  
  // Convert to Intelligence objects with analysis
  const intelligenceObjects: Intelligence[] = intelObjects.map(intel => ({
    ...intel,
    id: `intelligence-${intel.id}`,
    derivedFrom: {
      rawData: [intel.id],
      observations: []
    },
    confidence: calculateConfidence(intel),
    implications: generateImplications(intel),
    recommendations: generateRecommendations(intel)
  }));
  
  // Use bridge to transform to IntelEntity format
  for (const intelligence of intelligenceObjects) {
    // This would typically use the bridge hook, but for server-side processing:
    const entity: IntelEntity = {
      id: intelligence.id,
      type: 'intelligence',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: intelligence.collectedBy,
      metadata: {
        originalIntelligence: intelligence
      },
      tags: intelligence.tags,
      title: generateTitle(intelligence),
      description: generateDescription(intelligence),
      source: intelligence.source,
      verified: intelligence.verified,
      confidence: intelligence.confidence,
      attachments: [],
      
      // Enhanced fields from new architecture
      sourceIntelligence: [intelligence.id],
      derivedFromRawData: intelligence.derivedFrom.rawData,
      reliability: intelligence.reliability,
      
      confidenceMetrics: {
        extraction: 85,
        correlation: calculateCorrelationConfidence(intelligence),
        analysis: intelligence.confidence,
        validation: intelligence.verified ? 100 : 50,
        overall: intelligence.confidence
      },
      
      osintMetadata: {
        collectionMethod: 'netrunner-websitescanner',
        collectionTimestamp: intelligence.timestamp,
        lastVerified: intelligence.timestamp,
        qualityIndicators: {
          freshness: 100, // Just collected
          completeness: calculateCompleteness(intelligence),
          accuracy: calculateAccuracy(intelligence),
          relevance: calculateRelevance(intelligence)
        }
      },
      
      bridgeMetadata: {
        originalIntelId: intelligence.derivedFrom.rawData[0],
        transformationId: `intel-to-entity-${Date.now()}`,
        transformedAt: Date.now(),
        transformationVersion: '1.0.0',
        preservedFields: ['source', 'classification', 'confidence'],
        enhancedFields: ['confidenceMetrics', 'osintMetadata', 'reliability'],
        qualityScore: calculateEntityQualityScore(intelligence)
      }
    };
    
    entities.push(entity);
  }
  
  return entities;
}

/**
 * Example: Complete NetRunner to UI pipeline
 */
export async function netRunnerToUI(websiteUrl: string, scanResults: any[]) {
  try {
    console.log('🔍 Processing NetRunner results...');
    
    // Step 1: Convert NetRunner results to Intel
    const intelObjects = await processNetRunnerResults(websiteUrl, scanResults);
    console.log(`📊 Generated ${intelObjects.length} Intel objects`);
    
    // Step 2: Process and store
    const entities = await processAndStoreIntel(intelObjects);
    console.log(`💾 Stored ${entities.length} IntelEntity objects`);
    
    // Step 3: These entities are now available for:
    // - NodeWeb visualization (existing)
    // - Timeline integration (existing) 
    // - Case management (existing)
    // - RightSideBar display (enhanced)
    
    return {
      success: true,
      intelCount: intelObjects.length,
      entityCount: entities.length,
      entities: entities
    };
    
  } catch (error) {
    console.error('❌ NetRunner integration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// === Helper Functions ===

function assessReliability(result: any): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  // Basic reliability assessment based on source
  if (result.verified) return 'A';
  if (result.confidence && result.confidence > 80) return 'B';
  if (result.source === 'official') return 'B';
  if (result.source === 'social') return 'C';
  return 'C'; // Default for OSINT
}

function generateTags(result: any): string[] {
  const tags = ['osint', 'netrunner'];
  
  // Add type-specific tags based on data
  if (result.type === 'email') tags.push('email', 'contact');
  if (result.type === 'domain') tags.push('domain', 'infrastructure');
  if (result.type === 'ip') tags.push('ip-address', 'server');
  if (result.type === 'social') tags.push('social-media', 'person');
  
  return tags;
}

function calculateQualityScore(result: any): number {
  let score = 50; // Base score
  
  if (result.verified) score += 30;
  if (result.confidence) score += (result.confidence * 0.2);
  if (result.timestamp && (Date.now() - result.timestamp) < 86400000) score += 20; // Recent
  
  return Math.min(100, Math.max(0, score));
}

function calculateConfidence(intel: Intel): number {
  let confidence = 60; // Base confidence
  
  if (intel.reliability === 'A') confidence += 30;
  else if (intel.reliability === 'B') confidence += 20;
  else if (intel.reliability === 'C') confidence += 10;
  
  if (intel.verified) confidence += 20;
  
  return Math.min(100, confidence);
}

function generateImplications(intel: Intel): string[] {
  const implications: string[] = [];
  
  if (intel.tags.includes('email')) {
    implications.push('Potential communication vector');
    implications.push('Administrative contact identified');
  }
  
  if (intel.tags.includes('domain')) {
    implications.push('Infrastructure component identified');
    implications.push('Potential attack surface');
  }
  
  return implications;
}

function generateRecommendations(intel: Intel): string[] {
  const recommendations: string[] = [];
  
  if (intel.tags.includes('email')) {
    recommendations.push('Verify email validity');
    recommendations.push('Check for associated social media accounts');
  }
  
  if (intel.tags.includes('domain')) {
    recommendations.push('Perform subdomain enumeration');
    recommendations.push('Check for exposed services');
  }
  
  return recommendations;
}

function generateTitle(intelligence: Intelligence): string {
  if (intelligence.tags.includes('email')) {
    return `Email Contact: ${intelligence.data}`;
  }
  if (intelligence.tags.includes('domain')) {
    return `Domain Asset: ${intelligence.data}`;
  }
  return `OSINT Data: ${intelligence.data}`;
}

function generateDescription(intelligence: Intelligence): string {
  return `Intelligence derived from NetRunner OSINT collection. ${intelligence.implications?.join('. ') || 'No specific implications identified.'}`;
}

function calculateCorrelationConfidence(intelligence: Intelligence): number {
  // Simple correlation confidence based on tags
  const commonTags = ['email', 'domain', 'ip-address'];
  const hasCommonTags = intelligence.tags.some(tag => commonTags.includes(tag));
  return hasCommonTags ? 75 : 50;
}

function calculateCompleteness(intelligence: Intelligence): number {
  let score = 50;
  if (intelligence.implications && intelligence.implications.length > 0) score += 25;
  if (intelligence.recommendations && intelligence.recommendations.length > 0) score += 25;
  return score;
}

function calculateAccuracy(intelligence: Intelligence): number {
  // Based on reliability rating
  const reliabilityScores = { 'A': 95, 'B': 85, 'C': 70, 'D': 55, 'E': 40, 'F': 25 };
  return reliabilityScores[intelligence.reliability] || 50;
}

function calculateRelevance(intelligence: Intelligence): number {
  // Simple relevance calculation
  return intelligence.confidence || 70;
}

function calculateEntityQualityScore(intelligence: Intelligence): number {
  const accuracy = calculateAccuracy(intelligence);
  const completeness = calculateCompleteness(intelligence);
  const relevance = calculateRelevance(intelligence);
  
  return Math.round((accuracy + completeness + relevance) / 3);
}
