import React from 'react';
import styles from './BottomLeft.module.css';
import Web3LoginPanel from '../../../Auth/Web3LoginPanel';

const BottomLeft: React.FC = () => {
  return (
    <div className={styles.bottomLeft}>
      <div className={styles.content}>
        <Web3LoginPanel />
      </div>
    </div>
  );
};

export default BottomLeft;