import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OPSECPanel from '../components/panels/OPSECPanel';
import { useOPSECSecurity } from '../hooks/useOPSECSecurity';

// Mock the OPSEC hook
jest.mock('../hooks/useOPSECSecurity');

describe('OPSECPanel', () => {
  // Setup mock implementation of useOPSECSecurity
  const mockGetSecurityAlerts = jest.fn();
  const mockChangeRoutingMethod = jest.fn();
  const mockChangeSecurityLevel = jest.fn();
  const mockToggleFingerprintProtection = jest.fn();
  const mockAcknowledgeAlert = jest.fn();
  const mockGenerateNewIdentity = jest.fn();
  const mockCheckIdentity = jest.fn();
  const mockScanForThreats = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useOPSECSecurity as jest.Mock).mockReturnValue({
      connectionStatus: {
        isSecure: true,
        routingMethod: 'vpn',
        encryptionActive: true,
        fingerprintProtection: true,
        dnsSecure: true,
      },
      securityLevel: 'enhanced',
      routingMethod: 'vpn',
      fingerprintProtection: true,
      securityAlerts: [
        { id: 1, type: 'warning', message: 'Test alert', time: '10 min ago', acknowledged: false },
      ],
      isLoading: false,
      error: null,
      
      getConnectionStatus: jest.fn(),
      changeRoutingMethod: mockChangeRoutingMethod,
      changeSecurityLevel: mockChangeSecurityLevel,
      toggleFingerprintProtection: mockToggleFingerprintProtection,
      getSecurityAlerts: mockGetSecurityAlerts,
      acknowledgeAlert: mockAcknowledgeAlert,
      generateNewIdentity: mockGenerateNewIdentity,
      checkIdentity: mockCheckIdentity,
      scanForThreats: mockScanForThreats,
    });
  });
  
  it('renders the OPSEC panel with security indicators', () => {
    render(<OPSECPanel />);
    
    expect(screen.getByText('OPSEC Protection Status')).toBeInTheDocument();
    expect(screen.getByText('Traffic Encryption')).toBeInTheDocument();
    expect(screen.getByText('Identity Protection')).toBeInTheDocument();
    expect(screen.getByText('Secure Routing')).toBeInTheDocument();
    expect(screen.getByText('Fingerprint Masking')).toBeInTheDocument();
  });
  
  it('displays security alerts', () => {
    render(<OPSECPanel />);
    
    expect(screen.getByText('Security Alerts')).toBeInTheDocument();
    expect(screen.getByText('Test alert')).toBeInTheDocument();
  });
  
  it('calls acknowledgeAlert when clicking on an alert', async () => {
    render(<OPSECPanel />);
    
    fireEvent.click(screen.getByText('Test alert'));
    
    expect(mockAcknowledgeAlert).toHaveBeenCalledWith(1);
  });
  
  it('calls changeSecurityLevel when clicking security level buttons', () => {
    render(<OPSECPanel />);
    
    fireEvent.click(screen.getByText('Standard'));
    expect(mockChangeSecurityLevel).toHaveBeenCalledWith('standard');
    
    fireEvent.click(screen.getByText('Maximum'));
    expect(mockChangeSecurityLevel).toHaveBeenCalledWith('maximum');
  });
  
  it('calls toggleFingerprintProtection when toggling the checkbox', () => {
    render(<OPSECPanel />);
    
    const checkbox = screen.getByLabelText('Browser Fingerprint Protection');
    fireEvent.click(checkbox);
    
    expect(mockToggleFingerprintProtection).toHaveBeenCalledWith(false);
  });
  
  it('calls action functions when quick action buttons are clicked', async () => {
    render(<OPSECPanel />);
    
    fireEvent.click(screen.getByText('New Identity'));
    await waitFor(() => expect(mockGenerateNewIdentity).toHaveBeenCalled());
    
    fireEvent.click(screen.getByText('Check Exposure'));
    await waitFor(() => expect(mockCheckIdentity).toHaveBeenCalled());
    
    fireEvent.click(screen.getByText('Traffic Analysis'));
    await waitFor(() => expect(mockScanForThreats).toHaveBeenCalled());
  });
  
  it('calls getSecurityAlerts when refresh button is clicked', () => {
    render(<OPSECPanel />);
    
    const refreshButton = screen.getByRole('button', { name: '' });
    fireEvent.click(refreshButton);
    
    expect(mockGetSecurityAlerts).toHaveBeenCalled();
  });
  
  it('displays loading state when isLoading is true', () => {
    (useOPSECSecurity as jest.Mock).mockReturnValue({
      ...useOPSECSecurity(),
      isLoading: true,
    });
    
    render(<OPSECPanel />);
    
    expect(screen.getByText('Loading security alerts...')).toBeInTheDocument();
  });
  
  it('displays error state when error is present', () => {
    (useOPSECSecurity as jest.Mock).mockReturnValue({
      ...useOPSECSecurity(),
      error: 'Failed to load security data',
    });
    
    render(<OPSECPanel />);
    
    expect(screen.getByText('Failed to load security data')).toBeInTheDocument();
  });
});
