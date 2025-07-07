#!/bin/bash

# Simple type check for NostrChatAdapter.ts
echo "Checking NostrChatAdapter.ts with TypeScript..."
cd /Users/jono/Documents/GitHub/starcom-app/dapp
npx tsc --noEmit src/lib/chat/adapters/NostrChatAdapter.ts

if [ $? -eq 0 ]; then
  echo "✅ NostrChatAdapter passed type checking"
else
  echo "❌ NostrChatAdapter has type errors"
fi
