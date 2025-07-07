import React from 'react';
import styles from './NotificationsScreen.module.css';

const NotificationsScreen: React.FC = () => {
  return (
    <div className={styles.notificationsScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Notification Settings</h1>
        <div className={styles.content}>
          <p>Configure your notification preferences and alert thresholds.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>🔔</div>
            <div className={styles.message}>Notification settings are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsScreen;
