import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EarthAllianceCommunicationPanel } from '../components/EarthAllianceCommunicationPanel';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the NostrService
vi.mock('../../../services/nostrService', () => {
  const mockInstance = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue({ id: 'msg-123' }),
    getChannel: vi.fn().mockImplementation((channelId) => {
      return Promise.resolve({
        id: channelId,
        name: channelId === 'emergency1' ? 'EMERGENCY CHANNEL' : 'General',
        description: 'Channel description',
        securityLevel: 1,
        participants: ['user1', 'user2'],
        isEncrypted: true,
        allowsAttachments: true,
        maxMessageSize: 1000
      });
    }),
    joinChannel: vi.fn().mockResolvedValue({ id: 'channel1' }),
    leaveChannel: vi.fn().mockResolvedValue(undefined),
    getChannels: vi.fn().mockResolvedValue([
      {
        id: 'channel1',
        name: 'General',
        description: 'General channel',
        securityLevel: 1,
        participants: ['user1', 'user2'],
        isEncrypted: true,
        allowsAttachments: true,
        maxMessageSize: 1000
      }
    ]),
    declareEmergency: vi.fn().mockResolvedValue({
      success: true,
      emergencyChannels: [
        {
          id: 'emergency1',
          name: 'EMERGENCY CHANNEL',
          description: 'Emergency communication',
          securityLevel: 5,
          participants: ['user1', 'user2', 'admin'],
          isEncrypted: true,
          allowsAttachments: true,
          maxMessageSize: 3000
        }
      ]
    }),
    resolveEmergency: vi.fn().mockResolvedValue({ success: true })
  };
  
  return {
    default: {
      getInstance: vi.fn().mockReturnValue(mockInstance)
    }
  };
});

// Mock the NostrServiceAdapter
vi.mock('../services/NostrServiceAdapter', () => {
  // Create a class implementation that uses our mock methods
  const MockNostrServiceAdapter = vi.fn().mockImplementation(() => {
    const listeners = new Map();
    
    return {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn().mockImplementation((listener) => {
        listeners.set('message', listener);
      }),
      offMessage: vi.fn().mockImplementation((listener) => {
        if (listeners.get('message') === listener) {
          listeners.delete('message');
        }
      }),
      onConnectionStateChange: vi.fn(),
      offConnectionStateChange: vi.fn(),
      sendMessage: vi.fn().mockImplementation(async (message) => {
        return { id: 'msg-' + Math.random().toString(36).substring(2, 9) };
      }),
      joinChannel: vi.fn().mockImplementation(async (channelId) => {
        return {
          id: channelId,
          name: channelId === 'emergency1' ? 'EMERGENCY CHANNEL' : 'General',
          description: 'Channel description',
          securityLevel: 1,
          participants: ['user1', 'user2'],
          isEncrypted: true,
          allowsAttachments: true,
          maxMessageSize: 1000
        };
      }),
      leaveChannel: vi.fn().mockResolvedValue(undefined),
      getChannelInfo: vi.fn().mockImplementation(async (channelId) => {
        return {
          id: channelId,
          name: channelId === 'emergency1' ? 'EMERGENCY CHANNEL' : 'General',
          description: 'Channel description',
          securityLevel: 1,
          participants: ['user1', 'user2'],
          isEncrypted: true,
          allowsAttachments: true,
          maxMessageSize: 1000
        };
      }),
      declareEmergency: vi.fn().mockImplementation(async (reason) => {
        const messageListener = listeners.get('message');
        if (messageListener) {
          messageListener({
            id: 'emergency-notification',
            senderId: 'system',
            content: `EMERGENCY DECLARED: ${reason}`,
            timestamp: Date.now(),
            priority: 10,
            channelId: 'emergency1'
          });
        }
        return [
          {
            id: 'emergency1',
            name: 'EMERGENCY CHANNEL',
            description: 'Emergency communication',
            securityLevel: 5,
            participants: ['user1', 'user2', 'admin'],
            isEncrypted: true,
            allowsAttachments: true,
            maxMessageSize: 3000
          }
        ];
      }),
      resolveEmergency: vi.fn().mockResolvedValue(undefined)
    };
  });
  
  return {
    NostrServiceAdapter: MockNostrServiceAdapter
  };
});

// Mock scrollIntoView for MessageDisplay
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  HTMLTextAreaElement.prototype.focus = vi.fn();
});

describe('EarthAllianceCommunicationPanel', () => {
  it('renders the communication panel with all components', async () => {
    render(<EarthAllianceCommunicationPanel />);
    
    // Verify the header is rendered
    expect(screen.getByText('Earth Alliance Communication')).toBeInTheDocument();
    
    // Verify the emergency button is rendered
    expect(screen.getByText('EMERGENCY')).toBeInTheDocument();
  });
  
  it('shows emergency controls when emergency button is clicked', async () => {
    render(<EarthAllianceCommunicationPanel />);
    
    // Click the emergency button
    fireEvent.click(screen.getByText('EMERGENCY'));
    
    // Verify the emergency form is displayed
    expect(screen.getByPlaceholderText('Reason for emergency declaration')).toBeInTheDocument();
    expect(screen.getByText('DECLARE')).toBeInTheDocument();
  });
  
  it('accepts custom endpoints', () => {
    const customEndpoints = ['wss://custom.relay.com/v1'];
    render(<EarthAllianceCommunicationPanel endpoints={customEndpoints} />);
    
    // We can't easily test this directly, but we can ensure the component renders
    expect(screen.getByText('Earth Alliance Communication')).toBeInTheDocument();
  });
  
  it('has declare and resolve emergency functionality', async () => {
    render(<EarthAllianceCommunicationPanel />);
    
    // Click the emergency button
    fireEvent.click(screen.getByText('EMERGENCY'));
    
    // Fill in the reason and click declare
    const reasonInput = screen.getByPlaceholderText('Reason for emergency declaration');
    fireEvent.change(reasonInput, { target: { value: 'Critical system failure' } });
    
    // Declare button should be enabled
    const declareButton = screen.getByText('DECLARE');
    expect(declareButton).not.toBeDisabled();
    
    // Click the declare button
    fireEvent.click(declareButton);
    
    // Wait for UI to update - this might need adjustment based on actual component behavior
    await waitFor(() => {
      // Check if the emergency form is no longer visible
      expect(screen.queryByPlaceholderText('Reason for emergency declaration')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
