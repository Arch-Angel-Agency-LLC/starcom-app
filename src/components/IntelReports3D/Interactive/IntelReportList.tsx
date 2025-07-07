/**
 * IntelReportList - Virtualized list component for Intel Reports
 * Provides efficient rendering of large lists with filtering and selection
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { IntelReport3DData, IntelCategory, IntelPriority, IntelClassification } from '../../../types/intelligence/IntelReportTypes';
import { IntelReportCard } from './IntelReportCard';
import styles from './IntelReportList.module.css';

interface IntelReportListProps {
  /** Array of intel reports to display */
  reports: IntelReport3DData[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Selected report IDs */
  selectedIds?: Set<string>;
  /** Whether to allow multi-selection */
  multiSelect?: boolean;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Virtual scrolling enabled */
  virtualized?: boolean;
  /** Item height for virtualization */
  itemHeight?: number;
  /** Container height for virtualization */
  containerHeight?: number;
  /** Current filter values */
  filters?: {
    category?: IntelCategory | 'all';
    priority?: IntelPriority | 'all';
    classification?: IntelClassification | 'all';
    search?: string;
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  /** Callback when a report is clicked */
  onReportClick?: (report: IntelReport3DData) => void;
  /** Callback when report selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Callback when report action is triggered */
  onReportAction?: (action: string, report: IntelReport3DData) => void;
  /** Custom CSS class */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Filter reports based on criteria
 */
const filterReports = (
  reports: IntelReport3DData[],
  filters?: IntelReportListProps['filters']
): IntelReport3DData[] => {
  if (!filters) return reports;

  return reports.filter(report => {
    // Category filter
    if (filters.category && filters.category !== 'all' && report.metadata.category !== filters.category) {
      return false;
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all' && report.visualization.priority !== filters.priority) {
      return false;
    }

    // Classification filter
    if (filters.classification && filters.classification !== 'all' && report.classification !== filters.classification) {
      return false;
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        report.title,
        report.content.summary,
        report.content.details,
        report.source,
        ...(report.content.keywords || []),
        ...(report.metadata.tags || [])
      ].join(' ').toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        report.metadata.tags.some(reportTag => 
          reportTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const reportDate = new Date(report.timestamp);
      if (reportDate < filters.dateRange.start || reportDate > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort reports by priority and timestamp
 */
const sortReports = (reports: IntelReport3DData[]): IntelReport3DData[] => {
  const priorityOrder: Record<IntelPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    background: 4
  };

  return [...reports].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.visualization.priority] - priorityOrder[b.visualization.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

/**
 * VirtualizedList component for efficient rendering
 */
const VirtualizedList: React.FC<{
  items: IntelReport3DData[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: IntelReport3DData, index: number) => React.ReactNode;
}> = ({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, items.length);
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={styles.virtualizedContainer}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            width: '100%'
          }}
        >
          {visibleItems.map((item, index) => 
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * IntelReportList - Virtualized list component
 */
export const IntelReportList: React.FC<IntelReportListProps> = ({
  reports,
  loading = false,
  error = null,
  selectedIds = new Set(),
  multiSelect = true,
  compact = false,
  virtualized = false,
  itemHeight = 120,
  containerHeight = 400,
  filters,
  onReportClick,
  onSelectionChange,
  onReportAction,
  className = '',
  emptyMessage = 'No reports found'
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(selectedIds);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedIds(selectedIds);
  }, [selectedIds]);

  // Filter and sort reports
  const processedReports = useMemo(() => {
    const filtered = filterReports(reports, filters);
    return sortReports(filtered);
  }, [reports, filters]);

  // Handle report click
  const handleReportClick = useCallback((report: IntelReport3DData) => {
    onReportClick?.(report);
  }, [onReportClick]);

  // Handle report selection
  const handleReportSelect = useCallback((report: IntelReport3DData) => {
    const newSelection = new Set(localSelectedIds);

    if (multiSelect) {
      if (newSelection.has(report.id)) {
        newSelection.delete(report.id);
      } else {
        newSelection.add(report.id);
      }
    } else {
      newSelection.clear();
      newSelection.add(report.id);
    }

    setLocalSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  }, [localSelectedIds, multiSelect, onSelectionChange]);

  // Handle report action
  const handleReportAction = useCallback((action: string, report: IntelReport3DData) => {
    onReportAction?.(action, report);
  }, [onReportAction]);

  // Render individual report item
  const renderReportItem = useCallback((report: IntelReport3DData) => (
    <div key={report.id} className={styles.listItem}>
      <IntelReportCard
        report={report}
        isSelected={localSelectedIds.has(report.id)}
        compact={compact}
        onClick={handleReportClick}
        onSelect={handleReportSelect}
        onAction={handleReportAction}
      />
    </div>
  ), [localSelectedIds, compact, handleReportClick, handleReportSelect, handleReportAction]);

  // Compute container classes
  const containerClasses = useMemo(() => [
    styles.container,
    loading && styles.loading,
    compact && styles.compact,
    className
  ].filter(Boolean).join(' '), [loading, compact, className]);

  // Loading state
  if (loading) {
    return (
      <div className={containerClasses}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={containerClasses}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorMessage}>{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (processedReports.length === 0) {
    return (
      <div className={containerClasses}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <span className={styles.emptyMessage}>{emptyMessage}</span>
          {filters && Object.values(filters).some(Boolean) && (
            <span className={styles.emptyHint}>Try adjusting your filters</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Selection summary */}
      {localSelectedIds.size > 0 && (
        <div className={styles.selectionSummary}>
          <span>{localSelectedIds.size} report{localSelectedIds.size !== 1 ? 's' : ''} selected</span>
          <button
            className={styles.clearSelection}
            onClick={() => {
              setLocalSelectedIds(new Set());
              onSelectionChange?.(new Set());
            }}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Results summary */}
      <div className={styles.resultsSummary}>
        {processedReports.length} of {reports.length} reports
        {filters && Object.values(filters).some(Boolean) && (
          <span className={styles.filtered}> (filtered)</span>
        )}
      </div>

      {/* Report list */}
      {virtualized ? (
        <VirtualizedList
          items={processedReports}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderItem={(report) => renderReportItem(report)}
        />
      ) : (
        <div className={styles.standardList}>
          {processedReports.map((report) => renderReportItem(report))}
        </div>
      )}
    </div>
  );
};

export default IntelReportList;
