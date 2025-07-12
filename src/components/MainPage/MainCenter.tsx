import React from 'react';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import styles from './MainCenter.module.css';

interface MainCenterProps {
  children?: React.ReactNode;
}

const MainCenter: React.FC<MainCenterProps> = ({ children }) => {
  const { currentApp } = useEnhancedApplicationRouter();
  
  return (
    <main 
      className={styles.mainCenter}
      data-current-app={currentApp || 'none'}
      aria-live="polite"
    >
      {/* Application content container */}
      <div className={styles.screenContainer}>
        {children}
      </div>
    </main>
  );
};

export default MainCenter;
