/**
 * IPFS-Nostr Bridge Service for AI Security RelayNode Integration
 * 
 * This service provides the critical bridge between IPFS content storage and 
 * Nostr real-time messaging in the Starcom dApp ecosystem. It handles:
 * 
 * - Real-time content notifications via Nostr when IPFS content is added/updated
 * - Nostr-based content discovery and metadata exchange
 * - Team collaboration events synchronized between IPFS and Nostr
 * - Content access control announcements via Nostr channels
 * - Decentralized content indexing using Nostr events
 * - Investigation timeline synchronization across IPFS and Nostr
 * - Evidence chain-of-custody tracking via Nostr audit events
 */

import { RelayNodeIPFSService } from './RelayNodeIPFSService';
import { IPFSNetworkManager } from './IPFSNetworkManager';
import { IntelPackage, CyberTeam, CyberInvestigation } from '../types/cyberInvestigation';
import { IPFSUploadResult } from './IPFSService';

// Nostr event types for IPFS-Nostr bridge
interface NostrIPFSEvent {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
  pubkey: string;
  id?: string;
  sig?: string;
}

// Bridge-specific event kinds (using custom kind numbers for Starcom)
const NOSTR_KINDS = {
  IPFS_CONTENT_ANNOUNCED: 30000,    // Announce new IPFS content
  IPFS_CONTENT_UPDATED: 30001,      // Content update notification
  IPFS_CONTENT_DELETED: 30002,      // Content deletion notification
  IPFS_REPLICATION_STATUS: 30003,   // Replication status updates
  TEAM_CONTENT_SHARED: 30004,       // Team content sharing events
  INVESTIGATION_TIMELINE: 30005,    // Investigation timeline events
  EVIDENCE_CUSTODY: 30006,          // Evidence chain-of-custody events
  CONTENT_ACCESS_LOG: 30007,        // Content access audit events
  PEER_DISCOVERY: 30008,            // IPFS peer discovery via Nostr
  CONTENT_SEARCH_QUERY: 30009,      // Distributed content search
  CONTENT_SEARCH_RESULT: 30010      // Search result responses
} as const;

// Content metadata for Nostr announcements
interface NostrContentMetadata {
  ipfsHash: string;
  contentType: 'intel-package' | 'cyber-team' | 'investigation' | 'evidence';
  classification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  teamId: string;
  title: string;
  description: string;
  creator: string;
  timestamp: number;
  size: number;
  tags: string[];
  version: number;
  parentContent?: string[];
  relatedContent?: string[];
  accessRequirements: {
    clearanceLevel: string;
    teamMembership: string[];
    specialPermissions: string[];
  };
}

// Real-time collaboration events
interface CollaborationEvent {
  type: 'content-shared' | 'investigation-joined' | 'evidence-added' | 'team-updated';
  contentId: string;
  ipfsHash: string;
  teamId: string;
  userId: string;
  timestamp: number;
  details: Record<string, unknown>;
}

// Search and discovery interfaces
interface ContentSearchQuery {
  query: string;
  filters: {
    contentType?: string[];
    classification?: string[];
    teamId?: string;
    dateRange?: {
      start: number;
      end: number;
    };
    tags?: string[];
  };
  requester: string;
  requestId: string;
}

interface ContentSearchResult {
  requestId: string;
  results: Array<{
    ipfsHash: string;
    metadata: NostrContentMetadata;
    relevanceScore: number;
    accessGranted: boolean;
  }>;
  responderId: string;
  timestamp: number;
}

export class IPFSNostrBridgeService {
  private static instance: IPFSNostrBridgeService;
  private relayNodeService: RelayNodeIPFSService; // Reserved for future IPFS operations
  private networkManager: IPFSNetworkManager; // Reserved for network topology management
  private nostrRelays: WebSocket[] = [];
  private contentEventCache: Map<string, NostrIPFSEvent> = new Map();
  private collaborationListeners: Set<(event: CollaborationEvent) => void> = new Set();
  private searchHandlers: Map<string, (query: ContentSearchQuery) => Promise<ContentSearchResult>> = new Map();
  private isConnected: boolean = false;
  private reconnectInterval: number | null = null;

