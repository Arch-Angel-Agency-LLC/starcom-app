/**
 * CyberAttacks-specific types and interfaces
 * Extends base VisualizationData for real-time attack visualization
 */

import type { 
  VisualizationData, 
  GeoCoordinate
} from './CyberCommandVisualization';

// =============================================================================
// ATTACK TYPES AND CATEGORIES
// =============================================================================

export type AttackType = 
  | 'DDoS'
  | 'Malware'
  | 'Phishing'
  | 'DataBreach'
  | 'Ransomware'
  | 'APT'
  | 'Botnet'
  | 'WebAttack'
  | 'NetworkIntrusion'
  | 'Unknown';

export type AttackVector = 
  | 'Email'
  | 'Web'
  | 'Network'
  | 'USB'
  | 'Social'
  | 'Supply_Chain'
  | 'Zero_Day'
  | 'Credential_Theft'
  | 'Remote_Access'
  | 'Unknown';

export type AttackPhase = 
  | 'Initial_Access'
  | 'Execution'
  | 'Persistence'
  | 'Privilege_Escalation'
  | 'Defense_Evasion'
  | 'Credential_Access'
  | 'Discovery'
  | 'Lateral_Movement'
  | 'Collection'
  | 'Command_Control'
  | 'Exfiltration'
  | 'Impact';

export type AttackStatus = 
  | 'detected'
  | 'in_progress'
  | 'contained'
  | 'mitigated'
  | 'resolved'
  | 'escalated';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5; // 1=Low, 5=Critical

// =============================================================================
// GEOGRAPHIC AND TARGETING DATA
// =============================================================================

export interface AttackSource extends GeoCoordinate {
  countryCode: string;
  city?: string;
  organization?: string;
  asn?: number;
  confidence: number; // 0-1, attribution confidence
}

export interface AttackTarget extends GeoCoordinate {
  countryCode: string;
  city?: string;
  organization: string;
  sector: IndustrySector;
  asn?: number;
  criticality: number; // 0-1, target criticality
}

export type IndustrySector = 
  | 'Government'
  | 'Financial'
  | 'Healthcare'
  | 'Energy'
  | 'Transportation'
  | 'Communications'
  | 'Manufacturing'
  | 'Defense'
  | 'Education'
  | 'Retail'
  | 'Technology'
  | 'Other';

// =============================================================================
// ATTACK TRAJECTORY AND TIMING
// =============================================================================

export interface AttackTrajectory {
  source: AttackSource;
  target: AttackTarget;
  intermediateHops?: GeoCoordinate[];
  protocol?: string;
  port?: number;
  duration: number; // milliseconds
  packet_count?: number;
}

export interface AttackTimeline {
  firstDetected: Date;
  lastSeen: Date;
  estimatedStart?: Date;
  peakTime?: Date;
  estimatedEnd?: Date;
}

// =============================================================================
// TECHNICAL ATTACK DETAILS
// =============================================================================

export interface AttackTechnicalData {
  // MITRE ATT&CK Framework
  mitre_tactic?: string[];
  mitre_technique?: string[];
  mitre_subtechnique?: string[];
  
  // IOCs (Indicators of Compromise)
  file_hashes?: string[];
  ip_addresses?: string[];
  domains?: string[];
  urls?: string[];
  email_addresses?: string[];
  
  // Network details
  protocols?: string[];
  ports?: number[];
  user_agents?: string[];
  
  // Malware details
  malware_family?: string;
  malware_variant?: string;
  c2_servers?: string[];
  
  // Impact metrics
  systems_affected?: number;
  data_compromised?: string; // size description
  financial_impact?: number;
  downtime_minutes?: number;
}

// =============================================================================
// RESPONSE AND MITIGATION
// =============================================================================

export interface AttackResponse {
  response_team?: string;
  incident_id?: string;
  response_actions?: ResponseAction[];
  mitigation_status: MitigationStatus;
  recovery_time?: number; // minutes
  lessons_learned?: string[];
}

export interface ResponseAction {
  action_type: 'block' | 'isolate' | 'monitor' | 'analyze' | 'patch' | 'backup';
  description: string;
  timestamp: Date;
  effectiveness: number; // 0-1
  automated: boolean;
}

export type MitigationStatus = 
  | 'none'
  | 'partial'
  | 'contained'
  | 'fully_mitigated'
  | 'monitoring';

// =============================================================================
// MAIN CYBERATTACK DATA INTERFACE
// =============================================================================

export interface CyberAttackData extends VisualizationData {
  type: 'CyberAttacks';
  
  // Core attack information
  attack_type: AttackType;
  attack_vector: AttackVector;
  attack_phase: AttackPhase;
  severity: SeverityLevel;
  attack_status: AttackStatus;
  
  // Geographic data
  trajectory: AttackTrajectory;
  
  // Timing information
  timeline: AttackTimeline;
  
  // Technical details
  technical_data: AttackTechnicalData;
  
  // Response information
  response?: AttackResponse;
  
  // Attribution and threat intelligence
  attribution?: {
    threat_actor?: string;
    campaign?: string;
    confidence: number;
    last_updated: Date;
  };
  
  // Relationships to other attacks
  related_attacks?: string[]; // Array of attack IDs
  
  // Custom metadata (extends base metadata)
  metadata: {
    source: string;
    confidence: number;
    [key: string]: unknown;
  };
}

// =============================================================================
// QUERY AND FILTERING INTERFACES
// =============================================================================

export interface CyberAttackQueryOptions {
  // Time filtering
  time_window?: {
    start: Date;
    end: Date;
  };
  
  // Geographic filtering
  source_countries?: string[];
  target_countries?: string[];
  target_sectors?: IndustrySector[];
  
