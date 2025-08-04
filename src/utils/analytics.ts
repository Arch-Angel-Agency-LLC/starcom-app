// Google Analytics 4 Configuration
// Analytics utility for tracking user interactions and page views

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    // Enhanced ecommerce tracking
    send_page_view: true,
    // Privacy settings
    anonymize_ip: true,
    // Custom tracking
    custom_map: {
      custom_parameter_1: 'user_type',
      custom_parameter_2: 'feature_usage'
    }
  });

  console.log('🔍 Google Analytics initialized with ID:', measurementId);
};

// Track page views
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle || document.title
    });
  }
};

// Track custom events for investor insights
export const trackEvent = (eventName: string, parameters?: Record<string, string | number | boolean>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      event_category: parameters?.category || 'engagement',
      event_label: parameters?.label,
      value: parameters?.value,
      ...parameters
    });
  }
};

// Investor-focused tracking events
export const trackInvestorEvents = {
  // User engagement metrics
  userLogin: (method: string) => trackEvent('login', { method }),
  userSignup: (method: string) => trackEvent('sign_up', { method }),
  
  // Feature usage (valuable for investor pitch)
  featureUsed: (featureName: string) => trackEvent('feature_used', {
    category: 'feature_engagement',
    label: featureName
  }),
  
  // Navigation and engagement
  navigationClick: (destination: string) => trackEvent('navigation_click', {
    category: 'navigation',
    label: destination
  }),
  
  // Transaction/conversion events
  transactionStarted: (value?: number) => trackEvent('begin_checkout', { value }),
  transactionCompleted: (value: number, currency = 'USD') => trackEvent('purchase', {
    transaction_id: `txn_${Date.now()}`,
    value,
    currency
  }),
  
  // User retention indicators
  sessionDuration: (durationSeconds: number) => trackEvent('session_duration', {
    category: 'engagement',
    value: durationSeconds
  }),
  
  // Error tracking (important for app stability metrics)
  errorOccurred: (errorType: string, errorMessage: string) => trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    category: 'error',
    label: errorType
  })
};

// Get user analytics ID for debugging
export const getAnalyticsUserId = () => {
  return localStorage.getItem('ga_user_id') || 'anonymous';
};

// Set custom user properties (useful for investor segmentation)
export const setUserProperties = (properties: Record<string, string | number | boolean>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      user_properties: properties
    });
  }
};
