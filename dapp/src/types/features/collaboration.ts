/**
 * Multi-Agency Collaboration Type System
 * 
 * This module defines comprehensive types for secure, real-time collaboration
 * between SOCOM, Space Force, and Cyber Command through Web3-based
 * intelligence sharing and quantum-safe communication protocols.
 */

// ============================================================================
// CORE COLLABORATION TYPES
// ============================================================================

export type AgencyType = 'SOCOM' | 'SPACE_FORCE' | 'CYBER_COMMAND' | 'NSA' | 'DIA' | 'CIA';

export type ClearanceLevel = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'SCI';

export type CollaborationRole = 
  | 'LEAD_ANALYST' 
  | 'SUPPORT_ANALYST' 
  | 'OBSERVER' 
  | 'GUEST' 
  | 'COORDINATOR' 
  | 'ADMIN';

export interface Operator {
  id: string;
  name: string;
  agency: AgencyType;
  role: CollaborationRole;
  clearanceLevel: ClearanceLevel;
  specializations: string[];
  avatarUrl?: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  lastActivity: Date;
}

// ============================================================================
// COLLABORATION SESSION MANAGEMENT
// ============================================================================

export interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  classification: ClearanceLevel;
  leadAgency: AgencyType;
  participants: Operator[];
  invitedOperators: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'ARCHIVED';
  sharedContexts: SharedContext[];
  communicationChannels: CommunicationChannel[];
  intelligenceAssets: SharedIntelligenceAsset[];
}

export interface SharedContext {
  id: string;
  name: string;
  sessionId: string;
  ownerId: string;
  sharedWith: string[];
  contextSnapshot: Record<string, unknown>; // Full context state snapshot
  permissions: ContextPermissions;
  encryptionStatus: EncryptionStatus;
  lastSynchronized: Date;
  annotationLayers: CollaborativeAnnotation[];
}

export interface ContextPermissions {
  canView: string[];
  canEdit: string[];
  canShare: string[];
  canAnnotate: string[];
  clearanceRequired: ClearanceLevel;
}

// ============================================================================
// REAL-TIME COLLABORATION FEATURES
// ============================================================================

export interface CollaborativeAnnotation {
  id: string;
  authorId: string;
  authorName: string;
  agency: AgencyType;
  content: string;
  position: AnnotationPosition;
  type: 'NOTE' | 'MARKER' | 'HIGHLIGHT' | 'LINK' | 'WARNING';
  classification: ClearanceLevel;
  createdAt: Date;
  linkedAssets?: string[];
  responses?: CollaborativeAnnotation[];
}

export interface AnnotationPosition {
  viewType: 'GLOBE' | 'TIMELINE' | 'NODE_GRAPH';
  coordinates?: {
    lat?: number;
    lng?: number;
    x?: number;
    y?: number;
    timestamp?: Date;
  };
  elementId?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE' | 'VIDEO' | 'SECURE_RELAY';
  participants: string[];
  classification: ClearanceLevel;
  encryptionType: 'PQC' | 'AES256' | 'WEB3_SECURED';
  isActive: boolean;
  messageHistory: CollaborationMessage[];
}

export interface CollaborationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAgency: AgencyType;
  content: string;
  type: 'TEXT' | 'INTELLIGENCE_SHARE' | 'CONTEXT_UPDATE' | 'ANNOTATION' | 'ALERT';
  timestamp: Date;
  classification: ClearanceLevel;
  attachments?: MessageAttachment[];
  linkedContexts?: string[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'INTELLIGENCE_ASSET' | 'CONTEXT_SNAPSHOT' | 'ANALYSIS_REPORT' | 'FILE';
  url: string;
  size: number;
  classification: ClearanceLevel;
  encryptionStatus: EncryptionStatus;
}

// ============================================================================
// WEB3 INTELLIGENCE MARKETPLACE
// ============================================================================

export interface SharedIntelligenceAsset {
  id: string;
  name: string;
  description: string;
  category: IntelligenceCategory;
  sourceAgency: AgencyType;
  creatorId: string;
  classification: ClearanceLevel;
  trustScore: number;
  validationStatus: 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'REJECTED';
  metadata: IntelligenceMetadata;
  accessRequirements: AccessRequirement[];
  pricing: AssetPricing;
  provenance: ProvenanceChain[];
  encryptionStatus: EncryptionStatus;
  downloadCount: number;
  ratingAverage: number;
  createdAt: Date;
  expiresAt?: Date;
}

export type IntelligenceCategory = 
  | 'THREAT_ANALYSIS'
  | 'GEOSPATIAL_DATA'
  | 'NETWORK_TOPOLOGY'
  | 'COMMUNICATION_PATTERNS'
  | 'BEHAVIORAL_ANALYSIS'
  | 'SATELLITE_IMAGERY'
  | 'CYBER_INDICATORS'
  | 'HUMAN_INTELLIGENCE';

