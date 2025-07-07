/**
 * 🛡️ UNIFIED AUTH HOOK
 * Custom hook for accessing the unified authentication context
 */

import { useContext } from 'react';
import UnifiedAuthContext from './AuthContext';
import type { UnifiedAuthContextType } from './AuthContext';

// TODO: Add comprehensive security event correlation and analysis - PRIORITY: MEDIUM
// TODO: Implement security incident automated response and containment - PRIORITY: HIGH
// TODO: Add support for security metrics and KPI tracking - PRIORITY: MEDIUM
export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};
