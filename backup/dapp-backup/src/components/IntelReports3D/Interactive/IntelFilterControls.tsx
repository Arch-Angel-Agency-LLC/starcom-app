/**
 * IntelFilterControls - Advanced filter interface for Intel Reports
 * Provides comprehensive filtering capabilities with intuitive UI
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { IntelCategory, IntelPriority, IntelClassification, IntelThreatLevel } from '../../../types/intelligence/IntelReportTypes';
import styles from './IntelFilterControls.module.css';

interface IntelFilterControlsProps {
  /** Current filter state */
  filters: {
    category?: IntelCategory | 'all';
    priority?: IntelPriority | 'all';
    classification?: IntelClassification | 'all';
    threatLevel?: IntelThreatLevel | 'all';
    search?: string;
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    confidence?: {
      min: number;
      max: number;
    };
  };
  /** Available tags for tag filtering */
  availableTags?: string[];
  /** Whether filters are expanded */
  expanded?: boolean;
  /** Whether to show advanced filters */
  showAdvanced?: boolean;
  /** Callback when filters change */
  onFiltersChange?: (filters: IntelFilterControlsProps['filters']) => void;
  /** Callback when filters are cleared */
  onClearFilters?: () => void;
  /** Callback when expand state changes */
  onToggleExpanded?: (expanded: boolean) => void;
  /** Custom CSS class */
  className?: string;
}

const CATEGORIES: Array<{ value: IntelCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'cyber_threat', label: 'Cyber Threat' },
  { value: 'physical_security', label: 'Physical Security' },
  { value: 'financial_crime', label: 'Financial Crime' },
  { value: 'geopolitical', label: 'Geopolitical' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'operational', label: 'Operational' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'tactical', label: 'Tactical' }
];

const PRIORITIES: Array<{ value: IntelPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'background', label: 'Background' }
];

const CLASSIFICATIONS: Array<{ value: IntelClassification | 'all'; label: string }> = [
  { value: 'all', label: 'All Classifications' },
  { value: 'UNCLASSIFIED', label: 'Unclassified' },
  { value: 'CONFIDENTIAL', label: 'Confidential' },
  { value: 'SECRET', label: 'Secret' },
  { value: 'TOP_SECRET', label: 'Top Secret' },
  { value: 'COMPARTMENTED', label: 'Compartmented' }
];

