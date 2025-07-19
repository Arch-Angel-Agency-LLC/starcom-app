/**
 * Enhanced Wallet Status Component with Network Validation and Health Monitoring
 * Combines all advanced Web3 Login features in a single component
 */

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkValidation } from '../../hooks/useNetworkValidation';
import { useConnectionHealth } from '../../hooks/useConnectionHealth';
import { useTransactionTracker } from '../../hooks/useTransactionTracker';

export const EnhancedWalletStatus: React.FC = () => {
  const { connected, publicKey, wallet, connecting } = useWallet();
  const { 
    currentNetwork, 
    supportedNetworks, 
    switchNetwork, 
    getNetworkDisplayName,
    isValidating 
  } = useNetworkValidation();
  const { health, generateDiagnostics, getHealthColor } = useConnectionHealth();
  const { 
    totalPending, 
    totalConfirmed, 
    totalFailed, 
    transactions 
  } = useTransactionTracker();

  const [showDetails, setShowDetails] = useState(false);
  const [showNetworkSwitcher, setShowNetworkSwitcher] = useState(false);

  const handleNetworkSwitch = async (cluster: any) => {
    const success = await switchNetwork(cluster);
    if (success) {
      setShowNetworkSwitcher(false);
    }
  };

  const getStatusIndicator = () => {
    if (connecting) return '🔄';
    if (!connected) return '⚠️';
    
    switch (health.overall) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'poor': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getConnectionStatus = () => {
    if (connecting) return 'Connecting...';
    if (!connected) return 'Not Connected';
    
    switch (health.overall) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor Connection';
      case 'critical': return 'Critical Issues';
      default: return 'Unknown';
    }
  };

  return (
    <div className="enhanced-wallet-status">
      {/* Main Status Display */}
      <div 
        className="status-main"
        onClick={() => setShowDetails(!showDetails)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          border: `1px solid ${getHealthColor(health.overall)}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '16px' }}>{getStatusIndicator()}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ffff' }}>
            {connected ? wallet?.adapter.name : 'No Wallet'}
          </span>
          <span style={{ fontSize: '10px', color: getHealthColor(health.overall) }}>
            {getConnectionStatus()}
          </span>
        </div>
        
        {/* Network Indicator */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowNetworkSwitcher(!showNetworkSwitcher);
          }}
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 100, 200, 0.2)',
            border: '1px solid rgba(0, 150, 255, 0.3)',
            fontSize: '10px',
            color: '#00aaff',
            cursor: 'pointer'
          }}
        >
          {getNetworkDisplayName(currentNetwork.cluster)}
        </div>

        {/* Transaction Counter */}
        {(totalPending > 0 || totalConfirmed > 0 || totalFailed > 0) && (
          <div style={{ display: 'flex', gap: '4px', fontSize: '10px' }}>
            {totalPending > 0 && (
              <span style={{ color: '#FFA500' }}>⏳{totalPending}</span>
            )}
            {totalConfirmed > 0 && (
              <span style={{ color: '#00ff00' }}>✅{totalConfirmed}</span>
            )}
            {totalFailed > 0 && (
              <span style={{ color: '#ff0000' }}>❌{totalFailed}</span>
            )}
          </div>
        )}
      </div>

      {/* Network Switcher Dropdown */}
      {showNetworkSwitcher && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          backgroundColor: 'rgba(0, 20, 40, 0.95)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '8px',
          zIndex: 1000,
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '12px', color: '#00ffff', marginBottom: '8px', fontWeight: 'bold' }}>
            Switch Network
          </div>
          {supportedNetworks.map(cluster => (
            <div
              key={cluster}
              onClick={() => handleNetworkSwitch(cluster)}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                color: cluster === currentNetwork.cluster ? '#00ff00' : '#ffffff',
                backgroundColor: cluster === currentNetwork.cluster ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
                border: cluster === currentNetwork.cluster ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{getNetworkDisplayName(cluster)}</span>
              {cluster === currentNetwork.cluster && <span>✓</span>}
              {isValidating && <span>⏳</span>}
            </div>
          ))}
        </div>
      )}

      {/* Detailed Status Panel */}
      {showDetails && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 20, 40, 0.98)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Connection Info */}
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00ffff', fontSize: '14px' }}>
              Connection Details
            </h4>
            <div style={{ fontSize: '11px', color: '#ffffff', lineHeight: '1.4' }}>
              <div><strong>Wallet:</strong> {wallet?.adapter.name || 'None'}</div>
              <div><strong>Address:</strong> {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'None'}</div>
              <div><strong>Network:</strong> {getNetworkDisplayName(currentNetwork.cluster)}</div>
              <div><strong>Status:</strong> <span style={{ color: getHealthColor(health.overall) }}>{getConnectionStatus()}</span></div>
            </div>
          </div>

          {/* Network Health */}
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00ffff', fontSize: '14px' }}>
              Network Health
            </h4>
            <div style={{ fontSize: '11px', color: '#ffffff', lineHeight: '1.4' }}>
              <div><strong>Latency:</strong> {health.network.latency}ms</div>
              <div><strong>Block Height:</strong> {health.network.blockHeight || 'Unknown'}</div>
              <div><strong>Last Check:</strong> {new Date(health.network.lastCheck).toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Issues & Recommendations */}
          {health.issues.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#FFA500', fontSize: '14px' }}>
                Issues Detected
              </h4>
              <div style={{ fontSize: '11px', color: '#FFA500', lineHeight: '1.4' }}>
                {health.issues.map((issue, index) => (
                  <div key={index}>• {issue}</div>
                ))}
              </div>
            </div>
          )}

          {health.recommendations.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#00ff00', fontSize: '14px' }}>
                Recommendations
              </h4>
              <div style={{ fontSize: '11px', color: '#00ff00', lineHeight: '1.4' }}>
                {health.recommendations.map((rec, index) => (
                  <div key={index}>• {rec}</div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#00ffff', fontSize: '14px' }}>
                Recent Transactions
              </h4>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {transactions.slice(0, 5).map((tx) => (
                  <div 
                    key={tx.signature} 
                    style={{
                      padding: '4px 8px',
                      marginBottom: '4px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '10px',
                      color: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                      </span>
                      <span style={{
                        color: tx.status === 'confirmed' || tx.status === 'finalized' ? '#00ff00' :
                              tx.status === 'failed' || tx.status === 'timeout' ? '#ff0000' : '#FFA500'
                      }}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    {tx.description && (
                      <div style={{ color: '#aaaaaa', fontSize: '9px' }}>
                        {tx.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Button */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              onClick={() => {
                const diagnostics = generateDiagnostics();
                console.log('Connection Diagnostics:', diagnostics);
                alert('Diagnostics saved to console');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                color: '#00ffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Generate Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
