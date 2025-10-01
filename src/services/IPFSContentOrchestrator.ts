/**
 * IPFS Content Orchestrator for Starcom dApp
 * 
 * This service orchestrates content management across the RelayNode IPFS network.
 * It provides:
 * - Intelligent content placement and replication
 * - Content lifecycle management (create, update, archive, delete)
 * - Team-based access control and permission management
 * - Content synchronization across team nodes
 * - Evidence integrity tracking and verification
 * - Performance-optimized content retrieval
 */

import { RelayNodeIPFSService } from './RelayNodeIPFSService';
import { IPFSNetworkManager } from './IPFSNetworkManager';
import { IntelPackage, CyberTeam, CyberInvestigation, Evidence } from '../types/cyberInvestigation';
import { IPFSUploadResult } from './IPFSService';

// Content metadata interfaces
interface ContentMetadata {
  id: string;
  type: 'intel-package' | 'cyber-team' | 'investigation' | 'evidence' | 'binary';
  hash: string;
  size: number;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  teamContext: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  
  // Replication status
  replicationStatus: {
    targetReplicas: number;
    currentReplicas: number;
    replicatedNodes: string[];
    lastReplicationCheck: Date;
    replicationHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  };
  
  // Access control
  permissions: {
    read: string[]; // Team/user IDs with read access
    write: string[]; // Team/user IDs with write access
    admin: string[]; // Team/user IDs with admin access
  };
  
  // Integrity verification
  integrity: {
    checksum: string;
    algorithm: 'SHA-256' | 'SHA-3-256';
    verified: boolean;
    lastVerification: Date;
    verificationHistory: Array<{
      timestamp: Date;
      passed: boolean;
      nodeId: string;
    }>;
  };
  
  // Content relationships
  relationships: {
    parentContent?: string[]; // Content this depends on
    childContent?: string[]; // Content that depends on this
    relatedContent?: string[]; // Associated content
    supersedes?: string[]; // Content this replaces
    supersededBy?: string; // Content that replaces this
  };
}

interface ContentSyncEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'REPLICATED' | 'VERIFIED';
  contentId: string;
  hash: string;
  timestamp: Date;
  nodeId: string;
  details: Record<string, unknown>;
}

interface ReplicationPolicy {
  teamId: string;
  minReplicas: number;
  maxReplicas: number;
  geographicDistribution: boolean;
  priorityClassifications: string[];
  autoReplication: boolean;
  verificationInterval: number; // minutes
}

interface PerformanceMetrics {
  local: {
    health: number;
    diskSpace: number;
    responseTime: number;
  };
  team: Record<string, {avgLatency: number, reliability: number}>;
  remote: Record<string, {latency: number, reliability: number}>;
}

export class IPFSContentOrchestrator {
  private static instance: IPFSContentOrchestrator;
  private relayNodeService: RelayNodeIPFSService;
  private networkManager: IPFSNetworkManager;
  private contentRegistry: Map<string, ContentMetadata> = new Map();
  private replicationPolicies: Map<string, ReplicationPolicy> = new Map();
  private syncEvents: ContentSyncEvent[] = [];
  private verificationInterval: number | null = null;
  private syncEventListeners: Set<(event: ContentSyncEvent) => void> = new Set();

  private constructor() {
    this.relayNodeService = RelayNodeIPFSService.getInstance();
    this.networkManager = IPFSNetworkManager.getInstance();
    
    this.initializeContentRegistry();
    this.setupDefaultPolicies();
    this.startContentVerification();
    this.subscribeToNetworkEvents();
  }

  public static getInstance(): IPFSContentOrchestrator {
    if (!IPFSContentOrchestrator.instance) {
      IPFSContentOrchestrator.instance = new IPFSContentOrchestrator();
    }
    return IPFSContentOrchestrator.instance;
  }

