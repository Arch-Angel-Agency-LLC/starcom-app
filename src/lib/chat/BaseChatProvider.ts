/**
 * BaseChatProvider.ts
 * 
 * Provides a base implementation of the ChatProvider interface that can be 
 * extended by specific chat providers. Handles common functionality and state.
 */

import { ChatProvider, ChatProviderOptions, ChatMessage, ChatChannel, ChatUser } from './ChatInterface';

/**
 * Abstract base class for chat providers.
 * Provides shared functionality and default implementations.
 */
export abstract class BaseChatProvider implements ChatProvider {
  protected options: ChatProviderOptions;
  protected connected: boolean = false;
  
  constructor(options?: ChatProviderOptions) {
    this.options = options || {};
  }
  
  /**
   * Establishes a connection to the chat service.
   */
  abstract connect(options?: Partial<ChatProviderOptions>): Promise<void>;
  
  /**
   * Disconnects from the chat service.
   */
  abstract disconnect(): Promise<void>;
  
  /**
   * Checks if the provider is currently connected.
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Sends a message to a channel.
   */
  abstract sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ChatMessage>;
  
  /**
   * Retrieves messages from a channel.
   */
  abstract getMessages(channelId: string, limit?: number, before?: number): Promise<ChatMessage[]>;
  
  /**
   * Subscribes to new messages in a channel.
   */
  abstract subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void): () => void;
  
  /**
   * Creates a new channel.
   */
  abstract createChannel(name: string, type: 'direct' | 'team' | 'global', participants: string[]): Promise<ChatChannel>;
  
  /**
   * Joins an existing channel.
   */
  abstract joinChannel(channelId: string): Promise<void>;
  
  /**
   * Leaves a channel.
   */
  abstract leaveChannel(channelId: string): Promise<void>;
  
  /**
   * Gets all available channels.
   */
  abstract getChannels(): Promise<ChatChannel[]>;
  
  /**
   * Gets users in a channel.
   */
  abstract getUsers(channelId: string): Promise<ChatUser[]>;
  
  /**
   * Gets a user by ID.
   */
  abstract getUserById(userId: string): Promise<ChatUser | null>;
  
  /**
   * Subscribes to user presence updates in a channel.
   */
  abstract subscribeToUserPresence(channelId: string, callback: (users: ChatUser[]) => void): () => void;
  
  /**
   * Marks messages as read.
   */
  abstract markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void>;
  
  /**
   * Searches for messages matching a query.
   */
  abstract searchMessages(query: string, channelId?: string): Promise<ChatMessage[]>;
  
  /**
   * Uploads a file attachment.
   */
  abstract uploadAttachment(file: File): Promise<{ id: string; url: string; }>;
}
