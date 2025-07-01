import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGlobalCommand } from '../../../hooks/useUnifiedGlobalCommand';
import styles from './Globe3DView.module.css';

interface Globe3DViewProps {
  className?: string;
  fullscreen?: boolean;
}

const Globe3DView: React.FC<Globe3DViewProps> = ({ className, fullscreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useGlobalCommand();
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  // Fade out after the real Globe has had time to load (matches GlobeLoadingManager timing)
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setShouldFadeOut(true);
    }, 4200); // Fade out after 4.2 seconds (slightly after GlobeLoadingManager completes)

    return () => clearTimeout(fadeTimer);
  }, []);

  const updateGlobeData = useCallback(() => {
    // TODO: Update globe with context-specific data
    console.log('Globe3D: Updating with context', state.enhanced?.primaryContextId);
  }, [state.enhanced?.primaryContextId]);

  const initializeGlobe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // TODO: Initialize actual 3D globe (Three.js, D3-geo, or WebGL)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Placeholder: Draw a simple circular outline
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Add grid lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      
      // Latitude lines
      for (let i = 1; i < 6; i++) {
        const y = (canvas.height / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Longitude lines
      for (let i = 1; i < 8; i++) {
        const x = (canvas.width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // No text labels - just a clean placeholder grid
    }
  }, []);

  const cleanupGlobe = useCallback(() => {
    // TODO: Cleanup 3D resources, event listeners, etc.
  }, []);

  useEffect(() => {
    // Initialize 3D globe when component mounts
    initializeGlobe();
    
    return () => {
      // Cleanup 3D resources
      cleanupGlobe();
    };
  }, [initializeGlobe, cleanupGlobe]);

  useEffect(() => {
    // Update globe when context changes
    updateGlobeData();
  }, [updateGlobeData]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert screen coordinates to approximate globe coordinates
    const lat = ((y / canvas.height) - 0.5) * -180; // Invert Y for latitude
    const lng = ((x / canvas.width) - 0.5) * 360;
    
    // Create a simulated investigation point
    const investigationPoint = {
      id: `point-${Date.now()}`,
      lat: Math.max(-90, Math.min(90, lat)),
      lng: Math.max(-180, Math.min(180, lng)),
      timestamp: new Date(),
      type: 'investigation' as const
    };
    
    // TODO: Integrate with global context or investigation system
    console.log('Investigation point created:', investigationPoint);
    
    // For now, show a visual indicator that the click was registered
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    indicator.style.width = '8px';
    indicator.style.height = '8px';
    indicator.style.backgroundColor = '#00ff41';
    indicator.style.borderRadius = '50%';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '100';
    indicator.style.animation = 'pulse 1s ease-out';
    
    const container = canvas.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(indicator);
      setTimeout(() => {
        if (container.contains(indicator)) {
          container.removeChild(indicator);
        }
      }, 1000);
    }
  };

  const handleViewChange = (viewType: string) => {
    // Implement globe view changes
    switch (viewType) {
      case 'satellite':
        console.log('Switching to satellite view');
        // TODO: Update globe texture/overlay to satellite imagery
        break;
      case 'political':
        console.log('Switching to political boundaries view');
        // TODO: Update globe overlay to show political boundaries
        break;
      case 'weather':
        console.log('Switching to weather data view');
        // TODO: Update globe overlay to show weather patterns
        break;
      case 'cyber':
        console.log('Switching to cyber threat view');
        // TODO: Update globe overlay to show cyber activity
        break;
      default:
        console.log('Switching to default globe view');
    }
    
    // Trigger a canvas redraw with the new view
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Add a subtle visual indicator of the view change
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = viewType === 'cyber' ? '#ff0040' : 
                       viewType === 'weather' ? '#0080ff' :
                       viewType === 'political' ? '#ffaa00' : '#00ff41';
        ctx.fillRect(0, 0, canvas.width, 4);
        ctx.restore();
        
        // Fade out the indicator
        setTimeout(() => {
          updateGlobeData();
        }, 500);
      }
    }
  };

  return (
    <div className={`${styles.globe3DView} ${fullscreen ? styles.fullscreen : ''} ${className || ''} ${shouldFadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>🌍</span>
          3D Global Intelligence
        </h2>
        <div className={styles.controls}>
          <button 
            className={styles.controlBtn}
            onClick={() => handleViewChange('satellite')}
          >
            SAT
          </button>
          <button 
            className={styles.controlBtn}
            onClick={() => handleViewChange('terrain')}
          >
            TER
          </button>
          <button 
            className={styles.controlBtn}
            onClick={() => handleViewChange('intelligence')}
          >
            INT
          </button>
        </div>
      </div>
      
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={600}
          onClick={handleCanvasClick}
        />
        
        <div className={styles.overlay}>
          <div className={styles.contextInfo}>
            Context: {state.enhanced?.primaryContextId || 'GLOBAL'}
          </div>
          <div className={styles.stats}>
            <div>Contexts: {state.enhanced?.activeContexts?.size || 0}</div>
            <div>AI: {state.ai?.recentInsights?.length || 0}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.coordinates}>
          LAT: 0.000° | LNG: 0.000° | ALT: 0m
        </div>
        <div className={styles.status}>
          GLOBE READY
        </div>
      </div>
    </div>
  );
};

export default Globe3DView;
