// Cyber Investigation Hub - Main dashboard for collaborative cyber investigations
// Integrates Intel Package Manager, Team Manager, and Investigation Board

import React, { useState, useEffect } from 'react';
import { usePopup } from '../../../Popup/PopupManager';
import IntelPackageManager from '../../../Intel/IntelPackageManager';
import CyberTeamManager from '../../../Intel/CyberTeamManager';
import InvestigationBoard from '../../../Intel/InvestigationBoard';
import CyberInvestigationStorage from '../../../../services/cyberInvestigationStorage';
import styles from './CyberInvestigationHub.module.css';

interface CyberInvestigationHubProps {
  isCollapsed?: boolean;
}

const CyberInvestigationHub: React.FC<CyberInvestigationHubProps> = ({ isCollapsed = false }) => {
  const { showPopup } = usePopup();
  const [stats, setStats] = useState({
    investigations: 0,
    packages: 0,
    teams: 0
  });

  // Update stats periodically
  useEffect(() => {
    const updateStats = async () => {
      const investigations = await CyberInvestigationStorage.loadInvestigations();
      const packages = await CyberInvestigationStorage.loadPackages();
      const teams = await CyberInvestigationStorage.loadTeams();
      
      setStats({
        investigations: investigations.filter(inv => inv.status !== 'CLOSED').length,
        packages: packages.length,
        teams: teams.length
      });
    };

    updateStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleOpenPackageManager = () => {
    showPopup({
      component: IntelPackageManager,
      backdrop: true,
      zIndex: 3000
    });
  };

  const handleOpenTeamManager = () => {
    showPopup({
      component: CyberTeamManager,
      backdrop: true,
      zIndex: 3000
    });
  };

  const handleOpenInvestigationBoard = () => {
    showPopup({
      component: InvestigationBoard,
      backdrop: true,
      zIndex: 3000
    });
  };

  return (
    <div className={styles.investigationHub}>
      <div className={styles.hubHeader}>
        <span className={styles.hubIcon}>🔍</span>
        {!isCollapsed && <span>Cyber Investigation Hub</span>}
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Active Investigations:</span>
            <span className={styles.statValue}>{stats.investigations}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Intel Packages:</span>
            <span className={styles.statValue}>{stats.packages}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Teams:</span>
            <span className={styles.statValue}>{stats.teams}</span>
          </div>
        </div>
      )}

      {/* Investigation Tools */}
      <div className={styles.toolsSection}>
        <button 
          className={styles.toolBtn}
          onClick={handleOpenInvestigationBoard}
          title="Open Investigation Board"
        >
          <span className={styles.toolIcon}>📋</span>
          {!isCollapsed && <span>Investigation Board</span>}
        </button>

        <button 
          className={styles.toolBtn}
          onClick={handleOpenPackageManager}
          title="Manage Intel Packages"
        >
          <span className={styles.toolIcon}>📦</span>
          {!isCollapsed && <span>Intel Packages</span>}
        </button>

        <button 
          className={styles.toolBtn}
          onClick={handleOpenTeamManager}
          title="Manage Teams"
        >
          <span className={styles.toolIcon}>👥</span>
          {!isCollapsed && <span>Team Management</span>}
        </button>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className={styles.quickActions}>
          <div className={styles.actionHeader}>Quick Actions</div>
          <button className={styles.actionBtn}>
            <span>🚨</span>
            New Incident
          </button>
          <button className={styles.actionBtn}>
            <span>📊</span>
            Analysis Report
          </button>
          <button className={styles.actionBtn}>
            <span>🔗</span>
            Share Intel
          </button>
        </div>
      )}

      {/* Status Indicators */}
      <div className={styles.statusSection}>
        <div className={styles.statusItem}>
          <span className={`${styles.statusDot} ${styles.operational}`}></span>
          {!isCollapsed && <span>Systems Operational</span>}
        </div>
        <div className={styles.statusItem}>
          <span className={`${styles.statusDot} ${styles.secure}`}></span>
          {!isCollapsed && <span>Secure Channel</span>}
        </div>
      </div>
    </div>
  );
};

export default CyberInvestigationHub;
