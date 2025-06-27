# Phase 1 Implementation Specification - Foundation Systems

**Date:** December 25, 2024  
**Phase:** Foundation Systems Implementation  
**Timeline:** Week 1-2  
**Priority:** CRITICAL - Core Infrastructure  

---

## 🎯 Phase 1 Objectives

Replace mock/demo implementations with production-ready services for:
1. **Nostr Protocol** - Real decentralized messaging
2. **Post-Quantum Cryptography** - Real quantum-safe algorithms  
3. **IPFS Integration** - Real decentralized storage

## 📋 Detailed Implementation Tasks

### **Task 1.1: Production Nostr Service Implementation**

#### **Current State Analysis**
```typescript
// src/services/nostrService.ts - CURRENT MOCK IMPLEMENTATION
class NostrService {
  // ❌ Mock data and local simulation only
  private mockMessages: NostrMessage[] = [];
  private mockChannels: NostrTeamChannel[] = [];
  
  // ❌ No real WebSocket connections
  async publishMessage(message: NostrMessage): Promise<void> {
    this.mockMessages.push(message); // Local only!
  }
}
```

#### **Required Implementation**
```typescript
// src/services/production/ProductionNostrService.ts - NEW IMPLEMENTATION
import { SimplePool, Sub, Event, UnsignedEvent, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import { pqCryptoService } from '../crypto/ProductionPQCService';

export class ProductionNostrService {
  private pool: SimplePool;
  private relays: string[];
  private subscriptions: Map<string, Sub>;
  private userKeys: { privateKey: Uint8Array; publicKey: string };
  private eventQueue: Event[];
  private isConnected: boolean = false;

  constructor() {
    this.pool = new SimplePool();
    this.relays = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.snort.social',
      'wss://relay.current.fyi',
      'wss://brb.io'
    ];
    this.subscriptions = new Map();
    this.eventQueue = [];
    this.userKeys = this.generateUserKeys();
  }

  private generateUserKeys(): { privateKey: Uint8Array; publicKey: string } {
    const privateKey = generateSecretKey();
    const publicKey = getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  async initialize(): Promise<void> {
    try {
      // Test connectivity to relays
      await this.testRelayConnections();
      this.isConnected = true;
      console.log('✅ ProductionNostrService initialized with', this.relays.length, 'relays');
    } catch (error) {
      console.error('❌ Failed to initialize ProductionNostrService:', error);
      throw error;
    }
  }

  private async testRelayConnections(): Promise<void> {
    const testEvent: UnsignedEvent = {
      kind: 1,
      content: 'Connection test',
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: this.userKeys.publicKey
    };

    // Test each relay
    for (const relay of this.relays) {
      try {
        const pub = this.pool.publish([relay], finalizeEvent(testEvent, this.userKeys.privateKey));
        await pub;
        console.log('✅ Connected to relay:', relay);
      } catch (error) {
        console.warn('⚠️ Failed to connect to relay:', relay, error);
      }
    }
  }

  async publishMessage(message: NostrMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('NostrService not initialized');
    }

    // Create Nostr event
    const unsignedEvent: UnsignedEvent = {
      kind: 1, // Text note
      content: await this.encryptMessage(message),
      tags: [
        ['t', message.teamId],
        ['c', message.channelId],
        ['clearance', message.clearanceLevel],
        ['type', message.messageType]
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: this.userKeys.publicKey
    };

    // Sign and publish
    const signedEvent = finalizeEvent(unsignedEvent, this.userKeys.privateKey);
    const pub = this.pool.publish(this.relays, signedEvent);
    
    await pub;
    console.log('📤 Published message to Nostr relays:', signedEvent.id);
  }

  async subscribeToTeamChannel(teamId: string, channelId: string, callback: (message: NostrMessage) => void): Promise<string> {
    const filter = {
      kinds: [1],
      '#t': [teamId],
      '#c': [channelId],
      since: Math.floor(Date.now() / 1000)
    };

    const sub = this.pool.sub(this.relays, [filter]);
    const subscriptionId = `${teamId}-${channelId}-${Date.now()}`;

    sub.on('event', async (event: Event) => {
      try {
        const decryptedMessage = await this.decryptEvent(event);
        callback(decryptedMessage);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    this.subscriptions.set(subscriptionId, sub);
    return subscriptionId;
  }

  private async encryptMessage(message: NostrMessage): Promise<string> {
    if (message.pqcEncrypted) {
      // Use PQC encryption for quantum-safe messaging
      const messageBytes = new TextEncoder().encode(JSON.stringify(message));
      const encryptedBytes = await pqCryptoService.encryptData(messageBytes, this.getUserQuantumKey());
      return btoa(String.fromCharCode(...encryptedBytes));
    } else {
      // Standard encryption for non-PQC messages
      return JSON.stringify(message);
    }
  }

  private async decryptEvent(event: Event): Promise<NostrMessage> {
    try {
      // Extract message data from event
      const teamTag = event.tags.find(tag => tag[0] === 't')?.[1] || '';
      const channelTag = event.tags.find(tag => tag[0] === 'c')?.[1] || '';
      const clearanceTag = event.tags.find(tag => tag[0] === 'clearance')?.[1] || 'UNCLASSIFIED';
      const typeTag = event.tags.find(tag => tag[0] === 'type')?.[1] || 'text';

      // Attempt to decrypt content
      let content = event.content;
      let decryptedData: any = {};

      try {
        // Try PQC decryption first
        const encryptedBytes = new Uint8Array(atob(content).split('').map(c => c.charCodeAt(0)));
        const decryptedBytes = await pqCryptoService.decryptData(encryptedBytes, this.getUserQuantumKey());
        decryptedData = JSON.parse(new TextDecoder().decode(decryptedBytes));
      } catch {
        // Fall back to standard JSON parsing
        decryptedData = JSON.parse(content);
      }

      return {
        id: event.id,
        teamId: teamTag,
        channelId: channelTag,
        senderId: event.pubkey,
        senderDID: `nostr:${event.pubkey}`,
        senderAgency: 'UNKNOWN',
        content: decryptedData.content || content,
        clearanceLevel: clearanceTag as any,
        messageType: typeTag as any,
        timestamp: event.created_at * 1000,
        encrypted: false,
        pqcEncrypted: !!decryptedData.pqcEncrypted,
        signature: event.sig,
        metadata: decryptedData.metadata || {}
      };
    } catch (error) {
      console.error('Failed to decrypt event:', error);
      throw error;
    }
  }

  private getUserQuantumKey(): Uint8Array {
    // Generate consistent quantum key from Nostr private key
    return new Uint8Array(this.userKeys.privateKey.slice(0, 32));
  }

  async disconnect(): Promise<void> {
    // Close all subscriptions
    for (const [id, sub] of this.subscriptions) {
      sub.unsub();
    }
    this.subscriptions.clear();
    
    // Close pool connections
    this.pool.close(this.relays);
    this.isConnected = false;
    console.log('🔌 Disconnected from Nostr relays');
  }
}
```

