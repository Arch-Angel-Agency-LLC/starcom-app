import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScreenType } from '../../context/ViewContext';
import { useCollaboration } from '../../hooks/useUnifiedGlobalCommand';
import { useFeatureFlag } from '../../utils/featureFlags';
import styles from './MainBottomBar.module.css';

interface NavItem {
  id: string;
  label: string;
  screen: ScreenType;
  path: string;
  tooltip: string;
  icon?: string;
  isHighlighted?: boolean;
  status?: 'connected' | 'available' | 'active';
  category?: 'intel' | 'collab' | 'tools';
}

export const MainBottomBar: React.FC = () => {
  const { isConnected } = useCollaboration();
  const aiSuggestionsEnabled = useFeatureFlag('aiSuggestionsEnabled');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user has visited teams page to hide new user hints
  const hasVisitedTeams = localStorage.getItem('starcom-visited-teams');

  // Organize navigation items by category for better structure
  const navigationItems: NavItem[] = useMemo(() => [
    // Globe
    { 
      id: 'globe', 
      label: 'Globe', 
      screen: 'globe',
      path: '/',
      icon: '🌍',
      tooltip: 'Global threat visualization',
      category: 'tools'
    },
    
    // Collaboration tools
    { 
      id: 'teams', 
      label: 'Teams', 
      screen: 'teams',
      path: '/teams',
      icon: '👥',
      tooltip: isConnected ? 'Team collaboration (Connected)' : 'Join or manage cyber teams', 
      isHighlighted: !hasVisitedTeams || isConnected,
      status: isConnected ? 'connected' : 'available',
      category: 'collab'
    },
    { 
      id: 'aiagent', 
      label: 'AI Agent', 
      screen: 'aiagent',
      path: '/aiagent',
      icon: '🧠',
      tooltip: aiSuggestionsEnabled ? 'AI Assistant & Autonomous Operations (Active)' : 'AI Assistant & Autonomous Operations',
      status: aiSuggestionsEnabled ? 'active' : 'available',
      category: 'collab'
    },
    { 
      id: 'botroster', 
      label: 'Bot Roster', 
      screen: 'botroster',
      path: '/bots',
      icon: '🤖',
      tooltip: 'AI agents and automation',
      category: 'collab'
    },
    
    // Intelligence tools
    { 
      id: 'netrunner', 
      label: 'NetRunner', 
      screen: 'netrunner',
      path: '/netrunner',
      icon: '🌐',
      tooltip: 'Advanced intelligence gathering',
      category: 'intel'
    },
    { 
      id: 'analyzer', 
      label: 'Analyzer', 
      screen: 'analyzer',
      path: '/analyzer',
      icon: '📈',
      tooltip: 'Analyze collected information',
      category: 'intel'
    },
    { 
      id: 'nodeweb', 
      label: 'Node Web', 
      screen: 'nodeweb',
      path: '/nodeweb',
      icon: '🕸️',
      tooltip: 'Network topology and connections',
      category: 'intel'
    },
    { 
      id: 'timeline', 
      label: 'Timeline', 
      screen: 'timeline',
      path: '/timeline',
      icon: '📅',
      tooltip: 'Chronological event analysis',
      category: 'intel'
    },
    { 
      id: 'casemanager', 
      label: 'Case Manager', 
      screen: 'casemanager',
      path: '/cases',
      icon: '📁',
      tooltip: 'Case management and intelligence reports',
      category: 'intel'
    }
  ], [isConnected, aiSuggestionsEnabled, hasVisitedTeams]);

  // Group navigation items by category
  const groupedNavItems = useMemo(() => {
    const groups: Record<string, NavItem[]> = {
      tools: [],
      collab: [],
      intel: []
    };
    
    navigationItems.forEach(item => {
      if (item.category) {
        groups[item.category].push(item);
      }
    });
    
    return groups;
  }, [navigationItems]);

  const handleNavigation = useCallback((item: NavItem) => {
    // Track first visit to teams
    if (item.screen === 'teams') {
      localStorage.setItem('starcom-visited-teams', 'true');
      localStorage.setItem('starcom-hint-seen', 'true');
    }
    
    // Use router navigation instead of directly setting ViewContext
    // ViewContext will be updated by useRouteSync
    navigate(item.path);
  }, [navigate]);

  const isActive = useCallback((item: NavItem) => {
    // Check for exact match for Globe (homepage)
    if (item.path === '/' && location.pathname === '/') {
      return true;
    }
    
    // For other routes, check if the current path starts with the item's path
    // This handles cases like '/netrunner/search-term' still highlighting the NetRunner tab
    if (item.path !== '/') {
      return location.pathname.startsWith(item.path);
    }
    
    return false;
  }, [location.pathname]);

  return (
    <nav className={styles.mainBottomBar} aria-label="Main Navigation">
      <div className={styles.leftSection}>
        <div className={styles.navigationContainer}>
          {/* Tools section */}
          <div className={styles.navGroup}>
            {groupedNavItems.tools.map((item) => (
              <button
                key={item.id}
                className={`
                  ${styles.navButton} 
                  ${item.isHighlighted ? styles.highlighted : ''} 
                  ${isActive(item) ? styles.active : ''} 
                  ${item.status === 'connected' ? styles.connected : ''} 
                  ${item.status === 'active' ? styles.aiActive : ''}
                `}
                onClick={() => handleNavigation(item)}
                title={item.tooltip}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {item.status === 'connected' && <span className={styles.statusIndicator} aria-label="Connected"></span>}
                {item.status === 'active' && <span className={styles.statusIndicator} aria-label="Active"></span>}
              </button>
            ))}
          </div>
          
          {/* Collaboration section */}
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Collaboration</div>
            {groupedNavItems.collab.map((item) => (
              <button
                key={item.id}
                className={`
                  ${styles.navButton} 
                  ${item.isHighlighted ? styles.highlighted : ''} 
                  ${isActive(item) ? styles.active : ''} 
                  ${item.status === 'connected' ? styles.connected : ''} 
                  ${item.status === 'active' ? styles.aiActive : ''}
                `}
                onClick={() => handleNavigation(item)}
                title={item.tooltip}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {item.status === 'connected' && <span className={styles.statusIndicator} aria-label="Connected"></span>}
                {item.status === 'active' && <span className={styles.statusIndicator} aria-label="Active"></span>}
              </button>
            ))}
          </div>
          
          {/* Intelligence section */}
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Intelligence</div>
            {groupedNavItems.intel.map((item) => (
              <button
                key={item.id}
                className={`
                  ${styles.navButton} 
                  ${item.isHighlighted ? styles.highlighted : ''} 
                  ${isActive(item) ? styles.active : ''} 
                  ${item.status === 'connected' ? styles.connected : ''} 
                  ${item.status === 'active' ? styles.aiActive : ''}
                `}
                onClick={() => handleNavigation(item)}
                title={item.tooltip}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {item.status === 'connected' && <span className={styles.statusIndicator} aria-label="Connected"></span>}
                {item.status === 'active' && <span className={styles.statusIndicator} aria-label="Active"></span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.helpText}>
          Press <kbd className={styles.kbd}>Ctrl+K</kbd> for quick access
        </div>
        {!hasVisitedTeams && (
          <div className={styles.newUserBadge}>
            <span className={styles.pulse}>●</span> New? Press Ctrl+K
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainBottomBar;