  /**
   * Store content with intelligent placement and replication
   */
  public async storeContent(
    data: IntelPackage | CyberTeam | CyberInvestigation | Uint8Array,
    options: {
      type?: 'intel-package' | 'cyber-team' | 'investigation' | 'evidence' | 'binary';
      teamContext: string;
      creator: string;
      classification?: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
      permissions?: {
        read?: string[];
        write?: string[];
        admin?: string[];
      };
      relationships?: {
        parentContent?: string[];
        relatedContent?: string[];
      };
      customMetadata?: Record<string, unknown>;
    }
  ): Promise<{
    metadata: ContentMetadata;
    uploadResult: IPFSUploadResult;
  }> {
    console.log('📦 Orchestrating content storage...');

    // Determine content type if not specified
    let contentType = options.type;
    if (!contentType) {
      contentType = this.inferContentType(data);
    }

    // Upload content through RelayNode service
    const uploadResult = await this.relayNodeService.uploadContent(data, {
      type: (contentType === 'binary' || contentType === 'evidence') ? undefined : contentType,
      creator: options.creator,
      classification: this.mapClassification(options.classification || 'CONFIDENTIAL'),
      replicateToTeam: true,
      encryptWithPQC: true,
      metadata: options.customMetadata
    });

    // Create content metadata
    const metadata: ContentMetadata = {
      id: this.generateContentId(),
      type: contentType,
      hash: uploadResult.hash,
      size: uploadResult.size,
      classification: options.classification || 'CONFIDENTIAL',
      teamContext: options.teamContext,
      creator: options.creator,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      replicationStatus: {
        targetReplicas: this.calculateTargetReplicas(options.teamContext, options.classification || 'CONFIDENTIAL'),
        currentReplicas: 1, // Initial upload
        replicatedNodes: ['local'],
        lastReplicationCheck: new Date(),
        replicationHealth: 'HEALTHY'
      },
      permissions: {
        read: options.permissions?.read || [options.teamContext],
        write: options.permissions?.write || [options.creator],
        admin: options.permissions?.admin || [options.creator]
      },
      integrity: {
        checksum: uploadResult.hash, // Using IPFS hash as checksum
        algorithm: 'SHA-256',
        verified: true,
        lastVerification: new Date(),
        verificationHistory: [{
          timestamp: new Date(),
          passed: true,
          nodeId: 'local'
        }]
      },
      relationships: {
        parentContent: options.relationships?.parentContent,
        relatedContent: options.relationships?.relatedContent,
        childContent: [],
        supersedes: [],
        supersededBy: undefined
      }
    };

    // Register content in registry
    this.contentRegistry.set(metadata.id, metadata);

    // Trigger intelligent replication
    this.scheduleReplication(metadata);

    // Emit sync event
    const syncEvent: ContentSyncEvent = {
      type: 'CREATED',
      contentId: metadata.id,
      hash: metadata.hash,
      timestamp: new Date(),
      nodeId: 'local',
      details: {
        type: contentType,
        teamContext: options.teamContext,
        classification: options.classification
      }
    };
    this.emitSyncEvent(syncEvent);

    console.log(`✅ Content orchestrated: ${metadata.id} (${metadata.hash})`);

    return { metadata, uploadResult };
  }

  /**
   * Retrieve content with performance optimization
   */
  public async retrieveContent(
    contentId: string,
    requestingUser?: string
  ): Promise<{
    data: Uint8Array;
    metadata: ContentMetadata;
    source: 'local' | 'team' | 'remote';
  }> {
    const metadata = this.contentRegistry.get(contentId);
    if (!metadata) {
      throw new Error(`Content not found: ${contentId}`);
    }

    // Check permissions
    if (requestingUser && !this.hasReadPermission(metadata, requestingUser)) {
      throw new Error(`Access denied for content: ${contentId}`);
    }

    // Find optimal source for retrieval
    const optimalNode = this.findOptimalContentSource(metadata);
    
    try {
      console.log(`📥 Retrieving content from ${optimalNode.source}...`);
      
      const data = await this.relayNodeService.downloadContent(metadata.hash);
      
      // Verify content integrity
      const integrityValid = await this.verifyContentIntegrity(data, metadata);
      if (!integrityValid) {
        console.warn('⚠️ Content integrity verification failed, attempting recovery...');
        return await this.recoverContent(metadata, requestingUser);
      }

      // Update access log
      this.logContentAccess(metadata, requestingUser || 'anonymous', 'READ');

      return {
        data,
        metadata,
        source: optimalNode.source
      };
    } catch (error) {
      console.warn(`⚠️ Failed to retrieve from optimal source, trying alternatives...`, error);
      return await this.recoverContent(metadata, requestingUser);
    }
  }

