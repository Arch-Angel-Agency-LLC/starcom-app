/**
 * BaseChatAdapter.ts
 * 
 * Provides a base implementation of the ChatProviderInterface that can be
 * extended by specific chat protocol adapters. Implements common functionality
 * and provides a foundation for protocol-specific implementations.
 */

import { EventEmitter } from 'events';
import { 
  EnhancedChatMessage, 
  EnhancedChatChannel, 
  EnhancedChatUser,
  EnhancedChatProviderOptions,
  ConnectionStatus,
  ConnectionDetails
} from '../types/ChatAdapterTypes';
import { ChatProviderCapabilities, ProtocolInfo } from '../types/ProtocolTypes';
import { ChatProviderInterface, SearchOptions, SearchResult } from '../interfaces/ChatProviderInterface';
import { 
  FeatureDetectionInterface, 
  CapabilityCheckResult,
  UnsupportedFeatureHandler,
  createThrowingHandler 
} from '../interfaces/FeatureDetection';

/**
 * Abstract base class for chat providers.
 * Provides shared functionality and standardized interface implementation.
 */
export abstract class BaseChatAdapter implements ChatProviderInterface, FeatureDetectionInterface {
  protected options: EnhancedChatProviderOptions;
  protected capabilities: ChatProviderCapabilities;
  protected connectionStatus: ConnectionStatus = 'disconnected';
  protected connectionDetails: ConnectionDetails = { status: 'disconnected' };
  protected protocolInfo: ProtocolInfo;
  protected events: EventEmitter = new EventEmitter();
  protected unsupportedFeatureHandler: UnsupportedFeatureHandler;
  protected supportedFeatures: Set<string> = new Set();
  
  constructor(options?: EnhancedChatProviderOptions) {
    this.options = options || {};
    
    // Initialize capabilities and protocol info
    this.capabilities = this.initializeCapabilities();
    this.protocolInfo = this.initializeProtocolInfo();
    
    // Set up unsupported feature handler (default to throwing errors)
    this.unsupportedFeatureHandler = createThrowingHandler(this.protocolInfo.name);
    
    // Initialize supported features
    this.initializeSupportedFeatures();
  }
  
  /**
   * Initialize protocol-specific capabilities.
   * Must be implemented by subclasses.
   */
  protected abstract initializeCapabilities(): ChatProviderCapabilities;
  
  /**
   * Initialize protocol-specific information.
   * Must be implemented by subclasses.
   */
  protected abstract initializeProtocolInfo(): ProtocolInfo;
  
  /**
   * Initialize the set of supported features.
   * Can be overridden by subclasses to add additional features.
   */
  protected initializeSupportedFeatures(): void {
    // Register common features all adapters should support
    this.registerFeature('connect');
    this.registerFeature('disconnect');
    this.registerFeature('isConnected');
    this.registerFeature('getConnectionStatus');
    this.registerFeature('getConnectionDetails');
    this.registerFeature('getProtocolInfo');
    this.registerFeature('getCapabilities');
    this.registerFeature('hasCapability');
    this.registerFeature('on');
    this.registerFeature('off');
    this.registerFeature('once');
  }
  
  /**
   * Register a supported feature.
   * @param feature The feature to register
   */
  protected registerFeature(feature: string): void {
    this.supportedFeatures.add(feature);
  }
  
  /**
   * Check if a feature is supported.
   * @param feature The feature to check
   * @returns True if the feature is supported, false otherwise
   */
  public hasFeature(feature: string): boolean {
    return this.supportedFeatures.has(feature);
  }
  
  /**
   * Get all supported features.
   * @returns Array of supported feature names
   */
  public getFeatures(): string[] {
    return Array.from(this.supportedFeatures);
  }
  
  /**
   * Handle an unsupported feature request.
   * @param feature The unsupported feature
   * @param context Additional context
   */
  protected handleUnsupportedFeature(feature: string, context?: Record<string, unknown>): never {
    this.unsupportedFeatureHandler(feature, 'throw', context);
    throw new Error(`Unsupported feature: ${feature}`); // Fallback in case handler doesn't throw
  }
  
  /**
   * Get capabilities of the provider.
   * @returns Capabilities object
   */
  public getCapabilities(): ChatProviderCapabilities {
    return { ...this.capabilities };
  }
  
  /**
   * Check if a capability is supported.
   * @param capability The capability to check
   * @returns True if the capability is supported, false otherwise
   */
  public hasCapability(capability: string): boolean {
    return Boolean(this.capabilities[capability]);
  }
  
  /**
   * Check if the provider supports a set of required capabilities.
   * @param capabilities Array of required capabilities
   * @returns Object containing the result of the check
   */
  public supportsCapabilities(capabilities: string[]): CapabilityCheckResult {
    const missingCapabilities: string[] = [];
    let supportedCount = 0;
    
    for (const capability of capabilities) {
      if (this.hasCapability(capability)) {
        supportedCount++;
      } else {
        missingCapabilities.push(capability);
      }
    }
    
    const matchScore = capabilities.length > 0 
      ? supportedCount / capabilities.length 
      : 1;
    
    return {
      supported: missingCapabilities.length === 0,
      missingCapabilities,
      matchScore,
      context: {
        provider: this.protocolInfo.name,
        totalCapabilities: capabilities.length,
        supportedCapabilities: supportedCount
      }
    };
  }
  
