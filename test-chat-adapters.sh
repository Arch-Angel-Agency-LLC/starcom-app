#!/bin/bash

# Script to test the chat adapter implementations

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Chat Adapter Tests${NC}"

# Set up specific TypeScript config for the chat tests
echo -e "${YELLOW}Checking TypeScript configuration...${NC}"

if [ ! -f "./tsconfig.chat.json" ]; then
  echo -e "${RED}Error: tsconfig.chat.json not found${NC}"
  exit 1
fi

# Check for any TypeScript errors in the chat module
echo -e "${YELLOW}Type checking chat adapters...${NC}"
npx tsc --project tsconfig.chat.json --noEmit

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ No TypeScript errors in chat adapters${NC}"
else
  echo -e "${RED}❌ TypeScript errors found in chat adapters${NC}"
  echo -e "${YELLOW}Continuing with tests anyway...${NC}"
fi

# Run the adapter-specific tests
echo -e "${YELLOW}Running chat adapter tests...${NC}"
npx vitest run "src/lib/chat/__tests__/.*ChatAdapter.test.ts" --config vitest.chat.config.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ All chat adapter tests passed${NC}"
else
  echo -e "${RED}❌ Some chat adapter tests failed${NC}"
  exit 1
fi

# Check the protocol registry tests
echo -e "${YELLOW}Running protocol registry tests...${NC}"
npx vitest run "src/lib/chat/__tests__/ProtocolRegistry.test.ts" --config vitest.chat.config.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Protocol registry tests passed${NC}"
else
  echo -e "${RED}❌ Protocol registry tests failed${NC}"
  exit 1
fi

echo -e "${GREEN}All chat system tests completed successfully${NC}"
exit 0
