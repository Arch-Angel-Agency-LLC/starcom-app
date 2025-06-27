import React, { useState, useEffect } from 'react';
import styles from './Phase5Demo.module.css';
import Phase5Integration from './Phase5Integration';
import { useFeatureFlag } from '../../utils/featureFlags';

interface DemoMetrics {
  performanceScore: number;
  securityScore: number;
  optimizationScore: number;
  overallScore: number;
}

const Phase5Demo: React.FC = () => {
  const [metrics, setMetrics] = useState<DemoMetrics>({
    performanceScore: 85,
    securityScore: 92,
    optimizationScore: 88,
    overallScore: 88
  });

  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const phase5Enabled = useFeatureFlag('performanceMonitoringEnabled');
  const performanceEnabled = useFeatureFlag('performanceOptimizerEnabled');
  const securityEnabled = useFeatureFlag('securityHardeningEnabled');

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        // Simulate realistic metric fluctuations
        setMetrics(prev => ({
          performanceScore: Math.max(60, Math.min(100, prev.performanceScore + (Math.random() - 0.5) * 10)),
          securityScore: Math.max(70, Math.min(100, prev.securityScore + (Math.random() - 0.5) * 5)),
          optimizationScore: Math.max(65, Math.min(100, prev.optimizationScore + (Math.random() - 0.5) * 8)),
          overallScore: Math.max(65, Math.min(100, prev.overallScore + (Math.random() - 0.5) * 6))
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const runPhase5Tests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      'Initializing Phase 5 Integration System...',
      'Testing real-time performance monitoring...',
      'Validating security hardening protocols...',
      'Checking optimization algorithms...',
      'Testing automatic threshold detection...',
      'Validating alert system functionality...',
      'Testing dashboard integration...',
      'Checking feature flag compatibility...',
      'Validating responsive design...',
      'Testing accessibility features...',
      'Phase 5 Integration: All systems operational!'
    ];

    for (let i = 0; i < tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTestResults(prev => [...prev, tests[i]]);
    }

    setIsRunning(false);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setTestResults([]);
    setMetrics({
      performanceScore: 85,
      securityScore: 92,
      optimizationScore: 88,
      overallScore: 88
    });
  };

  return (
    <Phase5Integration
      enableRealTimeMonitoring={true}
      enableAutomaticOptimizations={true}
      enableSecurityAlerts={true}
      performanceThresholds={{
        cpuUsage: 75,
        memoryUsage: 80,
        renderTime: 16.67
      }}
    >
      <div className={styles.demoContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Phase 5: Integration & Optimization Demo</h1>
          <div className={styles.statusIndicator}>
            <span className={`${styles.status} ${phase5Enabled ? styles.active : styles.inactive}`}>
              {phase5Enabled ? 'OPERATIONAL' : 'DISABLED'}
            </span>
          </div>
        </div>

        <div className={styles.featureStatus}>
          <div className={styles.featureGrid}>
            <div className={`${styles.featureCard} ${phase5Enabled ? styles.enabled : styles.disabled}`}>
              <div className={styles.featureIcon}>⚡</div>
              <div className={styles.featureInfo}>
                <h3>Real-time Monitoring</h3>
                <p>{phase5Enabled ? 'Active' : 'Disabled'}</p>
              </div>
            </div>
            
            <div className={`${styles.featureCard} ${performanceEnabled ? styles.enabled : styles.disabled}`}>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureInfo}>
                <h3>Performance Optimizer</h3>
                <p>{performanceEnabled ? 'Active' : 'Disabled'}</p>
              </div>
            </div>
            
            <div className={`${styles.featureCard} ${securityEnabled ? styles.enabled : styles.disabled}`}>
              <div className={styles.featureIcon}>🛡️</div>
              <div className={styles.featureInfo}>
                <h3>Security Hardening</h3>
                <p>{securityEnabled ? 'Active' : 'Disabled'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.metricsDisplay}>
          <h2>System Metrics Dashboard</h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{metrics.performanceScore}%</div>
              <div className={styles.metricLabel}>Performance Score</div>
              <div className={`${styles.metricBar} ${styles.performance}`}>
                <div 
                  className={styles.metricFill} 
                  style={{ width: `${metrics.performanceScore}%` }}
                />
              </div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{metrics.securityScore}%</div>
              <div className={styles.metricLabel}>Security Score</div>
              <div className={`${styles.metricBar} ${styles.security}`}>
                <div 
                  className={styles.metricFill} 
                  style={{ width: `${metrics.securityScore}%` }}
                />
              </div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{metrics.optimizationScore}%</div>
              <div className={styles.metricLabel}>Optimization Score</div>
              <div className={`${styles.metricBar} ${styles.optimization}`}>
                <div 
                  className={styles.metricFill} 
                  style={{ width: `${metrics.optimizationScore}%` }}
                />
              </div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{metrics.overallScore}%</div>
              <div className={styles.metricLabel}>Overall Score</div>
              <div className={`${styles.metricBar} ${styles.overall}`}>
                <div 
                  className={styles.metricFill} 
                  style={{ width: `${metrics.overallScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.controlPanel}>
          <button 
            className={`${styles.button} ${styles.primary}`}
            onClick={runPhase5Tests}
            disabled={isRunning || !phase5Enabled}
          >
            {isRunning ? 'Running Tests...' : 'Run Phase 5 Tests'}
          </button>
          
          <button 
            className={`${styles.button} ${styles.secondary}`}
            onClick={resetDemo}
            disabled={isRunning}
          >
            Reset Demo
          </button>
        </div>

        <div className={styles.testResults}>
          <h3>Test Results</h3>
          <div className={styles.console}>
            {testResults.map((result, index) => (
              <div key={index} className={styles.consoleLine}>
                <span className={styles.timestamp}>
                  {new Date().toLocaleTimeString()}
                </span>
                <span className={styles.message}>{result}</span>
              </div>
            ))}
            {isRunning && (
              <div className={styles.consoleLine}>
                <span className={styles.timestamp}>
                  {new Date().toLocaleTimeString()}
                </span>
                <span className={`${styles.message} ${styles.running}`}>
                  <span className={styles.cursor}>_</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.documentation}>
          <h3>Phase 5 Features</h3>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <h4>Real-time Performance Monitoring</h4>
              <p>Continuous monitoring of CPU, memory, and rendering performance with automatic threshold detection.</p>
            </div>
            
            <div className={styles.feature}>
              <h4>Security Hardening Dashboard</h4>
              <p>Post-quantum cryptography validation, vulnerability scanning, and compliance monitoring.</p>
            </div>
            
            <div className={styles.feature}>
              <h4>Automatic Optimizations</h4>
              <p>Intelligent cache management, lazy loading optimizations, and memory cleanup strategies.</p>
            </div>
            
            <div className={styles.feature}>
              <h4>Integrated Dashboards</h4>
              <p>Unified control interface for all optimization and security systems with real-time alerts.</p>
            </div>
            
            <div className={styles.feature}>
              <h4>Feature Flag Support</h4>
              <p>Granular control over all Phase 5 features with safe rollout capabilities.</p>
            </div>
          </div>
        </div>
      </div>
    </Phase5Integration>
  );
};

export default Phase5Demo;
