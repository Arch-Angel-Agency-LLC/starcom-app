/**
 * TimelineScreen Component
 * 
 * This component serves as the main container for the Timeline functionality.
 */

import React from 'react';
import TimelineVisualizer from '../components/TimelineVisualizer';
import styles from './TimelineScreen.module.css';

/**
 * TimelineScreen Component
 */
const TimelineScreen: React.FC = () => {
  return (
    <div className={styles.timelineScreen}>
      <div className={styles.header}>
        <h1>Timeline Analysis</h1>
        <p className={styles.description}>
          Visualize and analyze events over time to identify patterns and connections.
        </p>
      </div>
      
      <div className={styles.content}>
        <TimelineVisualizer />
      </div>
    </div>
  );
};

export default TimelineScreen;
