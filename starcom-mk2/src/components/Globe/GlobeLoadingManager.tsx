import React, { useState, useEffect } from 'react';
import './GlobeLoadingManager.css';

interface GlobeLoadingManagerProps {
  children: React.ReactNode;
  material: unknown; // THREE.Material or null
  globeEngine: unknown; // GlobeEngine or null
  fastTrackMode?: boolean; // User setting for fast loading
}

/**
 * GlobeLoadingManager - Manages the transition from preloader to globe loading to actual globe
 * Shows the tactical globe loading animation after the main preloader finishes
 */
const GlobeLoadingManager: React.FC<GlobeLoadingManagerProps> = ({ 
  children, 
  material,
  globeEngine,
  fastTrackMode = false, // Default to false if not provided
}) => {
  const [showGlobeLoader, setShowGlobeLoader] = useState(true);
  const [globeReady, setGlobeReady] = useState(false);

  useEffect(() => {
    // Don't start checking until we have material AND globeEngine
    if (!material || !globeEngine) {
      return;
    }

    // If fastTrackMode is enabled, skip to globe ready state
    if (fastTrackMode) {
      setGlobeReady(true);
      setTimeout(() => {
        setShowGlobeLoader(false);
      }, 800); // Smooth fade out
      return;
    }

    // Use fastTrackMode to determine animation duration
    const tacticalDuration = fastTrackMode ? 800 : 3000; // Fast track: 0.8s, Normal: 3s
    
    const tacticalTimer = setTimeout(() => {
      setGlobeReady(true);
      // Fade out the globe loader after animation completes
      setTimeout(() => {
        setShowGlobeLoader(false);
      }, 800); // Smooth fade out
    }, tacticalDuration);

    return () => clearTimeout(tacticalTimer);
  }, [material, globeEngine, fastTrackMode]);

  return (
    <>
      {showGlobeLoader && (
        <div className={`globe-loading-overlay ${globeReady ? 'fade-out' : ''}`}>
          <div className="tactical-loading">
            {/* Tactical Grid Background */}
            <div className="tactical-grid">
              <div className="grid-lines horizontal"></div>
              <div className="grid-lines vertical"></div>
            </div>
            
            {/* Main Globe Loader */}
            <div className="globe-loader-container">
              <div className="scanning-globe">
                <div className="globe-icon">🌍</div>
                <div className="scanning-dot"></div>
                <div className="inner-ring"></div>
              </div>
            </div>
            
            {/* Command Text */}
            <div className="command-text">
              INITIALIZING GLOBAL COMMAND...
            </div>
            
            {/* Status Lines */}
            <div className="status-lines">
              <div className="status-line" style={{ animationDelay: '0s' }}>
                › LOADING TACTICAL INTERFACE
              </div>
              <div className="status-line" style={{ animationDelay: '0.3s' }}>
                › ESTABLISHING SECURE CONNECTION
              </div>
              <div className="status-line" style={{ animationDelay: '0.6s' }}>
                › CALIBRATING SENSORS
              </div>
            </div>
            
            {/* Progress Bars */}
            <div className="progress-bars">
              {[0, 1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className="progress-bar"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className={`globe-content ${showGlobeLoader ? 'hidden' : 'visible'}`}>
        {children}
      </div>
    </>
  );
};

export default GlobeLoadingManager;
