/**
 * AI Recommendations Component
 * 
 * Displays AI-driven adaptation recommendations for interface customization,
 * feature unlocking, and workflow optimization.
 */

import React, { useState, useCallback } from 'react';
import { useAIAdaptation } from '../../hooks/useAdaptiveInterface';
import styles from './AIRecommendations.module.css';
import type { AdaptationRecommendation } from '../../types';

interface AIRecommendationsProps {
  onRecommendationApply?: (recommendation: AdaptationRecommendation) => void;
  onRecommendationDismiss?: (recommendationId: string) => void;
  maxDisplayed?: number;
  compactMode?: boolean;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  onRecommendationApply,
  onRecommendationDismiss,
  maxDisplayed = 5,
  compactMode = false
}) => {
  const {
    aiAdaptation,
    applyAIRecommendation,
    getAdaptationRecommendations
  } = useAIAdaptation();

  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);

  const recommendations = getAdaptationRecommendations()
    .filter(rec => !dismissedRecommendations.includes(rec.id))
    .slice(0, maxDisplayed);

  // TODO: Implement social recovery mechanisms for wallet access - PRIORITY: LOW
  const getRecommendationIcon = (type: AdaptationRecommendation['type']): string => {
    const icons = {
      'FEATURE_UNLOCK': '🔓',
      'COMPLEXITY_INCREASE': '⬆️',
      'TOOL_SUGGESTION': '🛠️',
      'TRAINING_RECOMMENDATION': '🎓'
    };
    return icons[type] || '💡';
  };

  const getRecommendationColor = (type: AdaptationRecommendation['type']): string => {
    const colors = {
      'FEATURE_UNLOCK': '#00ff00',
      'COMPLEXITY_INCREASE': '#ffff00',
      'TOOL_SUGGESTION': '#00ffff',
      'TRAINING_RECOMMENDATION': '#ff8000'
    };
    return colors[type] || '#ffffff';
  };

  const getImpactColor = (impact: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
    const colors = {
      'LOW': '#90EE90',
      'MEDIUM': '#FFD700',
      'HIGH': '#FF4500'
    };
    return colors[impact];
  };

  const getEffortColor = (effort: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
    const colors = {
      'LOW': '#90EE90',
      'MEDIUM': '#FFD700',
      'HIGH': '#FF6B6B'
    };
    return colors[effort];
  };

  const handleApplyRecommendation = useCallback((recommendation: AdaptationRecommendation) => {
    applyAIRecommendation(recommendation);
    onRecommendationApply?.(recommendation);
    setDismissedRecommendations(prev => [...prev, recommendation.id]);
  }, [applyAIRecommendation, onRecommendationApply]);

  const handleDismissRecommendation = useCallback((recommendationId: string) => {
    setDismissedRecommendations(prev => [...prev, recommendationId]);
    onRecommendationDismiss?.(recommendationId);
  }, [onRecommendationDismiss]);

  const toggleExpanded = useCallback((recommendationId: string) => {
    setExpandedRecommendation(
      expandedRecommendation === recommendationId ? null : recommendationId
    );
  }, [expandedRecommendation]);

  if (recommendations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🤖</div>
        <div className={styles.emptyText}>
          No AI recommendations at this time
        </div>
        <div className={styles.emptySubtext}>
          Continue using the system to receive personalized suggestions
        </div>
      </div>
    );
  }

  if (compactMode) {
    return (
      <div className={styles.compactRecommendations}>
        <div className={styles.compactHeader}>
          <span className={styles.aiIcon}>🤖</span>
          <span className={styles.compactTitle}>
            AI Suggestions ({recommendations.length})
          </span>
        </div>
        <div className={styles.compactList}>
          {recommendations.slice(0, 3).map(recommendation => (
            <div 
              key={recommendation.id}
              className={styles.compactItem}
              style={{ borderColor: getRecommendationColor(recommendation.type) }}
            >
              <span className={styles.compactIcon}>
                {getRecommendationIcon(recommendation.type)}
              </span>
              <span className={styles.compactItemTitle}>
                {recommendation.title}
              </span>
              <div className={styles.compactActions}>
                <button
                  className={styles.compactApplyButton}
                  onClick={() => handleApplyRecommendation(recommendation)}
                  title="Apply recommendation"
                >
                  ✓
                </button>
                <button
                  className={styles.compactDismissButton}
                  onClick={() => handleDismissRecommendation(recommendation.id)}
                  title="Dismiss recommendation"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.aiRecommendations}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.aiIcon}>🤖</span>
          <h3 className={styles.title}>AI Recommendations</h3>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.adaptationScore}>
            Adaptation Score: {Math.round(aiAdaptation.performanceMetrics.adaptationScore * 100)}%
          </span>
        </div>
      </div>

      <div className={styles.recommendationsList}>
        {recommendations.map(recommendation => {
          const isExpanded = expandedRecommendation === recommendation.id;
          
          return (
            <div 
              key={recommendation.id}
              className={`${styles.recommendationCard} ${isExpanded ? styles.expanded : ''}`}
              style={{ borderLeftColor: getRecommendationColor(recommendation.type) }}
            >
              <div 
                className={styles.recommendationHeader}
                onClick={() => toggleExpanded(recommendation.id)}
              >
                <div className={styles.recommendationLeft}>
                  <span className={styles.recommendationIcon}>
                    {getRecommendationIcon(recommendation.type)}
                  </span>
                  <div className={styles.recommendationInfo}>
                    <span className={styles.recommendationTitle}>
                      {recommendation.title}
                    </span>
                    <span className={styles.recommendationType}>
                      {recommendation.type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
                
                <div className={styles.recommendationRight}>
                  <div className={styles.recommendationMetrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Confidence</span>
                      <span 
                        className={styles.metricValue}
                        style={{ color: `hsl(${recommendation.confidence * 120}, 70%, 60%)` }}
                      >
                        {Math.round(recommendation.confidence * 100)}%
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Impact</span>
                      <span 
                        className={styles.metricValue}
                        style={{ color: getImpactColor(recommendation.impact) }}
                      >
                        {recommendation.impact}
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Effort</span>
                      <span 
                        className={styles.metricValue}
                        style={{ color: getEffortColor(recommendation.effort) }}
                      >
                        {recommendation.effort}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              <div className={styles.recommendationDescription}>
                {recommendation.description}
              </div>

              {isExpanded && (
                <div className={styles.recommendationDetails}>
                  <div className={styles.reasoningSection}>
                    <h4 className={styles.sectionTitle}>AI Reasoning</h4>
                    <ul className={styles.reasoningList}>
                      {recommendation.reasoning.map((reason, index) => (
                        <li key={index} className={styles.reasoningItem}>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.recommendationActions}>
                    <button
                      className={styles.applyButton}
                      onClick={() => handleApplyRecommendation(recommendation)}
                    >
                      Apply Recommendation
                    </button>
                    <button
                      className={styles.dismissButton}
                      onClick={() => handleDismissRecommendation(recommendation.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Insights */}
      <div className={styles.performanceInsights}>
        <h4 className={styles.sectionTitle}>Performance Insights</h4>
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <span className={styles.insightLabel}>Task Completion</span>
            <span className={styles.insightValue}>
              {Math.round(aiAdaptation.performanceMetrics.taskCompletionRate * 100)}%
            </span>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightLabel}>Efficiency Score</span>
            <span className={styles.insightValue}>
              {Math.round(aiAdaptation.performanceMetrics.efficiencyScore * 100)}%
            </span>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightLabel}>Error Rate</span>
            <span className={styles.insightValue}>
              {Math.round(aiAdaptation.performanceMetrics.errorRate * 100)}%
            </span>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightLabel}>Learning Velocity</span>
            <span className={styles.insightValue}>
              {aiAdaptation.userBehaviorProfile.learningVelocity.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
