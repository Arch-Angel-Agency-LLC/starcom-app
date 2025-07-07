# Unified Chat Adapter Architecture

**Document Version:** 1.0.0  
**Date:** 2025-07-12  
**Status:** Implemented

## Overview

The Unified Chat Adapter Architecture provides a common interface for all chat providers by delegating to the appropriate adapter based on protocol capabilities, channel type, or configuration. This allows the Starcom application to seamlessly use multiple chat backends while presenting a consistent interface to the application code.

## Core Components

### 1. UnifiedChatAdapter

The central component of the architecture, responsible for:

- Routing messages to the appropriate protocol adapter based on channel type
- Capability-based protocol selection for features like file uploads and encryption
- Aggregating results from multiple protocols (e.g., for searches and channel listings)
- Providing a consistent interface that matches the `ChatProviderInterface`

### 2. ProtocolRegistry

A service that maintains information about available chat protocols:

- Registers protocols with their capabilities and metadata
- Provides protocol discovery and selection based on capabilities
- Enables runtime protocol resolution based on feature requirements

### 3. BaseChatAdapter

The foundation for all protocol-specific adapters:

- Implements the `ChatProviderInterface` and `FeatureDetectionInterface`
- Provides default implementations for common functionality
- Handles connection status tracking and event emission
- Manages capability detection and unsupported feature handling

### 4. Protocol-specific Adapters

Individual adapters for each supported protocol:

- `GunChatAdapter`: For Gun-based P2P communications
- `NostrChatAdapter`: For Nostr relay-based communications
- `SecureChatAdapter`: For end-to-end encrypted communications
- Others as needed

## Key Features

### Capability-Based Routing

The architecture automatically routes operations to the most appropriate protocol based on:

1. **Channel Type Mapping**: Each channel type (global, direct, team, etc.) is mapped to a default protocol
2. **Feature Requirements**: Operations requiring specific capabilities are routed to protocols that support them
3. **User Configuration**: Allows for custom routing rules based on user preferences

### Transparent Protocol Switching

The application can switch between protocols without changing its code:

- Channels of different types can use different protocols
- If a protocol is unavailable, the system can fall back to alternatives
- Protocol selection is abstracted away from application code

### Comprehensive Feature Detection

The architecture includes a robust feature detection system:

- Each adapter declares its capabilities through a standardized interface
- Runtime capability checking prevents operations that aren't supported
- Graceful degradation when features aren't available

### Error Handling

The architecture provides consistent error handling across protocols:

- Connection errors are standardized and propagated appropriately
- Unsupported feature errors include detailed context
- Operation failures are logged with protocol-specific details

## Usage Patterns

### Basic Usage

```typescript
// Create the unified adapter
const chatAdapter = new UnifiedChatAdapter({
  userId: 'user123',
  userName: 'Alice'
});

// Connect to all required protocols
await chatAdapter.connect();

// Send a message to a channel (automatically uses the right protocol)
const message = await chatAdapter.sendMessage('team-456', 'Hello team!');
```

### Capability-Based Protocol Selection

```typescript
// Automatic selection based on channel type
const encryptedChannel = await chatAdapter.createChannel(
  'Secure Communications',
  'encrypted',
  ['user123', 'user456']
);

// The encrypted channel automatically uses a protocol that supports encryption
await chatAdapter.sendMessage(encryptedChannel.id, 'This message is encrypted');
```

### Handling Unsupported Features

```typescript
try {
  // This will only work if the selected protocol supports reactions
  await chatAdapter.addReaction('message-123', 'channel-456', '👍');
} catch (error) {
  // Handle the case where reactions aren't supported
  console.log('Reactions not supported in this channel');
}
```

## Implementation Details

### Channel Type Mapping

The default mapping of channel types to protocols:

| Channel Type | Default Protocol |
|--------------|------------------|
| global       | gun              |
| group        | nostr            |
| team         | securechat       |
| direct       | nostr            |
| broadcast    | nostr            |
| thread       | gun              |
| encrypted    | securechat       |
| temporary    | gun              |

### Channel ID Patterns

The adapter uses channel ID patterns to determine the channel type:

- `global`: The global channel
- `team-*`: Team channels
- `dm-*`: Direct message channels
- `broadcast-*`: Broadcast channels
- `thread-*`: Thread channels
- `encrypted-*`: Encrypted channels
- `temp-*`: Temporary channels

### Protocol Capabilities

Each protocol adapter declares its capabilities, including:

- **Messaging capabilities**: messaging, channels, presence, attachments, etc.
- **Security features**: encryption, e2e_encryption, forward_secrecy, etc.
- **Connection types**: p2p, server_based, relay_based
- **Storage options**: persistent_history, message_expiry, etc.

## Future Enhancements

1. **Dynamic Protocol Loading**: Load protocol adapters on-demand to reduce initial load time
2. **Channel Migration**: Support for migrating channels between protocols
3. **Hybrid Channels**: Channels that use multiple protocols simultaneously for different features
4. **Custom Protocol Selection Rules**: Allow applications to define custom rules for protocol selection
5. **Protocol Health Monitoring**: Automatic failover based on protocol health metrics

## Conclusion

The Unified Chat Adapter Architecture enables the Starcom application to leverage multiple chat protocols seamlessly, providing a consistent interface while taking advantage of the unique strengths of each protocol. This architecture supports the current needs of the application while allowing for future expansion to new protocols and features.

---

*Earth Alliance Technical Documentation*
