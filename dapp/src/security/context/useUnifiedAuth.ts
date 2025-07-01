/**
 * 🛡️ UNIFIED AUTH HOOK
 * Custom hook for accessing the unified authentication context
 */

import { useContext } from 'react';
import UnifiedAuthContext from './AuthContext';
import type { UnifiedAuthContextType } from './AuthContext';

export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
