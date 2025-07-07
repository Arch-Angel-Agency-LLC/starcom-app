/**
 * Unified IPFS-Nostr Integration Service for Starcom dApp
 * 
 * This service provides the main integration layer that combines:
 * - RelayNodeIPFSService for IPFS content storage
 * - IPFSNetworkManager for network topology and peer management
 * - IPFSNostrBridgeService for real-time content coordination
 * 
 * It creates a seamless experience where:
 * - Content stored in IPFS is automatically announced via Nostr
 * - Team collaboration events are synchronized across both protocols
 * - Content discovery works across the entire RelayNode network
 * - Investigation workflows are coordinated through both storage and messaging
 */

import { RelayNodeIPFSService } from './RelayNodeIPFSService';
import { IPFSNetworkManager } from './IPFSNetworkManager';
import { IPFSNostrBridgeService } from './IPFSNostrBridgeService';
import { IntelPackage, CyberTeam, CyberInvestigation } from '../types/cyberInvestigation';
// IPFSUploadResult reserved for future upload operations

// Unified content interface
interface UnifiedContent {
  id: string;
  ipfsHash: string;
  type: 'intel-package' | 'cyber-team' | 'investigation';
  title: string;
  description: string;
  classification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  teamId: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  size: number;
  tags: string[];
  
  // Network status
  replicationStatus: {
    replicated: boolean;
    peerCount: number;
    health: 'healthy' | 'degraded' | 'critical';
  };
  
  // Nostr announcement status
  nostrStatus: {
    announced: boolean;
    announcementHash?: string;
    lastUpdate?: Date;
  };
  
  // Collaboration activity
  collaborationActivity: {
    recentViews: number;
    recentEdits: number;
    activeCollaborators: string[];
    lastActivity: Date;
  };
}

// Team workspace interface
interface TeamWorkspace {
  teamId: string;
  teamName: string;
  memberCount: number;
  
  // Content summary
  contentSummary: {
    totalContent: number;
    recentContent: number;
    contentByType: Record<string, number>;
    contentByClassification: Record<string, number>;
  };
  
  // Network status
  networkStatus: {
    connectedPeers: number;
    replicationHealth: number; // 0-100
    nostrConnectivity: boolean;
  };
  
  // Recent activity
  recentActivity: Array<{
    type: 'content-added' | 'content-updated' | 'collaboration' | 'team-join';
    timestamp: Date;
    user: string;
    contentId?: string;
    details: string;
  }>;
}

// Investigation coordination interface
interface InvestigationCoordination {
  investigationId: string;
  title: string;
  status: 'active' | 'analyzing' | 'completed' | 'archived';
  teamId: string;
  
  // Content tracking
  contentItems: {
    intelPackages: string[];
    evidence: string[];
    reports: string[];
    relatedContent: string[];
  };
  
  // Collaboration tracking
  collaborators: string[];
  timeline: Array<{
    timestamp: Date;
    event: string;
    user: string;
    contentHash?: string;
  }>;
  
  // Synchronization status
  syncStatus: {
    ipfsSync: boolean;
    nostrSync: boolean;
    lastSync: Date;
    conflictCount: number;
  };
}

export class UnifiedIPFSNostrService {
  private static instance: UnifiedIPFSNostrService;
  private ipfsService: RelayNodeIPFSService;
  private networkManager: IPFSNetworkManager; // Reserved for network topology management
  private nostrBridge: IPFSNostrBridgeService;
  
  // Content and workspace management
  private unifiedContent: Map<string, UnifiedContent> = new Map();
  private teamWorkspaces: Map<string, TeamWorkspace> = new Map();
  private investigationCoordination: Map<string, InvestigationCoordination> = new Map();
  
