/**
 * Timeline Filter Component
 * 
 * Provides UI for filtering timeline events by various criteria.
 */

import React, { useState } from 'react';
import { Calendar, Filter, Search, X, Clock, Tag, Layers, AlertCircle } from 'lucide-react';
import { TimelineFilter, TimelineEventType, TimelineEventSource, TimelineEventSeverity } from '../types/timeline';
import styles from './TimelineFilter.module.css';

interface TimelineFilterProps {
  filter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
  onApplyFilter: () => void;
  availableCategories: string[];
  availableTags?: string[];
}

const TimelineFilter: React.FC<TimelineFilterProps> = ({
  filter,
  onFilterChange,
  onApplyFilter,
  availableCategories,
  availableTags = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState(filter.search || '');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filter, search: searchText });
    onApplyFilter();
  };
  
  const handleCategoryToggle = (category: string) => {
    const categories = filter.categories || [];
    const updatedCategories = categories.includes(category)
      ? categories.filter(c => c !== category)
      : [...categories, category];
    
    onFilterChange({
      ...filter,
      categories: updatedCategories.length > 0 ? updatedCategories : undefined
    });
  };
  
  const handleTypeToggle = (type: TimelineEventType) => {
    const types = filter.types || [];
    const updatedTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type];
    
    onFilterChange({
      ...filter,
      types: updatedTypes.length > 0 ? updatedTypes : undefined
    });
  };
  
  const handleSeverityToggle = (severity: TimelineEventSeverity) => {
    const severities = filter.severities || [];
    const updatedSeverities = severities.includes(severity)
      ? severities.filter(s => s !== severity)
      : [...severities, severity];
    
    onFilterChange({
      ...filter,
      severities: updatedSeverities.length > 0 ? updatedSeverities : undefined
    });
  };
  
  const clearFilters = () => {
    onFilterChange({});
    setSearchText('');
    onApplyFilter();
  };
  
  return (
    <div className={styles.filterContainer}>
      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
        <div className={styles.searchInputContainer}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search timeline events..."
            className={styles.searchInput}
          />
          {searchText && (
            <button 
              type="button" 
              onClick={() => { setSearchText(''); onFilterChange({ ...filter, search: undefined }); }}
              className={styles.clearButton}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button type="submit" className={styles.searchButton}>Search</button>
        <button 
          type="button" 
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter size={16} />
          <span>Filters</span>
        </button>
      </form>
      
      {isExpanded && (
        <div className={styles.expandedFilters}>
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <Clock size={16} />
              <h3>Time Range</h3>
            </div>
            <div className={styles.timeRangeControls}>
              <div className={styles.dateInput}>
                <label>From</label>
                <input
                  type="date"
                  value={filter.timeRange?.start?.split('T')[0] || ''}
                  onChange={(e) => onFilterChange({
                    ...filter,
                    timeRange: {
                      ...filter.timeRange,
                      start: e.target.value ? new Date(e.target.value).toISOString() : undefined
                    }
                  })}
                />
              </div>
              <div className={styles.dateInput}>
                <label>To</label>
                <input
                  type="date"
                  value={filter.timeRange?.end?.split('T')[0] || ''}
                  onChange={(e) => onFilterChange({
                    ...filter,
                    timeRange: {
                      ...filter.timeRange,
                      end: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : undefined
                    }
                  })}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <Layers size={16} />
              <h3>Categories</h3>
            </div>
            <div className={styles.categoryTags}>
              {availableCategories.map(category => (
                <button
                  key={category}
                  className={`${styles.tag} ${filter.categories?.includes(category) ? styles.tagSelected : ''}`}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <AlertCircle size={16} />
              <h3>Severity</h3>
            </div>
            <div className={styles.severityTags}>
              {(['low', 'medium', 'high', 'critical'] as TimelineEventSeverity[]).map(severity => (
                <button
                  key={severity}
                  className={`${styles.tag} ${filter.severities?.includes(severity) ? styles.tagSelected : ''}`}
                  onClick={() => handleSeverityToggle(severity)}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <button 
              className={styles.clearFiltersButton} 
              onClick={clearFilters}
            >
              <X size={16} />
              Clear Filters
            </button>
            <button 
              className={styles.applyFiltersButton}
              onClick={onApplyFilter}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineFilter;
