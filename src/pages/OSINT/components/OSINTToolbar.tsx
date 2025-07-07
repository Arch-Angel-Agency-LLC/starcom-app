import React from 'react';
import { Plus, Save, Download, Upload, Share2, Settings } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import styles from './OSINTToolbar.module.css';

export interface OSINTToolbarProps {
  onAddPanel?: (panelType: string) => void;
  onSaveInvestigation?: () => void;
  onExportResults?: () => void;
  onImportData?: () => void;
  onShareInvestigation?: () => void;
  onOpenSettings?: () => void;
}

/**
 * Toolbar component for the OSINT dashboard with Earth Alliance styling
 * Provides quick access to key OSINT operations
 */
export const OSINTToolbar: React.FC<OSINTToolbarProps> = ({
  onAddPanel,
  onSaveInvestigation,
  onExportResults,
  onImportData,
  onShareInvestigation,
  onOpenSettings
}) => {
  const { isAuthenticated } = useAuth();
  
  // Panel type options for the add panel dropdown
  const panelTypes = [
    { id: 'search', label: 'Search', description: 'Advanced search configuration' },
    { id: 'results', label: 'Results', description: 'Search result visualization' },
    { id: 'graph', label: 'Entity Graph', description: 'Network visualization of entities' },
    { id: 'timeline', label: 'Timeline', description: 'Chronological event analysis' },
    { id: 'map', label: 'Geospatial', description: 'Location-based intelligence' },
    { id: 'blockchain', label: 'Blockchain', description: 'Cryptocurrency investigation', requiresAuth: true },
    { id: 'darkweb', label: 'Dark Web', description: 'Dark web monitoring', requiresAuth: true },
    { id: 'opsec', label: 'OPSEC Shield', description: 'Security & anonymity tools', requiresAuth: true }
  ];

  // Handle add panel selection
  const handleAddPanel = (panelType: string) => {
    if (onAddPanel) {
      onAddPanel(panelType);
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <div className={styles.dropdown}>
          <button className={styles.toolbarButton} aria-label="Add Panel">
            <Plus className={styles.buttonIcon} />
            <span className={styles.buttonText}>Add Panel</span>
          </button>
          
          <div className={styles.dropdownContent}>
            <div className={styles.dropdownHeader}>Add Investigation Panel</div>
            <div className={styles.dropdownItems}>
              {panelTypes.map((panel) => (
                <button
                  key={panel.id}
                  className={`${styles.dropdownItem} ${panel.requiresAuth && !isAuthenticated ? styles.disabledItem : ''}`}
                  onClick={() => handleAddPanel(panel.id)}
                  disabled={panel.requiresAuth && !isAuthenticated}
                >
                  <div className={styles.itemContent}>
                    <span className={styles.itemLabel}>{panel.label}</span>
                    <span className={styles.itemDescription}>{panel.description}</span>
                  </div>
                  {panel.requiresAuth && !isAuthenticated && (
                    <span className={styles.authRequired}>Requires Auth</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.toolbarGroup}>
        <button 
          className={`${styles.toolbarButton} ${!isAuthenticated ? styles.disabledButton : ''}`}
          onClick={onSaveInvestigation}
          disabled={!isAuthenticated}
          aria-label="Save Investigation"
        >
          <Save className={styles.buttonIcon} />
          <span className={styles.buttonText}>Save</span>
        </button>
        
        <button 
          className={styles.toolbarButton}
          onClick={onExportResults}
          aria-label="Export Results"
        >
          <Download className={styles.buttonIcon} />
          <span className={styles.buttonText}>Export</span>
        </button>
        
        <button 
          className={styles.toolbarButton}
          onClick={onImportData}
          aria-label="Import Data"
        >
          <Upload className={styles.buttonIcon} />
          <span className={styles.buttonText}>Import</span>
        </button>
      </div>
      
      <div className={styles.toolbarGroup}>
        <button 
          className={`${styles.toolbarButton} ${!isAuthenticated ? styles.disabledButton : ''}`}
          onClick={onShareInvestigation}
          disabled={!isAuthenticated}
          aria-label="Share Investigation"
        >
          <Share2 className={styles.buttonIcon} />
          <span className={styles.buttonText}>Share</span>
        </button>
        
        <button 
          className={styles.toolbarButton}
          onClick={onOpenSettings}
          aria-label="OSINT Settings"
        >
          <Settings className={styles.buttonIcon} />
          <span className={styles.buttonText}>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default OSINTToolbar;
