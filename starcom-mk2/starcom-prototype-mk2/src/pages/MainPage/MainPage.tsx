import React from 'react';
import GlobeView from '../../components/Globe/Globe';
import HUDLayout from '../../layouts/HUDLayout/HUDLayout';
import styles from './MainPage.module.css';

const MainPage: React.FC = () => {
  return (
    <div className={styles.mainPage}>
      <GlobeView />
      <HUDLayout />
    </div>
  );
};

export default MainPage;
