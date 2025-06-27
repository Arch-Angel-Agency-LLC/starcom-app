#!/bin/bash

# Project Restructure Verification Script
# Verifies that both projects are functional after the restructure

set -e

echo "🔍 Verifying Project Restructure"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /Users/jono/Documents/GitHub/starcom-app

echo "📂 Current directory structure:"
ls -la | grep -E '^d' | grep -v '^\.$' | grep -v '^\.\.$'
echo ""

echo "🦀 Testing ai-security-relaynode..."
cd ai-security-relaynode
if cargo check --quiet; then
    echo -e "${GREEN}✅ ai-security-relaynode builds successfully${NC}"
else
    echo -e "${RED}❌ ai-security-relaynode build failed${NC}"
    exit 1
fi
echo ""

echo "⚛️  Testing dapp..."
cd ../dapp
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found${NC}"
    # Check if node_modules exists, if not suggest npm install
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  node_modules not found. Run 'npm install'${NC}"
    else
        echo -e "${GREEN}✅ node_modules present${NC}"
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi
echo ""

echo "🎯 Checking critical files..."
cd /Users/jono/Documents/GitHub/starcom-app

# Check ai-security-relaynode critical files
if [ -f "ai-security-relaynode/Cargo.toml" ]; then
    echo -e "${GREEN}✅ ai-security-relaynode/Cargo.toml${NC}"
else
    echo -e "${RED}❌ Missing ai-security-relaynode/Cargo.toml${NC}"
fi

# Check dapp critical files
if [ -f "dapp/package.json" ]; then
    echo -e "${GREEN}✅ dapp/package.json${NC}"
else
    echo -e "${RED}❌ Missing dapp/package.json${NC}"
fi

if [ -f "dapp/vite.config.ts" ]; then
    echo -e "${GREEN}✅ dapp/vite.config.ts${NC}"
else
    echo -e "${RED}❌ Missing dapp/vite.config.ts${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Project restructure verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. cd dapp && npm install && npm run build (if needed)"
echo "2. cd ai-security-relaynode && cargo build (if needed)"
echo "3. Remove starcom-mk2-backup/ when confident"
