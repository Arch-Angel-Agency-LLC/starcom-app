/**
 * SecureChatAdapter.ts
 * 
 * Implementation of a secure end-to-end encrypted chat adapter.
 */

import { BaseChatAdapter } from './BaseChatAdapter';
import { 
  EnhancedChatProviderOptions,
  EnhancedChatMessage,
  EnhancedChatChannel,
  EnhancedChatUser,
  UserStatus,
  MessageStatus,
  MessageType,
  ChannelType
} from '../types/ChatAdapterTypes';
import { ChatProviderCapabilities, ProtocolInfo } from '../types/ProtocolTypes';
import { SearchOptions, SearchResult } from '../interfaces/ChatProviderInterface';
import { logger } from '../../../utils';

// Interface for the secure chat service
export interface SecureChatIntegrationServiceInterface {
  initialize(): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  createChannel(name: string, type: string, participants: string[]): Promise<{ 
    channelId: string;
    name: string;
    type: string;
    participants?: string[];
    description?: string;
    createdAt?: number;
    createdBy?: string;
  }>;
  getChannels(): Promise<{
    channelId: string;
    name: string;
    type: string;
    participants?: string[];
    description?: string;
    createdAt?: number;
    createdBy?: string;
  }[]>;
  joinChannel(channelId: string): Promise<void>;
  leaveChannel(channelId: string): Promise<void>;
  sendMessage(channelId: string, content: string, attachments?: File[]): Promise<{
    messageId: string;
    content: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    status?: string;
    threadId?: string;
    parentMessageId?: string;
    attachments?: {
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }[];
  }>;
  getMessages(channelId: string): Promise<{
    messageId: string;
    content: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    status?: string;
    threadId?: string;
    parentMessageId?: string;
    attachments?: {
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }[];
  }[]>;
  subscribeToMessages(channelId: string, callback: (message: {
    messageId: string;
    content: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    status?: string;
    attachments?: {
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }[];
  }) => void): () => void;
  subscribeToPresence(channelId: string, callback: (users: {
    userId: string;
    userName: string;
    status: string;
    lastSeen?: number;
    publicKey?: string;
  }[]) => void): () => void;
  getActiveUsers(): Promise<{
    userId: string;
    userName: string;
    status: string;
    lastSeen?: number;
    publicKey?: string;
  }[]>;
  editMessage(messageId: string, channelId: string, newContent: string): Promise<{
    messageId: string;
    content: string;
    timestamp: number;
    editedAt: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    status?: string;
  }>;
  deleteMessage(messageId: string, channelId: string): Promise<void>;
  createThread(messageId: string, channelId: string, content: string): Promise<{
    messageId: string;
    content: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    threadId: string;
    parentMessageId: string;
    status?: string;
  }>;
  getThreadMessages(threadId: string): Promise<{
    messageId: string;
    content: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    threadId: string;
    status?: string;
  }[]>;
  subscribeToThreadMessages(threadId: string, callback: (message: {
    messageId: string;
    content: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
    channelId: string;
    threadId: string;
    status?: string;
  }) => void): () => void;
  addReaction(messageId: string, channelId: string, reaction: string): Promise<void>;
  removeReaction(messageId: string, channelId: string, reaction: string): Promise<void>;
  enableEncryption(enabled: boolean): void;
  isEncryptionEnabled(): boolean;
  setPQCEnabled(enabled: boolean): void;
  isPQCEnabled(): boolean;
  searchMessages(query: string, channelId?: string): Promise<{
    messages: {
      messageId: string;
      content: string;
      timestamp: number;
      senderId: string;
      senderName?: string;
      channelId: string;
      status?: string;
    }[];
    totalResults: number;
    hasMore: boolean;
    executionTimeMs: number;
  }>;
}

// Default production service factory (separated for testability)
export async function createSecureChatService(): Promise<SecureChatIntegrationServiceInterface> {
  try {
    // Dynamic import for production use
    // This will be mocked in tests
    let SecureChatIntegrationService;
    try {
      const module = await import('../../../services/SecureChatIntegrationService');
      SecureChatIntegrationService = module.SecureChatIntegrationService;
    } catch (importError) {
      // Fallback to a different import approach if dynamic import fails
      logger.warn('Dynamic import failed, trying alternative approach', importError);
      // Use eval for legacy code requiring the module if dynamic import fails
      SecureChatIntegrationService = eval('require')('../../../services/SecureChatIntegrationService').SecureChatIntegrationService;
    }
    
    return SecureChatIntegrationService.getInstance();
  } catch (error) {
    logger.error('Failed to import SecureChatIntegrationService', error);
    throw new Error('Failed to create SecureChatIntegrationService: ' + (error as Error).message);
  }
}

