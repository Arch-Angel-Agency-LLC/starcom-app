// Center View Manager - Multi-Context Display Controller
// Handles Globe, Teams, Bots, Node Web, Investigations, and Intel views

import React, { lazy, Suspense, useRef, useEffect } from 'react';
import { useView } from '../../../context/ViewContext';
import styles from './CenterViewManager.module.css';

// Import the real Globe component - not lazy loaded to keep it mounted
import Globe from '../../Globe/Globe';

// Import view components
const TeamsDashboard = lazy(() => import('../../../pages/Teams/TeamsDashboard'));
const InvestigationsDashboard = lazy(() => import('../../../pages/Investigations/InvestigationsDashboard'));
const IntelDashboard = lazy(() => import('../../../pages/Intel/IntelDashboard'));

interface CenterViewManagerProps {
  className?: string;
}

const CenterViewManager: React.FC<CenterViewManagerProps> = ({ className = '' }) => {
  const { currentView } = useView();
  const globeContainerRef = useRef<HTMLDivElement>(null);

  // Update globe container visibility based on current view
  useEffect(() => {
    if (globeContainerRef.current) {
      globeContainerRef.current.style.display = currentView === 'globe' ? 'block' : 'none';
    }
  }, [currentView]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'globe':
        // Globe is always mounted, just show/hide the container
        return null; // The globe is rendered separately below
      case 'teams':
        return (
          <Suspense fallback={<div className={styles.loadingView}>Loading Teams...</div>}>
            <TeamsDashboard />
          </Suspense>
        );
      case 'investigations':
        return (
          <Suspense fallback={<div className={styles.loadingView}>Loading Investigations...</div>}>
            <InvestigationsDashboard />
          </Suspense>
        );
      case 'intel':
        return (
          <Suspense fallback={<div className={styles.loadingView}>Loading Intel...</div>}>
            <IntelDashboard />
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
        className={styles.globeContainer}
        style={{ 
          display: currentView === 'globe' ? 'block' : 'none',
          width: '100%',
          height: '100%'
        }}
      >
        <Globe />
      </div>
      
      {/* Other views - dynamically rendered */}
      {currentView !== 'globe' && (
        <div className={styles.dynamicViewContainer}>
          {renderCurrentView()}
        </div>
      )}
    </div>
  );
};

export default CenterViewManager;
