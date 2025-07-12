/**
 * Provider Configuration Panel
 * 
 * Allows users to configure API providers, manage credentials, and control
 * real vs mock API usage for NetRunner OSINT integration.
 * 
 * @author GitHub Copilot  
 * @date July 11, 2025
 */

import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { providerStatusService, ProviderStatus } from '../services/providers/ProviderStatusService';
import { apiConfigManager } from '../../../shared/config/ApiConfigManager';
import styles from './ProviderConfigurationPanel.module.css';

interface ProviderConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: () => void;
}

interface CredentialField {
  key: string;
  label: string;
  type: 'password' | 'text';
  placeholder: string;
  required: boolean;
}

const PROVIDER_CONFIG: Record<string, {
  name: string;
  description: string;
  websiteUrl: string;
  credentialFields: CredentialField[];
}> = {
  shodan: {
    name: 'Shodan',
    description: 'Internet-connected device search engine for discovering exposed systems and services.',
    websiteUrl: 'https://www.shodan.io/',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Shodan API key',
        required: true
      }
    ]
  },
  virustotal: {
    name: 'VirusTotal',
    description: 'File and URL analysis service that provides threat intelligence and malware detection.',
    websiteUrl: 'https://www.virustotal.com/',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your VirusTotal API key',
        required: true
      }
    ]
  },
  censys: {
    name: 'Censys',
    description: 'Internet-wide scanning and enumeration platform for cybersecurity research.',
    websiteUrl: 'https://censys.io/',
    credentialFields: [
      {
        key: 'appId',
        label: 'App ID',
        type: 'text',
        placeholder: 'Enter your Censys App ID',
        required: true
      },
      {
        key: 'secret',
        label: 'Secret',
        type: 'password',
        placeholder: 'Enter your Censys Secret',
        required: true
      }
    ]
  },
  theharvester: {
    name: 'TheHarvester',
    description: 'Email and subdomain enumeration tool that collects information from various sources.',
    websiteUrl: 'https://github.com/laramies/theHarvester',
    credentialFields: [] // No API keys required for basic functionality
  }
};

export const ProviderConfigurationPanel: React.FC<ProviderConfigurationPanelProps> = ({
  isOpen,
  onClose,
  onConfigChange
}) => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [realApisEnabled, setRealApisEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfiguration();
    }
  }, [isOpen]);

  const loadCurrentConfiguration = () => {
    setProviders(providerStatusService.getAllProviderStatuses());
    setRealApisEnabled(apiConfigManager.shouldUseRealApis());
    
    // Load current credentials (without exposing the actual values)
    const currentCredentials: Record<string, Record<string, string>> = {};
    Object.keys(PROVIDER_CONFIG).forEach(providerId => {
      const providerConfig = apiConfigManager.getProviderConfig(providerId);
      currentCredentials[providerId] = {};
      
      PROVIDER_CONFIG[providerId].credentialFields.forEach(field => {
        currentCredentials[providerId][field.key] = providerConfig?.[field.key as keyof typeof providerConfig] ? '••••••••' : '';
      });
    });
    
    setCredentials(currentCredentials);
  };

  const handleCredentialChange = (providerId: string, field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const toggleCredentialVisibility = (providerId: string, field: string) => {
    const key = `${providerId}_${field}`;
    setShowCredentials(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update real APIs setting
      // Note: This would need to be implemented in apiConfigManager
      // For now, we'll just log the changes
      console.log('Saving configuration:', {
        realApisEnabled,
        credentials: Object.keys(credentials).reduce((acc, providerId) => {
          acc[providerId] = credentials[providerId];
          return acc;
        }, {} as Record<string, Record<string, string>>)
      });
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh provider statuses
      providerStatusService.refreshProviderStatuses();
      setProviders(providerStatusService.getAllProviderStatuses());
      
      setHasChanges(false);
      onConfigChange?.();
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    // This would test the actual API connection
    console.log(`Testing connection for ${providerId}`);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>
            <Settings size={20} />
            <span>Provider Configuration</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.globalSettings}>
            <div className={styles.setting}>
              <label className={styles.settingLabel}>
                <input
                  type="checkbox"
                  checked={realApisEnabled}
                  onChange={(e) => {
                    setRealApisEnabled(e.target.checked);
                    setHasChanges(true);
                  }}
                  className={styles.checkbox}
                />
                Enable Real APIs
              </label>
              <div className={styles.settingDescription}>
                When enabled, the system will use real API credentials instead of mock data.
                Ensure you have valid API keys configured before enabling.
              </div>
            </div>
          </div>

          <div className={styles.providersSection}>
            <h3 className={styles.sectionTitle}>API Providers</h3>
            
            {Object.entries(PROVIDER_CONFIG).map(([providerId, config]) => {
              const provider = providers.find(p => p.id === providerId);
              
              return (
                <div key={providerId} className={styles.providerCard}>
                  <div className={styles.providerHeader}>
                    <div className={styles.providerInfo}>
                      <div className={styles.providerName}>
                        {provider?.statusIcon} {config.name}
                      </div>
                      <div className={styles.providerStatus}>
                        {provider?.isRealApi ? 'Live API' : 'Mock Data'}
                      </div>
                    </div>
                    <a
                      href={config.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.websiteLink}
                    >
                      Visit Website
                    </a>
                  </div>
                  
                  <div className={styles.providerDescription}>
                    {config.description}
                  </div>

                  {config.credentialFields.length > 0 && (
                    <div className={styles.credentialFields}>
                      {config.credentialFields.map((field) => {
                        const key = `${providerId}_${field.key}`;
                        const isVisible = showCredentials[key];
                        
                        return (
                          <div key={field.key} className={styles.credentialField}>
                            <label className={styles.fieldLabel}>
                              {field.label}
                              {field.required && <span className={styles.required}>*</span>}
                            </label>
                            <div className={styles.fieldInput}>
                              <input
                                type={isVisible ? 'text' : field.type}
                                value={credentials[providerId]?.[field.key] || ''}
                                onChange={(e) => handleCredentialChange(providerId, field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className={styles.input}
                              />
                              {field.type === 'password' && (
                                <button
                                  type="button"
                                  onClick={() => toggleCredentialVisibility(providerId, field.key)}
                                  className={styles.visibilityToggle}
                                >
                                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      <button
                        onClick={() => handleTestConnection(providerId)}
                        className={styles.testButton}
                        disabled={!credentials[providerId] || Object.values(credentials[providerId]).some(v => !v || v === '••••••••')}
                      >
                        <RefreshCw size={14} />
                        Test Connection
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            {hasChanges && (
              <div className={styles.changeIndicator}>
                <AlertTriangle size={16} />
                Unsaved changes
              </div>
            )}
          </div>
          
          <div className={styles.footerActions}>
            <button
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className={styles.spinning} />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
