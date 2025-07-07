/**
 * GunChatAdapter.ts
 * 
 * Adapter for the Gun.js chat implementation that conforms to the unified ChatProviderInterface.
 * This adapter extends BaseChatAdapter and implements the required methods for Gun.js.
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
import { gun as gunInstance } from '../../gun-db';
import { uploadToIPFS, getIPFSGatewayUrl } from '../../ipfs-client';
import { P2PConnection } from '../../webrtc-signaling';
import { logger } from '../../../utils';

// Define a minimal GunJS type interface for TypeScript
interface GunInstance {
  get: (key: string) => GunInstance;
  put: (data: Record<string, unknown>) => GunInstance;
  on: (callback: (data: unknown, key: string) => void) => GunInstance;
  once: (callback: (data: unknown, key: string) => void) => GunInstance;
  map: () => GunInstance;
  set: (data: unknown) => GunInstance;
  off: () => GunInstance;
}

/**
 * Options specific to the Gun chat adapter.
 */
export interface GunChatAdapterOptions extends EnhancedChatProviderOptions {
  gunInstance?: any; // Using any to avoid type conflicts
  useWebRTC?: boolean;
  useSEA?: boolean;
}

/**
 * Adapter for Gun.js that implements the ChatProviderInterface.
 */
export class GunChatAdapter extends BaseChatAdapter {
  private gun: any; // Using any to avoid type conflicts
  private p2pConnections: Map<string, P2PConnection> = new Map();
  private messageSubscriptions: Map<string, () => void> = new Map();
  private presenceSubscriptions: Map<string, () => void> = new Map();
  private useWebRTC: boolean;
  private useSEA: boolean;

  constructor(options?: GunChatAdapterOptions) {
    super(options);
    
    this.gun = options?.gunInstance || gunInstance;
    this.useWebRTC = options?.useWebRTC || false;
    this.useSEA = options?.useSEA || false;
    
    // Register additional features based on options
    if (this.useWebRTC) {
      this.registerFeature('p2p');
    }
    
    if (this.useSEA) {
      this.registerFeature('encryption');
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
      reactions: false,
      threading: false,
      encryption: this.useSEA,
      markdown: true,
      mentioning: false,
      deletion: true,
      editing: false,
      history: true,
      metadata: true,
      directMessaging: true,
      groupChat: true,
      fileAttachments: true,
      endToEndEncryption: this.useSEA,
      messageHistory: true,
      presenceDetection: true,
      messageDeliveryStatus: true,
      messageReactions: false,
      messageThreads: false,
      userProfiles: true,
      channelManagement: true,
      messageSearch: true,
      p2pCommunication: this.useWebRTC,
      offline: true,
      messageEditing: false,
      messageDeleting: true,
      readReceipts: true,
      typing: false,
      
      // Additional required fields
      search: true,
      read_receipts: true,
      mentions: false,
      e2e_encryption: this.useSEA,
      forward_secrecy: false,
      pq_encryption: false,
      p2p: this.useWebRTC,
      server_based: false,
      relay_based: true,
      persistent_history: true,
      message_expiry: false,
      sync: true
    };
  }

  /**
   * Initialize protocol-specific information.
   */
  protected initializeProtocolInfo(): ProtocolInfo {
    return {
      id: 'gun',
      name: 'Gun.js',
      version: '0.2020.1235',
      description: 'Decentralized graph database with P2P capabilities',
      homepage: 'https://gun.eco',
      documentation: 'https://gun.eco/docs',
      isP2P: this.useWebRTC,
      isServerless: false,
      isEncrypted: this.useSEA,
      isFederated: true,
      isCensorshipResistant: true,
      isAnonymous: true,
      maintainers: ['Gun.js Community'],
      license: 'MIT',
      metadata: {
        storageType: 'graph',
        transportLayer: this.useWebRTC ? 'WebRTC/WebSockets' : 'WebSockets',
        persistence: true,
        replication: true
      }
    };
  }

