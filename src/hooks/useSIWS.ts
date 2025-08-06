import { useCallback, useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { secureStorage } from '../security/storage/SecureStorageManager';
import { debugSiws, debugWallet, debugInfo } from '../utils/debugControl';
import { debugLogger, DebugCategory } from '../utils/debugLogger';

// Component loading debug
debugLogger.info(DebugCategory.COMPONENT_LOAD, 'useSIWS.ts loaded - wallet authentication ready');

/**
 * Sign-In with Solana (SIWS) Hook
 * Implements robust Web3 authentication using cryptographic message signing
 * 
 * Based on Sign-In with Ethereum (SIWE) standard, adapted for Solana
 * Provides verifiable authentication without server dependency
 */

export interface SIWSMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: '1';
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SIWSSession {
  message: SIWSMessage;
  signature: string;
  publicKey: string;
  issuedAt: number;
  expiresAt: number;
  verified: boolean;
}

interface UseSIWSReturn {
  session: SIWSSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => void;
  isSessionValid: () => boolean;
  refreshSession: () => Promise<boolean>;
}

const DEFAULT_STATEMENT = 'Sign in to Starcom MK2 - Decentralized Intelligence Platform';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useSIWS(): UseSIWSReturn {
  // 🚨🚨🚨 CRITICAL SIWS DEBUGGING WITH COMPREHENSIVE STATE MONITORING
  const { publicKey, signMessage, wallet, connected, connecting } = useWallet();
  
  // 🔍 ENHANCED WALLET STATE MONITORING
  debugWallet('useSIWS hook initialized', {
    hasPublicKey: !!publicKey,
    walletName: wallet?.adapter?.name,
    connected,
    connecting
  });
  
  const [session, setSession] = useState<SIWSSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔍 ENHANCED SESSION STATE MONITORING
  useEffect(() => {
    debugSiws('Session state changed', {
      hasSession: !!session,
      sessionValid: session ? (Date.now() < session.expiresAt && session.verified) : false,
      keysMatch: session?.publicKey === publicKey?.toBase58(),
      isLoading,
      hasError: !!error
    });
  }, [session, publicKey, isLoading, error]);

  // 🔍 ENHANCED WALLET CONNECTION MONITORING
  useEffect(() => {
    debugWallet('Connection state changed', {
      connected,
      connecting,
      walletName: wallet?.adapter?.name,
      publicKey: !!publicKey,
      hasSession: !!session
    });
  }, [connected, connecting, wallet, publicKey, session, isLoading]);

  // Load session from localStorage on mount
  useEffect(() => {
    const isSessionValidInternal = (sessionToCheck: SIWSSession): boolean => {
      if (!sessionToCheck || !sessionToCheck.verified) return false;
      
      const now = Date.now();
      if (now > sessionToCheck.expiresAt) return false;
      
      // Enhanced validation for session integrity
      if (!sessionToCheck.signature || !sessionToCheck.message || !sessionToCheck.publicKey) {
        return false;
      }
      
      // Check if the session structure looks corrupted
      if (typeof sessionToCheck.issuedAt !== 'number' || 
          typeof sessionToCheck.expiresAt !== 'number' ||
          sessionToCheck.issuedAt <= 0 || 
          sessionToCheck.expiresAt <= sessionToCheck.issuedAt) {
        return false;
      }
      
      return true;
    };

    const loadSession = async () => {
      try {
        const parsed = await secureStorage.getItem<SIWSSession>('siws_session');
        if (parsed && isSessionValidInternal(parsed)) {
          // ✅ RELAXED: Don't clear session if wallet not connected yet
          // Allow session to persist until user explicitly connects different wallet
          setSession(parsed);
          debugSiws('Session loaded from storage', { 
            publicKey: parsed.publicKey.substring(0, 8) + '...',
            expires: new Date(parsed.expiresAt).toLocaleString()
          });
        } else if (parsed) {
          // Session exists but is invalid
          debugSiws('Invalid session found, clearing', { 
            hasSession: !!parsed,
            expired: parsed ? (Date.now() > parsed.expiresAt) : false
          });
          secureStorage.removeItem('siws_session');
          setSession(null);
          setError(null);
        }
      } catch {
        debugSiws('Error loading session, clearing');
        secureStorage.removeItem('siws_session');
        setSession(null);
        setError(null);
      }
    };

    loadSession().catch(console.warn);
  }, []); // ✅ FIXED: Remove publicKey dependency to prevent clearing session on reload

  // Clear session when wallet changes (but only if actually connected)
  useEffect(() => {
    if (session && publicKey && connected && session.publicKey !== publicKey.toBase58()) {
      debugSiws('Wallet changed, clearing old session', {
        oldKey: session.publicKey.substring(0, 8) + '...',
        newKey: publicKey.toBase58().substring(0, 8) + '...'
      });
      secureStorage.removeItem('siws_session');
      setSession(null);
      setError(null);
    }
  }, [publicKey, session, connected]); // ✅ IMPROVED: Add connected check

  // Generate nonce for message
  const generateNonce = (): string => {
    return Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Create SIWS message
  const createMessage = useCallback((address: string): SIWSMessage => {
    const now = new Date();
    const expirationTime = new Date(now.getTime() + SESSION_DURATION);

    return {
      domain: window.location.host,
      address,
      statement: DEFAULT_STATEMENT,
      uri: window.location.origin,
      version: '1',
      chainId: 'solana:devnet', // or mainnet in production
      nonce: generateNonce(),
      issuedAt: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
    };
  }, []);

  // Format message for signing
  const formatMessage = (message: SIWSMessage): string => {
    const header = `${message.domain} wants you to sign in with your Solana account:`;
    const address = message.address;
    
    let body = '';
    if (message.statement) body += `\n\n${message.statement}`;
    
    const fields = [
      `URI: ${message.uri}`,
      `Version: ${message.version}`,
      `Chain ID: ${message.chainId}`,
      `Nonce: ${message.nonce}`,
      `Issued At: ${message.issuedAt}`,
    ];
    
    if (message.expirationTime) fields.push(`Expiration Time: ${message.expirationTime}`);
    if (message.notBefore) fields.push(`Not Before: ${message.notBefore}`);
    if (message.requestId) fields.push(`Request ID: ${message.requestId}`);
    if (message.resources?.length) {
      fields.push(`Resources:`);
      message.resources.forEach(resource => fields.push(`- ${resource}`));
    }
    
    body += `\n\n${fields.join('\n')}`;
    
    return `${header}\n${address}${body}`;
  };

  // Verify signature using Ed25519
  const verifySignature = (
    message: string, 
    signature: Uint8Array, 
    publicKeyStr: string
  ): boolean => {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const publicKeyObj = new PublicKey(publicKeyStr);
      
      // Verify signature length (Ed25519 signatures are 64 bytes)
      if (signature.length !== 64) {
        return false;
      }
      
      // Get the public key bytes (Ed25519 public keys are 32 bytes)
      const publicKeyBytes = publicKeyObj.toBytes();
      if (publicKeyBytes.length !== 32) {
        return false;
      }
      
      // Verify the signature using Ed25519
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signature,
        publicKeyBytes
      );
      
      return isValid;
    } catch {
      return false;
    }
  };

  // Check if session is valid
  const isSessionValidInternal = useCallback((sessionToCheck: SIWSSession): boolean => {
    if (!sessionToCheck || !sessionToCheck.verified) return false;
    
    const now = Date.now();
    if (now > sessionToCheck.expiresAt) return false;
    
    // Check if public key matches current wallet
    if (publicKey && sessionToCheck.publicKey !== publicKey.toBase58()) {
      return false;
    }
    
    // Enhanced validation for session integrity
    if (!sessionToCheck.signature || !sessionToCheck.message || !sessionToCheck.publicKey) {
      return false;
    }
    
    // Check if the session structure looks corrupted
    if (typeof sessionToCheck.issuedAt !== 'number' || 
        typeof sessionToCheck.expiresAt !== 'number' ||
        sessionToCheck.issuedAt <= 0 || 
        sessionToCheck.expiresAt <= sessionToCheck.issuedAt) {
      return false;
    }
    
    return true;
  }, [publicKey]);

  const isSessionValid = useCallback((): boolean => {
    return session ? isSessionValidInternal(session) : false;
  }, [session, isSessionValidInternal]);

  // Sign in with Solana
  const signIn = useCallback(async (): Promise<boolean> => {
    // 🔍 PERFORMANCE MONITORING: Track complete sign-in process timing
    const signInId = `siws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    debugSiws('SIWS sign-in process starting', {
      signInId,
      walletConnected: !!publicKey
    });

    // Enhanced pre-flight validation with detailed error reporting
    if (!publicKey) {
      const error = new Error('SIWS_WALLET_NOT_CONNECTED: Wallet public key is not available. Please ensure your wallet is properly connected and unlocked.');
      setError(error.message);
      console.error('🚨 SIWS Sign-In Failed - No Public Key:', {
        publicKey,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      throw error;
    }

    if (!signMessage) {
      const error = new Error('SIWS_SIGNING_NOT_SUPPORTED: Wallet does not support message signing. This wallet may not be compatible with Sign-In with Solana (SIWS) authentication.');
      setError(error.message);
      console.error('🚨 SIWS Sign-In Failed - No Signing Support:', {
        publicKey: publicKey.toBase58(),
        walletName: 'Unknown',
        timestamp: new Date().toISOString(),
        supportedFeatures: {
          signMessage: !!signMessage,
          signTransaction: typeof window !== 'undefined' && 'solana' in window
        }
      });
      throw error;
    }

    setIsLoading(true);
    setError(null);

    const address = publicKey.toBase58();      console.log('🔐 Starting SIWS Authentication Process:', {
        address: address.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

    try {
      // Step 1: Create authentication message
      let message;
      let messageText;
      let messageBytes;
      
      try {
        message = createMessage(address);
        messageText = formatMessage(message);
        messageBytes = new TextEncoder().encode(messageText);
        
        console.log('✅ SIWS Message Created Successfully:', {
          messageLength: messageText.length,
          addressInMessage: message.address,
          domain: message.domain,
          nonce: message.nonce
        });
      } catch (err) {
        const error = new Error(`SIWS_MESSAGE_CREATION_FAILED: Failed to create authentication message. ${err instanceof Error ? err.message : 'Unknown error during message creation.'}`);
        setError(error.message);
        console.error('🚨 SIWS Message Creation Failed:', {
          originalError: err,
          address,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      // Step 2: Request wallet signature with enhanced error handling
      let signature;
      try {
        console.log('📝 Requesting wallet signature...');
        signature = await signMessage(messageBytes);
        console.log('✅ Wallet signature obtained successfully:', {
          signatureLength: signature.length,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        // Enhanced wallet-specific error handling
        let enhancedError;
        const originalMessage = err instanceof Error ? err.message : 'Unknown signing error';
        
        if (originalMessage.includes('User declined') || originalMessage.includes('rejected') || originalMessage.includes('denied')) {
          enhancedError = new Error('SIWS_USER_REJECTED: User declined to sign the authentication message. Please try again and approve the signature request in your wallet.');
        } else if (originalMessage.includes('JSON-RPC') || originalMessage.includes('Internal error')) {
          enhancedError = new Error(`SIWS_WALLET_RPC_ERROR: Wallet communication error occurred during signing. This may be due to network issues, wallet server problems, or temporary connectivity issues. Original error: ${originalMessage}`);
        } else if (originalMessage.includes('WalletSignMessageError')) {
          enhancedError = new Error(`SIWS_WALLET_SIGNING_ERROR: Wallet failed to sign the message. This could be due to wallet lock state, insufficient permissions, or wallet malfunction. Original error: ${originalMessage}`);
        } else if (originalMessage.includes('timeout') || originalMessage.includes('Timeout')) {
          enhancedError = new Error('SIWS_SIGNING_TIMEOUT: Wallet signing request timed out. Please ensure your wallet is unlocked and responsive, then try again.');
        } else if (originalMessage.includes('not supported') || originalMessage.includes('unsupported')) {
          enhancedError = new Error('SIWS_FEATURE_UNSUPPORTED: Your wallet does not support the required signing features for SIWS authentication. Please try a different wallet or update your current wallet.');
        } else {
          enhancedError = new Error(`SIWS_SIGNING_UNKNOWN_ERROR: An unexpected error occurred during wallet signing. Original error: ${originalMessage}`);
        }

        setError(enhancedError.message);
        console.error('🚨 SIWS Wallet Signing Failed:', {
          originalError: err,
          errorName: err instanceof Error ? err.name : 'Unknown',
          errorMessage: originalMessage,
          enhancedErrorCode: enhancedError.message.split(':')[0],
          address,
          timestamp: new Date().toISOString(),
          walletState: {
            connected: !!publicKey,
            signingSupported: !!signMessage
          }
        });
        
        throw enhancedError;
      }

      // Step 3: Verify signature with enhanced validation
      let isValid;
      try {
        isValid = verifySignature(messageText, signature, address);
        console.log('🔍 Signature verification result:', {
          isValid,
          address: address.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        const error = new Error(`SIWS_SIGNATURE_VERIFICATION_ERROR: Failed to verify the wallet signature. This may indicate a cryptographic issue or corrupted signature data. ${err instanceof Error ? err.message : 'Unknown verification error.'}`);
        setError(error.message);
        console.error('🚨 SIWS Signature Verification Failed:', {
          originalError: err,
          address,
          signatureLength: signature.length,
          messageLength: messageText.length,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
      
      if (!isValid) {
        const error = new Error('SIWS_SIGNATURE_INVALID: Wallet signature verification failed. The signature does not match the expected cryptographic proof for this wallet address. This could indicate a wallet malfunction or security issue.');
        setError(error.message);
        console.error('🚨 SIWS Signature Invalid:', {
          address,
          signatureLength: signature.length,
          messageText: messageText.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
          verificationAttempts: 1
        });
        throw error;
      }

      // Step 4: Create and store session with enhanced error handling
      let newSession;
      try {
        newSession = {
          message,
          signature: bs58.encode(signature),
          publicKey: address,
          issuedAt: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION,
          verified: true,
        };

        console.log('💾 Creating secure session:', {
          address: address.substring(0, 8) + '...',
          expiresIn: SESSION_DURATION / 1000 / 60 + ' minutes',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        const error = new Error(`SIWS_SESSION_CREATION_ERROR: Failed to create authentication session object. ${err instanceof Error ? err.message : 'Unknown session creation error.'}`);
        setError(error.message);
        console.error('🚨 SIWS Session Creation Failed:', {
          originalError: err,
          address,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      // Step 5: Store session securely with enhanced error handling
      try {
        await secureStorage.setItem('siws_session', newSession, { 
          encrypt: true, 
          classification: 'SECRET',
          ttl: SESSION_DURATION 
        });
        setSession(newSession);
        
        console.log('🎉 SIWS Authentication Completed Successfully:', {
          address: address.substring(0, 8) + '...',
          sessionDuration: SESSION_DURATION / 1000 / 60 + ' minutes',
          timestamp: new Date().toISOString(),
          securityLevel: 'SIWS_AUTHENTICATED'
        });
      } catch (err) {
        const error = new Error(`SIWS_SESSION_STORAGE_ERROR: Failed to store authentication session securely. This may be due to browser storage limitations or security restrictions. ${err instanceof Error ? err.message : 'Unknown storage error.'}`);
        setError(error.message);
        console.error('🚨 SIWS Session Storage Failed:', {
          originalError: err,
          address,
          timestamp: new Date().toISOString(),
          storageAvailable: typeof localStorage !== 'undefined'
        });
        throw error;
      }
      
      return true;
      
    } catch (err) {
      // Final error handling with comprehensive logging
      console.error('🚨 SIWS Sign-In Process Failed:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorName: err instanceof Error ? err.name : 'Unknown',
        address,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        walletContext: {
          publicKeyAvailable: !!publicKey,
          signMessageAvailable: !!signMessage,
          connected: !!publicKey
        }
      });
      
      // Ensure error is set for UI display
      const finalErrorMessage = err instanceof Error ? err.message : 'SIWS_UNKNOWN_ERROR: An unexpected error occurred during Sign-In with Solana authentication.';
      setError(finalErrorMessage);
      
      // Re-throw the original error to preserve error details for upstream handling
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage, createMessage]);

  // Sign out
  const signOut = useCallback((): void => {
    secureStorage.removeItem('siws_session');
    setSession(null);
    setError(null);
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session || !isSessionValid()) {
      return await signIn();
    }
    return true;
  }, [session, isSessionValid, signIn]);

  // 📈 AUTHENTICATION FLOW TIMELINE & STATE CORRELATION
  const authFlowTimeline = useRef<Array<{
    timestamp: number;
    event: string;
    details: unknown;
    wallet_state: {
      connected: boolean;
      publicKey: string | null;
      adapter: string | null;
    };
    browser_state: {
      url: string;
      user_agent: string;
      connection_type: string;
    };
  }>>([]);
  
  const recordAuthEvent = useCallback((event: string, details: unknown) => {
    const eventRecord = {
      timestamp: Date.now(),
      event,
      details,
      wallet_state: {
        connected: !!wallet?.adapter?.connected,
        publicKey: wallet?.adapter?.publicKey?.toString() || null,
        adapter: wallet?.adapter?.name || null
      },
      browser_state: {
        url: window.location.href,
        user_agent: navigator.userAgent.slice(0, 100), // Truncate for readability
        connection_type: (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown'
      }
    };
    
    authFlowTimeline.current.push(eventRecord);
    
    // Keep only last 50 events to prevent memory issues
    if (authFlowTimeline.current.length > 50) {
      authFlowTimeline.current = authFlowTimeline.current.slice(-50);
    }
    
    debugLogger.debug(DebugCategory.AUTH_TIMELINE, 'Authentication event captured', {
      'debug_signature': `AUTH_TIMELINE_EVENT_${event.toUpperCase()}_V1`,
      'event_metadata': {
        'event_name': event,
        'event_index': authFlowTimeline.current.length,
        'timestamp_iso': new Date(eventRecord.timestamp).toISOString(),
        'timestamp_relative': performance.now()
      },
      'event_payload': eventRecord,
      'timeline_context': {
        'total_events_captured': authFlowTimeline.current.length,
        'timeline_memory_usage': JSON.stringify(authFlowTimeline.current).length
      }
    });
    
    // Analyze patterns in timeline
    if (authFlowTimeline.current.length >= 3) {
      const recentEvents = authFlowTimeline.current.slice(-3);
      const timeGaps = recentEvents.slice(1).map((event, index) => 
        event.timestamp - recentEvents[index].timestamp
      );
      
      console.log('� [TIMELINE-PATTERN-ANALYZER] Event sequence analysis:', {
        'debug_signature': 'TIMELINE_PATTERN_ANALYSIS_V1',
        'pattern_metrics': {
          'recent_event_names': recentEvents.map(e => e.event),
          'time_gaps_milliseconds': timeGaps,
          'average_gap_ms': timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length,
          'min_gap_ms': Math.min(...timeGaps),
          'max_gap_ms': Math.max(...timeGaps)
        },
        'pattern_flags': {
          'rapid_succession': timeGaps.some(gap => gap < 100),
          'slow_response': timeGaps.some(gap => gap > 5000),
          'consistent_timing': Math.max(...timeGaps) - Math.min(...timeGaps) < 500
        }
      });
    }
  }, [wallet]);

  // Track auth events throughout the process
  useEffect(() => {
    recordAuthEvent('wallet_state_change', {
      wallet_connected: !!wallet?.adapter?.connected,
      wallet_name: wallet?.adapter?.name,
      public_key: wallet?.adapter?.publicKey?.toString() || null
    });
  }, [wallet, recordAuthEvent]);

  useEffect(() => {
    recordAuthEvent('siws_state_change', {
      has_session: !!session,
      is_loading: isLoading,
      has_error: !!error,
      session_valid: session ? (Date.now() < session.expiresAt && session.verified) : false
    });
  }, [session, isLoading, error, recordAuthEvent]);

  // 🎯 WALLET SELECTION FLOW DEEP MONITORING
  const walletSelectionMonitor = useCallback(() => {
    const walletState = {
      'monitor_timestamp': new Date().toISOString(),
      'wallet_adapter_status': {
        'wallet_exists': !!wallet,
        'adapter_name': wallet?.adapter?.name || 'none',
        'adapter_url': wallet?.adapter?.url || 'unknown',
        'ready_state': wallet?.adapter?.readyState || 'unknown',
        'connected': wallet?.adapter?.connected || false,
        'connecting': wallet?.adapter?.connecting || false,
        'public_key': wallet?.adapter?.publicKey?.toString() || null
      },
      'wallet_provider_analysis': {
        'phantom_window': typeof (window as unknown as { phantom?: unknown }).phantom !== 'undefined',
        'solflare_window': typeof (window as unknown as { solflare?: unknown }).solflare !== 'undefined',
        'solana_window': typeof (window as unknown as { solana?: unknown }).solana !== 'undefined',
        'phantom_provider': (window as unknown as { phantom?: { solana?: unknown } }).phantom?.solana,
        'solflare_provider': (window as unknown as { solflare?: unknown }).solflare
      },
      'react_wallet_context': {
        'publicKey': publicKey?.toString() || null,
        'connected': connected,
        'connecting': connecting,
        'signMessage_available': !!signMessage
      },
      'selection_viability': {
        'can_connect': !!wallet?.adapter && wallet.adapter.readyState !== 'Unsupported',
        'provider_mismatch': wallet?.adapter?.name === 'Phantom' && !((window as unknown as { phantom?: { solana?: unknown } }).phantom?.solana),
        'multiple_providers': [
          typeof (window as unknown as { phantom?: unknown }).phantom !== 'undefined',
          typeof (window as unknown as { solflare?: unknown }).solflare !== 'undefined'
        ].filter(Boolean).length > 1
      }
    };
    
    debugLogger.debug(DebugCategory.WALLET, 'Comprehensive wallet selection analysis', {
      'debug_signature': 'WALLET_SELECTION_DEEP_ANALYSIS_V1',
      'selection_matrix': walletState,
      'viability_assessment': {
        'selection_score': (
          (walletState.wallet_adapter_status.wallet_exists ? 25 : 0) +
          (walletState.selection_viability.can_connect ? 25 : 0) +
          (!walletState.selection_viability.provider_mismatch ? 25 : 0) +
          (walletState.react_wallet_context.connected ? 25 : 0)
        ),
        'critical_issues': [
          ...(walletState.selection_viability.provider_mismatch ? ['PROVIDER_MISMATCH'] : []),
          ...(!walletState.selection_viability.can_connect ? ['CANNOT_CONNECT'] : []),
          ...(walletState.selection_viability.multiple_providers && !walletState.wallet_adapter_status.connected ? ['MULTIPLE_PROVIDERS_CONFUSION'] : [])
        ]
      },
      'diagnostic_context': {
        'analysis_timestamp': performance.now(),
        'selection_health': walletState.selection_viability.can_connect && !walletState.selection_viability.provider_mismatch
      }
    });
    
    // Detect selection issues with unique signatures
    if (walletState.selection_viability.provider_mismatch) {
      console.warn('⚠️ [WALLET-MISMATCH-DETECTOR] Critical wallet/extension mismatch detected:', {
        'debug_signature': 'WALLET_PROVIDER_MISMATCH_WARNING_V1',
        'mismatch_details': {
          'selected_adapter': walletState.wallet_adapter_status.adapter_name,
          'available_providers': walletState.wallet_provider_analysis,
          'resolution_suggestion': 'Check browser extension installation and adapter registration'
        }
      });
      recordAuthEvent('wallet_selection_mismatch', walletState);
    }
    
    if (walletState.selection_viability.multiple_providers && !walletState.wallet_adapter_status.connected) {
      console.log('� [MULTI-PROVIDER-DETECTOR] Multiple wallet providers detected:', {
        'debug_signature': 'MULTIPLE_WALLET_PROVIDERS_INFO_V1',
        'provider_inventory': walletState.wallet_provider_analysis,
        'selection_guidance': 'User may need to explicitly select preferred wallet'
      });
      recordAuthEvent('multiple_wallet_providers', walletState);
    }
    
    if (!walletState.selection_viability.can_connect && walletState.wallet_adapter_status.wallet_exists) {
      console.error('🚨 [SELECTION-IMPOSSIBILITY-DETECTOR] Wallet selected but connection impossible:', {
        'debug_signature': 'WALLET_SELECTION_IMPOSSIBILITY_ERROR_V1',
        'impossibility_analysis': {
          'wallet_name': walletState.wallet_adapter_status.adapter_name,
          'ready_state': walletState.wallet_adapter_status.ready_state,
          'blocking_factors': 'Adapter exists but marked as unsupported or unavailable'
        }
      });
      recordAuthEvent('wallet_selection_impossible', walletState);
    }
    
    return walletState;
  }, [wallet, publicKey, connected, connecting, signMessage, recordAuthEvent]);

  // Monitor wallet selection changes
  useEffect(() => {
    const monitorResult = walletSelectionMonitor();
    
    // Set up interval monitoring for wallet selection stability
    const selectionStabilityCheck = setInterval(() => {
      const currentState = walletSelectionMonitor();
      
      // Compare with previous state for stability issues
      if (currentState.wallet_adapter_status.adapter_name !== monitorResult.wallet_adapter_status.adapter_name) {
        console.log('🔄 WALLET SELECTION CHANGED:', {
          'previous': monitorResult.wallet_adapter_status.adapter_name,
          'current': currentState.wallet_adapter_status.adapter_name,
          'timestamp': new Date().toISOString()
        });
        recordAuthEvent('wallet_selection_changed', { previous: monitorResult, current: currentState });
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(selectionStabilityCheck);
  }, [wallet?.adapter?.name, walletSelectionMonitor, recordAuthEvent]);

  // 🔍 REAL-TIME WALLET STATE CHANGE MONITORING
  useEffect(() => {
    const walletStateSnapshot = {
      'timestamp': new Date().toISOString(),
      'wallet_transitions': {
        'wallet_name': wallet?.adapter?.name || 'none',
        'ready_state': wallet?.adapter?.readyState || 'unknown',
        'connected': connected,
        'connecting': connecting,
        'publicKey': publicKey?.toBase58() || null
      },
      'extension_availability': {
        'phantom_window': typeof (window as unknown as { phantom?: unknown }).phantom !== 'undefined',
        'solflare_window': typeof (window as unknown as { solflare?: unknown }).solflare !== 'undefined',
        'window_solana': typeof (window as unknown as { solana?: unknown }).solana !== 'undefined'
      },
      'browser_wallet_apis': {
        'phantom_provider': !!(window as unknown as { phantom?: { solana?: unknown } }).phantom?.solana,
        'solflare_provider': !!(window as unknown as { solflare?: unknown }).solflare,
        'window_solana_provider': !!(window as unknown as { solana?: unknown }).solana
      }
    };
    
    debugLogger.debug(DebugCategory.WALLET, 'Wallet state transition captured', {
      'debug_signature': 'REAL_TIME_WALLET_STATE_TRANSITION_V1',
      'state_snapshot': walletStateSnapshot,
      'transition_analysis': {
        'connection_phase': 
          connected && !connecting ? 'FULLY_CONNECTED' :
          connecting && !connected ? 'CONNECTION_IN_PROGRESS' :
          connected && connecting ? 'CONNECTION_CONFLICT' :
          'DISCONNECTED',
        'wallet_availability_score': (
          (wallet ? 40 : 0) +
          (connected ? 30 : 0) +
          (publicKey ? 20 : 0) +
          (walletStateSnapshot.extension_availability.phantom_window || walletStateSnapshot.extension_availability.solflare_window ? 10 : 0)
        )
      },
      'timing_metrics': {
        'performance_timestamp': performance.now(),
        'transition_detected_at': new Date().toISOString()
      }
    });
    
    // Check for suspicious state changes with unique signatures
    if (connected && !publicKey) {
      console.warn('⚠️ [SUSPICIOUS-STATE-DETECTOR] Connected without public key anomaly:', {
        'debug_signature': 'CONNECTED_WITHOUT_PUBLIC_KEY_ANOMALY_V1',
        'anomaly_context': {
          'wallet_name': wallet?.adapter?.name,
          'connection_state': 'connected',
          'public_key_state': 'missing',
          'potential_causes': ['Race condition', 'Wallet adapter bug', 'Extension malfunction']
        },
        'state_data': walletStateSnapshot
      });
    }
    
    if (connecting && connected) {
      console.warn('⚠️ [CONNECTION-CONFLICT-DETECTOR] Simultaneous connecting and connected states:', {
        'debug_signature': 'CONNECTION_STATE_CONFLICT_ANOMALY_V1',
        'conflict_analysis': {
          'expected_behavior': 'connecting should be false when connected is true',
          'actual_state': { connecting, connected },
          'wallet_info': {
            'name': wallet?.adapter?.name,
            'ready_state': wallet?.adapter?.readyState
          }
        }
      });
    }
    
    if (!wallet && (connected || connecting)) {
      console.error('🚨 [CRITICAL-STATE-DETECTOR] Connection states active without wallet adapter:', {
        'debug_signature': 'NO_WALLET_WITH_CONNECTION_STATES_ERROR_V1',
        'critical_state_analysis': {
          'wallet_exists': !!wallet,
          'connection_states': { connected, connecting },
          'severity': 'CRITICAL',
          'potential_fix': 'Wallet adapter state reset required'
        }
      });
    }
    
  }, [wallet, connected, connecting, publicKey]);

  // 🔍 ENHANCED WALLET ADAPTER LIFECYCLE MONITORING
  useEffect(() => {
    if (!wallet?.adapter) return;
    
    const adapter = wallet.adapter;
    debugLogger.debug(DebugCategory.WALLET, 'WALLET ADAPTER LIFECYCLE EVENT', {
      'adapter_name': adapter.name,
      'ready_state': adapter.readyState,
      'connected': adapter.connected,
      'connecting': adapter.connecting,
      'public_key': adapter.publicKey?.toBase58(),
      'url': adapter.url,
      'icon': adapter.icon?.substring(0, 50) + '...',
      'supported_transaction_versions': adapter.supportedTransactionVersions,
      'lifecycle_timestamp': new Date().toISOString()
    });
    
    // Monitor adapter events if available
    if (typeof adapter.on === 'function') {
      const eventHandlers = {
        connect: (publicKey: unknown) => {
          console.log('🔗 ADAPTER EVENT: connect', {
            'public_key': String(publicKey),
            'adapter_name': adapter.name,
            'timestamp': new Date().toISOString()
          });
        },
        disconnect: () => {
          console.log('🔌 ADAPTER EVENT: disconnect', {
            'adapter_name': adapter.name,
            'timestamp': new Date().toISOString()
          });
        },
        error: (error: unknown) => {
          console.error('❌ ADAPTER EVENT: error', {
            'error': error,
            'adapter_name': adapter.name,
            'timestamp': new Date().toISOString()
          });
        }
      };
      
      // Register event listeners
      try {
        adapter.on('connect', eventHandlers.connect);
        adapter.on('disconnect', eventHandlers.disconnect);
        adapter.on('error', eventHandlers.error);
        
        console.log('👂 Registered wallet adapter event listeners for:', adapter.name);
        
        // Cleanup function
        return () => {
          try {
            adapter.off('connect', eventHandlers.connect);
            adapter.off('disconnect', eventHandlers.disconnect);
            adapter.off('error', eventHandlers.error);
            console.log('🧹 Cleaned up wallet adapter event listeners for:', adapter.name);
          } catch (cleanupError) {
            console.warn('⚠️ Error cleaning up adapter listeners:', cleanupError);
          }
        };
      } catch (eventError) {
        console.warn('⚠️ Could not register adapter event listeners:', eventError);
      }
    }
  }, [wallet?.adapter]);

  // 🔍 DEEP BROWSER EXTENSION DETECTION & HEALTH MONITORING
  useEffect(() => {
    const performDeepExtensionAnalysis = () => {
      const extensionAnalysis = {
        'analysis_timestamp': new Date().toISOString(),
        'phantom_analysis': {
          'window_phantom_exists': typeof (window as unknown as { phantom?: unknown }).phantom !== 'undefined',
          'phantom_solana_exists': typeof (window as unknown as { phantom?: { solana?: unknown } }).phantom?.solana !== 'undefined',
          'phantom_version': (window as unknown as { phantom?: { solana?: { version?: string } } }).phantom?.solana?.version || 'unknown',
          'phantom_is_phantom': (window as unknown as { phantom?: { solana?: { isPhantom?: boolean } } }).phantom?.solana?.isPhantom || false,
          'phantom_connected': (window as unknown as { phantom?: { solana?: { isConnected?: boolean } } }).phantom?.solana?.isConnected || false,
          'phantom_public_key': (window as unknown as { phantom?: { solana?: { publicKey?: { toString?: () => string } } } }).phantom?.solana?.publicKey?.toString?.() || null
        },
        'solflare_analysis': {
          'window_solflare_exists': typeof (window as unknown as { solflare?: unknown }).solflare !== 'undefined',
          'solflare_is_solflare': (window as unknown as { solflare?: { isSolflare?: boolean } }).solflare?.isSolflare || false,
          'solflare_connected': (window as unknown as { solflare?: { isConnected?: boolean } }).solflare?.isConnected || false,
          'solflare_public_key': (window as unknown as { solflare?: { publicKey?: { toString?: () => string } } }).solflare?.publicKey?.toString?.() || null
        },
        'generic_solana_analysis': {
          'window_solana_exists': typeof (window as unknown as { solana?: unknown }).solana !== 'undefined',
          'solana_provider_type': (window as unknown as { solana?: { constructor?: { name?: string } } }).solana?.constructor?.name || 'unknown',
          'solana_connected': (window as unknown as { solana?: { isConnected?: boolean } }).solana?.isConnected || false
        },
        'adapter_availability': {
          'current_wallet_adapter': wallet?.adapter?.name || 'none',
          'adapter_ready_state': wallet?.adapter?.readyState || 'unknown',
          'adapter_connected': wallet?.adapter?.connected || false,
          'adapter_url': wallet?.adapter?.url || 'unknown'
        }
      };
      
      const currentAdapter = extensionAnalysis.adapter_availability.current_wallet_adapter;
      
      console.log('🔬 [EXTENSION-ANALYZER] Deep browser extension analysis completed:', {
        'debug_signature': 'DEEP_EXTENSION_ANALYSIS_V1',
        'analysis_results': extensionAnalysis,
        'health_assessment': {
          'phantom_health': extensionAnalysis.phantom_analysis.window_phantom_exists && extensionAnalysis.phantom_analysis.phantom_solana_exists ? 'HEALTHY' : 'DEGRADED',
          'solflare_health': extensionAnalysis.solflare_analysis.window_solflare_exists && extensionAnalysis.solflare_analysis.solflare_is_solflare ? 'HEALTHY' : 'DEGRADED',
          'overall_extension_ecosystem': (
            (extensionAnalysis.phantom_analysis.window_phantom_exists ? 1 : 0) +
            (extensionAnalysis.solflare_analysis.window_solflare_exists ? 1 : 0)
          ) > 0 ? 'EXTENSIONS_AVAILABLE' : 'NO_EXTENSIONS_DETECTED'
        },
        'compatibility_matrix': {
          'phantom_adapter_compatibility': currentAdapter === 'Phantom' && extensionAnalysis.phantom_analysis.phantom_solana_exists,
          'solflare_adapter_compatibility': currentAdapter === 'Solflare' && extensionAnalysis.solflare_analysis.solflare_is_solflare,
          'adapter_extension_alignment': currentAdapter !== 'none'
        }
      });
      
      // Detect extension conflicts or issues with unique signatures
      const phantomAvailable = extensionAnalysis.phantom_analysis.window_phantom_exists;
      const solflareAvailable = extensionAnalysis.solflare_analysis.window_solflare_exists;
      
      if (phantomAvailable && currentAdapter === 'Phantom' && !extensionAnalysis.phantom_analysis.phantom_solana_exists) {
        console.warn('⚠️ [PHANTOM-CONFLICT-DETECTOR] Critical Phantom extension conflict detected:', {
          'debug_signature': 'PHANTOM_EXTENSION_CONFLICT_V1',
          'conflict_details': {
            'phantom_window_exists': phantomAvailable,
            'phantom_solana_provider_exists': extensionAnalysis.phantom_analysis.phantom_solana_exists,
            'current_adapter': currentAdapter,
            'conflict_type': 'PHANTOM_WINDOW_WITHOUT_SOLANA_PROVIDER',
            'resolution_steps': [
              'Check Phantom extension installation',
              'Restart browser',
              'Reinstall Phantom extension',
              'Clear browser cache'
            ]
          }
        });
      }
      
      if (solflareAvailable && currentAdapter === 'Solflare' && !extensionAnalysis.solflare_analysis.solflare_is_solflare) {
        console.warn('⚠️ [SOLFLARE-CONFLICT-DETECTOR] Critical Solflare extension conflict detected:', {
          'debug_signature': 'SOLFLARE_EXTENSION_CONFLICT_V1',
          'conflict_details': {
            'solflare_window_exists': solflareAvailable,
            'solflare_flag_valid': extensionAnalysis.solflare_analysis.solflare_is_solflare,
            'current_adapter': currentAdapter,
            'conflict_type': 'SOLFLARE_WINDOW_WITHOUT_VALID_FLAG',
            'resolution_steps': [
              'Check Solflare extension installation',
              'Verify extension permissions',
              'Update Solflare extension',
              'Clear extension data'
            ]
          }
        });
      }
      
      if (!phantomAvailable && !solflareAvailable && currentAdapter !== 'none') {
        debugLogger.error(DebugCategory.WALLET, 'Critical extension availability mismatch', {
          'debug_signature': 'NO_EXTENSIONS_WITH_ACTIVE_ADAPTER_ERROR_V1',
          'critical_mismatch': {
            'extensions_detected': 0,
            'active_adapter': currentAdapter,
            'mismatch_severity': 'CRITICAL',
            'likely_causes': [
              'Extension disabled or uninstalled',
              'Browser compatibility issue',
              'Extension loading failure',
              'Adapter registration error'
            ],
            'immediate_actions': [
              'Verify extension installation',
              'Check browser compatibility',
              'Reset wallet adapter state',
              'Prompt user to install wallet'
            ]
          }
        });
      }
      
      return extensionAnalysis;
    };
    
    // Perform initial analysis
    const initialAnalysis = performDeepExtensionAnalysis();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(() => {
      const currentAnalysis = performDeepExtensionAnalysis();
      
      // Compare with previous state for changes
      console.log('🏥 EXTENSION HEALTH CHECK:', {
        'check_timestamp': new Date().toISOString(),
        'phantom_stable': currentAnalysis.phantom_analysis.window_phantom_exists === initialAnalysis.phantom_analysis.window_phantom_exists,
        'solflare_stable': currentAnalysis.solflare_analysis.window_solflare_exists === initialAnalysis.solflare_analysis.window_solflare_exists,
        'adapter_stable': currentAnalysis.adapter_availability.current_wallet_adapter === initialAnalysis.adapter_availability.current_wallet_adapter
      });
    }, 30000); // Check every 30 seconds (reduced from 5s for performance)
    
    return () => clearInterval(healthCheckInterval);
  }, [wallet]);

  // 🔮 ERROR PREDICTION & ADVANCED CORRELATION SYSTEM
  const errorPatterns = useRef<Array<{
    timestamp: number;
    error_type: string;
    wallet_state: unknown;
    context: unknown;
  }>>([]);
  
  const predictiveErrorAnalysis = useCallback((newError: string) => {
    const errorRecord = {
      timestamp: Date.now(),
      error_type: newError,
      wallet_state: {
        connected: !!wallet?.adapter?.connected,
        adapter: wallet?.adapter?.name,
        ready_state: wallet?.adapter?.readyState
      },
      context: {
        session_exists: !!session,
        loading: isLoading,
        timeline_length: authFlowTimeline.current.length
      }
    };
    
    errorPatterns.current.push(errorRecord);
    
    // Keep only last 20 errors for pattern analysis
    if (errorPatterns.current.length > 20) {
      errorPatterns.current = errorPatterns.current.slice(-20);
    }
    
    console.log('🔮 [ERROR-PREDICTION-ENGINE] Error pattern analysis initiated:', {
      'debug_signature': 'ERROR_PREDICTION_ANALYSIS_V1',
      'error_metadata': {
        'error_type': newError,
        'error_index': errorPatterns.current.length,
        'timestamp_iso': new Date(errorRecord.timestamp).toISOString(),
        'context_snapshot': errorRecord
      },
      'pattern_database': {
        'total_errors_tracked': errorPatterns.current.length,
        'error_memory_footprint': JSON.stringify(errorPatterns.current).length
      }
    });
    
    // Analyze error patterns with unique signatures
    if (errorPatterns.current.length >= 3) {
      const recentErrors = errorPatterns.current.slice(-3);
      const errorTypes = recentErrors.map(e => e.error_type);
      const timeGaps = recentErrors.slice(1).map((error, index) => 
        error.timestamp - recentErrors[index].timestamp
      );
      
      // Detect error patterns
      const repeatingError = errorTypes.every(type => type === errorTypes[0]);
      const rapidErrors = timeGaps.every(gap => gap < 2000); // All within 2 seconds
      const walletStateChanges = recentErrors.map(e => (e.wallet_state as { connected: boolean }).connected);
      const walletFlapping = new Set(walletStateChanges).size > 1;
      
      console.log('� [ERROR-PATTERN-ANALYZER] Pattern recognition results:', {
        'debug_signature': 'ERROR_PATTERN_RECOGNITION_V1',
        'pattern_metrics': {
          'recent_error_types': errorTypes,
          'inter_error_timing_ms': timeGaps,
          'error_frequency_analysis': {
            'average_gap_ms': timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length,
            'fastest_succession_ms': Math.min(...timeGaps),
            'slowest_succession_ms': Math.max(...timeGaps)
          }
        },
        'pattern_detection_flags': {
          'repeating_error_detected': repeatingError,
          'rapid_error_succession': rapidErrors,
          'wallet_state_instability': walletFlapping,
          'error_cascade_risk': rapidErrors && repeatingError
        },
        'wallet_correlation': {
          'wallet_states_during_errors': walletStateChanges,
          'state_consistency': new Set(walletStateChanges).size === 1
        }
      });
      
      // Generate predictive warnings with unique signatures
      if (walletFlapping && rapidErrors) {
        console.warn('⚠️ [PREDICTION-WALLET-INSTABILITY] High-confidence wallet instability prediction:', {
          'debug_signature': 'WALLET_INSTABILITY_PREDICTION_HIGH_CONFIDENCE_V1',
          'prediction_analysis': {
            'confidence_level': 'HIGH',
            'prediction_type': 'WALLET_CONNECTION_INSTABILITY',
            'evidence': {
              'wallet_state_flapping': walletFlapping,
              'rapid_error_succession': rapidErrors,
              'instability_indicators': timeGaps.length
            },
            'recommended_actions': [
              'wallet_adapter_reset',
              'browser_extension_restart',
              'connection_retry_with_delay'
            ]
          }
        });
        recordAuthEvent('prediction_wallet_instability', { confidence: 'high', recommendation: 'wallet_reset' });
      }
      
      if (repeatingError && rapidErrors && errorTypes[0].includes('WalletNotSelectedError')) {
        console.warn('⚠️ [PREDICTION-USER-SPAM] Medium-confidence user interaction spam prediction:', {
          'debug_signature': 'USER_SPAM_PREDICTION_MEDIUM_CONFIDENCE_V1',
          'prediction_analysis': {
            'confidence_level': 'MEDIUM',
            'prediction_type': 'USER_RAPID_CLICKING',
            'evidence': {
              'same_error_repeated': repeatingError,
              'rapid_succession': rapidErrors,
              'error_type': errorTypes[0],
              'click_frequency_estimate': `${timeGaps.length} clicks in ${Math.max(...timeGaps)}ms`
            },
            'recommended_actions': [
              'implement_ui_debouncing',
              'add_loading_states',
              'user_feedback_enhancement'
            ]
          }
        });
        recordAuthEvent('prediction_user_spam', { confidence: 'medium', recommendation: 'ui_debouncing' });
      }
    }
    
    return errorRecord;
  }, [wallet, session, isLoading, recordAuthEvent, authFlowTimeline]);

  // Enhanced error handling with prediction
  const handleError = useCallback((errorMessage: string, context?: unknown) => {
    console.error('🚨 SIWS Error:', errorMessage, context);
    setError(errorMessage);
    
    // Record the error for timeline and run prediction analysis
    recordAuthEvent('error_occurred', { error: errorMessage, context });
    predictiveErrorAnalysis(errorMessage);
  }, [recordAuthEvent, predictiveErrorAnalysis]);

  // 🎯 ADVANCED EVENT SEQUENCE TRACKING & CORRELATION
  const eventSequence = useRef<Array<{
    timestamp: number;
    sequence_id: number;
    event_type: string;
    event_data: unknown;
    call_stack?: string;
    user_action?: boolean;
  }>>([]);
  
  const sequenceCounter = useRef(0);
  
  const trackEventSequence = useCallback((eventType: string, eventData: unknown, isUserAction = false) => {
    const callStack = new Error().stack?.split('\n').slice(1, 4).join(' -> ') || 'unknown';
    
    const eventRecord = {
      timestamp: performance.now(),
      sequence_id: ++sequenceCounter.current,
      event_type: eventType,
      event_data: eventData,
      call_stack: callStack,
      user_action: isUserAction
    };
    
    eventSequence.current.push(eventRecord);
    
    // Keep only last 100 events
    if (eventSequence.current.length > 100) {
      eventSequence.current = eventSequence.current.slice(-100);
    }
    
    console.log('🎯 [EVENT-SEQUENCE-TRACKER] Event sequence captured:', {
      'debug_signature': `EVENT_SEQUENCE_${eventType.toUpperCase()}_V1`,
      'sequence_metadata': {
        'sequence_id': eventRecord.sequence_id,
        'event_type': eventType,
        'is_user_initiated': isUserAction,
        'timestamp_performance': eventRecord.timestamp,
        'timestamp_iso': new Date().toISOString()
      },
      'event_payload': eventRecord,
      'sequence_context': {
        'total_events_in_sequence': eventSequence.current.length,
        'sequence_memory_usage': JSON.stringify(eventSequence.current).length,
        'call_origin': callStack.substring(0, 100)
      }
    });
    
    // Analyze critical timing patterns with unique signatures
    if (eventSequence.current.length >= 5) {
      const recentEvents = eventSequence.current.slice(-5);
      const timings = recentEvents.slice(1).map((event, index) => 
        event.timestamp - recentEvents[index].timestamp
      );
      
      // Detect rapid event cascades
      const rapidEvents = timings.filter(t => t < 50).length; // Under 50ms
      const userActions = recentEvents.filter(e => e.user_action).length;
      
      console.log('📈 [SEQUENCE-PATTERN-ANALYZER] Event sequence pattern analysis:', {
        'debug_signature': 'EVENT_SEQUENCE_PATTERN_ANALYSIS_V1',
        'sequence_metrics': {
          'recent_event_types': recentEvents.map(e => e.event_type),
          'inter_event_timings_ms': timings,
          'sequence_statistics': {
            'average_interval_ms': timings.reduce((a, b) => a + b, 0) / timings.length,
            'minimum_interval_ms': Math.min(...timings),
            'maximum_interval_ms': Math.max(...timings),
            'total_sequence_duration_ms': Math.max(...recentEvents.map(e => e.timestamp)) - Math.min(...recentEvents.map(e => e.timestamp))
          }
        },
        'cascade_detection': {
          'rapid_events_count': rapidEvents,
          'user_actions_count': userActions,
          'cascade_risk_level': rapidEvents >= 2 && userActions >= 1 ? 'HIGH' : 'LOW'
        },
        'sequence_health': {
          'healthy_timing': timings.every(t => t > 100 && t < 5000),
          'performance_concern': timings.some(t => t < 10) // Sub-10ms indicates potential issues
        }
      });
      
      if (rapidEvents >= 2 && userActions >= 1) {
        console.warn('⚠️ [RAPID-CASCADE-DETECTOR] High-risk rapid event cascade detected:', {
          'debug_signature': 'RAPID_EVENT_CASCADE_HIGH_RISK_V1',
          'cascade_analysis': {
            'risk_level': 'HIGH',
            'rapid_events_detected': rapidEvents,
            'user_actions_involved': userActions,
            'timing_pattern': timings,
            'event_types_in_cascade': recentEvents.map(e => e.event_type),
            'potential_causes': [
              'User clicking too rapidly',
              'UI not providing immediate feedback',
              'Event handler race conditions',
              'Browser performance issues'
            ],
            'recommended_mitigations': [
              'Implement button debouncing',
              'Add immediate UI feedback',
              'Queue user actions',
              'Add loading states'
            ]
          }
        });
      }
    }
    
    return eventRecord;
  }, []);

  // 🔄 FINAL INTEGRATION: Event Tracking & Enhanced Error Handling
  useEffect(() => {
    trackEventSequence('wallet_connection_state_change', {
      connected,
      connecting,
      wallet_name: wallet?.adapter?.name,
      public_key: publicKey?.toString()
    });
  }, [connected, connecting, wallet?.adapter?.name, publicKey, trackEventSequence]);

  // Track error occurrences with enhanced context and predictive analysis
  useEffect(() => {
    if (error) {
      trackEventSequence('authentication_error_occurred', {
        error_message: error,
        wallet_connected: connected,
        wallet_name: wallet?.adapter?.name,
        session_exists: !!session
      });
      
      // Run comprehensive error analysis
      handleError(error, { context: 'authentication_flow' });
      predictiveErrorAnalysis(error);
    }
  }, [error, connected, wallet?.adapter?.name, session, trackEventSequence, handleError, predictiveErrorAnalysis]);

  return {
    session,
    isAuthenticated: isSessionValid(),
    isLoading,
    error,
    signIn,
    signOut,
    isSessionValid,
    refreshSession,
  };
}

// Utility function to get current session without hook
export async function getSIWSSession(): Promise<SIWSSession | null> {
  try {
    const session = await secureStorage.getItem<SIWSSession>('siws_session');
    if (!session) return null;
    
    const now = Date.now();
    
    if (now > session.expiresAt || !session.verified) {
      secureStorage.removeItem('siws_session');
      return null;
    }
    
    return session;
  } catch {
    secureStorage.removeItem('siws_session');
    return null;
  }
}

// Utility to check if address is authenticated
export async function isAddressAuthenticated(address: string): Promise<boolean> {
  const session = await getSIWSSession();
  return session ? session.publicKey === address : false;
}