/**
 * Secure chat adapter implementation
 */
export class SecureChatAdapter extends BaseChatAdapter {
  private channels: Map<string, EnhancedChatChannel> = new Map();
  private messages: Map<string, EnhancedChatMessage[]> = new Map();
  private users: Map<string, EnhancedChatUser> = new Map();
  private subscriptions: Map<string, Set<(message: EnhancedChatMessage) => void>> = new Map();
  private service: SecureChatIntegrationServiceInterface;

  /**
   * Create a new SecureChatAdapter
   * @param options Configuration options
   * @param serviceOverride Service implementation override (for testing)
   */
  constructor(options?: EnhancedChatProviderOptions, serviceOverride?: SecureChatIntegrationServiceInterface) {
    super(options);
    
    // Register additional features
    this.registerFeature('e2e_encryption');
    this.registerFeature('forward_secrecy');
    this.registerFeature('post_quantum_cryptography');
    
    // Set the service from the override or create a new one
    if (serviceOverride) {
      this.service = serviceOverride;
    } else {
      // Create a temporary service while the real one loads asynchronously
      this.service = this.createTemporaryService();
      
      // Asynchronously load the real service
      this.initializeService();
    }
  }
  
  /**
   * Create a temporary service that throws "not initialized" errors
   * Used while the real service is being loaded asynchronously
   */
  private createTemporaryService(): SecureChatIntegrationServiceInterface {
    // Return a temporary service that throws "not initialized" errors for all methods
    return {
      initialize: () => Promise.reject(new Error('Service not initialized')),
      connect: () => Promise.reject(new Error('Service not initialized')),
      disconnect: () => Promise.reject(new Error('Service not initialized')),
      isConnected: () => false,
      createChannel: () => Promise.reject(new Error('Service not initialized')),
      getChannels: () => Promise.reject(new Error('Service not initialized')),
      joinChannel: () => Promise.reject(new Error('Service not initialized')),
      leaveChannel: () => Promise.reject(new Error('Service not initialized')),
      sendMessage: () => Promise.reject(new Error('Service not initialized')),
      getMessages: () => Promise.reject(new Error('Service not initialized')),
      subscribeToMessages: () => () => {},
      subscribeToPresence: () => () => {},
      getActiveUsers: () => Promise.reject(new Error('Service not initialized')),
      editMessage: () => Promise.reject(new Error('Service not initialized')),
      deleteMessage: () => Promise.reject(new Error('Service not initialized')),
      createThread: () => Promise.reject(new Error('Service not initialized')),
      getThreadMessages: () => Promise.reject(new Error('Service not initialized')),
      subscribeToThreadMessages: () => () => {},
      addReaction: () => Promise.reject(new Error('Service not initialized')),
      removeReaction: () => Promise.reject(new Error('Service not initialized')),
      enableEncryption: () => {},
      isEncryptionEnabled: () => false,
      setPQCEnabled: () => {},
      isPQCEnabled: () => false,
      searchMessages: () => Promise.reject(new Error('Service not initialized'))
    };
  }
  
  /**
   * Asynchronously initialize the service
   */
  private async initializeService(): Promise<void> {
    try {
      const service = await createSecureChatService();
      this.service = service;
      logger.info('SecureChatAdapter service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SecureChatAdapter service', error);
    }
  }
  
  /**
   * Initialize protocol-specific capabilities.
   */
  protected initializeCapabilities(): ChatProviderCapabilities {
    return {
      messaging: true,
      channels: true,
      presence: true,
      attachments: true,
      reactions: true,
      threading: true,
      encryption: true,
      markdown: true,
      mentioning: true,
      deletion: true,
      editing: true,
      history: true,
      metadata: true,
      directMessaging: true,
      groupChat: true,
      fileAttachments: true,
      endToEndEncryption: true,
      messageHistory: true,
      presenceDetection: true,
      messageDeliveryStatus: true,
      messageReactions: true,
      messageThreads: true,
      userProfiles: true,
      channelManagement: true,
      messageSearch: true,
      p2pCommunication: false,
      offline: true,
      messageEditing: true,
      messageDeleting: true,
      readReceipts: true,
      typing: true,
      
      // Additional required fields
      search: true,
      read_receipts: true,
      mentions: true,
      e2e_encryption: true,
      forward_secrecy: true,
      pq_encryption: true,
      p2p: false,
      server_based: true,
      relay_based: false,
      persistent_history: true,
      message_expiry: true,
      sync: true
    };
  }

