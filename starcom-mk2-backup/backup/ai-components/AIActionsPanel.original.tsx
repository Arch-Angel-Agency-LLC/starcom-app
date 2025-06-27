/**
 * AI Actions Panel Component
 * Right sidebar component for AI-suggested actions and recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useGlobalCommand } from '../../hooks/useUnifiedGlobalCommand';
import { useFeatureFlag } from '../../utils/featureFlags';
import { generateMockActionRecommendations } from '../../services/aiService';
import type { ActionType } from '../../types/ai';
import styles from './AIActionsPanel.module.css';

export interface AIActionsPanelProps {
  className?: string;
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
}

export const AIActionsPanel: React.FC<AIActionsPanelProps> = ({
  className = '',
  expanded = false,
  onToggleExpanded
}) => {
  // const { state, dispatch } = useGlobalCommand();
  
  // Temporarily disabled for migration - will be re-enabled with proper types
  const mockActions = [];
  const aiSuggestionsEnabled = useFeatureFlag('aiSuggestionsEnabled');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());

  // Initialize with mock data when feature is enabled
  useEffect(() => {
    if (!aiSuggestionsEnabled) return;

    const initializeActionData = async () => {
      setIsLoading(true);
      try {
        // Mock initialization - in real implementation this would connect to AI service
        const mockActions = generateMockActionRecommendations();
        mockActions.forEach(action => {
          enhancedDispatch({ type: 'ADD_ACTION_RECOMMENDATION', payload: action });
        });
      } catch (error) {
        console.error('Failed to initialize action data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize if we don't have action data yet
    if (enhancedState.aiState.actionRecommendations.length === 0) {
      initializeActionData();
    }
  }, [aiSuggestionsEnabled, enhancedDispatch, enhancedState.aiState.actionRecommendations.length]);

  // Get prioritized actions based on context relevance and confidence
  const prioritizedActions = useMemo(() => {
    return [...enhancedState.aiState.actionRecommendations]
      .sort((a, b) => {
        // Sort by priority, then confidence, then context relevance
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        return b.contextRelevance - a.contextRelevance;
      })
      .slice(0, expanded ? 15 : 6); // Show more when expanded
  }, [enhancedState.aiState.actionRecommendations, expanded]);

  const getActionTypeColor = (actionType: ActionType): string => {
    switch (actionType) {
      case 'INVESTIGATE': return '#44aaff';
      case 'ALERT': return '#ff6644';
      case 'CORRELATE': return '#44ff88';
      case 'ESCALATE': return '#ff4444';
      case 'MONITOR': return '#ffaa44';
      default: return '#888';
    }
  };

  const getActionTypeIcon = (actionType: ActionType): string => {
    switch (actionType) {
      case 'INVESTIGATE': return '🔍';
      case 'ALERT': return '⚠️';
      case 'CORRELATE': return '🔗';
      case 'ESCALATE': return '📈';
      case 'MONITOR': return '👁️';
      default: return '⚡';
    }
  };

  const handleActionClick = (actionId: string) => {
    setSelectedAction(selectedAction === actionId ? null : actionId);
  };

  const handleExecuteAction = async (actionId: string) => {
    setExecutingActions(prev => new Set([...prev, actionId]));
    
    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real implementation, this would trigger the actual action
      console.log('Executing action:', actionId);
      
      // TODO: Call AI service to execute action
      // await aiApiService.executeAction(actionId);
      
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleToggleExpanded = () => {
    const newExpanded = !expanded;
    onToggleExpanded?.(newExpanded);
  };

  if (!aiSuggestionsEnabled) {
    return null;
  }

  return (
    <div className={`${styles.aiActionsPanel} ${className} ${expanded ? styles.expanded : ''}`}>
      {/* Header with controls */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🤖</span>
          <span>AI ACTIONS</span>
          {isLoading && <span className={styles.loadingSpinner}>⟳</span>}
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{prioritizedActions.length}</span>
            <span className={styles.statLabel}>SUGGESTED</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statValue}>{enhancedState.aiState.priorityActions.length}</span>
            <span className={styles.statLabel}>PRIORITY</span>
          </div>
        </div>

        <button 
          className={styles.expandButton}
          onClick={handleToggleExpanded}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '◀' : '▶'}
        </button>
      </div>

      {/* Actions list */}
      <div className={styles.actionsList}>
        {prioritizedActions.map((action) => (
          <div
            key={action.id}
            className={`${styles.actionItem} ${selectedAction === action.id ? styles.selected : ''}`}
            style={{ '--action-color': getActionTypeColor(action.actionType) } as React.CSSProperties}
          >
            <div 
              className={styles.actionHeader}
              onClick={() => handleActionClick(action.id)}
            >
              <div className={styles.actionType}>
                <span className={styles.actionIcon}>
                  {getActionTypeIcon(action.actionType)}
                </span>
                <span className={styles.actionTypeName}>{action.actionType}</span>
              </div>
              
              <div className={styles.actionTitle}>{action.title}</div>
              
              <div className={styles.actionMetrics}>
                <div className={styles.priority} title="Priority">
                  P{action.priority}
                </div>
                <div className={styles.confidence} title="Confidence">
                  {Math.round(action.confidence * 100)}%
                </div>
                <div className={styles.duration} title="Estimated Duration">
                  {formatDuration(action.estimatedDuration)}
                </div>
              </div>
            </div>

            {selectedAction === action.id && (
              <div className={styles.actionDetails}>
                <div className={styles.description}>{action.description}</div>
                
                <div className={styles.contextRelevance}>
                  <strong>Context Relevance:</strong> {Math.round(action.contextRelevance * 100)}%
                </div>

                <div className={styles.impact}>
                  <strong>Expected Impact:</strong>
                  <div className={styles.impactDetails}>
                    <div>Scope: {action.estimatedImpact.scope}</div>
                    <div>Timeline: {action.estimatedImpact.timelineToImpact}h</div>
                    {action.estimatedImpact.affectedContexts.length > 0 && (
                      <div>Contexts: {action.estimatedImpact.affectedContexts.join(', ')}</div>
                    )}
                  </div>
                </div>

                {action.prerequisites.length > 0 && (
                  <div className={styles.prerequisites}>
                    <strong>Prerequisites:</strong>
                    <ul>
                      {action.prerequisites.map((prereq, index) => (
                        <li key={index}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {action.executionSteps.length > 0 && (
                  <div className={styles.steps}>
                    <strong>Execution Steps:</strong>
                    <ol>
                      {action.executionSteps.slice(0, 3).map((step) => (
                        <li key={step.id}>
                          <span className={styles.stepAction}>{step.action}</span>
                          <span className={styles.stepTime}>({step.estimatedTime}m)</span>
                        </li>
                      ))}
                      {action.executionSteps.length > 3 && (
                        <li className={styles.moreSteps}>
                          +{action.executionSteps.length - 3} more steps...
                        </li>
                      )}
                    </ol>
                  </div>
                )}

                <div className={styles.actionControls}>
                  <button
                    className={styles.executeButton}
                    onClick={() => handleExecuteAction(action.id)}
                    disabled={executingActions.has(action.id)}
                  >
                    {executingActions.has(action.id) ? (
                      <>
                        <span className={styles.executeSpinner}>⟳</span>
                        Executing...
                      </>
                    ) : (
                      'Execute Action'
                    )}
                  </button>
                  
                  <button className={styles.detailsButton}>
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {prioritizedActions.length === 0 && !isLoading && (
          <div className={styles.noActions}>
            <span className={styles.noActionsIcon}>💤</span>
            <span>No AI suggestions available</span>
          </div>
        )}
      </div>

      {/* Footer with last update info */}
      <div className={styles.footer}>
        <span className={styles.lastUpdate}>
          Last analyzed: {enhancedState.aiState.lastUpdateTimestamp.toLocaleTimeString()}
        </span>
        <span className={styles.aiStatus}>
          AI Status: {enhancedState.aiState.processingStatus}
        </span>
      </div>
    </div>
  );
};

export default AIActionsPanel;
