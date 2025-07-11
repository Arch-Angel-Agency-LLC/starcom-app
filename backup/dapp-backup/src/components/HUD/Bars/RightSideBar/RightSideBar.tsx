import React, { useState, useEffect } from 'react';
import { useRightSideBar } from '../../../../context/useRightSideBar';
import { useOverlayData } from '../../../../hooks/useOverlayData';
import { useFloatingPanel } from '../../../../hooks/useFloatingPanel';
import styles from './RightSideBar.module.css';
import GlobeStatus from './GlobeStatus';
import DeveloperToolbar from '../../DeveloperToolbar/DeveloperToolbar';
import CyberInvestigationHub from './CyberInvestigationHub';
import ChatOverlay from '../../../Chat/ChatOverlay';
import ChatFloatingPanel from '../../FloatingPanels/panels/ChatFloatingPanel';

// Import assets from public directory (served directly by Vite)
const cryptoSentinelIcon = '/assets/images/icons/x128/starcom_icon-cryptosentinel-01a.jpg';
const astroTraderIcon = '/assets/images/icons/x128/starcom_icon-astromarkettrader-01a.jpg';
const globalPulseIcon = '/assets/images/icons/x128/starcom_icon-globalpulse.jpg';
const dataFeedIcon = '/assets/images/icons/x128/starcom_icon-datafeed-01a.jpg';
const astroTrader2Icon = '/assets/images/icons/x128/starcom_icon-astromarkettrader-02a.jpg';
const cryptoWatchdogIcon = '/assets/images/icons/x128/starcom_icon-cryptowatchdog.jpg';
const marketSeerIcon = '/assets/images/icons/x128/starcom_icon-astromarketseer-01a.jpg';
const marketAstrologyIcon = '/assets/images/icons/x128/starcom_icon-marketastrology-01a.jpg';
const netTraderIcon = '/assets/images/icons/x128/starcom_icon-globalnettrader-01a.jpg';

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
  // Use the RightSideBar context instead of local state
  const { 
    isCollapsed, 
    setIsCollapsed, 
    activeSection, 
    setActiveSection,
    sidebarWidth 
  } = useRightSideBar();
  
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
  const overlayData = useOverlayData();
  const { openPanel } = useFloatingPanel();
  
  // Apply dynamic width to sidebar element
  const getContainerClassName = () => {
    let className = `${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`;
    
    // Add expanded class when chat tab is active
    if (activeSection === 'chat' && !isCollapsed) {
      className += ` ${styles.expanded}`;
    }
    
    return className;
  };
  
  // Mock chat statistics
  const chatStats = {
    globalMessages: 47,
    groupMessages: 23,
    directMessages: 8,
    activeUsers: 156,
    onlineUsers: 89
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

  const renderChatHub = () => (
    <div className={styles.sectionContent}>
      <div className={styles.chatHub}>
        <div className={styles.chatHeader}>
          <h3>💬 Global Chat & Communications</h3>
          <div className={styles.chatHint}>
            🔒 Quantum-encrypted communications hub
          </div>
        </div>
        
        <div className={styles.chatStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Global Messages</span>
            <span className={styles.statValue}>{chatStats.globalMessages}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Group Messages</span>
            <span className={styles.statValue}>{chatStats.groupMessages}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Direct Messages</span>
            <span className={styles.statValue}>{chatStats.directMessages}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Online Users</span>
            <span className={styles.statValue}>{chatStats.onlineUsers}/{chatStats.activeUsers}</span>
          </div>
        </div>
        
        <button 
          className={styles.openChatBtn}
          onClick={() => {
            // Open chat in a floating panel instead of overlay
            openPanel('chat-panel', ChatFloatingPanel, {
              title: '💬 Quantum Communications Hub',
              width: 800,
              height: 600,
              resizable: true,
              moveable: true
            });
          }}
        >
          🚀 Open Chat Interface
        </button>
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
    <div className={getContainerClassName()}>
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
          className={`${styles.navBtn} ${activeSection === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveSection('chat')}
          title="Global Chat & Communications"
          aria-label="Global Chat & Communications"
        >
          💬
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
        {activeSection === 'chat' && renderChatHub()}
        {activeSection === 'apps' && renderExternalApps()}
        {activeSection === 'developer' && process.env.NODE_ENV === 'development' && (
          <div className={styles.developerSection}>
            <DeveloperToolbar />
          </div>
        )}
      </div>

      {/* Chat Overlay - Legacy method, keeping for backwards compatibility */}
      {isChatOverlayOpen && (
        <ChatOverlay 
          isOpen={isChatOverlayOpen}
          onClose={() => setIsChatOverlayOpen(false)}
        />
      )}

      {/* Enhanced Status Footer with Mission Control Status */}
      <div className={styles.statusFooter}>
        <div className={`${styles.statusDot} ${styles.operationalDot}`}></div>
        {!isCollapsed ? (
          <div className={styles.statusContainer}>
            <div className={`${styles.operationalStatus} ${styles.operational}`}>
              <span>OPERATIONAL</span>
            </div>
            <div className={styles.phaseStatus}>
              <span className={styles.phaseIcon}>🌍</span>
              <span className={styles.phaseLabel}>Mission Control</span>
            </div>
          </div>
        ) : (
          <span className={styles.phaseIcon}>🌍</span>
        )}
      </div>
    </div>
  );
};

export default RightSideBar;