  /**
   * Initialize protocol-specific information.
   */
  protected initializeProtocolInfo(): ProtocolInfo {
    return {
      id: 'securechat',
      name: 'SecureChat',
      version: '1.0.0',
      description: 'End-to-end encrypted secure chat adapter',
      homepage: 'https://earth-alliance.org/securechat',
      documentation: 'https://earth-alliance.org/docs/securechat',
      isP2P: false,
      isServerless: false,
      isEncrypted: true,
      isFederated: false,
      isCensorshipResistant: true,
      isAnonymous: false,
      maintainers: ['Earth Alliance'],
      license: 'MIT',
      metadata: {
        features: [
          'e2e_encryption',
          'forward_secrecy',
          'pq_encryption'
        ]
      }
    };
  }
  
  /**
   * Connect to the secure chat service.
   * @param options - Configuration options (unused in this implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async connect(options?: Partial<EnhancedChatProviderOptions>): Promise<void> {
    if (this.isConnected()) {
      return;
    }
    
    try {
      logger.info('Connecting to SecureChat service...');
      this.updateConnectionStatus('connecting', { status: 'connecting' });
      
      // Use the service to connect
      await this.service.connect();
      
      this.updateConnectionStatus('connected', { 
        status: 'connected',
        connectedAt: Date.now()
      });
      
      logger.info('Connected to SecureChat service');
      this.events.emit('connected');
      
      // Create global channel if it doesn't exist
      const channels = await this.getChannels();
      if (!channels.some(channel => channel.id === 'global')) {
        await this.createChannel('Global', 'global', []);
      }
      
    } catch (error) {
      logger.error('Failed to connect to SecureChat service:', error);
      this.updateConnectionStatus('error', { 
        status: 'error', 
        errorMessage: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
      });
      throw error;
    }
  }
  
  /**
   * Disconnect from the secure chat service.
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      return;
    }
    
    try {
      logger.info('Disconnecting from SecureChat service...');
      this.updateConnectionStatus('disconnecting', { status: 'disconnecting' });
      
      // Use the service to disconnect
      await this.service.disconnect();
      
      this.updateConnectionStatus('disconnected', { status: 'disconnected' });
      
      logger.info('Disconnected from SecureChat service');
      this.events.emit('disconnected');
    } catch (error) {
      logger.error('Error disconnecting from SecureChat service:', error);
      throw error;
    }
  }
  
  /**
   * Check if connected to the secure chat service.
   */
  public isConnected(): boolean {
    return this.service.isConnected();
  }
  
  /**
   * Send a message to a channel.
   */
  public async sendMessage(channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to send a message
      const result = await this.service.sendMessage(channelId, content, attachments);
      
      // Create a message object from the result
      const message: EnhancedChatMessage = {
        id: result.messageId,
        senderId: result.senderId || this.options?.userId || 'unknown',
        senderName: result.senderName || this.options?.userName || 'Unknown User',
        content: result.content,
        timestamp: result.timestamp || Date.now(),
        channelId: result.channelId,
        type: this.mapMessageType(result.status, Boolean(result.attachments && result.attachments.length > 0)),
        status: this.mapMessageStatus(result.status || 'sent'),
        threadId: result.threadId,
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      };
      
      // If attachments are provided, add them to the message
      if (result.attachments && result.attachments.length > 0) {
        message.attachments = result.attachments.map(file => ({
          id: file.id,
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type
        }));
      }
      
      // Add message to channel
      if (!this.messages.has(channelId)) {
        this.messages.set(channelId, []);
      }
      
      this.messages.get(channelId)?.push(message);
      
      // Update channel's last message
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.lastMessage = message;
      }
      
      // Notify subscribers
      const subscribers = this.subscriptions.get(channelId);
      if (subscribers) {
        for (const callback of subscribers) {
          callback(message);
        }
      }
      
