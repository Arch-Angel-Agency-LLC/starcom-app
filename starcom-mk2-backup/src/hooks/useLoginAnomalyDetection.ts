/**
 * Login Anomaly Detection System
 * Detects unusual login patterns, implements progressive rate limiting, and logs security events
 * Implements TDD Feature 6: Login Anomaly Detection
 */

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface LoginAttempt {
  id: string;
  walletAddress: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    lat: number;
    lng: number;
    country?: string;
    city?: string;
  };
  success: boolean;
  failureReason?: string;
  riskScore: number;
}

export interface AnomalyPattern {
  type: 'rapid_attempts' | 'unusual_location' | 'new_device' | 'suspicious_timing' | 'failed_sequence';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: number;
  description: string;
  metadata: Record<string, unknown>;
}

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockUntil: number | null;
  currentDelay: number;
  maxDelay: number;
}

export interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failure' | 'anomaly_detected' | 'rate_limit_triggered' | 'account_locked';
  timestamp: number;
  walletAddress: string;
  details: Record<string, unknown>;
  riskScore: number;
  actionTaken?: string;
}

interface UseLoginAnomalyDetectionReturn {
  detectionEnabled: boolean;
  currentRiskScore: number;
  detectedAnomalies: AnomalyPattern[];
  rateLimitState: RateLimitState;
  securityEvents: SecurityEvent[];
  recordLoginAttempt: (success: boolean, metadata?: Record<string, unknown>) => Promise<AnomalyPattern[]>;
  checkRateLimit: () => boolean;
  getProgressiveDelay: () => number;
  clearAnomalies: () => void;
  exportSecurityEvents: (startDate?: Date, endDate?: Date) => SecurityEvent[];
  isBlocked: boolean;
  anomalyDetectionEnabled: boolean;
  progressiveRateLimiting: boolean;
  securityLoggingEnabled: boolean;
}

const STORAGE_KEY = 'login-anomaly-detection';
const RATE_LIMIT_KEY = 'login-rate-limit';
const SECURITY_EVENTS_KEY = 'security-events';

// Detection thresholds
const MAX_ATTEMPTS_PER_MINUTE = 5;
const MAX_ATTEMPTS_PER_HOUR = 20;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 60000; // 1 minute
const DELAY_MULTIPLIER = 2;

// Risk scoring weights
const RISK_WEIGHTS = {
  rapid_attempts: 30,
  unusual_location: 20,
  new_device: 15,
  suspicious_timing: 10,
  failed_sequence: 25
};

