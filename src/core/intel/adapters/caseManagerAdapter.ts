/**
 * CaseManagerAdapter - Adapter for Case Manager integration with IntelDataCore
 * 
 * This adapter connects the Case Manager components to the IntelDataCore
 * by providing transformation and query functions for case records.
 */

import { 
  CaseRecord,
  CaseStatus,
  CasePriority,
  ClassificationLevel,
  IntelQueryOptions,
  CaseComment,
  Collaborator,
  CollaboratorRole,
  ActivityLogEntry,
  ActivityAction,
  CasePermissions
} from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { storageOrchestrator } from '../storage/storageOrchestrator';

// Types for Case Manager visualization
export interface CaseItem {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: string[];
  startDate: Date;
  dueDate?: Date;
  closedDate?: Date;
  relatedEntities: string[];
  relatedCases: string[];
  classification: ClassificationLevel;
  tags: string[];
  metadata: Record<string, any>;
  collaborators: Collaborator[];
  comments: CaseComment[];
  activityLog: ActivityLogEntry[];
  shareToken?: string;
  permissions: CasePermissions;
}

export interface CaseFilter {
  property: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'before' | 'after' | 'between';
  value: any;
}

export interface CaseStats {
  totalCases: number;
  openCases: number;
  closedCases: number;
  byStatus: Record<CaseStatus, number>;
  byPriority: Record<CasePriority, number>;
  avgTimeToClose: number; // in days
  recentActivity: {
    created: number;
    updated: number;
    closed: number;
  };
}

/**
 * Case Manager adapter class for IntelDataCore
 */
export class CaseManagerAdapter {
  private listeners: Array<{ unsubscribe: () => void }> = [];
  
  constructor() {
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Add listeners for entity events related to case records
    const caseCreatedListener = enhancedEventEmitter.on('entity:created', (event) => {
      if (event.entityType === 'case_record') {
        enhancedEventEmitter.emit('case:created', {
          caseId: event.entityId,
          case: this.transformCaseRecordToCaseItem(event.entity)
        });
      }
    });
    
    const caseUpdatedListener = enhancedEventEmitter.on('entity:updated', (event) => {
      if (event.entityType === 'case_record') {
        enhancedEventEmitter.emit('case:updated', {
          caseId: event.entityId,
          case: this.transformCaseRecordToCaseItem(event.entity),
          changes: event.changes
        });
      }
    });
    
    const caseDeletedListener = enhancedEventEmitter.on('entity:deleted', (event) => {
      if (event.entityType === 'case_record') {
        enhancedEventEmitter.emit('case:deleted', {
          caseId: event.entityId,
          case: this.transformCaseRecordToCaseItem(event.entity)
        });
      }
    });
    
    // Add listeners for collaboration events
    const collaboratorAddedListener = enhancedEventEmitter.on('case:collaborator:added', (event) => {
      enhancedEventEmitter.emit('case:updated', {
        caseId: event.caseId,
        case: event.case,
        changes: {
          collaborators: event.case.collaborators
        }
      });
    });
    
    const collaboratorRemovedListener = enhancedEventEmitter.on('case:collaborator:removed', (event) => {
      enhancedEventEmitter.emit('case:updated', {
        caseId: event.caseId,
        case: event.case,
        changes: {
          collaborators: event.case.collaborators
        }
      });
    });
    
    const commentAddedListener = enhancedEventEmitter.on('case:comment:added', (event) => {
      enhancedEventEmitter.emit('case:updated', {
        caseId: event.caseId,
        case: event.case,
        changes: {
          comments: event.case.comments
        }
      });
    });
    
    // Store all listener objects for cleanup
    this.listeners.push(caseCreatedListener);
    this.listeners.push(caseUpdatedListener);
    this.listeners.push(caseDeletedListener);
    this.listeners.push(collaboratorAddedListener);
    this.listeners.push(collaboratorRemovedListener);
    this.listeners.push(commentAddedListener);
  }
  
