import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../../../../hooks/useUnifiedGlobalCommand';
import { useOverlayData } from '../../../../hooks/useOverlayData';
import styles from './RightSideBar.module.css';
import GlobeStatus from './GlobeStatus';
import AIActionsPanelLayered from '../../../AI/AIActionsPanelLayered';
import { AIErrorBoundary } from '../../../ErrorBoundaries/AIErrorBoundary';
import { useFeatureFlag } from '../../../../utils/featureFlags';
import CollaborationPanel from '../../../Collaboration/CollaborationPanel';
import DeveloperToolbar from '../../DeveloperToolbar/DeveloperToolbar';
import { IntelReport } from '../../../../models/IntelReport';
import { IntelReportFormData } from '../../Corners/BottomRight/IntelReportFormData';
import { useWallet } from '@solana/wallet-adapter-react';
import { submitIntelReport } from '../../../../api/intelligence';
import SubmitIntelReportPopup from '../../Corners/BottomRight/SubmitIntelReportPopup';

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

const RightSideBar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<'mission' | 'intel' | 'ai' | 'collaboration' | 'apps' | 'developer'>('mission');
  const { currentSession, isConnected, collaborationState } = useCollaboration();
  const aiSuggestionsEnabled = useFeatureFlag('aiSuggestionsEnabled');
  const collaborationEnabled = useFeatureFlag('collaborationEnabled');
  const overlayData = useOverlayData();

  // Intel Report state
  const [isIntelPopupOpen, setIsIntelPopupOpen] = useState(false);
  const [intelFormData, setIntelFormData] = useState<IntelReportFormData>({
    lat: '',
    long: '',
    title: '',
    subtitle: '',
    date: '',
    author: '',
    content: '',
    tags: '',
    categories: '',
    metaDescription: '',
  });
  const [intelStatus, setIntelStatus] = useState<string>('');
  const { publicKey, signTransaction, connected } = useWallet();

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

  // Intel Report handlers
  const handleOpenIntelPopup = () => setIsIntelPopupOpen(true);
  const handleCloseIntelPopup = () => setIsIntelPopupOpen(false);

  const handleIntelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIntelFormData((prev: IntelReportFormData) => ({ ...prev, [name]: value }));
  };

  const handleIntelSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!connected || !publicKey || !signTransaction) {
      setIntelStatus('Please connect your wallet to submit reports.');
      return;
    }

    setIntelStatus('Submitting Intel Report to Solana...');
    
    try {
      // Create report data for blockchain submission
      const reportData = {
        title: intelFormData.title,
        content: intelFormData.content,
        tags: intelFormData.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag),
        latitude: parseFloat(intelFormData.lat) || 0,
        longitude: parseFloat(intelFormData.long) || 0,
      };

      // Submit to Solana blockchain
      const signature = await submitIntelReport(reportData, { publicKey, signTransaction });
      
      setIntelStatus(`Report submitted successfully! Tx: ${signature.substring(0, 8)}...`);
      
      // Also create local IntelReport object for logging/debugging
      const newIntelReport = new IntelReport(
        parseFloat(intelFormData.lat),
        parseFloat(intelFormData.long),
        intelFormData.title,
        intelFormData.subtitle,
        intelFormData.date,
        intelFormData.author,
        intelFormData.content,
        intelFormData.tags.split(',').map((tag: string) => tag.trim()),
        intelFormData.categories.split(',').map((category: string) => category.trim()),
        intelFormData.metaDescription
      );
      
      console.log('Intel Report Submitted to Blockchain:', {
        signature,
        report: newIntelReport,
        publicKey: publicKey.toString()
      });
      
      // Reset form and close popup after success
      setTimeout(() => {
        setIntelStatus('');
        handleCloseIntelPopup();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting intel report:', error);
      setIntelStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setIntelFormData((prev: IntelReportFormData) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        }));
      });
    }
  };

  const handleMapSelect = (lat: string, long: string) => {
    setIntelFormData((prev: IntelReportFormData) => ({ ...prev, lat, long }));
  };

  const renderGlobeStatus = () => (
    <div className={styles.sectionContent}>
      <GlobeStatus overlayData={overlayData} />
    </div>
  );

  const renderIntelHub = () => (
    <div className={styles.sectionContent}>
      <div className={styles.intelCard}>
        <div className={styles.intelHeader}>
          <span className={styles.intelIcon}>🎯</span>
          <span>Intelligence Operations</span>
        </div>
        
        {/* Create Intel Report Section */}
        <div className={styles.intelCreateSection}>
          <button 
            className={styles.createIntelBtn}
            onClick={handleOpenIntelPopup}
          >
            📝 Create Intel Report
          </button>
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
          <div className={styles.intelItem}>
            <span className={styles.intelLabel}>Network Status:</span>
            <span className={styles.intelValue}>⚠️ Limited</span>
          </div>
        </div>
        
        <div className={styles.intelActions}>
          <button className={styles.intelBtn}>View Reports</button>
          <button className={styles.intelBtn}>Manage Alerts</button>
          <button className={styles.intelBtn}>Exchange Market</button>
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

      {/* Intel Report Creation Popup */}
      <SubmitIntelReportPopup
        isOpen={isIntelPopupOpen}
        onClose={handleCloseIntelPopup}
        formData={intelFormData}
        handleChange={handleIntelChange}
        handleSubmit={handleIntelSubmit}
        handleMintToken={() => {}} // Placeholder for now
        handleMintNFT={() => {}} // Placeholder for now
        status={intelStatus}
        handleAutoLocation={handleAutoLocation}
        mapSelectorProps={{
          lat: intelFormData.lat,
          long: intelFormData.long,
          onSelect: handleMapSelect,
        }}
      />
    </div>
  );
};

export default RightSideBar;