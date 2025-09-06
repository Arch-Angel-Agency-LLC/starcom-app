// EnhancedGlobeInteractivityV2.tsx - Complete overhaul with game development patterns
// This replaces the old component with a clean, modular architecture

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction } from '@solana/web3.js';
import { trackInvestorEvents } from '../../utils/analytics';
import { googleAnalyticsService } from '../../services/GoogleAnalyticsService';

// New interaction system
import { InteractionMode } from '../../systems/interaction/InteractionModeSystem';
import { useGlobe3DInputManager } from '../../systems/interaction/Globe3DInputManager';
import { InteractionModeSelector } from '../ui/InteractionModeSelector/InteractionModeSelector';

// Preserve existing interfaces for compatibility
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { useIntelReportInteractivity } from '../../hooks/useIntelReportInteractivity';
import { IntelReportTooltip } from '../ui/IntelReportTooltip/IntelReportTooltip';
import { IntelReportPopup } from '../ui/IntelReportPopup/IntelReportPopup';
import { EnhancedTeamCollaborationService } from '../../services/collaboration/EnhancedTeamCollaborationService';

// Component props - maintains backward compatibility
interface EnhancedGlobeInteractivityV2Props {
  globeRef: React.RefObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  intelReports: IntelReportOverlayMarker[];
  visualizationMode: {
    mode: string;
    subMode: string;
  };
  models?: ModelInstance[];
  onHoverChange?: (reportId: string | null) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  
  // Enhanced configuration
  interactionConfig?: {
    dragThreshold?: number;
    timeThreshold?: number;
    enableHoverDuringDrag?: boolean;
    // New options
    enableModeSelector?: boolean;
    modeSelectorPosition?: 'top' | 'bottom' | 'left' | 'right';
    enableDebugMode?: boolean;
    allowedModes?: InteractionMode[];
  };
}

interface ModelInstance {
  positionContainer: THREE.Group;
  orientationContainer: THREE.Group;
  rotationContainer: THREE.Group;
  mesh: THREE.Object3D;
  report: IntelReportOverlayMarker;
  basePosition: THREE.Vector3;
  hoverOffset: number;
  localRotationY: number;
}

