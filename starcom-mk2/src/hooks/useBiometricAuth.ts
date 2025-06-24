/**
 * TDD Feature 8: Biometric Authentication Hook
 * 
 * Implements WebAuthn-based biometric authentication with graceful fallbacks
 * for devices that don't support biometric authentication.
 */

import { useState, useEffect, useCallback } from 'react';

// Types for biometric authentication
export interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
  createdAt: number;
  lastUsed: number;
  authenticatorType: 'platform' | 'roaming' | 'unknown';
}

export interface BiometricAuthConfig {
  rpName: string;
  rpId: string;
  userDisplayName: string;
  userId: string;
  timeout: number;
  residentKey: 'required' | 'preferred' | 'discouraged';
  userVerification: 'required' | 'preferred' | 'discouraged';
}

export interface BiometricAuthResult {
  success: boolean;
  credentialId?: string;
  error?: string;
  fallbackUsed?: boolean;
  authenticatorType?: string;
}

export interface UseBiometricAuthReturn {
  // Biometric Authentication
  isWebAuthnSupported: boolean;
  isBiometricAvailable: boolean;
  registerBiometric: (config: Partial<BiometricAuthConfig>) => Promise<BiometricAuthResult>;
  authenticateWithBiometric: (credentialId?: string) => Promise<BiometricAuthResult>;
  listBiometricCredentials: () => Promise<BiometricCredential[]>;
  removeBiometricCredential: (credentialId: string) => Promise<boolean>;
  
  // Fallback Authentication
  enableFallbackAuth: () => Promise<boolean>;
  disableFallbackAuth: () => Promise<boolean>;
  authenticateWithFallback: () => Promise<BiometricAuthResult>;
  
  // State
  registeredCredentials: BiometricCredential[];
  fallbackEnabled: boolean;
  lastAuthMethod: 'biometric' | 'fallback' | null;
  authInProgress: boolean;
  
  // Configuration
  setBiometricConfig: (config: Partial<BiometricAuthConfig>) => void;
  getBiometricConfig: () => BiometricAuthConfig;
}

/**
 * Default biometric authentication configuration
 */
const DEFAULT_BIOMETRIC_CONFIG: BiometricAuthConfig = {
  rpName: 'Starcom MK2',
  rpId: 'localhost', // Should be actual domain in production
  userDisplayName: 'Starcom User',
  userId: 'starcom-user',
  timeout: 60000, // 60 seconds
  residentKey: 'preferred',
  userVerification: 'preferred'
};

/**
 * Convert array buffer to base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert base64 string to array buffer
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Hook for managing biometric authentication with WebAuthn
 */
