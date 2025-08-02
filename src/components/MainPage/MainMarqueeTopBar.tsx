import React, { useState, useEffect } from 'react';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import { useDiscordStats } from '../../hooks/useDiscordStats';
import styles from './MainMarqueeTopBar.module.css';

const MainMarqueeTopBar: React.FC = () => {
  const { currentApp, getApplication } = useEnhancedApplicationRouter();
  const { onlineCount } = useDiscordStats();
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
  
  // Get current application info
  const currentAppConfig = currentApp ? getApplication(currentApp) : null;
  const currentTitle = currentAppConfig ? currentAppConfig.name : 'Starcom Platform';
  
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
    `DISCORD: ${onlineCount} ${onlineCount === 1 ? 'OPERATIVE' : 'OPERATIVES'} ONLINE`,
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
          {/* First instance of content */}
          {alertItems.map((item, index) => (
            <React.Fragment key={`first-${index}`}>
              <span className={styles.marqueeItem}>{item}</span>
              <span className={styles.separator}>•</span>
            </React.Fragment>
          ))}
          {/* Duplicate instance for seamless loop */}
          {alertItems.map((item, index) => (
            <React.Fragment key={`second-${index}`}>
              <span className={styles.marqueeItem}>{item}</span>
              <span className={styles.separator}>•</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
};

export default MainMarqueeTopBar;
