/**
 * IntelActionButtons - Report action controls component
 * Provides action buttons for Intel Report operations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { IntelReport3DData } from '../../../models/Intel/IntelVisualization3D';
import styles from './IntelActionButtons.module.css';

interface IntelActionButtonsProps {
  /** Selected reports for batch operations */
  selectedReports?: IntelReport3DData[];
  /** Single report for individual operations */
  report?: IntelReport3DData;
  /** Whether actions are loading */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Layout variant */
  variant?: 'horizontal' | 'vertical' | 'compact' | 'dropdown';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Which actions to show */
  actions?: Array<'view' | 'edit' | 'delete' | 'share' | 'export' | 'archive' | 'locate' | 'analyze' | 'duplicate' | 'flag'>;
  /** Callback for action execution */
  onAction?: (action: string, reports: IntelReport3DData[]) => void;
  /** Callback for batch action confirmation */
  onBatchActionConfirm?: (action: string, reports: IntelReport3DData[]) => Promise<boolean>;
  /** Custom CSS class */
  className?: string;
}

interface ActionConfig {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'warning' | 'danger';
  requiresConfirmation?: boolean;
  batchSupported?: boolean;
  tooltip?: string;
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
  view: {
    id: 'view',
    label: 'View',
    icon: '👁️',
    variant: 'primary',
    batchSupported: false,
    tooltip: 'View report details'
  },
  edit: {
    id: 'edit',
    label: 'Edit',
    icon: '✏️',
    variant: 'secondary',
    batchSupported: false,
    tooltip: 'Edit report'
  },
  delete: {
    id: 'delete',
    label: 'Delete',
    icon: '🗑️',
    variant: 'danger',
    requiresConfirmation: true,
    batchSupported: true,
    tooltip: 'Delete report(s)'
  },
  share: {
    id: 'share',
    label: 'Share',
    icon: '📤',
    variant: 'secondary',
    batchSupported: true,
    tooltip: 'Share report(s)'
  },
  export: {
    id: 'export',
    label: 'Export',
    icon: '💾',
    variant: 'secondary',
    batchSupported: true,
    tooltip: 'Export report(s)'
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    icon: '📦',
    variant: 'warning',
    requiresConfirmation: true,
    batchSupported: true,
    tooltip: 'Archive report(s)'
  },
  locate: {
    id: 'locate',
    label: 'Locate',
    icon: '📍',
    variant: 'primary',
    batchSupported: false,
    tooltip: 'Show on map'
  },
  analyze: {
    id: 'analyze',
    label: 'Analyze',
    icon: '🔍',
    variant: 'secondary',
    batchSupported: true,
    tooltip: 'Analyze report(s)'
  },
  duplicate: {
    id: 'duplicate',
    label: 'Duplicate',
    icon: '📋',
    variant: 'secondary',
    batchSupported: false,
    tooltip: 'Duplicate report'
  },
  flag: {
    id: 'flag',
    label: 'Flag',
    icon: '🚩',
    variant: 'warning',
    batchSupported: true,
    tooltip: 'Flag report(s)'
  }
};

const DEFAULT_ACTIONS = ['view', 'edit', 'delete', 'share', 'export'];

/**
 * IntelActionButtons - Report action controls
 */
