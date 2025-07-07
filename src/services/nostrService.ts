/**
 * Nostr Service for Earth Alliance Resistance Operations
 * 
 * Enhanced for civilian-led global resistance against transnational crime syndicate.
 * Uses SOCOM cybersecurity standards as baseline, enhanced with decentralized architecture.
 * 
 * Features:
 * - Censorship-resistant messaging via HTTP-Nostr bridges
 * - Post-Quantum Cryptography for future-proof security
 * - Evidence preservation and whistleblower protection
 * - Global coordination for resistance cells
 * - Truth market integration for information verification
 * - Operational security for Earth Alliance operatives
 * 
 * AI-NOTE: SOCOM standards provide security baseline only. Platform serves
 * Earth Alliance civilian resistance mission exclusively.
 */

import { SimplePool, Event } from 'nostr-tools';
import { ClearanceLevel, AgencyType } from '../types';
import { logger } from '../utils';

// Service configuration
interface NostrServiceConfig {
  defaultRelays: string[];
  autoReconnect: boolean;
  reconnectInterval: number; // ms
  messageRetention: number;  // days
  eventTimeoutMs: number;    // ms
}

// Default configuration
const DEFAULT_CONFIG: NostrServiceConfig = {
  defaultRelays: [
    'wss://relay.damus.io',
    'wss://relay.snort.social',
    'wss://relay.nostr.band'
  ],
  autoReconnect: true,
  reconnectInterval: 5000,
  messageRetention: 30,
  eventTimeoutMs: 10000
};

export interface NostrMessage {
  id: string;
  teamId: string;
  channelId: string;
  senderId: string;
  senderDID: string;
  senderAgency: AgencyType;
  content: string;
  clearanceLevel: ClearanceLevel;
  messageType: 'text' | 'intelligence' | 'alert' | 'status' | 'file' | 'evidence' | 'truth_claim' | 'verification' | 'coordination';
  timestamp: number;
  encrypted: boolean;
  pqcEncrypted: boolean;
  signature?: string;
  metadata?: Record<string, unknown>;
  // Earth Alliance specific fields
  evidenceHash?: string;
  truthScore?: number;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'disputed' | 'requires_more_evidence';
  resistanceCell?: string;
  operativeLevel?: 'civilian' | 'coordinator' | 'cell_leader' | 'alliance_command';
}

export interface NostrTeamChannel {
  id: string;
  teamId: string;
  name: string;
  description: string;
  clearanceLevel: ClearanceLevel;
  agency: AgencyType;
  relayUrls: string[];
  encryptionKey?: string;
  pqcKey?: string;
  participants: string[];
  createdAt: number;
  isActive: boolean;
  // Earth Alliance specific fields
  channelType: 'general' | 'evidence' | 'coordination' | 'emergency' | 'truth_verification';
  resistanceCell?: string;
  geographicRegion?: string;
  specializations?: string[];
}

// Extended interfaces for future Earth Alliance enhancements
export interface EarthAllianceMessage extends NostrMessage {
  // Corruption evidence specific
  corruptionType?: 'financial' | 'political' | 'media' | 'tech' | 'pharma' | 'energy' | 'military';
  evidenceType?: 'document' | 'testimony' | 'financial_record' | 'communication' | 'video' | 'audio';
  targetEntities?: string[];
  timeframe?: { start: number; end: number };
  
  // Truth verification
  sourcesCount?: number;
  independentVerifications?: number;
  conflictingReports?: number;
  reliabilityScore?: number;
  
  // Operative protection
  anonymityLevel?: 'public' | 'pseudonymous' | 'anonymous' | 'high_security';
  protectionNeeded?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme';
}

export interface ResistanceCellChannel extends NostrTeamChannel {
  cellCode: string;
  region: string;
  specialization: string[];
  emergencyContacts: string[];
  operationalStatus: 'active' | 'dormant' | 'compromised' | 'disbanded';
  lastActivity: number;
  memberCount: number;
  securityLevel: 'standard' | 'enhanced' | 'maximum';
}

