// DataPointList.tsx
// Data point list component for the categories tab
import React from 'react';
import { MarqueeDataPoint } from '../interfaces';
import styles from './DataPointList.module.css';

export interface DataPointListProps {
  dataPoints: MarqueeDataPoint[];
  highlightedDataPoint: string | null;
}

const DataPointList: React.FC<DataPointListProps> = ({
  dataPoints,
  highlightedDataPoint,
}) => {
  const handleDataPointClick = (dataPoint: MarqueeDataPoint) => {
    // Scroll to the specific data point settings section
    const element = document.getElementById(`datapoint-${dataPoint.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getStatusColor = (dataPoint: MarqueeDataPoint): string => {
    if (dataPoint.value === 'Loading...') return '#f59e0b';
    if (dataPoint.value === 'Error' || dataPoint.value === 'N/A') return '#ef4444';
    return '#10b981';
  };

  const getStatusIcon = (dataPoint: MarqueeDataPoint): string => {
    if (dataPoint.value === 'Loading...') return '⏳';
    if (dataPoint.value === 'Error') return '❌';
    if (dataPoint.value === 'N/A') return '⚠️';
    return '✅';
  };

  return (
    <div className={styles.dataPointList}>
      {dataPoints.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <p className={styles.emptyTitle}>No Active Data Points</p>
          <p className={styles.emptyDescription}>
            Enable some categories above to see active data points here.
          </p>
        </div>
      ) : (
        <div className={styles.dataPointGrid}>
          {dataPoints.map((dataPoint) => (
            <div
              key={dataPoint.id}
              id={`datapoint-${dataPoint.id}`}
              className={`${styles.dataPointCard} ${
                highlightedDataPoint === dataPoint.id ? styles.highlighted : ''
              }`}
              onClick={() => handleDataPointClick(dataPoint)}
            >
              <div className={styles.dataPointHeader}>
                <div className={styles.dataPointIcon}>{dataPoint.icon}</div>
                <div className={styles.dataPointInfo}>
                  <div className={styles.dataPointLabel}>{dataPoint.label}</div>
                  <div className={styles.dataPointId}>{dataPoint.id}</div>
                </div>
                <div className={styles.dataPointStatus}>
                  <span 
                    className={styles.statusIcon}
                    style={{ color: getStatusColor(dataPoint) }}
                  >
                    {getStatusIcon(dataPoint)}
                  </span>
                </div>
              </div>
              
              <div className={styles.dataPointValue}>
                <span className={styles.valueLabel}>Current Value:</span>
                <span 
                  className={styles.value}
                  style={{ color: getStatusColor(dataPoint) }}
                >
                  {dataPoint.value}
                </span>
              </div>
              
              <div className={styles.dataPointFooter}>
                <span className={styles.configureHint}>
                  Click to configure settings
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataPointList;
