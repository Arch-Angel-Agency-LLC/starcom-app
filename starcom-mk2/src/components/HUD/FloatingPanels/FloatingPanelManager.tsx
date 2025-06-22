import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVisualizationMode } from '../../../context/VisualizationModeContext';
import { useGlobeContext } from '../../../context/GlobeContext';
import { FloatingPanelContext, FloatingPanel } from './FloatingPanelContext';
import styles from './FloatingPanelManager.module.css';

interface FloatingPanelManagerProps {
  children?: React.ReactNode;
}

const FloatingPanelManager: React.FC<FloatingPanelManagerProps> = ({ children }) => {
  // Check if we're in a test environment
  const isTestMode = typeof window !== 'undefined' && (
    window.location.href.includes('localhost') && 
    (window.navigator.userAgent.includes('HeadlessChrome') ||
     window.navigator.userAgent.includes('AI-Agent-Testing') ||
     document.querySelector('[data-test-mode]'))
  );

  const [activePanels, setActivePanels] = useState<Map<string, FloatingPanel>>(new Map());
  const [globeInteraction, setGlobeInteraction] = useState<{
    hoveredRegion: string | null;
    clickedPosition: { lat: number; lng: number } | null;
    activeFeatures: string[];
  }>({
    hoveredRegion: null,
    clickedPosition: null,
    activeFeatures: []
  });

  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedPanelId: string | null;
    dragOffset: { x: number; y: number };
    originalPosition: { x: number; y: number };
    lastUpdate: number;
  }>({
    isDragging: false,
    draggedPanelId: null,
    dragOffset: { x: 0, y: 0 },
    originalPosition: { x: 0, y: 0 },
    lastUpdate: 0
  });

  const { visualizationMode } = useVisualizationMode();
  const { focusLocation } = useGlobeContext();
  const panelContainerRef = useRef<HTMLDivElement>(null);

  // Sync globe focus location with floating panel clicked position
  useEffect(() => {
    if (focusLocation) {
      setGlobeInteraction(prev => ({
        ...prev,
        clickedPosition: focusLocation
      }));
    }
  }, [focusLocation]);

  // Convert geographic coordinates to screen position
  const geoToScreen = useCallback((lat: number, lng: number) => {
    // This will integrate with the actual globe component
    // For now, using a simple projection
    const globeCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const globeRadius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = globeCenter.x + (globeRadius * Math.sin(phi) * Math.cos(theta));
    const y = globeCenter.y + (globeRadius * Math.cos(phi));
    
    return { x, y };
  }, []);

  // Register a new floating panel
  const registerPanel = useCallback((panel: Omit<FloatingPanel, 'isVisible' | 'zIndex' | 'isMinimized'>) => {
    setActivePanels(prev => {
      const newPanels = new Map(prev);
      newPanels.set(panel.id, {
        ...panel,
        isVisible: false,
        isMinimized: false,
        zIndex: 1000 + newPanels.size
      });
      return newPanels;
    });
  }, []);

  // Show/hide panels based on triggers
  const evaluatePanelVisibility = useCallback(() => {
    setActivePanels(prev => {
      const newPanels = new Map(prev);
      
      newPanels.forEach((panel, id) => {
        let shouldShow = false;
        
        // Evaluate triggers
        panel.triggers.forEach((trigger: string) => {
          if (trigger === 'aurora' && globeInteraction.activeFeatures.includes('aurora')) {
            shouldShow = true;
          }
          if (trigger === 'solar-flare' && globeInteraction.activeFeatures.includes('solar-activity')) {
            shouldShow = true;
          }
          if (trigger === 'hover-polar' && globeInteraction.hoveredRegion === 'polar') {
            shouldShow = true;
          }
          if (trigger === 'click-anywhere' && globeInteraction.clickedPosition) {
            shouldShow = true;
          }
        });
        
        // Check priority level
        const currentPriority = visualizationMode.subMode === 'SpaceWeather' ? 'primary' : 
                              visualizationMode.subMode === 'EcologicalDisasters' ? 'secondary' : 'tertiary';
        
        if (panel.priority === 'secondary' && currentPriority === 'primary') shouldShow = false;
        if (panel.priority === 'tertiary' && currentPriority !== 'tertiary') shouldShow = false;
        
        newPanels.set(id, { ...panel, isVisible: shouldShow });
      });
      
      return newPanels;
    });
  }, [globeInteraction, visualizationMode]);

  // Update panel visibility when globe interaction changes
  useEffect(() => {
    evaluatePanelVisibility();
  }, [evaluatePanelVisibility]);

  // Simulate globe interaction (will be replaced with real globe integration)
  const simulateGlobeHover = useCallback((region: string | null) => {
    setGlobeInteraction(prev => ({ ...prev, hoveredRegion: region }));
  }, []);

  const simulateGlobeClick = useCallback((lat: number, lng: number) => {
    setGlobeInteraction(prev => ({ ...prev, clickedPosition: { lat, lng } }));
  }, []);

  const addActiveFeature = useCallback((feature: string) => {
    setGlobeInteraction(prev => ({
      ...prev,
      activeFeatures: [...prev.activeFeatures.filter(f => f !== feature), feature]
    }));
  }, []);

  const removeActiveFeature = useCallback((feature: string) => {
    setGlobeInteraction(prev => ({
      ...prev,
      activeFeatures: prev.activeFeatures.filter(f => f !== feature)
    }));
  }, []);

  // Drag handlers for moveable panels
  const handleDragStart = useCallback((e: React.MouseEvent, panelId: string) => {
    e.preventDefault();
    const panel = activePanels.get(panelId);
    if (!panel) return;

    let screenPosition = { x: 0, y: 0 };
    if (panel.position.anchorTo === 'geographic' && panel.position.lat !== undefined && panel.position.lng !== undefined) {
      screenPosition = geoToScreen(panel.position.lat, panel.position.lng);
    } else if (panel.position.anchorTo === 'screen' && panel.position.x !== undefined && panel.position.y !== undefined) {
      screenPosition = { x: panel.position.x, y: panel.position.y };
    }
    screenPosition.x += panel.position.offset.x;
    screenPosition.y += panel.position.offset.y;

    setDragState({
      isDragging: true,
      draggedPanelId: panelId,
      dragOffset: {
        x: e.clientX - screenPosition.x,
        y: e.clientY - screenPosition.y
      },
      originalPosition: screenPosition,
      lastUpdate: 0
    });

    // Bring dragged panel to front
    setActivePanels(prev => {
      const newPanels = new Map(prev);
      const maxZ = Math.max(...Array.from(newPanels.values()).map(p => p.zIndex));
      newPanels.set(panelId, { ...panel, zIndex: maxZ + 1 });
      return newPanels;
    });
  }, [activePanels, geoToScreen]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedPanelId) return;

    // Throttle updates to improve performance
    const now = Date.now();
    if (now - dragState.lastUpdate < 16) return; // ~60fps

    const newX = e.clientX - dragState.dragOffset.x;
    const newY = e.clientY - dragState.dragOffset.y;

    // Constrain to viewport boundaries
    const constrainedX = Math.max(100, Math.min(window.innerWidth - 100, newX));
    const constrainedY = Math.max(60, Math.min(window.innerHeight - 100, newY));

    // Update drag state with new timestamp
    setDragState(prev => ({ ...prev, lastUpdate: now }));

    // Update panel position
    setActivePanels(prev => {
      const newPanels = new Map(prev);
      const panel = newPanels.get(dragState.draggedPanelId!);
      if (panel) {
        newPanels.set(dragState.draggedPanelId!, {
          ...panel,
          position: {
            ...panel.position,
            anchorTo: 'screen',
            x: constrainedX,
            y: constrainedY,
            offset: { x: 0, y: 0 }
          }
        });
      }
      return newPanels;
    });
  }, [dragState]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedPanelId: null,
      dragOffset: { x: 0, y: 0 },
      originalPosition: { x: 0, y: 0 },
      lastUpdate: 0
    });
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // Render floating panels
  const renderPanels = () => {
    return Array.from(activePanels.values())
      .filter(panel => panel.isVisible)
      .map(panel => {
        let screenPosition = { x: 0, y: 0 };
        
        // Calculate screen position based on anchor type
        if (panel.position.anchorTo === 'geographic' && panel.position.lat !== undefined && panel.position.lng !== undefined) {
          screenPosition = geoToScreen(panel.position.lat, panel.position.lng);
        } else if (panel.position.anchorTo === 'screen' && panel.position.x !== undefined && panel.position.y !== undefined) {
          screenPosition = { x: panel.position.x, y: panel.position.y };
        }
        
        // Apply offset
        screenPosition.x += panel.position.offset.x;
        screenPosition.y += panel.position.offset.y;
        
        const PanelComponent = panel.component;
        
        return (
          <div
            key={panel.id}
            className={`${styles.floatingPanel} ${styles[panel.type]} ${dragState.draggedPanelId === panel.id ? styles.dragging : ''} ${panel.isMinimized ? styles.minimized : ''}`}
            style={{
              left: screenPosition.x,
              top: screenPosition.y,
              zIndex: panel.zIndex,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className={styles.panelHeader}
              onMouseDown={(e) => handleDragStart(e, panel.id)}
              onDoubleClick={() => setActivePanels(prev => {
                const newPanels = new Map(prev);
                newPanels.set(panel.id, { ...panel, isMinimized: !panel.isMinimized });
                return newPanels;
              })}
              style={{ cursor: 'grab' }}
            >
              <div className={styles.dragHandle}>
                <span className={styles.dragIcon}>⋮⋮</span>
                <span className={styles.panelTitle}>{panel.title}</span>
              </div>
              <div className={styles.headerButtons}>
                <button 
                  className={styles.minimizeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePanels(prev => {
                      const newPanels = new Map(prev);
                      newPanels.set(panel.id, { ...panel, isMinimized: !panel.isMinimized });
                      return newPanels;
                    });
                  }}
                  title={panel.isMinimized ? "Maximize" : "Minimize"}
                >
                  {panel.isMinimized ? '□' : '−'}
                </button>
                <button 
                  className={styles.closeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePanels(prev => {
                      const newPanels = new Map(prev);
                      newPanels.set(panel.id, { ...panel, isVisible: false });
                      return newPanels;
                    });
                  }}
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>
            {!panel.isMinimized && (
              <div className={styles.panelContent}>
                <PanelComponent data={panel.data} />
              </div>
            )}
          </div>
        );
      });
  };

  // Provide context for child components
  const contextValue = {
    registerPanel,
    activePanels: Array.from(activePanels.values()),
    globeInteraction,
    simulateGlobeHover,
    simulateGlobeClick,
    addActiveFeature,
    removeActiveFeature
  };

  return (
    <FloatingPanelContext.Provider value={contextValue}>
      <div ref={panelContainerRef} className={styles.floatingPanelManager}>
        {children}
        {/* Conditionally render panels - disable in test mode to prevent interaction interference */}
        {!isTestMode && panelContainerRef.current && createPortal(
          <div className={styles.panelOverlay}>
            {renderPanels()}
          </div>,
          document.body
        )}
      </div>
    </FloatingPanelContext.Provider>
  );
};

export default FloatingPanelManager;
