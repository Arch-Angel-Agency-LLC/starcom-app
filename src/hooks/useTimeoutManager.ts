import { useRef, useEffect } from 'react';

/**
 * Centralized timeout manager to prevent memory leaks
 * This hook ensures all timeouts are properly cleaned up on component unmount
 */
export const useTimeoutManager = () => {
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const addTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const id = setTimeout(() => {
      callback();
      timeouts.current.delete(id);
    }, delay);
    
    timeouts.current.add(id);
    return id;
  };

  const clearTimeout = (id: NodeJS.Timeout) => {
    global.clearTimeout(id);
    timeouts.current.delete(id);
  };

  const clearAllTimeouts = () => {
    timeouts.current.forEach(id => global.clearTimeout(id));
    timeouts.current.clear();
  };

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  return { 
    addTimeout, 
    clearTimeout, 
    clearAllTimeouts,
    activeTimeoutCount: timeouts.current.size 
  };
};
