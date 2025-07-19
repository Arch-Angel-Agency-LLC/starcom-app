// Collection Tasking and Requirements Management
// Extended intelligence collection tasking capabilities

import { PrimaryIntelSource, CollectionMethod } from './Sources';
import { ClassificationLevel } from './Classification';
import { CollectionPriority } from './Requirements';

/**
 * Extended tasking priority levels for operational environments
 */
export type TaskingPriority = 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH';

/**
 * Tasking status lifecycle
 */
export type TaskingStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

/**
 * Geographic scope for collection operations
 */
export interface GeographicScope {
  region: string;
  country?: string;
  coordinates?: { lat: number; lon: number; };
  radius?: number; // kilometers
}

/**
 * Collection Tasking Order
 * Formal structure for intelligence collection assignments
 */
export interface CollectionTasking {
  taskingId: string;
  priority: TaskingPriority;
  deadline: number; // timestamp
  requestingOrganization: string;
  specificRequirements: string[];
  collectionMethod: CollectionMethod[];
  geographicScope?: GeographicScope;
  targetEntities?: string[];
  successCriteria: string[];
  resourcesRequired: string[];
  status: TaskingStatus;
  assignedCollectors: string[];
  created: number;
  lastUpdated: number;
}

/**
 * Extended Intel Requirement with operational tasking
 */
export interface ExtendedIntelRequirement {
  id: string;
  priority: CollectionPriority;
  description: string;
  targetLocation?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
  deadline?: number; // timestamp
  requiredSources: PrimaryIntelSource[];
  classification: ClassificationLevel;
  requestedBy: string;
  
  // Extended tasking fields
  tasking?: CollectionTasking;
  operationalContext?: string;
  missionCriticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedCost?: number;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Collection Assignment
 * Links requirements to specific collection assets
 */
export interface CollectionAssignment {
  assignmentId: string;
  requirementId: string;
  taskingId: string;
  collectorId: string;
  assignedAt: number;
  estimatedCompletion: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  notes?: string;
}
