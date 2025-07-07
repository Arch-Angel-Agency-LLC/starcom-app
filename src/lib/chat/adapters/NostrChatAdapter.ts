/**
 * NostrChatAdapter.ts
 * 
 * Adapter for the Nostr protocol that conforms to the unified ChatProviderInterface.
 * This adapter extends BaseChatAdapter and implements the required methods for Nostr.
 */

import { BaseChatAdapter } from './BaseChatAdapter';
import { 
  EnhancedChatMessage, 
  EnhancedChatChannel, 
  EnhancedChatUser,
  EnhancedChatProviderOptions,
  ConnectionStatus,
  ConnectionDetails,
  MessageStatus
} from '../types/ChatAdapterTypes';
import { ChatProviderCapabilities, ProtocolInfo } from '../types/ProtocolTypes';
import { SearchOptions, SearchResult } from '../interfaces/ChatProviderInterface';
import nostrService, { NostrMessage, NostrTeamChannel } from '../../../services/nostrService';
import { logger } from '../../../utils';
import { AgencyType, ClearanceLevel } from '../../../types';

/**
 * Options specific to the Nostr chat adapter.
 */
export interface NostrChatAdapterOptions extends EnhancedChatProviderOptions {
  relays?: string[];
  userDID?: string;
  agency?: AgencyType;
  clearanceLevel?: ClearanceLevel;
}

/**
 * Adapter for Nostr that implements the ChatProviderInterface.
 */
export class NostrChatAdapter extends BaseChatAdapter {
  private messageSubscriptions: Map<string, () => void> = new Map();
  private presenceSubscriptions: Map<string, () => void> = new Map();
  private relays: string[] = [];
  private userDID: string | null = null;
  private agency: AgencyType = 'EARTH_ALLIANCE' as AgencyType;
  private clearanceLevel: ClearanceLevel = 'UNCLASSIFIED';
  private channelSubscriptions: Map<string, NodeJS.Timeout> = new Map();

  constructor(options?: NostrChatAdapterOptions) {
    super(options);
    
    this.relays = options?.relays || [];
    this.userDID = options?.userDID || null;
    this.agency = options?.agency || 'EARTH_ALLIANCE' as AgencyType;
    this.clearanceLevel = options?.clearanceLevel || 'UNCLASSIFIED';
    
    // Register additional features
    this.registerFeature('resistance_communications');
    this.registerFeature('earth_alliance_protocols');
    this.registerFeature('evidence_collection');
  }

  /**
   * Initialize protocol-specific capabilities.
   */
  protected initializeCapabilities(): ChatProviderCapabilities {
    return {
      messaging: true,
      channels: true,
      presence: false,
      attachments: false,
      reactions: false,
      threading: false,
      encryption: true,
      markdown: true,
      mentioning: true,
      deletion: false,
      editing: false,
      history: true,
      metadata: true,
      directMessaging: true,
      groupChat: true,
      fileAttachments: false,
      endToEndEncryption: true,
      messageHistory: true,
      presenceDetection: false,
      messageDeliveryStatus: false,
      messageReactions: false,
      messageThreads: false,
      userProfiles: true,
      channelManagement: true,
      messageSearch: false,
      p2pCommunication: false,
      offline: false,
      messageEditing: false,
      messageDeleting: false,
      readReceipts: false,
      typing: false,
      
      // Additional required fields
      search: false,
      read_receipts: false,
      mentions: true,
      e2e_encryption: true,
      forward_secrecy: true,
      pq_encryption: true,
      p2p: false,
      server_based: false,
      relay_based: true,
      persistent_history: true,
      message_expiry: false,
      sync: false
    };
  }

  /**
   * Initialize protocol-specific information.
   */
  protected initializeProtocolInfo(): ProtocolInfo {
    return {
      id: 'nostr',
      name: 'Nostr',
      version: '1.0.0',
      description: 'Nostr (Notes and Other Stuff Transmitted by Relays) protocol adapter',
      homepage: 'https://nostr.com',
      documentation: 'https://github.com/nostr-protocol/nips',
      isP2P: false,
      isServerless: true,
      isEncrypted: true,
      isFederated: true,
      isCensorshipResistant: true,
      isAnonymous: true,
      maintainers: ['Earth Alliance'],
      license: 'MIT',
      metadata: {
        features: [
          'resistance_communications',
          'earth_alliance_protocols',
          'evidence_collection',
          'encryption',
          'decentralization'
        ]
      }
    };
  }

