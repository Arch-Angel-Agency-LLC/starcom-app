/**
 * Context Bridge - Phase 2 to Phase 3 Integration Component
 * 
 * This component handles the seamless integration between existing Phase 2 features
 * (Globe, Visualization, Space Weather) and new Phase 3 collaboration features.
 * It acts as a bridge for state synchronization and cross-feature communication.
 */

import React, { useEffect, useCallback } from 'react';
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { useSpaceWeatherContext } from '../../context/SpaceWeatherContext';
import { useCollaboration } from '../../hooks/useUnifiedGlobalCommand';
import RealTimeEventSystem from '../../services/realTimeEventSystem';
import type { VisualizationMode } from '../../context/VisualizationModeContext';

interface ContextBridgeProps {
  children?: React.ReactNode;
}

interface SharedContextUpdate {
  type: string;
  data: {
    operatorId?: string;
    location?: { lat: number; lng: number };
    mode?: VisualizationMode;
    [key: string]: unknown;
  };
}

/**
 * ContextBridge manages cross-context state synchronization and feature integration
 */
const ContextBridge: React.FC<ContextBridgeProps> = ({ children }) => {
  const { 
    focusLocation, 
    setFocusLocation
  } = useGlobeContext();
  
  const { 
    visualizationMode, 
    setVisualizationMode 
  } = useVisualizationMode();
  
  const { 
    alerts: spaceWeatherAlerts,
    lastUpdated: spaceWeatherData
  } = useSpaceWeatherContext();
  
  const { 
    currentSession,
    collaborationState,
    sendMessage
  } = useCollaboration();

  // Get the operator from collaboration state
  const operator = collaborationState.operator;

  // Create event system instance
  const eventSystem = RealTimeEventSystem.getInstance();

  // Synchronize globe focus changes with collaboration context
  const syncGlobeFocus = useCallback((location: { lat: number; lng: number }) => {
    if (currentSession && location) {
      // Send a message to share the focus change
      sendMessage(`Globe focus changed to lat: ${location.lat}, lng: ${location.lng}`);

      // Emit real-time event for other components
      eventSystem.emit({
        type: 'UI_UPDATE_CONTEXT',
        payload: {
          location,
          timestamp: Date.now(),
          operatorId: operator?.id
        },
        source: 'user',
        timestamp: new Date(),
        priority: 'normal'
      });
    }
  }, [currentSession, sendMessage, operator?.id, eventSystem]);

  // Synchronize visualization mode changes with collaboration
  const syncVisualizationMode = useCallback((mode: VisualizationMode) => {
    if (currentSession) {
      sendMessage(`Visualization mode changed to: ${JSON.stringify(mode)}`);

      // Emit real-time event
      eventSystem.emit({
        type: 'UI_UPDATE_CONTEXT',
        payload: {
          mode,
          timestamp: Date.now(),
          operatorId: operator?.id
        },
        source: 'user',
        timestamp: new Date(),
        priority: 'normal'
      });
    }
  }, [currentSession, sendMessage, operator?.id, eventSystem]);

  // Sync space weather alerts with collaboration notifications
  const syncSpaceWeatherAlerts = useCallback(() => {
    if (currentSession && spaceWeatherAlerts && spaceWeatherAlerts.length > 0) {
      const recentAlerts = spaceWeatherAlerts.filter(alert => {
        // Check if alert has a timestamp field and is recent
        if (alert.timestamp) {
          const alertTime = typeof alert.timestamp === 'string' 
            ? new Date(alert.timestamp).getTime() 
            : new Date(alert.timestamp).getTime();
          return alertTime > (Date.now() - 300000); // Last 5 minutes
        }
        return false;
      });
      
      recentAlerts.forEach(alert => {
        eventSystem.emit({
          type: 'UI_SHOW_NOTIFICATION',
          payload: {
            alert,
            session: currentSession.id,
            source: 'noaa'
          },
          source: 'system',
          timestamp: new Date(),
          priority: 'high'
        });
      });
    }
  }, [currentSession, spaceWeatherAlerts, eventSystem]);

  // Handle shared context updates from collaboration
  const handleSharedContextUpdate = useCallback((update: SharedContextUpdate) => {
    switch (update.type) {
      case 'globe_focus':
        if (update.data.operatorId !== operator?.id && update.data.location) {
          // Another operator changed globe focus
          setFocusLocation(update.data.location);
          
          eventSystem.emit({
            type: 'UI_UPDATE_CONTEXT',
            payload: {
              location: update.data.location,
              operatorId: update.data.operatorId
            },
            source: 'collaboration',
            timestamp: new Date(),
            priority: 'normal'
          });
        }
        break;
        
      case 'visualization_mode':
        if (update.data.operatorId !== operator?.id && update.data.mode) {
          // Another operator changed visualization mode
          setVisualizationMode(update.data.mode);
          
          eventSystem.emit({
            type: 'UI_UPDATE_CONTEXT',
            payload: {
              mode: update.data.mode,
              operatorId: update.data.operatorId
            },
            source: 'collaboration',
            timestamp: new Date(),
            priority: 'normal'
          });
        }
        break;
        
      case 'marker_added':
        // Handle collaborative marker additions
        eventSystem.emit({
          type: 'UI_UPDATE_ANNOTATION',
          payload: update.data,
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });
        break;
        
      case 'overlay_toggled':
        // Handle collaborative overlay toggles
        eventSystem.emit({
          type: 'UI_UPDATE_CONTEXT',
          payload: update.data,
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });
        break;
    }
  }, [operator?.id, setFocusLocation, setVisualizationMode, eventSystem]);

  // Set up event listeners for cross-context synchronization
  useEffect(() => {
    // Subscribe to relevant events using the event system
    const unsubscribeFocus = eventSystem.subscribe(
      'context-bridge-focus',
      ['globe:focus-request'],
      (event) => {
        if (event.payload && typeof event.payload === 'object' && 'location' in event.payload) {
          const location = (event.payload as { location: { lat: number; lng: number } }).location;
          if (location && typeof location === 'object' && 'lat' in location && 'lng' in location) {
            setFocusLocation(location);
          }
        }
      }
    );

    const unsubscribeVisualization = eventSystem.subscribe(
      'context-bridge-visualization',
      ['visualization:mode-request'],
      (event) => {
        if (event.payload && typeof event.payload === 'object' && 'mode' in event.payload) {
          const mode = (event.payload as { mode: VisualizationMode }).mode;
          setVisualizationMode(mode);
        }
      }
    );

    const unsubscribeCollabSync = eventSystem.subscribe(
      'context-bridge-collab',
      ['collaboration:sync-request'],
      (event) => {
        if (event.payload && typeof event.payload === 'object') {
          handleSharedContextUpdate(event.payload as SharedContextUpdate);
        }
      }
    );

    return () => {
      unsubscribeFocus();
      unsubscribeVisualization();
      unsubscribeCollabSync();
    };
  }, [setFocusLocation, setVisualizationMode, handleSharedContextUpdate, eventSystem]);

  // Monitor and sync important state changes
  useEffect(() => {
    if (focusLocation) {
      syncGlobeFocus(focusLocation);
    }
  }, [focusLocation, syncGlobeFocus]);

  useEffect(() => {
    if (visualizationMode) {
      syncVisualizationMode(visualizationMode);
    }
  }, [visualizationMode, syncVisualizationMode]);

  useEffect(() => {
    syncSpaceWeatherAlerts();
  }, [syncSpaceWeatherAlerts]);

  // Enhanced integration effects for Phase 3 features
  useEffect(() => {
    if (currentSession) {
      // Emit session status for other components
      eventSystem.emit({
        type: 'UI_UPDATE_SESSION_STATUS',
        payload: {
          session: currentSession,
          operator: operator
        },
        source: 'collaboration',
        timestamp: new Date(),
        priority: 'normal'
      });

      // Broadcast current state to new session members
      const currentState = {
        globe: {
          focus: focusLocation
        },
        visualization: {
          mode: visualizationMode
        },
        spaceWeather: {
          alertCount: spaceWeatherAlerts?.length || 0,
          lastUpdate: spaceWeatherData?.getTime() || null
        }
      };

      sendMessage(`State broadcast: ${JSON.stringify(currentState)}`);
    } else {
      eventSystem.emit({
        type: 'UI_UPDATE_SESSION_STATUS',
        payload: {},
        source: 'collaboration',
        timestamp: new Date(),
        priority: 'low'
      });
    }
  }, [currentSession, operator, focusLocation, visualizationMode, spaceWeatherAlerts, spaceWeatherData, sendMessage, eventSystem]);

  return (
    <>
      {children}
    </>
  );
};

export default ContextBridge;
