/**
 * Phase 4 Gaming UX Demo Component
 * 
 * Demonstrates all Phase 4 adaptive interface and RTS gaming enhancements.
 * This com          <AIRecommendations maxRecommendations={5} />nt showcases the role-based adaptations, gaming aesthetics,
 * and progressive disclosure features.
 */

import React, { useState } from 'react';
import { useAdaptiveInterface } from '../../hooks/useAdaptiveInterface';
import RoleSelector from '../Adaptive/RoleSelector';
import ProgressiveDisclosure from '../Adaptive/ProgressiveDisclosure';
import AIRecommendations from '../Adaptive/AIRecommendations';
import styles from './Phase4Demo.module.css';
import type { ExperienceLevel, InterfaceComplexity } from '../../types';

interface Phase4DemoProps {
  className?: string;
}

/**
 * Phase 4 Gaming UX Demo
 * 
 * Interactive demonstration of:
 * - Role-based interface adaptation
 * - Experience level customization
 * - Progressive disclosure system
 * - RTS-enhanced gaming UX
 */
export const Phase4Demo: React.FC<Phase4DemoProps> = ({ className }) => {
  const { operatorProfile, setExperienceLevel, setInterfaceComplexity } = useAdaptiveInterface();
  const [activeDemo, setActiveDemo] = useState<'roles' | 'gaming' | 'adaptive' | 'disclosure'>('roles');

  const demoSections = [
    { id: 'roles' as const, label: 'Role Adaptation', icon: '👤' },
    { id: 'gaming' as const, label: 'Gaming UX', icon: '🎮' },
    { id: 'adaptive' as const, label: 'AI Adaptive', icon: '🤖' },
    { id: 'disclosure' as const, label: 'Progressive UI', icon: '📊' }
  ];

  const sampleCommands = [
    { label: 'Initiate Scan', level: 'basic' as const, role: 'ANALYST' as const },
    { label: 'Deploy Countermeasures', level: 'intermediate' as const, role: 'CYBER_WARRIOR' as const },
    { label: 'Coordinate Multi-Agency Op', level: 'expert' as const, role: 'COMMANDER' as const },
    { label: 'Execute Deep Packet Analysis', level: 'expert' as const, role: 'TECHNICAL_SPECIALIST' as const }
  ];

  const handleExperienceChange = (level: ExperienceLevel) => {
    setExperienceLevel(level);
  };

  const handleComplexityChange = (complexity: InterfaceComplexity) => {
    setInterfaceComplexity(complexity);
  };

  const renderRoleDemo = () => (
    <div className={styles.demoSection}>
      <h3 className={styles.sectionTitle}>Role-Based Interface Adaptation</h3>
      <div className={styles.roleGrid}>
        <div className={styles.roleSelector}>
          <RoleSelector
            onExperienceChange={handleExperienceChange}
            onComplexityChange={handleComplexityChange}
            showAdvancedOptions={true}
          />
        </div>
        <div className={styles.rolePreview}>
          <div className={`${styles.previewPanel} holo-panel`}>
            <h4>Current Profile</h4>
            <div className={styles.profileStats}>
              <div className="status-indicator status-indicator--active">
                Role: {operatorProfile.role.replace('_', ' ')}
              </div>
              <div className="status-indicator status-indicator--warning">
                Experience: {operatorProfile.experienceLevel}
              </div>
              <div className="status-indicator">
                Complexity: {operatorProfile.preferredComplexity}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGamingDemo = () => (
    <div className={styles.demoSection}>
      <h3 className={styles.sectionTitle}>RTS Gaming UX Enhancements</h3>
      <div className={styles.gamingGrid}>
        <div className={styles.commandCenter}>
          <h4>Command Center Controls</h4>
          <div className={styles.buttonGrid}>
            {sampleCommands.map((cmd, index) => (
              <button
                key={index}
                className="rts-button"
                data-disclosure-level={cmd.level}
                data-required-role={cmd.role}
                onClick={() => console.log(`Executing: ${cmd.label}`)}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.holographicDisplay}>
          <div className="holo-panel">
            <h4>Holographic Data Display</h4>
            <div className={styles.tacticalGrid}>
              <div className="tactical-grid">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="tactical-cell">
                    <span className="status-indicator status-indicator--active">
                      SECTOR {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdaptiveDemo = () => (
    <div className={styles.demoSection}>
      <h3 className={styles.sectionTitle}>AI-Powered Adaptive Interface</h3>
      <div className={styles.adaptiveGrid}>
        <div className={styles.aiPanel}>
          <AIRecommendations
            onRecommendationApply={(rec) => console.log('Applied:', rec)}
            maxDisplayed={5}
          />
        </div>
        <div className={styles.adaptiveMetrics}>
          <div className="holo-panel">
            <h4>Adaptation Metrics</h4>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Efficiency Score</span>
                <span className={styles.metricValue}>87%</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Learning Rate</span>
                <span className={styles.metricValue}>+12%</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>UI Complexity</span>
                <span className={styles.metricValue}>Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisclosureDemo = () => (
    <div className={styles.demoSection}>
      <h3 className={styles.sectionTitle}>Progressive Disclosure System</h3>
      <div className={styles.disclosureGrid}>
        <div className={styles.disclosureCard}>
          <h4>Advanced Operations Panel</h4>
          <ProgressiveDisclosure
            showProgressIndicators={true}
            compactMode={false}
          />
        </div>
        
        <div className={styles.disclosureCard}>
          <h4>Expert-Only Tools</h4> 
          <ProgressiveDisclosure
            showProgressIndicators={true}
            compactMode={true}
          />
        </div>
      </div>
    </div>
  );

  const renderActiveDemo = () => {
    switch (activeDemo) {
      case 'roles':
        return renderRoleDemo();
      case 'gaming':
        return renderGamingDemo();
      case 'adaptive':
        return renderAdaptiveDemo();
      case 'disclosure':
        return renderDisclosureDemo();
      default:
        return renderRoleDemo();
    }
  };

  return (
    <div className={`${styles.phase4Demo} ${className || ''} holo-panel`}>
      <div className={styles.demoHeader}>
        <h2 className={styles.demoTitle}>Phase 4: Adaptive Gaming UX Demonstration</h2>
        <div className={styles.currentProfile}>
          <span className="status-indicator status-indicator--active">
            {operatorProfile.role.replace('_', ' ')} | {operatorProfile.experienceLevel}
          </span>
        </div>
      </div>

      <div className={styles.demoNav}>
        {demoSections.map((section) => (
          <button
            key={section.id}
            className={`${styles.navButton} ${activeDemo === section.id ? styles.active : ''} rts-button`}
            onClick={() => setActiveDemo(section.id)}
          >
            <span className={styles.navIcon}>{section.icon}</span>
            <span className={styles.navLabel}>{section.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.demoContent}>
        {renderActiveDemo()}
      </div>

      <div className={styles.demoFooter}>
        <div className={styles.phase4Badge}>
          <span className="status-indicator status-indicator--active">PHASE 4 ACTIVE</span>
          <span className={styles.enhancement}>RTS Gaming UX Enhanced</span>
        </div>
      </div>
    </div>
  );
};

export default Phase4Demo;
