import React, { lazy, Suspense } from 'react';
import styles from './LeftSideBar.module.css';
import ModeSettingsPanel from './ModeSettingsPanel';
import wingCommanderLogo from '../../../../assets/images/WingCommanderLogo-288x162.gif';

// Lazy load TinyGlobe to reduce initial bundle size
const TinyGlobe = lazy(() => import('../../../TinyGlobe/TinyGlobe'));

const LeftSideBar: React.FC = () => {
  return (
    <div className={styles.leftSideBar}>
      <div className={styles.content}>
        <img src={wingCommanderLogo} alt="Wing Commander Logo" className={styles.logo} />
        <div className={styles.starcomText}>Starcom</div>
        <Suspense fallback={<div className={styles.tinyGlobePlaceholder}>Loading Globe...</div>}>
          <TinyGlobe />
        </Suspense>
        <ModeSettingsPanel />
      </div>
    </div>
  );
};

export default LeftSideBar;