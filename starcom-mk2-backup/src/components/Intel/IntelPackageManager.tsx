// Intel Package Manager Component - Enhanced Robustness MVP for Cyber Investigation Teams
// Allows teams to create, manage, and organize intel packages for cyber ops
// Enhanced with comprehensive error handling, validation, retry logic, and user feedback

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IntelPackage, CreatePackageRequest } from '../../types/cyberInvestigation';
import CyberInvestigationStorage from '../../services/cyberInvestigationStorage';
import ipfsService from '../../services/IPFSService';
import { useBlockchainAnchor } from '../../services/BlockchainAnchorService';
import { validateWithRules, commonRules } from '../../utils/validation';
import styles from './IntelPackageManager.module.css';

interface IntelPackageManagerProps {
  onClose: () => void;
  investigationId?: string;
  teamId?: string;
}

// Enhanced configuration for robustness
const PACKAGE_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  AUTO_SAVE_INTERVAL_MS: 30000,
  VALIDATION_ENABLED: true,
  OFFLINE_MODE_ENABLED: true,
  MAX_PACKAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000
};

interface ValidationErrors {
  name?: string;
  description?: string;
  type?: string;
  classification?: string;
  affectedSystems?: string;
  tags?: string;
}

interface OperationStatus {
  type: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  message: string;
  timestamp?: Date;
  retryCount?: number;
  canRetry?: boolean;
}

