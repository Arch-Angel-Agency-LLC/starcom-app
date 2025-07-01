# API Design & Protocol Documentation
## 🌐 Starcom Earth Alliance Secure Communications API

## 🎯 **API OVERVIEW**

This document defines the API specifications for Starcom's secure communications platform, implementing:
- **RESTful API** for traditional HTTP operations
- **WebSocket API** for real-time messaging
- **Nostr Protocol** for decentralized event relay
- **IPFS API** for distributed content storage
- **GraphQL** for complex data queries

## 🔌 **REST API ENDPOINTS**

### **Authentication & Identity**
```typescript
// POST /api/auth/login
interface LoginRequest {
  walletAddress: string;
  signature: string;
  timestamp: number;
  pqcProof?: PQCProof;
}

interface LoginResponse {
  jwt: string;
  refreshToken: string;
  expiresIn: number;
  userProfile: UserProfile;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/identity/did/create
interface CreateDIDRequest {
  keyType: 'secp256k1' | 'kyber-768';
  recoveryGuardians?: string[];
}

interface CreateDIDResponse {
  did: string;
  document: DIDDocument;
  recoveryShares: RecoveryShare[];
}
```

### **Contact Management**
```typescript
// GET /api/contacts
interface GetContactsResponse {
  contacts: Contact[];
  totalCount: number;
  nextCursor?: string;
}

// POST /api/contacts
interface CreateContactRequest {
  publicKey: string;
  displayName: string;
  trustLevel: 'unknown' | 'trusted' | 'verified';
  tags?: string[];
}

// PUT /api/contacts/:contactId/trust
interface UpdateTrustRequest {
  trustLevel: 'unknown' | 'trusted' | 'verified' | 'blocked';
  reason?: string;
  evidence?: TrustEvidence[];
}
```

### **Conversation Management**
```typescript
// GET /api/conversations
interface GetConversationsResponse {
  conversations: Conversation[];
  unreadCount: number;
  lastSyncTimestamp: number;
}

// POST /api/conversations
interface CreateConversationRequest {
  participants: string[]; // Contact IDs or public keys
  type: 'direct' | 'group' | 'channel';
  title?: string;
  encryptionLevel: 'standard' | 'quantum-safe' | 'zero-knowledge';
}

// GET /api/conversations/:id/messages
interface GetMessagesResponse {
  messages: EncryptedMessage[];
  hasMore: boolean;
  nextCursor?: string;
}
```

### **Security & Threat Detection**
```typescript
// GET /api/security/threats
interface GetThreatsResponse {
  threats: SecurityThreat[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastScan: number;
}

// POST /api/security/scan
interface SecurityScanRequest {
  target: 'contact' | 'message' | 'conversation' | 'network';
  targetId: string;
  scanType: 'basic' | 'deep' | 'forensic';
}

// GET /api/security/reputation/:publicKey
interface GetReputationResponse {
  score: number; // 0-1000
  factors: ReputationFactors;
  history: ReputationEvent[];
  warnings: SecurityWarning[];
}
```

### **Relay Management**
```typescript
// GET /api/relays
interface GetRelaysResponse {
  relays: RelayInfo[];
  recommended: string[];
  userRelays: string[];
}

// POST /api/relays/test
interface TestRelayRequest {
  url: string;
  timeout?: number;
}

interface TestRelayResponse {
  status: 'online' | 'offline' | 'slow' | 'unreliable';
  latency: number;
  capabilities: string[];
  trustScore: number;
}
```

## 🔄 **WEBSOCKET API**

### **Connection & Authentication**
```typescript
// Connection URL: wss://api.starcom.earth/ws?token=<jwt>

interface WebSocketMessage {
  type: string;
  id: string;
  timestamp: number;
  data: any;
}

// Client -> Server authentication
interface WSAuthMessage {
  type: 'auth';
  token: string;
  pqcProof?: PQCProof;
}

// Server -> Client authentication response
interface WSAuthResponse {
  type: 'auth_result';
  success: boolean;
  error?: string;
  sessionId: string;
}
```