  // Attack filtering
  attack_types?: AttackType[];
  attack_vectors?: AttackVector[];
  severity_min?: SeverityLevel;
  severity_max?: SeverityLevel;
  
  // Status filtering
  attack_statuses?: AttackStatus[];
  mitigation_statuses?: MitigationStatus[];
  
  // Limit and pagination
  limit?: number;
  offset?: number;
  
  // Real-time options
  real_time?: boolean;
  update_interval?: number; // milliseconds
}

// =============================================================================
// REAL-TIME STREAMING INTERFACES
// =============================================================================

export interface AttackStreamEvent {
  event_type: 'new_attack' | 'attack_update' | 'attack_resolved';
  attack_data: CyberAttackData;
  timestamp: Date;
}

export interface AttackStreamSubscription {
  id: string;
  query_options: CyberAttackQueryOptions;
  callback: (event: AttackStreamEvent) => void;
  last_update: Date;
  active: boolean;
}

// =============================================================================
// VISUALIZATION-SPECIFIC INTERFACES
// =============================================================================

export interface AttackVisualizationConfig {
  // Animation settings
  show_trajectories: boolean;
  trajectory_duration: number; // milliseconds
  show_pulses: boolean;
  pulse_intensity: number; // 0-1
  
  // Color schemes
  color_by: 'severity' | 'attack_type' | 'status' | 'sector';
  severity_colors: Record<SeverityLevel, string>;
  
  // Filtering
  max_concurrent_attacks: number;
  fade_after_completion: boolean;
  fade_duration: number; // milliseconds
  
  // Clustering
  cluster_nearby_attacks: boolean;
  cluster_radius: number; // kilometers
  
  // Performance
  max_trajectory_points: number;
  update_frequency: number; // Hz
}

export interface AttackVisualizationState {
  active_attacks: Map<string, CyberAttackData>;
  recent_attacks: CyberAttackData[];
  animation_queue: AttackAnimationJob[];
  last_update: Date;
  total_attacks_today: number;
  performance_metrics: {
    render_time: number;
    memory_usage: number;
    dropped_frames: number;
  };
}

export interface AttackAnimationJob {
  attack_id: string;
  animation_type: 'trajectory' | 'pulse' | 'impact' | 'fade';
  start_time: Date;
  duration: number;
  progress: number; // 0-1
  properties: Record<string, unknown>;
}

// =============================================================================
// DATA VALIDATION AND UTILITIES
// =============================================================================

export const ATTACK_TYPE_COLORS: Record<AttackType, string> = {
  DDoS: '#ff4444',
  Malware: '#ff8800',
  Phishing: '#ffaa00',
  DataBreach: '#cc0000',
  Ransomware: '#aa0044',
  APT: '#660000',
  Botnet: '#884400',
  WebAttack: '#ff6600',
  NetworkIntrusion: '#cc4400',
  Unknown: '#888888'
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  1: '#4CAF50', // Green - Low
  2: '#FFC107', // Yellow - Medium-Low
  3: '#FF9800', // Orange - Medium
  4: '#F44336', // Red - High
  5: '#9C27B0'  // Purple - Critical
};

export const SECTOR_COLORS: Record<IndustrySector, string> = {
  Government: '#1976D2',
  Financial: '#388E3C',
  Healthcare: '#D32F2F',
  Energy: '#F57C00',
  Transportation: '#7B1FA2',
  Communications: '#303F9F',
  Manufacturing: '#5D4037',
  Defense: '#424242',
  Education: '#00796B',
  Retail: '#C2185B',
  Technology: '#455A64',
  Other: '#616161'
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export function isValidAttackType(type: string): type is AttackType {
  return ['DDoS', 'Malware', 'Phishing', 'DataBreach', 'Ransomware', 
          'APT', 'Botnet', 'WebAttack', 'NetworkIntrusion', 'Unknown'].includes(type);
}

export function isValidSeverityLevel(level: number): level is SeverityLevel {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}

export function isValidAttackStatus(status: string): status is AttackStatus {
  return ['detected', 'in_progress', 'contained', 'mitigated', 'resolved', 'escalated'].includes(status);
}

export function validateCyberAttackData(data: unknown): CyberAttackData | null {
  try {
    if (!data || typeof data !== 'object') return null;
    
    const obj = data as Record<string, unknown>;
    
    // Validate required fields
    if (!obj.id || !obj.attack_type || !obj.severity || !obj.trajectory) {
      return null;
    }
    
    // Validate attack type
    if (!isValidAttackType(obj.attack_type as string)) return null;
    
    // Validate severity
    if (!isValidSeverityLevel(obj.severity as number)) return null;
    
    // Validate trajectory has source and target
    const trajectory = obj.trajectory as Record<string, unknown>;
    if (!trajectory?.source || !trajectory?.target) return null;
    
    // Basic structure looks valid
    return obj as unknown as CyberAttackData;
    
  } catch (error) {
    console.warn('Invalid CyberAttack data:', error);
    return null;
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CYBER_ATTACK_CONSTANTS = {
  MAX_TRAJECTORY_HOPS: 10,
  MAX_CONCURRENT_ATTACKS: 1000,
  DEFAULT_ANIMATION_DURATION: 3000, // 3 seconds
  DEFAULT_UPDATE_INTERVAL: 1000, // 1 second
  MAX_RELATED_ATTACKS: 50,
  CONFIDENCE_THRESHOLD: 0.3,
  
  // Performance limits
  MAX_RENDER_OBJECTS: 500,
  TARGET_FPS: 30,
  MEMORY_LIMIT_MB: 256
} as const;
