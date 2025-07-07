import React from 'react';
import { useRouteSync } from '../../context/useRouteSync';

/**
 * Component that synchronizes URL routes with the application's screen state
 * This component should be rendered once at the app root level
 */
const RouteSynchronizer: React.FC = () => {
  // Activate the route synchronization hook
  useRouteSync();
  
  // This component doesn't render anything visible
  return null;
};

export default RouteSynchronizer;
