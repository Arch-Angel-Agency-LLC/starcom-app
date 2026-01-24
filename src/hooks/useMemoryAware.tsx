/**
 * React Hook for Memory-Aware Operations
 * Provides easy integration with memory monitoring for React components
 */

import React, { useState, useEffect, useCallback } from 'react';
import { memoryMonitor, type MemoryStats } from '../utils/memoryMonitor';

interface MemoryAwareHookResult {
  memoryStats: Pick<MemoryStats, 'usedMB' | 'totalMB' | 'usagePercentage'> | null;
  isMemoryHigh: boolean;
  isMemoryCritical: boolean;
  shouldProceedWithOperation: boolean;
  getRecommendedPageSize: (defaultSize: number, maxSize: number) => number;
  forceMemoryCheck: () => void;
}

export const useMemoryAware = (): MemoryAwareHookResult => {
  const [memoryStats, setMemoryStats] = useState<MemoryAwareHookResult['memoryStats']>(null);
  const [isMemoryHigh, setIsMemoryHigh] = useState(false);
  const [isMemoryCritical, setIsMemoryCritical] = useState(false);

  const updateFromReading = useCallback((readingStats: MemoryStats | null, level: 'warning' | 'critical' | null) => {
    setMemoryStats(readingStats ? {
      usedMB: readingStats.usedMB,
      totalMB: readingStats.totalMB,
      usagePercentage: readingStats.usagePercentage
    } : null);
    setIsMemoryHigh(level === 'warning');
    setIsMemoryCritical(level === 'critical');
  }, []);

  const forceMemoryCheck = useCallback(() => {
    memoryMonitor.forceCheck();
  }, []);

  useEffect(() => {
    const unsubscribe = memoryMonitor.subscribe(({ stats, level }) => {
      updateFromReading(stats, level);
    });
    return () => unsubscribe();
  }, [updateFromReading]);

  return {
    memoryStats,
    isMemoryHigh,
    isMemoryCritical,
    shouldProceedWithOperation: !isMemoryCritical,
    getRecommendedPageSize: memoryMonitor.getRecommendedPageSize.bind(memoryMonitor),
    forceMemoryCheck,
  };
};

/**
 * Memory-Aware Component Wrapper
 * Automatically handles memory pressure by reducing functionality when memory is low
 */
export const withMemoryAware = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { fallback?: React.ComponentType }> => {
  return (props: P & { fallback?: React.ComponentType }) => {
    const { isMemoryCritical, isMemoryHigh } = useMemoryAware();
    const { fallback: FallbackComponent, ...componentProps } = props;

    // If memory is critical and fallback is provided, render fallback
    if (isMemoryCritical && FallbackComponent) {
      return React.createElement(FallbackComponent);
    }

    // If memory is high, add warning class for styling
    const wrapperProps = isMemoryHigh 
      ? { ...componentProps, 'data-memory-warning': true }
      : componentProps;

    return React.createElement(Component, wrapperProps as P);
  };
};

/**
 * Memory-Aware Pagination Hook
 * Automatically adjusts page sizes based on memory usage
 */
export const useMemoryAwarePagination = (defaultPageSize: number = 20, maxPageSize: number = 100) => {
  const { getRecommendedPageSize, shouldProceedWithOperation } = useMemoryAware();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const updatePageSize = useCallback(() => {
    const recommendedSize = getRecommendedPageSize(defaultPageSize, maxPageSize);
    setPageSize(recommendedSize);
  }, [defaultPageSize, maxPageSize, getRecommendedPageSize]);

  // Update page size when memory conditions change
  useEffect(() => {
    updatePageSize();
  }, [updatePageSize]);

  const goToPage = useCallback((page: number) => {
    if (shouldProceedWithOperation) {
      setCurrentPage(page);
      return true;
    } else {
      console.warn('Cannot navigate: memory usage too high');
      return false;
    }
  }, [shouldProceedWithOperation]);

  const nextPage = useCallback(() => {
    return goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    return goToPage(Math.max(1, currentPage - 1));
  }, [currentPage, goToPage]);

  return {
    currentPage,
    pageSize,
    canProceed: shouldProceedWithOperation,
    goToPage,
    nextPage,
    previousPage,
    updatePageSize,
  };
};

export default useMemoryAware;
