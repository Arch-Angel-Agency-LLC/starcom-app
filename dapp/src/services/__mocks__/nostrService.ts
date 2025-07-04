import { vi } from 'vitest';

// Define types for our mock to match the adapter expectations
interface MockTeamChannel {
  id: string;
  name: string;
  description: string;
  securityLevel: number;
  participants: string[];
  isEncrypted: boolean;
  allowsAttachments: boolean;
  maxMessageSize: number;
}

// Singleton mock instance
const mockNostrServiceInstance = {
  initialize: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  joinTeamChannel: vi.fn().mockResolvedValue(undefined),
  subscribeToChannel: vi.fn().mockReturnValue(['sub-id']),
  unsubscribeFromChannel: vi.fn(),
  getTeamChannel: vi.fn().mockImplementation((channelId: string): MockTeamChannel => ({
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
  // Add any other methods used by the adapter
};

// NostrService singleton implementation
class MockNostrService {
  private static instance: MockNostrService;

  private constructor() {}

  public static getInstance(): typeof mockNostrServiceInstance {
    if (!MockNostrService.instance) {
      // We cast to any to avoid TypeScript errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      MockNostrService.instance = new MockNostrService() as any;
    }
    return mockNostrServiceInstance;
  }
}

export default MockNostrService;
