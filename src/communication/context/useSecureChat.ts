/**
 * 🗣️ SECURE CHAT HOOK
 * Custom hook for accessing the secure chat context
 */

import { useContext } from 'react';
import SecureChatContext from './SecureChatContext';
import type { SecureChatContextType } from './SecureChatContext';

export const useSecureChat = (): SecureChatContextType => {
  const context = useContext(SecureChatContext);
  if (!context) {
    throw new Error('useSecureChat must be used within a SecureChatProvider');
  }
  return context;
};