      return message;
    } catch (error) {
      logger.error(`Error sending message to ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get messages from a channel.
   */
  public async getMessages(channelId: string, limit = 50, before?: number): Promise<EnhancedChatMessage[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to get messages
      const serviceMessages = await this.service.getMessages(channelId);
      
      // Convert to EnhancedChatMessage format
      const messages = serviceMessages.map(msg => ({
        id: msg.messageId,
        senderId: msg.senderId || 'unknown',
        senderName: msg.senderName || 'Unknown User',
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
        channelId,
        type: this.mapMessageType(msg.status, Boolean(msg.attachments && msg.attachments.length > 0)),
        status: this.mapMessageStatus(msg.status || 'sent'),
        attachments: msg.attachments?.map(attachment => ({
          id: attachment.id,
          name: attachment.name,
          url: attachment.url,
          size: attachment.size,
          type: attachment.type,
          metadata: {}
        })),
        threadId: msg.threadId,
        parentMessageId: msg.parentMessageId,
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      }));
      
      // Filter messages by timestamp if 'before' is provided
      const filteredMessages = before 
        ? messages.filter(msg => msg.timestamp < before)
        : messages;
      
      // Sort by timestamp (newest first) and limit
      return filteredMessages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      logger.error(`Error getting messages from ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe to messages in a channel.
   */
  public subscribeToMessages(channelId: string, callback: (message: EnhancedChatMessage) => void): () => void {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    // Use the service to subscribe to messages
    const unsubscribe = this.service.subscribeToMessages(channelId, (messageData) => {
      // Convert to EnhancedChatMessage format and call the callback
      const message: EnhancedChatMessage = {
        id: messageData.messageId,
        senderId: messageData.senderId || 'unknown',
        senderName: messageData.senderName || 'Unknown User',
        content: messageData.content,
        timestamp: messageData.timestamp || Date.now(),
        channelId,
        type: this.mapMessageType(messageData.status, Boolean(messageData.attachments && messageData.attachments.length > 0)),
        status: this.mapMessageStatus(messageData.status || 'sent'),
        attachments: messageData.attachments?.map(attachment => ({
          id: attachment.id,
          name: attachment.name,
          url: attachment.url,
          size: attachment.size,
          type: attachment.type,
          metadata: {}
        })),
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      };
      
      callback(message);
    });
    
    // Also maintain our local subscription system
    if (!this.subscriptions.has(channelId)) {
      this.subscriptions.set(channelId, new Set());
    }
    
    this.subscriptions.get(channelId)?.add(callback);
    
    // Return a combined unsubscribe function
    return () => {
      unsubscribe();
      this.subscriptions.get(channelId)?.delete(callback);
    };
  }
  
  /**
   * Create a channel.
   */
  public async createChannel(name: string, type: string, participants: string[]): Promise<EnhancedChatChannel> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to create a channel
      const result = await this.service.createChannel(name, type, [
        this.options?.userId || 'unknown',
        ...participants
      ]);
      
      // Create a local channel object
      const channel: EnhancedChatChannel = {
        id: result.channelId,
        name,
        type: this.mapChannelType(type),
        participants: [
          this.options?.userId || 'unknown',
          ...participants
        ],
        createdAt: result.createdAt || Date.now(),
        createdBy: result.createdBy || this.options?.userId || 'unknown',
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      };
      
      // Store the channel locally
      this.channels.set(result.channelId, channel);
      
      // Initialize empty message list
      this.messages.set(result.channelId, []);
      
      return channel;
    } catch (error) {
      logger.error(`Error creating channel ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Join a channel.
   */
  public async joinChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to join a channel
      await this.service.joinChannel(channelId);
      
      // Update local state
      const channel = this.channels.get(channelId);
      if (channel && !channel.participants.includes(this.options?.userId || 'unknown')) {
        channel.participants.push(this.options?.userId || 'unknown');
      }
    } catch (error) {
      logger.error(`Error joining channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Leave a channel.
   */
  public async leaveChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to leave a channel
      await this.service.leaveChannel(channelId);
      
      // Update local state
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.participants = channel.participants.filter(
          id => id !== (this.options?.userId || 'unknown')
        );
      }
    } catch (error) {
      logger.error(`Error leaving channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all available channels.
   */
  public async getChannels(): Promise<EnhancedChatChannel[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to get channels
      const serviceChannels = await this.service.getChannels();
      
      // Convert to EnhancedChatChannel format
      return serviceChannels.map(channel => ({
        id: channel.channelId,
        name: channel.name,
        type: this.mapChannelType(channel.type),
        participants: channel.participants || [],
        createdAt: channel.createdAt,
        createdBy: channel.createdBy || this.options?.userId || 'unknown',
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      }));
    } catch (error) {
      logger.error('Error getting channels:', error);
      throw error;
    }
  }
  
  /**
   * Get users in a channel.
   * @param channelId - The channel ID (unused in this implementation as we get all active users)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getUsers(channelId: string): Promise<EnhancedChatUser[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to get active users
      const activeUsers = await this.service.getActiveUsers();
      
      // Convert to EnhancedChatUser format
      return activeUsers.map(user => ({
        id: user.userId,
        name: user.userName,
        status: this.mapUserStatus(user.status),
        lastSeen: user.lastSeen || Date.now(),
        publicKey: user.publicKey || '',
        metadata: {
          protocol: 'securechat'
        }
      }));
    } catch (error) {
      logger.error(`Error getting users:`, error);
      throw error;
    }
  }
  
  /**
   * Get a user by ID.
   */
  public async getUserById(userId: string): Promise<EnhancedChatUser | null> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      const user = this.users.get(userId);
      
      if (user) {
        return user;
      }
      
      // Create a placeholder user if not found
      return {
        id: userId,
        name: `User ${userId}`,
        status: 'online'
      };
    } catch (error) {
      logger.error(`Error getting user by ID ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Subscribe to user presence in a channel.
   */
  public subscribeToUserPresence(channelId: string, callback: (users: EnhancedChatUser[]) => void): () => void {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    // Use the service to subscribe to presence
    return this.service.subscribeToPresence(channelId, (userData) => {
      // Convert to EnhancedChatUser format and call the callback
      const users = userData.map(user => ({
        id: user.userId,
        name: user.userName,
        status: this.mapUserStatus(user.status),
        lastSeen: user.lastSeen || Date.now(),
        publicKey: user.publicKey || '',
        metadata: {
          protocol: 'securechat'
        }
      }));
      
      callback(users);
    });
  }
  
  /**
   * Mark messages as read.
   */
  public async markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      const messages = this.messages.get(channelId) || [];
      
      // Update message status for each message
      for (const message of messages) {
        if (messageIds.includes(message.id)) {
          message.status = 'read';
          
          // Initialize or update readBy array
          if (!message.readBy) {
            message.readBy = [];
          }
          
          if (!message.readBy.includes(this.options?.userId || 'unknown')) {
            message.readBy.push(this.options?.userId || 'unknown');
          }
        }
      }
    } catch (error) {
      logger.error(`Error marking messages as read in ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Search messages.
   */
  public async searchMessages(query: string, channelId?: string, options?: SearchOptions): Promise<SearchResult> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to search messages
      const result = await this.service.searchMessages(query, channelId);
      
      // Convert to EnhancedChatMessage format
      const messages = result.messages.map(msg => ({
        id: msg.messageId,
        senderId: msg.senderId || 'unknown',
        senderName: msg.senderName || 'Unknown User',
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
        channelId: msg.channelId,
        type: this.mapMessageType(msg.status, false),
        status: this.mapMessageStatus(msg.status || 'sent'),
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      }));
      
      // Apply additional filters from options
      let filteredMessages = messages;
      
      if (options?.fromUserId) {
        filteredMessages = filteredMessages.filter(m => m.senderId === options.fromUserId);
      }
      
      if (options?.startDate) {
        filteredMessages = filteredMessages.filter(m => m.timestamp >= options.startDate!);
      }
      
      if (options?.endDate) {
        filteredMessages = filteredMessages.filter(m => m.timestamp <= options.endDate!);
      }
      
      if (options?.messageTypes && options.messageTypes.length > 0) {
        filteredMessages = filteredMessages.filter(m => m.type && options.messageTypes!.includes(m.type as string));
      }
      
      if (options?.channelIds && options.channelIds.length > 0) {
        filteredMessages = filteredMessages.filter(m => options.channelIds!.includes(m.channelId));
      }
      
      // Sort by timestamp
      const sortOrder = options?.sortOrder || 'desc';
      filteredMessages.sort((a, b) => 
        sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
      );
      
      // Apply pagination
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const paginatedResults = filteredMessages.slice(offset, offset + limit);
      
      return {
        messages: paginatedResults,
        totalResults: filteredMessages.length,
        hasMore: offset + limit < filteredMessages.length,
        nextOffset: offset + limit < filteredMessages.length ? offset + limit : undefined,
        executionTimeMs: result.executionTimeMs
      };
    } catch (error) {
      logger.error(`Error searching messages for "${query}":`, error);
      throw error;
    }
  }
  
  /**
   * Upload a file attachment.
   */
  public async uploadAttachment(file: File): Promise<{ id: string; url: string; name?: string; type?: string; size?: number }> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      throw error;
    }
  }
  
  /**
   * Edit a message.
   */
  public async editMessage(messageId: string, channelId: string, newContent: string): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to edit the message
      const result = await this.service.editMessage(messageId, channelId, newContent);
      
      // Convert to EnhancedChatMessage format
      const editedMessage: EnhancedChatMessage = {
        id: result.messageId,
        senderId: result.senderId || 'unknown',
        senderName: result.senderName || 'Unknown User',
        content: result.content,
        timestamp: result.timestamp || Date.now(),
        channelId: result.channelId,
        type: this.mapMessageType(result.status, false),
        status: this.mapMessageStatus(result.status || 'sent'),
        edited: true,
        editTimestamp: result.editedAt || Date.now(),
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      };
      
      // Update local message cache
      const messages = this.messages.get(channelId) || [];
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      if (messageIndex !== -1) {
        messages[messageIndex] = {
          ...messages[messageIndex],
          ...editedMessage
        };
      }
      
      // Update channel's last message if needed
      const channel = this.channels.get(channelId);
      if (channel && channel.lastMessage && channel.lastMessage.id === messageId) {
        channel.lastMessage = {
          ...channel.lastMessage,
          ...editedMessage
        };
      }
      
      return editedMessage;
    } catch (error) {
      logger.error(`Error editing message ${messageId} in channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a message.
   */
  public async deleteMessage(messageId: string, channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to delete the message
      await this.service.deleteMessage(messageId, channelId);
      
      // Update local message cache
      const messages = this.messages.get(channelId) || [];
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      if (messageIndex !== -1) {
        messages[messageIndex].status = 'deleted';
        messages[messageIndex].content = '[Message deleted]';
      }
      
      // Update channel's last message if needed
      const channel = this.channels.get(channelId);
      if (channel && channel.lastMessage && channel.lastMessage.id === messageId) {
        if (messages.length > 1) {
          // Find the most recent non-deleted message
          const lastMessage = [...messages]
            .filter(m => m.id !== messageId && m.status !== 'deleted')
            .sort((a, b) => b.timestamp - a.timestamp)[0];
          
          if (lastMessage) {
            channel.lastMessage = lastMessage;
          } else {
            channel.lastMessage = undefined;
          }
        } else {
          channel.lastMessage = undefined;
        }
      }
    } catch (error) {
      logger.error(`Error deleting message ${messageId} in channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Reply to a message.
   */
  public async replyToMessage(messageId: string, channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Create a new message as a reply
      const message = await this.sendMessage(channelId, content, attachments);
      
      // Set reply metadata
      message.replyTo = messageId;
      
      return message;
    } catch (error) {
      logger.error(`Error replying to message ${messageId} in channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Forward a message to another channel.
   */
  public async forwardMessage(messageId: string, sourceChannelId: string, targetChannelId: string): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      const sourceMessages = this.messages.get(sourceChannelId) || [];
      const originalMessage = sourceMessages.find(m => m.id === messageId);
      
      if (!originalMessage) {
        throw new Error(`Message ${messageId} not found in channel ${sourceChannelId}`);
      }
      
      // Create forwarded content
      const forwardedContent = `[Forwarded from ${originalMessage.senderName}]: ${originalMessage.content}`;
      
      // Send as new message
      // Convert attachments to File objects if they exist
      const attachmentFiles: File[] = [];
      if (originalMessage.attachments && originalMessage.attachments.length > 0) {
        // Log a warning about attachment conversion
        logger.warn('Converting attachment objects to File objects for forwarding, this may lose some metadata');
      }
      
      return this.sendMessage(targetChannelId, forwardedContent, attachmentFiles);
    } catch (error) {
      logger.error(`Error forwarding message ${messageId} from ${sourceChannelId} to ${targetChannelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Add a reaction to a message.
   */
  public async addReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to add the reaction
      await this.service.addReaction(messageId, channelId, reaction);
      
      // Update local message cache
      const messages = this.messages.get(channelId) || [];
      const message = messages.find(m => m.id === messageId);
      
      if (message) {
        // Initialize reactions array if it doesn't exist
        if (!message.reactions) {
          message.reactions = [];
        }
        
        // Check if user already reacted with this reaction
        const existingReaction = message.reactions.find(
          r => r.userId === (this.options?.userId || 'unknown') && r.type === reaction
        );
        
        if (!existingReaction) {
          // Add the reaction
          message.reactions.push({
            userId: this.options?.userId || 'unknown',
            type: reaction,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      logger.error(`Error adding reaction to message ${messageId} in channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove a reaction from a message.
   */
  public async removeReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to remove the reaction
      await this.service.removeReaction(messageId, channelId, reaction);
      
      // Update local message cache
      const messages = this.messages.get(channelId) || [];
      const message = messages.find(m => m.id === messageId);
      
      if (message && message.reactions) {
        // Remove the reaction
        message.reactions = message.reactions.filter(
          r => !(r.userId === (this.options?.userId || 'unknown') && r.type === reaction)
        );
      }
    } catch (error) {
      logger.error(`Error removing reaction from message ${messageId} in channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a thread.
   */
  public async createThread(messageId: string, channelId: string, content: string): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to create a thread
      const result = await this.service.createThread(messageId, channelId, content);
      
      // Convert to EnhancedChatMessage format
      const threadMessage: EnhancedChatMessage = {
        id: result.messageId,
        senderId: result.senderId || this.options?.userId || 'unknown',
        senderName: result.senderName || this.options?.userName || 'Unknown User',
        content: result.content,
        timestamp: result.timestamp || Date.now(),
        channelId: result.channelId,
        threadId: result.threadId,
        type: this.mapMessageType(result.status, false),
        status: this.mapMessageStatus(result.status || 'sent'),
        metadata: {
          encrypted: true,
          protocol: 'securechat',
          isThreadStarter: true,
          parentMessageId: result.parentMessageId // Store parent message ID in metadata
        }
      };
      
      // Update parent message
      const messages = this.messages.get(channelId) || [];
      const parentMessage = messages.find(m => m.id === messageId);
      
      if (parentMessage && !parentMessage.threadId) {
        parentMessage.threadId = result.threadId;
      }
      
      // Initialize thread message list
      if (!this.messages.has(result.threadId)) {
        this.messages.set(result.threadId, []);
      }
      
      this.messages.get(result.threadId)?.push(threadMessage);
      
      return threadMessage;
    } catch (error) {
      logger.error(`Error creating thread for message ${messageId} in channel ${channelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get thread messages.
   */
  public async getThreadMessages(threadId: string, limit?: number, before?: number): Promise<EnhancedChatMessage[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    try {
      // Use the service to get thread messages
      const serviceMessages = await this.service.getThreadMessages(threadId);
      
      // Convert to EnhancedChatMessage format
      const messages = serviceMessages.map(msg => ({
        id: msg.messageId,
        senderId: msg.senderId || 'unknown',
        senderName: msg.senderName || 'Unknown User',
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
        channelId: msg.channelId,
        threadId: msg.threadId,
        type: this.mapMessageType(msg.status, false),
        status: this.mapMessageStatus(msg.status || 'sent'),
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      }));
      
      // Filter messages by timestamp if 'before' is provided
      const filteredMessages = before 
        ? messages.filter(msg => msg.timestamp < before)
        : messages;
      
      // Sort by timestamp (newest first) and limit
      return filteredMessages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit || 50);
    } catch (error) {
      logger.error(`Error getting messages for thread ${threadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe to thread messages.
   */
  public subscribeToThreadMessages(threadId: string, callback: (message: EnhancedChatMessage) => void): () => void {
    if (!this.isConnected()) {
      throw new Error('Not connected to SecureChat service');
    }
    
    // Use the service to subscribe to thread messages
    const unsubscribe = this.service.subscribeToThreadMessages(threadId, (messageData) => {
      // Convert to EnhancedChatMessage format and call the callback
      const message: EnhancedChatMessage = {
        id: messageData.messageId,
        senderId: messageData.senderId || 'unknown',
        senderName: messageData.senderName || 'Unknown User',
        content: messageData.content,
        timestamp: messageData.timestamp || Date.now(),
        channelId: messageData.channelId,
        threadId: messageData.threadId,
        type: this.mapMessageType(messageData.status, false),
        status: this.mapMessageStatus(messageData.status || 'sent'),
        metadata: {
          encrypted: true,
          protocol: 'securechat'
        }
      };
      
      callback(message);
    });
    
    // Also maintain our local subscription system
    if (!this.subscriptions.has(threadId)) {
      this.subscriptions.set(threadId, new Set());
    }
    
    this.subscriptions.get(threadId)?.add(callback);
    
    // Return a combined unsubscribe function
    return () => {
      unsubscribe();
      this.subscriptions.get(threadId)?.delete(callback);
    };
  }
  
  /**
   * Get the current user.
   */
  public getCurrentUser(): EnhancedChatUser {
    const userId = this.options?.userId || 'unknown';
    const user = this.users.get(userId);
    
    if (user) {
      return user;
    }
    
    // Create and return a default user
    return {
      id: userId,
      name: this.options?.userName || 'Unknown User',
      status: 'online',
      publicKey: this.options?.publicKey
    };
  }
  
  /**
   * Enable or disable encryption
   */
  public setEncryptionEnabled(enabled: boolean): void {
    try {
      // Use the service to enable/disable encryption
      this.service.enableEncryption(enabled);
      
      // Update adapter state
      this.options.encryptionEnabled = enabled;
      
      logger.info(`${enabled ? 'Enabling' : 'Disabling'} encryption for SecureChat`);
    } catch (error) {
      logger.error('Error setting encryption status:', error);
      throw error;
    }
  }
  
  /**
   * Check if encryption is enabled
   */
  public isEncryptionEnabled(): boolean {
    return this.service.isEncryptionEnabled();
  }
  
  /**
   * Enable or disable post-quantum cryptography
   */
  public setPQCEnabled(enabled: boolean): void {
    try {
      // Use the service to enable/disable PQC
      this.service.setPQCEnabled(enabled);
      
      // Update adapter state
      this.options.pqcEnabled = enabled;
      
      logger.info(`${enabled ? 'Enabling' : 'Disabling'} post-quantum cryptography for SecureChat`);
    } catch (error) {
      logger.error('Error setting PQC status:', error);
      throw error;
    }
  }
  
  /**
   * Check if post-quantum cryptography is enabled
   */
  public isPQCEnabled(): boolean {
    return this.service.isPQCEnabled();
  }
  
  /**
   * Map a string status to UserStatus enum
   */
  private mapUserStatus(status: string): UserStatus {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'online';
      case 'away':
        return 'away';
      case 'busy':
        return 'busy';
      case 'offline':
        return 'offline';
      case 'invisible':
        return 'invisible';
      default:
        return 'online'; // Default to online if unknown status
    }
  }
  
  /**
   * Map a string status to MessageStatus enum
   */
  private mapMessageStatus(status: string): MessageStatus {
    switch (status?.toLowerCase()) {
      case 'sending':
        return 'sending';
      case 'sent':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'read':
        return 'read';
      case 'failed':
        return 'failed';
      case 'deleted':
        return 'deleted';
      default:
        return 'sent'; // Default to sent if unknown status
    }
  }
  
  /**
   * Map a string type to MessageType enum
   */
  private mapMessageType(type: string, hasAttachments: boolean): MessageType {
    if (hasAttachments) {
      return 'file';
    }
    
    switch (type?.toLowerCase()) {
      case 'text':
        return 'text';
      case 'file':
        return 'file';
      case 'system':
        return 'system';
      case 'intelligence':
        return 'intelligence';
      case 'alert':
        return 'alert';
      case 'audio':
        return 'audio';
      case 'video':
        return 'video';
      case 'location':
        return 'location';
      case 'code':
        return 'code';
      case 'command':
        return 'command';
      case 'event':
        return 'event';
      default:
        return 'text'; // Default to text if unknown type
    }
  }
  
  /**
   * Map a string type to ChannelType
   */
  private mapChannelType(type: string): ChannelType {
    switch (type?.toLowerCase()) {
      case 'direct':
        return 'direct';
      case 'group':
        return 'group';
      case 'team':
        return 'team';
      case 'global':
        return 'global';
      case 'broadcast':
        return 'broadcast';
      case 'thread':
        return 'thread';
      case 'encrypted':
        return 'encrypted';
      case 'temporary':
        return 'temporary';
      default:
        return 'group'; // Default to group if unknown type
    }
  }
}
