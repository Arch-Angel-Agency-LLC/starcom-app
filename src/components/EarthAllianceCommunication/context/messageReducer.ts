import { Message, Channel, ConnectionState, ChannelStatus } from '../types';

// Define action types
export type MessageAction =
  // Connection actions
  | { type: 'CONNECTION_REQUESTED' }
  | { type: 'CONNECTION_ESTABLISHED' }
  | { type: 'CONNECTION_FAILED'; payload: Error }
  | { type: 'DISCONNECTION_REQUESTED' }
  | { type: 'DISCONNECTED' }
  
  // Message actions
  | { type: 'MESSAGE_QUEUED'; payload: Message }
  | { type: 'MESSAGE_SENT'; payload: string } // message ID
  | { type: 'MESSAGE_RECEIVED'; payload: Message }
  | { type: 'MESSAGE_FAILED'; payload: { messageId: string; error: Error } }
  | { type: 'MESSAGE_DELETED'; payload: string } // message ID
  
  // Channel actions
  | { type: 'CHANNEL_JOIN_REQUESTED'; payload: string } // channel ID
  | { type: 'CHANNEL_JOINED'; payload: Channel }
  | { type: 'CHANNEL_JOIN_FAILED'; payload: { channelId: string; error: Error } }
  | { type: 'CHANNEL_LEAVE_REQUESTED'; payload: string } // channel ID
  | { type: 'CHANNEL_LEFT'; payload: string } // channel ID
  | { type: 'CHANNEL_LEAVE_FAILED'; payload: { channelId: string; error: Error } }
  | { type: 'CHANNEL_STATUS_UPDATED'; payload: { channelId: string; status: Partial<ChannelStatus> } }
  | { type: 'CHANNELS_RECEIVED'; payload: Channel[] }
  
  // Emergency actions
  | { type: 'EMERGENCY_DECLARED'; payload: string } // reason
  | { type: 'EMERGENCY_DECLARATION_FAILED'; payload: Error }
  | { type: 'EMERGENCY_CHANNELS_RECEIVED'; payload: Channel[] }
  | { type: 'EMERGENCY_RESOLUTION_REQUESTED' }
  | { type: 'EMERGENCY_RESOLVED' }
  | { type: 'EMERGENCY_RESOLUTION_FAILED'; payload: Error };

// Define state interface
export interface CommunicationState {
  // Connection state
  connectionState: ConnectionState;
  connectionError: Error | null;
  
  // Messages
  messages: Message[];
  messageQueue: Message[];
  failedMessages: Message[];
  
  // Channels
  channels: Channel[];
  currentChannel: Channel | null;
  channelStatus: Record<string, ChannelStatus>;
  
  // Emergency state
  isEmergencyMode: boolean;
  emergencyReason: string | null;
  emergencyChannels: Channel[];
}

// Define initial state
export const initialState: CommunicationState = {
  // Connection state
  connectionState: 'disconnected',
  connectionError: null,
  
  // Messages
  messages: [],
  messageQueue: [],
  failedMessages: [],
  
  // Channels
  channels: [],
  currentChannel: null,
  channelStatus: {},
  
  // Emergency state
  isEmergencyMode: false,
  emergencyReason: null,
  emergencyChannels: [],
};

