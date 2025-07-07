/**
 * ChatProviderInterface.ts
 * 
 * Defines the enhanced interface for chat providers. This builds on the existing
 * ChatProvider interface and adds feature detection, connection status reporting,
 * and protocol metadata.
 */

import { 
  EnhancedChatMessage, 
  EnhancedChatChannel, 
  EnhancedChatUser,
  EnhancedChatProviderOptions,
  ConnectionStatus,
  ConnectionDetails
} from '../types/ChatAdapterTypes';
import { ChatProviderCapabilities, ProtocolInfo } from '../types/ProtocolTypes';

/**
 * Enhanced interface for chat providers with feature detection and detailed status.
 */
export interface ChatProviderInterface {
  /**
   * Connection methods
   */
  connect(options?: Partial<EnhancedChatProviderOptions>): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  reconnect(): Promise<void>;
  
  /**
   * Connection status methods
   */
  getConnectionStatus(): ConnectionStatus;
  getConnectionDetails(): ConnectionDetails;
  onConnectionStatusChange(callback: (status: ConnectionStatus, details: ConnectionDetails) => void): () => void;
  
  /**
   * Protocol and capability methods
   */
  getProtocolInfo(): ProtocolInfo;
  getCapabilities(): ChatProviderCapabilities;
  hasCapability(capability: string): boolean;
  
  /**
   * Message methods
   */
  sendMessage(channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage>;
  getMessages(channelId: string, limit?: number, before?: number): Promise<EnhancedChatMessage[]>;
  subscribeToMessages(channelId: string, callback: (message: EnhancedChatMessage) => void): () => void;
  editMessage(messageId: string, channelId: string, newContent: string): Promise<EnhancedChatMessage>;
  deleteMessage(messageId: string, channelId: string): Promise<void>;
  replyToMessage(messageId: string, channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage>;
  forwardMessage(messageId: string, sourceChannelId: string, targetChannelId: string): Promise<EnhancedChatMessage>;
  addReaction(messageId: string, channelId: string, reaction: string): Promise<void>;
  removeReaction(messageId: string, channelId: string, reaction: string): Promise<void>;
  
  /**
   * Channel methods
   */
  createChannel(name: string, type: string, participants: string[]): Promise<EnhancedChatChannel>;
  joinChannel(channelId: string): Promise<void>;
  leaveChannel(channelId: string): Promise<void>;
  getChannels(): Promise<EnhancedChatChannel[]>;
  getChannelDetails(channelId: string): Promise<EnhancedChatChannel>;
  updateChannel(channelId: string, updates: Partial<EnhancedChatChannel>): Promise<EnhancedChatChannel>;
  deleteChannel(channelId: string): Promise<void>;
  archiveChannel(channelId: string): Promise<void>;
  unarchiveChannel(channelId: string): Promise<void>;
  muteChannel(channelId: string, duration?: number): Promise<void>;
  unmuteChannel(channelId: string): Promise<void>;
  pinChannel(channelId: string): Promise<void>;
  unpinChannel(channelId: string): Promise<void>;
  
  /**
   * User methods
   */
  getUsers(channelId: string): Promise<EnhancedChatUser[]>;
  getUserById(userId: string): Promise<EnhancedChatUser | null>;
  getCurrentUser(): EnhancedChatUser;
  subscribeToUserPresence(channelId: string, callback: (users: EnhancedChatUser[]) => void): () => void;
  updateUserStatus(status: string, customStatus?: string): Promise<void>;
  
  /**
   * Utility methods
   */
  markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void>;
  searchMessages(query: string, channelId?: string, options?: SearchOptions): Promise<SearchResult>;
  uploadAttachment(file: File): Promise<{ id: string; url: string; }>;
  
  /**
   * Thread methods
   */
  createThread(messageId: string, channelId: string, content: string): Promise<EnhancedChatMessage>;
  getThreadMessages(threadId: string, limit?: number, before?: number): Promise<EnhancedChatMessage[]>;
  subscribeToThreadMessages(threadId: string, callback: (message: EnhancedChatMessage) => void): () => void;
  
  /**
   * Event subscription
   */
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
  once(event: string, callback: (...args: any[]) => void): void;
}

/**
 * Options for message search operations.
 */
export interface SearchOptions {
  channelIds?: string[];
  fromUserId?: string;
  startDate?: number;
  endDate?: number;
  messageTypes?: string[];
  includeThreads?: boolean;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
  fuzzySearch?: boolean;
}

/**
 * Result of a message search operation.
 */
export interface SearchResult {
  messages: EnhancedChatMessage[];
  totalResults: number;
  hasMore: boolean;
  nextOffset?: number;
  executionTimeMs?: number;
}
