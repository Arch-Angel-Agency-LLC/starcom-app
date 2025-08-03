/**
 * IntelSearchBar - Search component with autocomplete and suggestions
 * Provides intelligent search functionality for Intel Reports
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { IntelReport3DData } from '../../../models/Intel/IntelVisualization3D';
import styles from './IntelSearchBar.module.css';

interface IntelSearchBarProps {
  /** Current search query */
  query?: string;
  /** Available reports for search suggestions */
  reports?: IntelReport3DData[];
  /** Whether search is loading */
  loading?: boolean;
  /** Search placeholder text */
  placeholder?: string;
  /** Whether to show autocomplete suggestions */
  showSuggestions?: boolean;
  /** Maximum number of suggestions to show */
  maxSuggestions?: number;
  /** Whether to show recent searches */
  showRecentSearches?: boolean;
  /** Whether to show search categories */
  showCategories?: boolean;
  /** Callback when search query changes */
  onQueryChange?: (query: string) => void;
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Callback when search is cleared */
  onClear?: () => void;
  /** Custom CSS class */
  className?: string;
}

interface SearchSuggestion {
  id: string;
  type: 'report' | 'tag' | 'category' | 'location' | 'recent';
  text: string;
  subtitle?: string;
  metadata?: IntelReport3DData | Record<string, unknown>;
}

/**
 * Generate search suggestions from reports
 */
const generateSuggestions = (
  query: string,
  reports: IntelReport3DData[],
  maxSuggestions: number
): SearchSuggestion[] => {
  if (!query.trim() || reports.length === 0) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  // Report title suggestions
  reports.forEach(report => {
    if (report.title.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        id: `report-${report.id}`,
        type: 'report',
        text: report.title,
        subtitle: `${report.metadata.category} • ${report.source}`,
        metadata: report
      });
    }
  });

  // Tag suggestions
  const allTags = new Set<string>();
  reports.forEach(report => {
    report.metadata.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        allTags.add(tag);
      }
    });
  });

  allTags.forEach(tag => {
    suggestions.push({
      id: `tag-${tag}`,
      type: 'tag',
      text: tag,
      subtitle: 'Tag'
    });
  });

  // Category suggestions
  const categories = ['cyber_threat', 'physical_security', 'financial_crime', 'geopolitical'];
  categories.forEach(category => {
    if (category.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        id: `category-${category}`,
        type: 'category',
        text: category.replace('_', ' '),
        subtitle: 'Category'
      });
    }
  });

  // Location suggestions
  const locations = new Set<string>();
  reports.forEach(report => {
    if (report.location.region && report.location.region.toLowerCase().includes(lowerQuery)) {
      locations.add(report.location.region);
    }
  });

  locations.forEach(location => {
    suggestions.push({
      id: `location-${location}`,
      type: 'location',
      text: location,
      subtitle: 'Location'
    });
  });

  // Sort by relevance and limit
  return suggestions
    .sort((a, b) => {
      // Reports first, then tags, then categories, then locations
      const typeOrder = { report: 0, tag: 1, category: 2, location: 3, recent: 4 };
      const aOrder = typeOrder[a.type];
      const bOrder = typeOrder[b.type];
      if (aOrder !== bOrder) return aOrder - bOrder;

      // Then by how early the query appears in the text
      const aIndex = a.text.toLowerCase().indexOf(lowerQuery);
      const bIndex = b.text.toLowerCase().indexOf(lowerQuery);
      return aIndex - bIndex;
    })
    .slice(0, maxSuggestions);
};

/**
 * Get recent searches from localStorage
 */
