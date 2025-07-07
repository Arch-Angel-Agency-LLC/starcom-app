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
import nostrService from '../../../services/nostrService';
import { logger } from '../../../utils';

/**
 * Options specific to the Nostr chat adapter.
 */
export interface NostrChatAdapterOptions extends EnhancedChatProviderOptions {
  relays?: string[];
  privateKey?: string;
  publicKey?: string;
}

/**
 * Adapter for Nostr that implements the ChatProviderInterface.
 */
export class NostrChatAdapter extends BaseChatAdapter {
  private messageSubscriptions: Map<string, () => void> = new Map();
  private presenceSubscriptions: Map<string, () => void> = new Map();
  private relays: string[] = [];

  constructor(options?: NostrChatAdapterOptions) {
    super(options);
    
    this.relays = options?.relays || [];
    
    // Initialize additional Nostr-specific properties
    if (options?.privateKey) {
      nostrService.setPrivateKey(options.privateKey);
    }
    
    if (options?.publicKey) {
      nostrService.setPublicKey(options.publicKey);
    }
    
    // Register additional features based on options
    this.registerFeature('encrypted_direct_messages');
    this.registerFeature('public_chat');
    this.registerFeature('nip05_verification');
  }

  /**
   * Initialize protocol-specific capabilities.
   */
  protected initializeCapabilities(): ChatProviderCapabilities {
    return {
      directMessaging: true,
      groupChat: true,
      fileAttachments: false, // Nostr doesn't natively support file attachments
      endToEndEncryption: true, // NIP-04 encryption
      messageHistory: true,
      presenceDetection: false, // Nostr doesn't have native presence
      messageDeliveryStatus: false,
      messageReactions: true, // Through NIP-25
      messageThreads: false,
      userProfiles: true, // Through NIP-01
      channelManagement: true,
      messageSearch: false, // Relays don't typically support search
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
      name: 'Nostr',
      version: '1.0.0',
      description: 'Notes and Other Stuff Transmitted by Relays',
      protocolType: 'federated',
      encryption: true,
      website: 'https://nostr.com',
      documentation: 'https://github.com/nostr-protocol/nips',
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
      }
      
      // Connect to Nostr
      await nostrService.connect();
      
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
      
      // Disconnect from Nostr
      await nostrService.disconnect();
      
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
      
      let message: EnhancedChatMessage;
      
      if (isDirect) {
        // Extract recipient pubkey from channelId
        const recipientPubkey = channelId.replace('dm-', '');
        
        // Send encrypted direct message
        const sentMessage = await nostrService.sendDirectMessage(recipientPubkey, content);
        
        message = {
          id: sentMessage.id || `msg_${Date.now()}`,
          senderId: this.options.userId || nostrService.getPublicKey(),
          senderName: this.options.userName || 'Unknown User',
          content,
          timestamp: sentMessage.created_at || Date.now(),
          channelId,
          type: 'text',
          status: 'sent',
          encrypted: true
        };
      } else {
        // Send channel message
        const sentMessage = await nostrService.sendChannelMessage(channelId, content);
        
        message = {
          id: sentMessage.id || `msg_${Date.now()}`,
          senderId: this.options.userId || nostrService.getPublicKey(),
          senderName: this.options.userName || 'Unknown User',
          content,
          timestamp: sentMessage.created_at || Date.now(),
          channelId,
          type: 'text',
          status: 'sent'
        };
      }
      
      logger.info(`Message sent to ${isDirect ? 'user' : 'channel'} ${channelId}`);
      
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
      // Determine if this is a direct message or channel message
      const isDirect = channelId.startsWith('dm-');
      
      let nostrMessages;
      
      if (isDirect) {
        // Extract recipient pubkey from channelId
        const recipientPubkey = channelId.replace('dm-', '');
        
        // Get direct messages
        nostrMessages = await nostrService.getDirectMessages(recipientPubkey, limit);
      } else {
        // Get channel messages
        nostrMessages = await nostrService.getChannelMessages(channelId, limit);
      }
      
      // Convert Nostr messages to EnhancedChatMessage format
      const messages: EnhancedChatMessage[] = nostrMessages.map(msg => {
        return {
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          senderId: msg.pubkey,
          senderName: msg.user?.name || msg.pubkey.substring(0, 8),
          content: msg.content,
          timestamp: msg.created_at * 1000, // Convert to milliseconds
          channelId,
          type: 'text',
          status: 'sent',
          encrypted: isDirect
        };
      });
      
      // Filter by timestamp if 'before' is specified
      const filteredMessages = before
        ? messages.filter(msg => msg.timestamp < before)
        : messages;
      
      // Sort by timestamp in descending order
      return filteredMessages.sort((a, b) => b.timestamp - a.timestamp);
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
    
    // Determine if this is a direct message or channel message
    const isDirect = channelId.startsWith('dm-');
    
    let unsubscribe: () => void;
    
    if (isDirect) {
      // Extract recipient pubkey from channelId
      const recipientPubkey = channelId.replace('dm-', '');
      
      // Subscribe to direct messages
      unsubscribe = nostrService.subscribeToDirectMessages(recipientPubkey, (msg) => {
        const message: EnhancedChatMessage = {
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          senderId: msg.pubkey,
          senderName: msg.user?.name || msg.pubkey.substring(0, 8),
          content: msg.content,
          timestamp: msg.created_at * 1000, // Convert to milliseconds
          channelId,
          type: 'text',
          status: 'sent',
          encrypted: true
        };
        
        callback(message);
      });
    } else {
      // Subscribe to channel messages
      unsubscribe = nostrService.subscribeToChannelMessages(channelId, (msg) => {
        const message: EnhancedChatMessage = {
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          senderId: msg.pubkey,
          senderName: msg.user?.name || msg.pubkey.substring(0, 8),
          content: msg.content,
          timestamp: msg.created_at * 1000, // Convert to milliseconds
          channelId,
          type: 'text',
          status: 'sent'
        };
        
        callback(message);
      });
    }
    
    // Store the unsubscribe function
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
      // Create channel in Nostr
      const createdChannel = await nostrService.createChannel(name, { description: `Channel for ${name}` });
      
      const channel: EnhancedChatChannel = {
        id: createdChannel.id,
        name,
        type: type as any, // Type assertion to match the ChannelType
        participants,
        createdAt: createdChannel.created_at * 1000, // Convert to milliseconds
        createdBy: this.options.userId || nostrService.getPublicKey(),
        description: createdChannel.description
      };
      
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
      // Join channel in Nostr
      await nostrService.joinChannel(channelId);
      
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
    
    try {
      // Leave channel in Nostr
      await nostrService.leaveChannel(channelId);
      
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
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Get channels from Nostr
      const nostrChannels = await nostrService.getChannels();
      
      // Convert Nostr channels to EnhancedChatChannel format
      const channels: EnhancedChatChannel[] = nostrChannels.map(channel => {
        return {
          id: channel.id,
          name: channel.name || `Channel ${channel.id.substring(0, 8)}`,
          type: 'group', // Default to group
          participants: channel.participants || [],
          createdAt: channel.created_at * 1000, // Convert to milliseconds
          createdBy: channel.pubkey,
          description: channel.description
        };
      });
      
      return channels;
    } catch (error) {
      logger.error('Error getting channels:', error);
      throw error;
    }
  }

