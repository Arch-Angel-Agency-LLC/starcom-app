import React, { useState } from 'react';
import styles from './HUDLayout.module.css';
import TopBar from '../../components/HUD/Bars/TopBar/TopBar';
import NewBottomBar from '../../components/HUD/Bars/NewBottomBar/NewBottomBar';
import LeftSideBar from '../../components/HUD/Bars/LeftSideBar/LeftSideBar';
import RightSideBar from '../../components/HUD/Bars/RightSideBar/RightSideBar';
import TopLeftCorner from '../../components/HUD/Corners/TopLeft/TopLeft';
import TopRightCorner from '../../components/HUD/Corners/TopRight/TopRight';
import BottomLeftCorner from '../../components/HUD/Corners/BottomLeft/BottomLeft';
import BottomRightCorner from '../../components/HUD/Corners/BottomRight/BottomRight';
import FloatingPanelManager from '../../components/HUD/FloatingPanels/FloatingPanelManager';
import FloatingPanelDemo from '../../components/HUD/FloatingPanels/FloatingPanelDemo';
import NOAAFloatingIntegration from '../../components/HUD/FloatingPanels/NOAAFloatingIntegration';
import CenterViewManager from '../../components/HUD/Center/CenterViewManager';
import QuickAccessPanel from '../../components/HUD/QuickAccess/QuickAccessPanel';
import NewUserHint from '../../components/HUD/NewUserHint/NewUserHint';
// import FeatureFlagControls from '../../components/HUD/FeatureFlagControls/FeatureFlagControls';
// import DiagnosticsToggle from '../../components/HUD/DiagnosticsToggle/DiagnosticsToggle';
import NotificationSystem from '../../components/NotificationSystem/NotificationSystem';
import ContextBridge from '../../components/Bridge/ContextBridge';
import PhaseTransitionManager from '../../components/Bridge/PhaseTransitionManager';
import { AdaptiveInterfaceProvider } from '../../context/AdaptiveInterfaceContext';
import { EnhancedAdaptiveInterfaceProvider } from '../../components/Adaptive/EnhancedAdaptiveInterfaceProvider';
import AdaptiveUIController from '../../components/Adaptive/AdaptiveUIController';
import Phase4Integration from '../../components/Gaming/Phase4Integration';
import Phase5Integration from '../../components/Optimization/Phase5Integration';
import PerformanceOptimizer from '../../components/Optimization/PerformanceOptimizer';
import SecurityHardening from '../../components/Optimization/SecurityHardening';
import { useFeatureFlag } from '../../utils/featureFlags';
import { PopupProvider } from '../../components/Popup/PopupManager';
import { GlobeLoadingProvider } from '../../context/GlobeLoadingContext';
import { SecureChatManager } from '../../components/SecureChat';