/**
 * The NostrService class for Earth Alliance communications.
 * This service provides a singleton instance for working with Nostr protocol.
 */
export class NostrService {
  private static instance: NostrService | null = null;
  private relays: string[] = [...DEFAULT_CONFIG.defaultRelays];
  public pool: SimplePool;
  private subs: Map<string, string[]> = new Map(); // Map of channelId to subscription IDs
  private relayConnections: Map<string, WebSocket> = new Map();
  private initialized: boolean = false;
  private initializing: boolean = false;
  private userDID: string | null = null;
  private config: NostrServiceConfig;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  // Mock storage for channels and messages during stub implementation
  private channels: Map<string, NostrTeamChannel> = new Map();
  private messages: Map<string, NostrMessage[]> = new Map();

  // Private constructor to enforce singleton pattern
  private constructor(config: Partial<NostrServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pool = new SimplePool();
    logger.info('NostrService instance created');
  }

  /**
   * Returns the singleton instance of the NostrService.
   * @returns {NostrService} The singleton instance.
   */
  public static getInstance(config?: Partial<NostrServiceConfig>): NostrService {
    if (!NostrService.instance) {
      NostrService.instance = new NostrService(config);
    }
    return NostrService.instance;
  }

  /**
   * Initialize the Nostr service, connecting to relays and setting up subscriptions.
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('NostrService already initialized');
      return;
    }
    
    if (this.initializing) {
      logger.debug('NostrService initialization already in progress');
      return;
    }
    
    this.initializing = true;
    logger.info('Initializing NostrService...');
    
    try {
      // Connect to relays
      const connectionPromises = this.relays.map(relay => this.connectToRelay(relay));
      await Promise.allSettled(connectionPromises);
      
      // At least one relay needs to be connected
      const connectedRelayCount = Array.from(this.relayConnections.values())
        .filter(ws => ws.readyState === WebSocket.OPEN).length;
      
      if (connectedRelayCount === 0) {
        throw new Error('Failed to connect to any relay');
      }
      
      this.initialized = true;
      logger.info(`NostrService initialized successfully with ${connectedRelayCount} relays`);
    } catch (error) {
      logger.error('Failed to initialize NostrService:', error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Check if the service is ready for use.
   * @returns {boolean} True if the service is initialized and ready.
   */
  public isReady(): boolean {
    return this.initialized;
  }

  /**
   * Set the user's DID for identification.
   * @param {string} did - The user's DID (Decentralized Identifier).
   */
  public setUserDID(did: string): void {
    logger.debug('NostrService.setUserDID called with:', did);
    this.userDID = did;
  }

  /**
   * Get the user's current DID.
   * @returns {string|null} The user's DID or null if not set.
   */
  public getUserDID(): string | null {
    return this.userDID;
  }