  /**
   * Register a handler for unsupported features.
   * @param handler The handler function
   * @returns A function to unregister the handler
   */
  public onUnsupportedFeature(
    handler: (featureName: string, context: Record<string, unknown>) => void
  ): () => void {
    this.unsupportedFeatureHandler = (featureName, _, context) => {
      handler(featureName, context || {});
    };
    
    return () => {
      this.unsupportedFeatureHandler = createThrowingHandler(this.protocolInfo.name);
    };
  }
  
  /**
   * Get the current connection status.
   * @returns Connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  /**
   * Get detailed connection information.
   * @returns Connection details
   */
  public getConnectionDetails(): ConnectionDetails {
    return { ...this.connectionDetails };
  }
  
  /**
   * Register a callback for connection status changes.
   * @param callback The callback function
   * @returns A function to unregister the callback
   */
  public onConnectionStatusChange(
    callback: (status: ConnectionStatus, details: ConnectionDetails) => void
  ): () => void {
    const handler = (status: ConnectionStatus, details: ConnectionDetails) => {
      callback(status, details);
    };
    
    this.events.on('connectionStatusChange', handler);
    
    return () => {
      this.events.off('connectionStatusChange', handler);
    };
  }
  
  /**
   * Get protocol information.
   * @returns Protocol info
   */
  public getProtocolInfo(): ProtocolInfo {
    return { ...this.protocolInfo };
  }
  
  /**
   * Check if the provider is connected.
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }
  
  /**
   * Update the connection status and emit a change event.
   * @param status New connection status
   * @param details Additional connection details
   */
  protected updateConnectionStatus(status: ConnectionStatus, details?: Partial<ConnectionDetails>): void {
    this.connectionStatus = status;
    this.connectionDetails = {
      ...this.connectionDetails,
      status,
      ...details
    };
    
    this.events.emit('connectionStatusChange', this.connectionStatus, this.connectionDetails);
  }
  
  /**
   * Connect to the chat service.
   * Must be implemented by subclasses.
   */
  public abstract connect(options?: Partial<EnhancedChatProviderOptions>): Promise<void>;
  
  /**
   * Disconnect from the chat service.
   * Must be implemented by subclasses.
   */
  public abstract disconnect(): Promise<void>;
  
  /**
   * Reconnect to the chat service.
   * Default implementation that disconnects and then connects.
   */
  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
  
  /**
   * Subscribe to an event.
   * @param event Event name
   * @param callback Callback function
   */
  public on(event: string, callback: (...args: unknown[]) => void): void {
    this.events.on(event, callback);
  }
  
  /**
   * Unsubscribe from an event.
   * @param event Event name
   * @param callback Callback function
   */
  public off(event: string, callback: (...args: unknown[]) => void): void {
    this.events.off(event, callback);
  }
  
  /**
   * Subscribe to an event once.
   * @param event Event name
   * @param callback Callback function
   */
  public once(event: string, callback: (...args: unknown[]) => void): void {
    this.events.once(event, callback);
  }
  
  /**
   * Send a message to a channel.
   * Must be implemented by subclasses.
   */
  public abstract sendMessage(channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage>;
  
  /**
   * Get messages from a channel.
   * Must be implemented by subclasses.
   */
  public abstract getMessages(channelId: string, limit?: number, before?: number): Promise<EnhancedChatMessage[]>;
  
  /**
   * Subscribe to messages in a channel.
   * Must be implemented by subclasses.
   */
  public abstract subscribeToMessages(channelId: string, callback: (message: EnhancedChatMessage) => void): () => void;
  
  /**
   * Edit a message.
   * Default implementation that throws an unsupported feature error.
   */
  public editMessage(messageId: string, channelId: string, newContent: string): Promise<EnhancedChatMessage> {
    return Promise.reject(this.handleUnsupportedFeature('editMessage', { messageId, channelId, newContent }));
  }
  
  /**
   * Delete a message.
   * Default implementation that throws an unsupported feature error.
   */
  public deleteMessage(messageId: string, channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('deleteMessage', { messageId, channelId }));
  }
  
  /**
   * Reply to a message.
   * Default implementation that throws an unsupported feature error.
   */
  public replyToMessage(messageId: string, channelId: string, content: string, attachments?: File[]): Promise<EnhancedChatMessage> {
    return Promise.reject(this.handleUnsupportedFeature('replyToMessage', { messageId, channelId, content }));
  }
  
  /**
   * Forward a message to another channel.
   * Default implementation that throws an unsupported feature error.
   */
  public forwardMessage(messageId: string, sourceChannelId: string, targetChannelId: string): Promise<EnhancedChatMessage> {
    return Promise.reject(this.handleUnsupportedFeature('forwardMessage', { messageId, sourceChannelId, targetChannelId }));
  }
  