export const useLoginAnomalyDetection = (): UseLoginAnomalyDetectionReturn => {
  const wallet = useWallet();
  const [detectionEnabled] = useState(true);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const [detectedAnomalies, setDetectedAnomalies] = useState<AnomalyPattern[]>([]);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: 0,
    blockUntil: null,
    currentDelay: BASE_DELAY,
    maxDelay: MAX_DELAY
  });
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  const loadPersistedData = useCallback(() => {
    try {
      // Load anomalies
      const storedAnomalies = localStorage.getItem(STORAGE_KEY);
      if (storedAnomalies) {
        const anomalies = JSON.parse(storedAnomalies) as AnomalyPattern[];
        setDetectedAnomalies(anomalies);
      }

      // Load rate limit state
      const storedRateLimit = localStorage.getItem(RATE_LIMIT_KEY);
      if (storedRateLimit) {
        const rateLimit = JSON.parse(storedRateLimit) as RateLimitState;
        setRateLimitState(rateLimit);
      }

      // Load security events
      const storedEvents = localStorage.getItem(SECURITY_EVENTS_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents) as SecurityEvent[];
        setSecurityEvents(events);
      }
    } catch (error) {
      console.error('[AnomalyDetection] Failed to load persisted data:', error);
    }
  }, []);

  const cleanupOldData = useCallback(() => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Remove old anomalies (older than 1 hour)
    setDetectedAnomalies(prev => {
      const filtered = prev.filter(anomaly => anomaly.detected > oneHourAgo);
      if (filtered.length !== prev.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    });

    // Clean up old security events (keep only last 24 hours)
    setSecurityEvents(prev => {
      const filtered = prev.filter(event => event.timestamp > oneDayAgo);
      if (filtered.length !== prev.length) {
        localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(filtered));
      }
      return filtered;
    });
  }, []);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  // Clean up old data periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      cleanupOldData();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanup);
  }, [cleanupOldData]);

  const generateEventId = (): string => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const logSecurityEvent = useCallback((
    type: SecurityEvent['type'],
    details: Record<string, unknown>,
    riskScore: number = 0,
    actionTaken?: string
  ): void => {
    if (!wallet.publicKey) return;

    const event: SecurityEvent = {
      id: generateEventId(),
      type,
      timestamp: Date.now(),
      walletAddress: wallet.publicKey.toString(),
      details,
      riskScore,
      actionTaken
    };

    setSecurityEvents(prev => {
      const updated = [...prev, event];
      localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(updated));
      return updated;
    });

    console.log('[AnomalyDetection] Security event logged:', event);
  }, [wallet.publicKey]);

  const detectRapidAttempts = useCallback((attempts: LoginAttempt[]): AnomalyPattern | null => {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneMinuteAgo);
    const hourlyAttempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo);

    if (recentAttempts.length > MAX_ATTEMPTS_PER_MINUTE) {
      return {
        type: 'rapid_attempts',
        severity: 'high',
        detected: now,
        description: `${recentAttempts.length} attempts in the last minute`,
        metadata: { attempts: recentAttempts.length, timeframe: '1min' }
      };
    }

    if (hourlyAttempts.length > MAX_ATTEMPTS_PER_HOUR) {
      return {
        type: 'rapid_attempts',
        severity: 'medium',
        detected: now,
        description: `${hourlyAttempts.length} attempts in the last hour`,
        metadata: { attempts: hourlyAttempts.length, timeframe: '1hour' }
      };
    }

    return null;
  }, []);

  const detectFailureSequence = useCallback((attempts: LoginAttempt[]): AnomalyPattern | null => {
    const recentFailures = attempts
      .filter(attempt => !attempt.success)
      .slice(-5); // Last 5 failures

    if (recentFailures.length >= 5) {
      const now = Date.now();
      return {
        type: 'failed_sequence',
        severity: 'medium',
        detected: now,
        description: `${recentFailures.length} consecutive failed login attempts`,
        metadata: { consecutiveFailures: recentFailures.length }
      };
    }

    return null;
  }, []);

  const calculateRiskScore = useCallback((anomalies: AnomalyPattern[]): number => {
    return anomalies.reduce((total, anomaly) => {
      const weight = RISK_WEIGHTS[anomaly.type] || 10;
      const severityMultiplier = {
        low: 0.5,
        medium: 1,
        high: 1.5,
        critical: 2
      }[anomaly.severity];
      
      return total + (weight * severityMultiplier);
    }, 0);
  }, []);

  const recordLoginAttempt = useCallback(async (
    success: boolean,
    metadata: Record<string, unknown> = {}
  ): Promise<AnomalyPattern[]> => {
    if (!wallet.publicKey) return [];

    const now = Date.now();
    const attemptId = `attempt_${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Create login attempt record
    const attempt: LoginAttempt = {
      id: attemptId,
      walletAddress: wallet.publicKey.toString(),
      timestamp: now,
      success,
      riskScore: 0,
      ...metadata
    };

    // Get recent attempts for this wallet
    const recentAttempts = securityEvents
      .filter(event => 
        event.walletAddress === wallet.publicKey!.toString() &&
        (event.type === 'login_success' || event.type === 'login_failure')
      )
      .map(event => ({
        id: event.id,
        walletAddress: event.walletAddress,
        timestamp: event.timestamp,
        success: event.type === 'login_success',
        riskScore: event.riskScore
      })) as LoginAttempt[];

    // Add current attempt
    recentAttempts.push(attempt);

    // Detect anomalies
    const newAnomalies: AnomalyPattern[] = [];

    const rapidAttemptsAnomaly = detectRapidAttempts(recentAttempts);
    if (rapidAttemptsAnomaly) {
      newAnomalies.push(rapidAttemptsAnomaly);
    }

    const failureSequenceAnomaly = detectFailureSequence(recentAttempts);
    if (failureSequenceAnomaly) {
      newAnomalies.push(failureSequenceAnomaly);
    }

    // Update anomalies state
    if (newAnomalies.length > 0) {
      setDetectedAnomalies(prev => {
        const updated = [...prev, ...newAnomalies];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Log anomaly detection events
      newAnomalies.forEach(anomaly => {
        logSecurityEvent(
          'anomaly_detected',
          { anomaly, attempt },
          calculateRiskScore([anomaly]),
          `Anomaly detected: ${anomaly.type}`
        );
      });
    }

    // Update risk score
    const allAnomalies = [...detectedAnomalies, ...newAnomalies];
    const riskScore = calculateRiskScore(allAnomalies);
    setCurrentRiskScore(riskScore);

    // Log the login attempt
    logSecurityEvent(
      success ? 'login_success' : 'login_failure',
      { attempt, riskScore },
      riskScore
    );

    return newAnomalies;
  }, [wallet.publicKey, securityEvents, detectedAnomalies, detectRapidAttempts, detectFailureSequence, calculateRiskScore, logSecurityEvent]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();

    // Check if currently blocked
    if (rateLimitState.blockUntil && now < rateLimitState.blockUntil) {
      return false; // Blocked
    }

    // Clear block if expired
    if (rateLimitState.blockUntil && now >= rateLimitState.blockUntil) {
      setRateLimitState(prev => ({
        ...prev,
        blockUntil: null,
        attempts: 0,
        currentDelay: BASE_DELAY
      }));
    }

    return true; // Not blocked
  }, [rateLimitState]);

  const getProgressiveDelay = useCallback((): number => {
    const now = Date.now();
    
    // Check time since last attempt
    const timeSinceLastAttempt = now - rateLimitState.lastAttempt;
    
    // If enough time has passed, reset delay
    if (timeSinceLastAttempt > 60000) { // 1 minute
      return BASE_DELAY;
    }

    // Progressive delay based on recent attempts
    const delay = Math.min(
      rateLimitState.currentDelay * Math.pow(DELAY_MULTIPLIER, rateLimitState.attempts),
      MAX_DELAY
    );

    return delay;
  }, [rateLimitState]);

  const clearAnomalies = useCallback((): void => {
    setDetectedAnomalies([]);
    setCurrentRiskScore(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportSecurityEvents = useCallback((
    startDate?: Date,
    endDate?: Date
  ): SecurityEvent[] => {
    let filtered = [...securityEvents];

    if (startDate) {
      filtered = filtered.filter(event => event.timestamp >= startDate.getTime());
    }

    if (endDate) {
      filtered = filtered.filter(event => event.timestamp <= endDate.getTime());
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [securityEvents]);

  // Computed properties
  const isBlocked = rateLimitState.blockUntil ? Date.now() < rateLimitState.blockUntil : false;
  const anomalyDetectionEnabled = detectionEnabled;
  const progressiveRateLimiting = true; // Always enabled
  const securityLoggingEnabled = true; // Always enabled

  return {
    detectionEnabled,
    currentRiskScore,
    detectedAnomalies,
    rateLimitState,
    securityEvents,
    recordLoginAttempt,
    checkRateLimit,
    getProgressiveDelay,
    clearAnomalies,
    exportSecurityEvents,
    isBlocked,
    anomalyDetectionEnabled,
    progressiveRateLimiting,
    securityLoggingEnabled
  };
};

/**
 * Helper to check if an address has suspicious activity
 */
export const hasRecentSuspiciousActivity = (
  walletAddress: string,
  events: SecurityEvent[],
  hoursBack: number = 24
): boolean => {
  const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
  
  return events.some(event => 
    event.walletAddress === walletAddress &&
    event.timestamp > cutoff &&
    (event.type === 'anomaly_detected' || event.type === 'rate_limit_triggered') &&
    event.riskScore > 30
  );
};

/**
 * Generate security report for analysis
 */
export const generateSecurityReport = (events: SecurityEvent[]): {
  summary: Record<string, number>;
  riskDistribution: Record<string, number>;
  topRiskyAddresses: string[];
} => {
  const summary = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskDistribution = events.reduce((acc, event) => {
    const bucket = event.riskScore < 20 ? 'low' : 
                   event.riskScore < 50 ? 'medium' : 
                   event.riskScore < 80 ? 'high' : 'critical';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const addressRisks = events.reduce((acc, event) => {
    acc[event.walletAddress] = (acc[event.walletAddress] || 0) + event.riskScore;
    return acc;
  }, {} as Record<string, number>);

  const topRiskyAddresses = Object.entries(addressRisks)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([address]) => address);

  return {
    summary,
    riskDistribution,
    topRiskyAddresses
  };
};
