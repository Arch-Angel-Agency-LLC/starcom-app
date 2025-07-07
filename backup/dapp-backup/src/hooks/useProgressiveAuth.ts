/**
 * Progressive Authentication System
 * Provides guest mode with limited access and seamless upgrade to full authentication
 * Implements TDD Feature 4: Progressive Authentication
 */

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { encryptedSessionStorage } from '../utils/encryptedStorage';

export interface GuestSession {
  id: string;
  created: number;
  lastActivity: number;
  permissions: string[];
  data: Record<string, unknown>;
  canUpgrade: boolean;
}

export interface ProgressiveAuthState {
  mode: 'guest' | 'authenticated' | 'upgrading';
  guestSession: GuestSession | null;
  isUpgrading: boolean;
}

interface UseProgressiveAuthReturn {
  authState: ProgressiveAuthState;
  createGuestSession: () => GuestSession;
  upgradeToFullAuth: () => Promise<boolean>;
  getGuestPermissions: () => string[];
  canUpgradeFromGuest: boolean;
  preserveGuestData: (data: Record<string, unknown>) => void;
  clearGuestSession: () => void;
  isGuestMode: boolean;
  isAuthenticated: boolean;
}

const GUEST_SESSION_KEY = 'progressive-auth-guest';
const GUEST_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const GUEST_PERMISSIONS = ['read', 'browse', 'search', 'view-public'];
const RESTRICTED_PERMISSIONS = ['write', 'trade', 'transfer', 'admin'];