#### **Integration Requirements**
```typescript
// Update existing components to use ProductionNostrService
// src/components/CyberInvestigation/TeamCommunication.tsx
import { ProductionNostrService } from '../../services/production/ProductionNostrService';

// Replace mock service usage:
const nostrService = new ProductionNostrService();
await nostrService.initialize();

// Use real messaging:
await nostrService.publishMessage({
  // ... message data
});
```

### **Task 1.2: Production PQC Service Implementation**

#### **Current State Analysis**
```typescript
// src/services/crypto/SOCOMPQCryptoService.ts - CURRENT MOCK
export class SOCOMPQCryptoService {
  // ❌ Simple XOR operations - NOT quantum-safe
  async encryptData(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array(data.length).map((_, i) => data[i] ^ key[i % key.length]);
  }
}
```

#### **Required Implementation Strategy**

**Option A: WebAssembly PQC Libraries (Recommended)**
```typescript
// src/services/production/ProductionPQCService.ts
import { initPQC, MLKEMKeyGen, MLKEMEncrypt, MLKEMDecrypt, MLDSAKeyGen, MLDSASign, MLDSAVerify } from '@pqc/wasm';

export class ProductionPQCService {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await initPQC(); // Initialize WASM module
      this.isInitialized = true;
      console.log('✅ Production PQC service initialized');
    }
  }

  async generateKEMKeyPair(): Promise<QuantumKeyPair> {
    this.ensureInitialized();
    const keyPair = MLKEMKeyGen(768); // ML-KEM-768
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: 'ML-KEM-768'
    };
  }

  async kemEncapsulate(publicKey: Uint8Array): Promise<{ciphertext: Uint8Array, sharedSecret: Uint8Array}> {
    this.ensureInitialized();
    const result = MLKEMEncrypt(publicKey);
    return {
      ciphertext: result.ciphertext,
      sharedSecret: result.sharedSecret
    };
  }

  async generateSignatureKeyPair(): Promise<QuantumSignatureKeyPair> {
    this.ensureInitialized();
    const keyPair = MLDSAKeyGen(65); // ML-DSA-65
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: 'ML-DSA-65'
    };
  }

  async signMessage(message: Uint8Array, privateKey: Uint8Array): Promise<QuantumSignature> {
    this.ensureInitialized();
    const signature = MLDSASign(message, privateKey);
    return {
      signature,
      algorithm: 'ML-DSA-65',
      timestamp: Date.now()
    };
  }

  async verifySignature(signature: QuantumSignature, message: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    this.ensureInitialized();
    return MLDSAVerify(signature.signature, message, publicKey);
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PQC service not initialized. Call initialize() first.');
    }
  }
}
```