const THREAT_LEVELS: Array<{ value: IntelThreatLevel | 'all'; label: string }> = [
  { value: 'all', label: 'All Threat Levels' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

/**
 * IntelFilterControls - Advanced filter interface
 */
export const IntelFilterControls: React.FC<IntelFilterControlsProps> = ({
  filters,
  availableTags = [],
  expanded = false,
  showAdvanced = false,
  onFiltersChange,
  onClearFilters,
  onToggleExpanded,
  className = ''
}) => {
  const [localExpanded, setLocalExpanded] = useState(expanded);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: unknown) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
  }, [handleFilterChange]);

  // Handle date range changes
  const handleDateRangeChange = useCallback((type: 'start' | 'end', date: string) => {
    const newDateRange = {
      ...filters.dateRange,
      [type]: new Date(date)
    };
    handleFilterChange('dateRange', newDateRange);
  }, [filters.dateRange, handleFilterChange]);

  // Handle confidence range changes
  const handleConfidenceChange = useCallback((type: 'min' | 'max', value: number) => {
    const newConfidence = {
      ...filters.confidence,
      [type]: value
    };
    handleFilterChange('confidence', newConfidence);
  }, [filters.confidence, handleFilterChange]);

  // Handle tag addition
  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim()) return;
    
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      handleFilterChange('tags', [...currentTags, tag]);
    }
    setTagInput('');
  }, [filters.tags, handleFilterChange]);

  // Handle tag removal
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const currentTags = filters.tags || [];
    handleFilterChange('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [filters.tags, handleFilterChange]);

  // Handle tag input key press
  const handleTagInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  }, [tagInput, handleAddTag]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    onToggleExpanded?.(newExpanded);
  }, [localExpanded, onToggleExpanded]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    onClearFilters?.();
  }, [onClearFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.category && filters.category !== 'all') ||
      (filters.priority && filters.priority !== 'all') ||
      (filters.classification && filters.classification !== 'all') ||
      (filters.threatLevel && filters.threatLevel !== 'all') ||
      (filters.search && filters.search.trim()) ||
      (filters.tags && filters.tags.length > 0) ||
      filters.dateRange ||
      filters.confidence
    );
  }, [filters]);

  // Compute container classes
  const containerClasses = useMemo(() => [
    styles.container,
    localExpanded && styles.expanded,
    hasActiveFilters && styles.hasActiveFilters,
    className
  ].filter(Boolean).join(' '), [localExpanded, hasActiveFilters, className]);

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Filters</h3>
          {hasActiveFilters && (
            <span className={styles.activeCount}>
              {Object.values(filters).filter(Boolean).length} active
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          {hasActiveFilters && (
            <button
              className={styles.clearButton}
              onClick={clearFilters}
              title="Clear all filters"
            >
              Clear
            </button>
          )}
          <button
            className={styles.expandButton}
            onClick={toggleExpanded}
            aria-label={localExpanded ? "Collapse filters" : "Expand filters"}
          >
            <span className={`${styles.expandIcon} ${localExpanded ? styles.expanded : ''}`}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className={styles.quickSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search reports..."
          value={filters.search || ''}
          onChange={handleSearchChange}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>

      {/* Expanded Filters */}
      {localExpanded && (
        <div className={styles.expandedFilters}>
          {/* Basic Filters */}
          <div className={styles.filterSection}>
            <h4 className={styles.sectionTitle}>Basic Filters</h4>
            
            <div className={styles.filterGrid}>
              {/* Category Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Category</label>
                <select
                  className={styles.filterSelect}
                  value={filters.category || 'all'}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Priority</label>
                <select
                  className={styles.filterSelect}
                  value={filters.priority || 'all'}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  {PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classification Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Classification</label>
                <select
                  className={styles.filterSelect}
                  value={filters.classification || 'all'}
                  onChange={(e) => handleFilterChange('classification', e.target.value)}
                >
                  {CLASSIFICATIONS.map(cls => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Threat Level Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Threat Level</label>
                <select
                  className={styles.filterSelect}
                  value={filters.threatLevel || 'all'}
                  onChange={(e) => handleFilterChange('threatLevel', e.target.value)}
                >
                  {THREAT_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tag Filters */}
          <div className={styles.filterSection}>
            <h4 className={styles.sectionTitle}>Tags</h4>
            
            <div className={styles.tagInput}>
              <input
                ref={tagInputRef}
                type="text"
                className={styles.tagInputField}
                placeholder="Add tag filter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
              />
              <button
                className={styles.tagAddButton}
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>

            {/* Available Tags */}
            {availableTags.length > 0 && (
              <div className={styles.availableTags}>
                <span className={styles.availableTagsLabel}>Available:</span>
                {availableTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    className={styles.availableTag}
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Active Tags */}
            {filters.tags && filters.tags.length > 0 && (
              <div className={styles.activeTags}>
                {filters.tags.map(tag => (
                  <div key={tag} className={styles.activeTag}>
                    <span>{tag}</span>
                    <button
                      className={styles.removeTag}
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove ${tag} filter`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className={styles.filterSection}>
              <h4 className={styles.sectionTitle}>Advanced Filters</h4>
              
              {/* Date Range */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Date Range</label>
                <div className={styles.dateRange}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  />
                  <span className={styles.dateRangeSeparator}>to</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  />
                </div>
              </div>

              {/* Confidence Range */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Confidence Range: {filters.confidence?.min || 0}% - {filters.confidence?.max || 100}%
                </label>
                <div className={styles.confidenceRange}>
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min="0"
                    max="100"
                    value={filters.confidence?.min || 0}
                    onChange={(e) => handleConfidenceChange('min', parseInt(e.target.value))}
                  />
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min="0"
                    max="100"
                    value={filters.confidence?.max || 100}
                    onChange={(e) => handleConfidenceChange('max', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advanced Toggle */}
          <div className={styles.advancedToggle}>
            <button
              className={styles.advancedToggleButton}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelFilterControls;
