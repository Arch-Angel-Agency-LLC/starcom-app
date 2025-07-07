/**
 * useCaseManager - Hook for Case Manager data with IntelDataCore
 * 
 * This hook provides access to Case Manager data from IntelDataCore
 * for use in React components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  caseManagerAdapter, 
  CaseItem,
  CaseStats,
  CaseFilter
} from '../adapters/caseManagerAdapter';
import { 
  CaseRecord, 
  Collaborator, 
  CaseComment, 
  CasePermissions, 
  ActivityLogEntry 
} from '../types/intelDataModels';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { storageOrchestrator } from '../storage/storageOrchestrator';

export interface UseCaseManagerResult {
  // Case data
  cases: CaseItem[];
  selectedCase: CaseItem | null;
  stats: CaseStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  applyFilters: (filters: CaseFilter[]) => Promise<void>;
  refreshData: () => Promise<void>;
  selectCase: (id: string | null) => Promise<void>;
  addCase: (caseData: Partial<CaseRecord>) => Promise<string | null>;
  updateCase: (id: string, updates: Partial<CaseRecord>) => Promise<boolean>;
  deleteCase: (id: string) => Promise<boolean>;
  linkEntitiesToCase: (caseId: string, entityIds: string[]) => Promise<boolean>;
  linkCases: (sourceCaseId: string, targetCaseIds: string[]) => Promise<boolean>;
  
  // Collaboration features
  addCollaborator: (caseId: string, collaborator: Omit<Collaborator, 'addedAt'>) => Promise<boolean>;
  removeCollaborator: (caseId: string, userId: string, removedBy: string) => Promise<boolean>;
  addComment: (caseId: string, comment: Omit<CaseComment, 'id' | 'createdAt'>) => Promise<string | null>;
  updateComment: (caseId: string, commentId: string, updates: Partial<Omit<CaseComment, 'id' | 'createdAt' | 'createdBy'>>) => Promise<boolean>;
  deleteComment: (caseId: string, commentId: string, deletedBy: string) => Promise<boolean>;
  updatePermissions: (caseId: string, permissions: Partial<CasePermissions>, updatedBy: string) => Promise<boolean>;
  generateSharingToken: (caseId: string, generatedBy: string, expiresInHours?: number) => Promise<string | null>;
  revokeSharingToken: (caseId: string, revokedBy: string) => Promise<boolean>;
  getActivityLog: (caseId: string) => Promise<ActivityLogEntry[]>;
}

/**
 * Hook for accessing and manipulating Case Manager data
 */
