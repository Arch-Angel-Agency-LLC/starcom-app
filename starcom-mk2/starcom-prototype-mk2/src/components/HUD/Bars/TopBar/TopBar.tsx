import React from 'react';
import styles from './TopBar.module.css';
import { useDashboard } from '../../../../context/DashboardContext';

const TopBar: React.FC = () => {
  const { oilPrice, gasolinePrice, oilInventory, naturalGasStorage, loading, error } = useDashboard();
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
      <div className={styles.resourceSection}>
        <span>⛽ Gasoline Price: </span>
        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className={styles.error}>{error}</span>
        ) : (
          <span>${gasolinePrice?.toFixed(2)} / gallon</span>
        )}
      </div>
      <div className={styles.resourceSection}>
        <span>📦 Oil Inventory: </span>
        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className={styles.error}>{error}</span>
        ) : (
          <span>{oilInventory?.toFixed(2)} barrels</span>
        )}
      </div>
      <div className={styles.resourceSection}>
        <span>🔥 Natural Gas Storage: </span>
        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className={styles.error}>{error}</span>
        ) : (
          <span>{naturalGasStorage?.toFixed(2)} BCF</span>
        )}
      </div>
    </div>
  );
};

export default TopBar;