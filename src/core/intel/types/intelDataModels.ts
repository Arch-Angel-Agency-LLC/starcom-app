/**
 * IntelDataCore - Core Data Models
 * 
 * This file contains the core data models for the IntelDataCore system.
 * It defines the fundamental types used across all intelligence modules.
 */

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
  metadata: Record<string, any>;
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
  metadata: Record<string, any>;
  confidence: number; // 0-100 scale indicating confidence in the relationship
  tags: string[];
}

// --- Intelligence Entities ---

/**
 * Core Intelligence Entity - the foundation of the intelligence data model
 */
export interface IntelEntity extends BaseEntity {
  title: string;
  description: string;
  classification: ClassificationLevel;
  source: string;
  sourceUrl?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  confidence: number; // 0-100 scale
  expiresAt?: string;
  attachments: Attachment[];
}

/**
 * Intelligence Node - specialized entity for graph/network visualization
 */
export interface NodeEntity extends IntelEntity {
  nodeType: NodeType;
  properties: Record<string, any>; // Additional type-specific properties
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
  details: Record<string, any>;
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
  metadata: Record<string, any>;
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
  filters?: Record<string, any>;
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
  filters?: Record<string, any>;
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
  data: any;
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
