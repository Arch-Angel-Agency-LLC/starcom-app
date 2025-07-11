import React from 'react';
import { useView, ViewMode } from '../../../../context/ViewContext';
import { useCollaboration } from '../../../../hooks/useUnifiedGlobalCommand';
import { useFeatureFlag } from '../../../../utils/featureFlags';
import { useViewNavigation } from '../../../../hooks/navigation/useViewNavigation';
import styles from './BottomBar.module.css';

export const BottomBar: React.FC = () => {
  const { currentView, setCurrentView } = useView();
  const { isConnected } = useCollaboration();
  const aiSuggestionsEnabled = useFeatureFlag('aiSuggestionsEnabled');
  const { navigateToView } = useViewNavigation();
  
  // Check if user has visited teams page to hide new user hints
  const hasVisitedTeams = localStorage.getItem('starcom-visited-teams');

  // Enhanced navigation items with collaboration status
  const quickNavItems = [
    { id: 'globe', label: '🌍 Globe', view: 'globe' as ViewMode, tooltip: 'Global threat visualization' },
    { 
      id: 'teams', 
      label: `👥 Teams${isConnected ? ' ●' : ''}`, 
      view: 'teams' as ViewMode, 
      tooltip: isConnected ? 'Team collaboration (Connected)' : 'Join or manage cyber teams', 
      isHighlighted: !hasVisitedTeams || isConnected,
      status: isConnected ? 'connected' : 'available'
    },
    { 
      id: 'ai-agent', 
      label: `🧠 AI Agent${aiSuggestionsEnabled ? ' ●' : ''}`, 
      view: 'ai-agent' as ViewMode, 
      tooltip: aiSuggestionsEnabled ? 'AI Assistant & Autonomous Operations (Active)' : 'AI Assistant & Autonomous Operations',
      status: aiSuggestionsEnabled ? 'active' : 'available'
    },
    { id: 'bots', label: '🤖 Bots', view: 'bots' as ViewMode, tooltip: 'AI agents and automation' },
    { id: 'netrunner', label: '🌐 NetRunner', view: 'netrunner' as ViewMode, tooltip: 'Advanced online search and reconnaissance' },
    { id: 'info-gathering', label: '🔍 Info Gathering', view: 'info-gathering' as ViewMode, tooltip: 'Collect information from various sources' },
    { id: 'info-analysis', label: '📈 Info Analysis', view: 'info-analysis' as ViewMode, tooltip: 'Analyze collected information' },
    { id: 'node-web', label: '🕸️ Node Web', view: 'node-web' as ViewMode, tooltip: 'Network topology and connections' },
    { id: 'timeline', label: '📅 Timeline', view: 'timeline' as ViewMode, tooltip: 'Chronological event analysis' },
    { id: 'cases', label: '📁 Cases', view: 'cases' as ViewMode, tooltip: 'Case management and tracking' },
    { id: 'intel', label: '📊 Intel', view: 'intel' as ViewMode, tooltip: 'Intelligence reports' }
  ];

  const handleViewChange = (view: ViewMode) => {
    // Clear any interfering states
    if (view === 'teams') {
      localStorage.setItem('starcom-visited-teams', 'true');
      localStorage.setItem('starcom-hint-seen', 'true');
    }
    
    // Update the current view in context
    setCurrentView(view);
    
    // Navigate to the corresponding route
    navigateToView(view);
  };

  return (
    <div className={styles.bottomBar}>
      <div className={styles.leftSection}>
        <div className={styles.quickNav}>
          {quickNavItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navButton} ${item.isHighlighted ? styles.highlighted : ''} ${currentView === item.view ? styles.active : ''} ${item.status === 'connected' ? styles.connected : ''} ${item.status === 'active' ? styles.aiActive : ''}`}
              onClick={() => handleViewChange(item.view)}
              title={item.tooltip}
            >
              {item.label}
              {item.status === 'connected' && <span className={styles.connectionDot}></span>}
              {item.status === 'active' && <span className={styles.aiActiveDot}></span>}
            </button>
          ))}
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
    </div>
  );
};

export default BottomBar;