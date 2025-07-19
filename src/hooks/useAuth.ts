import { useContext } from 'react';
import { UnifiedAuthContext } from '../security/context/AuthContext';
import { debugLogger, DebugCategory } from '../utils/debugLogger';

// Component loading debug
debugLogger.info(DebugCategory.COMPONENT_LOAD, 'useAuth.ts loaded - will monitor all auth context access');

export const useAuth = () => {
  const context = useContext(UnifiedAuthContext);
  
  // Debug: Log every time useAuth is called
  debugLogger.debug(DebugCategory.AUTH, 'useAuth called', {
    contextExists: !!context,
    timestamp: new Date().toISOString(),
    callStack: new Error().stack?.split('\n').slice(1, 4).join('\n')
  });
  
  if (!context) {
    debugLogger.error(DebugCategory.AUTH, 'useAuth called outside AuthProvider!', undefined, true); // Force log errors
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Debug: Log context state when accessed
  debugLogger.debug(DebugCategory.AUTH, 'useAuth returning context with state', {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    connectionStatus: context.connectionStatus,
    address: !!context.address,
    error: !!context.error,
    wallet: !!context.wallet,
    connectWallet: !!context.connectWallet
  });
  
  return context;
};
