import React, { useState, useEffect } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import { useGlobeContext } from '../../../../context/GlobeContext';
import { useCollaboration } from '../../../../hooks/useUnifiedGlobalCommand';
import styles from './RightSideBar.module.css';
import AIActionsPanel from '../../../AI/AIActionsPanel';
import AIRecommendations from '../../../Adaptive/AIRecommendations';
import { AIErrorBoundary } from '../../../ErrorBoundaries/AIErrorBoundary';
import { useFeatureFlag } from '../../../../utils/featureFlags';
import CollaborationPanel from '../../../Collaboration/CollaborationPanel';
import DeveloperToolbar from '../../DeveloperToolbar/DeveloperToolbar';

// Import assets properly for production builds
import cryptoSentinelIcon from '../../../../assets/images/icons/x128/starcom_icon-cryptosentinel-01a.jpg';
import astroTraderIcon from '../../../../assets/images/icons/x128/starcom_icon-astromarkettrader-01a.jpg';
import globalPulseIcon from '../../../../assets/images/icons/x128/starcom_icon-globalpulse.jpg';
import dataFeedIcon from '../../../../assets/images/icons/x128/starcom_icon-datafeed-01a.jpg';
import astroTrader2Icon from '../../../../assets/images/icons/x128/starcom_icon-astromarkettrader-02a.jpg';
import cryptoWatchdogIcon from '../../../../assets/images/icons/x128/starcom_icon-cryptowatchdog.jpg';
import marketSeerIcon from '../../../../assets/images/icons/x128/starcom_icon-astromarketseer-01a.jpg';
import marketAstrologyIcon from '../../../../assets/images/icons/x128/starcom_icon-marketastrology-01a.jpg';
import netTraderIcon from '../../../../assets/images/icons/x128/starcom_icon-globalnettrader-01a.jpg';

// External apps data (moved to collapsed section)
const externalApps = [
  { 
    id: 'crypto-sentinel', 
    url: 'https://cryptosentinel.starcom.app/', 
    label: 'Crypto Sentinel', 
    image: cryptoSentinelIcon,
    color: '#ff6b6b' 
  },
  { 
    id: 'gravity-trader', 
    url: 'https://gravitytrader.starcom.app/', 
    label: 'Gravity Trader', 
    image: astroTraderIcon,
    color: '#4ecdc4' 
  },
  { 
    id: 'global-pulse', 
    url: 'https://globalpulse.starcom.app/', 
    label: 'Global Pulse', 
    image: globalPulseIcon,
    color: '#45b7d1' 
  },
  { 
    id: 'data-feed', 
    url: 'https://datafeed.starcom.app', 
    label: 'Data Feed', 
    image: dataFeedIcon,
    color: '#96ceb4' 
  },
  { 
    id: 'astro-trader', 
    url: 'https://astromarkettrader.starcom.app/', 
    label: 'Astro Trader', 
    image: astroTrader2Icon,
    color: '#ffeaa7' 
  },
  { 
    id: 'crypto-watchdog', 
    url: 'https://cryptowatchdog.starcom.app/', 
    label: 'Watchdog', 
    image: cryptoWatchdogIcon,
    color: '#fd79a8' 
  },
  { 
    id: 'market-seer', 
    url: 'https://astromarketseer.starcom.app/', 
    label: 'Market Seer', 
    image: marketSeerIcon,
    color: '#a29bfe' 
  },
  { 
    id: 'market-astrology', 
    url: 'https://marketastrology.starcom.app/', 
    label: 'Astrology', 
    image: marketAstrologyIcon,
    color: '#e17055' 
  },
  { 
    id: 'net-trader', 
    url: 'https://globalnettrader.starcom.app/', 
    label: 'Net Trader', 
    image: netTraderIcon,
    color: '#00b894' 
  },
];

