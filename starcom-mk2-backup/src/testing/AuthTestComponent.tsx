// src/testing/AuthTestComponent.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOnChainRoles } from '../hooks/useOnChainRoles';
import { useAuthFeatures } from '../hooks/useAuthFeatures';
import { useFeatureAccess } from '../hooks/useAuthFeatures';
import { createAuthTest } from './auth-interactive-test';

/**
 * Authentication Test Component
 * 
 * This component provides a UI for testing all authentication functionality
 * and demonstrates how to properly integrate auth hooks in React components.
 */
export const AuthTestComponent: React.FC = () => {
  const auth = useAuth();
  const roles = useOnChainRoles(auth.address);
  const authFeatures = useAuthFeatures();
  const premiumAccess = useFeatureAccess('PREMIUM');
  const adminAccess = useFeatureAccess('ADMIN');
  
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Run automated tests
  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const tester = createAuthTest();
      const results = await tester.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults({ success: false, error: String(error) });
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Authentication System Test Interface</h1>
        
        {/* Wallet Connection Status */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">📱 Wallet Status</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Connected:</span> {auth.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><span className="font-medium">Address:</span> {auth.address || 'Not connected'}</p>
            <p><span className="font-medium">Loading:</span> {auth.isLoading ? '⏳ Yes' : '✅ No'}</p>
            {auth.error && <p className="text-red-400"><span className="font-medium">Error:</span> {auth.error}</p>}
          </div>
          <div className="mt-4 space-x-2">
            <button
              onClick={auth.connectWallet}
              disabled={auth.isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              {auth.isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
            <button
              onClick={auth.authenticate}
              disabled={!auth.address || auth.isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Sign In (SIWS)
            </button>
            <button
              onClick={auth.logout}
              disabled={!auth.isAuthenticated}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Role Information */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">👥 User Roles</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Loading:</span> {roles.loading ? '⏳ Yes' : '✅ No'}</p>
            <p><span className="font-medium">Role Count:</span> {roles.roles.length}</p>
            {roles.error && <p className="text-red-400"><span className="font-medium">Error:</span> {roles.error}</p>}
          </div>
          
          {roles.roles.length > 0 && (
            <div className="mt-3">
              <p className="font-medium mb-2">Active Roles:</p>
              <div className="space-y-1">
                {roles.roles.map((role, index) => (
                  <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                    <span className="font-medium">{role.role}</span>
                    <span className="text-gray-400 ml-2">({role.source})</span>
                    {role.metadata && Object.keys(role.metadata).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(role.metadata)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={roles.refetch}
              disabled={roles.loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              {roles.loading ? 'Refreshing...' : 'Refresh Roles'}
            </button>
          </div>
        </div>

        {/* Feature Access */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">🚪 Feature Access</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium">Premium Features</h3>
              <p className="text-sm text-gray-400">Access: {premiumAccess.hasAccess ? '✅ Granted' : '❌ Denied'}</p>
              <p className="text-sm text-gray-400">Loading: {premiumAccess.loading ? '⏳' : '✅'}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium">Admin Panel</h3>
              <p className="text-sm text-gray-400">Access: {adminAccess.hasAccess ? '✅ Granted' : '❌ Denied'}</p>
              <p className="text-sm text-gray-400">Loading: {adminAccess.loading ? '⏳' : '✅'}</p>
            </div>
          </div>
          
          {/* Role Checks */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Role Permissions:</h3>
            <div className="space-y-1 text-sm">
              <p>USER: {authFeatures.hasRole('USER') ? '✅' : '❌'}</p>
              <p>ANALYST: {authFeatures.hasRole('ANALYST') ? '✅' : '❌'}</p>
              <p>MODERATOR: {authFeatures.hasRole('MODERATOR') ? '✅' : '❌'}</p>
              <p>ADMIN: {authFeatures.hasRole('ADMIN') ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>

        {/* Test Runner */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">🧪 Automated Testing</h2>
          <div className="space-y-4">
            <button
              onClick={runTests}
              disabled={isRunningTests}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-6 py-3 rounded font-medium"
            >
              {isRunningTests ? '⏳ Running Tests...' : '🚀 Run Authentication Tests'}
            </button>

            {testResults && (
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="font-medium mb-2">Test Results:</h3>
                <p className="mb-2">
                  <span className="font-medium">Status:</span>{' '}
                  {testResults.success ? '✅ ALL PASSED' : '❌ SOME FAILED'}
                </p>
                
                {testResults.results && (
                  <div className="space-y-1 text-sm">
                    {Object.entries(testResults.results).map(([test, passed]: [string, any]) => (
                      <p key={test}>
                        {passed ? '✅' : '❌'} {test}
                      </p>
                    ))}
                  </div>
                )}

                {testResults.error && (
                  <p className="text-red-400 text-sm mt-2">Error: {testResults.error}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => console.log('Auth State:', auth)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
            >
              Log Auth State
            </button>
            <button
              onClick={() => console.log('Roles:', roles)}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
            >
              Log Roles
            </button>
            <button
              onClick={() => console.log('Features:', authFeatures)}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"
            >
              Log Features
            </button>
            <button
              onClick={() => {
                console.log('=== AUTHENTICATION DEBUG INFO ===');
                console.log('Auth:', auth);
                console.log('Roles:', roles);
                console.log('Features:', authFeatures);
                console.log('Premium Access:', premiumAccess);
                console.log('Admin Access:', adminAccess);
              }}
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
            >
              Debug All
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 p-4 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-3">📋 Testing Instructions</h2>
          <div className="text-sm space-y-2 text-gray-300">
            <p>1. <strong>Connect Wallet:</strong> Click "Connect Wallet" to simulate wallet connection</p>
            <p>2. <strong>Sign In:</strong> Click "Sign In (SIWS)" to test cryptographic authentication</p>
            <p>3. <strong>Check Roles:</strong> View your on-chain roles and permissions</p>
            <p>4. <strong>Test Features:</strong> See which features you have access to</p>
            <p>5. <strong>Run Tests:</strong> Execute automated tests to verify all functionality</p>
            <p>6. <strong>Debug:</strong> Use console logging to inspect authentication state</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestComponent;
