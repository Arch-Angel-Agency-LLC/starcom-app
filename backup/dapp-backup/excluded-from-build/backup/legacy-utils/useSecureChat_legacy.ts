import { useContext } from 'react';
import SecureChatContext, { SecureChatContextType } from './SecureChatContext';

// Custom hook to use SecureChat context
export const useSecureChat = (): SecureChatContextType => {
  const context = useContext(SecureChatContext);
  if (!context) {
    throw new Error('useSecureChat must be used within a SecureChatProvider');
  }
  return context;
};