const getRecentSearches = (): SearchSuggestion[] => {
  try {
    const stored = localStorage.getItem('intel-search-recent');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save search to recent searches
 */
const saveRecentSearch = (query: string): void => {
  if (!query.trim()) return;

  try {
    const recent = getRecentSearches();
    const newSearch: SearchSuggestion = {
      id: `recent-${Date.now()}`,
      type: 'recent',
      text: query,
      subtitle: 'Recent search'
    };

    // Remove existing duplicate and add to front
    const filtered = recent.filter(item => item.text !== query);
    const updated = [newSearch, ...filtered].slice(0, 5); // Keep only 5 recent searches

    localStorage.setItem('intel-search-recent', JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * IntelSearchBar - Advanced search component
 */
export const IntelSearchBar: React.FC<IntelSearchBarProps> = ({
  query = '',
  reports = [],
  loading = false,
  placeholder = 'Search intel reports...',
  showSuggestions = true,
  maxSuggestions = 8,
  showRecentSearches = true,
  showCategories = true,
  onQueryChange,
  onSearch,
  onSuggestionSelect,
  onClear,
  className = ''
}) => {
  const [localQuery, setLocalQuery] = useState(query);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update local query when prop changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Load recent searches on mount
  useEffect(() => {
    if (showRecentSearches) {
      setRecentSearches(getRecentSearches());
    }
  }, [showRecentSearches]);

  // Generate suggestions
  const suggestions = useMemo(() => {
    if (!showSuggestions) return [];

    const generated = generateSuggestions(localQuery, reports, maxSuggestions);
    
    // Add recent searches if query is empty
    if (!localQuery.trim() && showRecentSearches && recentSearches.length > 0) {
      return [...recentSearches.slice(0, 3), ...generated];
    }

    return generated;
  }, [localQuery, reports, maxSuggestions, showSuggestions, showRecentSearches, recentSearches]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setLocalQuery(newQuery);
    setFocusedIndex(-1);
    onQueryChange?.(newQuery);
  }, [onQueryChange]);

  // Handle search submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      saveRecentSearch(localQuery.trim());
      setRecentSearches(getRecentSearches());
      onSearch?.(localQuery.trim());
      setShowDropdown(false);
    }
  }, [localQuery, onSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setLocalQuery(suggestion.text);
    setShowDropdown(false);
    onSuggestionSelect?.(suggestion);
    
    if (suggestion.type !== 'recent') {
      saveRecentSearch(suggestion.text);
      setRecentSearches(getRecentSearches());
    }
    
    inputRef.current?.blur();
  }, [onSuggestionSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && suggestions[focusedIndex]) {
          handleSuggestionSelect(suggestions[focusedIndex]);
        } else {
          handleSubmit(e);
        }
        break;

      case 'Escape':
        setShowDropdown(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, suggestions, focusedIndex, handleSuggestionSelect, handleSubmit]);

  // Handle focus/blur
  const handleFocus = useCallback(() => {
    setShowDropdown(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Only hide dropdown if focus is not moving to a suggestion
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setTimeout(() => setShowDropdown(false), 150);
    }
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalQuery('');
    setFocusedIndex(-1);
    onQueryChange?.('');
    onClear?.();
    inputRef.current?.focus();
  }, [onQueryChange, onClear]);

  // Get suggestion icon
  const getSuggestionIcon = useCallback((type: SearchSuggestion['type']) => {
    switch (type) {
      case 'report': return '📊';
      case 'tag': return '🏷️';
      case 'category': return '📁';
      case 'location': return '📍';
      case 'recent': return '🕒';
      default: return '🔍';
    }
  }, []);

  // Compute container classes
  const containerClasses = useMemo(() => [
    styles.container,
    loading && styles.loading,
    showDropdown && styles.focused,
    className
  ].filter(Boolean).join(' '), [loading, showDropdown, className]);

  return (
    <div className={containerClasses}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={loading}
          />
          
          <div className={styles.inputIcons}>
            {loading && (
              <div className={styles.loadingSpinner} />
            )}
            
            {localQuery && !loading && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClear}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            
            <button
              type="submit"
              className={styles.searchButton}
              disabled={loading || !localQuery.trim()}
              aria-label="Search"
            >
              🔍
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={`${styles.suggestion} ${index === focusedIndex ? styles.focused : ''}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <span className={styles.suggestionIcon}>
                {getSuggestionIcon(suggestion.type)}
              </span>
              <div className={styles.suggestionContent}>
                <div className={styles.suggestionText}>
                  {suggestion.text}
                </div>
                {suggestion.subtitle && (
                  <div className={styles.suggestionSubtitle}>
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Categories (if enabled and no query) */}
      {showCategories && !localQuery && !showDropdown && (
        <div className={styles.categories}>
          <span className={styles.categoriesLabel}>Quick searches:</span>
          {['cyber_threat', 'high priority', 'classified', 'recent'].map(category => (
            <button
              key={category}
              className={styles.categoryButton}
              onClick={() => {
                setLocalQuery(category);
                onQueryChange?.(category);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default IntelSearchBar;
