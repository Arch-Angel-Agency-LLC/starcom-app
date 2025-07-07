import React from 'react';
import styles from './NewBottomBar.module.css';

interface NewBottomBarProps {
  isEmbedded?: boolean;
}

const NewBottomBar: React.FC<NewBottomBarProps> = ({ isEmbedded = false }) => {
  return (
    <div className={`${styles.newBottomBar} ${isEmbedded ? styles.embedded : ''}`}>
      <div className={styles.leftGroup}>
        <button className={styles.actionButton}>
          <span className={styles.icon}>🔍</span>
        </button>
        <button className={styles.actionButton}>
          <span className={styles.icon}>📊</span>
        </button>
      </div>
      
      <div className={styles.centerGroup}>
        <button className={styles.primaryButton}>
          <span className={styles.icon}>🌐</span>
        </button>
      </div>
      
      <div className={styles.rightGroup}>
        <button className={styles.actionButton}>
          <span className={styles.icon}>⚙️</span>
        </button>
        <button className={styles.actionButton}>
          <span className={styles.icon}>ℹ️</span>
        </button>
      </div>
    </div>
  );
};

export default NewBottomBar;