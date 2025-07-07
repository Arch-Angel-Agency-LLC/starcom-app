import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageComposer } from '../components/MessageComposer';
import { Channel, ConnectionState } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CommunicationContext } from '../context/CommunicationContext';

// Mock focus function for textarea
beforeEach(() => {
  // Mock focus method
  HTMLTextAreaElement.prototype.focus = vi.fn();
});

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
  messages: [],
  channels: [mockChannel],
  currentChannel: mockChannel,
  connectionState: 'connected' as ConnectionState,
  connectionError: null,
  isEmergencyMode: false,
  emergencyReason: null,
  sendMessage: vi.fn().mockResolvedValue(undefined),
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

describe('MessageComposer', () => {
  it('renders the composer with placeholder text', () => {
    render(
      <CommunicationContext.Provider value={mockContextValue}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Verify that textarea is rendered
    const textarea = screen.getByPlaceholderText('Type your message...');
    expect(textarea).toBeInTheDocument();
    
    // Verify that send button is rendered
    expect(screen.getByText('Send')).toBeInTheDocument();
  });
  
  it('sends a message when the form is submitted', async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);
    
    render(
      <CommunicationContext.Provider value={{...mockContextValue, sendMessage: sendMessageMock}}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Type a message
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello, Earth Alliance!' } });
    
    // Submit the form
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Verify that sendMessage was called with the correct arguments
    expect(sendMessageMock).toHaveBeenCalledWith({
      content: 'Hello, Earth Alliance!',
      priority: 0
    });
    
    // Wait for the state update to complete after the async operation
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
  
  it('does not send empty messages', () => {
    const sendMessageMock = vi.fn();
    
    render(
      <CommunicationContext.Provider value={{...mockContextValue, sendMessage: sendMessageMock}}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Submit the form without typing a message
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Verify that sendMessage was not called
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
  
  it('shows a different placeholder when no channel is selected', () => {
    render(
      <CommunicationContext.Provider value={{...mockContextValue, currentChannel: null}}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Verify that textarea has the correct placeholder
    const textarea = screen.getByPlaceholderText('Select a channel first');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeDisabled();
  });
  
  it('shows emergency UI elements in emergency mode', async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);
    
    render(
      <CommunicationContext.Provider value={{
        ...mockContextValue, 
        isEmergencyMode: true,
        sendMessage: sendMessageMock
      }}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Verify that textarea has emergency placeholder
    const textarea = screen.getByPlaceholderText('Emergency message...');
    expect(textarea).toBeInTheDocument();
    
    // Verify that urgent checkbox is shown
    const urgentCheckbox = screen.getByLabelText('URGENT');
    expect(urgentCheckbox).toBeInTheDocument();
    
    // Verify that send button is disabled initially
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
    
    // Type a message
    fireEvent.change(textarea, { target: { value: 'Emergency message!' } });
    
    // Verify that send button is now enabled
    expect(sendButton).not.toBeDisabled();
    
    // Check the urgent checkbox
    fireEvent.click(urgentCheckbox);
    
    // Send the message
    fireEvent.click(sendButton);
    
    // Verify that sendMessage was called with the correct priority
    expect(sendMessageMock).toHaveBeenCalledWith({
      content: 'Emergency message!',
      priority: 3  // urgent in emergency mode
    });
    
    // Wait for the state update to complete
    await waitFor(() => {
      expect(textarea).toHaveValue('');
      expect(urgentCheckbox).not.toBeChecked();
    });
  });
  
  it('shows connecting state when connection state is connecting', () => {
    render(
      <CommunicationContext.Provider value={{...mockContextValue, connectionState: 'connecting' as ConnectionState}}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Verify that connecting message is shown
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    
    // Verify that textarea is disabled
    const textarea = screen.getByPlaceholderText('Waiting for connection...');
    expect(textarea).toBeDisabled();
  });
  
  it('sends a message on Enter key without Shift', async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);
    
    render(
      <CommunicationContext.Provider value={{...mockContextValue, sendMessage: sendMessageMock}}>
        <MessageComposer />
      </CommunicationContext.Provider>
    );
    
    // Type a message
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello!' } });
    
    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    
    // Verify that sendMessage was called
    expect(sendMessageMock).toHaveBeenCalledWith({
      content: 'Hello!',
      priority: 0
    });
    
    // Wait for the state update to complete
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
    
    // Press Shift+Enter (should not send)
    sendMessageMock.mockClear();
    fireEvent.change(textarea, { target: { value: 'New line' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
    
    // Verify that sendMessage was not called
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
