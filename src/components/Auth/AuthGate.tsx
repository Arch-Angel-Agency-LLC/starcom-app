import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthFeatures } from '../../hooks/useAuthFeatures';
import type { FeatureRequirements } from '../../hooks/useAuthFeatures';
import { debugLogger, DebugCategory } from '../../utils/debugLogger';
import styles from './AuthGate.module.css';

// Component loading debug
debugLogger.info(DebugCategory.COMPONENT_LOAD, 'AuthGate.tsx loaded - will monitor authentication gating');

// AI-NOTE: Enhanced AuthGate component with comprehensive feature gating
// Supports wallet connection, session auth, role-based access, and token gating

interface AuthGateProps {
  children: React.ReactNode;
  requirements?: FeatureRequirements;
  // Legacy props for backwards compatibility
  requirement?: 'wallet' | 'session' | 'both';
  action?: string;
  fallback?: React.ReactNode;
  inline?: boolean;
  showPrompt?: boolean;
  variant?: 'button' | 'card' | 'banner';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  // New props for enhanced features
  showRoleInfo?: boolean;
  showTokenInfo?: boolean;
}

const AuthGate: React.FC<AuthGateProps> = ({
  children,
  requirements,
  requirement = 'wallet',
  action = 'this action',
  fallback,
  inline = true,
  showPrompt = true,
  variant = 'button',
  size = 'medium',
  className = '',
  showRoleInfo = false,
  showTokenInfo = false,
}) => {
  const auth = useAuth();
  const authFeatures = useAuthFeatures();
  
  // Determine access requirements
  let hasAccess = false;
  let accessDetails = '';

  if (requirements) {
    // Use new feature requirements system
    hasAccess = authFeatures.canAccessFeature(requirements);
    
    // Build access details message
    if (!hasAccess) {
      const details = [];
      if (requirements.requireAuthentication && !auth.isAuthenticated) {
        details.push('authentication required');
      }
      if (requirements.requiredRoles?.length) {
        // TODO: Implement adaptive level-of-detail (LOD) system for 3D models - PRIORITY: MEDIUM
        const missingRoles = requirements.requiredRoles.filter(role => !authFeatures.hasRole(role));
        if (missingRoles.length) {
          details.push(`roles: ${missingRoles.join(', ')}`);
        }
      }
      if (requirements.requiredTokens?.length) {
        details.push('token requirements');
      }
      accessDetails = details.join(', ');
    }
  } else {
    // Use legacy requirement system
    const hasWallet = auth.connectionStatus === 'connected';
    const hasSession = auth.isAuthenticated;
    
    hasAccess = requirement === 'wallet' ? hasWallet :
               requirement === 'session' ? hasSession :
               hasWallet && hasSession;
  }

  // If authenticated, show children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showPrompt) {
    return null;
  }

  // Handle authentication action
  const handleConnect = async () => {
    // 🚨🚨🚨 CRITICAL: AuthGate calling authentication
    console.error('🚨🚨🚨 AUTHGATE CALLING AUTHENTICATION!');
    console.error('Auth requirements:', { requirements, requirement });
    console.error('Current auth state:', {
      isAuthenticated: auth.isAuthenticated,
      address: !!auth.address,
      connectionStatus: auth.connectionStatus
    });
    alert('AuthGate calling authentication - check console!');
    
    try {
      if (requirements) {
        // Handle new feature requirements
        if (requirements.requireAuthentication && !auth.isAuthenticated) {
          if (!auth.address) {
            console.error('🚨 AuthGate: No address, calling connectWallet');
            await auth.connectWallet();
          }
          if (auth.address && !auth.isAuthenticated) {
            console.error('🚨 AuthGate: Have address but not authenticated, calling signIn');
            await auth.signIn();
          }
        }
      } else {
        // Handle legacy requirements
        if (requirement === 'wallet' || requirement === 'both') {
          console.error('🚨 AuthGate: Legacy wallet requirement, calling connectWallet');
          await auth.connectWallet();
        }
        if (requirement === 'session' || requirement === 'both') {
          console.error('🚨 AuthGate: Legacy session requirement, calling signIn');
          await auth.signIn();
        }
      }
    } catch (error) {
      console.error('🚨 AuthGate authentication failed:', error);
    }
  };

  if (!inline) {
    return null; // For non-inline mode, parent should handle redirect
  }

  const getRequirementText = () => {
    if (requirements) {
      if (!auth.address) return 'Connect your wallet';
      if (requirements.requireAuthentication && !auth.isAuthenticated) return 'Sign in';
      if (requirements.requiredRoles?.length) return 'Role required';
      if (requirements.requiredTokens?.length) return 'Token required';
      return 'Access required';
    } else {
      switch (requirement) {
        case 'wallet': return 'Connect your wallet';
        case 'session': return 'Sign in';
        case 'both': return 'Connect wallet and sign in';
        default: return 'Connect wallet';
      }
    }
  };

  const getAccessDetails = () => {
    if (requirements && accessDetails) {
      return `Missing: ${accessDetails}`;
    }
    return getRequirementText();
  };

  const isLoading = auth.connectionStatus === 'connecting' || authFeatures.isLoading;

  if (variant === 'card') {
    return (
      <div className={`${styles.authGate} ${styles.card} ${styles[size]} ${className}`}>
        <div className={styles.prompt}>
          <p className={styles.message}>🔐 Access Required</p>
          <span className={styles.description}>
            {getAccessDetails()} to {action}
          </span>
          {/* Show role and token info if requested */}
          {showRoleInfo && authFeatures.roles.length > 0 && (
            <div className={styles.roleInfo}>
              <p>Your roles: {authFeatures.roles.map(r => r.role).join(', ')}</p>
            </div>
          )}
          {showTokenInfo && auth.address && (
            <div className={styles.tokenInfo}>
              <p>Connected wallet: {auth.address.slice(0, 8)}...</p>
            </div>
          )}
          <button 
            className={styles.connectBtn}
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : getRequirementText()}
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`${styles.authGate} ${styles.banner} ${styles[size]} ${className}`}>
        <span className={styles.message}>
          ⚠️ {getRequirementText()} to {action}
        </span>
        <button 
          className={styles.connectBtn}
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Connect'}
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <button 
      className={`${styles.authGate} ${styles.button} ${styles[size]} ${className}`}
      onClick={handleConnect}
      disabled={isLoading}
      title={`${getRequirementText()} to ${action}`}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner}>⟳</span>
          Loading...
        </>
      ) : (
        <>
          🔗 {getRequirementText()}
        </>
      )}
    </button>
  );
};

export default AuthGate;
