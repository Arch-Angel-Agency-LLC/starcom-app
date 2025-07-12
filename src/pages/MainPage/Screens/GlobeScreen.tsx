import React, { useRef } from 'react';
import styles from './GlobeScreen.module.css';
import CyberCommandHUDLayout from '../../../layouts/CyberCommandHUDLayout/CyberCommandHUDLayout';

// Globe screen that displays the 3D globe visualization
const GlobeScreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.globeScreen}>
      <div className={styles.hudContainer} ref={containerRef}>
        <CyberCommandHUDLayout isEmbedded={true} />
      </div>
    </div>
  );
};

export default GlobeScreen;
