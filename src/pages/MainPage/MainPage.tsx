import React, { useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import styles from './MainPage.module.css';
import GlobalHeader from '../../components/MainPage/GlobalHeader';
import MainMarqueeTopBar from '../../components/MainPage/MainMarqueeTopBar';
import MainBottomBar from '../../components/MainPage/MainBottomBar';
import MainCenter from '../../components/MainPage/MainCenter';
import { ApplicationRenderer } from '../../components/Router/ApplicationRenderer';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import { SecureChatManager } from '../../components/SecureChat';

const MainPage: React.FC = () => {
  const { currentApp, context, navigateToApp } = useEnhancedApplicationRouter();
  const params = useParams();
  const location = useLocation();
  
  // Auto-navigate to CyberCommand when visiting the root URL
  useEffect(() => {
    if (location.pathname === '/' && !currentApp) {
      console.log('🏠 MainPage: Auto-navigating to CyberCommand Globe on root URL');
      navigateToApp('cybercommand', 'standalone');
    }
  }, [location.pathname, currentApp, navigateToApp]);
  
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
