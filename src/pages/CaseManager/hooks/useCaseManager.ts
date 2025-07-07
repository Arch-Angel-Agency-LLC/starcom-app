/**
 * useCaseManager Hook
 * 
 * Custom hook for case management functionality. Provides case data management,
 * filtering, and CRUD operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Case, 
  CaseFilter, 
  CaseData
} from '../types/cases';
import { caseManagerService } from '../services/caseManagerService';

interface UseCaseManagerOptions {
  initialFilter?: CaseFilter;
  autoLoad?: boolean;
}

interface UseCaseManagerResult {
  cases: Case[];
  caseData: CaseData;
  loading: boolean;
  error: Error | null;
  filter: CaseFilter;
  setFilter: (filter: CaseFilter) => void;
  applyFilter: () => Promise<void>;
  refreshCases: () => Promise<void>;
  selectedCase: Case | null;
  setSelectedCase: (caseData: Case | null) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (caseId: string | null) => void;
  createCase: (caseData: Omit<Case, 'id' | 'created' | 'updated'>) => Promise<Case>;
  updateCase: (caseId: string, caseData: Partial<Case>) => Promise<Case>;
  deleteCase: (caseId: string) => Promise<boolean>;
  clearError: () => void;
  filterOptions: {
    status: string[];
    priority: string[];
    tags: string[];
  };
  filteredCases: Case[];
  updateFilter: (filterChanges: Partial<CaseFilter>) => void;
}

/**
 * Custom hook for case management
 */
export function useCaseManager({
  initialFilter = {},
  autoLoad = true
}: UseCaseManagerOptions = {}): UseCaseManagerResult {
  // State management
  const [caseData, setCaseData] = useState<CaseData>({
    cases: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    availableTags: []
  });
  const [filter, setFilter] = useState<CaseFilter>(initialFilter);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch case data with current filter
  const fetchCaseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await caseManagerService.getCases(filter);
      setCaseData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching case data:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Apply filter and fetch data
  const applyFilter = useCallback(async () => {
    await fetchCaseData();
  }, [fetchCaseData]);

  // Refresh case data
  const refreshCases = useCallback(async () => {
    await fetchCaseData();
  }, [fetchCaseData]);

  // Create a new case
  const createCase = useCallback(async (newCaseData: Omit<Case, 'id' | 'created' | 'updated'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await caseManagerService.createCase(newCaseData);
      // Refresh case list after creation
      await fetchCaseData();
      return result;
    } catch (err) {
      setError(err as Error);
      console.error('Error creating case:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCaseData]);

  // Update an existing case
  const updateCase = useCallback(async (caseId: string, caseUpdateData: Partial<Case>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await caseManagerService.updateCase(caseId, caseUpdateData);
      // Refresh case list after update
      await fetchCaseData();
      // Update selected case if it's the one being updated
      if (selectedCaseId === caseId) {
        setSelectedCase(result);
      }
      return result;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating case:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCaseData, selectedCaseId]);

  // Delete a case
  const deleteCase = useCallback(async (caseId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await caseManagerService.deleteCase(caseId);
      // Refresh case list after deletion
      await fetchCaseData();
      // Clear selected case if it's the one being deleted
      if (selectedCaseId === caseId) {
        setSelectedCase(null);
        setSelectedCaseId(null);
      }
      return result;
    } catch (err) {
      setError(err as Error);
      console.error('Error deleting case:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCaseData, selectedCaseId]);

  // Load case details when selectedCaseId changes
  useEffect(() => {
    if (selectedCaseId) {
      const loadCaseDetails = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const caseDetails = await caseManagerService.getCase(selectedCaseId);
          setSelectedCase(caseDetails);
        } catch (err) {
          setError(err as Error);
          console.error('Error loading case details:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadCaseDetails();
    } else {
      setSelectedCase(null);
    }
  }, [selectedCaseId]);

  // Update filter
  const updateFilter = useCallback((filterChanges: Partial<CaseFilter>) => {
    setFilter(current => ({ ...current, ...filterChanges }));
  }, []);

  // Filter options
  const filterOptions = {
    status: ['active', 'pending', 'closed', 'archived'],
    priority: ['low', 'medium', 'high', 'critical'],
    tags: caseData.availableTags || []
  };

  // Compute filtered cases
  const filteredCases = caseData.cases;

  // Initial data load
  useEffect(() => {
    if (autoLoad) {
      fetchCaseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cases: caseData.cases,
    caseData,
    loading,
    error,
    filter,
    setFilter,
    applyFilter,
    refreshCases,
    selectedCase,
    setSelectedCase,
    selectedCaseId,
    setSelectedCaseId,
    createCase,
    updateCase,
    deleteCase,
    clearError,
    filterOptions,
    filteredCases,
    updateFilter
  };
}
