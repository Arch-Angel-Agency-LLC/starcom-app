import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import { ApplicationId } from '../Router/EnhancedApplicationRouter';
import { trackInvestorEvents } from '../../utils/analytics';
import { googleAnalyticsService } from '../../services/GoogleAnalyticsService';
import styles from './MainBottomBar.module.css';

interface NavItem {
  id: ApplicationId;
  label: string;
  icon: string;
  tooltip: string;
  category: 'primary' | 'intel' | 'collab' | 'special';
  isHighlighted?: boolean;
  status?: 'connected' | 'available' | 'active';
}

const MainBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentApp, 
    navigateToApp, 
    getAllApplications 
  } = useEnhancedApplicationRouter();
  
  // Get all registered applications from the Enhanced Application Router
  const allApplications = getAllApplications();

  // Enhanced navigation items based on our Phase 2 application structure
  const navigationItems: NavItem[] = useMemo(() => [
    // Primary - CyberCommand Globe (protected, navigate via URL)
    { 
      id: 'cybercommand', 
      label: 'Globe', 
      icon: '🌍',
      tooltip: 'Global threat visualization with 3D interface',
      category: 'primary'
    },
    
    // The 7 Core Applications from Phase 2
    { 
      id: 'netrunner', 
      label: 'NetRunner', 
      icon: '🕵️',
      tooltip: 'Advanced investigation tools and OSINT operations',
      category: 'intel'
    },
    { 
      id: 'intelanalyzer', 
      label: 'IntelAnalyzer', 
      icon: '📊',
      tooltip: 'Intelligence analysis and data processing',
      category: 'intel'
    },
    { 
      id: 'inteldashboard', 
      label: 'IntelDashboard', 
      icon: '📋',
      tooltip: 'Intelligence reports and dashboard management',
      category: 'intel'
    },
    { 
      id: 'timemap', 
      label: 'TimeMap', 
      icon: '🗓️',
      tooltip: 'Temporal analysis and timeline management',
      category: 'intel'
    },
    { 
      id: 'nodeweb', 
      label: 'IntelWeb', 
      icon: '🕸️',
      tooltip: 'Intelligence connections and relationship mapping',
      category: 'intel'
    },
    { 
      id: 'teamworkspace', 
      label: 'CollabCenter', 
      icon: '👥',
      tooltip: 'Intelligence operations collaboration and project management',
      category: 'collab'
    },
    { 
      id: 'marketexchange', 
      label: 'MarketExchange', 
      icon: '💰',
      tooltip: 'Economic analysis and market intelligence',
      category: 'special'
    }
  ], []);

  // Group navigation items by category for organized display
  const groupedNavItems = useMemo(() => {
    const groups: Record<string, NavItem[]> = {
      primary: [],
      intel: [],
      collab: [],
      special: []
    };
    
    navigationItems.forEach(item => {
      groups[item.category].push(item);
    });
    
    return groups;
  }, [navigationItems]);

  // Check if an application is currently active
  const isActive = useCallback((item: NavItem) => {
    // Use consistent logic for all buttons - check Enhanced Application Router state first
    if (currentApp === item.id) {
      return true;
    }
    
    // Fallback to URL pathname checking for Globe/CyberCommand when Enhanced Router state is not set
    if (item.id === 'cybercommand' && !currentApp) {
      return location.pathname === '/' || location.pathname === '/globe';
    }
    
    return false;
  }, [currentApp, location?.pathname]);

  // Handle navigation
  const handleNavigation = useCallback((item: NavItem) => {
    console.log('🔘 MainBottomBar: Navigation clicked', {
      item: item.id,
      label: item.label,
      category: item.category,
      currentApp: currentApp
    });

    // ANALYTICS: Track primary navigation usage (Tier 1 - Critical for investors)
    // Core navigation tracking (CRITICAL for investor metrics)
    trackInvestorEvents.navigationClick(`bottom-bar-${item.id}`);
    googleAnalyticsService.trackEvent('primary_navigation', 'engagement', item.label, 1);
    
    // Category-based navigation insights
    googleAnalyticsService.trackEvent('navigation_category', 'ux_behavior', item.category);
    
    // Track navigation patterns for UX optimization
    if (currentApp && currentApp !== item.id) {
      googleAnalyticsService.trackEvent('app_switching', 'engagement', `${currentApp}_to_${item.id}`);
      trackInvestorEvents.featureUsed('cross-app-navigation');
    }

    // Track category-specific usage patterns
    switch (item.category) {
      case 'primary':
        trackInvestorEvents.featureUsed('primary-navigation');
        break;
      case 'intel':
        trackInvestorEvents.featureUsed('intelligence-tools');
        break;
      case 'collab':
        trackInvestorEvents.featureUsed('collaboration-tools');
        break;
      case 'special':
        trackInvestorEvents.featureUsed('market-exchange');
        break;
    }

    // Use the Enhanced Application Router for ALL applications, including CyberCommand
    const applicationConfig = allApplications.find(app => app.id === item.id);
    if (applicationConfig) {
      console.log('🔘 MainBottomBar: Navigating to application:', {
        appId: item.id,
        mode: applicationConfig.defaultMode
      });
      
      // Add navigation context for analytics
      const navigationContext = {
        navigationMethod: 'bottom-bar',
        category: item.category,
        userIntent: 'primary-navigation'
      };
      
      // Navigate to the application using the Enhanced Application Router
      navigateToApp(item.id, applicationConfig.defaultMode, navigationContext);
      
      // Also update the URL for consistency (especially for CyberCommand/Globe)
      if (item.id === 'cybercommand') {
        navigate('/', { replace: true });
      }
    } else {
      console.warn('🔘 MainBottomBar: Application not found in registry:', item.id);
      // Track configuration errors for debugging
      googleAnalyticsService.trackEvent('navigation_error', 'error', `app_not_found_${item.id}`);
    }
  }, [navigate, navigateToApp, allApplications, currentApp]);

  return (
    <nav className={styles.mainBottomBar} aria-label="Main Navigation">
      <div className={styles.leftSection}>
        <div className={styles.navigationContainer}>
          {/* Primary section - CyberCommand Globe */}
          <div className={styles.navGroup}>
            {groupedNavItems.primary.map((item) => (
              <button
                key={item.id}
                className={`
                  ${styles.navButton} 
                  ${isActive(item) ? styles.active : ''} 
                  ${item.isHighlighted ? styles.highlighted : ''}
                `}
                onClick={() => handleNavigation(item)}
                title={item.tooltip}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
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
                  ${isActive(item) ? styles.active : ''} 
                  ${item.isHighlighted ? styles.highlighted : ''}
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
                  ${isActive(item) ? styles.active : ''} 
                  ${item.isHighlighted ? styles.highlighted : ''}
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
          
          {/* Special section */}
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Exchange</div>
            {groupedNavItems.special.map((item) => (
              <button
                key={item.id}
                className={`
                  ${styles.navButton} 
                  ${isActive(item) ? styles.active : ''} 
                  ${item.isHighlighted ? styles.highlighted : ''}
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
          Enhanced Application Router v2.0
        </div>
        <div className={styles.newUserBadge}>
          <span className={styles.pulse}>●</span> {allApplications.length} apps ready
        </div>
      </div>
    </nav>
  );
};

export default MainBottomBar;
