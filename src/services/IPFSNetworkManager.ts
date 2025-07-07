/**
 * IPFS Network Manager for AI Security RelayNodes
 * 
 * This service manages the network topology, peer discovery, and content routing
 * between RelayNodes in the Starcom dApp ecosystem. It provides:
 * - Dynamic peer discovery and health monitoring
 * - Content replication strategy across team nodes
 * - Network resilience and failover handling
 * - Performance optimization based on node capabilities
 * - Security-aware routing decisions
 */

import { RelayNodeIPFSService } from './RelayNodeIPFSService';

// Network topology interfaces
interface IPFSPeer {
  id: string;
  addresses: string[];
  protocols: string[];
  capabilities: {
    storage: number; // Available storage in bytes
    bandwidth: number; // Available bandwidth in kbps
    uptime: number; // Uptime percentage
    securityLevel: 'BASIC' | 'ENHANCED' | 'QUANTUM_SAFE';
    classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  };
  metadata: {
    agentId: string;
    teamAffiliation: string[];
    geolocation?: {
      country: string;
      region: string;
      coords?: [number, number]; // [lat, lng]
    };
    lastSeen: number;
    trustScore: number; // 0-100 based on historical performance
  };
}

interface NetworkTopology {
  localNode: IPFSPeer;
  teamNodes: Map<string, IPFSPeer[]>; // team -> nodes
  publicNodes: IPFSPeer[];
  blacklistedNodes: Set<string>;
  routingTable: Map<string, string[]>; // content hash -> preferred peer IDs
}

interface ContentReplicationStrategy {
  minReplicas: number;
  maxReplicas: number;
  priorityTeams: string[];
  geographicDistribution: boolean;
  securityRequirements: {
    encryptionRequired: boolean;
    classificationLevel: string;
    accessControlEnabled: boolean;
  };
}

interface PerformanceMetrics {
  uploadSpeed: number; // bytes/sec
  downloadSpeed: number; // bytes/sec
  latency: number; // milliseconds
  successRate: number; // percentage
  lastMeasured: number;
}

export class IPFSNetworkManager {
  private static instance: IPFSNetworkManager;
  private relayNodeService: RelayNodeIPFSService;
  private networkTopology: NetworkTopology;
  private replicationStrategies: Map<string, ContentReplicationStrategy> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private discoveryInterval: number | null = null;
  private healthCheckInterval: number | null = null;

  private constructor() {
    this.relayNodeService = RelayNodeIPFSService.getInstance();
    this.networkTopology = {
      localNode: this.createLocalNodeInfo(),
      teamNodes: new Map(),
      publicNodes: [],
      blacklistedNodes: new Set(),
      routingTable: new Map()
    };
    
    this.initializeNetworkDiscovery();
    this.setupDefaultReplicationStrategies();
  }

  public static getInstance(): IPFSNetworkManager {
    if (!IPFSNetworkManager.instance) {
      IPFSNetworkManager.instance = new IPFSNetworkManager();
    }
    return IPFSNetworkManager.instance;
  }

  /**
   * Initialize network discovery and monitoring
   */
  private initializeNetworkDiscovery(): void {
    console.log('🌐 Initializing IPFS network discovery...');
    
    // Start peer discovery
    this.discoveryInterval = window.setInterval(() => {
      this.discoverPeers();
    }, 30000); // Every 30 seconds

    // Start health monitoring
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute

    // Initial discovery
    this.discoverPeers();
  }

  /**
   * Discover and catalog IPFS peers in the network
   */
  private async discoverPeers(): Promise<void> {
    try {
      const relayNodeStatus = this.relayNodeService.getRelayNodeStatus();
      
      if (!relayNodeStatus.available) {
        console.log('🔍 RelayNode not available, skipping peer discovery');
        return;
      }

      // Get network stats from RelayNode
      const networkStats = await this.relayNodeService.getNetworkStats();
      if (!networkStats) return;

      console.log(`🔍 Discovered ${networkStats.totalPeers} IPFS peers`);
      
      // Fetch detailed peer information
      const response = await fetch(`${relayNodeStatus.endpoint}/api/ipfs/peers`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const peers: IPFSPeer[] = await response.json();
        this.catalogPeers(peers);
      }
    } catch (error) {
      console.warn('⚠️ Peer discovery failed:', error);
    }
  }

