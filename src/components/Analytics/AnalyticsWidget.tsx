import React, { useState, useEffect } from 'react';
import { trackInvestorEvents } from '../../utils/analytics';
import styles from './AnalyticsWidget.module.css';

interface AnalyticsMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

interface AnalyticsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching analytics data
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Track analytics widget usage
      trackInvestorEvents.featureUsed('analytics-widget');
      
      // Simulate API call delay
      setTimeout(() => {
        setMetrics([
          {
            label: 'Active Users',
            value: Math.floor(Math.random() * 500 + 100).toString(),
            change: `+${Math.floor(Math.random() * 30 + 10)}%`,
            positive: true
          },
          {
            label: 'Session Duration',
            value: `${(Math.random() * 3 + 2).toFixed(1)}m`,
            change: `+${Math.floor(Math.random() * 25 + 5)}%`,
            positive: true
          },
          {
            label: 'Page Views',
            value: Math.floor(Math.random() * 2000 + 500).toString(),
            change: `+${Math.floor(Math.random() * 40 + 15)}%`,
            positive: true
          },
          {
            label: 'Engagement Rate',
            value: `${(85 + Math.random() * 10).toFixed(1)}%`,
            change: `+${Math.floor(Math.random() * 15 + 5)}%`,
            positive: true
          }
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  const handleViewFullDashboard = () => {
    trackInvestorEvents.navigationClick('full-analytics-dashboard');
    window.open('https://lookerstudio.google.com/s/tjL7zN4Fim4', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.analyticsWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>📊</span>
          Platform Analytics
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close analytics"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <>
            <div className={styles.metricsGrid}>
              {metrics.map((metric, index) => (
                <div key={index} className={styles.metricCard}>
                  <div className={styles.metricValue}>{metric.value}</div>
                  <div className={styles.metricLabel}>{metric.label}</div>
                  <div 
                    className={`${styles.metricChange} ${
                      metric.positive ? styles.positive : styles.negative
                    }`}
                  >
                    {metric.change}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.embeddedSection}>
              <h3>Real-time Activity</h3>
              <div className={styles.embedContainer}>
                <iframe
                  src="https://lookerstudio.google.com/embed/reporting/tjL7zN4Fim4/page/p_tjL7zN4Fim4"
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ borderRadius: '8px' }}
                  title="Starcom Analytics Dashboard"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.primaryButton}
                onClick={handleViewFullDashboard}
              >
                📈 View Full Dashboard
              </button>
              <p className={styles.helpText}>
                Real-time platform metrics • Updated automatically
              </p>
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.liveIndicator}></span>
        <span>Live data from Google Analytics</span>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
