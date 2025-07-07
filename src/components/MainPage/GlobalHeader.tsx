import React, { useState, useRef, useEffect } from 'react';
import { useView } from '../../context/useView';
import styles from './GlobalHeader.module.css';

interface GlobalHeaderProps {
  hasNotifications?: boolean;
  teamName?: string;
  userAvatar?: string;
}

// Simple search result type for demo
interface SearchResult {
  id: string;
  type: 'screen' | 'case' | 'report' | 'entity' | 'command';
  title: string;
  description: string;
  action?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  hasNotifications = false,
  teamName = 'Personal Workspace',
  userAvatar
}) => {
  const { navigateToScreen, navigateToPage } = useView();
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
  
  // Mock search results for demo
  const mockSearchResults: SearchResult[] = [
    { 
      id: 'globe', 
      type: 'screen', 
      title: 'Globe View', 
      description: 'Global threat visualization interface',
      action: () => navigateToScreen('globe')
    },
    { 
      id: 'netrunner', 
      type: 'screen', 
      title: 'NetRunner', 
      description: 'Advanced intelligence gathering tools',
      action: () => navigateToScreen('netrunner')
    },
    { 
      id: 'settings', 
      type: 'screen', 
      title: 'Settings', 
      description: 'Application configuration',
      action: () => navigateToPage('settings')
    },
    { 
      id: 'case-123', 
      type: 'case', 
      title: 'Operation Firewall', 
      description: 'Active investigation: Network breach',
      action: () => navigateToScreen('casemanager', { caseId: '123' })
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
        <div className={styles.logo}>STARCOM</div>
        <div className={styles.version}>v2.5</div>
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
                    {result.type === 'screen' ? '🖥️' : 
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
        <div className={styles.teamInfo}>
          <span className={styles.teamLabel}>Team:</span>
          <span className={styles.teamName}>{teamName}</span>
        </div>
        
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
          onClick={() => navigateToScreen('teams')}
          aria-label="Teams"
        >
          👥
        </button>
        
        <button 
          className={styles.profileButton}
          onClick={() => navigateToPage('settings', 'profile')}
          aria-label="User profile"
        >
          {userAvatar ? (
            <img src={userAvatar} alt="User avatar" className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarPlaceholder}>U</div>
          )}
        </button>
      </div>
    </header>
  );
};

export default GlobalHeader;
