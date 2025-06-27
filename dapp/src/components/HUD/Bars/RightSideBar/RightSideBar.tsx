import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../../../../hooks/useUnifiedGlobalCommand';
import { useOverlayData } from '../../../../hooks/useOverlayData';
import styles from './RightSideBar.module.css';
import GlobeStatus from './GlobeStatus';
import AIActionsPanelLayered from '../../../AI/AIActionsPanelLayered';
import { AIErrorBoundary } from '../../../ErrorBoundaries/AIErrorBoundary';
import { useFeatureFlag } from '../../../../utils/featureFlags';
import CollaborationPanel from '../../../Collaboration/CollaborationPanel';
import EarthAllianceCommunicationPanel from '../../../Collaboration/EarthAllianceCommunicationPanel';
import DeveloperToolbar from '../../DeveloperToolbar/DeveloperToolbar';
import CyberInvestigationHub from './CyberInvestigationHub';

// Import assets properly for production builds
import cryptoSentinelIcon from '/src/assets/images/icons/x128/starcom_icon-cryptosentinel-01a.jpg';
import astroTraderIcon from '/src/assets/images/icons/x128/starcom_icon-astromarkettrader-01a.jpg';
import globalPulseIcon from '/src/assets/images/icons/x128/starcom_icon-globalpulse.jpg';
import dataFeedIcon from '/src/assets/images/icons/x128/starcom_icon-datafeed-01a.jpg';
import astroTrader2Icon from '/src/assets/images/icons/x128/starcom_icon-astromarkettrader-02a.jpg';
import cryptoWatchdogIcon from '/src/assets/images/icons/x128/starcom_icon-cryptowatchdog.jpg';
import marketSeerIcon from '/src/assets/images/icons/x128/starcom_icon-astromarketseer-01a.jpg';
import marketAstrologyIcon from '/src/assets/images/icons/x128/starcom_icon-marketastrology-01a.jpg';
import netTraderIcon from '/src/assets/images/icons/x128/starcom_icon-globalnettrader-01a.jpg';

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

const RightSideBar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<'mission' | 'intel' | 'ai' | 'collaboration' | 'earth-alliance' | 'apps' | 'developer'>('mission');
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

  const renderGlobeStatus = () => (
    <div className={styles.sectionContent}>
      <GlobeStatus overlayData={overlayData} />
    </div>
  );

  const renderIntelHub = () => (
    <div className={styles.sectionContent}>
      <CyberInvestigationHub isCollapsed={isCollapsed} />
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
          title="Globe Status"
          aria-label="Globe Status"
        >
          📡
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'intel' ? styles.active : ''}`}
          onClick={() => setActiveSection('intel')}
          title="Intelligence Operations"
          aria-label="Intelligence Operations"
        >
          🎯
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
          className={`${styles.navBtn} ${activeSection === 'collaboration' ? styles.active : ''}`}
          onClick={() => setActiveSection('collaboration')}
          title="Multi-Agency Collaboration"
          aria-label="Multi-Agency Collaboration"
        >
          👥
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'earth-alliance' ? styles.active : ''}`}
          onClick={() => setActiveSection('earth-alliance')}
          title="Earth Alliance Operations"
          aria-label="Earth Alliance Operations"
        >
          🌍
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
        {activeSection === 'mission' && renderGlobeStatus()}
        {activeSection === 'intel' && renderIntelHub()}
        {activeSection === 'ai' && aiSuggestionsEnabled && (
          <AIErrorBoundary fallback={
            <div className={styles.errorFallback}>
              <span>⚠️ AI Actions Unavailable</span>
            </div>
          }>
            <AIActionsPanelLayered className={styles.aiSection} />
          </AIErrorBoundary>
        )}
        {activeSection === 'collaboration' && (
          <div className={styles.collaborationSection}>
            <CollaborationPanel />
          </div>
        )}
        {activeSection === 'earth-alliance' && (
          <div className={styles.earthAllianceSection}>
            <EarthAllianceCommunicationPanel />
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