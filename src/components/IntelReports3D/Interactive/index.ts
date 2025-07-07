/**
 * Interactive Components Index
 * Central export point for all Intel Reports 3D interactive components
 */

// Core Interactive Components
export { IntelReportCard } from './IntelReportCard';
export { IntelReportList } from './IntelReportList';
export { IntelFilterControls } from './IntelFilterControls';
export { IntelSearchBar } from './IntelSearchBar';
export { IntelActionButtons } from './IntelActionButtons';
export { IntelStatusIndicator } from './IntelStatusIndicator';
export { IntelMetricsDisplay } from './IntelMetricsDisplay';

// Integration Example (Reference Implementation)
export { IntegrationExample } from './IntegrationExample';

// Import for internal use
import { IntelReportCard } from './IntelReportCard';
import { IntelReportList } from './IntelReportList';
import { IntelFilterControls } from './IntelFilterControls';
import { IntelSearchBar } from './IntelSearchBar';
import { IntelActionButtons } from './IntelActionButtons';
import { IntelStatusIndicator } from './IntelStatusIndicator';
import { IntelMetricsDisplay } from './IntelMetricsDisplay';

// Re-export all components as default exports for compatibility
export { default as IntelReportCardDefault } from './IntelReportCard';
export { default as IntelReportListDefault } from './IntelReportList';
export { default as IntelFilterControlsDefault } from './IntelFilterControls';
export { default as IntelSearchBarDefault } from './IntelSearchBar';
export { default as IntelActionButtonsDefault } from './IntelActionButtons';
export { default as IntelStatusIndicatorDefault } from './IntelStatusIndicator';
export { default as IntelMetricsDisplayDefault } from './IntelMetricsDisplay';

/**
 * Component Categories for Easy Import
 */

// Input/Control Components
export const InputComponents = {
  IntelSearchBar,
  IntelFilterControls,
  IntelActionButtons
} as const;

// Display Components  
export const DisplayComponents = {
  IntelReportCard,
  IntelReportList,
  IntelStatusIndicator,
  IntelMetricsDisplay
} as const;

// All Interactive Components
export const InteractiveComponents = {
  ...InputComponents,
  ...DisplayComponents
} as const;

/**
 * Component Type Guards and Utilities
 */

// Type guard for checking if a component is an input component
export const isInputComponent = (componentName: string): boolean => {
  return componentName in InputComponents;
};

// Type guard for checking if a component is a display component
export const isDisplayComponent = (componentName: string): boolean => {
  return componentName in DisplayComponents;
};

// Get all component names
export const getComponentNames = (): string[] => {
  return Object.keys(InteractiveComponents);
};

// Get input component names
export const getInputComponentNames = (): string[] => {
  return Object.keys(InputComponents);
};

// Get display component names
export const getDisplayComponentNames = (): string[] => {
  return Object.keys(DisplayComponents);
};

/**
 * Component Documentation
 */
export const ComponentDocumentation = {
  IntelReportCard: {
    description: 'Individual Intel Report display component with interactive features',
    category: 'Display',
    props: ['report', 'isSelected', 'showDetails', 'interactive', 'onClick', 'onSelect', 'onAction']
  },
  IntelReportList: {
    description: 'Virtualized list component for displaying multiple Intel Reports',
    category: 'Display', 
    props: ['reports', 'loading', 'selectedIds', 'multiSelect', 'virtualized', 'filters', 'onReportClick']
  },
  IntelFilterControls: {
    description: 'Advanced filter interface with category, priority, and search filters',
    category: 'Input',
    props: ['filters', 'availableTags', 'expanded', 'showAdvanced', 'onFiltersChange']
  },
  IntelSearchBar: {
    description: 'Search component with autocomplete suggestions and recent searches',
    category: 'Input',
    props: ['query', 'reports', 'showSuggestions', 'maxSuggestions', 'onQueryChange', 'onSearch']
  },
  IntelActionButtons: {
    description: 'Report action controls with batch operation support',
    category: 'Input',
    props: ['selectedReports', 'report', 'variant', 'actions', 'onAction', 'onBatchActionConfirm']
  },
  IntelStatusIndicator: {
    description: 'Real-time status display for system health and connectivity',
    category: 'Display',
    props: ['connectionStatus', 'syncStatus', 'lastUpdate', 'error', 'showDetails', 'position']
  },
  IntelMetricsDisplay: {
    description: 'Performance and analytics dashboard with real-time metrics',
    category: 'Display',
    props: ['reports', 'performance', 'system', 'variant', 'showMetrics', 'showCharts']
  }
} as const;

export default InteractiveComponents;
