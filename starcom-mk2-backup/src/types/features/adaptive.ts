/**
 * Adaptive Interface System Types
 * 
 * Comprehensive type definitions for role-based interface adaptation,
 * progressive disclosure, and experience-level customization.
 */

// ============================================================================
// OPERATOR PROFILE TYPES
// ============================================================================

export type OperatorRole = 
  | 'ANALYST' 
  | 'COMMANDER' 
  | 'FIELD_OPERATIVE' 
  | 'TECHNICAL_SPECIALIST'
  | 'INTELLIGENCE_OFFICER'
  | 'CYBER_WARRIOR';

export type ExperienceLevel = 
  | 'NOVICE' 
  | 'INTERMEDIATE' 
  | 'EXPERT' 
  | 'MASTER';

export type InterfaceComplexity = 
  | 'SIMPLIFIED' 
  | 'STANDARD' 
  | 'ADVANCED' 
  | 'EXPERT';

export type ClearanceLevel = 
  | 'UNCLASSIFIED'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP_SECRET'
  | 'TS_SCI';

export interface Specialization {
  id: string;
  name: string;
  category: 'CYBER' | 'INTELLIGENCE' | 'OPERATIONS' | 'TECHNICAL';
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface OperatorProfile {
  id: string;
  name: string;
  role: OperatorRole;
  experienceLevel: ExperienceLevel;
  clearanceLevel: ClearanceLevel;
  specializations: Specialization[];
  preferredComplexity: InterfaceComplexity;
  customizations: InterfaceCustomization[];
  trainingCompleted: string[];
  certifications: string[];
  lastActive: Date;
  totalHours: number;
  adaptationPreferences: AdaptationPreferences;
}

// ============================================================================
// INTERFACE ADAPTATION TYPES
// ============================================================================

export interface AdaptationPreferences {
  showTooltips: boolean;
  enableGuidance: boolean;
  autoDisclosure: boolean;
  shortcutsEnabled: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
}

export interface InterfaceCustomization {
  id: string;
  type: 'PANEL_POSITION' | 'SHORTCUT' | 'THEME' | 'LAYOUT' | 'WORKFLOW';
  name: string;
  configuration: Record<string, unknown>;
  createdAt: Date;
}

export interface AdaptiveConfiguration {
  uiComplexity: UIComplexity;
  guidanceLevel: GuidanceLevel;
  availableTools: ToolConfiguration[];
  enabledFeatures: FeatureConfiguration[];
  panelConfigurations: PanelConfiguration[];
  workflowTemplates: WorkflowTemplate[];
  contextualHelp: ContextualHelpConfiguration;
}

export interface UIComplexity {
  level: InterfaceComplexity;
  visiblePanels: string[];
  collapsedSections: string[];
  hiddenFeatures: string[];
  simplifiedControls: boolean;
  reducedDensity: boolean;
}

export interface GuidanceLevel {
  type: 'NONE' | 'TOOLTIPS' | 'CONTEXTUAL' | 'STEP_BY_STEP' | 'FULL_GUIDANCE';
  showOnboarding: boolean;
  highlightNewFeatures: boolean;
  provideRecommendations: boolean;
  enableTutorials: boolean;
}

// ============================================================================
// TOOL AND FEATURE CONFIGURATION
// ============================================================================

export interface ToolConfiguration {
  id: string;
  name: string;
  category: string;
  requiredRole?: OperatorRole[];
  requiredExperience?: ExperienceLevel;
  requiredClearance?: ClearanceLevel;
  enabled: boolean;
  visible: boolean;
  position: 'LEFT' | 'RIGHT' | 'CENTER' | 'BOTTOM' | 'TOP' | 'FLOATING';
  priority: number;
  shortcut?: string;
}

export interface FeatureConfiguration {
  id: string;
  name: string;
  description: string;
  requiredRole?: OperatorRole[];
  requiredExperience?: ExperienceLevel;
  requiredTraining?: string[];
  enabled: boolean;
  discoverable: boolean;
  autoEnable: boolean;
  dependencies: string[];
}

export interface PanelConfiguration {
  id: string;
  name: string;
  position: PanelPosition;
  size: PanelSize;
  collapsed: boolean;
  visible: boolean;
  resizable: boolean;
  movable: boolean;
  adaptiveResize: boolean;
}

export interface PanelPosition {
  zone: 'LEFT' | 'RIGHT' | 'CENTER' | 'BOTTOM' | 'TOP';
  order: number;
  x?: number;
  y?: number;
}

export interface PanelSize {
  width: number | 'auto' | 'fill';
  height: number | 'auto' | 'fill';
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// ============================================================================
// PROGRESSIVE DISCLOSURE TYPES
// ============================================================================

export interface ProgressiveDisclosureState {
  unlockedFeatures: string[];
  availableFeatures: string[];
  recommendedNextSteps: string[];
  completedTutorials: string[];
  skillProgress: SkillProgress[];
  achievementLevel: number;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  maxLevel: number;
  experience: number;
  requiredExperience: number;
  unlockedFeatures: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  role: OperatorRole;
  steps: WorkflowStep[];
  requiredTools: string[];
  estimatedTime: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  action: WorkflowAction;
  guidance?: string;
  shortcuts?: string[];
  validation?: ValidationRule[];
}

export interface WorkflowAction {
  type: 'NAVIGATION' | 'INTERACTION' | 'INPUT' | 'CONFIRMATION' | 'ANALYSIS';
  target: string;
  parameters?: Record<string, unknown>;
}

export interface ValidationRule {
  type: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'CUSTOM';
  message: string;
  validator?: (value: unknown) => boolean;
}

// ============================================================================
// CONTEXTUAL HELP TYPES
// ============================================================================

export interface ContextualHelpConfiguration {
  enableTooltips: boolean;
  enableGuidance: boolean;
  enableTutorials: boolean;
  showKeyboardShortcuts: boolean;
  adaptiveHelp: boolean;
  helpLevel: 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE';
}

export interface ContextualHelp {
  id: string;
  context: string;
  title: string;
  content: string;
  type: 'TOOLTIP' | 'POPOVER' | 'MODAL' | 'SIDEBAR' | 'INLINE';
  triggers: HelpTrigger[];
  conditions: HelpCondition[];
  priority: number;
}

export interface HelpTrigger {
  type: 'HOVER' | 'CLICK' | 'FOCUS' | 'KEYBOARD' | 'TIME' | 'ERROR';
  target?: string;
  delay?: number;
  keyboardShortcut?: string;
}

export interface HelpCondition {
  type: 'ROLE' | 'EXPERIENCE' | 'FEATURE' | 'CONTEXT' | 'CUSTOM';
  value: string | number | boolean;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
}

// ============================================================================
// AI ADAPTATION TYPES
// ============================================================================

export interface AIAdaptationState {
  userBehaviorProfile: UserBehaviorProfile;
  adaptationRecommendations: AdaptationRecommendation[];
  learningProgress: LearningProgress;
  performanceMetrics: PerformanceMetrics;
  adaptationHistory: AdaptationEvent[];
}

export interface UserBehaviorProfile {
  preferredWorkflows: string[];
  frequentlyUsedTools: string[];
  taskCompletionPatterns: TaskPattern[];
  errorPatterns: ErrorPattern[];
  learningVelocity: number;
  adaptationReadiness: number;
}

export interface TaskPattern {
  taskType: string;
  averageTime: number;
  successRate: number;
  commonMistakes: string[];
  improvementSuggestions: string[];
}

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  contexts: string[];
  recommendations: string[];
}

export interface AdaptationRecommendation {
  id: string;
  type: 'FEATURE_UNLOCK' | 'COMPLEXITY_INCREASE' | 'TOOL_SUGGESTION' | 'TRAINING_RECOMMENDATION';
  title: string;
  description: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string[];
}

export interface LearningProgress {
  totalLearningHours: number;
  completedModules: string[];
  currentGoals: LearningGoal[];
  achievements: Achievement[];
  skillGaps: SkillGap[];
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  reward?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  recommendedTraining: string[];
  estimatedTime: number;
}

export interface PerformanceMetrics {
  taskCompletionRate: number;
  averageTaskTime: number;
  errorRate: number;
  efficiencyScore: number;
  collaborationScore: number;
  adaptationScore: number;
  trends: PerformanceTrend[];
}

export interface PerformanceTrend {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export interface AdaptationEvent {
  id: string;
  timestamp: Date;
  type: 'FEATURE_UNLOCK' | 'COMPLEXITY_CHANGE' | 'TOOL_ADDITION' | 'GUIDANCE_ADJUSTMENT';
  description: string;
  userFeedback?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  impactMeasured?: boolean;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface AdaptiveInterfaceState {
  operatorProfile: OperatorProfile;
  adaptiveConfiguration: AdaptiveConfiguration;
  progressiveDisclosure: ProgressiveDisclosureState;
  aiAdaptation: AIAdaptationState;
  contextualHelp: ContextualHelp[];
  isAdaptationEnabled: boolean;
  adaptationMode: 'AUTOMATIC' | 'MANUAL' | 'HYBRID';
  lastAdaptation: Date;
}

export type AdaptiveInterfaceAction =
  | { type: 'SET_OPERATOR_PROFILE'; payload: OperatorProfile }
  | { type: 'UPDATE_EXPERIENCE_LEVEL'; payload: ExperienceLevel }
  | { type: 'SET_INTERFACE_COMPLEXITY'; payload: InterfaceComplexity }
  | { type: 'UPDATE_SPECIALIZATIONS'; payload: Specialization[] }
  | { type: 'UNLOCK_FEATURE'; payload: string }
  | { type: 'COMPLETE_TUTORIAL'; payload: string }
  | { type: 'UPDATE_SKILL_PROGRESS'; payload: SkillProgress }
  | { type: 'ADD_CUSTOMIZATION'; payload: InterfaceCustomization }
  | { type: 'REMOVE_CUSTOMIZATION'; payload: string }
  | { type: 'UPDATE_ADAPTATION_PREFERENCES'; payload: AdaptationPreferences }
  | { type: 'APPLY_AI_RECOMMENDATION'; payload: AdaptationRecommendation }
  | { type: 'RECORD_ADAPTATION_EVENT'; payload: AdaptationEvent }
  | { type: 'TOGGLE_ADAPTATION'; payload: boolean }
  | { type: 'SET_ADAPTATION_MODE'; payload: 'AUTOMATIC' | 'MANUAL' | 'HYBRID' }
  | { type: 'RESET_ADAPTATION_STATE' };

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface UseAdaptiveInterfaceReturn {
  // State
  operatorProfile: OperatorProfile;
  adaptiveConfiguration: AdaptiveConfiguration;
  progressiveDisclosure: ProgressiveDisclosureState;
  aiAdaptation: AIAdaptationState;
  
  // Profile Management
  updateOperatorProfile: (profile: Partial<OperatorProfile>) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setInterfaceComplexity: (complexity: InterfaceComplexity) => void;
  updateSpecializations: (specializations: Specialization[]) => void;
  
  // Feature Management
  unlockFeature: (featureId: string) => void;
  checkFeatureAccess: (featureId: string) => boolean;
  getAvailableFeatures: () => FeatureConfiguration[];
  
  // Progressive Disclosure
  completeTutorial: (tutorialId: string) => void;
  updateSkillProgress: (skillProgress: SkillProgress) => void;
  getRecommendedNextSteps: () => string[];
  
  // Customization
  addCustomization: (customization: InterfaceCustomization) => void;
  removeCustomization: (customizationId: string) => void;
  getCustomizations: () => InterfaceCustomization[];
  
  // AI Adaptation
  applyAIRecommendation: (recommendation: AdaptationRecommendation) => void;
  getAdaptationRecommendations: () => AdaptationRecommendation[];
  recordAdaptationEvent: (event: AdaptationEvent) => void;
  
  // Configuration
  isAdaptationEnabled: boolean;
  toggleAdaptation: () => void;
  setAdaptationMode: (mode: 'AUTOMATIC' | 'MANUAL' | 'HYBRID') => void;
  resetAdaptationState: () => void;
}
