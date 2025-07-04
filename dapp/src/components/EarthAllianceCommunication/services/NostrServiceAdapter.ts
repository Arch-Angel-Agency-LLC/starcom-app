import { Message, Channel, ConnectionState, NostrConfig, Attachment } from '../types';
import NostrService from '../../../services/nostrService';
import type { NostrMessage, NostrTeamChannel, ResistanceCellChannel } from '../../../services/nostrService';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils';

/**
 * The NostrServiceAdapter adapts the core NostrService to work with the 
 * EarthAllianceCommunicationPanel component. It handles reconnection,
 * message queuing, and emergency features.
 */
export class NostrServiceAdapter {
  private connectionState: ConnectionState = 'disconnected';
  private messageListeners: Array<(message: Message) => void> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private nostrService: any; // Using any to avoid TypeScript errors with the singleton
  private config: NostrConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: Message[] = [];
  private activeChannels: Set<string> = new Set();
  private emergencyChannelIds: string[] = [];
  private isEmergencyActive: boolean = false;
  private eventListeners: { [key: string]: (event: Event) => void } = {};
  
  constructor(config: NostrConfig) {
    this.config = config;
    logger.info('NostrServiceAdapter initialized with config:', config);
    
    // Initialize the NostrService with the provided endpoints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.nostrService = (NostrService as any).getInstance({
      defaultRelays: [...config.endpoints, ...config.fallbackEndpoints],
      autoReconnect: true,
      reconnectInterval: config.reconnectStrategy.initialDelay,
      eventTimeoutMs: 10000
    });
    
    // Set up event listeners for the NostrService
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for the NostrService
   */
  private setupEventListeners() {
    // Listen for message events
    this.eventListeners.message = ((event: CustomEvent<NostrMessage>) => {
      const nostrMessage = event.detail;
      const message = this.convertNostrMessageToMessage(nostrMessage);
      
      // Notify all listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          logger.error('Error in message listener:', error);
        }
      });
    }) as EventListener;
    
    window.addEventListener('nostr-message-received', this.eventListeners.message);
    
    // Listen for connection state changes
    this.eventListeners.connectionState = ((event: CustomEvent<string>) => {
      const state = event.detail;
      
      switch (state) {
        case 'connected':
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          break;
        case 'disconnected':
          this.connectionState = 'disconnected';
          this.attemptReconnect();
          break;
        case 'connecting':
          this.connectionState = 'connecting';
          break;
        case 'error':
          this.connectionState = 'error';
          this.attemptReconnect();
          break;
      }
    }) as EventListener;
    
    window.addEventListener('nostr-connection-state', this.eventListeners.connectionState);
    
    // Listen for emergency declarations
    this.eventListeners.emergency = ((event: CustomEvent<{ active: boolean, reason?: string }>) => {
      const data = event.detail;
      this.isEmergencyActive = data.active;
      
      // If emergency was declared, fetch emergency channels
      if (data.active) {
        this.fetchEmergencyChannels();
        
        // Also listen for earth-alliance-emergency-coordination events
        logger.info('Emergency mode activated, listening for coordination events');
      } else {
        logger.info('Emergency mode deactivated');
      }
    }) as EventListener;
    
    window.addEventListener('nostr-emergency', this.eventListeners.emergency);
    
    // Listen for emergency coordination messages from NostrService
    this.eventListeners.emergencyCoordination = ((event: CustomEvent<NostrMessage>) => {
      const emergencyMessage = event.detail;
      logger.info('Emergency coordination received:', emergencyMessage.id);
      
      // Convert to our message format and notify listeners
      const message = this.convertNostrMessageToMessage(emergencyMessage);
      
      // Mark as high priority
      message.priority = 10;
      
      // Notify all listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          logger.error('Error in emergency message listener:', error);
        }
      });
    }) as EventListener;
    
    window.addEventListener('earth-alliance-emergency-coordination', this.eventListeners.emergencyCoordination);
  }
  
  /**
   * Clean up event listeners
   */
  private cleanupEventListeners() {
    if (this.eventListeners.message) {
      window.removeEventListener('nostr-message-received', this.eventListeners.message);
    }
    
    if (this.eventListeners.connectionState) {
      window.removeEventListener('nostr-connection-state', this.eventListeners.connectionState);
    }
    
    if (this.eventListeners.emergency) {
      window.removeEventListener('nostr-emergency', this.eventListeners.emergency);
    }
    
    if (this.eventListeners.emergencyCoordination) {
      window.removeEventListener('earth-alliance-emergency-coordination', this.eventListeners.emergencyCoordination);
    }
  }
  
  /**
   * Connect to NostrService
   */
  async connect(): Promise<void> {
    logger.info('NostrServiceAdapter.connect() called');
    
    if (this.connectionState === 'connected') {
      logger.info('Already connected to NostrService');
      return;
    }
    
    this.connectionState = 'connecting';
    
    try {
      await this.nostrService.initialize();
      this.connectionState = 'connected';
      logger.info('Successfully connected to NostrService');
      
      // Process any queued messages
      this.processMessageQueue();
      
      // Fetch emergency channels in case we're in emergency mode
      if (this.isEmergencyActive) {
        await this.fetchEmergencyChannels();
      }
    } catch (error) {
      logger.error('Failed to connect to NostrService:', error);
      this.connectionState = 'error';
      this.attemptReconnect();
      throw error;
    }
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Stop after max attempts
    if (this.reconnectAttempts >= this.config.reconnectStrategy.maxAttempts) {
      logger.warn('Max reconnect attempts reached');
      return;
    }
    
    // Calculate backoff delay with exponential increase capped at maxDelay
    const delay = Math.min(
      this.config.reconnectStrategy.initialDelay * Math.pow(2, this.reconnectAttempts),
      this.config.reconnectStrategy.maxDelay
    );
    
    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        
        // Re-join all active channels
        const channelPromises = Array.from(this.activeChannels).map(channelId => 
          this.joinChannel(channelId)
        );
        
        await Promise.allSettled(channelPromises);
      } catch (error) {
        logger.error('Reconnect attempt failed:', error);
      }
    }, delay);
  }
  
  /**
   * Disconnect from NostrService
   */
  async disconnect(): Promise<void> {
    logger.info('NostrServiceAdapter.disconnect() called');
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Leave all active channels
    const leavePromises = Array.from(this.activeChannels).map(channelId => 
      this.leaveChannel(channelId)
    );
    
    await Promise.allSettled(leavePromises);
    this.activeChannels.clear();
    
    // Clean up event listeners
    this.cleanupEventListeners();
    
    try {
      // NostrService doesn't have a disconnect method, so we'll just unsubscribe from all channels
      this.activeChannels.forEach(channelId => {
        this.nostrService.unsubscribeFromChannel(channelId);
      });
      
      this.connectionState = 'disconnected';
      logger.info('Successfully disconnected from NostrService');
    } catch (error) {
      logger.error('Error disconnecting from NostrService:', error);
      throw error;
    }
  }
  
  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: (message: Message) => void): void {
    this.messageListeners.push(callback);
  }
  
  /**
   * Remove a message callback
   */
  offMessage(callback: (message: Message) => void): void {
    this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
  }
  
  /**
   * Send a message to a channel
   */
  async sendMessage(message: Message): Promise<void> {
    logger.info('NostrServiceAdapter.sendMessage() called');
    
    // Queue message if not connected
    if (this.connectionState !== 'connected') {
      logger.warn('Not connected to NostrService, queueing message');
      this.messageQueue.push(message);
      return;
    }
    
    try {
      // Send message through NostrService
      await this.nostrService.sendMessage(
        message.channelId,
        message.content,
        message.priority > 5 ? 'alert' : 'text',
        {
          priority: message.priority,
          attachments: message.attachments,
          signature: message.signature,
          encryption: message.encryption
        }
      );
      
      logger.info('Message sent successfully:', message.id);
    } catch (error) {
      logger.error('Error sending message:', error);
      
      // Queue message for retry
      this.messageQueue.push(message);
      throw error;
    }
  }
  
  /**
   * Process queued messages
   */
  private async processMessageQueue() {
    if (this.connectionState !== 'connected' || this.messageQueue.length === 0) {
      return;
    }
    
    logger.info(`Processing message queue (${this.messageQueue.length} messages)`);
    
    // Sort by priority (higher first)
    const sortedQueue = [...this.messageQueue].sort((a, b) => b.priority - a.priority);
    this.messageQueue = [];
    
    // Process in batches
    const batchSize = this.config.batchSize;
    for (let i = 0; i < sortedQueue.length; i += batchSize) {
      const batch = sortedQueue.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(message => this.sendMessage(message).catch(error => {
        logger.error('Error processing queued message:', error);
        return error;
      }));
      
      await Promise.allSettled(promises);
      
      // Give the system a small break between batches
      if (i + batchSize < sortedQueue.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    logger.info('Message queue processing complete');
  }
  
  /**
   * Join a channel
   */
  async joinChannel(channelId: string): Promise<void> {
    logger.info('NostrServiceAdapter.joinChannel() called with:', channelId);
    
    try {
      await this.nostrService.joinTeamChannel(channelId);
      this.nostrService.subscribeToChannel(channelId);
      this.activeChannels.add(channelId);
      logger.info('Successfully joined channel:', channelId);
    } catch (error) {
      logger.error('Error joining channel:', error);
      throw error;
    }
  }
  
  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string): Promise<void> {
    logger.info('NostrServiceAdapter.leaveChannel() called with:', channelId);
    
    try {
      this.nostrService.unsubscribeFromChannel(channelId);
      this.activeChannels.delete(channelId);
      logger.info('Successfully left channel:', channelId);
    } catch (error) {
      logger.error('Error leaving channel:', error);
      throw error;
    }
  }
  
  /**
   * Get information about a channel
   */
  async getChannelInfo(channelId: string): Promise<Channel> {
    logger.info('NostrServiceAdapter.getChannelInfo() called with:', channelId);
    
    try {
      // Assume the NostrService has a way to get channel info
      // If not, we'll create a mock channel
      const nostrChannel = this.nostrService.getTeamChannel?.(channelId);
      
      if (nostrChannel) {
        return this.convertNostrChannelToChannel(nostrChannel);
      }
      
      // Fallback to a mock channel
      return {
        id: channelId,
        name: `Channel ${channelId.substring(0, 8)}`,
        description: 'Channel for Earth Alliance communications',
        securityLevel: 2,
        participants: [],
        isEncrypted: true,
        allowsAttachments: true,
        maxMessageSize: 16 * 1024
      };
    } catch (error) {
      logger.error('Error getting channel info:', error);
      
      // Return a minimal channel object as fallback
      return {
        id: channelId,
        name: 'Unknown Channel',
        description: 'Unable to fetch channel information',
        securityLevel: 1,
        participants: [],
        isEncrypted: false,
        allowsAttachments: false,
        maxMessageSize: 1000
      };
    }
  }
  
  /**
   * Get all emergency channels
   */
  async getEmergencyChannels(): Promise<Channel[]> {
    logger.info('NostrServiceAdapter.getEmergencyChannels() called');
    
    try {
      const channels = await this.fetchEmergencyChannels();
      return channels;
    } catch (error) {
      logger.error('Error getting emergency channels:', error);
      return [];
    }
  }
  
  /**
   * Fetch emergency channels and cache IDs
   */
  private async fetchEmergencyChannels(): Promise<Channel[]> {
    try {
      logger.info('Fetching emergency channels from NostrService');
      
      // Get all team channels and filter for emergency ones
      const teamChannels = await this.nostrService.getTeamChannels();
      
      // Convert NostrTeamChannel to our Channel type
      const emergencyChannels: Channel[] = teamChannels
        .filter(channel => channel.channelType === 'emergency')
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          securityLevel: this.convertClearanceLevelToSecurityLevel(channel.clearanceLevel),
          participants: channel.participants,
          isEncrypted: channel.encryptionKey !== undefined,
          allowsAttachments: true,
          maxMessageSize: 16 * 1024 // Default to 16KB if not specified
        }));
      
      // If no emergency channels found, create fallback emergency channels
      if (emergencyChannels.length === 0) {
        logger.warn('No emergency channels found, using fallback channels');
        
        const fallbackChannels: Channel[] = [
          {
            id: 'emergency-global',
            name: 'Global Emergency',
            description: 'Earth Alliance global emergency coordination',
            securityLevel: 4,
            participants: [],
            isEncrypted: true,
            allowsAttachments: true,
            maxMessageSize: 16 * 1024
          },
          {
            id: 'emergency-alert',
            name: 'Emergency Alerts',
            description: 'Critical alerts during emergencies',
            securityLevel: 3,
            participants: [],
            isEncrypted: true,
            allowsAttachments: true,
            maxMessageSize: 16 * 1024
          }
        ];
        
        // Add fallback channels to the emergency channels
        emergencyChannels.push(...fallbackChannels);
      }
      
      // Cache emergency channel IDs
      this.emergencyChannelIds = emergencyChannels.map(channel => channel.id);
      
      return emergencyChannels;
    } catch (error) {
      logger.error('Error fetching emergency channels:', error);
      throw error;
    }
  }
  
  /**
   * Declare an emergency situation
   */
  async declareEmergency(reason: string): Promise<void> {
    logger.info('NostrServiceAdapter.declareEmergency() called with:', reason);
    
    try {
      // Send an emergency coordination to all active channels
      for (const channelId of this.activeChannels) {
        await this.nostrService.sendEmergencyCoordination(
          channelId,
          'operational_security', // Type of emergency
          'critical', // Urgency level
          {
            description: reason,
            actionRequired: 'Activate emergency protocols and maintain secure communications',
            timeframe: 'Immediate',
            affectedRegions: ['All'],
            resourcesNeeded: ['Secure communication channels']
          }
        );
      }
      
      // Set emergency active flag
      this.isEmergencyActive = true;
      
      // Dispatch a custom event to notify the system of emergency mode
      const emergencyEvent = new CustomEvent('nostr-emergency', {
        detail: { active: true, reason }
      });
      window.dispatchEvent(emergencyEvent);
      
      // Fetch and join emergency channels
      const emergencyChannels = await this.fetchEmergencyChannels();
      
      // Join all emergency channels
      for (const channel of emergencyChannels) {
        await this.joinChannel(channel.id).catch(error => {
          logger.error(`Failed to join emergency channel ${channel.id}:`, error);
        });
      }
      
      // Dispatch a custom event for emergency declared
      const event = new CustomEvent('earth-alliance-emergency', {
        detail: {
          active: true,
          reason,
          timestamp: Date.now()
        }
      });
      
      window.dispatchEvent(event);
      
      logger.info('Emergency declared successfully');
    } catch (error) {
      logger.error('Error declaring emergency:', error);
      throw error;
    }
  }
  
  /**
   * Resolve an active emergency
   */
  async resolveEmergency(): Promise<void> {
    logger.info('NostrServiceAdapter.resolveEmergency() called');
    
    try {
      // Send a resolution message to all active channels
      for (const channelId of this.activeChannels) {
        await this.nostrService.sendEmergencyCoordination(
          channelId,
          'operational_security',
          'medium', // Lower urgency for resolution
          {
            description: 'EMERGENCY RESOLVED. Return to normal operations.',
            actionRequired: 'Resume standard protocols',
            timeframe: 'Immediate',
            affectedRegions: ['All'],
            resourcesNeeded: []
          }
        );
      }
      
      // Set emergency inactive flag
      this.isEmergencyActive = false;
      
      // Dispatch a custom event to notify the system emergency is resolved
      const emergencyEvent = new CustomEvent('nostr-emergency', {
        detail: { active: false }
      });
      window.dispatchEvent(emergencyEvent);
      this.isEmergencyActive = false;
      
      // Dispatch a custom event for emergency resolved
      const event = new CustomEvent('earth-alliance-emergency', {
        detail: {
          active: false,
          timestamp: Date.now()
        }
      });
      
      window.dispatchEvent(event);
      
      logger.info('Emergency resolved successfully');
    } catch (error) {
      logger.error('Error resolving emergency:', error);
      throw error;
    }
  }
  
  /**
   * Convert a NostrMessage to our Message format
   */
  private convertNostrMessageToMessage(nostrMessage: NostrMessage): Message {
    // Extract attachments from metadata if present
    const attachments: Attachment[] = [];
    
    if (nostrMessage.metadata?.attachments) {
      const nostrAttachments = nostrMessage.metadata.attachments as {
        id?: string;
        type?: string;
        url: string;
        name?: string;
        size?: number;
      }[];
      
      for (const att of nostrAttachments) {
        attachments.push({
          id: att.id || uuidv4(),
          type: att.type || 'unknown',
          url: att.url,
          name: att.name || 'attachment',
          size: att.size || 0
        });
      }
    }
    
    // Convert to Message format
    return {
      id: nostrMessage.id,
      senderId: nostrMessage.senderId,
      content: nostrMessage.content,
      timestamp: nostrMessage.timestamp,
      priority: nostrMessage.messageType === 'alert' ? 10 : 
               (nostrMessage.metadata?.priority as number) || 1,
      signature: nostrMessage.signature,
      encryption: nostrMessage.encrypted ? 'aes-256-gcm' : undefined,
      attachments,
      channelId: nostrMessage.channelId
    };
  }
  
  /**
   * Convert a NostrTeamChannel to our Channel format
   */
  private convertNostrChannelToChannel(nostrChannel: NostrTeamChannel | ResistanceCellChannel): Channel {
    // Map clearance level to security level
    let securityLevel = 1;
    if (nostrChannel.clearanceLevel === 'TOP_SECRET') {
      securityLevel = 4;
    } else if (nostrChannel.clearanceLevel === 'SECRET') {
      securityLevel = 3;
    } else if (nostrChannel.clearanceLevel === 'CONFIDENTIAL') {
      securityLevel = 2;
    }
    
    return {
      id: nostrChannel.id,
      name: nostrChannel.name,
      description: nostrChannel.description,
      securityLevel,
      participants: nostrChannel.participants,
      isEncrypted: Boolean(nostrChannel.encryptionKey || nostrChannel.pqcKey),
      allowsAttachments: true, // Assume all channels allow attachments
      maxMessageSize: 16 * 1024 // 16KB default max message size
    };
  }
  
  /**
   * Convert a NostrService ClearanceLevel to a securityLevel number
   */
  private convertClearanceLevelToSecurityLevel(clearanceLevel?: string): number {
    if (!clearanceLevel) return 1;
    
    switch (clearanceLevel) {
      case 'TOP_SECRET':
        return 5;
      case 'SECRET':
        return 4;
      case 'CONFIDENTIAL':
        return 3;
      case 'RESTRICTED':
        return 2;
      case 'UNCLASSIFIED':
      default:
        return 1;
    }
  }
}