export interface IntelligenceMetadata {
  format: string;
  size: number;
  geographicScope?: string;
  temporalScope?: {
    startDate: Date;
    endDate: Date;
  };
  dataQuality: number;
  confidenceScore: number;
  sources: string[];
  relatedAssets: string[];
  tags: string[];
}

export interface AccessRequirement {
  type: 'CLEARANCE' | 'AGENCY' | 'ROLE' | 'TOKEN_BALANCE' | 'APPROVAL';
  value: string | number;
  description: string;
}

export interface AssetPricing {
  model: 'FREE' | 'TOKEN_BASED' | 'SUBSCRIPTION' | 'EXCHANGE';
  tokenCost?: number;
  fiatCost?: number;
  currency?: string;
  subscriptionTier?: string;
}

export interface ProvenanceChain {
  transactionId: string;
  blockHash: string;
  timestamp: Date;
  action: 'CREATED' | 'SHARED' | 'MODIFIED' | 'VALIDATED' | 'ACCESSED';
  actorId: string;
  actorAgency: AgencyType;
  signature: string;
  metadata?: Record<string, string | number | boolean>;
}

// ============================================================================
// SECURITY AND ENCRYPTION
// ============================================================================

export interface EncryptionStatus {
  algorithm: 'PQC_KYBER' | 'AES256_GCM' | 'WEB3_NATIVE' | 'HYBRID_PQC';
  keyId: string;
  encryptedAt: Date;
  isQuantumSafe: boolean;
  sharedWith: string[];
  decryptionLogs: DecryptionLog[];
}

export interface DecryptionLog {
  operatorId: string;
  timestamp: Date;
  ipAddress: string;
  deviceFingerprint: string;
  accessGranted: boolean;
  reason?: string;
}

export interface Web3AuthState {
  walletAddress?: string;
  chainId?: number;
  isConnected: boolean;
  authenticationMethod: 'METAMASK' | 'WALLET_CONNECT' | 'LEDGER' | 'GOVERNMENT_PKI';
  tokenBalance: number;
  governmentCertificate?: GovernmentCertificate;
  lastAuthenticated?: Date;
}

export interface GovernmentCertificate {
  certificateId: string;
  issuingAuthority: string;
  operatorId: string;
  clearanceLevel: ClearanceLevel;
  agency: AgencyType;
  validFrom: Date;
  validTo: Date;
  publicKey: string;
  signature: string;
}

// ============================================================================
// COLLABORATION STATE MANAGEMENT
// ============================================================================

export interface CollaborationState {
  currentSession: CollaborationSession | null;
  availableSessions: CollaborationSession[];
  operator: Operator | null;
  sharedContexts: SharedContext[];
  pendingInvitations: SessionInvitation[];
  communicationChannels: CommunicationChannel[];
  recentMessages: CollaborationMessage[];
  intelligenceMarketplace: MarketplaceState;
  notifications: CollaborationNotification[];
  connectionStatus: ConnectionStatus;
}

export interface SessionInvitation {
  id: string;
  sessionId: string;
  sessionName: string;
  invitedBy: string;
  invitedByName: string;
  invitedByAgency: AgencyType;
  role: CollaborationRole;
  message?: string;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}

export interface MarketplaceState {
  availableAssets: SharedIntelligenceAsset[];
  myAssets: SharedIntelligenceAsset[];
  purchasedAssets: SharedIntelligenceAsset[];
  searchQuery: string;
  selectedCategory: IntelligenceCategory | null;
  sortBy: 'RELEVANCE' | 'TRUST_SCORE' | 'PRICE' | 'DATE' | 'RATING';
  filters: MarketplaceFilters;
  isLoading: boolean;
}