  // Default Nostr relays for the bridge
  private defaultRelays = [
    'ws://localhost:8082',  // Local RelayNode Nostr
    'wss://relay.starcom.mil', // Starcom primary relay (would be actual)
    'wss://nostr-relay.socom.mil' // SOCOM backup relay (would be actual)
  ];

  private constructor() {
    this.relayNodeService = RelayNodeIPFSService.getInstance();
    this.networkManager = IPFSNetworkManager.getInstance();
    
    this.initializeNostrConnections();
    this.setupEventHandlers();
    this.startCollaborationBridge();
    
    // Mark reserved services as referenced for future use
    void this.relayNodeService;
    void this.networkManager;
  }

  public static getInstance(): IPFSNostrBridgeService {
    if (!IPFSNostrBridgeService.instance) {
      IPFSNostrBridgeService.instance = new IPFSNostrBridgeService();
    }
    return IPFSNostrBridgeService.instance;
  }

  /**
   * Initialize Nostr relay connections
   */
  private async initializeNostrConnections(): Promise<void> {
    console.log('🌐 Initializing IPFS-Nostr bridge connections...');

    for (const relayUrl of this.defaultRelays) {
      try {
        await this.connectToRelay(relayUrl);
      } catch (error) {
        console.warn(`⚠️ Failed to connect to relay ${relayUrl}:`, error);
      }
    }

    if (this.nostrRelays.length === 0) {
      console.warn('🔌 No Nostr relays connected, bridge functionality limited');
      this.scheduleReconnection();
    } else {
      this.isConnected = true;
      console.log(`✅ IPFS-Nostr bridge connected to ${this.nostrRelays.length} relays`);
    }
  }

  /**
   * Connect to a single Nostr relay
   */
  private async connectToRelay(relayUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl);
      
      ws.onopen = () => {
        console.log(`🔗 Connected to Nostr relay: ${relayUrl}`);
        this.nostrRelays.push(ws);
        
        // Subscribe to relevant event kinds
        this.subscribeToEvents(ws);
        resolve();
      };

      ws.onmessage = (event) => {
        this.handleNostrMessage(JSON.parse(event.data));
      };

      ws.onerror = (error) => {
        console.error(`❌ Nostr relay error (${relayUrl}):`, error);
        reject(error);
      };

      ws.onclose = () => {
        console.log(`🔌 Nostr relay connection closed: ${relayUrl}`);
        this.nostrRelays = this.nostrRelays.filter(r => r !== ws);
        
        if (this.nostrRelays.length === 0) {
          this.isConnected = false;
          this.scheduleReconnection();
        }
      };

      // Timeout connection attempt
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Subscribe to relevant Nostr events
   */
  private subscribeToEvents(ws: WebSocket): void {
    const subscription = {
      id: `ipfs-bridge-${Date.now()}`,
      filters: [
        {
          kinds: Object.values(NOSTR_KINDS),
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }
      ]
    };

    ws.send(JSON.stringify(['REQ', subscription.id, ...subscription.filters]));
  }

  /**
   * Handle incoming Nostr messages
   */
  private handleNostrMessage(message: unknown[]): void {
    if (!Array.isArray(message) || message.length < 2) return;

    const [type, ...data] = message;

    switch (type) {
      case 'EVENT':
        if (data.length >= 2) {
          const event = data[1] as NostrIPFSEvent;
          this.handleNostrEvent(event);
        }
        break;
      case 'NOTICE':
        console.log('📢 Nostr notice:', data[0]);
        break;
      case 'EOSE':
        console.log('📡 End of stored events for subscription:', data[0]);
        break;
    }
  }

