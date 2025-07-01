import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SettingsPage.module.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('sync');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 60,
    enabledDataSources: {
      noaa: true,
      geomagnetic: true,
      financial: true,
      threatIntel: false
    },
    theme: 'dark',
    highContrast: true,
    uiScale: 100,
    showTopMarquee: true,
    showLeftSidebar: true,
    autoHidePanels: false,
    frameRateLimit: 60,
    enableVSync: true,
    textureQuality: 'high',
    workerThreads: 4,
    cacheSize: 100,
    requireAuth: true,
    sessionTimeout: 60,
    shareAnalytics: false,
    encryptData: true,
    debugMode: false,
    showMetrics: false,
    experimentalFeatures: false
  });

  // Button handlers
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Simulate saving to backend/localStorage
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('starcom-settings', JSON.stringify(settings));
      setLastSaved(new Date());
      console.log('Settings saved successfully:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached data? This will reload data from sources.')) {
      try {
        // Clear various caches
        localStorage.removeItem('starcom-cache');
        localStorage.removeItem('noaa-cache');
        localStorage.removeItem('threat-intel-cache');
        
        // Clear browser cache if available
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }
        
        console.log('Cache cleared successfully');
        alert('Cache cleared successfully. The application will reload.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Failed to clear cache. Please try again.');
      }
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      const defaultSettings = {
        autoSync: true,
        syncInterval: 60,
        enabledDataSources: {
          noaa: true,
          geomagnetic: true,
          financial: true,
          threatIntel: false
        },
        theme: 'dark',
        highContrast: false,
        uiScale: 100,
        showTopMarquee: true,
        showLeftSidebar: true,
        autoHidePanels: false,
        frameRateLimit: 60,
        enableVSync: true,
        textureQuality: 'high',
        workerThreads: 4,
        cacheSize: 100,
        requireAuth: true,
        sessionTimeout: 60,
        shareAnalytics: false,
        encryptData: true,
        debugMode: false,
        showMetrics: false,
        experimentalFeatures: false
      };
      
      setSettings(defaultSettings);
      localStorage.removeItem('starcom-settings');
      console.log('Settings reset to defaults');
      alert('Settings have been reset to defaults.');
    }
  };

  const handleExportConfiguration = () => {
    try {
      const configData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings: settings,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };
      
      const dataStr = JSON.stringify(configData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `starcom-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Configuration exported successfully');
    } catch (error) {
      console.error('Failed to export configuration:', error);
      alert('Failed to export configuration. Please try again.');
    }
  };

  // Load settings on component mount
  React.useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('starcom-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load saved settings:', error);
    }
  }, []);

  const sections = [
    { id: 'sync', label: '🔄 Data Sync', icon: '🔄' },
    { id: 'status', label: '📊 System Status', icon: '📊' },
    { id: 'display', label: '🖥️ Display', icon: '🖥️' },
    { id: 'performance', label: '⚡ Performance', icon: '⚡' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' }
  ];

  const renderSyncSettings = () => (
    <div className={styles.sectionContent}>
      <h3>🔄 Data Synchronization</h3>
      <div className={styles.settingGroup}>
        <h4>Auto-Sync Settings</h4>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.autoSync}
              onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
            />
            Enable automatic data synchronization
          </label>
        </div>
        <div className={styles.setting}>
          <label>Sync Interval:</label>
          <select 
            value={settings.syncInterval}
            onChange={(e) => setSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
          >
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
            <option value="600">10 minutes</option>
          </select>
        </div>
      </div>
      
      <div className={styles.settingGroup}>
        <h4>Data Sources</h4>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.enabledDataSources.noaa}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enabledDataSources: { ...prev.enabledDataSources, noaa: e.target.checked }
              }))}
            />
            NOAA Space Weather Data
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.enabledDataSources.geomagnetic}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enabledDataSources: { ...prev.enabledDataSources, geomagnetic: e.target.checked }
              }))}
            />
            Geomagnetic Field Data
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.enabledDataSources.financial}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enabledDataSources: { ...prev.enabledDataSources, financial: e.target.checked }
              }))}
            />
            Financial Market Data
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.enabledDataSources.threatIntel}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enabledDataSources: { ...prev.enabledDataSources, threatIntel: e.target.checked }
              }))}
            />
            Cyber Threat Intelligence
          </label>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <h4>Sync Status</h4>
        <div className={styles.statusItem}>
          <span className={styles.statusIndicator} data-status={settings.enabledDataSources.noaa ? "online" : "offline"}></span>
          <span>NOAA API: {settings.enabledDataSources.noaa ? "Connected" : "Disabled"}</span>
          <span className={styles.lastSync}>Last sync: 2 minutes ago</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusIndicator} data-status={settings.enabledDataSources.financial ? "online" : "offline"}></span>
          <span>Financial Data: {settings.enabledDataSources.financial ? "Connected" : "Disabled"}</span>
          <span className={styles.lastSync}>Last sync: 1 minute ago</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusIndicator} data-status={settings.enabledDataSources.threatIntel ? "online" : "offline"}></span>
          <span>Threat Intel: {settings.enabledDataSources.threatIntel ? "Connected" : "Disabled"}</span>
          <span className={styles.lastSync}>Last attempt: 10 minutes ago</span>
        </div>
      </div>
    </div>
  );

  const renderStatusSettings = () => (
    <div className={styles.sectionContent}>
      <h3>📊 System Status</h3>
      <div className={styles.settingGroup}>
        <h4>System Health</h4>
        <div className={styles.healthMetric}>
          <span>CPU Usage:</span>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: '35%' }}></div>
          </div>
          <span>35%</span>
        </div>
        <div className={styles.healthMetric}>
          <span>Memory Usage:</span>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: '68%' }}></div>
          </div>
          <span>68%</span>
        </div>
        <div className={styles.healthMetric}>
          <span>Network Latency:</span>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: '15%' }}></div>
          </div>
          <span>45ms</span>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <h4>Application Status</h4>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <span className={styles.statusIndicator} data-status="online"></span>
              <h5>Globe Engine</h5>
            </div>
            <p>Rendering: 60 FPS</p>
            <p>Overlays: 4 active</p>
          </div>
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <span className={styles.statusIndicator} data-status="online"></span>
              <h5>Data Pipeline</h5>
            </div>
            <p>Throughput: 2.3 MB/s</p>
            <p>Queue: 12 items</p>
          </div>
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <span className={styles.statusIndicator} data-status="warning"></span>
              <h5>Cache System</h5>
            </div>
            <p>Hit Rate: 78%</p>
            <p>Size: 45.2 MB</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className={styles.sectionContent}>
      <h3>🖥️ Display Settings</h3>
      <div className={styles.settingGroup}>
        <h4>Theme & Appearance</h4>
        <div className={styles.setting}>
          <label>Theme:</label>
          <select>
            <option value="dark" selected>Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" defaultChecked />
            High contrast mode
          </label>
        </div>
        <div className={styles.setting}>
          <label>UI Scale:</label>
          <input type="range" min="50" max="150" value="100" />
          <span>100%</span>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <h4>HUD Settings</h4>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" defaultChecked />
            Show top marquee
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" defaultChecked />
            Show left sidebar
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" />
            Auto-hide inactive panels
          </label>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className={styles.sectionContent}>
      <h3>⚡ Performance Settings</h3>
      <div className={styles.settingGroup}>
        <h4>Rendering</h4>
        <div className={styles.setting}>
          <label>Frame Rate Limit:</label>
          <select>
            <option value="30">30 FPS</option>
            <option value="60" selected>60 FPS</option>
            <option value="120">120 FPS</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </div>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" defaultChecked />
            Enable VSync
          </label>
        </div>
        <div className={styles.setting}>
          <label>Texture Quality:</label>
          <select>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high" selected>High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <h4>Data Processing</h4>
        <div className={styles.setting}>
          <label>Worker Threads:</label>
          <select>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4" selected>4</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div className={styles.setting}>
          <label>Cache Size:</label>
          <select>
            <option value="50">50 MB</option>
            <option value="100" selected>100 MB</option>
            <option value="200">200 MB</option>
            <option value="500">500 MB</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className={styles.sectionContent}>
      <h3>🔒 Security Settings</h3>
      <div className={styles.settingGroup}>
        <h4>Authentication</h4>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" defaultChecked />
            Require authentication
          </label>
        </div>
        <div className={styles.setting}>
          <label>Session Timeout:</label>
          <select>
            <option value="30">30 minutes</option>
            <option value="60" selected>1 hour</option>
            <option value="240">4 hours</option>
            <option value="480">8 hours</option>
          </select>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <h4>Privacy</h4>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" />
            Share usage analytics
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input type="checkbox" defaultChecked />
            Encrypt stored data
          </label>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className={styles.sectionContent}>
      <h3>⚙️ Advanced Settings</h3>
      <div className={styles.settingGroup}>
        <h4>Developer Options</h4>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.debugMode}
              onChange={(e) => setSettings(prev => ({ ...prev, debugMode: e.target.checked }))}
            />
            Enable debug mode
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.showMetrics}
              onChange={(e) => setSettings(prev => ({ ...prev, showMetrics: e.target.checked }))}
            />
            Show performance metrics
          </label>
        </div>
        <div className={styles.setting}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.experimentalFeatures}
              onChange={(e) => setSettings(prev => ({ ...prev, experimentalFeatures: e.target.checked }))}
            />
            Enable experimental features
          </label>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <h4>System</h4>
        <div className={styles.setting}>
          <button className={styles.actionButton} onClick={handleClearCache}>
            Clear Cache
          </button>
          <span className={styles.settingDescription}>Clear all cached data</span>
        </div>
        <div className={styles.setting}>
          <button className={styles.actionButton} onClick={handleResetSettings}>
            Reset Settings
          </button>
          <span className={styles.settingDescription}>Reset all settings to defaults</span>
        </div>
        <div className={styles.setting}>
          <button className={styles.actionButton} onClick={handleExportConfiguration}>
            Export Configuration
          </button>
          <span className={styles.settingDescription}>Download current settings</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'sync': return renderSyncSettings();
      case 'status': return renderStatusSettings();
      case 'display': return renderDisplaySettings();
      case 'performance': return renderPerformanceSettings();
      case 'security': return renderSecuritySettings();
      case 'advanced': return renderAdvancedSettings();
      default: return renderSyncSettings();
    }
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1>⚙️ Settings</h1>
        <div className={styles.headerActions}>
          <button 
            className={styles.saveButton}
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? '💾 Saving...' : '💾 Save All'}
          </button>
          {lastSaved && (
            <span className={styles.lastSavedText}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <nav className={styles.sidebar}>
          {sections.map(section => (
            <button
              key={section.id}
              className={`${styles.sidebarItem} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className={styles.sectionIcon}>{section.icon}</span>
              <span className={styles.sectionLabel}>{section.label}</span>
            </button>
          ))}
        </nav>

        <main className={styles.main}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