const IntelPackageManager: React.FC<IntelPackageManagerProps> = ({ 
  onClose,
  investigationId,
  teamId
}) => {
  const { connected, publicKey } = useWallet();
  const { anchorContent } = useBlockchainAnchor();
  
  // State management
  const [packages, setPackages] = useState<IntelPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<IntelPackage | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'grid' | 'timeline'>('grid');
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    type: 'idle',
    message: 'Ready'
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Refs for cleanup and persistence
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Create package form state with validation
  const [formData, setFormData] = useState<CreatePackageRequest>({
    name: '',
    description: '',
    type: 'CYBER_INCIDENT',
    tags: [],
    classification: 'UNCLASSIFIED',
    affectedSystems: []
  });

  // Enhanced validation function
  const validateFormData = useCallback((data: CreatePackageRequest): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate name
    const nameValidation = validateWithRules(data.name, [
      commonRules.required('Name'),
      commonRules.minLength(PACKAGE_CONFIG.MIN_NAME_LENGTH, 'Name'),
      commonRules.maxLength(PACKAGE_CONFIG.MAX_NAME_LENGTH, 'Name'),
      commonRules.sanitizeString()
    ]);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.errors[0];
    }

    // Validate description
    const descValidation = validateWithRules(data.description, [
      commonRules.required('Description'),
      commonRules.maxLength(PACKAGE_CONFIG.MAX_DESCRIPTION_LENGTH, 'Description'),
      commonRules.sanitizeString()
    ]);
    if (!descValidation.isValid) {
      errors.description = descValidation.errors[0];
    }

    // Validate affected systems
    if (data.affectedSystems && data.affectedSystems.length > 20) {
      errors.affectedSystems = 'Too many affected systems (max 20)';
    }

    // Validate tags
    if (data.tags && data.tags.length > 10) {
      errors.tags = 'Too many tags (max 10)';
    }

    return errors;
  }, []);

  // Enhanced status update function
  const updateStatus = useCallback((
    type: OperationStatus['type'],
    message: string,
    options: {
      canRetry?: boolean;
      retryCount?: number;
      autoHide?: boolean;
      hideDelay?: number;
    } = {}
  ) => {
    const status: OperationStatus = {
      type,
      message,
      timestamp: new Date(),
      retryCount: options.retryCount,
      canRetry: options.canRetry ?? false
    };

    setOperationStatus(status);

    // Auto-hide success/warning messages
    if (options.autoHide !== false && (type === 'success' || type === 'warning')) {
      setTimeout(() => {
        setOperationStatus(prev => 
          prev.timestamp === status.timestamp 
            ? { type: 'idle', message: 'Ready' }
            : prev
        );
      }, options.hideDelay ?? 3000);
    }
  }, []);

  // Enhanced retry operation wrapper
  const retryOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = PACKAGE_CONFIG.MAX_RETRY_ATTEMPTS
  ): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = PACKAGE_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          updateStatus('loading', `Retrying ${operationName} (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`${operationName} attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error(`${operationName} failed`);
  }, [updateStatus]);

  // Enhanced load packages with error handling
  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      updateStatus('loading', 'Loading intel packages...');
      
      const result = await retryOperation(async () => {
        // Check if abort was requested
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation aborted');
        }

        // Load from local storage first
        const storedPackages = CyberInvestigationStorage.loadPackages();
        
        if (storedPackages.length > 0) {
          return storedPackages;
        } else {
          // Initialize with mock data if no stored data
          const mockPackages: IntelPackage[] = [
            {
              id: 'pkg-001',
              name: 'APT29 Infrastructure Analysis',
              description: 'Analysis of infrastructure used in recent APT29 campaign',
              type: 'THREAT_ANALYSIS',
              createdBy: publicKey?.toString() || 'unknown',
              createdAt: new Date('2025-06-20'),
              updatedAt: new Date('2025-06-24'),
              reportIds: ['report-001', 'report-002'],
              tags: ['APT29', 'infrastructure', 'C2'],
              classification: 'SECRET',
              status: 'ACTIVE',
              affectedSystems: ['mail-server-01', 'workstation-043'],
              threatActors: ['APT29', 'Cozy Bear'],
              ioCs: [
                {
                  type: 'IP',
                  value: '192.168.1.100',
                  description: 'Suspected C2 server',
                  confidence: 'HIGH',
                  source: 'Network monitoring',
                  firstSeen: new Date('2025-06-20'),
                  lastSeen: new Date('2025-06-23'),
                  tags: ['C2', 'suspicious']
                }
              ],
              timeline: [
                {
                  id: 'evt-001',
                  timestamp: new Date('2025-06-20'),
                  type: 'INCIDENT_DETECTED',
                  description: 'Unusual network traffic detected',
                  author: publicKey?.toString() || 'analyst',
                  relatedReports: ['report-001'],
                  evidence: []
                }
              ],
              collaborators: [publicKey?.toString() || 'user'],
              sharedWith: []
            }
          ];
          
          // Save initial mock data
          CyberInvestigationStorage.savePackages(mockPackages);
          return mockPackages;
        }
      }, 'Load Packages');

      setPackages(result);
      updateStatus('success', `Loaded ${result.length} intel packages`, { autoHide: true });
    } catch (error) {
      console.error('Error loading packages:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load packages';
      updateStatus('error', errorMessage, { canRetry: true });
      
      // Enable offline mode if network error
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        updateStatus('warning', 'Operating in offline mode', { autoHide: true, hideDelay: 5000 });
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, retryOperation, updateStatus]);

  // Load packages on mount with cleanup
  useEffect(() => {
    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController();
    
    // Log context if provided
    if (investigationId) {
      console.log('Loading packages for investigation:', investigationId);
    }
    if (teamId) {
      console.log('Loading packages for team:', teamId);
    }
    
    loadPackages();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [loadPackages, investigationId, teamId]);

  // Auto-save functionality
  useEffect(() => {
    if (showCreateForm && formData.name.length > 0) {
      autoSaveRef.current = setInterval(() => {
        try {
          localStorage.setItem('draft_intel_package', JSON.stringify({
            ...formData,
            lastSaved: new Date().toISOString()
          }));
          console.log('Auto-saved draft');
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }, PACKAGE_CONFIG.AUTO_SAVE_INTERVAL_MS);

      return () => {
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
      };
    }
  }, [showCreateForm, formData]);

  // Load draft on form open
  useEffect(() => {
    if (showCreateForm) {
      try {
        const draft = localStorage.getItem('draft_intel_package');
        if (draft) {
          const draftData = JSON.parse(draft);
          setFormData(draftData);
          updateStatus('warning', 'Loaded draft from auto-save', { autoHide: true });
        }
      } catch (error) {
        console.warn('Failed to load draft:', error);
      }
    }
  }, [showCreateForm, updateStatus]);

  // Enhanced create package with comprehensive validation and error handling
  const handleCreatePackage = useCallback(async () => {
    try {
      if (!connected || !publicKey) {
        updateStatus('error', 'Please connect your wallet to create packages');
        return;
      }

      // Validate form data
      const errors = validateFormData(formData);
      setValidationErrors(errors);
      
      if (Object.keys(errors).length > 0) {
        updateStatus('error', 'Please fix validation errors before submitting');
        return;
      }

      setLoading(true);
      updateStatus('loading', 'Creating intel package...');

      const result = await retryOperation(async () => {
        const newPackage: IntelPackage = {
          id: `pkg-${Date.now()}`,
          ...formData,
          createdBy: publicKey.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          reportIds: [],
          status: 'ACTIVE',
          threatActors: [],
          ioCs: [],
          timeline: [{
            id: `evt-${Date.now()}`,
            timestamp: new Date(),
            type: 'INCIDENT_DETECTED',
            description: `Package "${formData.name}" created`,
            author: publicKey.toString(),
            relatedReports: [],
            evidence: []
          }],
          collaborators: [publicKey.toString()],
          sharedWith: []
        };

        // Upload to IPFS with error handling
        updateStatus('loading', 'Uploading to IPFS...');
        const ipfsResult = await ipfsService.uploadIntelPackage(newPackage, publicKey.toString());
        
        if (ipfsResult.success) {
          // Update package with IPFS hash
          newPackage.ipfsHash = ipfsResult.hash;
          
          // Anchor to blockchain
          updateStatus('loading', 'Anchoring to blockchain...');
          const anchorResult = await anchorContent(
            ipfsResult.hash,
            'intel-package',
            formData.classification
          );
          
          if (anchorResult.success) {
            newPackage.onChainRef = anchorResult.transactionId;
            updateStatus('success', 'Package created and anchored successfully!', { autoHide: true });
          } else {
            console.warn('Blockchain anchoring failed:', anchorResult.error);
            updateStatus('warning', 'Package created (IPFS only - blockchain anchoring failed)', { autoHide: true });
          }
        } else {
          console.error('IPFS upload failed:', ipfsResult.error);
          updateStatus('warning', 'Package created (local only - IPFS upload failed)', { autoHide: true });
        }

        return newPackage;
      }, 'Create Package');

      // Save to local storage and update state
      const updatedPackages = [...packages, result];
      setPackages(updatedPackages);
      CyberInvestigationStorage.savePackages(updatedPackages);

      // Clear form and close
      setFormData({
        name: '',
        description: '',
        type: 'CYBER_INCIDENT',
        tags: [],
        classification: 'UNCLASSIFIED',
        affectedSystems: []
      });
      setValidationErrors({});
      setShowCreateForm(false);
      
      // Clear auto-saved draft
      localStorage.removeItem('draft_intel_package');

    } catch (error) {
      console.error('Package creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create package';
      updateStatus('error', errorMessage, { canRetry: true });
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, formData, validateFormData, packages, retryOperation, updateStatus, anchorContent]);

  // Enhanced form field handlers with validation
  const handleFieldChange = useCallback((field: keyof CreatePackageRequest, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [validationErrors]);

  // Handle form input changes with validation
  const handleInputChange = useCallback((field: keyof CreatePackageRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    handleFieldChange(field, event.target.value);
  }, [handleFieldChange]);

  // Handle component close with cleanup
  const handleClose = useCallback(() => {
    // Clear any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear auto-save timer
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
    }

    onClose();
  }, [onClose]);

  const getStatusColor = (status: IntelPackage['status']) => {
    switch (status) {
      case 'ACTIVE': return '#00ff41';
      case 'ANALYZING': return '#ffa500';
      case 'COMPLETED': return '#0099ff';
      case 'ARCHIVED': return '#888';
      default: return '#666';
    }
  };

  const getClassificationColor = (classification: IntelPackage['classification']) => {
    switch (classification) {
      case 'UNCLASSIFIED': return '#4CAF50';
      case 'CONFIDENTIAL': return '#FF9800';
      case 'SECRET': return '#F44336';
      case 'TOP_SECRET': return '#9C27B0';
      default: return '#757575';
    }
  };

  const renderPackageCard = (pkg: IntelPackage) => (
    <div
      key={pkg.id}
      className={styles.packageCard}
      onClick={() => setSelectedPackage(pkg)}
      style={{
        borderLeft: `4px solid ${getStatusColor(pkg.status)}`
      }}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        <div className={styles.cardMeta}>
          <span 
            className={styles.classification}
            style={{ backgroundColor: getClassificationColor(pkg.classification) }}
          >
            {pkg.classification}
          </span>
          <span className={styles.packageType}>{pkg.type.replace('_', ' ')}</span>
        </div>
      </div>

      <p className={styles.packageDescription}>{pkg.description}</p>

      <div className={styles.packageStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Reports:</span>
          <span className={styles.statValue}>{pkg.reportIds.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>IoCs:</span>
          <span className={styles.statValue}>{pkg.ioCs.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Systems:</span>
          <span className={styles.statValue}>{pkg.affectedSystems.length}</span>
        </div>
      </div>

      <div className={styles.packageTags}>
        {pkg.tags.slice(0, 3).map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
        {pkg.tags.length > 3 && (
          <span className={styles.tagMore}>+{pkg.tags.length - 3}</span>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.status} style={{ color: getStatusColor(pkg.status) }}>
          ● {pkg.status}
        </span>
        <span className={styles.updated}>
          {pkg.updatedAt.toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className={styles.createForm}>
      <h3>Create Intel Package</h3>
      
      <div className={styles.formGroup}>
        <label>Package Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          placeholder="e.g., APT29 Infrastructure Analysis"
          className={validationErrors.name ? styles.errorInput : ''}
        />
        {validationErrors.name && (
          <span className={styles.errorText}>{validationErrors.name}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={handleInputChange('description')}
          placeholder="Describe the purpose and scope of this package"
          rows={3}
          className={validationErrors.description ? styles.errorInput : ''}
        />
        {validationErrors.description && (
          <span className={styles.errorText}>{validationErrors.description}</span>
        )}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Type</label>
          <select
            value={formData.type}
            onChange={handleInputChange('type')}
          >
            <option value="CYBER_INCIDENT">Cyber Incident</option>
            <option value="THREAT_ANALYSIS">Threat Analysis</option>
            <option value="ASSET_INVENTORY">Asset Inventory</option>
            <option value="INVESTIGATION">Investigation</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Classification</label>
          <select
            value={formData.classification}
            onChange={handleInputChange('classification')}
          >
            <option value="UNCLASSIFIED">Unclassified</option>
            <option value="CONFIDENTIAL">Confidential</option>
            <option value="SECRET">Secret</option>
            <option value="TOP_SECRET">Top Secret</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Tags (comma-separated)</label>
        <input
          type="text"
          placeholder="e.g., APT29, phishing, malware"
          onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
          className={validationErrors.tags ? styles.errorInput : ''}
        />
        {validationErrors.tags && (
          <span className={styles.errorText}>{validationErrors.tags}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Affected Systems (comma-separated)</label>
        <input
          type="text"
          placeholder="e.g., mail-server-01, workstation-043"
          onChange={(e) => handleFieldChange('affectedSystems', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          className={validationErrors.affectedSystems ? styles.errorInput : ''}
        />
        {validationErrors.affectedSystems && (
          <span className={styles.errorText}>{validationErrors.affectedSystems}</span>
        )}
      </div>

      {/* Operation Status */}
      {operationStatus.type !== 'idle' && (
        <div className={styles.uploadStatus}>
          <span className={styles.statusIcon}>
            {operationStatus.type === 'success' ? '✅' : 
             operationStatus.type === 'error' ? '❌' : 
             operationStatus.type === 'warning' ? '⚠️' : '⏳'}
          </span>
          <span>{operationStatus.message}</span>
          {operationStatus.canRetry && operationStatus.type === 'error' && (
            <button onClick={() => handleCreatePackage()} className={styles.retryBtn}>
              Retry
            </button>
          )}
        </div>
      )}

      <div className={styles.formActions}>
        <button 
          className={styles.cancelBtn}
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </button>
        <button 
          className={styles.createBtn}
          onClick={handleCreatePackage}
          disabled={!formData.name || !formData.description}
        >
          Create Package
        </button>
      </div>
    </div>
  );

  const renderPackageDetail = () => {
    if (!selectedPackage) return null;

    return (
      <div className={styles.packageDetail}>
        <div className={styles.detailHeader}>
          <button 
            className={styles.backBtn}
            onClick={() => setSelectedPackage(null)}
          >
            ← Back
          </button>
          <h2>{selectedPackage.name}</h2>
          <div className={styles.detailMeta}>
            <span 
              className={styles.classification}
              style={{ backgroundColor: getClassificationColor(selectedPackage.classification) }}
            >
              {selectedPackage.classification}
            </span>
          </div>
        </div>

        <div className={styles.detailContent}>
          <div className={styles.detailSection}>
            <h4>Description</h4>
            <p>{selectedPackage.description}</p>
          </div>

          <div className={styles.detailSection}>
            <h4>Indicators of Compromise ({selectedPackage.ioCs.length})</h4>
            <div className={styles.iocList}>
              {selectedPackage.ioCs.map((ioc, index) => (
                <div key={index} className={styles.iocItem}>
                  <div className={styles.iocHeader}>
                    <span className={styles.iocType}>{ioc.type}</span>
                    <span className={styles.iocConfidence}>{ioc.confidence}</span>
                  </div>
                  <div className={styles.iocValue}>{ioc.value}</div>
                  <div className={styles.iocDescription}>{ioc.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4>Affected Systems</h4>
            <div className={styles.systemList}>
              {selectedPackage.affectedSystems.map(system => (
                <span key={system} className={styles.systemTag}>{system}</span>
              ))}
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4>Timeline</h4>
            <div className={styles.timeline}>
              {selectedPackage.timeline.map((event) => (
                <div key={event.id} className={styles.timelineEvent}>
                  <div className={styles.eventTimestamp}>
                    {event.timestamp.toLocaleString()}
                  </div>
                  <div className={styles.eventType}>{event.type}</div>
                  <div className={styles.eventDescription}>{event.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.packageManager}>
      <div className={styles.header}>
        <h2>Intel Package Manager</h2>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button 
              className={view === 'grid' ? styles.active : ''}
              onClick={() => setView('grid')}
            >
              Grid
            </button>
            <button 
              className={view === 'list' ? styles.active : ''}
              onClick={() => setView('list')}
            >
              List
            </button>
          </div>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateForm(true)}
            disabled={!connected}
          >
            + Create Package
          </button>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>
      </div>

      {showCreateForm && renderCreateForm()}
      
      {selectedPackage ? renderPackageDetail() : (
        <div className={styles.packageGrid}>
          {loading ? (
            <div className={styles.loading}>Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className={styles.empty}>
              <p>No intel packages found</p>
              <button 
                className={styles.createBtn}
                onClick={() => setShowCreateForm(true)}
                disabled={!connected}
              >
                Create your first package
              </button>
            </div>
          ) : (
            packages.map(renderPackageCard)
          )}
        </div>
      )}
    </div>
  );
};

export default IntelPackageManager;