export interface MarketplaceFilters {
  agencies: AgencyType[];
  clearanceLevels: ClearanceLevel[];
  priceRange: {
    min: number;
    max: number;
  };
  categories: IntelligenceCategory[];
  trustScoreMin: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface CollaborationNotification {
  id: string;
  type: 'SESSION_INVITE' | 'MESSAGE' | 'CONTEXT_SHARE' | 'INTELLIGENCE_AVAILABLE' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  senderId?: string;
  senderName?: string;
  senderAgency?: AgencyType;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  classification: ClearanceLevel;
}

export interface ConnectionStatus {
  isConnected: boolean;
  serverLatency: number;
  lastSync: Date;
  syncStatus: 'SYNCED' | 'SYNCING' | 'CONFLICT' | 'ERROR';
  participantCount: number;
  bandwidthUsage: number;
  encryptionActive: boolean;
}

// ============================================================================
// COLLABORATION ACTIONS
// ============================================================================

export type CollaborationAction =
  | { type: 'COLLABORATION_SET_OPERATOR'; payload: Operator }
  | { type: 'COLLABORATION_JOIN_SESSION'; payload: CollaborationSession }
  | { type: 'COLLABORATION_LEAVE_SESSION' }
  | { type: 'COLLABORATION_CREATE_SESSION'; payload: Partial<CollaborationSession> }
  | { type: 'COLLABORATION_UPDATE_SESSION'; payload: Partial<CollaborationSession> }
  | { type: 'COLLABORATION_ADD_PARTICIPANT'; payload: { sessionId: string; operator: Operator } }
  | { type: 'COLLABORATION_REMOVE_PARTICIPANT'; payload: { sessionId: string; operatorId: string } }
  | { type: 'COLLABORATION_SHARE_CONTEXT'; payload: SharedContext }
  | { type: 'COLLABORATION_UPDATE_SHARED_CONTEXT'; payload: Partial<SharedContext> }
  | { type: 'COLLABORATION_ADD_ANNOTATION'; payload: CollaborativeAnnotation }
  | { type: 'COLLABORATION_UPDATE_ANNOTATION'; payload: Partial<CollaborativeAnnotation> }
  | { type: 'COLLABORATION_REMOVE_ANNOTATION'; payload: string }
  | { type: 'COLLABORATION_SEND_MESSAGE'; payload: CollaborationMessage }
  | { type: 'COLLABORATION_RECEIVE_MESSAGE'; payload: CollaborationMessage }
  | { type: 'COLLABORATION_CREATE_CHANNEL'; payload: CommunicationChannel }
  | { type: 'COLLABORATION_JOIN_CHANNEL'; payload: string }
  | { type: 'COLLABORATION_LEAVE_CHANNEL'; payload: string }
  | { type: 'COLLABORATION_MARKETPLACE_SEARCH'; payload: { query: string; filters: Partial<MarketplaceFilters> } }
  | { type: 'COLLABORATION_MARKETPLACE_PURCHASE'; payload: string }
  | { type: 'COLLABORATION_MARKETPLACE_SHARE'; payload: SharedIntelligenceAsset }
  | { type: 'COLLABORATION_ADD_NOTIFICATION'; payload: CollaborationNotification }
  | { type: 'COLLABORATION_MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'COLLABORATION_CLEAR_NOTIFICATIONS' }
  | { type: 'COLLABORATION_UPDATE_CONNECTION_STATUS'; payload: Partial<ConnectionStatus> }
  | { type: 'COLLABORATION_ACCEPT_INVITATION'; payload: string }
  | { type: 'COLLABORATION_DECLINE_INVITATION'; payload: string }
  | { type: 'COLLABORATION_SET_WEB3_AUTH'; payload: Web3AuthState };

// ============================================================================
// REAL-TIME SYNCHRONIZATION
// ============================================================================

export interface SyncEvent {
  type: 'CONTEXT_UPDATE' | 'ANNOTATION_ADD' | 'ANNOTATION_UPDATE' | 'MESSAGE' | 'PARTICIPANT_JOIN' | 'PARTICIPANT_LEAVE';
  sessionId: string;
  operatorId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  signature: string;
}

export interface ConflictResolution {
  conflictId: string;
  type: 'ANNOTATION_CONFLICT' | 'CONTEXT_CONFLICT' | 'PERMISSION_CONFLICT';
  conflictingOperators: string[];
  resolution: 'MERGE' | 'OVERRIDE' | 'MANUAL_REVIEW';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionData?: Record<string, unknown>;
}

// ============================================================================
// COLLABORATION HOOKS AND UTILITIES
// ============================================================================

export interface UseCollaborationReturn {
  // Session Management
  currentSession: CollaborationSession | null;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  createSession: (sessionData: Partial<CollaborationSession>) => Promise<string>;
  
  // Real-time Communication
  sendMessage: (content: string, channelId?: string) => void;
  addAnnotation: (annotation: Omit<CollaborativeAnnotation, 'id' | 'createdAt'>) => void;
  shareContext: (contextId: string, permissions: ContextPermissions) => void;
  
  // Intelligence Marketplace
  searchIntelligence: (query: string, filters?: Partial<MarketplaceFilters>) => void;
  purchaseIntelligence: (assetId: string) => Promise<void>;
  shareIntelligence: (asset: Omit<SharedIntelligenceAsset, 'id' | 'createdAt'>) => Promise<string>;
  
  // State Access
  collaborationState: CollaborationState;
  isConnected: boolean;
  participantCount: number;
  unreadMessageCount: number;
  pendingInvitationCount: number;
}
