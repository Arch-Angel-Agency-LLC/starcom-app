import React from 'react';
import styles from './AnalyzerScreen.module.css';

const AnalyzerScreen: React.FC = () => {
  return (
    <div className={styles.analyzerScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Information Analyzer</h1>
        <div className={styles.content}>
          <p>The Analyzer dashboard provides tools for analyzing and visualizing collected intelligence data.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>📊</div>
            <div className={styles.message}>Analyzer tools are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzerScreen;
