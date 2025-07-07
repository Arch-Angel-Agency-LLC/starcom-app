#!/bin/bash

# test-unified-adapter.sh
# Script to run tests for the UnifiedChatAdapter

echo "🔄 Starting UnifiedChatAdapter tests..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run the tests using Vitest
echo "🧪 Running UnifiedChatAdapter tests with Vitest..."
npx vitest run src/lib/chat/__tests__/UnifiedChatAdapter.test.ts --config vitest.chat.config.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ UnifiedChatAdapter tests passed!"
    echo "✨ All UnifiedChatAdapter tests completed successfully!"
    exit 0
else
    echo "❌ UnifiedChatAdapter tests failed!"
    exit 1
fi
