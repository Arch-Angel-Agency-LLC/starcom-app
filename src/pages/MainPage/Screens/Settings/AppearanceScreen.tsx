import React from 'react';
import styles from './AppearanceScreen.module.css';

const AppearanceScreen: React.FC = () => {
  return (
    <div className={styles.appearanceScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Appearance Settings</h1>
        <div className={styles.content}>
          <p>Customize the visual appearance and theme of the application.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>🎨</div>
            <div className={styles.message}>Appearance settings are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceScreen;
