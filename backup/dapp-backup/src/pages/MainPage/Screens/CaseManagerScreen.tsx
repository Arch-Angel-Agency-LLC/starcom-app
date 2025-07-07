import React from 'react';
import styles from './CaseManagerScreen.module.css';
import CaseManagerDashboard from '../../CaseManager/components/CaseManagerDashboard';

const CaseManagerScreen: React.FC = () => {
  return (
    <div className={styles.caseManagerScreen}>
      <CaseManagerDashboard />
    </div>
  );
};

export default CaseManagerScreen;
