import React from 'react';
import HUDLayout from '../../layouts/HUDLayout/HUDLayout';
import styles from './MainPage.module.css';

// AI-NOTE: Globe now renders inside HUD center via CenterViewManager
// No longer needs separate background layer - integrated into HUD architecture

const MainPage: React.FC = () => {
  return (
    <div className={styles.mainPage}>
      {/* HUD Layer with integrated Globe in center */}
      <HUDLayout />
    </div>
  );
};

export default MainPage;
