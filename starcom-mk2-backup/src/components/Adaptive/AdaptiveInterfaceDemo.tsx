import React, { useState, useEffect } from 'react';
import { useAdaptiveInterface } from '../../hooks/useAdaptiveInterface';
import type { OperatorRole, ExperienceLevel, InterfaceComplexity, SkillProgress } from '../../types';
import styles from './AdaptiveInterfaceDemo.module.css';

/**
 * AdaptiveInterfaceDemo - Comprehensive demonstration of the adaptive interface system
 * showcasing role-based UI, progressive disclosure, and AI-driven recommendations.
 */
const AdaptiveInterfaceDemo: React.FC = () => {
  const {
    operatorProfile,
    aiAdaptation,
    updateOperatorProfile,
    checkFeatureAccess,
    unlockFeature,
    updateSkillProgress,
    getAdaptationRecommendations,
    applyAIRecommendation
  } = useAdaptiveInterface();

  const [selectedDemo, setSelectedDemo] = useState<'role' | 'progression' | 'ai'>('role');
  const [demoMetrics, setDemoMetrics] = useState({
    featuresUnlocked: 0,
    adaptationsApplied: 0,
    timeInInterface: 0
  });

  useEffect(() => {
    // Simulate real-time metrics
    const interval = setInterval(() => {
      setDemoMetrics(prev => ({
        ...prev,
        timeInInterface: prev.timeInInterface + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Demo functions for showcasing adaptive features
  const simulateRoleChange = (newRole: OperatorRole) => {
    updateOperatorProfile({ role: newRole });
    setDemoMetrics(prev => ({ ...prev, adaptationsApplied: prev.adaptationsApplied + 1 }));
  };

  const simulateExperienceGain = () => {
    const currentLevel = operatorProfile.experienceLevel;
    const experienceLevels: ExperienceLevel[] = ['NOVICE', 'INTERMEDIATE', 'EXPERT', 'MASTER'];
    const currentIndex = experienceLevels.indexOf(currentLevel);
    const nextLevel = experienceLevels[Math.min(currentIndex + 1, experienceLevels.length - 1)];
    
    updateOperatorProfile({ experienceLevel: nextLevel });
    setDemoMetrics(prev => ({ ...prev, adaptationsApplied: prev.adaptationsApplied + 1 }));
  };

  const simulateComplexityChange = (complexity: InterfaceComplexity) => {
    updateOperatorProfile({ preferredComplexity: complexity });
    setDemoMetrics(prev => ({ ...prev, adaptationsApplied: prev.adaptationsApplied + 1 }));
  };

  const simulateFeatureUnlock = (featureName: string) => {
    if (checkFeatureAccess(featureName)) {
      unlockFeature(featureName);
      setDemoMetrics(prev => ({ ...prev, featuresUnlocked: prev.featuresUnlocked + 1 }));
    }
  };

  const simulateSkillProgression = (skillName: string) => {
    const skillProgress: SkillProgress = {
      skillId: skillName.toLowerCase().replace(' ', '_'),
      skillName: skillName,
      category: 'General',
      currentLevel: Math.floor(Math.random() * 10),
      maxLevel: 10,
      experience: Math.floor(Math.random() * 100),
      requiredExperience: 100,
      unlockedFeatures: []
    };
    updateSkillProgress(skillProgress);
  };

  const generateAIRecommendations = async () => {
    try {
      const recommendations = getAdaptationRecommendations();
      // Apply first recommendation for demo
      if (recommendations.length > 0) {
        applyAIRecommendation(recommendations[0]);
        setDemoMetrics(prev => ({ ...prev, adaptationsApplied: prev.adaptationsApplied + 1 }));
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
  };

  const roleBasedFeatures = {
    'ANALYST': ['data-visualization', 'analytics-tools', 'report-generation'],
    'COMMANDER': ['strategic-overview', 'team-management', 'mission-planning'],
    'FIELD_OPERATIVE': ['tactical-display', 'communication-tools', 'status-updates'],
    'TECHNICAL_SPECIALIST': ['system-diagnostics', 'configuration-tools', 'debugging'],
    'INTELLIGENCE_OFFICER': ['intel-analysis', 'threat-assessment', 'classified-data'],
    'CYBER_WARRIOR': ['security-tools', 'intrusion-detection', 'cyber-defense']
  };

  return (
    <div className={styles.demoContainer}>
      <div className={styles.header}>
        <h2>Adaptive Interface System - Phase 4 Demo</h2>
        <div className={styles.metrics}>
          <span>Features Unlocked: {demoMetrics.featuresUnlocked}</span>
          <span>Adaptations Applied: {demoMetrics.adaptationsApplied}</span>
          <span>Time: {Math.floor(demoMetrics.timeInInterface / 60)}:{(demoMetrics.timeInInterface % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Demo Navigation */}
      <div className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${selectedDemo === 'role' ? styles.active : ''}`}
          onClick={() => setSelectedDemo('role')}
        >
          Role-Based Adaptation
        </button>
        <button 
          className={`${styles.navButton} ${selectedDemo === 'progression' ? styles.active : ''}`}
          onClick={() => setSelectedDemo('progression')}
        >
          Progressive Disclosure
        </button>
        <button 
          className={`${styles.navButton} ${selectedDemo === 'ai' ? styles.active : ''}`}
          onClick={() => setSelectedDemo('ai')}
        >
          AI-Driven Adaptation
        </button>
      </div>

      {/* Current Profile Display */}
      <div className={styles.profileDisplay}>
        <h3>Current Operator Profile</h3>
        <div className={styles.profileGrid}>
          <div className={styles.profileItem}>
            <label>Role:</label>
            <span className={styles.roleValue}>{operatorProfile.role}</span>
          </div>
          <div className={styles.profileItem}>
            <label>Experience:</label>
            <span className={styles.experienceValue}>{operatorProfile.experienceLevel}</span>
          </div>
          <div className={styles.profileItem}>
            <label>Complexity:</label>
            <span className={styles.complexityValue}>{operatorProfile.preferredComplexity}</span>
          </div>
          <div className={styles.profileItem}>
            <label>Specializations:</label>
            <span className={styles.specializationsValue}>
              {operatorProfile.specializations.join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className={styles.demoContent}>
        {selectedDemo === 'role' && (
          <div className={styles.roleDemo}>
            <h3>Role-Based UI Adaptation</h3>
            <p>Switch between different operator roles to see how the interface adapts:</p>
            
            <div className={styles.roleButtons}>
              {(['ANALYST', 'COMMANDER', 'FIELD_OPERATIVE', 'TECHNICAL_SPECIALIST', 'INTELLIGENCE_OFFICER', 'CYBER_WARRIOR'] as OperatorRole[]).map(role => (
                <button
                  key={role}
                  className={`${styles.roleButton} ${operatorProfile.role === role ? styles.currentRole : ''}`}
                  onClick={() => simulateRoleChange(role)}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className={styles.featuresDisplay}>
              <h4>Available Features for {operatorProfile.role}:</h4>
              <div className={styles.featuresList}>
                {roleBasedFeatures[operatorProfile.role]?.map(feature => (
                  <div key={feature} className={styles.featureItem}>
                    <span className={styles.featureName}>{feature}</span>
                    <span className={`${styles.featureStatus} ${checkFeatureAccess(feature) ? styles.accessible : styles.restricted}`}>
                      {checkFeatureAccess(feature) ? 'Accessible' : 'Restricted'}
                    </span>
                    <button
                      className={styles.unlockButton}
                      onClick={() => simulateFeatureUnlock(feature)}
                      disabled={!checkFeatureAccess(feature)}
                    >
                      Unlock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'progression' && (
          <div className={styles.progressionDemo}>
            <h3>Progressive Disclosure System</h3>
            <p>Experience how features unlock as you gain experience and complete training:</p>

            <div className={styles.progressionControls}>
              <button 
                className={styles.progressionButton}
                onClick={simulateExperienceGain}
              >
                Simulate Experience Gain
              </button>
              
              <div className={styles.complexityControls}>
                <label>Interface Complexity:</label>
                {(['SIMPLIFIED', 'STANDARD', 'ADVANCED', 'EXPERT'] as InterfaceComplexity[]).map(complexity => (
                  <button
                    key={complexity}
                    className={`${styles.complexityButton} ${operatorProfile.preferredComplexity === complexity ? styles.active : ''}`}
                    onClick={() => simulateComplexityChange(complexity)}
                  >
                    {complexity}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.skillsDisplay}>
              <h4>Skill Progression:</h4>
              <div className={styles.skillsList}>
                {['Navigation', 'Data Analysis', 'System Operations', 'Communication'].map(skill => (
                  <div key={skill} className={styles.skillItem}>
                    <span className={styles.skillName}>{skill}</span>
                    <div className={styles.skillProgress}>
                      <div 
                        className={styles.skillBar}
                        style={{ width: `${Math.random() * 100}%` }}
                      />
                    </div>
                    <button
                      className={styles.practiceButton}
                      onClick={() => simulateSkillProgression(skill)}
                    >
                      Practice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'ai' && (
          <div className={styles.aiDemo}>
            <h3>AI-Driven Interface Adaptation</h3>
            <p>See how AI analyzes your usage patterns and suggests interface improvements:</p>

            <div className={styles.aiControls}>
              <button 
                className={styles.generateButton}
                onClick={generateAIRecommendations}
              >
                Generate AI Recommendations
              </button>
            </div>

            <div className={styles.aiRecommendations}>
              <h4>Current AI Recommendations:</h4>
              {aiAdaptation.adaptationRecommendations.length > 0 ? (
                <div className={styles.recommendationsList}>
                  {aiAdaptation.adaptationRecommendations.slice(0, 3).map(rec => (
                    <div key={rec.id} className={styles.recommendationItem}>
                      <div className={styles.recommendationHeader}>
                        <span className={styles.recommendationType}>{rec.type}</span>
                        <span className={`${styles.recommendationPriority} ${styles[rec.impact.toLowerCase()]}`}>
                          {rec.impact}
                        </span>
                      </div>
                      <p className={styles.recommendationDescription}>{rec.description}</p>
                      <div className={styles.recommendationActions}>
                        <button
                          className={styles.applyButton}
                          onClick={() => applyAIRecommendation(rec)}
                        >
                          Apply
                        </button>
                        <span className={styles.confidenceScore}>
                          Confidence: {(rec.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noRecommendations}>No recommendations available. Click "Generate AI Recommendations" to see suggestions.</p>
              )}
            </div>

            <div className={styles.adaptationHistory}>
              <h4>Recent Adaptations:</h4>
              <div className={styles.historyList}>
                {aiAdaptation.adaptationHistory.slice(-5).reverse().map((event, index) => (
                  <div key={index} className={styles.historyItem}>
                    <span className={styles.historyTimestamp}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={styles.historyAction}>{event.type}</span>
                    <span className={styles.historyContext}>{event.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveInterfaceDemo;
