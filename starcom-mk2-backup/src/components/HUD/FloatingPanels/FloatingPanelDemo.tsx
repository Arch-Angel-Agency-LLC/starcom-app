import React, { useEffect, useState } from 'react';
import { useFloatingPanels } from './FloatingPanelContext';
import AuroraPanel from './panels/AuroraPanel';
import SolarFlarePanel from './panels/SolarFlarePanel';
import QuickActionBubble from './panels/QuickActionBubble';
import MissionControlPanel from './panels/MissionControlPanel';
import SatelliteTrackingPanel from './panels/SatelliteTrackingPanel';
import ThreatAssessmentPanel from './panels/ThreatAssessmentPanel';
import styles from './FloatingPanelDemo.module.css';

const FloatingPanelDemo: React.FC = () => {
  const { 
    registerPanel, 
    addActiveFeature, 
    removeActiveFeature, 
    simulateGlobeHover,
    simulateGlobeClick 
  } = useFloatingPanels();
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Register demo panels
  useEffect(() => {
    if (!isInitialized) {
      // Aurora monitoring panel - appears in polar regions
      registerPanel({
        id: 'aurora-monitor',
        type: 'stream',
        title: 'Aurora Monitor',
        component: AuroraPanel,
        position: {
          anchorTo: 'geographic',
          lat: 70, // North polar region
          lng: -100,
          offset: { x: 50, y: -30 }
        },
        priority: 'primary',
        triggers: ['aurora', 'hover-polar'],
        data: {
          activity: 'Moderate',
          kpIndex: 4.2,
          visibility: 'High Latitude',
          forecast: 'Increasing'
        }
      });

      // Solar flare alert panel - appears globally during events
      registerPanel({
        id: 'solar-flare-alert',
        type: 'alert',
        title: 'Solar Flare Alert',
        component: SolarFlarePanel,
        position: {
          anchorTo: 'screen',
          x: window.innerWidth - 200,
          y: 150,
          offset: { x: 0, y: 0 }
        },
        priority: 'primary',
        triggers: ['solar-flare'],
        data: {
          class: 'M5.2',
          region: 'AR3536',
          peak: '14:32 UTC',
          duration: '12 min',
          impact: 'Radio Blackout',
          satellites: 7
        }
      });

      // Quick action bubble - appears on globe interaction
      registerPanel({
        id: 'quick-aurora-action',
        type: 'bubble',
        title: '',
        component: QuickActionBubble,
        position: {
          anchorTo: 'geographic',
          lat: 65,
          lng: -150,
          offset: { x: 0, y: -40 }
        },
        priority: 'primary',
        triggers: ['hover-polar'],
        data: {
          icon: '🌌',
          label: 'Aurora'
        }
      });

      // Solar activity bubble
      registerPanel({
        id: 'quick-solar-action',
        type: 'bubble',
        title: '',
        component: QuickActionBubble,
        position: {
          anchorTo: 'geographic',
          lat: 0,
          lng: 0,
          offset: { x: -80, y: 0 }
        },
        priority: 'primary',
        triggers: ['solar-flare'],
        data: {
          icon: '☀️',
          label: 'Solar'
        }
      });

      // Mission Control Panel - Command Center Operations
      registerPanel({
        id: 'mission-control-panel',
        type: 'control',
        title: 'Mission Control',
        component: MissionControlPanel,
        position: {
          anchorTo: 'screen',
          x: 100,
          y: 100,
          offset: { x: 0, y: 0 }
        },
        priority: 'primary',
        triggers: ['mission-control', 'operations'],
        data: {
          missionCount: 3,
          activeOperations: 2
        }
      });

      // Satellite Tracking Panel - Orbital Asset Monitoring
      registerPanel({
        id: 'satellite-tracking-panel',
        type: 'stream',
        title: 'Satellite Tracking',
        component: SatelliteTrackingPanel,
        position: {
          anchorTo: 'screen',
          x: 120,
          y: 200,
          offset: { x: 0, y: 0 }
        },
        priority: 'secondary',
        triggers: ['satellite-tracking', 'orbital-assets'],
        data: {
          trackingMode: 'active',
          satelliteCount: 4
        }
      });

      // Threat Assessment Panel - Security Operations Center
      registerPanel({
        id: 'threat-assessment-panel',
        type: 'alert',
        title: 'Threat Assessment',
        component: ThreatAssessmentPanel,
        position: {
          anchorTo: 'screen',
          x: 140,
          y: 300,
          offset: { x: 0, y: 0 }
        },
        priority: 'primary',
        triggers: ['threat-assessment', 'security-alert', 'space-hazards'],
        data: {
          alertLevel: 'orange',
          threatCount: 3
        }
      });

      setIsInitialized(true);
    }
  }, [registerPanel, isInitialized]);

  return (
    <div className={styles.floatingPanelDemo}>
      <div className={styles.demoControls}>
        <h3>🚀 Floating Panel Demo</h3>
        <p>Test the contextual floating panel system:</p>
        
        <div className={styles.buttonGroup}>
          <button 
            className={styles.demoButton}
            onClick={() => {
              simulateGlobeHover('polar');
              setTimeout(() => simulateGlobeHover(null), 5000);
            }}
          >
            🧊 Hover Polar Region
          </button>
          
          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('aurora');
              setTimeout(() => removeActiveFeature('aurora'), 10000);
            }}
          >
            🌌 Show Aurora Activity
          </button>
          
          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('solar-activity');
              setTimeout(() => removeActiveFeature('solar-activity'), 8000);
            }}
          >
            ☀️ Trigger Solar Flare
          </button>
          
          <button 
            className={styles.demoButton}
            onClick={() => {
              simulateGlobeClick(70, -100);
              setTimeout(() => simulateGlobeClick(0, 0), 3000);
            }}
          >
            📍 Click Arctic Region
          </button>

          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('mission-control');
              setTimeout(() => removeActiveFeature('mission-control'), 12000);
            }}
          >
            🚀 Mission Control Center
          </button>

          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('satellite-tracking');
              setTimeout(() => removeActiveFeature('satellite-tracking'), 15000);
            }}
          >
            🛰️ Satellite Tracking
          </button>

          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('operations');
              setTimeout(() => removeActiveFeature('operations'), 10000);
            }}
          >
            ⚡ Operations Dashboard
          </button>

          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('threat-assessment');
              setTimeout(() => removeActiveFeature('threat-assessment'), 18000);
            }}
          >
            🛡️ Threat Assessment
          </button>

          <button 
            className={styles.demoButton}
            onClick={() => {
              addActiveFeature('security-alert');
              setTimeout(() => removeActiveFeature('security-alert'), 12000);
            }}
          >
            🚨 Security Alert
          </button>
        </div>

        <div className={styles.instructions}>
          <h4>🎯 How it works:</h4>
          <ul>
            <li><strong>Geographic Anchoring:</strong> Panels appear near relevant Earth regions</li>
            <li><strong>Context Awareness:</strong> Different panels for different space weather events</li>
            <li><strong>Progressive Disclosure:</strong> Bubbles → Streams → Full Controls</li>
            <li><strong>Real-time Response:</strong> System reacts to space weather conditions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FloatingPanelDemo;
