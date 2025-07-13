import React, { useState, useRef, useEffect } from 'react';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import WalletStatusMini from '../Auth/WalletStatusMini';
import styles from './GlobalHeader.module.css';

const wingCommanderLogo = '/assets/images/WingCommanderLogo-288x162.gif';

interface GlobalHeaderProps {
  hasNotifications?: boolean;
}

// Simple search result type for demo
interface SearchResult {
  id: string;
  type: 'app' | 'case' | 'report' | 'entity' | 'command';
  title: string;
  description: string;
  action?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  hasNotifications = false
}) => {
  const { navigateToApp } = useEnhancedApplicationRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Example notification data
  const notifications = [
    { id: 1, type: 'alert', message: 'New security vulnerability detected', time: '2 hours ago' },
    { id: 2, type: 'info', message: 'System update completed successfully', time: '5 hours ago' },
    { id: 3, type: 'message', message: 'New message from Team Alpha', time: 'Yesterday' },
  ];
  
  // Mock search results for demo - using Enhanced Application Router
  const mockSearchResults: SearchResult[] = [
    { 
      id: 'cybercommand', 
      type: 'app', 
      title: 'CyberCommand Globe', 
      description: 'Global threat visualization interface',
      action: () => navigateToApp('cybercommand')
    },
    { 
      id: 'netrunner', 
      type: 'app', 
      title: 'NetRunner', 
      description: 'Advanced intelligence gathering tools',
      action: () => navigateToApp('netrunner')
    },
    { 
      id: 'intelanalyzer', 
      type: 'app', 
      title: 'IntelAnalyzer', 
      description: 'Intelligence analysis and reporting',
      action: () => navigateToApp('intelanalyzer')
    },
    { 
      id: 'case-123', 
      type: 'case', 
      title: 'Operation Firewall', 
      description: 'Active investigation: Network breach',
      action: () => navigateToApp('teamworkspace') // Navigate to team workspace for case management
    },
    { 
      id: 'cmd-search', 
      type: 'command', 
      title: '/search', 
      description: 'Search across all data sources',
      action: () => console.log('Advanced search command')
    }
  ];
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      // Filter mock results based on query
      const filtered = mockSearchResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) || 
        result.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };
  
  // Simple settings handler for future implementation
  const handleOpenSettings = () => {
    console.log('Settings clicked - placeholder for future settings implementation');
    // TODO: Implement general application settings
  };
  
  // Close search when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
      setShowSearch(false);
    }
  };
  
  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
  // Add click outside listener
  useEffect(() => {
    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);
  
  // Keyboard shortcut for search (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Slash key opens search
      if (e.key === '/' && !showSearch && 
          !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Escape key closes search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearch]);
  
  return (
    <header className={styles.globalHeader}>
      <div className={styles.logoSection}>
        <img 
          src={wingCommanderLogo} 
          alt="Wing Commander Logo" 
          className={styles.wingCommanderLogo} 
        />
        <div className={styles.textLogo}>
          <div className={styles.logo}>STARCOM</div>
          <div className={styles.version}>Earth Alliance</div>
        </div>
      </div>
      
      <div className={styles.searchSection}>
        <div className={styles.searchBar} onClick={() => setShowSearch(true)}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search or use commands..."
            className={styles.searchInput}
            aria-label="Global search"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSearch(true)}
          />
          <div className={styles.searchHint}>Press / to focus</div>
          
          {showSearch && searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(result => (
                <div 
                  key={result.id} 
                  className={styles.searchResultItem}
                  onClick={() => {
                    if (result.action) result.action();
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                >
                  <div className={styles.searchResultIcon}>
                    {result.type === 'app' ? '🖥️' : 
                     result.type === 'case' ? '📁' : 
                     result.type === 'report' ? '📊' : 
                     result.type === 'entity' ? '👤' : '⌨️'}
                  </div>
                  <div className={styles.searchResultContent}>
                    <div className={styles.searchResultTitle}>{result.title}</div>
                    <div className={styles.searchResultDescription}>{result.description}</div>
                  </div>
                  <div className={styles.searchResultType}>{result.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.actionsSection}>
        <button 
          className={`${styles.iconButton} ${hasNotifications ? styles.hasNotifications : ''}`}
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label={`Notifications ${hasNotifications ? '(new)' : ''}`}
        >
          🔔
          {hasNotifications && <span className={styles.notificationDot}></span>}
        </button>
        
        {showNotifications && (
          <div className={styles.notificationsPanel}>
            <div className={styles.notificationsHeader}>
              <h3>Notifications</h3>
              <button className={styles.clearButton}>Clear All</button>
            </div>
            <div className={styles.notificationsList}>
              {notifications.map(note => (
                <div key={note.id} className={styles.notificationItem}>
                  <div className={styles.notificationIcon}>
                    {note.type === 'alert' ? '🚨' : note.type === 'info' ? 'ℹ️' : '✉️'}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationMessage}>{note.message}</div>
                    <div className={styles.notificationTime}>{note.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          className={styles.iconButton}
          onClick={handleOpenSettings}
          aria-label="Settings"
        >
          ⚙️
        </button>
        
        <div className={styles.walletSection}>
          <WalletStatusMini />
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
