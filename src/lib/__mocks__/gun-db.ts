/**
 * This is a mock file for testing GunChatAdapter
 */

import { vi } from 'vitest';

// Create mock gun instance
const createMockGun = () => {
  const mockData = new Map<string, any>();
  
  const createMockGunInstance = (path = ''): any => {
    const gunInstance = {
      // Mock implementations of Gun methods
      get: vi.fn((key: string) => {
        const newPath = path ? `${path}.${key}` : key;
        return createMockGunInstance(newPath);
      }),
      put: vi.fn((data: any) => {
        if (path) {
          mockData.set(path, { ...(mockData.get(path) || {}), ...data });
        }
        return gunInstance;
      }),
      set: vi.fn((data: any) => {
        if (path) {
          const existingData = mockData.get(path) || [];
          if (Array.isArray(existingData)) {
            existingData.push(data);
            mockData.set(path, existingData);
          } else {
            mockData.set(path, [data]);
          }
        }
        return gunInstance;
      }),
      on: vi.fn((callback: (data: any, key: string) => void) => {
        if (path && mockData.has(path)) {
          callback(mockData.get(path), path.split('.').pop() || '');
        }
        return gunInstance;
      }),
      once: vi.fn((callback: (data: any, key: string) => void) => {
        if (path && mockData.has(path)) {
          callback(mockData.get(path), path.split('.').pop() || '');
        }
        return gunInstance;
      }),
      off: vi.fn(() => gunInstance),
      map: vi.fn(() => gunInstance),
      // Add any other methods needed
    };
    return gunInstance;
  };
  
  return createMockGunInstance();
};

// Export mock gun and user
export const gun = createMockGun();
export const user = {
  get: vi.fn(() => gun.get('user')),
  auth: vi.fn(() => Promise.resolve(true)),
  create: vi.fn(() => Promise.resolve(true)),
  leave: vi.fn(() => Promise.resolve(true)),
  recall: vi.fn(() => user),
  // Add other user methods as needed
};

// Mock for SEA (Security, Encryption, Authorization)
export const SEA = {
  encrypt: vi.fn((data, pair) => Promise.resolve(`encrypted:${JSON.stringify(data)}`)),
  decrypt: vi.fn((data, pair) => {
    if (typeof data === 'string' && data.startsWith('encrypted:')) {
      return Promise.resolve(JSON.parse(data.substring(10)));
    }
    return Promise.resolve(data);
  }),
  pair: vi.fn(() => Promise.resolve({ pub: 'mockPublicKey', priv: 'mockPrivateKey', epub: 'mockEpub', epriv: 'mockEpriv' })),
  sign: vi.fn((data, pair) => Promise.resolve(`signed:${JSON.stringify(data)}`)),
  verify: vi.fn((data, pair) => {
    if (typeof data === 'string' && data.startsWith('signed:')) {
      return Promise.resolve(JSON.parse(data.substring(7)));
    }
    return Promise.resolve(data);
  }),
};
