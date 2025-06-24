import React, { useState, useEffect } from 'react';
import './GlobeLoadingManager.css';

// AI-NOTE: Generate matrix-style code rain for cyber command atmosphere
const generateMatrixCode = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()';
  const lines = 15;
  const charsPerLine = 3;
  let result = '';
  
  for (let i = 0; i < lines; i++) {
    for (let j = 0; j < charsPerLine; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '\n';
  }
  return result;
};

interface GlobeLoadingManagerProps {
  children: React.ReactNode;
  material: unknown; // THREE.Material or null
  globeEngine: unknown; // GlobeEngine or null
  fastTrackMode?: boolean; // User setting for fast loading
}

/**
 * GlobeLoadingManager - Manages smooth transitions from preloader to globe loading to actual globe
 * 
 * Transition Flow:
 * 1. Tactical loading animation plays (0.8s fast / 3s normal)
 * 2. Loader begins fading out (0.8s transition)
 * 3. Globe begins fading in with scale animation (0.6s)
 * 4. Loader is removed from DOM after globe is visible
 * 
 * This eliminates jarring transitions and blank screen flashes
 */
const GlobeLoadingManager: React.FC<GlobeLoadingManagerProps> = ({ 
  children, 
  material,
  globeEngine,
  fastTrackMode = false, // Default to false if not provided
}) => {
  const [showGlobeLoader, setShowGlobeLoader] = useState(true);
  const [globeVisible, setGlobeVisible] = useState(false);
  const [loaderFadingOut, setLoaderFadingOut] = useState(false);

  useEffect(() => {
    // Don't start checking until we have material AND globeEngine
    if (!material || !globeEngine) {
      return;
    }

    // Use fastTrackMode to determine animation duration
    const tacticalDuration = fastTrackMode ? 800 : 3000; // Fast track: 0.8s, Normal: 3s
    
    const tacticalTimer = setTimeout(() => {
      // Start the smooth transition sequence
      setTimeout(() => {
        setLoaderFadingOut(true); // Start fading out the loader
        
        setTimeout(() => {
          setGlobeVisible(true); // Start fading in the globe
          
          setTimeout(() => {
            setShowGlobeLoader(false); // Remove loader from DOM
          }, 600); // Wait for globe fade-in to complete
          
        }, 400); // Small delay before starting globe fade-in
        
      }, 200); // Brief pause after tactical animation
      
    }, tacticalDuration);

    return () => clearTimeout(tacticalTimer);
  }, [material, globeEngine, fastTrackMode]);

  return (
    <>
      {showGlobeLoader && (
        <div className={`globe-loading-overlay ${loaderFadingOut ? 'fade-out' : ''}`}>
          {/* Matrix-style code rain background */}
          <div className="matrix-rain">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={`code-column code-column-${i + 1}`}>
                {generateMatrixCode()}
              </div>
            ))}
          </div>
          
          {/* Signal interference overlay */}
          <div className="signal-interference"></div>
          
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
            
            {/* Enhanced Command Text */}
            <div className="command-text">
              INITIALIZING GLOBAL COMMAND...
            </div>
            
            {/* Enhanced Status Lines with cyber intelligence operations */}
            <div className="status-lines">
              <div className="status-line" style={{ animationDelay: '0s' }}>
                › ESTABLISHING QUANTUM ENCRYPTED CHANNELS
              </div>
              <div className="status-line" style={{ animationDelay: '0.4s' }}>
                › SYNCHRONIZING SATELLITE NETWORKS
              </div>
              <div className="status-line" style={{ animationDelay: '0.8s' }}>
                › ACTIVATING THREAT DETECTION PROTOCOLS
              </div>
              <div className="status-line" style={{ animationDelay: '1.2s' }}>
                › LOADING INTELLIGENCE DATABASES
              </div>
              <div className="status-line" style={{ animationDelay: '1.6s' }}>
                › CALIBRATING GLOBAL MONITORING SYSTEMS
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
      <div className={`globe-content ${globeVisible ? 'visible fade-in' : 'hidden'}`}>
        {children}
      </div>
    </>
  );
};

export default GlobeLoadingManager;