  /**
   * Cleanup event listeners
   */
  public dispose(): void {
    // Remove all event listeners
    this.listeners.forEach(listener => {
      listener.unsubscribe();
    });
    this.listeners = [];
  }
  /**
   * Fetch case data based on filters
   */
  async getCases(filters?: CaseFilter[]): Promise<CaseItem[]> {
    try {
      // Convert Case filters to Intel query options
      const queryOptions = this.createQueryOptions(filters);
      
      // Get case records
      const result = await intelDataStore.queryEntities<CaseRecord>(queryOptions);
      if (!result.success) {
        console.error('Error fetching cases:', result.error);
        return [];
      }
      
      const cases = result.data || [];
      
      // Transform cases to case items
      return cases.map(caseRecord => this.transformCaseRecordToCaseItem(caseRecord));
    } catch (error) {
      console.error('Error in getCases:', error);
      return [];
    }
  }
  
  /**
   * Get statistics about the cases
   */
  async getCaseStats(filters?: CaseFilter[]): Promise<CaseStats> {
    try {
      const cases = await this.getCases(filters);
      
      // Calculate stats
      const byStatus: Record<CaseStatus, number> = {
        [CaseStatus.NEW]: 0,
        [CaseStatus.OPEN]: 0,
        [CaseStatus.IN_PROGRESS]: 0,
        [CaseStatus.PENDING]: 0,
        [CaseStatus.RESOLVED]: 0,
        [CaseStatus.CLOSED]: 0
      };
      
      const byPriority: Record<CasePriority, number> = {
        [CasePriority.LOW]: 0,
        [CasePriority.MEDIUM]: 0,
        [CasePriority.HIGH]: 0,
        [CasePriority.CRITICAL]: 0
      };
      
      let closedCases = 0;
      let totalTimeToClose = 0;
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      let recentCreated = 0;
      let recentUpdated = 0;
      let recentClosed = 0;
      
      cases.forEach(caseItem => {
        // Count by status
        byStatus[caseItem.status] = (byStatus[caseItem.status] || 0) + 1;
        
        // Count by priority
        byPriority[caseItem.priority] = (byPriority[caseItem.priority] || 0) + 1;
        
        // Calculate time to close for closed cases
        if (caseItem.closedDate && caseItem.startDate) {
          closedCases++;
          const timeToClose = Math.max(0, 
            (new Date(caseItem.closedDate).getTime() - new Date(caseItem.startDate).getTime()) / 
            (1000 * 60 * 60 * 24)); // Convert to days
          totalTimeToClose += timeToClose;
        }
        
        // Recent activity
        const createdDate = new Date(caseItem.startDate);
        if (createdDate >= thirtyDaysAgo) {
          recentCreated++;
        }
        
        const updatedDate = new Date(caseItem.metadata.updatedAt || 0);
        if (updatedDate >= thirtyDaysAgo) {
          recentUpdated++;
        }
        
        if (caseItem.closedDate) {
          const closedDate = new Date(caseItem.closedDate);
          if (closedDate >= thirtyDaysAgo) {
            recentClosed++;
          }
        }
      });
      
      return {
        totalCases: cases.length,
        openCases: cases.length - (byStatus[CaseStatus.CLOSED] || 0),
        closedCases: byStatus[CaseStatus.CLOSED] || 0,
        byStatus,
        byPriority,
        avgTimeToClose: closedCases > 0 ? totalTimeToClose / closedCases : 0,
        recentActivity: {
          created: recentCreated,
          updated: recentUpdated,
          closed: recentClosed
        }
      };
    } catch (error) {
      console.error('Error in getCaseStats:', error);
      return {
        totalCases: 0,
        openCases: 0,
        closedCases: 0,
        byStatus: {} as Record<CaseStatus, number>,
        byPriority: {} as Record<CasePriority, number>,
        avgTimeToClose: 0,
        recentActivity: {
          created: 0,
          updated: 0,
          closed: 0
        }
      };
    }
  }
  
