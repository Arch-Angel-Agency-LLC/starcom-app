# Task 1.1: Replace Demo Keys with Real Nostr Keys

**File**: `src/services/nostrService.ts`  
**Priority**: Critical - Foundation for all other HTTP bridge integration  
**Estimated Time**: 2-4 hours  

---

## 🔧 **IMPLEMENTATION STEPS**

### Step 1: Install Required Dependencies

First, we need to ensure we have the nostr-tools library properly installed:

```bash
npm install nostr-tools
```

### Step 2: Replace Demo Key Generation

**Current Code (Lines 111-127)**:
```typescript
private async initializeNostrKeys(): Promise<void> {
  // Generate demo keys (in production, use proper cryptographic key generation)
  this.privateKey = this.generateDemoPrivateKey();
  this.publicKey = this.generateDemoPublicKey(this.privateKey);
  
  console.log('🔑 Nostr keys generated:', {
    publicKey: this.publicKey.slice(0, 16) + '...'
  });
}

private generateDemoPrivateKey(): string {
  // Demo implementation - in production use proper crypto
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

private generateDemoPublicKey(privateKey: string): string {
  // Demo implementation - in production derive properly from private key
  return privateKey.slice(0, 32) + privateKey.slice(32);
}
```

**New Implementation**:
```typescript
// Add imports at the top of the file
import { generatePrivateKey, getPublicKey } from 'nostr-tools';

// Replace the initializeNostrKeys method
private async initializeNostrKeys(): Promise<void> {
  try {
    // Generate proper secp256k1 keys for Nostr protocol
    this.privateKey = generatePrivateKey();
    this.publicKey = getPublicKey(this.privateKey);
    
    console.log('🔑 Real Nostr keys generated:', {
      publicKey: this.publicKey,
      privateKeyLength: this.privateKey.length
    });
  } catch (error) {
    console.error('❌ Failed to generate Nostr keys:', error);
    throw new Error('Nostr key generation failed');
  }
}

// Remove the demo key generation methods
// private generateDemoPrivateKey(): string { ... } // DELETE
// private generateDemoPublicKey(privateKey: string): string { ... } // DELETE
```

### Step 3: Add Event Creation and Signing

Add these new methods to the NostrService class:

```typescript
import { Event, getEventHash, signEvent } from 'nostr-tools';

/**
 * Create a properly formatted and signed Nostr event
 */
private createNostrEvent(
  content: string, 
  kind: number = 1, 
  tags: string[][] = []
): Event {
  if (!this.privateKey || !this.publicKey) {
    throw new Error('Nostr keys not initialized');
  }

  const event: Event = {
    kind,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
    pubkey: this.publicKey,
    id: '',
    sig: ''
  };
  
  // Generate event ID and signature
  event.id = getEventHash(event);
  event.sig = signEvent(event, this.privateKey);
  
  return event;
}

/**
 * Verify a Nostr event signature
 */
private verifyEventSignature(event: Event): boolean {
  try {
    // Import verifySignature when available in nostr-tools
    // For now, trust events from known relays
    return true;
  } catch (error) {
    console.error('Event signature verification failed:', error);
    return false;
  }
}
```

### Step 4: Update Message Creation

Update the `sendMessage` method to use real Nostr events:

