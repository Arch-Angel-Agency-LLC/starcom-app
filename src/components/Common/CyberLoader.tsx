import React, { useState, useEffect } from 'react';
import styles from './CyberLoader.module.css';

interface CyberLoaderProps {
  message?: string;
  subtext?: string;
  showProgress?: boolean;
  duration?: number; // Duration in milliseconds for simulated progress
}

const CyberLoader: React.FC<CyberLoaderProps> = ({ 
  message = 'Initializing Systems',
  subtext = 'Earth Alliance Command',
  showProgress = true,
  duration = 3000
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Non-linear progress for more realistic feel
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, duration / 20);

    return () => clearInterval(interval);
  }, [showProgress, duration]);

  return (
    <div className={styles.cyberLoaderContainer}>
      {/* Animated Background Grid */}
      <div className={styles.dataStreamContainer}>
        <div className={`${styles.dataStream} ${styles.stream1}`} />
        <div className={`${styles.dataStream} ${styles.stream2}`} />
        <div className={`${styles.dataStream} ${styles.stream3}`} />
        <div className={`${styles.dataStream} ${styles.stream4}`} />
        <div className={`${styles.dataStream} ${styles.stream5}`} />
        <div className={`${styles.dataStream} ${styles.stream6}`} />
      </div>

      {/* Central Quantum Orbital System */}
      <div className={styles.quantumOrbitalSystem}>
        {/* Central Core */}
        <div className={styles.centralCore} />
        
        {/* Orbital Rings */}
        <div className={`${styles.quantumOrbit} ${styles.orbit1}`}>
          <div className={`${styles.quantumParticle} ${styles.particle1}`} />
        </div>
        <div className={`${styles.quantumOrbit} ${styles.orbit2}`}>
          <div className={`${styles.quantumParticle} ${styles.particle2}`} />
        </div>
        <div className={`${styles.quantumOrbit} ${styles.orbit3}`}>
          <div className={`${styles.quantumParticle} ${styles.particle3}`} />
        </div>
        <div className={`${styles.quantumOrbit} ${styles.orbit4}`}>
          <div className={`${styles.quantumParticle} ${styles.particle4}`} />
        </div>
      </div>

      {/* Loading Text */}
      <div className={styles.loadingTextContainer}>
        <h2 className={styles.loadingTitle}>{message}</h2>
        <p className={styles.loadingSubtext}>{subtext}</p>
        
        {showProgress && (
          <div className={styles.loadingProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${Math.min(progress, 95)}%` }}
              />
            </div>
            <span className={styles.progressPercent}>
              {Math.round(Math.min(progress, 95))}%
            </span>
          </div>
        )}
      </div>

      {/* System Status Indicators */}
      <div className={styles.systemStatusContainer}>
        <div className={styles.statusIndicator}>
          <div className={styles.statusDot} />
          <span>Quantum Core</span>
        </div>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${styles.warning}`} />
          <span>Neural Link</span>
        </div>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${styles.critical}`} />
          <span>Defense Grid</span>
        </div>
      </div>
    </div>
  );
};

export default CyberLoader;
