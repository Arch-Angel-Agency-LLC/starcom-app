import React, { useState, useEffect } from 'react';
import styles from './OPSECPanel.module.css';

interface OPSECPanelProps {
  panelId: string;
}

const OPSECPanel: React.FC<OPSECPanelProps> = ({ panelId }) => {
  // Mock connection status data
  const [connectionStatus, setConnectionStatus] = useState({
    isSecure: true,
    routingMethod: 'vpn',
    encryptionActive: true,
    fingerprintProtection: true,
    dnsSecure: true
  });
  
  const [securityLevel, setSecurityLevel] = useState('enhanced');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock security alerts
  const [securityAlerts, setSecurityAlerts] = useState([
    {
      id: 'alert-1',
      title: 'Potential Tracking Detected',
      message: 'Your current connection may be monitored. Consider switching to a more secure routing method.',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      action: 'Switch to TOR',
    }
  ]);

  // Simulate initial loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Mock functions
  const changeRoutingMethod = (method) => {
    setConnectionStatus(prev => ({
      ...prev,
      routingMethod: method
    }));
  };
  
  const changeSecurityLevel = (level) => {
    setSecurityLevel(level);
  };
  
  const toggleFingerprintProtection = () => {
    setConnectionStatus(prev => ({
      ...prev,
      fingerprintProtection: !prev.fingerprintProtection
    }));
  };
  
  const acknowledgeAlert = (alertId) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };
  
  const generateNewIdentity = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSecurityAlerts(prev => [
        ...prev,
        {
          id: `alert-${Date.now()}`,
          title: 'Identity Refreshed',
          message: 'Your digital identity has been refreshed. New fingerprint generated.',
          severity: 'low',
          timestamp: new Date().toISOString()
        }
      ]);
    }, 1500);
  };
  
  const scanForThreats = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const foundThreat = Math.random() > 0.5;
      
      if (foundThreat) {
        setSecurityAlerts(prev => [
          ...prev,
          {
            id: `alert-${Date.now()}`,
            title: 'Security Vulnerability Detected',
            message: 'A potential security vulnerability was detected in your connection.',
            severity: 'high',
            timestamp: new Date().toISOString(),
            action: 'Increase Security',
          }
        ]);
      } else {
        setSecurityAlerts(prev => [
          ...prev,
          {
            id: `alert-${Date.now()}`,
            title: 'Security Scan Complete',
            message: 'No threats detected. Your connection is secure.',
            severity: 'low',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className={styles.opsecPanel} data-panel-id={panelId}>
        <h2 className={styles.title}>OPSEC Security</h2>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.opsecPanel} data-panel-id={panelId}>
      <h2 className={styles.title}>OPSEC Security</h2>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Connection Status</h3>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Secure Connection:</span>
            <span className={`${styles.statusValue} ${connectionStatus.isSecure ? styles.secure : styles.insecure}`}>
              {connectionStatus.isSecure ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Routing Method:</span>
            <span className={styles.statusValue}>{connectionStatus.routingMethod}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Encryption:</span>
            <span className={`${styles.statusValue} ${connectionStatus.encryptionActive ? styles.secure : styles.insecure}`}>
              {connectionStatus.encryptionActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Fingerprint Protection:</span>
            <span className={`${styles.statusValue} ${connectionStatus.fingerprintProtection ? styles.secure : styles.insecure}`}>
              {connectionStatus.fingerprintProtection ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Security Controls</h3>
        <div className={styles.controls}>
          <div className={styles.controlItem}>
            <label>Routing Method:</label>
            <select 
              value={connectionStatus.routingMethod} 
              onChange={(e) => changeRoutingMethod(e.target.value)}
              className={styles.selectControl}
            >
              <option value="direct">Direct</option>
              <option value="vpn">VPN</option>
              <option value="tor">TOR</option>
              <option value="i2p">I2P</option>
            </select>
          </div>
          
          <div className={styles.controlItem}>
            <label>Security Level:</label>
            <select 
              value={securityLevel} 
              onChange={(e) => changeSecurityLevel(e.target.value)}
              className={styles.selectControl}
            >
              <option value="standard">Standard</option>
              <option value="enhanced">Enhanced</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>
          
          <div className={styles.controlItem}>
            <label>Fingerprint Protection:</label>
            <button 
              className={`${styles.toggleButton} ${connectionStatus.fingerprintProtection ? styles.toggleActive : ''}`}
              onClick={toggleFingerprintProtection}
            >
              {connectionStatus.fingerprintProtection ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={generateNewIdentity}
          >
            Generate New Identity
          </button>
          <button 
            className={styles.actionButton}
            onClick={scanForThreats}
          >
            Scan For Threats
          </button>
        </div>
      </div>
      
      {securityAlerts.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Security Alerts</h3>
          <div className={styles.alertsList}>
            {securityAlerts.map((alert) => (
              <div key={alert.id} className={`${styles.alertItem} ${styles[alert.severity]}`}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertTitle}>{alert.title}</span>
                  <button 
                    className={styles.dismissButton}
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
                <p className={styles.alertMessage}>{alert.message}</p>
                {alert.action && (
                  <button 
                    className={styles.alertActionButton}
                    onClick={() => {
                      if (alert.action.includes('TOR')) changeRoutingMethod('tor');
                      if (alert.action.includes('Security')) changeSecurityLevel('maximum');
                      acknowledgeAlert(alert.id);
                    }}
                  >
                    {alert.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OPSECPanel;
