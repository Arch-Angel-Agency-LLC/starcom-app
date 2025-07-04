/**
 * Setup file for UnifiedChatAdapter tests
 */

import { vi } from 'vitest';

// Mock fetch globally with proper Response interface
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue('')
});

// Mock adapters
vi.mock('../adapters/GunChatAdapter', () => {
  return {
    GunChatAdapter: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getConnectionStatus: vi.fn().mockReturnValue('connected'),
      getConnectionDetails: vi.fn().mockReturnValue({ status: 'connected' }),
      getProtocolInfo: vi.fn().mockReturnValue({
        id: 'gun',
        name: 'Gun',
        version: '1.0.0',
        description: 'Gun-based chat adapter',
        isP2P: true,
        isServerless: true,
        isEncrypted: false
      }),
      getCapabilities: vi.fn().mockReturnValue({
        messaging: true,
        channels: true,
        p2p: true,
        attachments: true,
        fileAttachments: true,
        // Add other capabilities
      }),
      hasCapability: vi.fn().mockReturnValue(true),
      hasFeature: vi.fn().mockReturnValue(true),
      getFeatures: vi.fn().mockReturnValue(['connect', 'disconnect']),
      sendMessage: vi.fn().mockResolvedValue({
        id: 'msg-1',
        senderId: 'user-123',
        senderName: 'Test User',
        content: 'Test message',
        timestamp: Date.now(),
        channelId: 'global'
      }),
      getMessages: vi.fn().mockResolvedValue([]),
      subscribeToMessages: vi.fn().mockReturnValue(() => {}),
      createChannel: vi.fn().mockResolvedValue({
        id: 'channel-1',
        name: 'Test Channel',
        type: 'global',
        participants: []
      }),
      joinChannel: vi.fn().mockResolvedValue(undefined),
      leaveChannel: vi.fn().mockResolvedValue(undefined),
      getChannels: vi.fn().mockResolvedValue([]),
      getUsers: vi.fn().mockResolvedValue([]),
      getUserById: vi.fn().mockResolvedValue(null),
      subscribeToUserPresence: vi.fn().mockReturnValue(() => {}),
      markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
      searchMessages: vi.fn().mockResolvedValue({
        messages: [],
        totalResults: 0,
        hasMore: false
      }),
      uploadAttachment: vi.fn().mockResolvedValue({ id: 'attachment-1', url: 'https://example.com/file.jpg' }),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn()
    }))
  };
});

vi.mock('../adapters/NostrChatAdapter', () => {
  return {
    NostrChatAdapter: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getConnectionStatus: vi.fn().mockReturnValue('connected'),
      getConnectionDetails: vi.fn().mockReturnValue({ status: 'connected' }),
      getProtocolInfo: vi.fn().mockReturnValue({
        id: 'nostr',
        name: 'Nostr',
        version: '1.0.0',
        description: 'Nostr-based chat adapter',
        isP2P: false,
        isServerless: false,
        isEncrypted: true
      }),
      getCapabilities: vi.fn().mockReturnValue({
        messaging: true,
        channels: true,
        relay_based: true,
        encryption: true,
        reactions: true,
        messageReactions: true,
        // Add other capabilities
      }),
      hasCapability: vi.fn().mockReturnValue(true),
      hasFeature: vi.fn().mockReturnValue(true),
      getFeatures: vi.fn().mockReturnValue(['connect', 'disconnect']),
      sendMessage: vi.fn().mockResolvedValue({
        id: 'msg-2',
        senderId: 'user-123',
        senderName: 'Test User',
        content: 'Test message',
        timestamp: Date.now(),
        channelId: 'dm-123'
      }),
      getMessages: vi.fn().mockResolvedValue([]),
      subscribeToMessages: vi.fn().mockReturnValue(() => {}),
      createChannel: vi.fn().mockResolvedValue({
        id: 'channel-2',
        name: 'Test Channel',
        type: 'direct',
        participants: []
      }),
      joinChannel: vi.fn().mockResolvedValue(undefined),
      leaveChannel: vi.fn().mockResolvedValue(undefined),
      getChannels: vi.fn().mockResolvedValue([]),
      getUsers: vi.fn().mockResolvedValue([]),
      getUserById: vi.fn().mockResolvedValue(null),
      subscribeToUserPresence: vi.fn().mockReturnValue(() => {}),
      markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
      searchMessages: vi.fn().mockResolvedValue({
        messages: [],
        totalResults: 0,
        hasMore: false
      }),
      uploadAttachment: vi.fn().mockResolvedValue({ id: 'attachment-2', url: 'https://example.com/file.jpg' }),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn()
    }))
  };
});