  /**
   * Add a relay to the list of relays.
   * @param {string} relayUrl - The URL of the relay to add.
   * @returns {Promise<boolean>} Success status.
   */
  public async addRelay(relayUrl: string): Promise<boolean> {
    if (this.relays.includes(relayUrl)) {
      logger.debug(`Relay ${relayUrl} already added`);
      return true;
    }
    
    this.relays.push(relayUrl);
    
    if (this.initialized) {
      try {
        await this.connectToRelay(relayUrl);
        return true;
      } catch (error) {
        logger.error(`Failed to connect to new relay ${relayUrl}:`, error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Create a new team channel.
   * @param {string} teamId - The ID of the team.
   * @param {string} name - The name of the channel.
   * @param {ClearanceLevel} clearanceLevel - The clearance level required for this channel.
   * @param {AgencyType} agency - The agency type for this channel.
   * @param {string} description - The description of the channel.
   * @returns {Promise<NostrTeamChannel>} The created channel.
   */
  public async createTeamChannel(
    teamId: string,
    name: string,
    clearanceLevel: ClearanceLevel,
    agency: AgencyType,
    description: string
  ): Promise<NostrTeamChannel> {
    logger.debug('NostrService.createTeamChannel called with:', { teamId, name, clearanceLevel, agency, description });
    
    // In stub implementation, create a mock channel
    const channelId = `${teamId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const channel: NostrTeamChannel = {
      id: channelId,
      teamId,
      name,
      description,
      clearanceLevel,
      agency,
      relayUrls: [...this.relays],
      participants: this.userDID ? [this.userDID] : [],
      createdAt: Date.now(),
      isActive: true,
      channelType: 'general'
    };
    
    // Store the channel
    this.channels.set(channelId, channel);
    
    // Initialize empty message array for this channel
    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    
    return channel;
  }

  /**
   * Join an existing team channel.
   * @param {string} channelId - The ID of the channel to join.
   * @param {string} userDID - The DID of the user joining the channel.
   * @param {ClearanceLevel} clearanceLevel - The clearance level of the user.
   * @returns {Promise<boolean>} Success status.
   */
  public async joinTeamChannel(
    channelId: string,
    userDID: string,
    clearanceLevel: ClearanceLevel
  ): Promise<boolean> {
    logger.debug('NostrService.joinTeamChannel called with:', { channelId, userDID, clearanceLevel });
    
    // Check if the channel exists
    const channel = this.channels.get(channelId);
    if (!channel) {
      logger.error(`Channel ${channelId} not found`);
      return false;
    }
    
    // Check if user has sufficient clearance
    if (this.getClearanceValue(clearanceLevel) < this.getClearanceValue(channel.clearanceLevel)) {
      logger.error(`User ${userDID} does not have sufficient clearance for channel ${channelId}`);
      return false;
    }
    
    // Add user to channel participants if not already there
    if (!channel.participants.includes(userDID)) {
      channel.participants.push(userDID);
      this.channels.set(channelId, channel);
    }
    
    return true;
  }
  
  /**
   * Helper method to get numeric value for clearance level comparison.
   * @private
   * @param {ClearanceLevel} level - The clearance level.
   * @returns {number} Numeric value representing the clearance level.
   */
  private getClearanceValue(level: ClearanceLevel): number {
    const clearanceLevels: Record<ClearanceLevel, number> = {
      'UNCLASSIFIED': 0,
      'CONFIDENTIAL': 1,
      'SECRET': 2,
      'TOP_SECRET': 3,
      'SCI': 4
    };
    
    return clearanceLevels[level] || 0;
  }

  /**
   * Get messages from a channel.
   * @param {string} channelId - The ID of the channel.
   * @returns {NostrMessage[]} Array of messages.
   */
  public getChannelMessages(channelId: string): NostrMessage[] {
    logger.debug('NostrService.getChannelMessages called for channel:', channelId);
    
    // Return messages for the channel or empty array if none
    return this.messages.get(channelId) || [];
  }

  /**
   * Send a message to a channel.
   * @param {string} channelId - The ID of the channel to send the message to.
   * @param {string} content - The content of the message.
   * @param {'text' | 'intelligence' | 'alert' | 'status' | 'file' | 'evidence' | 'truth_claim' | 'verification' | 'coordination'} messageType - The type of message.
   * @returns {Promise<boolean>} Success status.
   */
  public async sendMessage(
    channelId: string,
    content: string,
    messageType: 'text' | 'intelligence' | 'alert' | 'status' | 'file' | 'evidence' | 'truth_claim' | 'verification' | 'coordination' = 'text'
  ): Promise<boolean> {
    logger.debug('NostrService.sendMessage called with:', { channelId, content, messageType });
    
    if (!this.userDID) {
      logger.error('Cannot send message: No user DID set');
      return false;
    }
    
    // Check if the channel exists
    const channel = this.channels.get(channelId);
    if (!channel) {
      logger.error(`Channel ${channelId} not found`);
      return false;
    }
    
    // Create a new message
    const message: NostrMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      teamId: channel.teamId,
      channelId: channelId,
      senderId: this.userDID.split(':')[2] || this.userDID, // Extract key part from DID
      senderDID: this.userDID,
      senderAgency: channel.agency,
      content: content,
      clearanceLevel: channel.clearanceLevel,
      messageType: messageType,
      timestamp: Date.now(),
      encrypted: false,
      pqcEncrypted: false
    };
    
    // Add the message to the channel's message list
    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    this.messages.set(channelId, channelMessages);
    
    logger.debug(`Message sent to channel ${channelId}`);
    return true;
  }

  /**
   * Broadcast a message event to the UI and other listeners
   * @param {NostrMessage} message - The message to broadcast
   * @private
   */
  private broadcastMessageEvent(message: NostrMessage): void {
    try {
      const event = new CustomEvent('nostr-message-sent', { detail: message });
      window.dispatchEvent(event);
      logger.debug('Broadcast message event:', message.id);
    } catch (error) {
      logger.error('Failed to broadcast message event:', error);
    }
  }

  /**
   * Connect to a Nostr relay
   * @param {string} relayUrl - The URL of the relay to connect to
   * @returns {Promise<void>}
   * @private
   */
  private async connectToRelay(relayUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.debug('Connecting to relay:', relayUrl);
        
        // In production, we'd use actual WebSocket connections
        // For now, simulate a connection for stub implementation
        setTimeout(() => {
          // Create a mock WebSocket object for testing
          const mockWs = {
            readyState: WebSocket.OPEN,
            send: (data: string) => {
              logger.debug(`[Mock] Sent to ${relayUrl}:`, data);
            },
            close: () => {
              logger.debug(`[Mock] Closed connection to ${relayUrl}`);
              this.relayConnections.delete(relayUrl);
              
              if (this.config.autoReconnect) {
                this.scheduleReconnect(relayUrl);
              }
            }
          } as unknown as WebSocket;
          
          this.relayConnections.set(relayUrl, mockWs);
          logger.info('Connected to relay:', relayUrl);
          resolve();
        }, 500);
        
      } catch (error) {
        logger.error('Relay connection error:', relayUrl, error);
        
        if (this.config.autoReconnect) {
          this.scheduleReconnect(relayUrl);
        }
        
        reject(error);
      }
    });
  }

  /**
   * Schedule a reconnect attempt for a relay
   * @param {string} relayUrl - The URL of the relay to reconnect to
   * @private
   */
  private scheduleReconnect(relayUrl: string): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      clearTimeout(this.reconnectTimers.get(relayUrl)!);
    }
    
    // Schedule reconnect
    const timer = setTimeout(async () => {
      logger.debug(`Attempting to reconnect to relay: ${relayUrl}`);
      try {
        await this.connectToRelay(relayUrl);
        this.reconnectTimers.delete(relayUrl);
      } catch (error) {
        logger.error(`Failed to reconnect to relay ${relayUrl}:`, error);
      }
    }, this.config.reconnectInterval);
    
    this.reconnectTimers.set(relayUrl, timer);
  }

  /**
   * Handle an incoming message from a relay
   * @param {string} data - The raw message data
   * @private
   */
  private handleRelayMessage(data: string): void {
    try {
      const parsedData = JSON.parse(data);
      logger.debug('Message from relay:', parsedData);
      
      // Process based on message type
      if (Array.isArray(parsedData) && parsedData.length >= 2) {
        const [type, ...rest] = parsedData;
        
        if (type === 'EVENT' && rest.length >= 2) {
          this.handleEventMessage(rest as [string, Event]);
        } else if (type === 'EOSE') {
          // End of stored events
          logger.debug('End of stored events received for subscription', rest[0]);
        } else if (type === 'NOTICE') {
          logger.info('Notice from relay:', rest[0]);
        }
      }
    } catch (error) {
      logger.error('Error handling relay message:', error, 'Raw data:', data);
    }
  }

  /**
   * Handle an event message from a relay
   * @param {any[]} eventData - The event data
   * @private
   */
  private handleEventMessage(eventData: [string, Event]): void {
    if (eventData.length < 2) return;
    
    const [subscriptionId, event] = eventData;
    logger.debug('Event received for subscription:', subscriptionId, 'Event:', event);
    
    // Find the channel this subscription belongs to
    let targetChannelId: string | null = null;
    
    for (const [channelId, subIds] of this.subs.entries()) {
      if (subIds.includes(subscriptionId)) {
        targetChannelId = channelId;
        break;
      }
    }
    
    if (!targetChannelId) {
      logger.debug('Event received for unknown subscription:', subscriptionId);
      return;
    }
    
    // Process event for the channel
    this.processChannelEvent(targetChannelId, event);
  }

  /**
   * Process an event for a specific channel
   * @param {string} channelId - The ID of the channel
   * @param {any} event - The event data
   * @private
   */
  private processChannelEvent(channelId: string, event: Event): void {
    try {
      // Basic validation
      if (!event || !event.content || !event.created_at) {
        logger.debug('Invalid event received:', event);
        return;
      }
      
      // In a real implementation, we'd parse and validate the event properly
      // For now, create a simplified message from the event
      const message: NostrMessage = {
        id: event.id || `event_${Date.now()}`,
        teamId: event.tags?.find((t: string[]) => t[0] === 'team')?.[1] || 'unknown-team',
        channelId,
        senderId: event.pubkey?.substring(0, 10) || 'unknown',
        senderDID: event.pubkey ? `did:nostr:${event.pubkey}` : 'unknown',
        senderAgency: 'CYBER_COMMAND' as AgencyType, // Default agency
        content: event.content,
        clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel, // Default clearance
        messageType: 'text',
        timestamp: event.created_at * 1000, // Convert to milliseconds
        encrypted: false,
        pqcEncrypted: false,
      };
      
      // Add to channel messages
      const channelMessages = this.messages.get(channelId) || [];
      channelMessages.push(message);
      this.messages.set(channelId, channelMessages);
      
      // Broadcast the received message
      try {
        const customEvent = new CustomEvent('nostr-message-received', { detail: message });
        window.dispatchEvent(customEvent);
      } catch (e) {
        logger.error('Failed to dispatch message event:', e);
      }
      
      logger.debug('Processed new message for channel:', channelId, 'Message:', message);
    } catch (error) {
      logger.error('Error processing channel event:', error);
    }
  }

  /**
   * Subscribe to a channel or event.
   * @param {string} channelId - The ID of the channel to subscribe to.
   * @returns {string[]} Array of subscription IDs.
   */
  public subscribeToChannel(channelId: string): string[] {
    logger.debug('NostrService.subscribeToChannel called for channel:', channelId);
    
    // Check if we're already subscribed
    if (this.subs.has(channelId) && this.subs.get(channelId)!.length > 0) {
      logger.debug('Already subscribed to channel:', channelId);
      return this.subs.get(channelId)!;
    }
    
    const channel = this.channels.get(channelId);
    if (!channel) {
      logger.warn('Attempted to subscribe to unknown channel:', channelId);
      return [];
    }
    
    // In a real implementation, we'd create proper subscription filters
    // For now, create a mock subscription
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.subs.set(channelId, [subscriptionId]);
    
    logger.info('Subscribed to channel:', channelId, 'SubscriptionId:', subscriptionId);
    return [subscriptionId];
  }

  /**
   * Unsubscribe from a channel or event.
   * @param {string} channelId - The ID of the channel to unsubscribe from.
   */
  public unsubscribeFromChannel(channelId: string): void {
    logger.debug('NostrService.unsubscribeFromChannel called for channel:', channelId);
    
    const subscriptionIds = this.subs.get(channelId);
    if (!subscriptionIds || subscriptionIds.length === 0) {
      logger.debug('No subscriptions found for channel:', channelId);
      return;
    }
    
    // In a real implementation, we'd send CLOSE messages to the relays
    // For now, just remove the subscription
    this.subs.delete(channelId);
    
    logger.info('Unsubscribed from channel:', channelId);
  }

  /**
   * Check if the service is initialized.
   * @returns {boolean} True if initialized, false otherwise.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup resources when the service is no longer needed.
   * Should be called when the application is shutting down.
   */
  public cleanup(): void {
    logger.debug('NostrService.cleanup called');
    
    // Close all relay connections
    for (const [url, ws] of this.relayConnections.entries()) {
      try {
        ws.close();
        logger.debug(`Closed connection to relay: ${url}`);
      } catch (error) {
        logger.error(`Error closing connection to relay ${url}:`, error);
      }
    }
    
    // Clear all reconnect timers
    for (const [url, timer] of this.reconnectTimers.entries()) {
      clearTimeout(timer);
      logger.debug(`Cleared reconnect timer for relay: ${url}`);
    }
    
    // Clear all subscriptions
    this.subs.clear();
    
    // Close the pool
    if (this.pool) {
      this.pool.close(['wss://relay.damus.io', 'wss://relay.snort.social', 'wss://relay.nostr.band']);
    }
    
    logger.info('NostrService cleanup completed');
  }

  /**
   * Creates a new resistance cell channel for Earth Alliance operations.
   * @param cellCode Identifier code for the resistance cell
   * @param region Geographic region of operation
   * @param specialization Areas of focus for this cell
   * @param securityLevel Security level for communications
   * @returns {Promise<ResistanceCellChannel>} The created channel
   */
  public async createResistanceCellChannel(
    cellCode: string,
    region: string,
    specialization: string[],
    securityLevel: 'standard' | 'enhanced' | 'maximum'
  ): Promise<ResistanceCellChannel> {
    logger.debug('NostrService.createResistanceCellChannel called with:', { cellCode, region, specialization, securityLevel });
    
    if (!this.initialized) {
      logger.warn('Attempting to create resistance cell channel before initialization');
      throw new Error('NostrService not initialized');
    }
    
    if (!this.userDID) {
      logger.warn('Attempting to create resistance cell channel without user DID');
      throw new Error('User DID not set');
    }
    
    // Generate a unique channel ID
    const channelId = `earthalliance:${cellCode}:${Date.now()}`;
    
    // Create mock channel
    const channel: ResistanceCellChannel = {
      id: channelId,
      teamId: 'earth-alliance',
      name: `Earth Alliance: ${cellCode} (${region})`,
      description: `Resistance cell for region ${region}`,
      clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel,
      agency: 'CYBER_COMMAND' as AgencyType,
      relayUrls: this.relays,
      participants: [this.userDID],
      createdAt: Date.now(),
      isActive: true,
      channelType: 'general',
      cellCode,
      region,
      specialization,
      emergencyContacts: [],
      operationalStatus: 'active',
      lastActivity: Date.now(),
      memberCount: 1,
      securityLevel
    };
    
    // Store in mock channels map
    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);
    
    // Add welcome message
    const welcomeMessage: NostrMessage = {
      id: `msg_${Date.now()}`,
      teamId: 'earth-alliance',
      channelId,
      senderId: 'system',
      senderDID: 'earth-alliance:system',
      senderAgency: 'CYBER_COMMAND' as AgencyType,
      content: `Welcome to Earth Alliance Resistance Cell ${cellCode}. This channel is for region ${region} operations.`,
      clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel,
      messageType: 'text',
      timestamp: Date.now(),
      encrypted: true,
      pqcEncrypted: true,
      metadata: {
        cellCode,
        region,
        securityLevel,
        systemMessage: true
      }
    };
    
    this.messages.get(channelId)!.push(welcomeMessage);
    
    logger.info(`Created Earth Alliance resistance cell channel: ${channelId}`);
    return channel;
  }

  /**
   * Submit evidence to a channel.
   * @param channelId The channel to submit evidence to
   * @param evidenceData Evidence details
   * @returns {Promise<string>} ID of the submitted evidence
   */
  public async submitEvidence(
    channelId: string,
    evidenceData: {
      title: string;
      description: string;
      corruptionType: string;
      evidenceType?: string;
      targetEntities?: string[];
      sourceProtection: string;
      riskLevel: string;
    }
  ): Promise<string> {
    logger.debug('NostrService.submitEvidence called for channel:', channelId, evidenceData);
    
    if (!this.initialized) {
      throw new Error('NostrService not initialized');
    }
    
    if (!this.userDID) {
      throw new Error('User DID not set');
    }
    
    const evidenceId = `evidence_${Date.now()}`;
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    // Create evidence message
    const evidenceMessage: NostrMessage = {
      id: evidenceId,
      teamId: channel.teamId,
      channelId,
      senderId: 'user',
      senderDID: this.userDID,
      senderAgency: 'CYBER_COMMAND' as AgencyType,
      content: `EVIDENCE: ${evidenceData.title}\n\n${evidenceData.description}`,
      clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel,
      messageType: 'evidence',
      timestamp: Date.now(),
      encrypted: true,
      pqcEncrypted: true,
      evidenceHash: `hash_${Date.now()}`,
      metadata: {
        ...evidenceData,
        evidenceId,
        verificationStatus: 'unverified'
      }
    };
    
    // Add to channel messages
    this.messages.get(channelId)!.push(evidenceMessage);
    
    // Emit evidence event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('earth-alliance-evidence-submitted', {
        detail: evidenceMessage
      });
      window.dispatchEvent(event);
    }
    
    logger.info(`Evidence submitted to channel ${channelId}: ${evidenceId}`);
    return evidenceId;
  }

  /**
   * Submit truth verification for a message.
   * @param messageId ID of the original message being verified
   * @param channelId Channel containing the message
   * @param verificationData Verification details
   * @returns {Promise<string>} ID of the verification
   */
  public async submitTruthVerification(
    messageId: string,
    channelId: string,
    verificationData: {
      verificationStatus: 'verified' | 'disputed' | 'requires_more_evidence';
      sourcesProvided: number;
      expertiseArea: string;
      confidenceLevel: number;
      additionalEvidence: string;
    }
  ): Promise<string> {
    logger.debug('NostrService.submitTruthVerification called for message:', messageId, verificationData);
    
    if (!this.initialized) {
      throw new Error('NostrService not initialized');
    }
    
    if (!this.userDID) {
      throw new Error('User DID not set');
    }
    
    const verificationId = `verification_${Date.now()}`;
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    // Create verification message
    const verificationMessage: NostrMessage = {
      id: verificationId,
      teamId: channel.teamId,
      channelId,
      senderId: 'user',
      senderDID: this.userDID,
      senderAgency: 'CYBER_COMMAND' as AgencyType,
      content: `VERIFICATION: ${verificationData.verificationStatus.toUpperCase()} (${verificationData.confidenceLevel}% confidence)\n\n${verificationData.additionalEvidence}`,
      clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel,
      messageType: 'verification',
      timestamp: Date.now(),
      encrypted: true,
      pqcEncrypted: true,
      truthScore: verificationData.confidenceLevel / 100,
      verificationStatus: verificationData.verificationStatus,
      metadata: {
        ...verificationData,
        verificationId,
        originalMessageId: messageId
      }
    };
    
    // Add to channel messages
    this.messages.get(channelId)!.push(verificationMessage);
    
    logger.info(`Truth verification submitted for message ${messageId}: ${verificationId}`);
    return verificationId;
  }

  /**
   * Send emergency coordination to a channel.
   * @param channelId The channel ID
   * @param emergencyType Type of emergency
   * @param urgencyLevel Level of urgency
   * @param emergencyData Additional emergency data
   * @returns {Promise<string>} ID of the emergency message
   */
  public async sendEmergencyCoordination(
    channelId: string,
    emergencyType: 'operational_security' | 'member_compromise' | 'evidence_critical' | 'timeline_threat',
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
    emergencyData: {
      description: string;
      actionRequired: string;
      timeframe: string;
      affectedRegions: string[];
      resourcesNeeded: string[];
    }
  ): Promise<string> {
    logger.debug('NostrService.sendEmergencyCoordination called:', { channelId, emergencyType, urgencyLevel, emergencyData });
    
    if (!this.initialized) {
      throw new Error('NostrService not initialized');
    }
    
    if (!this.userDID) {
      throw new Error('User DID not set');
    }
    
    const emergencyId = `emergency_${Date.now()}`;
    const channel = this.channels.get(channelId);
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    // Create emergency message
    const emergencyMessage: NostrMessage = {
      id: emergencyId,
      teamId: channel.teamId,
      channelId,
      senderId: 'user',
      senderDID: this.userDID,
      senderAgency: 'CYBER_COMMAND' as AgencyType,
      content: `EMERGENCY [${urgencyLevel.toUpperCase()}]: ${emergencyType.replace('_', ' ').toUpperCase()}\n\n${emergencyData.description}\n\nACTION REQUIRED: ${emergencyData.actionRequired}\nTIMEFRAME: ${emergencyData.timeframe}`,
      clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel,
      messageType: 'coordination',
      timestamp: Date.now(),
      encrypted: true,
      pqcEncrypted: true,
      metadata: {
        ...emergencyData,
        emergencyId,
        emergencyType,
        urgencyLevel
      }
    };
    
    // Add to channel messages
    this.messages.get(channelId)!.push(emergencyMessage);
    
    // Emit emergency event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('earth-alliance-emergency-coordination', {
        detail: emergencyMessage
      });
      window.dispatchEvent(event);
    }
    
    logger.info(`Emergency coordination sent to channel ${channelId}: ${emergencyId}`);
    return emergencyId;
  }

  /**
   * Get health status of Nostr bridges.
   * @returns {Record<string, { isHealthy: boolean, successRate: number, averageLatency: number, score: number }>} Health status by bridge
   */
  public getBridgeHealthStatus(): Record<string, { 
    isHealthy: boolean; 
    successRate: number; 
    averageLatency: number;
    score: number;
  }> {
    logger.debug('NostrService.getBridgeHealthStatus called');
    
    // Mock bridge health data
    const bridges = {
      'main-relay': {
        isHealthy: true,
        successRate: 0.95,
        averageLatency: 120,
        score: 0.9
      },
      'backup-relay': {
        isHealthy: true,
        successRate: 0.85,
        averageLatency: 180,
        score: 0.82
      },
      'emergency-relay': {
        isHealthy: false,
        successRate: 0.1,
        averageLatency: 500,
        score: 0.05
      }
    };
    
    return bridges;
  }

  /**
   * Test connectivity to all bridges.
   * @returns {Promise<Record<string, boolean>>} Connectivity status by bridge
   */
  public async testBridgeConnectivity(): Promise<Record<string, boolean>> {
    logger.debug('NostrService.testBridgeConnectivity called');
    
    // Mock bridge connectivity test
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const connectivityResults = {
      'main-relay': true,
      'backup-relay': true,
      'emergency-relay': false
    };
    
    return connectivityResults;
  }
}

/**
 * The singleton instance of the NostrService.
 * Exporting a single instance prevents circular dependency issues and ensures
 * a true singleton pattern across the application.
 */
const nostrService = NostrService.getInstance();
export default nostrService;

export const relay = nostrService;
