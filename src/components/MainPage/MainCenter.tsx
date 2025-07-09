import React from 'react';
import { useView } from '../../context/useView';
import styles from './MainCenter.module.css';

interface MainCenterProps {
  children?: React.ReactNode;
}

const MainCenter: React.FC<MainCenterProps> = ({ children }) => {
  const { currentScreen } = useView();
  
  return (
    <main 
      className={styles.mainCenter}
      data-current-screen={currentScreen}
      aria-live="polite"
    >
      {/* Screen transition container */}
      <div className={styles.screenContainer}>
        {children}
      </div>
    </main>
  );
};

export default MainCenter;
