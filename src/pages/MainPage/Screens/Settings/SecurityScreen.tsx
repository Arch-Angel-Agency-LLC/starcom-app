import React from 'react';
import styles from './SecurityScreen.module.css';

const SecurityScreen: React.FC = () => {
  return (
    <div className={styles.securityScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Security Settings</h1>
        <div className={styles.content}>
          <p>Manage your security preferences, authentication methods, and access controls.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>🔒</div>
            <div className={styles.message}>Security settings are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityScreen;
