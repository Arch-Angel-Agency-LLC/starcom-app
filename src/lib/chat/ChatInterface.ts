/**
 * ChatInterface.ts
 * 
 * Defines the unified interface for all chat implementations in the Starcom app.
 * This provides a common API that all chat providers must implement, allowing
 * for consistent usage regardless of the underlying technology.
 */

/**
 * Represents a chat message.
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  channelId: string;
  type?: 'text' | 'file' | 'system' | 'intelligence' | 'alert';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  metadata?: Record<string, any>;
}

/**
 * Represents a chat user.
 */
export interface ChatUser {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: number;
  publicKey?: string;
  agency?: string;
  clearanceLevel?: string;
  metadata?: Record<string, any>;
}

/**
 * Represents a chat channel.
 */
export interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'team' | 'global';
  participants: string[]; // User IDs
  lastMessage?: ChatMessage;
  unreadCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Options for initializing a chat provider.
 */
export interface ChatProviderOptions {
  userId?: string;
  userName?: string;
  publicKey?: string;
  endpoints?: string[];
  encryption?: boolean;
  storageStrategy?: 'local' | 'session' | 'memory' | 'persistent';
  [key: string]: any;
}

/**
 * Interface that all chat providers must implement.
 */
export interface ChatProvider {
  // Connection
  connect(options?: Partial<ChatProviderOptions>): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Messages
  sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ChatMessage>;
  getMessages(channelId: string, limit?: number, before?: number): Promise<ChatMessage[]>;
  subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void): () => void;
  
  // Channels
  createChannel(name: string, type: 'direct' | 'team' | 'global', participants: string[]): Promise<ChatChannel>;
  joinChannel(channelId: string): Promise<void>;
  leaveChannel(channelId: string): Promise<void>;
  getChannels(): Promise<ChatChannel[]>;
  
  // Users
  getUsers(channelId: string): Promise<ChatUser[]>;
  getUserById(userId: string): Promise<ChatUser | null>;
  subscribeToUserPresence(channelId: string, callback: (users: ChatUser[]) => void): () => void;
  
  // Utility
  markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void>;
  searchMessages(query: string, channelId?: string): Promise<ChatMessage[]>;
  uploadAttachment(file: File): Promise<{ id: string; url: string; }>;
  
  // Encryption
  setEncryptionEnabled(enabled: boolean): void;
  isEncryptionEnabled(): boolean;
}

/**
 * Base implementation with common functionality for chat providers.
 * Adapters can extend this class to avoid duplicating common code.
 */
export abstract class BaseChatProvider implements ChatProvider {
  protected connected = false;
  protected encryptionEnabled = false;
  protected options: ChatProviderOptions = {};
  
  constructor(options?: ChatProviderOptions) {
    if (options) {
      this.options = options;
    }
  }
  
  abstract connect(options?: Partial<ChatProviderOptions>): Promise<void>;
  abstract disconnect(): Promise<void>;
  
  isConnected(): boolean {
    return this.connected;
  }
  
  abstract sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ChatMessage>;
  abstract getMessages(channelId: string, limit?: number, before?: number): Promise<ChatMessage[]>;
  abstract subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void): () => void;
  
  abstract createChannel(name: string, type: 'direct' | 'team' | 'global', participants: string[]): Promise<ChatChannel>;
  abstract joinChannel(channelId: string): Promise<void>;
  abstract leaveChannel(channelId: string): Promise<void>;
  abstract getChannels(): Promise<ChatChannel[]>;
  
  abstract getUsers(channelId: string): Promise<ChatUser[]>;
  abstract getUserById(userId: string): Promise<ChatUser | null>;
  abstract subscribeToUserPresence(channelId: string, callback: (users: ChatUser[]) => void): () => void;
  
  abstract markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void>;
  abstract searchMessages(query: string, channelId?: string): Promise<ChatMessage[]>;
  abstract uploadAttachment(file: File): Promise<{ id: string; url: string; }>;
  
  setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
  }
  
  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }
  
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
