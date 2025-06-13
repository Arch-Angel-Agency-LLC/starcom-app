import React from 'react';
import styles from './LeftSideBar.module.css';
import TinyGlobe from '../../../TinyGlobe/TinyGlobe';
import wingCommanderLogo from '../../../../assets/images/WingCommanderLogo-288x162.gif';

const LeftSideBar: React.FC = () => {
  return (
    <div className={styles.leftSideBar}>
      <div className={styles.content}>
        <img src={wingCommanderLogo} alt="Wing Commander Logo" className={styles.logo} />
        <div className={styles.starcomText}>Starcom</div>
        <TinyGlobe />
      </div>
    </div>
  );
};

export default LeftSideBar;