  /**
   * Connect to the Gun.js network.
   * @param options - Configuration options (unused in this implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async connect(options?: Partial<EnhancedChatProviderOptions>): Promise<void> {
    try {
      this.updateConnectionStatus('connecting', { status: 'connecting' });
      
      // Apply any new options
      if (options) {
        this.options = { ...this.options, ...options };
      }
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update connection status
      this.updateConnectionStatus('connected', {
        status: 'connected',
        connectedAt: Date.now(),
        latency: 50, // Mock latency
        endpoint: 'gun',
        protocol: this.useWebRTC ? 'WebRTC/WebSockets' : 'WebSockets',
        encryptionEnabled: this.useSEA
      });
      
      logger.info('Connected to Gun.js network');
      this.events.emit('connected');
    } catch (error) {
      this.updateConnectionStatus('error', {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  /**
   * Disconnect from the Gun.js network.
   */
  public async disconnect(): Promise<void> {
    try {
      this.updateConnectionStatus('disconnecting', { status: 'disconnecting' });
      
      // Clean up subscriptions
      this.messageSubscriptions.forEach(unsubscribe => unsubscribe());
      this.messageSubscriptions.clear();
      
      this.presenceSubscriptions.forEach(unsubscribe => unsubscribe());
      this.presenceSubscriptions.clear();
      
      // Close P2P connections
      this.p2pConnections.forEach(conn => conn.close());
      this.p2pConnections.clear();
      
      // Update connection status
      this.updateConnectionStatus('disconnected', { status: 'disconnected' });
      
      logger.info('Disconnected from Gun.js network');
      this.events.emit('disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Gun.js network:', error);
      throw error;
    }
  }

