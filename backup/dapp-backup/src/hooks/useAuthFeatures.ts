import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useOnChainRoles } from './useOnChainRoles';
import type { OnChainRole, RoleConfig } from './useOnChainRoles';
import { useTokenGate } from './useTokenGate';
import type { TokenGateConfig } from './useTokenGate';
import type { SIWSSession } from './useSIWS';
import { FEATURE_GATES } from '../config/authConfig';

/**
 * Comprehensive Authentication Hook
 * 
 * Combines wallet connection, SIWS authentication, on-chain roles, and token gating
 * into a single, easy-to-use interface for feature gating and access control.
 */

export interface AuthFeatures {
  // Basic authentication
  isWalletConnected: boolean;
  isAuthenticated: boolean;
  address: string | null;
  session: SIWSSession | null;
  
  // Authentication actions
  connectWallet: () => Promise<void>;
  signIn: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Role-based access
  roles: OnChainRole[];
  hasRole: (roleName: string) => boolean;
  refreshRoles: () => Promise<void>;
  
  // Token gating
  hasTokenAccess: (config: TokenGateConfig) => boolean;
  checkTokenAccess: (config: TokenGateConfig) => Promise<boolean>;
  
  // Combined checks
  canAccessFeature: (requirements: FeatureRequirements) => boolean;
  
  // Loading states
  isLoading: boolean;
  isCheckingRoles: boolean;
  isCheckingTokens: boolean;
  
  // Errors
  error: string | null;
  roleError: string | null;
  tokenError: string | null;
}

export interface FeatureRequirements {
  requireAuthentication?: boolean;
  requiredRoles?: string[];
  requiredTokens?: TokenGateConfig[];
  requireAll?: boolean; // If true, all conditions must be met; if false, any condition
}

export function useAuthFeatures(
  roleConfig?: Partial<RoleConfig>,
  defaultTokenConfig?: TokenGateConfig
): AuthFeatures {
  const auth = useAuth();
  const rolesResult = useOnChainRoles(auth.address, roleConfig);
  const tokenResult = useTokenGate(auth.address, defaultTokenConfig || {});

  // Helper to check if user has a specific role
  const hasRole = useCallback((roleName: string) => {
    if (!auth.isAuthenticated || !auth.address) return false;
    return rolesResult.roles.some(role => role.role === roleName && role.hasRole);
  }, [auth.isAuthenticated, auth.address, rolesResult.roles]);

  // Helper to check if user has token access with a specific config
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasTokenAccess = useCallback((_config: TokenGateConfig) => {
    if (!auth.isAuthenticated || !auth.address) return false;
    // For now, return the default token result
    // In a more advanced implementation, we could create multiple token gate instances
    return tokenResult.hasAccess;
  }, [auth.isAuthenticated, auth.address, tokenResult.hasAccess]);

  // Async token access checking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkTokenAccess = useCallback(async (_config: TokenGateConfig) => {
    if (!auth.isAuthenticated || !auth.address) return false;
    // For advanced implementation, we would check the specific config
    await tokenResult.refresh();
    return tokenResult.hasAccess;
  }, [auth.isAuthenticated, auth.address, tokenResult]);

  // Feature access checking
  const canAccessFeature = useCallback((requirements: FeatureRequirements) => {
    const {
      requireAuthentication = true,
      requiredRoles = [],
      requiredTokens = [],
      requireAll = true
    } = requirements;

    // Check authentication requirement
    if (requireAuthentication && !auth.isAuthenticated) {
      return false;
    }

    // If no specific requirements, just need authentication
    if (requiredRoles.length === 0 && requiredTokens.length === 0) {
      return !requireAuthentication || auth.isAuthenticated;
    }

    // Check role requirements
    const roleChecks = requiredRoles.map(roleName => hasRole(roleName));
    const tokenChecks = requiredTokens.map(config => hasTokenAccess(config));
    const allChecks = [...roleChecks, ...tokenChecks];

    if (requireAll) {
      return allChecks.every(check => check);
    } else {
      return allChecks.some(check => check);
    }
  }, [auth.isAuthenticated, hasRole, hasTokenAccess]);

  // Combined loading states
  const isLoading = useMemo(() => 
    auth.isLoading || rolesResult.loading || tokenResult.loading,
    [auth.isLoading, rolesResult.loading, tokenResult.loading]
  );

  // Combined error states
  const combinedError = useMemo(() => 
    auth.error || rolesResult.error || tokenResult.error,
    [auth.error, rolesResult.error, tokenResult.error]
  );

  return {
    // Basic authentication
    isWalletConnected: auth.connectionStatus === 'connected',
    isAuthenticated: auth.isAuthenticated,
    address: auth.address,
    session: auth.session,
    
    // Authentication actions
    connectWallet: auth.connectWallet,
    signIn: auth.signIn,
    disconnect: auth.disconnectWallet,
    
    // Role-based access
    roles: rolesResult.roles,
    hasRole,
    refreshRoles: rolesResult.refetch,
    
    // Token gating
    hasTokenAccess,
    checkTokenAccess,
    
    // Combined checks
    canAccessFeature,
    
    // Loading states
    isLoading,
    isCheckingRoles: rolesResult.loading,
    isCheckingTokens: tokenResult.loading,
    
    // Errors
    error: combinedError,
    roleError: rolesResult.error,
    tokenError: tokenResult.error,
  };
}

