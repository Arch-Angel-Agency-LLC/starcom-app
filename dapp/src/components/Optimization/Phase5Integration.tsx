import React, { useEffect, useState, useCallback } from 'react';
import styles from './Phase5Integration.module.css';
import PerformanceOptimizer from './PerformanceOptimizer';
import SecurityHardening from './SecurityHardening';
import { useFeatureFlag } from '../../utils/featureFlags';

interface Phase5IntegrationProps {
  children: React.ReactNode;
  enableRealTimeMonitoring?: boolean;
  enableAutomaticOptimizations?: boolean;
  enableSecurityAlerts?: boolean;
  performanceThresholds?: {
    cpuUsage: number;
    memoryUsage: number;
    renderTime: number;
  };
}

interface SystemMetrics {
  performance: {
    cpu: number;
    memory: number;
    renderTime: number;
    fps: number;
  };
  security: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    vulnerabilities: number;
    encryptionStatus: 'secure' | 'warning' | 'critical';
  };
  optimization: {
    cacheHitRate: number;
    bundleSize: number;
    lazyLoadEfficiency: number;
  };
}

const Phase5Integration: React.FC<Phase5IntegrationProps> = ({
  children,
  enableRealTimeMonitoring = true,
  enableAutomaticOptimizations = true,
  enableSecurityAlerts = true,
  performanceThresholds = {
    cpuUsage: 80,
    memoryUsage: 85,
    renderTime: 16.67 // 60 FPS threshold
  }
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    performance: { cpu: 0, memory: 0, renderTime: 0, fps: 60 },
    security: { threatLevel: 'low', vulnerabilities: 0, encryptionStatus: 'secure' },
    optimization: { cacheHitRate: 95, bundleSize: 2048, lazyLoadEfficiency: 90 }
  });
  
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [alertsActive, setAlertsActive] = useState<string[]>([]);
  
  const performanceEnabled = useFeatureFlag('performanceOptimizerEnabled');
  const securityEnabled = useFeatureFlag('securityHardeningEnabled');
  const monitoringEnabled = useFeatureFlag('performanceMonitoringEnabled');

  const triggerAutomaticOptimizations = useCallback((alerts: string[]) => {
    // Simulate automatic optimization triggers
    console.log('Phase 5: Triggering automatic optimizations for:', alerts);
    
    // Could trigger:
    // - Garbage collection
    // - Cache cleanup
    // - Component virtualization
    // - Resource preloading adjustments
  }, []);

  const checkPerformanceThresholds = useCallback((currentMetrics: SystemMetrics) => {
    const newAlerts: string[] = [];
    
    if (currentMetrics.performance.cpu > performanceThresholds.cpuUsage) {
      newAlerts.push(`High CPU usage: ${currentMetrics.performance.cpu.toFixed(1)}%`);
    }
    
    if (currentMetrics.performance.memory > performanceThresholds.memoryUsage) {
      newAlerts.push(`High memory usage: ${currentMetrics.performance.memory.toFixed(1)}%`);
    }
    
    if (currentMetrics.performance.renderTime > performanceThresholds.renderTime) {
      newAlerts.push(`Slow render time: ${currentMetrics.performance.renderTime.toFixed(1)}ms`);
    }

    if (enableAutomaticOptimizations && newAlerts.length > 0) {
      triggerAutomaticOptimizations(newAlerts);
    }
    
    setAlertsActive(prev => [...prev.filter(alert => !alert.includes('CPU') && !alert.includes('memory') && !alert.includes('render')), ...newAlerts]);
  }, [performanceThresholds, enableAutomaticOptimizations, triggerAutomaticOptimizations]);

  const checkSecurityAlerts = useCallback((currentMetrics: SystemMetrics) => {
    if (!enableSecurityAlerts) return;
    
    const securityAlerts: string[] = [];
    
    if (currentMetrics.security.threatLevel === 'medium' || currentMetrics.security.threatLevel === 'high') {
      securityAlerts.push(`Elevated threat level: ${currentMetrics.security.threatLevel}`);
    }
    
    if (currentMetrics.security.vulnerabilities > 0) {
      securityAlerts.push(`${currentMetrics.security.vulnerabilities} vulnerabilities detected`);
    }
    
    if (currentMetrics.security.encryptionStatus !== 'secure') {
      securityAlerts.push(`Encryption status: ${currentMetrics.security.encryptionStatus}`);
    }
    
    setAlertsActive(prev => [...prev.filter(alert => !alert.includes('threat') && !alert.includes('vulnerabilities') && !alert.includes('Encryption')), ...securityAlerts]);
  }, [enableSecurityAlerts]);

  // Real-time metrics monitoring
  useEffect(() => {
    if (!enableRealTimeMonitoring || !monitoringEnabled) return;

    const monitoringInterval = setInterval(() => {
      // Simulate real-time metrics collection
      const newMetrics: SystemMetrics = {
        performance: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          renderTime: 12 + Math.random() * 10,
          fps: 55 + Math.random() * 10
        },
        security: {
          threatLevel: Math.random() > 0.9 ? 'medium' : 'low',
          vulnerabilities: Math.floor(Math.random() * 3),
          encryptionStatus: Math.random() > 0.95 ? 'warning' : 'secure'
        },
        optimization: {
          cacheHitRate: 90 + Math.random() * 10,
          bundleSize: 2000 + Math.random() * 100,
          lazyLoadEfficiency: 85 + Math.random() * 15
        }
      };

      setMetrics(newMetrics);
      
      // Check for threshold violations
      checkPerformanceThresholds(newMetrics);
      checkSecurityAlerts(newMetrics);
      
    }, 2000); // Update every 2 seconds

    return () => clearInterval(monitoringInterval);
  }, [enableRealTimeMonitoring, monitoringEnabled, checkPerformanceThresholds, checkSecurityAlerts]);

  const toggleDashboard = useCallback(() => {
    setDashboardVisible(prev => !prev);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlertsActive([]);
  }, []);

  return (
    <div className={styles.phase5Container}>
      {/* Phase 5 Control Panel */}
      <div className={styles.controlPanel}>
        <button
          className={styles.dashboardToggle}
          onClick={toggleDashboard}
          title="Toggle Phase 5 Dashboard"
        >
          <span className={styles.icon}>⚡</span>
          Phase 5
          {alertsActive.length > 0 && (
            <span className={styles.alertBadge}>
              {alertsActive.length}
            </span>
          )}
        </button>
        
        {alertsActive.length > 0 && (
          <div className={styles.alertsPanel}>
            <div className={styles.alertsHeader}>
              <span>System Alerts</span>
              <button onClick={clearAlerts} className={styles.clearButton}>
                Clear
              </button>
            </div>
            <div className={styles.alertsList}>
              {alertsActive.map((alert, index) => (
                <div key={index} className={styles.alert}>
                  <span className={styles.alertIcon}>⚠️</span>
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        {children}
      </div>

      {/* Phase 5 Dashboard */}
      {dashboardVisible && (
        <div className={styles.dashboard}>
          <div className={styles.dashboardHeader}>
            <h3>Phase 5: Integration & Optimization Dashboard</h3>
            <button
              onClick={toggleDashboard}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div className={styles.dashboardContent}>
            {/* System Metrics Overview */}
            <div className={styles.metricsOverview}>
              <div className={styles.metricCard}>
                <h4>Performance</h4>
                <div className={styles.metrics}>
                  <div>CPU: {metrics.performance.cpu.toFixed(1)}%</div>
                  <div>Memory: {metrics.performance.memory.toFixed(1)}%</div>
                  <div>FPS: {metrics.performance.fps.toFixed(0)}</div>
                </div>
              </div>
              
              <div className={styles.metricCard}>
                <h4>Security</h4>
                <div className={styles.metrics}>
                  <div>Threat Level: {metrics.security.threatLevel}</div>
                  <div>Vulnerabilities: {metrics.security.vulnerabilities}</div>
                  <div>Encryption: {metrics.security.encryptionStatus}</div>
                </div>
              </div>
              
              <div className={styles.metricCard}>
                <h4>Optimization</h4>
                <div className={styles.metrics}>
                  <div>Cache Hit Rate: {metrics.optimization.cacheHitRate.toFixed(1)}%</div>
                  <div>Bundle Size: {(metrics.optimization.bundleSize / 1024).toFixed(1)}MB</div>
                  <div>Lazy Load Efficiency: {metrics.optimization.lazyLoadEfficiency.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Integrated Dashboards */}
            <div className={styles.integratedDashboards}>
              {performanceEnabled && (
                <div className={styles.dashboardSection}>
                  <PerformanceOptimizer />
                </div>
              )}
              
              {securityEnabled && (
                <div className={styles.dashboardSection}>
                  <SecurityHardening />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase5Integration;
