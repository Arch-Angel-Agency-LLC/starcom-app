/**
 * NostrChatAdapter - Fixed Version
 * 
 * This is an improved version of the NostrChatAdapter that properly maps between
 * NostrService types and the unified ChatInterface types using utility functions.
 */

import { BaseChatProvider, ChatMessage, ChatUser, ChatChannel, ChatProviderOptions } from '../ChatInterface';
import NostrService from '../../../services/nostrService';
import { 
  nostrMessageToChatMessage, 
  chatMessageToNostrMessage, 
  nostrChannelToChatChannel,
  nostrPresenceToChatUser
} from '../utils/NostrAdapterUtils';

/**
 * Options specific to the Nostr chat adapter.
 */
export interface NostrChatAdapterOptions extends ChatProviderOptions {
  nostrService?: NostrService;
  relays?: string[];
}

/**
 * Adapter for Nostr that implements the ChatProvider interface.
 */
export class NostrChatAdapter extends BaseChatProvider {
  private nostrService: NostrService;
  private userId: string;
  private userName: string;
  private messageSubscriptions: Map<string, () => void> = new Map();
  private presenceSubscriptions: Map<string, () => void> = new Map();

  constructor(options?: NostrChatAdapterOptions) {
    super(options);
    this.nostrService = options?.nostrService || NostrService.getInstance();
    this.userId = options?.userId || '';
    this.userName = options?.userName || '';
    
    // Configure custom relays if provided
    if (options?.relays && options.relays.length > 0) {
      this.nostrService.setRelays(options.relays);
    }
  }

