import React, { useState, useRef, useEffect } from 'react';
import { useApplicationRouter } from '../../hooks/useApplicationRouter';
import { useDiscordStats } from '../../hooks/useDiscordStats';
import WalletStatusMini from '../Auth/WalletStatusMini';
import AuthErrorBoundary from '../Auth/AuthErrorBoundary';
import TelegramWidget from '../Telegram/TelegramWidget';
import GitHubWidget from '../GitHub/GitHubWidget';
import DiscordWidget from '../Discord/DiscordWidget';
import { trackInvestorEvents } from '../../utils/analytics';
import { googleAnalyticsService } from '../../services/GoogleAnalyticsService';
import styles from './GlobalHeader.module.css';

const wingCommanderLogo = '/assets/images/WingCommanderLogo-288x162.gif';

// Simple search result type for demo
interface SearchResult {
  id: string;
  type: 'app' | 'case' | 'report' | 'entity' | 'command';
  title: string;
  description: string;
  action?: () => void;
}

const GlobalHeader: React.FC = () => {
  const { navigateToApp } = useApplicationRouter();
  const { onlineCount, error, isLoading: _isLoading } = useDiscordStats();
  const [showTelegram, setShowTelegram] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showDiscord, setShowDiscord] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper function to close all widgets
  const closeAllWidgets = () => {
    setShowTelegram(false);
    setShowGitHub(false);
    setShowDiscord(false);
  };

  // Helper functions to open specific widgets (closing others first)
  const openDiscordWidget = () => {
    closeAllWidgets();
    setShowDiscord(true);
  };

  const openTelegramWidget = () => {
    closeAllWidgets();
    setShowTelegram(true);
  };

  const openGitHubWidget = () => {
    closeAllWidgets();
    setShowGitHub(true);
  };
  
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
  
  // Add click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close widgets if clicking inside them
      const isInsideWidget = target.closest('[class*="ButtonContainer"]') ||
                           target.closest('[class*="Widget"]') ||
                           target.closest('[class*="searchSection"]') ||
                           target.closest('[class*="searchResults"]');
      
      if (!isInsideWidget) {
        // Close all widgets when clicking outside
        setShowTelegram(false);
        setShowGitHub(false);
        setShowDiscord(false);
        setShowSearch(false);
      }
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
        <div className={styles.discordButtonContainer}>
          <button 
            className={`${styles.iconButton} ${onlineCount > 0 ? styles.hasNotifications : ''}`}
            onClick={() => {
              // ANALYTICS: Enhanced widget tracking (Tier 1 - User engagement)
              const widgetAction = showDiscord ? 'close' : 'open';
              const sessionWidgetCount = parseInt(sessionStorage.getItem('starcom_widget_interactions') || '0') + 1;
              sessionStorage.setItem('starcom_widget_interactions', sessionWidgetCount.toString());
              
              trackInvestorEvents.featureUsed('discord-button');
              googleAnalyticsService.trackEvent('widget_interaction', 'engagement', `discord_${widgetAction}`);
              googleAnalyticsService.trackEvent('session_widget_usage', 'engagement', 'widget_count', sessionWidgetCount);
              
              // Track user engagement patterns
              if (onlineCount > 0) {
                googleAnalyticsService.trackEvent('community_engagement', 'social', 'discord_with_users', onlineCount);
              }
              
              if (showDiscord) {
                setShowDiscord(false);
              } else {
                openDiscordWidget();
              }
            }}
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
          
          <DiscordWidget 
            isOpen={showDiscord}
            onClose={() => setShowDiscord(false)}
          />
        </div>
        
        <div className={styles.telegramButtonContainer}>
          <button 
            className={`${styles.iconButton} ${styles.telegramButton}`}
            onClick={() => {
              // ANALYTICS: Enhanced widget tracking (Tier 1 - User engagement)
              const widgetAction = showTelegram ? 'close' : 'open';
              const sessionWidgetCount = parseInt(sessionStorage.getItem('starcom_widget_interactions') || '0') + 1;
              sessionStorage.setItem('starcom_widget_interactions', sessionWidgetCount.toString());
              
              trackInvestorEvents.featureUsed('telegram-button');
              googleAnalyticsService.trackEvent('widget_interaction', 'engagement', `telegram_${widgetAction}`);
              googleAnalyticsService.trackEvent('secure_communication', 'feature_usage', 'telegram_access');
              
              if (showTelegram) {
                setShowTelegram(false);
              } else {
                openTelegramWidget();
              }
            }}
            aria-label="Secure Communications"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
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
              // ANALYTICS: Enhanced widget tracking (Tier 1 - User engagement)
              const widgetAction = showGitHub ? 'close' : 'open';
              const sessionWidgetCount = parseInt(sessionStorage.getItem('starcom_widget_interactions') || '0') + 1;
              sessionStorage.setItem('starcom_widget_interactions', sessionWidgetCount.toString());
              
              trackInvestorEvents.featureUsed('github-button');
              googleAnalyticsService.trackEvent('widget_interaction', 'engagement', `github_${widgetAction}`);
              googleAnalyticsService.trackEvent('developer_engagement', 'feature_usage', 'github_access');
              
              if (showGitHub) {
                setShowGitHub(false);
              } else {
                openGitHubWidget();
              }
            }}
            aria-label="Open Source Repository"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className={styles.developerIndicator}></span>
          </button>
          
          <GitHubWidget 
            isOpen={showGitHub}
            onClose={() => setShowGitHub(false)}
          />
        </div>
        
        <div className={styles.walletSection}>
          <AuthErrorBoundary>
            <WalletStatusMini />
          </AuthErrorBoundary>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
