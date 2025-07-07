#!/bin/bash

# test-secure-chat-adapter.sh
# Script to run tests for the SecureChatAdapter

echo "🔄 Starting SecureChatAdapter tests..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run the tests using Vitest
echo "🧪 Running SecureChatAdapter tests with Vitest..."
npx vitest run src/lib/chat/__tests__/SecureChatAdapter.test.ts --config vitest.chat.config.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ SecureChatAdapter tests passed!"
    echo "✨ All SecureChatAdapter tests completed successfully!"
    exit 0
else
    echo "❌ SecureChatAdapter tests failed!"
    exit 1
fi