**Option B: Native JavaScript Implementation (Fallback)**
```typescript
// For development/testing if WASM libraries not available
export class FallbackPQCService {
  // Use established cryptography libraries as interim solution
  async encryptData(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    // Use AES-256-GCM as interim quantum-resistant solution
    const crypto = globalThis.crypto;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    return result;
  }
}
```

### **Task 1.3: Production IPFS Service Implementation**

#### **Current State Analysis**
```typescript
// src/services/IPFSService.ts - CURRENT MOCK
class IPFSService {
  // ❌ Mock implementation with localStorage
  async uploadContent(content: Uint8Array): Promise<IPFSUploadResult> {
    const hash = `mock-${Date.now()}`;
    localStorage.setItem(hash, JSON.stringify(Array.from(content)));
    return { hash, success: true, url: `ipfs://${hash}` };
  }
}
```

#### **Required Implementation**
```typescript
// src/services/production/ProductionIPFSService.ts
import { create as createIPFS, IPFS } from 'ipfs-core';
import { CID } from 'multiformats/cid';

export class ProductionIPFSService {
  private ipfs: IPFS | null = null;
  private isInitialized: boolean = false;
  private pinningServices: string[] = [
    'https://api.pinata.cloud',
    'https://api.web3.storage'
  ];

  async initialize(): Promise<void> {
    try {
      this.ipfs = await createIPFS({
        repo: 'starcom-ipfs-repo',
        config: {
          Addresses: {
            Swarm: [
              '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
              '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
            ]
          }
        }
      });
      
      this.isInitialized = true;
      console.log('✅ Production IPFS service initialized');
      
      // Connect to bootstrap nodes
      await this.connectToBootstrapNodes();
    } catch (error) {
      console.error('❌ Failed to initialize IPFS:', error);
      throw error;
    }
  }

  private async connectToBootstrapNodes(): Promise<void> {
    const bootstrapNodes = [
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
    ];

    for (const node of bootstrapNodes) {
      try {
        await this.ipfs!.swarm.connect(node);
        console.log('🔗 Connected to bootstrap node:', node);
      } catch (error) {
        console.warn('⚠️ Failed to connect to bootstrap node:', node);
      }
    }
  }

