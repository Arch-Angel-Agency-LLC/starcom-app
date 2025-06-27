/**
 * Adaptive Interface Service
 * 
 * Service for managing role-based interface adaptation, progressive disclosure,
 * and AI-driven UI customization for the Starcom Global Command Interface.
 */

import type {
  OperatorProfile,
  AdaptiveConfiguration,
  ProgressiveDisclosureState,
  AIAdaptationState,
  FeatureConfiguration,
  ToolConfiguration,
  AdaptationRecommendation,
  SkillProgress,
  WorkflowTemplate,
  ContextualHelp,
  InterfaceComplexity,
  OperatorRole,
  UserBehaviorProfile,
  PerformanceMetrics
} from '../types/features/adaptive';

class AdaptiveInterfaceService {
  private static instance: AdaptiveInterfaceService;
  private storageKey = 'starcom_adaptive_interface_state';

  private constructor() {}

  public static getInstance(): AdaptiveInterfaceService {
    if (!AdaptiveInterfaceService.instance) {
      AdaptiveInterfaceService.instance = new AdaptiveInterfaceService();
    }
    return AdaptiveInterfaceService.instance;
  }

  // ============================================================================
  // OPERATOR PROFILE MANAGEMENT
  // ============================================================================

  public createDefaultOperatorProfile(role?: OperatorRole): OperatorProfile {
    return {
      id: `operator_${Date.now()}`,
      name: 'Anonymous Operator',
      role: role || 'ANALYST',
      experienceLevel: 'NOVICE',
      clearanceLevel: 'UNCLASSIFIED',
      specializations: [],
      preferredComplexity: 'SIMPLIFIED',
      customizations: [],
      trainingCompleted: [],
      certifications: [],
      lastActive: new Date(),
      totalHours: 0,
      adaptationPreferences: {
        showTooltips: true,
        enableGuidance: true,
        autoDisclosure: true,
        shortcutsEnabled: false,
        animationsEnabled: true,
        soundEnabled: false,
        highContrast: false,
        reducedMotion: false,
        keyboardNavigation: false
      }
    };
  }

  public calculateRecommendedComplexity(profile: OperatorProfile): InterfaceComplexity {
    let score = 0;

    // Experience level contribution (0-40 points)
    switch (profile.experienceLevel) {
      case 'NOVICE': score += 0; break;
      case 'INTERMEDIATE': score += 15; break;
      case 'EXPERT': score += 30; break;
      case 'MASTER': score += 40; break;
    }

    // Total hours contribution (0-30 points)
    if (profile.totalHours >= 1000) score += 30;
    else if (profile.totalHours >= 500) score += 20;
    else if (profile.totalHours >= 100) score += 10;
    else if (profile.totalHours >= 20) score += 5;

    // Specializations contribution (0-20 points)
    score += Math.min(profile.specializations.length * 5, 20);

    // Training completion contribution (0-10 points)
    score += Math.min(profile.trainingCompleted.length * 2, 10);

    // Determine complexity based on total score
    if (score >= 80) return 'EXPERT';
    if (score >= 60) return 'ADVANCED';
    if (score >= 30) return 'STANDARD';
    return 'SIMPLIFIED';
  }

  // ============================================================================
  // FEATURE ACCESS CONTROL
  // ============================================================================

  public checkFeatureAccess(
    profile: OperatorProfile,
    feature: FeatureConfiguration
  ): { hasAccess: boolean; reason?: string } {
    // Check role requirements
    if (feature.requiredRole && !feature.requiredRole.includes(profile.role)) {
      return {
        hasAccess: false,
        reason: `Requires role: ${feature.requiredRole.join(' or ')}`
      };
    }

    // Check experience requirements
    if (feature.requiredExperience) {
      const experienceLevels = ['NOVICE', 'INTERMEDIATE', 'EXPERT', 'MASTER'];
      const requiredIndex = experienceLevels.indexOf(feature.requiredExperience);
      const currentIndex = experienceLevels.indexOf(profile.experienceLevel);
      
      if (currentIndex < requiredIndex) {
        return {
          hasAccess: false,
          reason: `Requires ${feature.requiredExperience} experience level`
        };
      }
    }

    // Check training requirements
    if (feature.requiredTraining) {
      const missingTraining = feature.requiredTraining.filter(
        training => !profile.trainingCompleted.includes(training)
      );
      
      if (missingTraining.length > 0) {
        return {
          hasAccess: false,
          reason: `Requires training: ${missingTraining.join(', ')}`
        };
      }
    }

    return { hasAccess: true };
  }

