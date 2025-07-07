import React, { useState, useEffect } from 'react';
import { useView } from '../../context/useView';
import styles from './MarqueeTopBar.module.css';

const MarqueeTopBar: React.FC = () => {
  const { currentScreen } = useView();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  
  // Update time every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }));
    };
    
    // Initial update
    updateDateTime();
    
    // Set interval for updates
    const interval = setInterval(updateDateTime, 60000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);
  
  // Define titles for each screen
  const screenTitles: Record<string, string> = {
    globe: 'Global Threat Landscape',
    netrunner: 'NetRunner Intelligence Suite',
    analyzer: 'Information Analysis Dashboard',
    nodeweb: 'Network Relationship Visualizer',
    timeline: 'Event Timeline Analyzer',
    casemanager: 'Case Management & Reports',
    teams: 'Team Collaboration Hub',
    aiagent: 'AI Agent Control Center',
    botroster: 'Bot Roster & Automation'
  };
  
  // Get current title or use fallback
  const currentTitle = screenTitles[currentScreen] || 'Starcom Platform';
  
  // Mock system status - in production this would come from context
  const mockAlertLevel = 'MODERATE';
  const mockConnectionStatus = 'SECURE';
  const mockUpdatesAvailable = true;
  
  // Dynamic alert items - would come from a real notification system
  const alertItems = [
    'SYSTEM READY',
    `${currentDate} | ${currentTime}`,
    `CONNECTION ${mockConnectionStatus}`,
    `THREAT LEVEL: ${mockAlertLevel}`,
    mockUpdatesAvailable ? 'UPDATES AVAILABLE' : 'SYSTEM UP TO DATE',
    'SENSORS ACTIVE'
  ];
  
  return (
    <header className={styles.marqueeTopBar} aria-label="Status Information">
      <div className={styles.titleSection}>
        <h1 className={styles.screenTitle}>{currentTitle}</h1>
      </div>
      
      <div className={styles.marqueeSection}>
        <div className={styles.marqueeContent}>
          {alertItems.map((item, index) => (
            <React.Fragment key={index}>
              <span className={styles.marqueeItem}>{item}</span>
              <span className={styles.separator}>•</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className={styles.actionSection}>
        <button 
          className={styles.settingsButton} 
          aria-label="Settings"
          onClick={() => {/* Navigate to settings */}}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
};

export default MarqueeTopBar;
