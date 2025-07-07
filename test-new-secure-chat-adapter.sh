#!/bin/bash

# test-new-secure-chat-adapter.sh
# Script to run the new test for the SecureChatAdapter

echo "🔄 Starting New SecureChatAdapter tests..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run the tests using Vitest
echo "🧪 Running New SecureChatAdapter tests with Vitest..."
npx vitest run src/lib/chat/__tests__/new-secure-chat-adapter.test.ts --config vitest.chat.config.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ New SecureChatAdapter tests passed!"
    echo "✨ All New SecureChatAdapter tests completed successfully!"
    exit 0
else
    echo "❌ New SecureChatAdapter tests failed!"
    exit 1
fi
