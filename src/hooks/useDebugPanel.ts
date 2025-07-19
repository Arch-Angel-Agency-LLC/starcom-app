// src/hooks/useDebugPanel.ts
/**
 * Hook for managing debug panel visibility
 * Provides keyboard shortcut and URL parameter support
 */

import { useState, useEffect } from 'react';

export const useDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check URL parameters for debug mode
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    if (debugParam === 'true' || debugParam === '1') {
      setIsVisible(true);
    }

    // Keyboard shortcut: Ctrl+Shift+D
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }

      // ESC to close
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const togglePanel = () => setIsVisible(prev => !prev);
  const closePanel = () => setIsVisible(false);
  const openPanel = () => setIsVisible(true);

  return {
    isVisible,
    togglePanel,
    closePanel,
    openPanel
  };
};
