/**
 * Intel Dashboard Application
 * 
 * Application wrapper for the Intel Dashboard page to integrate with the Enhanced Application Router
 * Provides intelligence report management and dashboard functionality
 */

import React from 'react';
import { ApplicationContext } from '../../components/Router/ApplicationRouter';
import { IntelWorkspaceProvider } from '../../services/intel/IntelWorkspaceContext';
import IntelWorkspaceConsole from '../../components/Intel/IntelWorkspaceConsole';

const IntelDashboardApplication: React.FC<ApplicationContext> = (_props) => {
  // Unified Intel surface: workspace-backed console for Reports + Intel Items
  return (
    <IntelWorkspaceProvider>
      <IntelWorkspaceConsole />
    </IntelWorkspaceProvider>
  );
};

export default IntelDashboardApplication;
