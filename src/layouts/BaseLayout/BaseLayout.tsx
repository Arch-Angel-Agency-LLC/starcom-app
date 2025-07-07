import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBarNavigation from '../../components/Navigation/TopBarNavigation';
import Breadcrumbs from '../../components/Navigation/Breadcrumbs';
import ErrorBoundary from '../../components/Shared/ErrorBoundary';
import styles from './BaseLayout.module.css';

interface BaseLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  maxWidth?: 'full' | 'container' | 'narrow';
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ 
  children, 
  showBreadcrumbs = true,
  maxWidth = 'container'
}) => {
  const navigate = useNavigate();

  return (
    <div className={styles.baseLayout}>
      {/* Top Navigation */}
      <TopBarNavigation />
      
      {/* Breadcrumb Navigation */}
      {showBreadcrumbs && (
        <div className={styles.breadcrumbContainer}>
          <Breadcrumbs />
        </div>
      )}
      
      {/* Main Content Area */}
      <main className={`${styles.mainContent} ${styles[maxWidth]}`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      
      {/* Return to Globe Button - Always Available */}
      <button 
        className={styles.returnToGlobe}
        onClick={() => navigate('/')}
        title="Return to Globe Command Interface"
        aria-label="Return to Globe"
      >
        🌐 Globe
      </button>
    </div>
  );
};

export default BaseLayout;