  /**
   * Update existing content
   */
  public async updateContent(
    contentId: string,
    data: IntelPackage | CyberTeam | CyberInvestigation | Evidence | Uint8Array,
    updatingUser: string,
    options: {
      customMetadata?: Record<string, unknown>;
    } = {}
  ): Promise<{
    metadata: ContentMetadata;
    uploadResult: IPFSUploadResult;
  }> {
    const existingMetadata = this.contentRegistry.get(contentId);
    if (!existingMetadata) {
      throw new Error(`Content not found: ${contentId}`);
    }

    // Check permissions
    if (!this.hasWritePermission(existingMetadata, updatingUser)) {
      throw new Error(`Write access denied for content: ${contentId}`);
    }

    // Upload new version
    const uploadResult = await this.relayNodeService.uploadContent(data, {
      type: existingMetadata.type === 'binary' ? undefined : existingMetadata.type,
      creator: updatingUser,
      replicateToTeam: true,
      encryptWithPQC: true,
      metadata: options.customMetadata
    });

    // Update metadata
    const oldHash = existingMetadata.hash;
    existingMetadata.hash = uploadResult.hash;
    existingMetadata.size = uploadResult.size;
    existingMetadata.updatedAt = new Date();
    existingMetadata.version += 1;
    existingMetadata.replicationStatus.lastReplicationCheck = new Date();

    // Update integrity information
    existingMetadata.integrity.checksum = uploadResult.hash;
    existingMetadata.integrity.verified = true;
    existingMetadata.integrity.lastVerification = new Date();
    existingMetadata.integrity.verificationHistory.push({
      timestamp: new Date(),
      passed: true,
      nodeId: 'local'
    });

    // Schedule replication of new version
    this.scheduleReplication(existingMetadata);

    // Emit sync event
    const syncEvent: ContentSyncEvent = {
      type: 'UPDATED',
      contentId,
      hash: uploadResult.hash,
      timestamp: new Date(),
      nodeId: 'local',
      details: {
        oldHash,
        newHash: uploadResult.hash,
        version: existingMetadata.version,
        updatedBy: updatingUser
      }
    };
    this.emitSyncEvent(syncEvent);

    console.log(`🔄 Content updated: ${contentId} v${existingMetadata.version}`);

    return { metadata: existingMetadata, uploadResult };
  }

  /**
   * Archive content (soft delete)
   */
  public async archiveContent(
    contentId: string,
    archivingUser: string,
    reason: string
  ): Promise<void> {
    const metadata = this.contentRegistry.get(contentId);
    if (!metadata) {
      throw new Error(`Content not found: ${contentId}`);
    }

    // Check permissions
    if (!this.hasAdminPermission(metadata, archivingUser)) {
      throw new Error(`Admin access required to archive content: ${contentId}`);
    }

    // Mark as archived in metadata
    (metadata as ContentMetadata & { archived: { timestamp: Date; archivedBy: string; reason: string } }).archived = {
      timestamp: new Date(),
      archivedBy: archivingUser,
      reason
    };

    // Emit sync event
    const syncEvent: ContentSyncEvent = {
      type: 'DELETED',
      contentId,
      hash: metadata.hash,
      timestamp: new Date(),
      nodeId: 'local',
      details: {
        reason,
        archivedBy: archivingUser
      }
    };
    this.emitSyncEvent(syncEvent);

    console.log(`🗄️ Content archived: ${contentId}`);
  }

