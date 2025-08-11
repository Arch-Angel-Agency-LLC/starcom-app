import React from 'react';
import { useCyberCommandRightSideBar } from '../../../../context/useCyberCommandRightSideBar';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import SpaceWeatherMetricsPanel from '../../../SpaceWeather/SpaceWeatherMetricsPanel';
import styles from './CyberCommandRightSideBar.module.css';

// Clean tab components for future implementation
const MissionTab: React.FC = () => {
  const { visualizationMode } = useVisualizationMode();
  const showSW = visualizationMode.mode === 'EcoNatural' && visualizationMode.subMode === 'SpaceWeather';
  return (
    <div className={styles.tabContent}>
      {showSW && (
        <div style={{ marginBottom: 8 }}>
          <SpaceWeatherMetricsPanel />
        </div>
      )}
      <div className={styles.tabPlaceholder}>Mission Content</div>
    </div>
  );
};

const IntelTab: React.FC = () => {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabPlaceholder}>Intel Content</div>
    </div>
  );
};

const ControlsTab: React.FC = () => {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabPlaceholder}>Controls Content</div>
    </div>
  );
};

const ChatTab: React.FC = () => {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabPlaceholder}>Chat Content</div>
    </div>
  );
};

const AppsTab: React.FC = () => {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabPlaceholder}>Apps Content</div>
    </div>
  );
};

const DeveloperTab: React.FC = () => {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabPlaceholder}>Developer Content</div>
    </div>
  );
};

const CyberCommandRightSideBar: React.FC = () => {
  // Use the CyberCommandRightSideBar context for dynamic width management
  const { 
    isCollapsed, 
    setIsCollapsed, 
    activeSection, 
    setActiveSection
  } = useCyberCommandRightSideBar();
  
  // Apply dynamic width to sidebar element
  const getContainerClassName = () => {
    let className = `${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`;
    
    // Add expanded class when chat tab is active (preserve dynamic width)
    if (activeSection === 'chat' && !isCollapsed) {
      className += ` ${styles.expanded}`;
    }
    
    return className;
  };

  // Render tab content based on active section
  const renderTabContent = () => {
    switch (activeSection) {
      case 'mission':
        return <MissionTab />;
      case 'intel':
        return <IntelTab />;
      case 'controls':
        return <ControlsTab />;
      case 'chat':
        return <ChatTab />;
      case 'apps':
        return <AppsTab />;
      case 'developer':
        return process.env.NODE_ENV === 'development' ? <DeveloperTab /> : null;
      default:
        return <MissionTab />;
    }
  };

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

      {/* Section Navigation - Keep tab structure */}
      <div className={styles.sectionNav}>
        <button 
          className={`${styles.navBtn} ${activeSection === 'mission' ? styles.active : ''}`}
          onClick={() => setActiveSection('mission')}
          title="Mission"
          aria-label="Mission"
        >
          📡
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'intel' ? styles.active : ''}`}
          onClick={() => setActiveSection('intel')}
          title="Intel"
          aria-label="Intel"
        >
          🎯
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'controls' ? styles.active : ''}`}
          onClick={() => setActiveSection('controls')}
          title="Controls"
          aria-label="Controls"
        >
          🎛️
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveSection('chat')}
          title="Chat"
          aria-label="Chat"
        >
          💬
        </button>
        <button 
          className={`${styles.navBtn} ${activeSection === 'apps' ? styles.active : ''}`}
          onClick={() => setActiveSection('apps')}
          title="Apps"
          aria-label="Apps"
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

      {/* Dynamic Content Area - All content replaced with clean placeholders */}
      <div className={styles.contentArea}>
        {renderTabContent()}
      </div>

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

export default CyberCommandRightSideBar;