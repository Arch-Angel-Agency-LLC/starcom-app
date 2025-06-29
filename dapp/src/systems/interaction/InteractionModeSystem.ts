// InteractionModeSystem.ts - Game Development Pattern for 3D Globe Interactions
// Inspired by Unity's Input System and Unreal Engine's Enhanced Input System

// Core interaction modes for the 3D globe
export enum InteractionMode {
  NAVIGATION = 'NAVIGATION',           // Default - rotate, zoom, pan globe
  INTEL_CREATION = 'INTEL_CREATION',   // Click to create intel reports
  INTEL_INSPECTION = 'INTEL_INSPECTION', // Hover/click existing intel models
  MEASUREMENT = 'MEASUREMENT',         // Distance/area measurement tools
  ANNOTATION = 'ANNOTATION',           // Add text/visual annotations
  SIMULATION = 'SIMULATION'            // Interactive scenario simulation
}

// Sub-modes for more granular control
export interface InteractionSubMode {
  mode: InteractionMode;
  subType: string;
  config: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Input configuration for each mode (like Unity's Input Actions)
export interface InputActionConfig {
  name: string;
  primaryInput: string;        // 'mouse', 'touch', 'keyboard'
  modifiers?: string[];        // 'ctrl', 'shift', 'alt'
  threshold?: number;          // For analog inputs
  holdTime?: number;           // For press-and-hold actions
  multiTap?: number;           // For multi-tap gestures
}

// Visual feedback configuration
export interface VisualFeedbackConfig {
  cursor: string;              // CSS cursor style
  overlay?: {
    color: string;
    opacity: number;
    animation?: string;
  };
  highlight?: {
    enabled: boolean;
    color: string;
    intensity: number;
  };
  indicator?: {
    type: 'crosshair' | 'circle' | 'reticle' | 'custom';
    size: number;
    color: string;
  };
}

// Audio feedback (for accessibility and immersion)
export interface AudioFeedbackConfig {
  hover?: string;              // Sound file path
  click?: string;
  error?: string;
  success?: string;
  volume?: number;
}

// Complete mode configuration
export interface ModeConfiguration {
  mode: InteractionMode;
  name: string;
  description: string;
  icon: string;
  hotkey?: string;
  
  // Input handling
  inputs: InputActionConfig[];
  
  // Visual feedback
  visual: VisualFeedbackConfig;
  
  // Audio feedback
  audio?: AudioFeedbackConfig;
  
  // Behavior configuration
  behavior: {
    preventGlobeRotation?: boolean;
    enableHover?: boolean;
    enableMultiSelect?: boolean;
    enableContextMenu?: boolean;
    autoSwitch?: {              // Auto-switch to this mode under conditions
      condition: string;
      duration?: number;
    };
  };
  
  // Validation rules
  validation?: {
    requiredPermissions?: string[];
    minimumClearance?: string;
    disabledInModes?: InteractionMode[];
  };
}

// Default mode configurations (like a game's input mapping presets)
export const DEFAULT_MODE_CONFIGS: Record<InteractionMode, ModeConfiguration> = {
  [InteractionMode.NAVIGATION]: {
    mode: InteractionMode.NAVIGATION,
    name: 'Navigate',
    description: 'Rotate, zoom, and pan the globe',
    icon: '🌐',
    hotkey: 'N',
    inputs: [
      { name: 'rotate', primaryInput: 'mouse', threshold: 2 },
      { name: 'zoom', primaryInput: 'mouse', modifiers: ['wheel'] },
      { name: 'pan', primaryInput: 'mouse', modifiers: ['shift'] }
    ],
    visual: {
      cursor: 'grab',
      highlight: { enabled: false, color: '', intensity: 0 }
    },
    behavior: {
      preventGlobeRotation: false,
      enableHover: false,
      enableMultiSelect: false,
      enableContextMenu: false
    }
  },
  
  [InteractionMode.INTEL_CREATION]: {
    mode: InteractionMode.INTEL_CREATION,
    name: 'Create Intel',
    description: 'Click on globe to create new intelligence reports',
    icon: '📍',
    hotkey: 'I',
    inputs: [
      { name: 'create', primaryInput: 'mouse', threshold: 5, holdTime: 150 },
      { name: 'cancel', primaryInput: 'keyboard', modifiers: ['escape'] }
    ],
    visual: {
      cursor: 'crosshair',
      overlay: { color: '#00ff41', opacity: 0.2, animation: 'pulse' },
      indicator: { type: 'crosshair', size: 20, color: '#00ff41' }
    },
    audio: {
      hover: '/sounds/ui_hover.wav',
      click: '/sounds/ui_create.wav',
      volume: 0.3
    },
    behavior: {
      preventGlobeRotation: true,
      enableHover: true,
      enableMultiSelect: false,
      enableContextMenu: true
    }
  },
  
  [InteractionMode.INTEL_INSPECTION]: {
    mode: InteractionMode.INTEL_INSPECTION,
    name: 'Inspect Intel',
    description: 'Examine and interact with existing intelligence reports',
    icon: '🔍',
    hotkey: 'E',
    inputs: [
      { name: 'inspect', primaryInput: 'mouse', threshold: 3 },
      { name: 'context_menu', primaryInput: 'mouse', modifiers: ['right'] },
      { name: 'multi_select', primaryInput: 'mouse', modifiers: ['ctrl'] }
    ],
    visual: {
      cursor: 'pointer',
      highlight: { enabled: true, color: '#00ff41', intensity: 1.5 }
    },
    audio: {
      hover: '/sounds/ui_hover_intel.wav',
      click: '/sounds/ui_select.wav',
      volume: 0.4
    },
    behavior: {
      preventGlobeRotation: false,
      enableHover: true,
      enableMultiSelect: true,
      enableContextMenu: true
    }
  },
  
  [InteractionMode.MEASUREMENT]: {
    mode: InteractionMode.MEASUREMENT,
    name: 'Measure',
    description: 'Measure distances and areas on the globe',
    icon: '📏',
    hotkey: 'M',
    inputs: [
      { name: 'start_measure', primaryInput: 'mouse', threshold: 3 },
      { name: 'add_point', primaryInput: 'mouse', threshold: 3 },
      { name: 'finish', primaryInput: 'mouse', multiTap: 2 }
    ],
    visual: {
      cursor: 'copy',
      overlay: { color: '#ffaa00', opacity: 0.3 },
      indicator: { type: 'circle', size: 15, color: '#ffaa00' }
    },
    behavior: {
      preventGlobeRotation: true,
      enableHover: true,
      enableMultiSelect: false,
      enableContextMenu: true
    }
  },
  
  [InteractionMode.ANNOTATION]: {
    mode: InteractionMode.ANNOTATION,
    name: 'Annotate',
    description: 'Add text and visual annotations',
    icon: '✏️',
    hotkey: 'A',
    inputs: [
      { name: 'place_annotation', primaryInput: 'mouse', threshold: 3 },
      { name: 'edit_text', primaryInput: 'mouse', multiTap: 2 }
    ],
    visual: {
      cursor: 'text',
      overlay: { color: '#0088ff', opacity: 0.2 },
      indicator: { type: 'reticle', size: 25, color: '#0088ff' }
    },
    behavior: {
      preventGlobeRotation: true,
      enableHover: true,
      enableMultiSelect: true,
      enableContextMenu: true
    }
  },
  
  [InteractionMode.SIMULATION]: {
    mode: InteractionMode.SIMULATION,
    name: 'Simulate',
    description: 'Interactive scenario simulation mode',
    icon: '🎮',
    hotkey: 'S',
    inputs: [
      { name: 'interact', primaryInput: 'mouse', threshold: 5 },
      { name: 'special_action', primaryInput: 'mouse', modifiers: ['ctrl'] }
    ],
    visual: {
      cursor: 'cell',
      overlay: { color: '#ff4400', opacity: 0.25, animation: 'glow' },
      highlight: { enabled: true, color: '#ff4400', intensity: 2.0 }
    },
    behavior: {
      preventGlobeRotation: false,
      enableHover: true,
      enableMultiSelect: true,
      enableContextMenu: true,
      autoSwitch: { condition: 'simulation_active', duration: 5000 }
    }
  }
};

// Mode transition system (like a state machine)
export class InteractionModeManager {
  private currentMode: InteractionMode = InteractionMode.NAVIGATION;
  private modeHistory: InteractionMode[] = [];
  private configurations: Map<InteractionMode, ModeConfiguration> = new Map();
  private listeners: Array<(mode: InteractionMode, prevMode: InteractionMode) => void> = [];
  
  constructor() {
    // Initialize with default configurations
    Object.values(DEFAULT_MODE_CONFIGS).forEach(config => {
      this.configurations.set(config.mode, config);
    });
  }
  
  // Get current mode configuration
  getCurrentConfig(): ModeConfiguration {
    return this.configurations.get(this.currentMode) || DEFAULT_MODE_CONFIGS[InteractionMode.NAVIGATION];
  }
  
  // Switch to a new mode
  switchMode(newMode: InteractionMode, force: boolean = false): boolean {
    const newConfig = this.configurations.get(newMode);
    
    if (!newConfig) {
      console.warn(`Unknown interaction mode: ${newMode}`);
      return false;
    }
    
    // Validation checks
    if (!force && newConfig.validation) {
      if (newConfig.validation.disabledInModes?.includes(this.currentMode)) {
        console.warn(`Cannot switch to ${newMode} from ${this.currentMode}`);
        return false;
      }
    }
    
    const prevMode = this.currentMode;
    this.modeHistory.push(this.currentMode);
    this.currentMode = newMode;
    
    // Notify listeners
    this.listeners.forEach(listener => listener(newMode, prevMode));
    
    console.log(`🎮 Mode switched: ${prevMode} → ${newMode}`);
    return true;
  }
  
  // Return to previous mode
  goBack(): boolean {
    const prevMode = this.modeHistory.pop();
    if (prevMode) {
      return this.switchMode(prevMode, true);
    }
    return false;
  }
  
  // Add mode change listener
  onModeChange(listener: (mode: InteractionMode, prevMode: InteractionMode) => void): void {
    this.listeners.push(listener);
  }
  
  // Check if current mode allows an action
  canPerformAction(action: string): boolean {
    const config = this.getCurrentConfig();
    return config.inputs.some(input => input.name === action);
  }
  
  // Get visual feedback for current mode
  getVisualFeedback(): VisualFeedbackConfig {
    return this.getCurrentConfig().visual;
  }
  
  // Custom mode configuration
  registerMode(config: ModeConfiguration): void {
    this.configurations.set(config.mode, config);
  }
  
  // Get all available modes
  getAvailableModes(): ModeConfiguration[] {
    return Array.from(this.configurations.values());
  }
}

// Singleton instance
export const interactionModeManager = new InteractionModeManager();
