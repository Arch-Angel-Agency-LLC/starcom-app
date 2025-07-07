import React, { useState, useEffect } from 'react';
import { List, Grid, UserPlus, Globe, Filter, Link2, Save, FileText } from 'lucide-react';
import styles from './ResultsPanel.module.css';

// Services and hooks
import { useOSINTSearch } from '../../hooks/useOSINTSearch';
import { SearchResult } from '../../types/osint';
import ErrorDisplay from '../common/ErrorDisplay';

interface ResultsPanelProps {
  data: {
    query?: string;
    filters?: Record<string, unknown>;
    sources?: string[];
  };
  panelId: string;
}

/**
 * Search Results Panel
 * 
 * Displays OSINT search results with filtering and visualization options
 */
const ResultsPanel: React.FC<ResultsPanelProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get search functionality from hook
  const {
    query,
    setQuery,
    filters,
    setFilters,
    sources,
    setSources,
    results,
    search,
    loading: searchLoading,
    error,
    clearError,
    retryLastOperation
  } = useOSINTSearch({
    initialQuery: data.query || '',
    initialFilters: data.filters || {},
    initialSources: data.sources || []
  });
  
  // Update local loading state from hook
  useEffect(() => {
    setLoading(searchLoading);
  }, [searchLoading]);
  
  // Search when query or filters change
  useEffect(() => {
    if (data.query && data.query !== query) {
      setQuery(data.query);
    }
    
    if (data.filters && JSON.stringify(data.filters) !== JSON.stringify(filters)) {
      setFilters(data.filters);
    }
    
    if (data.sources && JSON.stringify(data.sources) !== JSON.stringify(sources)) {
      setSources(data.sources);
    }
  }, [data.query, data.filters, data.sources, query, filters, sources, setQuery, setFilters, setSources]);
  
  // Execute search when necessary
  useEffect(() => {
    if (query) {
      search();
    }
  }, [query, filters, sources, search]);
  
  // Filter results by type
  const filteredResults = activeFilter 
    ? results.filter(result => result.type === activeFilter)
    : results;
  
  // Get type counts for filtering
  const typeCounts = results.reduce((acc, result) => {
    acc[result.type] = (acc[result.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get tooltip text for each filter button
  const getFilterTooltip = (type: string): string => {
    const count = typeCounts[type] || 0;
    return `${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`;
  };
  
  // Render result item based on view mode
  const renderResultItem = (result: SearchResult) => {
    const getIconForType = (type: string) => {
      switch (type) {
        case 'entity': return <UserPlus size={16} />;
        case 'relationship': return <Link2 size={16} />;
        case 'event': return <FileText size={16} />;
        case 'document': return <FileText size={16} />;
        case 'media': return <Globe size={16} />;
        default: return <Globe size={16} />;
      }
    };
    
    return viewMode === 'list' ? (
      <div className={styles.resultItem} key={result.id}>
        <div className={styles.resultIcon}>
          {getIconForType(result.type)}
        </div>
        <div className={styles.resultContent}>
          <div className={styles.resultHeader}>
            <h4 className={styles.resultTitle}>{result.title}</h4>
            <span className={styles.resultConfidence}>
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
          <p className={styles.resultSubtitle}>{result.snippet}</p>
          <div className={styles.resultMeta}>
            <span className={styles.resultSource}>{result.source}</span>
            <div className={styles.resultTags}>
              {result.metadata.tags && Array.isArray(result.metadata.tags) && 
                (result.metadata.tags as string[]).map(tag => (
                  <span key={tag} className={styles.resultTag}>{tag}</span>
                ))
              }
            </div>
          </div>
        </div>
        <div className={styles.resultActions}>
          <button className={styles.actionButton} title="Add to investigation">
            <UserPlus size={14} />
          </button>
          <button className={styles.actionButton} title="Save result">
            <Save size={14} />
          </button>
        </div>
      </div>
    ) : (
      <div className={styles.gridItem} key={result.id}>
        <div className={styles.gridItemHeader}>
          <div className={styles.resultIcon}>
            {getIconForType(result.type)}
          </div>
          <span className={styles.resultConfidence}>
            {Math.round(result.confidence * 100)}%
          </span>
        </div>
        <h4 className={styles.gridItemTitle}>{result.title}</h4>
        <p className={styles.gridItemSubtitle}>{result.snippet}</p>
        <span className={styles.gridItemSource}>{result.source}</span>
        <div className={styles.gridItemActions}>
          <button className={styles.actionButton} title="Add to investigation">
            <UserPlus size={14} />
          </button>
          <button className={styles.actionButton} title="Save result">
            <Save size={14} />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.resultsPanel}>
      <div className={styles.toolbar}>
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={16} />
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.activeView : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={16} />
          </button>
        </div>
        
        <div className={styles.filters}>
          <button 
            className={`${styles.filterButton} ${activeFilter === null ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter(null)}
            title="Show all results"
          >
            All ({results.length})
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'person' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('person')}
            title={getFilterTooltip('person')}
          >
            People {typeCounts['person'] ? `(${typeCounts['person']})` : ''}
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'organization' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('organization')}
            title={getFilterTooltip('organization')}
          >
            Orgs {typeCounts['organization'] ? `(${typeCounts['organization']})` : ''}
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'website' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('website')}
            title={getFilterTooltip('website')}
          >
            Web {typeCounts['website'] ? `(${typeCounts['website']})` : ''}
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'social' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('social')}
            title={getFilterTooltip('social')}
          >
            Social {typeCounts['social'] ? `(${typeCounts['social']})` : ''}
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'document' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('document')}
            title={getFilterTooltip('document')}
          >
            Docs {typeCounts['document'] ? `(${typeCounts['document']})` : ''}
          </button>
          <button
            className={styles.moreFiltersButton}
            title="More filters"
          >
            <Filter size={14} />
          </button>
        </div>
      </div>
      
      <div className={styles.resultsContainer}>
        {error ? (
          <div className={styles.errorWrapper}>
            <ErrorDisplay 
              error={error}
              onRetry={retryLastOperation}
              onDismiss={clearError}
            />
          </div>
        ) : loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Searching intelligence sources...</p>
          </div>
        ) : data.query ? (
          <>
            <div className={styles.resultsHeader}>
              <h3 className={styles.resultsTitle}>
                Results for "{data.query}"
              </h3>
              <span className={styles.resultsCount}>
                {filteredResults.length} results
              </span>
            </div>
            
            <div className={viewMode === 'list' ? styles.resultsList : styles.resultsGrid}>
              {filteredResults.length > 0 ? (
                filteredResults.map(renderResultItem)
              ) : (
                <div className={styles.noResults}>
                  <p>No results found matching the current filters.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.noQuery}>
            <p>Enter a search query to see results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
