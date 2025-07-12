import React from 'react';
import { useNOAAGlobeVisualizations } from '../CyberCommandLeftSideBar/NOAAGlobeVisualizationManager';
import styles from './NOAAVisualizationStatus.module.css';

const NOAAVisualizationStatus: React.FC = () => {
  const { visualizations, stats } = useNOAAGlobeVisualizations();

  return (
    <div className={styles.statusPanel}>
      <div className={styles.header}>
        <span className={styles.title}>🌍 Globe Status</span>
        <span className={styles.count}>{stats.total}</span>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span className={styles.label}>Performance:</span>
          <span className={`${styles.value} ${styles[stats.recommendedPerformanceLevel]}`}>
            {stats.recommendedPerformanceLevel.toUpperCase()}
          </span>
        </div>
        
        {Object.entries(stats.byType).length > 0 && (
          <div className={styles.typeBreakdown}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className={styles.typeRow}>
                <span className={styles.typeIcon}>
                  {type === 'heatmap' && '🌡️'}
                  {type === 'particles' && '✨'}
                  {type === 'field_lines' && '⚡'}
                  {type === 'markers' && '📍'}
                  {type === 'atmosphere' && '🌌'}
                  {type === 'rings' && '⭕'}
                </span>
                <span className={styles.typeCount}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {visualizations.length > 0 && (
        <div className={styles.activeList}>
          <div className={styles.activeTitle}>Active:</div>
          <div className={styles.activeItems}>
            {visualizations.slice(0, 3).map(viz => (
              <div key={viz.visualizationId} className={styles.activeItem}>
                <span 
                  className={styles.activeDot}
                  style={{ backgroundColor: viz.config.color }}
                />
                <span className={styles.activeLabel}>
                  {viz.visualizationId.split('-').slice(0, 2).join(' ')}
                </span>
              </div>
            ))}
            {visualizations.length > 3 && (
              <div className={styles.moreActive}>
                +{visualizations.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NOAAVisualizationStatus;
