import React, { useState } from 'react';
import styles from './CyberCommandHUDLayout.module.css';
import CyberCommandTopBar from '../../components/HUD/Bars/CyberCommandTopBar/CyberCommandTopBar';
import CyberCommandLeftSideBar from '../../components/HUD/Bars/CyberCommandLeftSideBar/CyberCommandLeftSideBar';
import CyberCommandRightSideBar from '../../components/HUD/Bars/CyberCommandRightSideBar/CyberCommandRightSideBar';
import CyberCommandTopLeftCorner from '../../components/HUD/Corners/CyberCommandTopLeft/CyberCommandTopLeft';
import CyberCommandTopRightCorner from '../../components/HUD/Corners/CyberCommandTopRight/CyberCommandTopRight';
import CyberCommandBottomLeftCorner from '../../components/HUD/Corners/CyberCommandBottomLeft/CyberCommandBottomLeft';
import CyberCommandBottomRightCorner from '../../components/HUD/Corners/CyberCommandBottomRight/CyberCommandBottomRight';
import FloatingPanelManager from '../../components/HUD/FloatingPanels/FloatingPanelManager';
import FloatingPanelDemo from '../../components/HUD/FloatingPanels/FloatingPanelDemo';
import NOAAFloatingIntegration from '../../components/HUD/FloatingPanels/NOAAFloatingIntegration';
import CyberCommandCenterManager from '../../components/HUD/CyberCommandCenter/CyberCommandCenterManager';
import QuickAccessPanel from '../../components/HUD/QuickAccess/QuickAccessPanel';
import NewUserHint from '../../components/HUD/NewUserHint/NewUserHint';
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

interface CyberCommandHUDLayoutProps {
  isEmbedded?: boolean;
}

const CyberCommandHUDLayout: React.FC<CyberCommandHUDLayoutProps> = ({ isEmbedded = false }) => {
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  
  // Core feature flags
  const enhancedCenterEnabled = useFeatureFlag('enhancedCenter');
  const enhancedAdaptiveEnabled = useFeatureFlag('enhancedContextEnabled');
  // Performance and monitoring flags
  const performanceMonitoringEnabled = useFeatureFlag('performanceMonitoringEnabled');
  const securityHardeningEnabled = useFeatureFlag('securityHardeningEnabled');
  // UI and testing flags
  const uiTestingDiagnosticsEnabled = useFeatureFlag('uiTestingDiagnosticsEnabled');
  // Using existing feature flags for phases
  const phase4EnabledFlag = useFeatureFlag('gamingUxEnabled');
  const phase5EnabledFlag = useFeatureFlag('performanceOptimizationsEnabled');

  // Keyboard shortcut to show quick access
  React.useEffect(() => {
    if (isEmbedded) return; // Don't register keyboard shortcuts when embedded
    
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
  }, [isEmbedded]);

  const AdaptiveProvider = enhancedAdaptiveEnabled ? EnhancedAdaptiveInterfaceProvider : AdaptiveInterfaceProvider;

  const HUDContent = () => (
    <GlobeLoadingProvider>
      <PopupProvider>
        <AdaptiveProvider>
          <AdaptiveUIController>
            <PhaseTransitionManager>
              <ContextBridge>
                <FloatingPanelManager>
                  <div className={`${styles.cyberCommandHudLayout} ${isEmbedded ? styles.embeddedMode : ''}`}>
                    <div className={styles.topLeftCorner}><CyberCommandTopLeftCorner /></div>
                    <div className={styles.topRightCorner}><CyberCommandTopRightCorner /></div>
                    <div className={styles.bottomLeftCorner}><CyberCommandBottomLeftCorner /></div>
                    <div className={styles.bottomRightCorner}><CyberCommandBottomRightCorner /></div>
                    
                    {/* Always show TopBar with EIA data marquee - essential for CyberCommand functionality */}
                    <CyberCommandTopBar />
                    
                    {/* Removed non-functional CyberCommandBottomBar - MainBottomBar handles navigation now */}
                    
                    <div className={styles.leftSideBar}><CyberCommandLeftSideBar /></div>
                    <div className={styles.rightSideBar}><CyberCommandRightSideBar /></div>
                    <div className={`${styles.center} ${isEmbedded ? styles.embeddedCenter : ''}`}>
                      {enhancedCenterEnabled ? (
                        <CyberCommandCenterManager globeOnly={isEmbedded} />
                      ) : (
                        // Legacy center content - empty for now
                        <div />
                      )}
                    </div>
                    
                    {/* NOAA Floating Integration - Connects NOAA datasets to floating panels */}
                    {!isEmbedded && <NOAAFloatingIntegration />}
                    
                    {/* UI Testing Diagnostics - Only visible when diagnostics mode is enabled */}
                    {uiTestingDiagnosticsEnabled && !isEmbedded && (
                      <>
                        {/* Floating Panel Demo - Development/Testing only */}
                        <FloatingPanelDemo />
                      </>
                    )}
                  </div>
                  
                  {/* Earth Alliance Secure Chat System */}
                  {!isEmbedded && <SecureChatManager />}
                  
                  {/* Quick Access Panel - Triggered by Ctrl+K */}
                  {showQuickAccess && !isEmbedded && (
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
        {!isEmbedded && <NewUserHint />}
      </PopupProvider>
    </GlobeLoadingProvider>
  );

  // For embedded mode, use a simplified wrapper
  if (isEmbedded) {
    return <HUDContent />;
  }

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

export default CyberCommandHUDLayout;
