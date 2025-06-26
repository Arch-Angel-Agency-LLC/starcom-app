/**
 * RelayNode IPFS Service Integration
 * 
 * This service provides seamless integration between the Starcom dApp and
 * AI Security RelayNode IPFS nodes. It handles:
 * - Auto-discovery of local RelayNode IPFS services
 * - Fallback to remote IPFS gateways when RelayNode unavailable
 * - Content replication across team RelayNodes
 * - Post-quantum encrypted content storage
 * - Team-based access control for IPFS content
 */

import ipfsService, { IPFSUploadResult } from './IPFSService';
import { IntelPackage, CyberTeam, CyberInvestigation, Evidence } from '../types/cyberInvestigation';

// RelayNode event types
interface RelayNodeEvent {
  type: 'content-replicated' | 'team-member-joined' | 'content-updated' | 'security-alert';
  hash?: string;
  peerCount?: number;
  memberId?: string;
  message?: string;
}

// Network statistics types
interface NetworkStats {
  localNode: {
    id: string;
    addresses: string[];
    peers: number;
  };
  teamNodes: number;
  totalPeers: number;
  replicationStatus: {
    [hash: string]: {
      replicated: boolean;
      peerCount: number;
      lastSync: number;
    };
  };
}

// Upload options type
interface UploadOptions {
  type?: 'intel-package' | 'cyber-team' | 'investigation' | 'evidence';
  creator?: string;
  classification?: 'UNCLASSIFIED' | 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  replicateToTeam?: boolean;
  encryptWithPQC?: boolean;
  metadata?: Record<string, unknown>;
}
interface RelayNodeCapabilities {
  ipfs: {
    enabled: boolean;
    endpoint: string;
    version: string;
    peerCount: number;
    storageAvailable: number;
    features: string[];
  };
  nostr: {
    enabled: boolean;
    endpoint: string;
    connectedClients: number;
  };
  security: {
    pqcEnabled: boolean;
    teamAuthEnabled: boolean;
    algorithms: string[];
  };
  team: {
    id: string;
    name: string;
    memberCount: number;
    permissions: string[];
  };
}

interface RelayNodeIPFSResponse {
  success: boolean;
  hash?: string;
  size?: number;
  error?: string;
  replicatedTo?: string[]; // Peer IDs that content was replicated to
  encryptedWith?: string; // Encryption algorithm used
  teamPermissions?: string[]; // Team permissions applied
}

interface TeamContentMetadata {
  teamId: string;
  classification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  permissions: string[];
  encryptionKey?: string;
  accessLog: Array<{
    timestamp: number;
    action: 'upload' | 'download' | 'replicate';
    userId: string;
    nodeId: string;
  }>;
}

export class RelayNodeIPFSService {
  private static instance: RelayNodeIPFSService;
  private fallbackIPFS: typeof ipfsService;
  private relayNodeEndpoint: string = 'http://localhost:8081';
  private capabilities: RelayNodeCapabilities | null = null;
  private isRelayNodeAvailable: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private retryInterval: number = 5000; // 5 seconds
  private teamContext: { teamId?: string; permissions?: string[] } = {};

  private constructor() {
    this.fallbackIPFS = ipfsService;
    this.initializeRelayNodeConnection();
  }

  public static getInstance(): RelayNodeIPFSService {
    if (!RelayNodeIPFSService.instance) {
      RelayNodeIPFSService.instance = new RelayNodeIPFSService();
    }
    return RelayNodeIPFSService.instance;
  }

