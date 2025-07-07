/**
 * Intel Reports 3D Container
 * 
 * Main orchestrator component that manages the Intel Reports 3D system
 * and integrates with the HUD architecture.
 */

import React, { useMemo } from 'react';
import { IntelReports3DProvider, type IntelReports3DProviderOptions } from './IntelReports3DProvider';
import { IntelReports3DErrorBoundary } from './IntelReports3DErrorBoundary';

// =============================================================================
// CONTAINER PROPS AND CONFIGURATION
// =============================================================================

export interface IntelReports3DContainerProps {
  // Provider configuration
  providerOptions?: IntelReports3DProviderOptions;
  
  // Container-specific options
  className?: string;
  style?: React.CSSProperties;
  
  // Children components (Intel panels, controls, etc.)
  children?: React.ReactNode;
  
  // Error handling
  onError?: (error: Error) => void;
  enableErrorBoundary?: boolean;
}

// =============================================================================
// CONTAINER COMPONENT
// =============================================================================

export const IntelReports3DContainer: React.FC<IntelReports3DContainerProps> = ({
  providerOptions = {},
  className = 'intel-reports-3d-container',
  style,
  children,
  onError,
  enableErrorBoundary = true
}) => {
  
  // Memoize provider options to prevent unnecessary re-renders
  const memoizedProviderOptions = useMemo(() => ({
    // Default configuration optimized for HUD integration
    enableGlobeIntegration: true,
    enableContextAdaptation: true,
    debugMode: process.env.NODE_ENV === 'development',
    
    // Default hook options
    mainOptions: {
      adaptToHUD: true,
      realTimeUpdates: true,
      viewportCulling: true,
      enableBatching: true,
      maxCacheSize: 1000,
      debounceDelay: 300,
      ...providerOptions.mainOptions
    },
    
    contextOptions: {
      hudIntegration: true,
      autoAdapt: true,
      adaptationDelay: 300,
      maxRetries: 3,
      ...providerOptions.contextOptions
    },
    
    globeOptions: {
      enableInteraction: true,
      enableSelection: true,
      enableHover: true,
      maxMarkers: 1000,
      enableLOD: true,
      enableCulling: true,
      ...providerOptions.globeOptions
    },
    
    // Merge any additional provider options
    ...providerOptions
  }), [providerOptions]);

  // Container content
  const containerContent = (
    <IntelReports3DProvider options={memoizedProviderOptions}>
      <div 
        className={className}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          ...style
        }}
      >
        {children}
      </div>
    </IntelReports3DProvider>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary) {
    return (
      <IntelReports3DErrorBoundary
        onError={onError}
        resetOnPropsChange={true}
      >
        {containerContent}
      </IntelReports3DErrorBoundary>
    );
  }

  return containerContent;
};

// =============================================================================
// DISPLAY NAME FOR DEBUGGING
// =============================================================================

IntelReports3DContainer.displayName = 'IntelReports3DContainer';
