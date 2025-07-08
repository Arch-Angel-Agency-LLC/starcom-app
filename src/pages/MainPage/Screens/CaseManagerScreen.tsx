import React, { Suspense, lazy } from 'react';
import styles from './CaseManagerScreen.module.css';

// Use lazy loading with error handling for the dashboard component
const CaseManagerDashboard = lazy(() => 
  import('../../CaseManager/components/CaseManagerDashboard')
    .catch(error => {
      console.error('Failed to load CaseManagerDashboard:', error);
      return { 
        default: () => (
          <div className={styles.errorContainer}>
            <h2>Failed to load Case Manager Dashboard</h2>
            <p>There was an error loading this component. Please try refreshing the page.</p>
            <pre>{error.message}</pre>
            <button onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        )
      };
    })
);

const CaseManagerScreen: React.FC = () => {
  return (
    <div className={styles.caseManagerScreen}>
      <Suspense fallback={<div>Loading Case Manager Dashboard...</div>}>
        <CaseManagerDashboard />
      </Suspense>
    </div>
  );
};

export default CaseManagerScreen;