### **Real-time Messaging**
```typescript
// Send encrypted message
interface WSSendMessage {
  type: 'send_message';
  conversationId: string;
  encryptedContent: EncryptedPayload;
  ephemeralKey: string;
  signature: string;
}

// Receive encrypted message
interface WSReceiveMessage {
  type: 'message_received';
  messageId: string;
  conversationId: string;
  senderId: string;
  encryptedContent: EncryptedPayload;
  timestamp: number;
  deliveryProof: string;
}

// Message status updates
interface WSMessageStatus {
  type: 'message_status';
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
}
```

### **Presence & Status**
```typescript
// Update user presence
interface WSPresenceUpdate {
  type: 'presence_update';
  status: 'online' | 'away' | 'busy' | 'offline';
  customMessage?: string;
  location?: SecureLocation;
}

// Contact presence notification
interface WSPresenceNotification {
  type: 'contact_presence';
  contactId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: number;
}
```

### **Security Alerts**
```typescript
// Real-time security alerts
interface WSSecurityAlert {
  type: 'security_alert';
  severity: 'info' | 'warning' | 'critical';
  category: 'authentication' | 'encryption' | 'network' | 'behavioral';
  message: string;
  details: SecurityAlertDetails;
  actionRequired: boolean;
}

// Threat detection notification
interface WSThreatDetected {
  type: 'threat_detected';
  threatType: string;
  confidence: number;
  source: string;
  mitigation: string[];
}
```

## 📡 **NOSTR PROTOCOL INTEGRATION**

### **Event Types**
```typescript
// Kind 1: Text messages (encrypted)
interface NostrTextMessage {
  kind: 1;
  content: string; // Encrypted payload
  tags: [
    ['p', recipientPubkey],
    ['e', replyToEventId?],
    ['encryption', 'hybrid-pqc'],
    ['starcom', 'v1.0']
  ];
}

// Kind 4: Direct messages (legacy compatibility)
interface NostrDirectMessage {
  kind: 4;
  content: string; // Encrypted with recipient's pubkey
  tags: [['p', recipientPubkey]];
}

// Kind 10000: Mute list (contact blocking)
interface NostrMuteList {
  kind: 10000;
  content: '';
  tags: [
    ['p', blockedPubkey, reason?],
    ...
  ];
}

// Kind 30000: Contact list (trust relationships)
interface NostrContactList {
  kind: 30000;
  content: JSON.stringify({
    displayName: string;
    trustLevel: number;
    lastInteraction: number;
  });
  tags: [
    ['d', contactId],
    ['p', contactPubkey],
    ['trust', trustScore.toString()]
  ];
}
```

### **Custom Starcom Event Types**
```typescript
// Kind 30001: Threat intelligence sharing
interface NostrThreatIntel {
  kind: 30001;
  content: JSON.stringify({
    threatType: string;
    indicators: string[];
    confidence: number;
    source: string;
  });
  tags: [
    ['d', threatId],
    ['threat', threatType],
    ['confidence', confidence.toString()]
  ];
}

// Kind 30002: Relay health status
interface NostrRelayHealth {
  kind: 30002;
  content: JSON.stringify({
    uptime: number;
    latency: number;
    errorRate: number;
    lastCheck: number;
  });
  tags: [
    ['d', relayUrl],
    ['relay', relayUrl],
    ['health', healthScore.toString()]
  ];
}
```

### **Event Validation & Security**
```typescript
interface NostrEventValidation {
  // Signature validation
  validateSignature(event: NostrEvent): Promise<boolean>;
  
  // Content validation
  validateContent(event: NostrEvent): Promise<ValidationResult>;
  
  // Rate limiting
  checkRateLimit(pubkey: string, kind: number): Promise<boolean>;
  
  // Spam detection
  detectSpam(event: NostrEvent): Promise<SpamScore>;
  
  // Malicious content detection
  detectMaliciousContent(content: string): Promise<ThreatScore>;
}
```

## 🗄️ **IPFS API INTEGRATION**