  // Nostr relay configuration
  private activeRelays: string[] = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.info',
    'wss://nostr.wine',
    'wss://relay.current.fyi'
  ];
  
  // Event handling
  private eventListeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private syncInterval: number | null = null;

  private constructor() {
    this.ipfsService = RelayNodeIPFSService.getInstance();
    this.networkManager = IPFSNetworkManager.getInstance();
    this.nostrBridge = IPFSNostrBridgeService.getInstance();
    
    // Mark reserved services as referenced for future use
    void this.networkManager;
    
    this.initializeIntegration();
    this.setupEventBridging();
    this.startPeriodicSync();
  }

  public static getInstance(): UnifiedIPFSNostrService {
    if (!UnifiedIPFSNostrService.instance) {
      UnifiedIPFSNostrService.instance = new UnifiedIPFSNostrService();
    }
    return UnifiedIPFSNostrService.instance;
  }

  /**
   * Store content with full IPFS-Nostr integration
   */
  public async storeContent(
    data: IntelPackage | CyberTeam | CyberInvestigation,
    options: {
      teamId: string;
      creator: string;
      classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
      tags?: string[];
      announceToNostr?: boolean;
      replicateToTeam?: boolean;
    }
  ): Promise<UnifiedContent> {
    // Remove console.log for production security

    // Store in IPFS through RelayNode
    const ipfsResult = await this.ipfsService.uploadContent(data, {
      type: this.inferContentType(data),
      creator: options.creator,
      classification: options.classification || 'CONFIDENTIAL',
      replicateToTeam: options.replicateToTeam !== false,
      encryptWithPQC: true,
      metadata: {
        tags: options.tags || [],
        teamId: options.teamId
      }
    });

    // Create unified content entry
    const unifiedContent: UnifiedContent = {
      id: this.generateContentId(),
      ipfsHash: ipfsResult.hash,
      type: this.inferContentType(data),
      title: this.extractTitle(data),
      description: this.extractDescription(data),
      classification: options.classification || 'CONFIDENTIAL',
      teamId: options.teamId,
      creator: options.creator,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      size: ipfsResult.size,
      tags: options.tags || [],
      
      replicationStatus: {
        replicated: false,
        peerCount: 1,
        health: 'healthy'
      },
      
      nostrStatus: {
        announced: false
      },
      
      collaborationActivity: {
        recentViews: 0,
        recentEdits: 0,
        activeCollaborators: [options.creator],
        lastActivity: new Date()
      }
    };

    // Store in unified registry
    this.unifiedContent.set(unifiedContent.id, unifiedContent);

    // Announce via Nostr if requested
    if (options.announceToNostr !== false) {
      try {
        await this.nostrBridge.announceContent(ipfsResult, data, {
          teamId: options.teamId,
          creator: options.creator,
          classification: options.classification || 'CONFIDENTIAL',
          tags: options.tags
        });
        
        unifiedContent.nostrStatus.announced = true;
        unifiedContent.nostrStatus.lastUpdate = new Date();
      } catch (error) {
        console.warn('⚠️ Failed to announce content via Nostr:', error);
      }
    }

    // Update team workspace
    this.updateTeamWorkspace(options.teamId, 'content-added', options.creator, unifiedContent.id);

    // Emit integration event
    this.emitEvent('content-stored', {
      content: unifiedContent,
      ipfsResult,
      options
    });

    
    return unifiedContent;
  }

  /**
   * Retrieve content with intelligent source selection
   */
  public async retrieveContent(
    contentId: string,
    requestingUser: string
  ): Promise<{
    content: UnifiedContent;
    data: Uint8Array;
    source: 'local' | 'team' | 'remote';
    retrievalTime: number;
  }> {
    const startTime = Date.now();
    
    const unifiedContent = this.unifiedContent.get(contentId);
    if (!unifiedContent) {
      throw new Error(`Content not found: ${contentId}`);
    }

    // Check permissions (simplified)
    if (!this.hasAccessPermission(unifiedContent, requestingUser)) {
      throw new Error(`Access denied for content: ${contentId}`);
    }

    // Retrieve from IPFS
    const data = await this.ipfsService.downloadContent(unifiedContent.ipfsHash);
    
    // Update collaboration activity
    unifiedContent.collaborationActivity.recentViews++;
    unifiedContent.collaborationActivity.lastActivity = new Date();
    
    if (!unifiedContent.collaborationActivity.activeCollaborators.includes(requestingUser)) {
      unifiedContent.collaborationActivity.activeCollaborators.push(requestingUser);
    }

    // Update team workspace activity
    this.updateTeamWorkspace(unifiedContent.teamId, 'content-accessed', requestingUser, contentId);

    const retrievalTime = Date.now() - startTime;

    // Emit event
    this.emitEvent('content-retrieved', {
      contentId,
      user: requestingUser,
      retrievalTime,
      source: 'local' // For now, would be determined by network manager
    });

    return {
      content: unifiedContent,
      data,
      source: 'local',
      retrievalTime
    };
  }

  /**
   * Update content with coordinated synchronization
   */
  public async updateContent(
    contentId: string,
    data: IntelPackage | CyberTeam | CyberInvestigation,
    updatingUser: string,
    changeDescription?: string
  ): Promise<UnifiedContent> {
    const unifiedContent = this.unifiedContent.get(contentId);
    if (!unifiedContent) {
      throw new Error(`Content not found: ${contentId}`);
    }

    // Check permissions
    if (!this.hasWritePermission(unifiedContent, updatingUser)) {
      throw new Error(`Write access denied for content: ${contentId}`);
    }

    const oldHash = unifiedContent.ipfsHash;

    // Update in IPFS
    const ipfsResult = await this.ipfsService.uploadContent(data, {
      type: unifiedContent.type,
      creator: updatingUser,
      classification: unifiedContent.classification,
      replicateToTeam: true,
      encryptWithPQC: true
    });

    // Update unified content
    unifiedContent.ipfsHash = ipfsResult.hash;
    unifiedContent.updatedAt = new Date();
    unifiedContent.version++;
    unifiedContent.size = ipfsResult.size;
    unifiedContent.collaborationActivity.recentEdits++;
    unifiedContent.collaborationActivity.lastActivity = new Date();

    // Announce update via Nostr
    if (unifiedContent.nostrStatus.announced) {
      try {
        await this.nostrBridge.announceContentUpdate(oldHash, ipfsResult.hash, data, {
          teamId: unifiedContent.teamId,
          updater: updatingUser,
          version: unifiedContent.version,
          changeDescription
        });
        
        unifiedContent.nostrStatus.lastUpdate = new Date();
      } catch (error) {
        console.warn('⚠️ Failed to announce update via Nostr:', error);
      }
    }

    // Update team workspace
    this.updateTeamWorkspace(unifiedContent.teamId, 'content-updated', updatingUser, contentId);

    // Emit event
    this.emitEvent('content-updated', {
      contentId,
      oldHash,
      newHash: ipfsResult.hash,
      user: updatingUser,
      version: unifiedContent.version
    });

    
    return unifiedContent;
  }

  /**
   * Get team workspace overview
   */
  public getTeamWorkspace(teamId: string): TeamWorkspace | null {
    return this.teamWorkspaces.get(teamId) || null;
  }

  /**
   * Get all team content with unified view
   */
  public getTeamContent(teamId: string, requestingUser: string): UnifiedContent[] {
    const teamContent: UnifiedContent[] = [];
    
    for (const content of this.unifiedContent.values()) {
      if (content.teamId === teamId && this.hasAccessPermission(content, requestingUser)) {
        teamContent.push(content);
      }
    }

    return teamContent.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Search content across IPFS and Nostr
   */
  public async searchContent(
    query: string,
    filters: {
      teamId?: string;
      contentType?: string[];
      classification?: string[];
      dateRange?: {
        start: Date;
        end: Date;
      };
      tags?: string[];
    },
    requestingUser: string
  ): Promise<UnifiedContent[]> {
    // Local search first
    const localResults = this.searchLocalContent(query, filters, requestingUser);
    
    // Implement distributed search via Nostr
    try {
      const remoteResults = await this.searchDistributedContent(query, filters, requestingUser);
      
      // Merge and deduplicate results
      const allResults = [...localResults, ...remoteResults];
      const uniqueResults = this.deduplicateSearchResults(allResults);
      
      // Sort by relevance and recency
      return this.sortSearchResults(uniqueResults, query);
    } catch (error) {
      console.warn('Distributed search failed, returning local results only:', error);
      return localResults;
    }
  }

  /**
   * Search content across distributed Nostr network
   */
  private async searchDistributedContent(
    query: string,
    filters: {
      teamId?: string;
      contentType?: string[];
      classification?: string[];
      dateRange?: {
        start: Date;
        end: Date;
      };
      tags?: string[];
    },
    requestingUser: string
  ): Promise<UnifiedContent[]> {
    const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const searchTimeout = 10000; // 10 seconds
    
    // Create Nostr search event (NIP-50 compatible)
    const searchEvent = {
      kind: 30000, // Parameterized replaceable event for search
      content: JSON.stringify({
        query,
        filters,
        searchId,
        requester: requestingUser,
        timestamp: Date.now()
      }),
      tags: [
        ['d', searchId], // Identifier tag for parameterized events
        ['search', query],
        ['type', filters.contentType?.join(',') || 'all'],
        ['team', filters.teamId || 'public'],
        ['classification', filters.classification?.join(',') || 'unclassified']
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: requestingUser // In real implementation, this would be the user's public key
    };

    // Broadcast search request to multiple relays
    const searchPromises = this.activeRelays.map(relay => 
      this.searchViaRelay(relay, searchEvent, searchTimeout)
    );

    try {
      // Wait for responses from all relays with timeout
      const relayResults = await Promise.allSettled(searchPromises);
      
      // Combine successful results
      const combinedResults: UnifiedContent[] = [];
      relayResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          combinedResults.push(...result.value);
          console.debug(`Relay ${this.activeRelays[index]} returned ${result.value.length} results`);
        } else {
          console.warn(`Search failed on relay ${this.activeRelays[index]}:`, result.reason);
        }
      });

      return combinedResults;
    } catch (error) {
      console.error('Distributed search failed:', error);
      return [];
    }
  }

  /**
   * Search content via specific Nostr relay
   */
  private async searchViaRelay(
    relayUrl: string,
    searchEvent: { content: string; tags: string[][] },
    timeout: number
  ): Promise<UnifiedContent[]> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Search timeout on relay ${relayUrl}`));
      }, timeout);

      try {
        // Simulate relay search - in real implementation this would:
        // 1. Connect to Nostr relay via WebSocket
        // 2. Send REQ message with search filters
        // 3. Listen for EVENT messages containing search results
        // 4. Parse and validate returned content

        // Simulate realistic search latency and results
        setTimeout(() => {
          clearTimeout(timeoutId);
          
          // Mock search results based on query
          const mockResults = this.generateMockSearchResults(searchEvent, relayUrl);
          resolve(mockResults);
        }, 500 + Math.random() * 1000); // 0.5-1.5s realistic network latency

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Generate mock search results for demonstration
   */
  private generateMockSearchResults(
    searchEvent: { content: string; tags: string[][] }, 
    relayUrl: string
  ): UnifiedContent[] {
    const { query, filters } = JSON.parse(searchEvent.content);
    const results: UnifiedContent[] = [];
    
    // Simulate finding 0-3 relevant results per relay
    const resultCount = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < resultCount; i++) {
      results.push({
        id: `remote-${relayUrl.split('//')[1]}-${Date.now()}-${i}`,
        ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
        type: filters.contentType?.[0] === 'intel_report' ? 'intel-package' : 'investigation',
        title: `Remote Content: ${query} #${i + 1}`,
        description: `Content found via distributed search on ${relayUrl}`,
        classification: filters.classification?.[0] === 'secret' ? 'SECRET' : 'PUBLIC',
        teamId: filters.teamId || 'public',
        creator: `remote-agent-${Math.random().toString(36).substr(2, 8)}`,
        createdAt: new Date(Date.now() - Math.random() * 86400000),
        updatedAt: new Date(),
        version: 1,
        size: Math.floor(Math.random() * 1000000),
        tags: [`search:${query}`, 'remote', 'distributed'],
        replicationStatus: {
          replicated: true,
          peerCount: Math.floor(Math.random() * 5) + 1,
          health: 'healthy' as const
        },
        nostrStatus: {
          announced: true,
          announcementHash: `event-${Math.random().toString(36).substr(2, 16)}`,
          lastUpdate: new Date()
        },
        collaborationActivity: {
          recentViews: Math.floor(Math.random() * 10),
          recentEdits: Math.floor(Math.random() * 3),
          activeCollaborators: [],
          lastActivity: new Date()
        }
      });
    }

    return results;
  }

  /**
   * Remove duplicate results from search
   */
  private deduplicateSearchResults(results: UnifiedContent[]): UnifiedContent[] {
    const seen = new Set<string>();
    return results.filter(result => {
      // Use IPFS hash as primary deduplication key
      const key = result.ipfsHash || result.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort search results by relevance and recency
   */
  private sortSearchResults(results: UnifiedContent[], query: string): UnifiedContent[] {
    return results.sort((a, b) => {
      // Calculate relevance score
      const aRelevance = this.calculateRelevanceScore(a, query);
      const aRecency = a.createdAt.getTime();
      
      const bRelevance = this.calculateRelevanceScore(b, query);
      const bRecency = b.createdAt.getTime();
      
      // Weight: 70% relevance, 30% recency
      const aScore = aRelevance * 0.7 + (aRecency / Date.now()) * 0.3;
      const bScore = bRelevance * 0.7 + (bRecency / Date.now()) * 0.3;
      
      return bScore - aScore; // Descending order
    });
  }

  /**
   * Calculate content relevance score for search query
   */
  private calculateRelevanceScore(content: UnifiedContent, query: string): number {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const contentText = [
      content.title,
      content.description,
      content.tags.join(' ')
    ].join(' ').toLowerCase();

    let score = 0;
    searchTerms.forEach(term => {
      // Exact matches get higher score
      const exactMatches = (contentText.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += exactMatches * 2;
      
      // Partial matches get lower score
      const partialMatches = (contentText.match(new RegExp(term, 'g')) || []).length - exactMatches;
      score += partialMatches;
    });

    // Normalize by content length
    return Math.min(score / contentText.length * 1000, 1);
  }

  /**
   * Coordinate investigation workflow
   */
  public async coordinateInvestigation(
    investigationId: string,
    action: 'create' | 'update' | 'add-content' | 'complete',
    details: {
      user: string;
      contentId?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<InvestigationCoordination> {
    let coordination = this.investigationCoordination.get(investigationId);
    
    if (!coordination && action === 'create') {
      coordination = {
        investigationId,
        title: (details.data?.title as string) || 'Untitled Investigation',
        status: 'active',
        teamId: (details.data?.teamId as string) || 'unknown',
        contentItems: {
          intelPackages: [],
          evidence: [],
          reports: [],
          relatedContent: []
        },
        collaborators: [details.user],
        timeline: [],
        syncStatus: {
          ipfsSync: true,
          nostrSync: true,
          lastSync: new Date(),
          conflictCount: 0
        }
      };
      
      this.investigationCoordination.set(investigationId, coordination);
    }

    if (!coordination) {
      throw new Error(`Investigation not found: ${investigationId}`);
    }

    // Update timeline
    coordination.timeline.push({
      timestamp: new Date(),
      event: action,
      user: details.user,
      contentHash: details.contentId ? this.unifiedContent.get(details.contentId)?.ipfsHash : undefined
    });

    // Update collaboration
    if (!coordination.collaborators.includes(details.user)) {
      coordination.collaborators.push(details.user);
    }

    // Handle specific actions
    switch (action) {
      case 'add-content':
        if (details.contentId) {
          const content = this.unifiedContent.get(details.contentId);
          if (content) {
            switch (content.type) {
              case 'intel-package':
                coordination.contentItems.intelPackages.push(details.contentId);
                break;
              case 'investigation':
                coordination.contentItems.relatedContent.push(details.contentId);
                break;
            }
          }
        }
        break;
      case 'complete':
        coordination.status = 'completed';
        break;
    }

    // Announce coordination event via Nostr
    await this.nostrBridge.announceCollaboration({
      type: 'investigation-joined',
      contentId: investigationId,
      ipfsHash: '', // Would be investigation hash
      teamId: coordination.teamId,
      userId: details.user,
      timestamp: Date.now(),
      details: { action, investigationId }
    });

    return coordination;
  }

  /**
   * Get system status overview
   */
  public getSystemStatus(): {
    ipfs: {
      connected: boolean;
      peerCount: number;
      contentCount: number;
    };
    nostr: {
      connected: boolean;
      relayCount: number;
      eventsCount: number;
    };
    integration: {
      contentSynced: number;
      replicationHealth: number;
      lastSync: Date;
    };
  } {
    const ipfsStatus = this.ipfsService.getRelayNodeStatus();
    const nostrStatus = this.nostrBridge.getStatus();
    
    return {
      ipfs: {
        connected: ipfsStatus.available,
        peerCount: ipfsStatus.capabilities?.ipfs.peerCount || 0,
        contentCount: this.unifiedContent.size
      },
      nostr: {
        connected: nostrStatus.connected,
        relayCount: nostrStatus.relayCount,
        eventsCount: nostrStatus.eventsCached
      },
      integration: {
        contentSynced: Array.from(this.unifiedContent.values()).filter(c => c.nostrStatus.announced).length,
        replicationHealth: this.calculateReplicationHealth(),
        lastSync: new Date() // Would track actual sync
      }
    };
  }

  /**
   * Subscribe to integration events
   */
  public on(eventType: string, listener: (...args: unknown[]) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(listener);
    
    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  // Private helper methods

  private initializeIntegration(): void {
    
    
    // Load existing content registry
    this.loadContentRegistry();
    
    // Initialize team workspaces
    this.initializeTeamWorkspaces();
    
    
  }

  private setupEventBridging(): void {
    // Bridge Nostr collaboration events
    this.nostrBridge.onCollaboration((event) => {
      this.emitEvent('collaboration', event);
    });

    // Listen for IPFS network events
    window.addEventListener('ipfs-content-updated', () => {
      this.handleIPFSContentUpdate();
    });

    // Listen for Nostr content announcements
    window.addEventListener('nostr-content-announced', () => {
      this.handleNostrContentAnnouncement();
    });
  }

  private startPeriodicSync(): void {
    this.syncInterval = window.setInterval(() => {
      this.performPeriodicSync();
    }, 60000); // Every minute
  }

  private async performPeriodicSync(): Promise<void> {
    // Sync content status
    for (const content of this.unifiedContent.values()) {
      // Check replication status
      // TODO: Implement actual replication checking
      
      // Verify Nostr announcements
      if (content.nostrStatus.announced) {
        const nostrMetadata = await this.nostrBridge.syncContentWithNostr(content.ipfsHash);
        if (nostrMetadata) {
          // Update from Nostr metadata if needed
        }
      }
    }

    // Update team workspace statistics
    for (const teamId of this.teamWorkspaces.keys()) {
      this.updateTeamWorkspaceStats(teamId);
    }
  }

  private generateContentId(): string {
    return `unified-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private inferContentType(data: unknown): 'intel-package' | 'cyber-team' | 'investigation' {
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

  private hasAccessPermission(content: UnifiedContent, user: string): boolean {
    // Simplified permission check
    return content.collaborationActivity.activeCollaborators.includes(user) ||
           content.creator === user ||
           content.classification === 'PUBLIC';
  }

  private hasWritePermission(content: UnifiedContent, user: string): boolean {
    // Simplified permission check
    return content.creator === user ||
           content.collaborationActivity.activeCollaborators.includes(user);
  }

  private updateTeamWorkspace(teamId: string, action: string, user: string, contentId?: string): void {
    let workspace = this.teamWorkspaces.get(teamId);
    
    if (!workspace) {
      workspace = {
        teamId,
        teamName: `Team ${teamId}`,
        memberCount: 1,
        contentSummary: {
          totalContent: 0,
          recentContent: 0,
          contentByType: {},
          contentByClassification: {}
        },
        networkStatus: {
          connectedPeers: 0,
          replicationHealth: 100,
          nostrConnectivity: true
        },
        recentActivity: []
      };
      
      this.teamWorkspaces.set(teamId, workspace);
    }

    // Add activity
    workspace.recentActivity.unshift({
      type: action === 'created' ? 'content-added' : 
            action === 'updated' ? 'content-updated' : 
            action === 'shared' ? 'collaboration' : 'team-join',
      timestamp: new Date(),
      user,
      contentId,
      details: `${action} by ${user}`
    });

    // Keep only recent activities
    workspace.recentActivity = workspace.recentActivity.slice(0, 50);
    
    // Update statistics
    this.updateTeamWorkspaceStats(teamId);
  }

  private updateTeamWorkspaceStats(teamId: string): void {
    const workspace = this.teamWorkspaces.get(teamId);
    if (!workspace) return;

    const teamContent = Array.from(this.unifiedContent.values()).filter(c => c.teamId === teamId);
    
    workspace.contentSummary.totalContent = teamContent.length;
    workspace.contentSummary.recentContent = teamContent.filter(c => 
      c.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    // Update type counts
    workspace.contentSummary.contentByType = {};
    workspace.contentSummary.contentByClassification = {};
    
    for (const content of teamContent) {
      workspace.contentSummary.contentByType[content.type] = 
        (workspace.contentSummary.contentByType[content.type] || 0) + 1;
      
      workspace.contentSummary.contentByClassification[content.classification] = 
        (workspace.contentSummary.contentByClassification[content.classification] || 0) + 1;
    }
  }

  private searchLocalContent(
    query: string,
    filters: Record<string, unknown>,
    requestingUser: string
  ): UnifiedContent[] {
    const results: UnifiedContent[] = [];
    
    for (const content of this.unifiedContent.values()) {
      if (!this.hasAccessPermission(content, requestingUser)) continue;
      
      // Apply filters
      if (filters.teamId && content.teamId !== filters.teamId) continue;
      if (filters.contentType && Array.isArray(filters.contentType) && !filters.contentType.includes(content.type)) continue;
      if (filters.classification && Array.isArray(filters.classification) && !filters.classification.includes(content.classification)) continue;
      
      // Simple text search
      const searchText = `${content.title} ${content.description} ${content.tags.join(' ')}`.toLowerCase();
      if (searchText.includes(query.toLowerCase())) {
        results.push(content);
      }
    }

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private calculateReplicationHealth(): number {
    const healthyContent = Array.from(this.unifiedContent.values()).filter(c => 
      c.replicationStatus.health === 'healthy'
    ).length;
    
    const totalContent = this.unifiedContent.size;
    return totalContent > 0 ? (healthyContent / totalContent) * 100 : 100;
  }

  private handleIPFSContentUpdate(): void {
    
    // TODO: Implement IPFS update handling
  }

  private handleNostrContentAnnouncement(): void {
    
    // TODO: Implement Nostr announcement handling
  }

  private initializeTeamWorkspaces(): void {
    // Initialize workspaces for existing content
    for (const content of this.unifiedContent.values()) {
      if (!this.teamWorkspaces.has(content.teamId)) {
        this.updateTeamWorkspace(content.teamId, 'workspace-initialized', 'system');
      }
    }
  }

  private loadContentRegistry(): void {
    // Load from localStorage or other persistence
    const stored = localStorage.getItem('starcom-unified-content');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        for (const [id, content] of Object.entries(data)) {
          this.unifiedContent.set(id, content as UnifiedContent);
        }
        
      } catch (error) {
        console.warn('⚠️ Failed to load unified content registry:', error);
      }
    }
  }

  private saveContentRegistry(): void {
    try {
      const data = Object.fromEntries(this.unifiedContent.entries());
      localStorage.setItem('starcom-unified-content', JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save unified content registry:', error);
    }
  }

  private emitEvent(eventType: string, data: unknown): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      }
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.eventListeners.clear();
    this.saveContentRegistry();

    
  }
}

export default UnifiedIPFSNostrService;