  /**
   * Connects to the Nostr network and initializes the chat adapter.
   */
  async connect(options?: Partial<NostrChatAdapterOptions>): Promise<void> {
    if (this.connected) return;

    try {
      // Update options if provided
      if (options) {
        this.userId = options.userId || this.userId;
        this.userName = options.userName || this.userName;
        
        if (options.relays && options.relays.length > 0) {
          this.nostrService.setRelays(options.relays);
        }
      }

      // Validate required fields
      if (!this.userId) {
        throw new Error('User ID is required to connect to the chat system');
      }

      // Initialize Nostr service
      await this.nostrService.initialize();
      
      // Set up presence
      await this.updatePresence(true);

      // Set connected flag
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Nostr chat:', error);
      throw new Error(`Failed to connect to Nostr chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnects from the Nostr network and cleans up resources.
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    try {
      // Update presence status
      await this.updatePresence(false);
      
      // Clean up subscriptions
      this.nostrService.unsubscribeAll();
      
      for (const unsubscribe of this.messageSubscriptions.values()) {
        unsubscribe();
      }
      this.messageSubscriptions.clear();
      
      for (const unsubscribe of this.presenceSubscriptions.values()) {
        unsubscribe();
      }
      this.presenceSubscriptions.clear();
      
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from Nostr chat:', error);
      throw new Error(`Failed to disconnect from Nostr chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Updates the user's presence status.
   */
  private async updatePresence(online: boolean): Promise<void> {
    await this.nostrService.updatePresence({
      userId: this.userId,
      displayName: this.userName,
      online,
      lastSeen: Date.now()
    });
  }

  /**
   * Sends a message to the specified channel.
   */
  async sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ChatMessage> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Create a ChatMessage object
      const messageId = this.generateId();
      const timestamp = Date.now();
      
      const message: ChatMessage = {
        id: messageId,
        senderId: this.userId,
        senderName: this.userName || this.userId.slice(0, 8),
        content,
        timestamp,
        channelId,
        type: 'text',
        status: 'sending',
        metadata: {
          source: 'nostr',
          encrypted: this.encryptionEnabled
        }
      };
      
      // Process attachments if any
      if (attachments && attachments.length > 0) {
        message.attachments = [];
        for (const file of attachments) {
          const fileData = await this.nostrService.uploadFile(file);
          message.attachments.push({
            id: this.generateId(),
            name: file.name,
            url: fileData.url,
            size: file.size,
            type: file.type
          });
        }
        message.type = 'file';
      }
      
      // Convert to Nostr format and send
      const nostrMessage = chatMessageToNostrMessage(message, {
        senderDID: `did:ea:${this.userId}`,
        teamId: channelId.replace('team-', '')
      });
      
      const eventId = await this.nostrService.sendChannelMessage(
        channelId, 
        content, 
        message.attachments
      );
      
      // Update the message with the event ID and set status to sent
      message.id = eventId;
      message.status = 'sent';
      
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets messages from the specified channel.
   */
  async getMessages(channelId: string, limit?: number, before?: number): Promise<ChatMessage[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      const nostrMessages = await this.nostrService.getChannelMessages(
        channelId, 
        limit, 
        before
      );
      
      // Convert Nostr messages to ChatMessage format
      return nostrMessages.map(nostrMessageToChatMessage);
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Subscribes to messages from the specified channel.
   */
  subscribeToMessages(
    channelId: string, 
    callback: (message: ChatMessage) => void
  ): () => void {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    // Check if we already have a subscription for this channel
    if (this.messageSubscriptions.has(channelId)) {
      return this.messageSubscriptions.get(channelId)!;
    }

    // Create a new subscription
    const subscription = this.nostrService.subscribeToChannel(
      channelId, 
      (nostrMessage) => {
        // Convert Nostr message to ChatMessage and pass to callback
        const chatMessage = nostrMessageToChatMessage(nostrMessage);
        callback(chatMessage);
      }
    );
    
    // Store the unsubscribe function
    const unsubscribe = () => {
      this.nostrService.unsubscribeFromChannel(channelId);
      this.messageSubscriptions.delete(channelId);
    };
    
    this.messageSubscriptions.set(channelId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Creates a new channel.
   */
  async createChannel(
    name: string, 
    type: 'direct' | 'team' | 'global', 
    participants: string[]
  ): Promise<ChatChannel> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      if (type === 'direct') {
        throw new Error('Direct channels are not yet supported in Nostr adapter');
      }
      
      if (type === 'global') {
        throw new Error('Global channels are not yet supported in Nostr adapter');
      }
      
      // Create a team channel in Nostr
      const channelData = await this.nostrService.createTeamChannel({
        name,
        description: `Team channel: ${name}`,
        creatorId: this.userId,
        members: participants.map(p => ({ 
          memberId: p, 
          role: 'member',
          joinedAt: Date.now()
        })),
        encrypted: this.encryptionEnabled,
        clearanceLevel: 'PUBLIC'
      });
      
      // Convert to ChatChannel format
      return nostrChannelToChatChannel(channelData);
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw new Error(`Failed to create channel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Joins a channel.
   */
  async joinChannel(channelId: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Extract team ID from channel ID
      const teamId = channelId.startsWith('team-') 
        ? channelId.substring(5) 
        : channelId;
      
      await this.nostrService.joinTeamChannel(teamId, this.userId);
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw new Error(`Failed to join channel: ${error instanceof Error ? error.message : String(error)}`);
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
      // Extract team ID from channel ID
      const teamId = channelId.startsWith('team-') 
        ? channelId.substring(5) 
        : channelId;
      
      await this.nostrService.leaveTeamChannel(teamId, this.userId);
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw new Error(`Failed to leave channel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets all available channels.
   */
  async getChannels(): Promise<ChatChannel[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      const nostrChannels = await this.nostrService.getTeamChannels();
      
      // Convert Nostr channels to ChatChannel format
      return nostrChannels.map(nostrChannelToChatChannel);
    } catch (error) {
      console.error('Failed to get channels:', error);
      throw new Error(`Failed to get channels: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets users in the specified channel.
   */
  async getUsers(channelId: string): Promise<ChatUser[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      // Extract team ID from channel ID
      const teamId = channelId.startsWith('team-') 
        ? channelId.substring(5) 
        : channelId;
      
      const users = await this.nostrService.getTeamMembers(teamId);
      
      // Convert to ChatUser format
      return users.map(user => ({
        id: user.memberId,
        name: user.displayName || user.memberId.slice(0, 8),
        status: user.online ? 'online' : 'offline',
        lastSeen: user.lastSeen,
        agency: user.agency,
        clearanceLevel: user.clearanceLevel,
        metadata: { ...user }
      }));
    } catch (error) {
      console.error('Failed to get users:', error);
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets a user by ID.
   */
  async getUserById(userId: string): Promise<ChatUser | null> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      const user = await this.nostrService.getUserProfile(userId);
      
      if (!user) {
        return null;
      }
      
      return {
        id: user.userId,
        name: user.displayName || user.userId.slice(0, 8),
        status: user.online ? 'online' : 'offline',
        lastSeen: user.lastSeen,
        publicKey: user.publicKey,
        agency: user.agency,
        clearanceLevel: user.clearanceLevel,
        metadata: { ...user }
      };
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Subscribes to user presence updates in the specified channel.
   */
  subscribeToUserPresence(
    channelId: string, 
    callback: (users: ChatUser[]) => void
  ): () => void {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    // Check if we already have a subscription for this channel
    if (this.presenceSubscriptions.has(channelId)) {
      return this.presenceSubscriptions.get(channelId)!;
    }

    // Create a new subscription
    const subscription = this.nostrService.subscribeToPresence(
      channelId, 
      (presenceUpdates) => {
        // Convert presence updates to ChatUser format
        const chatUsers = presenceUpdates.map(nostrPresenceToChatUser);
        callback(chatUsers);
      }
    );
    
    // Store the unsubscribe function
    const unsubscribe = () => {
      this.nostrService.unsubscribeFromPresence(channelId);
      this.presenceSubscriptions.delete(channelId);
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

    try {
      await this.nostrService.markMessagesAsRead(channelId, messageIds);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw new Error(`Failed to mark messages as read: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Searches for messages.
   */
  async searchMessages(query: string, channelId?: string): Promise<ChatMessage[]> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      const searchResults = await this.nostrService.searchMessages(query, channelId);
      
      // Convert Nostr messages to ChatMessage format
      return searchResults.map(nostrMessageToChatMessage);
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uploads a file attachment.
   */
  async uploadAttachment(file: File): Promise<{ id: string; url: string; }> {
    if (!this.connected) {
      throw new Error('Not connected to the chat system');
    }

    try {
      const result = await this.nostrService.uploadFile(file);
      
      return {
        id: result.id || this.generateId(),
        url: result.url
      };
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw new Error(`Failed to upload attachment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
