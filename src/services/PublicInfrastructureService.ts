/**
 * Public Infrastructure Service
 * 
 * This service enables the dApp to work without local RelayNode by:
 * 1. Auto-detecting local RelayNode availability
 * 2. Falling back to public Nostr relays and IPFS gateways
 * 3. Providing seamless team collaboration via public infrastructure
 * 4. Managing service health and reliability
 */

import {
  PUBLIC_NOSTR_RELAYS,
  PUBLIC_IPFS_GATEWAYS,
  IPFS_UPLOAD_SERVICES,
  INFRASTRUCTURE_CONFIG,
  InfrastructureStatus,
  createTeamInviteLink,
  parseTeamInviteLink,
  generateTeamQRCode
} from '../config/publicInfrastructure';

interface ServiceHealth {
  endpoint: string;
  isHealthy: boolean;
  latency?: number;
  lastCheck: number;
  consecutiveFailures: number;
  error?: string;
}

interface TeamInvite {
  teamId: string;
  teamName: string;
  inviterPublicKey: string;
  timestamp: number;
  expiresAt?: number;
  maxUses?: number;
  usedCount: number;
}

export class PublicInfrastructureService {
  private static instance: PublicInfrastructureService;
  
  // Service health tracking
  private relayHealth: Map<string, ServiceHealth> = new Map();
  private gatewayHealth: Map<string, ServiceHealth> = new Map();
  
  // Connection management
  private connectedRelays: Set<string> = new Set();
  private availableGateways: Set<string> = new Set();
  
  // Local RelayNode detection
  private localRelayNodeAvailable = false;
  private localRelayNodeEndpoint?: string;
  
  // Team management
  private teamInvites: Map<string, TeamInvite> = new Map();
  private teamDiscoveryEvents: Map<string, {
    kind: number;
    content: string;
    tags: string[][];
    created_at: number;
    pubkey: string;
  }> = new Map();
  
  // Health check intervals
  private healthCheckInterval?: NodeJS.Timeout;
  private relayNodeCheckInterval?: NodeJS.Timeout;
  
  private constructor() {
    this.initialize();
  }
  
  public static getInstance(): PublicInfrastructureService {
    if (!PublicInfrastructureService.instance) {
      PublicInfrastructureService.instance = new PublicInfrastructureService();
    }
    return PublicInfrastructureService.instance;
  }
  
  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    console.log('🚀 Initializing Public Infrastructure Service...');
    
    // Detect local RelayNode
    await this.detectLocalRelayNode();
    
    // Connect to public infrastructure
    await this.connectToPublicInfrastructure();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Load team invites from storage
    this.loadTeamInvites();
    
