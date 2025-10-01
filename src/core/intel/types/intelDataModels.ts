/**
 * IntelDataCore - Core Data Models
 * 
 * This file contains the core data models for the IntelDataCore system.
 * It defines the fundamental types used across all intelligence modules.
 */

// Import new Intel architecture types for enhanced integration
import { ReliabilityRating } from '../../../models/Intel/Intel';

// --- Base Types ---

/**
 * Base entity interface that all intelligence entities extend from
 */
export interface BaseEntity {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata: Record<string, unknown>;
  tags: string[];
}

/**
 * Base relationship interface for connecting entities
 */
export interface Relationship {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata: Record<string, unknown>;
  confidence: number; // 0-100 scale indicating confidence in the relationship
  tags: string[];
}

// --- Intelligence Entities ---

/**
 * Core Intelligence Entity - the foundation of the intelligence data model
 * Enhanced to support new Intel architecture integration
 */
export interface IntelEntity extends BaseEntity {
  // === EXISTING PROPERTIES (100% Backward Compatible) ===
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  confidence: number; // 0-100 scale
  expiresAt?: string;
  attachments: Attachment[];
  
  // === NEW INTEL ARCHITECTURE INTEGRATION ===
  // Optional properties for enhanced processing - all backward compatible
  
  /** Link to source Intelligence objects from new architecture */
  sourceIntelligence?: string[]; // Intelligence IDs that contributed to this entity
  
  /** Link to raw data sources from new architecture */
  derivedFromRawData?: string[]; // RawData IDs this entity was derived from
  
  /** Reliability assessment from new architecture */
  reliability?: ReliabilityRating; // A, B, C, D, E, F reliability scale
  
  /** Processing lineage for audit trail */
  processingLineage?: {
    steps: Array<{
      stage: 'collection' | 'processing' | 'analysis' | 'visualization';
      timestamp: number;
      processor: string;
      transformationType: string;
      sourceIds: string[];
      confidence: number;
    }>;
    totalSteps: number;
    processingDuration: number;
    qualityScore: number;
  };
  
  /** Enhanced confidence metrics with breakdown */
  confidenceMetrics?: {
    extraction: number;    // Confidence in data extraction (0-100)
    correlation: number;   // Confidence in correlation with other data (0-100)
    analysis: number;      // Confidence in analytical conclusions (0-100)
    validation: number;    // Confidence in validation/verification (0-100)
    overall: number;       // Overall confidence (computed from above)
  };
  
  /** OSINT-specific metadata for NetRunner integration */
  osintMetadata?: {
    collectionMethod: string;     // How this data was collected
    collectionTimestamp: number; // When it was collected
    lastVerified: number;        // Last verification timestamp
    verificationMethod?: string; // How it was verified
    qualityIndicators: {
      freshness: number;         // How recent the data is (0-100)
      completeness: number;      // How complete the data is (0-100)
      accuracy: number;          // Assessed accuracy (0-100)
      relevance: number;         // Relevance to investigation (0-100)
    };
  };
  
  /** Bridge metadata for tracking transformations */
  bridgeMetadata?: {
    originalIntelId?: string;      // Original Intel object ID
    transformationId: string;     // Unique transformation identifier
    transformedAt: number;        // When transformation occurred
    transformationVersion: string; // Version of transformation logic
    preservedFields: string[];    // Which fields were preserved
    enhancedFields: string[];     // Which fields were enhanced
    qualityScore: number;         // Quality of transformation (0-100)
  };
}

/**
 * Intelligence Node - specialized entity for graph/network visualization
 */
export interface NodeEntity extends IntelEntity {
  nodeType: NodeType;
  properties: Record<string, unknown>; // Additional type-specific properties
  coordinates?: {
    latitude?: number;
    longitude?: number;
    x?: number;
    y?: number;
    z?: number;
  };
  displayOptions?: {
    size?: number;
    color?: string;
    icon?: string;
    shape?: string;
    label?: string;
    visible?: boolean;
  };
}

/**
 * Intelligence Edge - specialized relationship for graph/network visualization
 */
export interface EdgeRelationship extends Relationship {
  strength: number; // 0-100 scale indicating strength of connection
  direction: 'unidirectional' | 'bidirectional';
  timeframe?: {
    startDate?: string;
    endDate?: string;
    isEstimated?: boolean;
  };
  displayOptions?: {
    width?: number;
    color?: string;
    style?: 'solid' | 'dashed' | 'dotted';
    label?: string;
    visible?: boolean;
  };
}

/**
 * Timeline Event - specialized entity for timeline visualization
 */
export interface TimelineEvent extends IntelEntity {
  eventType: EventType;
  startDate: string;
  endDate?: string;
  isEstimated: boolean;
  location?: {
    description?: string;
    latitude?: number;
    longitude?: number;
  };
  relatedEntities: string[]; // IDs of related entities
  importance: number; // 0-100 scale
}

/**
 * Case Record - specialized entity for case management
 */
export interface CaseRecord extends BaseEntity {
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: string[];
  startDate: string;
  dueDate?: string;
  closedDate?: string;
  relatedEntities: string[]; // IDs of related intel entities
  relatedCases: string[]; // IDs of related cases
  classification: ClassificationLevel;
  tags: string[];
  // Collaboration features
  collaborators: Collaborator[];
  comments: CaseComment[];
  activityLog: ActivityLogEntry[];
  shareToken?: string; // Token for external sharing
  permissions: CasePermissions; // Access control settings
}

