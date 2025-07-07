# Task 1.2: GetAlby HTTP Bridge Integration

**File**: `src/services/nostrService.ts`  
**Priority**: Critical - Core HTTP bridge functionality  
**Estimated Time**: 4-6 hours  
**Dependencies**: Task 1.1 (Real Nostr Keys) must be completed first  

---

## 🔧 **IMPLEMENTATION STEPS**

### Step 1: Add HTTP Bridge Configuration

Add these constants and configuration to the NostrService class:

```typescript
class NostrService {
  // Add these properties after existing declarations
  private readonly HTTP_BRIDGE_URL = 'https://publisher.getalby.com';
  private readonly BACKUP_BRIDGES = [
    'https://api.nostr.band/publish',
    'https://relay.snort.social/api/v1/publish'
  ];
  
  // Bridge service health tracking
  private bridgeHealth: Map<string, { isHealthy: boolean; lastCheck: number }> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
}
```

### Step 2: Implement HTTP Bridge Publication

Replace the placeholder `publishEventViaHTTP` method:

```typescript
/**
 * Publish a Nostr event via HTTP bridge to relays
 */
private async publishEventViaHTTP(event: Event): Promise<boolean> {
  const bridges = [this.HTTP_BRIDGE_URL, ...this.BACKUP_BRIDGES];
  
  for (const bridgeUrl of bridges) {
    try {
      const success = await this.publishToBridge(event, bridgeUrl);
      if (success) {
        console.log(`✅ Event published via bridge: ${bridgeUrl}`);
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ Bridge failed: ${bridgeUrl}`, error);
      this.markBridgeUnhealthy(bridgeUrl);
    }
  }
  
  throw new Error('All HTTP bridges failed');
}

/**
 * Publish event to a specific HTTP bridge
 */