  public getAvailableFeatures(
    profile: OperatorProfile,
    allFeatures: FeatureConfiguration[]
  ): FeatureConfiguration[] {
    return allFeatures.filter(feature => {
      const access = this.checkFeatureAccess(profile, feature);
      return access.hasAccess && feature.enabled;
    });
  }

  public getAvailableTools(
    profile: OperatorProfile,
    allTools: ToolConfiguration[]
  ): ToolConfiguration[] {
    return allTools.filter(tool => {
      // Check role requirements
      if (tool.requiredRole && !tool.requiredRole.includes(profile.role)) {
        return false;
      }

      // Check experience requirements
      if (tool.requiredExperience) {
        const experienceLevels = ['NOVICE', 'INTERMEDIATE', 'EXPERT', 'MASTER'];
        const requiredIndex = experienceLevels.indexOf(tool.requiredExperience);
        const currentIndex = experienceLevels.indexOf(profile.experienceLevel);
        
        if (currentIndex < requiredIndex) {
          return false;
        }
      }

      // Check clearance requirements
      if (tool.requiredClearance) {
        const clearanceLevels = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET', 'TS_SCI'];
        const requiredIndex = clearanceLevels.indexOf(tool.requiredClearance);
        const currentIndex = clearanceLevels.indexOf(profile.clearanceLevel);
        
        if (currentIndex < requiredIndex) {
          return false;
        }
      }

      return tool.enabled && tool.visible;
    });
  }

  // ============================================================================
  // PROGRESSIVE DISCLOSURE
  // ============================================================================

  public calculateSkillProgress(
    profile: OperatorProfile,
    userBehavior: UserBehaviorProfile
  ): SkillProgress[] {
    const baseSkills = [
      { id: 'navigation', name: 'Interface Navigation', category: 'Basic' },
      { id: 'visualization', name: 'Data Visualization', category: 'Basic' },
      { id: 'collaboration', name: 'Multi-Agency Collaboration', category: 'Advanced' },
      { id: 'intelligence', name: 'Intelligence Analysis', category: 'Specialized' },
      { id: 'cyber_ops', name: 'Cyber Operations', category: 'Specialized' },
      { id: 'space_ops', name: 'Space Operations', category: 'Specialized' }
    ];

    return baseSkills.map(skill => {
      // Calculate current level based on experience and usage
      let currentLevel = 1;
      let experience = 0;

      // Factor in total hours
      experience += Math.min(profile.totalHours / 10, 500);

      // Factor in specializations
      const relevantSpecs = profile.specializations.filter(spec => 
        skill.category.toLowerCase().includes(spec.category.toLowerCase())
      );
      experience += relevantSpecs.length * 100;

      // Factor in training
      const relevantTraining = profile.trainingCompleted.filter(training =>
        training.toLowerCase().includes(skill.name.toLowerCase())
      );
      experience += relevantTraining.length * 150;

      // Factor in user behavior
      const toolUsage = userBehavior.frequentlyUsedTools.filter((tool: string) =>
        tool.toLowerCase().includes(skill.id)
      ).length;
      experience += toolUsage * 50;

      // Calculate level (max 10)
      currentLevel = Math.min(Math.floor(experience / 200) + 1, 10);

      return {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        currentLevel,
        maxLevel: 10,
        experience: Math.floor(experience),
        requiredExperience: currentLevel * 200,
        unlockedFeatures: this.getSkillUnlockedFeatures(skill.id, currentLevel)
      };
    });
  }

