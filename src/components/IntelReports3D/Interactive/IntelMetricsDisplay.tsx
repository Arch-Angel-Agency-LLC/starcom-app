/**
 * IntelMetricsDisplay - Performance and analytics display component
 * Shows real-time metrics and analytics for Intel Reports system
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { IntelReport3DData } from '../../../models/Intel/IntelVisualization3D';
import { IntelPriority } from '../../../models/Intel/IntelEnums';
import styles from './IntelMetricsDisplay.module.css';

interface IntelMetricsDisplayProps {
  /** Intel reports data for metrics calculation */
  reports?: IntelReport3DData[];
  /** Performance metrics */
  performance?: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
  };
  /** System metrics */
  system?: {
    totalReports: number;
    activeReports: number;
    archivedReports: number;
    errorRate: number;
    uptime: number;
  };
  /** Display variant */
  variant?: 'full' | 'compact' | 'dashboard' | 'overlay';
  /** Which metrics to show */
  showMetrics?: Array<'reports' | 'performance' | 'categories' | 'priorities' | 'trends' | 'health'>;
  /** Whether to show charts */
  showCharts?: boolean;
  /** Update interval in milliseconds */
  updateInterval?: number;
  /** Whether metrics are loading */
  loading?: boolean;
  /** Callback when metric is clicked */
  onMetricClick?: (metric: string, value: string | number) => void;
  /** Custom CSS class */
  className?: string;
}

interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  icon?: string;
  subtitle?: string;
}

/**
 * Calculate report metrics from data
 */
const calculateReportMetrics = (reports: IntelReport3DData[]): MetricItem[] => {
  const total = reports.length;

  const byPriority = reports.reduce((acc, report) => {
    acc[report.visualization.priority] = (acc[report.visualization.priority] || 0) + 1;
    return acc;
  }, {} as Record<IntelPriority, number>);

  const now = new Date();
  const last24h = reports.filter(r => 
    (now.getTime() - r.timestamp.getTime()) < 24 * 60 * 60 * 1000
  ).length;

  const avgConfidence = reports.length > 0 
    ? reports.reduce((sum, r) => sum + r.metadata.confidence, 0) / reports.length 
    : 0;

  return [
    {
      id: 'total',
      label: 'Total Reports',
      value: total,
      icon: '📊',
      color: 'var(--text-color, #fff)'
    },
    {
      id: 'recent',
      label: 'Last 24h',
      value: last24h,
      icon: '🕐',
      color: 'var(--accent-color, #00ff88)'
    },
    {
      id: 'confidence',
      label: 'Avg Confidence',
      value: `${Math.round(avgConfidence * 100)}%`,
      icon: '🎯',
      color: avgConfidence > 0.8 ? 'var(--success-color, #10b981)' : 'var(--warning-color, #f59e0b)'
    },
    {
      id: 'critical',
      label: 'Critical',
      value: byPriority.critical || 0,
      icon: '🔴',
      color: 'var(--error-color, #ef4444)'
    },
    {
      id: 'high',
      label: 'High Priority',
      value: byPriority.high || 0,
      icon: '🟠',
      color: 'var(--warning-color, #f59e0b)'
    }
  ];
};

/**
 * Calculate performance metrics
 */
const calculatePerformanceMetrics = (performance?: IntelMetricsDisplayProps['performance']): MetricItem[] => {
  if (!performance) return [];

  return [
    {
      id: 'loadTime',
      label: 'Load Time',
      value: `${performance.loadTime.toFixed(1)}ms`,
      icon: '⚡',
      color: performance.loadTime < 100 ? 'var(--success-color, #10b981)' : 'var(--warning-color, #f59e0b)'
    },
    {
      id: 'renderTime',
      label: 'Render Time',
      value: `${performance.renderTime.toFixed(1)}ms`,
      icon: '🎨',
      color: performance.renderTime < 16 ? 'var(--success-color, #10b981)' : 'var(--warning-color, #f59e0b)'
    },
    {
      id: 'memoryUsage',
      label: 'Memory',
      value: `${performance.memoryUsage.toFixed(1)}MB`,
      icon: '💾',
      color: performance.memoryUsage < 100 ? 'var(--success-color, #10b981)' : 'var(--error-color, #ef4444)'
    },
    {
      id: 'frameRate',
      label: 'FPS',
      value: Math.round(performance.frameRate),
      icon: '📈',
      color: performance.frameRate > 30 ? 'var(--success-color, #10b981)' : 'var(--warning-color, #f59e0b)'
    }
  ];
};

/**
 * Calculate system health metrics
 */
