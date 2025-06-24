import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFeatureFlag } from '../../utils/featureFlags';

// AI-NOTE: Enhanced movable diagnostic component for wallet debugging
// Integrated with Developer Tools feature flag system

interface Position {
  x: number;
  y: number;
}

const WalletDiagnostic: React.FC = () => {
  const {
    isAuthenticated,
    address,
    connectionStatus,
    error,
    authError,
    session,
    isSigningIn,
    provider,
  } = useAuth();

  const walletDiagnosticsEnabled = useFeatureFlag('walletDiagnosticsEnabled');
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const dragRef = useRef<HTMLDivElement>(null);

  // Generate comprehensive diagnostic data for AI agents
  const generateDiagnosticData = useCallback(() => {
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      starcom_version: "mk2",
      environment: process.env.NODE_ENV || 'unknown',
      
      wallet_status: {
        address: address || null,
        is_authenticated: isAuthenticated,
        connection_status: connectionStatus,
        is_signing_in: isSigningIn,
        provider_name: provider?.wallet?.adapter?.name || null,
        wallet_connected: provider?.connected || false,
        wallet_connecting: provider?.connecting || false,
        has_public_key: !!provider?.publicKey,
      },
      
      session_details: session ? {
        message: session.message,
        signature_length: session.signature?.length || 0,
        public_key: session.publicKey,
        issued_at: new Date(session.issuedAt).toISOString(),
        expires_at: new Date(session.expiresAt).toISOString(),
        verified: session.verified,
        time_until_expiry_ms: session.expiresAt - Date.now(),
      } : null,
      
      error_details: {
        connection_error: error || null,
        auth_error: authError || null,
        error_classification: (() => {
          const errorMsg = error || authError;
          if (!errorMsg) return null;
          if (errorMsg.includes('keyring')) return 'keyring_error';
          if (errorMsg.includes('signing')) return 'signing_error';
          if (errorMsg.includes('unknown')) return 'unknown_wallet_error';
          if (errorMsg.includes('connection')) return 'connection_error';
          return 'other';
        })(),
        possible_causes: (() => {
          const errorMsg = error || authError;
          if (!errorMsg) return [];
          const causes = [];
          if (errorMsg.includes('keyring')) causes.push('Wallet keyring request failed - possibly MetaMask Snaps compatibility issue');
          if (errorMsg.includes('signing')) causes.push('Message signing failed - wallet may not support Solana message signing');
          if (errorMsg.includes('unknown')) causes.push('Unknown wallet error - wallet adapter or connection issue');
          if (errorMsg.includes('connection')) causes.push('Wallet connection failed - network or wallet extension issue');
          return causes;
        })(),
        troubleshooting_steps: [
          'Try disconnecting and reconnecting wallet',
          'Refresh browser page to clear stale state',
          'Try different wallet (Phantom, Solflare)',
          'Check wallet extension is unlocked and on correct network',
          'Use Force Reset if multiple failures occur',
          'Check browser console for additional error details'
        ]
      },
      
      browser_info: {
        user_agent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        local_storage_keys: Object.keys(localStorage).filter(key => 
          key.includes('wallet') || key.includes('solana') || key.includes('auth') || key.includes('siws')
        ),
        feature_flags: {
          wallet_diagnostics_enabled: walletDiagnosticsEnabled,
          environment: process.env.NODE_ENV
        }
      },
      
      technical_notes: {
        auth_system: 'SIWS (Sign-In with Solana)',
        wallet_adapter: '@solana/wallet-adapter-react',
        expected_chain: 'solana:devnet',
        session_duration_hours: 24,
        diagnostic_generated_at: new Date().toISOString(),
        diagnostic_version: '1.0.0'
      }
    };
    
    return JSON.stringify(diagnosticInfo, null, 2);
  }, [isAuthenticated, address, connectionStatus, error, authError, session, isSigningIn, provider, walletDiagnosticsEnabled]);

  const handleCopyDiagnostics = useCallback(async () => {
    try {
      const diagnosticData = generateDiagnosticData();
      await navigator.clipboard.writeText(diagnosticData);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy diagnostic data:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [generateDiagnosticData]);

  // Center on first load
  useEffect(() => {
    if (!isInitialized) {
      setPosition({
        x: Math.max(0, (window.innerWidth - 320) / 2),
        y: Math.max(0, (window.innerHeight - 300) / 2),
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragOffset.x, dragOffset.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Only show in development mode AND when feature flag is enabled
  if (process.env.NODE_ENV === 'production' || !walletDiagnosticsEnabled) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    if (dragRef.current) {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      setIsDragging(true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 196, 255, 0.1))',
        color: '#00ff00',
        padding: isMinimized ? '8px 12px' : '16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 10000,
        border: '2px solid #00ff00',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        userSelect: 'text', // Allow text selection
        minWidth: '300px',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header with Drag Handle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMinimized ? 0 : '12px',
        borderBottom: isMinimized ? 'none' : '1px solid #00ff00',
        paddingBottom: isMinimized ? 0 : '8px',
      }}>
        {/* Dedicated Drag Handle */}
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '4px',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            background: 'rgba(0, 255, 255, 0.1)',
          }}
          title="Drag to move window"
        >
          <span style={{ fontSize: '10px', color: '#00ffff' }}>⋮⋮</span>
          <h4 style={{ 
            margin: 0, 
            color: '#00ffff', 
            fontSize: '12px',
            fontWeight: 'bold' 
          }}>
            🔍 WALLET DIAGNOSTIC
          </h4>
          <span style={{ fontSize: '10px', color: '#00ffff' }}>⋮⋮</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyDiagnostics();
            }}
            style={{
              background: copyStatus === 'copied' ? 'rgba(0, 255, 0, 0.2)' : copyStatus === 'error' ? 'rgba(255, 68, 68, 0.2)' : 'transparent',
              border: `1px solid ${copyStatus === 'copied' ? '#00ff00' : copyStatus === 'error' ? '#ff4444' : '#9d4edd'}`,
              color: copyStatus === 'copied' ? '#00ff00' : copyStatus === 'error' ? '#ff4444' : '#9d4edd',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '10px',
              borderRadius: '3px',
              minWidth: '45px',
            }}
            title="Copy comprehensive diagnostic data for AI troubleshooting"
          >
            {copyStatus === 'copied' ? '✓' : copyStatus === 'error' ? '✗' : '📋'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              color: '#00ff00',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '10px',
              borderRadius: '3px',
            }}
          >
            {isMinimized ? '□' : '–'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div style={{ 
          fontSize: '10px', 
          lineHeight: '1.4',
          userSelect: 'text',
          cursor: 'text',
          padding: '4px 0'
        }}>
          <div><strong>Connection Status:</strong> <span style={{ color: connectionStatus === 'connected' ? '#00ff00' : '#ffaa00' }}>{connectionStatus}</span></div>
          <div><strong>Address:</strong> {address ? `${address.slice(0, 8)}...${address.slice(-4)}` : <span style={{ color: '#ff4444' }}>None</span>}</div>
          <div><strong>Authenticated:</strong> <span style={{ color: isAuthenticated ? '#00ff00' : '#ff4444' }}>{isAuthenticated ? 'Yes' : 'No'}</span></div>
          <div><strong>Session:</strong> <span style={{ color: session ? '#00ff00' : '#ff4444' }}>{session ? 'Active' : 'None'}</span></div>
          <div><strong>Signing In:</strong> <span style={{ color: isSigningIn ? '#ffaa00' : '#ffffff' }}>{isSigningIn ? 'Yes' : 'No'}</span></div>
          <div><strong>Provider:</strong> {provider?.wallet?.adapter?.name || <span style={{ color: '#ff4444' }}>None</span>}</div>
          <div><strong>Error:</strong> {error ? <span style={{ color: '#ff4444' }}>{error}</span> : <span style={{ color: '#00ff00' }}>None</span>}</div>
          <div><strong>Auth Error:</strong> {authError ? <span style={{ color: '#ff4444' }}>{authError}</span> : <span style={{ color: '#00ff00' }}>None</span>}</div>
          <div><strong>Wallet Connected:</strong> <span style={{ color: provider?.connected ? '#00ff00' : '#ff4444' }}>{provider?.connected ? 'Yes' : 'No'}</span></div>
          <div><strong>Wallet Connecting:</strong> <span style={{ color: provider?.connecting ? '#ffaa00' : '#ffffff' }}>{provider?.connecting ? 'Yes' : 'No'}</span></div>
          <div><strong>PublicKey:</strong> <span style={{ color: provider?.publicKey ? '#00ff00' : '#ff4444' }}>{provider?.publicKey ? 'Yes' : 'No'}</span></div>
          
          {/* Status Summary */}
          <div style={{ 
            marginTop: '12px', 
            padding: '8px', 
            border: '1px solid #00ffff', 
            borderRadius: '4px',
            background: 'rgba(0, 255, 255, 0.1)'
          }}>
            <strong style={{ color: '#00ffff' }}>Summary:</strong>
            <div style={{ marginTop: '4px' }}>
              {connectionStatus === 'connected' && isAuthenticated ? (
                <span style={{ color: '#00ff00' }}>✅ FULLY OPERATIONAL</span>
              ) : connectionStatus === 'connected' ? (
                <span style={{ color: '#ffaa00' }}>⚠️ CONNECTED BUT NOT AUTHENTICATED</span>
              ) : (
                <span style={{ color: '#ff4444' }}>❌ NOT CONNECTED</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDiagnostic;