  private getSkillUnlockedFeatures(skillId: string, level: number): string[] {
    const featuresBySkill: Record<string, Record<number, string[]>> = {
      navigation: {
        2: ['keyboard_shortcuts'],
        3: ['custom_layouts'],
        4: ['multi_panel_management'],
        5: ['advanced_filtering']
      },
      visualization: {
        2: ['layer_management'],
        3: ['custom_overlays'],
        4: ['temporal_analysis'],
        5: ['predictive_modeling']
      },
      collaboration: {
        2: ['basic_sharing'],
        3: ['real_time_collaboration'],
        4: ['multi_agency_coordination'],
        5: ['intelligence_marketplace']
      },
      intelligence: {
        2: ['threat_analysis'],
        3: ['pattern_recognition'],
        4: ['predictive_intelligence'],
        5: ['ai_assisted_analysis']
      },
      cyber_ops: {
        2: ['network_monitoring'],
        3: ['threat_hunting'],
        4: ['incident_response'],
        5: ['advanced_defense']
      },
      space_ops: {
        2: ['satellite_tracking'],
        3: ['orbital_analysis'],
        4: ['space_weather_prediction'],
        5: ['debris_tracking']
      }
    };

    const skillFeatures = featuresBySkill[skillId] || {};
    const unlockedFeatures: string[] = [];

    for (let i = 1; i <= level; i++) {
      if (skillFeatures[i]) {
        unlockedFeatures.push(...skillFeatures[i]);
      }
    }

    return unlockedFeatures;
  }

  // ============================================================================
  // AI ADAPTATION RECOMMENDATIONS
  // ============================================================================

  public generateAdaptationRecommendations(
    profile: OperatorProfile,
    userBehavior: UserBehaviorProfile,
    performanceMetrics: PerformanceMetrics
  ): AdaptationRecommendation[] {
    const recommendations: AdaptationRecommendation[] = [];

    // Complexity increase recommendation
    if (this.shouldIncreaseComplexity(profile, performanceMetrics)) {
      recommendations.push({
        id: 'complexity_increase',
        type: 'COMPLEXITY_INCREASE',
        title: 'Increase Interface Complexity',
        description: 'Your performance suggests you\'re ready for more advanced features',
        confidence: 0.85,
        impact: 'MEDIUM',
        effort: 'LOW',
        reasoning: [
          'High task completion rate',
          'Low error rate',
          'Efficient workflow patterns'
        ]
      });
    }

    // Feature unlock recommendations
    const skillProgress = this.calculateSkillProgress(profile, userBehavior);
    skillProgress.forEach(skill => {
      if (skill.currentLevel >= 3 && skill.unlockedFeatures.length > 0) {
        recommendations.push({
          id: `unlock_${skill.skillId}_features`,
          type: 'FEATURE_UNLOCK',
          title: `Unlock ${skill.skillName} Features`,
          description: `You've reached level ${skill.currentLevel} in ${skill.skillName}`,
          confidence: 0.9,
          impact: 'HIGH',
          effort: 'LOW',
          reasoning: [
            `Skill level: ${skill.currentLevel}/10`,
            'Consistent performance in this area',
            'Ready for advanced capabilities'
          ]
        });
      }
    });

    // Training recommendations
    if (profile.trainingCompleted.length < 3) {
      recommendations.push({
        id: 'basic_training',
        type: 'TRAINING_RECOMMENDATION',
        title: 'Complete Basic Training Modules',
        description: 'Enhance your skills with foundational training',
        confidence: 0.95,
        impact: 'HIGH',
        effort: 'MEDIUM',
        reasoning: [
          'Limited training completion',
          'Would unlock additional features',
          'Improve overall proficiency'
        ]
      });
    }

    // Tool suggestions based on usage patterns
    const unusedTools = this.getUnusedButRecommendedTools(profile, userBehavior);
    if (unusedTools.length > 0) {
      recommendations.push({
        id: 'tool_suggestions',
        type: 'TOOL_SUGGESTION',
        title: 'Try New Analysis Tools',
        description: 'These tools might improve your workflow efficiency',
        confidence: 0.7,
        impact: 'MEDIUM',
        effort: 'LOW',
        reasoning: [
          'Based on your current workflow patterns',
          'Used by similar operators',
          'Could increase efficiency'
        ]
      });
    }

    return recommendations.sort((a, b) => 
      (b.confidence * this.getImpactWeight(b.impact)) - 
      (a.confidence * this.getImpactWeight(a.impact))
    );
  }

  private shouldIncreaseComplexity(
    profile: OperatorProfile,
    metrics: PerformanceMetrics
  ): boolean {
    const currentComplexity = profile.preferredComplexity;
    const complexityLevels = ['SIMPLIFIED', 'STANDARD', 'ADVANCED', 'EXPERT'];
    const currentIndex = complexityLevels.indexOf(currentComplexity);
    
    // Don't recommend if already at maximum
    if (currentIndex >= complexityLevels.length - 1) return false;

    // Check performance thresholds
    return (
      metrics.taskCompletionRate > 0.9 &&
      metrics.errorRate < 0.05 &&
      metrics.efficiencyScore > 0.8 &&
      profile.totalHours > 50
    );
  }

