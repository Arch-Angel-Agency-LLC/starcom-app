#!/bin/bash

# Intelligence Exchange Marketplace - MVP Setup Script
# This script sets up the development environment and deploys the smart contract

echo "🚀 Setting up Intelligence Exchange Marketplace MVP..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
    exit 1
fi

# Check if Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first:"
    echo "   npm i -g @coral-xyz/anchor-cli"
    exit 1
fi

# Set Solana to devnet
echo "📡 Setting Solana to devnet..."
solana config set --url https://api.devnet.solana.com

# Generate a new keypair if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Generating new Solana keypair..."
    solana-keygen new --outfile ~/.config/solana/id.json
fi

# Show current address
WALLET_ADDRESS=$(solana address)
echo "💰 Wallet address: $WALLET_ADDRESS"

# Airdrop SOL for development
echo "💸 Requesting airdrop for development..."
solana airdrop 2

# Build the Anchor program
echo "🔨 Building Anchor program..."
anchor build

# Deploy the program
echo "🚀 Deploying program to Solana devnet..."
anchor deploy

# Get the program ID from the deploy logs
PROGRAM_ID=$(solana program show intel-market | grep "Program Id" | awk '{print $3}')

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ Failed to get program ID from deployment"
    exit 1
fi

echo "✅ Program deployed successfully!"
echo "📄 Program ID: $PROGRAM_ID"

# Update the program ID in the source files
echo "🔧 Updating program ID in source files..."

# Update Anchor.toml
sed -i.bak "s/PLACEHOLDER_PROGRAM_ID/$PROGRAM_ID/g" Anchor.toml

# Update lib.rs
sed -i.bak "s/PLACEHOLDER_PROGRAM_ID/$PROGRAM_ID/g" programs/intel-market/src/lib.rs

# Update TypeScript API
sed -i.bak "s/REPLACE_WITH_YOUR_PROGRAM_ID/$PROGRAM_ID/g" src/api/intelligence.ts

echo "✅ MVP setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Connect your wallet and test intel report submission"
echo "3. Check transactions on Solana Explorer:"
echo "   https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "💡 Program ID: $PROGRAM_ID"
