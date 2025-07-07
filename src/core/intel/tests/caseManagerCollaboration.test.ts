/**
 * Tests for CaseManagerAdapter collaboration features
 * 
 * This file contains unit tests for the collaboration features
 * of the CaseManagerAdapter, including collaborator management,
 * comments, permissions, and sharing functionality.
 */

import { caseManagerAdapter } from '../adapters/caseManagerAdapter';
import { intelDataStore } from '../store/intelDataStore';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { 
  CaseRecord, 
  CaseStatus, 
  CasePriority, 
  ClassificationLevel,
  CollaboratorRole
} from '../types/intelDataModels';

// Mock the intelDataStore
jest.mock('../store/intelDataStore', () => ({
  intelDataStore: {
    getEntity: jest.fn(),
    updateEntity: jest.fn(),
    queryEntities: jest.fn(),
    createEntity: jest.fn(),
    deleteEntity: jest.fn()
  }
}));

// Mock the enhancedEventEmitter
jest.mock('../events/enhancedEventEmitter', () => ({
  enhancedEventEmitter: {
    on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    off: jest.fn(),
    emit: jest.fn()
  }
}));

describe('CaseManagerAdapter - Collaboration Features', () => {
  let mockCaseRecord: CaseRecord;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up a mock case record
    mockCaseRecord = {
      id: 'case-123',
      type: 'case_record',
      caseNumber: 'SC-2025-0001',
      title: 'Test Case',
      description: 'This is a test case for collaboration features',
      status: CaseStatus.OPEN,
      priority: CasePriority.MEDIUM,
      assignedTo: ['user-001', 'user-002'],
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-001',
      relatedEntities: [],
      relatedCases: [],
      classification: ClassificationLevel.CONFIDENTIAL,
      tags: ['test', 'collaboration'],
      metadata: {},
      collaborators: [],
      comments: [],
      activityLog: [],
      permissions: {
        isPublic: false,
        canComment: ['user-001', 'user-002'],
        canEdit: ['user-001'],
        canDelete: ['user-001'],
        canShare: ['user-001'],
        canAssign: ['user-001'],
        externalSharing: true
      }
    };
    
    // Set up mock implementation for getEntity
    (intelDataStore.getEntity as jest.Mock).mockImplementation((id) => {
      if (id === 'case-123') {
        return Promise.resolve({
          success: true,
          data: mockCaseRecord
        });
      }
      return Promise.resolve({
        success: false,
        error: 'Case not found'
      });
    });
    
    // Set up mock implementation for updateEntity
    (intelDataStore.updateEntity as jest.Mock).mockImplementation((id, updates) => {
      if (id === 'case-123') {
        mockCaseRecord = { ...mockCaseRecord, ...updates };
        return Promise.resolve({
          success: true,
          data: mockCaseRecord
        });
      }
      return Promise.resolve({
        success: false,
        error: 'Update failed'
      });
    });
  });
  
  describe('Collaborator Management', () => {
    it('should add a collaborator to a case', async () => {
      const collaborator = {
        userId: 'user-003',
        name: 'Test User',
        role: CollaboratorRole.EDITOR,
        addedBy: 'user-001'
      };
      
      const result = await caseManagerAdapter.addCollaborator('case-123', collaborator);
      
      expect(result).toBe(true);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the collaborator was added
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].collaborators.length).toBe(1);
      expect(updateCall[1].collaborators[0].userId).toBe('user-003');
      expect(updateCall[1].collaborators[0].role).toBe(CollaboratorRole.EDITOR);
      
      // Verify that an activity log entry was created
      expect(updateCall[1].activityLog.length).toBe(1);
      expect(updateCall[1].activityLog[0].action).toBe('COLLABORATOR_ADDED');
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:collaborator:added', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
    
    it('should remove a collaborator from a case', async () => {
      // First, add a collaborator
      const collaborator = {
        userId: 'user-003',
        name: 'Test User',
        role: CollaboratorRole.EDITOR,
        addedBy: 'user-001'
      };
      
      await caseManagerAdapter.addCollaborator('case-123', collaborator);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Now remove the collaborator
      const result = await caseManagerAdapter.removeCollaborator('case-123', 'user-003', 'user-001');
      
      expect(result).toBe(true);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the collaborator was removed
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].collaborators.length).toBe(0);
      
      // Verify that an activity log entry was created
      expect(updateCall[1].activityLog.length).toBe(1);
      expect(updateCall[1].activityLog[0].action).toBe('COLLABORATOR_REMOVED');
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:collaborator:removed', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
  });
  
  describe('Comment Management', () => {
    it('should add a comment to a case', async () => {
      const comment = {
        content: 'This is a test comment',
        createdBy: 'user-001',
        mentions: ['user-002'],
        attachments: []
      };
      
      const result = await caseManagerAdapter.addComment('case-123', comment);
      
      expect(result).not.toBeNull();
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the comment was added
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].comments.length).toBe(1);
      expect(updateCall[1].comments[0].content).toBe('This is a test comment');
      
      // Verify that an activity log entry was created
      expect(updateCall[1].activityLog.length).toBe(1);
      expect(updateCall[1].activityLog[0].action).toBe('COMMENTED');
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:comment:added', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
    
    it('should update a comment on a case', async () => {
      // First, add a comment
      const comment = {
        content: 'This is a test comment',
        createdBy: 'user-001',
        mentions: ['user-002'],
        attachments: []
      };
      
      const commentId = await caseManagerAdapter.addComment('case-123', comment);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Now update the comment
      const updates = {
        content: 'This is an updated comment',
        mentions: ['user-002', 'user-003']
      };
      
      const result = await caseManagerAdapter.updateComment('case-123', commentId!, updates);
      
      expect(result).toBe(true);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the comment was updated
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].comments.length).toBe(1);
      expect(updateCall[1].comments[0].content).toBe('This is an updated comment');
      expect(updateCall[1].comments[0].mentions).toEqual(['user-002', 'user-003']);
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:updated', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
    
    it('should delete a comment from a case', async () => {
      // First, add a comment
      const comment = {
        content: 'This is a test comment',
        createdBy: 'user-001',
        mentions: ['user-002'],
        attachments: []
      };
      
      const commentId = await caseManagerAdapter.addComment('case-123', comment);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Now delete the comment
      const result = await caseManagerAdapter.deleteComment('case-123', commentId!, 'user-001');
      
      expect(result).toBe(true);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the comment was deleted
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].comments.length).toBe(0);
      
      // Verify that an activity log entry was created
      expect(updateCall[1].activityLog.length).toBe(1);
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:updated', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
  });
  
  describe('Permissions and Sharing', () => {
    it('should update case permissions', async () => {
      const permissions = {
        isPublic: true,
        canComment: ['user-001', 'user-002', 'user-003'],
        canEdit: ['user-001', 'user-002']
      };
      
      const result = await caseManagerAdapter.updatePermissions('case-123', permissions, 'user-001');
      
      expect(result).toBe(true);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the permissions were updated
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].permissions.isPublic).toBe(true);
      expect(updateCall[1].permissions.canComment).toEqual(['user-001', 'user-002', 'user-003']);
      expect(updateCall[1].permissions.canEdit).toEqual(['user-001', 'user-002']);
      
      // Verify that an activity log entry was created
      expect(updateCall[1].activityLog.length).toBe(1);
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:updated', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
    
    it('should generate a sharing token', async () => {
      const result = await caseManagerAdapter.generateSharingToken('case-123', 'user-001', 48);
      
      expect(result).not.toBeNull();
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the sharing token was added
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].shareToken).toBeDefined();
      expect(updateCall[1].metadata.shareTokenExpiration).toBeDefined();
      
      // Verify that an activity log entry was created
      expect(updateCall[1].activityLog.length).toBe(1);
      expect(updateCall[1].activityLog[0].action).toBe('SHARED');
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:updated', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
    
    it('should revoke a sharing token', async () => {
      // First generate a token
      await caseManagerAdapter.generateSharingToken('case-123', 'user-001');
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Now revoke the token
      const result = await caseManagerAdapter.revokeSharingToken('case-123', 'user-001');
      
      expect(result).toBe(true);
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
      expect(intelDataStore.updateEntity).toHaveBeenCalled();
      
      // Verify that the sharing token was removed
      const updateCall = (intelDataStore.updateEntity as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('case-123');
      expect(updateCall[1].shareToken).toBeUndefined();
      expect(updateCall[1].metadata.shareTokenExpiration).toBeUndefined();
      
      // Verify that the event was emitted
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith('case:updated', expect.objectContaining({
        caseId: 'case-123'
      }));
    });
  });
  
  describe('Activity Log', () => {
    it('should get the activity log for a case', async () => {
      // First, add some activity
      await caseManagerAdapter.addCollaborator('case-123', {
        userId: 'user-003',
        name: 'Test User',
        role: CollaboratorRole.EDITOR,
        addedBy: 'user-001'
      });
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock the case result with the activity log
      (intelDataStore.getEntity as jest.Mock).mockImplementation((id) => {
        if (id === 'case-123') {
          return Promise.resolve({
            success: true,
            data: {
              ...mockCaseRecord,
              activityLog: [
                {
                  id: 'activity-1',
                  action: 'COLLABORATOR_ADDED',
                  timestamp: new Date().toISOString(),
                  userId: 'user-001',
                  details: {
                    collaboratorId: 'user-003',
                    collaboratorName: 'Test User',
                    role: CollaboratorRole.EDITOR
                  }
                }
              ]
            }
          });
        }
        return Promise.resolve({
          success: false,
          error: 'Case not found'
        });
      });
      
      const result = await caseManagerAdapter.getActivityLog('case-123');
      
      expect(result.length).toBe(1);
      expect(result[0].action).toBe('COLLABORATOR_ADDED');
      expect(intelDataStore.getEntity).toHaveBeenCalledWith('case-123');
    });
  });
});
