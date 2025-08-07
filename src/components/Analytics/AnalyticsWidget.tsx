import React, { useState, useEffect } from 'react';
import { trackInvestorEvents } from '../../utils/analytics';
import { googleAnalyticsService } from '../../services/GoogleAnalyticsService';
import styles from './AnalyticsWidget.module.css';

interface AnalyticsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  
  // Looker Studio dashboard configuration
  const LOOKER_STUDIO_EMBED_URL = 'https://lookerstudio.google.com/embed/reporting/tjL7zN4Fim4';

  // Track analytics widget usage
  useEffect(() => {
    if (isOpen) {
      // Track page view with the Google Analytics service
      googleAnalyticsService.trackPageView();
      googleAnalyticsService.trackEvent('widget_opened', 'Analytics');
      
      // Track analytics widget usage
      trackInvestorEvents.featureUsed('analytics-widget');
      
      // Set loading timeout for iframe
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
  };

  const handleViewFullDashboard = () => {
    trackInvestorEvents.navigationClick('full-analytics-dashboard');
    window.open('https://lookerstudio.google.com/s/tjL7zN4Fim4', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.analyticsWidget}>
      <div className={styles.header}>
        <div className={styles.title}>
          <svg 
            className={styles.icon}
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Analytics
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
            <p>Checking dashboard access...</p>
          </div>
        ) : (
          <>
            <div className={styles.dataSourceIndicator}>
              <span className={styles.fallbackDataBadge}>� Dashboard Requires Authentication</span>
            </div>
            
            {!iframeError ? (
              <div className={styles.dashboardContainer}>
                <iframe
                  src={LOOKER_STUDIO_EMBED_URL}
                  className={styles.dashboardIframe}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  title="Google Analytics Dashboard"
                />
                <div className={styles.authNotice}>
                  <p>📋 Dashboard requires Google account access</p>
                  <button 
                    className={styles.secondaryButton}
                    onClick={handleViewFullDashboard}
                  >
                    🔗 Open in New Tab
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.errorContainer}>
                <h3>📊 Analytics Dashboard Access</h3>
                <p>The embedded dashboard requires authentication.</p>
                <p>Click below to view the full Google Analytics dashboard:</p>
                <button 
                  className={styles.primaryButton}
                  onClick={handleViewFullDashboard}
                >
                  📈 View Analytics Dashboard
                </button>
                <div className={styles.instructionBox}>
                  <h4>💡 To Enable Public Access:</h4>
                  <ol>
                    <li>Open the Looker Studio dashboard</li>
                    <li>Click "Share" → "Manage access"</li>
                    <li>Set to "Anyone on the internet"</li>
                    <li>Enable "Embed report" in File menu</li>
                  </ol>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button 
                className={styles.primaryButton}
                onClick={handleViewFullDashboard}
              >
                📈 View Full Dashboard
              </button>
              <p className={styles.helpText}>
                Real Google Analytics data from Looker Studio
              </p>
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.liveIndicator}></span>
        <span>Real-time data from Google Analytics via Looker Studio</span>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