export function useCaseManager(initialFilters: CaseFilter[] = []): UseCaseManagerResult {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [stats, setStats] = useState<CaseStats>({
    totalCases: 0,
    openCases: 0,
    closedCases: 0,
    byStatus: {
      NEW: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      PENDING: 0,
      RESOLVED: 0,
      CLOSED: 0
    },
    byPriority: {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    },
    avgTimeToClose: 0,
    recentActivity: {
      created: 0,
      updated: 0,
      closed: 0
    }
  });
  const [filters, setFilters] = useState<CaseFilter[]>(initialFilters);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of event listeners to clean them up
  const eventListeners = useRef<Array<{ unsubscribe: () => void }>>([]);
  
  /**
   * Load case data based on current filters
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch cases
      const casesData = await caseManagerAdapter.getCases(filters);
      setCases(casesData);
      
      // Fetch case statistics
      const statsData = await caseManagerAdapter.getCaseStats(filters);
      setStats(statsData);
      
      // Update selected case if it exists
      if (selectedCase) {
        const updated = await caseManagerAdapter.getCaseById(selectedCase.id);
        if (updated) {
          setSelectedCase(updated);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading case data');
      console.error('Error loading Case Manager data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCase]);
  
  /**
   * Set up real-time event listeners
   */
  const setupEventListeners = useCallback(() => {
    // Clean up any existing listeners
    eventListeners.current.forEach(listener => listener.unsubscribe());
    eventListeners.current = [];
    
    // Listen for case created events
    const createdListener = enhancedEventEmitter.on('case:created', (event) => {
      setCases(prevCases => {
        // Make sure we don't add duplicates
        const exists = prevCases.some(c => c.id === event.caseId);
        if (exists) {
          return prevCases;
        }
        
        // Add the new case if it matches our filters
        // In a real implementation, we would check the filters here
        return [...prevCases, event.case];
      });
      
      // If stats need updating, do it here or refresh them
      loadData();
    });
    
    // Listen for case updated events
    const updatedListener = enhancedEventEmitter.on('case:updated', (event) => {
      setCases(prevCases => {
        // Replace the updated case
        return prevCases.map(c => 
          c.id === event.caseId ? event.case : c
        );
      });
      
      // Update selected case if it matches
      if (selectedCase && selectedCase.id === event.caseId) {
        setSelectedCase(event.case);
      }
      
      // Update stats if necessary
      loadData();
    });
    
    // Listen for case deleted events
    const deletedListener = enhancedEventEmitter.on('case:deleted', (event) => {
      setCases(prevCases => {
        // Remove the deleted case
        return prevCases.filter(c => c.id !== event.caseId);
      });
      
      // Clear selected case if it matches
      if (selectedCase && selectedCase.id === event.caseId) {
        setSelectedCase(null);
      }
      
      // Update stats if necessary
      loadData();
    });
    
    // Store listeners for cleanup
    eventListeners.current.push(createdListener);
    eventListeners.current.push(updatedListener);
    eventListeners.current.push(deletedListener);
  }, [loadData, selectedCase]);
  
  /**
   * Apply new filters and reload data
   */
  const applyFilters = useCallback(async (newFilters: CaseFilter[]) => {
    setFilters(newFilters);
  }, []);
  
  /**
   * Select a case by ID
   */
  const selectCase = useCallback(async (id: string | null) => {
    try {
      if (!id) {
        setSelectedCase(null);
        return;
      }
      
      setLoading(true);
      const caseItem = await caseManagerAdapter.getCaseById(id);
      setSelectedCase(caseItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred selecting a case');
      console.error('Error selecting case:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Add a new case
   */
  const addCase = useCallback(async (caseData: Partial<CaseRecord>) => {
    try {
      const caseId = await caseManagerAdapter.addCase(caseData);
      if (caseId) {
        // Refresh data after adding the case
        await loadData();
      }
      return caseId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred adding a case');
      console.error('Error adding case:', err);
      return null;
    }
  }, [loadData]);
  
  /**
   * Update an existing case
   */
  const updateCase = useCallback(async (id: string, updates: Partial<CaseRecord>) => {
    try {
      const success = await caseManagerAdapter.updateCase(id, updates);
      if (success) {
        // Refresh data after updating the case
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating a case');
      console.error('Error updating case:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Delete a case
   */
  const deleteCase = useCallback(async (id: string) => {
    try {
      const success = await caseManagerAdapter.deleteCase(id);
      if (success) {
        // Clear selected case if it was deleted
        if (selectedCase && selectedCase.id === id) {
          setSelectedCase(null);
        }
        
        // Refresh data after deleting the case
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting a case');
      console.error('Error deleting case:', err);
      return false;
    }
  }, [loadData, selectedCase]);
  
  /**
   * Link entities to a case
   */
  const linkEntitiesToCase = useCallback(async (caseId: string, entityIds: string[]) => {
    try {
      const success = await caseManagerAdapter.linkEntitiesToCase(caseId, entityIds);
      if (success) {
        // Refresh data after linking entities
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred linking entities to case');
      console.error('Error linking entities:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Link cases together
   */
  const linkCases = useCallback(async (sourceCaseId: string, targetCaseIds: string[]) => {
    try {
      const success = await caseManagerAdapter.linkCases(sourceCaseId, targetCaseIds);
      if (success) {
        // Refresh data after linking cases
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred linking cases');
      console.error('Error linking cases:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Add a collaborator to a case
   */
  const addCollaborator = useCallback(async (
    caseId: string, 
    collaborator: Omit<Collaborator, 'addedAt'>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.addCollaborator(caseId, collaborator);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred adding collaborator');
      console.error('Error adding collaborator:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Remove a collaborator from a case
   */
  const removeCollaborator = useCallback(async (
    caseId: string, 
    userId: string, 
    removedBy: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.removeCollaborator(caseId, userId, removedBy);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred removing collaborator');
      console.error('Error removing collaborator:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Add a comment to a case
   */
  const addComment = useCallback(async (
    caseId: string, 
    comment: Omit<CaseComment, 'id' | 'createdAt'>
  ): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.addComment(caseId, comment);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred adding comment');
      console.error('Error adding comment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Update a comment on a case
   */
  const updateComment = useCallback(async (
    caseId: string, 
    commentId: string, 
    updates: Partial<Omit<CaseComment, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.updateComment(caseId, commentId, updates);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating comment');
      console.error('Error updating comment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Delete a comment from a case
   */
  const deleteComment = useCallback(async (
    caseId: string, 
    commentId: string, 
    deletedBy: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.deleteComment(caseId, commentId, deletedBy);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting comment');
      console.error('Error deleting comment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Update case permissions
   */
  const updatePermissions = useCallback(async (
    caseId: string, 
    permissions: Partial<CasePermissions>, 
    updatedBy: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.updatePermissions(caseId, permissions, updatedBy);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating permissions');
      console.error('Error updating permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Generate a sharing token for external access
   */
  const generateSharingToken = useCallback(async (
    caseId: string, 
    generatedBy: string,
    expiresInHours: number = 24
  ): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.generateSharingToken(caseId, expiresInHours, generatedBy);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred generating sharing token');
      console.error('Error generating sharing token:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Revoke a sharing token
   */
  const revokeSharingToken = useCallback(async (
    caseId: string, 
    revokedBy: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.revokeSharingToken(caseId, revokedBy);
      
      if (result) {
        // If the selected case is affected, update it
        if (selectedCase && selectedCase.id === caseId) {
          await selectCase(caseId);
        }
        // Refresh all case data
        await loadData();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred revoking sharing token');
      console.error('Error revoking sharing token:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData, selectCase, selectedCase]);
  
  /**
   * Get activity log for a case
   */
  const getActivityLog = useCallback(async (
    caseId: string
  ): Promise<ActivityLogEntry[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await caseManagerAdapter.getActivityLog(caseId);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred getting activity log');
      console.error('Error getting activity log:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load data when component mounts or filters change
   */
  useEffect(() => {
    loadData();
  }, [loadData, filters]);
  
  /**
   * Set up event listeners when component mounts
   */
  useEffect(() => {
    setupEventListeners();
    
    // Clean up event listeners when component unmounts
    return () => {
      eventListeners.current.forEach(listener => listener.unsubscribe());
      eventListeners.current = [];
    };
  }, [setupEventListeners]);
  
  return {
    cases,
    selectedCase,
    stats,
    loading,
    error,
    applyFilters,
    refreshData: loadData,
    selectCase,
    addCase,
    updateCase,
    deleteCase,
    linkEntitiesToCase,
    linkCases,
    addCollaborator,
    removeCollaborator,
    addComment,
    updateComment,
    deleteComment,
    updatePermissions,
    generateSharingToken,
    revokeSharingToken,
    getActivityLog
  };
}

export default useCaseManager;
