/**
 * Collaboration Bridge Connector
 * 
 * This component provides hooks and utilities for existing Phase 2 components
 * to easily integrate with Phase 3 collaboration features without major refactoring.
 */

import React, { useEffect, useCallback } from 'react';
import { useCollaboration } from '../../hooks/useUnifiedGlobalCommand';
import RealTimeEventSystem from '../../services/realTimeEventSystem';

// Generic data type for collaboration
type CollaborationData = Record<string, unknown> | string | number | boolean | null;

// TODO: Implement investigation timeline visualization with interactive events - PRIORITY: MEDIUM
export interface CollaborationBridgeHooks {
  // Session status
  isCollaborating: boolean;
  sessionInfo: {
    id?: string;
    name?: string;
    participantCount: number;
    isLead: boolean;
  };
  
  // Quick actions
  shareData: (data: CollaborationData, label?: string) => void;
  broadcastEvent: (eventType: string, data: CollaborationData) => void;
  requestSync: (componentId: string) => void;
  
  // Event listeners
  onCollaborationEvent: (eventType: string, handler: (data: CollaborationData) => void) => () => void;
  onParticipantChange: (handler: (count: number) => void) => () => void;
  onDataShare: (handler: (data: CollaborationData, source: string) => void) => () => void;
}

/**
 * Primary hook for Phase 2 components to access collaboration features
 */
export const useCollaborationBridge = (componentId?: string): CollaborationBridgeHooks => {
  const { 
    currentSession, 
    isConnected, 
    sendMessage,
    collaborationState 
  } = useCollaboration();
  
  const eventSystem = RealTimeEventSystem.getInstance();
  const operator = collaborationState.operator;

  // Determine if component is in collaboration mode
  const isCollaborating = Boolean(currentSession && isConnected);
  
  // Session information for UI display
  const sessionInfo = {
    id: currentSession?.id as string | undefined,
    name: currentSession?.name as string | undefined,
    participantCount: collaborationState.participants?.length || 0,
    isLead: currentSession?.leadAgency === operator?.id
  };

  // Share data with collaboration session
  const shareData = useCallback((data: CollaborationData, label?: string) => {
    if (!isCollaborating) return;
    
    const shareMessage = {
      type: 'data_share',
      componentId,
      label: label || `Data from ${componentId}`,
      data,
      timestamp: Date.now(),
      operatorId: operator?.id
    };
    
    sendMessage(JSON.stringify(shareMessage));
    
    // Emit local event for feedback
    eventSystem.emit({
      type: 'UI_SHOW_NOTIFICATION',
      payload: {
        type: 'success',
        title: 'Data Shared',
        message: `Shared ${label || 'data'} with collaboration session`,
        duration: 3000
      },
      source: 'collaboration',
      timestamp: new Date(),
      priority: 'normal'
    });
  }, [isCollaborating, componentId, operator?.id, sendMessage, eventSystem]);

  // Broadcast custom events to collaboration session
  const broadcastEvent = useCallback((eventType: string, data: CollaborationData) => {
    if (!isCollaborating) return;
    
    const eventMessage = {
      type: 'custom_event',
      eventType,
      componentId,
      data,
      timestamp: Date.now(),
      operatorId: operator?.id
    };
    
    sendMessage(JSON.stringify(eventMessage));
    
    // Emit to local event system as well
    eventSystem.emit({
      type: 'UI_UPDATE_CONTEXT',
      payload: {
        collaborationEvent: eventMessage
      },
      source: 'collaboration',
      timestamp: new Date(),
      priority: 'normal'
    });
  }, [isCollaborating, componentId, operator?.id, sendMessage, eventSystem]);

  // Request synchronization from other participants
  const requestSync = useCallback((syncComponentId: string) => {
    if (!isCollaborating) return;
    
    const syncRequest = {
      type: 'sync_request',
      componentId: syncComponentId,
      requestedBy: operator?.id,
      timestamp: Date.now()
    };
    
    sendMessage(JSON.stringify(syncRequest));
    
    eventSystem.emit({
      type: 'UI_SHOW_NOTIFICATION',
      payload: {
        type: 'info',
        title: 'Sync Requested',
        message: `Requesting sync for ${syncComponentId}`,
        duration: 2000
      },
      source: 'collaboration',
      timestamp: new Date(),
      priority: 'low'
    });
  }, [isCollaborating, operator?.id, sendMessage, eventSystem]);

  // Listen for collaboration events
  const onCollaborationEvent = useCallback((eventType: string, handler: (data: CollaborationData) => void) => {
    const unsubscribe = eventSystem.subscribe(
      `${componentId}-${eventType}`,
      ['UI_UPDATE_CONTEXT'],
      (event) => {
        if (event.payload && 
            typeof event.payload === 'object' && 
            'collaborationEvent' in event.payload) {
          const collabEvent = (event.payload as { collaborationEvent: { eventType: string; data: CollaborationData } }).collaborationEvent;
          if (collabEvent.eventType === eventType) {
            handler(collabEvent.data);
          }
        }
      }
    );
    
    return unsubscribe;
  }, [componentId, eventSystem]);

  // Listen for participant count changes
  const onParticipantChange = useCallback((handler: (count: number) => void) => {
    const unsubscribe = eventSystem.subscribe(
      `${componentId}-participants`,
      ['UI_UPDATE_SESSION_STATUS'],
      (event) => {
        if (event.payload && 
            typeof event.payload === 'object' && 
            'session' in event.payload) {
          const session = (event.payload as { session: { participants: unknown[] } }).session;
          if (session?.participants) {
            handler(session.participants.length);
          }
        }
      }
    );
    
    return unsubscribe;
  }, [componentId, eventSystem]);

  // Listen for data sharing events
  const onDataShare = useCallback((handler: (data: CollaborationData, source: string) => void) => {
    // Listen for incoming messages and parse data shares
    const unsubscribe = eventSystem.subscribe(
      `${componentId}-data-share`,
      ['collaboration:message-received'],
      (event) => {
        try {
          if (event.payload && typeof event.payload === 'object' && 'message' in event.payload) {
            const message = JSON.parse((event.payload as { message: string }).message);
            if (message.type === 'data_share' && message.operatorId !== operator?.id) {
              handler(message.data, message.label || 'Shared Data');
            }
          }
        } catch {
          // Ignore malformed messages
        }
      }
    );
    
    return unsubscribe;
  }, [componentId, eventSystem, operator?.id]);

  return {
    isCollaborating,
    sessionInfo,
    shareData,
    broadcastEvent,
    requestSync,
    onCollaborationEvent,
    onParticipantChange,
    onDataShare
  };
};