  /**
   * Get case by ID
   */
  async getCaseById(id: string): Promise<CaseItem | null> {
    try {
      const result = await intelDataStore.getEntity<CaseRecord>(id);
      if (!result.success || !result.data) {
        return null;
      }
      
      return this.transformCaseRecordToCaseItem(result.data);
    } catch (error) {
      console.error('Error in getCaseById:', error);
      return null;
    }
  }
  
  /**
   * Add a case
   */
  async addCase(caseData: Partial<CaseRecord>): Promise<string | null> {
    try {
      const result = await intelDataStore.createEntity<CaseRecord>({
        ...caseData,
        type: 'case_record'
      });
      return result.success ? result.data!.id : null;
    } catch (error) {
      console.error('Error adding case:', error);
      return null;
    }
  }
  
  /**
   * Update a case
   */
  async updateCase(id: string, updates: Partial<CaseRecord>): Promise<boolean> {
    try {
      const result = await intelDataStore.updateEntity<CaseRecord>(id, updates);
      return result.success;
    } catch (error) {
      console.error('Error updating case:', error);
      return false;
    }
  }
  
  /**
   * Delete a case
   */
  async deleteCase(id: string): Promise<boolean> {
    try {
      const result = await intelDataStore.deleteEntity(id);
      return result.success;
    } catch (error) {
      console.error('Error deleting case:', error);
      return false;
    }
  }
  
  /**
   * Link entities to a case
   */
  async linkEntitiesToCase(caseId: string, entityIds: string[]): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentRelatedEntities = new Set(caseRecord.relatedEntities || []);
      
