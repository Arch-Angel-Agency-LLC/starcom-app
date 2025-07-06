import React from 'react';
import styles from './NodeWebScreen.module.css';

const NodeWebScreen: React.FC = () => {
  return (
    <div className={styles.nodeWebScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Node Web Visualizer</h1>
        <div className={styles.content}>
          <p>The Node Web Visualizer provides an interactive network graph visualization of connected entities.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>🕸️</div>
            <div className={styles.message}>Node Web visualization tools are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeWebScreen;
