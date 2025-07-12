/**
 * Monitoring Services Index
 * 
 * Exports all monitoring-related services and utilities for NetRunner.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

export {
  MonitoringService,
  type PerformanceMetric,
  type SystemHealth,
  type ServiceHealth,
  type HealthIssue,
  type WorkflowMetrics,
  type BotMetrics,
  type ErrorSummary,
  type PerformanceTrend,
  type ResourceUtilization,
  type Alert,
  type MonitoringConfig,
  type AlertThresholds
} from './MonitoringService';

// Create singleton monitoring service instance
import { MonitoringService } from './MonitoringService';
export const monitoringService = new MonitoringService();
