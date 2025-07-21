/**
 * Threat Correlation Service
 * Week 3 Day 4: Real-time threat correlation and network effect analysis
 * 
 * Provides:
 * - Cross-threat relationship analysis
 * - Network effect modeling for threat propagation
 * - Temporal correlation patterns
 * - Campaign attribution and tracking
 * - Real-time correlation updates
 * - Threat family clustering
 */

import type {
  CyberThreatData,
  ConfidenceLevel,
  ThreatActor,
  IOC
} from '../../types/CyberThreats';

import type { GeoCoordinate } from '../../types/CyberCommandVisualization';

// =============================================================================
// INTERFACES
// =============================================================================

export interface ThreatCorrelation {
  id: string;
  primary_threat_id: string;
  related_threat_id: string;
  correlation_type: CorrelationType;
  confidence_score: number; // 0-1
  relationship_strength: number; // 0-1
  evidence: CorrelationEvidence[];
  first_observed: Date;
  last_updated: Date;
  geographic_overlap?: GeographicOverlap;
  temporal_overlap?: TemporalOverlap;
  technical_overlap?: TechnicalOverlap;
}

export type CorrelationType = 
  | 'same_campaign'          // Part of same campaign
  | 'same_actor'            // Same threat actor
  | 'infrastructure_sharing' // Shared C2 infrastructure
  | 'technique_similarity'   // Similar attack techniques
  | 'target_overlap'        // Similar targets
  | 'temporal_proximity'    // Close in time
  | 'geographic_proximity'  // Close geographically
  | 'ioc_overlap'          // Shared IOCs
  | 'malware_family'       // Same malware family
  | 'supply_chain'         // Supply chain relationship
  | 'predecessor_successor' // Sequential attacks
  | 'coordinated_campaign'; // Coordinated timing

export interface CorrelationEvidence {
  type: EvidenceType;
  description: string;
  confidence: ConfidenceLevel;
  data_points: string[];
  source: string;
  timestamp: Date;
}

export type EvidenceType =
  | 'shared_ioc'
  | 'similar_ttp'
  | 'geographic_pattern'
  | 'temporal_pattern'
  | 'infrastructure_link'
  | 'attribution_link'
  | 'target_pattern'
  | 'technical_signature';

export interface GeographicOverlap {
  overlap_percentage: number; // 0-1
  shared_countries: string[];
  shared_regions: string[];
  distance_km: number;
  overlap_type: 'exact' | 'proximity' | 'regional' | 'continental';
}

export interface TemporalOverlap {
  overlap_hours: number;
  time_gap_hours: number;
  overlap_type: 'simultaneous' | 'sequential' | 'overlapping' | 'separate';
  campaign_phase_alignment?: 'reconnaissance' | 'initial_access' | 'persistence' | 'privilege_escalation' | 'defense_evasion' | 'credential_access' | 'discovery' | 'lateral_movement' | 'collection' | 'command_control' | 'exfiltration' | 'impact';
}

export interface TechnicalOverlap {
  shared_techniques: string[]; // MITRE ATT&CK technique IDs
  shared_malware_families: string[];
  shared_iocs: IOC[];
  technique_similarity_score: number; // 0-1
  infrastructure_overlap: string[];
}

export interface ThreatNetwork {
  id: string;
  name: string;
  description: string;
  threats: string[]; // Threat IDs
  correlations: ThreatCorrelation[];
  network_type: NetworkType;
  confidence_score: number;
  attribution?: ThreatActor;
  campaign_timeline: CampaignEvent[];
  geographic_footprint: GeoCoordinate[];
  impact_assessment: NetworkImpactAssessment;
  created: Date;
  last_updated: Date;
}

export type NetworkType =
  | 'campaign'       // Coordinated campaign
  | 'actor_group'    // Single actor's activities
  | 'infrastructure' // Shared infrastructure
  | 'supply_chain'   // Supply chain attack
  | 'botnet'         // Botnet operations
  | 'apt_family'     // APT family activities
  | 'ransomware'     // Ransomware operations
  | 'commodity';     // Commodity malware

export interface CampaignEvent {
  id: string;
  threat_id: string;
  event_type: 'initial_compromise' | 'lateral_movement' | 'persistence' | 'data_exfiltration' | 'impact';
  timestamp: Date;
  location?: GeoCoordinate;
  description: string;
  confidence: ConfidenceLevel;
}

export interface NetworkImpactAssessment {
  total_targets: number;
  affected_countries: string[];
  affected_sectors: string[];
  estimated_financial_impact?: number; // USD
  data_compromised?: number; // Records
  systems_affected?: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  rule_type: CorrelationType;
  conditions: CorrelationCondition[];
  weight: number; // Rule importance weight
  threshold: number; // Minimum score to trigger
  enabled: boolean;
  created: Date;
  last_modified: Date;
}

