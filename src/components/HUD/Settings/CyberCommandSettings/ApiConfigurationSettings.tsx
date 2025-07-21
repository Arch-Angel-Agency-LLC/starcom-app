/**
 * API Configuration Settings Component
 * Week 3 Day 4+: Real API integration configuration UI
 * 
 * Provides user interface for configuring real threat intelligence APIs:
 * - API key management
 * - Endpoint enable/disable
 * - Rate limit monitoring
 * - Connection testing
 */

import React, { useState, useEffect } from 'react';
import type { ApiConfiguration, ApiEndpoint, ApiCredentials } from '../../../services/CyberThreats/ApiIntegrationService';

// =============================================================================
// INTERFACES
// =============================================================================

interface ApiConfigurationSettingsProps {
  configuration: ApiConfiguration;
  onConfigurationChange: (config: ApiConfiguration) => void;
  onTestConnection: (endpointId: string) => Promise<boolean>;
  apiStatus: Array<{
    id: string;
    name: string;
    provider: string;
    enabled: boolean;
    rate_limit_used: number;
    rate_limit_max: number;
    success_count: number;
    error_count: number;
    last_used: Date;
    free_tier: boolean;
  }>;
}

interface ApiCredentialFormProps {
  provider: string;
  credentials?: ApiCredentials;
  onSave: (credentials: ApiCredentials) => void;
  onCancel: () => void;
}

// =============================================================================
// CREDENTIAL FORM COMPONENT
// =============================================================================