vi.mock('../adapters/SecureChatAdapter', () => {
  return {
    SecureChatAdapter: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getConnectionStatus: vi.fn().mockReturnValue('connected'),
      getConnectionDetails: vi.fn().mockReturnValue({ status: 'connected' }),
      getProtocolInfo: vi.fn().mockReturnValue({
        id: 'securechat',
        name: 'SecureChat',
        version: '1.0.0',
        description: 'Secure end-to-end encrypted chat adapter',
        isP2P: false,
        isServerless: false,
        isEncrypted: true
      }),
      getCapabilities: vi.fn().mockReturnValue({
        messaging: true,
        channels: true,
        encryption: true,
        e2e_encryption: true,
        forward_secrecy: true,
        endToEndEncryption: true,
        // Add other capabilities
      }),
      hasCapability: vi.fn().mockReturnValue(true),
      hasFeature: vi.fn().mockReturnValue(true),
      getFeatures: vi.fn().mockReturnValue(['connect', 'disconnect']),
      sendMessage: vi.fn().mockResolvedValue({
        id: 'msg-3',
        senderId: 'user-123',
        senderName: 'Test User',
        content: 'Test message',
        timestamp: Date.now(),
        channelId: 'team-123'
      }),
      getMessages: vi.fn().mockResolvedValue([]),
      subscribeToMessages: vi.fn().mockReturnValue(() => {}),
      createChannel: vi.fn().mockResolvedValue({
        id: 'channel-3',
        name: 'Test Channel',
        type: 'team',
        participants: []
      }),
      joinChannel: vi.fn().mockResolvedValue(undefined),
      leaveChannel: vi.fn().mockResolvedValue(undefined),
      getChannels: vi.fn().mockResolvedValue([]),
      getUsers: vi.fn().mockResolvedValue([]),
      getUserById: vi.fn().mockResolvedValue(null),
      subscribeToUserPresence: vi.fn().mockReturnValue(() => {}),
      markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
      searchMessages: vi.fn().mockResolvedValue({
        messages: [],
        totalResults: 0,
        hasMore: false
      }),
      uploadAttachment: vi.fn().mockResolvedValue({ id: 'attachment-3', url: 'https://example.com/file.jpg' }),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn()
    }))
  };
});

