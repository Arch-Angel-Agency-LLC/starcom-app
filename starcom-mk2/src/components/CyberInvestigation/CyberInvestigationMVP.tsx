import React from 'react';
import AuthGate from '../Auth/AuthGate';
import InvestigationDashboard from '../Investigation/InvestigationDashboard';
import styles from './CyberInvestigationMVP.module.css';

// AI-NOTE: Enhanced MVP for cyber investigation teams
// Upgraded to use the new Investigation Management System

interface CyberInvestigationMVPProps {
  teamId?: string;
  investigationId?: string;
}

const CyberInvestigationMVP: React.FC<CyberInvestigationMVPProps> = ({
  teamId = 'mvp-team-001'
}) => {
  return (
    <div className={styles.mvpContainer}>
      <AuthGate requirement="wallet" action="access investigation system">
        <InvestigationDashboard teamId={teamId} />
      </AuthGate>
    </div>
  );
};

export default CyberInvestigationMVP;
