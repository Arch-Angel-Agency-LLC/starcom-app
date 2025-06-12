import React from 'react';
import WalletStatus from '../../../Auth/WalletStatus';
import styles from './TopRight.module.css';

const TopRight: React.FC = () => {
  return (
    <div className={styles.topRight}>
      <WalletStatus />
    </div>
  );
};

export default TopRight;