import React from 'react';
import { useView, ViewMode } from '../../../../context/ViewContext';
import styles from './BottomBar.module.css';

export const BottomBar: React.FC = () => {
  const { currentView, setCurrentView } = useView();
  
  // Check if user has visited teams page to hide new user hints
  const hasVisitedTeams = localStorage.getItem('starcom-visited-teams');

  const quickNavItems = [
    { id: 'globe', label: '🌍 Globe', view: 'globe' as ViewMode, tooltip: 'Global threat visualization' },
    { id: 'teams', label: '👥 Teams', view: 'teams' as ViewMode, tooltip: 'Join or manage cyber teams', isHighlighted: !hasVisitedTeams },
    { id: 'bots', label: '🤖 Bots', view: 'bots' as ViewMode, tooltip: 'AI agents and automation' },
    { id: 'node-web', label: '🕸️ Node Web', view: 'node-web' as ViewMode, tooltip: 'Network topology and connections' },
    { id: 'investigations', label: '🔍 Cases', view: 'investigations' as ViewMode, tooltip: 'Active investigations' },
    { id: 'intel', label: '📊 Intel', view: 'intel' as ViewMode, tooltip: 'Intelligence reports' }
  ];

  const handleViewChange = (view: ViewMode) => {
    // Clear any interfering states
    if (view === 'teams') {
      localStorage.setItem('starcom-visited-teams', 'true');
      localStorage.setItem('starcom-hint-seen', 'true');
    }
    
    setCurrentView(view);
  };

  return (
    <div className={styles.bottomBar}>
      <div className={styles.leftSection}>
        <div className={styles.quickNav}>
          {quickNavItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navButton} ${item.isHighlighted ? styles.highlighted : ''} ${currentView === item.view ? styles.active : ''}`}
              onClick={() => handleViewChange(item.view)}
              title={item.tooltip}
            >
              {item.label}
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