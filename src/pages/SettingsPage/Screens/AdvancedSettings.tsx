import React from 'react';
import styles from './AdvancedSettings.module.css';

/**
 * Advanced settings screen component
 * Handles performance, experimental features, and debugging options
 */
const AdvancedSettings: React.FC = () => {
  return (
    <div className={styles.advancedSettings}>
      <h2>Advanced Settings</h2>
      
      <div className={styles.warningBanner}>
        <span className={styles.warningIcon}>⚠️</span>
        <span>These settings are for advanced users. Changes may affect application performance or stability.</span>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Performance</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.setting}>
            <label htmlFor="frameRateLimit">Frame Rate Limit</label>
            <select id="frameRateLimit" defaultValue="60">
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
              <option value="120">120 FPS</option>
              <option value="0">Unlimited (not recommended)</option>
            </select>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="enableVSync" 
              defaultChecked 
            />
            <label htmlFor="enableVSync">Enable VSync</label>
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="textureQuality">Texture Quality</label>
            <select id="textureQuality" defaultValue="high">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          
          <div className={styles.setting}>
            <label htmlFor="workerThreads">Worker Threads</label>
            <select id="workerThreads" defaultValue="4">
              <option value="1">1 thread</option>
              <option value="2">2 threads</option>
              <option value="4">4 threads</option>
              <option value="8">8 threads</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Data Management</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.setting}>
            <label htmlFor="cacheSize">Cache Size</label>
            <select id="cacheSize" defaultValue="100">
              <option value="50">50 MB</option>
              <option value="100">100 MB</option>
              <option value="250">250 MB</option>
              <option value="500">500 MB</option>
              <option value="1000">1 GB</option>
            </select>
          </div>
        </div>
        
        <div className={styles.actionRow}>
          <button className={styles.secondaryButton}>Clear Cache</button>
          <button className={styles.secondaryButton}>Export Configuration</button>
          <button className={styles.secondaryButton}>Import Configuration</button>
        </div>
      </div>
      
      <div className={styles.settingSection}>
        <h3>Developer Options</h3>
        
        <div className={styles.settingGroup}>
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="debugMode" 
            />
            <label htmlFor="debugMode">Enable Debug Mode</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="showMetrics" 
            />
            <label htmlFor="showMetrics">Show Performance Metrics</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="experimentalFeatures" 
            />
            <label htmlFor="experimentalFeatures">Enable Experimental Features</label>
          </div>
          
          <div className={styles.settingCheckbox}>
            <input 
              type="checkbox" 
              id="verboseLogging" 
            />
            <label htmlFor="verboseLogging">Verbose Logging</label>
          </div>
        </div>
        
        <div className={styles.logControls}>
          <button className={styles.secondaryButton}>View Logs</button>
          <button className={styles.secondaryButton}>Export Diagnostic Data</button>
        </div>
      </div>
      
      <div className={styles.actionButtons}>
        <button className={styles.primaryButton}>Save Changes</button>
        <button className={styles.dangerButton}>Reset All Settings</button>
      </div>
    </div>
  );
};

export default AdvancedSettings;