const HUDLayout: React.FC = () => {
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  
  const enhancedCenterEnabled = useFeatureFlag('enhancedCenter');
  const enhancedAdaptiveEnabled = useFeatureFlag('enhancedContextEnabled');
  const adaptiveInterfaceEnabled = useFeatureFlag('adaptiveInterfaceEnabled');
  const performanceMonitoringEnabled = useFeatureFlag('performanceMonitoringEnabled');
  const performanceOptimizerEnabled = useFeatureFlag('performanceOptimizerEnabled');
  const securityHardeningEnabled = useFeatureFlag('securityHardeningEnabled');
  const uiTestingDiagnosticsEnabled = useFeatureFlag('uiTestingDiagnosticsEnabled');
  const phase4EnabledFlag = useFeatureFlag('phase4Enabled');
  const phase5EnabledFlag = useFeatureFlag('phase5Enabled');

  // Keyboard shortcut to show quick access
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowQuickAccess(true);
      }
      if (event.key === 'Escape') {
        setShowQuickAccess(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const AdaptiveProvider = enhancedAdaptiveEnabled ? EnhancedAdaptiveInterfaceProvider : AdaptiveInterfaceProvider;

  const HUDContent = () => (
    <GlobeLoadingProvider>
      <PopupProvider>
        <AdaptiveProvider>
          <AdaptiveUIController>
            <PhaseTransitionManager>
              <ContextBridge>
                <FloatingPanelManager>
                  <div className={styles.hudLayout}>
                    <div className={styles.topLeftCorner}><TopLeftCorner /></div>
                    <div className={styles.topRightCorner}><TopRightCorner /></div>
                    <div className={styles.bottomLeftCorner}><BottomLeftCorner /></div>
                    <div className={styles.bottomRightCorner}><BottomRightCorner /></div>
                    <div className={styles.topBar}><TopBar /></div>
                    <div className={styles.bottomBar}><NewBottomBar /></div>
                    <div className={styles.leftSideBar}><LeftSideBar /></div>
                    <div className={styles.rightSideBar}><RightSideBar /></div>
                    <div className={styles.center}>
                      {enhancedCenterEnabled ? (
                        <CenterViewManager />
                      ) : (
                        // Legacy center content - empty for now
                        <div />
                      )}
                    </div>
                    
                    {/* NOAA Floating Integration - Connects NOAA datasets to floating panels */}
                    <NOAAFloatingIntegration />
                    
                    {/* UI Testing Diagnostics - Only visible when diagnostics mode is enabled */}
                    {uiTestingDiagnosticsEnabled && (
                      <>
                        {/* Floating Panel Demo - Development/Testing only */}
                        <FloatingPanelDemo />
                        
                        {/* Feature Flag Controls - Now integrated into RightSideBar Developer Tools */}
                        {/* <FeatureFlagControls /> */}
                      </>
                    )}
                  </div>
                  
                  {/* Earth Alliance Secure Chat System */}
                  <SecureChatManager />
                  
                  {/* Quick Access Panel - Triggered by Ctrl+K */}
                  {showQuickAccess && (
                    <div className={styles.overlay} onClick={() => setShowQuickAccess(false)}>
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuickAccessPanel />
                      </div>
                    </div>
                  )}
                  
                </FloatingPanelManager>
              </ContextBridge>
            </PhaseTransitionManager>
          </AdaptiveUIController>
        </AdaptiveProvider>
        
        {/* Subtle New User Hint - Non-blocking */}
        <NewUserHint />
      </PopupProvider>
    </GlobeLoadingProvider>
  );

  // Phase 4 Integration: Wrap with gaming enhancements if enabled
  // Phase 5 Integration: Wrap with optimization monitoring if enabled
  if (phase4EnabledFlag && phase5EnabledFlag) {
    return (
      <Phase4Integration>
        <Phase5Integration>
          <HUDContent />
          
          {/* Core Components that exist outside the main HUD */}
          <NotificationSystem />
          
          {/* Performance monitoring tools */}
          {performanceMonitoringEnabled && <PerformanceOptimizer />}
          {securityHardeningEnabled && <SecurityHardening />}
        </Phase5Integration>
      </Phase4Integration>
    );
  }
  
  // Phase 4 only
  if (phase4EnabledFlag) {
    return (
      <Phase4Integration>
        <HUDContent />
        <NotificationSystem />
        {performanceMonitoringEnabled && <PerformanceOptimizer />}
        {securityHardeningEnabled && <SecurityHardening />}
      </Phase4Integration>
    );
  }
  
  // Phase 5 only
  if (phase5EnabledFlag) {
    return (
      <Phase5Integration>
        <HUDContent />
        <NotificationSystem />
        {performanceMonitoringEnabled && <PerformanceOptimizer />}
        {securityHardeningEnabled && <SecurityHardening />}
      </Phase5Integration>
    );
  }
  
  // Default case - no phase enhancements
  return (
    <>
      <HUDContent />
      <NotificationSystem />
      {performanceMonitoringEnabled && <PerformanceOptimizer />}
      {securityHardeningEnabled && <SecurityHardening />}
    </>
  );
};

export default HUDLayout;
