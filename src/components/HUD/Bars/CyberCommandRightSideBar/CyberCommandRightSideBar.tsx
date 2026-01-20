import React, { useMemo, useState } from 'react';
import { useCyberCommandRightSideBar } from '../../../../context/useCyberCommandRightSideBar';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import SpaceWeatherMetricsPanel from '../../../SpaceWeather/SpaceWeatherMetricsPanel';
import { SpaceWeatherAlertPanel } from '../../../SpaceWeather/SpaceWeatherAlertPanel';
import { SpaceWeatherTelemetryHistoryCard } from '../../../SpaceWeather/SpaceWeatherTelemetryHistoryCard';
import { SpaceWeatherLayerPassiveCard } from '../../../SpaceWeather/SpaceWeatherLayerPassiveCards';
import { SpaceWeatherStatusCard } from '../../../SpaceWeather/SpaceWeatherStatusCard';
import { useSpaceWeatherSidebarLayout, type SpaceWeatherSidebarLayout } from '../../../SpaceWeather/SpaceWeatherSidebarLayout';
import { exportSpaceWeatherSnapshot } from '../../../../services/spaceWeather/SpaceWeatherExportService';
import useEcoNaturalSettings from '../../../../hooks/useEcoNaturalSettings';
import { useGeoEvents } from '../../../../hooks/useGeoEvents';
import EcoDisastersStatusCard from '../../../EcoNatural/EcoDisastersStatusCard';
import EcoDisastersLegend, { type EcoDisasterLegendCounts } from '../../../EcoNatural/EcoDisastersLegend';
import styles from './CyberCommandRightSideBar.module.css';

// Clean tab components for future implementation
const StatusTab: React.FC<{ layout: SpaceWeatherSidebarLayout }> = ({ layout }) => {
  const { visualizationMode } = useVisualizationMode();
  const { config: ecoConfig } = useEcoNaturalSettings();
  const ecoDisastersActive =
    visualizationMode.mode === 'EcoNatural' && visualizationMode.subMode === 'EcologicalDisasters';

  const {
    data: ecoData,
    filtered: ecoFiltered,
    stale: ecoStale,
    lastUpdated: ecoLastUpdated,
    error: ecoError,
    status: ecoStatus,
    refetch: refetchEco
  } = useGeoEvents({
    enabled: ecoDisastersActive,
    refreshMinutes: Math.max(1, ecoConfig.globalSettings.updateFrequency || 5),
    timeRangeDays: ecoConfig.ecologicalDisasters.timeRange,
    disasterTypes: ecoConfig.ecologicalDisasters.disasterTypes,
    severity: ecoConfig.ecologicalDisasters.severity
  });

  const severityCounts = useMemo<EcoDisasterLegendCounts>(() => {
    return ecoFiltered.reduce(
      (acc, event) => {
        acc[event.severityBucket] = (acc[event.severityBucket] || 0) + 1;
        return acc;
      },
      { minor: 0, major: 0, catastrophic: 0 }
    );
  }, [ecoFiltered]);

  const mockVolcanoes = useMemo(
    () => ecoFiltered.some((event) => event.isMock || event.source === 'volcano-mock'),
    [ecoFiltered]
  );

  const showEcoEmpty = ecoDisastersActive && !ecoError && ecoStatus === 'success' && ecoFiltered.length === 0;

  const interactive = layout.interactive;
  const passive = layout.passive;
  const showSW = Boolean(interactive && passive);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!passive) return;
    setExporting(true);
    try {
      await exportSpaceWeatherSnapshot({
        telemetry: passive.telemetry,
        history: passive.telemetryHistory,
        providerStatus: passive.providerStatus,
        currentProvider: passive.currentProvider,
        alerts: passive.alerts,
        enhancedAlerts: passive.enhancedAlerts
      });
    } finally {
      setExporting(false);
    }
  };

  if (ecoDisastersActive) {
    return (
      <div className={styles.tabContent}>
        <EcoDisastersStatusCard
          total={ecoData.length}
          filtered={ecoFiltered.length}
          stale={ecoStale}
          lastUpdated={ecoLastUpdated}
          error={ecoError?.message ?? null}
          mockVolcanoes={mockVolcanoes}
          onRetry={refetchEco}
        />

        <EcoDisastersLegend
          counts={severityCounts}
          lastUpdated={ecoLastUpdated}
          stale={ecoStale}
          mockVolcanoes={mockVolcanoes}
        />

        {ecoError && (
          <div className={styles.tabPlaceholder}>
            <div>Unable to load ecological disasters right now.</div>
            <div>{ecoError.message}</div>
          </div>
        )}

        {showEcoEmpty && <div className={styles.tabPlaceholder}>No events match the current filters.</div>}
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      {showSW && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handleExport}
              disabled={exporting}
              title="Export space weather telemetry"
            >
              {exporting ? 'Exporting…' : 'Export Telemetry (stub)'}
            </button>
          </div>
          <SpaceWeatherStatusCard interactive={interactive} passive={passive} />
          <SpaceWeatherMetricsPanel passive={passive} />
          <SpaceWeatherTelemetryHistoryCard entries={passive?.telemetryHistory} />
          <SpaceWeatherLayerPassiveCard layerId={layout.layerId} passive={passive} />
        </div>
      )}
      <div className={styles.tabPlaceholder}>Status Content</div>
    </div>
  );
};

const IntelTab: React.FC<{ layout: SpaceWeatherSidebarLayout }> = ({ layout }) => {
  const passive = layout.passive;
  const showSW = Boolean(passive);
  return (
    <div className={styles.tabContent}>
      {showSW && (
        <div style={{ marginBottom: 8 }}>
          <SpaceWeatherAlertPanel passive={passive} />
        </div>
      )}
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
  const layout = useSpaceWeatherSidebarLayout();
  
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
      case 'status':
        return <StatusTab layout={layout} />;
      case 'intel':
        return <IntelTab layout={layout} />;
      case 'controls':
        return <ControlsTab />;
      case 'chat':
        return <ChatTab />;
      case 'apps':
        return <AppsTab />;
      case 'developer':
        return process.env.NODE_ENV === 'development' ? <DeveloperTab /> : null;
      default:
        return <StatusTab layout={layout} />;
    }
  };

  return (
    <div className={getContainerClassName()}>
      {/* Status Header */}
      <div className={styles.missionHeader}>
        <div className={styles.missionTitle}>
          {!isCollapsed && <span>STATUS</span>}
        </div>
        <button 
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand Status" : "Collapse Status"}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Section Navigation - Keep tab structure */}
      <div className={styles.sectionNav}>
        <button 
          className={`${styles.navBtn} ${activeSection === 'status' ? styles.active : ''}`}
          onClick={() => setActiveSection('status')}
          title="Status"
          aria-label="Status"
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

      {/* Enhanced Status Footer with Status label */}
      <div className={styles.statusFooter}>
        <div className={`${styles.statusDot} ${styles.operationalDot}`}></div>
        {!isCollapsed ? (
          <div className={styles.statusContainer}>
            <div className={`${styles.operationalStatus} ${styles.operational}`}>
              <span>OPERATIONAL</span>
            </div>
            <div className={styles.phaseStatus}>
              <span className={styles.phaseIcon}>🌍</span>
              <span className={styles.phaseLabel}>Status</span>
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