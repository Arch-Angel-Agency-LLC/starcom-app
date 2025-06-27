import React, { useEffect } from 'react';
import { useAdaptiveInterface } from '../../hooks/useAdaptiveInterface';
import type { OperatorRole, InterfaceComplexity } from '../../types';
import styles from './AdaptiveUIController.module.css';

interface AdaptiveUIControllerProps {
  children: React.ReactNode;
}

interface AdaptiveContextValue {
  shouldShowAdvancedFeatures: () => boolean;
  shouldShowIntermediateFeatures: () => boolean;
  shouldShowBasicFeatures: () => boolean;
  isRoleAuthorized: (requiredRole: OperatorRole) => boolean;
  getFeatureComplexity: (featureName: string) => InterfaceComplexity;
}

/**
 * AdaptiveUIController - Higher-order component that wraps UI elements
 * and dynamically controls their visibility, complexity, and behavior
 * based on the current operator's role, experience level, and AI recommendations.
 */
const AdaptiveUIController: React.FC<AdaptiveUIControllerProps> = ({ children }) => {
  const {
    operatorProfile,
    adaptiveConfiguration
  } = useAdaptiveInterface();

  useEffect(() => {
    // Apply adaptive CSS classes to document root for global UI adaptation
    const root = document.documentElement;
    
    // Role-based styling
    root.setAttribute('data-operator-role', operatorProfile.role);
    root.setAttribute('data-complexity-level', operatorProfile.preferredComplexity);
    root.setAttribute('data-experience-level', operatorProfile.experienceLevel);
    
    // Feature visibility controls
    if (adaptiveConfiguration.guidanceLevel.provideRecommendations) {
      root.setAttribute('data-adaptive-role-ui', 'enabled');
    } else {
      root.removeAttribute('data-adaptive-role-ui');
    }
    
    if (adaptiveConfiguration.guidanceLevel.enableTutorials) {
      root.setAttribute('data-progressive-disclosure', 'enabled');
    } else {
      root.removeAttribute('data-progressive-disclosure');
    }
    
    if (adaptiveConfiguration.contextualHelp.adaptiveHelp) {
      root.setAttribute('data-ai-recommendations', 'enabled');
    } else {
      root.removeAttribute('data-ai-recommendations');
    }

    // Cleanup on unmount
    return () => {
      root.removeAttribute('data-operator-role');
      root.removeAttribute('data-complexity-level');
      root.removeAttribute('data-experience-level');
      root.removeAttribute('data-adaptive-role-ui');
      root.removeAttribute('data-progressive-disclosure');
      root.removeAttribute('data-ai-recommendations');
    };
  }, [operatorProfile, adaptiveConfiguration]);

  // Generate adaptive UI context for child components
  const adaptiveContext: AdaptiveContextValue = {
    shouldShowAdvancedFeatures: () => {
      return operatorProfile.preferredComplexity === 'ADVANCED' ||
             operatorProfile.preferredComplexity === 'EXPERT';
    },
    
    shouldShowIntermediateFeatures: () => {
      return operatorProfile.preferredComplexity !== 'SIMPLIFIED';
    },
    
    shouldShowBasicFeatures: () => {
      return true; // Basic features always shown
    },
    
    isRoleAuthorized: (requiredRole: OperatorRole) => {
      const roleHierarchy: Record<OperatorRole, number> = {
        'FIELD_OPERATIVE': 1,
        'ANALYST': 2,
        'TECHNICAL_SPECIALIST': 2,
        'INTELLIGENCE_OFFICER': 3,
        'CYBER_WARRIOR': 3,
        'COMMANDER': 4
      };
      
      return (roleHierarchy[operatorProfile.role] || 0) >= (roleHierarchy[requiredRole] || 0);
    },
    
    getFeatureComplexity: (featureName: string): InterfaceComplexity => {
      // Return complexity level for specific features
      const featureComplexityMap: Record<string, InterfaceComplexity> = {
        'basic-navigation': 'SIMPLIFIED',
        'data-visualization': 'STANDARD',
        'advanced-analytics': 'ADVANCED',
        'system-administration': 'EXPERT'
      };
      
      return featureComplexityMap[featureName] || 'STANDARD';
    }
  };

  return (
    <div 
      className={styles.adaptiveContainer}
      data-testid="adaptive-ui-controller"
      data-role={operatorProfile.role}
      data-complexity={operatorProfile.preferredComplexity}
      data-experience={operatorProfile.experienceLevel}
    >
      {/* Inject adaptive context into React context if needed */}
      <AdaptiveContextProvider value={adaptiveContext}>
        {children}
      </AdaptiveContextProvider>
      
      {/* Show adaptation status indicator - Hidden for clean human UX, functionality preserved for AI agents */}
      {/* 
      {adaptiveConfiguration.guidanceLevel.showOnboarding && (
        <div className={styles.adaptationIndicator}>
          <div className={styles.indicatorContent}>
            <span className={styles.roleIndicator}>
              {operatorProfile.role}
            </span>
            <span className={styles.complexityIndicator}>
              {operatorProfile.preferredComplexity}
            </span>
            <span className={styles.experienceIndicator}>
              {operatorProfile.experienceLevel}
            </span>
          </div>
        </div>
      )}
      */}
    </div>
  );
};

// Context for providing adaptive utilities to child components
const AdaptiveContext = React.createContext<AdaptiveContextValue | null>(null);

const AdaptiveContextProvider: React.FC<{ 
  value: AdaptiveContextValue; 
  children: React.ReactNode;
}> = ({ value, children }) => (
  <AdaptiveContext.Provider value={value}>
    {children}
  </AdaptiveContext.Provider>
);

export default AdaptiveUIController;