private async publishToBridge(event: Event, bridgeUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${bridgeUrl}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        event,
        relays: this.DEFAULT_RELAYS
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📡 Bridge response:`, result);
    
    this.markBridgeHealthy(bridgeUrl);
    return true;
  } catch (error) {
    console.error(`❌ Bridge publication failed (${bridgeUrl}):`, error);
    throw error;
  }
}

/**
 * Mark bridge as healthy/unhealthy
 */
private markBridgeHealthy(bridgeUrl: string): void {
  this.bridgeHealth.set(bridgeUrl, {
    isHealthy: true,
    lastCheck: Date.now()
  });
}

private markBridgeUnhealthy(bridgeUrl: string): void {
  this.bridgeHealth.set(bridgeUrl, {
    isHealthy: false,
    lastCheck: Date.now()
  });
}

/**
 * Check if bridge is healthy
 */
private isBridgeHealthy(bridgeUrl: string): boolean {
  const health = this.bridgeHealth.get(bridgeUrl);
  if (!health) return true; // Unknown = assume healthy
  
  // Health status expires after 5 minutes
  const isExpired = Date.now() - health.lastCheck > this.HEALTH_CHECK_INTERVAL;
  return isExpired || health.isHealthy;
}
```

### Step 3: Implement Message Retrieval via HTTP Polling

Add message subscription and polling functionality:

```typescript
// Add to class properties
private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
private subscriptions: Map<string, any> = new Map();

/**
 * Subscribe to a channel for new messages
 */
public async subscribeToChannel(channelId: string): Promise<void> {
  try {
    // Create subscription filter
    const subscription = {
      id: `sub_${channelId}`,
      filter: {
        kinds: [1], // Text messages
        '#e': [channelId], // Channel tag
        since: Math.floor(Date.now() / 1000) - 3600, // Last hour
        limit: 50
      }
    };

    this.subscriptions.set(channelId, subscription);
    
    // Start polling for messages
    await this.startMessagePolling(channelId, subscription);
    
    console.log(`📡 Subscribed to channel: ${channelId}`);
  } catch (error) {
    console.error(`❌ Failed to subscribe to channel ${channelId}:`, error);
  }
}

/**
 * Start polling for new messages in a channel
 */
private async startMessagePolling(channelId: string, subscription: any): Promise<void> {
  // Clear existing polling interval
  const existingInterval = this.pollingIntervals.get(channelId);
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  // Start new polling interval
  const pollInterval = setInterval(async () => {
    try {
      const messages = await this.fetchChannelMessages(subscription);
      if (messages.length > 0) {
        this.processIncomingMessages(channelId, messages);
      }
    } catch (error) {
      console.error(`❌ Message polling failed for ${channelId}:`, error);
    }
  }, 5000); // Poll every 5 seconds

  this.pollingIntervals.set(channelId, pollInterval);
}

/**
 * Fetch messages from HTTP bridge
 */
private async fetchChannelMessages(subscription: any): Promise<Event[]> {
  try {
    // Try each bridge until one succeeds
    for (const bridgeUrl of [this.HTTP_BRIDGE_URL, ...this.BACKUP_BRIDGES]) {
      if (!this.isBridgeHealthy(bridgeUrl)) continue;
      
      try {
        const response = await fetch(`${bridgeUrl}/req`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });

        if (response.ok) {
          const events = await response.json();
          this.markBridgeHealthy(bridgeUrl);
          return Array.isArray(events) ? events : [];
        }
      } catch (error) {
        console.warn(`Bridge polling failed: ${bridgeUrl}`, error);
        this.markBridgeUnhealthy(bridgeUrl);
      }
    }
    
    return [];
  } catch (error) {
    console.error('All bridges failed during message fetch:', error);
    return [];
  }
}

/**
 * Process incoming messages from relays
 */
private async processIncomingMessages(channelId: string, events: Event[]): Promise<void> {
  for (const event of events) {
    try {
      // Verify event signature
      if (!this.verifyEventSignature(event)) {
        console.warn('Invalid event signature, skipping:', event.id);
        continue;
      }

      // Skip our own messages
      if (event.pubkey === this.publicKey) {
        continue;
      }

      // Decrypt message content
      const decryptedContent = await this.decryptMessageContent(event.content);
      
      // Convert to NostrMessage format
      const message: NostrMessage = {
        id: event.id,
        teamId: channelId.split('-')[0] || 'unknown',
        channelId,
        senderId: event.pubkey,
        senderDID: 'unknown', // Would need DID lookup
        senderAgency: 'UNKNOWN',
        content: decryptedContent,
        clearanceLevel: 'UNCLASSIFIED',
        messageType: this.getMessageTypeFromTags(event.tags),
        timestamp: event.created_at * 1000,
        encrypted: true,
        pqcEncrypted: true,
        signature: event.sig,
        metadata: {
          eventId: event.id,
          tags: event.tags
        }
      };

      // Add to message history
      this.addMessageToHistory(channelId, message);
      
      // Emit event for UI updates
      this.emitMessageReceived(message);
      
      console.log(`📨 New message received in ${channelId}:`, message.id);
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }
}

/**
 * Decrypt message content using PQC
 */
private async decryptMessageContent(encryptedContent: string): Promise<string> {
  try {
    return await pqCryptoService.decryptMessage(encryptedContent, this.privateKey!);
  } catch (error) {
    console.error('Message decryption failed:', error);
    return '[Decryption failed]';
  }
}

/**
 * Extract message type from Nostr event tags
 */
private getMessageTypeFromTags(tags: string[][]): 'text' | 'intelligence' | 'alert' | 'status' {
  const typeTag = tags.find(tag => tag[0] === 't' && tag[1]);
  return (typeTag?.[1] as any) || 'text';
}

/**
 * Emit message received event for UI updates
 */
private emitMessageReceived(message: NostrMessage): void {
  // Dispatch custom event for UI components to listen to
  const event = new CustomEvent('nostr-message-received', {
    detail: message
  });
  window.dispatchEvent(event);
}
```

### Step 4: Add Cleanup and Unsubscribe Methods

```typescript
/**
 * Unsubscribe from a channel
 */
public async unsubscribeFromChannel(channelId: string): Promise<void> {
  const interval = this.pollingIntervals.get(channelId);
  if (interval) {
    clearInterval(interval);
    this.pollingIntervals.delete(channelId);
  }
  
  this.subscriptions.delete(channelId);
  console.log(`📡 Unsubscribed from channel: ${channelId}`);
}

/**
 * Cleanup all subscriptions
 */
public cleanup(): void {
  for (const [channelId, interval] of this.pollingIntervals) {
    clearInterval(interval);
  }
  
  this.pollingIntervals.clear();
  this.subscriptions.clear();
  console.log('🧹 Nostr service cleanup completed');
}
```

### Step 5: Update Channel Creation and Joining

Update existing methods to use HTTP bridges:

```typescript
/**
 * Join a team communication channel
 */
public async joinTeamChannel(
  channelId: string,
  userDID: string,
  clearanceLevel: ClearanceLevel
): Promise<boolean> {
  try {
    // Create join event
    const joinEvent = this.createNostrEvent(
      JSON.stringify({
        action: 'join',
        channelId,
        userDID,
        clearanceLevel,
        timestamp: Date.now()
      }),
      42, // Custom event kind for channel operations
      [
        ['e', channelId],
        ['p', this.publicKey!],
        ['action', 'join']
      ]
    );

    // Publish join event via HTTP bridge
    const success = await this.publishEventViaHTTP(joinEvent);
    
    if (success) {
      // Start listening for messages in this channel
      await this.subscribeToChannel(channelId);
      
      console.log(`✅ Successfully joined channel: ${channelId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Failed to join channel ${channelId}:`, error);
    return false;
  }
}
```

---

## 🧪 **TESTING**

### Integration Test
```typescript
// src/services/__tests__/nostrService.http.test.ts
import NostrService from '../nostrService';

describe('NostrService HTTP Bridge', () => {
  let service: NostrService;

  beforeEach(() => {
    service = NostrService.getInstance();
  });

  test('should publish message via HTTP bridge', async () => {
    const message = await service.sendMessage(
      'test-channel-123',
      'Hello from HTTP bridge!',
      'text'
    );
    
    expect(message).toBeTruthy();
    expect(message?.content).toBe('Hello from HTTP bridge!');
    expect(message?.id).toMatch(/^[0-9a-f]{64}$/);
  });

  test('should handle bridge failures gracefully', async () => {
    // Mock all bridges to fail
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(
      service.sendMessage('test-channel', 'Test message')
    ).rejects.toThrow('All HTTP bridges failed');
    
    global.fetch = originalFetch;
  });

  test('should subscribe to channel and poll for messages', async () => {
    const channelId = 'test-channel-456';
    
    await service.subscribeToChannel(channelId);
    
    // Verify subscription was created
    expect(service.isSubscribed(channelId)).toBe(true);
    
    // Cleanup
    await service.unsubscribeFromChannel(channelId);
    expect(service.isSubscribed(channelId)).toBe(false);
  });
});
```

### Manual Test Procedure
```typescript
// Add temporary test methods for manual verification
public async testHTTPBridge(): Promise<void> {
  console.log('🧪 Testing HTTP Bridge Integration...');
  
  // Test message publication
  const testMessage = await this.sendMessage(
    'test-channel-http',
    'HTTP Bridge Test Message',
    'status'
  );
  
  if (testMessage) {
    console.log('✅ Message publication successful:', testMessage.id);
  } else {
    console.error('❌ Message publication failed');
  }
  
  // Test channel subscription
  await this.subscribeToChannel('test-channel-http');
  console.log('✅ Channel subscription started');
  
  // Wait 10 seconds then cleanup
  setTimeout(() => {
    this.unsubscribeFromChannel('test-channel-http');
    console.log('✅ Test cleanup completed');
  }, 10000);
}

public isSubscribed(channelId: string): boolean {
  return this.subscriptions.has(channelId);
}
```

---

## ✅ **COMPLETION CRITERIA**

- [ ] HTTP bridge configuration added
- [ ] GetAlby publisher integration implemented
- [ ] Multi-bridge fallback logic functional
- [ ] Message polling and subscription working
- [ ] Bridge health monitoring implemented
- [ ] Error handling and retries functional
- [ ] Message encryption/decryption with HTTP bridge
- [ ] Integration tests pass
- [ ] Manual test confirms real relay communication

---

## 🚀 **NEXT TASK**

**Task 1.3**: UI Integration and Real-time Updates
- Update CommunicationPanel to use real HTTP bridge
- Implement real-time message display
- Add connection status indicators

---

**ESTIMATED COMPLETION**: 4-6 hours  
**DEPENDENCIES**: Task 1.1 (Real Nostr Keys)  
**RISK LEVEL**: Medium (external bridge service dependencies)