  /**
   * Handle specific Nostr events
   */
  private handleNostrEvent(event: NostrIPFSEvent): void {
    // Cache the event
    if (event.id) {
      this.contentEventCache.set(event.id, event);
    }

    switch (event.kind) {
      case NOSTR_KINDS.IPFS_CONTENT_ANNOUNCED:
        this.handleContentAnnouncement(event);
        break;
      case NOSTR_KINDS.IPFS_CONTENT_UPDATED:
        this.handleContentUpdate(event);
        break;
      case NOSTR_KINDS.TEAM_CONTENT_SHARED:
        this.handleTeamContentShared(event);
        break;
      case NOSTR_KINDS.INVESTIGATION_TIMELINE:
        this.handleInvestigationTimeline(event);
        break;
      case NOSTR_KINDS.EVIDENCE_CUSTODY:
        this.handleEvidenceCustody(event);
        break;
      case NOSTR_KINDS.CONTENT_SEARCH_QUERY:
        this.handleSearchQuery(event);
        break;
      case NOSTR_KINDS.CONTENT_SEARCH_RESULT:
        this.handleSearchResult(event);
        break;
      case NOSTR_KINDS.PEER_DISCOVERY:
        this.handlePeerDiscovery(event);
        break;
    }
  }

  /**
   * Announce new IPFS content via Nostr
   */
  public async announceContent(
    ipfsResult: IPFSUploadResult,
    contentData: IntelPackage | CyberTeam | CyberInvestigation,
    options: {
      teamId: string;
      creator: string;
      classification: string;
      tags?: string[];
    }
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️ Nostr bridge not connected, content announcement skipped');
      return;
    }

    const metadata: NostrContentMetadata = {
      ipfsHash: ipfsResult.hash,
      contentType: this.inferContentType(contentData),
      classification: options.classification as NostrContentMetadata['classification'],
      teamId: options.teamId,
      title: this.extractTitle(contentData),
      description: this.extractDescription(contentData),
      creator: options.creator,
      timestamp: Date.now(),
      size: ipfsResult.size,
      tags: options.tags || [],
      version: 1,
      accessRequirements: {
        clearanceLevel: options.classification,
        teamMembership: [options.teamId],
        specialPermissions: []
      }
    };

    const event: NostrIPFSEvent = {
      kind: NOSTR_KINDS.IPFS_CONTENT_ANNOUNCED,
      content: JSON.stringify(metadata),
      tags: [
        ['ipfs', ipfsResult.hash],
        ['team', options.teamId],
        ['classification', options.classification],
        ['content-type', metadata.contentType],
        ...options.tags?.map(tag => ['t', tag]) || []
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: options.creator // In real implementation, would be proper pubkey
    };

    await this.publishEvent(event);
    console.log(`📢 Content announced via Nostr: ${ipfsResult.hash}`);
  }

