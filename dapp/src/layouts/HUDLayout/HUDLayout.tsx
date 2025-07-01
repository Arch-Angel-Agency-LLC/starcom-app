import React, { useState } from 'react';
import styles from './HUDLayout.module.css';
import TopBar from '../../components/HUD/Bars/TopBar/TopBar';
import BottomBar from '../../components/HUD/Bars/BottomBar/BottomBar';
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
import { ViewProvider } from '../../context/ViewContext';
import { GlobeLoadingProvider } from '../../context/GlobeLoadingContext';
import { SecureChatProvider } from '../../communication/context/SecureChatContext';
import { SecureChatManager } from '../../components/SecureChat';

const HUDLayout: React.FC = () => {
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  
  const enhancedCenterEnabled = useFeatureFlag('enhancedCenter');
  const enhancedAdaptiveEnabled = useFeatureFlag('enhancedContextEnabled');
  const phase4EnabledFlag = useFeatureFlag('adaptiveInterfaceEnabled');
  const phase5EnabledFlag = useFeatureFlag('performanceMonitoringEnabled');
  const performanceOptimizerEnabled = useFeatureFlag('performanceOptimizerEnabled');
  const securityHardeningEnabled = useFeatureFlag('securityHardeningEnabled');
  const uiTestingDiagnosticsEnabled = useFeatureFlag('uiTestingDiagnosticsEnabled');

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
    <ViewProvider>
      <GlobeLoadingProvider>
        <PopupProvider>
          <SecureChatProvider>
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
                  <div className={styles.bottomBar}><BottomBar /></div>
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
                  
                  {/* Real-Time Notification System */}
                  <NotificationSystem />
                  
                  {/* Phase 5: Performance Optimization Dashboard */}
                  {performanceOptimizerEnabled && (
                    <PerformanceOptimizer />
                  )}
                  
                  {/* Phase 5: Security Hardening Dashboard */}
                  {securityHardeningEnabled && (
                    <SecurityHardening />
                  )}
                  
                  {/* Development Diagnostics Toggle - Now integrated into RightSideBar */}
                  {/* <DiagnosticsToggle /> */}
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
        
        </SecureChatProvider>
        </PopupProvider>
        </GlobeLoadingProvider>
    </ViewProvider>
  );

  // Phase 4 Integration: Wrap with gaming enhancements if enabled
  // Phase 5 Integration: Wrap with optimization monitoring if enabled
  if (phase4EnabledFlag && phase5EnabledFlag) {
    return (
      <Phase5Integration
        enableRealTimeMonitoring={true}
        enableAutomaticOptimizations={true}
        enableSecurityAlerts={true}
      >
        <Phase4Integration
          enableSoundEffects={false} // Disabled by default for testing
          enableAdvancedAnimations={true}
        >
          <HUDContent />
        </Phase4Integration>
      </Phase5Integration>
    );
  }

  if (phase4EnabledFlag) {
    return (
      <Phase4Integration
        enableSoundEffects={false} // Disabled by default for testing
        enableAdvancedAnimations={true}
      >
        <HUDContent />
      </Phase4Integration>
    );
  }

  if (phase5EnabledFlag) {
    return (
      <Phase5Integration
        enableRealTimeMonitoring={true}
        enableAutomaticOptimizations={true}
        enableSecurityAlerts={true}
      >
        <HUDContent />
      </Phase5Integration>
    );
  }

  return <HUDContent />;
};

export default HUDLayout;