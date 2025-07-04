import React, { useState } from 'react';
import { Shield, Lock, Eye, Activity, Globe, User, AlertTriangle } from 'lucide-react';
import styles from './OPSECPanel.module.css';

interface OPSECPanelProps {
  data: Record<string, unknown>;
  panelId: string;
}

/**
 * OPSEC Shield Panel
 * 
 * Provides operational security tools and protections for investigators
 */
const OPSECPanel: React.FC<OPSECPanelProps> = ({ data, panelId }) => {
  const [securityLevel, setSecurityLevel] = useState<'standard' | 'enhanced' | 'maximum'>('enhanced');
  const [routingMethod, setRoutingMethod] = useState<'direct' | 'vpn' | 'tor' | 'tor+vpn'>('vpn');
  const [fingerprintProtection, setFingerprintProtection] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState([
    { id: 1, type: 'warning', message: 'Current IP address has been used for 4+ hours', time: '10 min ago' },
    { id: 2, type: 'info', message: 'VPN connection established via London node', time: '35 min ago' },
    { id: 3, type: 'critical', message: 'Potential DNS leak detected and blocked', time: '1 hour ago' },
  ]);
  
  return (
    <div className={styles.opsecPanel}>
      <div className={styles.securityStatus}>
        <div className={styles.statusHeader}>
          <Shield size={18} />
          <h3 className={styles.statusTitle}>OPSEC Protection Status</h3>
        </div>
        
        <div className={styles.statusIndicators}>
          <div className={styles.statusItem}>
            <div className={`${styles.statusLight} ${styles.active}`}></div>
            <span className={styles.statusLabel}>Traffic Encryption</span>
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusLight} ${styles.active}`}></div>
            <span className={styles.statusLabel}>Identity Protection</span>
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusLight} ${routingMethod !== 'direct' ? styles.active : styles.inactive}`}></div>
            <span className={styles.statusLabel}>Secure Routing</span>
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusLight} ${fingerprintProtection ? styles.active : styles.inactive}`}></div>
            <span className={styles.statusLabel}>Fingerprint Masking</span>
          </div>
        </div>
      </div>
      
      <div className={styles.controlsSection}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Security Level</label>
          <div className={styles.securityLevelControls}>
            <button 
              className={`${styles.levelButton} ${securityLevel === 'standard' ? styles.activeLevel : ''}`}
              onClick={() => setSecurityLevel('standard')}
            >
              Standard
            </button>
            <button 
              className={`${styles.levelButton} ${securityLevel === 'enhanced' ? styles.activeLevel : ''}`}
              onClick={() => setSecurityLevel('enhanced')}
            >
              Enhanced
            </button>
            <button 
              className={`${styles.levelButton} ${securityLevel === 'maximum' ? styles.activeLevel : ''}`}
              onClick={() => setSecurityLevel('maximum')}
            >
              Maximum
            </button>
          </div>
        </div>
        
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Routing Method</label>
          <select 
            className={styles.controlSelect}
            value={routingMethod}
            onChange={(e) => setRoutingMethod(e.target.value as any)}
          >
            <option value="direct">Direct Connection (Unsecured)</option>
            <option value="vpn">VPN</option>
            <option value="tor">Tor Network</option>
            <option value="tor+vpn">Tor over VPN (Maximum Security)</option>
          </select>
        </div>
        
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            <input
              type="checkbox"
              checked={fingerprintProtection}
              onChange={(e) => setFingerprintProtection(e.target.checked)}
              className={styles.controlCheckbox}
            />
            Browser Fingerprint Protection
          </label>
        </div>
      </div>
      
      <div className={styles.securityAlerts}>
        <h4 className={styles.alertsTitle}>
          <Activity size={14} />
          <span>Security Alerts</span>
        </h4>
        
        <div className={styles.alertsList}>
          {securityAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`${styles.alertItem} ${styles[alert.type]}`}
            >
              {alert.type === 'warning' && <AlertTriangle size={14} />}
              {alert.type === 'info' && <Globe size={14} />}
              {alert.type === 'critical' && <Shield size={14} />}
              <div className={styles.alertContent}>
                <span className={styles.alertMessage}>{alert.message}</span>
                <span className={styles.alertTime}>{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.operationalTools}>
        <h4 className={styles.toolsTitle}>Quick Actions</h4>
        <div className={styles.toolsGrid}>
          <button className={styles.toolButton}>
            <Lock size={16} />
            <span>New Identity</span>
          </button>
          <button className={styles.toolButton}>
            <User size={16} />
            <span>Check Exposure</span>
          </button>
          <button className={styles.toolButton}>
            <Eye size={16} />
            <span>Traffic Analysis</span>
          </button>
          <button className={styles.toolButton}>
            <Globe size={16} />
            <span>Change Exit Node</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OPSECPanel;
