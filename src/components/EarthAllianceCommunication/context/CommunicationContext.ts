import { createContext } from 'react';
import { CommunicationState } from './messageReducer';
import { Message } from '../types';

export interface CommunicationContextType extends CommunicationState {
  // Actions
  sendMessage: (message: Partial<Message>) => Promise<void>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  declareEmergency: (reason: string) => Promise<void>;
  resolveEmergency: () => Promise<void>;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  resetUnreadCount: (channelId: string) => void;
  clearFailedMessages: () => void;
  retryFailedMessage: (messageId: string) => Promise<void>;
}

export const CommunicationContext = createContext<CommunicationContextType | null>(null);
