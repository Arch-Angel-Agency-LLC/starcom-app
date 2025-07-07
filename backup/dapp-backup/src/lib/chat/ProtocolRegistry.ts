/**
 * ProtocolRegistry.ts
 * 
 * Registry service for managing available chat protocols.
 * Provides methods for registering, discovering, and selecting protocols.
 */

import { 
  ProtocolRegistration, 
  ProtocolSelectionCriteria, 
  ProtocolSelectionResult 
} from './types/ProtocolTypes';

/**
 * Registry for chat protocols.
 */
export class ProtocolRegistry {
  private static instance: ProtocolRegistry;
  private protocols: Map<string, ProtocolRegistration> = new Map();
  
  /**
   * Get the singleton instance of the registry.
   * @returns ProtocolRegistry instance
   */
  public static getInstance(): ProtocolRegistry {
    if (!ProtocolRegistry.instance) {
      ProtocolRegistry.instance = new ProtocolRegistry();
    }
    return ProtocolRegistry.instance;
  }
  
  /**
   * Register a protocol with the registry.
   * @param registration Protocol registration information
   */
  public registerProtocol(registration: ProtocolRegistration): void {
    this.protocols.set(registration.id, registration);
  }
  
  /**
   * Unregister a protocol from the registry.
   * @param id Protocol ID
   * @returns True if the protocol was unregistered, false otherwise
   */
  public unregisterProtocol(id: string): boolean {
    return this.protocols.delete(id);
  }
  
  /**
   * Get a protocol by ID.
   * @param id Protocol ID
   * @returns Protocol registration or undefined if not found
   */
  public getProtocol(id: string): ProtocolRegistration | undefined {
    return this.protocols.get(id);
  }
  
  /**
   * Get all registered protocols.
   * @returns Array of protocol registrations
   */
  public getAllProtocols(): ProtocolRegistration[] {
    return Array.from(this.protocols.values());
  }
  
  /**
   * Get all enabled protocols.
   * @returns Array of enabled protocol registrations
   */
  public getEnabledProtocols(): ProtocolRegistration[] {
    return this.getAllProtocols().filter(p => p.isEnabled);
  }
  
  /**
   * Get protocols that support a specific capability.
   * @param capability The capability to check for
   * @returns Array of protocols that support the capability
   */
  public getProtocolsByCapability(capability: string): ProtocolRegistration[] {
    return this.getEnabledProtocols().filter(p => 
      p.defaultCapabilities[capability] === true
    );
  }
  
  /**
   * Get protocols that support all the specified capabilities.
   * @param capabilities Array of required capabilities
   * @returns Array of protocols that support all capabilities
   */
  public getProtocolsByCapabilities(capabilities: string[]): ProtocolRegistration[] {
    return this.getEnabledProtocols().filter(p => 
      capabilities.every(cap => p.defaultCapabilities[cap] === true)
    );
  }
  
  /**
   * Select the best protocol based on selection criteria.
   * @param criteria Selection criteria
   * @returns Selection result
   */
  public selectProtocol(criteria: ProtocolSelectionCriteria): ProtocolSelectionResult {
    const { 
      requiredCapabilities = [], 
      preferredCapabilities = [],
      excludedProtocols = [],
      specificProtocol,
      preferServerless,
      preferP2P,
      preferEncrypted
    } = criteria;
    
    // If a specific protocol is requested, return it if available
    if (specificProtocol) {
      const protocol = this.getProtocol(specificProtocol);
      if (protocol && protocol.isEnabled && !excludedProtocols.includes(protocol.id)) {
        const missingCapabilities = requiredCapabilities.filter(
          cap => !protocol.defaultCapabilities[cap]
        );
        
        return {
          selectedProtocol: protocol,
          alternativeProtocols: [],
          matchScore: missingCapabilities.length === 0 ? 1 : 0,
          reason: missingCapabilities.length === 0 
            ? 'Specific protocol selected and meets all requirements'
            : 'Specific protocol selected but missing required capabilities',
          capabilities: {
            matched: requiredCapabilities.filter(cap => protocol.defaultCapabilities[cap]),
            missing: missingCapabilities
          }
        };
      } else {
        // Specific protocol not available, continue with selection
      }
    }
    
    // Filter protocols by required capabilities and exclusions
    let candidates = this.getEnabledProtocols()
      .filter(p => !excludedProtocols.includes(p.id))
      .filter(p => requiredCapabilities.every(cap => p.defaultCapabilities[cap]));
    
    if (candidates.length === 0) {
      return {
        selectedProtocol: undefined,
        alternativeProtocols: [],
        matchScore: 0,
        reason: 'No protocols meet the required capabilities',
        capabilities: {
          matched: [],
          missing: requiredCapabilities
        }
      };
    }
    
    // Score protocols based on preferred capabilities and characteristics
    const scoredProtocols = candidates.map(protocol => {
      let score = 0;
      
      // Score preferred capabilities
      preferredCapabilities.forEach(cap => {
        if (protocol.defaultCapabilities[cap]) {
          score += 1;
        }
      });
      
      // Score preferred characteristics
      if (preferServerless && protocol.defaultCapabilities.serverless) {
        score += 2;
      }
      
      if (preferP2P && protocol.defaultCapabilities.p2p) {
        score += 2;
      }
      
      if (preferEncrypted && protocol.defaultCapabilities.encryption) {
        score += 2;
      }
      
      // Normalize score based on maximum possible score
      const maxScore = preferredCapabilities.length + 
        (preferServerless ? 2 : 0) + 
        (preferP2P ? 2 : 0) + 
        (preferEncrypted ? 2 : 0);
      
      const normalizedScore = maxScore > 0 ? score / maxScore : 1;
      
      return {
        protocol,
        score: normalizedScore
      };
    });
    
    // Sort by score (descending) and then by priority (ascending)
    scoredProtocols.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.protocol.priority - b.protocol.priority;
    });
    
    // Select the best protocol
    const selectedProtocol = scoredProtocols[0].protocol;
    const alternativeProtocols = scoredProtocols
      .slice(1)
      .map(sp => sp.protocol);
    
    // Calculate match score
    const totalPreferredCapabilities = preferredCapabilities.length;
    const matchedPreferredCapabilities = preferredCapabilities.filter(
      cap => selectedProtocol.defaultCapabilities[cap]
    ).length;
    
    const preferredMatchScore = totalPreferredCapabilities > 0 
      ? matchedPreferredCapabilities / totalPreferredCapabilities 
      : 1;
    
    return {
      selectedProtocol,
      alternativeProtocols,
      matchScore: scoredProtocols[0].score,
      reason: 'Protocol selected based on required and preferred capabilities',
      capabilities: {
        matched: [
          ...requiredCapabilities,
          ...preferredCapabilities.filter(cap => selectedProtocol.defaultCapabilities[cap])
        ],
        missing: preferredCapabilities.filter(cap => !selectedProtocol.defaultCapabilities[cap])
      },
      metadata: {
        preferredMatchScore,
        totalScore: scoredProtocols[0].score,
        scoreDetails: {
          preferredCapabilities: matchedPreferredCapabilities,
          totalPreferredCapabilities
        }
      }
    };
  }
}
