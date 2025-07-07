import React from 'react';
import styles from './GlobeScreen.module.css';

// Temporary placeholder for the Globe screen
// This will be replaced with the actual globe visualization
const GlobeScreen: React.FC = () => {
  return (
    <div className={styles.globeScreen}>
      <div className={styles.globePlaceholder}>
        <div className={styles.globeInner}>
          <span className={styles.globeLabel}>GLOBAL VIEW</span>
        </div>
      </div>
    </div>
  );
};

export default GlobeScreen;