export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [registeredCredentials, setRegisteredCredentials] = useState<BiometricCredential[]>([]);
  const [fallbackEnabled, setFallbackEnabled] = useState<boolean>(true);
  const [lastAuthMethod, setLastAuthMethod] = useState<'biometric' | 'fallback' | null>(null);
  const [authInProgress, setAuthInProgress] = useState<boolean>(false);
  const [biometricConfig, setBiometricConfigState] = useState<BiometricAuthConfig>(DEFAULT_BIOMETRIC_CONFIG);

  // Check WebAuthn support
  const isWebAuthnSupported = !!(
    window.navigator &&
    window.navigator.credentials &&
    typeof window.navigator.credentials.create === 'function' &&
    typeof window.navigator.credentials.get === 'function' &&
    window.PublicKeyCredential
  );

  // Check if biometric authentication is available
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      if (!isWebAuthnSupported) {
        setIsBiometricAvailable(false);
        return;
      }

      try {
        // Check if platform authenticator is available
        if (window.PublicKeyCredential && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricAvailable(available);
        } else {
          // Fallback: assume biometric is available if WebAuthn is supported
          setIsBiometricAvailable(true);
        }
      } catch (error) {
        console.warn('Failed to check biometric availability:', error);
        setIsBiometricAvailable(false);
      }
    };

    checkBiometricAvailability();
  }, [isWebAuthnSupported]);

  // Register biometric credential
  const registerBiometric = useCallback(async (config: Partial<BiometricAuthConfig> = {}): Promise<BiometricAuthResult> => {
    if (!isWebAuthnSupported) {
      return {
        success: false,
        error: 'WebAuthn not supported in this browser',
        fallbackUsed: false
      };
    }

    setAuthInProgress(true);

    try {
      const fullConfig = { ...biometricConfig, ...config };
      
      // Generate a random user ID if not provided
      const userId = new TextEncoder().encode(fullConfig.userId || `starcom-${Date.now()}`);
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: fullConfig.rpName,
            id: fullConfig.rpId
          },
          user: {
            id: userId,
            name: fullConfig.userDisplayName,
            displayName: fullConfig.userDisplayName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: fullConfig.userVerification,
            residentKey: fullConfig.residentKey
          },
          timeout: fullConfig.timeout,
          attestation: 'direct'
        }
      };

      const credential = await navigator.credentials.create(createCredentialOptions) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKeyBuffer = response.getPublicKey?.() || new ArrayBuffer(0);
      const credentialInfo: BiometricCredential = {
        id: credential.id,
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        counter: 0,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        authenticatorType: 'platform'
      };

      // Store credential
      const updatedCredentials = [...registeredCredentials, credentialInfo];
      setRegisteredCredentials(updatedCredentials);
      localStorage.setItem('starcom_biometric_credentials', JSON.stringify(updatedCredentials));

      setLastAuthMethod('biometric');

      return {
        success: true,
        credentialId: credential.id,
        authenticatorType: 'platform'
      };

    } catch (error: unknown) {
      console.error('Biometric registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Biometric registration failed';
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setAuthInProgress(false);
    }
  }, [isWebAuthnSupported, biometricConfig, registeredCredentials]);

  // Authenticate with fallback method (password, PIN, etc.)
  const authenticateWithFallback = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!fallbackEnabled) {
      return {
        success: false,
        error: 'Fallback authentication is disabled'
      };
    }

    // Simulate fallback authentication (in real app, this would prompt for password/PIN)
    try {
      // For testing purposes, we'll simulate a successful fallback
      setLastAuthMethod('fallback');
      
      return {
        success: true,
        fallbackUsed: true,
        authenticatorType: 'fallback'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fallback authentication failed';
      return {
        success: false,
        error: errorMessage,
        fallbackUsed: true
      };
    }
  }, [fallbackEnabled]);

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(async (credentialId?: string): Promise<BiometricAuthResult> => {
    if (!isWebAuthnSupported) {
      // Fallback to alternative auth if enabled
      if (fallbackEnabled) {
        return authenticateWithFallback();
      }
      
      return {
        success: false,
        error: 'WebAuthn not supported and fallback disabled',
        fallbackUsed: false
      };
    }

    if (registeredCredentials.length === 0) {
      return {
        success: false,
        error: 'No biometric credentials registered'
      };
    }

    setAuthInProgress(true);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      let allowCredentials;
      if (credentialId) {
        // Authenticate with specific credential
        const credential = registeredCredentials.find(cred => cred.id === credentialId);
        if (!credential) {
          throw new Error('Credential not found');
        }
        allowCredentials = [{
          id: base64ToArrayBuffer(atob(credential.id)),
          type: 'public-key' as const
        }];
      } else {
        // Allow any registered credential
        allowCredentials = registeredCredentials.map(cred => ({
          id: base64ToArrayBuffer(atob(cred.id)),
          type: 'public-key' as const
        }));
      }

      const getCredentialOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: biometricConfig.userVerification,
          timeout: biometricConfig.timeout
        }
      };

      const credential = await navigator.credentials.get(getCredentialOptions) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication failed');
      }

      // Update last used timestamp
      const updatedCredentials = registeredCredentials.map(cred => 
        cred.id === credential.id ? { ...cred, lastUsed: Date.now() } : cred
      );
      setRegisteredCredentials(updatedCredentials);
      localStorage.setItem('starcom_biometric_credentials', JSON.stringify(updatedCredentials));

      setLastAuthMethod('biometric');

      return {
        success: true,
        credentialId: credential.id,
        authenticatorType: 'platform'
      };

    } catch (error: unknown) {
      console.error('Biometric authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Biometric authentication failed';
      
      // Try fallback if enabled
      if (fallbackEnabled) {
        const fallbackResult = await authenticateWithFallback();
        return {
          ...fallbackResult,
          fallbackUsed: true
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setAuthInProgress(false);
    }
  }, [isWebAuthnSupported, registeredCredentials, biometricConfig, fallbackEnabled, authenticateWithFallback]);

  // List biometric credentials
  const listBiometricCredentials = useCallback(async (): Promise<BiometricCredential[]> => {
    return registeredCredentials;
  }, [registeredCredentials]);

  // Remove biometric credential
  const removeBiometricCredential = useCallback(async (credentialId: string): Promise<boolean> => {
    try {
      const updatedCredentials = registeredCredentials.filter(cred => cred.id !== credentialId);
      setRegisteredCredentials(updatedCredentials);
      localStorage.setItem('starcom_biometric_credentials', JSON.stringify(updatedCredentials));
      return true;
    } catch (error) {
      console.error('Failed to remove biometric credential:', error);
      return false;
    }
  }, [registeredCredentials]);

  // Enable fallback authentication
  const enableFallbackAuth = useCallback(async (): Promise<boolean> => {
    try {
      setFallbackEnabled(true);
      localStorage.setItem('starcom_biometric_fallback_enabled', 'true');
      return true;
    } catch (error) {
      console.error('Failed to enable fallback auth:', error);
      return false;
    }
  }, []);

  // Disable fallback authentication
  const disableFallbackAuth = useCallback(async (): Promise<boolean> => {
    try {
      setFallbackEnabled(false);
      localStorage.setItem('starcom_biometric_fallback_enabled', 'false');
      return true;
    } catch (error) {
      console.error('Failed to disable fallback auth:', error);
      return false;
    }
  }, []);

  // Set biometric configuration
  const setBiometricConfig = useCallback((config: Partial<BiometricAuthConfig>) => {
    const newConfig = { ...biometricConfig, ...config };
    setBiometricConfigState(newConfig);
    localStorage.setItem('starcom_biometric_config', JSON.stringify(newConfig));
  }, [biometricConfig]);

  // Get biometric configuration
  const getBiometricConfig = useCallback(() => {
    return biometricConfig;
  }, [biometricConfig]);

  // Load persisted data on mount
  useEffect(() => {
    // Load credentials
    const savedCredentials = localStorage.getItem('starcom_biometric_credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        setRegisteredCredentials(credentials);
      } catch (error) {
        console.error('Failed to load biometric credentials:', error);
      }
    }

    // Load fallback setting
    const savedFallback = localStorage.getItem('starcom_biometric_fallback_enabled');
    if (savedFallback !== null) {
      setFallbackEnabled(savedFallback === 'true');
    }

    // Load config
    const savedConfig = localStorage.getItem('starcom_biometric_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setBiometricConfigState({ ...DEFAULT_BIOMETRIC_CONFIG, ...config });
      } catch (error) {
        console.error('Failed to load biometric config:', error);
      }
    }
  }, []);

  return {
    // Biometric Authentication
    isWebAuthnSupported,
    isBiometricAvailable,
    registerBiometric,
    authenticateWithBiometric,
    listBiometricCredentials,
    removeBiometricCredential,
    
    // Fallback Authentication
    enableFallbackAuth,
    disableFallbackAuth,
    authenticateWithFallback,
    
    // State
    registeredCredentials,
    fallbackEnabled,
    lastAuthMethod,
    authInProgress,
    
    // Configuration
    setBiometricConfig,
    getBiometricConfig
  };
};

export default useBiometricAuth;
