import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NostrServiceAdapter } from '../services/NostrServiceAdapter';
import { Message } from '../types';

// Create a mock for NostrService
const mockNostrServiceInstance = {
  initialize: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  joinTeamChannel: vi.fn().mockResolvedValue(undefined),
  subscribeToChannel: vi.fn().mockReturnValue(['sub-id']),
  unsubscribeFromChannel: vi.fn(),
  getTeamChannel: vi.fn().mockImplementation((channelId: string) => ({
    id: channelId || 'test-channel',
    name: 'Test Channel',
    description: 'Test channel description',
    securityLevel: 4,
    participants: ['user1', 'user2'],
    isEncrypted: true,
    allowsAttachments: true,
    maxMessageSize: 10000
  })),
  getTeamChannels: vi.fn().mockReturnValue([{
    id: 'test-channel',
    name: 'Test Channel',
    description: 'Test channel description',
    securityLevel: 4,
    participants: ['user1', 'user2'],
    isEncrypted: true,
    allowsAttachments: true,
    maxMessageSize: 10000
  }]),
  disconnect: vi.fn().mockResolvedValue(undefined),
  // Add emergency coordination methods
  sendEmergencyCoordination: vi.fn().mockImplementation((
    channelId,
    emergencyType,
    urgencyLevel,
    emergencyData
  ) => {
    return Promise.resolve(`emergency-${Date.now()}`);
  }),
  // Add any other methods used by the adapter
};

// Mock NostrService with our mock implementation
vi.mock('../../../services/nostrService', () => ({
  default: {
    getInstance: () => mockNostrServiceInstance
  }
}));

// Mock the logger
vi.mock('../../../utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock UUID generation
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid')
}));

