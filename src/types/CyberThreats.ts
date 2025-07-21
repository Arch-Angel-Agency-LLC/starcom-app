/**
 * CyberThreats Type System
 * Comprehensive TypeScript definitions for cyber threat intelligence data
 * Part of the Starcom CyberCommand visualization system
 */

import type { 
  GeoCoordinate 
} from './CyberCommandVisualization';

// =============================================================================
// ADDITIONAL UTILITY TYPES
// =============================================================================

/**
 * Time window for filtering operations
 */
export interface TimeWindow {
  start: Date;
  end: Date;
}

// =============================================================================
// CORE THREAT TYPES
// =============================================================================

/**
 * Primary threat classification system
 */
export type ThreatCategory = 
  | 'Malware'           // Viruses, trojans, worms, ransomware
  | 'APT'              // Advanced persistent threats
  | 'Botnet'           // Botnets and command & control
  | 'Phishing'         // Phishing campaigns and social engineering
  | 'DataBreach'       // Data exfiltration and breaches
  | 'Infrastructure'   // Critical infrastructure threats
  | 'SupplyChain'      // Supply chain compromises
  | 'Insider'          // Insider threats
  | 'Unknown';         // Unclassified threats

/**
 * Threat sophistication levels
 */
export type ThreatSophistication = 
  | 'Basic'            // Script kiddies, automated tools
  | 'Intermediate'     // Organized crime, commodity malware
  | 'Advanced'         // Nation-state, sophisticated groups
  | 'Expert'           // Elite APT groups, zero-day exploits
  | 'Unknown';

/**
 * Threat actor types
 */
export type ThreatActorType = 
  | 'NationState'      // Government-sponsored
  | 'Criminal'         // Financially motivated
  | 'Hacktivist'       // Ideologically motivated
  | 'Insider'          // Internal threats
  | 'Terrorist'        // Terrorism-related
  | 'Unknown';

/**
 * Threat confidence levels (intelligence assessment)
 */
export type ConfidenceLevel = 
  | 'Low'              // 0-30% confidence
  | 'Medium'           // 31-70% confidence
  | 'High'             // 71-90% confidence
  | 'Confirmed';       // 91-100% confidence

/**
 * Threat status in lifecycle
 */
export type ThreatStatus = 
  | 'Emerging'         // Newly discovered
  | 'Active'           // Currently active
  | 'Contained'        // Partially mitigated
  | 'Neutralized'      // Fully mitigated
  | 'Dormant'          // Inactive but not neutralized
  | 'Unknown';

// =============================================================================
// THREAT INTELLIGENCE DATA STRUCTURES
// =============================================================================

/**
 * Core threat actor information
 */
export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: ThreatActorType;
  sophistication: ThreatSophistication;
  attribution: {
    country?: string;
    organization?: string;
    confidence: ConfidenceLevel;
  };
  motivations: string[];
  techniques: string[];           // MITRE ATT&CK techniques
  targets: string[];             // Industry sectors, countries
  first_seen: Date;
  last_activity: Date;
}

/**
 * Campaign information for coordinated threat activities
 */
export interface ThreatCampaign {
  id: string;
  name: string;
  description: string;
  actor_id?: string;
  start_date: Date;
  end_date?: Date;
  status: ThreatStatus;
  objectives: string[];
  targets: {
    sectors: string[];
    countries: string[];
    organizations: string[];
  };
  techniques: string[];          // MITRE ATT&CK techniques
  indicators: string[];          // IOC IDs
  confidence: ConfidenceLevel;
}

/**
 * Indicators of Compromise (IOCs)
 */
export interface IOC {
  id: string;
  type: IOCType;
  value: string;
  description?: string;
  confidence: ConfidenceLevel;
  first_seen: Date;
  last_seen: Date;
  malware_families?: string[];
  campaigns?: string[];
  threat_actors?: string[];
  tags: string[];
  source: {
    provider: string;
    report_id?: string;
    url?: string;
  };
}

export type IOCType = 
  | 'domain'
  | 'ip_address'
  | 'url'
  | 'file_hash'
  | 'email'
  | 'registry_key'
  | 'mutex'
  | 'certificate'
  | 'user_agent'
  | 'filename';

/**
 * Malware family information
 */
export interface MalwareFamily {
  id: string;
  name: string;
  aliases: string[];
  family_type: MalwareType;
  description: string;
  capabilities: string[];
  platforms: string[];          // Windows, Linux, macOS, etc.
  first_seen: Date;
  last_seen: Date;
  threat_actors: string[];      // Associated threat actor IDs
  campaigns: string[];          // Associated campaign IDs
  techniques: string[];         // MITRE ATT&CK techniques
  variants: MalwareVariant[];
}

export type MalwareType = 
  | 'Virus'
  | 'Worm'
  | 'Trojan'
  | 'Ransomware'
  | 'Spyware'
  | 'Adware'
  | 'Rootkit'
  | 'Backdoor'
  | 'Dropper'
  | 'Loader'
  | 'RAT'              // Remote Access Trojan
  | 'Banking'
  | 'Cryptominer'
  | 'Botnet'
  | 'Unknown';

