# NostrService Integration Guide

This document outlines the integration between the Earth Alliance Communication Panel and the NostrService for secure, decentralized communications.

## Overview

The Earth Alliance Communication Panel leverages the NostrService to provide secure, censorship-resistant messaging capabilities. The integration is handled through the `NostrServiceAdapter` class, which adapts the NostrService API to the specific needs of the Communication Panel.

## NostrService Architecture

The NostrService is built on the Nostr protocol, which provides:
- **Decentralized relays**: Messages are distributed across multiple relay servers
- **Public-key cryptography**: All messages are signed and optionally encrypted
- **Event-based messaging**: Uses a flexible event format for different message types
- **Censorship resistance**: No central point of control or censorship

## NostrServiceAdapter

The `NostrServiceAdapter` class serves as a bridge between the Communication Panel components and the NostrService. It handles:

1. **Connection management**: Establishing and maintaining connections to Nostr relays
2. **Message handling**: Sending, receiving, and queuing messages
3. **Channel management**: Joining, leaving, and listing channels
4. **Emergency protocols**: Declaring and resolving emergency situations
5. **Event conversion**: Converting between NostrService events and Communication Panel types

### Key Methods

```typescript
// Initialize adapter with configuration
constructor(config: NostrConfig)

// Connection management
async connect(): Promise<void>
async disconnect(): Promise<void>

// Message handling
onMessage(callback: (message: Message) => void): void
offMessage(callback: (message: Message) => void): void
async sendMessage(message: Message): Promise<void>

// Channel management
async joinChannel(channelId: string): Promise<Channel>
async leaveChannel(channelId: string): Promise<void>
async getChannels(): Promise<Channel[]>
async getChannelInfo(channelId: string): Promise<Channel>

// Emergency functionality
async declareEmergency(reason: string): Promise<void>
async resolveEmergency(): Promise<void>
```

## Event Handling

The NostrServiceAdapter listens for the following events from NostrService:

1. `nostr-message-received`: When a new message is received
2. `nostr-connection-state`: When connection state changes
3. `earth-alliance-emergency-coordination`: When emergency coordination messages are sent

And dispatches the following events:

1. `nostr-emergency`: When emergency mode is activated or deactivated

### Event Listener Example

```typescript
// Set up event listeners for the NostrService
private setupEventListeners() {
  // Listen for message events
  this.eventListeners.message = ((event: CustomEvent<NostrMessage>) => {
    const nostrMessage = event.detail;
    const message = this.convertNostrMessageToMessage(nostrMessage);
    
    // Notify all listeners
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        logger.error('Error in message listener:', error);
      }
    });
  }) as EventListener;
  
  window.addEventListener('nostr-message-received', this.eventListeners.message);
  
  // ... additional event listeners
}
```

## Emergency Coordination

The NostrService provides special methods for emergency communication:

```typescript
// Send emergency coordination message
public async sendEmergencyCoordination(
  channelId: string,
  emergencyType: 'operational_security' | 'member_compromise' | 'evidence_critical' | 'timeline_threat',
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
  emergencyData: {
    description: string;
    actionRequired: string;
    timeframe: string;
    affectedRegions: string[];
    resourcesNeeded: string[];
  }
): Promise<string>
```

## Usage in CommunicationProvider

The `CommunicationProvider` component initializes the NostrServiceAdapter and provides it to all child components:

```typescript
export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({ 
  children, 
  config 
}) => {
  // Initialize NostrServiceAdapter
  const [adapter] = useState(() => new NostrServiceAdapter(config));
  
  // ... state and effect hooks
  
  // Connect to NostrService on mount
  useEffect(() => {
    adapter.connect().catch(err => {
      console.error('Failed to connect to NostrService:', err);
    });
    
    return () => {
      adapter.disconnect().catch(err => {
        console.error('Error disconnecting from NostrService:', err);
      });
    };
  }, [adapter]);
  
  // ... context provider
};
```

## Error Handling and Reconnection

The adapter implements sophisticated error handling and reconnection strategies:

1. **Automatic reconnection**: Attempts to reconnect with exponential backoff
2. **Message queuing**: Messages sent during disconnection are queued for delivery
3. **Graceful degradation**: Continues to function with limited capabilities during connection issues
4. **Fallback relays**: Switches to backup relays when primary relays are unavailable

## Testing

The integration with NostrService is tested in `NostrServiceAdapter.test.tsx`, which verifies:
1. Connection management
2. Message sending and receiving
3. Channel operations
4. Emergency functionality

## Security Considerations

1. **Message encryption**: All sensitive messages are end-to-end encrypted
2. **Authentication**: Users are authenticated using their DID (Decentralized Identifier)
3. **Post-Quantum Cryptography**: Preparation for quantum-resistant cryptography
4. **Security audits**: Regular security audits of the integration code

## Future Enhancements

1. **Enhanced reliability**: Improved message delivery guarantees
2. **Performance optimization**: Batching and compression for high-volume scenarios
3. **Advanced analytics**: Message delivery metrics and performance monitoring
4. **Additional relay strategies**: Dynamic relay selection based on performance and reliability
