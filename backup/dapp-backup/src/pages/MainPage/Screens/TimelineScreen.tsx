import React from 'react';
import TimelineDashboard from '../../Timeline/components/TimelineDashboard';
import styles from './TimelineScreen.module.css';

/**
 * Timeline Screen
 * 
 * Integrates the Timeline Dashboard into the main UI structure.
 * This screen provides chronological analysis of events and activities.
 */
const TimelineScreen: React.FC = () => {
  return (
    <div className={styles.timelineScreen}>
      <TimelineDashboard />
    </div>
  );
};

export default TimelineScreen;
