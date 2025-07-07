import { useCallback, useState, useEffect, useRef } from 'react';
import { useSIWS } from './useSIWS';

/**
 * Auto-Refresh Session Hook
 * Automatically refreshes SIWS sessions when 75% of TTL has passed
 * Implements TDD Feature 1: Session Auto-Refresh
 */

interface UseAutoRefreshSessionReturn {
  isRefreshing: boolean;
  lastRefreshTime: number | null;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  manualRefresh: () => Promise<boolean>;
  canRefresh: boolean;
  rateLimitReset: number | null;
}

const AUTO_REFRESH_THRESHOLD = 0.75; // Refresh at 75% of session TTL
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute rate limit for manual refresh
const MAX_MANUAL_REFRESHES = 3; // Max 3 manual refreshes per window

export const useAutoRefreshSession = (): UseAutoRefreshSessionReturn => {
  const { session, refreshSession, isSessionValid } = useSIWS();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate when to auto-refresh based on session TTL
  const calculateRefreshTime = useCallback(() => {
    if (!session || !isSessionValid()) {
      return null;
    }

    const sessionDuration = session.expiresAt - session.issuedAt;
    const refreshThreshold = sessionDuration * AUTO_REFRESH_THRESHOLD;
    const refreshTime = session.issuedAt + refreshThreshold;
    
    return refreshTime;
  }, [session, isSessionValid]);

  // Perform auto-refresh
  const performAutoRefresh = useCallback(async () => {
    if (!autoRefreshEnabled || isRefreshing) {
      return;
    }

    console.log('[AutoRefresh] Performing automatic session refresh');
    setIsRefreshing(true);
    
    try {
      const success = await refreshSession();
      if (success) {
        setLastRefreshTime(Date.now());
        console.log('[AutoRefresh] Session refreshed successfully');
      } else {
        console.warn('[AutoRefresh] Session refresh failed');
      }
    } catch (error) {
      console.error('[AutoRefresh] Error during session refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [autoRefreshEnabled, isRefreshing, refreshSession]);

  // Manual refresh with rate limiting
  const manualRefresh = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    
    // Check rate limit
    if (rateLimitResetTime && now < rateLimitResetTime) {
      if (manualRefreshCount >= MAX_MANUAL_REFRESHES) {
        console.warn('[AutoRefresh] Manual refresh rate limited');
        return false;
      }
    } else {
      // Reset rate limit window
      setManualRefreshCount(0);
      setRateLimitResetTime(now + RATE_LIMIT_WINDOW);
    }

    if (isRefreshing) {
      console.warn('[AutoRefresh] Refresh already in progress');
      return false;
    }

    console.log('[AutoRefresh] Performing manual session refresh');
    setIsRefreshing(true);
    setManualRefreshCount(prev => prev + 1);
    
    try {
      const success = await refreshSession();
      if (success) {
        setLastRefreshTime(now);
        console.log('[AutoRefresh] Manual session refresh successful');
        return true;
      } else {
        console.warn('[AutoRefresh] Manual session refresh failed');
        return false;
      }
    } catch (error) {
      console.error('[AutoRefresh] Error during manual refresh:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession, isRefreshing, manualRefreshCount, rateLimitResetTime]);

  // Set up auto-refresh timer
  useEffect(() => {
    if (!autoRefreshEnabled || !session || !isSessionValid()) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    const refreshTime = calculateRefreshTime();
    if (!refreshTime) {
      return;
    }

    const now = Date.now();
    const timeUntilRefresh = refreshTime - now;

    if (timeUntilRefresh <= 0) {
      // Should refresh immediately
      performAutoRefresh();
    } else {
      // Schedule refresh
      console.log(`[AutoRefresh] Scheduling refresh in ${Math.round(timeUntilRefresh / 1000)}s`);
      refreshTimeoutRef.current = setTimeout(performAutoRefresh, timeUntilRefresh);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [session, autoRefreshEnabled, calculateRefreshTime, performAutoRefresh, isSessionValid]);

  // Clean up rate limit timer
  useEffect(() => {
    if (rateLimitResetTime) {
      const now = Date.now();
      const timeUntilReset = rateLimitResetTime - now;
      
      if (timeUntilReset > 0) {
        rateLimitTimeoutRef.current = setTimeout(() => {
          setManualRefreshCount(0);
          setRateLimitResetTime(null);
        }, timeUntilReset);
      }
    }

    return () => {
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
        rateLimitTimeoutRef.current = null;
      }
    };
  }, [rateLimitResetTime]);

  // Calculate if manual refresh is allowed
  const canRefresh = !isRefreshing && (!rateLimitResetTime || 
    Date.now() >= rateLimitResetTime || 
    manualRefreshCount < MAX_MANUAL_REFRESHES);

  return {
    isRefreshing,
    lastRefreshTime,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    manualRefresh,
    canRefresh,
    rateLimitReset: rateLimitResetTime
  };
};
