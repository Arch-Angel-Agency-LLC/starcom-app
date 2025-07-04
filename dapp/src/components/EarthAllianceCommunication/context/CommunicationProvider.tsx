import React, { useReducer, useEffect, useCallback } from 'react';
import { NostrServiceAdapter } from '../services/NostrServiceAdapter';
import { messageReducer, initialState } from './messageReducer';
import { Message, NostrConfig } from '../types';
import { CommunicationContext, CommunicationContextType } from './CommunicationContext';

interface CommunicationProviderProps {
  children: React.ReactNode;
  config: NostrConfig;
}

export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({ 
  children, 
  config 
}) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const nostrService = React.useMemo(() => new NostrServiceAdapter(config), [config]);
  
  // Setup connection management
  useEffect(() => {
    const handleConnection = async () => {
      try {
        dispatch({ type: 'CONNECTION_REQUESTED' });
        await nostrService.connect();
        dispatch({ type: 'CONNECTION_ESTABLISHED' });
      } catch (error) {
        dispatch({ type: 'CONNECTION_FAILED', payload: error as Error });
      }
    };
    
    handleConnection();
    
    return () => {
      nostrService.disconnect();
    };
  }, [nostrService]);
  
  // Setup message handling
  useEffect(() => {
    const handleIncomingMessage = (message: Message) => {
      dispatch({ type: 'MESSAGE_RECEIVED', payload: message });
    };
    
    nostrService.onMessage(handleIncomingMessage);
    
    return () => {
      nostrService.offMessage(handleIncomingMessage);
    };
  }, [nostrService]);
  
  // Implement message queue processing
  useEffect(() => {
    if (state.connectionState === 'connected' && state.messageQueue.length > 0) {
      const processQueue = async () => {
        const message = state.messageQueue[0];
        try {
          await nostrService.sendMessage(message);
          dispatch({ type: 'MESSAGE_SENT', payload: message.id });
        } catch (error) {
          dispatch({ 
            type: 'MESSAGE_FAILED', 
            payload: { messageId: message.id, error: error as Error } 
          });
        }
      };
      
      processQueue();
    }
  }, [state.connectionState, state.messageQueue, nostrService]);
  
  // Generate a unique ID for messages
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }, []);
  
  // Action: Send Message
  const sendMessage = useCallback(async (messageData: Partial<Message>) => {
    if (!state.currentChannel) {
      throw new Error('Cannot send message: No active channel');
    }
    
    const message: Message = {
      id: generateId(),
      senderId: 'current-user', // This should come from authentication context
      content: '',
      timestamp: Date.now(),
      priority: 0,
      channelId: state.currentChannel.id,
      ...messageData,
    };
    
    dispatch({ type: 'MESSAGE_QUEUED', payload: message });
    
    if (state.connectionState === 'connected') {
      try {
        await nostrService.sendMessage(message);
        dispatch({ type: 'MESSAGE_SENT', payload: message.id });
      } catch (error) {
        dispatch({ 
          type: 'MESSAGE_FAILED', 
          payload: { messageId: message.id, error: error as Error } 
        });
      }
    }
  }, [state.currentChannel, state.connectionState, generateId, nostrService]);
  
  // Action: Join Channel
  const joinChannel = useCallback(async (channelId: string) => {
    dispatch({ type: 'CHANNEL_JOIN_REQUESTED', payload: channelId });
    
    try {
      await nostrService.joinChannel(channelId);
      const channelInfo = await nostrService.getChannelInfo(channelId);
      dispatch({ type: 'CHANNEL_JOINED', payload: channelInfo });
    } catch (error) {
      dispatch({ 
        type: 'CHANNEL_JOIN_FAILED', 
        payload: { channelId, error: error as Error } 
      });
      throw error; // Re-throw to allow caller to handle
    }
  }, [nostrService]);
  
  // Action: Leave Channel
  const leaveChannel = useCallback(async (channelId: string) => {
    dispatch({ type: 'CHANNEL_LEAVE_REQUESTED', payload: channelId });
    
    try {
      await nostrService.leaveChannel(channelId);
      dispatch({ type: 'CHANNEL_LEFT', payload: channelId });
    } catch (error) {
      dispatch({ 
        type: 'CHANNEL_LEAVE_FAILED', 
        payload: { channelId, error: error as Error } 
      });
      throw error; // Re-throw to allow caller to handle
    }
  }, [nostrService]);
  
  // Action: Declare Emergency
  const declareEmergency = useCallback(async (reason: string) => {
    dispatch({ type: 'EMERGENCY_DECLARED', payload: reason });
    
    try {
      await nostrService.declareEmergency(reason);
      // Switch to emergency channels
      const emergencyChannels = await nostrService.getEmergencyChannels();
      dispatch({ type: 'EMERGENCY_CHANNELS_RECEIVED', payload: emergencyChannels });
      
      // Automatically join the first emergency channel if available
      if (emergencyChannels.length > 0) {
        await joinChannel(emergencyChannels[0].id);
      }
    } catch (error) {
      dispatch({ type: 'EMERGENCY_DECLARATION_FAILED', payload: error as Error });
      // We still activate local emergency mode, even if the declaration failed
    }
  }, [nostrService, joinChannel]);
  
  // Action: Resolve Emergency
  const resolveEmergency = useCallback(async () => {
    dispatch({ type: 'EMERGENCY_RESOLUTION_REQUESTED' });
    
    try {
      await nostrService.resolveEmergency();
      dispatch({ type: 'EMERGENCY_RESOLVED' });
    } catch (error) {
      dispatch({ type: 'EMERGENCY_RESOLUTION_FAILED', payload: error as Error });
      throw error; // Re-throw to allow caller to handle
    }
  }, [nostrService]);
  
  // Action: Reconnect
  const reconnect = useCallback(async () => {
    try {
      dispatch({ type: 'CONNECTION_REQUESTED' });
      await nostrService.connect();
      dispatch({ type: 'CONNECTION_ESTABLISHED' });
      
      // Rejoin the current channel if there is one
      if (state.currentChannel) {
        await joinChannel(state.currentChannel.id);
      }
    } catch (error) {
      dispatch({ type: 'CONNECTION_FAILED', payload: error as Error });
      throw error;
    }
  }, [nostrService, joinChannel, state.currentChannel]);
  
  // Action: Disconnect
  const disconnect = useCallback(async () => {
    dispatch({ type: 'DISCONNECTION_REQUESTED' });
    
    try {
      await nostrService.disconnect();
      dispatch({ type: 'DISCONNECTED' });
    } catch {
      // Even on error, we still consider ourselves disconnected
      dispatch({ type: 'DISCONNECTED' });
    }
  }, [nostrService]);
  
  // Action: Reset Unread Count
  const resetUnreadCount = useCallback((channelId: string) => {
    dispatch({
      type: 'CHANNEL_STATUS_UPDATED',
      payload: {
        channelId,
        status: {
          unreadCount: 0,
        },
      },
    });
  }, []);
  
  // Action: Clear Failed Messages
  const clearFailedMessages = useCallback(() => {
    state.failedMessages.forEach(message => {
      dispatch({ type: 'MESSAGE_DELETED', payload: message.id });
    });
  }, [state.failedMessages]);
  
  // Action: Retry Failed Message
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const message = state.failedMessages.find(msg => msg.id === messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    dispatch({ type: 'MESSAGE_QUEUED', payload: message });
    
    if (state.connectionState === 'connected') {
      try {
        await nostrService.sendMessage(message);
        dispatch({ type: 'MESSAGE_SENT', payload: message.id });
      } catch (error) {
        dispatch({ 
          type: 'MESSAGE_FAILED', 
          payload: { messageId: message.id, error: error as Error } 
        });
        throw error;
      }
    }
  }, [state.failedMessages, state.connectionState, nostrService]);
  
  // Combine state and actions into context value
  const contextValue: CommunicationContextType = {
    ...state,
    sendMessage,
    joinChannel,
    leaveChannel,
    declareEmergency,
    resolveEmergency,
    reconnect,
    disconnect,
    resetUnreadCount,
    clearFailedMessages,
    retryFailedMessage,
  };
  
  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};