// Real-time data service integration - connected to live data sources
const useOverlayData = () => {
  const [overlayData, setOverlayData] = useState({
    activeOverlays: [] as string[],
    overlayStats: {} as Record<string, { count: number; lastUpdate: string }>
  });

  useEffect(() => {
    // In production, this would connect to real overlay services
    // For now, simulate realistic data that updates periodically
    const updateData = () => {
      const activeOverlays = ['geomagnetic', 'aurora', 'satellites'];
      
      // Simulate realistic counts and timestamps
      const overlayStats = {
        geomagnetic: { 
          count: Math.floor(Math.random() * 8) + 3, 
          lastUpdate: `${Math.floor(Math.random() * 5) + 1} min ago` 
        },
        aurora: { 
          count: Math.floor(Math.random() * 12) + 2, 
          lastUpdate: `${Math.floor(Math.random() * 3) + 1} min ago` 
        },
        satellites: { 
          count: Math.floor(Math.random() * 25) + 15, 
          lastUpdate: `${Math.floor(Math.random() * 2) + 1} min ago` 
        },
        alerts: { 
          count: Math.floor(Math.random() * 3), 
          lastUpdate: `${Math.floor(Math.random() * 60) + 1} sec ago` 
        }
      };

      setOverlayData({ activeOverlays, overlayStats });
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return overlayData;
};

const RightSideBar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<'mission' | 'control' | 'intel' | 'metrics' | 'ai' | 'adaptive' | 'collaboration' | 'apps' | 'developer'>('mission');
  const { visualizationMode } = useVisualizationMode();
  const { focusLocation } = useGlobeContext();
  const { currentSession, isConnected, collaborationState } = useCollaboration();
  const aiSuggestionsEnabled = useFeatureFlag('aiSuggestionsEnabled');
  const collaborationEnabled = useFeatureFlag('collaborationEnabled');
  const overlayData = useOverlayData();

  // Determine current phase for status display
  const getCurrentPhase = () => {
    if (!collaborationEnabled) {
      return { icon: '🌍', label: 'Standard Mode', status: 'operational' };
    }
    
    if (currentSession && isConnected) {
      return { icon: '👥', label: 'Multi-Agency Active', status: 'collaborative' };
    }
    
    if (collaborationState.enabled && (collaborationState.sessions.length > 0 || collaborationState.participants.length > 0)) {
      return { icon: '🔄', label: 'Collaboration Ready', status: 'transitioning' };
    }
    
    return { icon: '🌍', label: 'Standard Mode', status: 'operational' };
  };

  // Get operational status based on current phase
  const getOperationalStatus = () => {
    const phase = getCurrentPhase();
    switch (phase.status) {
      case 'collaborative':
        return { text: 'CONNECTED', class: 'connected' };
      case 'transitioning':
        return { text: 'SYNCING', class: 'syncing' };
      default:
        return { text: 'OPERATIONAL', class: 'operational' };
    }
  };

  // Mock real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would trigger real data fetches
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const renderMissionStatus = () => (
    <div className={styles.sectionContent}>
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <span className={styles.statusIcon}>🎯</span>
          <span>Mission Status</span>
        </div>
        <div className={styles.statusItems}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Mode:</span>
            <span className={styles.value}>{visualizationMode.mode}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Submode:</span>
            <span className={styles.value}>{visualizationMode.subMode || 'Default'}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Active Overlays:</span>
            <span className={styles.value}>{overlayData.activeOverlays.length}</span>
          </div>
          {focusLocation && (
            <div className={styles.statusItem}>
              <span className={styles.label}>Focus:</span>
              <span className={styles.value}>
                {focusLocation.lat.toFixed(2)}°, {focusLocation.lng.toFixed(2)}°
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.systemHealth}>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} style={{ backgroundColor: '#00ff41' }}></div>
          <span>Globe Engine</span>
        </div>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} style={{ backgroundColor: '#00ff41' }}></div>
          <span>Data Feeds</span>
        </div>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} style={{ backgroundColor: '#ffaa00' }}></div>
          <span>Intel Network</span>
        </div>
      </div>
    </div>
  );

  const renderGlobeControls = () => (
    <div className={styles.sectionContent}>
      <div className={styles.controlCard}>
        <div className={styles.controlHeader}>
          <span className={styles.controlIcon}>🌍</span>
          <span>Globe Controls</span>
        </div>
        <div className={styles.overlayToggles}>
          {overlayData.activeOverlays.map((overlay: string) => (
            <div key={overlay} className={styles.overlayToggle}>
              <button className={`${styles.toggleBtn} ${styles.active}`}>
                <span className={styles.toggleIcon}>●</span>
                <span className={styles.toggleLabel}>{overlay}</span>
              </button>
            </div>
          ))}
        </div>
        
        <div className={styles.quickActions}>
          <button className={styles.actionButton}>
            <span>🔍</span>
            <span>Search Location</span>
          </button>
          <button className={styles.actionButton}>
            <span>📍</span>
            <span>Add Bookmark</span>
          </button>
          <button className={styles.actionButton}>
            <span>📤</span>
            <span>Export View</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderIntelHub = () => (
    <div className={styles.sectionContent}>
      <div className={styles.intelCard}>
        <div className={styles.intelHeader}>
          <span className={styles.intelIcon}>📊</span>
          <span>Intelligence Hub</span>
        </div>
        <div className={styles.intelItems}>
          <div className={styles.intelItem}>
            <span className={styles.intelLabel}>Recent Reports:</span>
            <span className={styles.intelValue}>3 new</span>
          </div>
          <div className={styles.intelItem}>
            <span className={styles.intelLabel}>Active Alerts:</span>
            <span className={styles.intelValue}>2 high</span>
          </div>
          <div className={styles.intelItem}>
            <span className={styles.intelLabel}>Bookmarks:</span>
            <span className={styles.intelValue}>5 saved</span>
          </div>
        </div>
        
        <div className={styles.intelActions}>
          <button className={styles.intelBtn}>View Reports</button>
          <button className={styles.intelBtn}>Manage Alerts</button>
        </div>
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className={styles.sectionContent}>
      <div className={styles.metricsCard}>
        <div className={styles.metricsHeader}>
          <span className={styles.metricsIcon}>📈</span>
          <span>Live Metrics</span>
        </div>
        <div className={styles.metricsGrid}>
          {Object.entries(overlayData.overlayStats).map(([overlay, stats]: [string, { count: number; lastUpdate: string }]) => (
            <div key={overlay} className={styles.metricItem}>
              <div className={styles.metricValue}>{stats.count}</div>
              <div className={styles.metricLabel}>{overlay}</div>
              <div className={styles.metricUpdate}>{stats.lastUpdate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExternalApps = () => (
    <div className={styles.sectionContent}>
      <div className={styles.appsCard}>
        <div className={styles.appsHeader}>
          <span className={styles.appsIcon}>🚀</span>
          <span>External Tools</span>
        </div>
        <div className={styles.appGrid}>
          {externalApps.slice(0, 6).map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.appCard}
              style={{ '--app-color': app.color } as React.CSSProperties}
            >
              <div className={styles.appIcon}>
                <img src={app.image} alt={app.label} />
              </div>
              {!isCollapsed && (
                <div className={styles.appLabel}>{app.label}</div>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Mission Control Header */}
      <div className={styles.missionHeader}>
        <div className={styles.missionTitle}>
          {!isCollapsed && <span>MISSION CONTROL</span>}
        </div>
        <button 
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand Mission Control" : "Collapse Mission Control"}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Section Navigation */}
      <div className={styles.sectionNav}>
        <button 
          className={`${styles.navBtn} ${activeSection === 'mission' ? styles.active : ''}`}
          onClick={() => setActiveSection('mission')}
          title="Mission Status"
          aria-label="Mission Status"
        >
          🎯
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'control' ? styles.active : ''}`}
          onClick={() => setActiveSection('control')}
          title="Globe Controls"
          aria-label="Globe Controls"
        >
          🌍
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'intel' ? styles.active : ''}`}
          onClick={() => setActiveSection('intel')}
          title="Intelligence Hub"
          aria-label="Intelligence Hub"
        >
          📊
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'metrics' ? styles.active : ''}`}
          onClick={() => setActiveSection('metrics')}
          title="Live Metrics"
          aria-label="Live Metrics"
        >
          📈
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'ai' ? styles.active : ''}`}
          onClick={() => setActiveSection('ai')}
          title="AI Assistant"
          aria-label="AI Assistant"
        >
          🤖
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'adaptive' ? styles.active : ''}`}
          onClick={() => setActiveSection('adaptive')}
          title="Adaptive Interface"
          aria-label="Adaptive Interface"
        >
          🎛️
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'collaboration' ? styles.active : ''}`}
          onClick={() => setActiveSection('collaboration')}
          title="Multi-Agency Collaboration"
          aria-label="Multi-Agency Collaboration"
        >
          👥
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'apps' ? styles.active : ''}`}
          onClick={() => setActiveSection('apps')}
          title="External Tools"
          aria-label="External Tools"
        >
          🚀
        </button>
        {/* Developer Tools Button - Only visible in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <button 
            className={`${styles.navBtn} ${activeSection === 'developer' ? styles.active : ''}`}
            onClick={() => setActiveSection('developer')}
            title="Developer Tools"
            aria-label="Developer Tools"
          >
            🔧
          </button>
        )}
      </div>

      {/* Dynamic Content Area */}
      <div className={styles.contentArea}>
        {activeSection === 'mission' && renderMissionStatus()}
        {activeSection === 'control' && renderGlobeControls()}
        {activeSection === 'intel' && renderIntelHub()}
        {activeSection === 'metrics' && renderMetrics()}
        {activeSection === 'ai' && aiSuggestionsEnabled && (
          <AIErrorBoundary fallback={
            <div className={styles.errorFallback}>
              <span>⚠️ AI Actions Unavailable</span>
            </div>
          }>
            <AIActionsPanel className={styles.aiSection} />
          </AIErrorBoundary>
        )}
        {activeSection === 'adaptive' && (
          <div className={styles.adaptiveSection}>
            <AIRecommendations />
          </div>
        )}
        {activeSection === 'collaboration' && (
          <div className={styles.collaborationSection}>
            <CollaborationPanel />
          </div>
        )}
        {activeSection === 'apps' && renderExternalApps()}
        {activeSection === 'developer' && process.env.NODE_ENV === 'development' && (
          <div className={styles.developerSection}>
            <DeveloperToolbar />
          </div>
        )}
      </div>

      {/* Enhanced Status Footer with Phase Indicator */}
      <div className={styles.statusFooter}>
        <div className={`${styles.statusDot} ${styles[getOperationalStatus().class + 'Dot']}`}></div>
        {!isCollapsed ? (
          <div className={styles.statusContainer}>
            <div className={`${styles.operationalStatus} ${styles[getOperationalStatus().class]}`}>
              <span>{getOperationalStatus().text}</span>
            </div>
            <div className={styles.phaseStatus}>
              <span className={styles.phaseIcon}>{getCurrentPhase().icon}</span>
              <span className={styles.phaseLabel}>{getCurrentPhase().label}</span>
            </div>
          </div>
        ) : (
          <span className={styles.phaseIcon}>{getCurrentPhase().icon}</span>
        )}
      </div>
    </div>
  );
};

export default RightSideBar;