      // Add new entity IDs (avoiding duplicates)
      entityIds.forEach(id => currentRelatedEntities.add(id));
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        relatedEntities: Array.from(currentRelatedEntities)
      });
      
      return updateResult.success;
    } catch (error) {
      console.error('Error linking entities to case:', error);
      return false;
    }
  }
  
  /**
   * Link cases (create relationship between cases)
   */
  async linkCases(sourceCaseId: string, targetCaseIds: string[]): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(sourceCaseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentRelatedCases = new Set(caseRecord.relatedCases || []);
      
      // Add new case IDs (avoiding duplicates)
      targetCaseIds.forEach(id => currentRelatedCases.add(id));
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(sourceCaseId, {
        relatedCases: Array.from(currentRelatedCases)
      });
      
      return updateResult.success;
    } catch (error) {
      console.error('Error linking cases:', error);
      return false;
    }
  }
  
  /**
   * Transform a CaseRecord to CaseItem format
   */
  private transformCaseRecordToCaseItem(caseRecord: CaseRecord): CaseItem {
    return {
      id: caseRecord.id,
      caseNumber: caseRecord.caseNumber,
      title: caseRecord.title,
      description: caseRecord.description,
      status: caseRecord.status,
      priority: caseRecord.priority,
      assignedTo: caseRecord.assignedTo || [],
      startDate: new Date(caseRecord.startDate),
      dueDate: caseRecord.dueDate ? new Date(caseRecord.dueDate) : undefined,
      closedDate: caseRecord.closedDate ? new Date(caseRecord.closedDate) : undefined,
      relatedEntities: caseRecord.relatedEntities || [],
      relatedCases: caseRecord.relatedCases || [],
      classification: caseRecord.classification,
      tags: caseRecord.tags || [],
      metadata: caseRecord.metadata || {},
      collaborators: caseRecord.collaborators || [],
      comments: caseRecord.comments || [],
      activityLog: caseRecord.activityLog || [],
      shareToken: caseRecord.shareToken,
      permissions: caseRecord.permissions || {
        isPublic: false,
        canComment: [],
        canEdit: [],
        canDelete: [],
        canShare: [],
        canAssign: [],
        externalSharing: false
      }
    };
  }
  
  /**
   * Convert Case filters to IntelDataCore query options
   */
  private createQueryOptions(filters?: CaseFilter[]): IntelQueryOptions {
    const options: IntelQueryOptions = {
      types: ['case_record'], // Only get case records
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    };
    
    if (!filters || filters.length === 0) {
      return options;
    }
    
    // Convert filters to query filters
    const queryFilters: Record<string, any> = {};
    
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'equals':
          queryFilters[filter.property] = filter.value;
          break;
        case 'contains':
          queryFilters[`${filter.property}_contains`] = filter.value;
          break;
        case 'startsWith':
          queryFilters[`${filter.property}_startsWith`] = filter.value;
          break;
        case 'endsWith':
          queryFilters[`${filter.property}_endsWith`] = filter.value;
          break;
        case 'before':
          queryFilters[`${filter.property}_lt`] = filter.value;
          break;
        case 'after':
          queryFilters[`${filter.property}_gt`] = filter.value;
          break;
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length >= 2) {
            queryFilters[`${filter.property}_gt`] = filter.value[0];
            queryFilters[`${filter.property}_lt`] = filter.value[1];
          }
          break;
      }
    });
    
    options.filters = queryFilters;
    return options;
  }
  
  /**
   * Add a collaborator to a case
   */
  async addCollaborator(caseId: string, collaborator: Omit<Collaborator, 'addedAt'>): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentCollaborators = Array.isArray(caseRecord.collaborators) 
        ? [...caseRecord.collaborators] 
        : [];
      
      // Check if collaborator already exists
      const existingIndex = currentCollaborators.findIndex(c => c.userId === collaborator.userId);
      if (existingIndex !== -1) {
        // Update existing collaborator
        currentCollaborators[existingIndex] = {
          ...currentCollaborators[existingIndex],
          ...collaborator,
          addedAt: currentCollaborators[existingIndex].addedAt
        };
      } else {
        // Add new collaborator
        currentCollaborators.push({
          ...collaborator,
          addedAt: new Date().toISOString()
        });
      }
      
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.COLLABORATOR_ADDED,
        timestamp: new Date().toISOString(),
        userId: collaborator.addedBy,
        details: {
          collaboratorId: collaborator.userId,
          collaboratorName: collaborator.name,
          role: collaborator.role
        }
      };
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseRecord.activityLog) 
        ? [...caseRecord.activityLog] 
        : [];
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        collaborators: currentCollaborators,
        activityLog: [...currentActivityLog, activityEntry]
      });
      
      if (updateResult.success) {
        // Get the updated case for the event
        const updatedCase = await this.getCaseById(caseId);
        if (updatedCase) {
          enhancedEventEmitter.emit('case:collaborator:added', {
            caseId,
            case: updatedCase,
            collaborator: collaborator
          });
        }
      }
      
      return updateResult.success;
    } catch (error) {
      console.error('Error adding collaborator to case:', error);
      return false;
    }
  }
  
  /**
   * Remove a collaborator from a case
   */
  async removeCollaborator(caseId: string, userId: string, removedBy: string): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentCollaborators = Array.isArray(caseRecord.collaborators) 
        ? [...caseRecord.collaborators] 
        : [];
      
      // Find collaborator to remove
      const collaboratorToRemove = currentCollaborators.find(c => c.userId === userId);
      if (!collaboratorToRemove) {
        return false; // Collaborator not found
      }
      
      // Filter out the collaborator
      const updatedCollaborators = currentCollaborators.filter(c => c.userId !== userId);
      
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.COLLABORATOR_REMOVED,
        timestamp: new Date().toISOString(),
        userId: removedBy,
        details: {
          collaboratorId: userId,
          collaboratorName: collaboratorToRemove.name,
          role: collaboratorToRemove.role
        }
      };
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseRecord.activityLog) 
        ? [...caseRecord.activityLog] 
        : [];
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        collaborators: updatedCollaborators,
        activityLog: [...currentActivityLog, activityEntry]
      });
      
      if (updateResult.success) {
        // Get the updated case for the event
        const updatedCase = await this.getCaseById(caseId);
        if (updatedCase) {
          enhancedEventEmitter.emit('case:collaborator:removed', {
            caseId,
            case: updatedCase,
            collaboratorId: userId
          });
        }
      }
      
      return updateResult.success;
    } catch (error) {
      console.error('Error removing collaborator from case:', error);
      return false;
    }
  }
  
  /**
   * Add a comment to a case
   */
  async addComment(caseId: string, comment: Omit<CaseComment, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return null;
      }
      
      const caseRecord = caseResult.data;
      const currentComments = Array.isArray(caseRecord.comments) 
        ? [...caseRecord.comments] 
        : [];
      
      // Create new comment
      const newComment: CaseComment = {
        ...comment,
        id: `${caseId}_comment_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.COMMENTED,
        timestamp: new Date().toISOString(),
        userId: comment.createdBy,
        details: {
          commentId: newComment.id,
          mentions: comment.mentions || []
        }
      };
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseRecord.activityLog) 
        ? [...caseRecord.activityLog] 
        : [];
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        comments: [...currentComments, newComment],
        activityLog: [...currentActivityLog, activityEntry]
      });
      
      if (updateResult.success) {
        // Get the updated case for the event
        const updatedCase = await this.getCaseById(caseId);
        if (updatedCase) {
          enhancedEventEmitter.emit('case:comment:added', {
            caseId,
            case: updatedCase,
            comment: newComment
          });
        }
        
        return newComment.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding comment to case:', error);
      return null;
    }
  }
  
  /**
   * Update a comment in a case
   */
  async updateComment(caseId: string, commentId: string, updates: Partial<Omit<CaseComment, 'id' | 'createdAt' | 'createdBy'>>): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentComments = Array.isArray(caseRecord.comments) 
        ? [...caseRecord.comments] 
        : [];
      
      // Find comment to update
      const commentIndex = currentComments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        return false; // Comment not found
      }
      
      // Update comment
      const updatedComment = {
        ...currentComments[commentIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      currentComments[commentIndex] = updatedComment;
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        comments: currentComments
      });
      
      if (updateResult.success) {
        // Get the updated case for the event
        const updatedCase = await this.getCaseById(caseId);
        if (updatedCase) {
          enhancedEventEmitter.emit('case:comment:updated', {
            caseId,
            case: updatedCase,
            commentId: commentId
          });
        }
      }
      
      return updateResult.success;
    } catch (error) {
      console.error('Error updating comment in case:', error);
      return false;
    }
  }
  
  /**
   * Delete a comment from a case
   */
  async deleteComment(caseId: string, commentId: string, deletedBy: string): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentComments = Array.isArray(caseRecord.comments) 
        ? [...caseRecord.comments] 
        : [];
      
      // Find comment to delete
      const commentToDelete = currentComments.find(c => c.id === commentId);
      if (!commentToDelete) {
        return false; // Comment not found
      }
      
      // Filter out the comment
      const updatedComments = currentComments.filter(c => c.id !== commentId);
      
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.COMMENTED,
        timestamp: new Date().toISOString(),
        userId: deletedBy,
        details: {
          action: 'deleted',
          commentId: commentId
        }
      };
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseRecord.activityLog) 
        ? [...caseRecord.activityLog] 
        : [];
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        comments: updatedComments,
        activityLog: [...currentActivityLog, activityEntry]
      });
      
      if (updateResult.success) {
        // Get the updated case for the event
        const updatedCase = await this.getCaseById(caseId);
        if (updatedCase) {
          enhancedEventEmitter.emit('case:comment:deleted', {
            caseId,
            case: updatedCase,
            commentId: commentId
          });
        }
      }
      
      return updateResult.success;
    } catch (error) {
      console.error('Error deleting comment from case:', error);
      return false;
    }
  }
  
  /**
   * Update case permissions
   */
  async updatePermissions(caseId: string, permissions: Partial<CasePermissions>, updatedBy: string): Promise<boolean> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      const caseRecord = caseResult.data;
      const currentPermissions = caseRecord.permissions || {
        isPublic: false,
        canComment: [],
        canEdit: [],
        canDelete: [],
        canShare: [],
        canAssign: [],
        externalSharing: false
      };
      
      // Update permissions
      const updatedPermissions = {
        ...currentPermissions,
        ...permissions
      };
      
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.UPDATED,
        timestamp: new Date().toISOString(),
        userId: updatedBy,
        details: {
          field: 'permissions',
          newValue: updatedPermissions
        }
      };
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseRecord.activityLog) 
        ? [...caseRecord.activityLog] 
        : [];
      
      // Update the case
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        permissions: updatedPermissions,
        activityLog: [...currentActivityLog, activityEntry]
      });
      
      if (updateResult.success) {
        // Get the updated case for the event
        const updatedCase = await this.getCaseById(caseId);
        if (updatedCase) {
          enhancedEventEmitter.emit('case:permissions:updated', {
            caseId,
            case: updatedCase,
            permissions: updatedPermissions
          });
        }
      }
      
      return updateResult.success;
    } catch (error) {
      console.error('Error updating case permissions:', error);
      return false;
    }
  }
  
  /**
   * Generate a sharing token for external access
   */
  async generateSharingToken(caseId: string, generatedBy: string, expiresInHours: number = 24): Promise<string | null> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return null;
      }
      
      // Generate a random token
      const randomToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      
      // Create a token with expiration timestamp
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + expiresInHours);
      
      const shareToken = `${randomToken}_${expirationDate.getTime()}`;
      
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.SHARED,
        timestamp: new Date().toISOString(),
        userId: generatedBy,
        details: {
          expiresAt: expirationDate.toISOString()
        }
      };
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseResult.data.activityLog) 
        ? [...caseResult.data.activityLog] 
        : [];
      
      // Update case with new token
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        shareToken,
        activityLog: [...currentActivityLog, activityEntry],
        metadata: {
          ...caseResult.data.metadata,
          shareTokenExpiration: expirationDate.toISOString()
        }
      });
      
      return updateResult.success ? shareToken : null;
    } catch (error) {
      console.error('Error generating sharing token:', error);
      return null;
    }
  }
  
  /**
   * Revoke the sharing token
   */
  async revokeSharingToken(caseId: string, revokedBy: string): Promise<boolean> {
    try {
      // Create activity log entry
      const activityEntry: ActivityLogEntry = {
        id: `${caseId}_activity_${Date.now()}`,
        action: ActivityAction.UPDATED,
        timestamp: new Date().toISOString(),
        userId: revokedBy,
        details: {
          field: 'shareToken',
          action: 'revoked'
        }
      };
      
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return false;
      }
      
      // Get current activity log
      const currentActivityLog = Array.isArray(caseResult.data.activityLog) 
        ? [...caseResult.data.activityLog] 
        : [];
      
      // Update case to remove token
      const updateResult = await intelDataStore.updateEntity<CaseRecord>(caseId, {
        shareToken: undefined,
        activityLog: [...currentActivityLog, activityEntry],
        metadata: {
          ...caseResult.data.metadata,
          shareTokenExpiration: undefined
        }
      });
      
      return updateResult.success;
    } catch (error) {
      console.error('Error revoking sharing token:', error);
      return false;
    }
  }
  
  /**
   * Get case activity log
   */
  async getActivityLog(caseId: string): Promise<ActivityLogEntry[]> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return [];
      }
      
      return caseResult.data.activityLog || [];
    } catch (error) {
      console.error('Error getting case activity log:', error);
      return [];
    }
  }
  
  /**
   * Get case comments
   */
  async getComments(caseId: string): Promise<CaseComment[]> {
    try {
      const caseResult = await intelDataStore.getEntity<CaseRecord>(caseId);
      if (!caseResult.success || !caseResult.data) {
        return [];
      }
      
      return caseResult.data.comments || [];
    } catch (error) {
      console.error('Error getting case comments:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const caseManagerAdapter = new CaseManagerAdapter();
