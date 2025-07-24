/**
 * IntelWebApplicationWrapper
 * 
 * Adapts IntelWebApplication to work with the Enhanced Application Router
 * by providing the ApplicationContext interface compatibility.
 */

import React from 'react';
import { ApplicationContext } from '../../components/Router/EnhancedApplicationRouter';
import { IntelWebApplication } from './IntelWebApplication';
import './IntelWeb.css';

// Wrapper component that adapts IntelWebApplication to ApplicationContext
export const IntelWebApplicationWrapper: React.FC<ApplicationContext> = (context) => {
  // Extract any potential package information from context
  // For now, start with empty state - user can load packages manually
  
  return (
    <IntelWebApplication 
      // packageId can be passed through context if needed
      packageId={typeof context.packageId === 'string' ? context.packageId : undefined}
      // initialPackage would need to be loaded separately or passed through a different mechanism
    />
  );
};

export default IntelWebApplicationWrapper;
