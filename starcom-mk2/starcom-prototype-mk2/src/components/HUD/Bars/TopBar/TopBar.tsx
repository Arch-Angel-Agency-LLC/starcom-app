import React from 'react';
import styles from './TopBar.module.css';
import { useEIAData } from '../../../../hooks/useEIAData';

const TopBar: React.FC = () => {
  const { oilPrice, loading, error } = useEIAData();
  return (
    <div className={styles.topBar}>
      <div className={styles.resourceSection}>
        <span>🛢️ Oil Price: </span>
        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className={styles.error}>{error}</span>
        ) : (
          <span>${oilPrice?.toFixed(2)} / barrel</span>
        )}
      </div>
    </div>
  );
};

export default TopBar;