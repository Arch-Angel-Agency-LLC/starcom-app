/**
 * NodeWeb Service
 * 
 * Service for node network data management, repurposed from OSINT module.
 */

import { 
  Node, 
  Edge, 
  Network, 
  NodeType, 
  EdgeType, 
  NetworkStats,
  NodeFilter,
  NodeDetail,
  SourceType,
  Source,
  ExportOptions,
  ImportOptions
} from '../types/nodeWeb';

/**
 * NodeWeb Service class
 * Handles node/edge data operations and network analysis
 */
class NodeWebService {
  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private networkStats: NetworkStats = {
    nodeCount: 0,
    edgeCount: 0,
    threatNodeCount: 0,
    criticalNodeCount: 0,
    clusterCount: 0,
    density: 0,
    averageDegree: 0
  };

  /**
   * Initialize with sample data
   */
  constructor() {
    this.generateSampleData();
    this.updateNetworkStats();
  }

  /**
   * Get all nodes
   */
  getNodes(): Node[] {
    return [...this.nodes];
  }

  /**
   * Get all edges
   */
  getEdges(): Edge[] {
    return [...this.edges];
  }

  /**
   * Get full network
   */
  getNetwork(): Network {
    return {
      nodes: [...this.nodes],
      edges: [...this.edges]
    };
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): NetworkStats {
    return { ...this.networkStats };
  }

  /**
   * Get node by ID
   */
  getNodeById(id: string): Node | undefined {
    return this.nodes.find(node => node.id === id);
  }

  /**
   * Get node detail with connected edges and nodes
   */
  getNodeDetail(id: string): NodeDetail | undefined {
    const node = this.getNodeById(id);
    if (!node) return undefined;

    const incomingEdges = this.edges.filter(edge => edge.targetId === id);
    const outgoingEdges = this.edges.filter(edge => edge.sourceId === id);
    const connectedNodeIds = new Set<string>();
    
    [...incomingEdges, ...outgoingEdges].forEach(edge => {
      connectedNodeIds.add(edge.sourceId);
      connectedNodeIds.add(edge.targetId);
    });

    // Remove the current node ID
    connectedNodeIds.delete(id);
    
    const relatedNodes = this.nodes.filter(node => connectedNodeIds.has(node.id));

    return {
      ...node,
      incomingEdges,
      outgoingEdges,
      relatedNodes
    };
  }