/**
 * Collaborator on a case
 */
export interface Collaborator {
  userId: string;
  name: string;
  role: CollaboratorRole;
  addedAt: string;
  addedBy: string;
  lastActive?: string;
}

/**
 * Comment on a case
 */
export interface CaseComment {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  parentId?: string; // For threaded comments
  mentions: string[]; // User IDs mentioned in the comment
  attachments: Attachment[];
}

/**
 * Activity log entry for case tracking
 */
export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  timestamp: string;
  userId: string;
  details: Record<string, unknown>;
  entityId?: string; // ID of related entity if applicable
}

/**
 * Case permissions for access control
 */
export interface CasePermissions {
  isPublic: boolean; // Whether case is visible to all system users
  canComment: string[]; // User IDs that can comment
  canEdit: string[]; // User IDs that can edit
  canDelete: string[]; // User IDs that can delete
  canShare: string[]; // User IDs that can share
  canAssign: string[]; // User IDs that can assign users
  externalSharing: boolean; // Whether case can be shared externally
}

/**
 * Collaborator roles for case management
 */
export enum CollaboratorRole {
  VIEWER = 'VIEWER',
  COMMENTER = 'COMMENTER',
  EDITOR = 'EDITOR',
  MANAGER = 'MANAGER',
  OWNER = 'OWNER'
}

/**
 * Activity actions for tracking case history
 */
export enum ActivityAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  COMMENTED = 'COMMENTED',
  ASSIGNED = 'ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ENTITY_LINKED = 'ENTITY_LINKED',
  ENTITY_UNLINKED = 'ENTITY_UNLINKED',
  CASE_LINKED = 'CASE_LINKED',
  CASE_UNLINKED = 'CASE_UNLINKED',
  COLLABORATOR_ADDED = 'COLLABORATOR_ADDED',
  COLLABORATOR_REMOVED = 'COLLABORATOR_REMOVED',
  SHARED = 'SHARED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED'
}

// --- Enums ---

/**
 * Classification levels for intelligence data
 */
export enum ClassificationLevel {
  UNCLASSIFIED = 'UNCLASSIFIED',
  SENSITIVE = 'SENSITIVE',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SECRET = 'SECRET',
  TOP_SECRET = 'TOP_SECRET'
}

/**
 * Node types for intelligence graph entities
 */
export enum NodeType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  IP_ADDRESS = 'IP_ADDRESS',
  DOMAIN = 'DOMAIN',
  FILE = 'FILE',
  MALWARE = 'MALWARE',
  THREAT_ACTOR = 'THREAT_ACTOR',
  SYSTEM = 'SYSTEM',
  VULNERABILITY = 'VULNERABILITY',
  CUSTOM = 'CUSTOM'
}

/**
 * Event types for timeline events
 */
export enum EventType {
  INCIDENT = 'INCIDENT',
  ATTACK = 'ATTACK',
  DETECTION = 'DETECTION',
  COMMUNICATION = 'COMMUNICATION',
  ACCESS = 'ACCESS',
  MODIFICATION = 'MODIFICATION',
  CREATION = 'CREATION',
  DELETION = 'DELETION',
  RECONNAISSANCE = 'RECONNAISSANCE',
  EXFILTRATION = 'EXFILTRATION',
  MITIGATION = 'MITIGATION',
  CUSTOM = 'CUSTOM'
}

/**
 * Case status values
 */
export enum CaseStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

/**
 * Case priority levels
 */
export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// --- Supporting Types ---

/**
 * Attachment type for intelligence entities
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: Blob;
  thumbnailUrl?: string;
  createdAt: string;
  uploadedBy: string;
  metadata: Record<string, unknown>;
}

/**
 * Query options for fetching intel entities
 */
export interface IntelQueryOptions {
  types?: string[];
  tags?: string[];
  classification?: ClassificationLevel[];
  startDate?: string;
  endDate?: string;
  confidence?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  includeRelationships?: boolean;
  relationshipDepth?: number;
  pagination?: {
    page: number;
    pageSize: number;
  };
  persistenceMode?: 'immediate' | 'delayed' | 'none';
  forceRefresh?: boolean;
}

/**
 * Event subscription for real-time updates
 */
export interface EventSubscription {
  id: string;
  topics: string[];
  callback: (event: DataEvent) => void;
  filters?: Record<string, unknown>;
}

/**
 * Data event for real-time updates
 */
export interface DataEvent {
  id: string;
  type: 'create' | 'update' | 'delete' | 'relation';
  topic: string;
  timestamp: string;
  entityId: string;
  entityType: string;
  data: unknown;
  source: string;
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Persistence options for storage operations
 */
export interface PersistenceOptions {
  encrypt?: boolean;
  compression?: boolean;
  priority?: 'high' | 'normal' | 'low';
  expiry?: string; // ISO date string
  syncStrategy?: 'immediate' | 'background' | 'manual';
  storageTarget?: 'indexeddb' | 'ipfs' | 'blockchain' | 'file';
  persistenceMode?: 'all' | 'none' | 'blockchain' | 'ipfs' | 'indexeddb';
  forceRefresh?: boolean;
}