  /**
   * Catalog discovered peers into network topology
   */
  private catalogPeers(peers: IPFSPeer[]): void {
    for (const peer of peers) {
      // Classify peers by team affiliation
      const teamAffiliations = peer.metadata.teamAffiliation;
      
      for (const teamId of teamAffiliations) {
        if (!this.networkTopology.teamNodes.has(teamId)) {
          this.networkTopology.teamNodes.set(teamId, []);
        }
        
        const teamPeers = this.networkTopology.teamNodes.get(teamId)!;
        const existingIndex = teamPeers.findIndex(p => p.id === peer.id);
        
        if (existingIndex >= 0) {
          // Update existing peer
          teamPeers[existingIndex] = peer;
        } else {
          // Add new peer
          teamPeers.push(peer);
        }
      }

      // Add to public nodes if no team affiliation or has public access
      if (teamAffiliations.length === 0 || peer.capabilities.classification === 'UNCLASSIFIED') {
        const existingIndex = this.networkTopology.publicNodes.findIndex(p => p.id === peer.id);
        if (existingIndex >= 0) {
          this.networkTopology.publicNodes[existingIndex] = peer;
        } else {
          this.networkTopology.publicNodes.push(peer);
        }
      }
    }

    console.log('📊 Network topology updated:', {
      teamNodes: this.networkTopology.teamNodes.size,
      publicNodes: this.networkTopology.publicNodes.length,
      blacklisted: this.networkTopology.blacklistedNodes.size
    });
  }

  /**
   * Perform health checks on known peers
   */
  private async performHealthChecks(): Promise<void> {
    const allPeers: IPFSPeer[] = [
      ...this.networkTopology.publicNodes,
      ...Array.from(this.networkTopology.teamNodes.values()).flat()
    ];

    for (const peer of allPeers) {
      try {
        const startTime = Date.now();
        
        // Simple ping test to peer
        const response = await fetch(`http://${peer.addresses[0]}/api/ping`, {
          method: 'GET',
          timeout: 5000
        } as RequestInit & { timeout: number });

        const endTime = Date.now();
        const latency = endTime - startTime;

        if (response.ok) {
          // Update performance metrics
          const metrics: PerformanceMetrics = {
            uploadSpeed: 0, // Would need actual upload test
            downloadSpeed: 0, // Would need actual download test
            latency,
            successRate: this.calculateSuccessRate(peer.id, true),
            lastMeasured: Date.now()
          };
          
          this.performanceMetrics.set(peer.id, metrics);
          
          // Update trust score
          peer.metadata.trustScore = Math.min(100, peer.metadata.trustScore + 1);
        } else {
          // Update failure metrics
          peer.metadata.trustScore = Math.max(0, peer.metadata.trustScore - 5);
          
          // Blacklist if trust score drops too low
          if (peer.metadata.trustScore < 20) {
            this.networkTopology.blacklistedNodes.add(peer.id);
            console.warn(`🚫 Peer ${peer.id} blacklisted due to low trust score`);
          }
        }
      } catch {
        // Peer unreachable
        peer.metadata.trustScore = Math.max(0, peer.metadata.trustScore - 10);
        
        if (peer.metadata.trustScore < 10) {
          this.networkTopology.blacklistedNodes.add(peer.id);
        }
      }
    }
  }

  /**
   * Calculate success rate for a peer
   */
  private calculateSuccessRate(peerId: string, success: boolean): number {
    // Simple implementation - in production, would track historical data
    const existing = this.performanceMetrics.get(peerId);
    if (!existing) return success ? 100 : 0;
    
    // Weighted average with recent performance having more impact
    return success 
      ? Math.min(100, existing.successRate + 5)
      : Math.max(0, existing.successRate - 10);
  }

  /**
   * Find optimal peers for content replication
   */
  public findOptimalPeers(
    teamContext: string,
    classificationLevel: string,
    desiredReplicas: number = 3
  ): IPFSPeer[] {
    const strategy = this.replicationStrategies.get(teamContext) || this.getDefaultStrategy();
    const availablePeers: IPFSPeer[] = [];

    // Get team-specific peers first
    const teamPeers = this.networkTopology.teamNodes.get(teamContext) || [];
    availablePeers.push(...teamPeers.filter(p => 
      this.isPeerSuitable(p, classificationLevel) && 
      !this.networkTopology.blacklistedNodes.has(p.id)
    ));

    // Add public peers if needed and allowed
    if (availablePeers.length < desiredReplicas && classificationLevel === 'UNCLASSIFIED') {
      const publicPeers = this.networkTopology.publicNodes.filter(p => 
        this.isPeerSuitable(p, classificationLevel) && 
        !this.networkTopology.blacklistedNodes.has(p.id) &&
        !availablePeers.some(existing => existing.id === p.id)
      );
      availablePeers.push(...publicPeers);
    }

    // Sort by suitability score
    availablePeers.sort((a, b) => this.calculatePeerScore(b) - this.calculatePeerScore(a));

    // Apply geographic distribution if required
    if (strategy.geographicDistribution) {
      return this.applyGeographicDistribution(availablePeers, desiredReplicas);
    }

    return availablePeers.slice(0, desiredReplicas);
  }

