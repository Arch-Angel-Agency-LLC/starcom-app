import React from 'react';
import styles from './SecuritySettings.module.css';

/**
 * Security settings screen component
 * Handles authentication, encryption, and security preferences
 */
const SecuritySettings: React.FC = () => {
  return (
    <div className={styles.securitySettings}>
      <h2>Security Settings</h2>
      
      <div className={styles.settingSection}>
        <h3>Authentication</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="requireAuth" 
              defaultChecked 
            />
            <label htmlFor="requireAuth">Require authentication on startup</label>
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="sessionTimeout">Session Timeout</label>
            <select id="sessionTimeout" defaultValue="60">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="0">Never (not recommended)</option>
            </select>
          </div>
        </div>
        
        <div className={styles.actionRow}>
          <button className={styles.secondaryButton}>Change Password</button>
          <button className={styles.secondaryButton}>Setup Two-Factor Authentication</button>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Data Security</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="encryptData" 
              defaultChecked 
            />
            <label htmlFor="encryptData">Encrypt sensitive data</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="secureConnections" 
              defaultChecked 
            />
            <label htmlFor="secureConnections">Use secure connections only</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="autoLock" 
              defaultChecked 
            />
            <label htmlFor="autoLock">Auto-lock on idle</label>
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Access Control</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.setting}>
            <label htmlFor="apiAccess">API Access Level</label>
            <select id="apiAccess" defaultValue="restricted">
              <option value="full">Full Access</option>
              <option value="restricted">Restricted</option>
              <option value="readonly">Read Only</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
        
        <div className={styles.apiKeySection}>
          <div className={styles.apiKeyHeader}>
            <h4>API Keys</h4>
            <button className={styles.smallButton}>+ Generate New Key</button>
          </div>
          
          <div className={styles.apiKeyList}>
            <div className={styles.emptyState}>
              No API keys have been generated
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.dangerZone}>
        <h3>Danger Zone</h3>
        
        <div className={styles.dangerButtons}>
          <button className={styles.dangerButton}>Clear All Stored Data</button>
          <button className={styles.dangerButton}>Revoke All Sessions</button>
          <button className={styles.dangerButton}>Delete Account</button>
        </div>
      </div>
      
      <div className={styles.actionButtons}>
        <button className={styles.primaryButton}>Save Changes</button>
        <button className={styles.secondaryButton}>Cancel</button>
      </div>
    </div>
  );
};

export default SecuritySettings;