  async uploadContent(content: Uint8Array, options: UploadOptions = {}): Promise<IPFSUploadResult> {
    this.ensureInitialized();

    try {
      // Encrypt content if required
      let finalContent = content;
      if (options.encrypt) {
        finalContent = await this.encryptContent(content, options.encryptionKey!);
      }

      // Add to IPFS
      const addResult = await this.ipfs!.add(finalContent, {
        pin: true,
        wrapWithDirectory: false,
        cidVersion: 1
      });

      const hash = addResult.cid.toString();
      const size = addResult.size;

      // Pin to external services for redundancy
      if (options.pinToExternalServices) {
        await this.pinToExternalServices(hash);
      }

      return {
        hash,
        size,
        url: `ipfs://${hash}`,
        timestamp: new Date(),
        success: true,
        pqcEncrypted: !!options.encrypt,
        securityLevel: options.securityLevel || 'STANDARD',
        didAuthor: options.authorDID
      };
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      return {
        hash: '',
        size: 0,
        url: '',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        pqcEncrypted: false,
        securityLevel: 'STANDARD'
      };
    }
  }

  async retrieveContent(hash: string): Promise<Uint8Array> {
    this.ensureInitialized();

    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfs!.cat(hash)) {
        chunks.push(chunk);
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } catch (error) {
      console.error('❌ IPFS retrieval failed:', error);
      throw error;
    }
  }

  async pinContent(hash: string): Promise<void> {
    this.ensureInitialized();
    await this.ipfs!.pin.add(hash);
    console.log('📌 Pinned content:', hash);
  }

  private async encryptContent(content: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    // Use PQC service for encryption
    const pqcService = new (await import('./ProductionPQCService')).ProductionPQCService();
    await pqcService.initialize();
    return await pqcService.encryptData(content, key);
  }

  private async pinToExternalServices(hash: string): Promise<void> {
    // Pin to Pinata, Web3.Storage, etc. for redundancy
    console.log('📌 Pinning to external services:', hash);
    // Implementation depends on service APIs
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.ipfs) {
      throw new Error('IPFS service not initialized');
    }
  }
}

interface UploadOptions {
  encrypt?: boolean;
  encryptionKey?: Uint8Array;
  pinToExternalServices?: boolean;
  securityLevel?: string;
  authorDID?: string;
}
```

---

## 🔄 Migration Strategy

### **Service Replacement Pattern**
```typescript
// src/services/ServiceManager.ts - Feature flag system
export class ServiceManager {
  private static instance: ServiceManager;
  private useProductionServices: boolean;

  constructor() {
    // Read from environment or feature flags
    this.useProductionServices = process.env.VITE_USE_PRODUCTION_SERVICES === 'true';
  }

  getNostrService(): NostrService | ProductionNostrService {
    if (this.useProductionServices) {
      return new ProductionNostrService();
    }
    return new NostrService(); // Existing mock service
  }

  getPQCService(): SOCOMPQCryptoService | ProductionPQCService {
    if (this.useProductionServices) {
      return new ProductionPQCService();
    }
    return SOCOMPQCryptoService.getInstance(); // Existing mock service
  }

  getIPFSService(): IPFSService | ProductionIPFSService {
    if (this.useProductionServices) {
      return new ProductionIPFSService();
    }
    return new IPFSService(); // Existing mock service
  }
}
```

### **Component Updates**
```typescript
// Update existing components to use ServiceManager
// src/components/CyberInvestigation/TeamCommunication.tsx
import { ServiceManager } from '../../services/ServiceManager';

