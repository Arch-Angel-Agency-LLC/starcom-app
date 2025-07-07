#!/bin/bash

# Script to type-check the chat adapters with the dedicated tsconfig

echo "Checking chat adapters with specialized TypeScript config..."
npx tsc --project tsconfig.chat.json --noEmit

if [ $? -eq 0 ]; then
  echo "✅ Chat adapters have no type errors!"
  exit 0
else
  echo "❌ Chat adapters have type errors"
  exit 1
fi
