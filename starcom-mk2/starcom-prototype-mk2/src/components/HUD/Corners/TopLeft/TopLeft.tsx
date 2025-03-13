// src/components/HUD/Corners/TopLeft/TopLeft.tsx
import React from 'react';
import TinyGlobe from '../../../TinyGlobe/TinyGlobe';
import styles from './TopLeft.module.css';

const TopLeft: React.FC = () => {
  return (
    <div className={styles.topLeft}>
      <div className={styles.tinyGlobeContainer}>
        <TinyGlobe />
      </div>
    </div>
  );
};

export default TopLeft;