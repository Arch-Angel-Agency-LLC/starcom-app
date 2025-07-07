import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Map, Network, Clock, Terminal, FileText, Shield, Eye, Command } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePopup } from '../../components/Popup/PopupManager';
import styles from './OSINTDashboard.module.css';

// Panel components
import { SearchPanel } from './components/panels/SearchPanel';
import { ResultsPanel } from './components/panels/ResultsPanel';
import { GraphPanel } from './components/panels/GraphPanel';
import { TimelinePanel } from './components/panels/TimelinePanel';
import { MapPanel } from './components/panels/MapPanel';
import { BlockchainPanel } from './components/panels/BlockchainPanel';
import { DarkWebPanel } from './components/panels/DarkWebPanel';
import { OPSECPanel } from './components/panels/OPSECPanel';

// OSINT components
import { OSINTSearchBar } from './components/OSINTSearchBar';
import { OSINTPanelLayout } from './components/OSINTPanelLayout';
import { OSINTToolbar } from './components/OSINTToolbar';
import { CommandPalette } from './components/CommandPalette';
import { ThreatIndicators } from './components/ThreatIndicators';
import { InvestigationSelector } from './components/InvestigationSelector';

// Types
import { Panel, PanelType, Investigation, OSINTMode } from './types/osint';

/**
 * OSINT Dashboard - Earth Alliance Cyber Investigation Suite
 * 
 * This component serves as the main entry point for the OSINT functionality
 * in the Starcom dApp. It provides a flexible, multi-panel interface for
 * conducting advanced OSINT operations with Earth Alliance theming.
 */
const OSINTDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showPopup } = usePopup();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<OSINTMode>('search');
  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([
    { id: 'search-1', type: 'search', position: { x: 0, y: 0, w: 3, h: 2 }, data: {}, locked: false },
    { id: 'results-1', type: 'results', position: { x: 0, y: 2, w: 3, h: 8 }, data: {}, locked: false },
    { id: 'graph-1', type: 'graph', position: { x: 3, y: 0, w: 9, h: 6 }, data: {}, locked: false },
    { id: 'timeline-1', type: 'timeline', position: { x: 3, y: 6, w: 9, h: 4 }, data: {}, locked: false },
  ]);
  
  // Load saved layout from localStorage if available
  useEffect(() => {
    const savedLayout = localStorage.getItem('starcom-osint-layout');
    if (savedLayout) {
      try {
        setPanels(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to parse saved OSINT layout', e);
      }
    }
  }, []);
  
  // Save layout to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('starcom-osint-layout', JSON.stringify(panels));
  }, [panels]);
  
  // Open command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Update results panel with search query
    setPanels(prev => prev.map(panel => 
      panel.type === 'results' ? { ...panel, data: { ...panel.data, query } } : panel
    ));
  }, []);
  
  // Add a new panel
  const handleAddPanel = useCallback((type: PanelType) => {
    // Check if authentication is required for this panel type
    const requiresAuth = ['blockchain', 'darkweb', 'opsec'].includes(type);
    
    if (requiresAuth && !isAuthenticated) {
      showPopup({
        component: ({ onClose }) => (
          <div className={styles.authPopup}>
            <h2>Authentication Required</h2>
            <p>Connect your wallet to access advanced OSINT features.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )
      });
      return;
    }
    
    const newPanel: Panel = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 0, y: 0, w: 4, h: 4 },
      data: {},
      locked: false
    };
    
    setPanels(prev => [...prev, newPanel]);
  }, [isAuthenticated, showPopup]);
  
  // Handle panel layout change
  const handleLayoutChange = useCallback((updatedPanels: Panel[]) => {
    setPanels(updatedPanels);
  }, []);
  
  // Handle mode change
  const handleModeChange = useCallback((mode: OSINTMode) => {
    // Some modes require authentication
    const requiresAuth = ['monitor', 'darkweb'].includes(mode);
    
    if (requiresAuth && !isAuthenticated) {
      showPopup({
        component: ({ onClose }) => (
          <div className={styles.authPopup}>
            <h2>Authentication Required</h2>
            <p>Connect your wallet to access advanced OSINT features.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )
      });
      return;
    }
    
    setActiveMode(mode);
  }, [isAuthenticated, showPopup]);

  // Create new investigation
  const handleCreateInvestigation = useCallback(() => {
    // Check our Investigation type definition to ensure we create a valid object
    const newInvestigation: Investigation = {
      id: `inv-${Date.now()}`,
      name: 'New Investigation',
      description: 'Created ' + new Date().toLocaleString(),
      created: new Date(),
      modified: new Date(),
      tags: ['new'],
      shared: [],
      status: 'active'
    };
    
    setActiveInvestigation(newInvestigation);
    showPopup({
      component: ({ onClose }) => (
        <div className={styles.successPopup}>
          <h2>New Investigation Created</h2>
          <p>Started a new OSINT investigation</p>
          <button onClick={onClose}>Close</button>
        </div>
      )
    });
  }, [showPopup]);
  
  // Handle command execution
  const handleCommandExecution = useCallback((commandId: string, args?: unknown) => {
    console.log(`Executing command: ${commandId}`, args);
    
    switch (commandId) {
      case 'add-panel':
        // Add new panel logic
        handleAddPanel('search');
        break;
      case 'remove-panel':
        // Remove panel logic
        if (panels.length > 0) {
          setPanels(prev => prev.slice(0, -1));
        }
        break;
      case 'reset-layout':
        // Reset layout logic
        localStorage.removeItem('starcom-osint-layout');
        setPanels([
          { id: 'search-1', type: 'search', position: { x: 0, y: 0, w: 3, h: 2 }, data: {}, locked: false },
          { id: 'results-1', type: 'results', position: { x: 0, y: 2, w: 3, h: 8 }, data: {}, locked: false },
          { id: 'graph-1', type: 'graph', position: { x: 3, y: 0, w: 9, h: 6 }, data: {}, locked: false },
          { id: 'timeline-1', type: 'timeline', position: { x: 3, y: 6, w: 9, h: 4 }, data: {}, locked: false },
        ]);
        break;
      case 'new-investigation':
        // New investigation logic
        handleCreateInvestigation();
        break;
      default:
        console.log(`Unknown command: ${commandId}`);
    }
  }, [handleAddPanel, panels.length, handleCreateInvestigation]);

  return (
    <div className={styles.osintDashboard}>
      {/* Top Command Bar */}
      <div className={styles.commandBar}>
        <div className={styles.logoSection}>
          <Shield className={styles.logo} />
          <span className={styles.title}>OSINT OPERATIONS</span>
        </div>
        
        <OSINTSearchBar 
          value={searchQuery} 
          onChange={setSearchQuery}
          onSearch={handleSearch}
          className={styles.searchBar}
        />
        
        <ThreatIndicators />
        
        <div className={styles.modeToggle}>
          <button
            onClick={() => handleModeChange('search')}
            className={`${styles.modeButton} ${activeMode === 'search' ? styles.activeMode : ''}`}
          >
            <Search className={styles.icon} />
          </button>
          <button
            onClick={() => handleModeChange('investigate')}
            className={`${styles.modeButton} ${activeMode === 'investigate' ? styles.activeMode : ''}`}
          >
            <Network className={styles.icon} />
          </button>
          <button
            onClick={() => handleModeChange('monitor')}
            className={`${styles.modeButton} ${activeMode === 'monitor' ? styles.activeMode : ''}`}
            disabled={!isAuthenticated}
          >
            <Eye className={styles.icon} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <OSINTToolbar onAddPanel={handleAddPanel} />
      
      {/* Investigation Selector */}
      <InvestigationSelector 
        activeInvestigation={activeInvestigation}
        onSelectInvestigation={setActiveInvestigation}
      />

      {/* Main Workspace */}
      <div className={styles.workspace}>
        <OSINTPanelLayout 
          panels={panels} 
          onLayoutChange={handleLayoutChange} 
        />
        
        {/* Floating Command Palette - press Cmd/Ctrl+K to activate */}
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onExecuteCommand={handleCommandExecution}
        />
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusItems}>
          <span className={styles.statusActive}>● SECURE CONNECTION</span>
          <span>Investigation: {activeInvestigation?.name || 'None'}</span>
        </div>
        <div className={styles.statusItems}>
          <span>Entities: 0</span>
          <span>Queries: {Math.floor(Math.random() * 30)}/min</span>
          <span>Cache: {Math.floor(Math.random() * 100)}MB</span>
        </div>
      </div>
    </div>
  );
};

export default OSINTDashboard;