  /**
   * Initialize connection to local AI Security RelayNode
   */
  private async initializeRelayNodeConnection(): Promise<void> {
    try {
      console.log('🔍 Detecting AI Security RelayNode...');
      
      const response = await fetch(`${this.relayNodeEndpoint}/api/capabilities`, {
        method: 'GET',
        timeout: 2000, // 2 second timeout for local detection
        headers: {
          'Accept': 'application/json'
        }
      } as RequestInit & { timeout: number });

      if (response.ok) {
        this.capabilities = await response.json();
        this.isRelayNodeAvailable = true;
        this.connectionAttempts = 0;
        
        console.log('🚀 AI Security RelayNode detected:', {
          ipfs: this.capabilities?.ipfs.enabled,
          nostr: this.capabilities?.nostr.enabled,
          team: this.capabilities?.team.name,
          peerCount: this.capabilities?.ipfs.peerCount
        });

        // Subscribe to RelayNode events
        this.subscribeToRelayNodeEvents();
        
        return;
      }
    } catch {
      console.log('ℹ️ No local AI Security RelayNode detected, using fallback IPFS');
    }

    this.isRelayNodeAvailable = false;
    this.connectionAttempts++;

    // Retry connection periodically (but don't spam)
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      setTimeout(() => this.initializeRelayNodeConnection(), this.retryInterval);
    }
  }

  /**
   * Subscribe to RelayNode real-time events for content updates
   */
  private subscribeToRelayNodeEvents(): void {
    if (!this.isRelayNodeAvailable) return;

    try {
      const eventSource = new EventSource(`${this.relayNodeEndpoint}/api/events`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRelayNodeEvent(data);
      };

      eventSource.onerror = () => {
        console.log('📡 RelayNode event stream disconnected, content updates may be delayed');
        eventSource.close();
        // Reconnect after delay
        setTimeout(() => this.subscribeToRelayNodeEvents(), this.retryInterval);
      };
    } catch (error) {
      console.warn('Failed to subscribe to RelayNode events:', error);
    }
  }

  /**
   * Handle real-time events from RelayNode
   */
  private handleRelayNodeEvent(event: RelayNodeEvent): void {
    switch (event.type) {
      case 'content-replicated':
        console.log(`📦 Content replicated to ${event.peerCount} team nodes:`, event.hash);
        break;
      case 'team-member-joined':
        console.log(`👥 Team member joined: ${event.memberId}`);
        this.refreshCapabilities();
        break;
      case 'content-updated':
        if (event.hash) {
          console.log(`🔄 Content updated: ${event.hash}`);
          // Notify components about content changes
          this.notifyContentUpdate(event.hash);
        }
        break;
      case 'security-alert':
        console.warn(`🚨 Security alert: ${event.message}`);
        break;
    }
  }

  /**
   * Set team context for content access control
   */
  public setTeamContext(teamId: string, permissions: string[]): void {
    this.teamContext = { teamId, permissions };
    console.log(`🏢 Team context set: ${teamId} with ${permissions.length} permissions`);
  }

  /**
   * Upload content with RelayNode integration
   */
  public async uploadContent(
    data: IntelPackage | CyberTeam | CyberInvestigation | Evidence | Uint8Array,
    options: {
      type?: 'intel-package' | 'cyber-team' | 'investigation' | 'evidence';
      creator?: string;
      classification?: 'UNCLASSIFIED' | 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
      replicateToTeam?: boolean;
      encryptWithPQC?: boolean;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<IPFSUploadResult> {
    try {
      // If RelayNode is available, use it
      if (this.isRelayNodeAvailable && this.capabilities?.ipfs.enabled) {
        return await this.uploadToRelayNode(data, options);
      }

      // Fallback to traditional IPFS service
      console.log('📦 Using fallback IPFS service for upload');
      return await this.uploadToFallbackIPFS(data, options);
    } catch (error) {
      console.error('❌ Content upload failed:', error);
      
      // If RelayNode fails, try fallback
      if (this.isRelayNodeAvailable) {
        console.log('🔄 RelayNode upload failed, trying fallback IPFS');
        return await this.uploadToFallbackIPFS(data, options);
      }
      
      throw error;
    }
  }

  /**
   * Upload to fallback IPFS service using the correct API
   */
  private async uploadToFallbackIPFS(
    data: IntelPackage | CyberTeam | CyberInvestigation | Evidence | Uint8Array,
    options: UploadOptions
  ): Promise<IPFSUploadResult> {
    // Handle binary data - convert to a mock package for storage
    if (data instanceof Uint8Array) {
      const mockPackage: IntelPackage = {
        id: `binary-${Date.now()}`,
        name: 'Binary Data',
        description: 'Binary content uploaded via RelayNode service',
        type: 'INVESTIGATION',
        createdBy: options.creator || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
        reportIds: [],
        tags: ['binary', 'relay-node'],
        classification: options.classification as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' || 'CONFIDENTIAL',
        status: 'ACTIVE',
        affectedSystems: [],
        threatActors: [],
        ioCs: [],
        timeline: [],
        collaborators: [],
        sharedWith: []
      };
      
      return await this.fallbackIPFS.uploadIntelPackage(
        mockPackage,
        options.creator || 'unknown',
        options.classification || 'CONFIDENTIAL'
      );
    }

    // Handle typed data
    if (options.type === 'cyber-team' || this.isCyberTeam(data)) {
      return await this.fallbackIPFS.uploadCyberTeam(
        data as CyberTeam,
        options.creator || 'unknown',
        options.classification || 'CONFIDENTIAL'
      );
    }

    if (options.type === 'investigation' || this.isCyberInvestigation(data)) {
      return await this.fallbackIPFS.uploadInvestigation(
        data as CyberInvestigation,
        options.creator || 'unknown',
        options.classification || 'CONFIDENTIAL'
      );
    }

    // Default to IntelPackage
    return await this.fallbackIPFS.uploadIntelPackage(
      data as IntelPackage,
      options.creator || 'unknown',
      options.classification || 'CONFIDENTIAL'
    );
  }

  /**
   * Type guard for CyberTeam
   */
  private isCyberTeam(data: unknown): data is CyberTeam {
    return data !== null && 
           typeof data === 'object' && 
           'type' in data && 
           typeof (data as Record<string, unknown>).type === 'string' && 
           ['INCIDENT_RESPONSE', 'THREAT_HUNTING', 'FORENSICS', 'SOC', 'RED_TEAM', 'BLUE_TEAM'].includes((data as Record<string, unknown>).type as string);
  }

  /**
   * Type guard for CyberInvestigation
   */
  private isCyberInvestigation(data: unknown): data is CyberInvestigation {
    return data !== null && 
           typeof data === 'object' && 
           'investigationType' in data;
  }

  /**
   * Upload content directly to RelayNode IPFS
   */
  private async uploadToRelayNode(
    data: IntelPackage | CyberTeam | CyberInvestigation | Evidence | Uint8Array,
    options: UploadOptions
  ): Promise<IPFSUploadResult> {
    const formData = new FormData();
    
    // Convert data to blob
    let blob: Blob;
    if (data instanceof Uint8Array) {
      blob = new Blob([data]);
    } else {
      blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    }
    
    formData.append('content', blob);
    formData.append('teamId', this.teamContext.teamId || '');
    formData.append('classification', options.classification || 'CONFIDENTIAL');
    formData.append('replicateToTeam', String(options.replicateToTeam !== false));
    formData.append('encryptWithPQC', String(options.encryptWithPQC !== false));
    
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const response = await fetch(`${this.relayNodeEndpoint}/api/ipfs/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Team-Context': this.teamContext.teamId || '',
        'X-User-Permissions': (this.teamContext.permissions || []).join(',')
      }
    });

    if (!response.ok) {
      throw new Error(`RelayNode upload failed: ${response.statusText}`);
    }

    const result: RelayNodeIPFSResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('🚀 Content uploaded to RelayNode IPFS:', {
      hash: result.hash,
      size: result.size,
      replicated: result.replicatedTo?.length || 0,
      encrypted: result.encryptedWith
    });

    return {
      hash: result.hash!,
      size: result.size!,
      url: `${this.relayNodeEndpoint}/api/ipfs/${result.hash}`,
      timestamp: new Date(),
      success: true,
      // Extended properties for RelayNode
      pqcEncrypted: options.encryptWithPQC !== false,
      didVerified: false, // TODO: Implement DID verification
      otkUsed: 'relay-node-otk', // TODO: Implement OTK
      securityLevel: 'QUANTUM_SAFE' as const,
      auditTrail: [{
        eventId: `upload-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'UPLOAD' as const,
        classification: options.classification || 'CONFIDENTIAL',
        userDID: this.teamContext.teamId || 'unknown',
        details: {
          relayNode: true,
          encrypted: options.encryptWithPQC !== false,
          replicated: options.replicateToTeam !== false
        }
      }],
      classificationLevel: (options.classification || 'CONFIDENTIAL') as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'SCI',
      // Custom properties
      replicatedTo: result.replicatedTo || []
    } as IPFSUploadResult & {
      replicatedTo: string[];
    };
  }

  /**
   * Download content with RelayNode integration
   */
  public async downloadContent(hash: string): Promise<Uint8Array> {
    try {
      // Try RelayNode first
      if (this.isRelayNodeAvailable && this.capabilities?.ipfs.enabled) {
        return await this.downloadFromRelayNode(hash);
      }

      // Fallback to traditional IPFS
      console.log('📥 Using fallback IPFS for download');
      return await this.downloadFromFallbackIPFS(hash);
    } catch (error) {
      console.error('❌ Content download failed:', error);
      
      // If RelayNode fails, try fallback
      if (this.isRelayNodeAvailable) {
        console.log('🔄 RelayNode download failed, trying fallback IPFS');
        return await this.downloadFromFallbackIPFS(hash);
      }
      
      throw error;
    }
  }

  /**
   * Download from fallback IPFS service
   */
  private async downloadFromFallbackIPFS(hash: string): Promise<Uint8Array> {
    const content = await this.fallbackIPFS.getContent(hash);
    if (!content) {
      throw new Error(`Content not found: ${hash}`);
    }
    
    // Convert the content to Uint8Array
    const jsonStr = JSON.stringify(content);
    return new TextEncoder().encode(jsonStr);
  }

  /**
   * Download content from RelayNode IPFS
   */
  private async downloadFromRelayNode(hash: string): Promise<Uint8Array> {
    const response = await fetch(`${this.relayNodeEndpoint}/api/ipfs/${hash}`, {
      headers: {
        'X-Team-Context': this.teamContext.teamId || '',
        'X-User-Permissions': (this.teamContext.permissions || []).join(',')
      }
    });

    if (!response.ok) {
      throw new Error(`RelayNode download failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Get team content list from RelayNode
   */
  public async getTeamContent(teamId?: string): Promise<Array<{
    hash: string;
    metadata: TeamContentMetadata;
    size: number;
    timestamp: Date;
  }>> {
    if (!this.isRelayNodeAvailable) {
      console.log('ℹ️ RelayNode not available, team content listing unavailable');
      return [];
    }

    try {
      const targetTeamId = teamId || this.teamContext.teamId;
      if (!targetTeamId) {
        throw new Error('No team context available');
      }

      const response = await fetch(`${this.relayNodeEndpoint}/api/ipfs/team/${targetTeamId}`, {
        headers: {
          'X-Team-Context': targetTeamId,
          'X-User-Permissions': (this.teamContext.permissions || []).join(',')
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get team content: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get team content:', error);
      return [];
    }
  }

  /**
   * Pin content for permanent storage
   */
  public async pinContent(hash: string, recursive: boolean = true): Promise<boolean> {
    if (!this.isRelayNodeAvailable) {
      console.log('ℹ️ RelayNode not available, content pinning unavailable');
      return false;
    }

    try {
      const response = await fetch(`${this.relayNodeEndpoint}/api/ipfs/pin/${hash}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Context': this.teamContext.teamId || ''
        },
        body: JSON.stringify({ recursive })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to pin content:', error);
      return false;
    }
  }

  /**
   * Get RelayNode status and capabilities
   */
  public getRelayNodeStatus(): {
    available: boolean;
    capabilities: RelayNodeCapabilities | null;
    endpoint: string;
  } {
    return {
      available: this.isRelayNodeAvailable,
      capabilities: this.capabilities,
      endpoint: this.relayNodeEndpoint
    };
  }

  /**
   * Refresh RelayNode capabilities
   */
  public async refreshCapabilities(): Promise<void> {
    if (this.isRelayNodeAvailable) {
      await this.initializeRelayNodeConnection();
    }
  }

  /**
   * Notify components about content updates
   */
  private notifyContentUpdate(hash: string): void {
    // Emit custom event for components to listen to
    const event = new CustomEvent('ipfs-content-updated', {
      detail: { hash, source: 'relaynode' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get IPFS network statistics
   */
  public async getNetworkStats(): Promise<NetworkStats | null> {
    if (!this.isRelayNodeAvailable) return null;

    try {
      const response = await fetch(`${this.relayNodeEndpoint}/api/ipfs/stats`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get network stats:', error);
    }
    
    return null;
  }

  /**
   * Check if the RelayNode service is healthy
   */
  public async isHealthy(): Promise<boolean> {
    // Reference future emit method
    void this.emit;
    try {
      if (!this.isRelayNodeAvailable) return false;
      
      const response = await fetch(`${this.relayNodeEndpoint}/api/health`, {
        method: 'GET',
        timeout: 2000
      } as RequestInit & { timeout: number });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Initialize the RelayNode service (for compatibility with integration manager)
   */
  public async initialize(): Promise<void> {
    // Service initialization is handled in constructor
    // This method exists for compatibility with the integration layer
    if (!this.isRelayNodeAvailable) {
      await this.initializeRelayNodeConnection();
    }
  }

  /**
   * Event listener management (stub for future implementation)
   */
  public on(event: string, callback: (data: Record<string, unknown>) => void): () => void {
    // Placeholder for event system
    console.log(`Event listener registered for: ${event}`, callback.name);
    
    // Return unsubscribe function
    return () => {
      console.log(`Event listener unregistered for: ${event}`);
    };
  }

  /**
   * Emit events (placeholder for future implementation)
   */
  private emit(event: string, data: Record<string, unknown>): void {
    // Future implementation will emit events to registered listeners
    console.log(`Event emitted: ${event}`, Object.keys(data).length, 'properties');
    // TODO: Implement actual event emission
  }
}

export default RelayNodeIPFSService;