/**
 * Simplified hook for components that just need collaboration status
 */
export const useCollaborationStatus = () => {
  const { currentSession, isConnected, collaborationState } = useCollaboration();
  
  return {
    isActive: Boolean(currentSession && isConnected),
    sessionName: currentSession?.name,
    participantCount: collaborationState.participants?.length || 0
  };
};

/**
 * Hook for components that need to react to collaboration state changes
 */
export const useCollaborationStateSync = (
  componentId: string,
  onStateChange?: (isCollaborating: boolean) => void
) => {
  const { currentSession, isConnected } = useCollaboration();
  const isCollaborating = Boolean(currentSession && isConnected);
  
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isCollaborating);
    }
  }, [isCollaborating, onStateChange]);

  useEffect(() => {
    const eventSystem = RealTimeEventSystem.getInstance();
    
    // Announce component readiness for collaboration
    if (isCollaborating) {
      eventSystem.emit({
        type: 'UI_UPDATE_CONTEXT',
        payload: {
          componentRegistration: {
            componentId,
            timestamp: Date.now(),
            collaborationReady: true
          }
        },
        source: 'system',
        timestamp: new Date(),
        priority: 'low'
      });
    }
  }, [isCollaborating, componentId]);
};

/**
 * Utility function to enhance existing components with collaboration features
 */
export const withCollaborationBridge = <P extends object>(
  WrappedComponent: React.ComponentType<P & { collaborationBridge?: CollaborationBridgeHooks }>,
  componentId: string
) => {
  const EnhancedComponent: React.FC<P> = (props: P) => {
    const collaborationBridge = useCollaborationBridge(componentId);
    useCollaborationStateSync(componentId);
    
    const enhancedProps = {
      ...props,
      collaborationBridge
    } as P & { collaborationBridge: CollaborationBridgeHooks };
    
    return React.createElement(WrappedComponent, enhancedProps);
  };
  
  return EnhancedComponent;
};

export default useCollaborationBridge;
