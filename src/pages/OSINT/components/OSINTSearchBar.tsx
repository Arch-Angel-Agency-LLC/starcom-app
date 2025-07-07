import React, { useState } from 'react';
import { Search, User, Building, Wallet, MapPin, Filter } from 'lucide-react';
import styles from './OSINTSearchBar.module.css';

export interface OSINTSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

/**
 * Universal search component for OSINT investigations
 * Allows searching across multiple data sources with filters
 */
export const OSINTSearchBar: React.FC<OSINTSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  className = '',
}) => {
  const [searchType, setSearchType] = useState<'all' | 'person' | 'organization' | 'wallet' | 'location'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search type icons mapping
  const searchTypeIcons = {
    all: Search,
    person: User,
    organization: Building,
    wallet: Wallet,
    location: MapPin
  };
  
  // Current search type icon
  const SearchTypeIcon = searchTypeIcons[searchType];
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && value.trim()) {
      onSearch(value);
    }
  };
  
  // Toggle search filters
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  // Change search type
  const handleSearchTypeChange = (type: 'all' | 'person' | 'organization' | 'wallet' | 'location') => {
    setSearchType(type);
  };

  return (
    <div className={`${styles.searchBarContainer} ${className}`}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.searchBar}>
          <button
            type="button"
            className={styles.searchTypeButton}
            onClick={toggleFilters}
            aria-label={`Current search type: ${searchType}`}
          >
            <SearchTypeIcon className={styles.searchTypeIcon} />
          </button>
          
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.searchInput}
            placeholder="Search across all intelligence sources..."
            aria-label="Search OSINT sources"
          />
          
          <button
            type="button"
            className={styles.filterButton}
            onClick={toggleFilters}
            aria-label="Toggle search filters"
          >
            <Filter className={styles.filterIcon} />
          </button>
          
          <button
            type="submit"
            className={styles.searchButton}
            aria-label="Execute search"
          >
            <Search className={styles.searchIcon} />
          </button>
        </div>
        
        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.searchTypes}>
              <button
                type="button"
                className={`${styles.typeButton} ${searchType === 'all' ? styles.activeType : ''}`}
                onClick={() => handleSearchTypeChange('all')}
              >
                <Search className={styles.typeIcon} />
                <span>All</span>
              </button>
              <button
                type="button"
                className={`${styles.typeButton} ${searchType === 'person' ? styles.activeType : ''}`}
                onClick={() => handleSearchTypeChange('person')}
              >
                <User className={styles.typeIcon} />
                <span>Person</span>
              </button>
              <button
                type="button"
                className={`${styles.typeButton} ${searchType === 'organization' ? styles.activeType : ''}`}
                onClick={() => handleSearchTypeChange('organization')}
              >
                <Building className={styles.typeIcon} />
                <span>Organization</span>
              </button>
              <button
                type="button"
                className={`${styles.typeButton} ${searchType === 'wallet' ? styles.activeType : ''}`}
                onClick={() => handleSearchTypeChange('wallet')}
              >
                <Wallet className={styles.typeIcon} />
                <span>Wallet</span>
              </button>
              <button
                type="button"
                className={`${styles.typeButton} ${searchType === 'location' ? styles.activeType : ''}`}
                onClick={() => handleSearchTypeChange('location')}
              >
                <MapPin className={styles.typeIcon} />
                <span>Location</span>
              </button>
            </div>
            
            <div className={styles.advancedFilters}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Sources</label>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" defaultChecked />
                    <span>Public Records</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" defaultChecked />
                    <span>Social Media</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" defaultChecked />
                    <span>Blockchain</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" />
                    <span>Dark Web</span>
                  </label>
                </div>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Time Range</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    aria-label="From date"
                  />
                  <span className={styles.rangeSeparator}>to</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    aria-label="To date"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default OSINTSearchBar;