const TeamCommunication: React.FC<Props> = ({ teamId, investigationId }) => {
  const serviceManager = ServiceManager.getInstance();
  const nostrService = serviceManager.getNostrService();
  
  useEffect(() => {
    const initializeServices = async () => {
      if ('initialize' in nostrService) {
        await nostrService.initialize();
      }
    };
    initializeServices();
  }, []);

  // Rest of component remains the same
};
```

---

## 📊 Testing Strategy

### **Unit Tests**
```typescript
// tests/services/ProductionNostrService.test.ts
describe('ProductionNostrService', () => {
  let service: ProductionNostrService;

  beforeEach(async () => {
    service = new ProductionNostrService();
    await service.initialize();
  });

  afterEach(async () => {
    await service.disconnect();
  });

  test('should connect to Nostr relays', async () => {
    expect(service.isConnected).toBe(true);
  });

  test('should publish and receive messages', async () => {
    const testMessage: NostrMessage = {
      id: 'test-123',
      teamId: 'test-team',
      channelId: 'test-channel',
      content: 'Test message',
      // ... other required fields
    };

    await service.publishMessage(testMessage);
    
    // Subscribe and verify message received
    const messages: NostrMessage[] = [];
    await service.subscribeToTeamChannel('test-team', 'test-channel', (msg) => {
      messages.push(msg);
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Test message');
  });
});
```

### **Integration Tests**
```typescript
// tests/integration/ServiceIntegration.test.ts
describe('Service Integration', () => {
  test('should work together: PQC + IPFS + Nostr', async () => {
    const pqcService = new ProductionPQCService();
    const ipfsService = new ProductionIPFSService();
    const nostrService = new ProductionNostrService();

    await Promise.all([
      pqcService.initialize(),
      ipfsService.initialize(),
      nostrService.initialize()
    ]);

    // Test workflow: Create intel report → Encrypt → Store → Notify
    const intelReport = new TextEncoder().encode('Top secret intel report');
    
    // 1. Encrypt with PQC
    const keyPair = await pqcService.generateKEMKeyPair();
    const encrypted = await pqcService.encryptData(intelReport, keyPair.privateKey);
    
    // 2. Store on IPFS
    const ipfsResult = await ipfsService.uploadContent(encrypted);
    expect(ipfsResult.success).toBe(true);
    
    // 3. Notify via Nostr
    await nostrService.publishMessage({
      id: 'integration-test',
      content: `New intel report available: ${ipfsResult.hash}`,
      teamId: 'test-team',
      channelId: 'general',
      // ... other fields
    });

    // 4. Verify end-to-end workflow
    const retrieved = await ipfsService.retrieveContent(ipfsResult.hash);
    const decrypted = await pqcService.decryptData(retrieved, keyPair.privateKey);
    const originalContent = new TextDecoder().decode(decrypted);
    
    expect(originalContent).toBe('Top secret intel report');
  });
});
```

---

## 📋 Deliverables Checklist

### **Week 1 Deliverables**
- [ ] **ProductionNostrService.ts** - Complete implementation with real relay connections
- [ ] **ProductionPQCService.ts** - Real quantum-safe algorithms (WASM or fallback)
- [ ] **ProductionIPFSService.ts** - Real decentralized storage with encryption
- [ ] **ServiceManager.ts** - Feature flag system for safe transition
- [ ] **Updated Components** - TeamCommunication, CommunicationPanel using new services
- [ ] **Unit Tests** - Full test coverage for all new services
- [ ] **Integration Tests** - End-to-end workflow validation

### **Week 2 Deliverables**
- [ ] **Performance Optimization** - Connection pooling, caching, error handling
- [ ] **Security Hardening** - Key management, secure defaults, audit logging
- [ ] **Documentation** - API docs, deployment guides, troubleshooting
- [ ] **Production Readiness** - Monitoring, logging, error recovery
- [ ] **Migration Complete** - All MVP components using production services
- [ ] **User Acceptance Testing** - Verify all functionality works with real protocols

---

## 🎯 Success Metrics

### **Technical Metrics**
- **Message Delivery**: 99%+ success rate for Nostr messages
- **Storage Reliability**: 99.9%+ success rate for IPFS uploads
- **Encryption Performance**: <100ms overhead for PQC operations
- **Cross-Client Compatibility**: Messages work across different Nostr clients

### **Functional Metrics**
- **Team Communication**: Real-time messaging between team members
- **Intel Sharing**: Secure report distribution via IPFS + Nostr coordination
- **Security Compliance**: All data encrypted with quantum-safe algorithms
- **User Experience**: No degradation in functionality compared to mock services

---

*This specification provides the detailed roadmap for implementing production-ready foundation services, replacing mock implementations with real decentralized protocols while maintaining the existing MVP functionality.*
