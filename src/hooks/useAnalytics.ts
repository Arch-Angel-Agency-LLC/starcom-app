import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackInvestorEvents } from '../utils/analytics';

// Hook for automatic page view tracking
export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views automatically
    trackPageView(location.pathname);
  }, [location]);

  return {
    trackEvent: trackInvestorEvents,
    trackPageView,
  };
};

// Hook for tracking user session duration (important investor metric)
export const useSessionTracking = () => {
  useEffect(() => {
    const sessionStart = Date.now();
    
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000);
      trackInvestorEvents.sessionDuration(sessionDuration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Track periodic engagement (every 30 seconds user is active)
    const engagementInterval = setInterval(() => {
      trackInvestorEvents.featureUsed('session_active');
    }, 30000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(engagementInterval);
      handleBeforeUnload(); // Track final session duration
    };
  }, []);
};

// Hook for tracking errors (stability metrics for investors)
export const useErrorTracking = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackInvestorEvents.errorOccurred(
        'javascript_error',
        `${event.filename}:${event.lineno} - ${event.message}`
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackInvestorEvents.errorOccurred(
        'promise_rejection',
        String(event.reason)
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};
