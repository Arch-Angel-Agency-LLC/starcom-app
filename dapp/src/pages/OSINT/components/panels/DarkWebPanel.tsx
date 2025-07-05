import React, { useState, useEffect } from 'react';
import { Eye, Search, ShieldAlert, AlertTriangle, Lock, Network, Loader, X, Bell, Plus } from 'lucide-react';
import styles from './DarkWebPanel.module.css';
import { useDarkWebMonitoring } from '../../hooks/useDarkWebMonitoring';
import { AlertLevel, DarkWebSourceType, MonitorStatus } from '../../services/darkweb/darkWebService';
import ErrorDisplay from '../common/ErrorDisplay';

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
const DarkWebPanel: React.FC<DarkWebPanelProps> = () => {
  // State for search input
  const [searchInput, setSearchInput] = useState('');
  
  // Use dark web monitoring hook
  const darkWeb = useDarkWebMonitoring();
  
  // State for monitor creation modal
  const [showCreateMonitor, setShowCreateMonitor] = useState(false);
  const [newMonitorName, setNewMonitorName] = useState('');
  const [newMonitorKeywords, setNewMonitorKeywords] = useState('');
  const [newMonitorSourceType, setNewMonitorSourceType] = useState<DarkWebSourceType>('all');
  const [newMonitorAlertLevel, setNewMonitorAlertLevel] = useState<AlertLevel>('low');
  
  // Handle search
  const handleSearch = () => {
    if (searchInput.trim()) {
      darkWeb.search(searchInput, darkWeb.sourceType);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Handle monitor status change
  const handleMonitorStatusChange = (monitorId: string, status: MonitorStatus) => {
    darkWeb.updateMonitorStatus(monitorId, status);
  };
  
  // Handle monitor creation
  const handleCreateMonitor = () => {
    if (newMonitorName && newMonitorKeywords) {
      // Split keywords by comma or space
      const keywords = newMonitorKeywords
        .split(/[,\s]+/)
        .filter(k => k.trim() !== '')
        .map(k => k.trim());
      
      if (keywords.length > 0) {
        darkWeb.createMonitor(
          newMonitorName,
          keywords,
          [newMonitorSourceType],
          newMonitorAlertLevel
        );
        
        // Reset form
        setNewMonitorName('');
        setNewMonitorKeywords('');
        setNewMonitorSourceType('all');
        setNewMonitorAlertLevel('low');
        setShowCreateMonitor(false);
      }
    }
  };
  
  // Check dark web access on mount
  useEffect(() => {
    darkWeb.checkAccess();
    darkWeb.loadMonitors();
  }, [darkWeb]);
  
  // Render search results
  const renderSearchResults = () => {
    if (darkWeb.isLoading('search')) {
      return (
        <div className={styles.loading}>
          <Loader size={24} className={styles.spinner} />
          <p>Searching dark web sources securely...</p>
        </div>
      );
    }
    
    if (darkWeb.error) {
      return (
        <ErrorDisplay 
          error={darkWeb.error}
          onRetry={() => darkWeb.search(searchInput, darkWeb.sourceType)}
          onDismiss={() => darkWeb.clearError()}
          className={styles.errorContainer}
        />
      );
    }
    
    if (darkWeb.searchResults.length === 0) {
      return (
        <div className={styles.noResults}>
          <p>No results found for "{darkWeb.query}"</p>
          <p>Try different keywords or select another source type</p>
        </div>
      );
    }
    
    return (
      <div className={styles.resultsList}>
        {darkWeb.searchResults.map(result => (
          <div key={result.id} className={`${styles.resultItem} ${styles[`alert${result.alertLevel}`]}`}>
            <div className={styles.resultHeader}>
              <span className={styles.resultTitle}>{result.title}</span>
              <span className={styles.resultSource}>{result.source.name}</span>
            </div>
            <div className={styles.resultContent}>
              {result.content}
            </div>
            <div className={styles.resultFooter}>
              <div className={styles.resultDate}>
                {new Date(result.date).toLocaleDateString()} • {new Date(result.date).toLocaleTimeString()}
              </div>
              <div className={styles.resultTags}>
                {result.tags.map((tag, i) => (
                  <span key={i} className={styles.resultTag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render monitor form
  const renderMonitorForm = () => {
    if (!showCreateMonitor) return null;
    
    return (
      <div className={styles.monitorForm}>
        <div className={styles.formHeader}>
          <h4>Create Monitor</h4>
          <button 
            className={styles.closeButton}
            onClick={() => setShowCreateMonitor(false)}
          >
            <X size={14} />
          </button>
        </div>
        
        <div className={styles.formFields}>
          <div className={styles.formField}>
            <label>Monitor Name</label>
            <input 
              type="text" 
              value={newMonitorName} 
              onChange={e => setNewMonitorName(e.target.value)}
              placeholder="e.g., Credential Leaks"
            />
          </div>
          
          <div className={styles.formField}>
            <label>Keywords (comma separated)</label>
            <input 
              type="text" 
              value={newMonitorKeywords} 
              onChange={e => setNewMonitorKeywords(e.target.value)}
              placeholder="e.g., breach, credentials, Earth Alliance"
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Source Type</label>
              <select 
                value={newMonitorSourceType} 
                onChange={e => setNewMonitorSourceType(e.target.value as DarkWebSourceType)}
              >
                <option value="all">All Sources</option>
                <option value="forums">Forums</option>
                <option value="marketplaces">Marketplaces</option>
                <option value="pastesites">Paste Sites</option>
                <option value="chats">Chat Services</option>
              </select>
            </div>
            
            <div className={styles.formField}>
              <label>Alert Threshold</label>
              <select 
                value={newMonitorAlertLevel} 
                onChange={e => setNewMonitorAlertLevel(e.target.value as AlertLevel)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
        
        <button 
          className={styles.createButton}
          onClick={handleCreateMonitor}
          disabled={!newMonitorName || !newMonitorKeywords}
        >
          <Bell size={14} />
          Create Monitor
        </button>
      </div>
    );
  };
  
  return (
    <div className={styles.darkWebPanel}>
      <div className={styles.securityBanner}>
        <Lock size={14} />
        <span>Secure Tor routing {darkWeb.accessStatus.routingSecure ? 'active' : 'inactive'}</span>
        <span className={`${styles.securityStatus} ${darkWeb.accessStatus.routingSecure ? styles.secure : styles.insecure}`}>●</span>
      </div>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchField}>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Enter keywords, usernames, or domains"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className={styles.searchButton}
            onClick={handleSearch}
          >
            <Search size={14} />
          </button>
        </div>
        <div className={styles.searchOptions}>
          <select 
            className={styles.sourceSelect}
            value={darkWeb.sourceType}
            onChange={(e) => darkWeb.setSourceType(e.target.value as DarkWebSourceType)}
          >
            <option value="all">All Sources</option>
            <option value="forums">Forums</option>
            <option value="marketplaces">Marketplaces</option>
            <option value="pastesites">Paste Sites</option>
            <option value="chats">Chat Services</option>
          </select>
        </div>
      </div>
      
      <div className={styles.darkWebContent}>
        {darkWeb.searchResults.length > 0 || darkWeb.isLoading || darkWeb.error ? (
          renderSearchResults()
        ) : (
          <div className={styles.placeholder}>
            <ShieldAlert size={40} />
            <div className={styles.placeholderText}>
              <h3>Dark Web Intelligence</h3>
              <p>Enter search terms to begin secure dark web monitoring</p>
              <p>All activity is routed through anonymous channels</p>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.monitorControls}>
        {renderMonitorForm()}
        
        <div className={styles.monitorSection}>
          <h4 className={styles.monitorTitle}>Active Monitors</h4>
          <div className={styles.monitorItems}>
            {darkWeb.monitors.map(monitor => (
              <div key={monitor.id} className={styles.monitorItem}>
                {monitor.alertThreshold === 'high' || monitor.alertThreshold === 'critical' ? (
                  <AlertTriangle size={14} className={styles.alertIcon} />
                ) : (
                  <Network size={14} />
                )}
                <span className={styles.monitorName}>{monitor.name}</span>
                <select
                  className={`${styles.monitorStatus} ${styles[monitor.status]}`}
                  value={monitor.status}
                  onChange={(e) => handleMonitorStatusChange(monitor.id, e.target.value as MonitorStatus)}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            ))}
            
            {darkWeb.monitors.length === 0 && (
              <div className={styles.noMonitors}>
                <p>No monitors configured</p>
              </div>
            )}
          </div>
        </div>
        <button 
          className={styles.addMonitorButton}
          onClick={() => setShowCreateMonitor(true)}
        >
          <Plus size={14} />
          Add Monitor
        </button>
      </div>
    </div>
  );
};

export default DarkWebPanel;