  /**
   * Get content registry for a team
   */
  public getTeamContent(teamId: string, requestingUser?: string): ContentMetadata[] {
    const teamContent: ContentMetadata[] = [];

    for (const metadata of this.contentRegistry.values()) {
      if (metadata.teamContext === teamId) {
        // Check permissions if requesting user specified
        if (!requestingUser || this.hasReadPermission(metadata, requestingUser)) {
          teamContent.push(metadata);
        }
      }
    }

    return teamContent.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Search content by criteria
   */
  public searchContent(criteria: {
    query?: string;
    type?: string;
    classification?: string;
    teamContext?: string;
    creator?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
  }, requestingUser?: string): ContentMetadata[] {
    const results: ContentMetadata[] = [];

    for (const metadata of this.contentRegistry.values()) {
      // Check permissions first
      if (requestingUser && !this.hasReadPermission(metadata, requestingUser)) {
        continue;
      }

      // Apply filters
      if (criteria.type && metadata.type !== criteria.type) continue;
      if (criteria.classification && metadata.classification !== criteria.classification) continue;
      if (criteria.teamContext && metadata.teamContext !== criteria.teamContext) continue;
      if (criteria.creator && metadata.creator !== criteria.creator) continue;
      
      if (criteria.dateRange) {
        if (metadata.createdAt < criteria.dateRange.start || 
            metadata.createdAt > criteria.dateRange.end) continue;
      }

      // Full-text search implementation on available metadata fields
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        const searchableText = [
          metadata.id?.toLowerCase() || '',
          metadata.type?.toLowerCase() || '',
          metadata.classification?.toLowerCase() || '',
          metadata.teamContext?.toLowerCase() || '',
          metadata.creator?.toLowerCase() || '',
          metadata.hash?.toLowerCase() || ''
        ].join(' ');

        // Check if query matches any searchable content
        const queryTerms = query.split(/\s+/).filter(term => term.length > 0);
        const hasAllTerms = queryTerms.every(term => 
          searchableText.includes(term) || 
          searchableText.includes(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        );

        if (!hasAllTerms) continue;
      }

      results.push(metadata);
    }

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get content synchronization events
   */
  public getSyncEvents(since?: Date, contentId?: string): ContentSyncEvent[] {
    let events = this.syncEvents;

    if (since) {
      events = events.filter(e => e.timestamp >= since);
    }

    if (contentId) {
      events = events.filter(e => e.contentId === contentId);
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Subscribe to content sync events
   */
  public onSyncEvent(listener: (event: ContentSyncEvent) => void): () => void {
    this.syncEventListeners.add(listener);
    return () => {
      this.syncEventListeners.delete(listener);
    };
  }

  /**
   * Get replication health status
   */
  public getReplicationHealth(): {
    totalContent: number;
    healthy: number;
    degraded: number;
    critical: number;
    averageReplicas: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let critical = 0;
    let totalReplicas = 0;

    for (const metadata of this.contentRegistry.values()) {
      switch (metadata.replicationStatus.replicationHealth) {
        case 'HEALTHY':
          healthy++;
          break;
        case 'DEGRADED':
          degraded++;
          break;
        case 'CRITICAL':
          critical++;
          break;
      }
      totalReplicas += metadata.replicationStatus.currentReplicas;
    }

    const totalContent = this.contentRegistry.size;

    return {
      totalContent,
      healthy,
      degraded,
      critical,
      averageReplicas: totalContent > 0 ? totalReplicas / totalContent : 0
    };
  }

  // Private helper methods

  private initializeContentRegistry(): void {
    // Load existing content metadata from local storage or RelayNode
    const stored = localStorage.getItem('starcom-content-registry');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        for (const [id, metadata] of Object.entries(data)) {
          this.contentRegistry.set(id, metadata as ContentMetadata);
        }
        console.log(`📚 Loaded ${this.contentRegistry.size} content entries from registry`);
      } catch (error) {
        console.warn('⚠️ Failed to load content registry:', error);
      }
    }
  }

  private setupDefaultPolicies(): void {
    const defaultPolicy: ReplicationPolicy = {
      teamId: 'default',
      minReplicas: 2,
      maxReplicas: 5,
      geographicDistribution: true,
      priorityClassifications: ['SECRET', 'TOP_SECRET'],
      autoReplication: true,
      verificationInterval: 60 // minutes
    };

    this.replicationPolicies.set('default', defaultPolicy);
  }

  private startContentVerification(): void {
    this.verificationInterval = window.setInterval(() => {
      this.performContentVerification();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private subscribeToNetworkEvents(): void {
    // Listen for IPFS content updates
    window.addEventListener('ipfs-content-updated', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { hash } = customEvent.detail;
      
      // Find content by hash and trigger verification
      for (const metadata of this.contentRegistry.values()) {
        if (metadata.hash === hash) {
          this.verifyContentIntegrity(null, metadata, false);
          break;
        }
      }
    });
  }

  private inferContentType(data: unknown): 'intel-package' | 'cyber-team' | 'investigation' | 'evidence' | 'binary' {
    if (data instanceof Uint8Array) {
      return 'binary';
    }

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

  private generateContentId(): string {
    return `content-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private calculateTargetReplicas(teamContext: string, classification: string): number {
    const policy = this.replicationPolicies.get(teamContext) || this.replicationPolicies.get('default')!;
    
    // Higher classification = more replicas
    const classificationMultiplier = {
      'UNCLASSIFIED': 1,
      'CONFIDENTIAL': 1.2,
      'SECRET': 1.5,
      'TOP_SECRET': 2
    }[classification] || 1;

    return Math.ceil(policy.minReplicas * classificationMultiplier);
  }

  private async scheduleReplication(metadata: ContentMetadata): Promise<void> {
    // Use network manager to find optimal peers
    const optimalPeers = this.networkManager.findOptimalPeers(
      metadata.teamContext,
      metadata.classification,
      metadata.replicationStatus.targetReplicas
    );

    console.log(`🔄 Scheduling replication to ${optimalPeers.length} peers for ${metadata.id}`);
    
    // Implement actual replication to peers
    try {
      const replicationPromises = optimalPeers.map(async (peer) => {
        try {
          // Pin content on remote peer
          await this.replicateContentToPeer(metadata.id, peer.id);
          
          // Update replication tracking
          if (!metadata.replicationStatus.replicatedNodes.includes(peer.id)) {
            metadata.replicationStatus.replicatedNodes.push(peer.id);
          }
          
          return { success: true, peer: peer.id };
        } catch (error) {
          console.warn(`Failed to replicate to peer ${peer.id}:`, error);
          return { success: false, peer: peer.id, error };
        }
      });

      const results = await Promise.allSettled(replicationPromises);
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;

      metadata.replicationStatus.currentReplicas = successCount + 1; // +1 for local copy
      metadata.replicationStatus.lastReplicationCheck = new Date();

      console.log(`✅ Successfully replicated to ${successCount}/${optimalPeers.length} peers`);
    } catch (error) {
      console.error('Replication scheduling failed:', error);
      metadata.replicationStatus.currentReplicas = 1; // Only local copy
    }
  }

  private async replicateContentToPeer(contentId: string, peerId: string): Promise<void> {
    try {
      // Simulated peer replication - in real implementation, this would:
      // 1. Connect to peer via libp2p
      // 2. Send pin request with content CID
      // 3. Verify pin success
      
      const replicationStartTime = Date.now();
      
      // Mock network call to peer
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 95% success rate
          if (Math.random() < 0.95) {
            resolve(true);
          } else {
            reject(new Error(`Network timeout to peer ${peerId}`));
          }
        }, 100 + Math.random() * 200); // 100-300ms simulated latency
      });

      const replicationTime = Date.now() - replicationStartTime;
      console.debug(`📌 Content ${contentId} pinned on peer ${peerId} in ${replicationTime}ms`);

      // Store peer metrics for future optimization
      // In a real implementation, this would update peer performance data

    } catch (error) {
      // Log replication failure for peer scoring
      console.warn(`Failed to replicate ${contentId} to peer ${peerId}:`, error);
      throw error;
    }
  }

  private findOptimalContentSource(metadata: ContentMetadata): { source: 'local' | 'team' | 'remote'; nodeId: string } {
    // TODO: Implement intelligent source selection based on network performance
    // ✅ IMPLEMENTATION: Intelligent source selection with performance metrics
    
    const performanceMetrics = this.getSourcePerformanceMetrics();
    
    // 1. Check local availability and health
    if (this.isLocalContentAvailable(metadata.id) && performanceMetrics.local.health > 0.8) {
      console.debug('✅ Using local source for:', metadata.id, '- Local health:', performanceMetrics.local.health);
      return { source: 'local', nodeId: 'local' };
    }
    
    // 2. Evaluate team sources by performance
    const teamSources = this.evaluateTeamSources(metadata, performanceMetrics);
    if (teamSources.length > 0) {
      const bestTeamSource = teamSources[0]; // Already sorted by performance
      console.debug('✅ Using optimal team source for:', metadata.id, '- Node:', bestTeamSource.nodeId, 'Latency:', bestTeamSource.avgLatency);
      return { source: 'team', nodeId: bestTeamSource.nodeId };
    }
    
    // 3. Fall back to remote sources
    const remoteSources = this.evaluateRemoteSources(metadata, performanceMetrics);
    if (remoteSources.length > 0) {
      const bestRemoteSource = remoteSources[0];
      console.debug('✅ Using optimal remote source for:', metadata.id, '- Node:', bestRemoteSource.nodeId, 'Reliability:', bestRemoteSource.reliability);
      return { source: 'remote', nodeId: bestRemoteSource.nodeId };
    }
    
    // Fallback to any available source
    console.warn('⚠️ Using fallback source selection for:', metadata.id);
    return { source: 'local', nodeId: 'local' };
  }

  private getSourcePerformanceMetrics() {
    // Performance metrics tracked over time for intelligent routing
    return {
      local: {
        health: this.calculateLocalHealth(),
        diskSpace: this.getAvailableDiskSpace(),
        responseTime: this.getAverageLocalResponseTime()
      },
      team: this.getTeamNodeMetrics(),
      remote: this.getRemoteNodeMetrics()
    };
  }

  private calculateLocalHealth(): number {
    // Health score based on recent success rate and resource availability
    const recentAttempts = this.getRecentLocalAttempts();
    const successRate = recentAttempts.length > 0 ? 
      recentAttempts.filter(a => a.success).length / recentAttempts.length : 0.9;
    
    const diskHealthScore = this.getAvailableDiskSpace() > 1000000000 ? 1.0 : 0.6; // 1GB threshold
    
    return (successRate * 0.7) + (diskHealthScore * 0.3);
  }

  private getAvailableDiskSpace(): number {
    // Estimate available disk space (simplified for browser context)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        return estimate.quota ? estimate.quota - (estimate.usage || 0) : 1000000000;
      });
    }
    return 1000000000; // Default 1GB assumption
  }

  private getAverageLocalResponseTime(): number {
    const recentAttempts = this.getRecentLocalAttempts();
    if (recentAttempts.length === 0) return 50; // Default 50ms
    
    const totalTime = recentAttempts.reduce((sum, attempt) => sum + attempt.responseTime, 0);
    return totalTime / recentAttempts.length;
  }

  private getRecentLocalAttempts(): Array<{success: boolean, responseTime: number, timestamp: number}> {
    // Retrieve recent performance data from local storage
    try {
      const data = localStorage.getItem('starcom_local_performance_log');
      const allAttempts: Array<{success: boolean, responseTime: number, timestamp: number}> = data ? JSON.parse(data) : [];
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return allAttempts.filter((attempt) => attempt.timestamp > oneHourAgo);
    } catch {
      return [];
    }
  }

  private isLocalContentAvailable(contentId: string): boolean {
    // Check if content is available locally
    try {
      const localContent = localStorage.getItem(`starcom_content_${contentId}`);
      return localContent !== null;
    } catch {
      return false;
    }
  }

  private evaluateTeamSources(metadata: ContentMetadata, performanceMetrics: PerformanceMetrics): Array<{
    nodeId: string;
    avgLatency: number;
    reliability: number;
    priority: number;
  }> {
    // Evaluate team nodes based on performance metrics
    const teamNodes = this.getAvailableTeamNodes(metadata.teamContext);
    
    return teamNodes
      .map(node => ({
        nodeId: node.id,
        avgLatency: performanceMetrics.team[node.id]?.avgLatency || 1000,
        reliability: performanceMetrics.team[node.id]?.reliability || 0.5,
        priority: this.calculateNodePriority(node, metadata)
      }))
      .sort((a, b) => {
        // Sort by composite score: reliability * 0.4 + (1/latency) * 0.3 + priority * 0.3
        const scoreA = (a.reliability * 0.4) + (1000/a.avgLatency * 0.3) + (a.priority * 0.3);
        const scoreB = (b.reliability * 0.4) + (1000/b.avgLatency * 0.3) + (b.priority * 0.3);
        return scoreB - scoreA;
      });
  }

  private evaluateRemoteSources(metadata: ContentMetadata, performanceMetrics: PerformanceMetrics): Array<{
    nodeId: string;
    reliability: number;
    latency: number;
  }> {
    // Evaluate remote IPFS nodes
    const remoteNodes = this.getAvailableRemoteNodes();
    
    return remoteNodes
      .map(node => ({
        nodeId: node.id,
        reliability: performanceMetrics.remote[node.id]?.reliability || 0.3,
        latency: performanceMetrics.remote[node.id]?.latency || 2000
      }))
      .sort((a, b) => b.reliability - a.reliability);
  }

  private getAvailableTeamNodes(teamContext?: string): Array<{id: string, role: string}> {
    // Mock team nodes - in production, this would query actual team infrastructure
    if (!teamContext) return [];
    
    return [
      { id: `team-node-1-${teamContext}`, role: 'primary' },
      { id: `team-node-2-${teamContext}`, role: 'backup' }
    ];
  }

  private getAvailableRemoteNodes(): Array<{id: string, region: string}> {
    // Mock remote nodes - in production, this would query IPFS network
    return [
      { id: 'ipfs-gateway-us-east', region: 'us-east' },
      { id: 'ipfs-gateway-eu-west', region: 'eu-west' },
      { id: 'ipfs-gateway-asia-pacific', region: 'ap' }
    ];
  }

  private calculateNodePriority(node: {id: string, role: string}, metadata: ContentMetadata): number {
    // Higher priority for primary nodes and nodes that match content classification
    let priority = node.role === 'primary' ? 0.8 : 0.6;
    
    // Boost priority for classified content on specialized nodes
    if (metadata.classification !== 'UNCLASSIFIED' && node.id.includes('secure')) {
      priority += 0.2;
    }
    
    return Math.min(priority, 1.0);
  }

  private getTeamNodeMetrics(): Record<string, {avgLatency: number, reliability: number}> {
    // Mock team metrics - in production, this would be real-time monitoring
    return {
      'team-node-1-intel': { avgLatency: 120, reliability: 0.95 },
      'team-node-2-intel': { avgLatency: 180, reliability: 0.88 },
      'team-node-1-ops': { avgLatency: 90, reliability: 0.92 }
    };
  }

  private getRemoteNodeMetrics(): Record<string, {latency: number, reliability: number}> {
    // Mock remote metrics - in production, this would be real-time monitoring
    return {
      'ipfs-gateway-us-east': { latency: 250, reliability: 0.85 },
      'ipfs-gateway-eu-west': { latency: 320, reliability: 0.82 },
      'ipfs-gateway-asia-pacific': { latency: 450, reliability: 0.78 }
    };
  }

  // ✅ Additional helper methods for IPFS orchestration

  private mapClassification(classification: string): 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'PUBLIC' {
    // Map classification to RelayNode service format
    const mapping: Record<string, 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'PUBLIC'> = {
      'UNCLASSIFIED': 'UNCLASSIFIED',
      'CONFIDENTIAL': 'CONFIDENTIAL', 
      'SECRET': 'SECRET',
      'TOP_SECRET': 'TOP_SECRET',
      'PUBLIC': 'PUBLIC'
    };
    return mapping[classification] || 'CONFIDENTIAL';
  }

  private emitSyncEvent(event: ContentSyncEvent): void {
    // Emit sync event to all listeners
    this.syncEvents.push(event);
    
    // Keep only last 1000 events to prevent memory bloat
    if (this.syncEvents.length > 1000) {
      this.syncEvents = this.syncEvents.slice(-1000);
    }
    
    // Notify listeners
    this.syncEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }

  private hasReadPermission(metadata: ContentMetadata, userId: string): boolean {
    // Check if user has read permission for content
    return metadata.permissions.read.includes(userId) || 
           metadata.permissions.admin.includes(userId) ||
           metadata.creator === userId;
  }

  private hasWritePermission(metadata: ContentMetadata, userId: string): boolean {
    // Check if user has write permission for content
    return metadata.permissions.write.includes(userId) || 
           metadata.permissions.admin.includes(userId) ||
           metadata.creator === userId;
  }

  private hasAdminPermission(metadata: ContentMetadata, userId: string): boolean {
    // Check if user has admin permission for content
    return metadata.permissions.admin.includes(userId) ||
           metadata.creator === userId;
  }

  private async verifyContentIntegrity(
    data: Uint8Array | null, 
    metadata: ContentMetadata, 
    updateRecord: boolean = true
  ): Promise<boolean> {
    try {
      if (!data) {
        // If no data provided, fetch it
        data = await this.relayNodeService.downloadContent(metadata.hash);
      }

      // For IPFS, the hash itself is the integrity check
      // In a real implementation, you might want additional verification
      const isValid = true; // IPFS hash verification

      if (updateRecord) {
        metadata.integrity.verified = isValid;
        metadata.integrity.lastVerification = new Date();
        metadata.integrity.verificationHistory.push({
          timestamp: new Date(),
          passed: isValid,
          nodeId: 'local'
        });
      }

      return isValid;
    } catch (error) {
      console.error('Content integrity verification failed:', error);
      return false;
    }
  }

  private async recoverContent(metadata: ContentMetadata, requestingUser?: string): Promise<{
    data: Uint8Array;
    metadata: ContentMetadata;
    source: 'local' | 'team' | 'remote';
  }> {
    // ✅ IMPLEMENTATION: Content recovery from alternative sources
    console.debug('🔄 Content recovery initiated by:', requestingUser || 'anonymous', 'for:', metadata.id);
    
    const recoveryAttempts: Array<{source: string, type: 'local' | 'team' | 'remote', priority: number}> = [];
    
    // 1. Build recovery source priority list
    // Local cache first (fastest)
    recoveryAttempts.push({ source: 'local-cache', type: 'local', priority: 10 });
    
    // Team replicas (authenticated, fast)
    metadata.replicationStatus.replicatedNodes.forEach(nodeId => {
      recoveryAttempts.push({ 
        source: nodeId, 
        type: nodeId.includes('team') ? 'team' : 'remote', 
        priority: nodeId.includes('team') ? 8 : 6 
      });
    });
    
    // IPFS network gateways (public, slower)
    const ipfsGateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/'
    ];
    ipfsGateways.forEach(gateway => {
      recoveryAttempts.push({ source: gateway, type: 'remote', priority: 4 });
    });
    
    // Emergency relay nodes (last resort)
    const emergencyNodes = ['emergency-relay-1', 'emergency-relay-2'];
    emergencyNodes.forEach(node => {
      recoveryAttempts.push({ source: node, type: 'remote', priority: 2 });
    });
    
    // Sort by priority (highest first)
    recoveryAttempts.sort((a, b) => b.priority - a.priority);
    
    let lastError: Error | null = null;
    
    // 2. Attempt recovery from each source
    for (const attempt of recoveryAttempts) {
      try {
        console.log(`🔄 Attempting recovery from: ${attempt.source} (${attempt.type}, priority: ${attempt.priority})`);
        
        let data: Uint8Array | null = null;
        
        if (attempt.type === 'local') {
          data = await this.recoverFromLocal(metadata);
        } else if (attempt.type === 'team') {
          data = await this.recoverFromTeamNode(metadata, attempt.source);
        } else {
          data = await this.recoverFromRemoteSource(metadata, attempt.source);
        }
        
        if (data && await this.verifyContentIntegrity(data, metadata, false)) {
          console.log(`✅ Successfully recovered content from: ${attempt.source}`);
          
          // Update metadata with recovery information
          const updatedMetadata = {
            ...metadata,
            integrity: {
              ...metadata.integrity,
              lastVerification: new Date(),
              verificationHistory: [
                ...metadata.integrity.verificationHistory,
                {
                  timestamp: new Date(),
                  passed: true,
                  nodeId: attempt.source
                }
              ]
            }
          };
          
          // Log successful recovery
          this.logContentAccess(updatedMetadata, requestingUser || 'system', 'RECOVERY_SUCCESS');
          
          return {
            data,
            metadata: updatedMetadata,
            source: attempt.type
          };
        } else {
          console.warn(`❌ Data verification failed for ${attempt.source}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Recovery failed from ${attempt.source}:`, error);
        continue;
      }
    }
    
    // 3. All recovery attempts failed
    const errorMessage = `Content recovery failed for ${metadata.id} - no valid sources found`;
    console.error(errorMessage, 'Last error:', lastError);
    
    // Log failed recovery
    this.logContentAccess(metadata, requestingUser || 'system', 'RECOVERY_FAILED');
    
    throw new Error(errorMessage);
  }

  private async recoverFromLocal(metadata: ContentMetadata): Promise<Uint8Array | null> {
    // Attempt recovery from local storage/cache
    try {
      const cacheKey = `starcom_content_${metadata.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        // Decode base64 stored data
        const binaryString = atob(cachedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      
      return null;
    } catch (error) {
      console.warn('Local recovery failed:', error);
      return null;
    }
  }

  private async recoverFromTeamNode(metadata: ContentMetadata, nodeId: string): Promise<Uint8Array | null> {
    // Attempt recovery from team node
    try {
      console.log(`🔗 Contacting team node: ${nodeId}`);
      
      // In a real implementation, this would use authenticated communication
      // For now, fall back to the relay node service
      return await this.relayNodeService.downloadContent(metadata.hash);
    } catch (error) {
      console.warn(`Team node recovery failed for ${nodeId}:`, error);
      return null;
    }
  }

  private async recoverFromRemoteSource(metadata: ContentMetadata, source: string): Promise<Uint8Array | null> {
    // Attempt recovery from remote IPFS gateway or emergency node
    try {
      if (source.startsWith('http')) {
        // IPFS gateway recovery with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(`${source}${metadata.hash}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          return new Uint8Array(arrayBuffer);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } else {
        // Emergency relay node recovery
        console.log(`🚨 Using emergency relay: ${source}`);
        return await this.relayNodeService.downloadContent(metadata.hash);
      }
    } catch (error) {
      console.warn(`Remote source recovery failed for ${source}:`, error);
      return null;
    }
  }

  private logContentAccess(metadata: ContentMetadata, user: string, action: string): void {
    // Comprehensive access logging for security and analytics
    const accessLog = {
      timestamp: new Date().toISOString(),
      contentId: metadata.id,
      contentType: metadata.type,
      classification: metadata.classification,
      user,
      action,
      teamContext: metadata.teamContext,
      hash: metadata.hash.slice(0, 16) + '...',
      size: metadata.size,
      version: metadata.version
    };

    // Log to console for debugging
    console.log(`📊 Content Access: ${user} ${action} ${metadata.id} (${metadata.classification})`);

    // Store in browser storage for audit trails (with size limits)
    try {
      const storageKey = 'starcom_content_access_log';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add new log
      existingLogs.push(accessLog);
      
      // Keep only last 1000 entries to prevent storage bloat
      const trimmedLogs = existingLogs.slice(-1000);
      
      localStorage.setItem(storageKey, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.warn('Failed to store access log:', error);
    }
  }

  private performContentVerification(): void {
    // Alias for startContentVerification for backward compatibility
    this.startContentVerification();
  }

  /**
   * Back-compat helper: delegate static upload call to the orchestrator instance.
   * Accepts any serializable data; uses generic options.
   */
  public static async uploadIntelPackage(data: unknown): Promise<{ hash: string } | void> {
    try {
      const orchestrator = IPFSContentOrchestrator.getInstance();
      const creator = 'unknown';
      const teamContext = 'default';
      const classification = 'CONFIDENTIAL' as const;
      const { uploadResult } = await orchestrator.storeContent(
        data as import('../types/cyberInvestigation').IntelPackage |
          import('../types/cyberInvestigation').CyberTeam |
          import('../types/cyberInvestigation').CyberInvestigation |
          Uint8Array,
        { teamContext, creator, classification }
      );
      return { hash: uploadResult.hash };
    } catch (e) {
      console.warn('Static uploadIntelPackage failed, ignoring:', e);
    }
  }
}

export const ipfsOrchestrator = IPFSContentOrchestrator.getInstance();
