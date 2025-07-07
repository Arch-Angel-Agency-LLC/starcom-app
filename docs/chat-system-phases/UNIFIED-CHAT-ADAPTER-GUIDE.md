# UnifiedChatAdapter Developer Guide

## Introduction
The `UnifiedChatAdapter` is a central component of the chat system, implementing a facade pattern to provide a unified interface for all chat operations. It intelligently delegates operations to specialized protocol adapters based on channel type, capabilities, or configuration.

## Key Concepts

### Protocol Registry
The adapter uses the `ProtocolRegistry` to discover available protocols and their capabilities. The registry manages protocol metadata and allows for capability-based protocol selection.

### Capability-Based Routing
Operations are routed to the most appropriate adapter based on the required capabilities. For example, end-to-end encrypted messages will be routed to adapters that support encryption.

### Channel Type Mapping
Different channel types (global, group, team, direct, etc.) can be mapped to specific protocols. This mapping can be configured when creating the adapter.

## Using the UnifiedChatAdapter

### Basic Setup

```typescript
import { UnifiedChatAdapter } from '../lib/chat/adapters/UnifiedChatAdapter';

// Create the adapter with default options
const chatAdapter = new UnifiedChatAdapter({
  userId: 'user-123',
  userName: 'User Name',
  // Optional: specify a default protocol
  defaultProtocol: 'nostr',
  // Optional: map channel types to specific protocols
  channelMapping: {
    global: 'gun',
    group: 'nostr',
    team: 'securechat',
    direct: 'nostr',
    encrypted: 'securechat'
  }
});

// Connect to all required protocol adapters
await chatAdapter.connect();
```

### Sending Messages

The adapter will automatically route messages to the appropriate protocol adapter based on the channel ID:

```typescript
// Send a message to a global channel (will use Gun)
await chatAdapter.sendMessage('global', 'Hello world!');

// Send a message to a team channel (will use SecureChat)
await chatAdapter.sendMessage('team-123', 'Team message');

// Send a message to a direct message channel (will use Nostr)
await chatAdapter.sendMessage('dm-456', 'Direct message');
```

### Creating Channels

When creating channels, the adapter uses the channel type to determine which protocol to use:

```typescript
// Create a global channel (will use Gun)
const globalChannel = await chatAdapter.createChannel('Global Chat', 'global', []);

// Create a team channel (will use SecureChat)
const teamChannel = await chatAdapter.createChannel('Team Chat', 'team', ['user1', 'user2']);

// Create a direct message channel (will use Nostr)
const dmChannel = await chatAdapter.createChannel('DM Chat', 'direct', ['user1', 'user2']);
```

### Working with Messages and Channels

All standard chat operations are supported and will be routed to the appropriate adapter:

```typescript
// Get messages from a channel
const messages = await chatAdapter.getMessages('team-123');

// Subscribe to new messages
const unsubscribe = chatAdapter.subscribeToMessages('team-123', (message) => {
  console.log('New message:', message);
});

// Get all channels
const channels = await chatAdapter.getChannels();

// Get users in a channel
const users = await chatAdapter.getUsers('team-123');

// Mark messages as read
await chatAdapter.markMessagesAsRead('team-123', ['msg-1', 'msg-2']);
```

### Advanced Features

The adapter supports capability-based protocol selection for operations that may require special features:

```typescript
// Get the best protocol for a set of required capabilities
const protocolId = chatAdapter.getBestProtocolForCapabilities(['encryption', 'forward_secrecy']);

// Get an adapter by capabilities
const adapter = chatAdapter.getAdapterByCapabilities({
  requiredCapabilities: ['encryption', 'p2p'],
  preferredCapabilities: ['forward_secrecy'],
  excludedProtocols: ['centralizedProtocol']
});
```

## Implementation Details

### Channel ID Format
The adapter uses channel ID prefixes to determine the channel type:

- `global`: Global channels
- `team-*`: Team channels
- `dm-*`: Direct message channels
- `broadcast-*`: Broadcast channels
- `thread-*`: Thread channels
- `encrypted-*`: Encrypted channels
- `temp-*`: Temporary channels

### Test Environment Support
In test environments, the adapter creates mock adapters instead of loading the real implementations:

```typescript
// In test code
process.env.NODE_ENV = 'test';
const adapter = new UnifiedChatAdapter(options);
await adapter.connect(); // Will use mock adapters
```

## Error Handling
The adapter implements robust error handling for all operations:

```typescript
try {
  await chatAdapter.sendMessage('channel-id', 'Message');
} catch (error) {
  console.error('Failed to send message:', error);
  // Handle the error appropriately
}
```

## Best Practices

1. **Connection Management**: Always connect before using the adapter and disconnect when done:
   ```typescript
   await chatAdapter.connect();
   // Use the adapter...
   await chatAdapter.disconnect();
   ```

2. **Error Handling**: Wrap operations in try/catch blocks to handle errors gracefully

3. **Channel Type Consistency**: Maintain consistent channel ID prefixes for proper routing

4. **Resource Cleanup**: Unsubscribe from subscriptions when no longer needed:
   ```typescript
   const unsubscribe = chatAdapter.subscribeToMessages(channelId, callback);
   // Later...
   unsubscribe();
   ```

5. **Capability Awareness**: Be mindful of the capabilities required for operations

## Troubleshooting

- **Incorrect Protocol Selection**: Verify channel ID format and channel mapping configuration
- **Connection Issues**: Check that required protocol adapters are available and properly configured
- **Missing Capabilities**: Ensure the required protocol with necessary capabilities is registered and enabled
- **Initialization Problems**: Verify the adapter is properly connected before use
