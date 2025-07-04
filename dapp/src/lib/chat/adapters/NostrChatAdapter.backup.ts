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
  private agency: AgencyType = 'EARTH_ALLIANCE';
  private clearanceLevel: ClearanceLevel = 'UNCLASSIFIED';
  private channelSubscriptions: Map<string, NodeJS.Timeout> = new Map();

  constructor(options?: NostrChatAdapterOptions) {
    super(options);
    
    this.relays = options?.relays || [];
    this.userDID = options?.userDID || null;
    this.agency = options?.agency || 'EARTH_ALLIANCE';
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
      typing: false
    };
  }

  /**
   * Initialize protocol-specific information.
   */
  protected initializeProtocolInfo(): ProtocolInfo {
    return {
      name: 'Earth Alliance Nostr',
      version: '1.0.0',
      description: 'Notes and Other Stuff Transmitted by Relays for Earth Alliance',
      website: 'https://nostr.com',
      documentation: 'https://github.com/nostr-protocol/nips',
      encryption: true,
      implementationDetails: {
        storageType: 'relay',
        transportLayer: 'WebSockets',
        persistence: true,
        replication: true
      }
    };
  }

  /**
   * Connect to the Nostr network.
   */
  public async connect(options?: Partial<EnhancedChatProviderOptions>): Promise<void> {
    try {
      this.updateConnectionStatus('connecting');
      
      // Apply any new options
      if (options) {
        this.options = { ...this.options, ...options };
        
        if ('userDID' in options) {
          this.userDID = options.userDID as string;
        }
      }
      
      // Initialize the Nostr service
      if (!nostrService.isReady()) {
        await nostrService.initialize();
      }
      
      // Set user DID if provided
      if (this.userDID) {
        nostrService.setUserDID(this.userDID);
      }
      
      // Connect to additional relays if specified
      if (this.relays.length > 0) {
        for (const relay of this.relays) {
          await nostrService.addRelay(relay);
        }
      }
      
      // Update connection status
      this.updateConnectionStatus('connected', {
        connectedAt: Date.now(),
        endpoint: 'nostr',
        protocol: 'WebSockets',
        encryptionEnabled: true
      });
      
      logger.info('Connected to Nostr network');
    } catch (error) {
      this.updateConnectionStatus('error', {
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  /**
   * Disconnect from the Nostr network.
   */
  public async disconnect(): Promise<void> {
    try {
      // Clean up subscriptions
      this.messageSubscriptions.forEach(unsubscribe => unsubscribe());
      this.messageSubscriptions.clear();
      
      this.presenceSubscriptions.forEach(unsubscribe => unsubscribe());
      this.presenceSubscriptions.clear();
      
      // Clear channel subscriptions
      this.channelSubscriptions.forEach(timeout => clearTimeout(timeout));
      this.channelSubscriptions.clear();
      
      // Update connection status
      this.updateConnectionStatus('disconnected');
      
      logger.info('Disconnected from Nostr network');
    } catch (error) {
      logger.error('Error disconnecting from Nostr network:', error);
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
      let timestamp = Date.now();
      
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
        senderId: this.userDID || 'unknown',
        senderName: this.options.userName || 'Unknown User',
        content,
        timestamp,
        channelId,
        type: 'text',
        status: 'sent'
      };
      
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
   * Create a channel.
   */
  public async createChannel(name: string, type: string, participants: string[]): Promise<EnhancedChatChannel> {
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
      if (!this.userDID) {
        throw new Error('Cannot join channel: No user DID set');
      }
      
      // Join the channel in Nostr
      const success = await nostrService.joinTeamChannel(
        channelId,
        this.userDID,
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
   * Note: Not implemented in NostrService yet.
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
   * Note: This is a stub implementation since NostrService doesn't provide this method yet.
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
   * Get users in a channel.
   * Note: This is a stub implementation since NostrService doesn't provide this method yet.
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
   * Note: This is a stub implementation since NostrService doesn't provide this method yet.
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
   * Subscribe to user presence in a channel.
   * Note: This is a stub implementation since Nostr doesn't have native presence detection.
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
   * Mark messages as read.
   * Note: Nostr doesn't have native read receipts, so this is a no-op.
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
   * Upload a file attachment.
   * Note: Nostr doesn't have native file attachments, so this throws an error.
   */
  public async uploadAttachment(file: File): Promise<{ id: string; url: string; }> {
    throw this.handleUnsupportedFeature('uploadAttachment', { 
      file: { name: file.name, size: file.size, type: file.type } 
    });
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
}
    // Create subscription to channel events
    // This is a simplified implementation that mocks a subscription
    logger.info(`Subscribing to messages in channel ${channelId}`);
    
    // We can't directly use nostrService.subscribeToChannel with the correct signature
    // So we'll implement a simplified version
    
    // Create an unsubscribe function
    const unsubscribe = () => {
      logger.info(`Unsubscribed from messages in channel ${channelId}`);
    };
    
    // Store the unsubscribe function
    this.messageSubscriptions.set(channelId, unsubscribe);
    
    // Simulate getting initial messages
    this._getMessages(channelId)
      .then(messages => {
        // Notify about each message
        messages.forEach(msg => {
          setTimeout(() => callback(msg), 100);
        });
      })
      .catch(err => {
        logger.error(`Error fetching initial messages for channel ${channelId}:`, err);
      });
    
    return unsubscribe;
  }
  
  protected async _getChannels(): Promise<ChatChannel[]> {
    try {
      // Since getTeamChannels doesn't exist in NostrService, we'll create a basic implementation
      // that returns empty channels list
      logger.info('Getting available channels');
      
      // In a real implementation, this would use the NostrService to fetch actual channels
      return [
        {
          id: 'global',
          name: 'Global Chat',
          type: 'global',
          participants: [],
          metadata: {
            description: 'Global chat channel',
            createdAt: Date.now()
          }
        }
      ];
    } catch (error) {
      logger.error('Failed to get channels from Nostr:', error);
      throw createChatError(
        `Failed to get channels: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'channel_retrieval_failed',
        true
      );
    }
  }
  
  protected async _getUserById(userId: string): Promise<ChatUser | null> {
    try {
      // This is a simplified implementation since getUserPresence doesn't exist
      logger.info(`Getting user by ID: ${userId}`);
      
      // In a real implementation, this would fetch the user's profile
      return {
        id: userId,
        name: userId.substring(0, 8),
        status: 'offline',
        lastSeen: Date.now() - 3600000, // 1 hour ago
        publicKey: userId
      };
    } catch (error) {
      logger.error('Failed to get user from Nostr:', error);
      throw createChatError(
        `Failed to get user: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'user_retrieval_failed',
        true
      );
    }
  }
  
  protected async _getUsers(channelId: string): Promise<ChatUser[]> {
    try {
      // This is a simplified implementation since getChannelParticipants doesn't exist
      logger.info(`Getting users for channel: ${channelId}`);
      
      // In a real implementation, this would fetch actual channel participants
      return [
        {
          id: this.userId,
          name: this.userName || this.userId.substring(0, 8),
          status: 'online',
          lastSeen: Date.now()
        }
      ];
    } catch (error) {
      logger.error('Failed to get users from Nostr:', error);
      throw createChatError(
        `Failed to get users: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'user_retrieval_failed',
        true
      );
    }
  }
  
  /**
   * Connects to the Nostr network and initializes the chat adapter.
   */
  async connect(options?: Partial<NostrChatAdapterOptions>): Promise<void> {
    return this._connect(options);
  }

  /**
   * Disconnects from the Nostr network and cleans up resources.
   */
  async disconnect(): Promise<void> {
    return this._disconnect();
  }

  /**
   * Updates the user's presence status in the Nostr network.
   */
  private async updatePresence(online: boolean): Promise<void> {
    try {
      // We can't directly call updatePresence as it doesn't exist in the new NostrService
      // Instead, we'll adapt to what's available - this may need to be implemented differently
      logger.info(`User presence updated: ${online ? 'online' : 'offline'}`);
      
      // Placeholder for future implementation when presence updates are supported
    } catch (error) {
      logger.error('Failed to update presence:', error);
    }
  }

  /**
   * Sends a message to the specified channel.
   */
  async sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ChatMessage> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Create message object
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: this.userId,
        senderName: this.userName,
        content,
        timestamp: Date.now(),
        channelId,
        type: 'text',
        status: 'sending'
      };

      // Handle attachments if present
      if (attachments && attachments.length > 0) {
        message.type = 'file';
        
        // This is a placeholder since we don't have direct file upload support
        message.attachments = await Promise.all(attachments.map(async (file) => {
          // Simulate file upload or use an adapter
          return {
            id: crypto.randomUUID(),
            name: file.name,
            url: URL.createObjectURL(file), // This is temporary and won't persist
            size: file.size,
            type: file.type
          };
        }));
      }

      // Send message via Nostr
      const result = await nostrService.sendMessage(channelId, content, 'text');
      
      // Update message with sent status
      if (typeof result === 'string') {
        message.id = result;
      } else if (result && typeof result === 'object') {
        // Try to extract id from the result object if it exists
        message.id = (result as any).id || 'msg-' + Date.now();
      } else {
        // Fallback ID if we couldn't get a proper ID
        message.id = 'msg-' + Date.now();
      }
      
      message.status = 'sent';
      
      return message;
    } catch (error) {
      logger.error('Failed to send message via Nostr:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves messages from the specified channel.
   */
  async getMessages(channelId: string, limit: number = 50, before?: number): Promise<ChatMessage[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Use our _getMessages implementation
      return this._getMessages(channelId, limit, before);
    } catch (error) {
      logger.error('Failed to get messages from Nostr:', error);
      throw createChatError(
        `Failed to get messages: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'message_retrieval_failed',
        true
      );
    }
  }

  /**
   * Subscribes to messages in the specified channel.
   */
  subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void): () => void {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    return this._subscribeToMessages(channelId, callback);
  }

  /**
   * Creates a new channel.
   */
  async createChannel(name: string, type: 'direct' | 'team' | 'global', _participants: string[]): Promise<ChatChannel> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Use the NostrService's createTeamChannel method
      const channelData = await nostrService.createTeamChannel(
        'default', // Default team ID
        name,
        'UNCLASSIFIED', // Default clearance level
        'SOCOM', // Default agency type
        `${type} channel: ${name}` // Description
      );
      
      return {
        id: channelData.id,
        name: channelData.name,
        type: type,
        participants: channelData.participants,
        metadata: {
          description: channelData.description,
          createdAt: channelData.createdAt
        }
      };
    } catch (error) {
      logger.error('Failed to create channel in Nostr:', error);
      throw createChatError(
        `Failed to create channel: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'channel_creation_failed',
        true
      );
    }
  }

  /**
   * Joins an existing channel.
   */
  async joinChannel(channelId: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      await nostrService.joinTeamChannel(channelId, this.userId, 'UNCLASSIFIED');
    } catch (error) {
      logger.error('Failed to join channel in Nostr:', error);
      throw createChatError(
        `Failed to join channel: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'channel_join_failed',
        true
      );
    }
  }

  /**
   * Leaves a channel.
   */
  async leaveChannel(channelId: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Placeholder: We don't have a direct leaveChannel method in the NostrService
      // This would need to be implemented or adapted based on actual NostrService capabilities
      logger.info(`User ${this.userId} left channel ${channelId}`);
    } catch (error) {
      logger.error('Failed to leave channel in Nostr:', error);
      throw createChatError(
        `Failed to leave channel: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'channel_leave_failed',
        true
      );
    }
  }

  /**
   * Gets all available channels.
   */
  async getChannels(): Promise<ChatChannel[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    return this._getChannels();
  }

  /**
   * Gets users in a channel.
   */
  async getUsers(channelId: string): Promise<ChatUser[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    return this._getUsers(channelId);
  }

  /**
   * Gets a specific user by ID.
   */
  async getUserById(userId: string): Promise<ChatUser | null> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    return this._getUserById(userId);
  }

  /**
   * Subscribes to user presence updates in a channel.
   */
  subscribeToUserPresence(channelId: string, callback: (users: ChatUser[]) => void): () => void {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    // This is a placeholder implementation since we don't have direct presence subscription
    // in the refactored NostrService
    logger.info(`Subscribing to user presence in channel ${channelId}`);
    
    // Create a mock presence updater that fires once immediately
    setTimeout(() => {
      this._getUsers(channelId)
        .then(users => callback(users))
        .catch(err => logger.error('Error getting users for presence:', err));
    }, 0);
    
    // Return a no-op unsubscribe function
    const unsubscribe = () => {
      logger.info(`Unsubscribed from presence updates for channel ${channelId}`);
    };
    
    this.presenceSubscriptions.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Marks messages as read.
   */
  async markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    // This is a placeholder as we don't have a direct markMessagesAsRead in NostrService
    logger.info(`Marking messages as read in channel ${channelId}:`, messageIds);
  }

  /**
   * Searches for messages.
   */
  async searchMessages(query: string, channelId?: string): Promise<ChatMessage[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    return this._getMessages(channelId).then(messages => {
      // Filter messages by query
      return messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
    });
  }

  /**
   * Uploads a file attachment.
   */
  async uploadAttachment(file: File): Promise<{ id: string; url: string; }> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    // This is a placeholder implementation since we don't have direct file upload
    // in the refactored NostrService
    logger.info(`Uploading file attachment: ${file.name}`);
    
    // Create a mock file upload result
    return {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file) // This is temporary and won't persist
    };
  }

  /**
   * Implements the _connect method required by EnhancedChatProvider.
   */
  protected async _connect(options?: Partial<NostrChatAdapterOptions>): Promise<void> {
    try {
      // Update options if provided
      if (options) {
        this.userId = options.userId || this.userId;
        this.userName = options.userName || this.userName;
        
        if (options.relays && options.relays.length > 0) {
          // Add each relay
          for (const relay of options.relays) {
            await nostrService.addRelay(relay);
          }
        }
      }

      // Validate required fields
      if (!this.userId) {
        throw createChatError(
          'User ID is required to connect to the chat system',
          ChatErrorType.AUTHENTICATION,
          'missing_user_id',
          false
        );
      }

      // Initialize Nostr service
      await nostrService.initialize();
      
      // Update connection state
      this.connected = true;
      this.connectionState = 'connected';
      
      logger.info('NostrChatAdapter connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Nostr:', error);
      throw createChatError(
        `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'connection_failed',
        true
      );
    }
  }
  
  /**
   * Implements the _disconnect method required by EnhancedChatProvider.
   */
  protected async _disconnect(): Promise<void> {
    try {
      if (!this.connected) return;
      
      // Clean up subscriptions
      for (const unsubscribe of this.messageSubscriptions.values()) {
        unsubscribe();
      }
      
      for (const unsubscribe of this.presenceSubscriptions.values()) {
        unsubscribe();
      }
      
      this.messageSubscriptions.clear();
      this.presenceSubscriptions.clear();
      
      // Shut down pool
      if (nostrService) {
        // Clean up any resources using the best available method
        try {
          logger.info('Closing Nostr connections...');
          // Here we just let the NostrService handle its own cleanup
          // since we don't have direct access to its internals
        } catch (err) {
          logger.warn('Error during Nostr cleanup:', err);
        }
      }
      
      // Update connection state
      this.connected = false;
      this.connectionState = 'disconnected';
      
      logger.info('NostrChatAdapter disconnected successfully');
    } catch (error) {
      logger.error('Error during disconnect:', error);
      throw createChatError(
        `Disconnect failed: ${error instanceof Error ? error.message : String(error)}`,
        ChatErrorType.NETWORK,
        'disconnect_failed',
        false
      );
    }
  }
}
