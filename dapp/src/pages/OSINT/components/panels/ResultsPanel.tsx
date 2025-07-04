import React, { useState, useEffect } from 'react';
import { List, Grid, UserPlus, Globe, Filter, Link2, Save, Shield } from 'lucide-react';
import styles from './ResultsPanel.module.css';

interface ResultsPanelProps {
  data: {
    query?: string;
    filters?: Record<string, any>;
  };
  panelId: string;
}

interface ResultItem {
  id: string;
  type: 'person' | 'organization' | 'website' | 'document' | 'social' | 'wallet';
  title: string;
  subtitle: string;
  source: string;
  confidence: number;
  tags: string[];
  verified: boolean;
}

/**
 * Search Results Panel
 * 
 * Displays OSINT search results with filtering and visualization options
 */
const ResultsPanel: React.FC<ResultsPanelProps> = ({ data, panelId }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Generate mock results based on the query
  useEffect(() => {
    if (data.query) {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const mockResults: ResultItem[] = [
          {
            id: '1',
            type: 'person',
            title: 'John Anderson',
            subtitle: 'Software Developer at TechCorp',
            source: 'LinkedIn',
            confidence: 0.92,
            tags: ['tech', 'developer', 'California'],
            verified: true
          },
          {
            id: '2',
            type: 'social',
            title: '@j_anderson_dev',
            subtitle: 'Twitter account with 1,243 followers',
            source: 'Twitter',
            confidence: 0.87,
            tags: ['social media', 'tech'],
            verified: false
          },
          {
            id: '3',
            type: 'website',
            title: 'johnanderson.dev',
            subtitle: 'Personal website and blog',
            source: 'DomainTools',
            confidence: 0.95,
            tags: ['website', 'blog'],
            verified: true
          },
          {
            id: '4',
            type: 'organization',
            title: 'TechCorp International',
            subtitle: 'Employer - Software Company',
            source: 'CrunchBase',
            confidence: 0.90,
            tags: ['employer', 'tech company'],
            verified: true
          },
          {
            id: '5',
            type: 'document',
            title: 'Technical Whitepaper: Quantum Computing',
            subtitle: 'Co-authored research paper',
            source: 'Google Scholar',
            confidence: 0.78,
            tags: ['research', 'publication'],
            verified: true
          },
          {
            id: '6',
            type: 'wallet',
            title: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
            subtitle: 'Ethereum wallet with 24 transactions',
            source: 'Etherscan',
            confidence: 0.82,
            tags: ['crypto', 'ethereum'],
            verified: false
          },
          {
            id: '7',
            type: 'social',
            title: 'John A.',
            subtitle: 'GitHub profile with 31 repositories',
            source: 'GitHub',
            confidence: 0.89,
            tags: ['developer', 'open source'],
            verified: true
          }
        ];
        
        setResults(mockResults);
        setLoading(false);
      }, 1000);
    } else {
      setResults([]);
    }
  }, [data.query]);
  
  // Filter results by type
  const filteredResults = activeFilter 
    ? results.filter(result => result.type === activeFilter)
    : results;
  
  // Render result item based on view mode
  const renderResultItem = (result: ResultItem) => {
    const getIconForType = (type: string) => {
      switch (type) {
        case 'person': return <UserPlus size={16} />;
        case 'organization': return <UserPlus size={16} />;
        case 'website': return <Globe size={16} />;
        case 'document': return <FileText size={16} />;
        case 'social': return <Link2 size={16} />;
        case 'wallet': return <Shield size={16} />;
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
          <p className={styles.resultSubtitle}>{result.subtitle}</p>
          <div className={styles.resultMeta}>
            <span className={styles.resultSource}>{result.source}</span>
            <div className={styles.resultTags}>
              {result.tags.map(tag => (
                <span key={tag} className={styles.resultTag}>{tag}</span>
              ))}
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
        <p className={styles.gridItemSubtitle}>{result.subtitle}</p>
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
          >
            All
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'person' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('person')}
          >
            People
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'organization' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('organization')}
          >
            Orgs
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'website' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('website')}
          >
            Web
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'social' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('social')}
          >
            Social
          </button>
          <button 
            className={`${styles.filterButton} ${activeFilter === 'document' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('document')}
          >
            Docs
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
        {loading ? (
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
