/**
 * TDD Feature 9: Comprehensive Audit Trail Hook
 * 
 * Implements comprehensive authentication event logging with GDPR compliance features
 * including data export, deletion, and privacy controls.
 */

import { useState, useEffect, useCallback } from 'react';

// Types for audit trail
export interface AuthEvent {
  id: string;
  timestamp: number;
  eventType: 'login' | 'logout' | 'register' | 'failed_login' | 'biometric_auth' | 'fallback_auth' | 'token_refresh' | 'session_expired' | 'permission_denied' | 'role_change';
  userId?: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface AuditConfig {
  enabled: boolean;
  retentionDays: number;
  gdprMode: boolean;
  anonymizeAfterDays: number;
  exportFormat: 'json' | 'csv' | 'xml';
  sensitiveFields: string[];
  logLevels: ('low' | 'medium' | 'high' | 'critical')[];
}

export interface GDPRExportData {
  userEvents: AuthEvent[];
  metadata: {
    exportDate: number;
    totalEvents: number;
    dateRange: { start: number; end: number };
    dataRetentionPolicy: string;
  };
}

export interface UseAuditTrailReturn {
  // Event Logging
  logAuthEvent: (event: Omit<AuthEvent, 'id' | 'timestamp' | 'deviceId'>) => Promise<boolean>;
  getAuthEvents: (filters?: EventFilters) => Promise<AuthEvent[]>;
  searchEvents: (query: string) => Promise<AuthEvent[]>;
  
  // GDPR Compliance
  exportUserData: (userId: string) => Promise<GDPRExportData>;
  deleteUserData: (userId: string) => Promise<boolean>;
  anonymizeUserData: (userId: string) => Promise<boolean>;
  requestDataDeletion: (userId: string, reason: string) => Promise<boolean>;
  
  // Data Management
  cleanupOldEvents: () => Promise<number>;
  getAuditStats: () => Promise<AuditStats>;
  
  // Configuration
  updateAuditConfig: (config: Partial<AuditConfig>) => Promise<boolean>;
  getAuditConfig: () => AuditConfig;
  
  // State
  auditEnabled: boolean;
  gdprCompliant: boolean;
  totalEvents: number;
  lastCleanup: number;
}

export interface EventFilters {
  userId?: string;
  eventType?: AuthEvent['eventType'];
  startDate?: number;
  endDate?: number;
  riskLevel?: AuthEvent['riskLevel'];
  success?: boolean;
  limit?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByRisk: Record<string, number>;
  successRate: number;
  averageEventsPerDay: number;
  topUsers: Array<{ userId: string; eventCount: number }>;
  recentActivity: AuthEvent[];
}

/**
 * Default audit configuration
 */
const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  retentionDays: 90, // 90 days retention
  gdprMode: true,
  anonymizeAfterDays: 365, // Anonymize after 1 year
  exportFormat: 'json',
  sensitiveFields: ['ipAddress', 'userAgent', 'details.password', 'details.biometricData'],
  logLevels: ['low', 'medium', 'high', 'critical']
};

/**
 * Generate unique event ID
 */
const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get device information
 */
const getDeviceInfo = (): { deviceId: string; userAgent?: string } => {
  let deviceId = localStorage.getItem('starcom_device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('starcom_device_id', deviceId);
  }

  return {
    deviceId,
    userAgent: navigator.userAgent
  };
};

/**
 * Hook for managing comprehensive audit trail
 */
