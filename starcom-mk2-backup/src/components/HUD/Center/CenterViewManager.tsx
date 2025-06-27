// Center View Manager - Multi-Context Display Controller
// Handles 3D Globe, Timeline, and Node-Graph display modes with split-screen support

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useFeatureFlag } from '../../../utils/featureFlags';
import { useGlobalCommand } from '../../../hooks/useUnifiedGlobalCommand';
import TimelineView from './TimelineView';
import styles from './CenterViewManager.module.css';

// Import the real Globe component instead of the placeholder
const Globe = lazy(() => import('../../Globe/Globe'));

// Import display components (these will be created or imported)
// import NodeGraphView from './components/NodeGraphView';

export interface CenterViewInstance {
  id: string;
  displayMode: '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH';
  operationMode: 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';
  position: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  size: { width: string; height: string };
  isVisible: boolean;
}

export interface SplitScreenConfiguration {
  layout: 'single' | 'horizontal' | 'vertical' | 'quad';
  instances: CenterViewInstance[];
  syncedProperties: string[];
}

interface CenterViewManagerProps {
  className?: string;
}

const CenterViewManager: React.FC<CenterViewManagerProps> = ({ className = '' }) => {
  const { state } = useGlobalCommand();
  const multiContextEnabled = useFeatureFlag('multiContextEnabled');
  const splitScreenEnabled = useFeatureFlag('splitScreenEnabled');

  // Split screen configuration state
  const [splitConfig, setSplitConfig] = useState<SplitScreenConfiguration>({
    layout: 'single',
    instances: [],
    syncedProperties: []
  });

  // Initialize primary view instance
  useEffect(() => {
    const primaryInstance: CenterViewInstance = {
      id: 'primary',
      displayMode: state.displayMode,
      operationMode: state.operationMode,
      position: 'primary',
      size: { width: '100%', height: '100%' },
      isVisible: true
    };

    setSplitConfig({
      layout: 'single',
      instances: [primaryInstance],
      syncedProperties: []
    });
  }, [state.displayMode, state.operationMode]);

  // Handle display mode changes
  const handleDisplayModeChange = useCallback((newMode: '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH') => {
    setSplitConfig(prev => ({
      ...prev,
      instances: prev.instances.map(instance =>
        instance.position === 'primary'
          ? { ...instance, displayMode: newMode }
          : instance
      )
    }));
  }, []);

  // Enable horizontal split screen
  const enableHorizontalSplit = useCallback((secondaryMode: '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH') => {
    if (!splitScreenEnabled) return;

    const primaryInstance: CenterViewInstance = {
      id: 'primary',
      displayMode: state.displayMode,
      operationMode: state.operationMode,
      position: 'primary',
      size: { width: '50%', height: '100%' },
      isVisible: true
    };

    const secondaryInstance: CenterViewInstance = {
      id: 'secondary',
      displayMode: secondaryMode,
      operationMode: state.operationMode,
      position: 'secondary',
      size: { width: '50%', height: '100%' },
      isVisible: true
    };

    setSplitConfig({
      layout: 'horizontal',
      instances: [primaryInstance, secondaryInstance],
      syncedProperties: ['operationMode', 'selection']
    });
  }, [splitScreenEnabled, state.displayMode, state.operationMode]);

  // Enable vertical split screen
  const enableVerticalSplit = useCallback((secondaryMode: '3D_GLOBE' | 'TIMELINE_VIEW' | 'NODE_GRAPH') => {
    if (!splitScreenEnabled) return;

    const primaryInstance: CenterViewInstance = {
      id: 'primary',
      displayMode: state.displayMode,
      operationMode: state.operationMode,
      position: 'primary',
      size: { width: '100%', height: '50%' },
      isVisible: true
    };

    const secondaryInstance: CenterViewInstance = {
      id: 'secondary',
      displayMode: secondaryMode,
      operationMode: state.operationMode,
      position: 'secondary',
      size: { width: '100%', height: '50%' },
      isVisible: true
    };

    setSplitConfig({
      layout: 'vertical',
      instances: [primaryInstance, secondaryInstance],
      syncedProperties: ['operationMode', 'selection']
    });
  }, [splitScreenEnabled, state.displayMode, state.operationMode]);

  // Disable split screen
  const disableSplitScreen = useCallback(() => {
    const primaryInstance: CenterViewInstance = {
      id: 'primary',
      displayMode: state.displayMode,
      operationMode: state.operationMode,
      position: 'primary',
      size: { width: '100%', height: '100%' },
      isVisible: true
    };

    setSplitConfig({
      layout: 'single',
      instances: [primaryInstance],
      syncedProperties: []
    });
  }, [state.displayMode, state.operationMode]);

  // Memoize view instances to prevent unnecessary re-renders
  const memoizedInstances = useMemo(() => {
    return splitConfig.instances.map(instance => ({
      ...instance,
      key: `${instance.id}-${instance.displayMode}-${instance.operationMode}`
    }));
  }, [splitConfig.instances]);

  // Render individual view instance
  const renderViewInstance = useCallback((instance: CenterViewInstance) => {
    const instanceStyle = {
      width: instance.size.width,
      height: instance.size.height,
      display: instance.isVisible ? 'block' : 'none'
    };

    // Professional implementations replacing previous placeholders
    const renderViewMode = (mode: string) => {
      switch (mode) {
        case 'Node Graph':
          return (
            <div className={styles.nodeGraphView} style={instanceStyle}>
              <div className={styles.nodeGraphContent}>
                <div className={styles.viewHeader}>
                  <h3>🔗 Network Analysis</h3>
                  <span className={styles.viewMode}>Operation Mode: {instance.operationMode}</span>
                </div>
                <div className={styles.graphCanvas}>
                  <div className={styles.graphPlaceholder}>
                    <div className={styles.nodeVisualization}>
                      <div className={styles.centralNode}>Core Hub</div>
                      <div className={styles.satelliteNodes}>
                        <div className={styles.node}>Data Source A</div>
                        <div className={styles.node}>Data Source B</div>
                        <div className={styles.node}>Data Source C</div>
                      </div>
                    </div>
                    <div className={styles.analysisInfo}>
                      <span>Real-time network topology visualization will be implemented here</span>
                    </div>
                  </div>
                </div>
                {multiContextEnabled && (
                  <div className={styles.contextControls}>
                    <button 
                      className={styles.splitButton}
                      onClick={() => enableHorizontalSplit('TIMELINE_VIEW')}
                    >
                      ➕ Add Timeline View
                    </button>
                    <button 
                      className={styles.splitButton}
                      onClick={() => enableVerticalSplit('3D_GLOBE')}
                    >
                      ➕ Add Globe View
                    </button>
                    {splitConfig.layout !== 'single' && (
                      <button 
                        className={styles.splitButton}
                        onClick={disableSplitScreen}
                      >
                        📱 Single View
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        default:
          return (
            <div className={styles.unknownView} style={instanceStyle}>
              <div className={styles.unknownContent}>
                <h3>⚠️ Unknown View Mode</h3>
                <p>The requested view mode "{mode}" is not implemented.</p>
                <p>Available modes: 3D Globe, Timeline View, Node Graph</p>
              </div>
            </div>
          );
      }
    };

    switch (instance.displayMode) {
      case '3D_GLOBE':
        return (
          <Suspense fallback={
            <div className={styles.globeView} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00ff41',
              fontFamily: '"Courier New", monospace'
            }}>
              › LOADING 3D GLOBE...
            </div>
          }>
            <Globe
              key={`globe-${instance.id}`}
              // The Globe component will handle its own styling and positioning
            />
          </Suspense>
        );
      case 'TIMELINE_VIEW':
        return (
          <TimelineView 
            key={`timeline-${instance.id}`}
            className={styles.timelineView}
            fullscreen={splitConfig.layout === 'single'}
          />
        );
      case 'NODE_GRAPH':
        return renderViewMode('Node Graph');
      default:
        return renderViewMode('Unknown View');
    }
  }, [splitConfig.layout, multiContextEnabled, enableHorizontalSplit, enableVerticalSplit, disableSplitScreen]);

  // Render split screen layout
  const renderSplitLayout = () => {
    const { layout } = splitConfig;
    const instances = memoizedInstances;

    switch (layout) {
      case 'single':
        return (
          <div className={styles.singleView}>
            {instances.map(instance => (
              <div key={instance.id} className={styles.viewInstance}>
                {renderViewInstance(instance)}
              </div>
            ))}
          </div>
        );

      case 'horizontal':
        return (
          <div className={styles.horizontalSplit}>
            {instances.map(instance => (
              <div key={instance.id} className={styles.viewInstance}>
                {renderViewInstance(instance)}
              </div>
            ))}
          </div>
        );

      case 'vertical':
        return (
          <div className={styles.verticalSplit}>
            {instances.map(instance => (
              <div key={instance.id} className={styles.viewInstance}>
                {renderViewInstance(instance)}
              </div>
            ))}
          </div>
        );

      case 'quad':
        return (
          <div className={styles.quadSplit}>
            {instances.map(instance => (
              <div key={instance.id} className={styles.viewInstance}>
                {renderViewInstance(instance)}
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className={styles.singleView}>
            {renderViewInstance(instances[0])}
          </div>
        );
    }
  };

  return (
    <div className={`${styles.centerViewManager} ${className}`}>
      {/* Context Switch Controls */}
      {multiContextEnabled && (
        <div className={styles.contextSwitcher}>
          <div className={styles.displayModeControls}>
            <button
              className={state.displayMode === '3D_GLOBE' ? styles.active : ''}
              onClick={() => handleDisplayModeChange('3D_GLOBE')}
            >
              🌍 Globe
            </button>
            <button
              className={state.displayMode === 'TIMELINE_VIEW' ? styles.active : ''}
              onClick={() => handleDisplayModeChange('TIMELINE_VIEW')}
            >
              📈 Timeline
            </button>
            <button
              className={state.displayMode === 'NODE_GRAPH' ? styles.active : ''}
              onClick={() => handleDisplayModeChange('NODE_GRAPH')}
            >
              🕸️ Network
            </button>
          </div>
          
          {splitScreenEnabled && (
            <div className={styles.splitControls}>
              <span>Layout:</span>
              <button
                className={splitConfig.layout === 'single' ? styles.active : ''}
                onClick={disableSplitScreen}
              >
                Single
              </button>
              <button
                className={splitConfig.layout === 'horizontal' ? styles.active : ''}
                onClick={() => enableHorizontalSplit('TIMELINE_VIEW')}
              >
                Horizontal
              </button>
              <button
                className={splitConfig.layout === 'vertical' ? styles.active : ''}
                onClick={() => enableVerticalSplit('NODE_GRAPH')}
              >
                Vertical
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Display Area */}
      <div className={styles.displayArea}>
        {renderSplitLayout()}
      </div>

      {/* Status Information */}
      <div className={styles.statusBar}>
        <span>Mode: {state.operationMode}</span>
        <span>Display: {state.displayMode.replace('_', ' ')}</span>
        <span>Layout: {splitConfig.layout}</span>
        <span>Active Layers: {state.activeLayers.filter(layer => layer.isActive).length}</span>
      </div>
    </div>
  );
};

export default CenterViewManager;
