import React, { lazy, Suspense } from 'react';
import styles from './CyberCommandLeftSideBar.module.css';
import ModeSettingsPanel from './ModeSettingsPanel';
import VisualizationModeButtons from './VisualizationModeButtons';
// Adaptive interface imports commented out but preserved for easy re-enabling
// import RoleSelector from '../../../Adaptive/RoleSelector';
// import ProgressiveDisclosure from '../../../Adaptive/ProgressiveDisclosure';

// Lazy load TinyGlobe to reduce initial bundle size
const TinyGlobe = lazy(() => import('../../../TinyGlobe/TinyGlobe'));

const CyberCommandLeftSideBar: React.FC = () => {
  return (
    <div className={styles.cyberCommandLeftSideBar}>
      <div className={styles.content}>
        <Suspense fallback={<div className={styles.tinyGlobePlaceholder}>Loading Globe...</div>}>
          <TinyGlobe />
        </Suspense>
        <VisualizationModeButtons />
        <ModeSettingsPanel />
        
        {/* Adaptive Interface Controls - Hidden for clean human UX, functionality preserved for AI agents */}
        {/* 
        <div className={styles.adaptiveSection}>
          <RoleSelector />
          <ProgressiveDisclosure />
        </div>
        */}
      </div>
    </div>
  );
};

export default CyberCommandLeftSideBar;