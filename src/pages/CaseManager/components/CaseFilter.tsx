/**
 * CaseFilter Component
 * 
 * Provides UI for filtering cases by various criteria.
 */

import React, { useState } from 'react';
import { Filter, Search, X, Calendar, Tag, AlertCircle, ShieldAlert, User } from 'lucide-react';
import { CaseFilter, CaseStatus, CasePriority, ClassificationLevel } from '../types/cases';
import styles from './CaseFilter.module.css';

interface CaseFilterProps {
  filter: CaseFilter;
  onFilterChange: (filter: CaseFilter) => void;
  onApplyFilter: () => void;
  availableTags: string[];
}

const CaseFilterComponent: React.FC<CaseFilterProps> = ({
  filter,
  onFilterChange,
  onApplyFilter,
  availableTags
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
  
  const handleStatusToggle = (status: CaseStatus) => {
    const statuses = filter.status || [];
    const updatedStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status];
    
    onFilterChange({
      ...filter,
      status: updatedStatuses.length > 0 ? updatedStatuses : undefined
    });
  };
  
  const handlePriorityToggle = (priority: CasePriority) => {
    const priorities = filter.priority || [];
    const updatedPriorities = priorities.includes(priority)
      ? priorities.filter(p => p !== priority)
      : [...priorities, priority];
    
    onFilterChange({
      ...filter,
      priority: updatedPriorities.length > 0 ? updatedPriorities : undefined
    });
  };
  
  const handleClassificationToggle = (classification: ClassificationLevel) => {
    const classifications = filter.classification || [];
    const updatedClassifications = classifications.includes(classification)
      ? classifications.filter(c => c !== classification)
      : [...classifications, classification];
    
    onFilterChange({
      ...filter,
      classification: updatedClassifications.length > 0 ? updatedClassifications : undefined
    });
  };
  
  const handleTagToggle = (tag: string) => {
    const tags = filter.tags || [];
    const updatedTags = tags.includes(tag)
      ? tags.filter(t => t !== tag)
      : [...tags, tag];
    
    onFilterChange({
      ...filter,
      tags: updatedTags.length > 0 ? updatedTags : undefined
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
            placeholder="Search cases..."
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
              <Calendar size={16} />
              <h3>Date Range</h3>
            </div>
            <div className={styles.dateRangeControls}>
              <div className={styles.dateInput}>
                <label>From</label>
                <input
                  type="date"
                  value={filter.dateRange?.start?.split('T')[0] || ''}
                  onChange={(e) => onFilterChange({
                    ...filter,
                    dateRange: {
                      ...filter.dateRange,
                      start: e.target.value ? new Date(e.target.value).toISOString() : undefined
                    }
                  })}
                />
              </div>
              <div className={styles.dateInput}>
                <label>To</label>
                <input
                  type="date"
                  value={filter.dateRange?.end?.split('T')[0] || ''}
                  onChange={(e) => onFilterChange({
                    ...filter,
                    dateRange: {
                      ...filter.dateRange,
                      end: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : undefined
                    }
                  })}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <AlertCircle size={16} />
              <h3>Status</h3>
            </div>
            <div className={styles.statusTags}>
              {(['active', 'pending', 'closed', 'archived'] as CaseStatus[]).map(status => (
                <button
                  key={status}
                  className={`${styles.tag} ${filter.status?.includes(status) ? styles.tagSelected : ''}`}
                  onClick={() => handleStatusToggle(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <User size={16} />
              <h3>Priority</h3>
            </div>
            <div className={styles.priorityTags}>
              {(['low', 'medium', 'high', 'critical'] as CasePriority[]).map(priority => (
                <button
                  key={priority}
                  className={`${styles.tag} ${filter.priority?.includes(priority) ? styles.tagSelected : ''}`}
                  onClick={() => handlePriorityToggle(priority)}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <ShieldAlert size={16} />
              <h3>Classification</h3>
            </div>
            <div className={styles.classificationTags}>
              {(['unclassified', 'restricted', 'confidential', 'secret', 'top-secret'] as ClassificationLevel[]).map(classification => (
                <button
                  key={classification}
                  className={`${styles.tag} ${filter.classification?.includes(classification) ? styles.tagSelected : ''}`}
                  onClick={() => handleClassificationToggle(classification)}
                >
                  {classification}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <Tag size={16} />
              <h3>Tags</h3>
            </div>
            <div className={styles.tagsList}>
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tag} ${filter.tags?.includes(tag) ? styles.tagSelected : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
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

export default CaseFilterComponent;
