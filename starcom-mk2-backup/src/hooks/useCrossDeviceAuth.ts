/**
 * TDD Feature 7: Cross-Device Authentication Hook
 * 
 * Implements QR code authentication and cross-device sync for seamless
 * authentication across multiple devices using secure protocols.
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types for cross-device authentication
export interface QRAuthSession {
  sessionId: string;
  deviceId: string;
  authToken: string;
  expiresAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface CrossDeviceAuthState {
  primaryDevice: string | null;
  connectedDevices: string[];
  syncEnabled: boolean;
  lastSync: number;
}

export interface QRCodeData {
  sessionId: string;
  authUrl: string;
  deviceId: string;
  timestamp: number;
}

export interface UseCrossDeviceAuthReturn {
  // QR Code Authentication
  generateQRAuth: () => Promise<QRCodeData>;
  checkQRAuthStatus: (sessionId: string) => Promise<QRAuthSession>;
  approveQRAuth: (sessionId: string) => Promise<boolean>;
  rejectQRAuth: (sessionId: string) => Promise<boolean>;
  
  // Cross-Device Sync
  enableCrossDeviceSync: () => Promise<boolean>;
  disableCrossDeviceSync: () => Promise<boolean>;
  syncAuthState: () => Promise<boolean>;
  getConnectedDevices: () => Promise<string[]>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  
  // State
  qrAuthSession: QRAuthSession | null;
  crossDeviceState: CrossDeviceAuthState;
  isQRCodeSupported: boolean;
  isSyncEnabled: boolean;
  
  // Events
  onDeviceConnected: (callback: (deviceId: string) => void) => void;
  onAuthStateChanged: (callback: (state: CrossDeviceAuthState) => void) => void;
}

/**
 * Hook for managing cross-device authentication and sync
 */
