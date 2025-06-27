// Browser Storage Monitoring Hook
// AI-NOTE: React hook to monitor and manage browser storage usage
// Prevents system cache bloat by implementing storage limits and cleanup

import { useEffect, useState, useCallback, useMemo } from 'react';
import { browserStorageManager, type StorageStats } from '../utils/browserStorageManager';

export interface StorageMonitoringConfig {
  enableAutoCleanup: boolean;
  monitoringInterval: number; // milliseconds
  maxStorageSize: number; // bytes
  alertThreshold: number; // 0-1 percentage
}

const defaultConfig: StorageMonitoringConfig = {
  enableAutoCleanup: true,
  monitoringInterval: 5 * 60 * 1000, // 5 minutes
  maxStorageSize: 2 * 1024 * 1024, // 2MB
  alertThreshold: 0.8 // 80%
};

export const useStorageMonitoring = (config: Partial<StorageMonitoringConfig> = {}) => {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isNearLimit, setIsNearLimit] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);
  
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  const updateStats = useCallback(async () => {
    try {
      const stats = await browserStorageManager.getStorageStats();
      setStorageStats(stats);
      
      const limits = await browserStorageManager.checkStorageLimits();
      const nearLimit = limits.starcom.isNearLimit || limits.localStorage.isNearLimit;
      setIsNearLimit(nearLimit);
      
      // Auto-cleanup if enabled and near limit
      if (finalConfig.enableAutoCleanup && nearLimit) {
        const result = browserStorageManager.cleanupLocalStorage({
          targetSize: finalConfig.maxStorageSize * 0.7 // Clean to 70% of limit
        });
        
        if (result.cleaned > 0) {
          setLastCleanup(new Date());
          console.log(`🧹 Auto-cleanup: freed ${browserStorageManager.formatSize(result.sizeFreed)}`);
        }
      }
    } catch (error) {
      console.error('Storage monitoring error:', error);
    }
  }, [finalConfig]);

  const manualCleanup = useCallback(async () => {
    const result = browserStorageManager.cleanupLocalStorage({
      targetSize: finalConfig.maxStorageSize * 0.5 // Clean to 50% of limit
    });
    
    if (result.cleaned > 0) {
      setLastCleanup(new Date());
      await updateStats(); // Refresh stats after cleanup
    }
    
    return result;
  }, [finalConfig.maxStorageSize, updateStats]);

  const clearAllStorage = useCallback(async () => {
    try {
      // Clear all Starcom localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('starcom-'));
      keys.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      setLastCleanup(new Date());
      await updateStats();
      
      return { cleared: keys.length };
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return { cleared: 0 };
    }
  }, [updateStats]);

  const getStorageUsagePercent = useCallback(() => {
    if (!storageStats) return 0;
    return (storageStats.localStorage.starcomSize / finalConfig.maxStorageSize) * 100;
  }, [storageStats, finalConfig.maxStorageSize]);

  // Set up monitoring interval
  useEffect(() => {
    updateStats(); // Initial check
    
    const interval = setInterval(updateStats, finalConfig.monitoringInterval);
    return () => clearInterval(interval);
  }, [updateStats, finalConfig.monitoringInterval]);

  // Monitor storage on app focus
  useEffect(() => {
    const handleFocus = () => updateStats();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [updateStats]);

  return {
    storageStats,
    isNearLimit,
    lastCleanup,
    usagePercent: getStorageUsagePercent(),
    actions: {
      refresh: updateStats,
      cleanup: manualCleanup,
      clearAll: clearAllStorage
    }
  };
};
