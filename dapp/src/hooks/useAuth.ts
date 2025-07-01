import { useContext } from 'react';
import { UnifiedAuthContext } from '../security/context/AuthContext';

export const useAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
