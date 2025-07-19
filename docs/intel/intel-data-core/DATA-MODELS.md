# IntelDataCore Data Models

## Overview

This document details the data models that form the foundation of the IntelDataCore system. These models are designed to provide a standardized, extensible, and interoperable way to represent intelligence data across all STARCOM modules. The data models follow TypeScript interfaces to ensure type safety and consistency throughout the application.

> **Implementation Status:** The core data models have been implemented in `/src/core/intel/types/intelDataModels.ts`

## Core Design Principles

1. **Extensibility**: Base models that can be extended for specialized use cases
2. **Normalization**: Avoiding redundancy while maintaining relationships
3. **Validation**: Clear constraints and validation rules
4. **Semantic Clarity**: Meaningful property names and relationships
5. **Interoperability**: Consistent structure across all modules
6. **Serialization**: Clean JSON representation for storage and transmission
7. **Type Safety**: Comprehensive TypeScript type definitions

## Base Types

### `BaseEntity` Interface

```typescript
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
```

### `Relationship` Interface

```typescript
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
```

## Intelligence Entities

### `IntelEntity` Interface

```typescript
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
```

### `NodeEntity` Interface

```typescript
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
```

### `EdgeRelationship` Interface

```typescript
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
```

### `TimelineEvent` Interface

```typescript
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
```

### `CaseRecord` Interface

```typescript
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
}
```

## Enums and Supporting Types

### Classification Levels

```typescript
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
```

### Node Types

```typescript
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
```

### Event Types

```typescript
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
```

### Case Status and Priority

```typescript
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
```

### Attachment

```typescript
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
```

## Query and Event Models

### Query Options

```typescript
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
}
```

### Event Subscription

```typescript
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
```

## Implementation Details

The data models have been implemented in TypeScript and are available in the following files:

- `/src/core/intel/types/intelDataModels.ts` - Core data model definitions
- `/src/core/intel/store/intelDataStore.ts` - In-memory storage implementation
- `/src/core/intel/adapters/nodeWebAdapter.ts` - Adapter for Node Web visualization
- `/src/core/intel/hooks/useNodeWebData.ts` - React hook for Node Web integration

## Next Steps

1. Implement Timeline and Case Manager adapters
2. Add validation for model properties
3. Create data migration utilities for legacy data
4. Enhance relationship query capabilities
5. Add full-text search support

## Appendix: Data Model Diagram

```
BaseEntity
├── IntelEntity
│   ├── NodeEntity
│   └── TimelineEvent
└── CaseRecord

Relationship
└── EdgeRelationship
```

---

Last Updated: July 7, 2025