  /**
   * Get users in a channel.
   */
  public async getUsers(channelId: string): Promise<EnhancedChatUser[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      // Get channel participants from Nostr
      const participants = await nostrService.getChannelParticipants(channelId);
      
      // Convert participants to EnhancedChatUser format
      const users: EnhancedChatUser[] = participants.map(participant => {
        return {
          id: participant.pubkey,
          name: participant.name || participant.pubkey.substring(0, 8),
          status: 'online' // Nostr doesn't have presence, default to online
        };
      });
      
      return users;
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
      // Get user profile from Nostr
      const profile = await nostrService.getUserProfile(userId);
      
      if (!profile) {
        return {
          id: userId,
          name: userId.substring(0, 8),
          status: 'offline'
        };
      }
      
      return {
        id: userId,
        name: profile.name || userId.substring(0, 8),
        status: 'online', // Nostr doesn't have presence, default to online
        avatar: profile.picture,
        metadata: {
          nip05: profile.nip05,
          about: profile.about,
          website: profile.website
        }
      };
    } catch (error) {
      logger.error(`Error getting user by ID ${userId}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to user presence in a channel.
   * Note: Nostr doesn't have native presence detection, so this is simulated.
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
   * Add a reaction to a message.
   * Uses NIP-25 for reactions.
   */
  public async addReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Nostr network');
    }
    
    try {
      await nostrService.addReaction(messageId, reaction);
      logger.info(`Added reaction ${reaction} to message ${messageId}`);
    } catch (error) {
      logger.error(`Error adding reaction to message ${messageId}:`, error);
      throw error;
    }
  }
}