export interface CorrelationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'similarity' | 'within_distance' | 'within_time';
  value: string | number | boolean | string[];
  weight: number; // Condition weight within rule
}

export interface RealTimeCorrelationUpdate {
  timestamp: Date;
  new_correlations: ThreatCorrelation[];
  updated_correlations: ThreatCorrelation[];
  new_networks: ThreatNetwork[];
  updated_networks: ThreatNetwork[];
  correlation_stats: {
    total_correlations: number;
    high_confidence_correlations: number;
    active_networks: number;
    processing_latency_ms: number;
  };
}

export interface CorrelationAnalysisResult {
  threat_id: string;
  correlations: ThreatCorrelation[];
  network_memberships: ThreatNetwork[];
  risk_score: number; // Calculated based on correlations
  attribution_confidence: number;
  recommended_actions: string[];
  analysis_timestamp: Date;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CORRELATION_RULES: CorrelationRule[] = [
  {
    id: 'same_ioc_rule',
    name: 'Shared IOC Correlation',
    description: 'Correlates threats sharing identical IOCs',
    rule_type: 'ioc_overlap',
    conditions: [
      { field: 'iocs', operator: 'contains', value: 'shared', weight: 1.0 }
    ],
    weight: 0.8,
    threshold: 0.3,
    enabled: true,
    created: new Date(),
    last_modified: new Date()
  },
  {
    id: 'same_actor_rule',
    name: 'Same Actor Attribution',
    description: 'Correlates threats attributed to same actor',
    rule_type: 'same_actor',
    conditions: [
      { field: 'threat_actor.id', operator: 'equals', value: 'match', weight: 1.0 }
    ],
    weight: 0.9,
    threshold: 0.8,
    enabled: true,
    created: new Date(),
    last_modified: new Date()
  },
  {
    id: 'geographic_proximity_rule',
    name: 'Geographic Proximity',
    description: 'Correlates threats in close geographic proximity',
    rule_type: 'geographic_proximity',
    conditions: [
      { field: 'location', operator: 'within_distance', value: 100, weight: 0.6 }, // 100km
      { field: 'first_seen', operator: 'within_time', value: 72, weight: 0.4 }     // 72 hours
    ],
    weight: 0.6,
    threshold: 0.3,
    enabled: true,
    created: new Date(),
    last_modified: new Date()
  },
  {
    id: 'technique_similarity_rule',
    name: 'Technique Similarity',
    description: 'Correlates threats using similar attack techniques',
    rule_type: 'technique_similarity',
    conditions: [
      { field: 'techniques', operator: 'similarity', value: 0.2, weight: 1.0 }
    ],
    weight: 0.75,
    threshold: 0.2,
    enabled: true,
    created: new Date(),
    last_modified: new Date()
  },
  {
    id: 'malware_family_rule',
    name: 'Malware Family Overlap',
    description: 'Correlates threats using same malware families',
    rule_type: 'malware_family',
    conditions: [
      { field: 'malware_families', operator: 'similarity', value: 0.1, weight: 1.0 }
    ],
    weight: 0.7,
    threshold: 0.1,
    enabled: true,
    created: new Date(),
    last_modified: new Date()
  }
];

const CORRELATION_WEIGHTS = {
  same_campaign: 0.95,
  same_actor: 0.9,
  infrastructure_sharing: 0.85,
  ioc_overlap: 0.8,
  technique_similarity: 0.75,
  malware_family: 0.7,
  target_overlap: 0.65,
  temporal_proximity: 0.6,
  geographic_proximity: 0.55,
  supply_chain: 0.5,
  predecessor_successor: 0.45,
  coordinated_campaign: 0.4
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate Jaccard similarity between two sets
 */
function calculateJaccardSimilarity<T>(set1: T[], set2: T[]): number {
  const s1 = new Set(set1);
  const s2 = new Set(set2);
  
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate geographic distance between two coordinates
 */
function calculateGeographicDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLng = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate temporal overlap between two time periods
 */
function calculateTemporalOverlap(start1: Date, end1: Date, start2: Date, end2: Date): TemporalOverlap {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
  
  const overlapMs = Math.max(0, overlapEnd.getTime() - overlapStart.getTime());
  const overlapHours = overlapMs / (1000 * 60 * 60);
  
  const timeGapHours = Math.abs(start1.getTime() - start2.getTime()) / (1000 * 60 * 60);
  
  let overlapType: TemporalOverlap['overlap_type'];
  if (overlapHours > 0) {
    if (start1.getTime() === start2.getTime() && end1.getTime() === end2.getTime()) {
      overlapType = 'simultaneous';
    } else {
      overlapType = 'overlapping';
    }
  } else if (timeGapHours < 24) {
    overlapType = 'sequential';
  } else {
    overlapType = 'separate';
  }
  
  return {
    overlap_hours: overlapHours,
    time_gap_hours: timeGapHours,
    overlap_type: overlapType
  };
}

/**
 * Get confidence level numeric value
 */
function getConfidenceValue(confidence: ConfidenceLevel): number {
  switch (confidence) {
    case 'Low': return 0.25;
    case 'Medium': return 0.5;
    case 'High': return 0.75;
    case 'Confirmed': return 1.0;
    default: return 0.1;
  }
}

// =============================================================================
// MAIN SERVICE CLASS
// =============================================================================

export class ThreatCorrelationService {
  private correlations: Map<string, ThreatCorrelation[]> = new Map();
  private networks: Map<string, ThreatNetwork> = new Map();
  private correlationRules: CorrelationRule[] = [...DEFAULT_CORRELATION_RULES];
  private processingQueue: CyberThreatData[] = [];
  private isProcessing = false;
  private updateCallbacks: ((update: RealTimeCorrelationUpdate) => void)[] = [];

  constructor() {
    // Start background processing
    this.startBackgroundProcessing();
  }

  // =============================================================================
  // CORRELATION ANALYSIS
  // =============================================================================

  /**
   * Analyze correlations for a new threat
   */
  async analyzeThreatCorrelations(threat: CyberThreatData): Promise<CorrelationAnalysisResult> {
    const correlations = await this.findCorrelations(threat);
    const networkMemberships = this.findNetworkMemberships(threat, correlations);
    const riskScore = this.calculateRiskScore(threat, correlations);
    const attributionConfidence = this.calculateAttributionConfidence(threat, correlations);
    const recommendedActions = this.generateRecommendedActions(threat, correlations);

    return {
      threat_id: threat.id,
      correlations,
      network_memberships: networkMemberships,
      risk_score: riskScore,
      attribution_confidence: attributionConfidence,
      recommended_actions: recommendedActions,
      analysis_timestamp: new Date()
    };
  }

  /**
   * Find correlations between two threats
   */
  async findCorrelations(targetThreat: CyberThreatData, candidateThreats?: CyberThreatData[]): Promise<ThreatCorrelation[]> {
    const correlations: ThreatCorrelation[] = [];
    
    // If no candidates provided, we would typically fetch from data store
    // For this implementation, we'll work with provided candidates
    if (!candidateThreats) {
      return correlations;
    }

    for (const candidate of candidateThreats) {
      if (candidate.id === targetThreat.id) continue;

      // Get all possible correlations for this threat pair
      const threatPairCorrelations = await this.analyzeAllCorrelations(targetThreat, candidate);
      correlations.push(...threatPairCorrelations);
    }

    // Sort by confidence score
    correlations.sort((a, b) => b.confidence_score - a.confidence_score);
    
    // Store correlations
    this.storeCorrelations(targetThreat.id, correlations);
    
    return correlations;
  }

  /**
   * Analyze all possible correlations between two specific threats
   */
  async analyzeAllCorrelations(threat1: CyberThreatData, threat2: CyberThreatData): Promise<ThreatCorrelation[]> {
    const correlations: ThreatCorrelation[] = [];

    // Apply each correlation rule independently
    for (const rule of this.correlationRules.filter(r => r.enabled)) {
      const ruleResult = this.evaluateCorrelationRule(threat1, threat2, rule);
      
      if (ruleResult.matches && ruleResult.score >= 0.3) {
        // Calculate additional overlap metrics
        const geographicOverlap = this.calculateGeographicOverlap(threat1, threat2);
        const temporalOverlap = this.calculateTemporalOverlapForThreats(threat1, threat2);
        const technicalOverlap = this.calculateTechnicalOverlap(threat1, threat2);

        const correlation: ThreatCorrelation = {
          id: `correlation_${threat1.id}_${threat2.id}_${rule.rule_type}_${Date.now()}`,
          primary_threat_id: threat1.id,
          related_threat_id: threat2.id,
          correlation_type: rule.rule_type,
          confidence_score: ruleResult.score,
          relationship_strength: this.calculateRelationshipStrength(ruleResult.evidence),
          evidence: ruleResult.evidence,
          first_observed: new Date(),
          last_updated: new Date(),
          geographic_overlap: geographicOverlap,
          temporal_overlap: temporalOverlap,
          technical_overlap: technicalOverlap
        };

        correlations.push(correlation);
      }
    }

    return correlations;
  }

  /**
   * Analyze correlation between two specific threats (for backward compatibility)
   */
  async analyzeCorrelationPair(threat1: CyberThreatData, threat2: CyberThreatData): Promise<ThreatCorrelation | null> {
    const correlations = await this.analyzeAllCorrelations(threat1, threat2);
    return correlations.length > 0 ? correlations[0] : null;
  }

  /**
   * Build threat networks from correlations
   */
  async buildThreatNetworks(threats: CyberThreatData[]): Promise<ThreatNetwork[]> {
    // First, analyze all possible correlations between threats
    await this.analyzeAllThreatPairs(threats);
    
    const networks: ThreatNetwork[] = [];
    const processedThreats = new Set<string>();

    for (const threat of threats) {
      if (processedThreats.has(threat.id)) continue;

      const network = this.buildNetworkFromThreat(threat, threats);
      if (network.threats.length >= 2) { // Minimum network size
        networks.push(network);
        network.threats.forEach(tid => processedThreats.add(tid));
      }
    }

    // Store networks
    networks.forEach(network => {
      this.networks.set(network.id, network);
    });

    return networks;
  }

  /**
   * Analyze correlations between all threat pairs
   */
  private async analyzeAllThreatPairs(threats: CyberThreatData[]): Promise<void> {
    for (let i = 0; i < threats.length; i++) {
      for (let j = i + 1; j < threats.length; j++) {
        const correlations = await this.analyzeAllCorrelations(threats[i], threats[j]);
        if (correlations.length > 0) {
          // Store correlations for both threats
          this.storeCorrelations(threats[i].id, correlations);
          
          // Also store reverse correlations
          const reverseCorrelations = correlations.map(c => ({
            ...c,
            id: `${c.id}_reverse`,
            primary_threat_id: c.related_threat_id,
            related_threat_id: c.primary_threat_id
          }));
          this.storeCorrelations(threats[j].id, reverseCorrelations);
        }
      }
    }
  }

  /**
   * Track real-time correlation updates
   */
  processRealTimeUpdate(newThreats: CyberThreatData[]): void {
    // Add to processing queue
    this.processingQueue.push(...newThreats);
    
    // Trigger processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private evaluateCorrelationRule(threat1: CyberThreatData, threat2: CyberThreatData, rule: CorrelationRule): {
    matches: boolean;
    score: number;
    evidence: CorrelationEvidence[];
  } {
    const evidence: CorrelationEvidence[] = [];
    const conditionScores: number[] = [];

    for (const condition of rule.conditions) {
      const result = this.evaluateCondition(threat1, threat2, condition);
      conditionScores.push(result.score * condition.weight);
      
      if (result.evidence) {
        evidence.push(result.evidence);
      }
    }

    const avgScore = conditionScores.length > 0 
      ? conditionScores.reduce((sum, score) => sum + score, 0) / conditionScores.length
      : 0;

    return {
      matches: avgScore >= rule.threshold,
      score: avgScore,
      evidence
    };
  }

  private evaluateCondition(threat1: CyberThreatData, threat2: CyberThreatData, condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    switch (condition.field) {
      case 'iocs':
        return this.evaluateIOCOverlap(threat1, threat2, condition);
      
      case 'threat_actor.id':
        return this.evaluateActorMatch(threat1, threat2, condition);
      
      case 'location':
        return this.evaluateGeographicProximity(threat1, threat2, condition);
      
      case 'techniques':
        return this.evaluateTechniqueOverlap(threat1, threat2, condition);
      
      case 'malware_families':
        return this.evaluateMalwareFamilyOverlap(threat1, threat2, condition);
      
      case 'first_seen':
        return this.evaluateTemporalProximity(threat1, threat2, condition);
      
      default:
        return { score: 0 };
    }
  }

  private evaluateIOCOverlap(threat1: CyberThreatData, threat2: CyberThreatData, _condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    const iocs1 = threat1.iocs.map(ioc => ioc.value);
    const iocs2 = threat2.iocs.map(ioc => ioc.value);
    
    const similarity = calculateJaccardSimilarity(iocs1, iocs2);
    
    if (similarity > 0) {
      const sharedIOCs = threat1.iocs.filter(ioc1 => 
        threat2.iocs.some(ioc2 => ioc2.value === ioc1.value)
      );

      return {
        score: similarity,
        evidence: {
          type: 'shared_ioc',
          description: `Threats share ${sharedIOCs.length} IOCs`,
          confidence: similarity > 0.7 ? 'High' : similarity > 0.4 ? 'Medium' : 'Low',
          data_points: sharedIOCs.map(ioc => ioc.value),
          source: 'correlation_engine',
          timestamp: new Date()
        }
      };
    }

    return { score: 0 };
  }

  private evaluateActorMatch(threat1: CyberThreatData, threat2: CyberThreatData, _condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    if (threat1.threat_actor?.id && threat2.threat_actor?.id) {
      const match = threat1.threat_actor.id === threat2.threat_actor.id;
      
      if (match) {
        return {
          score: 1.0,
          evidence: {
            type: 'attribution_link',
            description: `Both threats attributed to ${threat1.threat_actor.name}`,
            confidence: 'High',
            data_points: [threat1.threat_actor.id],
            source: 'attribution_system',
            timestamp: new Date()
          }
        };
      }
    }

    return { score: 0 };
  }

  private evaluateGeographicProximity(threat1: CyberThreatData, threat2: CyberThreatData, condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    if (!threat1.location || !threat2.location) {
      return { score: 0 };
    }

    const distance = calculateGeographicDistance(threat1.location, threat2.location);
    const maxDistance = condition.value as number;
    
    if (distance <= maxDistance) {
      const proximityScore = 1 - (distance / maxDistance);
      
      return {
        score: proximityScore,
        evidence: {
          type: 'geographic_pattern',
          description: `Threats within ${distance.toFixed(1)}km of each other`,
          confidence: distance < 10 ? 'High' : distance < 50 ? 'Medium' : 'Low',
          data_points: [`${distance.toFixed(1)}km apart`],
          source: 'geographic_analysis',
          timestamp: new Date()
        }
      };
    }

    return { score: 0 };
  }

  private evaluateTechniqueOverlap(threat1: CyberThreatData, threat2: CyberThreatData, _condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    const similarity = calculateJaccardSimilarity(threat1.techniques, threat2.techniques);
    
    if (similarity > 0) {
      const sharedTechniques = threat1.techniques.filter(t => threat2.techniques.includes(t));
      
      return {
        score: similarity,
        evidence: {
          type: 'similar_ttp',
          description: `Threats share ${sharedTechniques.length} attack techniques`,
          confidence: similarity > 0.7 ? 'High' : similarity > 0.4 ? 'Medium' : 'Low',
          data_points: sharedTechniques,
          source: 'technique_analysis',
          timestamp: new Date()
        }
      };
    }

    return { score: 0 };
  }

  private evaluateMalwareFamilyOverlap(threat1: CyberThreatData, threat2: CyberThreatData, _condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    const similarity = calculateJaccardSimilarity(threat1.malware_families, threat2.malware_families);
    
    if (similarity > 0) {
      const sharedFamilies = threat1.malware_families.filter(f => threat2.malware_families.includes(f));
      
      return {
        score: similarity,
        evidence: {
          type: 'technical_signature',
          description: `Threats use same malware families: ${sharedFamilies.join(', ')}`,
          confidence: similarity === 1.0 ? 'High' : 'Medium',
          data_points: sharedFamilies,
          source: 'malware_analysis',
          timestamp: new Date()
        }
      };
    }

    return { score: 0 };
  }

  private evaluateTemporalProximity(threat1: CyberThreatData, threat2: CyberThreatData, condition: CorrelationCondition): {
    score: number;
    evidence?: CorrelationEvidence;
  } {
    if (!threat1.first_seen || !threat2.first_seen) {
      return { score: 0 };
    }

    const timeDiffMs = Math.abs(threat1.first_seen.getTime() - threat2.first_seen.getTime());
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    const maxHours = condition.value as number;
    
    if (timeDiffHours <= maxHours) {
      const proximityScore = 1 - (timeDiffHours / maxHours);
      
      return {
        score: proximityScore,
        evidence: {
          type: 'temporal_pattern',
          description: `Threats occurred within ${timeDiffHours.toFixed(1)} hours of each other`,
          confidence: timeDiffHours < 1 ? 'High' : timeDiffHours < 12 ? 'Medium' : 'Low',
          data_points: [`${timeDiffHours.toFixed(1)} hours apart`],
          source: 'temporal_analysis',
          timestamp: new Date()
        }
      };
    }

    return { score: 0 };
  }

  private determinePrimaryCorrelationType(evidence: CorrelationEvidence[]): CorrelationType {
    const typeScores = new Map<CorrelationType, number>();
    
    evidence.forEach(e => {
      const confidence = getConfidenceValue(e.confidence);
      
      switch (e.type) {
        case 'attribution_link':
          typeScores.set('same_actor', (typeScores.get('same_actor') || 0) + confidence);
          break;
        case 'shared_ioc':
          typeScores.set('ioc_overlap', (typeScores.get('ioc_overlap') || 0) + confidence);
          break;
        case 'similar_ttp':
          typeScores.set('technique_similarity', (typeScores.get('technique_similarity') || 0) + confidence);
          break;
        case 'geographic_pattern':
          typeScores.set('geographic_proximity', (typeScores.get('geographic_proximity') || 0) + confidence);
          break;
        case 'temporal_pattern':
          typeScores.set('temporal_proximity', (typeScores.get('temporal_proximity') || 0) + confidence);
          break;
        case 'infrastructure_link':
          typeScores.set('infrastructure_sharing', (typeScores.get('infrastructure_sharing') || 0) + confidence);
          break;
        case 'technical_signature':
          typeScores.set('malware_family', (typeScores.get('malware_family') || 0) + confidence);
          break;
      }
    });

    // Return the type with highest score
    let maxScore = 0;
    let primaryType: CorrelationType = 'temporal_proximity';
    
    typeScores.forEach((score, type) => {
      if (score > maxScore) {
        maxScore = score;
        primaryType = type;
      }
    });

    return primaryType;
  }

  private calculateRelationshipStrength(evidence: CorrelationEvidence[]): number {
    if (evidence.length === 0) return 0;

    const totalConfidence = evidence.reduce((sum, e) => sum + getConfidenceValue(e.confidence), 0);
    const avgConfidence = totalConfidence / evidence.length;
    
    // Factor in evidence diversity
    const evidenceTypes = new Set(evidence.map(e => e.type));
    const diversityBonus = Math.min(0.2, evidenceTypes.size * 0.05);
    
    return Math.min(1.0, avgConfidence + diversityBonus);
  }

  private calculateGeographicOverlap(threat1: CyberThreatData, threat2: CyberThreatData): GeographicOverlap | undefined {
    if (!threat1.location || !threat2.location) return undefined;

    const distance = calculateGeographicDistance(threat1.location, threat2.location);
    const sharedCountries = threat1.source_countries.filter(c => threat2.source_countries.includes(c));
    
    let overlapType: GeographicOverlap['overlap_type'];
    if (distance < 1) overlapType = 'exact';
    else if (distance < 100) overlapType = 'proximity';
    else if (sharedCountries.length > 0) overlapType = 'regional';
    else overlapType = 'continental';

    return {
      overlap_percentage: sharedCountries.length / Math.max(threat1.source_countries.length, threat2.source_countries.length),
      shared_countries: sharedCountries,
      shared_regions: [], // Would need region mapping
      distance_km: distance,
      overlap_type: overlapType
    };
  }

  private calculateTemporalOverlapForThreats(threat1: CyberThreatData, threat2: CyberThreatData): TemporalOverlap {
    return calculateTemporalOverlap(
      threat1.first_seen,
      threat1.last_seen,
      threat2.first_seen,
      threat2.last_seen
    );
  }

  private calculateTechnicalOverlap(threat1: CyberThreatData, threat2: CyberThreatData): TechnicalOverlap {
    const sharedTechniques = threat1.techniques.filter(t => threat2.techniques.includes(t));
    const sharedMalwareFamilies = threat1.malware_families.filter(f => threat2.malware_families.includes(f));
    const sharedIOCs = threat1.iocs.filter(ioc1 => 
      threat2.iocs.some(ioc2 => ioc2.value === ioc1.value)
    );
    
    const techniqueSimilarity = calculateJaccardSimilarity(threat1.techniques, threat2.techniques);

    return {
      shared_techniques: sharedTechniques,
      shared_malware_families: sharedMalwareFamilies,
      shared_iocs: sharedIOCs,
      technique_similarity_score: techniqueSimilarity,
      infrastructure_overlap: [] // Would need C2 infrastructure data
    };
  }

  private findNetworkMemberships(threat: CyberThreatData, correlations: ThreatCorrelation[]): ThreatNetwork[] {
    const networks: ThreatNetwork[] = [];
    
    // Check existing networks
    this.networks.forEach(network => {
      if (network.threats.includes(threat.id) || 
          correlations.some(c => network.threats.includes(c.related_threat_id))) {
        networks.push(network);
      }
    });

    return networks;
  }

  private calculateRiskScore(threat: CyberThreatData, correlations: ThreatCorrelation[]): number {
    const baseRisk = threat.severity / 10; // Normalize to 0-1
    
    // Correlation risk multiplier
    const correlationBonus = correlations.reduce((sum, c) => {
      return sum + (c.confidence_score * CORRELATION_WEIGHTS[c.correlation_type]);
    }, 0);
    
    // Network effect multiplier
    const networkMultiplier = correlations.length > 5 ? 1.5 : 1 + (correlations.length * 0.1);
    
    return Math.min(1.0, (baseRisk + correlationBonus * 0.3) * networkMultiplier);
  }

  private calculateAttributionConfidence(threat: CyberThreatData, correlations: ThreatCorrelation[]): number {
    const baseConfidence = getConfidenceValue(threat.confidence);
    
    // Attribution correlations boost confidence
    const attributionCorrelations = correlations.filter(c => 
      c.correlation_type === 'same_actor' || c.correlation_type === 'same_campaign'
    );
    
    const attributionBonus = attributionCorrelations.reduce((sum, c) => 
      sum + c.confidence_score * 0.2, 0
    );
    
    return Math.min(1.0, baseConfidence + attributionBonus);
  }

  private generateRecommendedActions(threat: CyberThreatData, correlations: ThreatCorrelation[]): string[] {
    const actions: string[] = [];
    
    if (correlations.length > 3) {
      actions.push('Investigate threat campaign coordination');
    }
    
    if (correlations.some(c => c.correlation_type === 'same_actor')) {
      actions.push('Review attribution intelligence');
    }
    
    if (correlations.some(c => c.correlation_type === 'infrastructure_sharing')) {
      actions.push('Monitor shared infrastructure for additional threats');
    }
    
    if (correlations.some(c => c.correlation_type === 'geographic_proximity')) {
      actions.push('Alert regional security teams');
    }
    
    return actions;
  }

  private buildNetworkFromThreat(rootThreat: CyberThreatData, allThreats: CyberThreatData[]): ThreatNetwork {
    const networkThreats = new Set<string>([rootThreat.id]);
    const networkCorrelations: ThreatCorrelation[] = [];
    
    // BFS to find connected threats
    const queue = [rootThreat];
    const processed = new Set<string>();
    
    while (queue.length > 0) {
      const currentThreat = queue.shift()!;
      if (processed.has(currentThreat.id)) continue;
      processed.add(currentThreat.id);
      
      const correlations = this.correlations.get(currentThreat.id) || [];
      
      correlations.forEach(correlation => {
        if (correlation.confidence_score >= 0.6) { // High confidence threshold for networks
          networkThreats.add(correlation.related_threat_id);
          networkCorrelations.push(correlation);
          
          const relatedThreat = allThreats.find(t => t.id === correlation.related_threat_id);
          if (relatedThreat && !processed.has(relatedThreat.id)) {
            queue.push(relatedThreat);
          }
        }
      });
    }
    
    // Determine network type
    const networkType = this.determineNetworkType(networkCorrelations);
    
    return {
      id: `network_${rootThreat.id}_${Date.now()}`,
      name: `Threat Network - ${rootThreat.name}`,
      description: `Network of ${networkThreats.size} correlated threats`,
      threats: Array.from(networkThreats),
      correlations: networkCorrelations,
      network_type: networkType,
      confidence_score: this.calculateNetworkConfidence(networkCorrelations),
      campaign_timeline: this.buildCampaignTimeline(allThreats.filter(t => networkThreats.has(t.id))),
      geographic_footprint: this.calculateGeographicFootprint(allThreats.filter(t => networkThreats.has(t.id))),
      impact_assessment: this.calculateNetworkImpact(allThreats.filter(t => networkThreats.has(t.id))),
      created: new Date(),
      last_updated: new Date()
    };
  }

  private determineNetworkType(correlations: ThreatCorrelation[]): NetworkType {
    const typeFrequency = new Map<CorrelationType, number>();
    
    correlations.forEach(correlation => {
      typeFrequency.set(correlation.correlation_type, 
        (typeFrequency.get(correlation.correlation_type) || 0) + 1
      );
    });
    
    const dominantType = Array.from(typeFrequency.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    switch (dominantType) {
      case 'same_campaign': return 'campaign';
      case 'same_actor': return 'actor_group';
      case 'infrastructure_sharing': return 'infrastructure';
      case 'malware_family': return 'apt_family';
      default: return 'commodity';
    }
  }

  private calculateNetworkConfidence(correlations: ThreatCorrelation[]): number {
    if (correlations.length === 0) return 0;
    
    const avgConfidence = correlations.reduce((sum, c) => sum + c.confidence_score, 0) / correlations.length;
    const networkBonus = Math.min(0.2, correlations.length * 0.02);
    
    return Math.min(1.0, avgConfidence + networkBonus);
  }

  private buildCampaignTimeline(threats: CyberThreatData[]): CampaignEvent[] {
    return threats.map(threat => ({
      id: `event_${threat.id}`,
      threat_id: threat.id,
      event_type: 'initial_compromise' as const,
      timestamp: threat.first_seen,
      location: threat.location,
      description: threat.description,
      confidence: threat.confidence
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateGeographicFootprint(threats: CyberThreatData[]): GeoCoordinate[] {
    return threats
      .filter(t => t.location)
      .map(t => t.location!)
      .filter((location, index, array) => 
        array.findIndex(l => l.latitude === location.latitude && l.longitude === location.longitude) === index
      );
  }

  private calculateNetworkImpact(threats: CyberThreatData[]): NetworkImpactAssessment {
    const allCountries = new Set<string>();
    const allSectors = new Set<string>();
    let totalTargets = 0;
    let maxSeverity = 0;
    
    threats.forEach(threat => {
      threat.target_countries.forEach(country => allCountries.add(country));
      threat.target_sectors.forEach(sector => allSectors.add(sector));
      totalTargets += threat.impact_assessment.affected_systems;
      maxSeverity = Math.max(maxSeverity, threat.severity);
    });
    
    let threatLevel: NetworkImpactAssessment['threat_level'];
    if (maxSeverity >= 9) threatLevel = 'critical';
    else if (maxSeverity >= 7) threatLevel = 'high';
    else if (maxSeverity >= 5) threatLevel = 'medium';
    else threatLevel = 'low';
    
    return {
      total_targets: totalTargets,
      affected_countries: Array.from(allCountries),
      affected_sectors: Array.from(allSectors),
      systems_affected: totalTargets,
      threat_level: threatLevel
    };
  }

  private storeCorrelations(threatId: string, correlations: ThreatCorrelation[]): void {
    this.correlations.set(threatId, correlations);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    try {
      const threatsToProcess = this.processingQueue.splice(0, 10); // Process in batches
      const newCorrelations: ThreatCorrelation[] = [];
      const updatedCorrelations: ThreatCorrelation[] = [];
      
      for (const threat of threatsToProcess) {
        const correlations = await this.findCorrelations(threat);
        newCorrelations.push(...correlations);
      }
      
      const newNetworks = await this.buildThreatNetworks(threatsToProcess);
      const updatedNetworks: ThreatNetwork[] = [];
      
      const processingTime = performance.now() - startTime;
      
      const update: RealTimeCorrelationUpdate = {
        timestamp: new Date(),
        new_correlations: newCorrelations,
        updated_correlations: updatedCorrelations,
        new_networks: newNetworks,
        updated_networks: updatedNetworks,
        correlation_stats: {
          total_correlations: Array.from(this.correlations.values()).flat().length,
          high_confidence_correlations: Array.from(this.correlations.values())
            .flat()
            .filter(c => c.confidence_score >= 0.7).length,
          active_networks: this.networks.size,
          processing_latency_ms: processingTime
        }
      };
      
      // Notify subscribers
      this.updateCallbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in correlation update callback:', error);
        }
      });
      
    } finally {
      this.isProcessing = false;
      
      // Continue processing if more items in queue
      if (this.processingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  private startBackgroundProcessing(): void {
    // Start background processing interval
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Subscribe to real-time correlation updates
   */
  subscribeToUpdates(callback: (update: RealTimeCorrelationUpdate) => void): () => void {
    this.updateCallbacks.push(callback);
    
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get correlations for a specific threat
   */
  getThreatCorrelations(threatId: string): ThreatCorrelation[] {
    return this.correlations.get(threatId) || [];
  }

  /**
   * Get all threat networks
   */
  getAllNetworks(): ThreatNetwork[] {
    return Array.from(this.networks.values());
  }

  /**
   * Get network by ID
   */
  getNetwork(networkId: string): ThreatNetwork | undefined {
    return this.networks.get(networkId);
  }

  /**
   * Add custom correlation rule
   */
  addCorrelationRule(rule: CorrelationRule): void {
    this.correlationRules.push(rule);
  }

  /**
   * Update correlation rule
   */
  updateCorrelationRule(ruleId: string, updates: Partial<CorrelationRule>): boolean {
    const index = this.correlationRules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      this.correlationRules[index] = { ...this.correlationRules[index], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Get all correlation rules
   */
  getCorrelationRules(): CorrelationRule[] {
    return [...this.correlationRules];
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.correlations.clear();
    this.networks.clear();
  }

  /**
   * Get correlation statistics
   */
  getCorrelationStats(): {
    total_correlations: number;
    high_confidence_correlations: number;
    active_networks: number;
    avg_network_size: number;
  } {
    const allCorrelations = Array.from(this.correlations.values()).flat();
    const highConfidenceCorrelations = allCorrelations.filter(c => c.confidence_score >= 0.7);
    const activeNetworks = this.networks.size;
    const avgNetworkSize = activeNetworks > 0 
      ? Array.from(this.networks.values()).reduce((sum, n) => sum + n.threats.length, 0) / activeNetworks
      : 0;

    return {
      total_correlations: allCorrelations.length,
      high_confidence_correlations: highConfidenceCorrelations.length,
      active_networks: activeNetworks,
      avg_network_size: avgNetworkSize
    };
  }
}