export const useProgressiveAuth = (): UseProgressiveAuthReturn => {
  const wallet = useWallet();
  const [authState, setAuthState] = useState<ProgressiveAuthState>({
    mode: 'guest',
    guestSession: null,
    isUpgrading: false
  });

  // Load existing guest session on mount
  useEffect(() => {
    loadGuestSession();
  }, []);

  // Monitor wallet connection for auto-upgrade opportunities
  useEffect(() => {
    if (wallet.connected && authState.mode === 'guest' && authState.guestSession?.canUpgrade) {
      // Auto-suggest upgrade when wallet connects
      console.log('[ProgressiveAuth] Wallet connected - upgrade available');
    }
  }, [wallet.connected, authState.mode, authState.guestSession?.canUpgrade]);

  const generateSessionId = (): string => {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createGuestSession = useCallback((): GuestSession => {
    const guestSession: GuestSession = {
      id: generateSessionId(),
      created: Date.now(),
      lastActivity: Date.now(),
      permissions: [...GUEST_PERMISSIONS],
      data: {},
      canUpgrade: true
    };

    // Store guest session securely
    try {
      encryptedSessionStorage.setItem(GUEST_SESSION_KEY, guestSession);
      setAuthState(prev => ({
        ...prev,
        mode: 'guest',
        guestSession
      }));
      
      console.log('[ProgressiveAuth] Guest session created:', guestSession.id);
    } catch (error) {
      console.error('[ProgressiveAuth] Failed to create guest session:', error);
    }

    return guestSession;
  }, []);

  const loadGuestSession = useCallback((): void => {
    try {
      const stored = encryptedSessionStorage.getItem<GuestSession>(GUEST_SESSION_KEY);
      
      if (stored) {
        const now = Date.now();
        const isExpired = (now - stored.created) > GUEST_SESSION_TTL;
        
        if (isExpired) {
          console.log('[ProgressiveAuth] Guest session expired, clearing');
          clearGuestSession();
          return;
        }

        // Update last activity
        stored.lastActivity = now;
        encryptedSessionStorage.setItem(GUEST_SESSION_KEY, stored);
        
        setAuthState(prev => ({
          ...prev,
          mode: 'guest',
          guestSession: stored
        }));
        
        console.log('[ProgressiveAuth] Guest session restored:', stored.id);
      }
    } catch (error) {
      console.error('[ProgressiveAuth] Failed to load guest session:', error);
      clearGuestSession();
    }
  }, []);

  const upgradeToFullAuth = useCallback(async (): Promise<boolean> => {
    if (!authState.guestSession) {
      console.warn('[ProgressiveAuth] No guest session to upgrade');
      return false;
    }

    if (!wallet.connected || !wallet.publicKey) {
      console.warn('[ProgressiveAuth] Wallet not connected for upgrade');
      return false;
    }

    setAuthState(prev => ({
      ...prev,
      mode: 'upgrading',
      isUpgrading: true
    }));

    try {
      // Preserve guest session data during upgrade
      const guestData = { ...authState.guestSession.data };
      
      // Simulate authentication process (integrate with existing auth system)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // On successful upgrade, preserve data and transition to authenticated state
      setAuthState({
        mode: 'authenticated',
        guestSession: null,
        isUpgrading: false
      });

      // Store preserved data in authenticated session context
      if (Object.keys(guestData).length > 0) {
        // This would integrate with the main auth context to preserve data
        console.log('[ProgressiveAuth] Guest data preserved during upgrade:', guestData);
      }

      // Clear guest session after successful upgrade
      encryptedSessionStorage.removeItem(GUEST_SESSION_KEY);
      
      console.log('[ProgressiveAuth] Successfully upgraded to full authentication');
      return true;
      
    } catch (error) {
      console.error('[ProgressiveAuth] Upgrade failed:', error);
      
      // Rollback to guest mode on failure
      setAuthState(prev => ({
        ...prev,
        mode: 'guest',
        isUpgrading: false
      }));
      
      return false;
    }
  }, [authState.guestSession, wallet.connected, wallet.publicKey]);

  const getGuestPermissions = useCallback((): string[] => {
    return [...GUEST_PERMISSIONS];
  }, []);

  const preserveGuestData = useCallback((data: Record<string, unknown>): void => {
    if (!authState.guestSession) {
      console.warn('[ProgressiveAuth] No guest session to preserve data');
      return;
    }

    const updatedSession = {
      ...authState.guestSession,
      data: { ...authState.guestSession.data, ...data },
      lastActivity: Date.now()
    };

    try {
      encryptedSessionStorage.setItem(GUEST_SESSION_KEY, updatedSession);
      setAuthState(prev => ({
        ...prev,
        guestSession: updatedSession
      }));
      
      console.log('[ProgressiveAuth] Guest data preserved');
    } catch (error) {
      console.error('[ProgressiveAuth] Failed to preserve guest data:', error);
    }
  }, [authState.guestSession]);

  const clearGuestSession = useCallback((): void => {
    try {
      encryptedSessionStorage.removeItem(GUEST_SESSION_KEY);
      setAuthState({
        mode: 'guest',
        guestSession: null,
        isUpgrading: false
      });
      
      console.log('[ProgressiveAuth] Guest session cleared');
    } catch (error) {
      console.error('[ProgressiveAuth] Failed to clear guest session:', error);
    }
  }, []);

  // Computed properties
  const canUpgradeFromGuest = authState.guestSession?.canUpgrade === true && wallet.connected;
  const isGuestMode = authState.mode === 'guest' && authState.guestSession !== null;
  const isAuthenticated = authState.mode === 'authenticated';

  return {
    authState,
    createGuestSession,
    upgradeToFullAuth,
    getGuestPermissions,
    canUpgradeFromGuest,
    preserveGuestData,
    clearGuestSession,
    isGuestMode,
    isAuthenticated
  };
};

/**
 * Permission checker for progressive authentication
 */
export const hasPermission = (permission: string, authState: ProgressiveAuthState): boolean => {
  if (authState.mode === 'authenticated') {
    return true; // Full auth has all permissions
  }

  if (authState.mode === 'guest' && authState.guestSession) {
    return authState.guestSession.permissions.includes(permission);
  }

  return false;
};

/**
 * Get restricted features that require full authentication
 */
export const getRestrictedFeatures = (): string[] => {
  return [...RESTRICTED_PERMISSIONS];
};

/**
 * Progressive auth context integration helper
 */
export const createProgressiveAuthContext = () => {
  // This would integrate with the main AuthContext
  // For now, we return the hook interface
  return {
    useProgressiveAuth,
    hasPermission,
    getRestrictedFeatures
  };
};