export const useCrossDeviceAuth = (): UseCrossDeviceAuthReturn => {
  const [qrAuthSession, setQRAuthSession] = useState<QRAuthSession | null>(null);
  const [crossDeviceState, setCrossDeviceState] = useState<CrossDeviceAuthState>({
    primaryDevice: null,
    connectedDevices: [],
    syncEnabled: false,
    lastSync: 0
  });

  const [deviceConnectedCallbacks, setDeviceConnectedCallbacks] = useState<((deviceId: string) => void)[]>([]);
  const [authStateCallbacks, setAuthStateCallbacks] = useState<((state: CrossDeviceAuthState) => void)[]>([]);

  // Initialize device ID and check capabilities
  const deviceId = useState(() => {
    let id = localStorage.getItem('starcom_device_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('starcom_device_id', id);
    }
    return id;
  })[0];

  // Check if QR codes and cross-device sync are supported
  const isQRCodeSupported = true; // Modern browsers support canvas/QR generation
  const isSyncEnabled = crossDeviceState.syncEnabled;

  // Generate QR code for authentication
  const generateQRAuth = useCallback(async (): Promise<QRCodeData> => {
    const sessionId = uuidv4();
    const authToken = uuidv4();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    const session: QRAuthSession = {
      sessionId,
      deviceId,
      authToken,
      expiresAt,
      status: 'pending'
    };
    
    // Store session data (in real app, this would be server-side)
    localStorage.setItem(`qr_auth_${sessionId}`, JSON.stringify(session));
    setQRAuthSession(session);
    
    const qrData: QRCodeData = {
      sessionId,
      authUrl: `starcom://auth/qr?session=${sessionId}&token=${authToken}`,
      deviceId,
      timestamp: Date.now()
    };
    
    // Auto-expire session
    setTimeout(() => {
      if (session.status === 'pending') {
        session.status = 'expired';
        localStorage.setItem(`qr_auth_${sessionId}`, JSON.stringify(session));
        setQRAuthSession(session);
      }
    }, 5 * 60 * 1000);
    
    return qrData;
  }, [deviceId]);

  // Check QR authentication status
  const checkQRAuthStatus = useCallback(async (sessionId: string): Promise<QRAuthSession> => {
    const sessionData = localStorage.getItem(`qr_auth_${sessionId}`);
    if (!sessionData) {
      throw new Error('QR auth session not found');
    }
    
    const session: QRAuthSession = JSON.parse(sessionData);
    
    // Check expiration
    if (Date.now() > session.expiresAt && session.status === 'pending') {
      session.status = 'expired';
      localStorage.setItem(`qr_auth_${sessionId}`, JSON.stringify(session));
    }
    
    setQRAuthSession(session);
    return session;
  }, []);

  // Approve QR authentication
  const approveQRAuth = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const session = await checkQRAuthStatus(sessionId);
      if (session.status !== 'pending') {
        return false;
      }
      
      session.status = 'approved';
      localStorage.setItem(`qr_auth_${sessionId}`, JSON.stringify(session));
      setQRAuthSession(session);
      
      // Add device to connected devices if not already present
      setCrossDeviceState(prev => {
        const connectedDevices = prev.connectedDevices.includes(session.deviceId)
          ? prev.connectedDevices
          : [...prev.connectedDevices, session.deviceId];
        
        const newState = {
          ...prev,
          connectedDevices,
          lastSync: Date.now()
        };
        
        // Notify callbacks
        authStateCallbacks.forEach(callback => callback(newState));
        
        return newState;
      });
      
      // Notify device connected callbacks
      deviceConnectedCallbacks.forEach(callback => callback(session.deviceId));
      
      return true;
    } catch (error) {
      console.error('Failed to approve QR auth:', error);
      return false;
    }
  }, [deviceConnectedCallbacks, authStateCallbacks, checkQRAuthStatus]);

  // Reject QR authentication
  const rejectQRAuth = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const session = await checkQRAuthStatus(sessionId);
      if (session.status !== 'pending') {
        return false;
      }
      
      session.status = 'rejected';
      localStorage.setItem(`qr_auth_${sessionId}`, JSON.stringify(session));
      setQRAuthSession(session);
      
      return true;
    } catch (error) {
      console.error('Failed to reject QR auth:', error);
      return false;
    }
  }, [checkQRAuthStatus]);

  // Enable cross-device sync
  const enableCrossDeviceSync = useCallback(async (): Promise<boolean> => {
    try {
      setCrossDeviceState(prev => {
        const newState = {
          ...prev,
          syncEnabled: true,
          primaryDevice: prev.primaryDevice || deviceId,
          lastSync: Date.now()
        };
        
        localStorage.setItem('starcom_cross_device_state', JSON.stringify(newState));
        
        // Notify callbacks
        authStateCallbacks.forEach(callback => callback(newState));
        
        return newState;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to enable cross-device sync:', error);
      return false;
    }
  }, [deviceId, authStateCallbacks]);

  // Disable cross-device sync
  const disableCrossDeviceSync = useCallback(async (): Promise<boolean> => {
    try {
      setCrossDeviceState(prev => {
        const newState = {
          ...prev,
          syncEnabled: false,
          lastSync: Date.now()
        };
        
        localStorage.setItem('starcom_cross_device_state', JSON.stringify(newState));
        
        // Notify callbacks
        authStateCallbacks.forEach(callback => callback(newState));
        
        return newState;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to disable cross-device sync:', error);
      return false;
    }
  }, [authStateCallbacks]);

  // Sync authentication state across devices
  const syncAuthState = useCallback(async (): Promise<boolean> => {
    try {
      if (!crossDeviceState.syncEnabled) {
        return false;
      }
      
      // In a real implementation, this would sync with a server
      // For now, we'll simulate successful sync
      setCrossDeviceState(prev => {
        const newState = {
          ...prev,
          lastSync: Date.now()
        };
        
        localStorage.setItem('starcom_cross_device_state', JSON.stringify(newState));
        
        // Notify callbacks
        authStateCallbacks.forEach(callback => callback(newState));
        
        return newState;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to sync auth state:', error);
      return false;
    }
  }, [crossDeviceState.syncEnabled, authStateCallbacks]);

  // Get connected devices
  const getConnectedDevices = useCallback(async (): Promise<string[]> => {
    return crossDeviceState.connectedDevices;
  }, [crossDeviceState.connectedDevices]);

  // Remove device from connected devices
  const removeDevice = useCallback(async (deviceIdToRemove: string): Promise<boolean> => {
    try {
      setCrossDeviceState(prev => {
        const connectedDevices = prev.connectedDevices.filter(id => id !== deviceIdToRemove);
        
        const newState = {
          ...prev,
          connectedDevices,
          lastSync: Date.now()
        };
        
        localStorage.setItem('starcom_cross_device_state', JSON.stringify(newState));
        
        // Notify callbacks
        authStateCallbacks.forEach(callback => callback(newState));
        
        return newState;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to remove device:', error);
      return false;
    }
  }, [authStateCallbacks]);

  // Event subscription for device connected
  const onDeviceConnected = useCallback((callback: (deviceId: string) => void) => {
    setDeviceConnectedCallbacks(prev => [...prev, callback]);
  }, []);

  // Event subscription for auth state changes
  const onAuthStateChanged = useCallback((callback: (state: CrossDeviceAuthState) => void) => {
    setAuthStateCallbacks(prev => [...prev, callback]);
  }, []);

  // Load persisted cross-device state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('starcom_cross_device_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setCrossDeviceState(parsed);
      } catch (error) {
        console.error('Failed to load cross-device state:', error);
      }
    }
  }, []);

  // Auto-sync if enabled
  useEffect(() => {
    if (crossDeviceState.syncEnabled) {
      const interval = setInterval(() => {
        syncAuthState();
      }, 30000); // Sync every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [crossDeviceState.syncEnabled, syncAuthState]);

  return {
    // QR Code Authentication
    generateQRAuth,
    checkQRAuthStatus,
    approveQRAuth,
    rejectQRAuth,
    
    // Cross-Device Sync
    enableCrossDeviceSync,
    disableCrossDeviceSync,
    syncAuthState,
    getConnectedDevices,
    removeDevice,
    
    // State
    qrAuthSession,
    crossDeviceState,
    isQRCodeSupported,
    isSyncEnabled,
    
    // Events
    onDeviceConnected,
    onAuthStateChanged
  };
};

export default useCrossDeviceAuth;
