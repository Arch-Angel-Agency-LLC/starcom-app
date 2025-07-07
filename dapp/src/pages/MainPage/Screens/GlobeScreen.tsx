import React, { useEffect, useRef } from 'react';
import styles from './GlobeScreen.module.css';
import HUDLayout from '../../../layouts/HUDLayout/HUDLayout';

// Temporary placeholder for the Globe screen
// This will be replaced with the actual globe visualization
const GlobeScreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Adjust the container height to account for MainBottomBar
  useEffect(() => {
    const resizeContainer = () => {
      if (containerRef.current) {
        // Find the MainBottomBar height dynamically
        const mainBottomBar = document.querySelector('[class*="mainBottomBar"]');
        if (mainBottomBar) {
          const mainBottomBarHeight = mainBottomBar.getBoundingClientRect().height;
          containerRef.current.style.bottom = `${mainBottomBarHeight}px`;
        }
      }
    };

    resizeContainer();
    window.addEventListener('resize', resizeContainer);
    return () => window.removeEventListener('resize', resizeContainer);
  }, []);

  return (
    <div className={styles.globeScreen}>
      <div className={styles.hudContainer} ref={containerRef}>
        <HUDLayout isEmbedded={true} />
      </div>
    </div>
  );
};

export default GlobeScreen;
