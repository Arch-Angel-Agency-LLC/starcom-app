/**
 * Role Selector Component
 * 
 * Adaptive interface role selection component that allows operators to
 * set their role, experience level, and customize interface complexity.
 */

import React, { useState, useCallback } from 'react';
import { useAdaptiveInterface } from '../../hooks/useAdaptiveInterface';
import styles from './RoleSelector.module.css';
import type { OperatorRole, ExperienceLevel, InterfaceComplexity } from '../../types';

interface RoleSelectorProps {
  onRoleChange?: (role: OperatorRole) => void;
  onExperienceChange?: (level: ExperienceLevel) => void;
  onComplexityChange?: (complexity: InterfaceComplexity) => void;
  showAdvancedOptions?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  onRoleChange,
  onExperienceChange,
  onComplexityChange,
  showAdvancedOptions = false
}) => {
  const {
    operatorProfile,
    setExperienceLevel,
    setInterfaceComplexity,
    updateOperatorProfile
  } = useAdaptiveInterface();

  const [isExpanded, setIsExpanded] = useState(false);

  const roles: { value: OperatorRole; label: string; description: string }[] = [
    {
      value: 'ANALYST',
      label: 'Intelligence Analyst',
      description: 'Data analysis and intelligence assessment'
    },
    {
      value: 'COMMANDER',
      label: 'Commander',
      description: 'Mission planning and coordination'
    },
    {
      value: 'FIELD_OPERATIVE',
      label: 'Field Operative',
      description: 'Real-time operational support'
    },
    {
      value: 'TECHNICAL_SPECIALIST',
      label: 'Technical Specialist',
      description: 'System administration and technical support'
    },
    {
      value: 'INTELLIGENCE_OFFICER',
      label: 'Intelligence Officer',
      description: 'Intelligence fusion and reporting'
    },
    {
      value: 'CYBER_WARRIOR',
      label: 'Cyber Warrior',
      description: 'Cyber operations and defense'
    }
  ];

  const experienceLevels: { value: ExperienceLevel; label: string; description: string }[] = [
    {
      value: 'NOVICE',
      label: 'Novice',
      description: 'New to the system, needs guidance'
    },
    {
      value: 'INTERMEDIATE',
      label: 'Intermediate',
      description: 'Familiar with basic operations'
    },
    {
      value: 'EXPERT',
      label: 'Expert',
      description: 'Proficient with advanced features'
    },
    {
      value: 'MASTER',
      label: 'Master',
      description: 'Expert user, minimal guidance needed'
    }
  ];

  const complexityLevels: { value: InterfaceComplexity; label: string; description: string }[] = [
    {
      value: 'SIMPLIFIED',
      label: 'Simplified',
      description: 'Essential features only, clean interface'
    },
    {
      value: 'STANDARD',
      label: 'Standard',
      description: 'Balanced feature set and usability'
    },
    {
      value: 'ADVANCED',
      label: 'Advanced',
      description: 'Full feature access with shortcuts'
    },
    {
      value: 'EXPERT',
      label: 'Expert',
      description: 'Maximum density, all features visible'
    }
  ];

  // TODO: Add comprehensive authentication error logging and monitoring - PRIORITY: MEDIUM
  const handleRoleChange = useCallback((role: OperatorRole) => {
    updateOperatorProfile({ role });
    onRoleChange?.(role);
  }, [updateOperatorProfile, onRoleChange]);

  const handleExperienceChange = useCallback((level: ExperienceLevel) => {
    setExperienceLevel(level);
    onExperienceChange?.(level);
  }, [setExperienceLevel, onExperienceChange]);

  const handleComplexityChange = useCallback((complexity: InterfaceComplexity) => {
    setInterfaceComplexity(complexity);
    onComplexityChange?.(complexity);
  }, [setInterfaceComplexity, onComplexityChange]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <div className={styles.roleSelector}>
      <div className={styles.header} onClick={toggleExpanded}>
        <div className={styles.currentSelection}>
          <span className={styles.roleIcon}>👤</span>
          <div className={styles.roleInfo}>
            <span className={styles.roleName}>
              {roles.find(r => r.value === operatorProfile.role)?.label || 'Select Role'}
            </span>
            <span className={styles.experienceLevel}>
              {operatorProfile.experienceLevel}
            </span>
          </div>
        </div>
        <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className={styles.selectorPanel}>
          {/* Role Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Operator Role</h3>
            <div className={styles.optionGroup}>
              {roles.map(role => (
                <div
                  key={role.value}
                  className={`${styles.option} ${
                    operatorProfile.role === role.value ? styles.selected : ''
                  }`}
                  onClick={() => handleRoleChange(role.value)}
                >
                  <div className={styles.optionHeader}>
                    <span className={styles.optionLabel}>{role.label}</span>
                    {operatorProfile.role === role.value && (
                      <span className={styles.selectedIcon}>✓</span>
                    )}
                  </div>
                  <span className={styles.optionDescription}>{role.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Level Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Experience Level</h3>
            <div className={styles.optionGroup}>
              {experienceLevels.map(level => (
                <div
                  key={level.value}
                  className={`${styles.option} ${
                    operatorProfile.experienceLevel === level.value ? styles.selected : ''
                  }`}
                  onClick={() => handleExperienceChange(level.value)}
                >
                  <div className={styles.optionHeader}>
                    <span className={styles.optionLabel}>{level.label}</span>
                    {operatorProfile.experienceLevel === level.value && (
                      <span className={styles.selectedIcon}>✓</span>
                    )}
                  </div>
                  <span className={styles.optionDescription}>{level.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interface Complexity Selection */}
          {showAdvancedOptions && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Interface Complexity</h3>
              <div className={styles.optionGroup}>
                {complexityLevels.map(complexity => (
                  <div
                    key={complexity.value}
                    className={`${styles.option} ${
                      operatorProfile.preferredComplexity === complexity.value ? styles.selected : ''
                    }`}
                    onClick={() => handleComplexityChange(complexity.value)}
                  >
                    <div className={styles.optionHeader}>
                      <span className={styles.optionLabel}>{complexity.label}</span>
                      {operatorProfile.preferredComplexity === complexity.value && (
                        <span className={styles.selectedIcon}>✓</span>
                      )}
                    </div>
                    <span className={styles.optionDescription}>{complexity.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Summary */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Profile Summary</h3>
            <div className={styles.profileSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Hours:</span>
                <span className={styles.summaryValue}>{operatorProfile.totalHours}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Specializations:</span>
                <span className={styles.summaryValue}>
                  {operatorProfile.specializations.length}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Training Completed:</span>
                <span className={styles.summaryValue}>
                  {operatorProfile.trainingCompleted.length}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Clearance Level:</span>
                <span className={styles.summaryValue}>
                  {operatorProfile.clearanceLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
