import React from 'react';
import styles from './BottomBar.module.css';
import ThreatHorizonFeed from '../../../AI/ThreatHorizonFeed';
import { AIErrorBoundary } from '../../../ErrorBoundaries/AIErrorBoundary';
import { useFeatureFlag } from '../../../../utils/featureFlags';

export const BottomBar: React.FC = () => {
  const threatHorizonEnabled = useFeatureFlag('threatHorizonEnabled');

  return (
    <div className={styles.bottomBar}>
      {threatHorizonEnabled && (
        <AIErrorBoundary fallback={
          <div className={styles.errorFallback}>
            <span>⚠️ AI Threat Feed Unavailable</span>
          </div>
        }>
          <ThreatHorizonFeed className={styles.threatHorizonContainer} />
        </AIErrorBoundary>
      )}
    </div>
  );
};

export default BottomBar;