// Implement the reducer
export const messageReducer = (
  state: CommunicationState,
  action: MessageAction
): CommunicationState => {
  switch (action.type) {
    // Connection actions
    case 'CONNECTION_REQUESTED':
      return {
        ...state,
        connectionState: 'connecting',
        connectionError: null,
      };
      
    case 'CONNECTION_ESTABLISHED':
      return {
        ...state,
        connectionState: 'connected',
        connectionError: null,
      };
      
    case 'CONNECTION_FAILED':
      return {
        ...state,
        connectionState: 'error',
        connectionError: action.payload,
      };
      
    case 'DISCONNECTION_REQUESTED':
      return {
        ...state,
        connectionState: 'disconnected',
      };
      
    case 'DISCONNECTED':
      return {
        ...state,
        connectionState: 'disconnected',
      };
      
    // Message actions
    case 'MESSAGE_QUEUED':
      return {
        ...state,
        messageQueue: [...state.messageQueue, action.payload],
      };
      
    case 'MESSAGE_SENT':
      return {
        ...state,
        messageQueue: state.messageQueue.filter(msg => msg.id !== action.payload),
        failedMessages: state.failedMessages.filter(msg => msg.id !== action.payload),
      };
      
    case 'MESSAGE_RECEIVED': {
      // If we already have this message, don't add it again
      if (state.messages.some(msg => msg.id === action.payload.id)) {
        return state;
      }
      
      // Add message and sort by timestamp
      const newMessages = [...state.messages, action.payload]
        .sort((a, b) => a.timestamp - b.timestamp);
        
      // Update channel status if this is for the current channel
      const channelId = action.payload.channelId;
      const currentStatus = state.channelStatus[channelId] || {
        isActive: true,
        lastMessageTimestamp: 0,
        unreadCount: 0,
        participantCount: 0,
        isTyping: [],
      };
      
      const newChannelStatus = {
        ...state.channelStatus,
        [channelId]: {
          ...currentStatus,
          lastMessageTimestamp: action.payload.timestamp,
          unreadCount: channelId !== state.currentChannel?.id 
            ? currentStatus.unreadCount + 1 
            : 0,
        },
      };
      
      return {
        ...state,
        messages: newMessages,
        channelStatus: newChannelStatus,
      };
    }
      
    case 'MESSAGE_FAILED':
      return {
        ...state,
        messageQueue: state.messageQueue.filter(msg => msg.id !== action.payload.messageId),
        failedMessages: [
          ...state.failedMessages,
          ...state.messageQueue.filter(msg => msg.id === action.payload.messageId),
        ],
      };
      
    case 'MESSAGE_DELETED':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };
      
    // Channel actions
    case 'CHANNEL_JOIN_REQUESTED':
      return state; // No state change needed
      
    case 'CHANNEL_JOINED':
      return {
        ...state,
        channels: state.channels.some(channel => channel.id === action.payload.id)
          ? state.channels.map(channel => 
              channel.id === action.payload.id ? action.payload : channel
            )
          : [...state.channels, action.payload],
        currentChannel: action.payload,
        channelStatus: {
          ...state.channelStatus,
          [action.payload.id]: state.channelStatus[action.payload.id] || {
            isActive: true,
            lastMessageTimestamp: Date.now(),
            unreadCount: 0,
            participantCount: action.payload.participants.length,
            isTyping: [],
          },
        },
      };
      
    case 'CHANNEL_JOIN_FAILED':
      return state; // No state change needed, error will be handled by the component
      
    case 'CHANNEL_LEAVE_REQUESTED':
      return state; // No state change needed
      
    case 'CHANNEL_LEFT': {
      // If this was the current channel, set current to null
      const newCurrentChannel = state.currentChannel?.id === action.payload
        ? null
        : state.currentChannel;
        
      // Update channel status - we're intentionally removing the channel key from the object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.payload]: removed, ...newChannelStatus } = state.channelStatus;
      
      return {
        ...state,
        currentChannel: newCurrentChannel,
        channelStatus: newChannelStatus,
      };
    }
      
    case 'CHANNEL_LEAVE_FAILED':
      return state; // No state change needed, error will be handled by the component
      
    case 'CHANNEL_STATUS_UPDATED': {
      const { channelId, status } = action.payload;
      const currentStatus = state.channelStatus[channelId] || {
        isActive: true,
        lastMessageTimestamp: 0,
        unreadCount: 0,
        participantCount: 0,
        isTyping: [],
      };
      
      return {
        ...state,
        channelStatus: {
          ...state.channelStatus,
          [channelId]: {
            ...currentStatus,
            ...status,
          },
        },
      };
    }
      
    case 'CHANNELS_RECEIVED':
      return {
        ...state,
        channels: action.payload,
      };
      
    // Emergency actions
    case 'EMERGENCY_DECLARED':
      return {
        ...state,
        isEmergencyMode: true,
        emergencyReason: action.payload,
      };
      
    case 'EMERGENCY_DECLARATION_FAILED':
      return {
        ...state,
        isEmergencyMode: true, // Still enable emergency mode locally even if declaration failed
      };
      
    case 'EMERGENCY_CHANNELS_RECEIVED':
      return {
        ...state,
        emergencyChannels: action.payload,
      };
      
    case 'EMERGENCY_RESOLUTION_REQUESTED':
      return state; // No state change needed
      
    case 'EMERGENCY_RESOLVED':
      return {
        ...state,
        isEmergencyMode: false,
        emergencyReason: null,
        emergencyChannels: [],
      };
      
    case 'EMERGENCY_RESOLUTION_FAILED':
      return state; // No state change needed, error will be handled by the component
      
    default:
      return state;
  }
};
