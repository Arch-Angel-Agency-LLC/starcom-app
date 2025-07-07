// Intel Package Types and Interfaces for Cyber Investigation MVP
// Focused on practical team collaboration for cyber ops

export interface IntelPackage {
  id: string;
  name: string;
  description: string;
  type: 'CYBER_INCIDENT' | 'THREAT_ANALYSIS' | 'ASSET_INVENTORY' | 'INVESTIGATION';
  createdBy: string; // wallet address
  createdAt: Date;
  updatedAt: Date;
  reportIds: string[]; // Array of Intel Report IDs
  tags: string[];
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  status: 'ACTIVE' | 'ANALYZING' | 'COMPLETED' | 'ARCHIVED';
  
  // Cyber-specific metadata
  incidentId?: string;
  affectedSystems: string[];
  threatActors: string[];
  ioCs: IoC[]; // Indicators of Compromise
  timeline: InvestigationEvent[];
  
  // Collaboration
  assignedTeam?: string;
  collaborators: string[];
  sharedWith: string[];
  
  // Storage
  ipfsHash?: string;
  onChainRef?: string;
}

export interface IoC {
  type: 'IP' | 'DOMAIN' | 'HASH' | 'EMAIL' | 'URL' | 'FILE_PATH';
  value: string;
  description: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
}

export interface InvestigationEvent {
  id: string;
  timestamp: Date;
  type: 'INCIDENT_DETECTED' | 'EVIDENCE_COLLECTED' | 'ANALYSIS_COMPLETED' | 'IOC_IDENTIFIED' | 'CONTAINMENT_ACTION' | 'RECOVERY_ACTION';
  description: string;
  author: string;
  relatedReports: string[];
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  type: 'LOG_FILE' | 'NETWORK_CAPTURE' | 'SCREENSHOT' | 'MEMORY_DUMP' | 'DISK_IMAGE' | 'DOCUMENT';
  name: string;
  description: string;
  filePath?: string;
  ipfsHash?: string;
  checksum: string;
  collectedBy: string;
  collectedAt: Date;
  chain_of_custody: ChainOfCustodyEntry[];
}

export interface ChainOfCustodyEntry {
  timestamp: Date;
  handler: string;
  action: 'COLLECTED' | 'TRANSFERRED' | 'ANALYZED' | 'STORED' | 'ACCESSED';
  notes: string;
  signature: string;
}

export interface CyberTeam {
  id: string;
  name: string;
  type: 'INCIDENT_RESPONSE' | 'THREAT_HUNTING' | 'FORENSICS' | 'SOC' | 'RED_TEAM' | 'BLUE_TEAM';
  agency: 'SOCOM' | 'SPACE_FORCE' | 'CYBER_COMMAND' | 'NSA' | 'DIA' | 'CIA';
  
  // Team members
  lead: string; // wallet address
  members: TeamMember[];
  
  // Capabilities
  specializations: string[];
  clearanceLevel: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  
  // Status
  status: 'ACTIVE' | 'STANDBY' | 'DEPLOYED' | 'OFFLINE';
  currentInvestigations: string[];
  
  // Collaboration settings
  autoShareFindings: boolean;
  allowExternalCollaboration: boolean;
  preferredCommunicationChannels: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  walletAddress: string;
  name: string;
  role: 'LEAD_ANALYST' | 'CYBER_ANALYST' | 'FORENSICS_SPECIALIST' | 'THREAT_HUNTER' | 'SOC_ANALYST' | 'INCIDENT_COMMANDER';
  specializations: string[];
  clearanceLevel: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  joinedAt: Date;
  lastActivity: Date;
}

export interface CyberInvestigation {
  id: string;
  title: string;
  description: string;
  type: 'INCIDENT_RESPONSE' | 'THREAT_HUNTING' | 'FORENSIC_ANALYSIS' | 'VULNERABILITY_ASSESSMENT';
  
  // Classification and priority
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Investigation details
  incidentDate: Date;
  detectedDate: Date;
  reportedBy: string;
  assignedTeam: string;
  
  // Status and progress
  status: 'INITIATED' | 'INVESTIGATING' | 'ANALYZING' | 'CONTAINING' | 'RECOVERING' | 'CLOSED';
  progress: number; // 0-100
  
  // Assets and scope
  affectedSystems: string[];
  affectedUsers: string[];
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Investigation data
  intelPackages: string[];
  timeline: InvestigationEvent[];
  ioCs: IoC[];
  evidence: Evidence[];
  
  // Collaboration
  collaboratingTeams: string[];
  sharedWith: string[];
  
  // Tracking
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  resolvedDate?: Date;
  
  // Documentation
  executiveSummary?: string;
  technicalSummary?: string;
  lessonsLearned?: string;
  recommendedActions: string[];
}

// API Response types for MVP
export interface CreatePackageRequest {
  name: string;
  description: string;
  type: IntelPackage['type'];
  tags: string[];
  classification: IntelPackage['classification'];
  incidentId?: string;
  affectedSystems: string[];
}

export interface CreateTeamRequest {
  name: string;
  type: CyberTeam['type'];
  agency: CyberTeam['agency'];
  specializations: string[];
  clearanceLevel: CyberTeam['clearanceLevel'];
}

export interface CreateInvestigationRequest {
  title: string;
  description: string;
  type: CyberInvestigation['type'];
  classification: CyberInvestigation['classification'];
  priority: CyberInvestigation['priority'];
  affectedSystems: string[];
  incidentDate: Date;
}

// State management for MVP
export interface CyberInvestigationState {
  // Core entities
  packages: IntelPackage[];
  teams: CyberTeam[];
  investigations: CyberInvestigation[];
  
  // Current context
  activeInvestigation?: string;
  activeTeam?: string;
  activePackage?: string;
  
  // UI state
  loading: boolean;
  error?: string;
  
  // Collaboration
  liveCollaborators: string[];
  realtimeUpdates: boolean;
}