  /**
   * Check if connected to the Gun.js network.
   */
  public isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  /**
   * Reconnect to the Gun.js network.
   */
  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  /**
   * Send a message to a channel.
   */
  public async sendMessage(channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Handle attachments if provided
      const attachmentData = attachments && attachments.length > 0
        ? await Promise.all(attachments.map(async file => {
            const result = await this.uploadAttachment(file);
            return {
              id: result.id,
              name: file.name,
              url: result.url,
              size: file.size,
              type: file.type,
              metadata: {}
            };
          }))
        : [];
      
      const message: EnhancedChatMessage = {
        id: messageId,
        senderId: this.options.userId || 'unknown',
        senderName: this.options.userName || 'Unknown User',
        content,
        timestamp: Date.now(),
        channelId,
        type: attachmentData.length > 0 ? 'file' : 'text',
        status: 'sending',
        attachments: attachmentData,
        metadata: {
          source: 'gun',
          encrypted: this.useSEA
        }
      };
      
      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update message status to sent
      message.status = 'sent';
      
      // Store message in Gun.js
      this.gun.get('channels').get(channelId).get('messages').get(messageId).put(this.convertToGunMessage(message));
      
      logger.info(`Message sent to channel ${channelId}`);
      
      return message;
    } catch (error) {
      logger.error(`Error sending message to channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages from a channel.
   */
  public async getMessages(channelId: string, limit: number = 50, before?: number): Promise<EnhancedChatMessage[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      return new Promise<EnhancedChatMessage[]>((resolve, reject) => {
        const messages: EnhancedChatMessage[] = [];
        
        this.gun.get('channels').get(channelId).get('messages').map().once((data: any, key: string) => {
          if (data && typeof data === 'object') {
            const message = this.convertFromGunMessage(data, channelId);
            
            // Filter by timestamp if 'before' is specified
            if (before && message.timestamp >= before) {
              return;
            }
            
            messages.push(message);
            
            // Resolve once we have enough messages or Gun.js has processed all messages
            if (messages.length >= limit) {
              resolve(messages.sort((a, b) => b.timestamp - a.timestamp));
            }
          }
        });
        
        // Set a timeout to resolve after a reasonable time
        setTimeout(() => {
          resolve(messages.sort((a, b) => b.timestamp - a.timestamp));
        }, 1000);
      });
    } catch (error) {
      logger.error(`Error getting messages from channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to messages in a channel.
   */
  public subscribeToMessages(channelId: string, callback: (message: EnhancedChatMessage) => void): () => void {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    // Unsubscribe from previous subscription for this channel if exists
    if (this.messageSubscriptions.has(channelId)) {
      const unsubscribe = this.messageSubscriptions.get(channelId);
      if (unsubscribe) {
        unsubscribe();
      }
      this.messageSubscriptions.delete(channelId);
    }
    
    // Create a new subscription
    const listener = this.gun.get('channels').get(channelId).get('messages').map().on((data: any, key: string) => {
      if (data && typeof data === 'object') {
        const message = this.convertFromGunMessage(data, channelId);
        callback(message);
      }
    });
    
    // Store the unsubscribe function
    const unsubscribe = () => {
      listener.off();
      this.messageSubscriptions.delete(channelId);
    };
    
    this.messageSubscriptions.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Create a channel.
   */
  public async createChannel(name: string, type: string, participants: string[]): Promise<EnhancedChatChannel> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      const channelId = `channel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const channel: EnhancedChatChannel = {
        id: channelId,
        name,
        type: this.mapChannelType(type),
        participants,
        createdAt: Date.now(),
        createdBy: this.options.userId || 'unknown',
        metadata: {
          source: 'gun'
        }
      };
      
      // Store the channel in Gun.js
      this.gun.get('channels').get(channelId).put(this.convertToGunChannel(channel));
      
      logger.info(`Channel ${name} created with ID ${channelId}`);
      
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
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      // Get the channel
      const channel = await this.getChannelDetails(channelId);
      
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }
      
      // Add current user to participants if not already there
      if (!channel.participants.includes(this.options.userId || 'unknown')) {
        channel.participants.push(this.options.userId || 'unknown');
        
        // Update the channel in Gun.js
        this.gun.get('channels').get(channelId).get('participants').put(channel.participants);
      }
      
      logger.info(`Joined channel ${channelId}`);
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
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      // Get the channel
      const channel = await this.getChannelDetails(channelId);
      
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }
      
      // Remove current user from participants if present
      const userIndex = channel.participants.indexOf(this.options.userId || 'unknown');
      if (userIndex >= 0) {
        channel.participants.splice(userIndex, 1);
        
        // Update the channel in Gun.js
        this.gun.get('channels').get(channelId).get('participants').put(channel.participants);
      }
      
      logger.info(`Left channel ${channelId}`);
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
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      return new Promise<EnhancedChatChannel[]>((resolve, reject) => {
        const channels: EnhancedChatChannel[] = [];
        
        this.gun.get('channels').map().once((data: any, key: string) => {
          if (data && typeof data === 'object') {
            const channel = this.convertFromGunChannel(data, key);
            channels.push(channel);
          }
        });
        
        // Set a timeout to resolve after a reasonable time
        setTimeout(() => {
          resolve(channels);
        }, 1000);
      });
    } catch (error) {
      logger.error('Error getting channels:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific channel.
   */
  public async getChannelDetails(channelId: string): Promise<EnhancedChatChannel> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      return new Promise<EnhancedChatChannel>((resolve, reject) => {
        this.gun.get('channels').get(channelId).once((data: any) => {
          if (data && typeof data === 'object') {
            resolve(this.convertFromGunChannel(data, channelId));
          } else {
            reject(new Error(`Channel ${channelId} not found`));
          }
        });
      });
    } catch (error) {
      logger.error(`Error getting channel details for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get users in a channel.
   * @param channelId - The channel ID to get users for
   */
  public async getUsers(channelId: string): Promise<EnhancedChatUser[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      // Get the channel
      const channel = await this.getChannelDetails(channelId);
      
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }
      
      // Get user details for each participant
      const userPromises = channel.participants.map(userId => this.getUserById(userId));
      
      // Wait for all user details to be fetched
      const users = await Promise.all(userPromises);
      
      // Filter out null values (users not found)
      return users.filter((user): user is EnhancedChatUser => user !== null);
    } catch (error) {
      logger.error(`Error getting users for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get a user by ID.
   */
  public async getUserById(userId: string): Promise<EnhancedChatUser | null> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      return new Promise<EnhancedChatUser | null>((resolve, reject) => {
        this.gun.get('users').get(userId).once((data: any) => {
          if (data && typeof data === 'object') {
            resolve(this.convertFromGunUser(data, userId));
          } else {
            // If user not found, create a default user object
            const defaultUser: EnhancedChatUser = {
              id: userId,
              name: userId.substring(0, 8),
              status: 'offline'
            };
            resolve(defaultUser);
          }
        });
      });
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
      throw new Error('Not connected to Gun.js network');
    }
    
    // Unsubscribe from previous subscription for this channel if exists
    if (this.presenceSubscriptions.has(channelId)) {
      const unsubscribe = this.presenceSubscriptions.get(channelId);
      if (unsubscribe) {
        unsubscribe();
      }
      this.presenceSubscriptions.delete(channelId);
    }
    
    // Create a new subscription
    const updatePresence = () => {
      this.getUsers(channelId).then(users => {
        callback(users);
      }).catch(error => {
        logger.error(`Error in presence subscription for channel ${channelId}:`, error);
      });
    };
    
    // Initial update
    updatePresence();
    
    // Setup a periodic update
    const intervalId = setInterval(updatePresence, 30000);
    
    // Store the unsubscribe function
    const unsubscribe = () => {
      clearInterval(intervalId);
      this.presenceSubscriptions.delete(channelId);
    };
    
    this.presenceSubscriptions.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Mark messages as read.
   */
  public async markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      // Mark each message as read
      for (const messageId of messageIds) {
        this.gun.get('channels').get(channelId).get('messages').get(messageId).get('status').put('read');
        
        // Add current user to readBy list if it exists
        this.gun.get('channels').get(channelId).get('messages').get(messageId).get('readBy').once((readBy: string[] | null) => {
          const newReadBy = Array.isArray(readBy) ? [...readBy] : [];
          
          if (!newReadBy.includes(this.options.userId || 'unknown')) {
            newReadBy.push(this.options.userId || 'unknown');
            this.gun.get('channels').get(channelId).get('messages').get(messageId).get('readBy').put(newReadBy);
          }
        });
      }
      
      logger.info(`Marked ${messageIds.length} messages as read in channel ${channelId}`);
    } catch (error) {
      logger.error(`Error marking messages as read in channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Search messages.
   */
  public async searchMessages(query: string, channelId?: string, options?: SearchOptions): Promise<SearchResult> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Gun.js network');
    }
    
    try {
      const startTime = Date.now();
      let allMessages: EnhancedChatMessage[] = [];
      
      if (channelId) {
        // Search in specific channel
        allMessages = await this.getMessages(channelId, 1000);
      } else {
        // Search in all channels
        const channels = await this.getChannels();
        for (const channel of channels) {
          const messages = await this.getMessages(channel.id, 1000);
          allMessages.push(...messages);
        }
      }
      
      // Filter by query
      let filteredMessages = allMessages.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      );
      
      // Apply additional filters from options
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
        filteredMessages = filteredMessages.filter(m => options.messageTypes!.includes(m.type as string));
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
        executionTimeMs: Date.now() - startTime
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
    try {
      // Upload the file to IPFS
      const cid = await uploadToIPFS(file);
      
      // Get the gateway URL for the uploaded file
      const url = getIPFSGatewayUrl(cid);
      
      return {
        id: cid,
        url,
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
   * Convert an EnhancedChatMessage to a Gun.js format.
   */
  private convertToGunMessage(message: EnhancedChatMessage): any {
    return {
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp,
      channelId: message.channelId,
      type: message.type,
      status: message.status,
      attachments: message.attachments,
      readBy: message.readBy || [],
      edited: message.edited || false,
      editTimestamp: message.editTimestamp,
      encrypted: this.useSEA
    };
  }

  /**
   * Convert a Gun.js message to an EnhancedChatMessage.
   */
  private convertFromGunMessage(data: any, channelId: string): EnhancedChatMessage {
    return {
      id: data.id || 'unknown',
      senderId: data.senderId || 'unknown',
      senderName: data.senderName || 'Unknown User',
      content: data.content || '',
      timestamp: data.timestamp || Date.now(),
      channelId: channelId,
      type: this.mapMessageType(data.type, Boolean(data.attachments && data.attachments.length > 0)),
      status: this.mapMessageStatus(data.status || 'sent'),
      attachments: data.attachments || [],
      readBy: data.readBy || [],
      edited: data.edited || false,
      editTimestamp: data.editTimestamp,
      metadata: {
        source: 'gun',
        encrypted: data.encrypted || false
      }
    };
  }

  /**
   * Convert an EnhancedChatChannel to a Gun.js format.
   */
  private convertToGunChannel(channel: EnhancedChatChannel): any {
    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      participants: channel.participants,
      createdAt: channel.createdAt,
      createdBy: channel.createdBy,
      description: channel.description
    };
  }

  /**
   * Convert a Gun.js channel to an EnhancedChatChannel.
   */
  private convertFromGunChannel(data: any, channelId: string): EnhancedChatChannel {
    return {
      id: data.id || channelId,
      name: data.name || 'Unnamed Channel',
      type: this.mapChannelType(data.type || 'group'),
      participants: Array.isArray(data.participants) ? data.participants : [],
      createdAt: data.createdAt || Date.now(),
      createdBy: data.createdBy || 'unknown',
      description: data.description,
      metadata: {
        source: 'gun'
      }
    };
  }

  /**
   * Convert a Gun.js user to an EnhancedChatUser.
   */
  private convertFromGunUser(data: any, userId: string): EnhancedChatUser {
    return {
      id: userId,
      name: data.name || userId.substring(0, 8),
      status: this.mapUserStatus(data.status || 'offline'),
      lastSeen: data.lastSeen || 0,
      metadata: {
        source: 'gun'
      }
    };
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
        return 'offline'; // Default to offline if unknown status
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