export const EnhancedGlobeInteractivityV2: React.FC<EnhancedGlobeInteractivityV2Props> = ({
  globeRef,
  intelReports,
  visualizationMode,
  models = [],
  onHoverChange,
  containerRef: parentContainerRef,
  interactionConfig = {}
}) => {
  const { publicKey } = useWallet();
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = parentContainerRef || localContainerRef;
  
  // Extract enhanced configuration
  const {
    dragThreshold = 5,
    timeThreshold = 300,
    enableModeSelector = true,
    modeSelectorPosition = 'left',
    enableDebugMode = false,
    allowedModes = [
      InteractionMode.NAVIGATION,
      InteractionMode.INTEL_CREATION, 
      InteractionMode.INTEL_INSPECTION
    ]
  } = interactionConfig;
  
  // State for collaboration and UI
  const [collaborationService, setCollaborationService] = useState<EnhancedTeamCollaborationService | null>(null);
  const [currentTeam] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string>('grab');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Convert models to the new format
  const intelReportModels = models.map(model => ({
    id: model.report.pubkey,
    mesh: model.mesh,
    position: { lat: model.report.latitude, lng: model.report.longitude },
    data: model.report
  }));
  
  // Initialize collaboration service
  useEffect(() => {
    if (publicKey) {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const service = new EnhancedTeamCollaborationService(connection, undefined, {
        enableRealTimeSync: true,
        autoConfirmTransactions: true,
        defaultNetwork: 'devnet'
      });
      setCollaborationService(service);
    }
  }, [publicKey]);
  
  // Intel Report creation handler (preserves existing functionality)
  const handleCreateIntelReport = useCallback(async (lat: number, lng: number) => {
    console.log('🎯 Creating Intel Report via V2 system:', { lat, lng });
    
    try {
      const { IntelReportService } = await import('../../services/IntelReportService');
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const reportService = new IntelReportService(connection, undefined, true);
      
      const reportData = {
        title: `Intel Report at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        content: `Intelligence data collected at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}. Created using enhanced interaction system V2.`,
        tags: ['globe-interaction-v2', 'geospatial', 'team-collaboration'],
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        author: 'globe-user-v2',
        classification: 'CONFIDENTIAL',
        source: 'STARCOM Globe Interface V2',
        priority: 'MEDIUM'
      };
      
      const mockWallet = { publicKey: null, signTransaction: undefined };
      const signature = await reportService.submitIntelReport(reportData, mockWallet);
      
      // Team collaboration integration
      let teamNotification = '';
      if (publicKey && collaborationService && currentTeam) {
        try {
          const userTeams = await collaborationService.getUserTeams(publicKey.toString());
          const activeTeam = userTeams.find(team => team.id === currentTeam);
          
          if (activeTeam) {
            const reportWithId = { ...reportData, pubkey: signature };
            const walletSigner = { 
              publicKey, 
              signTransaction: async (tx: Transaction) => tx 
            };
            
            const result = await collaborationService.createIntelPackage(
              currentTeam,
              [reportWithId],
              {
                name: `Globe Report V2 - ${new Date().toLocaleDateString()}`,
                description: `Intel package created via enhanced interaction system at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                classification: 'CONFIDENTIAL',
                tags: ['globe-v2', 'geospatial']
              },
              walletSigner
            );
            teamNotification = `\n📦 Created team package: ${result.packageId.slice(0, 12)}...`;
          }
        } catch (teamError) {
          console.warn('Team collaboration failed:', teamError);
          teamNotification = '\n⚠️ Team collaboration temporarily unavailable';
        }
      }
      
      const message = `✅ Intel Report created successfully!\n\n` +
                     `📍 Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n` +
                     `🔐 Classification: ${reportData.classification}\n` +
                     `🏷️ Tags: ${reportData.tags.join(', ')}\n` +
                     `📝 Transaction: ${signature}\n\n` +
                     `🎮 Enhanced Features:\n` +
                     `• Advanced interaction modes\n` +
                     `• Professional game-style UI\n` +
                     `• Gesture recognition ready\n` +
                     `• Team collaboration enabled${teamNotification}`;
      
      alert(message);
      
      console.log('✅ Intel Report V2 submitted:', {
        signature,
        reportData,
        enhancedSystem: true,
        version: '2.0'
      });
      
    } catch (error) {
      console.error('❌ Failed to create Intel Report V2:', error);
      alert(`Failed to create Intel Report: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Enhanced V2 system with team collaboration.`);
    }
  }, [collaborationService, currentTeam, publicKey]);
  
  // Initialize the new input management system
  const inputManager = useGlobe3DInputManager({
    globeRef,
    containerRef,
    initialMode: visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports' 
      ? InteractionMode.INTEL_INSPECTION 
      : InteractionMode.NAVIGATION,
    allowedModes,
    onCursorChange: setCursor,
    onModeChange: (mode, config) => {
      // ANALYTICS: Track interaction mode changes (Tier 1 - Core feature usage)
      trackInvestorEvents.featureUsed(`globe-mode-${mode}`);
      googleAnalyticsService.trackEvent('globe_interaction_mode', 'core_feature', mode);
      
      if (enableDebugMode) {
        console.log(`🎮 Mode changed to: ${mode}`, config);
      }
    },
    onIntelReportCreate: handleCreateIntelReport,
    onIntelReportSelect: (reportId) => {
      // ANALYTICS: Track intel report selection (high-value interaction)
      trackInvestorEvents.featureUsed('intel-report-select');
      googleAnalyticsService.trackEvent('intel_report_interaction', 'engagement', 'select');
      
      console.log('📋 Intel Report selected:', reportId);
      // Handle selection logic here
    },
    onIntelReportHover: (reportId) => {
      // ANALYTICS: Track globe interaction engagement (Tier 1 - Core feature)
      if (reportId) {
        trackInvestorEvents.featureUsed('globe-intel-hover');
        googleAnalyticsService.trackEvent('globe_interaction', 'core_feature', 'intel_hover');
      }
      
      onHoverChange?.(reportId);
      if (enableDebugMode && reportId) {
        console.log('👁️ Intel Report hovered:', reportId);
      }
    },
    config: {
      dragThreshold,
      tapThreshold: timeThreshold / 100, // Convert time to distance threshold
      enableTouchGestures: true,
      enableKeyboardShortcuts: true,
      debugMode: enableDebugMode
    },
    intelReportModels
  });
  
  // Legacy interactivity hook for tooltip/popup compatibility
  const {
    hoveredReport,
    selectedReport,
    tooltipVisible,
    popupVisible,
    handleModelHover,
    handleModelClick,
    handlePopupClose
  } = useIntelReportInteractivity({
    hoverDebounceMs: 100,
    enableKeyboardNavigation: true,
    enableTouchInteractions: true
  });
  
  // Update cursor based on input manager
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = cursor;
    }
  }, [cursor, containerRef]);
  
  // Handle mouse move for tooltip positioning
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseMove = (event: MouseEvent) => {
      setTooltipPosition({
        x: event.clientX + 15,
        y: event.clientY - 10
      });
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef]);
  
  // Auto-switch modes based on visualization mode (backward compatibility)
  useEffect(() => {
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') {
      if (inputManager.getCurrentMode() === InteractionMode.NAVIGATION) {
        inputManager.switchMode(InteractionMode.INTEL_INSPECTION);
      }
    } else {
      if (inputManager.getCurrentMode() !== InteractionMode.NAVIGATION) {
        inputManager.switchMode(InteractionMode.NAVIGATION);
      }
    }
  }, [visualizationMode, inputManager]);
  
  // Navigation handlers for popup
  const handleNavigatePrevious = () => {
    const currentIndex = intelReports.findIndex(r => r.pubkey === selectedReport?.id);
    if (currentIndex > 0) {
      const previousReport = intelReports[currentIndex - 1];
      handleModelClick(previousReport);
    }
  };
  
  const handleNavigateNext = () => {
    const currentIndex = intelReports.findIndex(r => r.pubkey === selectedReport?.id);
    if (currentIndex < intelReports.length - 1) {
      const nextReport = intelReports[currentIndex + 1];
      handleModelClick(nextReport);
    }
  };
  
  // Convert for popup compatibility
  const selectedReportForPopup = selectedReport ? {
    pubkey: selectedReport.id,
    title: selectedReport.title,
    content: selectedReport.description,
    tags: selectedReport.tags,
    latitude: selectedReport.coordinates.latitude,
    longitude: selectedReport.coordinates.longitude,
    timestamp: Math.floor(selectedReport.lastUpdated.getTime() / 1000),
    author: selectedReport.createdBy
  } : null;
  
  const currentIndex = selectedReport ? 
    intelReports.findIndex(r => r.pubkey === selectedReport?.id) : -1;
  
  // Debug information display
  const debugInfo = enableDebugMode ? inputManager.getDebugInfo() : null;
  
  return (
    <>
      {/* Mode Selector UI */}
      {enableModeSelector && (
        <InteractionModeSelector
          availableModes={allowedModes}
          position={modeSelectorPosition}
          compact={true}
          showLabels={true}
          showHotkeys={true}
        />
      )}
      
      {/* Preserved legacy UI components for compatibility */}
      <IntelReportTooltip
        report={hoveredReport}
        position={tooltipPosition}
        visible={tooltipVisible}
        onClose={() => handleModelHover(null)}
      />
      
      <IntelReportPopup
        report={selectedReportForPopup}
        visible={popupVisible}
        onClose={handlePopupClose}
        onPrevious={handleNavigatePrevious}
        onNext={handleNavigateNext}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < intelReports.length - 1}
      />
      
      {/* Debug overlay */}
      {enableDebugMode && debugInfo && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00ff41',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 1002,
          border: '1px solid #00ff41',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🎮 Globe Interaction Debug V2
          </div>
          <div>Mode: {inputManager.getCurrentMode()}</div>
          <div>Cursor: {cursor}</div>
          <div>Selected: {inputManager.getSelectedObjects().length}</div>
          <div>Hovered: {inputManager.getHoveredObject() || 'none'}</div>
          <div>Globe Pos: {
            inputManager.getGlobeHoverPosition() 
              ? `${inputManager.getGlobeHoverPosition()?.lat.toFixed(2)}, ${inputManager.getGlobeHoverPosition()?.lng.toFixed(2)}`
              : 'none'
          }</div>
          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
            Press N/I/E/M/A/S to switch modes
          </div>
        </div>
      )}
      
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {hoveredReport && (
          <div>
            Intel Report: {hoveredReport.title}
          </div>
        )}
        <div>
          Current interaction mode: {inputManager.getCurrentMode()}
        </div>
      </div>
    </>
  );
};

export default EnhancedGlobeInteractivityV2;