// Mock ProtocolRegistry
vi.mock('../ProtocolRegistry', () => {
  return {
    ProtocolRegistry: {
      getInstance: vi.fn().mockReturnValue({
        registerProtocol: vi.fn(),
        unregisterProtocol: vi.fn(),
        getProtocol: vi.fn().mockImplementation((id) => {
          if (id === 'gun') {
            return {
              id: 'gun',
              name: 'Gun',
              adapterClass: 'GunChatAdapter',
              adapterPath: '../adapters/GunChatAdapter',
              defaultEndpoints: ['https://gun-server.example.com'],
              defaultCapabilities: {
                messaging: true,
                channels: true,
                p2p: true,
                attachments: true,
                fileAttachments: true
              },
              isEnabled: true,
              priority: 1
            };
          } else if (id === 'nostr') {
            return {
              id: 'nostr',
              name: 'Nostr',
              adapterClass: 'NostrChatAdapter',
              adapterPath: '../adapters/NostrChatAdapter',
              defaultEndpoints: ['wss://nostr-relay.example.com'],
              defaultCapabilities: {
                messaging: true,
                channels: true,
                relay_based: true,
                encryption: true,
                reactions: true,
                messageReactions: true
              },
              isEnabled: true,
              priority: 2
            };
          } else if (id === 'securechat') {
            return {
              id: 'securechat',
              name: 'SecureChat',
              adapterClass: 'SecureChatAdapter',
              adapterPath: '../adapters/SecureChatAdapter',
              defaultEndpoints: ['https://securechat.example.com'],
              defaultCapabilities: {
                messaging: true,
                channels: true,
                encryption: true,
                e2e_encryption: true,
                forward_secrecy: true,
                endToEndEncryption: true
              },
              isEnabled: true,
              priority: 3
            };
          }
          return undefined;
        }),
        getAllProtocols: vi.fn().mockReturnValue([
          {
            id: 'gun',
            name: 'Gun',
            adapterClass: 'GunChatAdapter',
            adapterPath: '../adapters/GunChatAdapter',
            defaultEndpoints: ['https://gun-server.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              p2p: true,
              attachments: true
            },
            isEnabled: true,
            priority: 1
          },
          {
            id: 'nostr',
            name: 'Nostr',
            adapterClass: 'NostrChatAdapter',
            adapterPath: '../adapters/NostrChatAdapter',
            defaultEndpoints: ['wss://nostr-relay.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              relay_based: true,
              encryption: true,
              reactions: true
            },
            isEnabled: true,
            priority: 2
          },
          {
            id: 'securechat',
            name: 'SecureChat',
            adapterClass: 'SecureChatAdapter',
            adapterPath: '../adapters/SecureChatAdapter',
            defaultEndpoints: ['https://securechat.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              encryption: true,
              e2e_encryption: true,
              forward_secrecy: true
            },
            isEnabled: true,
            priority: 3
          }
        ]),
        getEnabledProtocols: vi.fn().mockReturnValue([
          {
            id: 'gun',
            name: 'Gun',
            adapterClass: 'GunChatAdapter',
            adapterPath: '../adapters/GunChatAdapter',
            defaultEndpoints: ['https://gun-server.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              p2p: true,
              attachments: true
            },
            isEnabled: true,
            priority: 1
          },
          {
            id: 'nostr',
            name: 'Nostr',
            adapterClass: 'NostrChatAdapter',
            adapterPath: '../adapters/NostrChatAdapter',
            defaultEndpoints: ['wss://nostr-relay.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              relay_based: true,
              encryption: true,
              reactions: true
            },
            isEnabled: true,
            priority: 2
          },
          {
            id: 'securechat',
            name: 'SecureChat',
            adapterClass: 'SecureChatAdapter',
            adapterPath: '../adapters/SecureChatAdapter',
            defaultEndpoints: ['https://securechat.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              encryption: true,
              e2e_encryption: true,
              forward_secrecy: true
            },
            isEnabled: true,
            priority: 3
          }
        ]),
        getProtocolsByCapability: vi.fn().mockReturnValue([]),
        getProtocolsByCapabilities: vi.fn().mockReturnValue([]),
        selectProtocol: vi.fn().mockReturnValue({
          selectedProtocol: {
            id: 'securechat',
            name: 'SecureChat',
            adapterClass: 'SecureChatAdapter',
            adapterPath: '../adapters/SecureChatAdapter',
            defaultEndpoints: ['https://securechat.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              encryption: true,
              e2e_encryption: true,
              forward_secrecy: true
            },
            isEnabled: true,
            priority: 3
          },
          alternativeProtocols: [],
          matchScore: 1,
          reason: 'Protocol selected based on required and preferred capabilities'
        }),
        listProtocols: vi.fn().mockReturnValue([
          {
            id: 'gun',
            name: 'Gun',
            adapterClass: 'GunChatAdapter',
            adapterPath: '../adapters/GunChatAdapter',
            defaultEndpoints: ['https://gun-server.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              p2p: true,
              attachments: true
            },
            isEnabled: true,
            priority: 1
          },
          {
            id: 'nostr',
            name: 'Nostr',
            adapterClass: 'NostrChatAdapter',
            adapterPath: '../adapters/NostrChatAdapter',
            defaultEndpoints: ['wss://nostr-relay.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              relay_based: true,
              encryption: true,
              reactions: true
            },
            isEnabled: true,
            priority: 2
          },
          {
            id: 'securechat',
            name: 'SecureChat',
            adapterClass: 'SecureChatAdapter',
            adapterPath: '../adapters/SecureChatAdapter',
            defaultEndpoints: ['https://securechat.example.com'],
            defaultCapabilities: {
              messaging: true,
              channels: true,
              encryption: true,
              e2e_encryption: true,
              forward_secrecy: true
            },
            isEnabled: true,
            priority: 3
          }
        ])
      })
    }
  };
});

// Mock logger
vi.mock('../../../utils', () => {
  return {
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  };
});
