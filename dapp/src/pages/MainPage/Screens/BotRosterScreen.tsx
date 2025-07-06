import React from 'react';
import styles from './BotRosterScreen.module.css';

const BotRosterScreen: React.FC = () => {
  return (
    <div className={styles.botRosterScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Bot Roster</h1>
        <div className={styles.content}>
          <p>The Bot Roster provides tools for managing and deploying automated agents.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>🤖</div>
            <div className={styles.message}>Bot management tools are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotRosterScreen;
