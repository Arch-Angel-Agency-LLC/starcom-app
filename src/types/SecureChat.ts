// Earth Alliance Secure Chat Type Definitions

// Core threat levels used throughout the system
export type ThreatLevel = 'normal' | 'elevated' | 'high' | 'critical';

// Security clearance levels within Earth Alliance
export type SecurityClearance = 'alpha' | 'beta' | 'gamma' | 'omega' | 'command';

// Post-Quantum Cryptography algorithms
export type PQCAlgorithm = 'CRYSTALS-Kyber-512' | 'CRYSTALS-Kyber-768' | 'CRYSTALS-Kyber-1024' | 'CRYSTALS-Dilithium';

// NIST security levels for post-quantum cryptography
export type PQCSecurityLevel = 'NIST-1' | 'NIST-3' | 'NIST-5';

// Message types for secure communications
export type MessageType = 'text' | 'file' | 'image' | 'voice' | 'emergency' | 'command';

// Earth Alliance Contact Interface
export interface EarthAllianceContact {
  // Core identity
  pubkey: string; // Nostr public key
  pqcPublicKey: PQCPublicKey; // Post-quantum public key
  
  // Verified identity information
  verifiedIdentity: VerifiedIdentity;
  displayName: string;
  avatar?: string;
  
  // Security metrics
  trustScore: number; // 0-1, AI-calculated trust score
  reputation: ReputationScore;
  securityClearance: SecurityClearance;
  
  // Verification status
  lastVerified: Date;
  biometricHash?: string; // Optional hardware verification
  isEarthAllianceVerified: boolean;
  
  // Behavioral analysis
  behaviorSignature: string; // AI-generated behavior fingerprint
  lastActivity: Date;
  
  // Network status
  isOnline: boolean;
  lastSeen: Date;
  preferredRelays: string[];
}

// Post-Quantum Cryptography Key Interfaces
export interface PQCPublicKey {
  algorithm: PQCAlgorithm;
  keyData: Uint8Array;
  securityLevel: PQCSecurityLevel;
  createdAt: Date;
  expiresAt: Date;
}

export interface PQCPrivateKey {
  algorithm: PQCAlgorithm;
  keyData: Uint8Array;
  securityLevel: PQCSecurityLevel;
  createdAt: Date;
  expiresAt: Date;
}

export interface PQCKeyPair {
  publicKey: PQCPublicKey;
  privateKey: PQCPrivateKey;
  keyId: string;
}

// Verified Identity Structure
export interface VerifiedIdentity {
  earthAllianceId: string;
  displayName: string;
  verificationMethod: 'biometric' | 'hardware-key' | 'web-of-trust' | 'command-verified';
  verifiedBy: string; // Verifier's pubkey
  verificationDate: Date;
  verificationSignature: string; // Cryptographic proof
}

// Reputation scoring system
export interface ReputationScore {
  overall: number; // 0-1 overall reputation
  communication: number; // Communication quality
  security: number; // Security practices
  community: number; // Community standing
  technical: number; // Technical competence
  lastUpdated: Date;
  votingHistory: ReputationVote[];
}

export interface ReputationVote {
  voterPubkey: string;
  category: keyof Omit<ReputationScore, 'overall' | 'lastUpdated' | 'votingHistory'>;
  score: number;
  timestamp: Date;
  signature: string; // Cryptographic proof of vote
}

// Secure Chat Window Interface
export interface SecureChatWindow {
  // Window identification
  id: string;
  contact: EarthAllianceContact;
  
  // Window positioning and state
  position: WindowPosition;
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  
  // Messages in this chat window
  messages: SecureMessage[];
  
  // Security status
  threatLevel: ThreatLevel;
  encryptionStatus: EncryptionStatus;
  
  // Operational metadata
  createdAt: Date;
  lastActivity: Date;
  messageCount?: number;
}

// Window positioning with anti-fingerprinting
export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isSecureMode?: boolean; // Additional privacy protections
  obfuscationLevel?: 'none' | 'basic' | 'advanced';
}

// Encryption status tracking
export interface EncryptionStatus {
  algorithm: PQCAlgorithm;
  keyStrength: PQCSecurityLevel;
  isActive: boolean;
  lastRotation: Date;
  nextRotation?: Date;
}

// Secure Message Interface
export interface SecureMessage {
  // Message identification
  id: string;
  chatId: string;
  
  // Content (encrypted and decrypted)
  encryptedContent: string;
  content: string; // Decrypted content for display
  messageType: MessageType;
  
  // Display properties
  isOutgoing: boolean;
  isEncrypted: boolean;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'failed';
  
  // Sender information
  senderPubkey: string;
  senderSignature: string; // PQC signature
  
  // Security metadata
  encryptionAlgorithm: PQCAlgorithm;
  timestampHash: string; // Tamper-proof timestamp
  
  // Verification status
  isVerified: boolean;
  authenticityScore: number; // AI-calculated authenticity (0-1)
  deepfakeScore?: number; // If media content, deepfake detection score
  
  // Timestamps
  timestamp: Date; // Main timestamp for display
  sentAt: Date;
  receivedAt?: Date;
  readAt?: Date;
  
  // Network metadata
  relayNodes: string[]; // Which relays carried this message
  ipfsHash?: string; // If content stored on IPFS
}

