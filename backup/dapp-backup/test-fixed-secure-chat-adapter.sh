#!/bin/bash

# test-fixed-secure-chat-adapter.sh
# Script to run the fixed tests for the SecureChatAdapter

echo "🔄 Starting Fixed SecureChatAdapter tests..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run the tests using Vitest
echo "🧪 Running Fixed SecureChatAdapter tests with Vitest..."
npx vitest run src/lib/chat/__tests__/fixed-secure-chat-adapter.test.ts --config vitest.chat.config.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Fixed SecureChatAdapter tests passed!"
    echo "✨ All Fixed SecureChatAdapter tests completed successfully!"
    exit 0
else
    echo "❌ Fixed SecureChatAdapter tests failed!"
    exit 1
fi
