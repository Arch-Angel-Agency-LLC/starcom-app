/**
 * useDarkWebMonitoring Hook
 * 
 * React hook for dark web monitoring in the OSINT module.
 * Provides functionality for searching dark web sources, monitoring
 * for alerts, and managing monitors.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  darkWebService, 
  DarkWebResult, 
  DarkWebAlert, 
  MonitorConfig, 
  SourceStats,
  DarkWebSourceType,
  AlertLevel,
  MonitorStatus
} from '../services/darkweb/darkWebService';
import { ErrorDetail } from '../types/errors';

/**
 * Dark web monitoring hook for OSINT module
 */
export function useDarkWebMonitoring() {
  // State for search query
  const [query, setQuery] = useState<string>('');
  
  // State for search source type
  const [sourceType, setSourceType] = useState<DarkWebSourceType>('all');
  
  // State for loading status with operation tracking
  const [loading, setLoading] = useState<Record<string, boolean>>({
    search: false,
    monitors: false,
    createMonitor: false,
    updateMonitor: false,
    alerts: false,
    sourceStats: false,
    checkAccess: false
  });
  
  // State for error
  const [error, setError] = useState<ErrorDetail | null>(null);
  
  // Consolidated loading state getter
  const isLoading = useCallback((operation?: string): boolean => {
    if (operation) {
      return loading[operation] || false;
    }
    return Object.values(loading).some(value => value);
  }, [loading]);
  
  // State for search results
  const [searchResults, setSearchResults] = useState<DarkWebResult[]>([]);
  
  // State for monitors
  const [monitors, setMonitors] = useState<MonitorConfig[]>([]);
  
  // State for alerts
  const [alerts, setAlerts] = useState<DarkWebAlert[]>([]);
  
  // State for source statistics
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  
  // State for dark web access status
  const [accessStatus, setAccessStatus] = useState<{ available: boolean; routingSecure: boolean; latency: number }>({
    available: false,
    routingSecure: false,
    latency: 0
  });
  
  /**
   * Check dark web access
   */
  const checkAccess = useCallback(async () => {
    setLoading(prev => ({ ...prev, checkAccess: true }));
    setError(null);
    
    try {
      const response = await darkWebService.checkDarkWebAccess();
      
      setLoading(prev => ({ ...prev, checkAccess: false }));
      
      if (response.error) {
        setError(response.error);
        setAccessStatus({
          available: false,
          routingSecure: false,
          latency: 0
        });
        return null;
      }
      
      if (response.status) {
        setAccessStatus(response.status);
        return response.status;
      }
      
      return null;
    } catch (err) {
      console.error('Failed to check dark web access:', err);
      setLoading(prev => ({ ...prev, checkAccess: false }));
      setAccessStatus({
        available: false,
        routingSecure: false,
        latency: 0
      });
      return null;
    }
  }, []);
  
  /**
   * Search the dark web
   */
  const search = useCallback(async (
    searchQuery: string = query,
    searchSourceType: DarkWebSourceType = sourceType,
    options: {
      alertLevel?: AlertLevel;
      maxResults?: number;
      retryCount?: number;
    } = {}
  ) => {
    if (!searchQuery) {
      return [];
    }
    
    const retryCount = options.retryCount || 0;
    const maxRetries = 3;
    
    setLoading(prev => ({ ...prev, search: true }));
    setError(null);
    
    try {
      const response = await darkWebService.search(searchQuery, {
        sourceType: searchSourceType,
        ...options
      });
      
      if (response.error) {
        // If error is retryable and we haven't exceeded max retries
        if (response.error.retryable && retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying search after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return search(searchQuery, searchSourceType, {
            ...options,
            retryCount: retryCount + 1
          });
        }
        
        setError(response.error);
        return [];
      }
      
      setSearchResults(response.results);
      setQuery(searchQuery);
      setSourceType(searchSourceType);
      
      return response.results;
    } catch (err) {
      console.error('Error in search:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  }, [query, sourceType]);
  
  /**
   * Load monitors
   */
  const loadMonitors = useCallback(async (options: { retryCount?: number } = {}) => {
    const retryCount = options.retryCount || 0;
    const maxRetries = 3;
    
    setLoading(prev => ({ ...prev, monitors: true }));
    setError(null);
    
    try {
      const response = await darkWebService.getMonitors();
      
      if (response.error) {
        // If error is retryable and we haven't exceeded max retries
        if (response.error.retryable && retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying loadMonitors after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return loadMonitors({
            retryCount: retryCount + 1
          });
        }
        
        setError(response.error);
        return [];
      }
      
      setMonitors(response.monitors);
      return response.monitors;
    } catch (err) {
      console.error('Failed to load monitors:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, monitors: false }));
    }
  }, []);
  
  /**
   * Load alerts
   */
  const loadAlerts = useCallback(async (options: {
    monitorId?: string;
    onlyUnseen?: boolean;
    minAlertLevel?: AlertLevel;
    retryCount?: number;
  } = {}) => {
    const retryCount = options.retryCount || 0;
    const maxRetries = 3;
    
    setLoading(prev => ({ ...prev, alerts: true }));
    setError(null);
    
    try {
      const response = await darkWebService.getAlerts({
        monitorId: options.monitorId,
        onlyUnseen: options.onlyUnseen,
        minAlertLevel: options.minAlertLevel
      });
      
      if (response.error) {
        // If error is retryable and we haven't exceeded max retries
        if (response.error.retryable && retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying loadAlerts after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return loadAlerts({
            ...options,
            retryCount: retryCount + 1
          });
        }
        
        setError(response.error);
        return [];
      }
      
      setAlerts(response.alerts);
      return response.alerts;
    } catch (err) {
      console.error('Failed to load alerts:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);
  
  /**
   * Create a monitor
   */
  const createMonitor = useCallback(async (
    name: string,
    keywords: string[],
    sources: DarkWebSourceType[] = ['all'],
    alertThreshold: AlertLevel = 'low',
    options: { retryCount?: number } = {}
  ) => {
    if (!name || keywords.length === 0) {
      return null;
    }
    
    const retryCount = options.retryCount || 0;
    const maxRetries = 3;
    
    setLoading(prev => ({ ...prev, createMonitor: true }));
    setError(null);
    
    try {
      const response = await darkWebService.createMonitor({
        name,
        keywords,
        sources,
        alertThreshold,
        status: 'active'
      });
      
      if (response.error) {
        // If error is retryable and we haven't exceeded max retries
        if (response.error.retryable && retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying createMonitor after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return createMonitor(name, keywords, sources, alertThreshold, {
            retryCount: retryCount + 1
          });
        }
        
        setError(response.error);
        return null;
      }
      
      if (response.monitor) {
        // Update monitors list
        setMonitors(prevMonitors => [...prevMonitors, response.monitor]);
        return response.monitor;
      }
      
      return null;
    } catch (err) {
      console.error('Failed to create monitor:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, createMonitor: false }));
    }
  }, []);
  
  /**
   * Update monitor status
   */
  const updateMonitorStatus = useCallback(async (
    monitorId: string, 
    status: MonitorStatus,
    options: { retryCount?: number } = {}
  ) => {
    const retryCount = options.retryCount || 0;
    const maxRetries = 3;
    
    setLoading(prev => ({ ...prev, updateMonitor: true }));
    setError(null);
    
    try {
      const response = await darkWebService.updateMonitorStatus(monitorId, status);
      
      if (response.error) {
        // If error is retryable and we haven't exceeded max retries
        if (response.error.retryable && retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying updateMonitorStatus after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return updateMonitorStatus(monitorId, status, {
            retryCount: retryCount + 1
          });
        }
        
        setError(response.error);
        return false;
      }
      
      if (response.success) {
        // Update monitors list
        setMonitors(prevMonitors => 
          prevMonitors.map(monitor => 
            monitor.id === monitorId 
              ? { ...monitor, status } 
              : monitor
          )
        );
      }
      
      return response.success;
    } catch (err) {
      console.error('Failed to update monitor status:', err);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, updateMonitor: false }));
    }
  }, []);
  
  /**
   * Load source statistics
   */
  const loadSourceStats = useCallback(async (options: { retryCount?: number } = {}) => {
    const retryCount = options.retryCount || 0;
    const maxRetries = 3;
    
    setLoading(prev => ({ ...prev, sourceStats: true }));
    setError(null);
    
    try {
      const response = await darkWebService.getSourceStats();
      
      if (response.error) {
        // If error is retryable and we haven't exceeded max retries
        if (response.error.retryable && retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying loadSourceStats after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return loadSourceStats({
            retryCount: retryCount + 1
          });
        }
        
        setError(response.error);
        return [];
      }
      
      setSourceStats(response.stats);
      return response.stats;
    } catch (err) {
      console.error('Failed to load source statistics:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, sourceStats: false }));
    }
  }, []);
  
  /**
   * Get monitor by id
   */
  const getMonitorById = useCallback((monitorId: string) => {
    return monitors.find(monitor => monitor.id === monitorId) || null;
  }, [monitors]);
  
  /**
   * Get alerts for monitor
   */
  const getAlertsForMonitor = useCallback((monitorId: string) => {
    return alerts.filter(alert => alert.monitorId === monitorId);
  }, [alerts]);
  
  /**
   * Set error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Initialize hook with data
   */
  useEffect(() => {
    const initialize = async () => {
      await checkAccess();
      await loadMonitors();
      await loadAlerts();
      await loadSourceStats();
    };
    
    initialize();
  }, [checkAccess, loadMonitors, loadAlerts, loadSourceStats]);
  
  // Return the hook API
  return {
    // State
    query,
    sourceType,
    isLoading,
    error,
    searchResults,
    monitors,
    alerts,
    sourceStats,
    accessStatus,
    
    // Loading states
    loading,
    
    // Error handling
    clearError,
    
    // Search
    setQuery,
    setSourceType,
    search,
    
    // Monitors
    loadMonitors,
    createMonitor,
    updateMonitorStatus,
    getMonitorById,
    
    // Alerts
    loadAlerts,
    getAlertsForMonitor,
    
    // Stats
    loadSourceStats,
    
    // Access
    checkAccess
  };
}

export default useDarkWebMonitoring;