  /**
   * Connect to the Nostr network.
   */
  public async connect(options?: Partial<NostrChatAdapterOptions>): Promise<void> {
    if (this.isConnected()) {
      logger.info('Already connected to Nostr network');
      return;
    }
    
    try {
      logger.info('Connecting to Nostr network...');
      this.updateConnectionStatus('connecting', { 
        status: 'connecting', 
        errorMessage: 'Connecting to Nostr network'
      });
      
      // Update options if provided
      if (options) {
        if (options.relays) {
          this.relays = options.relays;
        }
        if (options.userDID) {
          this.userDID = options.userDID;
        }
        if (options.agency) {
          this.agency = options.agency;
        }
        if (options.clearanceLevel) {
          this.clearanceLevel = options.clearanceLevel;
        }
      }
      
      // Validate user identifier
      if (!this.userDID && !this.options.userId) {
        throw new Error('User DID or user ID is required to connect to Nostr');
      }
      
      // Initialize NostrService
      await nostrService.initialize();
      
      // Add custom relays if provided
      if (this.relays.length > 0) {
        for (const relay of this.relays) {
          await nostrService.addRelay(relay);
        }
      }
      
      this.updateConnectionStatus('connected', { 
        status: 'connected', 
        connectedAt: Date.now(),
        endpoint: 'nostr',
        protocol: 'relay',
        encryptionEnabled: true
      });
      logger.info('Connected to Nostr network');
      
      // Emit connected event
      this.events.emit('connected');
    } catch (error) {
      logger.error('Failed to connect to Nostr network:', error);
      this.updateConnectionStatus('error', { 
        status: 'error', 
        errorMessage: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
      });
      throw error;
    }
  }

  /**
   * Disconnect from the Nostr network.
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      logger.info('Not connected to Nostr network');
      return;
    }
    
    try {
      logger.info('Disconnecting from Nostr network...');
      this.updateConnectionStatus('reconnecting', { status: 'reconnecting', errorMessage: 'Reconnecting to Nostr network' });
      
      // Clean up subscriptions
      for (const unsubscribe of this.messageSubscriptions.values()) {
        unsubscribe();
      }
      this.messageSubscriptions.clear();
      
      for (const unsubscribe of this.presenceSubscriptions.values()) {
        unsubscribe();
      }
      this.presenceSubscriptions.clear();
      
      // Clear channel subscription timeouts
      for (const timeout of this.channelSubscriptions.values()) {
        clearTimeout(timeout);
      }
      this.channelSubscriptions.clear();
      
      this.updateConnectionStatus('disconnected', { status: 'disconnected' });
      logger.info('Disconnected from Nostr network');
      
      // Emit disconnected event
      this.events.emit('disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Nostr network:', error);
      this.updateConnectionStatus('error', { 
        status: 'error', 
        errorMessage: `Disconnection error: ${error instanceof Error ? error.message : String(error)}` 
      });
      throw error;
    }
  }

  /**
   * Reconnect to the Nostr network.
   */
  public async reconnect(): Promise<void> {
    try {
      logger.info('Reconnecting to Nostr network...');
      await this.disconnect();
      await this.connect();
      logger.info('Reconnected to Nostr network');
    } catch (error) {
      logger.error('Error reconnecting to Nostr network:', error);
      throw error;
    }
  }

