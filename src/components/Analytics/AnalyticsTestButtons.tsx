import React from 'react';
import { trackInvestorEvents } from '../../utils/analytics';

interface AnalyticsTestButtonsProps {
  className?: string;
}

/**
 * Test component to demonstrate analytics tracking
 * Remove this in production - it's just for testing/demo purposes
 */
const AnalyticsTestButtons: React.FC<AnalyticsTestButtonsProps> = ({ className = '' }) => {
  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  const handleFeatureTest = () => {
    trackInvestorEvents.featureUsed('test-feature-analytics');
    console.log('📊 Tracked feature usage: test-feature-analytics');
  };

  const handleNavigationTest = () => {
    trackInvestorEvents.navigationClick('analytics-test-navigation');
    console.log('📊 Tracked navigation: analytics-test-navigation');
  };

  const handleTransactionTest = () => {
    trackInvestorEvents.transactionStarted(99.99);
    console.log('📊 Tracked transaction start: $99.99');
  };

  return (
    <div className={`analytics-test-panel bg-gray-800 text-white p-4 rounded-lg ${className}`}>
      <h3 className="text-lg font-bold mb-2">🔬 Analytics Testing</h3>
      <p className="text-sm text-gray-300 mb-3">
        Test analytics events (check browser console & GA4 real-time reports)
      </p>
      <div className="space-x-2">
        <button
          onClick={handleFeatureTest}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Test Feature Usage
        </button>
        <button
          onClick={handleNavigationTest}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
        >
          Test Navigation
        </button>
        <button
          onClick={handleTransactionTest}
          className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
        >
          Test Transaction
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        💡 Open GA4 Real-time reports to see events immediately
      </div>
    </div>
  );
};

export default AnalyticsTestButtons;
