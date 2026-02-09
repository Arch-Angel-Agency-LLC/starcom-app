/**
 * MonitoringService.ts
 * 
 * Real-time monitoring and analytics for NetRunner operations.
 * Provides performance tracking, health monitoring, and operational insights.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { LoggerFactory } from '../logging';
import { WorkflowExecution } from '../workflow';
import { ServiceBackoffController, type ServiceBackoffEvent } from '../../../../services/backoff/ServiceBackoffController';
import { emitDiagnosticTrace } from '../../../../services/tracing/traceEmitters';

const logger = LoggerFactory.getLogger('NetRunner:MonitoringService');

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'performance' | 'usage' | 'error' | 'security';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceHealth[];
  lastUpdated: Date;
  uptime: number; // seconds
  metrics: PerformanceMetric[];
}

export interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  lastCheck: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  service: string;
  resolved: boolean;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  activeExecutions: number;
  successRate: number; // percentage
  averageExecutionTime: number; // milliseconds
  errorRate: number; // percentage
  throughput: number; // executions per hour
  topErrors: ErrorSummary[];
  performanceTrends: PerformanceTrend[];
}

export interface BotMetrics {
  totalBots: number;
  activeBots: number;
  tasksCompleted: number;
  tasksPerHour: number;
  successRate: number;
  averageTaskTime: number;
  resourceUtilization: ResourceUtilization;
}

export interface ErrorSummary {
  errorType: string;
  count: number;
  lastOccurrence: Date;
  affectedServices: string[];
}

export interface PerformanceTrend {
  metric: string;
  timestamp: Date;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ResourceUtilization {
  cpu: number; // percentage
  memory: number; // percentage
  network: number; // bytes per second
  storage: number; // percentage
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'capacity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export interface MonitoringConfig {
  metricsRetentionDays: number;
  alertThresholds: AlertThresholds;
  healthCheckInterval: number; // seconds
  performanceMetricsInterval: number; // seconds
  enableDetailedLogging: boolean;
}

export interface AlertThresholds {
  errorRate: number; // percentage
  responseTime: number; // milliseconds
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  failedExecutions: number; // count per hour
}

export class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private healthChecks: Map<string, ServiceHealth> = new Map();
  private workflowExecutions: Map<string, WorkflowExecution> = new Map();
  private startTime: Date = new Date();
  private config: MonitoringConfig;
  private isRunning = false;
  private healthCheckTimer?: ReturnType<typeof setTimeout>;
  private metricsTimer?: ReturnType<typeof setTimeout>;
  private paused = false;
  private healthBackoff = new ServiceBackoffController({
    label: 'monitoring-health',
    baseDelayMs: 1000,
    coolOffThreshold: 3,
    coolOffDurationMs: 20000,
    sampleRate: 0.4,
    minIntervalMs: 2000,
    onEvent: (event) => this.emitBackoffEvent('health', event)
  });
  private metricsBackoff = new ServiceBackoffController({
    label: 'monitoring-metrics',
    baseDelayMs: 500,
    coolOffThreshold: 3,
    coolOffDurationMs: 12000,
    sampleRate: 0.4,
    minIntervalMs: 2000,
    onEvent: (event) => this.emitBackoffEvent('metrics', event)
  });

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      metricsRetentionDays: 30,
      alertThresholds: {
        errorRate: 5, // 5%
        responseTime: 5000, // 5 seconds
        cpuUsage: 80, // 80%
        memoryUsage: 85, // 85%
        diskUsage: 90, // 90%
        failedExecutions: 10 // 10 per hour
      },
      healthCheckInterval: 30, // 30 seconds
      performanceMetricsInterval: 60, // 60 seconds
      enableDetailedLogging: true,
      ...config
    };

    logger.info('MonitoringService initialized', { config: this.config });
  }

  /**
   * Start the monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('MonitoringService is already running');
      return;
    }

    logger.info('Starting MonitoringService');
    this.isRunning = true;
    this.startTime = new Date();

    // Start periodic health checks
    this.scheduleHealthChecks();

    // Start metrics collection
    this.scheduleMetricsCollection();

    // Initial health check
    await this.performHealthChecks();
  }

  /**
   * Stop the monitoring service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('MonitoringService is not running');
      return;
    }

    logger.info('Stopping MonitoringService');
    this.isRunning = false;
    this.paused = true;

    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    if (this.metricsTimer) {
      clearTimeout(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    this.healthBackoff.pause();
    this.metricsBackoff.pause();
  }

  private scheduleHealthChecks(delay = this.config.healthCheckInterval * 1000): void {
    if (!this.isRunning) return;
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
    }

    this.healthCheckTimer = setTimeout(() => {
      void this.runHealthChecks();
    }, delay);
  }

  private async runHealthChecks(): Promise<void> {
    if (!this.isRunning || this.paused) return;

    try {
      await this.healthBackoff.run(() => this.performHealthChecks());
    } catch (error) {
      logger.error('Health checks failed after backoff', error);
    } finally {
      this.scheduleHealthChecks();
    }
  }

  private scheduleMetricsCollection(delay = this.config.performanceMetricsInterval * 1000): void {
    if (!this.isRunning) return;
    if (this.metricsTimer) {
      clearTimeout(this.metricsTimer);
    }

    this.metricsTimer = setTimeout(() => {
      void this.runMetricsCollection();
    }, delay);
  }

  private async runMetricsCollection(): Promise<void> {
    if (!this.isRunning || this.paused) return;

    try {
      await this.metricsBackoff.run(async () => {
        this.collectPerformanceMetrics();
      });
    } catch (error) {
      logger.error('Metrics collection failed after backoff', error);
    } finally {
      this.scheduleMetricsCollection();
    }
  }

  private emitBackoffEvent(channel: 'health' | 'metrics', event: ServiceBackoffEvent): void {
    try {
      window.dispatchEvent(new CustomEvent('service-backoff', { detail: { service: `monitoring-${channel}`, event } }));
    } catch (error) {
      logger.warn('Failed to emit MonitoringService backoff event', { error });
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: new Date(),
      ...metric
    };

    this.metrics.push(fullMetric);
    
    // Clean up old metrics
    this.cleanupOldMetrics();

    // Check for alerts
    this.checkMetricAlerts(fullMetric);

    if (this.config.enableDetailedLogging) {
      logger.debug('Metric recorded', { 
        id: fullMetric.id,
        name: fullMetric.name,
        value: fullMetric.value,
        category: fullMetric.category
      });
    }
  }

  /**
   * Track workflow execution
   */
  trackWorkflowExecution(execution: WorkflowExecution): void {
    this.workflowExecutions.set(execution.id, execution);

    // Record metrics based on execution status
    if (execution.status === 'completed') {
      const duration = execution.endTime ? 
        execution.endTime.getTime() - execution.startTime.getTime() : 0;
      
      this.recordMetric({
        name: 'workflow_execution_duration',
        value: duration,
        unit: 'milliseconds',
        category: 'performance',
        metadata: { workflowId: execution.workflowId }
      });

      this.recordMetric({
        name: 'workflow_execution_success',
        value: 1,
        unit: 'count',
        category: 'usage',
        metadata: { workflowId: execution.workflowId }
      });
    } else if (execution.status === 'failed') {
      this.recordMetric({
        name: 'workflow_execution_failure',
        value: 1,
        unit: 'count',
        category: 'error',
        severity: 'medium',
        metadata: { 
          workflowId: execution.workflowId,
          error: execution.error
        }
      });

      // Create alert for failed execution
      this.createAlert({
        type: 'error',
        severity: 'warning',
        title: 'Workflow Execution Failed',
        message: `Workflow ${execution.workflowId} failed: ${execution.error}`,
        source: 'WorkflowEngine',
        metadata: { executionId: execution.id }
      });
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000;
    const services = Array.from(this.healthChecks.values());
    
    // Determine overall health
    let overall: SystemHealth['overall'] = 'healthy';
    if (services.some(s => s.status === 'offline')) {
      overall = 'critical';
    } else if (services.some(s => s.status === 'degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      lastUpdated: new Date(),
      uptime,
      metrics: this.getRecentMetrics(300) // Last 5 minutes
    };
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(): WorkflowMetrics {
    const executions = Array.from(this.workflowExecutions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    const active = executions.filter(e => e.status === 'running');

    const totalExecutions = executions.length;
    const successRate = totalExecutions > 0 ? (completed.length / totalExecutions) * 100 : 0;
    const errorRate = totalExecutions > 0 ? (failed.length / totalExecutions) * 100 : 0;

    // Calculate average execution time
    const completedWithDuration = completed.filter(e => e.endTime);
    const averageExecutionTime = completedWithDuration.length > 0 ?
      completedWithDuration.reduce((sum, e) => {
        const duration = e.endTime!.getTime() - e.startTime.getTime();
        return sum + duration;
      }, 0) / completedWithDuration.length : 0;

    // Calculate throughput (executions per hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentExecutions = executions.filter(e => e.startTime >= oneHourAgo);
    const throughput = recentExecutions.length;

    return {
      totalExecutions,
      activeExecutions: active.length,
      successRate,
      averageExecutionTime,
      errorRate,
      throughput,
      topErrors: this.getTopErrors(),
      performanceTrends: this.getPerformanceTrends()
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.metadata = {
        ...alert.metadata,
        acknowledgedBy,
        acknowledgedAt: new Date()
      };
      
      logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.metadata = {
        ...alert.metadata,
        resolvedBy,
        resolvedAt: new Date()
      };
      
      logger.info('Alert resolved', { alertId, resolvedBy });
    }
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const services = [
      'WorkflowEngine',
      'ShodanAdapter',
      'TheHarvesterAdapter',
      'IntelAnalyzer',
      'ApiConfigManager',
      'Database'
    ];

    for (const serviceName of services) {
      try {
        const health = await this.checkServiceHealth(serviceName);
        this.healthChecks.set(serviceName, health);
      } catch (error) {
        logger.error(`Health check failed for ${serviceName}`, error);
        
        this.healthChecks.set(serviceName, {
          name: serviceName,
          status: 'offline',
          responseTime: 0,
          errorRate: 100,
          lastCheck: new Date(),
          issues: [{
            id: this.generateAlertId(),
            severity: 'critical',
            message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date(),
            service: serviceName,
            resolved: false
          }]
        });
      }
    }
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    // Simulate health check - in production, this would make actual health check calls
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const responseTime = Date.now() - startTime;
    const errorRate = Math.random() * 2; // Simulate low error rate
    
    return {
      name: serviceName,
      status: errorRate > 5 ? 'degraded' : 'online',
      responseTime,
      errorRate,
      lastCheck: new Date(),
      issues: []
    };
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): void {
    // Collect system performance metrics
    this.recordMetric({
      name: 'system_cpu_usage',
      value: Math.random() * 100, // Simulated
      unit: 'percentage',
      category: 'performance'
    });

    this.recordMetric({
      name: 'system_memory_usage',
      value: Math.random() * 100, // Simulated
      unit: 'percentage',
      category: 'performance'
    });

    this.recordMetric({
      name: 'active_workflows',
      value: Array.from(this.workflowExecutions.values())
        .filter(e => e.status === 'running').length,
      unit: 'count',
      category: 'usage'
    });

    this.recordMetric({
      name: 'total_alerts',
      value: this.getActiveAlerts().length,
      unit: 'count',
      category: 'error'
    });
  }

  /**
   * Create a new alert
   */
  private createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): void {
    const fullAlert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      ...alert
    };

    this.alerts.push(fullAlert);
    emitDiagnosticTrace('monitoring_alert', {
      id: fullAlert.id,
      type: fullAlert.type,
      severity: fullAlert.severity,
      source: fullAlert.source
    }, fullAlert.severity === 'critical' ? 'warn' : 'info');
    
    logger.warn('Alert created', { 
      id: fullAlert.id,
      type: fullAlert.type,
      severity: fullAlert.severity,
      title: fullAlert.title,
      source: fullAlert.source
    });
  }

  /**
   * Check metric values against alert thresholds
   */
  private checkMetricAlerts(metric: PerformanceMetric): void {
    const thresholds = this.config.alertThresholds;
    
    switch (metric.name) {
      case 'workflow_error_rate':
        if (metric.value > thresholds.errorRate) {
          this.createAlert({
            type: 'error',
            severity: 'warning',
            title: 'High Error Rate',
            message: `Workflow error rate is ${metric.value}%, exceeding threshold of ${thresholds.errorRate}%`,
            source: 'MonitoringService'
          });
        }
        break;
        
      case 'system_cpu_usage':
        if (metric.value > thresholds.cpuUsage) {
          this.createAlert({
            type: 'performance',
            severity: 'warning',
            title: 'High CPU Usage',
            message: `CPU usage is ${metric.value}%, exceeding threshold of ${thresholds.cpuUsage}%`,
            source: 'MonitoringService'
          });
        }
        break;
        
      case 'system_memory_usage':
        if (metric.value > thresholds.memoryUsage) {
          this.createAlert({
            type: 'performance',
            severity: 'warning',
            title: 'High Memory Usage',
            message: `Memory usage is ${metric.value}%, exceeding threshold of ${thresholds.memoryUsage}%`,
            source: 'MonitoringService'
          });
        }
        break;
    }
  }

  /**
   * Get recent metrics within specified seconds
   */
  private getRecentMetrics(seconds: number): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get top error types
   */
  private getTopErrors(): ErrorSummary[] {
    const errorMetrics = this.metrics.filter(m => m.category === 'error');
    const errorCounts = new Map<string, ErrorSummary>();
    
    for (const metric of errorMetrics) {
      const errorType = metric.name;
      const existing = errorCounts.get(errorType);
      
      if (existing) {
        existing.count += metric.value;
        if (metric.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = metric.timestamp;
        }
      } else {
        errorCounts.set(errorType, {
          errorType,
          count: metric.value,
          lastOccurrence: metric.timestamp,
          affectedServices: [metric.metadata?.service as string || 'unknown']
        });
      }
    }
    
    return Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get performance trends
   */
  private getPerformanceTrends(): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const metricNames = ['workflow_execution_duration', 'system_cpu_usage', 'system_memory_usage'];
    
    for (const metricName of metricNames) {
      const recentMetrics = this.metrics
        .filter(m => m.name === metricName)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      if (recentMetrics.length >= 2) {
        const latest = recentMetrics[0];
        const previous = recentMetrics[1];
        
        let trend: PerformanceTrend['trend'] = 'stable';
        if (latest.value > previous.value * 1.1) {
          trend = 'up';
        } else if (latest.value < previous.value * 0.9) {
          trend = 'down';
        }
        
        trends.push({
          metric: metricName,
          timestamp: latest.timestamp,
          value: latest.value,
          trend
        });
      }
    }
    
    return trends;
  }

  /**
   * Clean up old metrics based on retention policy
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
