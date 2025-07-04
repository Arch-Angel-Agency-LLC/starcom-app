import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChannelSelector } from '../components/ChannelSelector';
import { Channel, ConnectionState, ChannelStatus } from '../types';
import { vi, describe, it, expect } from 'vitest';
import { CommunicationContext } from '../context/CommunicationContext';

// Mock channels for testing
const mockChannels: Channel[] = [
  {
    id: 'channel1',
    name: 'General',
    description: 'General communication channel',
    securityLevel: 1,
    participants: ['user1', 'user2'],
    isEncrypted: true,
    allowsAttachments: true,
    maxMessageSize: 1000
  },
  {
    id: 'channel2',
    name: 'Secure Ops',
    description: 'Secure operations channel',
    securityLevel: 3,
    participants: ['user1', 'user2', 'user3'],
    isEncrypted: true,
    allowsAttachments: false,
    maxMessageSize: 2000
  }
];

// Mock emergency channels
const mockEmergencyChannels: Channel[] = [
  {
    id: 'emergency1',
    name: 'EMERGENCY COMMS',
    description: 'Emergency communications channel',
    securityLevel: 5,
    participants: ['user1', 'user2', 'admin'],
    isEncrypted: true,
    allowsAttachments: true,
    maxMessageSize: 3000
  }
];

// Mock channel status
const mockChannelStatus: Record<string, ChannelStatus> = {
  channel1: {
    isActive: true,
    lastMessageTimestamp: Date.now() - 60000,
    unreadCount: 3,
    participantCount: 2,
    isTyping: []
  },
  channel2: {
    isActive: true,
    lastMessageTimestamp: Date.now() - 5000,
    unreadCount: 0,
    participantCount: 3,
    isTyping: ['user1']
  }
};

// Mock context values
const mockContextValue = {
  messages: [],
  channels: mockChannels,
  currentChannel: mockChannels[0], // First channel is selected
  connectionState: 'connected' as ConnectionState,
  connectionError: null,
  isEmergencyMode: false,
  emergencyReason: null,
  channelStatus: mockChannelStatus,
  emergencyChannels: [],
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
  failedMessages: []
};

describe('ChannelSelector', () => {
  it('renders channels correctly', () => {
    render(
      <CommunicationContext.Provider value={mockContextValue}>
        <ChannelSelector />
      </CommunicationContext.Provider>
    );
    
    // Verify that channel names are displayed
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Secure Ops')).toBeInTheDocument();
    
    // Verify that channel descriptions are displayed
    expect(screen.getByText('General communication channel')).toBeInTheDocument();
    expect(screen.getByText('Secure operations channel')).toBeInTheDocument();
    
    // Verify that unread badge is shown for channel1
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  
  it('shows active channel as selected', () => {
    const { container } = render(
      <CommunicationContext.Provider value={mockContextValue}>
        <ChannelSelector />
      </CommunicationContext.Provider>
    );
    
    // First channel should have active class (using substring match for CSS modules)
    const channelItems = container.querySelectorAll('li');
    expect(channelItems[0].className).toContain('active');
    expect(channelItems[1].className).not.toContain('active');
  });
  
  it('calls joinChannel when clicking on a channel', () => {
    const joinChannelMock = vi.fn();
    
    render(
      <CommunicationContext.Provider value={{...mockContextValue, joinChannel: joinChannelMock}}>
        <ChannelSelector />
      </CommunicationContext.Provider>
    );
    
    // Click on the second channel
    fireEvent.click(screen.getByText('Secure Ops'));
    
    // Verify joinChannel was called with the correct channel ID
    expect(joinChannelMock).toHaveBeenCalledWith('channel2');
  });
  
  it('does not call joinChannel when clicking on the current channel', () => {
    const joinChannelMock = vi.fn();
    
    render(
      <CommunicationContext.Provider value={{...mockContextValue, joinChannel: joinChannelMock}}>
        <ChannelSelector />
      </CommunicationContext.Provider>
    );
    
    // Click on the first channel (already selected)
    fireEvent.click(screen.getByText('General'));
    
    // Verify joinChannel was not called
    expect(joinChannelMock).not.toHaveBeenCalled();
  });
  
  it('displays emergency channels at the top in emergency mode', () => {
    // Setup emergency mode
    const emergencyContextValue = {
      ...mockContextValue,
      isEmergencyMode: true,
      emergencyReason: 'System breach',
      emergencyChannels: mockEmergencyChannels
    };
    
    const { container } = render(
      <CommunicationContext.Provider value={emergencyContextValue}>
        <ChannelSelector />
      </CommunicationContext.Provider>
    );
    
    // Check if emergency channel is first in the list
    const channelItems = container.querySelectorAll('li');
    expect(channelItems[0].textContent).toContain('EMERGENCY COMMS');
    expect(channelItems[0].className).toContain('emergencyChannel');
    
    // Verify that emergency badge is shown
    expect(screen.getByText('EMERGENCY')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });
  
  it('displays empty state when no channels are available', () => {
    render(
      <CommunicationContext.Provider value={{...mockContextValue, channels: []}}>
        <ChannelSelector />
      </CommunicationContext.Provider>
    );
    
    // Verify that empty state message is shown
    expect(screen.getByText('No channels available')).toBeInTheDocument();
  });
});
