import React, { lazy, Suspense } from 'react';
import HUDLayout from '../../layouts/HUDLayout/HUDLayout';
import styles from './MainPage.module.css';

// Preload the Globe component immediately but keep it in separate chunk for memory management
const GlobeView = lazy(() => import('../../components/Globe/Globe'));

// Preload the Globe component as soon as this module loads
import('../../components/Globe/Globe');

const MainPage: React.FC = () => {
  return (
    <div className={styles.mainPage}>
      {/* HUD Layer - loads first */}
      <HUDLayout />
      
      {/* Globe Layer - with proper sizing and tactical loading */}
      <Suspense fallback={
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          zIndex: 0
        }}>
          {/* Globe loading will be handled by GlobeLoadingManager */}
        </div>
      }>
        <GlobeView />
      </Suspense>
    </div>
  );
};

export default MainPage;