  /**
   * Check if peer is suitable for content with given classification
   */
  private isPeerSuitable(peer: IPFSPeer, classificationLevel: string): boolean {
    const classificationOrder = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    const peerLevel = classificationOrder.indexOf(peer.capabilities.classification);
    const requiredLevel = classificationOrder.indexOf(classificationLevel);
    
    return peerLevel >= requiredLevel && peer.metadata.trustScore >= 70;
  }

  /**
   * Calculate overall suitability score for a peer
   */
  private calculatePeerScore(peer: IPFSPeer): number {
    const metrics = this.performanceMetrics.get(peer.id);
    
    let score = peer.metadata.trustScore; // Base score from trust
    
    if (metrics) {
      score += (metrics.successRate * 0.3); // 30% weight on success rate
      score += Math.min(20, (peer.capabilities.bandwidth / 1000) * 10); // Bandwidth bonus
      score += Math.min(15, (peer.capabilities.uptime / 100) * 15); // Uptime bonus
      score -= Math.min(20, metrics.latency / 50); // Latency penalty
    }
    
    return Math.max(0, Math.min(200, score));
  }

  /**
   * Apply geographic distribution logic
   */
  private applyGeographicDistribution(peers: IPFSPeer[], desired: number): IPFSPeer[] {
    if (!peers.length || desired <= 1) return peers.slice(0, desired);

    const result: IPFSPeer[] = [];
    const regionCounts = new Map<string, number>();

    // First pass: select best peer from each region
    for (const peer of peers) {
      const region = peer.metadata.geolocation?.region || 'unknown';
      const currentCount = regionCounts.get(region) || 0;
      
      if (currentCount === 0 && result.length < desired) {
        result.push(peer);
        regionCounts.set(region, 1);
      }
    }

    // Second pass: fill remaining slots with best available peers
    for (const peer of peers) {
      if (result.length >= desired) break;
      if (!result.some(p => p.id === peer.id)) {
        result.push(peer);
      }
    }

    return result;
  }

  /**
   * Set up default replication strategies for different team types
   */
  private setupDefaultReplicationStrategies(): void {
    const defaultStrategy: ContentReplicationStrategy = {
      minReplicas: 2,
      maxReplicas: 5,
      priorityTeams: [],
      geographicDistribution: true,
      securityRequirements: {
        encryptionRequired: true,
        classificationLevel: 'CONFIDENTIAL',
        accessControlEnabled: true
      }
    };

    const highSecurityStrategy: ContentReplicationStrategy = {
      minReplicas: 3,
      maxReplicas: 7,
      priorityTeams: [],
      geographicDistribution: true,
      securityRequirements: {
        encryptionRequired: true,
        classificationLevel: 'SECRET',
        accessControlEnabled: true
      }
    };

    this.replicationStrategies.set('default', defaultStrategy);
    this.replicationStrategies.set('high-security', highSecurityStrategy);
  }

  /**
   * Get default replication strategy
   */
  private getDefaultStrategy(): ContentReplicationStrategy {
    return this.replicationStrategies.get('default')!;
  }

  /**
   * Update replication strategy for a team
   */
  public setTeamReplicationStrategy(teamId: string, strategy: ContentReplicationStrategy): void {
    this.replicationStrategies.set(teamId, strategy);
    console.log(`📋 Replication strategy updated for team: ${teamId}`);
  }

  /**
   * Get network topology snapshot
   */
  public getNetworkTopology(): NetworkTopology {
    return { ...this.networkTopology };
  }

  /**
   * Get performance metrics for all peers
   */
  public getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Create local node information
   */
  private createLocalNodeInfo(): IPFSPeer {
    return {
      id: `local-${Date.now()}`,
      addresses: ['localhost:8081'],
      protocols: ['ipfs', 'nostr', 'http'],
      capabilities: {
        storage: 1024 * 1024 * 1024, // 1GB default
        bandwidth: 10000, // 10Mbps default
        uptime: 95,
        securityLevel: 'QUANTUM_SAFE',
        classification: 'SECRET'
      },
      metadata: {
        agentId: 'starcom-local',
        teamAffiliation: [],
        geolocation: {
          country: 'US',
          region: 'LOCAL'
        },
        lastSeen: Date.now(),
        trustScore: 100
      }
    };
  }

  /**
   * Manually add a trusted peer
   */
  public addTrustedPeer(peer: IPFSPeer): void {
    // Remove from blacklist if present
    this.networkTopology.blacklistedNodes.delete(peer.id);
    
    // Set high trust score
    peer.metadata.trustScore = 95;
    
    // Add to appropriate collections
    for (const teamId of peer.metadata.teamAffiliation) {
      if (!this.networkTopology.teamNodes.has(teamId)) {
        this.networkTopology.teamNodes.set(teamId, []);
      }
      this.networkTopology.teamNodes.get(teamId)!.push(peer);
    }

    console.log(`✅ Trusted peer added: ${peer.id}`);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.log('🧹 IPFS Network Manager destroyed');
  }
}

export default IPFSNetworkManager;
