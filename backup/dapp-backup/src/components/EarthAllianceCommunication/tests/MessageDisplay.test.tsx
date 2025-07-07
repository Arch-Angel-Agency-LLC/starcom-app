import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageDisplay } from '../components/MessageDisplay';
import { Message, Channel, ConnectionState } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CommunicationContext } from '../context/CommunicationContext';

// Mock scrollIntoView which isn't implemented in JSDOM
beforeEach(() => {
  // Mock scrollIntoView method
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock messages for testing
const mockMessages: Message[] = [
  {
    id: 'msg1',
    senderId: 'user1',
    content: 'Hello, Earth Alliance!',
    timestamp: Date.now() - 60000,
    priority: 1,
    channelId: 'channel1'
  },
  {
    id: 'msg2',
    senderId: 'user2',
    content: 'Transmission received. Standing by.',
    timestamp: Date.now() - 30000,
    priority: 2,
    channelId: 'channel1'
  },
  {
    id: 'msg3',
    senderId: 'user1',
    content: 'EMERGENCY: Need immediate extraction!',
    timestamp: Date.now(),
    priority: 10,
    channelId: 'channel1'
  }
];

// Mock channel for testing
const mockChannel: Channel = {
  id: 'channel1',
  name: 'Test Channel',
  description: 'Channel for testing',
  securityLevel: 1,
  participants: ['user1', 'user2'],
  isEncrypted: true,
  allowsAttachments: true,
  maxMessageSize: 1000
};

// Mock context values
const mockContextValue = {
  messages: mockMessages,
  channels: [mockChannel],
  currentChannel: mockChannel, // This matches the component - it uses currentChannel not activeChannel
  connectionState: 'connected' as ConnectionState,
  connectionError: null,
  isEmergencyMode: false,
  emergencyReason: null,
  sendMessage: vi.fn(),
  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),
  declareEmergency: vi.fn(),
  resolveEmergency: vi.fn(),
  reconnect: vi.fn(),
  disconnect: vi.fn(),
  resetUnreadCount: vi.fn(),
  clearFailedMessages: vi.fn(),
  retryFailedMessage: vi.fn(),
  messageQueue: [],
  failedMessages: [],
  channelStatus: {},
  emergencyChannels: []
};

describe('MessageDisplay', () => {
  it('renders messages correctly', () => {
    // Render the MessageDisplay component with mock data
    render(
      <CommunicationContext.Provider value={mockContextValue}>
        <MessageDisplay />
      </CommunicationContext.Provider>
    );
    
    // Verify that channel name is displayed
    expect(screen.getByText('Test Channel')).toBeInTheDocument();
    
    // Verify that messages are displayed
    expect(screen.getByText('Hello, Earth Alliance!')).toBeInTheDocument();
    expect(screen.getByText('Transmission received. Standing by.')).toBeInTheDocument();
    expect(screen.getByText('EMERGENCY: Need immediate extraction!')).toBeInTheDocument();
  });
  
  it('displays empty state when no messages', () => {
    // Render with empty messages array
    render(
      <CommunicationContext.Provider value={{...mockContextValue, messages: []}}>
        <MessageDisplay />
      </CommunicationContext.Provider>
    );
    
    // Verify that empty state message is shown
    expect(screen.getByText('No messages in this channel yet')).toBeInTheDocument();
  });
  
  it('shows emergency mode styles in emergency', () => {
    // Render in emergency mode
    render(
      <CommunicationContext.Provider 
        value={{
          ...mockContextValue, 
          isEmergencyMode: true,
          emergencyReason: 'Critical system failure'
        }}
      >
        <MessageDisplay />
      </CommunicationContext.Provider>
    );
    
    // Verify emergency banner is shown
    expect(screen.getByText('EMERGENCY MODE ACTIVE')).toBeInTheDocument();
  });
  
  it('shows select channel message when no channel is selected', () => {
    // Render with no current channel
    render(
      <CommunicationContext.Provider value={{...mockContextValue, currentChannel: null}}>
        <MessageDisplay />
      </CommunicationContext.Provider>
    );
    
    // Verify that select channel message is shown
    expect(screen.getByText('Select a channel to view messages')).toBeInTheDocument();
  });
});
