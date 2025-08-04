/**
 * Intel Dashboard Application
 * 
 * Application wrapper for the Intel Dashboard page to integrate with the Enhanced Application Router
 * Provides intelligence report management and dashboard functionality
 */

import React from 'react';
import { ApplicationContext } from '../../components/Router/EnhancedApplicationRouter';
import IntelDashboard from '../../pages/Intel/IntelDashboard';

interface IntelDashboardApplicationProps extends ApplicationContext {
  // Add any specific context properties needed for IntelDashboard if needed in the future
}

const IntelDashboardApplication: React.FC<IntelDashboardApplicationProps> = (_props) => {
  // The IntelDashboard component already handles all the logic,
  // so we just need to render it here
  return <IntelDashboard />;
};

export default IntelDashboardApplication;
