#!/bin/bash

# test-direct-mock-secure-chat-adapter.sh
# Script to run the direct mock test for the SecureChatAdapter

echo "🔄 Starting Direct Mock SecureChatAdapter tests..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run the tests using Vitest
echo "🧪 Running Direct Mock SecureChatAdapter tests with Vitest..."
npx vitest run src/lib/chat/__tests__/direct-mock-secure-chat-adapter.test.ts --config vitest.chat.config.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Direct Mock SecureChatAdapter tests passed!"
    echo "✨ All Direct Mock SecureChatAdapter tests completed successfully!"
    exit 0
else
    echo "❌ Direct Mock SecureChatAdapter tests failed!"
    exit 1
fi
