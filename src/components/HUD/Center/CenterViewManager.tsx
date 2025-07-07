// Center View Manager - Multi-Context Display Controller
// Handles Globe, Teams, Bots, Node Web, Investigations, and Intel views

import React, { lazy, Suspense, useRef, useEffect } from 'react';
import { useView } from '../../../context/useView';
import styles from './CenterViewManager.module.css';

// Import the real Globe component - not lazy loaded to keep it mounted
import Globe from '../../Globe/Globe';

// Import collaboration view - not lazy loaded to maintain real-time connections
import TeamCollaborationView from '../../Views/TeamCollaborationView';

// Import AI Agent view - not lazy loaded for better performance
import AIAgentView from '../../Views/AIAgentView';

// Import view components
const IntelDashboard = lazy(() => import('../../../pages/Intel/IntelDashboard'));
const OSINTDashboard = lazy(() => import('../../../pages/OSINT/OSINTDashboard'));

interface CenterViewManagerProps {
  className?: string;
  globeOnly?: boolean; // Add prop to show only the globe (for embedded mode)
}

const CenterViewManager: React.FC<CenterViewManagerProps> = ({ 
  className = '', 
  globeOnly = false 
}) => {
  const { currentView } = useView();
  const globeContainerRef = useRef<HTMLDivElement>(null);

  // Update globe container visibility based on current view
  useEffect(() => {
    if (globeContainerRef.current) {
      // In globeOnly mode, always show the globe regardless of currentView
      globeContainerRef.current.style.display = globeOnly || currentView === 'globe' ? 'block' : 'none';
    }
  }, [currentView, globeOnly]);

  const renderCurrentView = () => {
    // If in globeOnly mode, don't render any other views
    if (globeOnly) {
      return null;
    }
    
    switch (currentView) {
      case 'globe':
        // Globe is always mounted, just show/hide the container
        return null; // The globe is rendered separately below
      case 'teams':
        return <TeamCollaborationView />;
      case 'ai-agent':
        return <AIAgentView />;
      case 'intel':
        return (
          <Suspense fallback={<div className={styles.loadingView}>Loading Intel...</div>}>
            <IntelDashboard />
          </Suspense>
        );
      case 'info-gathering':
      case 'netrunner':
        return (
          <Suspense fallback={<div className={styles.loadingView}>Loading OSINT Suite...</div>}>
            <OSINTDashboard />
          </Suspense>
        );
      case 'bots':
        return (
          <div className={styles.placeholderView}>
            <div className={styles.placeholderContent}>
              <h2>🤖 AI Bots & Automation</h2>
              <p>AI agents and automation dashboard coming soon...</p>
            </div>
          </div>
        );
      case 'node-web':
        return (
          <div className={styles.placeholderView}>
            <div className={styles.placeholderContent}>
              <h2>🕸️ Node Web</h2>
              <p>Network topology and connections visualization coming soon...</p>
            </div>
          </div>
        );
      default:
        return null; // Default to globe view
    }
  };

  return (
    <div className={`${styles.centerViewManager} ${className}`}>
      {/* Globe container - always mounted but hidden when not active */}
      <div 
        ref={globeContainerRef}
        className={`${styles.globeContainer} ${globeOnly ? styles.globeOnly : ''}`}
        style={{ 
          display: globeOnly || currentView === 'globe' ? 'block' : 'none',
          width: '100%',
          height: '100%'
        }}
      >
        <Globe />
      </div>
      
      {/* Other views */}
      {renderCurrentView()}
    </div>
  );
};

export default CenterViewManager;
