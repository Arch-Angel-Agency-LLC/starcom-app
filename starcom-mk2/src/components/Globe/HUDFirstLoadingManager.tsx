import React, { useState, useEffect } from 'react';
import './HUDFirstLoadingManager.css';

interface HUDFirstLoadingManagerProps {
  children: React.ReactNode;
  hudElement: React.ReactNode;
  material: unknown; // THREE.Material or null
  globeEngine: unknown; // GlobeEngine or null
  fastTrackMode?: boolean; // User setting for fast loading
}

/**
 * HUDFirstLoadingManager - Shows HUD first, then tactical loading, then Globe
 * This creates the sequence: HUD → Tactical Animation → Globe
 */
const HUDFirstLoadingManager: React.FC<HUDFirstLoadingManagerProps> = ({ 
  children, 
  hudElement,
  material,
  globeEngine,
  fastTrackMode = false
}) => {
  const [phase, setPhase] = useState<'hud' | 'tactical' | 'globe'>('hud');
  const [showTacticalLoader, setShowTacticalLoader] = useState(false);
  const [tacticalComplete, setTacticalComplete] = useState(false);

  useEffect(() => {
    // Phase 1: HUD loads first and shows immediately
    setPhase('hud');
    
    // Phase 2: After HUD is ready, show tactical loading
    const startTactical = setTimeout(() => {
      setPhase('tactical');
      setShowTacticalLoader(true);
    }, 500); // Small delay for HUD to settle

    return () => clearTimeout(startTactical);
  }, []);

  useEffect(() => {
    // Phase 3: When Globe resources are ready, transition to Globe
    if (phase === 'tactical' && material && globeEngine) {
      const tacticalDuration = fastTrackMode ? 800 : 2500; // Fast track or full animation
      
      const completeLoading = setTimeout(() => {
        setTacticalComplete(true);
        setTimeout(() => {
          setPhase('globe');
          setShowTacticalLoader(false);
        }, 600); // Fade out time
      }, tacticalDuration);

      return () => clearTimeout(completeLoading);
    }
  }, [phase, material, globeEngine, fastTrackMode]);

  return (
    <div className="hud-first-container">
      {/* HUD Layer - Always visible */}
      <div className={`hud-layer ${phase === 'hud' ? 'hud-entering' : 'hud-ready'}`}>
        {hudElement}
      </div>

      {/* Tactical Loading Overlay */}
      {showTacticalLoader && (
        <div className={`tactical-overlay ${tacticalComplete ? 'fade-out' : ''}`}>
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
              <div className="status-line" style={{ animationDelay: '0.9s' }}>
                › SYNCHRONIZING ORBITAL DATA
              </div>
              <div className="status-line" style={{ animationDelay: '1.2s' }}>
                › GLOBE VISUALIZATION READY
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

      {/* Globe Layer - Only visible when ready */}
      <div className={`globe-layer ${phase === 'globe' ? 'globe-ready' : 'globe-hidden'}`}>
        {children}
      </div>
    </div>
  );
};

export default HUDFirstLoadingManager;