  /**
   * Filter nodes by criteria
   */
  filterNodes(filter: NodeFilter): Node[] {
    let filteredNodes = [...this.nodes];

    // Filter by types
    if (filter.types && filter.types.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        filter.types?.includes(node.type)
      );
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        node.tags?.some(tag => filter.tags?.includes(tag))
      );
    }

    // Filter by minimum confidence
    if (filter.minConfidence !== undefined) {
      filteredNodes = filteredNodes.filter(node => 
        node.confidence >= filter.minConfidence!
      );
    }

    // Filter by minimum threat level
    if (filter.minThreatLevel !== undefined) {
      filteredNodes = filteredNodes.filter(node => 
        (node.threatLevel || 0) >= filter.minThreatLevel!
      );
    }

    // Filter by text search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.label.toLowerCase().includes(searchLower) ||
        node.description?.toLowerCase().includes(searchLower) ||
        node.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter unconfirmed nodes
    if (filter.showUnconfirmed === false) {
      filteredNodes = filteredNodes.filter(node => node.confidence > 0.5);
    }

    // Apply depth filter if a max depth is specified
    if (filter.maxDepth !== undefined && filteredNodes.length > 0) {
      const nodeIds = new Set<string>(filteredNodes.map(node => node.id));
      const expandedNodeIds = this.expandNodesByDepth(nodeIds, filter.maxDepth);
      filteredNodes = this.nodes.filter(node => expandedNodeIds.has(node.id));
    }

    return filteredNodes;
  }

  /**
   * Get edges for the filtered nodes
   */
  getEdgesForNodes(nodeIds: string[]): Edge[] {
    const nodeIdSet = new Set(nodeIds);
    return this.edges.filter(edge => 
      nodeIdSet.has(edge.sourceId) && nodeIdSet.has(edge.targetId)
    );
  }

  /**
   * Export network data
   */
  exportNetwork(options: ExportOptions): string {
    // In a real implementation, this would handle different export formats
    // For simplicity, we'll just return JSON for all formats
    const network = this.getNetwork();
    return JSON.stringify(network, null, 2);
  }

  /**
   * Import network data
   */
  importNetwork(data: string, options: ImportOptions): boolean {
    try {
      // In a real implementation, this would handle different import formats
      // For now, we'll just assume JSON
      const network = JSON.parse(data) as Network;
      
      switch (options.mergeStrategy) {
        case 'replace':
          this.nodes = network.nodes;
          this.edges = network.edges;
          break;
        case 'merge': {
          // Merge, overwriting existing nodes/edges with same IDs
          const nodeMap = new Map(this.nodes.map(node => [node.id, node]));
          const edgeMap = new Map(this.edges.map(edge => [edge.id, edge]));
          
          network.nodes.forEach(node => nodeMap.set(node.id, node));
          network.edges.forEach(edge => edgeMap.set(edge.id, edge));
          
          this.nodes = Array.from(nodeMap.values());
          this.edges = Array.from(edgeMap.values());
          break;
        }
        case 'append':
        default:
          // Just add the new nodes/edges
          this.nodes = [...this.nodes, ...network.nodes];
          this.edges = [...this.edges, ...network.edges];
          break;
      }
      
      this.updateNetworkStats();
      return true;
    } catch (error) {
      console.error('Failed to import network data:', error);
      return false;
    }
  }

  /**
   * Update network statistics
   * @private
   */
  private updateNetworkStats(): void {
    // Count nodes
    const nodeCount = this.nodes.length;
    
    // Count edges
    const edgeCount = this.edges.length;
    
    // Count threat nodes (nodes with threatLevel > 0.7)
    const threatNodeCount = this.nodes.filter(node => 
      (node.threatLevel || 0) > 0.7
    ).length;
    
    // Count critical nodes (nodes with the 'critical' tag)
    const criticalNodeCount = this.nodes.filter(node => 
      node.tags?.includes('critical')
    ).length;
    
    // Compute network density
    const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
    
    // Compute average degree
    const averageDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0;
    
    // Count clusters (simplified: connected components)
    const clusterCount = this.countConnectedComponents();
    
    this.networkStats = {
      nodeCount,
      edgeCount,
      threatNodeCount,
      criticalNodeCount,
      clusterCount,
      density,
      averageDegree
    };
  }

  /**
   * Count connected components in the network
   * @private
   */
  private countConnectedComponents(): number {
    if (this.nodes.length === 0) return 0;
    
    // Create adjacency list
    const adjList = new Map<string, Set<string>>();
    this.nodes.forEach(node => {
      adjList.set(node.id, new Set<string>());
    });
    
    this.edges.forEach(edge => {
      const sourceSet = adjList.get(edge.sourceId);
      const targetSet = adjList.get(edge.targetId);
      
      if (sourceSet) sourceSet.add(edge.targetId);
      if (targetSet) targetSet.add(edge.sourceId);
    });
    
    // Track visited nodes
    const visited = new Set<string>();
    let componentCount = 0;
    
    // DFS to find connected components
    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      const neighbors = adjList.get(nodeId);
      if (!neighbors) return;
      
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          dfs(neighborId);
        }
      });
    };
    
    // Run DFS from each unvisited node
    this.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        componentCount++;
        dfs(node.id);
      }
    });
    
    return componentCount;
  }

  /**
   * Expand nodes by traversing the graph up to a certain depth
   * @private
   */
  private expandNodesByDepth(startNodeIds: Set<string>, maxDepth: number): Set<string> {
    const expandedNodeIds = new Set<string>(startNodeIds);
    const nodeQueue: Array<{ id: string; depth: number }> = 
      Array.from(startNodeIds).map(id => ({ id, depth: 0 }));
    
    const visited = new Set<string>(startNodeIds);
    
    while (nodeQueue.length > 0) {
      const { id, depth } = nodeQueue.shift()!;
      
      if (depth >= maxDepth) continue;
      
      // Find all edges connected to this node
      const connectedEdges = this.edges.filter(
        edge => edge.sourceId === id || edge.targetId === id
      );
      
      // Add connected nodes to the queue if not visited
      connectedEdges.forEach(edge => {
        const connectedId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        
        if (!visited.has(connectedId)) {
          visited.add(connectedId);
          expandedNodeIds.add(connectedId);
          nodeQueue.push({ id: connectedId, depth: depth + 1 });
        }
      });
    }
    
    return expandedNodeIds;
  }

  /**
   * Generate sample network data
   * @private
   */
  private generateSampleData(): void {
    // Create sample nodes
    this.nodes = [
      this.createNode('c2-server-alpha', 'server', 'C2-Server-Alpha', 'Command & Control Server', 0.9, 0.9, ['threat', 'c2']),
      this.createNode('botnet-hub', 'network', 'Botnet Hub', 'Botnet coordination network', 0.85, 0.8, ['threat', 'botnet']),
      this.createNode('tor-exit-node-1', 'server', 'TOR Exit Node 1', 'Exit node used for anonymous traffic', 0.95, 0.6, ['tor', 'network']),
      this.createNode('compromised-router', 'device', 'Compromised Router', 'Network router with backdoor access', 0.75, 0.7, ['compromised', 'network']),
      this.createNode('vulnerability-scanner', 'server', 'Vulnerability Scanner', 'Automated scanner for network vulnerabilities', 0.9, 0.8, ['tool', 'scanner']),
      this.createNode('target-corporate-server', 'server', 'Target Corporate Server', 'Main corporate server with sensitive data', 0.95, 0.3, ['critical', 'target']),
      this.createNode('proxy-relay-1', 'server', 'Proxy Relay 1', 'Proxy server for traffic obfuscation', 0.8, 0.5, ['proxy', 'network']),
      this.createNode('malware-distribution', 'server', 'Malware Distribution', 'Server hosting malware payloads', 0.85, 0.85, ['threat', 'malware']),
      this.createNode('hacker-workstation', 'device', 'Hacker Workstation', 'Main workstation used by threat actor', 0.7, 0.9, ['threat', 'source']),
      this.createNode('data-exfiltration', 'server', 'Data Exfiltration Point', 'Server receiving stolen data', 0.8, 0.85, ['threat', 'exfiltration']),
      this.createNode('secure-vpn', 'network', 'Secure VPN', 'Virtual Private Network for secure communications', 0.9, 0.2, ['security', 'network']),
      this.createNode('crypto-wallet-main', 'wallet', 'Main Cryptocurrency Wallet', 'Primary wallet for financial transactions', 0.95, 0.4, ['financial', 'crypto']),
      this.createNode('threat-actor-alpha', 'person', 'Threat Actor Alpha', 'Primary threat actor behind the operation', 0.65, 0.95, ['threat', 'person']),
      this.createNode('analyst-workstation', 'device', 'Analyst Workstation', 'Security analyst monitoring station', 0.9, 0.1, ['security', 'analysis']),
      this.createNode('target-database', 'server', 'Target Database', 'Database with sensitive customer records', 0.9, 0.3, ['critical', 'database']),
      this.createNode('phishing-site', 'domain', 'Phishing Site', 'Fake login page for credential harvesting', 0.85, 0.8, ['threat', 'phishing']),
      this.createNode('cdn-distribution', 'network', 'CDN Distribution', 'Content distribution network', 0.9, 0.4, ['network', 'distribution']),
      this.createNode('darkweb-marketplace', 'domain', 'DarkWeb Marketplace', 'Underground marketplace for illegal goods', 0.75, 0.7, ['darkweb', 'marketplace']),
      this.createNode('credential-store', 'server', 'Credential Storage', 'Repository of stolen credentials', 0.8, 0.8, ['threat', 'credentials']),
      this.createNode('monitoring-system', 'server', 'Security Monitoring', 'Security monitoring and alerting system', 0.95, 0.1, ['security', 'monitoring'])
    ];

    // Create sample edges
    this.edges = [
      this.createEdge('edge-1', 'hacker-workstation', 'c2-server-alpha', 'control', 'Controls', true, 0.8),
      this.createEdge('edge-2', 'c2-server-alpha', 'botnet-hub', 'control', 'Coordinates', true, 0.85),
      this.createEdge('edge-3', 'hacker-workstation', 'vulnerability-scanner', 'control', 'Operates', true, 0.75),
      this.createEdge('edge-4', 'vulnerability-scanner', 'target-corporate-server', 'attack', 'Scans', true, 0.9),
      this.createEdge('edge-5', 'c2-server-alpha', 'malware-distribution', 'control', 'Manages', true, 0.85),
      this.createEdge('edge-6', 'malware-distribution', 'target-corporate-server', 'attack', 'Infects', true, 0.8),
      this.createEdge('edge-7', 'botnet-hub', 'compromised-router', 'control', 'Controls', true, 0.75),
      this.createEdge('edge-8', 'compromised-router', 'target-corporate-server', 'access', 'Accesses', true, 0.7),
      this.createEdge('edge-9', 'c2-server-alpha', 'tor-exit-node-1', 'communication', 'Routes Through', true, 0.65),
      this.createEdge('edge-10', 'tor-exit-node-1', 'proxy-relay-1', 'communication', 'Routes To', true, 0.7),
      this.createEdge('edge-11', 'proxy-relay-1', 'data-exfiltration', 'communication', 'Forwards To', true, 0.75),
      this.createEdge('edge-12', 'target-corporate-server', 'data-exfiltration', 'attack', 'Data Theft', true, 0.85),
      this.createEdge('edge-13', 'secure-vpn', 'analyst-workstation', 'communication', 'Secures', true, 0.9),
      this.createEdge('edge-14', 'analyst-workstation', 'monitoring-system', 'communication', 'Monitors', true, 0.9),
      this.createEdge('edge-15', 'monitoring-system', 'target-corporate-server', 'communication', 'Monitors', true, 0.85),
      this.createEdge('edge-16', 'threat-actor-alpha', 'hacker-workstation', 'owner', 'Operates', true, 0.65),
      this.createEdge('edge-17', 'threat-actor-alpha', 'crypto-wallet-main', 'owner', 'Owns', true, 0.6),
      this.createEdge('edge-18', 'data-exfiltration', 'darkweb-marketplace', 'communication', 'Sells To', true, 0.7),
      this.createEdge('edge-19', 'hacker-workstation', 'phishing-site', 'creation', 'Created', true, 0.8),
      this.createEdge('edge-20', 'phishing-site', 'credential-store', 'communication', 'Sends To', true, 0.8),
      this.createEdge('edge-21', 'target-corporate-server', 'target-database', 'dependency', 'Connects To', true, 0.9),
      this.createEdge('edge-22', 'credential-store', 'target-database', 'attack', 'Unauthorized Access', true, 0.75),
      this.createEdge('edge-23', 'cdn-distribution', 'target-corporate-server', 'communication', 'Serves Content', true, 0.85),
      this.createEdge('edge-24', 'phishing-site', 'cdn-distribution', 'dependency', 'Hosted On', true, 0.8)
    ];
  }

  /**
   * Helper to create a node
   * @private
   */
  private createNode(
    id: string,
    type: NodeType,
    label: string,
    description: string,
    confidence: number,
    threatLevel: number,
    tags: string[]
  ): Node {
    const now = new Date().toISOString();
    return {
      id,
      type,
      label,
      description,
      properties: this.generateNodeProperties(type),
      sources: this.generateSources(),
      confidence,
      created: now,
      updated: now,
      tags,
      threatLevel,
      metadata: {}
    };
  }

  /**
   * Helper to create an edge
   * @private
   */
  private createEdge(
    id: string,
    sourceId: string,
    targetId: string,
    type: EdgeType,
    label: string,
    directed: boolean,
    confidence: number
  ): Edge {
    const now = new Date().toISOString();
    return {
      id,
      sourceId,
      targetId,
      type,
      label,
      directed,
      properties: {},
      sources: this.generateSources(),
      confidence,
      weight: Math.random() * 0.5 + 0.5, // Random weight between 0.5 and 1
      created: now,
      updated: now
    };
  }

  /**
   * Generate sample node properties based on type
   * @private
   */
  private generateNodeProperties(type: NodeType): Record<string, unknown> {
    switch (type) {
      case 'server':
        return {
          ipAddress: this.generateRandomIP(),
          location: this.getRandomLocation(),
          operatingSystem: this.getRandomOS(),
          ports: this.generateRandomPorts()
        };
      case 'person':
        return {
          aliases: ['shadow_operator', 'dark_agent'],
          location: this.getRandomLocation(),
          associatedGroups: ['APT-23', 'CyberNexus']
        };
      case 'device':
        return {
          ipAddress: this.generateRandomIP(),
          macAddress: this.generateRandomMAC(),
          deviceType: 'Workstation',
          operatingSystem: this.getRandomOS()
        };
      case 'domain':
        return {
          registrar: 'Anonymous Registrar',
          dateRegistered: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
          ipAddresses: [this.generateRandomIP(), this.generateRandomIP()]
        };
      case 'wallet':
        return {
          currency: 'Bitcoin',
          balance: Math.floor(Math.random() * 1000) / 100,
          transactions: Math.floor(Math.random() * 100)
        };
      default:
        return {};
    }
  }

  /**
   * Generate random sources
   * @private
   */
  private generateSources(): Source[] {
    const sourceCount = Math.floor(Math.random() * 3) + 1;
    const sources: Source[] = [];
    
    const sourceTypes: SourceType[] = ['osint', 'social', 'darkweb', 'analysis', 'intelligence'];
    
    for (let i = 0; i < sourceCount; i++) {
      const sourceType = sourceTypes[Math.floor(Math.random() * sourceTypes.length)];
      const timestamp = new Date(Date.now() - Math.random() * 7776000000).toISOString(); // Random time in last 90 days
      
      sources.push({
        id: `source-${Math.floor(Math.random() * 10000)}`,
        type: sourceType,
        name: `${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} Report ${Math.floor(Math.random() * 100)}`,
        url: sourceType === 'osint' ? `https://example.com/intel/${Math.floor(Math.random() * 1000)}` : undefined,
        timestamp,
        credibility: Math.random() * 0.4 + 0.6 // Random between 0.6 and 1.0
      });
    }
    
    return sources;
  }

  /**
   * Generate a random IP address
   * @private
   */
  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  /**
   * Generate a random MAC address
   * @private
   */
  private generateRandomMAC(): string {
    const hexDigits = '0123456789ABCDEF';
    let mac = '';
    
    for (let i = 0; i < 6; i++) {
      mac += hexDigits.charAt(Math.floor(Math.random() * 16));
      mac += hexDigits.charAt(Math.floor(Math.random() * 16));
      if (i < 5) mac += ':';
    }
    
    return mac;
  }

  /**
   * Get a random location
   * @private
   */
  private getRandomLocation(): string {
    const locations = [
      'Eastern Europe',
      'Western Europe',
      'North America',
      'South America',
      'East Asia',
      'Southeast Asia',
      'Middle East',
      'Africa',
      'Russia',
      'Unknown'
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Get a random operating system
   * @private
   */
  private getRandomOS(): string {
    const operatingSystems = [
      'Linux (Ubuntu 20.04)',
      'Linux (Kali)',
      'Windows Server 2019',
      'Windows 10',
      'FreeBSD',
      'macOS',
      'Custom OS',
      'Unknown'
    ];
    
    return operatingSystems[Math.floor(Math.random() * operatingSystems.length)];
  }

  /**
   * Generate random open ports
   * @private
   */
  private generateRandomPorts(): number[] {
    const commonPorts = [21, 22, 23, 25, 53, 80, 443, 445, 3306, 3389, 5432, 8080, 8443];
    const portCount = Math.floor(Math.random() * 5) + 1;
    const ports: number[] = [];
    
    for (let i = 0; i < portCount; i++) {
      ports.push(commonPorts[Math.floor(Math.random() * commonPorts.length)]);
    }
    
    return [...new Set(ports)]; // Remove duplicates
  }
}

// Create and export singleton instance
export const nodeWebService = new NodeWebService();