const calculateSystemMetrics = (system?: IntelMetricsDisplayProps['system']): MetricItem[] => {
  if (!system) return [];

  const errorRate = system.errorRate * 100;
  const uptimeHours = Math.floor(system.uptime / 3600);

  return [
    {
      id: 'uptime',
      label: 'Uptime',
      value: `${uptimeHours}h`,
      icon: '⏱️',
      color: 'var(--success-color, #10b981)'
    },
    {
      id: 'errorRate',
      label: 'Error Rate',
      value: `${errorRate.toFixed(2)}%`,
      icon: '⚠️',
      color: errorRate < 1 ? 'var(--success-color, #10b981)' : 'var(--error-color, #ef4444)'
    },
    {
      id: 'active',
      label: 'Active',
      value: system.activeReports,
      icon: '🟢',
      color: 'var(--success-color, #10b981)'
    },
    {
      id: 'archived',
      label: 'Archived',
      value: system.archivedReports,
      icon: '📦',
      color: 'var(--text-muted, #9ca3af)'
    }
  ];
};

/**
 * IntelMetricsDisplay - Performance and analytics display
 */
export const IntelMetricsDisplay: React.FC<IntelMetricsDisplayProps> = ({
  reports = [],
  performance,
  system,
  variant = 'full',
  showMetrics = ['reports', 'performance', 'health'],
  showCharts = false,
  updateInterval = 5000,
  loading = false,
  onMetricClick,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  // Update current time periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  // Calculate all metrics
  const reportMetrics = useMemo(() => 
    showMetrics.includes('reports') ? calculateReportMetrics(reports) : [],
    [reports, showMetrics]
  );

  const performanceMetrics = useMemo(() => 
    showMetrics.includes('performance') ? calculatePerformanceMetrics(performance) : [],
    [performance, showMetrics]
  );

  const systemMetrics = useMemo(() => 
    showMetrics.includes('health') ? calculateSystemMetrics(system) : [],
    [system, showMetrics]
  );

  const allMetrics = useMemo(() => [
    ...reportMetrics,
    ...performanceMetrics,
    ...systemMetrics
  ], [reportMetrics, performanceMetrics, systemMetrics]);

  // Handle metric click
  const handleMetricClick = useCallback((metric: MetricItem) => {
    onMetricClick?.(metric.id, metric.value);
  }, [onMetricClick]);

  // Animate number changes
  useEffect(() => {
    allMetrics.forEach(metric => {
      if (typeof metric.value === 'number' && metric.value !== animatedValues[metric.id]) {
        setAnimatedValues(prev => ({
          ...prev,
          [metric.id]: metric.value as number
        }));
      }
    });
  }, [allMetrics, animatedValues]);

  // Compute container classes
  const containerClasses = useMemo(() => [
    styles.container,
    styles[`variant${variant.charAt(0).toUpperCase()}${variant.slice(1)}`],
    loading && styles.loading,
    className
  ].filter(Boolean).join(' '), [variant, loading, className]);

  // Render metric item
  const renderMetric = useCallback((metric: MetricItem) => (
    <div
      key={metric.id}
      className={`${styles.metric} ${onMetricClick ? styles.clickable : ''}`}
      onClick={() => handleMetricClick(metric)}
    >
      <div className={styles.metricIcon} style={{ color: metric.color }}>
        {metric.icon}
      </div>
      <div className={styles.metricContent}>
        <div className={styles.metricValue} style={{ color: metric.color }}>
          {metric.value}
        </div>
        <div className={styles.metricLabel}>
          {metric.label}
        </div>
        {metric.subtitle && (
          <div className={styles.metricSubtitle}>
            {metric.subtitle}
          </div>
        )}
      </div>
      {metric.trend && (
        <div className={`${styles.metricTrend} ${styles[`trend${metric.trend.charAt(0).toUpperCase()}${metric.trend.slice(1)}`]}`}>
          {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '→'}
        </div>
      )}
    </div>
  ), [handleMetricClick, onMetricClick]);

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Header */}
      {variant === 'full' && (
        <div className={styles.header}>
          <h3 className={styles.title}>System Metrics</h3>
          <div className={styles.timestamp}>
            Updated: {currentTime.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        {allMetrics.map(renderMetric)}
      </div>

      {/* Charts Section */}
      {showCharts && variant === 'full' && (
        <div className={styles.chartsSection}>
          <h4 className={styles.chartsTitle}>Analytics</h4>
          <div className={styles.chartsGrid}>
            {/* Placeholder for charts */}
            <div className={styles.chartPlaceholder}>
              <span className={styles.chartIcon}>📊</span>
              <span className={styles.chartLabel}>Report Trends</span>
            </div>
            <div className={styles.chartPlaceholder}>
              <span className={styles.chartIcon}>⚡</span>
              <span className={styles.chartLabel}>Performance</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {variant === 'dashboard' && (
        <div className={styles.footer}>
          <div className={styles.footerItem}>
            <span className={styles.footerIcon}>🔄</span>
            <span className={styles.footerText}>Auto-refresh enabled</span>
          </div>
          <div className={styles.footerItem}>
            <span className={styles.footerIcon}>✅</span>
            <span className={styles.footerText}>System healthy</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelMetricsDisplay;