export const IntelActionButtons: React.FC<IntelActionButtonsProps> = ({
  selectedReports = [],
  report,
  loading = false,
  disabled = false,
  variant = 'horizontal',
  size = 'medium',
  actions = DEFAULT_ACTIONS,
  onAction,
  onBatchActionConfirm,
  className = ''
}) => {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Determine which reports to act on
  const targetReports = useMemo(() => {
    if (selectedReports.length > 0) {
      return selectedReports;
    } else if (report) {
      return [report];
    }
    return [];
  }, [selectedReports, report]);

  const isBatchOperation = targetReports.length > 1;

  // Filter actions based on context
  const availableActions = useMemo(() => {
    return actions
      .map(actionId => ACTION_CONFIGS[actionId])
      .filter(config => {
        if (!config) return false;
        // Hide batch-unsupported actions for multiple selections
        if (isBatchOperation && !config.batchSupported) return false;
        return true;
      });
  }, [actions, isBatchOperation]);

  // Handle action execution
  const handleAction = useCallback(async (actionId: string) => {
    if (disabled || loading || targetReports.length === 0) return;

    const actionConfig = ACTION_CONFIGS[actionId];
    if (!actionConfig) return;

    // Show confirmation for destructive actions
    if (actionConfig.requiresConfirmation) {
      if (onBatchActionConfirm) {
        const confirmed = await onBatchActionConfirm(actionId, targetReports);
        if (!confirmed) return;
      } else {
        const confirmMessage = isBatchOperation
          ? `Are you sure you want to ${actionConfig.label.toLowerCase()} ${targetReports.length} reports?`
          : `Are you sure you want to ${actionConfig.label.toLowerCase()} this report?`;
        
        if (!window.confirm(confirmMessage)) return;
      }
    }

    setPendingAction(actionId);
    
    try {
      onAction?.(actionId, targetReports);
    } finally {
      setPendingAction(null);
      setShowDropdown(false);
    }
  }, [disabled, loading, targetReports, onBatchActionConfirm, onAction, isBatchOperation]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback(() => {
    setShowDropdown(!showDropdown);
  }, [showDropdown]);

  // Get button classes
  const getButtonClasses = useCallback((actionConfig: ActionConfig, isPrimary = false) => {
    return [
      styles.actionButton,
      styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`],
      styles[`variant${actionConfig.variant.charAt(0).toUpperCase()}${actionConfig.variant.slice(1)}`],
      isPrimary && styles.primary,
      pendingAction === actionConfig.id && styles.loading,
      disabled && styles.disabled
    ].filter(Boolean).join(' ');
  }, [size, pendingAction, disabled]);

  // Compute container classes
  const containerClasses = useMemo(() => [
    styles.container,
    styles[`variant${variant.charAt(0).toUpperCase()}${variant.slice(1)}`],
    loading && styles.loading,
    disabled && styles.disabled,
    isBatchOperation && styles.batchMode,
    className
  ].filter(Boolean).join(' '), [variant, loading, disabled, isBatchOperation, className]);

  if (targetReports.length === 0) {
    return null;
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={containerClasses}>
        <button
          className={styles.dropdownToggle}
          onClick={toggleDropdown}
          disabled={disabled || loading}
          aria-label="Actions menu"
        >
          <span className={styles.dropdownIcon}>⚙️</span>
          <span className={styles.dropdownLabel}>Actions</span>
          <span className={`${styles.dropdownChevron} ${showDropdown ? styles.open : ''}`}>
            ▼
          </span>
        </button>

        {showDropdown && (
          <div className={styles.dropdownMenu}>
            {availableActions.map(actionConfig => (
              <button
                key={actionConfig.id}
                className={styles.dropdownItem}
                onClick={() => handleAction(actionConfig.id)}
                disabled={pendingAction === actionConfig.id || disabled}
                title={actionConfig.tooltip}
              >
                <span className={styles.actionIcon}>{actionConfig.icon}</span>
                <span className={styles.actionLabel}>{actionConfig.label}</span>
                {pendingAction === actionConfig.id && (
                  <span className={styles.actionSpinner} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular button layout
  return (
    <div className={containerClasses}>
      {/* Batch indicator */}
      {isBatchOperation && (
        <div className={styles.batchIndicator}>
          <span className={styles.batchIcon}>📊</span>
          <span className={styles.batchText}>
            {targetReports.length} report{targetReports.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.buttonGroup}>
        {availableActions.map((actionConfig, index) => (
          <button
            key={actionConfig.id}
            className={getButtonClasses(actionConfig, index === 0)}
            onClick={() => handleAction(actionConfig.id)}
            disabled={pendingAction === actionConfig.id || disabled || loading}
            title={actionConfig.tooltip}
          >
            <span className={styles.buttonIcon}>{actionConfig.icon}</span>
            {variant !== 'compact' && (
              <span className={styles.buttonLabel}>{actionConfig.label}</span>
            )}
            {pendingAction === actionConfig.id && (
              <span className={styles.buttonSpinner} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntelActionButtons;
