// src/components/Debug/DebugControlPanel.tsx
/**
 * Debug Control Panel
 * 
 * Provides runtime control over debug logging feature flags
 * Can be toggled via keyboard shortcut or URL parameter
 */

import React, { useState, useEffect } from 'react';
import { featureFlagManager } from '../../utils/featureFlags';
import type { FeatureFlags } from '../../utils/featureFlags';

interface DebugControlPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DebugControlPanel: React.FC<DebugControlPanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlagManager.getAllFlags());

  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe((newFlags) => {
      setFlags(newFlags);
    });
    return unsubscribe;
  }, []);

  if (!isVisible) return null;

  const handleFlagChange = (flagName: keyof FeatureFlags, value: boolean) => {
    featureFlagManager.setFlag(flagName, value);
  };

  const loggingFlags: Array<{
    key: keyof FeatureFlags;
    label: string;
    description: string;
  }> = [
    {
      key: 'verboseLoggingEnabled',
      label: 'Verbose Logging',
      description: 'General verbose debugging output'
    },
    {
      key: 'authDebugLoggingEnabled',
      label: 'Auth Debug',
      description: 'Authentication & authorization debugging'
    },
    {
      key: 'walletStateLoggingEnabled',
      label: 'Wallet State',
      description: 'Wallet connection state monitoring'
    },
    {
      key: 'siwsDebugLoggingEnabled',
      label: 'SIWS Debug',
      description: 'Sign-In with Solana debugging'
    },
    {
      key: 'authTimelineLoggingEnabled',
      label: 'Auth Timeline',
      description: 'Authentication event timeline tracking'
    },
    {
      key: 'componentLoadLoggingEnabled',
      label: 'Component Loading',
      description: 'Component initialization logging'
    },
    {
      key: 'threeDAssetLoggingEnabled',
      label: '3D Asset Debug',
      description: '3D model loading & diagnostics'
    },
    {
      key: 'intelReportLoggingEnabled',
      label: 'Intel Report Debug',
      description: 'Intel report 3D model specific logs'
    },
    {
      key: 'assetDebugLoggingEnabled',
      label: 'Asset Debug',
      description: 'General asset loading debugging'
    },
    {
      key: 'deploymentDebugLoggingEnabled',
      label: 'Deployment Debug',
      description: 'Deployment & build debugging'
    },
    {
      key: 'performanceLoggingEnabled',
      label: 'Performance',
      description: 'Performance metrics & timing'
    },
    {
      key: 'networkDebugLoggingEnabled',
      label: 'Network Debug',
      description: 'Network requests & responses'
    },
    {
      key: 'securityVerboseLoggingEnabled',
      label: 'Security Debug',
      description: 'Security event logging'
    },
    {
      key: 'serviceInitLoggingEnabled',
      label: 'Service Init',
      description: 'Service initialization logging'
    },
    {
      key: 'consoleErrorMonitoringEnabled',
      label: 'Console Errors',
      description: 'Global error monitoring'
    },
  ];

  const resetToDefaults = () => {
    featureFlagManager.resetToDefaults();
  };

  const disableAllLogging = () => {
    const updates: Partial<FeatureFlags> = {};
    loggingFlags.forEach(flag => {
      updates[flag.key] = false;
    });
    featureFlagManager.updateFlags(updates);
  };

  const enableDevLogging = () => {
    const updates: Partial<FeatureFlags> = {};
    loggingFlags.forEach(flag => {
      updates[flag.key] = true;
    });
    featureFlagManager.updateFlags(updates);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '80vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '20px',
        zIndex: 10000,
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0 }}>🔧 Debug Control Panel</h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid #666',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={enableDevLogging}
          style={{
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            marginRight: '8px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Enable All
        </button>
        <button
          onClick={disableAllLogging}
          style={{
            background: '#cc6600',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            marginRight: '8px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Disable All
        </button>
        <button
          onClick={resetToDefaults}
          style={{
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Reset
        </button>
      </div>

      <div>
        <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#ccc' }}>
          Logging Controls
        </h4>
        {loggingFlags.map(flag => (
          <div
            key={flag.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '4px'
            }}
          >
            <input
              type="checkbox"
              id={flag.key}
              checked={flags[flag.key]}
              onChange={(e) => handleFlagChange(flag.key, e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label
              htmlFor={flag.key}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                fontSize: '11px'
              }}
            >
              <span style={{ fontWeight: 'bold' }}>{flag.label}</span>
              <span style={{ color: '#aaa', fontSize: '10px' }}>
                {flag.description}
              </span>
            </label>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        <strong>Tip:</strong> Use Ctrl+Shift+D to toggle this panel. 
        Changes are saved to localStorage and persist across sessions.
      </div>
    </div>
  );
};

export default DebugControlPanel;
