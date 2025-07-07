#!/bin/bash

# test-secure-chat-adapter-new-approach.sh
# Script to run the new test approach for the SecureChatAdapter

echo "🔄 Starting Test SecureChatAdapter with new approach..."

# Change to the dapp directory
cd "$(dirname "$0")" || exit 1

# Run the tests using Vitest
echo "🧪 Running Test SecureChatAdapter tests with Vitest..."
npx vitest run src/lib/chat/__tests__/test-secure-chat-adapter.test.ts --config vitest.chat.config.ts

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Test SecureChatAdapter tests passed!"
    echo "✨ All Test SecureChatAdapter tests completed successfully!"
    exit 0
else
    echo "❌ Test SecureChatAdapter tests failed!"
    echo "Please check the output above for details."
    exit 1
fi
