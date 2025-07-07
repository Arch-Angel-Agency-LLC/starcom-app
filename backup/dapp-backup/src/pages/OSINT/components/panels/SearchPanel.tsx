import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, Clock, Loader2 } from 'lucide-react';
import styles from './SearchPanel.module.css';

// Services and hooks
import { useOSINTSearch } from '../../hooks/useOSINTSearch';

// Common components
import ErrorDisplay from '../common/ErrorDisplay';

// Types
interface SearchPanelProps {
  data: Record<string, unknown>;
  panelId: string;
  onSearch?: (query: string, filters: Record<string, unknown>, sources: string[]) => void;
}

// Search source options
const searchSources = [
  { id: 'entities', label: 'Entity Database', checked: true },
  { id: 'relationships', label: 'Relationship Network', checked: true },
  { id: 'events', label: 'Timeline Events', checked: true },
  { id: 'darkweb', label: 'Dark Web', checked: false, premium: true },
  { id: 'blockchain', label: 'Blockchain', checked: false, premium: true },
  { id: 'leaks', label: 'Data Leaks', checked: false, premium: true },
];

/**
 * Search Configuration Panel
 * 
 * Allows configuring search parameters for OSINT investigations
 */
const SearchPanel: React.FC<SearchPanelProps> = ({ data, onSearch }) => {
  // Get search functionality from hook with enhanced error handling
  const {
    query,
    setQuery,
    filters,
    setFilters,
    sources: activeSources,
    setSources: setActiveSources,
    searchHistory,
    operationLoading,
    error,
    search,
    clearError,
    retryLastOperation
  } = useOSINTSearch({
    initialQuery: typeof data.query === 'string' ? data.query : '',
    initialFilters: typeof data.filters === 'object' && data.filters ? data.filters as Record<string, unknown> : {},
    initialSources: Array.isArray(data.sources) ? data.sources as string[] : []
  });

  // State management
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sources, setSources] = useState(searchSources);
  const [timeRange, setTimeRange] = useState('all');
  const [excludeTerms, setExcludeTerms] = useState('');
  const [includeTerms, setIncludeTerms] = useState('');
  const [savedSearchName, setSavedSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Update sources when changes are made
  useEffect(() => {
    const selectedSourceIds = sources
      .filter(source => source.checked)
      .map(source => source.id);
    
    setActiveSources(selectedSourceIds);
  }, [sources, setActiveSources]);

  // Toggle source selection
  const handleSourceToggle = (sourceId: string) => {
    setSources(sources.map(source => 
      source.id === sourceId ? { ...source, checked: !source.checked } : source
    ));
  };

  // Handle search execution
  const handleSearch = () => {
    // Compile filters
    const searchFilters: Record<string, unknown> = {};
    
    // Add time range
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date | undefined;
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        searchFilters.timeRange = {
          start: startDate.toISOString(),
          end: now.toISOString()
        };
      }
    }
    
    // Add include/exclude terms
    if (includeTerms) {
      searchFilters.includeTerms = includeTerms.split(',').map(term => term.trim());
    }
    
    if (excludeTerms) {
      searchFilters.excludeTerms = excludeTerms.split(',').map(term => term.trim());
    }
    
    // Update filters
    setFilters(searchFilters);
    
    // Execute search
    search();
    
    // Notify parent component
    if (onSearch) {
      onSearch(query, searchFilters, activeSources);
    }
  };

  // Save current search
  const handleSaveSearch = () => {
    if (!savedSearchName.trim()) return;
    
    // This would typically save to a database or local storage
    console.log('Saving search:', {
      name: savedSearchName,
      query,
      filters,
      sources: activeSources
    });
    
    setShowSaveDialog(false);
    setSavedSearchName('');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Search Configuration</h3>
      </div>
      
      {/* Error display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={retryLastOperation} 
          onDismiss={clearError} 
        />
      )}
      
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Enter search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={operationLoading['search']}
          />
          {operationLoading['search'] ? (
            <button className={`${styles.searchButton} ${styles.loading}`} disabled>
              <Loader2 className={styles.spinnerIcon} />
            </button>
          ) : (
            <button 
              className={styles.searchButton} 
              onClick={handleSearch}
              disabled={!query.trim()}
            >
              <Search size={18} />
              <span>Search</span>
            </button>
          )}
        </div>
        
        <div className={styles.searchControls}>
          <button 
            className={`${styles.iconButton} ${advancedOpen ? styles.active : ''}`}
            onClick={() => setAdvancedOpen(!advancedOpen)}
            title="Advanced filters"
          >
            <Filter size={16} />
          </button>
          <button 
            className={styles.iconButton}
            onClick={() => setShowSaveDialog(true)}
            title="Save search"
            disabled={!query.trim()}
          >
            <Save size={16} />
          </button>
        </div>
      </div>
      
      {advancedOpen && (
        <div className={styles.advancedOptions}>
          <div className={styles.optionSection}>
            <h4>Time Range</h4>
            <div className={styles.optionControls}>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Time</option>
                <option value="day">Past 24 Hours</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
          
          <div className={styles.optionSection}>
            <h4>Include Terms</h4>
            <div className={styles.optionControls}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Comma-separated terms to include"
                value={includeTerms}
                onChange={(e) => setIncludeTerms(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.optionSection}>
            <h4>Exclude Terms</h4>
            <div className={styles.optionControls}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Comma-separated terms to exclude"
                value={excludeTerms}
                onChange={(e) => setExcludeTerms(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.optionSection}>
            <h4>Data Sources</h4>
            <div className={styles.sourceList}>
              {sources.map(source => (
                <div key={source.id} className={styles.sourceItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={source.checked}
                      onChange={() => handleSourceToggle(source.id)}
                    />
                    <span>{source.label}</span>
                    {source.premium && <span className={styles.premiumBadge}>Premium</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {searchHistory.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historySectionHeader}>
            <h4><Clock size={14} /> Recent Searches</h4>
          </div>
          <div className={styles.historyList}>
            {searchHistory.map((item, index) => (
              <div 
                key={index} 
                className={styles.historyItem}
                onClick={() => {
                  setQuery(item);
                  handleSearch();
                }}
              >
                <Search size={12} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showSaveDialog && (
        <div className={styles.saveDialog}>
          <div className={styles.saveDialogHeader}>
            <h4>Save Search</h4>
            <button 
              className={styles.closeButton}
              onClick={() => setShowSaveDialog(false)}
            >
              &times;
            </button>
          </div>
          <div className={styles.saveDialogContent}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Enter a name for this search"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
            />
            <button 
              className={styles.primaryButton}
              onClick={handleSaveSearch}
              disabled={!savedSearchName.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
