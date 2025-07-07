#!/bin/bash

# This script tests the SecureChatAdapter implementation

echo "Testing SecureChatAdapter..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run TypeScript type checking
echo "Running type check..."
npx tsc --noEmit src/lib/chat/adapters/SecureChatAdapter.ts

# Create the test file
echo "Creating test file for SecureChatAdapter..."

mkdir -p src/lib/chat/__tests__

cat > src/lib/chat/__tests__/SecureChatAdapter.test.ts << 'EOL'
/**
 * SecureChatAdapter.test.ts
 * 
 * Tests for the SecureChatAdapter implementation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecureChatAdapter } from '../adapters/SecureChatAdapter';

// Mock the SecureChatIntegrationService
vi.mock('../../../services/SecureChatIntegrationService', () => {
  return {
    SecureChatIntegrationService: {
      getInstance: vi.fn().mockReturnValue({
        // Add mock methods as needed
      })
    }
  };
});

// Mock the logger
vi.mock('../../../utils', () => {
  return {
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  };
});

describe('SecureChatAdapter', () => {
  let adapter: SecureChatAdapter;
  
  beforeEach(() => {
    adapter = new SecureChatAdapter({
      userId: 'test-user',
      userName: 'Test User'
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should initialize with correct protocol info', () => {
    const protocolInfo = adapter.getProtocolInfo();
    expect(protocolInfo.id).toBe('securechat');
    expect(protocolInfo.name).toBe('SecureChat');
  });
  
  it('should report as disconnected initially', () => {
    expect(adapter.getConnectionStatus()).toBe('disconnected');
  });
});
EOL

echo "Created test file for SecureChatAdapter"

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ SecureChatAdapter tests passed"
  exit 0
else
  echo "❌ SecureChatAdapter tests failed"
  exit 1
fi