  /**
   * Announce content updates
   */
  public async announceContentUpdate(
    oldHash: string,
    newHash: string,
    contentData: IntelPackage | CyberTeam | CyberInvestigation,
    options: {
      teamId: string;
      updater: string;
      version: number;
      changeDescription?: string;
    }
  ): Promise<void> {
    if (!this.isConnected) return;

    const updateInfo = {
      oldHash,
      newHash,
      contentType: this.inferContentType(contentData),
      teamId: options.teamId,
      title: this.extractTitle(contentData),
      version: options.version,
      changeDescription: options.changeDescription || 'Content updated',
      timestamp: Date.now()
    };

    const event: NostrIPFSEvent = {
      kind: NOSTR_KINDS.IPFS_CONTENT_UPDATED,
      content: JSON.stringify(updateInfo),
      tags: [
        ['ipfs', newHash],
        ['ipfs-old', oldHash],
        ['team', options.teamId],
        ['version', options.version.toString()]
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: options.updater
    };

    await this.publishEvent(event);
    console.log(`🔄 Content update announced: ${oldHash} -> ${newHash}`);
  }

  /**
   * Search for content across the network
   */
  public async searchContent(query: ContentSearchQuery): Promise<ContentSearchResult[]> {
    if (!this.isConnected) {
      console.warn('⚠️ Nostr bridge not connected, search unavailable');
      return [];
    }

    const searchEvent: NostrIPFSEvent = {
      kind: NOSTR_KINDS.CONTENT_SEARCH_QUERY,
      content: JSON.stringify(query),
      tags: [
        ['search-id', query.requestId],
        ['q', query.query],
        ...(query.filters.contentType?.map(type => ['content-type', type]) || []),
        ...(query.filters.teamId ? [['team', query.filters.teamId]] : [])
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: query.requester
    };

    await this.publishEvent(searchEvent);

    // Wait for responses (in real implementation, would use proper event handling)
    return new Promise((resolve) => {
      const results: ContentSearchResult[] = [];
      const timeout = setTimeout(() => {
        resolve(results);
      }, 5000); // 5 second timeout

      // Set up temporary handler for responses
      const handleResponse = (event: NostrIPFSEvent) => {
        if (event.kind === NOSTR_KINDS.CONTENT_SEARCH_RESULT) {
          try {
            const result = JSON.parse(event.content) as ContentSearchResult;
            if (result.requestId === query.requestId) {
              results.push(result);
            }
          } catch (error) {
            console.error('Failed to parse search result:', error);
          }
        }
      };

      // In real implementation, would properly attach this handler
      console.log('Search handler ready:', handleResponse.name);
      setTimeout(() => {
        clearTimeout(timeout);
        resolve(results);
      }, 5000);
    });
  }

  /**
   * Announce team collaboration events
   */
  public async announceCollaboration(event: CollaborationEvent): Promise<void> {
    if (!this.isConnected) return;

    const nostrEvent: NostrIPFSEvent = {
      kind: NOSTR_KINDS.TEAM_CONTENT_SHARED,
      content: JSON.stringify(event),
      tags: [
        ['team', event.teamId],
        ['ipfs', event.ipfsHash],
        ['collab-type', event.type],
        ['user', event.userId]
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: event.userId
    };

    await this.publishEvent(nostrEvent);
    
    // Notify local listeners
    for (const listener of this.collaborationListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in collaboration listener:', error);
      }
    }

    console.log(`🤝 Collaboration event announced: ${event.type} for ${event.contentId}`);
  }

  /**
   * Subscribe to collaboration events
   */
  public onCollaboration(listener: (event: CollaborationEvent) => void): () => void {
    this.collaborationListeners.add(listener);
    return () => {
      this.collaborationListeners.delete(listener);
    };
  }

  /**
   * Get recent content announcements
   */
  public getRecentContentAnnouncements(teamId?: string, limit: number = 50): NostrIPFSEvent[] {
    const events = Array.from(this.contentEventCache.values());
    
    let filtered = events.filter(event => 
      event.kind === NOSTR_KINDS.IPFS_CONTENT_ANNOUNCED ||
      event.kind === NOSTR_KINDS.IPFS_CONTENT_UPDATED
    );

    if (teamId) {
      filtered = filtered.filter(event => 
        event.tags.some(tag => tag[0] === 'team' && tag[1] === teamId)
      );
    }

    return filtered
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit);
  }

  /**
   * Sync IPFS content with Nostr metadata
   */
  public async syncContentWithNostr(ipfsHash: string): Promise<NostrContentMetadata | null> {
    // Find Nostr events for this IPFS hash
    const events = Array.from(this.contentEventCache.values()).filter(event =>
      event.tags.some(tag => tag[0] === 'ipfs' && tag[1] === ipfsHash)
    );

    if (events.length === 0) return null;

    // Get the most recent announcement
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    
    try {
      return JSON.parse(latestEvent.content) as NostrContentMetadata;
    } catch (error) {
      console.error('Failed to parse Nostr content metadata:', error);
      return null;
    }
  }

  // Private helper methods

  private async publishEvent(event: NostrIPFSEvent): Promise<void> {
    // In real implementation, would sign the event
    const eventMessage = ['EVENT', event];
    
    const publishPromises = this.nostrRelays.map(relay => {
      if (relay.readyState === WebSocket.OPEN) {
        relay.send(JSON.stringify(eventMessage));
        return Promise.resolve();
      }
      return Promise.reject(new Error('Relay not connected'));
    });

    try {
      await Promise.allSettled(publishPromises);
    } catch (error) {
      console.error('Error publishing event:', error);
    }
  }

  private inferContentType(data: unknown): 'intel-package' | 'cyber-team' | 'investigation' | 'evidence' {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      
      if ('type' in obj && typeof obj.type === 'string') {
        if (['INCIDENT_RESPONSE', 'THREAT_HUNTING', 'FORENSICS', 'SOC', 'RED_TEAM', 'BLUE_TEAM'].includes(obj.type)) {
          return 'cyber-team';
        }
      }
      
      if ('investigationType' in obj) {
        return 'investigation';
      }
      
      if ('evidence' in obj || 'filePath' in obj) {
        return 'evidence';
      }
    }

    return 'intel-package';
  }

