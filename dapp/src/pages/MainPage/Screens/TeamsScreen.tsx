import React from 'react';
import styles from './TeamsScreen.module.css';

const TeamsScreen: React.FC = () => {
  return (
    <div className={styles.teamsScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Teams Dashboard</h1>
        <div className={styles.content}>
          <p>The Teams dashboard provides tools for team management and collaboration.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>👥</div>
            <div className={styles.message}>Team management tools are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsScreen;