// Helper function for common feature requirements
export const createFeatureRequirements = (options: {
  authenticated?: boolean;
  roles?: string[];
  tokens?: TokenGateConfig[];
  requireAll?: boolean;
}): FeatureRequirements => ({
  requireAuthentication: options.authenticated ?? true,
  requiredRoles: options.roles ?? [],
  requiredTokens: options.tokens ?? [],
  requireAll: options.requireAll ?? true,
});

// Common feature requirement presets
export const FEATURE_REQUIREMENTS = {
  // Basic authentication only
  AUTHENTICATED: createFeatureRequirements({ authenticated: true }),
  
  // Public access (no requirements)
  PUBLIC: createFeatureRequirements({ authenticated: false }),
  
  // Admin access
  ADMIN: createFeatureRequirements({
    authenticated: true,
    roles: ['ADMIN'],
  }),
  
  // Premium features (token holders)
  PREMIUM: createFeatureRequirements({
    authenticated: true,
    tokens: [{ minimumBalance: 1 }], // Will be configured with premium token
  }),
  
  // Intelligence marketplace access
  MARKETPLACE: createFeatureRequirements({
    authenticated: true,
    roles: ['ANALYST', 'PREMIUM'],
    requireAll: false, // Either role works
  }),
} as const;

/**
 * Helper hook for checking access to predefined feature gates
 * Uses the centralized FEATURE_GATES configuration
 */
export function useFeatureAccess(feature: keyof typeof FEATURE_GATES): {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  requirements: typeof FEATURE_GATES[keyof typeof FEATURE_GATES];
} {
  const auth = useAuth();
  const gate = FEATURE_GATES[feature];
  
  const rolesResult = useOnChainRoles(auth.address);

  const hasAccess = useMemo(() => {
    // Check authentication requirement
    if (gate.requireAuthentication && !auth.isAuthenticated) {
      return false;
    }

    // If no specific requirements, just need to be authenticated (or not if public)
    if (!('requiredRoles' in gate) && !('requiredTokens' in gate)) {
      return !gate.requireAuthentication || auth.isAuthenticated;
    }

    let roleCheck = true;
    let tokenCheck = true;

    // Check roles if required
    if ('requiredRoles' in gate && gate.requiredRoles) {
      roleCheck = gate.requiredRoles.some((role: string) => 
        rolesResult.roles.some(r => r.role === role && r.hasRole)
      );
    }

    // Check tokens if required (simplified for now)
    if ('requiredTokens' in gate && gate.requiredTokens) {
      // For now, we'll just check if user has any roles
      // In practice, you'd want to integrate with useTokenGate for each token config
      tokenCheck = rolesResult.roles.length > 0;
    }

    // Apply logic based on requireAll setting
    const requireAll = 'requireAll' in gate ? gate.requireAll : true;
    
    if ('requiredRoles' in gate && 'requiredTokens' in gate) {
      return requireAll ? (roleCheck && tokenCheck) : (roleCheck || tokenCheck);
    } else if ('requiredRoles' in gate) {
      return roleCheck;
    } else if ('requiredTokens' in gate) {
      return tokenCheck;
    }

    return true;
  }, [gate, auth.isAuthenticated, rolesResult.roles]);

  return {
    hasAccess,
    loading: rolesResult.loading || auth.isLoading,
    error: rolesResult.error || auth.error,
    requirements: gate,
  };
}
