/**
 * useAnalyzerData - React hook for Analyzer integration
 * 
 * This hook provides access to analysis data from the Analyzer module
 * via the AnalyzerAdapter. It manages state, real-time updates, and
 * analysis operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  analyzerAdapter, 
  AnalysisEntity,
  AnalysisRequest,
  AnalysisResult,
  AnalyzerFilter,
  AnalyzerStats
} from '../adapters/analyzerAdapter';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { IntelQueryOptions } from '../types/intelDataModels';

/**
 * Hook for using Analyzer data in React components
 */
export function useAnalyzerData(initialFilters: AnalyzerFilter[] = [], initialOptions: IntelQueryOptions = {}) {
  // Analysis data state
  const [analyses, setAnalyses] = useState<AnalysisEntity[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisEntity | null>(null);
  const [analyzerStats, setAnalyzerStats] = useState<AnalyzerStats | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Query parameters
  const [filters, setFilters] = useState<AnalyzerFilter[]>(initialFilters);
  const [options, setOptions] = useState<IntelQueryOptions>(initialOptions);
  
  /**
   * Load analysis data based on current filters and options
   */
  const loadAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analyzerAdapter.queryAnalyses(filters, options);
      setAnalyses(data);
      
      // Also update stats
      const stats = await analyzerAdapter.getAnalyzerStats();
      setAnalyzerStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading analysis data');
      console.error('Error loading analysis data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, options]);
  
  /**
   * Initialize data loading and set up event listeners
   */
  useEffect(() => {
    // Load initial data
    loadAnalyses();
    
    // Set up event listeners for real-time updates
    const analysisCreatedListener = enhancedEventEmitter.on('analysis:created', (event) => {
      setAnalyses(prev => [...prev, event.analysis]);
    });
    
    const analysisUpdatedListener = enhancedEventEmitter.on('analysis:updated', (event) => {
      setAnalyses(prev => 
        prev.map(analysis => analysis.id === event.analysisId ? event.analysis : analysis)
      );
      
      // Update selected analysis if it was the one updated
      if (selectedAnalysis && selectedAnalysis.id === event.analysisId) {
        setSelectedAnalysis(event.analysis);
      }
    });
    
    const analysisDeletedListener = enhancedEventEmitter.on('analysis:deleted', (event) => {
      setAnalyses(prev => 
        prev.filter(analysis => analysis.id !== event.analysisId)
      );
      
      // Clear selected analysis if it was the one deleted
      if (selectedAnalysis && selectedAnalysis.id === event.analysisId) {
        setSelectedAnalysis(null);
      }
    });
    
    const analysisLinkedListener = enhancedEventEmitter.on('analysis:linked:case', (event) => {
      // If any of the linked analyses are in our current list, refresh them
      const shouldRefresh = event.analyses.some(analysis => 
        analyses.some(a => a.id === analysis.id)
      );
      
      if (shouldRefresh) {
        loadAnalyses();
      }
    });
    
    // Clean up event listeners on unmount
    return () => {
      analysisCreatedListener.unsubscribe();
      analysisUpdatedListener.unsubscribe();
      analysisDeletedListener.unsubscribe();
      analysisLinkedListener.unsubscribe();
    };
  }, [loadAnalyses, selectedAnalysis, analyses]);
  
  /**
   * Get a specific analysis by ID
   */
  const getAnalysis = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await analyzerAdapter.getAnalysis(id);
      
      if (analysis) {
        setSelectedAnalysis(analysis);
      }
      
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching analysis');
      console.error('Error fetching analysis:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Create a new analysis entity
   */
  const createAnalysis = useCallback(async (analysis: Omit<AnalysisEntity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const createdAnalysis = await analyzerAdapter.createAnalysis(analysis);
      return createdAnalysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred creating analysis');
      console.error('Error creating analysis:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Run analysis on content
   */
  const analyzeContent = useCallback(async (request: AnalysisRequest): Promise<AnalysisResult> => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyzerAdapter.analyzeContent(request);
      
      if (result.status === 'complete' && result.entity) {
        // Add to analyses list if not already there
        setAnalyses(prev => {
          if (!prev.some(a => a.id === result.entity.id)) {
            return [...prev, result.entity];
          }
          return prev;
        });
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred analyzing content');
      console.error('Error analyzing content:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update an existing analysis
   */
  const updateAnalysis = useCallback(async (id: string, updates: Partial<AnalysisEntity>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAnalysis = await analyzerAdapter.updateAnalysis(id, updates);
      return updatedAnalysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating analysis');
      console.error('Error updating analysis:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Delete an analysis
   */
  const deleteAnalysis = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await analyzerAdapter.deleteAnalysis(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting analysis');
      console.error('Error deleting analysis:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Set analysis filters and reload data
   */
  const setAnalysisFilters = useCallback((newFilters: AnalyzerFilter[]) => {
    setFilters(newFilters);
  }, []);
  
  /**
   * Set query options and reload data
   */
  const setQueryOptions = useCallback((newOptions: IntelQueryOptions) => {
    setOptions(newOptions);
  }, []);
  
  /**
   * Link analysis to a case
   */
  const linkAnalysisToCase = useCallback(async (analysisId: string, caseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await analyzerAdapter.linkAnalysisToCase(analysisId, caseId);
      
      if (success) {
        // Update the selected analysis if it's the one that was linked
        if (selectedAnalysis && selectedAnalysis.id === analysisId) {
          const updatedAnalysis = await analyzerAdapter.getAnalysis(analysisId);
          if (updatedAnalysis) {
            setSelectedAnalysis(updatedAnalysis);
          }
        }
        
        // Refresh the analyses list to reflect the new link
        loadAnalyses();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred linking analysis to case');
      console.error('Error linking analysis to case:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAnalyses, selectedAnalysis]);
  
  /**
   * Refresh analysis data
   */
  const refreshAnalyses = useCallback(() => {
    loadAnalyses();
  }, [loadAnalyses]);
  
  /**
   * Get analyzer statistics
   */
  const refreshAnalyzerStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await analyzerAdapter.getAnalyzerStats();
      setAnalyzerStats(stats);
      return stats;
    } catch (err) {
      console.error('Error getting analyzer stats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Effect to update stats when analysis data changes significantly
  useEffect(() => {
    // Only refresh stats when analysis count changes significantly
    const analysisCount = analyses.length;
    
    if (
      !analyzerStats || 
      Math.abs(analyzerStats.totalAnalyses - analysisCount) > 5
    ) {
      refreshAnalyzerStats();
    }
  }, [analyses, analyzerStats, refreshAnalyzerStats]);
  
  return {
    // Data
    analyses,
    selectedAnalysis,
    analyzerStats,
    loading,
    error,
    filters,
    options,
    
    // Actions
    setSelectedAnalysis,
    getAnalysis,
    createAnalysis,
    analyzeContent,
    updateAnalysis,
    deleteAnalysis,
    setAnalysisFilters,
    setQueryOptions,
    linkAnalysisToCase,
    refreshAnalyses,
    refreshAnalyzerStats
  };
}

export default useAnalyzerData;