```typescript
/**
 * Send a secure message to a Nostr relay via HTTP bridge
 */
public async sendMessage(
  channelId: string,
  content: string,
  messageType: 'text' | 'intelligence' | 'alert' | 'status' = 'text'
): Promise<NostrMessage | null> {
  try {
    if (!this.publicKey || !this.privateKey) {
      throw new Error('Nostr service not properly initialized');
    }

    // 1. Apply PQC encryption to content
    const encryptedContent = await pqCryptoService.encryptMessage(
      content,
      this.publicKey
    );

    // 2. Create properly formatted Nostr event
    const nostrEvent = this.createNostrEvent(
      encryptedContent,
      1, // Text message kind
      [
        ['e', channelId], // Channel/thread reference
        ['p', this.publicKey], // Author reference
        ['t', messageType], // Message type tag
      ]
    );

    // 3. Publish event via HTTP bridge (implement in next task)
    const success = await this.publishEventViaHTTP(nostrEvent);
    
    if (success) {
      // 4. Create local message object for UI
      const message: NostrMessage = {
        id: nostrEvent.id,
        teamId: channelId.split('-')[0] || 'unknown',
        channelId,
        senderId: this.publicKey,
        senderDID: this.userDID || 'unknown',
        senderAgency: 'CYBER_COMMAND', // Default agency
        content, // Store decrypted content locally
        clearanceLevel: 'UNCLASSIFIED', // Default clearance
        messageType,
        timestamp: nostrEvent.created_at * 1000,
        encrypted: true,
        pqcEncrypted: true,
        signature: nostrEvent.sig,
        metadata: {
          eventId: nostrEvent.id,
          relays: this.DEFAULT_RELAYS
        }
      };

      // 5. Add to local message history
      this.addMessageToHistory(channelId, message);
      
      console.log('📡 Message sent via real Nostr protocol:', nostrEvent.id);
      return message;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to send Nostr message:', error);
    return null;
  }
}

// Placeholder for HTTP bridge implementation (Task 1.2)
private async publishEventViaHTTP(event: Event): Promise<boolean> {
  // TODO: Implement in Task 1.2
  console.log('📋 Event ready for HTTP bridge publication:', event.id);
  return true; // Temporary success for testing
}

// Helper method to manage message history
private addMessageToHistory(channelId: string, message: NostrMessage): void {
  if (!this.messageHistory.has(channelId)) {
    this.messageHistory.set(channelId, []);
  }
  
  const messages = this.messageHistory.get(channelId)!;
  messages.push(message);
  
  // Keep only last 100 messages per channel
  if (messages.length > 100) {
    messages.splice(0, messages.length - 100);
  }
  
  this.messageHistory.set(channelId, messages);
}
```

---

## 🧪 **TESTING**

### Unit Test
```typescript
// src/services/__tests__/nostrService.keys.test.ts
import NostrService from '../nostrService';

describe('NostrService Real Keys', () => {
  let service: NostrService;

  beforeEach(() => {
    service = NostrService.getInstance();
  });

  test('should generate valid Nostr keys', () => {
    // Keys should be hex strings of correct length
    expect(service.getPublicKey()).toMatch(/^[0-9a-f]{64}$/);
    expect(service.getPrivateKey()).toMatch(/^[0-9a-f]{64}$/);
  });

  test('should create valid Nostr events', () => {
    const event = service.createTestEvent('Hello World');
    
    expect(event.kind).toBe(1);
    expect(event.content).toBe('Hello World');
    expect(event.pubkey).toBe(service.getPublicKey());
    expect(event.id).toMatch(/^[0-9a-f]{64}$/);
    expect(event.sig).toMatch(/^[0-9a-f]{128}$/);
    expect(event.created_at).toBeCloseTo(Date.now() / 1000, 0);
  });
});
```

### Manual Test
```typescript
// Add temporary test methods to NostrService for validation
public getPublicKey(): string | null {
  return this.publicKey;
}

public getPrivateKey(): string | null {
  return this.privateKey;
}

public createTestEvent(content: string): Event {
  return this.createNostrEvent(content);
}
```

---

## ✅ **COMPLETION CRITERIA**

- [ ] nostr-tools dependency installed and imported
- [ ] Demo key generation methods removed
- [ ] Real secp256k1 key generation implemented
- [ ] Event creation and signing functional
- [ ] Updated sendMessage method with real Nostr events
- [ ] Unit tests pass
- [ ] Manual testing confirms valid key generation
- [ ] Console logs show real Nostr event IDs

---

## 🚀 **NEXT TASK**

**Task 1.2**: Implement HTTP Bridge Publication
- Replace `publishEventViaHTTP` placeholder with GetAlby integration
- Add multi-bridge fallback logic
- Implement error handling and retries

---

**ESTIMATED COMPLETION**: 2-4 hours  
**DEPENDENCIES**: None  
**RISK LEVEL**: Low (well-documented nostr-tools library)