describe('NostrServiceAdapter', () => {
  let adapter: NostrServiceAdapter;
  let messageReceived: Message | null = null;
  
  const mockConfig = {
    endpoints: ['wss://relay1.example.com'],
    fallbackEndpoints: ['wss://relay2.example.com'],
    reconnectStrategy: {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000
    },
    batchSize: 50,
    compressionLevel: 5,
    encryptionAlgorithm: 'aes-256-gcm',
    signatureAlgorithm: 'ed25519'
  };
  
  const mockMessage: Message = {
    id: 'test-message-id',
    senderId: 'test-sender',
    content: 'Test message content',
    timestamp: Date.now(),
    priority: 1,
    channelId: 'test-channel'
  };
  
  // Set up before each test
  beforeEach(() => {
    // Reset the message received
    messageReceived = null;
    
    // Create the adapter
    adapter = new NostrServiceAdapter(mockConfig);
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  // Clean up after each test
  afterEach(() => {
    // Clean up any event listeners
    adapter.disconnect();
  });
  
  it('should initialize with the provided config', () => {
    expect(adapter).toBeDefined();
  });
  
  it('should connect to NostrService', async () => {
    await adapter.connect();
    // Verify that the NostrService initialize method was called
    expect(mockNostrServiceInstance.initialize).toHaveBeenCalled();
  });
  
  it('should register and remove message listeners', () => {
    const messageListener = (message: Message) => {
      messageReceived = message;
    };
    
    adapter.onMessage(messageListener);
    
    // Simulate receiving a message
    const event = new CustomEvent('nostr-message-received', {
      detail: {
        id: 'test-message-id',
        senderId: 'test-sender',
        content: 'Test message content',
        timestamp: Date.now(),
        messageType: 'text',
        channelId: 'test-channel',
        teamId: 'earth-alliance',
        senderDID: 'test-sender-did',
        senderAgency: 'NSA',
        clearanceLevel: 'CONFIDENTIAL',
        encrypted: false,
        pqcEncrypted: false
      }
    });
    
    window.dispatchEvent(event);
    
    // Verify that the message was received
    expect(messageReceived).toBeDefined();
    expect(messageReceived?.id).toBe('test-message-id');
    expect(messageReceived?.senderId).toBe('test-sender');
    expect(messageReceived?.content).toBe('Test message content');
    
    // Remove the listener
    adapter.offMessage(messageListener);
    
    // Reset received message
    messageReceived = null;
    
    // Dispatch another event
    window.dispatchEvent(event);
    
    // Verify that no message was received this time
    expect(messageReceived).toBeNull();
  });
  
  it('should send a message', async () => {
    // Instead of testing the actual method, we'll just verify our mock is being called correctly
    // by mocking the adapter implementation
    adapter['nostrService'] = mockNostrServiceInstance;
    
    // Connect and join channel 
    await adapter.connect();
    await adapter.joinChannel(mockMessage.channelId);
    
    // Now directly call sendMessage
    await adapter.sendMessage(mockMessage);
    
    // Verify that the NostrService sendMessage method was called
    expect(mockNostrServiceInstance.sendMessage).toHaveBeenCalled();
  });
  
  it('should join a channel', async () => {
    await adapter.joinChannel('test-channel');
    
    // Verify that the NostrService joinTeamChannel and subscribeToChannel methods were called
    expect(mockNostrServiceInstance.joinTeamChannel).toHaveBeenCalledWith('test-channel');
    expect(mockNostrServiceInstance.subscribeToChannel).toHaveBeenCalledWith('test-channel');
  });
  
  it('should leave a channel', async () => {
    await adapter.joinChannel('test-channel');
    await adapter.leaveChannel('test-channel');
    
    // Verify that the NostrService unsubscribeFromChannel method was called
    expect(mockNostrServiceInstance.unsubscribeFromChannel).toHaveBeenCalledWith('test-channel');
  });
  
  it('should get channel info', async () => {
    const channel = await adapter.getChannelInfo('test-channel');
    
    // Verify that the NostrService getTeamChannel method was called
    expect(mockNostrServiceInstance.getTeamChannel).toHaveBeenCalledWith('test-channel');
    
    // Verify the returned channel
    expect(channel).toBeDefined();
    expect(channel.id).toBe('test-channel');
    expect(channel.name).toBe('Test Channel');
  });

  it('should handle connection state changes', () => {
    // Spy on the event listener
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    // Simulate connection state change events
    const event1 = new CustomEvent('nostr-connection-state', {
      detail: 'connected'
    });
    
    const event2 = new CustomEvent('nostr-connection-state', {
      detail: 'disconnected'
    });
    
    // This should trigger a reconnect attempt
    vi.spyOn(global, 'setTimeout');
    window.dispatchEvent(event2);
    
    // Verify that setTimeout was called for reconnection
    expect(setTimeout).toHaveBeenCalled();
  });
  
  it('should declare an emergency', async () => {
    // Set the NostrService instance directly
    adapter['nostrService'] = mockNostrServiceInstance;
    adapter['activeChannels'] = new Set(['test-channel']);
    
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    
    await adapter.declareEmergency('Test emergency');
    
    // Verify that the NostrService sendEmergencyCoordination method was called
    expect(mockNostrServiceInstance.sendEmergencyCoordination).toHaveBeenCalled();
    
    // Verify that a custom event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    const customEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(customEvent.type).toBe('nostr-emergency');
  });
  
  it('should resolve an emergency', async () => {
    // Set the NostrService instance directly
    adapter['nostrService'] = mockNostrServiceInstance;
    adapter['activeChannels'] = new Set(['test-channel']);
    adapter['isEmergencyActive'] = true;
    
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    
    await adapter.resolveEmergency();
    
    // Verify that the NostrService sendEmergencyCoordination method was called
    expect(mockNostrServiceInstance.sendEmergencyCoordination).toHaveBeenCalled();
    
    // Verify that a custom event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    const customEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(customEvent.type).toBe('nostr-emergency');
    expect(customEvent.detail.active).toBe(false);
  });
});