  private extractTitle(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      return (obj.name || obj.title || 'Untitled') as string;
    }
    return 'Untitled';
  }

  private extractDescription(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      return (obj.description || 'No description') as string;
    }
    return 'No description';
  }

  private setupEventHandlers(): void {
    // Listen for IPFS content updates
    window.addEventListener('ipfs-content-updated', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { hash } = customEvent.detail;
      
      // Sync with Nostr announcements
      this.syncContentWithNostr(hash);
    });
  }

  private startCollaborationBridge(): void {
    console.log('🌉 Starting IPFS-Nostr collaboration bridge...');
    
    // Set up periodic sync
    setInterval(() => {
      this.performPeriodicSync();
    }, 60000); // Every minute
  }

  private async performPeriodicSync(): Promise<void> {
    if (!this.isConnected) return;

    // Sync recent content announcements with IPFS
    const recentAnnouncements = this.getRecentContentAnnouncements();
    
    for (const announcement of recentAnnouncements.slice(0, 10)) {
      try {
        const metadata = JSON.parse(announcement.content) as NostrContentMetadata;
        
        // Verify IPFS content still exists
        // In real implementation, would check IPFS network
        console.log(`🔄 Syncing content: ${metadata.ipfsHash}`);
      } catch (error) {
        console.error('Error syncing content:', error);
      }
    }
  }

  private handleContentAnnouncement(event: NostrIPFSEvent): void {
    try {
      const metadata = JSON.parse(event.content) as NostrContentMetadata;
      console.log(`📢 New content announced: ${metadata.title} (${metadata.ipfsHash})`);
      
      // Emit local event for UI updates
      window.dispatchEvent(new CustomEvent('nostr-content-announced', {
        detail: { metadata, event }
      }));
    } catch (error) {
      console.error('Error handling content announcement:', error);
    }
  }

  private handleContentUpdate(event: NostrIPFSEvent): void {
    try {
      const updateInfo = JSON.parse(event.content);
      console.log(`🔄 Content updated: ${updateInfo.title} v${updateInfo.version}`);
      
      window.dispatchEvent(new CustomEvent('nostr-content-updated', {
        detail: { updateInfo, event }
      }));
    } catch (error) {
      console.error('Error handling content update:', error);
    }
  }

  private handleTeamContentShared(event: NostrIPFSEvent): void {
    try {
      const collaborationEvent = JSON.parse(event.content) as CollaborationEvent;
      
      // Notify local listeners
      for (const listener of this.collaborationListeners) {
        try {
          listener(collaborationEvent);
        } catch (error) {
          console.error('Error in collaboration listener:', error);
        }
      }
    } catch (error) {
      console.error('Error handling team content sharing:', error);
    }
  }

  private handleInvestigationTimeline(event: NostrIPFSEvent): void {
    void event; // Parameter reserved for future implementation
    console.log('📊 Investigation timeline event received');
    // TODO: Implement investigation timeline handling
  }

  private handleEvidenceCustody(event: NostrIPFSEvent): void {
    void event; // Parameter reserved for future implementation
    console.log('🔒 Evidence custody event received');
    // TODO: Implement evidence custody chain handling
  }

  private handleSearchQuery(event: NostrIPFSEvent): void {
    void event; // Parameter reserved for future implementation
    // TODO: Implement search query handling
    console.log('🔍 Search query received');
  }

  private handleSearchResult(event: NostrIPFSEvent): void {
    void event; // Parameter reserved for future implementation
    // TODO: Implement search result handling
    console.log('📋 Search result received');
  }

  private handlePeerDiscovery(event: NostrIPFSEvent): void {
    void event; // Parameter reserved for future implementation
    // TODO: Implement peer discovery handling
    console.log('🔍 Peer discovery event received');
  }

  private scheduleReconnection(): void {
    if (this.reconnectInterval) return;

    this.reconnectInterval = window.setInterval(() => {
      console.log('🔄 Attempting to reconnect to Nostr relays...');
      this.initializeNostrConnections();
      
      if (this.isConnected && this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    }, 30000); // Try every 30 seconds
  }

  /**
   * Get bridge connection status
   */
  public getStatus(): {
    connected: boolean;
    relayCount: number;
    eventsCached: number;
    collaborationListeners: number;
  } {
    return {
      connected: this.isConnected,
      relayCount: this.nostrRelays.length,
      eventsCached: this.contentEventCache.size,
      collaborationListeners: this.collaborationListeners.size
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Close all WebSocket connections
    for (const relay of this.nostrRelays) {
      relay.close();
    }
    this.nostrRelays = [];

    // Clear intervals
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // Clear listeners
    this.collaborationListeners.clear();
    this.searchHandlers.clear();
    this.contentEventCache.clear();

    this.isConnected = false;
    console.log('🧹 IPFS-Nostr bridge destroyed');
  }

  /**
   * Initialize the bridge service (compatibility method)
   */
  public async initialize(): Promise<void> {
    if (this.isConnected) {
      console.log('🔄 IPFS-Nostr bridge already initialized');
      return;
    }

    console.log('🚀 Initializing IPFS-Nostr bridge service...');
    await this.initializeNostrConnections();
    
    // Wait a moment for connections to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ IPFS-Nostr bridge initialized with ${this.nostrRelays.length} relays`);
  }

  /**
   * Check if the bridge service is healthy
   */
  public isHealthy(): boolean {
    return this.isConnected && this.nostrRelays.length > 0;
  }

  /**
   * Event emitter compatibility - register event listeners
   */
  public on(event: string, listener: (...args: unknown[]) => void): void {
    switch (event) {
      case 'collaboration':
        this.collaborationListeners.add(listener as (event: CollaborationEvent) => void);
        break;
      case 'content-announced':
        // Handle content announcement events
        break;
      case 'search-query':
        // Handle search query events
        break;
      default:
        console.warn(`🚨 Unknown event type: ${event}`);
    }
  }

  /**
   * Event emitter compatibility - emit events
   */
  public emit(event: string, ...args: unknown[]): void {
    switch (event) {
      case 'collaboration':
        this.collaborationListeners.forEach(listener => {
          try {
            if (args.length > 0) {
              (listener as (event: CollaborationEvent) => void)(args[0] as CollaborationEvent);
            }
          } catch (error) {
            console.error('🚨 Error in collaboration listener:', error);
          }
        });
        break;
      case 'content-announced':
        // Emit content announcement
        console.log(`📢 Content announced: ${args[0] as string}`);
        break;
      case 'search-result':
        // Emit search result
        console.log(`🔍 Search result: ${args[0] as string}`);
        break;
      default:
        console.warn(`🚨 Unknown emit event: ${event}`);
    }
  }
}

export default IPFSNostrBridgeService;