const ApiCredentialForm: React.FC<ApiCredentialFormProps> = ({
  provider,
  credentials,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<ApiCredentials>({
    provider,
    api_key: credentials?.api_key || '',
    username: credentials?.username || '',
    password: credentials?.password || '',
    additional_headers: credentials?.additional_headers || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getProviderInstructions = (provider: string): { instructions: string; signupUrl: string; docsUrl: string } => {
    switch (provider) {
      case 'VirusTotal':
        return {
          instructions: 'Sign up for a free VirusTotal account and get your API key from the API section.',
          signupUrl: 'https://www.virustotal.com/gui/join-us',
          docsUrl: 'https://developers.virustotal.com/reference/overview'
        };
      case 'AbuseIPDB':
        return {
          instructions: 'Register for a free AbuseIPDB account to get 1000 requests per day.',
          signupUrl: 'https://www.abuseipdb.com/register',
          docsUrl: 'https://docs.abuseipdb.com/'
        };
      case 'Shodan':
        return {
          instructions: 'Create a Shodan account. Free tier includes 100 results per month.',
          signupUrl: 'https://account.shodan.io/register',
          docsUrl: 'https://developer.shodan.io/'
        };
      case 'AlienVault':
        return {
          instructions: 'Join the AlienVault OTX community for free threat intelligence.',
          signupUrl: 'https://otx.alienvault.com/signup',
          docsUrl: 'https://otx.alienvault.com/api'
        };
      default:
        return {
          instructions: 'Please refer to the provider documentation for API access.',
          signupUrl: '',
          docsUrl: ''
        };
    }
  };

  const providerInfo = getProviderInstructions(provider);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          Configure {provider} API
        </h3>

        <div className="mb-4 p-3 bg-blue-900 bg-opacity-50 rounded">
          <p className="text-sm text-blue-200 mb-2">
            {providerInfo.instructions}
          </p>
          {providerInfo.signupUrl && (
            <a
              href={providerInfo.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 text-sm underline mr-4"
            >
              Sign Up →
            </a>
          )}
          {providerInfo.docsUrl && (
            <a
              href={providerInfo.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 text-sm underline"
            >
              Docs →
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API Key *
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter your API key"
              required
            />
          </div>

          {provider === 'MISP' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="MISP username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="MISP password"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ApiConfigurationSettings: React.FC<ApiConfigurationSettingsProps> = ({
  configuration,
  onConfigurationChange,
  onTestConnection,
  apiStatus
}) => {
  const [editingCredentials, setEditingCredentials] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleCredentialSave = (credentials: ApiCredentials) => {
    const updatedCredentials = configuration.credentials.filter(c => c.provider !== credentials.provider);
    updatedCredentials.push(credentials);
    
    onConfigurationChange({
      ...configuration,
      credentials: updatedCredentials
    });
    
    setEditingCredentials(null);
  };

  const handleEndpointToggle = (endpointId: string, enabled: boolean) => {
    const updatedEndpoints = configuration.endpoints.map(endpoint =>
      endpoint.id === endpointId ? { ...endpoint, enabled } : endpoint
    );
    
    onConfigurationChange({
      ...configuration,
      endpoints: updatedEndpoints
    });
  };

  const handleTestConnection = async (endpointId: string) => {
    setTestingEndpoint(endpointId);
    
    try {
      const success = await onTestConnection(endpointId);
      setConnectionResults({
        ...connectionResults,
        [endpointId]: {
          success,
          message: success ? 'Connection successful!' : 'Connection failed. Check your credentials.'
        }
      });
    } catch (error) {
      setConnectionResults({
        ...connectionResults,
        [endpointId]: {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const getCredentialsForProvider = (provider: string): ApiCredentials | undefined => {
    return configuration.credentials.find(c => c.provider === provider);
  };

  const getRateLimitStatus = (endpointId: string): { used: number; max: number; percentage: number } => {
    const status = apiStatus.find(s => s.id === endpointId);
    if (!status) return { used: 0, max: 1, percentage: 0 };
    
    return {
      used: status.rate_limit_used,
      max: status.rate_limit_max,
      percentage: (status.rate_limit_used / status.rate_limit_max) * 100
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          API Configuration
        </h3>
        <p className="text-gray-300 text-sm">
          Configure real threat intelligence APIs to enhance data quality. All listed APIs have free tiers.
        </p>
      </div>

      {/* Global Settings */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-md font-medium text-white mb-3">Global Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Global Rate Limit (req/min)
            </label>
            <input
              type="number"
              value={configuration.global_rate_limit}
              onChange={(e) => onConfigurationChange({
                ...configuration,
                global_rate_limit: parseInt(e.target.value) || 100
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              min="1"
              max="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Cache TTL (minutes)
            </label>
            <input
              type="number"
              value={configuration.cache_ttl_minutes}
              onChange={(e) => onConfigurationChange({
                ...configuration,
                cache_ttl_minutes: parseInt(e.target.value) || 15
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              min="1"
              max="60"
            />
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-white">API Endpoints</h4>
        
        {configuration.endpoints.map((endpoint) => {
          const status = apiStatus.find(s => s.id === endpoint.id);
          const rateLimitStatus = getRateLimitStatus(endpoint.id);
          const credentials = getCredentialsForProvider(endpoint.provider);
          const connectionResult = connectionResults[endpoint.id];
          
          return (
            <div key={endpoint.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div>
                    <h5 className="font-medium text-white">{endpoint.name}</h5>
                    <p className="text-sm text-gray-400">
                      {endpoint.provider} • {endpoint.free_tier ? 'Free Tier' : 'Premium'}
                    </p>
                  </div>
                  {endpoint.free_tier && (
                    <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                      FREE
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={endpoint.enabled}
                      onChange={(e) => handleEndpointToggle(endpoint.id, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Enabled</span>
                  </label>
                </div>
              </div>

              {/* Rate Limit Status */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Rate Limit</span>
                  <span>{rateLimitStatus.used}/{rateLimitStatus.max} requests/min</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      rateLimitStatus.percentage > 80 ? 'bg-red-500' : 
                      rateLimitStatus.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, rateLimitStatus.percentage)}%` }}
                  />
                </div>
              </div>

              {/* API Statistics */}
              {status && (
                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-400">Success:</span>
                    <span className="text-green-400 ml-1">{status.success_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Errors:</span>
                    <span className="text-red-400 ml-1">{status.error_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Used:</span>
                    <span className="text-gray-300 ml-1">
                      {status.last_used.getTime() > 0 ? 
                        status.last_used.toLocaleTimeString() : 'Never'
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Connection Test Result */}
              {connectionResult && (
                <div className={`mb-3 p-2 rounded text-sm ${
                  connectionResult.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {connectionResult.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingCredentials(endpoint.provider)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  {credentials ? 'Edit Credentials' : 'Add Credentials'}
                </button>
                
                {credentials && endpoint.enabled && (
                  <button
                    onClick={() => handleTestConnection(endpoint.id)}
                    disabled={testingEndpoint === endpoint.id}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {testingEndpoint === endpoint.id ? 'Testing...' : 'Test Connection'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credential Form Modal */}
      {editingCredentials && (
        <ApiCredentialForm
          provider={editingCredentials}
          credentials={getCredentialsForProvider(editingCredentials)}
          onSave={handleCredentialSave}
          onCancel={() => setEditingCredentials(null)}
        />
      )}
    </div>
  );
};
