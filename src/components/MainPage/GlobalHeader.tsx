import React, { useState, useRef, useEffect } from 'react';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import { useDiscordStats } from '../../hooks/useDiscordStats';
import WalletStatusMini from '../Auth/WalletStatusMini';
import AnalyticsWidget from '../Analytics/AnalyticsWidget';
import TelegramWidget from '../Telegram/TelegramWidget';
import GitHubWidget from '../GitHub/GitHubWidget';
import { trackInvestorEvents } from '../../utils/analytics';
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
  const { onlineCount, error, isLoading: _isLoading } = useDiscordStats();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
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
  
  // Add click outside listener
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      // Close all widgets when clicking outside
      setShowNotifications(false);
      setShowAnalytics(false);
      setShowTelegram(false);
      setShowGitHub(false);
      setShowSearch(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
          className={`${styles.iconButton} ${onlineCount > 0 ? styles.hasNotifications : ''}`}
          onClick={() => window.open('https://discord.gg/Mea5v8pQmt', '_blank')}
          aria-label={`Discord (${onlineCount} online)`}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ color: error ? '#ff6b6b' : (onlineCount > 0 ? '#5865f2' : '#99aab5') }}
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.446.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          {onlineCount > 0 && <span className={styles.connectionIndicator}>{onlineCount}</span>}
        </button>
        
        <div className={styles.analyticsButtonContainer}>
          <button 
            className={`${styles.iconButton} ${styles.analyticsButton}`}
            onClick={() => {
              setShowAnalytics(!showAnalytics);
              trackInvestorEvents.featureUsed('analytics-button');
            }}
            aria-label="Platform Analytics"
          >
            📊
            <span className={styles.liveIndicator}></span>
          </button>
          
          <AnalyticsWidget 
            isOpen={showAnalytics}
            onClose={() => setShowAnalytics(false)}
          />
        </div>

        <div className={styles.telegramButtonContainer}>
          <button 
            className={`${styles.iconButton} ${styles.telegramButton}`}
            onClick={() => {
              setShowTelegram(!showTelegram);
              trackInvestorEvents.featureUsed('telegram-button');
            }}
            aria-label="Secure Communications"
          >
            ✈️
            <span className={styles.secureIndicator}></span>
          </button>
          
          <TelegramWidget 
            isOpen={showTelegram}
            onClose={() => setShowTelegram(false)}
          />
        </div>

        <div className={styles.githubButtonContainer}>
          <button 
            className={`${styles.iconButton} ${styles.githubButton}`}
            onClick={() => {
              setShowGitHub(!showGitHub);
              trackInvestorEvents.featureUsed('github-button');
            }}
            aria-label="Open Source Repository"
          >
            🧑‍💻
            <span className={styles.developerIndicator}></span>
          </button>
          
          <GitHubWidget 
            isOpen={showGitHub}
            onClose={() => setShowGitHub(false)}
          />
        </div>
        
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
