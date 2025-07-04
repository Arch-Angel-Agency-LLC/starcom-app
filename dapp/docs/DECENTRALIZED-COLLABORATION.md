# Decentralized Collaboration System for Starcom

This document provides an overview of the decentralized collaboration system implemented in the Starcom dApp.

## Architecture Overview

The Starcom decentralized collaboration system is built on the following principles:

1. **100% Decentralized**: No central servers, databases, or external dependencies
2. **Privacy-Focused**: End-to-end encryption options for sensitive communications
3. **Resilient**: Works offline with sync capability when connectivity is restored
4. **Web3-Native**: Built with blockchain wallet integration for authentication
5. **Open Source**: All components use permissive open-source licenses

## Key Technologies

### Gun.js

- Serves as the decentralized real-time database
- Provides automatic peer discovery and data synchronization
- Handles presence detection (online status)
- Enables offline-first functionality

### IPFS/Helia

- Used for decentralized file storage (evidence, attachments)
- Content-addressed storage ensures data integrity
- Multiple gateway fallbacks for reliability

### WebRTC

- Direct peer-to-peer connections for chat
- Gun.js handles the signaling
- Reduces latency and improves privacy

### Wallet Authentication

- Uses Solana wallet for authentication
- Signatures provide verifiable authorship of messages and intel reports
- No username/password or centralized auth servers required

## Components

### Chat System

- Group chat (team-specific or global)
- Direct messages (p2p encrypted)
- Presence detection (online users)
- Offline capability with auto-sync
- File attachments via IPFS

### Intel Reports

- Decentralized submission and storage
- Cryptographic signatures for verification
- Classification levels
- Evidence attachments (IPFS)
- Cross-referencing between reports
- Peer review system

## Usage Guide

### Setup

No special setup is required. The system automatically connects to Gun.js peers and IPFS gateways.

### Authentication

Connect your Solana wallet to use the system. Your wallet address serves as your identity.

### Chat

1. Select channel type (team or global)
2. Type messages in the input field
3. Messages are sent in real-time to connected peers
4. Messages are stored locally when offline and synced when connectivity is restored

### Intel Reports

1. Click "Submit Intel" button
2. Fill out the report form with title, content, classification, etc.
3. Add evidence files (uploaded to IPFS)
4. Submit the report (signed with your wallet)
5. View reports in the Intel tab
6. Review and verify reports from other team members

## Technical Implementation

The decentralized collaboration system is implemented with the following key files:

- `src/lib/gun-db.ts`: Gun.js configuration and data types
- `src/lib/ipfs-client.ts`: IPFS/Helia client and utilities
- `src/lib/webrtc-signaling.ts`: WebRTC peer connection handling
- `src/hooks/useDecentralizedChat.ts`: React hook for chat functionality
- `src/hooks/useDecentralizedIntel.ts`: React hook for intelligence reports
- `src/components/Teams/DecentralizedCollabPanel.tsx`: Main UI component
- `src/components/Teams/DecentralizedChatWindow.tsx`: Chat interface
- `src/components/Teams/DecentralizedIntelList.tsx`: Intel reports listing
- `src/components/Teams/DecentralizedIntelForm.tsx`: Intel submission form
- `src/components/Teams/DecentralizedIntelDetail.tsx`: Detailed report view

## Security Considerations

- All data is stored in a distributed manner across the peer network
- Direct messages use end-to-end encryption
- Intel reports are signed with the author's wallet for verification
- No single point of failure or central authority
- Content can be individually encrypted for specific teams

## Future Enhancements

- Enhanced encryption options for team-specific content
- Reputation and trust systems for intel validation
- Decentralized content moderation mechanisms
- Integration with other decentralized storage networks
- Advanced offline capability with local-first approach
- Nostr protocol integration for expanded network reach
