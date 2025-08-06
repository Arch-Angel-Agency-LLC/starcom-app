import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import styles from './MainPage.module.css';
import GlobalHeader from '../../components/MainPage/GlobalHeader';
import MainMarqueeTopBar from '../../components/MainPage/MainMarqueeTopBar';
import MainBottomBar from '../../components/MainPage/MainBottomBar';
import MainCenter from '../../components/MainPage/MainCenter';
import { ApplicationRenderer } from '../../components/Router/ApplicationRenderer';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import { SecureChatManager } from '../../components/SecureChat';
import { componentTracker } from '../../utils/performanceMonitor';

const MainPage: React.FC = () => {
  const { currentApp, context, navigateToApp } = useEnhancedApplicationRouter();
  const params = useParams();
  const location = useLocation();
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  
  // Track component mounting for performance monitoring
  useEffect(() => {
    componentTracker.trackComponentMount('MainPage');
    return () => {
      componentTracker.trackComponentUnmount('MainPage');
    };
  }, []);
  
  // Auto-navigate to CyberCommand when visiting the root URL (STABILIZED)
  useEffect(() => {
    if (location.pathname === '/' && !currentApp && !hasAutoNavigated) {
      console.log('🏠 MainPage: Auto-navigating to CyberCommand Globe on root URL (one-time)');
      setHasAutoNavigated(true);
      navigateToApp('cybercommand', 'standalone');
    }
  }, [location.pathname, currentApp, navigateToApp, hasAutoNavigated]);
  
  // DIAGNOSTIC: Log current application state
  console.log('🏠 MainPage: Enhanced Router state', { 
    currentApp, 
    context,
    urlParams: params,
    pathname: location.pathname 
  });
  
  return (
    <div className={styles.mainPage}>
      {/* Global header with logo, search, and user profile */}
      <GlobalHeader hasNotifications={true} />
      
      {/* Marquee bar with current view title and status indicators */}
      <MainMarqueeTopBar />
      
      {/* Main content area - contains the active application */}
      <MainCenter>
        <ApplicationRenderer />
        <Outlet /> {/* This will render any nested route content */}
      </MainCenter>
      
      {/* Main navigation bar */}
      <MainBottomBar />
      
      {/* Chat overlay system */}
      <SecureChatManager />
    </div>
  );
};

export default MainPage;
