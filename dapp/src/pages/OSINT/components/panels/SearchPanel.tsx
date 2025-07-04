import React, { useState } from 'react';
import { Search, Filter, Save, Clock } from 'lucide-react';
import styles from './SearchPanel.module.css';

// Types
interface SearchPanelProps {
  data: Record<string, any>;
  panelId: string;
}

// Search source options
const searchSources = [
  { id: 'social', label: 'Social Media', checked: true },
  { id: 'publicRecords', label: 'Public Records', checked: true },
  { id: 'news', label: 'News & Articles', checked: true },
  { id: 'darkweb', label: 'Dark Web', checked: false, premium: true },
  { id: 'blockchain', label: 'Blockchain', checked: false, premium: true },
  { id: 'leaks', label: 'Data Leaks', checked: false, premium: true },
];

/**
 * Search Configuration Panel
 * 
 * Allows configuring search parameters for OSINT investigations
 */
const SearchPanel: React.FC<SearchPanelProps> = ({ data, panelId }) => {
  // State management
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sources, setSources] = useState(searchSources);
  const [timeRange, setTimeRange] = useState('all');
  const [excludeTerms, setExcludeTerms] = useState('');
  const [includeTerms, setIncludeTerms] = useState('');
  const [savedSearches] = useState([
    { id: '1', name: 'Standard OSINT Profile', query: 'name email phone social' },
    { id: '2', name: 'Deep Financial Analysis', query: 'wallet transactions associates' },
    { id: '3', name: 'Digital Footprint', query: 'username email domains' },
  ]);

  // Toggle source selection
  const handleSourceToggle = (sourceId: string) => {
    setSources(sources.map(source => 
      source.id === sourceId ? { ...source, checked: !source.checked } : source
    ));
  };

  return (
    <div className={styles.searchPanel}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Search Sources</h4>
        <div className={styles.sourcesGrid}>
          {sources.map(source => (
            <div key={source.id} className={styles.sourceItem}>
              <label className={`${styles.sourceLabel} ${source.premium ? styles.premiumSource : ''}`}>
                <input
                  type="checkbox"
                  checked={source.checked}
                  onChange={() => handleSourceToggle(source.id)}
                  className={styles.sourceCheckbox}
                />
                <span className={styles.sourceName}>{source.label}</span>
                {source.premium && <span className={styles.premiumBadge}>PRO</span>}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button 
          className={styles.advancedToggle}
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          <Filter size={14} />
          <span>Advanced Filters</span>
          <span className={styles.toggleIcon}>{advancedOpen ? '−' : '+'}</span>
        </button>
        
        {advancedOpen && (
          <div className={styles.advancedFilters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Time Range:</label>
              <select 
                className={styles.filterSelect}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="day">Past 24 Hours</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Must Include:</label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Required terms (comma separated)"
                value={includeTerms}
                onChange={(e) => setIncludeTerms(e.target.value)}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Exclude:</label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Excluded terms (comma separated)"
                value={excludeTerms}
                onChange={(e) => setExcludeTerms(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Clock size={14} />
          <span>Saved Searches</span>
        </h4>
        <div className={styles.savedSearches}>
          {savedSearches.map(search => (
            <div key={search.id} className={styles.savedSearch}>
              <span className={styles.savedSearchName}>{search.name}</span>
              <div className={styles.savedSearchActions}>
                <button className={styles.iconButton} title="Load search">
                  <Search size={14} />
                </button>
              </div>
            </div>
          ))}
          <button className={styles.saveButton}>
            <Save size={14} />
            <span>Save Current Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