### **Content Storage**
```typescript
// Store encrypted message content
interface IPFSStoreRequest {
  content: EncryptedPayload;
  pin: boolean;
  metadata: {
    type: 'message' | 'file' | 'media';
    size: number;
    encryption: 'aes-256-gcm' | 'hybrid-pqc';
  };
}

interface IPFSStoreResponse {
  hash: string;
  size: number;
  pinned: boolean;
}

// Retrieve content
interface IPFSRetrieveRequest {
  hash: string;
  timeout?: number;
}

// Pin management
interface IPFSPinRequest {
  hash: string;
  recursive: boolean;
}
```

### **Content Addressing**
```typescript
interface IPFSContentAddress {
  // CIDv1 for future compatibility
  cid: string; // e.g., "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku"
  
  // Content metadata
  metadata: {
    size: number;
    type: string;
    encryption: string;
    created: number;
    expires?: number;
  };
  
  // Access control
  access: {
    public: boolean;
    authorizedKeys: string[];
    requireSignature: boolean;
  };
}
```

## 📊 **GRAPHQL SCHEMA**

### **Core Types**
```graphql
type User {
  id: ID!
  did: String!
  publicKey: String!
  profile: UserProfile!
  contacts: [Contact!]!
  conversations: [Conversation!]!
  securitySettings: SecuritySettings!
}

type Contact {
  id: ID!
  publicKey: String!
  displayName: String!
  trustLevel: TrustLevel!
  reputation: ReputationScore!
  lastSeen: DateTime
  isOnline: Boolean!
}

type Conversation {
  id: ID!
  type: ConversationType!
  participants: [Contact!]!
  messages(first: Int, after: String): MessageConnection!
  unreadCount: Int!
  lastMessage: Message
  encryptionLevel: EncryptionLevel!
}

type Message {
  id: ID!
  sender: Contact!
  content: String! # Decrypted content
  timestamp: DateTime!
  status: MessageStatus!
  replyTo: Message
  attachments: [Attachment!]!
}
```

### **Security Types**
```graphql
type SecurityThreat {
  id: ID!
  type: ThreatType!
  severity: ThreatSeverity!
  source: String!
  description: String!
  mitigations: [String!]!
  detected: DateTime!
  resolved: Boolean!
}

type ReputationScore {
  score: Int! # 0-1000
  factors: ReputationFactors!
  history: [ReputationEvent!]!
  warnings: [SecurityWarning!]!
}

type RelayNode {
  url: String!
  status: RelayStatus!
  capabilities: [String!]!
  trustScore: Int!
  latency: Int!
  uptime: Float!
}
```

### **Queries & Mutations**
```graphql
type Query {
  # User data
  me: User!
  contact(id: ID!): Contact
  conversation(id: ID!): Conversation
  
  # Security
  threats(severity: ThreatSeverity): [SecurityThreat!]!
  reputation(publicKey: String!): ReputationScore!
  relays(status: RelayStatus): [RelayNode!]!
  
  # Search
  searchContacts(query: String!): [Contact!]!
  searchMessages(query: String!, conversationId: ID): [Message!]!
}

type Mutation {
  # Messaging
  sendMessage(input: SendMessageInput!): Message!
  markAsRead(conversationId: ID!): Boolean!
  
  # Contacts
  addContact(input: AddContactInput!): Contact!
  updateTrustLevel(contactId: ID!, level: TrustLevel!): Contact!
  blockContact(contactId: ID!): Boolean!
  
  # Security
  reportThreat(input: ReportThreatInput!): SecurityThreat!
  updateSecuritySettings(input: SecuritySettingsInput!): SecuritySettings!
}

type Subscription {
  # Real-time updates
  messageReceived(conversationId: ID): Message!
  contactPresence(contactId: ID): PresenceUpdate!
  securityAlert: SecurityThreat!
  
  # System updates
  relayStatus: RelayNode!
  threatIntelligence: ThreatIntel!
}
```

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **JWT Token Structure**
```typescript
interface JWTPayload {
  // Standard claims
  iss: 'starcom.earth';
  sub: string; // User DID
  aud: 'starcom-app';
  exp: number;
  iat: number;
  jti: string;
  
  // Custom claims
  publicKey: string;
  trustLevel: number;
  permissions: string[];
  securityClearance: 'public' | 'restricted' | 'confidential' | 'secret';
  
  // Post-quantum claims
  pqcPublicKey?: string;
  pqcSignature?: string;
}
```