  /**
   * Send a message to a channel.
   */
  public async sendMessage(channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Determine if this is a direct message or channel message
      const isDirect = channelId.startsWith('dm-');
      
      let messageId: string;
      const timestamp = Date.now();
      
      if (isDirect) {
        // Not implemented in NostrService yet
        throw new Error('Direct messaging not implemented in NostrService');
      } else {
        // Send channel message
        const success = await nostrService.sendMessage(channelId, content);
        
        if (!success) {
          throw new Error(`Failed to send message to channel ${channelId}`);
        }
        
        messageId = `msg-${timestamp}-${Math.floor(Math.random() * 1000)}`;
      }
      
      const message: EnhancedChatMessage = {
        id: messageId,
        senderId: this.userDID || this.options.userId || 'unknown',
        senderName: this.options.userName || 'Unknown User',
        content,
        timestamp,
        channelId,
        type: 'text',
        status: 'sent'
      };
      
      // Handle attachments if present (not supported in Nostr yet)
      if (attachments && attachments.length > 0) {
        this.handleUnsupportedFeature('attachments', { channelId, attachmentsCount: attachments.length });
      }
      
      logger.info(`Message sent to channel ${channelId}`);
      
      return message;
    } catch (error) {
      logger.error(`Error sending message to ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages from a channel.
   */
  public async getMessages(channelId: string, limit: number = 50, before?: number): Promise<EnhancedChatMessage[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Get messages from the channel
      const nostrMessages = nostrService.getChannelMessages(channelId);
      
      // Convert Nostr messages to EnhancedChatMessage format
      const messages: EnhancedChatMessage[] = nostrMessages.map(msg => this.convertNostrMessage(msg));
      
      // Filter by timestamp if 'before' is specified
      const filteredMessages = before
        ? messages.filter(msg => msg.timestamp < before)
        : messages;
      
      // Limit the number of messages
      const limitedMessages = filteredMessages.slice(0, limit);
      
      // Sort by timestamp in descending order
      return limitedMessages.sort((a, b) => b.timestamp - a.timestamp);
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
      throw new Error('Not connected to Nostr network');
    }
    
    // Unsubscribe from previous subscription for this channel if exists
    if (this.messageSubscriptions.has(channelId)) {
      const unsubscribe = this.messageSubscriptions.get(channelId);
      if (unsubscribe) {
        unsubscribe();
      }
      this.messageSubscriptions.delete(channelId);
    }
    
    // Since NostrService doesn't have a real subscription mechanism yet,
    // we'll poll for new messages at regular intervals
    const lastMessages = new Set<string>();
    const initialMessages = nostrService.getChannelMessages(channelId);
    
    // Store initial message IDs
    initialMessages.forEach(msg => lastMessages.add(msg.id));
    
    // Convert and send initial messages to callback
    initialMessages.forEach(msg => callback(this.convertNostrMessage(msg)));
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      try {
        const currentMessages = nostrService.getChannelMessages(channelId);
        
        // Find new messages
        currentMessages.forEach(msg => {
          if (!lastMessages.has(msg.id)) {
            lastMessages.add(msg.id);
            callback(this.convertNostrMessage(msg));
          }
        });
      } catch (error) {
        logger.error(`Error polling messages for channel ${channelId}:`, error);
      }
    }, 3000); // Poll every 3 seconds
    
    // Create unsubscribe function
    const unsubscribe = () => {
      clearInterval(intervalId);
      this.messageSubscriptions.delete(channelId);
    };
    
    // Store unsubscribe function
    this.messageSubscriptions.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Edit a message.
   */
  public async editMessage(messageId: string, channelId: string, _newContent: string): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Message editing is not supported in Nostr
    throw this.handleUnsupportedFeature('editMessage', { messageId, channelId });
  }

  /**
   * Delete a message.
   */
  public async deleteMessage(messageId: string, channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Message deletion is not supported in Nostr
    throw this.handleUnsupportedFeature('deleteMessage', { messageId, channelId });
  }

  /**
   * Reply to a message.
   */
  public async replyToMessage(messageId: string, channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // For now, we'll just send a new message with a reference to the original
    const replyPrefix = `Replying to message ${messageId}: `;
    return this.sendMessage(channelId, replyPrefix + content, attachments);
  }

  /**
   * Forward a message.
   */
  public async forwardMessage(messageId: string, sourceChannelId: string, targetChannelId: string): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Message forwarding is not supported in Nostr
    throw this.handleUnsupportedFeature('forwardMessage', { messageId, sourceChannelId, targetChannelId });
  }

  /**
   * Add a reaction to a message.
   */
  public async addReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Reactions are not supported in Nostr
    throw this.handleUnsupportedFeature('addReaction', { messageId, channelId, reaction });
  }

  /**
   * Remove a reaction from a message.
   */
  public async removeReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Reactions are not supported in Nostr
    throw this.handleUnsupportedFeature('removeReaction', { messageId, channelId, reaction });
  }

  /**
   * Create a channel.
   */
  public async createChannel(name: string, _type: string, _participants: string[]): Promise<EnhancedChatChannel> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Create a team ID based on the name
      const teamId = `team-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      // Create the channel in Nostr
      const nostrChannel = await nostrService.createTeamChannel(
        teamId,
        name,
        this.clearanceLevel,
        this.agency,
        `Channel for ${name}`
      );
      
      // Convert Nostr channel to EnhancedChatChannel
      const channel = this.convertNostrChannel(nostrChannel);
      
      logger.info(`Channel ${name} created with ID ${channel.id}`);
      
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
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      if (!this.userDID && !this.options.userId) {
        throw new Error('Cannot join channel: No user DID or ID set');
      }
      
      // Join the channel in Nostr
      const success = await nostrService.joinTeamChannel(
        channelId,
        this.userDID || this.options.userId || '',
        this.clearanceLevel
      );
      
      if (!success) {
        throw new Error(`Failed to join channel ${channelId}`);
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
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have a leaveChannel method yet
    logger.warn(`leaveChannel not implemented for ${channelId}`);
    throw this.handleUnsupportedFeature('leaveChannel', { channelId });
  }

  /**
   * Get all available channels.
   */
  public async getChannels(): Promise<EnhancedChatChannel[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Stub implementation - in a real implementation, we would call a NostrService method
      // For now, return an empty array
      return [];
    } catch (error) {
      logger.error('Error getting channels:', error);
      throw error;
    }
  }

  /**
   * Get channel details.
   */
  public async getChannelDetails(channelId: string): Promise<EnhancedChatChannel> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Since getTeamChannel doesn't exist in NostrService yet, we'll return a dummy channel
      // In a real implementation, we would call nostrService.getTeamChannel
      logger.warn(`getTeamChannel not implemented for ${channelId}, returning mock data`);
      
      const mockChannel: NostrTeamChannel = {
        id: channelId,
        teamId: 'default-team',
        name: `Channel ${channelId}`,
        description: 'Channel details not available',
        clearanceLevel: this.clearanceLevel,
        agency: this.agency,
        relayUrls: this.relays,
        participants: [],
        createdAt: Date.now(),
        isActive: true,
        channelType: 'general'
      };
      
      return this.convertNostrChannel(mockChannel);
    } catch (error) {
      logger.error(`Error getting channel details for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Update a channel.
   */
  public async updateChannel(channelId: string, updates: Partial<EnhancedChatChannel>): Promise<EnhancedChatChannel> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have an updateChannel method yet
    throw this.handleUnsupportedFeature('updateChannel', { channelId, updates });
  }

  /**
   * Delete a channel.
   */
  public async deleteChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have a deleteChannel method yet
    throw this.handleUnsupportedFeature('deleteChannel', { channelId });
  }

  /**
   * Archive a channel.
   */
  public async archiveChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have an archiveChannel method yet
    throw this.handleUnsupportedFeature('archiveChannel', { channelId });
  }

  /**
   * Unarchive a channel.
   */
  public async unarchiveChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have an unarchiveChannel method yet
    throw this.handleUnsupportedFeature('unarchiveChannel', { channelId });
  }

  /**
   * Mute a channel.
   */
  public async muteChannel(channelId: string, duration?: number): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have a muteChannel method yet
    throw this.handleUnsupportedFeature('muteChannel', { channelId, duration });
  }

  /**
   * Unmute a channel.
   */
  public async unmuteChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have an unmuteChannel method yet
    throw this.handleUnsupportedFeature('unmuteChannel', { channelId });
  }

  /**
   * Pin a channel.
   */
  public async pinChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have a pinChannel method yet
    throw this.handleUnsupportedFeature('pinChannel', { channelId });
  }

  /**
   * Unpin a channel.
   */
  public async unpinChannel(channelId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have an unpinChannel method yet
    throw this.handleUnsupportedFeature('unpinChannel', { channelId });
  }

  /**
   * Get users in a channel.
   */
  public async getUsers(channelId: string): Promise<EnhancedChatUser[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Stub implementation - in a real implementation, we would call a NostrService method
      // For now, return an empty array
      return [];
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
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Stub implementation - in a real implementation, we would call a NostrService method
      // For now, return a default user
      return {
        id: userId,
        name: userId.substring(0, 8),
        status: 'online'
      };
    } catch (error) {
      logger.error(`Error getting user by ID ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get the current user.
   */
  public getCurrentUser(): EnhancedChatUser {
    return {
      id: this.userDID || this.options.userId || 'unknown',
      name: this.options.userName || 'Unknown User',
      status: this.isConnected() ? 'online' : 'offline'
    };
  }

  /**
   * Subscribe to user presence in a channel.
   */
  public subscribeToUserPresence(channelId: string, callback: (users: EnhancedChatUser[]) => void): () => void {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Unsubscribe from previous subscription for this channel if exists
    if (this.presenceSubscriptions.has(channelId)) {
      const unsubscribe = this.presenceSubscriptions.get(channelId);
      if (unsubscribe) {
        unsubscribe();
      }
      this.presenceSubscriptions.delete(channelId);
    }
    
    // Initial fetch of users
    this.getUsers(channelId).then(users => {
      callback(users);
    }).catch(error => {
      logger.error(`Error in initial user presence fetch for ${channelId}:`, error);
    });
    
    // Simulate periodic updates since Nostr doesn't have native presence
    const intervalId = setInterval(() => {
      this.getUsers(channelId).then(users => {
        callback(users);
      }).catch(error => {
        logger.error(`Error in simulated presence update for ${channelId}:`, error);
      });
    }, 60000); // Update every minute
    
    // Store the unsubscribe function
    const unsubscribe = () => {
      clearInterval(intervalId);
      this.presenceSubscriptions.delete(channelId);
    };
    
    this.presenceSubscriptions.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Update user status.
   */
  public async updateUserStatus(status: string, customStatus?: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // NostrService doesn't have an updateUserStatus method yet
    throw this.handleUnsupportedFeature('updateUserStatus', { status, customStatus });
  }

  /**
   * Mark messages as read.
   */
  public async markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Nostr doesn't support read receipts natively
    logger.info(`Marked ${messageIds.length} messages as read in ${channelId} (simulated)`);
    
    // No-op implementation
    return Promise.resolve();
  }

  /**
   * Search messages.
   */
  public async searchMessages(query: string, channelId?: string, options?: SearchOptions): Promise<SearchResult> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      const startTime = Date.now();
      
      // Get messages from the specified channel, or all channels if not specified
      let messages: EnhancedChatMessage[] = [];
      
      if (channelId) {
        messages = await this.getMessages(channelId);
      } else {
        // Get messages from all channels
        const channels = await this.getChannels();
        for (const channel of channels) {
          const channelMessages = await this.getMessages(channel.id);
          messages.push(...channelMessages);
        }
      }
      
      // Filter messages by query
      const filteredMessages = messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      
      // Apply additional filters from options
      let resultMessages = filteredMessages;
      
      if (options) {
        if (options.fromUserId) {
          resultMessages = resultMessages.filter(msg => msg.senderId === options.fromUserId);
        }
        
        if (options.startDate) {
          resultMessages = resultMessages.filter(msg => msg.timestamp >= options.startDate!);
        }
        
        if (options.endDate) {
          resultMessages = resultMessages.filter(msg => msg.timestamp <= options.endDate!);
        }
        
        if (options.messageTypes && options.messageTypes.length > 0) {
          resultMessages = resultMessages.filter(msg => options.messageTypes!.includes(msg.type));
        }
        
        // Sort by timestamp
        resultMessages = resultMessages.sort((a, b) => 
          options.sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
        );
        
        // Apply limit and offset
        if (options.offset) {
          resultMessages = resultMessages.slice(options.offset);
        }
        
        if (options.limit) {
          resultMessages = resultMessages.slice(0, options.limit);
        }
      }
      
      const endTime = Date.now();
      
      return {
        messages: resultMessages,
        totalResults: filteredMessages.length,
        hasMore: resultMessages.length < filteredMessages.length,
        executionTimeMs: endTime - startTime
      };
    } catch (error) {
      logger.error(`Error searching messages for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Upload a file attachment.
   */
  public async uploadAttachment(file: File): Promise<{ id: string; url: string; }> {
    throw this.handleUnsupportedFeature('uploadAttachment', { 
      file: { name: file.name, size: file.size, type: file.type } 
    });
  }

  /**
   * Create a thread.
   */
  public async createThread(messageId: string, channelId: string, _content: string): Promise<EnhancedChatMessage> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Threads are not supported in Nostr yet
    throw this.handleUnsupportedFeature('createThread', { messageId, channelId });
  }

  /**
   * Get thread messages.
   */
  public async getThreadMessages(threadId: string, limit?: number, before?: number): Promise<EnhancedChatMessage[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Threads are not supported in Nostr yet
    throw this.handleUnsupportedFeature('getThreadMessages', { threadId, limit, before });
  }

  /**
   * Subscribe to thread messages.
   */
  public subscribeToThreadMessages(threadId: string, _callback: (message: EnhancedChatMessage) => void): () => void {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    // Threads are not supported in Nostr yet
    throw this.handleUnsupportedFeature('subscribeToThreadMessages', { threadId });
  }

  /**
   * Helper method to convert a NostrMessage to an EnhancedChatMessage.
   */
  private convertNostrMessage(msg: NostrMessage): EnhancedChatMessage {
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderDID.split(':')[2] || msg.senderDID,
      content: msg.content,
      timestamp: msg.timestamp,
      channelId: msg.channelId,
      type: this.mapMessageType(msg.messageType),
      status: 'sent',
      metadata: {
        teamId: msg.teamId,
        senderDID: msg.senderDID,
        senderAgency: msg.senderAgency,
        clearanceLevel: msg.clearanceLevel,
        encrypted: msg.encrypted,
        pqcEncrypted: msg.pqcEncrypted,
        evidenceHash: msg.evidenceHash,
        truthScore: msg.truthScore,
        verificationStatus: msg.verificationStatus,
        resistanceCell: msg.resistanceCell,
        operativeLevel: msg.operativeLevel
      }
    };
  }

  /**
   * Helper method to convert a NostrTeamChannel to an EnhancedChatChannel.
   */
  private convertNostrChannel(channel: NostrTeamChannel): EnhancedChatChannel {
    return {
      id: channel.id,
      name: channel.name,
      type: 'group',
      participants: channel.participants,
      createdAt: channel.createdAt,
      createdBy: channel.participants[0] || 'unknown',
      description: channel.description,
      metadata: {
        teamId: channel.teamId,
        clearanceLevel: channel.clearanceLevel,
        agency: channel.agency,
        relayUrls: channel.relayUrls,
        encryptionKey: channel.encryptionKey,
        pqcKey: channel.pqcKey,
        isActive: channel.isActive,
        channelType: channel.channelType,
        resistanceCell: channel.resistanceCell,
        geographicRegion: channel.geographicRegion,
        specializations: channel.specializations
      }
    };
  }

  /**
   * Helper method to map Nostr message type to EnhancedChatMessage type.
   */
  private mapMessageType(type: string): 'text' | 'intelligence' | 'alert' | 'system' | 'file' | 'code' | 'event' | 'command' {
    switch (type) {
      case 'intelligence':
        return 'intelligence';
      case 'alert':
        return 'alert';
      case 'file':
        return 'file';
      case 'evidence':
      case 'truth_claim':
      case 'verification':
        return 'code';
      case 'coordination':
        return 'command';
      case 'status':
        return 'system';
      default:
        return 'text';
    }
  }
}

export default NostrChatAdapter;
