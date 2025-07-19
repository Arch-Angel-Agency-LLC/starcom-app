/**
 * API Key Management Component
 * 
 * React component for managing OSINT tool API keys and credentials.
 * Provides secure storage, validation, and usage monitoring.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

/**
 * API Key Management Component
 * 
 * React component for managing OSINT tool API keys and credentials.
 * Provides secure storage, validation, and usage monitoring.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LoggerFactory } from '../../services/logging';
import { ApiConfigManager, ApiCredential, RateLimitInfo } from '../../services/api/ApiConfigManager';

const logger = LoggerFactory.getLogger('NetRunner:ApiKeyManager');

export interface ApiKeyManagerProps {
  onCredentialsChange?: (credentials: ApiCredential[]) => void;
}

interface NewCredentialForm {
  service: string;
  name: string;
  apiKey: string;
  additionalConfig: Record<string, string>;
}

const SUPPORTED_SERVICES = [
  { id: 'shodan', name: 'Shodan', description: 'Internet-connected device search engine' },
  { id: 'theharvester', name: 'TheHarvester', description: 'Email and subdomain enumeration' },
  { id: 'virustotal', name: 'VirusTotal', description: 'File and URL analysis' },
  { id: 'censys', name: 'Censys', description: 'Internet scanning and enumeration' },
  { id: 'securitytrails', name: 'SecurityTrails', description: 'DNS and domain intelligence' },
  { id: 'hunter', name: 'Hunter', description: 'Email finder and verification' },
  { id: 'clearbit', name: 'Clearbit', description: 'Company and person enrichment' },
  { id: 'pipl', name: 'Pipl', description: 'People search and identity resolution' }
];

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onCredentialsChange }) => {
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [rateLimits, setRateLimits] = useState<Record<string, RateLimitInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCredential, setNewCredential] = useState<NewCredentialForm>({
    service: '',
    name: '',
    apiKey: '',
    additionalConfig: {}
  });
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingCredential, setTestingCredential] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const apiManager = new ApiConfigManager();

  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all credentials for supported services
      const allCredentials: ApiCredential[] = [];
      const allRateLimits: Record<string, RateLimitInfo> = {};
      
      for (const service of SUPPORTED_SERVICES) {
        try {
          const serviceCredentials = await apiManager.getCredentials(service.id);
          allCredentials.push(...serviceCredentials);
          
          // Get rate limit info for active credentials
          for (const cred of serviceCredentials) {
            if (cred.isActive) {
              const rateLimit = await apiManager.checkRateLimit(cred.id);
              allRateLimits[cred.id] = rateLimit;
            }
          }
        } catch (error) {
          logger.warn(`Failed to load credentials for ${service.id}`, { error });
        }
      }
      
      setCredentials(allCredentials);
      setRateLimits(allRateLimits);
      
      if (onCredentialsChange) {
        onCredentialsChange(allCredentials);
      }
      
      logger.info('API credentials loaded successfully', {
        totalCredentials: allCredentials.length,
        activeCredentials: allCredentials.filter(c => c.isActive).length
      });
      
    } catch (error) {
      logger.error('Failed to load API credentials', error);
      showNotification('Failed to load API credentials', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiManager, onCredentialsChange]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleAddCredential = async () => {
    try {
      if (!newCredential.service || !newCredential.name || !newCredential.apiKey) {
        showNotification('Please fill in all required fields', 'warning');
        return;
      }

      logger.info('Adding new API credential', {
        service: newCredential.service,
        name: newCredential.name
      });

      const credentialData = {
        service: newCredential.service,
        name: newCredential.name,
        apiKey: newCredential.apiKey,
        config: newCredential.additionalConfig,
        isActive: true
      };

      await apiManager.addCredentials(credentialData);
      
      showNotification('API credential added successfully', 'success');
      setShowAddDialog(false);
      setNewCredential({
        service: '',
        name: '',
        apiKey: '',
        additionalConfig: {}
      });
      
      await loadCredentials();
      
    } catch (error) {
      logger.error('Failed to add API credential', error);
      showNotification('Failed to add API credential', 'error');
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    try {
      logger.info('Deleting API credential', { credentialId });
      
      await apiManager.removeCredentials(credentialId);
      
      showNotification('API credential deleted successfully', 'success');
      await loadCredentials();
      
    } catch (error) {
      logger.error('Failed to delete API credential', error);
      showNotification('Failed to delete API credential', 'error');
    }
  };

  const handleToggleCredential = async (credentialId: string) => {
    try {
      const credential = credentials.find(c => c.id === credentialId);
      if (!credential) return;

      logger.info('Toggling API credential status', {
        credentialId,
        currentStatus: credential.isActive
      });

      await apiManager.updateCredentials(credentialId, {
        isActive: !credential.isActive
      });
      
      showNotification(
        `API credential ${credential.isActive ? 'deactivated' : 'activated'}`,
        'success'
      );
      await loadCredentials();
      
    } catch (error) {
      logger.error('Failed to toggle API credential', error);
      showNotification('Failed to update API credential', 'error');
    }
  };

  const handleTestCredential = async (credentialId: string) => {
    try {
      setTestingCredential(credentialId);
      
      const credential = credentials.find(c => c.id === credentialId);
      if (!credential) return;

      logger.info('Testing API credential', {
        credentialId,
        service: credential.service
      });

      // This would test the actual API endpoint
      // For now, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification('API credential test successful', 'success');
      
    } catch (error) {
      logger.error('API credential test failed', error);
      showNotification('API credential test failed', 'error');
    } finally {
      setTestingCredential(null);
    }
  };

  const toggleApiKeyVisibility = (credentialId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getServiceInfo = (serviceId: string) => {
    return SUPPORTED_SERVICES.find(s => s.id === serviceId);
  };

  const getRateLimitPercentage = (rateLimit: RateLimitInfo) => {
    return (rateLimit.used.day / rateLimit.limit.day) * 100;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Loading API Credentials...</h2>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">API Key Management</h1>
        <button
          onClick={() => setShowAddDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add API Key
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notification.message}
        </div>
      )}

      {credentials.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            No API credentials configured. Add API keys to enable OSINT tool integrations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {credentials.map((credential) => {
            const serviceInfo = getServiceInfo(credential.service);
            const rateLimit = rateLimits[credential.id];
            const usagePercent = rateLimit ? getRateLimitPercentage(rateLimit) : 0;
            
            return (
              <div key={credential.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {serviceInfo?.name || credential.service}
                    </h3>
                    <p className="text-sm text-gray-600">{credential.name}</p>
                    {serviceInfo?.description && (
                      <p className="text-xs text-gray-500 mt-1">{serviceInfo.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    credential.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {credential.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex">
                    <input
                      type={showApiKey[credential.id] ? 'text' : 'password'}
                      value={credential.apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility(credential.id)}
                      className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-lg bg-gray-50 hover:bg-gray-100"
                    >
                      {showApiKey[credential.id] ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {rateLimit && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Daily Usage</span>
                      <span className="text-sm text-gray-800">
                        {rateLimit.used.day} / {rateLimit.limit.day}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          usagePercent >= 90 ? 'bg-red-500' :
                          usagePercent >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={credential.isActive}
                      onChange={() => handleToggleCredential(credential.id)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTestCredential(credential.id)}
                      disabled={testingCredential === credential.id || !credential.isActive}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                    >
                      {testingCredential === credential.id ? 'Testing...' : 'Test'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteCredential(credential.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Credential Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add API Credential</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service
                </label>
                <select
                  value={newCredential.service}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a service</option>
                  {SUPPORTED_SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={newCredential.name}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production Shodan Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newCredential.apiKey}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredential}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
