import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'cyber' | 'minimal';
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  variant = 'cyber',
  message,
  fullScreen = false
}) => {
  const containerClass = fullScreen ? styles.fullScreenContainer : styles.container;
  const spinnerClass = `${styles.spinner} ${styles[size]} ${styles[variant]}`;

  return (
    <div className={containerClass}>
      <div className={styles.loadingContent}>
        <div className={spinnerClass}>
          {variant === 'cyber' && (
            <>
              <div className={styles.outerRing}></div>
              <div className={styles.middleRing}></div>
              <div className={styles.innerRing}></div>
              <div className={styles.core}></div>
            </>
          )}
          {variant === 'default' && (
            <div className={styles.defaultSpinner}></div>
          )}
          {variant === 'minimal' && (
            <div className={styles.minimalSpinner}></div>
          )}
        </div>
        
        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