export interface MalwareVariant {
  id: string;
  name: string;
  hash: string;
  size: number;
  compilation_time?: Date;
  first_seen: Date;
  capabilities: string[];
  c2_servers: string[];         // Command & control servers
}

// =============================================================================
// MAIN THREAT DATA STRUCTURE
// =============================================================================

/**
 * Primary threat intelligence data structure
 * Includes VisualizationData properties for consistency with other visualizations
 */
export interface CyberThreatData {
  // Core visualization data properties
  id: string;
  type: 'CyberThreats';
  location: GeoCoordinate;
  timestamp: Date;
  metadata: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Core threat information
  threat_id: string;
  category: ThreatCategory;
  subcategory?: string;
  
  // Threat details
  name: string;
  description: string;
  severity: number;              // 1-10 scale
  confidence: ConfidenceLevel;
  status: ThreatStatus;
  sophistication: ThreatSophistication;
  
  // Attribution
  threat_actor?: ThreatActor;
  actor_id?: string;
  campaigns: string[];          // Associated campaign IDs
  
  // Technical details
  malware_families: string[];   // Associated malware family IDs
  iocs: IOC[];                 // Indicators of compromise
  techniques: string[];         // MITRE ATT&CK technique IDs
  
  // Geographic and targeting information
  source_countries: string[];   // Origin countries
  target_countries: string[];   // Target countries
  target_sectors: string[];     // Industry sectors
  target_organizations: string[];
  
  // Temporal information
  first_seen: Date;
  last_seen: Date;
  peak_activity?: Date;
  
  // Impact assessment
  impact_assessment: {
    scope: 'Limited' | 'Regional' | 'Global';
    affected_systems: number;
    financial_impact?: number;   // USD estimate
    data_compromised?: number;   // Records count
    downtime?: number;           // Hours
  };
  
  // Intelligence sources
  sources: ThreatSource[];
  
  // Relationships
  related_threats: string[];    // Related threat IDs
  parent_threat?: string;       // Parent threat campaign
  child_threats: string[];      // Sub-threats or variants
  
  // Visualization metadata
  visualization_data: {
    color: string;              // Threat type color coding
    intensity: number;          // Visual intensity (0-1)
    animation_type: 'pulse' | 'flow' | 'network' | 'heat';
    show_connections: boolean;
    show_attribution: boolean;
  };
}

/**
 * Threat intelligence source information
 */
export interface ThreatSource {
  provider: string;
  feed_name: string;
  report_id?: string;
  url?: string;
  confidence: ConfidenceLevel;
  timestamp: Date;
  classification: 'Public' | 'TLP:White' | 'TLP:Green' | 'TLP:Amber' | 'TLP:Red';
}

// =============================================================================
// THREAT INTELLIGENCE FEED TYPES
// =============================================================================

/**
 * Types of threat intelligence feeds
 */
export type ThreatFeedType = 
  | 'Commercial'       // Recorded Future, CrowdStrike, etc.
  | 'Government'       // CISA, FBI, etc.
  | 'OpenSource'       // VirusTotal, OTX, etc.
  | 'Industry'         // Sector-specific sharing
  | 'Internal';        // Organization's own intelligence

/**
 * Threat feed configuration
 */
export interface ThreatFeedConfig {
  id: string;
  name: string;
  type: ThreatFeedType;
  provider: string;
  url: string;
  api_key?: string;
  update_interval: number;      // Minutes
  enabled: boolean;
  priority: number;             // 1-10, higher = more trusted
  categories: ThreatCategory[]; // Supported threat categories
  last_update: Date;
  error_count: number;
}

// =============================================================================
// QUERY AND FILTERING
// =============================================================================

/**
 * Query options for threat intelligence data
 */
export interface ThreatQueryOptions {
  // Basic filtering
  categories?: ThreatCategory[];
  sophistication?: ThreatSophistication[];
  confidence?: ConfidenceLevel[];
  status?: ThreatStatus[];
  
  // Actor filtering
  actor_types?: ThreatActorType[];
  actor_countries?: string[];
  
  // Geographic filtering
  source_countries?: string[];
  target_countries?: string[];
  target_sectors?: string[];
  
  // Temporal filtering
  time_window?: TimeWindow;
  first_seen_after?: Date;
  last_seen_before?: Date;
  
  // Severity filtering
  severity_min?: number;
  severity_max?: number;
  
  // Technical filtering
  malware_types?: MalwareType[];
  techniques?: string[];        // MITRE ATT&CK technique IDs
  campaigns?: string[];
  
  // Result options
  limit?: number;
  offset?: number;
  sort_by?: 'severity' | 'confidence' | 'first_seen' | 'last_seen';
  sort_order?: 'asc' | 'desc';
  
  // Relationship options
  include_related?: boolean;
  max_relationship_depth?: number;
}