### **Permission System**
```typescript
enum Permission {
  // Basic permissions
  READ_MESSAGES = 'messages:read',
  SEND_MESSAGES = 'messages:send',
  MANAGE_CONTACTS = 'contacts:manage',
  
  // Advanced permissions
  ACCESS_THREAT_INTEL = 'security:threat_intel',
  MANAGE_RELAYS = 'relays:manage',
  ADMIN_USERS = 'admin:users',
  
  // Earth Alliance permissions
  CLASSIFIED_ACCESS = 'earth_alliance:classified',
  MISSION_CRITICAL = 'earth_alliance:mission_critical',
  LEADERSHIP_CHANNEL = 'earth_alliance:leadership',
}
```

### **API Rate Limiting**
```typescript
interface RateLimitConfig {
  // Standard endpoints
  standard: {
    requests: 100;
    window: '15m';
    burstLimit: 20;
  };
  
  // Security endpoints
  security: {
    requests: 50;
    window: '15m';
    burstLimit: 10;
  };
  
  // Real-time messaging
  messaging: {
    requests: 1000;
    window: '1h';
    burstLimit: 100;
  };
  
  // Per-user limits
  userLimits: {
    newUser: 'standard';
    verified: 'premium';
    earthAlliance: 'unlimited';
  };
}
```

## 📈 **API MONITORING & METRICS**

### **Performance Metrics**
```typescript
interface APIMetrics {
  // Request metrics
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  
  // Security metrics
  authenticationFailures: number;
  rateLimitHits: number;
  suspiciousRequests: number;
  threatsDetected: number;
  
  // Business metrics
  activeUsers: number;
  messagesPerSecond: number;
  encryptionOverhead: number;
  relayLatency: number;
}
```

### **Health Checks**
```typescript
interface HealthCheck {
  // System health
  database: 'healthy' | 'degraded' | 'unhealthy';
  redis: 'healthy' | 'degraded' | 'unhealthy';
  ipfs: 'healthy' | 'degraded' | 'unhealthy';
  nostrRelays: 'healthy' | 'degraded' | 'unhealthy';
  
  // Security health
  threatDetection: 'operational' | 'degraded' | 'offline';
  encryption: 'operational' | 'degraded' | 'offline';
  authentication: 'operational' | 'degraded' | 'offline';
  
  // Performance
  averageLatency: number;
  errorRate: number;
  throughput: number;
}
```

## 🚨 **ERROR HANDLING**

### **Error Response Format**
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
    requestId: string;
  };
  
  // Security context
  security?: {
    threatLevel: number;
    blocked: boolean;
    reason: string;
  };
}
```

### **Error Codes**
```typescript
enum APIErrorCode {
  // Authentication errors
  INVALID_TOKEN = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  INSUFFICIENT_PERMISSIONS = 'AUTH_003',
  
  // Validation errors
  INVALID_INPUT = 'VAL_001',
  MISSING_REQUIRED_FIELD = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',
  
  // Security errors
  RATE_LIMIT_EXCEEDED = 'SEC_001',
  SUSPICIOUS_ACTIVITY = 'SEC_002',
  THREAT_DETECTED = 'SEC_003',
  ENCRYPTION_FAILED = 'SEC_004',
  
  // System errors
  SERVICE_UNAVAILABLE = 'SYS_001',
  DATABASE_ERROR = 'SYS_002',
  NETWORK_ERROR = 'SYS_003',
  
  // Business logic errors
  CONTACT_NOT_FOUND = 'BIZ_001',
  CONVERSATION_ACCESS_DENIED = 'BIZ_002',
  MESSAGE_DELIVERY_FAILED = 'BIZ_003',
}
```

---

**This API documentation provides the complete interface specification for Starcom's secure communications platform, enabling developers to build secure, privacy-preserving communication applications.**
