import React from 'react';
import './StarcomPreloader.css';

/**
 * StarcomPreloader - Shows immediately on app load
 * Provides instant visual feedback while the app initializes
 */
const StarcomPreloader: React.FC = () => {
  return (
    <div className="starcom-preloader">
      <div className="starcom-preloader-background">
        {/* Animated stars background */}
        <div className="stars-layer stars-small"></div>
        <div className="stars-layer stars-medium"></div>
        <div className="stars-layer stars-large"></div>
        
        {/* Central loading animation */}
        <div className="starcom-preloader-center">
          <div className="starcom-logo-container">
            <div className="starcom-logo-glow"></div>
            <div className="starcom-logo-text">STARCOM</div>
            <div className="starcom-logo-subtitle">Intelligence Exchange</div>
          </div>
          
          {/* Orbital loading animation */}
          <div className="orbital-loader">
            <div className="orbit orbit-1">
              <div className="satellite satellite-1"></div>
            </div>
            <div className="orbit orbit-2">
              <div className="satellite satellite-2"></div>
            </div>
            <div className="orbit orbit-3">
              <div className="satellite satellite-3"></div>
            </div>
          </div>
          
          {/* Loading progress indicator */}
          <div className="loading-progress">
            <div className="progress-text">Initializing Systems...</div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
        
        {/* Scanning lines effect */}
        <div className="scan-lines">
          <div className="scan-line scan-line-1"></div>
          <div className="scan-line scan-line-2"></div>
          <div className="scan-line scan-line-3"></div>
        </div>
      </div>
    </div>
  );
};

export default StarcomPreloader;
