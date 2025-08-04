import React from 'react';
import { useAnalytics, useSessionTracking, useErrorTracking } from '../../hooks/useAnalytics';

/**
 * Analytics Tracker Component
 * 
 * This component initializes all analytics tracking hooks.
 * It must be rendered within a Router context since useAnalytics depends on useLocation.
 */
const AnalyticsTracker: React.FC = () => {
  // Initialize analytics tracking for investor insights
  useAnalytics();
  useSessionTracking();
  useErrorTracking();

  // This component doesn't render anything visible
  return null;
};

export default AnalyticsTracker;
