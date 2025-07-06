import React, { useEffect, useState } from 'react';
import { useView } from '../../context/useView';
import styles from './MainCenter.module.css';

interface MainCenterProps {
  children?: React.ReactNode;
}

const MainCenter: React.FC<MainCenterProps> = ({ children }) => {
  const { currentScreen, isNavAnimating } = useView();
  const [animationClass, setAnimationClass] = useState('');
  const [prevScreen, setPrevScreen] = useState(currentScreen);
  
  // Handle screen transitions with animation
  useEffect(() => {
    if (currentScreen !== prevScreen) {
      // Apply exit animation
      setAnimationClass(styles.exit);
      
      // Wait for exit animation to complete before updating to new screen
      const timer = setTimeout(() => {
        setPrevScreen(currentScreen);
        // Apply entrance animation
        setAnimationClass(styles.enter);
        
        // Clear animation class after entrance animation completes
        const clearTimer = setTimeout(() => {
          setAnimationClass('');
        }, 500); // Should match CSS transition duration
        
        return () => clearTimeout(clearTimer);
      }, 300); // Should match CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [currentScreen, prevScreen]);
  
  return (
    <main 
      className={`${styles.mainCenter} ${animationClass} ${isNavAnimating ? styles.animating : ''}`}
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
