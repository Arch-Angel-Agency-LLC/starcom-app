import React from 'react';
import styles from './TeamsScreen.module.css';
import TeamsContainer from './Teams/TeamsContainer';

const TeamsScreen: React.FC = () => {
  return (
    <div className={styles.teamsScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Teams Dashboard</h1>
        <div className={styles.teamsContainerWrapper}>
          <TeamsContainer />
        </div>
      </div>
    </div>
  );
};

export default TeamsScreen;
