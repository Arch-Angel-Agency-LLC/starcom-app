import React from 'react';
import { Eye, Search, ShieldAlert, AlertTriangle, Lock, Network } from 'lucide-react';
import styles from './DarkWebPanel.module.css';

interface DarkWebPanelProps {
  data: Record<string, unknown>;
  panelId: string;
}

/**
 * Dark Web Monitor Panel
 * 
 * Provides secure access to dark web intelligence
 * Requires authentication for most features
 */
const DarkWebPanel: React.FC<DarkWebPanelProps> = ({ data, panelId }) => {
  return (
    <div className={styles.darkWebPanel}>
      <div className={styles.securityBanner}>
        <Lock size={14} />
        <span>Secure Tor routing active</span>
        <span className={styles.securityStatus}>●</span>
      </div>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchField}>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Enter keywords, usernames, or domains"
          />
          <button className={styles.searchButton}>
            <Search size={14} />
          </button>
        </div>
        <div className={styles.searchOptions}>
          <select className={styles.sourceSelect}>
            <option value="all">All Sources</option>
            <option value="forums">Forums</option>
            <option value="marketplaces">Marketplaces</option>
            <option value="pastesites">Paste Sites</option>
            <option value="chats">Chat Services</option>
          </select>
        </div>
      </div>
      
      <div className={styles.darkWebContent}>
        <div className={styles.placeholder}>
          <ShieldAlert size={40} />
          <div className={styles.placeholderText}>
            <h3>Dark Web Intelligence</h3>
            <p>Enter search terms to begin secure dark web monitoring</p>
            <p>All activity is routed through anonymous channels</p>
          </div>
        </div>
      </div>
      
      <div className={styles.monitorControls}>
        <div className={styles.monitorSection}>
          <h4 className={styles.monitorTitle}>Active Monitors</h4>
          <div className={styles.monitorItems}>
            <div className={styles.monitorItem}>
              <AlertTriangle size={14} className={styles.alertIcon} />
              <span className={styles.monitorName}>Credential Leaks</span>
              <span className={styles.monitorStatus}>Active</span>
            </div>
            <div className={styles.monitorItem}>
              <Network size={14} />
              <span className={styles.monitorName}>Threat Actor Activity</span>
              <span className={styles.monitorStatus}>Active</span>
            </div>
            <div className={styles.monitorItem}>
              <Eye size={14} />
              <span className={styles.monitorName}>Brand Mentions</span>
              <span className={styles.monitorStatus}>Paused</span>
            </div>
          </div>
        </div>
        <button className={styles.addMonitorButton}>
          + Add Monitor
        </button>
      </div>
    </div>
  );
};

export default DarkWebPanel;
