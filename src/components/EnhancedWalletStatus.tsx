/**
 * Enhanced Wallet Status Component
 * Comprehensive Web3 authentication status with all standard features
 */

import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNetworkValidation, SolanaCluster } from '../hooks/useNetworkValidation';
import { useConnectionHealth } from '../hooks/useConnectionHealth';
import { useTransactionTracker } from '../hooks/useTransactionTracker';

interface EnhancedWalletStatusProps {
  showDetailed?: boolean;
  className?: string;
}

export function EnhancedWalletStatus({ 
  showDetailed = false, 
  className = '' 
}: EnhancedWalletStatusProps) {
  const { connected, connecting, wallet, publicKey, disconnect } = useWallet();
  const { 
    currentNetwork, 
    supportedNetworks, 
    isValidating, 
    switchNetwork, 
    getNetworkDisplayName,
    isWalletCompatible,
    monitorNetworkHealth 
  } = useNetworkValidation();
  
  const { 
    health, 
    generateDiagnostics
  } = useConnectionHealth();
  
  const { 
    transactions, 
    pendingTransactions, 
    metrics, 
    isTracking,
    clearCompletedTransactions 
  } = useTransactionTracker();

  const [showNetworkSwitcher, setShowNetworkSwitcher] = useState(false);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);
  const [currentDiagnostics, setCurrentDiagnostics] = useState<ReturnType<typeof generateDiagnostics> | null>(null);

  // Health status colors
  const getHealthColor = useCallback((healthLevel: string) => {
    switch (healthLevel) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'poor': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }, []);

  // Network status indicator
  const getNetworkStatusIcon = useCallback(() => {
    if (isValidating) return '🔄';
    if (currentNetwork.error) return '❌';
    if (currentNetwork.isConnected) return '✅';
    return '⚪';
  }, [isValidating, currentNetwork.error, currentNetwork.isConnected]);

  // Handle network switch
  const handleNetworkSwitch = useCallback(async (cluster: string) => {
    const success = await switchNetwork(cluster as SolanaCluster);
    if (success) {
      setShowNetworkSwitcher(false);
    }
  }, [switchNetwork]);

  // Handle diagnostics
  const handleRunDiagnostics = useCallback(async () => {
    setShowDiagnosticsPanel(true);
    const diagData = generateDiagnostics();
    setCurrentDiagnostics(diagData);
  }, [generateDiagnostics, setCurrentDiagnostics]);

  // Wallet connection status
  const renderConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${
        connected ? 'bg-green-500' : connecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span className="font-medium">
        {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
      </span>
      {wallet && (
        <span className="text-sm text-gray-600">({wallet.adapter.name})</span>
      )}
    </div>
  );

  // Network status display
  const renderNetworkStatus = () => (
    <div className="flex items-center space-x-2">
      <span className="text-lg">{getNetworkStatusIcon()}</span>
      <div className="flex flex-col">
        <span className="font-medium">
          {getNetworkDisplayName(currentNetwork.cluster)}
        </span>
        <span className="text-sm text-gray-600">
          {currentNetwork.blockHeight ? `Block: ${currentNetwork.blockHeight}` : 'Loading...'}
        </span>
      </div>
      <button
        onClick={() => setShowNetworkSwitcher(!showNetworkSwitcher)}
        className="text-blue-500 hover:text-blue-700 text-sm"
      >
        Switch
      </button>
    </div>
  );

  // Health status display
  const renderHealthStatus = () => (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${
        health.overall === 'excellent' ? 'bg-green-500' :
        health.overall === 'good' ? 'bg-blue-500' :
        health.overall === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      <span className={`font-medium ${getHealthColor(health.overall)}`}>
        {health.overall.charAt(0).toUpperCase() + health.overall.slice(1)}
      </span>
      <span className="text-sm text-gray-600">
        {health.network.latency}ms
      </span>
    </div>
  );

  // Transaction metrics display
  const renderTransactionMetrics = () => (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <span className="w-2 h-2 bg-blue-500 rounded-full" />
        <span>Pending: {pendingTransactions.length}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span>Success: {metrics.successfulTransactions}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span>Failed: {metrics.failedTransactions}</span>
      </div>
      <span className="text-gray-600">
        Rate: {metrics.successRate.toFixed(1)}%
      </span>
    </div>
  );

  // Network switcher dropdown
  const renderNetworkSwitcher = () => (
    showNetworkSwitcher && (
      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
        <div className="p-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Select Network:</div>
          {supportedNetworks.map(cluster => (
            <button
              key={cluster}
              onClick={() => handleNetworkSwitch(cluster)}
              disabled={isValidating || cluster === currentNetwork.cluster}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                cluster === currentNetwork.cluster 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-700'
              } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getNetworkDisplayName(cluster)}
              {cluster === currentNetwork.cluster && ' ✓'}
            </button>
          ))}
        </div>
      </div>
    )
  );

  // Diagnostics panel
  const renderDiagnosticsPanel = () => (
    showDiagnosticsPanel && currentDiagnostics && (
      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-96">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Connection Diagnostics</h3>
            <button
              onClick={() => setShowDiagnosticsPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium text-gray-700">Wallet Info:</div>
              <div className="text-gray-600">
                {currentDiagnostics.walletInfo.name} - {currentDiagnostics.walletInfo.connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700">Network Info:</div>
              <div className="text-gray-600">
                {currentDiagnostics.networkInfo.cluster} ({currentDiagnostics.networkInfo.endpoint})
              </div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700">Performance:</div>
              <div className="text-gray-600">
                Connection: {currentDiagnostics.performance.connectionTime}ms<br />
                Response: {currentDiagnostics.performance.responseTime}ms<br />
                Error Rate: {currentDiagnostics.performance.errorRate.toFixed(2)}%
              </div>
            </div>
            
            {health.issues.length > 0 && (
              <div>
                <div className="font-medium text-gray-700">Issues:</div>
                <ul className="text-red-600 list-disc list-inside">
                  {health.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {health.recommendations.length > 0 && (
              <div>
                <div className="font-medium text-gray-700">Recommendations:</div>
                <ul className="text-blue-600 list-disc list-inside">
                  {health.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Main Status Display */}
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">Wallet Status:</div>
          {renderConnectionStatus()}
        </div>

        {/* Network Status */}
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">Network:</div>
          {renderNetworkStatus()}
        </div>

        {/* Health Status */}
        {connected && (
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">Health:</div>
            {renderHealthStatus()}
          </div>
        )}

        {/* Transaction Metrics */}
        {connected && isTracking && (
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">Transactions:</div>
            {renderTransactionMetrics()}
          </div>
        )}

        {/* Detailed Information */}
        {showDetailed && connected && (
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Public Key:</span>
              <span className="font-mono text-xs">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Network TPS:</span>
              <span>{currentNetwork.tps?.toFixed(0) || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Confirmation:</span>
              <span>{metrics.averageConfirmationTime ? `${(metrics.averageConfirmationTime / 1000).toFixed(1)}s` : 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2 border-t">
          <button
            onClick={handleRunDiagnostics}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            🔍 Diagnostics
          </button>
          
          <button
            onClick={monitorNetworkHealth}
            className="text-green-500 hover:text-green-700 text-sm"
          >
            🔄 Refresh
          </button>
          
          {isTracking && transactions.length > 0 && (
            <button
              onClick={clearCompletedTransactions}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              🗑️ Clear
            </button>
          )}
          
          {connected && (
            <button
              onClick={disconnect}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ⚡ Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Overlays */}
      {renderNetworkSwitcher()}
      {renderDiagnosticsPanel()}

      {/* Status Indicators */}
      {currentNetwork.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Network Error: {currentNetwork.error}
        </div>
      )}
      
      {!isWalletCompatible() && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          Wallet compatibility issues detected
        </div>
      )}
    </div>
  );
}
