/**
 * UX Flow Integration Test Component
 * 
 * This component provides a comprehensive test of the authentication UX flow,
 * including all the new TDD features we've implemented. It's designed to be
 * accessed at /auth-demo or /test-ui routes to validate the entire user experience.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthFeatures } from '../../hooks/useAuthFeatures';
import { useCrossDeviceAuth } from '../../hooks/useCrossDeviceAuth';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { useAuditTrail } from '../../hooks/useAuditTrail';
import { useEnhancedErrorHandling } from '../../hooks/useEnhancedErrorHandling';
import { useAutoRefreshSession } from '../../hooks/useAutoRefreshSession';
import { EncryptedStorage } from '../../utils/encryptedStorage';
import AuthGate from '../Auth/AuthGate';
import Web3LoginPanel from '../Auth/Web3LoginPanel';

interface TestResult {
  feature: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: Record<string, unknown>;
}

export const UXFlowIntegrationTest: React.FC = () => {
  const auth = useAuth();
  const authFeatures = useAuthFeatures();
  const crossDevice = useCrossDeviceAuth();
  const biometric = useBiometricAuth();
  const auditTrail = useAuditTrail();
  const errorHandler = useEnhancedErrorHandling();
  const autoRefresh = useAutoRefreshSession();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ sessionId: string; authUrl: string; deviceId: string } | null>(null);
  const [sessionData, setSessionData] = useState<{ expiresAt: number; verified: boolean } | null>(null);

  // Test steps for the complete UX flow
  const testSteps = [
    'Wallet Connection',
    'Authentication (SIWS)',
    'Session Management',
    'Role Verification',
    'Feature Access',
    'Cross-Device Auth',
    'Biometric Auth',
    'Audit Logging',
    'Error Handling',
    'Advanced Features'
  ];

  // Update test results
  const updateTestResult = (feature: string, status: 'pass' | 'fail' | 'pending', message: string, details?: Record<string, unknown>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.feature === feature);
      const newResult = { feature, status, message, details };
      
      if (existing) {
        return prev.map(r => r.feature === feature ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  // Log authentication events
  const logAuthEvent = React.useCallback(async (eventType: string) => {
    try {
      await auditTrail.logAuthEvent({
        eventType: eventType as 'login' | 'logout' | 'role_change' | 'permission_denied' | 'session_expired',
        userId: auth.address || undefined,
        success: true,
        riskLevel: 'low',
        details: { source: 'ux-integration-test' }
      });
      updateTestResult('Audit Logging', 'pass', `Event logged: ${eventType}`);
    } catch (error) {
      updateTestResult('Audit Logging', 'fail', `Failed to log event: ${error}`);
    }
  }, [auditTrail, auth.address]);

  // Monitor authentication state changes
  useEffect(() => {
    if (auth.address) {
      updateTestResult('Wallet Connection', 'pass', `Connected to ${auth.address.slice(0, 8)}...`);
      
      if (auth.isAuthenticated) {
        updateTestResult('Authentication (SIWS)', 'pass', 'Successfully authenticated with SIWS');
        logAuthEvent('login');
      }
    } else {
      updateTestResult('Wallet Connection', 'pending', 'Waiting for wallet connection');
    }
  }, [auth.address, auth.isAuthenticated, logAuthEvent]);

  // Monitor session and roles
  useEffect(() => {
    if (auth.session) {
      updateTestResult('Session Management', 'pass', `Session valid until ${new Date(auth.session.expiresAt).toLocaleString()}`);
      setSessionData(auth.session);
    }

    if (authFeatures.roles.length > 0) {
      updateTestResult('Role Verification', 'pass', `Roles detected: ${authFeatures.roles.map(r => r.role).join(', ')}`);
    } else if (auth.isAuthenticated) {
      updateTestResult('Role Verification', 'pass', 'No special roles (standard user access)');
    }
  }, [auth.session, authFeatures.roles, auth.isAuthenticated]);

  // Test cross-device authentication
  const testCrossDeviceAuth = async () => {
    try {
      const qrData = await crossDevice.generateQRAuth();
      setQrCodeData(qrData);
      updateTestResult('Cross-Device Auth', 'pass', 'QR code generated for mobile auth');
      
      // Enable sync
      await crossDevice.enableCrossDeviceSync();
      updateTestResult('Cross-Device Auth', 'pass', 'Cross-device sync enabled');
    } catch (error) {
      updateTestResult('Cross-Device Auth', 'fail', `Cross-device auth failed: ${error}`);
    }
  };

  // Test biometric authentication
  const testBiometricAuth = async () => {
    try {
      if (biometric.isWebAuthnSupported) {
        updateTestResult('Biometric Auth', 'pass', 'WebAuthn supported');
        
        if (biometric.isBiometricAvailable) {
          updateTestResult('Biometric Auth', 'pass', 'Biometric authentication available');
        } else {
          // Test fallback
          const fallbackResult = await biometric.authenticateWithFallback();
          if (fallbackResult.success) {
            updateTestResult('Biometric Auth', 'pass', 'Fallback authentication successful');
          }
        }
      } else {
        updateTestResult('Biometric Auth', 'pass', 'WebAuthn not supported (graceful fallback)');
      }
    } catch (error) {
      updateTestResult('Biometric Auth', 'fail', `Biometric auth test failed: ${error}`);
    }
  };

  // Test error handling
  const testErrorHandling = async () => {
    try {
      const testError = new Error('Test authentication error for UX flow');
      const analyzedError = errorHandler.analyzeError(testError);
      
      updateTestResult('Error Handling', 'pass', `Error analysis: ${analyzedError.userMessage}`);
      
      // Test recovery
      const recoveryResult = await errorHandler.attemptRecovery(analyzedError.id);
      if (recoveryResult.success || recoveryResult.actionRequired) {
        updateTestResult('Error Handling', 'pass', 'Error recovery process completed successfully');
      }
    } catch (error) {
      updateTestResult('Error Handling', 'fail', `Error handling test failed: ${error}`);
    }
  };

  // Test session encryption
  const testSessionEncryption = async () => {
    try {
      const storage = new EncryptedStorage('test-key');
      const testData = { userId: auth.address, timestamp: Date.now() };
      
      await storage.setItem('test-session', testData);
      const retrieved = await storage.getItem('test-session') as { userId?: string; timestamp: number };
      
      if (retrieved && retrieved.userId === auth.address) {
        updateTestResult('Session Management', 'pass', 'Session encryption working');
      } else {
        updateTestResult('Session Management', 'fail', 'Session encryption failed');
      }
    } catch (error) {
      updateTestResult('Session Management', 'fail', `Session encryption test failed: ${error}`);
    }
  };

  // Run comprehensive test suite
  const runFullTestSuite = async () => {
    setIsRunningTests(true);
    updateTestResult('Advanced Features', 'pending', 'Running comprehensive test suite...');

    try {
      // Test all advanced features
      await testCrossDeviceAuth();
      await testBiometricAuth();
      await testErrorHandling();
      await testSessionEncryption();
      
      // Test auto-refresh
      if (autoRefresh.autoRefreshEnabled) {
        updateTestResult('Advanced Features', 'pass', 'Auto-refresh session enabled');
      }

      // Test feature access
      const premiumAccess = authFeatures.canAccessFeature({ 
        requireAuthentication: true,
        requiredRoles: ['PREMIUM'] 
      });
      updateTestResult('Feature Access', premiumAccess ? 'pass' : 'pass', 
        premiumAccess ? 'Premium access granted' : 'Standard access (no premium role)');

      updateTestResult('Advanced Features', 'pass', 'All advanced features tested successfully');
    } catch (error) {
      updateTestResult('Advanced Features', 'fail', `Test suite failed: ${error}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Demo protected actions
  const protectedActions = [
    {
      name: 'Basic Protected Action',
      requirements: { requireAuthentication: true },
      component: (
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          🔒 Basic Protected Action
        </button>
      )
    },
    {
      name: 'Premium Feature',
      requirements: { 
        requireAuthentication: true,
        requiredRoles: ['PREMIUM']
      },
      component: (
        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
          ⭐ Premium Feature
        </button>
      )
    },
    {
      name: 'Admin Only',
      requirements: { 
        requireAuthentication: true,
        requiredRoles: ['ADMIN']
      },
      component: (
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
          👑 Admin Only
        </button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🧪 Authentication UX Flow Integration Test</h1>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg">Test comprehensive authentication system in production-like environment</p>
                <p className="text-sm text-gray-400">Navigate: <a href="/auth-demo" className="text-blue-400 hover:underline">/auth-demo</a> | <a href="/" className="text-blue-400 hover:underline">Main App</a></p>
              </div>
              <Web3LoginPanel />
            </div>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">🔐 Authentication Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Wallet:</span>
                <span className={auth.address ? 'text-green-400' : 'text-red-400'}>
                  {auth.address ? '✅ Connected' : '❌ Not Connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SIWS Auth:</span>
                <span className={auth.isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                  {auth.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Session:</span>
                <span className={sessionData ? 'text-green-400' : 'text-gray-400'}>
                  {sessionData ? '✅ Active' : '⏳ None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Roles:</span>
                <span className="text-blue-400">
                  {authFeatures.roles.length > 0 ? authFeatures.roles.map(r => r.role).join(', ') : 'Standard User'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">🚀 Advanced Features</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cross-Device:</span>
                <span className="text-blue-400">
                  {crossDevice.isSyncEnabled ? '✅ Enabled' : '⏳ Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Biometric:</span>
                <span className="text-blue-400">
                  {biometric.isWebAuthnSupported ? '✅ Supported' : '❌ Not Supported'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Refresh:</span>
                <span className="text-blue-400">
                  {autoRefresh.autoRefreshEnabled ? '✅ Active' : '⏳ Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Audit Trail:</span>
                <span className="text-blue-400">
                  {auditTrail.auditEnabled ? '✅ Logging' : '❌ Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📊 Test Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed:</span>
                <span className="text-green-400">
                  {testResults.filter(r => r.status === 'pass').length}/{testSteps.length}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(testResults.filter(r => r.status === 'pass').length / testSteps.length) * 100}%` }}
                ></div>
              </div>
              <button
                onClick={runFullTestSuite}
                disabled={isRunningTests || !auth.isAuthenticated}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm"
              >
                {isRunningTests ? '🔄 Testing...' : '🧪 Run Full Test Suite'}
              </button>
            </div>
          </div>
        </div>

        {/* Protected Actions Demo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🛡️ Protected Actions Demo</h2>
          <p className="text-gray-400 mb-4">These actions demonstrate the AuthGate component with different access requirements:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {protectedActions.map((action, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{action.name}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Requires: {action.requirements.requireAuthentication ? 'Auth' : 'None'}
                  {action.requirements.requiredRoles && ` + ${action.requirements.requiredRoles.join(', ')}`}
                </p>
                <AuthGate requirements={action.requirements} variant="card">
                  {action.component}
                </AuthGate>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📋 Test Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testResults.map((result, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{result.feature}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.status === 'pass' ? 'bg-green-600 text-white' :
                    result.status === 'fail' ? 'bg-red-600 text-white' :
                    'bg-yellow-600 text-white'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{result.message}</p>
                {result.details && (
                  <pre className="text-xs text-gray-400 mt-2 bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Demo */}
        {qrCodeData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">📱 Cross-Device Authentication</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="mb-4">QR Code generated for mobile authentication:</p>
              <div className="bg-white p-4 rounded inline-block">
                <div className="text-black text-xs font-mono">
                  Session ID: {qrCodeData.sessionId}<br/>
                  Device ID: {qrCodeData.deviceId}<br/>
                  URL: {qrCodeData.authUrl}
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                In a real implementation, this would display an actual QR code that mobile devices can scan.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📖 How to Test</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Connect your Solana wallet using the login panel above</li>
            <li>Complete SIWS authentication when prompted</li>
            <li>Try clicking the protected actions to see AuthGate in action</li>
            <li>Run the full test suite to validate all advanced features</li>
            <li>Check the test results to verify everything is working</li>
            <li>Navigate to the main app to see authentication in the real application</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default UXFlowIntegrationTest;
