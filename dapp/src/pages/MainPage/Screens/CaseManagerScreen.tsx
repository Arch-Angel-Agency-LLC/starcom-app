import React from 'react';
import styles from './CaseManagerScreen.module.css';

const CaseManagerScreen: React.FC = () => {
  return (
    <div className={styles.caseManagerScreen}>
      <div className={styles.container}>
        <h1 className={styles.title}>Case Manager</h1>
        <div className={styles.content}>
          <p>The Case Manager provides tools for organizing and tracking investigation cases.</p>
          <div className={styles.placeholder}>
            <div className={styles.icon}>📁</div>
            <div className={styles.message}>Case management tools are being integrated into the new UI structure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseManagerScreen;
