import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import styles from './MainPage.module.css';
import GlobalHeader from '../../components/MainPage/GlobalHeader';
import MarqueeTopBar from '../../components/MainPage/MarqueeTopBar';
import MainBottomBar from '../../components/MainPage/MainBottomBar';
import MainCenter from '../../components/MainPage/MainCenter';
import ScreenLoader from '../../components/MainPage/ScreenLoader';
import { useView } from '../../context/useView';
import { SecureChatManager } from '../../components/SecureChat';

const MainPage: React.FC = () => {
  const { currentScreen, screenParams, setScreenParams } = useView();
  const params = useParams();
  
  // Update screen params when route params change
  useEffect(() => {
    if (Object.keys(params).length > 0) {
      setScreenParams({...screenParams, ...params});
    }
  }, [params, setScreenParams, screenParams]);
  
  return (
    <div className={styles.mainPage}>
      {/* Global header with logo, search, and user profile */}
      <GlobalHeader hasNotifications={true} />
      
      {/* Marquee bar with current view title and status indicators */}
      <MarqueeTopBar />
      
      {/* Main content area - contains the active screen */}
      <MainCenter>
        <ScreenLoader screenType={currentScreen} params={screenParams} />
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
