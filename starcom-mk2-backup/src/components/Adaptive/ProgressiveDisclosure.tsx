/**
 * Progressive Disclosure Component
 * 
 * Manages feature unlocking, skill progression, and guided learning
 * for the adaptive interface system.
 */

import React, { useState, useCallback } from 'react';
import { useProgressiveDisclosure } from '../../hooks/useAdaptiveInterface';
import styles from './ProgressiveDisclosure.module.css';
import type { SkillProgress } from '../../types';

interface ProgressiveDisclosureProps {
  showProgressIndicators?: boolean;
  compactMode?: boolean;
}

const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  showProgressIndicators = true,
  compactMode = false
}) => {
  const {
    progressiveDisclosure,
    updateSkillProgress,
    getRecommendedNextSteps
  } = useProgressiveDisclosure();

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showUnlockedFeatures, setShowUnlockedFeatures] = useState(false);

  const handleSkillLevelUp = useCallback((skill: SkillProgress) => {
    const updatedSkill: SkillProgress = {
      ...skill,
      currentLevel: skill.currentLevel + 1,
      experience: skill.experience + 100
    };
    updateSkillProgress(updatedSkill);
  }, [updateSkillProgress]);

  const calculateOverallProgress = useCallback(() => {
    if (progressiveDisclosure.skillProgress.length === 0) return 0;
    
    const totalProgress = progressiveDisclosure.skillProgress.reduce(
      (sum, skill) => sum + (skill.currentLevel / skill.maxLevel),
      0
    );
    
    return Math.round((totalProgress / progressiveDisclosure.skillProgress.length) * 100);
  }, [progressiveDisclosure.skillProgress]);

  const getSkillCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Basic': '#00ff00',
      'Advanced': '#ffff00',
      'Specialized': '#ff8000',
      'Expert': '#ff0080'
    };
    return colors[category] || '#00ffff';
  };

  const getNextUnlockRequirements = useCallback((skill: SkillProgress) => {
    const nextLevel = skill.currentLevel + 1;
    if (nextLevel > skill.maxLevel) return null;
    
    const requiredExperience = nextLevel * 200;
    const remaining = requiredExperience - skill.experience;
    
    return {
      nextLevel,
      requiredExperience,
      remaining
    };
  }, []);

  const recommendedSteps = getRecommendedNextSteps();

  if (compactMode) {
    return (
      <div className={styles.compactDisclosure}>
        <div className={styles.compactHeader}>
          <span className={styles.progressBadge}>
            {calculateOverallProgress()}%
          </span>
          <span className={styles.compactTitle}>Progress</span>
        </div>
        <div className={styles.compactProgressBar}>
          <div 
            className={styles.compactProgressFill}
            style={{ width: `${calculateOverallProgress()}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.progressiveDisclosure}>
      <div className={styles.header}>
        <h3 className={styles.title}>Skill Progression</h3>
        {showProgressIndicators && (
          <div className={styles.overallProgress}>
            <span className={styles.progressLabel}>Overall Progress</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${calculateOverallProgress()}%` }}
              />
              <span className={styles.progressText}>
                {calculateOverallProgress()}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Skills Overview */}
      <div className={styles.skillsSection}>
        <h4 className={styles.sectionTitle}>Skills</h4>
        <div className={styles.skillsGrid}>
          {progressiveDisclosure.skillProgress.map(skill => {
            const nextUnlock = getNextUnlockRequirements(skill);
            const isSelected = selectedSkill === skill.skillId;
            
            return (
              <div
                key={skill.skillId}
                className={`${styles.skillCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelectedSkill(isSelected ? null : skill.skillId)}
                style={{ 
                  borderColor: getSkillCategoryColor(skill.category),
                  boxShadow: isSelected 
                    ? `0 0 15px ${getSkillCategoryColor(skill.category)}40`
                    : 'none'
                }}
              >
                <div className={styles.skillHeader}>
                  <span className={styles.skillName}>{skill.skillName}</span>
                  <span 
                    className={styles.skillLevel}
                    style={{ color: getSkillCategoryColor(skill.category) }}
                  >
                    Lv.{skill.currentLevel}/{skill.maxLevel}
                  </span>
                </div>
                
                <div className={styles.skillProgress}>
                  <div 
                    className={styles.skillProgressBar}
                    style={{ 
                      backgroundColor: `${getSkillCategoryColor(skill.category)}20`
                    }}
                  >
                    <div 
                      className={styles.skillProgressFill}
                      style={{ 
                        width: `${(skill.currentLevel / skill.maxLevel) * 100}%`,
                        backgroundColor: getSkillCategoryColor(skill.category)
                      }}
                    />
                  </div>
                </div>

                <div className={styles.skillCategory}>
                  {skill.category}
                </div>

                {nextUnlock && (
                  <div className={styles.nextUnlock}>
                    <span className={styles.unlockText}>
                      Next: {nextUnlock.remaining} XP to Lv.{nextUnlock.nextLevel}
                    </span>
                  </div>
                )}

                {isSelected && (
                  <div className={styles.skillDetails}>
                    <div className={styles.detailSection}>
                      <span className={styles.detailLabel}>Experience:</span>
                      <span className={styles.detailValue}>
                        {skill.experience} / {skill.requiredExperience}
                      </span>
                    </div>
                    
                    {skill.unlockedFeatures.length > 0 && (
                      <div className={styles.detailSection}>
                        <span className={styles.detailLabel}>Unlocked Features:</span>
                        <div className={styles.featureList}>
                          {skill.unlockedFeatures.map(feature => (
                            <span key={feature} className={styles.featureTag}>
                              {feature.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      className={styles.levelUpButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkillLevelUp(skill);
                      }}
                      disabled={skill.currentLevel >= skill.maxLevel}
                    >
                      {skill.currentLevel >= skill.maxLevel ? 'Maxed' : 'Level Up'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlocked Features */}
      {progressiveDisclosure.unlockedFeatures.length > 0 && (
        <div className={styles.featuresSection}>
          <div 
            className={styles.featuresHeader}
            onClick={() => setShowUnlockedFeatures(!showUnlockedFeatures)}
          >
            <h4 className={styles.sectionTitle}>
              Unlocked Features ({progressiveDisclosure.unlockedFeatures.length})
            </h4>
            <span className={`${styles.expandIcon} ${showUnlockedFeatures ? styles.expanded : ''}`}>
              ▼
            </span>
          </div>
          
          {showUnlockedFeatures && (
            <div className={styles.featuresList}>
              {progressiveDisclosure.unlockedFeatures.map(feature => (
                <div key={feature} className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span className={styles.featureName}>
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Next Steps */}
      {recommendedSteps.length > 0 && (
        <div className={styles.recommendationsSection}>
          <h4 className={styles.sectionTitle}>Recommended Next Steps</h4>
          <div className={styles.recommendationsList}>
            {recommendedSteps.map((step, index) => (
              <div key={index} className={styles.recommendationItem}>
                <span className={styles.recommendationIcon}>💡</span>
                <span className={styles.recommendationText}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tutorials */}
      {progressiveDisclosure.completedTutorials.length > 0 && (
        <div className={styles.tutorialsSection}>
          <h4 className={styles.sectionTitle}>
            Completed Training ({progressiveDisclosure.completedTutorials.length})
          </h4>
          <div className={styles.tutorialsList}>
            {progressiveDisclosure.completedTutorials.map(tutorial => (
              <div key={tutorial} className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>🎓</span>
                <span className={styles.tutorialName}>
                  {tutorial.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Level */}
      <div className={styles.achievementSection}>
        <h4 className={styles.sectionTitle}>Achievement Level</h4>
        <div className={styles.achievementDisplay}>
          <div className={styles.achievementLevel}>
            Level {progressiveDisclosure.achievementLevel}
          </div>
          <div className={styles.achievementProgress}>
            <div className={styles.achievementBar}>
              <div 
                className={styles.achievementFill}
                style={{ width: `${(progressiveDisclosure.achievementLevel % 10) * 10}%` }}
              />
            </div>
            <span className={styles.achievementText}>
              {Math.floor(progressiveDisclosure.achievementLevel / 10)} Tier
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressiveDisclosure;