// =============================================================================
// REAL-TIME STREAMING
// =============================================================================

/**
 * Real-time threat intelligence event types
 */
export type ThreatEventType = 
  | 'new_threat'       // New threat discovered
  | 'threat_update'    // Existing threat updated
  | 'threat_escalation' // Severity or status escalation
  | 'threat_attribution' // New attribution information
  | 'threat_neutralized' // Threat neutralized/mitigated
  | 'ioc_update'       // New IOCs discovered
  | 'campaign_update'  // Campaign information updated
  | 'feed_error';      // Feed processing error

/**
 * Streaming event structure
 */
export interface ThreatStreamEvent {
  event_type: ThreatEventType;
  threat_data: CyberThreatData;
  timestamp: Date;
  source_feed: string;
  metadata?: {
    correlation_id?: string;
    confidence_change?: number;
    severity_change?: number;
    new_iocs?: string[];
    updated_fields?: string[];
  };
}

/**
 * Callback function for threat stream events
 */
export type ThreatStreamCallback = (event: ThreatStreamEvent) => void;

// =============================================================================
// THREAT CORRELATION AND ANALYSIS
// =============================================================================

/**
 * Threat correlation results
 */
export interface ThreatCorrelation {
  primary_threat: string;       // Threat ID
  related_threats: {
    threat_id: string;
    correlation_type: CorrelationType;
    confidence: ConfidenceLevel;
    shared_attributes: string[];
  }[];
  correlation_score: number;    // 0-1
  analysis_timestamp: Date;
}

export type CorrelationType = 
  | 'same_actor'
  | 'same_campaign'
  | 'same_malware'
  | 'same_infrastructure'
  | 'same_targets'
  | 'same_techniques'
  | 'temporal_proximity'
  | 'geographic_proximity';

/**
 * Threat trend analysis
 */
export interface ThreatTrend {
  threat_category: ThreatCategory;
  actor_type?: ThreatActorType;
  time_period: {
    start: Date;
    end: Date;
  };
  metrics: {
    total_threats: number;
    new_threats: number;
    active_threats: number;
    neutralized_threats: number;
    average_severity: number;
    peak_activity_date: Date;
  };
  trends: {
    volume_change: number;       // Percentage change
    severity_change: number;     // Average severity change
    geographic_spread: string[]; // New countries affected
    sector_targeting: string[];  // New sectors targeted
  };
}

// =============================================================================
// VISUALIZATION SPECIFIC TYPES
// =============================================================================

/**
 * Threat heat map data point
 */
export interface ThreatHeatMapPoint {
  location: GeoCoordinate;
  threat_density: number;       // 0-1
  threat_categories: ThreatCategory[];
  active_threats: number;
  avg_severity: number;
  dominant_actor_type?: ThreatActorType;
}

/**
 * Command & Control network visualization
 */
export interface C2NetworkData {
  nodes: C2Node[];
  connections: C2Connection[];
  campaigns: string[];
  discovery_date: Date;
  last_update: Date;
}

export interface C2Node {
  id: string;
  type: 'c2_server' | 'proxy' | 'compromised_host' | 'victim';
  location: GeoCoordinate;
  ip_address?: string;
  domain?: string;
  first_seen: Date;
  last_seen: Date;
  status: 'active' | 'sinkholed' | 'taken_down' | 'unknown';
  malware_families: string[];
  threat_actors: string[];
}

export interface C2Connection {
  source_id: string;
  target_id: string;
  connection_type: 'command' | 'data_exfil' | 'lateral_movement' | 'update';
  protocol: string;
  port?: number;
  first_seen: Date;
  last_seen: Date;
  volume?: number;              // Bytes transferred
  confidence: ConfidenceLevel;
}

// =============================================================================
// MITRE ATT&CK INTEGRATION
// =============================================================================

/**
 * MITRE ATT&CK technique mapping
 */
export interface AttackTechnique {
  id: string;                   // T1234
  name: string;
  tactic: string;               // TA0001
  description: string;
  platforms: string[];
  data_sources: string[];
  mitigations: string[];
  threat_usage: {
    threat_id: string;
    campaign_id?: string;
    confidence: ConfidenceLevel;
    description?: string;
  }[];
}

/**
 * Kill chain phase mapping
 */
export interface KillChainPhase {
  name: string;
  phase_number: number;
  techniques: string[];
  typical_duration: number;     // Hours
  indicators: string[];
  countermeasures: string[];
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export {
  // Core types are already exported above via individual exports
};

// Type utility for creating threat data with defaults
export type CreateThreatData = Omit<CyberThreatData, 'id' | 'type' | 'timestamp'> & {
  id?: string;
  type?: 'CyberThreats';
  timestamp?: Date;
};

// Validation types
export interface ThreatDataValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Batch processing types
export interface ThreatBatch {
  batch_id: string;
  threats: CyberThreatData[];
  processing_status: 'pending' | 'processing' | 'complete' | 'error';
  created_at: Date;
  processed_at?: Date;
  errors?: string[];
}
