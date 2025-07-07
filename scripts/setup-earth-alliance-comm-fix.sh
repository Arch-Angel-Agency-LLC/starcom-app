#!/bin/bash

# EarthAllianceCommunicationPanel Fix Script
# This script automates the refactoring process for the EarthAllianceCommunicationPanel

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}      Earth Alliance Communication Panel Fix Script      ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Check if we're in the right directory
if [ ! -d "./dapp" ]; then
  echo -e "${RED}Error: Must run this script from the project root directory${NC}"
  exit 1
fi

# Create backup of existing files
backup_dir="./dapp/backup/earth-alliance-comm-$(date +%Y%m%d%H%M%S)"
echo -e "${YELLOW}Creating backup in ${backup_dir}...${NC}"

mkdir -p "$backup_dir"

# Find all files related to EarthAllianceCommunicationPanel
echo -e "${YELLOW}Finding EarthAllianceCommunicationPanel files...${NC}"
related_files=$(grep -r --include="*.tsx" --include="*.ts" "EarthAllianceCommunicationPanel" ./dapp/src)

# Back up each file
for file in $related_files; do
  file_path=$(echo "$file" | cut -d':' -f1)
  if [ -f "$file_path" ]; then
    backup_path="$backup_dir/$(basename "$file_path")"
    cp "$file_path" "$backup_path"
    echo -e "${GREEN}Backed up:${NC} $file_path"
  fi
done

# Create directories for new components
echo -e "${YELLOW}Creating component directories...${NC}"

mkdir -p ./dapp/src/components/EarthAllianceCommunication/components
mkdir -p ./dapp/src/components/EarthAllianceCommunication/context
mkdir -p ./dapp/src/components/EarthAllianceCommunication/services
mkdir -p ./dapp/src/components/EarthAllianceCommunication/hooks
mkdir -p ./dapp/src/components/EarthAllianceCommunication/types
mkdir -p ./dapp/src/components/EarthAllianceCommunication/utils
mkdir -p ./dapp/src/components/EarthAllianceCommunication/tests

echo -e "${GREEN}Created component directories${NC}"

# Create base type definitions file
echo -e "${YELLOW}Creating type definitions...${NC}"

cat > ./dapp/src/components/EarthAllianceCommunication/types/index.ts << EOL
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  priority: number;
  signature?: string;
  encryption?: string;
  attachments?: Attachment[];
  channelId: string;
}

export interface Attachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size: number;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  securityLevel: number;
  participants: string[];
  isEncrypted: boolean;
  allowsAttachments: boolean;
  maxMessageSize: number;
}

export interface ChannelStatus {
  isActive: boolean;
  lastMessageTimestamp: number;
  unreadCount: number;
  participantCount: number;
  isTyping: string[];
}

export interface NostrConfig {
  endpoints: string[];
  fallbackEndpoints: string[];
  reconnectStrategy: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
  };
  batchSize: number;
  compressionLevel: number;
  encryptionAlgorithm: string;
  signatureAlgorithm: string;
}
EOL

echo -e "${GREEN}Created type definitions${NC}"

# Create service adapter stub
echo -e "${YELLOW}Creating NostrService adapter stub...${NC}"

cat > ./dapp/src/components/EarthAllianceCommunication/services/NostrServiceAdapter.ts << EOL
import { Message, Channel, ConnectionState, NostrConfig } from '../types';

// This is a stub for the NostrServiceAdapter that will need to be implemented
export class NostrServiceAdapter {
  private connectionState: ConnectionState = 'disconnected';
  private messageListeners: Array<(message: Message) => void> = [];
  
  constructor(config: NostrConfig) {
    console.log('NostrServiceAdapter initialized with config:', config);
  }
  
  async connect(): Promise<void> {
    console.log('NostrServiceAdapter.connect() called');
    this.connectionState = 'connected';
  }
  
  async disconnect(): Promise<void> {
    console.log('NostrServiceAdapter.disconnect() called');
    this.connectionState = 'disconnected';
  }
  
  onMessage(callback: (message: Message) => void): void {
    this.messageListeners.push(callback);
  }
  
  offMessage(callback: (message: Message) => void): void {
    this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
  }
  
  async sendMessage(message: Message): Promise<void> {
    console.log('NostrServiceAdapter.sendMessage() called with:', message);
  }
  
  async joinChannel(channelId: string): Promise<void> {
    console.log('NostrServiceAdapter.joinChannel() called with:', channelId);
  }
  
  async leaveChannel(channelId: string): Promise<void> {
    console.log('NostrServiceAdapter.leaveChannel() called with:', channelId);
  }
  
  async getChannelInfo(channelId: string): Promise<Channel> {
    console.log('NostrServiceAdapter.getChannelInfo() called with:', channelId);
    return {
      id: channelId,
      name: 'Mock Channel',
      description: 'This is a mock channel',
      securityLevel: 1,
      participants: [],
      isEncrypted: false,
      allowsAttachments: true,
      maxMessageSize: 1000,
    };
  }
  
  async getEmergencyChannels(): Promise<Channel[]> {
    console.log('NostrServiceAdapter.getEmergencyChannels() called');
    return [];
  }
  
  async declareEmergency(reason: string): Promise<void> {
    console.log('NostrServiceAdapter.declareEmergency() called with:', reason);
  }
  
  async resolveEmergency(): Promise<void> {
    console.log('NostrServiceAdapter.resolveEmergency() called');
  }
}
EOL

echo -e "${GREEN}Created NostrService adapter stub${NC}"

# Create README with implementation instructions
echo -e "${YELLOW}Creating implementation README...${NC}"

cat > ./dapp/src/components/EarthAllianceCommunication/README.md << EOL
# Earth Alliance Communication Panel

This component is currently being refactored to handle the NostrService emergency stabilization.

## Implementation Status

- [x] Directory structure created
- [x] Type definitions created
- [x] Service adapter stub created
- [ ] Context provider implementation
- [ ] Core components implementation
- [ ] Service integration
- [ ] Emergency features
- [ ] Testing

## Implementation Guide

Please follow the detailed implementation plan in:
\`/docs/EARTH-ALLIANCE-COMMUNICATION-PANEL-IMPLEMENTATION.md\`

And refer to the technical specifications in:
\`/docs/EARTH-ALLIANCE-COMMUNICATION-PANEL-SPEC.md\`

## Component Structure

\`\`\`
EarthAllianceCommunication/
├── components/          # UI components
├── context/             # State management
├── services/            # Service adapters
├── hooks/               # Custom hooks
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── tests/               # Test files
\`\`\`

## Getting Started

1. Implement the context provider in \`context/CommunicationProvider.tsx\`
2. Implement the message reducer in \`context/messageReducer.ts\`
3. Complete the NostrServiceAdapter implementation
4. Implement the core UI components
5. Add tests for each component
6. Test the integration with NostrService
7. Deploy and monitor

## Testing

Run tests with:

\`\`\`
cd dapp
npm test -- --testPathPattern=EarthAllianceCommunication
\`\`\`
EOL

echo -e "${GREEN}Created implementation README${NC}"

echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}Setup complete! Next steps:${NC}"
echo -e "1. Review the documentation in ${YELLOW}docs/EARTH-ALLIANCE-COMMUNICATION-PANEL-SPEC.md${NC}"
echo -e "2. Follow the implementation plan in ${YELLOW}docs/EARTH-ALLIANCE-COMMUNICATION-PANEL-IMPLEMENTATION.md${NC}"
echo -e "3. Begin implementing the components according to the plan"
echo -e "${BLUE}=========================================================${NC}"