// File attachment with IPFS integration
export interface SecureFileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  
  // IPFS storage
  ipfsHash: string;
  encryptionKey: string; // Encrypted with recipient's PQC key
  
  // Security verification
  fileHash: string; // SHA-256 of original file
  signature: string; // PQC signature of file hash
  
  // Classification
  securityLevel: SecurityClearance;
  accessList: string[]; // Authorized pubkeys
  
  // Metadata
  uploadedAt: Date;
  uploadedBy: string;
  expiresAt?: Date;
}

// Network and relay information
export interface SecureRelay {
  url: string;
  trust: number; // 0-1 trust score
  pqc_enabled: boolean;
  region: string;
  lastPing: number;
  reliability: number; // 0-1 uptime score
  earthAllianceVerified: boolean;
}

// Threat detection and security assessment
export interface SecurityThreat {
  id: string;
  type: 'deepfake' | 'behavioral-anomaly' | 'network-attack' | 'identity-compromise' | 'quantum-threat';
  severity: ThreatLevel;
  confidence: number; // 0-1 AI confidence score
  source: string;
  detectedAt: Date;
  description: string;
  
  // Mitigation
  mitigationRequired: boolean;
  earthAllianceProtocol?: string;
  recommendedActions: string[];
  
  // Context
  affectedContacts?: string[];
  affectedChats?: string[];
  networkPattern?: object;
}

// Behavioral analysis for user authentication
export interface BehaviorSignature {
  userId: string;
  
  // Typing patterns
  typingSpeed: number; // WPM
  typingRhythm: number[]; // Inter-keystroke timings
  commonPhrases: string[]; // Frequently used phrases
  
  // Communication patterns
  responseTime: number; // Average response time
  messageLength: number; // Average message length
  vocabulary: string[]; // Common vocabulary
  
  // Temporal patterns
  activeHours: number[]; // Hours of day when active
  activeDays: number[]; // Days of week when active
  timezone: string;
  
  // Metadata
  samplesCollected: number;
  confidenceLevel: number; // 0-1
  lastUpdated: Date;
}

// Emergency protocols and incident response
export interface EmergencyProtocol {
  id: string;
  name: string;
  triggerConditions: string[];
  actions: EmergencyAction[];
  requiredClearance: SecurityClearance;
  lastActivated?: Date;
}

export interface EmergencyAction {
  type: 'secure-delete' | 'key-rotation' | 'network-isolation' | 'alert-broadcast' | 'stealth-mode';
  parameters: object;
  priority: number; // 1-10, higher is more urgent
  estimatedDuration: number; // Seconds
}

// Network health and monitoring
export interface NetworkHealthStatus {
  relayNodes: number;
  ipfsNodes: number;
  isConnected: boolean;
  lastHeartbeat: Date | null;
  averageLatency: number;
  threatLevel: ThreatLevel;
  activeThreats: SecurityThreat[];
}

// Quantum threat monitoring
export interface QuantumThreatStatus {
  currentLevel: 'minimal' | 'emerging' | 'active' | 'imminent';
  estimatedTimeToThreat: number; // Days until practical quantum computers
  recommendedKeyStrength: PQCSecurityLevel;
  lastAssessment: Date;
  sources: string[]; // Threat intelligence sources
}

// AI and ML model interfaces
export interface AIModel {
  name: string;
  version: string;
  accuracy: number; // 0-1
  lastTrained: Date;
  trainingDataSize: number;
  modelType: 'deepfake-detection' | 'behavior-analysis' | 'threat-detection' | 'trust-scoring';
}

export interface DeepfakeAnalysis {
  isDeepfake: boolean;
  confidence: number; // 0-1
  analysisMethod: string;
  detectedArtifacts: string[];
  timestamp: Date;
  modelUsed: AIModel;
}

// Earth Alliance command structure
export interface CommandStructure {
  userClearance: SecurityClearance;
  availableChannels: CommandChannel[];
  emergencyContacts: EarthAllianceContact[];
  chainOfCommand: string[]; // Pubkeys in order of authority
}

export interface CommandChannel {
  id: string;
  name: string;
  requiredClearance: SecurityClearance;
  isEmergencyChannel: boolean;
  participants: string[]; // Authorized pubkeys
  encryptionLevel: PQCSecurityLevel;
}

// Federation and decentralized governance
export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'protocol' | 'governance' | 'emergency';
  proposedBy: string; // Pubkey
  proposedAt: Date;
  votingDeadline: Date;
  
  // Voting
  votes: GovernanceVote[];
  quorumRequired: number;
  passThreshold: number; // 0-1
  
  // Status
  status: 'proposed' | 'voting' | 'passed' | 'rejected' | 'implemented';
  implementedAt?: Date;
}

export interface GovernanceVote {
  voterPubkey: string;
  vote: 'yes' | 'no' | 'abstain';
  weight: number; // Based on reputation and stake
  timestamp: Date;
  signature: string; // Cryptographic proof
  rationale?: string;
}

// Export all types for use throughout the application
export type {
  // Re-export the main types for convenience
  EarthAllianceContact as Contact,
  SecureChatWindow as ChatWindow,
  SecureMessage as Message,
  SecurityThreat as Threat,
  NetworkHealthStatus as NetworkHealth
};