  private getUnusedButRecommendedTools(
    profile: OperatorProfile,
    userBehavior: UserBehaviorProfile
  ): string[] {
    const roleBasedTools: Record<string, string[]> = {
      ANALYST: ['threat_analysis', 'pattern_recognition', 'correlation_matrix'],
      COMMANDER: ['mission_planning', 'resource_allocation', 'coordination_hub'],
      FIELD_OPERATIVE: ['real_time_comms', 'situational_awareness', 'quick_actions'],
      TECHNICAL_SPECIALIST: ['system_diagnostics', 'performance_monitoring', 'configuration'],
      INTELLIGENCE_OFFICER: ['intelligence_fusion', 'source_analysis', 'reporting'],
      CYBER_WARRIOR: ['threat_hunting', 'incident_response', 'forensics']
    };

    const recommendedTools = roleBasedTools[profile.role] || [];
    return recommendedTools.filter(tool => 
      !userBehavior.frequentlyUsedTools.includes(tool)
    );
  }

  private getImpactWeight(impact: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (impact) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
    }
  }

  // ============================================================================
  // WORKFLOW TEMPLATES
  // ============================================================================

  public getWorkflowTemplatesForRole(role: OperatorRole): WorkflowTemplate[] {
    const templates: Record<OperatorRole, WorkflowTemplate[]> = {
      ANALYST: [
        {
          id: 'threat_analysis_workflow',
          name: 'Threat Analysis Workflow',
          description: 'Systematic approach to analyzing potential threats',
          role: 'ANALYST',
          steps: [
            {
              id: 'data_collection',
              name: 'Data Collection',
              description: 'Gather relevant intelligence from multiple sources',
              action: { type: 'NAVIGATION', target: 'intelligence_hub' },
              guidance: 'Start by reviewing the latest intelligence feeds'
            },
            {
              id: 'threat_identification',
              name: 'Threat Identification',
              description: 'Identify potential threats in the collected data',
              action: { type: 'ANALYSIS', target: 'threat_detection' },
              guidance: 'Look for patterns and anomalies that might indicate threats'
            },
            {
              id: 'impact_assessment',
              name: 'Impact Assessment',
              description: 'Assess the potential impact of identified threats',
              action: { type: 'ANALYSIS', target: 'impact_analyzer' },
              guidance: 'Consider both immediate and long-term consequences'
            }
          ],
          requiredTools: ['intelligence_hub', 'threat_detection', 'impact_analyzer'],
          estimatedTime: 45,
          difficulty: 'INTERMEDIATE'
        }
      ],
      COMMANDER: [
        {
          id: 'mission_planning_workflow',
          name: 'Mission Planning Workflow',
          description: 'Comprehensive mission planning and coordination',
          role: 'COMMANDER',
          steps: [
            {
              id: 'objective_definition',
              name: 'Define Objectives',
              description: 'Clearly define mission objectives and success criteria',
              action: { type: 'INPUT', target: 'mission_planner' },
              guidance: 'Be specific and measurable with your objectives'
            },
            {
              id: 'resource_allocation',
              name: 'Allocate Resources',
              description: 'Assign personnel and equipment to mission tasks',
              action: { type: 'INTERACTION', target: 'resource_manager' },
              guidance: 'Consider both availability and capability of resources'
            }
          ],
          requiredTools: ['mission_planner', 'resource_manager'],
          estimatedTime: 60,
          difficulty: 'ADVANCED'
        }
      ],
      FIELD_OPERATIVE: [
        {
          id: 'situation_assessment_workflow',
          name: 'Situation Assessment Workflow',
          description: 'Rapid assessment of field conditions',
          role: 'FIELD_OPERATIVE',
          steps: [
            {
              id: 'environment_scan',
              name: 'Environmental Scan',
              description: 'Assess current environmental conditions',
              action: { type: 'ANALYSIS', target: 'environmental_scanner' },
              guidance: 'Look for immediate threats and opportunities'
            }
          ],
          requiredTools: ['environmental_scanner'],
          estimatedTime: 15,
          difficulty: 'BEGINNER'
        }
      ],
      TECHNICAL_SPECIALIST: [
        {
          id: 'system_diagnostics_workflow',
          name: 'System Diagnostics Workflow',
          description: 'Comprehensive system health check and optimization',
          role: 'TECHNICAL_SPECIALIST',
          steps: [
            {
              id: 'performance_check',
              name: 'Performance Check',
              description: 'Analyze system performance metrics',
              action: { type: 'ANALYSIS', target: 'performance_monitor' },
              guidance: 'Focus on CPU, memory, and network utilization'
            }
          ],
          requiredTools: ['performance_monitor'],
          estimatedTime: 30,
          difficulty: 'INTERMEDIATE'
        }
      ],
      INTELLIGENCE_OFFICER: [
        {
          id: 'intelligence_fusion_workflow',
          name: 'Intelligence Fusion Workflow',
          description: 'Combine multiple intelligence sources into actionable insights',
          role: 'INTELLIGENCE_OFFICER',
          steps: [
            {
              id: 'source_verification',
              name: 'Source Verification',
              description: 'Verify the reliability of intelligence sources',
              action: { type: 'ANALYSIS', target: 'source_validator' },
              guidance: 'Check source credibility and historical accuracy'
            }
          ],
          requiredTools: ['source_validator'],
          estimatedTime: 40,
          difficulty: 'ADVANCED'
        }
      ],
      CYBER_WARRIOR: [
        {
          id: 'threat_hunting_workflow',
          name: 'Threat Hunting Workflow',
          description: 'Proactive search for cyber threats in the network',
          role: 'CYBER_WARRIOR',
          steps: [
            {
              id: 'baseline_establishment',
              name: 'Establish Baseline',
              description: 'Understand normal network behavior patterns',
              action: { type: 'ANALYSIS', target: 'network_analyzer' },
              guidance: 'Build a comprehensive picture of normal operations'
            }
          ],
          requiredTools: ['network_analyzer'],
          estimatedTime: 90,
          difficulty: 'EXPERT'
        }
      ]
    };

    return templates[role] || [];
  }

  // ============================================================================
  // CONTEXTUAL HELP
  // ============================================================================

  public getContextualHelp(
    context: string,
    profile: OperatorProfile
  ): ContextualHelp[] {
    // This would typically fetch from a database or configuration
    // For now, return mock contextual help
    const helpItems: ContextualHelp[] = [
      {
        id: 'navigation_help',
        context: 'navigation',
        title: 'Navigation Tips',
        content: 'Use keyboard shortcuts for faster navigation. Press Ctrl+? to see all shortcuts.',
        type: 'TOOLTIP',
        triggers: [{ type: 'HOVER', delay: 1000 }],
        conditions: [{ type: 'EXPERIENCE', value: 'NOVICE', operator: 'EQUALS' }],
        priority: 1
      }
    ];

    return helpItems.filter(help => 
      help.context === context &&
      this.evaluateHelpConditions(help.conditions, profile)
    );
  }

  private evaluateHelpConditions(
    conditions: { type: string; value: string | number | boolean; operator: string }[],
    profile: OperatorProfile
  ): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'ROLE':
          return condition.operator === 'EQUALS' ? 
            profile.role === condition.value : 
            profile.role !== condition.value;
        case 'EXPERIENCE':
          return condition.operator === 'EQUALS' ? 
            profile.experienceLevel === condition.value : 
            profile.experienceLevel !== condition.value;
        default:
          return true;
      }
    });
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  public saveAdaptiveState(state: {
    operatorProfile: OperatorProfile;
    adaptiveConfiguration: AdaptiveConfiguration;
    progressiveDisclosure: ProgressiveDisclosureState;
    aiAdaptation: AIAdaptationState;
  }): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        ...state,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save adaptive interface state:', error);
    }
  }

  public loadAdaptiveState(): {
    operatorProfile: OperatorProfile;
    adaptiveConfiguration: AdaptiveConfiguration;
    progressiveDisclosure: ProgressiveDisclosureState;
    aiAdaptation: AIAdaptationState;
  } | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that the saved state is still valid
        if (parsed.operatorProfile && parsed.adaptiveConfiguration) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load adaptive interface state:', error);
    }
    return null;
  }

  public clearAdaptiveState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear adaptive interface state:', error);
    }
  }
}

export default AdaptiveInterfaceService;
