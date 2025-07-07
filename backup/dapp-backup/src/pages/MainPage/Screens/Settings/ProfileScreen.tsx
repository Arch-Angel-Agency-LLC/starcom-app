import React from 'react';
import styles from './ProfileScreen.module.css';

const ProfileScreen: React.FC = () => {
  return (
    <div className={styles.profileScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Profile Settings</h1>
        <div className={styles.content}>
          <p>Manage your user profile, credentials, and personal settings.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>👤</div>
            <div className={styles.message}>Profile settings are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