export const useAuditTrail = (): UseAuditTrailReturn => {
  const [auditConfig, setAuditConfig] = useState<AuditConfig>(DEFAULT_AUDIT_CONFIG);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [lastCleanup, setLastCleanup] = useState<number>(0);

  const auditEnabled = auditConfig.enabled;
  const gdprCompliant = auditConfig.gdprMode;

  // Get stored events from localStorage
  const getStoredEvents = useCallback((): AuthEvent[] => {
    try {
      const stored = localStorage.getItem('starcom_audit_events');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load audit events:', error);
      return [];
    }
  }, []);

  // Store events to localStorage
  const storeEvents = useCallback((events: AuthEvent[]): void => {
    try {
      localStorage.setItem('starcom_audit_events', JSON.stringify(events));
      setTotalEvents(events.length);
    } catch (error) {
      console.error('Failed to store audit events:', error);
    }
  }, []);

  // Log authentication event
  const logAuthEvent = useCallback(async (eventData: Omit<AuthEvent, 'id' | 'timestamp' | 'deviceId'>): Promise<boolean> => {
    if (!auditConfig.enabled) {
      return false;
    }

    try {
      const deviceInfo = getDeviceInfo();
      const event: AuthEvent = {
        id: generateEventId(),
        timestamp: Date.now(),
        deviceId: deviceInfo.deviceId,
        userAgent: deviceInfo.userAgent,
        ...eventData
      };

      // Filter sensitive data if GDPR mode is enabled
      if (auditConfig.gdprMode) {
        auditConfig.sensitiveFields.forEach(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            const parentData = event[parent as keyof AuthEvent];
            if (parentData && typeof parentData === 'object' && parentData !== null) {
              delete (parentData as Record<string, unknown>)[child];
            }
          } else {
            // Use type assertion with unknown first to avoid TypeScript error
            delete (event as unknown as Record<string, unknown>)[field];
          }
        });
      }

      const events = getStoredEvents();
      events.push(event);

      // Keep only events within retention period
      const retentionCutoff = Date.now() - (auditConfig.retentionDays * 24 * 60 * 60 * 1000);
      const filteredEvents = events.filter(e => e.timestamp > retentionCutoff);

      storeEvents(filteredEvents);

      return true;
    } catch (error) {
      console.error('Failed to log auth event:', error);
      return false;
    }
  }, [auditConfig, getStoredEvents, storeEvents]);

  // Get authentication events with filters
  const getAuthEvents = useCallback(async (filters: EventFilters = {}): Promise<AuthEvent[]> => {
    try {
      let events = getStoredEvents();

      // Apply filters
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.riskLevel) {
        events = events.filter(e => e.riskLevel === filters.riskLevel);
      }
      if (filters.success !== undefined) {
        events = events.filter(e => e.success === filters.success);
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp - a.timestamp);

      // Apply limit
      if (filters.limit) {
        events = events.slice(0, filters.limit);
      }

      return events;
    } catch (error) {
      console.error('Failed to get auth events:', error);
      return [];
    }
  }, [getStoredEvents]);

  // Search events by query
  const searchEvents = useCallback(async (query: string): Promise<AuthEvent[]> => {
    try {
      const events = getStoredEvents();
      const searchTerm = query.toLowerCase();

      return events.filter(event => {
        const searchableText = [
          event.eventType,
          event.userId || '',
          event.deviceId,
          event.riskLevel,
          JSON.stringify(event.details || {}),
          JSON.stringify(event.metadata || {})
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    } catch (error) {
      console.error('Failed to search events:', error);
      return [];
    }
  }, [getStoredEvents]);

  // Export user data for GDPR compliance
  const exportUserData = useCallback(async (userId: string): Promise<GDPRExportData> => {
    try {
      const userEvents = await getAuthEvents({ userId });
      
      const dateRange = userEvents.length > 0 
        ? {
            start: Math.min(...userEvents.map(e => e.timestamp)),
            end: Math.max(...userEvents.map(e => e.timestamp))
          }
        : { start: 0, end: 0 };

      return {
        userEvents,
        metadata: {
          exportDate: Date.now(),
          totalEvents: userEvents.length,
          dateRange,
          dataRetentionPolicy: `Events retained for ${auditConfig.retentionDays} days, anonymized after ${auditConfig.anonymizeAfterDays} days`
        }
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }, [getAuthEvents, auditConfig]);

  // Delete user data for GDPR compliance
  const deleteUserData = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const events = getStoredEvents();
      const filteredEvents = events.filter(e => e.userId !== userId);
      
      storeEvents(filteredEvents);

      // Log the deletion event
      await logAuthEvent({
        eventType: 'permission_denied', // Using existing type for GDPR deletion
        userId: 'SYSTEM',
        success: true,
        riskLevel: 'low',
        details: {
          action: 'gdpr_data_deletion',
          targetUserId: userId,
          deletedEvents: events.length - filteredEvents.length
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  }, [getStoredEvents, storeEvents, logAuthEvent]);

  // Anonymize user data
  const anonymizeUserData = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const events = getStoredEvents();
      const anonymizedEvents = events.map(event => {
        if (event.userId === userId) {
          return {
            ...event,
            userId: 'ANONYMIZED',
            ipAddress: undefined,
            userAgent: 'ANONYMIZED',
            details: {
              ...event.details,
              anonymized: true,
              originalTimestamp: event.timestamp
            }
          };
        }
        return event;
      });

      storeEvents(anonymizedEvents);

      // Log the anonymization event
      await logAuthEvent({
        eventType: 'permission_denied', // Using existing type for GDPR anonymization
        userId: 'SYSTEM',
        success: true,
        riskLevel: 'low',
        details: {
          action: 'gdpr_data_anonymization',
          targetUserId: userId
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to anonymize user data:', error);
      return false;
    }
  }, [getStoredEvents, storeEvents, logAuthEvent]);

  // Request data deletion (compliance workflow)
  const requestDataDeletion = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    try {
      // Log the deletion request
      await logAuthEvent({
        eventType: 'permission_denied', // Using existing type for deletion request
        userId: 'SYSTEM',
        success: true,
        riskLevel: 'medium',
        details: {
          action: 'gdpr_deletion_request',
          targetUserId: userId,
          reason,
          requestTimestamp: Date.now()
        }
      });

      // In a real application, this would initiate a compliance workflow
      // For now, we'll automatically delete after logging the request
      return await deleteUserData(userId);
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      return false;
    }
  }, [logAuthEvent, deleteUserData]);

  // Cleanup old events based on retention policy
  const cleanupOldEvents = useCallback(async (): Promise<number> => {
    try {
      const events = getStoredEvents();
      const retentionCutoff = Date.now() - (auditConfig.retentionDays * 24 * 60 * 60 * 1000);
      const anonymizationCutoff = Date.now() - (auditConfig.anonymizeAfterDays * 24 * 60 * 60 * 1000);

      let cleanedEvents = events.filter(e => e.timestamp > retentionCutoff);
      
      // Anonymize old events if GDPR mode is enabled
      if (auditConfig.gdprMode) {
        cleanedEvents = cleanedEvents.map(event => {
          if (event.timestamp < anonymizationCutoff && event.userId && event.userId !== 'ANONYMIZED') {
            return {
              ...event,
              userId: 'ANONYMIZED',
              ipAddress: undefined,
              userAgent: 'ANONYMIZED',
              details: {
                ...event.details,
                anonymized: true,
                originalTimestamp: event.timestamp
              }
            };
          }
          return event;
        });
      }

      const removedCount = events.length - cleanedEvents.length;
      storeEvents(cleanedEvents);
      setLastCleanup(Date.now());

      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup old events:', error);
      return 0;
    }
  }, [auditConfig, getStoredEvents, storeEvents]);

  // Get audit statistics
  const getAuditStats = useCallback(async (): Promise<AuditStats> => {
    try {
      const events = getStoredEvents();
      
      const eventsByType = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const eventsByRisk = events.reduce((acc, event) => {
        acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const successfulEvents = events.filter(e => e.success).length;
      const successRate = events.length > 0 ? (successfulEvents / events.length) * 100 : 0;

      const oldestEvent = events.length > 0 ? Math.min(...events.map(e => e.timestamp)) : Date.now();
      const daysSinceOldest = Math.max(1, Math.ceil((Date.now() - oldestEvent) / (24 * 60 * 60 * 1000)));
      const averageEventsPerDay = events.length / daysSinceOldest;

      const userEventCounts = events.reduce((acc, event) => {
        if (event.userId && event.userId !== 'ANONYMIZED') {
          acc[event.userId] = (acc[event.userId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userEventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, eventCount]) => ({ userId, eventCount }));

      const recentActivity = events
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

      return {
        totalEvents: events.length,
        eventsByType,
        eventsByRisk,
        successRate,
        averageEventsPerDay,
        topUsers,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByRisk: {},
        successRate: 0,
        averageEventsPerDay: 0,
        topUsers: [],
        recentActivity: []
      };
    }
  }, [getStoredEvents]);

  // Update audit configuration
  const updateAuditConfig = useCallback(async (configUpdate: Partial<AuditConfig>): Promise<boolean> => {
    try {
      const newConfig = { ...auditConfig, ...configUpdate };
      setAuditConfig(newConfig);
      localStorage.setItem('starcom_audit_config', JSON.stringify(newConfig));

      // Log configuration change
      await logAuthEvent({
        eventType: 'permission_denied', // Using existing type for config change
        userId: 'SYSTEM',
        success: true,
        riskLevel: 'medium',
        details: {
          action: 'audit_config_update',
          changes: configUpdate
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update audit config:', error);
      return false;
    }
  }, [auditConfig, logAuthEvent]);

  // Get audit configuration
  const getAuditConfig = useCallback((): AuditConfig => {
    return auditConfig;
  }, [auditConfig]);

  // Load persisted configuration and trigger cleanup
  useEffect(() => {
    // Load configuration
    const savedConfig = localStorage.getItem('starcom_audit_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAuditConfig({ ...DEFAULT_AUDIT_CONFIG, ...config });
      } catch (error) {
        console.error('Failed to load audit config:', error);
      }
    }

    // Load last cleanup timestamp
    const savedCleanup = localStorage.getItem('starcom_audit_last_cleanup');
    if (savedCleanup) {
      setLastCleanup(parseInt(savedCleanup, 10));
    }

    // Update total events count
    const events = getStoredEvents();
    setTotalEvents(events.length);
  }, [getStoredEvents]);

  // Auto-cleanup on mount and periodically
  useEffect(() => {
    const performCleanup = async () => {
      const daysSinceCleanup = (Date.now() - lastCleanup) / (24 * 60 * 60 * 1000);
      if (daysSinceCleanup >= 1 || lastCleanup === 0) {
        const removedCount = await cleanupOldEvents();
        if (removedCount > 0) {
          console.log(`Audit cleanup: removed ${removedCount} old events`);
        }
        localStorage.setItem('starcom_audit_last_cleanup', Date.now().toString());
      }
    };

    performCleanup();

    // Cleanup daily
    const cleanupInterval = setInterval(performCleanup, 24 * 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, [lastCleanup, cleanupOldEvents]);

  return {
    // Event Logging
    logAuthEvent,
    getAuthEvents,
    searchEvents,
    
    // GDPR Compliance
    exportUserData,
    deleteUserData,
    anonymizeUserData,
    requestDataDeletion,
    
    // Data Management
    cleanupOldEvents,
    getAuditStats,
    
    // Configuration
    updateAuditConfig,
    getAuditConfig,
    
    // State
    auditEnabled,
    gdprCompliant,
    totalEvents,
    lastCleanup
  };
};

export default useAuditTrail;
