import React, { useState, useEffect } from 'react';
import CompactNOAAControls from '../Bars/CyberCommandLeftSideBar/CompactNOAAControls';
import { NOAA_VISUALIZATIONS } from '../Bars/CyberCommandLeftSideBar/NOAAVisualizationConfig';
import styles from './NOAAPopup.module.css';

// AI-NOTE: Enhanced NOAA popup with progressive disclosure and improved UX
// Provides focused interface for NOAA space weather data visualization

interface NOAAPopupProps {
  onClose: () => void;
}

const NOAAPopup: React.FC<NOAAPopupProps> = ({ onClose }) => {
  const [isAdvancedView, setIsAdvancedView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDatasets, setActiveDatasets] = useState(0);

  // Calculate active datasets count and update when controls change
  useEffect(() => {
    const updateActiveCount = () => {
      const count = NOAA_VISUALIZATIONS.reduce((total, dataset) => 
        total + dataset.options.filter(opt => opt.enabled).length, 0);
      setActiveDatasets(count);
    };

    // Update immediately
    updateActiveCount();
    
    // Simulate loading state for smooth UX
    const timer = setTimeout(() => setIsLoading(false), 300);
    
    // Set up periodic updates to keep count synchronized
    const interval = setInterval(updateActiveCount, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab' && event.shiftKey) {
        setIsAdvancedView(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isLoading) {
    return (
      <div className={styles.noaaPopup}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading NOAA data controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.noaaPopup}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>🛰️ NOAA Space Weather</h3>
          <div className={styles.statusInfo}>
            <span className={styles.activeCount}>
              {activeDatasets} active dataset{activeDatasets !== 1 ? 's' : ''}
            </span>
            <span className={styles.viewMode}>
              {isAdvancedView ? 'Advanced' : 'Simple'} View
            </span>
          </div>
        </div>
        
        <div className={styles.headerControls}>
          <button 
            className={`${styles.viewToggle} ${isAdvancedView ? styles.advanced : styles.simple}`}
            onClick={() => setIsAdvancedView(!isAdvancedView)}
            title={`Switch to ${isAdvancedView ? 'simple' : 'advanced'} view (Shift+Tab)`}
          >
            {isAdvancedView ? '📊' : '🎯'}
          </button>
          
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close NOAA popup (Escape)"
            title="Close (Escape)"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className={styles.content}>
        {isAdvancedView ? (
          <div className={styles.advancedView}>
            <CompactNOAAControls className={styles.fullControls} />
            <div className={styles.advancedInfo}>
              <h4>About NOAA Data</h4>
              <p>
                Real-time space weather data from the National Oceanic and Atmospheric Administration. 
                Monitor solar activity, geomagnetic conditions, and radiation levels affecting Earth.
              </p>
              <div className={styles.dataCategories}>
                <span className={styles.category}>☀️ Solar</span>
                <span className={styles.category}>🧲 Geomagnetic</span>
                <span className={styles.category}>☢️ Radiation</span>
                <span className={styles.category}>🌌 Cosmic</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.simpleView}>
            <CompactNOAAControls className={styles.compactControls} />
          </div>
        )}
      </div>
      
      <div className={styles.shortcuts}>
        <span>ESC: Close</span>
        <span>Shift+Tab: Toggle View</span>
      </div>
    </div>
  );
};

export default NOAAPopup;