  /**
   * Add a reaction to a message.
   * Default implementation that throws an unsupported feature error.
   */
  public addReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('addReaction', { messageId, channelId, reaction }));
  }
  
  /**
   * Remove a reaction from a message.
   * Default implementation that throws an unsupported feature error.
   */
  public removeReaction(messageId: string, channelId: string, reaction: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('removeReaction', { messageId, channelId, reaction }));
  }
  
  /**
   * Create a channel.
   * Must be implemented by subclasses.
   */
  public abstract createChannel(name: string, type: string, participants: string[]): Promise<EnhancedChatChannel>;
  
  /**
   * Join a channel.
   * Must be implemented by subclasses.
   */
  public abstract joinChannel(channelId: string): Promise<void>;
  
  /**
   * Leave a channel.
   * Must be implemented by subclasses.
   */
  public abstract leaveChannel(channelId: string): Promise<void>;
  
  /**
   * Get all available channels.
   * Must be implemented by subclasses.
   */
  public abstract getChannels(): Promise<EnhancedChatChannel[]>;
  
  /**
   * Get details of a specific channel.
   * Default implementation that throws an unsupported feature error.
   */
  public getChannelDetails(channelId: string): Promise<EnhancedChatChannel> {
    return Promise.reject(this.handleUnsupportedFeature('getChannelDetails', { channelId }));
  }
  
  /**
   * Update a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public updateChannel(channelId: string, updates: Partial<EnhancedChatChannel>): Promise<EnhancedChatChannel> {
    return Promise.reject(this.handleUnsupportedFeature('updateChannel', { channelId, updates }));
  }
  
  /**
   * Delete a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public deleteChannel(channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('deleteChannel', { channelId }));
  }
  
  /**
   * Archive a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public archiveChannel(channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('archiveChannel', { channelId }));
  }
  
  /**
   * Unarchive a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public unarchiveChannel(channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('unarchiveChannel', { channelId }));
  }
  
  /**
   * Mute a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public muteChannel(channelId: string, duration?: number): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('muteChannel', { channelId, duration }));
  }
  
  /**
   * Unmute a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public unmuteChannel(channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('unmuteChannel', { channelId }));
  }
  
  /**
   * Pin a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public pinChannel(channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('pinChannel', { channelId }));
  }
  
  /**
   * Unpin a channel.
   * Default implementation that throws an unsupported feature error.
   */
  public unpinChannel(channelId: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('unpinChannel', { channelId }));
  }
  
  /**
   * Get users in a channel.
   * Must be implemented by subclasses.
   */
  public abstract getUsers(channelId: string): Promise<EnhancedChatUser[]>;
  
  /**
   * Get a user by ID.
   * Must be implemented by subclasses.
   */
  public abstract getUserById(userId: string): Promise<EnhancedChatUser | null>;
  
  /**
   * Get the current user.
   * Default implementation that returns a basic user object.
   */
  public getCurrentUser(): EnhancedChatUser {
    return {
      id: this.options.userId || 'unknown',
      name: this.options.userName || 'Unknown User',
      status: 'online'
    };
  }
  
  /**
   * Subscribe to user presence in a channel.
   * Must be implemented by subclasses.
   */
  public abstract subscribeToUserPresence(channelId: string, callback: (users: EnhancedChatUser[]) => void): () => void;
  
  /**
   * Update the current user's status.
   * Default implementation that throws an unsupported feature error.
   */
  public updateUserStatus(status: string, customStatus?: string): Promise<void> {
    return Promise.reject(this.handleUnsupportedFeature('updateUserStatus', { status, customStatus }));
  }
  
  /**
   * Mark messages as read.
   * Must be implemented by subclasses.
   */
  public abstract markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void>;
  
  /**
   * Search for messages.
   * Default implementation that throws an unsupported feature error.
   */
  public searchMessages(query: string, channelId?: string, options?: SearchOptions): Promise<SearchResult> {
    return Promise.reject(this.handleUnsupportedFeature('searchMessages', { query, channelId, options }));
  }
  
  /**
   * Upload a file attachment.
   * Must be implemented by subclasses.
   */
  public abstract uploadAttachment(file: File): Promise<{ id: string; url: string; }>;
  
  /**
   * Create a thread from a message.
   * Default implementation that throws an unsupported feature error.
   */
  public createThread(messageId: string, channelId: string, content: string): Promise<EnhancedChatMessage> {
    return Promise.reject(this.handleUnsupportedFeature('createThread', { messageId, channelId, content }));
  }
  
  /**
   * Get messages in a thread.
   * Default implementation that throws an unsupported feature error.
   */
  public getThreadMessages(threadId: string, limit?: number, before?: number): Promise<EnhancedChatMessage[]> {
    return Promise.reject(this.handleUnsupportedFeature('getThreadMessages', { threadId, limit, before }));
  }
  
  /**
   * Subscribe to messages in a thread.
   * Default implementation that throws an unsupported feature error.
   */
  public subscribeToThreadMessages(threadId: string, callback: (message: EnhancedChatMessage) => void): () => void {
    this.handleUnsupportedFeature('subscribeToThreadMessages', { threadId });
    return () => {}; // Return no-op unsubscribe function
  }
}