    console.log('✅ Public Infrastructure Service initialized');
  }
  
  /**
   * Detect local RelayNode availability
   */
  private async detectLocalRelayNode(): Promise<void> {
    console.log('🔍 Detecting local RelayNode...');
    
    for (const endpoint of INFRASTRUCTURE_CONFIG.LOCAL_RELAYNODE_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), INFRASTRUCTURE_CONFIG.DETECTION_TIMEOUT);
        
        const response = await fetch(`${endpoint}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const health = await response.json();
          console.log(`✅ Local RelayNode detected at ${endpoint}`, health);
          
          this.localRelayNodeAvailable = true;
          this.localRelayNodeEndpoint = endpoint;
          return;
        }
      } catch {
        console.log(`❌ No RelayNode at ${endpoint}`);
      }
    }
    
    console.log('ℹ️ No local RelayNode detected, using public infrastructure');
  }
  
  /**
   * Connect to public infrastructure
   */
  private async connectToPublicInfrastructure(): Promise<void> {
    console.log('🌐 Connecting to public infrastructure...');
    
    // Connect to public Nostr relays
    await this.connectToPublicRelays();
    
    // Check IPFS gateway availability
    await this.checkIPFSGateways();
    
    console.log(`✅ Connected to ${this.connectedRelays.size} relays and ${this.availableGateways.size} IPFS gateways`);
  }
  
  /**
   * Connect to public Nostr relays
   */
  private async connectToPublicRelays(): Promise<void> {
    const connectionPromises = PUBLIC_NOSTR_RELAYS.map(async (relay) => {
      try {
        const startTime = Date.now();
        
        // Simple WebSocket connection test
        const ws = new WebSocket(relay);
        
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
          }, INFRASTRUCTURE_CONFIG.DETECTION_TIMEOUT);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            const latency = Date.now() - startTime;
            
            this.relayHealth.set(relay, {
              endpoint: relay,
              isHealthy: true,
              latency,
              lastCheck: Date.now(),
              consecutiveFailures: 0
            });
            
            this.connectedRelays.add(relay);
            ws.close();
            resolve();
          };
          
          ws.onerror = (error) => {
            clearTimeout(timeout);
            this.relayHealth.set(relay, {
              endpoint: relay,
              isHealthy: false,
              lastCheck: Date.now(),
              consecutiveFailures: 1,
              error: 'Connection failed'
            });
            reject(error);
          };
        });
      } catch (error) {
        console.warn(`Failed to connect to relay ${relay}:`, error);
      }
    });
    
    // Wait for some relays to connect
    await Promise.allSettled(connectionPromises);
    
    if (this.connectedRelays.size < INFRASTRUCTURE_CONFIG.MIN_RELAY_CONNECTIONS) {
      console.warn(`⚠️ Only ${this.connectedRelays.size} relays connected, minimum is ${INFRASTRUCTURE_CONFIG.MIN_RELAY_CONNECTIONS}`);
    }
  }
  
  /**
   * Check IPFS gateway availability
   */
  private async checkIPFSGateways(): Promise<void> {
    const checkPromises = PUBLIC_IPFS_GATEWAYS.map(async (gateway) => {
      try {
        const startTime = Date.now();
        
        // Test with a known IPFS hash (IPFS logo)
        const testHash = 'QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), INFRASTRUCTURE_CONFIG.DETECTION_TIMEOUT);
        
        const response = await fetch(`${gateway}${testHash}`, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const latency = Date.now() - startTime;
          
          this.gatewayHealth.set(gateway, {
            endpoint: gateway,
            isHealthy: true,
            latency,
            lastCheck: Date.now(),
            consecutiveFailures: 0
          });
          
          this.availableGateways.add(gateway);
        }
      } catch (error) {
        this.gatewayHealth.set(gateway, {
          endpoint: gateway,
          isHealthy: false,
          lastCheck: Date.now(),
          consecutiveFailures: 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    await Promise.allSettled(checkPromises);
    
    if (this.availableGateways.size < INFRASTRUCTURE_CONFIG.MIN_GATEWAY_AVAILABILITY) {
      console.warn(`⚠️ Only ${this.availableGateways.size} IPFS gateways available`);
    }
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Monitor RelayNode availability
    this.relayNodeCheckInterval = setInterval(() => {
      this.detectLocalRelayNode();
    }, INFRASTRUCTURE_CONFIG.HEALTH_CHECK_INTERVAL);
    
    // Monitor public infrastructure health
    this.healthCheckInterval = setInterval(() => {
      this.checkPublicInfrastructureHealth();
    }, INFRASTRUCTURE_CONFIG.HEALTH_CHECK_INTERVAL);
  }
  
  /**
   * Check public infrastructure health
   */
  private async checkPublicInfrastructureHealth(): Promise<void> {
    // Re-check relay connections
    await this.connectToPublicRelays();
    
    // Re-check IPFS gateways
    await this.checkIPFSGateways();
  }
  
  /**
   * Get current infrastructure status
   */
  public getInfrastructureStatus(): InfrastructureStatus {
    const healthyRelays = Array.from(this.relayHealth.entries())
      .filter(([, health]) => health.isHealthy)
      .map(([endpoint]) => endpoint);
    
    const failedRelays = Array.from(this.relayHealth.entries())
      .filter(([, health]) => !health.isHealthy)
      .map(([endpoint]) => endpoint);
    
    const healthyGateways = Array.from(this.gatewayHealth.entries())
      .filter(([, health]) => health.isHealthy)
      .map(([endpoint]) => endpoint);
    
    const failedGateways = Array.from(this.gatewayHealth.entries())
      .filter(([, health]) => !health.isHealthy)
      .map(([endpoint]) => endpoint);
    
    let recommendedMode: 'local' | 'hybrid' | 'public' = 'public';
    
    if (this.localRelayNodeAvailable && healthyRelays.length > 0) {
      recommendedMode = 'hybrid';
    } else if (this.localRelayNodeAvailable) {
      recommendedMode = 'local';
    }
    
    return {
      relayNode: {
        available: this.localRelayNodeAvailable,
        endpoint: this.localRelayNodeEndpoint,
        capabilities: this.localRelayNodeAvailable ? ['ipfs', 'nostr', 'api', 'security'] : undefined
      },
      publicRelays: {
        connected: healthyRelays.length,
        total: PUBLIC_NOSTR_RELAYS.length,
        healthy: healthyRelays,
        failed: failedRelays
      },
      ipfsGateways: {
        available: healthyGateways.length,
        total: PUBLIC_IPFS_GATEWAYS.length,
        healthy: healthyGateways,
        failed: failedGateways
      },
      recommendedMode
    };
  }
  
  /**
   * Create a team invite
   */
  public createTeamInvite(
    teamId: string,
    teamName: string,
    inviterPublicKey: string,
    options: {
      expiresInHours?: number;
      maxUses?: number;
    } = {}
  ): {
    inviteLink: string;
    qrCode: string;
    teamId: string;
    inviteId: string;
  } {
    const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = options.expiresInHours ? 
      Date.now() + (options.expiresInHours * 60 * 60 * 1000) : undefined;
    
    const invite: TeamInvite = {
      teamId,
      teamName,
      inviterPublicKey,
      timestamp: Date.now(),
      expiresAt,
      maxUses: options.maxUses,
      usedCount: 0
    };
    
    this.teamInvites.set(inviteId, invite);
    this.saveTeamInvites();
    
    const inviteLink = createTeamInviteLink(teamId, teamName);
    const qrCode = generateTeamQRCode(teamId, teamName);
    
    return {
      inviteLink,
      qrCode,
      teamId,
      inviteId
    };
  }
  
  /**
   * Process a team invite
   */
  public processTeamInvite(inviteLink: string): {
    isValid: boolean;
    teamInfo?: { teamId: string; teamName: string };
    error?: string;
  } {
    const teamInfo = parseTeamInviteLink(inviteLink);
    
    if (!teamInfo) {
      return { isValid: false, error: 'Invalid invite link' };
    }
    
    // Check if invite is expired (basic check)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - teamInfo.timestamp > maxAge) {
      return { isValid: false, error: 'Invite link has expired' };
    }
    
    return {
      isValid: true,
      teamInfo: {
        teamId: teamInfo.teamId,
        teamName: teamInfo.teamName
      }
    };
  }
  
  /**
   * Get healthy relays for connection
   */
  public getHealthyRelays(): string[] {
    return Array.from(this.connectedRelays);
  }
  
  /**
   * Get available IPFS gateways
   */
  public getAvailableGateways(): string[] {
    return Array.from(this.availableGateways);
  }
  
  /**
   * Check if should use local RelayNode
   */
  public shouldUseLocalRelayNode(): boolean {
    return this.localRelayNodeAvailable && 
           INFRASTRUCTURE_CONFIG.FALLBACK_STRATEGY !== 'public-only';
  }
  
  /**
   * Check if should use public infrastructure
   */
  public shouldUsePublicInfrastructure(): boolean {
    return !this.localRelayNodeAvailable || 
           INFRASTRUCTURE_CONFIG.FALLBACK_STRATEGY === 'hybrid' ||
           INFRASTRUCTURE_CONFIG.FALLBACK_STRATEGY === 'public-only';
  }
  
  /**
   * Get upload service for content
   */
  public getBestUploadService(contentSize: number): {
    service: typeof IPFS_UPLOAD_SERVICES[0] | null;
    useLocal: boolean;
  } {
    // If local RelayNode available and content fits
    if (this.localRelayNodeAvailable && contentSize < 100 * 1024 * 1024) { // 100MB local limit
      return { service: null, useLocal: true };
    }
    
    // Find suitable public service
    const suitableServices = IPFS_UPLOAD_SERVICES.filter(service => 
      service.free && contentSize < INFRASTRUCTURE_CONFIG.MAX_CONTENT_SIZE_PUBLIC
    );
    
    return {
      service: suitableServices[0] || null,
      useLocal: false
    };
  }
  
  /**
   * Announce team creation on public relays
   */
  public async announceTeamCreation(team: {
    id: string;
    name: string;
    type: string;
    isPublic: boolean;
    creatorPublicKey: string;
  }): Promise<void> {
    if (this.connectedRelays.size === 0) {
      console.warn('No connected relays for team announcement');
      return;
    }
    
    const event = {
      kind: 30000, // Custom application data
      content: JSON.stringify({
        type: 'team-announcement',
        teamId: team.id,
        teamName: team.name,
        teamType: team.type,
        isPublic: team.isPublic,
        timestamp: Date.now()
      }),
      tags: [
        ['d', team.id], // Replaceable event identifier
        ['team-type', team.type],
        ['public', team.isPublic.toString()],
        ['app', 'starcom-investigation']
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: team.creatorPublicKey
    };
    
    // Store event for team discovery
    this.teamDiscoveryEvents.set(team.id, event);
    
    console.log(`📢 Team announcement prepared for ${team.name} (${team.id})`);
  }
  
  /**
   * Discover public teams
   */
  public getDiscoverableTeams(): Array<{
    teamId: string;
    teamName: string;
    teamType: string;
    isPublic: boolean;
    createdAt: number;
    creatorPublicKey: string;
  }> {
    return Array.from(this.teamDiscoveryEvents.values()).map(event => {
      const content = JSON.parse(event.content);
      return {
        teamId: content.teamId,
        teamName: content.teamName,
        teamType: content.teamType,
        isPublic: content.isPublic,
        createdAt: content.timestamp,
        creatorPublicKey: event.pubkey
      };
    });
  }
  
  /**
   * Load team invites from storage
   */
  private loadTeamInvites(): void {
    try {
      const stored = localStorage.getItem('starcom-team-invites');
      if (stored) {
        const invites = JSON.parse(stored);
        this.teamInvites = new Map(Object.entries(invites));
      }
    } catch (error) {
      console.warn('Failed to load team invites from storage:', error);
    }
  }
  
  /**
   * Save team invites to storage
   */
  private saveTeamInvites(): void {
    try {
      const invites = Object.fromEntries(this.teamInvites);
      localStorage.setItem('starcom-team-invites', JSON.stringify(invites));
    } catch (error) {
      console.warn('Failed to save team invites to storage:', error);
    }
  }
  
  /**
   * Cleanup expired invites
   */
  public cleanupExpiredInvites(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [inviteId, invite] of this.teamInvites.entries()) {
      if (invite.expiresAt && now > invite.expiresAt) {
        this.teamInvites.delete(inviteId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveTeamInvites();
      console.log(`🧹 Cleaned up ${cleanedCount} expired team invites`);
    }
  }
  
  /**
   * Get service statistics
   */
  public getServiceStats(): {
    relays: { connected: number; total: number; avgLatency: number };
    gateways: { available: number; total: number; avgLatency: number };
    teams: { invites: number; discoveries: number };
    infrastructure: { mode: string; health: string };
  } {
    const relayLatencies = Array.from(this.relayHealth.values())
      .filter(h => h.isHealthy && h.latency)
      .map(h => h.latency!);
    
    const gatewayLatencies = Array.from(this.gatewayHealth.values())
      .filter(h => h.isHealthy && h.latency)
      .map(h => h.latency!);
    
    const avgRelayLatency = relayLatencies.length > 0 ? 
      relayLatencies.reduce((a, b) => a + b, 0) / relayLatencies.length : 0;
    
    const avgGatewayLatency = gatewayLatencies.length > 0 ? 
      gatewayLatencies.reduce((a, b) => a + b, 0) / gatewayLatencies.length : 0;
    
    const status = this.getInfrastructureStatus();
    const healthyServices = status.publicRelays.connected + status.ipfsGateways.available;
    const totalServices = status.publicRelays.total + status.ipfsGateways.total;
    const healthPercentage = Math.round((healthyServices / totalServices) * 100);
    
    let healthStatus = 'poor';
    if (healthPercentage > 80) healthStatus = 'excellent';
    else if (healthPercentage > 60) healthStatus = 'good';
    else if (healthPercentage > 40) healthStatus = 'fair';
    
    return {
      relays: {
        connected: this.connectedRelays.size,
        total: PUBLIC_NOSTR_RELAYS.length,
        avgLatency: Math.round(avgRelayLatency)
      },
      gateways: {
        available: this.availableGateways.size,
        total: PUBLIC_IPFS_GATEWAYS.length,
        avgLatency: Math.round(avgGatewayLatency)
      },
      teams: {
        invites: this.teamInvites.size,
        discoveries: this.teamDiscoveryEvents.size
      },
      infrastructure: {
        mode: status.recommendedMode,
        health: healthStatus
      }
    };
  }
  
  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.relayNodeCheckInterval) {
      clearInterval(this.relayNodeCheckInterval);
    }
    
    this.connectedRelays.clear();
    this.availableGateways.clear();
  }
}

// Export singleton instance
export default PublicInfrastructureService.getInstance();
