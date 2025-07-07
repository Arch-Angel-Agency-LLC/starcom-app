import React from 'react';
import { XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { ErrorDetail } from '../../types/errors';
import styles from './ErrorDisplay.module.css';

interface ErrorDisplayProps {
  error: ErrorDetail | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Reusable error display component for OSINT panels
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = ''
}) => {
  if (!error) return null;
  
  // Determine icon based on error category and severity
  const getIcon = () => {
    if (error.severity === 'critical' || error.category === 'security') {
      return <XCircle className={styles.iconCritical} />;
    } else if (error.severity === 'error') {
      return <AlertTriangle className={styles.iconError} />;
    } else {
      return <Info className={styles.iconWarning} />;
    }
  };
  
  // Get CSS class based on severity
  const getSeverityClass = (): string => {
    switch (error.severity) {
      case 'critical':
        return styles.critical;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      case 'info':
        return styles.info;
      default:
        return styles.error;
    }
  };
  
  return (
    <div className={`${styles.errorContainer} ${getSeverityClass()} ${className}`}>
      <div className={styles.iconContainer}>
        {getIcon()}
      </div>
      
      <div className={styles.content}>
        <div className={styles.message}>{error.message}</div>
        
        {error.operation && (
          <div className={styles.operation}>
            Operation: <span>{error.operation}</span>
          </div>
        )}
        
        {error.userActions && error.userActions.length > 0 && (
          <div className={styles.actions}>
            <span>Suggested actions:</span>
            <ul>
              {error.userActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className={styles.controls}>
        {error.retryable && onRetry && (
          <button 
            className={styles.retryButton}
            onClick={onRetry}
            title="Retry operation"
          >
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        )}
        
        {onDismiss && (
          <button 
            className={styles.dismissButton}
            onClick={onDismiss}
            title="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
