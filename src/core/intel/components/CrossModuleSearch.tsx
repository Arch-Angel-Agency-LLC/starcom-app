/**
 * CrossModuleSearch Component
 * 
 * This component provides a unified search interface across all modules
 * integrated with IntelDataCore. It demonstrates how data from different
 * modules can be queried, displayed, and linked together.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNetRunnerData } from '../hooks/useNetRunnerData';
import { useAnalyzerData } from '../hooks/useAnalyzerData';
import { useCaseManager } from '../hooks/useCaseManager';
import { fullTextSearchManager } from '../storage/fullTextSearchManager';
import { ClassificationLevel } from '../types/intelDataModels';

// Define result types for different modules
type SearchResultType = 
  | 'network_node' 
  | 'network_edge' 
  | 'analysis' 
  | 'case' 
  | 'timeline';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  classification: ClassificationLevel;
  createdAt: string;
  updatedAt: string;
  score: number;
  highlight?: string;
  metadata?: Record<string, any>;
}

interface CrossModuleSearchProps {
  initialQuery?: string;
  onResultSelect?: (result: SearchResult) => void;
}

export const CrossModuleSearch: React.FC<CrossModuleSearchProps> = ({ 
  initialQuery = '',
  onResultSelect
}) => {
  // State for search
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<SearchResultType[]>([]);
  
  // Get data from all modules
  const { networkData } = useNetRunnerData();
  const { analyses } = useAnalyzerData();
  const { cases } = useCaseManager();
  
  // Filter options
  const filterOptions = useMemo(() => [
    { value: 'network_node', label: 'Network Nodes' },
    { value: 'network_edge', label: 'Network Edges' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'case', label: 'Cases' },
    { value: 'timeline', label: 'Timeline' }
  ], []);
  
  /**
   * Perform search across all modules
   */
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Use fullTextSearchManager for main search
      const searchResults = await fullTextSearchManager.search(query, {
        limit: 100,
        highlightMatches: true
      });
      
      // Process results into unified format
      const unifiedResults: SearchResult[] = [];
      
      // Process search results
      for (const result of searchResults) {
        const entity = result.entity;
        let type: SearchResultType;
        
        // Determine the type of entity
        if (entity.type === 'node_entity') {
          type = 'network_node';
        } else if (entity.type.startsWith('edge_')) {
          type = 'network_edge';
        } else if (entity.type === 'analysis_entity') {
          type = 'analysis';
        } else if (entity.type === 'case_record') {
          type = 'case';
        } else if (entity.type === 'timeline_event') {
          type = 'timeline';
        } else {
          // Skip unknown types
          continue;
        }
        
        // Skip if this type is filtered out
        if (activeFilters.length > 0 && !activeFilters.includes(type)) {
          continue;
        }
        
        // Get title based on entity type
        let title = entity.title || '';
        if (type === 'network_node') {
          title = entity.label || entity.title || 'Unnamed Node';
        } else if (type === 'network_edge') {
          title = entity.label || 'Unnamed Connection';
        } else if (type === 'case') {
          title = `Case #${entity.caseNumber}: ${entity.title}`;
        }
        
        unifiedResults.push({
          id: entity.id,
          type,
          title,
          description: entity.description || '',
          classification: entity.classification,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          score: result.score,
          highlight: result.highlight,
          metadata: entity.metadata
        });
      }
      
      // Sort by score
      unifiedResults.sort((a, b) => b.score - a.score);
      
      setResults(unifiedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      console.error('Error during cross-module search:', err);
    } finally {
      setLoading(false);
    }
  }, [query, activeFilters]);
  
  // Perform search when query or filters change
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      performSearch();
    }, 300); // Debounce search
    
    return () => clearTimeout(searchTimer);
  }, [query, activeFilters, performSearch]);
  
  /**
   * Handle filter change
   */
  const handleFilterChange = (type: SearchResultType) => {
    setActiveFilters(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  /**
   * Handle result selection
   */
  const handleResultSelect = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
  };
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setActiveFilters([]);
  };
  
  /**
   * Get icon for result type
   */
  const getIconForType = (type: SearchResultType) => {
    switch (type) {
      case 'network_node':
        return '🔵';
      case 'network_edge':
        return '↔️';
      case 'analysis':
        return '🔍';
      case 'case':
        return '📁';
      case 'timeline':
        return '⏱️';
      default:
        return '📄';
    }
  };
  
  /**
   * Get color for classification level
   */
  const getClassificationColor = (classification: ClassificationLevel) => {
    switch (classification) {
      case ClassificationLevel.TOP_SECRET:
        return 'rgba(255, 0, 0, 0.15)';
      case ClassificationLevel.SECRET:
        return 'rgba(255, 165, 0, 0.15)';
      case ClassificationLevel.CONFIDENTIAL:
        return 'rgba(255, 255, 0, 0.15)';
      case ClassificationLevel.RESTRICTED:
        return 'rgba(0, 0, 255, 0.15)';
      case ClassificationLevel.UNCLASSIFIED:
      default:
        return 'transparent';
    }
  };
  
  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="cross-module-search">
      <div className="search-header">
        <h2>Cross-Module Search</h2>
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search across all modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            className="search-button"
            onClick={performSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="search-filters">
          <span>Filter by: </span>
          {filterOptions.map(filter => (
            <label key={filter.value} className="filter-label">
              <input
                type="checkbox"
                checked={activeFilters.includes(filter.value as SearchResultType)}
                onChange={() => handleFilterChange(filter.value as SearchResultType)}
              />
              {filter.label}
            </label>
          ))}
          {activeFilters.length > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <div className="search-results">
        <h3>Results ({results.length})</h3>
        
        {results.length === 0 && !loading && query.trim() !== '' && (
          <div className="no-results">
            No results found for "{query}".
          </div>
        )}
        
        {results.map(result => (
          <div 
            key={`${result.type}_${result.id}`}
            className="search-result-item"
            style={{ backgroundColor: getClassificationColor(result.classification) }}
            onClick={() => handleResultSelect(result)}
          >
            <div className="result-header">
              <span className="result-type-icon">{getIconForType(result.type)}</span>
              <span className="result-title">{result.title}</span>
              <span className="result-classification">{ClassificationLevel[result.classification]}</span>
            </div>
            
            {result.highlight && (
              <div 
                className="result-highlight"
                dangerouslySetInnerHTML={{ __html: result.highlight }}
              />
            )}
            
            {!result.highlight && result.description && (
              <div className="result-description">
                {result.description.length > 150 
                  ? `${result.description.substring(0, 150)}...` 
                  : result.description}
              </div>
            )}
            
            <div className="result-metadata">
              <span className="result-date">
                Updated: {formatDate(result.updatedAt)}
              </span>
              <span className="result-score">
                Relevance: {Math.round(result.score * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .cross-module-search {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
        }
        
        .search-header {
          margin-bottom: 20px;
        }
        
        .search-input-container {
          display: flex;
          margin-bottom: 10px;
        }
        
        .search-input {
          flex: 1;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 4px 0 0 4px;
        }
        
        .search-button {
          padding: 10px 20px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
        }
        
        .search-button:disabled {
          background-color: #cccccc;
        }
        
        .search-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        
        .filter-label {
          display: flex;
          align-items: center;
          margin-right: 10px;
          cursor: pointer;
        }
        
        .filter-label input {
          margin-right: 5px;
        }
        
        .clear-filters {
          background: none;
          border: none;
          color: #0066cc;
          cursor: pointer;
          text-decoration: underline;
        }
        
        .error-message {
          padding: 10px;
          background-color: #ffeeee;
          color: #cc0000;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .search-results {
          margin-top: 20px;
        }
        
        .no-results {
          padding: 20px;
          text-align: center;
          color: #666;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        
        .search-result-item {
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #eee;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .search-result-item:hover {
          background-color: #f9f9f9;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .result-type-icon {
          font-size: 20px;
          margin-right: 10px;
        }
        
        .result-title {
          font-weight: bold;
          flex: 1;
        }
        
        .result-classification {
          font-size: 12px;
          padding: 2px 6px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
        
        .result-highlight {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .result-highlight em {
          background-color: rgba(255, 255, 0, 0.3);
          font-style: normal;
          padding: 0 2px;
        }
        
        .result-description {
          margin-bottom: 8px;
          font-size: 14px;
          color: #555;
        }
        
        .result-metadata {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #777;
        }
      `}</style>
    </div>
  );
};

export default CrossModuleSearch;
