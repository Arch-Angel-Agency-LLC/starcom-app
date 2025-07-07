#!/bin/bash

# test-chat-adapter.sh
# This script tests the NostrChatAdapter implementation

echo "Testing NostrChatAdapter implementation..."

# Run TypeScript compiler in noEmit mode to check for errors
echo "Running TypeScript compiler check..."
npx tsc --noEmit --project tsconfig.json src/lib/chat/adapters/NostrChatAdapter.ts

if [ $? -eq 0 ]; then
    echo "✅ NostrChatAdapter TypeScript check passed"
else
    echo "❌ NostrChatAdapter TypeScript check failed"
fi

# Check if the adapter can be imported
echo "Testing import..."
NODE_PATH=src node -e "try { require('./src/lib/chat/adapters/NostrChatAdapter'); console.log('✅ NostrChatAdapter import successful'); } catch(e) { console.error('❌ NostrChatAdapter import failed:', e.message); process.exit(1); }"

echo "Test complete."
