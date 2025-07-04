/**
 * ProtocolTypes.ts
 * 
 * Defines the types specific to chat protocols and their capabilities.
 * This includes protocol information, capabilities, and registration interfaces.
 */

/**
 * Protocol-specific capabilities that a chat provider can support.
 */
export interface ChatProviderCapabilities {
  // Core messaging capabilities
  messaging: boolean;           // Basic message sending/receiving
  channels: boolean;            // Support for channels/rooms
  presence: boolean;            // User online presence information
  attachments: boolean;         // File attachment support
  encryption: boolean;          // End-to-end encryption
  search: boolean;              // Message search capabilities
  offline: boolean;             // Offline message support
  
  // Advanced messaging capabilities
  threading: boolean;           // Thread/conversation support
  reactions: boolean;           // Message reactions support
  editing: boolean;             // Message editing support
  deletion: boolean;            // Message deletion support
  typing: boolean;              // Typing indicators
  read_receipts: boolean;       // Read receipts
  mentions: boolean;            // @mentions support
  
  // Security and privacy
  e2e_encryption: boolean;      // End-to-end encryption
  forward_secrecy: boolean;     // Forward secrecy for messages
  pq_encryption: boolean;       // Post-quantum encryption
  
  // Connection types
  p2p: boolean;                 // Peer-to-peer connections
  server_based: boolean;        // Server-based connections
  relay_based: boolean;         // Relay-based connections
  
  // Storage and persistence
  persistent_history: boolean;  // Persistent message history
  message_expiry: boolean;      // Message expiration/auto-deletion
  sync: boolean;                // Cross-device synchronization
  
  // Protocol-specific capabilities
  [key: string]: boolean;       // Additional protocol-specific capabilities
}

/**
 * Protocol information metadata.
 */
export interface ProtocolInfo {
  id: string;                   // Unique identifier for the protocol
  name: string;                 // Display name
  description: string;          // Brief description
  version: string;              // Protocol version
  homepage?: string;            // Protocol homepage URL
  documentation?: string;       // Documentation URL
  
  // Protocol characteristics
  isP2P: boolean;               // Whether it's peer-to-peer
  isServerless: boolean;        // Whether it's serverless
  isEncrypted: boolean;         // Whether it has built-in encryption
  isFederated?: boolean;        // Whether it's federated
  isCensorshipResistant?: boolean; // Whether it's resistant to censorship
  isAnonymous?: boolean;        // Whether it supports anonymity
  
  // Additional metadata
  maintainers?: string[];       // Protocol maintainers
  license?: string;             // License information
  dependencies?: string[];      // Protocol dependencies
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * Protocol registration information for the registry.
 */
export interface ProtocolRegistration {
  id: string;                   // Unique identifier for the protocol
  name: string;                 // Display name
  adapterClass: string;         // Class name for dynamic loading
  defaultEndpoints: string[];   // Default connection endpoints
  defaultCapabilities: ChatProviderCapabilities; // Default capabilities
  isEnabled: boolean;           // Whether the protocol is enabled
  priority: number;             // Priority order (lower = higher priority)
  metadata?: Record<string, unknown>; // Additional metadata
  
  // Optional factory function for creating instances
  createInstance?: () => Promise<any>;
}

/**
 * Protocol selection criteria for choosing the appropriate protocol.
 */
export interface ProtocolSelectionCriteria {
  requiredCapabilities?: string[];    // Capabilities that are required
  preferredCapabilities?: string[];   // Capabilities that are preferred
  excludedProtocols?: string[];       // Protocols to exclude
  prioritizeByCapability?: string;    // Capability to prioritize by
  specificProtocol?: string;          // Specific protocol to use
  preferServerless?: boolean;         // Prefer serverless protocols
  preferP2P?: boolean;                // Prefer P2P protocols
  preferEncrypted?: boolean;          // Prefer encrypted protocols
  context?: Record<string, unknown>;  // Additional context for selection
}

/**
 * Result of a protocol selection operation.
 */
export interface ProtocolSelectionResult {
  selectedProtocol?: ProtocolRegistration; // Selected protocol
  alternativeProtocols: ProtocolRegistration[]; // Alternative protocols
  matchScore?: number;                 // Match score (0-1) for the selected protocol
  reason: string;                      // Reason for the selection
  capabilities: {
    matched: string[];                 // Matched capabilities
    missing: string[];                 // Missing capabilities
  };
  metadata?: Record<string, unknown>;  // Additional metadata
}
